// The representative failure casebook (roadmap G-2, written 2026-07-31 as the
// last Phase 0 item).
//
// READ THIS BEFORE "FIXING" A FAILURE HERE. These tests assert the CURRENT,
// UNDESIRED behavior of three known structural gaps. They exist so the gaps are
// reproducible facts rather than prose in a roadmap, and so the day someone
// closes one, a test goes RED and says exactly what changed.
//
// A failure in this file is therefore GOOD NEWS: it means a gap closed. The
// correct response is to flip the assertion (and move the case into the normal
// suite), never to weaken it.
//
// Why characterization tests instead of fixes: each of these needs detection
// this tool does not have yet, which is Phase 1+ work with its own approval.
// Phase 0's job was to write the failures down in a form that cannot rot.
//
// Gaps 1 (no gate) and defects 8-9 (wrong manifest picked, drift always passing)
// were also on G-2's minimum list and are NOT here — they are fixed, and pinned
// by tests/ci-governance-check.test.js and tests/phase0-defects.test.js.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { normalizeOptions } from "../src/index.js";
import { driftCommand, impactCommand, checkRunCommand, validateCommand } from "../src/commands.js";

const execFileAsync = promisify(execFile);

function doc({ status, reviewedBy = null, reviewedAt = "2020-01-01" }) {
  const review = reviewedBy
    ? `reviewed_by: ${reviewedBy}\nreviewed_at: ${reviewedAt}\n`
    : "";
  return `---
title: Index
tags:
  - llm-wiki
status: ${status}
doc_type: index
project: fixture
last_updated: 2020-01-01
author: cli-generated
last_edited_by: cli
${review}wiki_block_version: v1
source_files:
  - src/app.js
evidence:
  - src/app.js#L1
related:
  - docs/llm-wiki/index.md
visibility: internal
contains_sensitive_info: false
---

# Index

A fixture document grounded in src/app.js. The body is long enough to read as
enriched prose rather than an untouched scaffold, so the only thing under test
is the status field and what the tooling does with it.

## Evidence

- src/app.js#L1
`;
}

async function makeRepo(status, options = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-gap-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  await writeFile(path.join(cwd, "src", "app.js"), "export const a = 1;\n", "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "index.md"), doc({ status, ...options }), "utf8");

  const git = (...args) => execFileAsync("git", ["-C", cwd, ...args]);
  await git("init", "-q");
  await git("config", "user.email", "fixture@example.com");
  await git("config", "user.name", "Fixture");
  await git("add", ".");
  await git("commit", "-q", "-m", "initial");

  // The source moves after the document's review date. For a verified document
  // this is the textbook drift case.
  await writeFile(path.join(cwd, "src", "app.js"), "export const a = 2;\n", "utf8");
  await git("add", ".");
  await git("commit", "-q", "-m", "change source");
  return { cwd, git };
}

// --- GAP 2: freshness checking is scoped to `verified` documents only -----

// PARTLY ADDRESSED 2026-08-03 by decision 28: `drift --watch-needs-review` opts
// into exactly this. It stays OFF by default, so the gap below is still the
// default behaviour and the assertion stands. impact was deliberately NOT
// widened — its rule is an error since decision 21, and an advisory opt-in must
// not let an unreviewed document fail a build.
test("KNOWN GAP: drift cannot see a needs_review document whose source moved", async () => {
  const verified = await makeRepo("verified", { reviewedBy: "Fixture Human" });
  const needsReview = await makeRepo("needs_review");

  const onVerified = await driftCommand(normalizeOptions({ cwd: verified.cwd }));
  const onNeedsReview = await driftCommand(normalizeOptions({ cwd: needsReview.cwd }));

  assert.ok(onVerified.driftFindings.length > 0, "guard: the verified fixture must drift");
  // verifiedSourceAnchors returns null for any non-verified status, and both
  // drift and impact are built on it. The perverse consequence: `drift
  // --downgrade`, the safe response to drift, REMOVES the document from
  // observation. Doing the right thing turns the monitoring off.
  assert.equal(
    onNeedsReview.driftFindings.length,
    0,
    "GAP CLOSED? A needs_review document is now watched for drift — flip this test."
  );
});

test("KNOWN GAP: impact is blind to the same document", async () => {
  const { cwd } = await makeRepo("needs_review");
  const base = (await execFileAsync("git", ["-C", cwd, "rev-parse", "HEAD~1"])).stdout.trim();
  const result = await impactCommand(normalizeOptions({ cwd, since: base, strict: true }));
  assert.equal(
    result.findings.filter((finding) => finding.rule === "impact.source_changed").length,
    0,
    "GAP CLOSED? impact now covers needs_review documents — flip this test."
  );
});

// --- GAP 3: promotion to verified can be done by editing frontmatter -----

test("KNOWN GAP: a hand-edited verified status with stale review metadata passes validate", async () => {
  // Reproduces a real pilot commit: a document was flipped from needs_review to
  // verified inside a commit about something else, and reviewed_by/reviewed_at
  // were left at their old values rather than blanked — so the frontmatter looks
  // exactly like a legitimate review.
  const { cwd } = await makeRepo("verified", { reviewedBy: "Someone", reviewedAt: "2020-01-01" });
  const result = await validateCommand(normalizeOptions({ cwd, strict: true }));
  assert.equal(
    result.findings.filter((finding) => finding.rule === "frontmatter.verified_review").length,
    0,
    "GAP CLOSED? A bypassed promotion is now detected — flip this test."
  );
  // What IS caught is the omission of review metadata entirely; a bypass that
  // carries plausible-looking metadata is indistinguishable from a real review.
  // Closing this needs a signal outside the file (git history of the status
  // line), which is Phase 1+ work.
});

// --- GAP 4: the run manifest is self-reported ------------------------------
// PARTLY CLOSED 2026-08-03 by decision 23. `run.doc_gap` still cannot fire on an
// empty changedSource — that is inherent to a rule that iterates the declared
// list — but the declaration itself is now cross-checked against git, so an
// under-reported change set is visible instead of silent. The half that remains
// open is that the cross-check needs a working tree to compare against: once the
// run is committed, git reports no changes and the check has nothing to say.

test("GAP 4 (partly closed): an under-declared change set is now visible, via git rather than the manifest", async (t) => {
  let hasGit = true;
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); } catch { hasGit = false; }
  if (!hasGit) { t.skip("git not available"); return; }

  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-gap-run-"));
  await mkdir(path.join(cwd, ".llm-wiki", "runs"), { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "index.md"), doc({ status: "needs_review" }), "utf8");
  // A baseline commit, because the cross-check compares against HEAD — a repo
  // with no commits at all has nothing to diff and the check stays silent (that
  // is the second known gap below, in its "no working tree to compare" form).
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };
  execFileSync("git", ["init"], { cwd, stdio: "ignore" });
  execFileSync("git", ["add", "-A"], { cwd, stdio: "ignore", env });
  execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "baseline"], { cwd, stdio: "ignore", env });

  // The agent really did change a source file, and declared that it changed none.
  // Staged, because the cross-check reads tracked modifications: an untracked
  // scratch file is not evidence about a run, and treating it as such is what
  // made the first cut of this rule fire on editor config.
  await writeFile(path.join(cwd, "src-touched.js"), "export const a = 1;\n", "utf8");
  execFileSync("git", ["add", "src-touched.js"], { cwd, stdio: "ignore", env });
  await writeFile(path.join(cwd, ".llm-wiki", "runs", "run-fix-20260731T000000Z.json"), JSON.stringify({
    task: "fix",
    timestamp: "2026-07-31T00:00:00Z",
    changedSource: [],
    touchedDocs: [],
    logAppended: true,
    validated: { command: "validate", result: "pass" },
    testEvidence: { red: "anything non-empty", green: "anything non-empty" }
  }), "utf8");

  const result = await checkRunCommand(normalizeOptions({ cwd, strict: true }));
  assert.equal(
    result.findings.filter((finding) => finding.rule === "run.doc_gap").length,
    0,
    "doc_gap still iterates the declaration, so it stays silent — that half of the gap is inherent"
  );
  const undeclared = result.findings.filter((finding) => finding.rule === "run.change_set_undeclared");
  assert.ok(
    undeclared.some((finding) => finding.path === "src-touched.js"),
    `the cross-check must name the undeclared file; saw ${JSON.stringify(result.findings.map((f) => f.rule))}`
  );
  assert.equal(undeclared[0].severity, "warning", "observation first: warning, never error");
});

