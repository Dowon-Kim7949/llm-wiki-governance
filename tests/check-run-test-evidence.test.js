// Gate 26 extension (2026-07-28): test-evidence (RED -> GREEN) trail in run
// manifests. A code-changing feature/fix skill run should record, in its
// .llm-wiki/runs/ manifest, that the relevant test failed before the change
// (testEvidence.red) and passed after it (testEvidence.green). The read-only
// check-run surfaces the gap as run.test_evidence_missing — warning by
// default and toggleable via config rules — while legacy manifests stay
// valid: the optional field never affects run.manifest_invalid semantics, and
// documentation-only tasks (docs-sync, bootstrap) are exempt entirely.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkRunCommand, explainCommand, initCommand } from "../src/commands.js";
import { FINDING_EXPLANATIONS } from "../src/commands/findings.js";
import { localizeExplanation, localizeFinding } from "../src/i18n.js";

const RULE = "run.test_evidence_missing";

async function makeProject(prefix) {
  return mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
}

// Minimal project whose only wiki doc references src/foo.js, so run.doc_gap,
// run.log_missing, and run.unvalidated stay quiet and each test below isolates
// the test-evidence rule.
async function makeRunProject(prefix) {
  const cwd = await makeProject(prefix);
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "cr-test-evidence" }, null, 2)}\n`, { encoding: "utf8" });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await writeFile(path.join(cwd, "src", "foo.js"), "export const foo = 1;\n", { encoding: "utf8" });
  const wikiDir = path.join(cwd, "docs", "llm-wiki", "domains");
  await mkdir(wikiDir, { recursive: true });
  await writeFile(path.join(wikiDir, "00_overview.md"), `---
title: Overview
tags:
  - llm-wiki
status: needs_review
doc_type: domain
project: fixture
last_updated: 2026-07-02
author: test
last_edited_by: node-test
wiki_block_version: v1
source_files:
  - src/foo.js
related:
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

# Overview

