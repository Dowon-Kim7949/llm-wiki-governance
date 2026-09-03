// Token-budget metadata on generated skill artifacts (ECC-style: measure the
// load budget BEFORE reading the whole body). Claude/Codex SKILL.md carry an
// `estimated-tokens` frontmatter key; Cursor rules and agent-neutral prompts
// carry the same figure as a body comment because their frontmatter contract is
// third-party (.mdc) or absent (neutral). The value reuses estimateTokens
// (chars/4) from retrieval.js and is a PROXY, never a measured token count.
// These tests also pin that the budget line composes with the content-hash
// refresh marker: a fresh artifact stays managed + up to date, and a pre-budget
// managed artifact (older generation) becomes a --refresh target.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initCommand } from "../src/commands.js";
import { SKILL_TASKS } from "../src/commands/skills.js";
import { estimateTokens } from "../src/commands/retrieval.js";

const MARKER_RE = /\n<!-- llm-wiki-generated v\S+ ([0-9a-f]{16}) -->\n?$/;
const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n\n/;
const PROXY_NOTE = "chars/4 proxy of the skill body, not a measured token count";
// Frontmatter form (Claude/Codex SKILL.md): `estimated-tokens: N # <proxy note>`.
const FM_BUDGET_RE = new RegExp(`\\nestimated-tokens: (\\d+) # ${PROXY_NOTE}\\n`);
// Body-comment form (Cursor rule / neutral prompt).
const COMMENT_BUDGET_RE = new RegExp(`<!-- estimated-tokens: (\\d+) \\(${PROXY_NOTE}\\) -->`);

async function makeProject(prefix) {
  return mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
}

// Minimal backend project with every skill format generated (--skills).
async function skillsFixture(prefix) {
  const cwd = await makeProject(prefix);
  await writeFile(
    path.join(cwd, "package.json"),
    `${JSON.stringify({ dependencies: { fastify: "^4.0.0" } }, null, 2)}\n`,
    { encoding: "utf8" }
  );
  const result = await initCommand(initOptions(cwd, { write: true }));
  assert.equal(result.result, "pass");
  return cwd;
}

function initOptions(cwd, extra = {}) {
  return { cwd, minimal: true, withAdapters: false, skills: true, type: "backend", profiles: [], agents: [], existing: "skip", ...extra };
}

const stripMarker = (content) => content.replace(MARKER_RE, "");
const stripFrontmatter = (content) => content.replace(FRONTMATTER_RE, "");

test("Claude and Codex SKILL.md frontmatter carries an estimated-tokens budget computed from the body (chars/4 proxy)", async () => {
  const cwd = await skillsFixture("skill-budget-fm-");
  for (const { slug } of SKILL_TASKS) {
    for (const rel of [`.claude/skills/${slug}/SKILL.md`, `.agents/skills/${slug}/SKILL.md`]) {
      const content = await readFile(path.join(cwd, ...rel.split("/")), "utf8");
      const fmBlock = content.match(FRONTMATTER_RE);
      assert.ok(fmBlock, `${rel}: frontmatter present`);
      // The key lives INSIDE the frontmatter block, with the proxy disclaimer inline.
      const budget = fmBlock[0].match(FM_BUDGET_RE);
      assert.ok(budget, `${rel}: estimated-tokens key with proxy note in frontmatter`);
      // The stamped figure is estimateTokens over the artifact body only
      // (frontmatter/marker excluded), so the number never feeds back into itself.
      const body = stripFrontmatter(stripMarker(content));
      assert.equal(Number(budget[1]), estimateTokens(body), `${rel}: budget equals estimateTokens(body)`);
      assert.ok(Number(budget[1]) > 0, `${rel}: budget is positive`);
    }
  }
});

