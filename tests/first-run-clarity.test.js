// First-run clarity (1.42.0). A fresh-project walkthrough of the published 1.41.0
// on 2026-10-29 found three places where what a new user saw contradicted what the
// tool does:
//   1. quickstart scaffolds lite, where impact and drift are off. impact then
//      printed "result: pass" and no documents to re-review, which reads exactly
//      like "checked, all clear". status and next did not name the mode at all.
//   2. quickstart and help said "a human reviews and marks them verified" without
//      naming the command that does it, and the tool cannot prove who approved.
//   3. Generated documents told whoever opened them "Do not promote this document
//      to verified", which a person filling the doc by hand reads as addressed to
//      them, with no way forward.
// Each test is RED against 1.41.0.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { impactCommand, nextCommand, quickstartCommand, statusCommand } from "../src/commands.js";
import { normalizeOptions, resolveOptions } from "../src/index.js";

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };
const git = (cwd, ...args) => execFileSync("git", ["-c", "commit.gpgsign=false", "-c", "core.autocrlf=false", ...args], { cwd, env: GIT_ENV, stdio: "ignore" });

async function freshProject() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-first-run-"));
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "sample", version: "0.1.0" }), "utf8");
  await writeFile(path.join(cwd, "src", "index.js"), "export const x = 1;\n", "utf8");
  return cwd;
}

async function cliOpts(cwd, extra = {}) {
  const { options, errors } = await resolveOptions({ cwd, agents: [], profiles: [], ...extra });
  assert.deepEqual(errors, []);
  return options;
}

test("quickstart names the approve command and says lite turned the change checks off", async () => {
  const cwd = await freshProject();
  const result = await quickstartCommand(normalizeOptions({ cwd, write: true, agents: ["claude"], profiles: [] }));
  assert.equal(result.handoff.governanceMode, "lite");
  assert.equal(result.handoff.changeChecksOff, true);
  assert.doesNotMatch(result.text, /a human reviews/i);
  assert.match(result.text, /review --approve <path>/);
  assert.match(result.text, /it cannot prove it/);
  assert.match(result.text, /change checks are off/);
  assert.match(result.text, /mode set standard --write/);
  assert.match(result.text, /No coding agent\? Fill the docs yourself/);
});

test("quickstart under strict does not claim the change checks are off", async () => {
  const cwd = await freshProject();
  const result = await quickstartCommand(normalizeOptions({ cwd, write: true, agents: ["claude"], profiles: [], mode: "strict" }));
  assert.equal(result.handoff.changeChecksOff, false);
  assert.doesNotMatch(result.text, /change checks are off/);
});

test("the Korean half of the next step does not leave an English 'or' in the agent label", async () => {
  const cwd = await freshProject();
  const result = await quickstartCommand(normalizeOptions({ cwd, write: true, agents: [], profiles: [] }));
  assert.doesNotMatch(result.text, / or [A-Z][^·]*에게/);
  assert.match(result.text, /Codex 또는 Claude Code에게/);
});

test("lite impact says nothing was checked instead of reading as all clear", async () => {
  const cwd = await freshProject();
  git(cwd, "init", "-q");
  await quickstartCommand(normalizeOptions({ cwd, write: true, agents: [], profiles: [] }));
  git(cwd, "add", "-A");
  git(cwd, "commit", "-q", "-m", "init");
  await writeFile(path.join(cwd, "src", "index.js"), "export const x = 2;\n", "utf8");
  git(cwd, "commit", "-q", "-am", "change");

  const lite = await impactCommand(await cliOpts(cwd, { since: "HEAD~1" }));
  assert.match(lite.text, /impact\.source_changed: off \(governance mode lite or config\) — no document was checked/);
  assert.match(lite.text, /not checked: impact\.source_changed is off/);
  // JSON shape unchanged: no new top-level key.
  assert.equal(Object.hasOwn(lite, "gateOff"), false);

  const strict = await impactCommand(await cliOpts(cwd, { since: "HEAD~1", mode: "strict" }));
  assert.doesNotMatch(strict.text, /no document was checked/);
});

test("status and next name the mode, and say when the change checks are off", async () => {
  const cwd = await freshProject();
  await quickstartCommand(normalizeOptions({ cwd, write: true, agents: [], profiles: [] }));
  for (const command of [statusCommand, nextCommand]) {
    const result = await command(await cliOpts(cwd));
    assert.match(result.text, /governance_mode: lite \(change checks off — llm-wiki mode set standard --write turns them on\)/);
    const strict = await command(await cliOpts(cwd, { mode: "strict" }));
    assert.match(strict.text, /governance_mode: strict\n/);
  }
});

test("generated documents tell a reader how to approve instead of forbidding it", async () => {
  for (const docLang of ["en", "ko"]) {
    const cwd = await freshProject();
    await quickstartCommand(normalizeOptions({ cwd, write: true, agents: [], profiles: [], docLang }));
    const body = await readFile(path.join(cwd, "docs", "llm-wiki", "project-profile.md"), "utf8");
    assert.doesNotMatch(body, /human-approved only|사람 승인 전용|Do not promote this document/, docLang);
    assert.match(body, /review --approve/, docLang);
  }
});
