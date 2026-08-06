// N-14 (roadmap item 46), decided 2026-08-06: the freshness gates flagged
// documents that `review` structurally cannot re-stamp.
//
// Two enumerators disagreed. `review` loads content docs through
// listWikiContentDocs, which excludes `/templates/`; `validate`, `drift`, and
// `impact` walk listTargetMarkdown, which is all of `docs/llm-wiki`. So a
// verified template could be reported as stale with NO way to clear it: the
// documented remedy (downgrade, then `review --approve-all --yes`) hands the
// document back unchanged, `--approve-all` skips it while reporting
// `needs_review_remaining: 0`, and naming it explicitly answered "not found
// under docs/llm-wiki" about a file that is plainly there.
//
// The fix takes the boundary that already existed and makes everything agree
// with it: templates are skeletons an adopter copies, so they are not review
// targets and not freshness targets either. The refusal now states the scope
// instead of denying the file exists.
//
// These are behaviour tests through the real commands on real git fixtures,
// because the defect was never in a predicate — it was in which enumerator each
// command happened to call.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { driftCommand, impactCommand, reviewCommand } from "../src/commands.js";
import { isTemplateDoc } from "../src/commands/wiki-files.js";
import { normalizeOptions } from "../src/index.js";

// hasGit() swallows every throw, and in this repository a missing import has
// turned a whole file into `# skipped N` with exit code 0 — green while testing
// nothing. Guard the imports at load time.
for (const [name, value] of [
  ["execFileSync", execFileSync],
  ["driftCommand", driftCommand],
  ["impactCommand", impactCommand],
  ["reviewCommand", reviewCommand],
  ["isTemplateDoc", isTemplateDoc],
  ["normalizeOptions", normalizeOptions]
]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

// A verified document citing a.ts, reviewed long before any commit in the
// fixture — so every commit is "after the baseline" and drift would fire.
function verifiedDoc(title, status = "verified") {
  return [
    "---", `title: ${title}`, "tags:", "  - llm-wiki", `  - ${status === "verified" ? "verified" : "needs-review"}`,
    `status: ${status}`, "doc_type: public_api", "project: tmpl", "last_updated: 2026-07-01",
    "author: cli-generated", "reviewed_by: Someone", "reviewed_at: 2026-07-01",
    "wiki_block_version: v1", "source_files:", "  - a.ts", "evidence:", "  - a.ts",
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
    "contains_sensitive_info: false", "---", "", `# ${title}`, "",
    "Describes a.ts and what it does for consumers of this package.", "",
    "## Evidence", "", "- a.ts — the file this document describes.", ""
  ].join("\n");
}

// One repo, two documents with IDENTICAL frontmatter — same status, same
// anchors, same baseline. The ONLY difference is the directory. That is what
// makes the sibling a control: if the template stops being flagged for any
// reason other than its path, the control stops being flagged too and the test
// fails instead of passing vacuously.
async function templateRepo({ logStatus = "needs_review" } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-template-scope-"));
  const wiki = path.join(cwd, "docs", "llm-wiki");
  await mkdir(path.join(wiki, "templates"), { recursive: true });
  await writeFile(path.join(cwd, "a.ts"), "one\n", { encoding: "utf8" });
  await writeFile(path.join(wiki, "api.md"), verifiedDoc("Api"), { encoding: "utf8" });
  await writeFile(path.join(wiki, "templates", "DECISION_LOG.template.md"), verifiedDoc("Decision Log"), { encoding: "utf8" });
  await writeFile(path.join(wiki, "log.md"), verifiedDoc("Log", logStatus), { encoding: "utf8" });
  const git = (args) => execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, ...GIT_ENV } });
  git(["init"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "init"]);
  return { cwd, git };
}

const pathsOf = (findings, rule) => findings.filter((f) => f.rule === rule).map((f) => f.path);