Existing wiki entry.
`, { encoding: "utf8" });
  return cwd;
}

async function writeManifest(cwd, name, manifest) {
  const runsDir = path.join(cwd, ".llm-wiki", "runs");
  await mkdir(runsDir, { recursive: true });
  await writeFile(path.join(runsDir, name), JSON.stringify(manifest), { encoding: "utf8" });
}

// A manifest that satisfies every pre-existing run.* check (doc coverage, log,
// validation); tests override only what they exercise.
function baseManifest(overrides = {}) {
  return {
    task: "feature",
    changedSource: ["src/foo.js"],
    touchedDocs: ["docs/llm-wiki/domains/00_overview.md"],
    logAppended: true,
    validated: { ran: true, result: "pass" },
    ...overrides
  };
}

test("check-run flags a code-changing feature run without testEvidence (warning, never an error)", async () => {
  const cwd = await makeRunProject("te-missing-");
  // A legacy manifest: valid per the original Gate 26 contract, no testEvidence.
  await writeManifest(cwd, "run.json", baseManifest());
  const result = await checkRunCommand({ cwd, format: "text", strict: false });

  const finding = result.findings.find((item) => item.rule === RULE);
  assert.ok(finding, "run.test_evidence_missing is emitted");
  assert.equal(finding.severity, "warning", "legacy manifests only warn");
  assert.equal(result.result, "warning");
  // run.manifest_invalid semantics are untouched: the old shape is still valid.
  assert.equal(result.findings.some((item) => item.rule === "run.manifest_invalid"), false);
  // The message names the missing manifest keys, never manifest values.
  assert.ok(finding.message.includes("testEvidence.red") && finding.message.includes("testEvidence.green"));
});

test("check-run flags incomplete or wrongly-shaped testEvidence on a fix run", async () => {
  const cwd = await makeRunProject("te-partial-");

  // green missing entirely
  await writeManifest(cwd, "run.json", baseManifest({
    task: "fix",
    testEvidence: { red: "tests/foo.test.js > flags missing evidence — failed before the change" }
  }));
  let result = await checkRunCommand({ cwd, format: "text", strict: false });
  let finding = result.findings.find((item) => item.rule === RULE);
  assert.ok(finding, "partial testEvidence (red only) is flagged");
  assert.ok(finding.message.includes("testEvidence.green") && !finding.message.includes("testEvidence.red"), "only the missing part is named");

  // red present but blank
  await writeManifest(cwd, "run.json", baseManifest({
    task: "fix",
    testEvidence: { red: "   ", green: "node --test — all pass after the change" }
  }));
  result = await checkRunCommand({ cwd, format: "text", strict: false });
  finding = result.findings.find((item) => item.rule === RULE);
  assert.ok(finding, "blank red is treated as missing");
  assert.ok(finding.message.includes("testEvidence.red"));

  // wrong shape (string instead of { red, green })
  await writeManifest(cwd, "run.json", baseManifest({ task: "fix", testEvidence: "ran the tests" }));
  result = await checkRunCommand({ cwd, format: "text", strict: false });
  finding = result.findings.find((item) => item.rule === RULE);
  assert.ok(finding, "non-object testEvidence is treated as missing");
  assert.ok(finding.message.includes("testEvidence.red") && finding.message.includes("testEvidence.green"));
  assert.equal(result.findings.some((item) => item.rule === "run.manifest_invalid"), false, "shape problems warn, never invalidate the manifest");
});

test("check-run passes a feature run with a complete red -> green trail", async () => {
  const cwd = await makeRunProject("te-complete-");
  await writeManifest(cwd, "run.json", baseManifest({
    testEvidence: {
      red: "tests/foo.test.js > new behavior — failed before the change (AssertionError)",
      green: "node --test — suite passes after the change"
    }
  }));
  const result = await checkRunCommand({ cwd, format: "text", strict: false });
  assert.equal(result.findings.some((item) => item.rule === RULE), false);
  assert.equal(result.result, "pass");
  assert.equal(result.findings.length, 0);
});

test("check-run leaves documentation-only and code-free runs unflagged (legacy no-warning paths)", async () => {
  const cwd = await makeRunProject("te-exempt-");

  // docs-sync changes source-adjacent docs, but is a documentation task.
  await writeManifest(cwd, "run.json", baseManifest({ task: "docs-sync" }));
  let result = await checkRunCommand({ cwd, format: "text", strict: false });
  assert.equal(result.findings.some((item) => item.rule === RULE), false, "docs-sync is exempt");
  assert.equal(result.result, "pass");

  // bootstrap is the initial-enrichment task; also exempt.
  await writeManifest(cwd, "run.json", baseManifest({ task: "bootstrap" }));
  result = await checkRunCommand({ cwd, format: "text", strict: false });
  assert.equal(result.findings.some((item) => item.rule === RULE), false, "bootstrap is exempt");

  // A feature run that changed no source needs no test evidence.
  await writeManifest(cwd, "run.json", baseManifest({ changedSource: [] }));
  result = await checkRunCommand({ cwd, format: "text", strict: false });
  assert.equal(result.findings.some((item) => item.rule === RULE), false, "empty changedSource is exempt");
  assert.equal(result.result, "pass");

  // A manifest without a task field cannot be classified; stays unflagged.
  const taskless = baseManifest();
  delete taskless.task;
  await writeManifest(cwd, "run.json", taskless);
  result = await checkRunCommand({ cwd, format: "text", strict: false });
  assert.equal(result.findings.some((item) => item.rule === RULE), false, "missing task is exempt");
  assert.equal(result.result, "pass");
});

test("run.test_evidence_missing is toggleable via config rules (off drops, override escalates)", async () => {
  const cwd = await makeRunProject("te-toggle-");
  await writeManifest(cwd, "run.json", baseManifest());

  const off = await checkRunCommand({ cwd, format: "text", strict: false, rules: { [RULE]: "off" } });
  assert.equal(off.findings.some((item) => item.rule === RULE), false, "off drops the finding");
  assert.equal(off.result, "pass");

  const escalated = await checkRunCommand({ cwd, format: "text", strict: false, rules: { [RULE]: "error" } });
  assert.equal(escalated.findings.find((item) => item.rule === RULE)?.severity, "error", "severity override applies");
  assert.equal(escalated.result, "fail");
});

test("run.test_evidence_missing is registered with a warning default and an explanation", async () => {
  const explanation = FINDING_EXPLANATIONS[RULE];
  assert.ok(explanation, "registry entry exists");
  assert.equal(explanation.category, "run");
  assert.equal(explanation.defaultSeverity, "warning");
  assert.ok(explanation.remediation.some((step) => step.includes("testEvidence.red")));

  const explained = await explainCommand({ findingRule: RULE, format: "text" });
  assert.equal(explained.result, "pass");
  assert.equal(explained.explanation.category, "run");
});

test("run.test_evidence_missing localizes message and explanation to Korean", async () => {
  const finding = {
    severity: "warning",
    rule: RULE,
    path: ".llm-wiki/runs/run.json",
    message: "EN source message",
    params: { task: "feature", missing: "testEvidence.red, testEvidence.green" }
  };
  const ko = localizeFinding(finding, "ko");
  assert.notEqual(ko.message, finding.message, "KO message catalog entry exists");
  assert.ok(ko.message.includes("feature") && ko.message.includes("testEvidence.red, testEvidence.green"), "params interpolate");

  const en = FINDING_EXPLANATIONS[RULE];
  const koExplanation = localizeExplanation(RULE, en, "ko");
  assert.notEqual(koExplanation.meaning, en.meaning, "KO explanation exists");
  assert.deepEqual(koExplanation.commands, en.commands, "CLI commands stay English");
});

test("feature/fix skill completion contracts name testEvidence; docs-sync and bootstrap do not", async () => {
  const cwd = await makeProject("te-skill-");
  await writeFile(path.join(cwd, "requirements.txt"), "fastapi==0.110.0\n", { encoding: "utf8" });
  const result = await initCommand({ cwd, write: true, minimal: true, withAdapters: false, skills: true, type: "backend", profiles: [], agents: [], existing: "skip" });
  assert.equal(result.result, "pass");

  const read = (slug) => readFile(path.join(cwd, ".claude", "skills", slug, "SKILL.md"), "utf8");
  for (const slug of ["llm-wiki-feature", "llm-wiki-fix"]) {
    const body = await read(slug);
    assert.ok(body.includes("testEvidence"), `${slug}: contract names testEvidence`);
    assert.ok(body.includes("red") && body.includes("green"), `${slug}: contract names the red -> green trail`);
  }
  for (const slug of ["llm-wiki-docs-sync", "llm-wiki-bootstrap"]) {
    const body = await read(slug);
    assert.equal(body.includes("testEvidence"), false, `${slug}: documentation-only contract is unchanged`);
  }
});
