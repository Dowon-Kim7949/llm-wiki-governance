// Governance modes (2026-09-07): ONE engine, three policy levels.
//
// What these tests protect, in order of how badly it hurts to get it wrong:
//
//   1. Backward compatibility. A project with no `governance` block resolves to
//      strict, whose rule floor is EMPTY, so its effective options and its report
//      output are identical to what shipped before modes existed. Silently
//      relaxing an existing project's gate would be a breaking change wearing a
//      default's clothes, and a CI job that quietly stopped failing is the worst
//      possible way to find out about a new feature.
//   2. Lite is genuinely light. Not "the findings are suppressed" — the documents
//      are never planned, the expensive scans never run, and the generated agent
//      workflow tells the agent to finish at the code. If lite still cost a
//      doc-sync pass per bug fix, the feature would be decoration.
//   3. lite -> strict works after months. This is the primary acceptance
//      criterion: a repository can sit in lite, drift, and still be escalated and
//      reconstructed from itself. The end-to-end fixture at the bottom is that
//      scenario.
//   4. Nothing fabricates history. Strict backfill recovers what the repository
//      can prove and leaves the rest labeled unknown. A plausible unverifiable
//      story is worse than an admitted gap, because the next developer acts on it.
//   5. The policy is centralized. The capability matrix is DERIVED from the
//      policies, so the published table cannot claim a capability the code does
//      not have.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DEFAULT_INIT_GOVERNANCE_MODE,
  GOVERNANCE_MODES,
  LEGACY_GOVERNANCE_MODE,
  effectiveGovernanceMode,
  getGovernancePolicy,
  governanceCapabilityMatrix,
  initGovernanceMode,
  isGovernanceMode,
  plannedWikiDocs,
  ruleSuppressed,
  suppressDomainDocs
} from "../src/governance.js";
import {
  FINDING_EXPLANATIONS,
  NON_TOGGLEABLE_CATEGORIES,
  PRESET_DIALABLE_ERROR_RULES,
  RULE_PRESETS,
  findingCategory
} from "../src/commands/findings.js";
import { loadProjectConfig, mergeConfigIntoOptions } from "../src/config-file.js";
import { applyProjectConfig, parseArgs } from "../src/cli.js";
import {
  audit,
  backfillCommand,
  handoffCommand,
  impactCommand,
  initCommand,
  modeCommand,
  promptCommand,
  validateCommand
} from "../src/commands.js";
import { buildTaskPrompt, governanceBudget } from "../src/task-prompts.js";
import * as api from "../src/index.js";
import { handleMessage } from "../src/mcp/dispatch.js";

const CONFIG_FILENAME = "llm-wiki.config.json";

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

async function project(prefix, { config = null, packageJson = { name: prefix } } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`, { encoding: "utf8" });
  if (config) await writeFile(path.join(cwd, CONFIG_FILENAME), `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8" });
  return cwd;
}

async function readConfig(cwd) {
  return JSON.parse(await readFile(path.join(cwd, CONFIG_FILENAME), "utf8"));
}

async function fileExists(target) {
  try { await readFile(target); return true; } catch { return false; }
}

// ---------------------------------------------------------------------------
// 1. Configuration
// ---------------------------------------------------------------------------

test("config: no governance block resolves to the legacy mode, and legacy contributes an EMPTY rule floor", async () => {
  const cwd = await project("gov-legacy-");
  const { options } = await api.resolveOptions({ cwd });

  assert.equal(options.governanceMode, LEGACY_GOVERNANCE_MODE);
  assert.equal(options.governanceMode, "strict");
  assert.equal(options.governanceModeSource, "default");
  // The whole backward-compatibility contract in one assertion: strict adds
  // nothing, so an existing project's effective rules are what they always were.
  assert.deepEqual(options.rules, {});
  assert.deepEqual(getGovernancePolicy("strict").rules, {});
});

test("config: each mode parses and contributes its own rule floor", async () => {
  for (const mode of GOVERNANCE_MODES) {
    const cwd = await project(`gov-parse-${mode}-`, { config: { governance: { mode } } });
    const loaded = await loadProjectConfig(cwd);
    assert.deepEqual(loaded.errors, [], `${mode}: parses without error`);
    assert.equal(loaded.config.governance.mode, mode);

    const { options, errors } = await api.resolveOptions({ cwd });
    assert.deepEqual(errors, []);
    assert.equal(options.governanceMode, mode);
    assert.equal(options.governanceModeSource, "config");
    assert.deepEqual(options.rules, { ...getGovernancePolicy(mode).rules });
  }
});

test("config: an unknown governance.mode is a config ERROR on all three surfaces, never a silent fallback", async () => {
  const cwd = await project("gov-bad-", { config: { governance: { mode: "turbo" } } });

  const loaded = await loadProjectConfig(cwd);
  assert.equal(loaded.config.governance, undefined, "a rejected value is not carried into the config");
  assert.match(loaded.errors.join(" "), /governance\.mode.*lite, standard, strict/);

  // CLI seam: main() exits 3 on any applyProjectConfig error.
  const { errors: cliErrors } = await applyProjectConfig(api.normalizeOptions({ cwd }));
  assert.ok(cliErrors.length > 0);
  assert.match(cliErrors.join(" "), /governance\.mode/);

  // Programmatic API.
  const { errors: apiErrors } = await api.resolveOptions({ cwd });
  assert.ok(apiErrors.length > 0);

  // MCP surfaces it as an isError tool result rather than running anyway.
  const res = await handleMessage(
    { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "audit", arguments: { cwd } } },
    {}
  );
  assert.equal(res.result.isError, true);
  assert.match(res.result.content[0].text, /governance\.mode/);
});

test("config: a non-object governance value is rejected, and an empty governance block is accepted", async () => {
  const bad = await project("gov-shape-", { config: { governance: "strict" } });
  assert.match((await loadProjectConfig(bad)).errors.join(" "), /"governance" must be an object/);

  const empty = await project("gov-empty-", { config: { governance: {} } });
  const loaded = await loadProjectConfig(empty);
  assert.deepEqual(loaded.errors, []);
  assert.equal(loaded.config.governance, undefined, "a governance block with no mode sets nothing");
});

