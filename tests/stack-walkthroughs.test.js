// The stack walkthroughs run on every CI job (3 OS x 4 Node), the way the Vue and
// greenfield demos do: a Python (FastAPI) brownfield service and a React + Node
// workspace with a shared API contract. Each one runs the real CLI in a temporary
// git repository and fails on any unexpected exit code or output. They need git
// only — no Python, no npm install.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repo, "bin", "llm-wiki.js");

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

for (const [name, script, checks] of [
  ["python-fastapi-brownfield", "examples/python-fastapi-brownfield/scripts/walkthrough.mjs", 21],
  ["react-node-fullstack", "examples/react-node-fullstack/scripts/walkthrough.mjs", 15]
]) {
  test(`${name} walkthrough: all ${checks} checks pass`, { skip: !hasGit() && "git not available" }, () => {
    const run = spawnSync(process.execPath, [path.join(repo, script), "--quiet", "--cli", cli], { cwd: repo, encoding: "utf8" });
    const output = `${run.stdout}${run.stderr}`;
    assert.equal(run.status, 0, output);
    assert.match(output, new RegExp(`All ${checks} checks passed\\.`));
  });
}
