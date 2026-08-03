// Phase 1 `harness-health` (R0, read-only): the first command that looks at the
// HARNESS itself — adapters, skills, and the always-preloaded surface — rather
// than at wiki documents. Four checks, all warning-or-below:
//   harness.marker_drift   a managed artifact's stamped version is behind the
//                          version this package currently ships
//   harness.user_modified  a managed skill artifact no longer hashes to its own
//                          marker (hand-edited or foreign)
//   harness.preload_budget the always-loaded surface exceeds a CONFIGURED budget
//   harness.skill_too_long a skill body exceeds a CONFIGURED cap
// The two budget rules are inert until a number is supplied, on purpose: this
// repo publishes no invented token thresholds and chars/4 is a proxy.
//
// The load-bearing test here is "version-only drift": `init --refresh` compares
// bodies, not marker versions, so an artifact stamped v4 against a v5 generator
// is reported "already up to date" forever. That false negative is reproducible
// on this repo's own 24 artifacts, and it is the reason this command exists.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, writeFile, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { harnessHealthCommand, initCommand } from "../src/commands.js";
import { normalizeOptions } from "../src/index.js";
import { SKILL_TASKS, inspectSkillArtifact, skillArtifactPaths } from "../src/commands/skills.js";
import { ADAPTER_TARGETS, adapterMarkerVersion } from "../src/commands/adapters.js";
import { estimateTokens } from "../src/commands/retrieval.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKER_RE = /\n<!-- llm-wiki-generated v(\S+) ([0-9a-f]{16}) -->\n?$/;

const hash = (text) => createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);

async function makeProject(prefix) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
  await writeFile(
    path.join(cwd, "package.json"),
    `${JSON.stringify({ dependencies: { fastify: "^4.0.0" } }, null, 2)}\n`,
    { encoding: "utf8" }
  );
  return cwd;
}

// A project carrying the full harness: claude adapter + every skill format.
async function harnessFixture(prefix, extra = {}) {
  const cwd = await makeProject(prefix);
  const result = await initCommand({
    cwd,
    minimal: true,
    withAdapters: true,
    skills: true,
    type: "backend",
    profiles: [],
    agents: ["claude"],
    existing: "skip",
    write: true,
    ...extra
  });
  assert.equal(result.result, "pass");
  return cwd;
}

function options(cwd, extra = {}) {
  return normalizeOptions({ cwd, agents: ["claude"], ...extra });
}

const rules = (result, rule) => result.findings.filter((f) => f.rule === rule);

// --- the false-positive floor --------------------------------------------

test("harness-health: a freshly generated harness produces zero findings", async () => {
  const cwd = await harnessFixture("hh-clean-");
  const result = await harnessHealthCommand(options(cwd));

  assert.deepEqual(result.findings, [], `expected a clean harness to be silent, got: ${JSON.stringify(result.findings)}`);
  assert.equal(result.result, "pass");
  // It still has to REPORT, not just stay quiet: a command that sees nothing is
  // indistinguishable from a command that looked at nothing.
  assert.equal(result.adapters.length, 1);
  assert.equal(result.adapters[0].path, "CLAUDE.md");
  assert.equal(result.skills.length, SKILL_TASKS.length * 4);
  assert.ok(result.preload.estimatedTokens > 0);
});

// --- marker drift ---------------------------------------------------------