test("CLI: --mode is validated at parse time and only accepted where it applies", () => {
  const ok = parseArgs(["audit", "--mode", "lite"]);
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.options.mode, "lite");

  const bad = parseArgs(["audit", "--mode", "turbo"]);
  assert.match(bad.errors.join(" "), /Unsupported governance mode: turbo/);

  const wrongCommand = parseArgs(["review", "--mode", "lite"]);
  assert.match(wrongCommand.errors.join(" "), /--mode is not supported by review/);
});

test("CLI: mode set requires a valid level, and rejects an unknown sub-action", () => {
  const show = parseArgs(["mode"]);
  assert.deepEqual(show.errors, []);
  assert.equal(show.options.modeAction, null);

  const set = parseArgs(["mode", "set", "strict", "--write"]);
  assert.deepEqual(set.errors, []);
  assert.equal(set.options.modeAction, "set");
  assert.equal(set.options.mode, "strict");
  assert.equal(set.options.write, true);

  assert.match(parseArgs(["mode", "set"]).errors.join(" "), /Missing required argument for mode set/);
  assert.match(parseArgs(["mode", "reset", "lite"]).errors.join(" "), /Unknown mode action: reset/);

  // An invalid level reports ONE error, not that plus a contradictory
  // "Missing required argument" for the value the user did supply.
  const badLevel = parseArgs(["mode", "set", "turbo"]);
  assert.deepEqual(badLevel.errors, ["Unsupported governance mode: turbo (supported: lite, standard, strict)."]);
});

test("precedence: mode floor < rulesPreset < explicit rules, key by key", async () => {
  const cwd = await project("gov-precedence-", {
    config: {
      governance: { mode: "lite" },
      rulesPreset: "strict",
      rules: { "evidence.stale": "error" }
    }
  });
  const { options, errors } = await api.resolveOptions({ cwd });
  assert.deepEqual(errors, []);

  // Explicit `rules` wins over both.
  assert.equal(options.rules["evidence.stale"], "error");
  // The preset wins over the mode floor (lite would have turned this off).
  assert.equal(options.rules["evidence.missing"], "error");
  // The mode floor still supplies what neither of the others named.
  assert.equal(options.rules["encoding.bom"], "off");
});

test("precedence: an explicit --mode beats the config file and says so", async () => {
  const cwd = await project("gov-cli-wins-", { config: { governance: { mode: "strict" } } });
  const { options } = await api.resolveOptions({ cwd, mode: "lite" });
  assert.equal(options.governanceMode, "lite");
  assert.equal(options.governanceModeSource, "cli");
});

// ---------------------------------------------------------------------------
// 2. The centralized policy layer
// ---------------------------------------------------------------------------

test("policy: the mode set is exactly lite/standard/strict and every policy is frozen", () => {
  assert.deepEqual([...GOVERNANCE_MODES], ["lite", "standard", "strict"]);
  assert.ok(Object.isFrozen(GOVERNANCE_MODES));
  for (const mode of GOVERNANCE_MODES) {
    const policy = getGovernancePolicy(mode);
    assert.ok(Object.isFrozen(policy), `${mode}: policy frozen`);
    assert.ok(Object.isFrozen(policy.rules), `${mode}: rule floor frozen`);
    assert.equal(policy.mode, mode);
    assert.ok(policy.intent.trim(), `${mode}: has an intent`);
    assert.ok(policy.summary.trim(), `${mode}: has a summary`);
  }
  assert.ok(!isGovernanceMode("turbo"));
  assert.ok(!isGovernanceMode(null));
});

// The same invariant RULE_PRESETS carries, for the same reason: a mode may dial the
// advisory rules freely, must never touch a safety rule or a `blocked` default, and
// may touch an `error` default only via the documented allow-list.
test("policy: every mode rule floor is registry-valid and never touches safety or blocked defaults", () => {
  for (const mode of GOVERNANCE_MODES) {
    for (const [rule, action] of Object.entries(getGovernancePolicy(mode).rules)) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(FINDING_EXPLANATIONS, rule),
        `mode ${mode} names unknown rule ${rule}`
      );
      assert.ok(
        !NON_TOGGLEABLE_CATEGORIES.has(findingCategory(rule)),
        `mode ${mode} must never touch safety rule ${rule}`
      );
      const defaultSeverity = FINDING_EXPLANATIONS[rule].defaultSeverity;
      const dialable = defaultSeverity === "warning"
        || defaultSeverity === "info"
        || (defaultSeverity === "error" && PRESET_DIALABLE_ERROR_RULES.includes(rule));
      assert.ok(dialable, `mode ${mode} must not touch ${rule} (default severity ${defaultSeverity})`);
      assert.ok(["off", "info", "warning", "error", "blocked"].includes(action), `${mode}/${rule}: valid action`);
    }
  }
  // Lite only ever relaxes. A mode that ESCALATED something would be a different
  // feature than the one documented.
  for (const [rule, action] of Object.entries(getGovernancePolicy("lite").rules)) {
    assert.ok(action === "off" || action === "info", `lite must relax, not escalate ${rule} (${action})`);
  }
  // Standard keeps the detection and drops the block: not off, not error.
  assert.equal(getGovernancePolicy("standard").rules["impact.source_changed"], "warning");
});

test("policy: the published capability matrix is DERIVED from the policies, not hand-written", () => {
  const matrix = governanceCapabilityMatrix();
  assert.ok(matrix.length > 0);
  for (const row of matrix) {
    assert.ok(row.capability.trim(), "every row names a capability");
    for (const mode of GOVERNANCE_MODES) {
      assert.equal(typeof row.values[mode], "string", `${row.capability}/${mode}: has a value`);
      assert.ok(row.values[mode].length > 0);
    }
    if (!row.field) continue;
    // A row backed by a policy field must not disagree with that field.
    const distinct = new Set(GOVERNANCE_MODES.map((mode) => String(getGovernancePolicy(mode)[row.field])));
    const rendered = new Set(GOVERNANCE_MODES.map((mode) => row.values[mode]));
    assert.equal(rendered.size, distinct.size, `${row.capability}: renders as many distinct values as the policies have`);
  }
});

