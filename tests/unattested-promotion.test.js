// review.unattested_promotion (P1-2, 2026-10-27): impact names a wiki document
// that became verified inside its diff while the review stamp did not move with
// it. validate cannot see this (tests/known-gaps.test.js GAP 3: it reads one file
// at one point in time); the diff can, because a real approval writes the stamp
// in the same change as the promotion. Opt-in, so default runs are untouched.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { impactCommand, reviewCommand } from "../src/commands.js";
import { normalizeOptions } from "../src/index.js";
import { todayIsoDate } from "../src/template-renderer.js";

for (const [name, value] of [["impactCommand", impactCommand], ["reviewCommand", reviewCommand], ["normalizeOptions", normalizeOptions]]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };
const RULE = "review.unattested_promotion";

function doc(stampLines) {
  return [
    "---", "title: Api", "tags:", "  - llm-wiki", "status: needs_review",
    "doc_type: public_api", "project: promo", "last_updated: 2026-10-01",
    "author: cli-generated", "last_edited_by: t", ...stampLines, "wiki_block_version: v1",
    "source_files:", "  - src/app.js", "related:", "  - docs/llm-wiki/index.md",
    "visibility: internal", "contains_sensitive_info: false", "---", "", "# Api", "",
    "## Summary", "", "The app exports one constant that callers read at startup.", "",
    "## Evidence", "", "- src/app.js", ""
  ].join("\n");
}

async function project(stampLines) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-promotion-"));
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "src", "app.js"), "export const x = 1;\n", "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "api.md"), doc(stampLines), "utf8");
  execFileSync("git", ["init", "-q"], { cwd, stdio: "ignore" });
  execFileSync("git", ["add", "-A"], { cwd, stdio: "ignore", env: GIT_ENV });
  execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-q", "-m", "base"], { cwd, stdio: "ignore", env: GIT_ENV });
  return { cwd, docPath: path.join(cwd, "docs", "llm-wiki", "api.md") };
}

async function handPromote(docPath) {
  await writeFile(docPath, (await readFile(docPath, "utf8")).replace("status: needs_review", "status: verified"), "utf8");
}

const ruleFindings = (result) => result.findings.filter((finding) => finding.rule === RULE);

test("a hand-edited status that keeps the old review date is named, once enabled", { skip: !hasGit() }, async () => {
  const { cwd, docPath } = await project(["reviewed_by: Someone", "reviewed_at: 2026-09-01"]);
  await handPromote(docPath);

  assert.deepEqual(ruleFindings(await impactCommand(normalizeOptions({ cwd }))), [], "off by default");

  const result = await impactCommand(normalizeOptions({ cwd, rules: { [RULE]: "warning" } }));
  const [finding] = ruleFindings(result);
  assert.equal(finding.path, "docs/llm-wiki/api.md");
  assert.equal(finding.severity, "warning");
  assert.match(finding.message, /reviewed_at is still 2026-09-01/);
});

test("a promotion with no review stamp at all is named", { skip: !hasGit() }, async () => {
  const { cwd, docPath } = await project([]);
  await handPromote(docPath);
  const [finding] = ruleFindings(await impactCommand(normalizeOptions({ cwd, rules: { [RULE]: "warning" } })));
  assert.match(finding.message, /reviewed_by is empty/);
});

test("review --approve writes the stamp, so its promotion is not named", { skip: !hasGit() }, async () => {
  const { cwd } = await project(["reviewed_by: Someone", "reviewed_at: 2026-09-01"]);
  const approved = await reviewCommand(normalizeOptions({ cwd, approve: ["docs/llm-wiki/api.md"], reviewer: "Fixture Reviewer" }));
  assert.deepEqual(approved.approved, ["docs/llm-wiki/api.md"], JSON.stringify(approved.refused));
  assert.deepEqual(ruleFindings(await impactCommand(normalizeOptions({ cwd, rules: { [RULE]: "warning" } }))), []);
});

test("a same-day re-approval keeps today's date and is not named", { skip: !hasGit() }, async () => {
  // Downgraded and approved again on the same day: review --approve writes the
  // date the document already carries. 43 of 187 promotions in this repository's
  // history had this shape, and none of them was a hand edit.
  const { cwd, docPath } = await project(["reviewed_by: Someone", `reviewed_at: ${todayIsoDate()}`]);
  await handPromote(docPath);
  assert.deepEqual(ruleFindings(await impactCommand(normalizeOptions({ cwd, rules: { [RULE]: "warning" } }))), []);
});

test("the rule follows the configured severity and runs even with impact.source_changed off", { skip: !hasGit() }, async () => {
  const { cwd, docPath } = await project(["reviewed_by: Someone", "reviewed_at: 2026-09-01"]);
  await handPromote(docPath);
  const result = await impactCommand(normalizeOptions({ cwd, rules: { [RULE]: "error", "impact.source_changed": "off" } }));
  assert.equal(ruleFindings(result)[0].severity, "error");
  assert.equal(result.result, "fail");
});