test("KNOWN GAP: once a run is committed, the change-set cross-check has nothing to compare", async (t) => {
  let hasGit = true;
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); } catch { hasGit = false; }
  if (!hasGit) { t.skip("git not available"); return; }

  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-gap-run-committed-"));
  await mkdir(path.join(cwd, ".llm-wiki", "runs"), { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "index.md"), doc({ status: "needs_review" }), "utf8");
  await writeFile(path.join(cwd, "src-touched.js"), "export const a = 1;\n", "utf8");
  await writeFile(path.join(cwd, ".llm-wiki", "runs", "run-fix-20260731T000000Z.json"), JSON.stringify({
    task: "fix", timestamp: "2026-07-31T00:00:00Z", changedSource: [], touchedDocs: [],
    logAppended: true, validated: { command: "validate", result: "pass" },
    testEvidence: { red: "x", green: "y" }
  }), "utf8");
  const env = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };
  execFileSync("git", ["init"], { cwd, stdio: "ignore" });
  execFileSync("git", ["add", "-A"], { cwd, stdio: "ignore", env });
  execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-m", "everything"], { cwd, stdio: "ignore", env });

  const result = await checkRunCommand(normalizeOptions({ cwd, strict: true }));
  assert.equal(
    result.findings.filter((finding) => finding.rule === "run.change_set_undeclared").length,
    0,
    "GAP CLOSED? the cross-check now works against a committed run — flip this test."
  );
});

test("KNOWN GAP: testEvidence is checked for presence, never for truth", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-gap-eve-"));
  await mkdir(path.join(cwd, ".llm-wiki", "runs"), { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "index.md"), doc({ status: "needs_review" }), "utf8");
  await writeFile(path.join(cwd, ".llm-wiki", "runs", "run-fix-20260731T000000Z.json"), JSON.stringify({
    task: "fix",
    timestamp: "2026-07-31T00:00:00Z",
    changedSource: ["src/app.js"],
    touchedDocs: ["docs/llm-wiki/index.md"],
    logAppended: true,
    validated: { command: "validate", result: "pass" },
    // Two non-empty strings are the entire contract. Neither names a real test,
    // and nothing ran.
    testEvidence: { red: "x", green: "y" }
  }), "utf8");

  const result = await checkRunCommand(normalizeOptions({ cwd, strict: true }));
  assert.equal(
    result.findings.filter((finding) => finding.rule === "run.test_evidence_missing").length,
    0,
    "GAP CLOSED? test evidence is now validated beyond presence — flip this test."
  );
});
