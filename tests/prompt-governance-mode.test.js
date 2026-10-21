import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promptCommand } from "../src/commands.js";

// `prompt` accepted --mode but never passed it to the builder, so every project
// got the strict budget whatever mode it had chosen (found 2026-10-20 while
// building the slim profile). handoff, backfill, and the generated skills always
// passed it; prompt is now the same.
// One workspace for every call: the prompt embeds the cwd, so two temp dirs
// would differ for a reason that has nothing to do with the mode.
const cwdPromise = mkdtemp(path.join(os.tmpdir(), "llm-wiki-prompt-mode-"));

async function promptFor(mode) {
  const options = { cwd: await cwdPromise, task: "feature", type: "backend", profiles: [], agents: ["claude"] };
  if (mode) options.mode = mode;
  return (await promptCommand(options)).taskPrompt;
}

test("prompt renders the governance budget of the mode it is given", async () => {
  const lite = await promptFor("lite");
  const strict = await promptFor("strict");
  assert.equal(lite.governanceMode, "lite");
  assert.match(lite.prompt, /lite/);
  assert.notEqual(lite.prompt, strict.prompt, "lite and strict must not render the same prompt");
});

test("prompt without a mode keeps the legacy (strict) budget it always printed", async () => {
  const unset = await promptFor(null);
  const strict = await promptFor("strict");
  assert.equal(unset.governanceMode, "strict");
  assert.equal(unset.prompt, strict.prompt);
});
