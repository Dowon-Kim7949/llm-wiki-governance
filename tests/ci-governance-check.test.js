// doctor's `ci_governance` check (2026-07-30; redefined by blocking power
// 2026-07-31): a repo can have a complete, enriched wiki and still have nothing
// that ENFORCES it, which is the most common adoption gap.
//
// The load-bearing property is precision, not recall: reporting governance that
// does not exist tells a team it is covered when nothing runs. A real pilot repo
// carried an unrelated `llm-wiki-review:` job name, so a bare substring match is
// specifically what these tests forbid.
//
// 2026-07-31 sharpened that: counting INVOCATIONS over-reported in a second way.
// An invocation of `doctor` or `status` can never fail a build, so a repo whose
// only "governance" was a doctor step read as covered while nothing could block
// anything. The check now separates blocking from advisory invocations and says
// out loud when no omission gate exists — the state where a team believes source
// changes cannot land undocumented, and they can.
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

// --- blocking power ------------------------------------------------------

test("ci_governance: a doctor-only workflow is advisory, not a gate", async () => {
  const cwd = await makeRepo();
  // This is the shape that used to read as "1 found". `doctor` is a report; it
  // cannot fail a build, so calling it governance is the dangerous direction.
  await writeWorkflow(cwd, "wiki.yml", "    - run: npx llm-wiki-governance@1.27 doctor\n");
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /0 blocking/);
  assert.match(line, /1 advisory/);
  assert.match(line, /NO omission gate/);
});

test("ci_governance: validate blocks on structure but is still not an omission gate", async () => {
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "wiki.yml", "    - run: npx llm-wiki-governance@1.27 validate --strict\n");
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /1 blocking/);
  // validate cannot see a source file that changed while its doc did not.
  assert.match(line, /NO omission gate/);
  assert.match(line, /\.github\/workflows\/wiki\.yml/);
});

test("ci_governance: impact --strict is recognized as the omission gate", async () => {
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "gate.yml", "    - run: llm-wiki impact --since origin/main --strict\n");
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /1 blocking/);
  assert.match(line, /omission gate present/);
  assert.doesNotMatch(line, /NO omission gate/);
});

test("ci_governance: impact WITHOUT --strict is now a real gate, because it exits 1", async () => {
  const cwd = await makeRepo();
  // Decision 21 (2026-08-03) made impact.source_changed default to error, so a
  // bare `impact --since` fails the build on its own. doctor has to say so:
  // reporting "NO omission gate" on a pipeline that does gate would send a
  // maintainer to add a flag that changes nothing.
  await writeWorkflow(cwd, "gate.yml", "    - run: llm-wiki impact --since origin/main\n");
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /1 blocking/);
  assert.doesNotMatch(line, /NO omission gate/);
  assert.match(line, /omission gate present/);
});

test("ci_governance: drift and check-run still need --strict to gate", async () => {
  // Their rules are still warnings, so the asymmetry is real and doctor must
  // keep it rather than treating every omission command the same way.
  for (const command of ["drift", "check-run"]) {
    const cwd = await makeRepo();
    await writeWorkflow(cwd, "gate.yml", `    - run: llm-wiki ${command}\n`);
    const line = ciGovernanceLine(await doctor({ cwd }));
    assert.match(line, /NO omission gate/, `${command} without --strict must not count as a gate`);
  }
});

test("ci_governance: drift --strict and check-run --strict also count as omission gates", async () => {
  for (const command of ["drift --strict", "check-run --strict"]) {
    const cwd = await makeRepo();
    await writeWorkflow(cwd, "gate.yml", `    - run: llm-wiki ${command}\n`);
    const line = ciGovernanceLine(await doctor({ cwd }));
    assert.match(line, /omission gate present/, `${command} must count as an omission gate`);
  }
});

test("ci_governance: the composite action reads its command and strict inputs", async () => {
  const cwd = await makeRepo();
  // The action reference carries no command on its own line; the inputs that
  // decide whether it can block live in the `with:` block below it.
  await writeWorkflow(cwd, "gate.yml", [
    "    - uses: Dowon-Kim7949/llm-wiki-governance/.github/actions/validate@v1.28.0",
    "      with:",
    "        command: impact",
    "        since: origin/main",
    "        strict: \"true\"",
    ""
  ].join("\n"));
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /1 blocking/);
  assert.match(line, /omission gate present/);
});