test("harness-health: reports a skill artifact stamped behind the generator, which --refresh calls up to date", async () => {
  const cwd = await harnessFixture("hh-skilldrift-");
  const target = path.join(cwd, ".claude/skills/llm-wiki-feature/SKILL.md");

  // Re-stamp with an OLDER version but a self-consistent hash: body untouched,
  // marker valid, only the version behind. This is exactly the shape of the 12
  // v4 artifacts sitting in this repo today.
  const original = await readFile(target, "utf8");
  const body = original.replace(MARKER_RE, "");
  await writeFile(target, `${body}\n<!-- llm-wiki-generated v1 ${hash(body)} -->\n`, { encoding: "utf8" });

  // The shipped refresh path cannot see it — pin that, so the test fails loudly
  // if refresh ever learns to compare versions and this command becomes redundant.
  const refresh = await initCommand({
    cwd, minimal: true, withAdapters: true, skills: true, type: "backend",
    profiles: [], agents: ["claude"], existing: "skip", dryRun: true, refresh: true
  });
  assert.ok(
    refresh.skipped.some((line) => line.includes("llm-wiki-feature/SKILL.md") && line.includes("up to date")),
    `expected --refresh to be blind to version-only drift, got: ${JSON.stringify(refresh.skipped)}`
  );

  const result = await harnessHealthCommand(options(cwd));
  const drift = rules(result, "harness.marker_drift");
  assert.equal(drift.length, 1);
  assert.equal(drift[0].severity, "warning");
  assert.equal(drift[0].path, ".claude/skills/llm-wiki-feature/SKILL.md");
  assert.match(drift[0].message, /v1/);
  assert.equal(result.result, "warning");
});

test("harness-health: reports an adapter whose marker is behind the shipped template", async () => {
  const cwd = await harnessFixture("hh-adapterdrift-");
  const target = path.join(cwd, "CLAUDE.md");

  const shipped = adapterMarkerVersion(await readFile(path.join(REPO_ROOT, "templates/adapters/claude-code/CLAUDE.md"), "utf8"));
  assert.ok(shipped !== null, "the shipped claude adapter template must carry a parseable marker");

  const original = await readFile(target, "utf8");
  await writeFile(target, original.replace(/(<!--\s*llm-wiki-adapter\s+v)\d+/, "$11"), { encoding: "utf8" });

  const result = await harnessHealthCommand(options(cwd));
  const drift = rules(result, "harness.marker_drift");
  assert.equal(drift.length, 1);
  assert.equal(drift[0].path, "CLAUDE.md");
  assert.equal(drift[0].severity, "warning");
  assert.match(drift[0].message, new RegExp(`v${shipped}`));
});

test("every shipped adapter template carries a parseable marker version", async () => {
  // The expected version is READ FROM THE TEMPLATE, so a template that loses its
  // marker would silently turn adapter drift detection off. Fail here instead.
  for (const [agent, target] of Object.entries(ADAPTER_TARGETS)) {
    const content = await readFile(target.template, "utf8");
    const version = adapterMarkerVersion(content);
    assert.ok(version !== null, `${target.template} (${agent}) has no parseable adapter marker`);
    assert.match(version, /^\d+$/);
  }
});

// --- user modification ----------------------------------------------------

test("harness-health: reports a hand-edited skill artifact", async () => {
  const cwd = await harnessFixture("hh-modified-");
  const target = path.join(cwd, ".claude/skills/llm-wiki-fix/SKILL.md");
  const original = await readFile(target, "utf8");
  await writeFile(target, original.replace(MARKER_RE, "\n\nLocal addition.\n$&"), { encoding: "utf8" });

  const result = await harnessHealthCommand(options(cwd));
  const modified = rules(result, "harness.user_modified");
  assert.equal(modified.length, 1);
  assert.equal(modified[0].path, ".claude/skills/llm-wiki-fix/SKILL.md");
  assert.equal(modified[0].severity, "warning");
});