test("policy: planned document scope is core-only in lite and full in standard/strict", () => {
  const core = plannedWikiDocs({ projectType: "library", mode: "lite" });
  const full = plannedWikiDocs({ projectType: "library", mode: "strict" });
  assert.ok(core.length > 0 && core.length < full.length, "lite plans strictly fewer documents");
  assert.deepEqual(plannedWikiDocs({ projectType: "library", mode: "standard" }), full);
  assert.ok(core.includes("docs/llm-wiki/index.md"), "lite keeps the entrypoint");
  assert.ok(core.includes("docs/llm-wiki/GLOSSARY.md"), "lite keeps the domain vocabulary");
  assert.ok(
    core.includes("docs/llm-wiki/templates/DECISION_LOG.template.md"),
    "lite keeps ADR support — decisions are exactly the knowledge code cannot re-derive"
  );
  assert.ok(!core.includes("docs/llm-wiki/PUBLIC_API.md"), "lite does not plan the profile document set");
  // --minimal predates modes and keeps meaning core-only regardless of level.
  assert.deepEqual(plannedWikiDocs({ projectType: "library", minimal: true, mode: "strict" }), core);
});

test("policy: domain docs are suppressed by lite, but an explicit --domains always wins", () => {
  assert.equal(suppressDomainDocs({ governanceMode: "lite", domains: [] }), true);
  assert.equal(suppressDomainDocs({ governanceMode: "lite", domains: ["billing"] }), false);
  assert.equal(suppressDomainDocs({ governanceMode: "strict", domains: [] }), false);
  assert.equal(suppressDomainDocs({ governanceMode: "strict", minimal: true, domains: [] }), true);
});

test("policy: options built WITHOUT the config merge fall back to legacy, so no existing caller changes behavior", () => {
  assert.equal(effectiveGovernanceMode({}), LEGACY_GOVERNANCE_MODE);
  assert.equal(effectiveGovernanceMode(undefined), LEGACY_GOVERNANCE_MODE);
  assert.equal(effectiveGovernanceMode({ mode: "lite" }), "lite");
  assert.equal(effectiveGovernanceMode({ governanceMode: "standard" }), "standard");
  assert.equal(getGovernancePolicy("nonsense").mode, LEGACY_GOVERNANCE_MODE, "an unknown mode never throws mid-command");
});

test("policy: the new-project default and the legacy default are deliberately different", () => {
  assert.equal(DEFAULT_INIT_GOVERNANCE_MODE, "lite");
  assert.equal(LEGACY_GOVERNANCE_MODE, "strict");

  // A brand-new project: nothing on disk to preserve.
  assert.equal(initGovernanceMode({}, { configPresent: false, wikiInitialized: false }), "lite");
  // A project that already has a config, or already has a wiki, was governed by the
  // pre-modes contract and keeps behaving that way.
  assert.equal(initGovernanceMode({}, { configPresent: true, wikiInitialized: false }), "strict");
  assert.equal(initGovernanceMode({}, { configPresent: false, wikiInitialized: true }), "strict");
  // A recorded mode is honored even when the config merge never ran.
  assert.equal(initGovernanceMode({}, { configMode: "lite", configPresent: true, wikiInitialized: true }), "lite");
  // An explicit --mode beats everything.
  assert.equal(initGovernanceMode({ mode: "standard" }, { configPresent: true, wikiInitialized: true }), "standard");
});

test("policy: ruleSuppressed reads the EFFECTIVE map, so a hand-written rule earns the same cost saving as a mode", () => {
  assert.equal(ruleSuppressed({ rules: { "evidence.stale": "off" } }, "evidence.stale"), true);
  assert.equal(ruleSuppressed({ rules: { "evidence.stale": "info" } }, "evidence.stale"), false);
  assert.equal(ruleSuppressed({ rules: {} }, "evidence.stale"), false);
  assert.equal(ruleSuppressed({}, "evidence.stale"), false);
});

// ---------------------------------------------------------------------------
// 3. Mode switching
// ---------------------------------------------------------------------------

test("mode: the read path reports the effective level, its source, and the capability matrix", async () => {
  const cwd = await project("gov-report-", { config: { type: "library", governance: { mode: "lite" } } });
  const { options } = await api.resolveOptions({ cwd });
  const result = await modeCommand(options);

  assert.equal(result.command, "mode");
  assert.equal(result.result, "pass");
  assert.equal(result.mode, "lite");
  assert.equal(result.source, "config");
  assert.equal(result.written, false);
  assert.deepEqual(result.planned, []);
  assert.equal(result.policy.mode, "lite");
  assert.equal(result.policy.rules["evidence.stale"], "off");
  assert.ok(result.capabilities.length > 0);
  assert.match(result.text, /Capability Matrix/);
  assert.match(result.text, /llm-wiki mode set <lite\|standard\|strict> --write/);
});

test("mode set: previews without --write and writes nothing", async () => {
  const cwd = await project("gov-preview-", { config: { type: "library", governance: { mode: "lite" } } });
  const before = await readFile(path.join(cwd, CONFIG_FILENAME), "utf8");
  const { options } = await api.resolveOptions({ cwd, modeAction: "set", mode: "strict" });
  const result = await modeCommand(options);

  assert.equal(result.result, "ready");
  assert.equal(result.written, false);
  assert.equal(result.requestedMode, "strict");
  assert.equal(result.planned.length, 1);
  assert.match(result.text, /Re-run with: llm-wiki mode set strict --write/);
  assert.equal(await readFile(path.join(cwd, CONFIG_FILENAME), "utf8"), before, "the config is untouched");
});

test("mode set --write: changes ONLY governance.mode and preserves every other key", async () => {
  const cwd = await project("gov-write-", {
    config: { type: "library", agents: ["claude"], rulesPreset: "relaxed", governance: { mode: "lite" }, futureKey: { keep: true } }
  });
  const { options } = await api.resolveOptions({ cwd, modeAction: "set", mode: "strict", write: true });
  const result = await modeCommand(options);

  assert.equal(result.result, "pass");
  assert.equal(result.written, true);
  assert.equal(result.mode, "strict");

  const config = await readConfig(cwd);
  assert.equal(config.governance.mode, "strict");
  assert.equal(config.type, "library");
  assert.deepEqual(config.agents, ["claude"]);
  assert.equal(config.rulesPreset, "relaxed");
  // A key this version does not know about survives the rewrite.
  assert.deepEqual(config.futureKey, { keep: true });
});

test("mode set --write: creates the config when the project has none, and adds the key when it has one", async () => {
  const fresh = await project("gov-create-");
  const created = await modeCommand((await api.resolveOptions({ cwd: fresh, modeAction: "set", mode: "lite", write: true })).options);
  assert.equal(created.written, true);
  assert.deepEqual(await readConfig(fresh), { governance: { mode: "lite" } });

  const existing = await project("gov-addkey-", { config: { type: "backend" } });
  await modeCommand((await api.resolveOptions({ cwd: existing, modeAction: "set", mode: "standard", write: true })).options);
  assert.deepEqual(await readConfig(existing), { type: "backend", governance: { mode: "standard" } });
});