test("ci_governance: the composite action running impact gates even without strict", async () => {
  // Same contract change as the bare CLI form: since decision 21 the rule is an
  // error, so `command: impact` blocks whether or not `strict: true` is set.
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "gate.yml", [
    "    - uses: Dowon-Kim7949/llm-wiki-governance/.github/actions/validate@v1.28.0",
    "      with:",
    "        command: impact",
    ""
  ].join("\n"));
  assert.match(ciGovernanceLine(await doctor({ cwd })), /omission gate present/);
});

test("ci_governance: the composite action running drift without strict is still not a gate", async () => {
  // The asymmetry has to survive on the action path too, or the composite action
  // becomes a way to look gated without being gated.
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "gate.yml", [
    "    - uses: Dowon-Kim7949/llm-wiki-governance/.github/actions/validate@v1.28.0",
    "      with:",
    "        command: drift",
    ""
  ].join("\n"));
  assert.match(ciGovernanceLine(await doctor({ cwd })), /NO omission gate/);
});

test("ci_governance: a repo running the CLI from source is still governance", async () => {
  const cwd = await makeRepo();
  // How a project dogfooding its own CLI invokes it. The first version of this
  // check missed the `.js`, so this repo's own gate was invisible to it — the
  // detector could not see the thing it was built to detect.
  await writeWorkflow(cwd, "ci.yml", "    - run: node bin/llm-wiki.js impact --since HEAD~1 --strict\n");
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /1 blocking/);
  assert.match(line, /omission gate present/);
});

test("ci_governance: blocking and advisory are counted across workflows and the hook", async () => {
  const cwd = await makeRepo();
  await writeWorkflow(cwd, "wiki.yml", "    - run: npx llm-wiki-governance@1.27 doctor\n");
  await mkdir(path.join(cwd, ".git", "hooks"), { recursive: true });
  await writeFile(
    path.join(cwd, ".git", "hooks", "pre-commit"),
    "#!/bin/sh\nexec npx --no-install llm-wiki impact --strict\n",
    "utf8"
  );
  const line = ciGovernanceLine(await doctor({ cwd }));
  assert.match(line, /1 blocking/);
  assert.match(line, /1 advisory/);
  assert.match(line, /omission gate present/);
  assert.match(line, /\.git\/hooks\/pre-commit/);
});

// --- the shipped artifacts must actually carry a gate --------------------

// These are contract tests on the deployment artifacts themselves. The roadmap
// found that all four shipped channels ran validation-family commands only, so
// nothing this project handed an adopter could block a missing doc update. A
// unit test cannot catch that; only asserting on the shipped files can.
test("shipped artifacts: the workflow template wires a blocking omission gate", async () => {
  const template = await readRepoFile("templates/github-actions/llm-wiki-validate.yml");
  assert.match(template, /impact\b[^\n]*--strict/, "the workflow template must run a blocking impact gate");
  // impact --since needs history; a shallow default checkout silently degrades it.
  assert.match(template, /fetch-depth:\s*0/, "checkout must fetch history for --since to work");
});

test("shipped artifacts: the pre-commit hook can block, not just report", async () => {
  const hook = await readRepoFile("templates/git-hooks/pre-commit");
  assert.match(hook, /impact\b[^\n]*--strict/, "the hook must run a blocking impact gate");
});

test("shipped artifacts: the composite action can run commands other than validate", async () => {
  const action = await readRepoFile(".github/actions/validate/action.yml");
  assert.match(action, /^\s{2}command:/m, "the action must expose a `command` input");
  assert.doesNotMatch(
    action,
    /args=\(validate\b/,
    "the command must not be hardcoded; that is what made an omission gate unreachable"
  );
});

test("shipped artifacts: this repo's own CI runs a blocking omission gate", async () => {
  const ci = await readRepoFile(".github/workflows/ci.yml");
  assert.match(ci, /impact\b[^\n]*--strict/, "we must dogfood the gate we ship");
});

async function readRepoFile(rel) {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  return readFile(path.join(root, rel), "utf8");
}
