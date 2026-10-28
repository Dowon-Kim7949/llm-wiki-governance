// A caller-supplied git revision that starts with "-" is an option to git, and some
// git options write a file (2026-10-28). Reproduced through the MCP validate tool,
// whose contract is read-only, and through the programmatic API (`impact`,
// `validate` with `changed`, `release-notes`). The CLI was not exposed: its parser
// refuses a "-"-prefixed --since value (pinned below).
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { assertRevision, changedFiles, fileAtRef, renamedPaths } from "../src/git.js";
import { handleMessage } from "../src/mcp/dispatch.js";
import { impactCommand } from "../src/commands.js";
import { collectCommits } from "../src/release-notes.js";
import { commands, normalizeOptions, parseArgs } from "../src/index.js";

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

// Any new entry in the repository counts, not one expected name: a range such as
// `<since>..HEAD` changes the name git would write to, and a check for the bare
// name passed against the unfixed release-notes path.
const entries = (cwd) => new Set(readdirSync(cwd));
const newEntries = (cwd, before) => [...entries(cwd)].filter((entry) => !before.has(entry));
const optionShaped = (cwd) => `--output=${path.join(cwd, "written-by-git.txt")}`;

test("the read-only MCP validate tool cannot make git write a file", { skip: !hasGit() && "git not available" }, async () => {
  const cwd = repo();
  const before = entries(cwd);
  const response = await handleMessage({
    jsonrpc: "2.0", id: 1, method: "tools/call",
    params: { name: "validate", arguments: { cwd, changed: true, since: optionShaped(cwd) } }
  }, { cwd });
  assert.deepEqual(newEntries(cwd, before), [], "git must not have written a file");
  assert.match(JSON.stringify(response), /changed\.unavailable/, "the run says it could not compute the change set");
});

test("the programmatic API cannot make git write a file: impact, validate --changed, release-notes", { skip: !hasGit() && "git not available" }, async () => {
  for (const [name, extra] of [["impact", {}], ["validate", { changed: true }], ["release-notes", {}]]) {
    const cwd = repo();
    const before = entries(cwd);
    await commands[name](normalizeOptions({ cwd, since: optionShaped(cwd), ...extra }));
    assert.deepEqual(newEntries(cwd, before), [], name);
  }
});

test("the git primitives refuse an option-shaped revision", { skip: !hasGit() && "git not available" }, async () => {
  const cwd = repo();
  const before = entries(cwd);
  const since = optionShaped(cwd);
  const impact = await impactCommand(normalizeOptions({ cwd, since }));
  assert.equal(impact.findings[0].rule, "impact.unavailable");
  assert.throws(() => changedFiles(cwd, since), /not a git revision/);
  assert.throws(() => renamedPaths(cwd, since), /not a git revision/);
  assert.equal(fileAtRef(cwd, since, "a.txt"), null);
  assert.deepEqual(collectCommits(cwd, { since }), { commits: [], gitAvailable: false });
  assert.deepEqual(newEntries(cwd, before), [], "nothing was written along the way");
  assert.deepEqual(changedFiles(cwd, "HEAD"), ["a.txt"], "a real revision still works");
});

// Without a "--" after the revision, a since that names a file and no ref was read
// as a pathspec: git compared that file against the index and the run reported a
// change set computed from something that was not a baseline at all.
test("a since that names a file, not a revision, is refused instead of read as a pathspec", { skip: !hasGit() && "git not available" }, () => {
  const cwd = repo();
  assert.throws(() => changedFiles(cwd, "a.txt"));
  assert.throws(() => renamedPaths(cwd, "a.txt"));
  assert.deepEqual(collectCommits(cwd, { since: "a.txt" }), { commits: [], gitAvailable: false });
});

test("revision syntax callers use keeps working", { skip: !hasGit() && "git not available" }, () => {
  const cwd = repo();
  const git = (args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@e", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8" }).trim();
  git(["tag", "v0.0.1"]);
  git(["branch", "feature/x"]);
  git(["stash", "-q"]);
  git(["checkout", "-q", "feature/x"]);
  git(["checkout", "-q", "-"]);
  git(["stash", "pop", "-q"]);
  const sha = git(["rev-parse", "HEAD"]);
  for (const ref of ["HEAD", "HEAD~0", "HEAD^{commit}", sha, sha.slice(0, 7), "v0.0.1", "feature/x", "@{-1}"]) {
    assert.deepEqual(changedFiles(cwd, ref), ["a.txt"], ref);
    assert.equal(renamedPaths(cwd, ref).size, 0, ref);
    assert.equal(fileAtRef(cwd, ref, "a.txt"), "one\n", ref);
  }
  assert.equal(collectCommits(cwd, { since: "v0.0.1" }).gitAvailable, true);
});

// The CLI never let such a value through: its parser reads a "-"-prefixed word
// after --since as a missing value. The programmatic API and the MCP server had no
// such layer, which is where the option reached git.
test("the CLI parser refuses an option-shaped --since before anything runs", () => {
  const parsed = parseArgs(["impact", "--since", "--output=x"]);
  assert.ok(parsed.errors.some((error) => /Missing value for --since/.test(error)), JSON.stringify(parsed.errors));
});