test("mode set: every transition is supported and the report names what actually changes", async () => {
  const transitions = [["lite", "standard"], ["standard", "strict"], ["strict", "lite"], ["lite", "strict"]];
  for (const [from, to] of transitions) {
    const cwd = await project(`gov-t-${from}-${to}-`, { config: { governance: { mode: from } } });
    const { options } = await api.resolveOptions({ cwd, modeAction: "set", mode: to, write: true });
    const result = await modeCommand(options);

    assert.equal(result.written, true, `${from} -> ${to}: written`);
    assert.equal((await readConfig(cwd)).governance.mode, to, `${from} -> ${to}: persisted`);
    assert.equal(result.transition[0], `${from} -> ${to}`);
    // The consequence a user needs, not just the label: which rules moved.
    const before = getGovernancePolicy(from).rules;
    const after = getGovernancePolicy(to).rules;
    for (const rule of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if ((before[rule] ?? "registry default") === (after[rule] ?? "registry default")) continue;
      assert.ok(
        result.transition.some((line) => line.includes(`rule ${rule}:`)),
        `${from} -> ${to}: transition names the change to ${rule}`
      );
    }
  }
});

test("mode set: escalating to strict runs NO scan and creates NO document (hidden expensive work is the failure mode)", async () => {
  const cwd = await project("gov-noscan-", { config: { governance: { mode: "lite" } } });
  const result = await modeCommand((await api.resolveOptions({ cwd, modeAction: "set", mode: "strict", write: true })).options);

  assert.equal(result.written, true);
  assert.deepEqual(result.findings, [], "a mode change produces no findings: it scanned nothing");
  assert.equal(result.wikiGraph, undefined, "a mode change collects no wiki graph");
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "index.md")), false, "no document was generated");
  // And it points at the explicit command that DOES do the expensive work.
  assert.match(result.text, /llm-wiki backfill/);
});

test("mode set: a malformed config is refused, not rewritten", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-gov-broken-"));
  const raw = "{ \"type\": \"library\", }\n";
  await writeFile(path.join(cwd, CONFIG_FILENAME), raw, { encoding: "utf8" });

  const result = await modeCommand(api.normalizeOptions({ cwd, modeAction: "set", mode: "strict", write: true }));
  assert.equal(result.result, "blocked");
  assert.equal(result.written, false);
  assert.ok(result.findings.some((finding) => finding.rule === "structure.config_invalid"));
  assert.equal(await readFile(path.join(cwd, CONFIG_FILENAME), "utf8"), raw, "the unparseable file is left exactly as it was");
});

test("mode: is exposed over MCP as a read-only tool, with no way to reach the set sub-action", async () => {
  const cwd = await project("gov-mcp-", { config: { governance: { mode: "standard" } } });
  const listed = await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/list" }, {});
  const tool = listed.result.tools.find((entry) => entry.name === "mode");
  assert.ok(tool, "mode is published over MCP");
  assert.deepEqual(Object.keys(tool.inputSchema.properties), ["cwd"], "only cwd is accepted");
  assert.equal(tool.inputSchema.additionalProperties, false);

  const ok = await handleMessage({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "mode", arguments: { cwd } } }, {});
  assert.equal(ok.result.isError, false);
  assert.equal(ok.result.structuredContent.mode, "standard");
  assert.equal(ok.result.structuredContent.written, false);

  // The write path is unreachable: unknown arguments are a protocol error.
  const refused = await handleMessage(
    { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "mode", arguments: { cwd, modeAction: "set", mode: "lite", write: true } } },
    {}
  );
  assert.equal(refused.error.code, -32602);
});

// ---------------------------------------------------------------------------
// 4. Lite is genuinely light
// ---------------------------------------------------------------------------

test("lite: a brand-new init defaults to lite, plans the core documents only, and records the level", async () => {
  const cwd = await project("gov-init-new-", { packageJson: { name: "fresh", dependencies: { vue: "^3.0.0" } } });
  const { options } = await api.resolveOptions({ cwd, write: true, existing: "skip", agents: [], profiles: [], type: null });
  const result = await initCommand(options);

  assert.equal(result.result, "pass");
  assert.equal((await readConfig(cwd)).governance.mode, "lite", "the scaffolded config records the level it planned for");
  assert.ok(await fileExists(path.join(cwd, "docs", "llm-wiki", "index.md")), "core docs are created");
  assert.ok(await fileExists(path.join(cwd, "docs", "llm-wiki", "GLOSSARY.md")));
  // The heavy per-surface documents a fast-moving project never asked for.
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "WCAG.md")), false);
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "COMPONENT_INVENTORY.md")), false);
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "E2E_WORKFLOWS.md")), false);
});

test("lite: an existing project with no governance block keeps the pre-modes document set", async () => {
  // The migration guarantee, from init's side: a config file already exists, so
  // this is not a new project and nothing narrows.
  const cwd = await project("gov-init-legacy-", { config: { type: "library" }, packageJson: { name: "legacy", bin: { legacy: "./bin/x.js" } } });
  const { options } = await api.resolveOptions({ cwd, write: true, existing: "skip", agents: [], profiles: [], type: null });
  await initCommand(options);

  assert.ok(await fileExists(path.join(cwd, "docs", "llm-wiki", "PUBLIC_API.md")), "profile docs still planned for a legacy project");
  assert.ok(await fileExists(path.join(cwd, "docs", "llm-wiki", "VERSIONING.md")));
});

test("lite: a missing planned document is not a warning, and the profile documents are not 'missing' at all", async () => {
  const cwd = await project("gov-lite-audit-", { config: { governance: { mode: "lite" }, type: "library" } });
  const { options } = await api.resolveOptions({ cwd, write: true, existing: "skip", agents: [], profiles: [], type: null });
  await initCommand(options);

  const liteAudit = await audit((await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] })).options);
  const missing = liteAudit.findings.filter((finding) => finding.rule === "structure.required_doc");
  assert.deepEqual(missing, [], "lite never expected the profile documents, so none are reported missing");
  assert.ok(
    liteAudit.findings.every((finding) => finding.severity !== "error" && finding.severity !== "blocked"),
    "an ordinary lite project is not failing its own audit"
  );

  // The same repository, graded as strict, DOES want them — the documents were not
  // silenced, they were never planned.
  const strictAudit = await audit((await api.resolveOptions({ cwd, mode: "strict", type: null, profiles: [], agents: [] })).options);
  assert.ok(
    strictAudit.findings.some((finding) => finding.rule === "structure.required_doc"),
    "strict reports the same repository as incomplete"
  );
});

