// doctor's `ci_governance` check (2026-07-30): a repo can have a complete,
// enriched wiki and still have nothing that ENFORCES it, which is the most
// common adoption gap. doctor now names any workflow or pre-commit hook that
// actually invokes llm-wiki, or says none was detected.
//
// The load-bearing property is precision, not recall: reporting governance that
// does not exist tells a team it is covered when nothing runs. A real pilot repo
// carried an unrelated `llm-wiki-review:` job name, so a bare substring match is
// specifically what these tests forbid.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { doctor } from "../src/commands.js";

async function makeRepo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-ci-gov-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "index.md"), "# Index\n", "utf8");
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  return cwd;
}

async function writeWorkflow(cwd, name, body) {
  await mkdir(path.join(cwd, ".github", "workflows"), { recursive: true });
  await writeFile(path.join(cwd, ".github", "workflows", name), body, "utf8");
}

function ciGovernanceLine(result) {
  const line = result.checks.find((entry) => entry.startsWith("ci_governance:"));
  assert.ok(line, "doctor must always report a ci_governance check");
  return line;
}

test("ci_governance: reports none detected when nothing runs llm-wiki", async () => {
  const cwd = await makeRepo();
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /none detected/);
  // The nudge must name the command that actually blocks an undocumented change.
  assert.match(line, /impact --since/);
});

test("ci_governance: a workflow that only MENTIONS llm-wiki is not governance", async () => {
  const cwd = await makeRepo();
  // Verbatim shape of the false positive found in a pilot repo: a job name.
  await writeWorkflow(cwd, "pr-review.yml", "jobs:\n  llm-wiki-review:\n    runs-on: ubuntu-latest\n");
  assert.match(ciGovernanceLine(await doctor({ cwd })), /none detected/);
});

test("ci_governance: detects the npx package invocation", async () => {
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "wiki.yml", "    - run: npx llm-wiki-governance@1.27 validate --strict\n");
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /1 found/);
  assert.match(line, /\.github\/workflows\/wiki\.yml/);
});

test("ci_governance: detects the composite action reference", async () => {
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "gate.yml", "    - uses: Dowon-Kim7949/llm-wiki-governance/.github/actions/validate@v1.27.2\n");
  assert.match(ciGovernanceLine(await doctor({ cwd })), /1 found/);
});

test("ci_governance: detects a bare binary call with a CI command", async () => {
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "impact.yml", "    - run: llm-wiki impact --since origin/main --strict\n");
  assert.match(ciGovernanceLine(await doctor({ cwd })), /1 found/);
});

test("ci_governance: detects a pre-commit hook and counts it alongside workflows", async () => {
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "wiki.yml", "    - run: npx llm-wiki-governance@1.27 validate\n");
  await mkdir(path.join(cwd, ".git", "hooks"), { recursive: true });
  await writeFile(
    path.join(cwd, ".git", "hooks", "pre-commit"),
    "#!/bin/sh\nexec npx --no-install llm-wiki impact --since HEAD --strict\n",
    "utf8"
  );
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /2 found/);
  assert.match(line, /\.git\/hooks\/pre-commit/);
});

test("ci_governance: non-YAML files in the workflow dir are ignored", async () => {
  const cwd = await makeRepo();
  await mkdir(path.join(cwd, ".github", "workflows"), { recursive: true });
  await writeFile(
    path.join(cwd, ".github", "workflows", "README.md"),
    "Run `llm-wiki validate --strict` here one day.\n",
    "utf8"
  );
  assert.match(ciGovernanceLine(await doctor({ cwd })), /none detected/);
});
