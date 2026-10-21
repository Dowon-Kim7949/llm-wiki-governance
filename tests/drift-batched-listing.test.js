// The drift scan used to spawn one `git log -- <anchor>` per (anchor, baseline):
// 72 spawns, ~90% of a 4 s validate on this repository. It now lists every path
// changed after each baseline once and asks the per-file query only for anchors
// in that list. That is a performance change that must not move a single finding,
// so every case below compares the scan against the per-file query itself — the
// thing the old code called for every anchor — rather than against hand-written
// expectations alone. The cases are the ways a one-shot listing can come out
// SMALLER than what the per-file query sees, which would turn a stale document
// into a silent pass.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { scanEvidenceDrift } from "../src/commands/scans.js";
import { fileChangedSince, pathsChangedSince } from "../src/git.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const BASELINE = "2026-02-01";
const BEFORE = "2026-01-01T00:00:00+0000";
const AFTER = "2026-03-01T00:00:00+0000";

// `--since` filters on the COMMITTER date, so both dates are set (see
// anchor-semantics.test.js for the failure this avoids).
function gitIn(cwd) {
  return (args, at) => execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@e",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@e",
      ...(at ? { GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at } : {})
    }
  });
}

const commitArgs = (message) => ["-c", "commit.gpgsign=false", "commit", "-q", "-m", message];

function wikiDoc(dir, name, anchors) {
  return writeFile(
    path.join(dir, "docs", "llm-wiki", `${name}.md`),
    [
      "---", `title: ${name}`, "tags:", "  - llm-wiki", "  - verified", "status: verified",
      "doc_type: public_api", "project: batched", `last_updated: ${BASELINE}`,
      "author: cli-generated", "last_edited_by: t", "reviewed_by: t", `reviewed_at: ${BASELINE}`,
      "wiki_block_version: v1", "source_files:", ...anchors.map((a) => `  - ${a}`),
      "evidence:", ...anchors.map((a) => `  - ${a}`),
      "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
      "contains_sensitive_info: false", "---", "", `# ${name}`, "", "Body.", ""
    ].join("\n"),
    { encoding: "utf8" }
  );
}

// One document per anchor, so each finding names exactly one anchor.
const CASES = {
  changed: "src/changed.js",
  unchanged: "src/unchanged.js",
  dir_changed: "src/dir",
  dir_moved_out: "src/leaving",
  merged_side_branch: "src/side.js",
  merged_late: "src/late.js",
  evil_merge: "src/resolved.js",
  non_ascii: "src/한글.js",
  untouched_dir: "src/quiet"
};