test("lite: the freshness and omission rules produce nothing, so ordinary work is never gated on documentation", async (t) => {
  if (!hasGit()) return t.skip("git unavailable");
  const cwd = await driftedRepo("gov-lite-drift-", { governance: { mode: "lite" } });

  const liteAudit = await audit((await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] })).options);
  assert.deepEqual(liteAudit.findings.filter((finding) => finding.rule === "evidence.stale"), []);

  const liteImpact = await impactCommand((await api.resolveOptions({ cwd, since: "HEAD~1" })).options);
  assert.deepEqual(liteImpact.findings, [], "the reverse-impact scan contributes nothing in lite");
  assert.equal(liteImpact.result, "pass");

  // Proof that this is policy and not a broken fixture: strict finds both.
  const strictAudit = await audit((await api.resolveOptions({ cwd, mode: "strict", type: null, profiles: [], agents: [] })).options);
  assert.ok(strictAudit.findings.some((finding) => finding.rule === "evidence.stale"), "strict sees the drift");
  const strictImpact = await impactCommand((await api.resolveOptions({ cwd, mode: "strict", since: "HEAD~1" })).options);
  assert.equal(strictImpact.result, "fail");
  assert.ok(strictImpact.findings.some((finding) => finding.rule === "impact.source_changed"));
});

test("lite: the generated work prompts tell the agent to finish at the code", () => {
  const lite = buildTaskPrompt({ task: "fix", cwd: ".", projectType: "backend", profiles: [], governanceMode: "lite" });
  assert.match(lite.prompt, /Governance budget \(lite/);
  assert.ok(lite.prompt.includes("no wiki change needed (lite)"), "names the complete-without-docs outcome");
  assert.match(lite.prompt, /Do NOT touch the wiki for an ordinary change/);
  assert.match(lite.prompt, /Never run a repository-wide audit, a drift scan, or document generation/);
  // The exception that keeps lite useful rather than merely cheap.
  assert.match(lite.prompt, /knowledge an agent cannot re-derive from the code/);

  const strict = buildTaskPrompt({ task: "fix", cwd: ".", projectType: "backend", profiles: [], governanceMode: "strict" });
  assert.match(strict.prompt, /Governance budget \(strict/);
  assert.ok(!strict.prompt.includes("no wiki change needed (lite)"));
  assert.match(strict.prompt, /Update every affected document in the same task/);

  const standard = buildTaskPrompt({ task: "feature", cwd: ".", projectType: "backend", profiles: [], governanceMode: "standard" });
  assert.match(standard.prompt, /Governance budget \(standard/);
  assert.match(standard.prompt, /Skip the doc work for a local refactor/);
});

test("lite: the governance budget is deterministic, path-free, and carries no numbered micro-steps", () => {
  for (const mode of GOVERNANCE_MODES) {
    const lines = governanceBudget(mode);
    assert.ok(Array.isArray(lines) && lines.length > 0, `${mode}: returns lines`);
    assert.deepEqual(governanceBudget(mode), lines, `${mode}: deterministic`);
    for (const line of lines) {
      assert.doesNotMatch(line, /[A-Za-z]:\\|\/home\/|\/Users\//, `${mode}: no absolute path in: ${line}`);
    }
    assert.doesNotMatch(lines.join("\n"), /^\s*\d+\.\s/m, `${mode}: no numbered steps`);
    // Every mode says where the level came from, so a stale generated skill is
    // recognizable as stale instead of quietly authoritative.
    assert.match(lines.join("\n"), /Generated for governance mode/);
    assert.match(lines.join("\n"), /--skills --refresh/);
  }
  // An unknown mode renders the legacy block rather than throwing inside a prompt.
  assert.deepEqual(governanceBudget("turbo"), governanceBudget(LEGACY_GOVERNANCE_MODE));
});

test("lite: the read-only and reconstruction workflows deliberately carry NO governance budget", () => {
  for (const task of ["onboard", "prepare", "okf-extract"]) {
    const built = buildTaskPrompt({ task, cwd: ".", projectType: "backend", profiles: [], governanceMode: "lite" });
    assert.doesNotMatch(built.prompt, /Governance budget/, `${task}: read-only work is not doc-sync work`);
  }
  // backfill is the exhaustive reconstruction: a lite budget telling it to skip the
  // wiki would contradict the command the user typed to rebuild the wiki.
  const backfill = buildTaskPrompt({ task: "backfill", cwd: ".", projectType: "backend", profiles: [], governanceMode: "lite" });
  assert.doesNotMatch(backfill.prompt, /Governance budget/);
});

// ---------------------------------------------------------------------------
// 5. Standard is a real middle ground
// ---------------------------------------------------------------------------

test("standard: the omission gate reports without failing the build, and the documents stay tracked", async (t) => {
  if (!hasGit()) return t.skip("git unavailable");
  const cwd = await driftedRepo("gov-standard-", { governance: { mode: "standard" } });

  const impact = await impactCommand((await api.resolveOptions({ cwd, since: "HEAD~1" })).options);
  assert.equal(impact.result, "warning", "standard reports the omission");
  assert.ok(impact.findings.some((finding) => finding.rule === "impact.source_changed" && finding.severity === "warning"));
  assert.ok(
    !impact.findings.some((finding) => finding.severity === "error"),
    "standard does not fail an ordinary build on a documentation omission"
  );

  // --strict is still the way a project opts that gate back in per pipeline.
  const gated = await impactCommand((await api.resolveOptions({ cwd, since: "HEAD~1", strict: true })).options);
  assert.ok(gated.findings.some((finding) => finding.rule === "impact.source_changed"));
});

test("standard: plans the profile and per-domain documents lite skips", async () => {
  const cwd = await project("gov-standard-docs-", { config: { governance: { mode: "standard" }, type: "library" } });
  const { options } = await api.resolveOptions({ cwd, write: true, existing: "skip", agents: [], profiles: [], type: null });
  await initCommand(options);
  assert.ok(await fileExists(path.join(cwd, "docs", "llm-wiki", "PUBLIC_API.md")));
  assert.ok(await fileExists(path.join(cwd, "docs", "llm-wiki", "VERSIONING.md")));
});

// ---------------------------------------------------------------------------
// 6. Strict is unchanged from what shipped before modes
// ---------------------------------------------------------------------------

test("strict: an explicit strict config is byte-identical to no governance block at all", async () => {
  const build = async (config) => {
    const cwd = await project("gov-identical-", { config, packageJson: { name: "same", bin: { same: "./bin/x.js" } } });
    const init = await api.resolveOptions({ cwd, write: true, existing: "skip", agents: [], profiles: [], type: null });
    await initCommand(init.options);
    const { options } = await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] });
    const result = await validateCommand(options);
    // cwd differs per fixture; everything else must match.
    return JSON.stringify({ ...result, text: result.text.replace(new RegExp(cwd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), "<cwd>") });
  };

  assert.equal(
    await build({ type: "library", governance: { mode: "strict" } }),
    await build({ type: "library" }),
    "declaring strict must change nothing — that is what makes it a safe migration default"
  );
});

// ---------------------------------------------------------------------------
// 7. Backfill: recover what is provable, name what is not
// ---------------------------------------------------------------------------

test("backfill: reports inventory, coverage, and a three-label ledger, and writes nothing by default", async () => {
  const cwd = await project("gov-backfill-read-", { config: { governance: { mode: "strict" }, type: "library" } });
  const { options } = await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] });
  const result = await backfillCommand(options);

  assert.equal(result.command, "backfill");
  assert.equal(result.write, false);
  assert.equal(result.mode, "strict");
  assert.deepEqual(result.created, []);
  assert.ok(result.inventory, "reports what the repository contains");
  assert.ok(result.coverage, "reports what the wiki covers");
  assert.ok(Array.isArray(result.ledger.verified));
  assert.ok(Array.isArray(result.ledger.inferred));
  assert.ok(Array.isArray(result.ledger.unknown));
  assert.ok(result.readiness.total > 0 && result.readiness.checks.length === result.readiness.total);
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "index.md")), false, "a read-only backfill creates nothing");
  assert.match(result.text, /Evidence Ledger/);
  assert.match(result.text, /Handoff Readiness/);
  assert.match(result.text, /Backfill Prompt/);
});

