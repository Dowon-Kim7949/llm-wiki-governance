// examples/greenfield-vue-demo documents a project whose wiki starts before its
// code, with real commands and real exit codes. This runs that scenario against
// this checkout's CLI, so a change to init --greenfield, handoff, validate,
// review, stats, search-docs or impact that would make the README wrong fails
// here instead of in a reader's terminal. It needs git, not the demo app's npm
// packages; the app's own tests run only where Node can strip TypeScript types.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "examples", "greenfield-vue-demo", "scripts", "demo.mjs");
const cli = path.join(root, "bin", "llm-wiki.js");

test("greenfield demo: the documented walkthrough passes every check against this CLI", async () => {
  const { canRunAppTests } = await import(pathToFileURL(script).href);
  const run = spawnSync(process.execPath, [script, "walkthrough", "--cli", cli, "--quiet"], { encoding: "utf8" });
  const output = `${run.stdout}${run.stderr}`;
  assert.equal(run.status, 0, output);
  // 21 governance checks, plus the app's tests twice where Node can run them.
  // 1.39.0 added three: a requirement changed ahead of its code (impact.plan_changed
  // in text and JSON) and its re-approval.
  assert.match(output, new RegExp(`All ${canRunAppTests() ? 23 : 21} checks passed\\.`));
  // The one step that must fail is the point of the demo, and it names only the
  // requirement whose code changed — the line-range-anchored ADR and the
  // unlinked, deferred requirement stay quiet.
  assert.match(output, /PASS {2}impact flags the requirement whose code changed +expected exit 1, got exit 1/);
  assert.match(output, /PASS {2}validate: an approved plan is info, not a defect/);
});