test("drift does not flag a template, and still flags its identical sibling", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await templateRepo();
  try {
    const result = await driftCommand(normalizeOptions({ cwd }));
    const stale = pathsOf(result.driftFindings ?? result.findings ?? [], "evidence.stale");
    assert.deepEqual(
      stale.filter((p) => p.includes("/templates/")),
      [],
      "a template cannot be re-stamped by review, so reporting it stale leaves a finding with no resolution path"
    );
    assert.ok(
      stale.includes("docs/llm-wiki/api.md"),
      "control: the identical non-template document must still be flagged, or this test proves nothing about the path"
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("impact does not flag a template, and still flags its identical sibling", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await templateRepo();
  try {
    await writeFile(path.join(cwd, "a.ts"), "two\n", { encoding: "utf8" });
    const result = await impactCommand(normalizeOptions({ cwd }));
    const impacted = pathsOf(result.findings, "impact.source_changed");
    assert.deepEqual(
      impacted.filter((p) => p.includes("/templates/")),
      [],
      "impact.source_changed is an error by default; a template would fail a build with no way to clear it"
    );
    assert.ok(
      impacted.includes("docs/llm-wiki/api.md"),
      "control: the identical non-template document must still fail the build"
    );
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("review refuses a template by naming the scope, not by denying the file exists", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await templateRepo();
  const rel = "docs/llm-wiki/templates/DECISION_LOG.template.md";
  try {
    const before = await readFile(path.join(cwd, rel), "utf8");
    const result = await reviewCommand(normalizeOptions({ cwd, approve: [rel], reviewer: "T" }));
    const entry = (result.refused ?? []).find((item) => item.path.includes("DECISION_LOG"));

    assert.ok(entry, "the path must be answered, not dropped");
    assert.match(entry.reason, /outside review scope/, "the refusal must state the boundary");
    assert.doesNotMatch(
      entry.reason,
      /not found/,
      "the old answer sent people hunting for a typo in a path that resolves to a real file"
    );
    assert.deepEqual(result.approved, [], "and nothing is stamped");
    assert.equal(await readFile(path.join(cwd, rel), "utf8"), before, "the file on disk is untouched");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("a path that really is missing still says so", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await templateRepo();
  try {
    const result = await reviewCommand(normalizeOptions({ cwd, approve: ["docs/llm-wiki/nope.md"], reviewer: "T" }));
    const entry = (result.refused ?? [])[0];
    assert.ok(entry, "a missing path is still refused");
    assert.match(entry.reason, /not found under docs\/llm-wiki/, "the scope answer must not swallow the not-found answer");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("the append-only log is refused explicitly, the way --approve-all already treats it", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await templateRepo({ logStatus: "needs_review" });
  const rel = "docs/llm-wiki/log.md";
  try {
    const before = await readFile(path.join(cwd, rel), "utf8");
    const result = await reviewCommand(normalizeOptions({ cwd, approve: [rel], reviewer: "T" }));
    const entry = (result.refused ?? []).find((item) => item.path === rel);

    assert.ok(entry, "the log must be answered");
    assert.match(entry.reason, /outside review scope/, "the list already excludes it; naming it explicitly used to stamp it verified");
    assert.equal(await readFile(path.join(cwd, rel), "utf8"), before, "the append-only log keeps its status");
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

test("isTemplateDoc matches the enumerator review already used, and nothing else", () => {
  // Same predicate listWikiContentDocs filters on — that is the point. If these
  // ever diverge, the gates and review disagree again.
  assert.equal(isTemplateDoc("docs/llm-wiki/templates/DECISION_LOG.template.md"), true);
  assert.equal(isTemplateDoc("docs/llm-wiki/domains/templates/nested.md"), true);
  assert.equal(isTemplateDoc("templates/core/wiki-document.md"), true, "the no-wiki-root fallback scope");
  // Native separators normalize on the platform that produced them, which is the
  // only place a native path comes from: every caller passes
  // toPosix(path.relative(...)), and toPosix splits on path.sep. Asserting the
  // literal-backslash form unconditionally is NOT the same claim — a backslash is
  // an ordinary filename character on POSIX, so that assertion passed on Windows
  // and failed on Linux and macOS CI. path.join states the real contract on
  // whichever platform is running.
  assert.equal(isTemplateDoc(path.join("docs", "llm-wiki", "templates", "native.md")), true, "a native path from this platform normalizes");
  assert.equal(isTemplateDoc(path.join("docs", "llm-wiki", "GLOSSARY.md")), false, "and a native non-template path stays out");

  assert.equal(isTemplateDoc("docs/llm-wiki/templates.md"), false, "a lookalike filename is not a template directory");
  assert.equal(isTemplateDoc("docs/llm-wiki/PUBLIC_API.md"), false);
  assert.equal(isTemplateDoc("src/templates.js"), false);
});