test("backfill: unrecoverable history stays unknown and is never reconstructed", async () => {
  const cwd = await project("gov-backfill-unknown-", { config: { governance: { mode: "strict" }, type: "library" } });
  await initCommand((await api.resolveOptions({ cwd, mode: "strict", write: true, existing: "skip", agents: [], profiles: [], type: null })).options);
  const result = await backfillCommand((await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] })).options);

  const unknown = result.ledger.unknown.join("\n");
  assert.match(unknown, /Original architectural rationale/, "the gap is named");
  assert.match(unknown, /not recoverable from this repository/);
  assert.ok(
    result.findings.some((finding) => finding.rule === "backfill.unknown_history" && finding.severity === "info"),
    "and it is reported as a finding, not buried"
  );
  assert.ok(
    result.readiness.incomplete.includes("decision_history"),
    "readiness records that a receiving developer will not be told why"
  );
  // The check must say so itself: writing more text cannot close it.
  const check = result.readiness.checks.find((entry) => entry.key === "decision_history");
  assert.match(check.detail, /cannot be closed by generating text/);

  // Nothing in the CLI's own output asserts a REASON for anything.
  for (const line of [...result.ledger.verified, ...result.ledger.inferred]) {
    assert.doesNotMatch(line, /\b(because|in order to|was chosen (for|to)|due to)\b/i, `ledger line asserts a rationale: ${line}`);
  }
});

test("backfill: the ledger keeps inferred signals labeled as inferred", async () => {
  const cwd = await project("gov-backfill-labels-", {
    config: { governance: { mode: "strict" } },
    packageJson: { name: "labels", dependencies: { fastify: "^4.0.0" } }
  });
  await mkdir(path.join(cwd, "src", "domains", "billing"), { recursive: true });
  await writeFile(path.join(cwd, "src", "domains", "billing", "index.js"), "export const rate = 1;\n", { encoding: "utf8" });
  await initCommand((await api.resolveOptions({ cwd, mode: "strict", write: true, existing: "skip", agents: [], profiles: [], type: null })).options);

  const result = await backfillCommand((await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] })).options);
  const inferred = result.ledger.inferred.join("\n");
  if (result.inventory.domainPlans.length > 0) {
    assert.match(inferred, /inferred from directory\/route boundaries only/);
    assert.match(inferred, /The BOUNDARY is evidence; the business meaning of each domain is not/);
  }
  // Detector confidence below "high" is stated as inferred, never as fact.
  if (result.inventory.confidence !== "high") {
    assert.match(inferred, /Project type: .*inferred from partial signals/);
  }
});

test("backfill --write: creates the missing planned documents as needs_review stubs, and nothing else", async () => {
  // No `agents` in the config on purpose: config `agents` refills an empty
  // options.agents, so a claude entry here would have the FIRST init write
  // CLAUDE.md and make the adapter assertion below meaningless.
  const cwd = await project("gov-backfill-write-", {
    config: { governance: { mode: "lite" }, type: "library" },
    packageJson: { name: "bf", bin: { bf: "./bin/x.js" } }
  });
  // A lite wiki: core docs only.
  await initCommand((await api.resolveOptions({ cwd, write: true, existing: "skip", agents: [], profiles: [], type: null })).options);
  const indexBefore = await readFile(path.join(cwd, "docs", "llm-wiki", "index.md"), "utf8");

  // Escalate, then reconstruct.
  const result = await backfillCommand((await api.resolveOptions({ cwd, mode: "strict", write: true, existing: "skip", type: null, profiles: [], agents: [] })).options);

  assert.equal(result.write, true);
  assert.ok(result.created.length > 0, "the missing profile documents were created");
  const publicApi = path.join(cwd, "docs", "llm-wiki", "PUBLIC_API.md");
  assert.ok(await fileExists(publicApi));
  const body = await readFile(publicApi, "utf8");
  assert.match(body, /^status: needs_review$/m, "a reconstructed stub is never verified");
  assert.match(body, /^source_files:$/m, "the stub carries a source mapping to rebuild");

  // Existing content is untouched, and the harness is not re-provisioned.
  assert.equal(await readFile(path.join(cwd, "docs", "llm-wiki", "index.md"), "utf8"), indexBefore, "existing docs are never overwritten");
  assert.equal(await fileExists(path.join(cwd, "CLAUDE.md")), false, "backfill writes no adapter files");
  assert.equal(await fileExists(path.join(cwd, ".claude", "skills", "llm-wiki-feature", "SKILL.md")), false, "backfill writes no skills");
  // The append-only log survives even under an explicit overwrite policy.
  const overwrite = await backfillCommand((await api.resolveOptions({ cwd, mode: "strict", write: true, existing: "overwrite", type: null, profiles: [], agents: [] })).options);
  assert.ok(overwrite.skipped.some((line) => line.includes("log.md") && /append-only/.test(line)));
});