test("harness-health: reports an artifact that carries no generation marker at all", async () => {
  // The majority case in the field, not a hypothetical: 18 of the artifacts in
  // three of the four adopter repositories were generated before markers existed
  // and carry none. `--refresh` classifies them exactly like a hand-edited file
  // ("was modified (or is not a managed artifact)") and keeps them forever, so
  // they never receive an upstream improvement again. A report that stayed
  // silent about them would call the most-drifted harnesses the cleanest.
  const cwd = await harnessFixture("hh-unmarked-");
  const target = path.join(cwd, ".llm-wiki/prompts/llm-wiki-fix.md");
  const original = await readFile(target, "utf8");
  await writeFile(target, original.replace(MARKER_RE, "\n"), { encoding: "utf8" });

  const result = await harnessHealthCommand(options(cwd));
  const modified = rules(result, "harness.user_modified");
  assert.equal(modified.length, 1);
  assert.equal(modified[0].path, ".llm-wiki/prompts/llm-wiki-fix.md");
  assert.match(modified[0].message, /no generation marker/);

  const row = result.skills.find((s) => s.path === ".llm-wiki/prompts/llm-wiki-fix.md");
  assert.equal(row.managed, false);
  assert.equal(row.userModified, true);
  // An unmarked file has no stamped version, so it must not also be counted as
  // version drift — one file, one problem, or the counts stop meaning anything.
  assert.equal(rules(result, "harness.marker_drift").length, 0);
});

test("harness-health: never claims an adapter is unmodified, because adapters carry no hash", async () => {
  // Adapters have a version marker but no content hash, so "user-modified" is
  // not decidable for them. Reporting `null` (and saying so) is the honest
  // answer; guessing from a template diff would fire on every intentionally
  // customized adapter — this repo has two.
  const cwd = await harnessFixture("hh-adapterhash-");
  const result = await harnessHealthCommand(options(cwd));
  assert.equal(result.adapters[0].userModified, null);
  assert.equal(rules(result, "harness.user_modified").length, 0);

  const original = await readFile(path.join(cwd, "CLAUDE.md"), "utf8");
  await writeFile(path.join(cwd, "CLAUDE.md"), `${original}\n\nLocal project rule.\n`, { encoding: "utf8" });
  const after = await harnessHealthCommand(options(cwd));
  assert.equal(rules(after, "harness.user_modified").length, 0);
});

// --- budgets are inert until configured -----------------------------------

test("harness-health: budget rules stay silent until a number is supplied", async () => {
  const cwd = await harnessFixture("hh-nobudget-");
  const result = await harnessHealthCommand(options(cwd));

  assert.equal(rules(result, "harness.preload_budget").length, 0);
  assert.equal(rules(result, "harness.skill_too_long").length, 0);
  assert.equal(result.preload.budget, null);
  assert.equal(result.skillTokenCap, null);
  // The measurement is reported either way — that is the point of an R0 command.
  assert.ok(result.preload.estimatedTokens > 0);
});

test("harness-health: a configured preload budget and skill cap fire as warnings", async () => {
  const cwd = await harnessFixture("hh-budget-");
  const result = await harnessHealthCommand(options(cwd, { preloadBudget: 1, skillTokenCap: 1 }));

  const preload = rules(result, "harness.preload_budget");
  assert.equal(preload.length, 1);
  assert.equal(preload[0].severity, "warning");
  assert.match(preload[0].message, /chars\/4 proxy/);

  const long = rules(result, "harness.skill_too_long");
  assert.equal(long.length, SKILL_TASKS.length * 4);
  assert.ok(long.every((f) => f.severity === "warning"));
  assert.equal(result.result, "warning");
});

test("harness-health: --strict turns the warnings into a failing result", async () => {
  const cwd = await harnessFixture("hh-strict-");
  const lax = await harnessHealthCommand(options(cwd, { preloadBudget: 1 }));
  const strict = await harnessHealthCommand(options(cwd, { preloadBudget: 1, strict: true }));
  assert.equal(lax.result, "warning");
  assert.equal(strict.result, "fail");
});

// --- R0 invariants: read-only and deterministic ---------------------------

