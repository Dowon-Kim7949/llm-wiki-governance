// Which repository state a narrowed drift citation is compared against (2026-10-28).
//
// 1.37.0 narrowed a Markdown section citation by comparing the repository at the
// end of the review day (`git rev-list -1 --before=<day> 23:59:59 HEAD`) with HEAD,
// and claimed that when this snapshot is wrong it "can only flag a document, not
// hide one". Reproduced false: the date walk can return a side-branch commit dated
// the review day but merged after the review, a commit made later the same day, or
// a commit made after the review with an older committer date. The cited section
// then reads the same on both sides and the citation is narrowed away, although
// the file-level check (triggered by an unrelated later edit) would have reported
// the document. Line ranges, narrowed with `git log -L --since` since before
// 1.37.0, hid the same changes.
//
// A citation is now narrowed away only when the commit that wrote the document's
// current review stamp agrees too. These tests pin the hidden cases, the cases that
// must still narrow, and every fallback. Commit times sit between 06:00 and 18:00
// UTC so the review-day boundary, which git reads in the local time zone, falls on
// the same side for any runner within about ten hours of UTC.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { scanEvidenceDriftDetailed } from "../src/commands/scans.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const GUIDE = [
  "# Manual",
  "",
  "## Usage",
  "",
  "Call the tool.",
  "",
  "## Troubleshooting",
  "",
  "Restart.",
  ""
].join("\n");

// Line 5 of GUIDE is "Call the tool.", the body of ## Usage.
const SECTION = "docs/guide.md#section:Usage";
const LINE = "docs/guide.md#L5-L5";
const DOC = "docs/llm-wiki/api.md";

const wikiDoc = (reviewedAt, evidence) => [
  "---", "title: api", "tags:", "  - llm-wiki", "  - verified", "status: verified",
  "doc_type: public_api", "project: baseline", `last_updated: ${reviewedAt}`,
  "author: cli-generated", "last_edited_by: t", "reviewed_by: t", `reviewed_at: ${reviewedAt}`,
  "wiki_block_version: v1", "source_files:", "  - package.json",
  "evidence:", ...evidence.map((entry) => `  - ${entry}`),
  "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
  "contains_sensitive_info: false", "---", "", "# api", "", "Body.", ""
].join("\n");

// `git log --since` and `rev-list --before` read the COMMITTER date; `author` lets a
// test give the author date a different value.
async function repo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-drift-baseline-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), "{}\n", { encoding: "utf8" });
  await writeFile(path.join(cwd, "docs", "guide.md"), GUIDE, { encoding: "utf8" });
  const git = (args, at, author) => execFileSync("git", [
    "-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@e", "-c", "core.autocrlf=false", ...args
  ], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: { ...process.env, ...(at ? { GIT_AUTHOR_DATE: author ?? at, GIT_COMMITTER_DATE: at } : {}) }
  });
  git(["init", "-q"]);
  git(["checkout", "-q", "-b", "main"]);
  const commit = (message, at, author) => {
    git(["add", "-A"]);
    git(["commit", "-q", "-m", message], at, author);
  };
  const edit = async (rel, from, to) => {
    const file = path.join(cwd, ...rel.split("/"));
    const before = await readFile(file, "utf8");
    assert.ok(before.includes(from), `fixture: ${rel} must contain ${JSON.stringify(from)}`);
    await writeFile(file, before.replace(from, to), { encoding: "utf8" });
  };
  const review = async (evidence, at = "2026-02-01T06:00:00+0000") => {
    await writeFile(path.join(cwd, ...DOC.split("/")), wikiDoc("2026-02-01", evidence), { encoding: "utf8" });
    commit("review", at);
  };
  const changeCited = () => edit("docs/guide.md", "Call the tool.", "Call the tool twice.");
  const changeUnrelated = () => edit("docs/guide.md", "Restart.", "Restart, then retry.");
  return { cwd, git, commit, edit, review, changeCited, changeUnrelated };
}

async function verdict(cwd) {
  const { findings, locatorNarrowed } = await scanEvidenceDriftDetailed(cwd, {});
  // Only the guide citation: the document also cites package.json, which drifts in
  // fixtures whose first commit postdates the review.
  const finding = findings.find((entry) => entry.path === DOC && entry.params.reference.startsWith("docs/guide.md"));
  return {
    reference: finding?.params.reference ?? null,
    narrowed: locatorNarrowed.filter((entry) => entry.path === DOC).length > 0
  };
}