test("backfill --strict: an incomplete readiness report is a build failure", async () => {
  const cwd = await project("gov-backfill-gate-", { config: { governance: { mode: "strict" }, type: "library" } });
  await initCommand((await api.resolveOptions({ cwd, mode: "strict", write: true, existing: "skip", agents: [], profiles: [], type: null })).options);

  const advisory = await backfillCommand((await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] })).options);
  assert.ok(advisory.findings.some((finding) => finding.rule === "backfill.not_ready" && finding.severity === "warning"));
  assert.equal(advisory.result, "warning", "without --strict it reports");

  const gated = await backfillCommand((await api.resolveOptions({ cwd, strict: true, type: null, profiles: [], agents: [] })).options);
  // exitCodeFor maps a warning under --strict to exit 1; the finding is what it reads.
  assert.ok(gated.findings.some((finding) => finding.rule === "backfill.not_ready"));
});

test("backfill prompt: carries the evidence ladder, the three labels, and the no-fabrication rule", () => {
  const built = buildTaskPrompt({ task: "backfill", cwd: ".", projectType: "backend", profiles: [], governanceMode: "strict" });
  assert.equal(built.result, "pass");
  const prompt = built.prompt;

  assert.match(prompt, /It is NOT: produce a complete and convincing story about the project/);
  assert.match(prompt, /Evidence ladder/);
  for (const [rank, source] of [[1, "current source code"], [2, "tests"], [3, "configuration"], [5, "ADRs"], [7, "git diff \\/ history"]]) {
    assert.match(prompt, new RegExp(`${rank}\\. ${source}`), `ladder keeps ${source} at rank ${rank}`);
  }
  for (const label of ["verified:", "inferred:", "unknown:"]) {
    assert.ok(prompt.includes(label), `carries the ${label} confidence label`);
  }
  assert.match(prompt, /Decision reason: unknown/);
  assert.match(prompt, /do NOT reconstruct a rationale from file layout, naming, dependency choices, or commit subjects/);
  assert.match(prompt, /Never present the ABSENCE of evidence as evidence/);
  assert.match(prompt, /Unknown \/ needs human confirmation/);
  // The standing safety contracts survive in the new workflow too.
  assert.match(prompt, /status: needs_review/);
  assert.match(prompt, /verified is human-approved only/);
  assert.match(prompt, /Append docs\/llm-wiki\/log\.md/);
  assert.match(prompt, /sensitive raw values/);
  // One-shot procedural workflow: the numbered sequence IS the content here.
  assert.match(prompt, /^\s*1\.\s/m);
});

// ---------------------------------------------------------------------------
// 8. Handoff integration
// ---------------------------------------------------------------------------

