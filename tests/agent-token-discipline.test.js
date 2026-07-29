// Agent context discipline: the generated prompts/skills must spend tokens on
// EVIDENCE, not on volume. Three levers, all in the single sources the skills are
// built from, so every generated artifact inherits them:
//   1. The Gate 26 run manifest declares its own field set as the whole contract
//      and caps any optional prose, so agents stop writing paragraphs check-run
//      never reads.
//   2. The task workflows carry a context budget: locate before reading, read by
//      line range/section, and use the compact retrieval flags for wiki docs —
//      WITHOUT weakening the invariant that the actual source is read (the code is
//      the source of truth; token thrift must never buy an unverified claim).
//   3. This repo exposes a quiet test reporter so an agent re-running the suite
//      does not pull ~380 result lines into context each time.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initCommand } from "../src/commands.js";
import { SKILL_TASKS } from "../src/commands/skills.js";
import { buildTaskPrompt, contextBudget } from "../src/task-prompts.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

// Tasks that write files carry the run-manifest contract; onboard/prepare are
// read-only and must never gain one.
const WRITING_TASKS = ["bootstrap", "feature", "fix", "docs-sync"];
const READ_ONLY_TASKS = ["onboard", "prepare"];

async function skillsFixture(prefix) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
  await writeFile(
    path.join(cwd, "package.json"),
    `${JSON.stringify({ dependencies: { fastify: "^4.0.0" } }, null, 2)}\n`,
    { encoding: "utf8" }
  );
  const result = await initCommand({
    cwd, minimal: true, withAdapters: false, skills: true,
    type: "backend", profiles: [], agents: [], existing: "skip", write: true
  });
  assert.equal(result.result, "pass");
  return cwd;
}

test("the run-manifest contract declares its field set as complete and caps optional prose", async () => {
  const cwd = await skillsFixture("manifest-cap-");

  for (const task of WRITING_TASKS) {
    const rel = `.claude/skills/llm-wiki-${task}/SKILL.md`;
    const body = await readFile(path.join(cwd, ...rel.split("/")), "utf8");

    // The contract must say the listed fields are ALL check-run reads, so an agent
    // stops inventing extra fields (summary/actor/activeProfiles were being written
    // and never verified).
    assert.match(body, /reads no other/i, `${rel}: states the field set is the whole contract`);
    // An optional summary is allowed but bounded, and never a dumping ground.
    assert.match(body, /two sentences/i, `${rel}: caps optional summary prose`);
    assert.match(body, /never paste diffs, file contents, logs, or test output/i, `${rel}: forbids payload dumps`);
  }

  // Read-only skills have nothing to record, so they must stay manifest-free.
  for (const task of READ_ONLY_TASKS) {
    const rel = `.claude/skills/llm-wiki-${task}/SKILL.md`;
    const body = await readFile(path.join(cwd, ...rel.split("/")), "utf8");
    assert.doesNotMatch(body, /Completion contract/, `${rel}: no run manifest for a read-only skill`);
    assert.doesNotMatch(body, /two sentences/i, `${rel}: no manifest prose cap either`);
  }
});

test("every generated skill carries the context budget without weakening the read-the-source invariant", async () => {
  const cwd = await skillsFixture("context-budget-");

  for (const { slug, task } of SKILL_TASKS) {
    const body = await readFile(path.join(cwd, ".claude", "skills", slug, "SKILL.md"), "utf8");

    assert.match(body, /Context budget/, `${slug}: carries the context budget`);
    // A concrete narrowing mechanism, not just "be brief".
    assert.match(body, /line range or section/i, `${slug}: names the narrowing mechanism`);
    assert.match(body, /--max-chars/, `${slug}: points at the compact retrieval flags`);
    // The safety invariant: thrift never buys an unverified claim. task-path.js sets
    // mustReadSource for code changes and risky work — the prompt must agree.
    assert.match(body, /[Nn]ever trade evidence for brevity/, `${slug}: evidence outranks brevity`);
    assert.match(body, /read more/i, `${slug}: says to read more when narrowing is not enough`);

    // Code-changing tasks still order a real source inspection (unchanged contract).
    if (task === "feature" || task === "fix") {
      assert.match(body, /Inspect actual source files/, `${slug}: still inspects real source`);
    }
  }
});

test("contextBudget is a pure shared source reused by every task prompt", () => {
  const lines = contextBudget();
  assert.ok(Array.isArray(lines) && lines.length > 0, "returns lines");
  assert.deepEqual(contextBudget(), lines, "deterministic");
  // No machine-specific or absolute-path leakage into committed artifacts.
  for (const line of lines) {
    assert.doesNotMatch(line, /[A-Za-z]:\\|\/home\/|\/Users\//, `no absolute path in: ${line}`);
  }

  const block = lines.join("\n");
  for (const task of ["bootstrap", "feature", "fix", "refactor", "docs-sync", "onboard", "prepare", "okf-extract"]) {
    const built = buildTaskPrompt({ task, cwd: ".", projectType: "backend", profiles: ["core"] });
    assert.equal(built.result, "pass", `${task}: builds`);
    assert.ok(built.prompt.includes(block), `${task}: embeds the shared budget block verbatim`);
  }
});

test("the test suite has a quiet reporter script, and the default script keeps the full reporter", async () => {
  const pkg = JSON.parse(await readFile(path.join(REPO_ROOT, "package.json"), "utf8"));

  // A compact reporter for agent/dev re-runs: ~380 "ok <n>" lines collapse to dots.
  assert.equal(pkg.scripts["test:quiet"], "node --test --test-reporter=dot tests/*.test.js");
  // Diagnosis and CI keep the verbose default — the quiet run is additive.
  assert.equal(pkg.scripts.test, "node --test tests/*.test.js");
  assert.match(pkg.scripts.verify, /^node --test tests\/\*\.test\.js/);
});
