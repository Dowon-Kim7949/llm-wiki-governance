// checkRun.ignore (F-6, 2026-10-27). A documentation-only run produced 13
// run.doc_gap warnings in this repository: README.md and outputs/ drafts were
// declared as changedSource, and no wiki document cites them. Removing prose from
// changedSource only moved each warning to run.change_set_undeclared, which
// requires every changed file to be declared (decision 23). The fix is one
// project-declared list both rules read, off by default, and reported.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkRunCommand } from "../src/commands.js";
import { checkRunIgnored, loadProjectConfig } from "../src/config-file.js";
import { resolveOptions } from "../src/index.js";

for (const [name, value] of [["checkRunCommand", checkRunCommand], ["checkRunIgnored", checkRunIgnored], ["loadProjectConfig", loadProjectConfig], ["resolveOptions", resolveOptions]]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

async function docsOnlyRun(config) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-check-run-ignore-"));
  await mkdir(path.join(cwd, ".llm-wiki", "runs"), { recursive: true });
  await mkdir(path.join(cwd, "outputs", "deck"), { recursive: true });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  for (const file of ["README.md", "outputs/deck/notes.md", "outputs/deck/slides.html", "src/app.js"]) {
    await writeFile(path.join(cwd, file), "one\n", "utf8");
  }
  if (config) await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify(config), "utf8");
  execFileSync("git", ["init", "-q"], { cwd, stdio: "ignore" });
  execFileSync("git", ["add", "-A"], { cwd, stdio: "ignore", env: GIT_ENV });
  execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-q", "-m", "base"], { cwd, stdio: "ignore", env: GIT_ENV });
  for (const file of ["README.md", "outputs/deck/notes.md", "outputs/deck/slides.html", "src/app.js"]) {
    await writeFile(path.join(cwd, file), "two\n", "utf8");
  }
  await writeFile(path.join(cwd, ".llm-wiki", "runs", "run-docs-sync-20261027T000000Z.json"), JSON.stringify({
    task: "docs-sync", timestamp: "2026-10-27T00:00:00Z",
    changedSource: ["README.md", "outputs/deck/notes.md"], touchedDocs: [],
    logAppended: true, validated: { command: "validate", result: "pass" }
  }), "utf8");
  return cwd;
}

const GAP_RULES = new Set(["run.doc_gap", "run.change_set_undeclared"]);
const rulesOf = (result) => result.findings.filter((finding) => GAP_RULES.has(finding.rule)).map((finding) => `${finding.rule} ${finding.path}`).sort();

test("without checkRun.ignore, prose warns exactly as before", { skip: !hasGit() }, async () => {
  const cwd = await docsOnlyRun(null);
  const result = await checkRunCommand((await resolveOptions({ cwd })).options);
  assert.deepEqual(result.ignored, []);
  assert.equal(result.findings.filter((finding) => finding.rule === "run.doc_gap").length, 2);
  assert.deepEqual(
    result.findings.filter((finding) => finding.rule === "run.change_set_undeclared").map((finding) => finding.path),
    ["outputs/deck/slides.html", "src/app.js"]
  );
});

test("checkRun.ignore removes prose from BOTH rules, reports it, and still catches code", { skip: !hasGit() }, async () => {
  const cwd = await docsOnlyRun({ checkRun: { ignore: ["outputs/", "README.md"] } });
  const result = await checkRunCommand((await resolveOptions({ cwd })).options);
  assert.deepEqual(result.ignored, ["README.md", "outputs/deck/notes.md", "outputs/deck/slides.html"]);
  assert.deepEqual(rulesOf(result), ["run.change_set_undeclared src/app.js"], "the undeclared code file is still named");
  assert.match(result.text, /ignored \(checkRun\.ignore\): 3/);
});

test("checkRunIgnored: dir/, *.ext, and exact paths, nothing else", () => {
  const patterns = ["outputs/", "*.md", "docs/guide.txt"];
  assert.ok(checkRunIgnored("outputs/a/b.html", patterns));
  assert.ok(checkRunIgnored("README.md", patterns));
  assert.ok(checkRunIgnored("deep/nested/NOTES.md", patterns));
  assert.ok(checkRunIgnored("docs/guide.txt", patterns));
  assert.ok(!checkRunIgnored("outputs-old/a.html", patterns), "a directory entry is not a bare prefix");
  assert.ok(!checkRunIgnored("docs/guide.txt.bak", patterns));
  assert.ok(!checkRunIgnored("src/md", patterns));
  assert.ok(!checkRunIgnored("README.md", undefined), "no list, nothing ignored");
});

test("config: a malformed checkRun block is a config error, not a silent no-op", async () => {
  const bad = [
    { checkRun: [] },
    { checkRun: {} },
    { checkRun: { ignore: [] } },
    { checkRun: { ignore: ["src/**/*.md"] } },
    { checkRun: { ignore: ["/abs"] } },
    { checkRun: { ignore: ["../up/"] } },
    { checkRun: { ignore: ["a\\b"] } },
    { checkRun: { ignore: ["*."] } },
    { checkRun: { ignore: ["README.md"], ignroe: ["x"] } }
  ];
  for (const config of bad) {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-check-run-config-"));
    await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify(config), "utf8");
    const { errors } = await loadProjectConfig(cwd);
    assert.ok(errors.some((error) => error.includes("checkRun")), JSON.stringify(config));
  }
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-check-run-config-"));
  await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify({ checkRun: { ignore: ["outputs/", "*.md", "CHANGELOG.ko.md"] } }), "utf8");
  const { config, errors } = await loadProjectConfig(cwd);
  assert.deepEqual(errors, []);
  assert.deepEqual(config.checkRun, { ignore: ["outputs/", "*.md", "CHANGELOG.ko.md"] });
});