test("handoff: names the governance mode it generated for and points at the escalation path", async () => {
  const cwd = await project("gov-handoff-", { config: { governance: { mode: "lite" } } });
  const result = await handoffCommand((await api.resolveOptions({ cwd, type: null, profiles: [], agents: ["claude"] })).options);

  assert.equal(result.handoff.governanceMode, "lite");
  assert.match(result.handoff.prompt, /Governance budget \(lite/);
  assert.match(result.text, /llm-wiki mode set strict --write/);
  assert.match(result.text, /llm-wiki backfill/);
  // The existing contract is untouched.
  assert.ok(result.handoff.message.includes("아래 프롬프트를 실행하세요"));
});

test("doctor: reports the effective mode, its source, and what the gates currently do", async () => {
  const cwd = await project("gov-doctor-", { config: { governance: { mode: "lite" } } });
  const result = await (await import("../src/commands.js")).doctor((await api.resolveOptions({ cwd, type: null, profiles: [] })).options);
  const line = result.checks.find((entry) => entry.startsWith("governance_mode:"));
  assert.ok(line, "doctor names the governance mode");
  assert.match(line, /lite/);
  assert.match(line, /source: config/);
  assert.match(line, /impact gate off/);
  assert.match(line, /drift scan skipped/);
});

// ---------------------------------------------------------------------------
// 9. THE acceptance scenario: months in lite, then a real handoff
// ---------------------------------------------------------------------------

test("acceptance: a repository sits in lite, drifts for months, then escalates to strict and is reconstructed for a handoff", async (t) => {
  if (!hasGit()) return t.skip("git unavailable");

  // --- 1. Initialize the project in lite -----------------------------------
  const cwd = await project("gov-acceptance-", { packageJson: { name: "acceptance", dependencies: { fastify: "^4.0.0" } } });
  const git = (args) => execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" }
  });
  git(["init"]);

  const initResult = await initCommand((await api.resolveOptions({ cwd, write: true, existing: "skip", agents: [], profiles: [], type: null })).options);
  assert.equal(initResult.result, "pass");
  assert.equal((await readConfig(cwd)).governance.mode, "lite", "a new project starts in lite");
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "API_CONTRACTS.md")), false, "lite planned none of the profile docs");

  // --- 2. Add multiple source files ----------------------------------------
  await mkdir(path.join(cwd, "src", "domains", "orders"), { recursive: true });
  await mkdir(path.join(cwd, "src", "domains", "billing"), { recursive: true });
  await mkdir(path.join(cwd, "tests"), { recursive: true });
  await writeFile(path.join(cwd, "src", "domains", "orders", "index.js"), "export function placeOrder() { return 1; }\n", { encoding: "utf8" });
  await writeFile(path.join(cwd, "src", "domains", "billing", "index.js"), "export function charge() { return 2; }\n", { encoding: "utf8" });
  await writeFile(path.join(cwd, "tests", "orders.test.js"), "export const covered = true;\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "add order and billing domains"]);

  // --- 3+4+5. Domain behavior and architecture change; the wiki is NOT synced
  await writeFile(path.join(cwd, "src", "domains", "orders", "index.js"), "export function placeOrder() { return 42; }\nexport function cancelOrder() { return 0; }\n", { encoding: "utf8" });
  await mkdir(path.join(cwd, "src", "gateway"), { recursive: true });
  await writeFile(path.join(cwd, "src", "gateway", "http.js"), "export const listen = () => null;\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "change order behavior and add a gateway layer"]);

  // Lite held its promise while all of that happened: nothing gated.
  const liteImpact = await impactCommand((await api.resolveOptions({ cwd, since: "HEAD~1" })).options);
  assert.equal(liteImpact.result, "pass", "months of lite development are never blocked on documentation");

  // --- 6. A handoff becomes necessary: switch to strict --------------------
  const switched = await modeCommand((await api.resolveOptions({ cwd, modeAction: "set", mode: "strict", write: true })).options);
  assert.equal(switched.written, true);
  assert.equal((await readConfig(cwd)).governance.mode, "strict");
  assert.deepEqual(switched.findings, [], "escalating did not silently run an audit");

  // --- 7+8. Run the strict backfill: detect what is missing and stale ------
  const plan = await backfillCommand((await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] })).options);
  assert.equal(plan.mode, "strict");
  assert.ok(plan.coverage.missing.length > 0, "strict wants documents lite never planned");
  assert.ok(plan.planned.some((line) => line.includes("would be created")), "and it says exactly which");
  assert.ok(plan.readiness.incomplete.includes("planned_docs_present"));
  assert.ok(plan.ledger.unknown.length > 0, "the gaps are enumerated, not glossed");
  assert.ok(plan.inventory.history.available, "git history is readable, so change context can be used");
  assert.ok(plan.inventory.sourceFiles >= 4, "the repository inventory saw the added source");
  assert.ok(plan.inventory.testFiles >= 1, "and the tests");
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "API_CONTRACTS.md")), false, "the plan wrote nothing");

  // --- 9+10. Generate the required documents and rebuild source mappings ---
  const written = await backfillCommand((await api.resolveOptions({ cwd, write: true, existing: "skip", type: null, profiles: [], agents: [] })).options);
  assert.ok(written.created.length > 0);
  for (const rel of plan.coverage.missing) {
    assert.ok(await fileExists(path.join(cwd, ...rel.split("/"))), `${rel} now exists`);
  }
  assert.deepEqual(written.coverage.missing, [], "coverage is measured AFTER the write, and the gap is closed");
  assert.ok(!written.readiness.incomplete.includes("planned_docs_present"), "that readiness check now passes");
  const domainDoc = written.created.find((line) => line.includes("docs/llm-wiki/domains/"));
  assert.ok(domainDoc, "the domains discovered in source got documents");

  // --- 11. Verification: everything reconstructed stays needs_review -------
  const validated = await validateCommand((await api.resolveOptions({ cwd, type: null, profiles: [], agents: [] })).options);
  assert.ok(["pass", "warning"].includes(validated.result), `structure is valid after backfill (got ${validated.result})`);
  assert.equal(written.coverage.statusCounts.verified, 0, "backfill promoted nothing");
  assert.ok(written.coverage.statusCounts.needs_review > 0, "everything it created awaits a human");

  // Reconstruction did not invent history, and says so.
  assert.ok(written.findings.some((finding) => finding.rule === "backfill.unknown_history"));
  assert.ok(written.readiness.incomplete.includes("decision_history"));

  // --- 12. Produce the handoff package ------------------------------------
  const handoff = await handoffCommand((await api.resolveOptions({ cwd, type: null, profiles: [], agents: ["claude"] })).options);
  assert.equal(handoff.result, "pass");
  assert.equal(handoff.handoff.governanceMode, "strict");
  assert.match(handoff.handoff.prompt, /Governance budget \(strict/);
  assert.match(handoff.handoff.prompt, /Update every affected document in the same task/);

  // And the reconstruction prompt an agent runs to fill the stubs is available
  // both from backfill and as a first-class task.
  const promptResult = await promptCommand((await api.resolveOptions({ cwd, task: "backfill", type: null, profiles: [], agents: ["claude"] })).options);
  assert.equal(promptResult.taskPrompt.task, "backfill");
  assert.match(promptResult.taskPrompt.prompt, /Evidence ladder/);
  assert.match(written.prompt, /Evidence ladder/, "backfill prints the same reconstruction workflow");
  assert.match(written.prompt, /do NOT reconstruct a rationale/, "including the no-fabrication rule");
});

// A repository whose verified document cites a source file that then changed, with
// the document left alone — the exact shape both freshness gates exist to catch.
async function driftedRepo(prefix, config) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: prefix }, null, 2)}\n`, { encoding: "utf8" });
  await writeFile(path.join(cwd, CONFIG_FILENAME), `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8" });
  await writeFile(path.join(cwd, "a.ts"), "one\n", { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "index.md"),
    [
      "---", "title: LLM-WIKI Index", "tags:", "  - llm-wiki", "  - verified", "status: verified",
      "doc_type: index", `project: ${prefix}`, "last_updated: 2026-07-11", "author: cli-generated",
      "reviewed_by: Someone", "reviewed_at: 2026-07-11", "wiki_block_version: v1",
      "source_files:", "  - package.json", "related: []", "visibility: internal",
      "contains_sensitive_info: false", "---", "", "# LLM-WIKI Index", "", "Entry point.", ""
    ].join("\n"),
    { encoding: "utf8" }
  );
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "api.md"),
    [
      "---", "title: Api", "tags:", "  - llm-wiki", "  - verified", "status: verified",
      "doc_type: public_api", `project: ${prefix}`, "last_updated: 2026-07-11", "author: cli-generated",
      "reviewed_by: Someone", "reviewed_at: 2026-07-11", "wiki_block_version: v1",
      "source_files:", "  - a.ts", "evidence:", "  - a.ts", "related:", "  - docs/llm-wiki/index.md",
      "visibility: internal", "contains_sensitive_info: false", "---", "", "# Api", "",
      "Describes a.ts.", "", "## Evidence", "", "- a.ts — the module this document describes.", ""
    ].join("\n"),
    { encoding: "utf8" }
  );
  const git = (args) => execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" }
  });
  git(["init"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "init"]);
  await writeFile(path.join(cwd, "a.ts"), "two\n", { encoding: "utf8" });
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "source moves, its document does not"]);
  return cwd;
}
