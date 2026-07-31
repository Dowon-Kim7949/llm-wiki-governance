// Defects found by MEASURING, not by reading the code (2026-07-31). The Phase 0
// batch came out of a source audit; this batch came out of running the newly
// wired gate against the four repositories that actually adopted this tool, and
// out of reading their git history. Both defects here were invisible from inside
// this repository and obvious from outside it.
//
// N-3: `validate-frontmatter --strict` printed `result: pass` and exited 1 on the
//      same run, because it was the one command reporting a two-state ladder.
// N-4: `review --approve` and `drift --downgrade` rewrote `status:` and left
//      `tags:` alone, so the status tag drifted away from the status field. One
//      adopting repository carries the mismatch on 12 of its 22 documents, and
//      which way it breaks depends on which path did the downgrade.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { normalizeOptions } from "../src/index.js";
import { validateFrontmatterCommand, reviewCommand } from "../src/commands.js";
import { driftCommand, syncStatusTag } from "../src/commands/fix-migrate.js";

const execFileAsync = promisify(execFile);

function summaryValue(result, key) {
  const line = result.summary.find((entry) => entry.startsWith(`${key}:`));
  return line ? line.slice(key.length + 1).trim() : null;
}

// A document carrying one duplicated key. The parser keeps last-wins semantics
// and reports frontmatter.duplicate_key as a WARNING, which is exactly the
// severity that made the old two-state ladder lie.
function docWithDuplicateKey(status = "needs_review") {
  const tag = status === "verified" ? "verified" : "needs-review";
  return `---
title: Index
tags:
  - llm-wiki
  - ${tag}
status: ${status}
doc_type: index
project: fixture
last_updated: 2026-07-31
author: cli-generated
last_edited_by: cli
last_edited_by: claude
reviewed_by: Fixture Human
reviewed_at: 2026-07-31
wiki_block_version: v1
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

A fixture document with a duplicated frontmatter key. The body is long enough to
clear the thin-body lint and to read as genuinely enriched prose rather than an
untouched scaffold, so the enrichment gate does not confound these assertions.

## Evidence

- src/app.js#L1
`;
}

async function makeWiki(doc) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-measured-"));
  const wiki = path.join(cwd, "docs", "llm-wiki");
  await mkdir(wiki, { recursive: true });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  await writeFile(path.join(cwd, "src", "app.js"), "export const a = 1;\n", "utf8");
  await writeFile(path.join(wiki, "index.md"), doc, "utf8");
  return { cwd, wiki };
}

// --- N-3: validate-frontmatter reported pass while exiting 1 ---------------

test("validate-frontmatter reports warning, not pass, when only warnings were found", async () => {
  const { cwd } = await makeWiki(docWithDuplicateKey());
  const result = await validateFrontmatterCommand(normalizeOptions({ cwd, strict: true }));

  const warnings = result.findings.filter((finding) => finding.severity === "warning");
  assert.ok(warnings.length > 0, "guard: the fixture must produce at least one warning");
  assert.equal(result.findings.filter((finding) => finding.severity === "error").length, 0);

  assert.equal(
    summaryValue(result, "result"),
    "warning",
    "a warning-only run must not print `result: pass` while --strict exits 1"
  );
  assert.equal(result.result, "warning", "the JSON payload must carry the same verdict as the text");
});

test("validate-frontmatter still reports pass on a clean run", async () => {
  const { cwd } = await makeWiki(docWithDuplicateKey().replace("last_edited_by: claude\n", ""));
  const result = await validateFrontmatterCommand(normalizeOptions({ cwd, strict: true }));

  assert.equal(result.findings.length, 0);
  assert.equal(summaryValue(result, "result"), "pass");
  assert.equal(result.result, "pass");
});

// --- N-4: the status tag drifted away from the status field ----------------

test("syncStatusTag rewrites an existing status tag in a block list", () => {
  const inner = ["title: Index", "tags:", "  - llm-wiki", "  - needs-review", "status: needs_review"].join("\n");
  const updated = syncStatusTag(inner, "verified");

  assert.ok(updated.includes("  - verified"));
  assert.ok(!updated.includes("needs-review"));
  assert.ok(updated.includes("  - llm-wiki"), "unrelated tags survive");
});

test("syncStatusTag rewrites an existing status tag in an inline list", () => {
  const inner = "tags: [llm-wiki, verified]\nstatus: verified";
  assert.equal(syncStatusTag(inner, "needs_review"), "tags: [llm-wiki, needs-review]\nstatus: verified");
});

