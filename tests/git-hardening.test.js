// Settings of the repository being read that reach llm-wiki's read-only git queries
// (measured 2026-10-28 with git 2.39.2): a diff against the working tree runs the
// command named in the repository's core.fsmonitor. Every query now runs with that
// setting empty. A clean filter the repository configures also runs; it is left on,
// because switching filters off would report unchanged Git LFS files as changed, and
// SECURITY.md covers it. textconv and external diff drivers were not reached by the
// commands this package runs.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { changedFiles, runGit } from "../src/git.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

test("the repository's own core.fsmonitor is not what git sees", { skip: !hasGit() && "git not available" }, () => {
  const cwd = mkdtempSync(path.join(os.tmpdir(), "llm-wiki-git-hardening-"));
  const git = (args) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@e", "-c", "commit.gpgsign=false", ...args], { cwd, stdio: "ignore" });
  git(["init", "-q"]);
  writeFileSync(path.join(cwd, "a.txt"), "one\n");
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "init"]);
  git(["config", "core.fsmonitor", path.join(os.tmpdir(), "llm-wiki-no-such-command")]);
  // Asserted through git's own view of the value, not by running a monitor.
  assert.equal(runGit(cwd, ["config", "--get", "core.fsmonitor"]).trim(), "");
  assert.deepEqual(changedFiles(cwd, "HEAD"), [], "queries still work");
});
