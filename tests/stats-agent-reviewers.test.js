// `stats` human_verified counted "verified + reviewer metadata" and never asked who
// the reviewer was, so an agent's approval run counted as human review. The fix is
// a config list of agent reviewer names (`agentReviewers`): verified documents
// whose reviewed_by matches one move from human_verified to a new agent_verified.
// Without the list the split is not decidable, so human_verified keeps its old
// value and agent_verified is null — never 0, which would claim no agent approved
// anything.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { statsCommand } from "../src/commands.js";
import { agentReviewerSet, isAgentReviewer } from "../src/commands/scans.js";
import { main } from "../src/cli.js";
import * as api from "../src/index.js";

for (const [name, value] of [
  ["statsCommand", statsCommand],
  ["agentReviewerSet", agentReviewerSet],
  ["isAgentReviewer", isAgentReviewer],
  ["main", main]
]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function doc(title, { status = "verified", reviewedBy = null } = {}) {
  const lines = ["---", `title: ${title}`, `status: ${status}`, "doc_type: reference"];
  if (reviewedBy !== null) lines.push(`reviewed_by: ${reviewedBy}`, "reviewed_at: 2026-01-01");
  lines.push("---", "", `# ${title}`, "", "Body.", "");
  return lines.join("\n");
}

async function makeWiki(config) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-agent-reviewers-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "demo" }), "utf8");
  const files = {
    "index.md": doc("Index", { reviewedBy: "Dowon-Kim" }),
    "agent-a.md": doc("Agent A", { reviewedBy: "Claude Code" }),
    "agent-b.md": doc("Agent B", { reviewedBy: "CLAUDE code" }),
    "prefix.md": doc("Prefix", { reviewedBy: "Claude" }),
    "pending.md": doc("Pending", { status: "needs_review" })
  };
  for (const [rel, content] of Object.entries(files)) {
    await writeFile(path.join(cwd, "docs", "llm-wiki", rel), content, "utf8");
  }
  if (config !== undefined) await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify(config), "utf8");
  return cwd;
}

async function stats(cwd) {
  const { options, errors } = await api.resolveOptions({ cwd });
  assert.deepEqual(errors, []);
  return statsCommand(options);
}

test("agentReviewers unset: human_verified is unchanged and agent_verified is null, not 0", async () => {
  const result = await stats(await makeWiki());
  const tiers = result.stats.evidenceTiers;
  assert.equal(tiers.humanVerified, 4, "every verified doc with reviewer metadata, agents included — the old value");
  assert.equal(tiers.agentVerified, null);
  assert.deepEqual(Object.keys(tiers), ["referenceChecked", "humanVerified", "both", "agentVerified"], "keys are only added");
  assert.match(result.text, /human_verified 4 \(both 0\), agent_verified unknown \(agentReviewers not set\)/);
  assert.match(result.text, /an agent's approval counts toward human_verified/);
});

test("agentReviewers set: matching reviewers move from human_verified to agent_verified", async () => {
  // Leading/trailing whitespace and case are ignored on both sides; nothing else is
  // fuzzy, so "Claude" (prefix.md) is still a human-attributed approval.
  const result = await stats(await makeWiki({ agentReviewers: ["  claude code  "] }));
  const tiers = result.stats.evidenceTiers;
  assert.equal(tiers.agentVerified, 2);
  assert.equal(tiers.humanVerified, 2, "Dowon-Kim and the non-matching 'Claude'");
  assert.equal(tiers.humanVerified + tiers.agentVerified, 4, "the split never loses or double-counts a document");
  assert.match(result.text, /human_verified 2 \(both 0\), agent_verified 2/);
  assert.doesNotMatch(result.text, /agentReviewers not set/);
});

test("agentReviewers: both counts only human-verified documents", async () => {
  const cwd = await makeWiki({ agentReviewers: ["Claude Code"] });
  // Ground one human-approved and one agent-approved doc so reference_checked applies.
  const grounded = (title, reviewedBy) => [
    "---", `title: ${title}`, "status: verified", "doc_type: reference", `reviewed_by: ${reviewedBy}`,
    "reviewed_at: 2026-01-01", "source_files:", "  - package.json", "---", "", `# ${title}`, "", "Body.", ""
  ].join("\n");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "index.md"), grounded("Index", "Dowon-Kim"), "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "agent-a.md"), grounded("Agent A", "Claude Code"), "utf8");
  const tiers = (await stats(cwd)).stats.evidenceTiers;
  assert.equal(tiers.referenceChecked, 2);
  assert.equal(tiers.both, 1, "the agent-approved grounded doc is reference_checked but not human_verified");
});

test("agentReviewerSet / isAgentReviewer: trimmed, case-insensitive, exact", () => {
  const set = agentReviewerSet([" Claude Code ", "codex"]);
  assert.ok(isAgentReviewer("claude code", set));
  assert.ok(isAgentReviewer("  CODEX\t", set));
  assert.ok(!isAgentReviewer("Claude", set), "no prefix matching");
  assert.ok(!isAgentReviewer("Claude Code Bot", set), "no substring matching");
  assert.ok(!isAgentReviewer(null, set));
  assert.equal(agentReviewerSet(undefined), null);
  assert.equal(agentReviewerSet([]), null, "an empty list is 'not set', never 'no agents'");
  assert.ok(!isAgentReviewer("claude code", null));
});

test("agentReviewers must be a non-empty array of non-empty strings", async () => {
  for (const bad of [[], "Claude Code", [""], ["   "], ["ok", 3], null, { name: "x" }]) {
    const cwd = await makeWiki({ agentReviewers: bad });
    const { options, errors } = await api.resolveOptions({ cwd });
    assert.ok(errors.some((e) => e.includes("\"agentReviewers\"")), `rejected: ${JSON.stringify(bad)}`);
    assert.equal(options.agentReviewers, undefined, "a rejected value is never applied");
  }

  const lines = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  console.log = (...parts) => lines.push(parts.join(" "));
  console.error = (...parts) => lines.push(parts.join(" "));
  let code;
  try {
    code = await main(["stats", "--cwd", await makeWiki({ agentReviewers: [] })]);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode;
  }
  assert.equal(code, 3, "an invalid config is a config error like any other");
  assert.match(lines.join("\n"), /agentReviewers/);
});