test("harness-health: writes nothing and returns the same answer twice", async () => {
  const cwd = await harnessFixture("hh-readonly-");

  async function snapshot(dir) {
    const entries = await readdir(dir, { withFileTypes: true, recursive: true });
    const files = entries.filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? e.path, e.name)).sort();
    const out = [];
    for (const file of files) {
      const info = await stat(file);
      out.push(`${path.relative(dir, file)}:${info.size}:${info.mtimeMs}`);
    }
    return out;
  }

  const before = await snapshot(cwd);
  const first = await harnessHealthCommand(options(cwd, { preloadBudget: 10 }));
  const second = await harnessHealthCommand(options(cwd, { preloadBudget: 10 }));
  const after = await snapshot(cwd);

  assert.deepEqual(after, before, "harness-health must not touch a single file");
  assert.deepEqual(second, first, "same input must give the same output");
});

test("harness-health: reports every artifact in a stable sorted order", async () => {
  const cwd = await harnessFixture("hh-order-");
  const result = await harnessHealthCommand(options(cwd));
  const paths = result.skills.map((s) => s.path);
  assert.deepEqual(paths, [...paths].sort(), "skill rows must be sorted by path");
  assert.deepEqual(result.adapters.map((a) => a.path), [...result.adapters.map((a) => a.path)].sort());
});

// --- the JSON contract ----------------------------------------------------

test("harness-health: the JSON payload carries schemaVersion and the documented keys", async () => {
  const cwd = await harnessFixture("hh-json-");
  const result = await harnessHealthCommand(options(cwd));

  assert.equal(result.schemaVersion, 1);
  assert.equal(result.command, "harness-health");
  for (const key of ["result", "adapters", "skills", "preload", "skillTokenCap", "findingSummary", "findings", "text"]) {
    assert.ok(key in result, `missing top-level key: ${key}`);
  }
  assert.match(result.text, /LLM-WIKI Harness Health/);
  // The proxy caveat must ride with every number this command prints.
  assert.match(result.text, /chars\/4 proxy/);
});

// --- the seams this command depends on ------------------------------------

test("inspectSkillArtifact separates 'not ours', 'modified', and 'behind'", async () => {
  const cwd = await harnessFixture("hh-inspect-");
  const target = path.join(cwd, ".claude/skills/llm-wiki-prepare/SKILL.md");
  const original = await readFile(target, "utf8");

  const clean = inspectSkillArtifact(original);
  assert.equal(clean.managed, true);
  assert.equal(clean.modified, false);
  assert.equal(clean.markerVersion, clean.currentVersion);

  const foreign = inspectSkillArtifact("# just a file\n");
  assert.equal(foreign.managed, false);
  assert.equal(foreign.modified, false);
  assert.equal(foreign.markerVersion, null);

  const body = original.replace(MARKER_RE, "");
  const behind = inspectSkillArtifact(`${body}\n<!-- llm-wiki-generated v1 ${hash(body)} -->\n`);
  assert.equal(behind.managed, true);
  assert.equal(behind.modified, false);
  assert.equal(behind.markerVersion, "1");

  const edited = inspectSkillArtifact(`${body}edited\n<!-- llm-wiki-generated v1 ${hash(body)} -->\n`);
  assert.equal(edited.managed, true);
  assert.equal(edited.modified, true);
});

test("skillArtifactPaths names the four formats for a slug", () => {
  const paths = skillArtifactPaths("llm-wiki-fix");
  assert.deepEqual(paths.map((p) => p.format).sort(), ["claude", "codex", "cursor", "neutral"]);
  assert.ok(paths.some((p) => p.path === ".claude/skills/llm-wiki-fix/SKILL.md"));
  assert.ok(paths.some((p) => p.path === ".cursor/rules/llm-wiki-fix.mdc"));
});

test("harness-health: the estimated figure is the product's own chars/4 proxy", async () => {
  const cwd = await harnessFixture("hh-proxy-");
  const result = await harnessHealthCommand(options(cwd));
  const row = result.skills.find((s) => s.path === ".claude/skills/llm-wiki-fix/SKILL.md");
  const content = await readFile(path.join(cwd, ".claude/skills/llm-wiki-fix/SKILL.md"), "utf8");
  assert.equal(row.estimatedTokens, estimateTokens(content.replace(MARKER_RE, "")));
});