// Init, review on main, a branch from init that changes the cited text on the
// review day, merged after the review, then an edit elsewhere in the file.
async function lateMerge(evidence, branchAt) {
  const r = await repo();
  r.commit("init", "2026-01-01T12:00:00+0000");
  await r.review(evidence);
  r.git(["checkout", "-q", "-b", "feature", "HEAD~1"]);
  await r.changeCited();
  r.commit("feature: change the cited text", branchAt);
  r.git(["checkout", "-q", "main"]);
  r.git(["merge", "-q", "--no-ff", "-m", "merge feature", "feature"], "2026-03-01T12:00:00+0000");
  return r;
}

test("late merge: a branch commit dated the review day and merged after it is not narrowed away", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  for (const [evidence, expected] of [[SECTION, SECTION], [LINE, LINE]]) {
    const r = await lateMerge([evidence], "2026-02-01T08:00:00+0000");
    await r.changeUnrelated();
    r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
    // Before 2026-10-28 both read { reference: null, narrowed: true }.
    assert.deepEqual(await verdict(r.cwd), { reference: expected, narrowed: false }, evidence);
  }
});

test("late merge: the same history with the branch commit older than the review was already reported", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // The date walk picked the review commit here, so the result depended on commit
  // order alone; both orders now give the same answer.
  const r = await repo();
  r.commit("init", "2026-01-01T12:00:00+0000");
  r.git(["checkout", "-q", "-b", "feature"]);
  await r.changeCited();
  r.commit("feature: change the cited text", "2026-01-20T12:00:00+0000");
  r.git(["checkout", "-q", "main"]);
  await r.review([SECTION]);
  r.git(["merge", "-q", "--no-ff", "-m", "merge feature", "feature"], "2026-03-01T12:00:00+0000");
  await r.changeUnrelated();
  r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
  assert.deepEqual(await verdict(r.cwd), { reference: SECTION, narrowed: false });
});

test("late merge with no later edit stays unreported: the file-level limit N-15, unchanged", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // `git log --since` follows the merge's TREESAME parent and the branch commit is
  // dated before the review, so no check runs at all. Recorded as GAP 5 in
  // tests/known-gaps.test.js; narrowing does not change it in either direction.
  const r = await lateMerge([SECTION], "2026-02-01T08:00:00+0000");
  assert.deepEqual(await verdict(r.cwd), { reference: null, narrowed: false });
});

test("same review day: a change committed after the review commit is reported once the file drifts", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  for (const evidence of [SECTION, LINE]) {
    const r = await repo();
    r.commit("init", "2026-01-01T12:00:00+0000");
    await r.review([evidence]);
    await r.changeCited();
    r.commit("same day, after the review", "2026-02-01T10:00:00+0000");
    await r.changeUnrelated();
    r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
    assert.deepEqual(await verdict(r.cwd), { reference: evidence, narrowed: false }, evidence);
  }
});

test("same review day: a change committed before the review commit is what the reviewer saw, and still narrows", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const r = await repo();
  r.commit("init", "2026-01-01T12:00:00+0000");
  await r.changeCited();
  r.commit("same day, before the review", "2026-02-01T06:00:00+0000");
  await r.review([SECTION], "2026-02-01T10:00:00+0000");
  await r.changeUnrelated();
  r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
  assert.deepEqual(await verdict(r.cwd), { reference: null, narrowed: true });
});

test("author and committer dates: a commit after the review with an older committer date is reported", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // What a rebase that keeps committer dates produces. Its author date is after the
  // review, which git's date checks do not read.
  for (const evidence of [SECTION, LINE]) {
    const r = await repo();
    r.commit("init", "2026-01-01T12:00:00+0000");
    await r.review([evidence]);
    await r.changeCited();
    r.commit("after the review, committer date older", "2026-01-20T12:00:00+0000", "2026-02-10T12:00:00+0000");
    await r.changeUnrelated();
    r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
    assert.deepEqual(await verdict(r.cwd), { reference: evidence, narrowed: false }, evidence);
  }
});

test("author and committer dates: an old author date with a new committer date is reported by the date check", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const r = await repo();
  r.commit("init", "2026-01-01T12:00:00+0000");
  await r.review([SECTION]);
  await r.changeCited();
  r.commit("cherry-picked after the review", "2026-02-10T12:00:00+0000", "2026-01-15T12:00:00+0000");
  assert.deepEqual(await verdict(r.cwd), { reference: SECTION, narrowed: false });
});

