// Named rule presets (llm-wiki.config.json `rulesPreset`, GATE_REVIEW config
// schema line): RULE_PRESETS in src/commands/findings.js is the single source of
// the relaxed/standard/strict bundles, loadProjectConfig validates the name, and
// mergeConfigIntoOptions expands the bundle into options.rules as a FLOOR under
// the project's explicit `rules` map. Presets only preload rule-severity toggles;
// they are unrelated to the --strict CLI flag and its exit-code semantics.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  FINDING_EXPLANATIONS,
  NON_TOGGLEABLE_CATEGORIES,
  RULE_PRESETS,
  findingCategory
} from "../src/commands/findings.js";
import { RULE_TOGGLE_ACTIONS, loadProjectConfig, mergeConfigIntoOptions } from "../src/config-file.js";
import { applyProjectConfig } from "../src/cli.js";
import { audit, doctor, validateCommand } from "../src/commands.js";
import * as api from "../src/index.js";
import { handleMessage } from "../src/mcp/dispatch.js";

const CONFIG_FILENAME = "llm-wiki.config.json";

test("RULE_PRESETS: bundles are registry-valid, frozen, and never touch safety or error/blocked defaults", () => {
  assert.deepEqual(Object.keys(RULE_PRESETS).sort(), ["relaxed", "standard", "strict"]);

  // standard is the explicit no-op baseline: empty on purpose, so selecting it
  // stays byte-identical to having no preset at all.
  assert.deepEqual(RULE_PRESETS.standard, {});

  assert.ok(Object.isFrozen(RULE_PRESETS), "the preset registry must be frozen");
  for (const [name, bundle] of Object.entries(RULE_PRESETS)) {
    assert.ok(Object.isFrozen(bundle), `preset ${name} must be frozen`);
    for (const [rule, action] of Object.entries(bundle)) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(FINDING_EXPLANATIONS, rule),
        `preset ${name} names unknown rule ${rule}`
      );
      assert.ok(RULE_TOGGLE_ACTIONS.has(action), `preset ${name} has invalid action for ${rule}: ${action}`);
      assert.ok(
        !NON_TOGGLEABLE_CATEGORIES.has(findingCategory(rule)),
        `preset ${name} must never touch safety rule ${rule}`
      );
      const defaultSeverity = FINDING_EXPLANATIONS[rule].defaultSeverity;
      assert.ok(
        defaultSeverity === "warning" || defaultSeverity === "info",
        `preset ${name} must not touch ${rule} (default severity ${defaultSeverity})`
      );
    }
  }

  // relaxed only relaxes: every entry is "off" or a demotion to "info".
  for (const [rule, action] of Object.entries(RULE_PRESETS.relaxed)) {
    assert.ok(action === "off" || action === "info", `relaxed must relax, not escalate ${rule} (${action})`);
  }
  // strict enables the opt-in lints at their designed warning level.
  assert.equal(RULE_PRESETS.strict["content.thin_body"], "warning");
  assert.equal(RULE_PRESETS.strict["visibility.public_sensitive"], "warning");
  assert.equal(RULE_PRESETS.strict["visibility.declared_mismatch"], "warning");
});

test("config rulesPreset: loadProjectConfig accepts known names and rejects unknown or non-string values", async () => {
  const ok = await makePresetProject("preset-ok-", { rulesPreset: "relaxed" });
  const okResult = await loadProjectConfig(ok);
  assert.deepEqual(okResult.errors, []);
  assert.equal(okResult.config.rulesPreset, "relaxed");

  const unknown = await makePresetProject("preset-unknown-", { rulesPreset: "banana" });
  const unknownResult = await loadProjectConfig(unknown);
  assert.ok(unknownResult.errors.length > 0, "an unknown preset name must be a config error");
  assert.match(unknownResult.errors.join(" "), /rulesPreset/);

  const nonString = await makePresetProject("preset-nonstring-", { rulesPreset: 5 });
  assert.ok((await loadProjectConfig(nonString)).errors.length > 0, "a non-string preset must be a config error");
});