test("Cursor rules and neutral prompts carry the budget as a body comment, never a frontmatter key", async () => {
  const cwd = await skillsFixture("skill-budget-comment-");

  // Cursor .mdc: the third-party frontmatter contract stays untouched.
  const rule = await readFile(path.join(cwd, ".cursor", "rules", "llm-wiki-fix.mdc"), "utf8");
  const ruleFm = rule.match(/^---\n([\s\S]*?)\n---\n\n/);
  assert.ok(ruleFm, "cursor rule frontmatter present");
  assert.ok(!ruleFm[0].includes("estimated-tokens"), "no unknown key added to the .mdc frontmatter");
  assert.deepEqual(
    ruleFm[1].split("\n").map((line) => line.split(":")[0]),
    ["description", "alwaysApply"],
    ".mdc frontmatter keys unchanged"
  );
  const ruleTail = stripFrontmatter(stripMarker(rule));
  const ruleBudget = ruleTail.match(COMMENT_BUDGET_RE);
  assert.ok(ruleBudget, "cursor rule carries the budget as a body comment");
  const ruleBody = ruleTail.replace(new RegExp(`^<!-- estimated-tokens: \\d+ \\(${PROXY_NOTE}\\) -->\\n\\n`), "");
  assert.notEqual(ruleBody, ruleTail, "comment sits at the head of the body (budget readable before the load)");
  assert.equal(Number(ruleBudget[1]), estimateTokens(ruleBody), "cursor budget equals estimateTokens(body)");

  // Neutral prompt: it has no frontmatter at all, and must not gain one.
  const prompt = await readFile(path.join(cwd, ".llm-wiki", "prompts", "llm-wiki-docs-sync.md"), "utf8");
  assert.ok(!prompt.startsWith("---"), "neutral prompt gains no frontmatter");
  assert.match(prompt, COMMENT_BUDGET_RE, "neutral prompt carries the budget as a body comment");
});

test("the budget line composes with the content-hash marker: fresh artifacts are managed and --refresh reports up to date", async () => {
  const cwd = await skillsFixture("skill-budget-marker-");
  const featurePath = path.join(cwd, ".claude", "skills", "llm-wiki-feature", "SKILL.md");
  const content = await readFile(featurePath, "utf8");

  // The trailing marker hash covers the budget line (the same body-minus-marker
  // hash isManagedUnmodified recomputes before any refresh overwrite).
  const marker = content.match(MARKER_RE);
  assert.ok(marker, "marker present");
  const rehash = createHash("sha256").update(stripMarker(content), "utf8").digest("hex").slice(0, 16);
  assert.equal(rehash, marker[1], "marker hash matches content including the budget line");

  // An untouched managed artifact is up to date under --refresh: the budget is
  // computed from the body only, so re-rendering is stable (no oscillation).
  const refreshed = await initCommand(initOptions(cwd, { write: true, refresh: true }));
  assert.ok(
    refreshed.skipped.some((line) => line.includes("llm-wiki-feature/SKILL.md") && /up to date/.test(line)),
    "reported up to date under --refresh"
  );
  assert.equal(await readFile(featurePath, "utf8"), content, "byte-identical after --refresh");
});

test("a pre-budget managed artifact (older generation, valid marker) becomes a --refresh target and gains the budget", async () => {
  const cwd = await skillsFixture("skill-budget-upgrade-");
  const featurePath = path.join(cwd, ".claude", "skills", "llm-wiki-feature", "SKILL.md");
  const current = await readFile(featurePath, "utf8");

  // Reconstruct the pre-budget artifact: drop the estimated-tokens line and
  // re-marker it exactly as an older release would have (hash over its own
  // body; the marker version is informational, so v2 mimics that generation).
  const budgetLineRe = /\nestimated-tokens: \d+ # [^\n]*/;
  assert.match(stripMarker(current), budgetLineRe, "current artifact carries the budget line");
  const legacy = stripMarker(current).replace(budgetLineRe, "");
  const legacyHash = createHash("sha256").update(legacy, "utf8").digest("hex").slice(0, 16);
  await writeFile(featurePath, `${legacy}\n<!-- llm-wiki-generated v2 ${legacyHash} -->\n`, { encoding: "utf8" });

  // Dry-run classifies it as a refresh target (managed, unmodified, stale template).
  const plan = await initCommand(initOptions(cwd, { dryRun: true, refresh: true }));
  assert.ok(
    plan.planned.some((line) => line.includes("llm-wiki-feature/SKILL.md") && /would be refreshed/.test(line)),
    "planned for refresh"
  );

  // Write refreshes it: the budget line is back and the fresh marker is valid.
  const result = await initCommand(initOptions(cwd, { write: true, refresh: true }));
  assert.ok(
    result.created.some((line) => line.includes("llm-wiki-feature/SKILL.md") && /refreshed/.test(line)),
    "refreshed on write"
  );
  const after = await readFile(featurePath, "utf8");
  assert.match(stripMarker(after), budgetLineRe, "budget line restored by the refresh");
  const freshMarker = after.match(MARKER_RE);
  assert.equal(
    createHash("sha256").update(stripMarker(after), "utf8").digest("hex").slice(0, 16),
    freshMarker[1],
    "fresh marker is self-consistent"
  );
});
