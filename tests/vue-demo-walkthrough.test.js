// examples/vue3-typescript-demo documents a scenario with real commands and real
// exit codes. This runs that scenario against this checkout's CLI, so a change to
// init, validate, review or impact that would make the README wrong fails here
// instead of in a reader's terminal. It needs git, not the demo's npm packages:
// the walkthrough exercises the governance steps, not the Vue build.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "examples", "vue3-typescript-demo", "scripts", "demo.mjs");
const cli = path.join(root, "bin", "llm-wiki.js");

test("vue3 demo: the documented walkthrough passes every check against this CLI", () => {
  const run = spawnSync(process.execPath, [script, "walkthrough", "--cli", cli, "--quiet"], { encoding: "utf8" });
  const output = `${run.stdout}${run.stderr}`;
  assert.equal(run.status, 0, output);
  assert.match(output, /All 11 checks passed\./);
  // The one step that must fail is the point of the demo.
  assert.match(output, /PASS {2}impact detects the stale document +expected exit 1, got exit 1/);
});