test("rulesPreset expands into options.rules as a floor; explicit rules always win key-by-key", () => {
  const floorOnly = api.normalizeOptions({ cwd: "unused" });
  mergeConfigIntoOptions(floorOnly, { rulesPreset: "relaxed" });
  assert.deepEqual(floorOnly.rules, { ...RULE_PRESETS.relaxed });
  assert.notEqual(floorOnly.rules, RULE_PRESETS.relaxed, "the frozen bundle must be copied, not shared");

  const overridden = api.normalizeOptions({ cwd: "unused" });
  mergeConfigIntoOptions(overridden, {
    rulesPreset: "relaxed",
    rules: { "evidence.stale": "error", "related.missing": "off" }
  });
  assert.equal(overridden.rules["evidence.stale"], "error", "explicit rules override the preset entry");
  assert.equal(overridden.rules["encoding.bom"], "off", "untouched preset entries survive as the floor");
  assert.equal(overridden.rules["related.missing"], "off", "explicit rules outside the preset still apply");

  // Config never overrides rules the caller already supplied (house rule).
  const callerRules = api.normalizeOptions({ cwd: "unused", rules: { "evidence.stale": "info" } });
  mergeConfigIntoOptions(callerRules, { rulesPreset: "strict" });
  assert.deepEqual(callerRules.rules, { "evidence.stale": "info" });
});

test("rulesPreset standard is an explicit no-op: effective options and validate output are byte-identical", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-preset-standard-"));
  await writeWikiIndex(cwd);

  const before = await api.resolveOptions({ cwd });
  assert.deepEqual(before.errors, []);
  const resultBefore = await validateCommand(before.options);

  await writeConfig(cwd, { rulesPreset: "standard" });
  const after = await api.resolveOptions({ cwd });
  assert.deepEqual(after.errors, []);
  assert.deepEqual(after.options, before.options, "standard must resolve the same effective options");
  const resultAfter = await validateCommand(after.options);
  assert.equal(JSON.stringify(resultAfter), JSON.stringify(resultBefore), "standard must be byte-identical");
});

test("an unknown rulesPreset is rejected on all three surfaces (CLI seam, API, MCP)", async () => {
  const cwd = await makePresetProject("preset-3s-bad-", { rulesPreset: "banana" });

  // CLI seam: main() exits 3 on any applyProjectConfig error.
  const cliOptions = api.normalizeOptions({ cwd });
  const { errors: cliErrors } = await applyProjectConfig(cliOptions);
  assert.ok(cliErrors.length > 0);
  assert.match(cliErrors.join(" "), /rulesPreset/);

  // Programmatic API.
  const { errors: apiErrors } = await api.resolveOptions({ cwd });
  assert.ok(apiErrors.length > 0);

  // MCP: malformed config surfaces as an isError tool result.
  const res = await handleMessage(
    { jsonrpc: "2.0", id: 90, method: "tools/call", params: { name: "audit", arguments: { cwd } } },
    {}
  );
  assert.equal(res.result.isError, true);
  assert.match(res.result.content[0].text, /rulesPreset/);
});

test("strict preset enables the opt-in thin-body lint identically on the CLI seam, API, and MCP", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-preset-strict-"));
  await writeWikiIndex(cwd);
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "stub.md"),
    "---\ntitle: Stub\nstatus: needs_review\ndoc_type: reference\n---\n\n# Stub\n\nTODO.\n",
    { encoding: "utf8" }
  );
  await writeConfig(cwd, { rulesPreset: "strict" });

  // CLI seam.
  const cliOptions = api.normalizeOptions({ cwd });
  const { errors: cliErrors } = await applyProjectConfig(cliOptions);
  assert.deepEqual(cliErrors, []);
  assert.equal(cliOptions.rules["content.thin_body"], "warning");
  const cliRun = await audit(cliOptions);
  assert.ok(cliRun.findings.some((f) => f.rule === "content.thin_body"), "CLI seam activates the opt-in lint");

  // Programmatic API.
  const { options: apiOptions, errors: apiErrors } = await api.resolveOptions({ cwd });
  assert.deepEqual(apiErrors, []);
  const apiRun = await api.commands.audit(apiOptions);
  assert.ok(apiRun.findings.some((f) => f.rule === "content.thin_body"), "API activates the opt-in lint");

  // MCP.
  const res = await handleMessage(
    { jsonrpc: "2.0", id: 91, method: "tools/call", params: { name: "audit", arguments: { cwd } } },
    {}
  );
  assert.equal(res.result.isError, false);
  assert.ok(
    res.result.structuredContent.findings.some((f) => f.rule === "content.thin_body"),
    "MCP activates the opt-in lint"
  );
});