test("syncStatusTag collapses the duplicate a rewrite would create", () => {
  const blockList = ["tags:", "  - verified", "  - needs-review"].join("\n");
  const updated = syncStatusTag(blockList, "verified");
  assert.equal(updated.match(/- verified/g).length, 1, "must not produce `verified` twice");

  const inline = syncStatusTag("tags: [verified, needs-review]", "verified");
  assert.equal(inline, "tags: [verified]");
});

test("syncStatusTag never invents a status tag and never touches other keys", () => {
  const noStatusTag = ["tags:", "  - llm-wiki", "source_files:", "  - src/verified.js"].join("\n");
  assert.equal(
    syncStatusTag(noStatusTag, "verified"),
    noStatusTag,
    "documents whose tags do not track status keep their own convention"
  );

  const looksLikeATag = ["source_files:", "  - needs-review", "tags:", "  - llm-wiki"].join("\n");
  assert.equal(syncStatusTag(looksLikeATag, "verified"), looksLikeATag, "only the tags block is in range");
});

// CodeQL caught this on PR #1 (js/polynomial-redos, high): the inline-list
// patterns had `[^\r\n]*` before `\[`, so the prefix and the opening bracket were
// ambiguous and input like `tags:[[[[…` backtracked quadratically. Document bodies
// are exactly the uncontrolled input this helper runs on.
// The input has to carry a real status tag, otherwise the rewrite is a no-op and
// the dedupe pass — where the vulnerable pattern lives — is never reached. Measured
// against the pre-fix pattern: 25k brackets 350ms, 50k 1692ms (quadratic), versus
// under a millisecond after. The bound sits far below the old cost and far above
// the new one, so a slow CI runner cannot flake it.
test("syncStatusTag stays linear on adversarial bracket input", () => {
  const hostile = `tags:${"[".repeat(50_000)}\n  - needs-review`;
  const started = process.hrtime.bigint();
  const updated = syncStatusTag(hostile, "verified");
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

  assert.ok(updated.endsWith("  - verified"), "guard: the rewrite must run, or the dedupe pass is skipped");
  assert.ok(elapsedMs < 500, `took ${Math.round(elapsedMs)}ms; the quadratic backtracking is back`);
});

test("review --approve syncs the status tag with the status field", async () => {
  const { cwd, wiki } = await makeWiki(docWithDuplicateKey().replace("last_edited_by: claude\n", ""));
  const result = await reviewCommand(normalizeOptions({
    cwd,
    approve: ["docs/llm-wiki/index.md"],
    reviewer: "Fixture Human"
  }));

  assert.deepEqual(result.approved, ["docs/llm-wiki/index.md"], `approval refused: ${JSON.stringify(result.refused)}`);
  const written = await readFile(path.join(wiki, "index.md"), "utf8");
  assert.ok(written.includes("status: verified"));
  assert.ok(written.includes("  - verified"), "the tag must follow the field");
  assert.ok(!written.includes("needs-review"), "the stale needs-review tag must be gone");
});

test("drift --downgrade syncs the status tag with the status field", async () => {
  const doc = docWithDuplicateKey("verified")
    .replace("last_edited_by: claude\n", "")
    .replace(/reviewed_at: 2026-07-31/, "reviewed_at: 2020-01-01")
    .replace(/last_updated: 2026-07-31/, "last_updated: 2020-01-01");
  const { cwd, wiki } = await makeWiki(doc);

  // Staleness is resolved from git history, so the source change has to be a commit.
  const git = (...args) => execFileAsync("git", ["-C", cwd, ...args]);
  await git("init", "-q");
  await git("config", "user.email", "fixture@example.com");
  await git("config", "user.name", "Fixture");
  await git("add", ".");
  await git("commit", "-q", "-m", "initial");
  await writeFile(path.join(cwd, "src", "app.js"), "export const a = 2;\n", "utf8");
  await git("add", ".");
  await git("commit", "-q", "-m", "change the cited source after the review date");

  const result = await driftCommand(normalizeOptions({ cwd, downgrade: true }));
  assert.equal(result.applied.length, 1, `nothing was downgraded: ${JSON.stringify(result)}`);

  const written = await readFile(path.join(wiki, "index.md"), "utf8");
  assert.ok(written.includes("status: needs_review"));
  assert.ok(written.includes("  - needs-review"), "the tag must follow the field");
  assert.ok(!/- verified$/m.test(written), "the stale verified tag must be gone");
});