async function buildRepo() {
  const root = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-batched-"));
  const pkg = path.join(root, "pkg");
  const git = gitIn(root);
  for (const dir of ["src", "src/dir", "src/leaving", "src/quiet", "elsewhere"]) {
    await mkdir(path.join(pkg, dir), { recursive: true });
  }
  await mkdir(path.join(pkg, "docs", "llm-wiki"), { recursive: true });
  const files = ["src/changed.js", "src/unchanged.js", "src/dir/a.js", "src/leaving/b.js", "src/side.js", "src/late.js", "src/resolved.js", "src/한글.js", "src/quiet/c.js"];
  for (const rel of files) await writeFile(path.join(pkg, rel), "export const v = 1;\n", { encoding: "utf8" });
  for (const [name, anchor] of Object.entries(CASES)) await wikiDoc(pkg, name, [anchor]);

  git(["init", "-q", "-b", "main"]);
  git(["add", "-A"]);
  git(commitArgs("init"), BEFORE);

  // A long-lived branch: its commit predates the baseline and lands on main only
  // through a merge made after it. The per-file query does NOT report this —
  // history simplification follows the parent the merge is TREESAME to and drops
  // the merge — so neither does the scan. That is a pre-existing false negative,
  // pinned here as preserved behavior: this change must not move findings either
  // way, and fixing it is a separate, behavior-changing decision.
  git(["switch", "-q", "-c", "late"]);
  await writeFile(path.join(pkg, "src", "late.js"), "export const v = 2;\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(commitArgs("old branch edit"), BEFORE);
  git(["switch", "-q", "main"]);

  // After the baseline: a plain edit, an edit under a directory, and a file that
  // moves OUT of an anchored directory (rename detection would list only the new
  // path, so the old directory would look untouched).
  await writeFile(path.join(pkg, "src", "changed.js"), "export const v = 2;\n", { encoding: "utf8" });
  await writeFile(path.join(pkg, "src", "dir", "a.js"), "export const v = 2;\n", { encoding: "utf8" });
  await rename(path.join(pkg, "src", "leaving", "b.js"), path.join(pkg, "elsewhere", "b.js"));
  await writeFile(path.join(pkg, "src", "한글.js"), "export const v = 2;\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(commitArgs("edits"), AFTER);

  // A change that reaches main only through a merge commit.
  git(["switch", "-q", "-c", "side"]);
  await writeFile(path.join(pkg, "src", "side.js"), "export const v = 2;\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(commitArgs("side edit"), AFTER);
  git(["switch", "-q", "main"]);
  await writeFile(path.join(pkg, "src", "unchanged.js"), "export const v = 1;\n", { encoding: "utf8" });
  git(["-c", "commit.gpgsign=false", "merge", "-q", "--no-ff", "-m", "merge side", "side"], AFTER);
  git(["-c", "commit.gpgsign=false", "merge", "-q", "--no-ff", "-m", "merge late", "late"], AFTER);

  // An edit that exists ONLY in a merge commit (a conflict resolution, or an
  // "evil merge"). The merge differs from both parents for that path, so the
  // per-file query reports it, and only a listing with merge diffs can see it.
  git(["switch", "-q", "-c", "evil"]);
  await writeFile(path.join(pkg, "elsewhere", "branch.js"), "export const v = 1;\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(commitArgs("branch work"), AFTER);
  git(["switch", "-q", "main"]);
  git(["-c", "commit.gpgsign=false", "merge", "-q", "--no-ff", "--no-commit", "evil"], AFTER);
  await writeFile(path.join(pkg, "src", "resolved.js"), "export const v = 2; // only in the merge\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(commitArgs("merge evil"), AFTER);

  // A config that would make the listing relative to cwd and drop everything
  // outside it, if the listing did not pin --no-relative.
  git(["config", "diff.relative", "true"]);
  return { root, pkg };
}

function flagged(findings) {
  return new Set(findings.map((finding) => path.posix.basename(finding.path, ".md")));
}

test("batched drift listing: every finding equals the per-file query it replaced", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { pkg } = await buildRepo();

  const actual = flagged(await scanEvidenceDrift(pkg, {}));
  const oracle = new Set(
    Object.entries(CASES).filter(([, anchor]) => fileChangedSince(pkg, anchor, BASELINE)).map(([name]) => name)
  );

  assert.deepEqual([...actual].sort(), [...oracle].sort(), "the scan must flag exactly what the per-file query flags");
  // And the oracle is not vacuous: each tricky case is one it really flags.
  for (const name of ["changed", "dir_changed", "dir_moved_out", "merged_side_branch", "evil_merge", "non_ascii"]) {
    assert.ok(actual.has(name), `${name} must be flagged`);
  }
  for (const name of ["unchanged", "untouched_dir", "merged_late"]) {
    assert.ok(!actual.has(name), `${name} must not be flagged`);
  }
});

test("pathsChangedSince is a superset of what the per-file query reports", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { pkg } = await buildRepo();
  const listing = pathsChangedSince(pkg, BASELINE);

  assert.equal(listing.prefix, "pkg/", "anchors are cwd-relative, the listing is root-relative");
  for (const [name, anchor] of Object.entries(CASES)) {
    if (!fileChangedSince(pkg, anchor, BASELINE)) continue;
    const full = `${listing.prefix}${anchor}`;
    const present = listing.paths.has(full) || [...listing.paths].some((p) => p.startsWith(`${full}/`));
    assert.ok(present, `${name}: the per-file query sees a change the listing does not`);
  }
  assert.ok(![...listing.paths].some((p) => p.startsWith("pkg/src/quiet/")), "an untouched directory stays out of the listing");
});

test("a root commit after the baseline is listed even when log.showRoot is off", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-batched-root-"));
  const git = gitIn(cwd);
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "src", "first.js"), "export const v = 1;\n", { encoding: "utf8" });
  await wikiDoc(cwd, "rooted", ["src/first.js"]);
  git(["init", "-q", "-b", "main"]);
  git(["config", "log.showRoot", "false"]);
  git(["add", "-A"]);
  git(commitArgs("root"), AFTER);

  const actual = flagged(await scanEvidenceDrift(cwd, {}));
  assert.equal(fileChangedSince(cwd, "src/first.js", BASELINE), true, "guard: the per-file query sees the root commit");
  assert.ok(actual.has("rooted"), "and so must the scan");
});

test("an anchor the listing cannot judge exactly still gets the per-file answer", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { root, pkg } = await buildRepo();
  // A dynamic-route file name (Nuxt/Next `[id].vue`) is a real path that git
  // nonetheless reads as a glob pathspec, so the filter must hand it to the
  // per-file query rather than judge it by string match.
  const git = gitIn(root);
  await writeFile(path.join(pkg, "src", "[id].vue"), "<template/>\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(commitArgs("add route"), BEFORE);
  await writeFile(path.join(pkg, "src", "[id].vue"), "<template><p/></template>\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(commitArgs("edit route"), AFTER);
  await wikiDoc(pkg, "routed", ["src/[id].vue"]);

  const actual = flagged(await scanEvidenceDrift(pkg, {}));
  assert.equal(fileChangedSince(pkg, "src/[id].vue", BASELINE), true, "guard: the per-file query sees the edit");
  assert.ok(actual.has("routed"), "and so must the scan");
});