test("relaxed preset drops the BOM note and demotes placeholder noise to info; explicit rules still win", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-preset-relaxed-"));
  await writeWikiIndex(cwd);
  // A UTF-8 BOM on a wiki doc -> encoding.bom (info) by default.
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "bom.md"),
    Buffer.concat([
      Buffer.from([0xef, 0xbb, 0xbf]),
      Buffer.from("---\ntitle: B\nstatus: needs_review\ndoc_type: reference\n---\n\n# B\n\nBody prose.\n", "utf8")
    ])
  );
  // A generated placeholder sentinel -> content.not_enriched (warning) by default.
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "placeholder.md"),
    "---\ntitle: P\nstatus: needs_review\ndoc_type: reference\n---\n\n# P\n\nConcise summary: describe\n",
    { encoding: "utf8" }
  );

  const defaults = await audit(api.normalizeOptions({ cwd }));
  assert.ok(defaults.findings.some((f) => f.rule === "encoding.bom"), "fixture produces the BOM note by default");
  assert.equal(
    defaults.findings.find((f) => f.rule === "content.not_enriched" && f.path.includes("placeholder"))?.severity,
    "warning"
  );

  await writeConfig(cwd, { rulesPreset: "relaxed", rules: { "content.not_enriched": "error" } });
  const { options, errors } = await api.resolveOptions({ cwd });
  assert.deepEqual(errors, []);
  const relaxedRun = await audit(options);
  assert.ok(!relaxedRun.findings.some((f) => f.rule === "encoding.bom"), "relaxed drops the BOM note");
  assert.equal(
    relaxedRun.findings.find((f) => f.rule === "content.not_enriched" && f.path.includes("placeholder"))?.severity,
    "error",
    "an explicit rules entry overrides the relaxed demotion"
  );
});

test("sensitive safety: no preset path can disable sensitive.* findings, even with hostile explicit rules", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-preset-sensitive-"));
  await writeWikiIndex(cwd);
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "secret.md"),
    "---\ntitle: S\nstatus: needs_review\ndoc_type: reference\ncontains_sensitive_info: true\n---\n\ntoken: abcdefgh12345678\n",
    { encoding: "utf8" }
  );
  await writeConfig(cwd, { rulesPreset: "strict", rules: { "sensitive.redacted": "off" } });

  const { options, errors } = await api.resolveOptions({ cwd });
  assert.deepEqual(errors, []);
  const result = await audit(options);
  assert.ok(
    result.findings.some((f) => f.rule === "sensitive.redacted"),
    "sensitive detection survives preset + hostile explicit toggle"
  );
});

test("doctor echoes the applied rulesPreset (additive: absent when unset)", async () => {
  const withPreset = await makePresetProject("preset-doctor-", {
    rulesPreset: "relaxed",
    rules: { "evidence.stale": "error" }
  });
  const echoed = await doctor(api.normalizeOptions({ cwd: withPreset }));
  const line = echoed.checks.find((check) => check.startsWith("llm_wiki_config:"));
  assert.ok(line.includes("rulesPreset=relaxed"), `doctor must echo the preset: ${line}`);
  assert.ok(line.includes("rules=1"), `explicit rules keep their own count: ${line}`);

  const withoutPreset = await makePresetProject("preset-doctor-none-", { rules: { "evidence.stale": "error" } });
  const plain = await doctor(api.normalizeOptions({ cwd: withoutPreset }));
  const plainLine = plain.checks.find((check) => check.startsWith("llm_wiki_config:"));
  assert.ok(!plainLine.includes("rulesPreset"), `no preset -> unchanged echo: ${plainLine}`);
});

async function makePresetProject(prefix, config) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
  await writeConfig(cwd, config);
  return cwd;
}

async function writeConfig(cwd, value) {
  await writeFile(path.join(cwd, CONFIG_FILENAME), JSON.stringify(value), { encoding: "utf8" });
}

async function writeWikiIndex(cwd) {
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "index.md"),
    "---\ntitle: I\nstatus: needs_review\ndoc_type: index\n---\n",
    { encoding: "utf8" }
  );
}
