// A caller-supplied git revision that starts with "-" is an option to git, and
// `--output=<path>` makes git write a file (2026-10-28). Reproduced through the MCP
// validate tool, whose contract is read-only: `changed: true, since:
// "--output=<path>"` wrote git's diff to <path>. The same shape reached git from
// `impact --since`, `validate --changed --since` and `release-notes --since`.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { assertRevision, changedFiles, fileAtRef, renamedPaths } from "../src/git.js";
import { handleMessage } from "../src/mcp/dispatch.js";
import { impactCommand } from "../src/commands.js";
import { collectCommits } from "../src/release-notes.js";
import { normalizeOptions } from "../src/index.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function repo() {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "llm-wiki-revision-guard-"));
  mkdirSync(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  writeFileSync(path.join(cwd, "a.txt"), "one\n");
  const git = (args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@e", "-c", "commit.gpgsign=false", ...args], { cwd, stdio: "ignore" });
  git(["init", "-q"]);
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "init"]);
  writeFileSync(path.join(cwd, "a.txt"), "two\n");
  return cwd;
}

test("assertRevision refuses what git would read as an option and accepts revisions", () => {
  for (const bad of ["--output=x", "-p", "", null, undefined, 42]) {
    assert.throws(() => assertRevision(bad), /not a git revision/, String(bad));
  }
  for (const good of ["HEAD", "HEAD~1", "origin/main", "v1.39.0", "@{-1}", "a1b2c3d", "main..feature"]) {
    assert.equal(assertRevision(good), good);
  }
});

test("the read-only MCP validate tool cannot make git write a file", { skip: !hasGit() && "git not available" }, async () => {
  const cwd = repo();
  const target = path.join(cwd, "written-by-git.txt");
  const response = await handleMessage({
    jsonrpc: "2.0", id: 1, method: "tools/call",
    params: { name: "validate", arguments: { cwd, changed: true, since: `--output=${target}` } }
  }, { cwd });
  assert.equal(existsSync(target), false, "git must not have written the file");
  assert.match(JSON.stringify(response), /changed\.unavailable/, "the run says it could not compute the change set");
});

test("impact, the git primitives and release-notes refuse an option-shaped revision", { skip: !hasGit() && "git not available" }, async () => {
  const cwd = repo();
  const target = path.join(cwd, "written-by-git.txt");
  const since = `--output=${target}`;
  const impact = await impactCommand(normalizeOptions({ cwd, since }));
  assert.equal(impact.findings[0].rule, "impact.unavailable");
  assert.throws(() => changedFiles(cwd, since), /not a git revision/);
  assert.throws(() => renamedPaths(cwd, since), /not a git revision/);
  assert.equal(fileAtRef(cwd, since, "a.txt"), null);
  assert.deepEqual(collectCommits(cwd, { since }), { commits: [], gitAvailable: false });
  assert.equal(existsSync(target), false, "nothing was written along the way");
  assert.deepEqual(changedFiles(cwd, "HEAD"), ["a.txt"], "a real revision still works");
});