test("squash and rebase merges of a branch reviewed before merging are over-reported, as before", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // The review stamp was written on a branch whose commits do not survive the
  // merge, so the review-day snapshot on HEAD's history predates the change the
  // reviewer approved. This is the over-report direction and is unchanged; it is
  // pinned so a future change to it is deliberate.
  for (const mode of ["squash", "rebase"]) {
    const r = await repo();
    r.commit("init", "2026-01-01T12:00:00+0000");
    r.git(["checkout", "-q", "-b", "feature"]);
    await r.changeCited();
    r.commit("feature: change the cited text", "2026-02-01T06:00:00+0000");
    await r.review([SECTION], "2026-02-01T08:00:00+0000");
    r.git(["checkout", "-q", "main"]);
    if (mode === "squash") {
      r.git(["merge", "-q", "--squash", "feature"]);
      r.commit("squash feature", "2026-02-03T12:00:00+0000");
    } else {
      r.git(["cherry-pick", "feature~1", "feature"], "2026-02-03T12:00:00+0000");
    }
    assert.deepEqual(await verdict(r.cwd), { reference: SECTION, narrowed: false }, mode);
  }
});

test("an edit outside the cited region still narrows when both baselines agree", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  for (const evidence of [SECTION, LINE]) {
    const r = await repo();
    r.commit("init", "2026-01-01T12:00:00+0000");
    await r.review([evidence]);
    await r.changeUnrelated();
    r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
    assert.deepEqual(await verdict(r.cwd), { reference: null, narrowed: true }, evidence);
  }
});

test("a review stamp that is not committed falls back to the file-level check", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // Re-stamped in the working tree only: no commit carries the value the scan reads,
  // so there is no commit to compare against, and nothing is narrowed.
  const r = await repo();
  r.commit("init", "2026-01-01T12:00:00+0000");
  await r.review([SECTION]);
  await r.changeUnrelated();
  r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
  const docFile = path.join(r.cwd, ...DOC.split("/"));
  const text = await readFile(docFile, "utf8");
  await writeFile(docFile, text.replace("reviewed_at: 2026-02-01", "reviewed_at: 2026-02-02"), { encoding: "utf8" });
  assert.deepEqual(await verdict(r.cwd), { reference: "docs/guide.md", narrowed: false });
});

test("no commit on or before the review day falls back to the file-level check", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // reviewed_at earlier than the whole history: no review-day snapshot exists.
  const r = await repo();
  await writeFile(path.join(r.cwd, ...DOC.split("/")), wikiDoc("2026-02-01", [SECTION]), { encoding: "utf8" });
  r.commit("init with the review", "2026-03-01T12:00:00+0000");
  await r.changeUnrelated();
  r.commit("unrelated edit", "2026-03-02T12:00:00+0000");
  assert.deepEqual(await verdict(r.cwd), { reference: "docs/guide.md", narrowed: false });
});

test("a cited section deleted, or duplicated at the review commit, falls back to the file-level check", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const deleted = await repo();
  deleted.commit("init", "2026-01-01T12:00:00+0000");
  await deleted.review([SECTION]);
  await deleted.edit("docs/guide.md", "## Usage\n\nCall the tool.\n\n", "");
  deleted.commit("delete the section", "2026-03-02T12:00:00+0000");
  assert.deepEqual(await verdict(deleted.cwd), { reference: "docs/guide.md", narrowed: false });

  // Two headings containing "Usage" at the review commit, one by the end of that
  // day: the review-day snapshot and HEAD agree, but the region cannot be pinned
  // down at the review commit, so the citation is not narrowed.
  const duplicated = await repo();
  await duplicated.edit("docs/guide.md", "## Troubleshooting", "## Usage notes");
  duplicated.commit("init", "2026-01-01T12:00:00+0000");
  await duplicated.review([SECTION]);
  await duplicated.edit("docs/guide.md", "## Usage notes", "## Troubleshooting");
  duplicated.commit("rename the second heading", "2026-02-01T10:00:00+0000");
  await duplicated.changeUnrelated();
  duplicated.commit("unrelated edit", "2026-03-02T12:00:00+0000");
  assert.deepEqual(await verdict(duplicated.cwd), { reference: "docs/guide.md", narrowed: false });
});
