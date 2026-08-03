// The boundary around this repository's self-approval policy (2026-08-03).
//
// The maintainer decided that this repo approves its own wiki documents: an agent
// runs `review --approve-all --yes` instead of leaving a backlog for a human. The
// reason is local — this repo was built end-to-end by vibe coding and exists as the
// product's dogfood, not as a codebase whose docs a human curates.
//
// That decision has exactly two ways to go wrong, and both are silent:
//
//   1. The stamp impersonates a human. `resolveReviewer` falls back to
//      `gitUserName()`, so an agent running `review --approve` with no configured
//      reviewer writes `reviewed_by: Dowon-Kim` — a human review that never
//      happened, in the one field that records who reviewed. The config's
//      `reviewer` key is what keeps the stamp honest, and deleting it re-arms the
//      fallback with nothing to signal it.
//   2. The relaxation leaks to adopters. The rule this package ships lives in
//      `templates/adapters/*`, gets copied into other people's repositories, and
//      must keep requiring human review. A future agent reading this repo's own
//      CLAUDE.md could "sync" the templates to match it and quietly ship the
//      opposite of the product's central claim.
//
// Neither is visible to any other gate: both states parse, validate, and ship.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gitUserName } from "../src/git.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the configured reviewer names the agent, not the git identity", async () => {
  const config = JSON.parse(await readFile(path.join(repoRoot, "llm-wiki.config.json"), "utf8"));

  assert.equal(
    typeof config.reviewer,
    "string",
    'llm-wiki.config.json must define "reviewer": without it, review --approve falls back to gitUserName() and stamps the maintainer for work an agent did'
  );
  assert.ok(config.reviewer.trim().length > 0, '"reviewer" must not be blank');

  const gitIdentity = gitUserName(repoRoot);
  if (gitIdentity) {
    assert.notEqual(
      config.reviewer.trim(),
      gitIdentity.trim(),
      `"reviewer" (${config.reviewer}) must differ from the git identity (${gitIdentity}) so an agent stamp is distinguishable from a human one; a human signing their own review passes --reviewer explicitly`
    );
  }
});

// The tool cannot know who is at the keyboard, so it must not claim to. Five shipped
// surfaces used to assert that a human decides — two `review` caveats, two help
// surfaces, and the MCP tool description — and an agent approving 40 documents made
// every one of them read as false. They were softened to what is actually
// guaranteed: nothing promotes on its own, only an explicit --approve stamps, and
// `reviewed_by` records whoever ran it.
//
// Deliberately NOT banned: `task-prompts.js` still tells agents "verified is
// human-approved only". That is a directive inside a generated prompt, correct under
// the shipped default, and a repository that delegates approval overrides it in its
// own adapter — not by editing what every adopter's agent is told.
const OVERCLAIMS = [
  "verified is a human decision",
  "verified is human-only",
  "verified stays a human decision",
  "Promotion to verified is human-only",
  "human CLI action",
  "verified is never set automatically"
];

test("no shipped surface claims the tool guarantees a human approver", async () => {
  const files = ["src/commands.js", "src/cli.js", "src/mcp/tools.js"];
  const offenders = [];
  for (const rel of files) {
    const text = await readFile(path.join(repoRoot, rel), "utf8");
    for (const phrase of OVERCLAIMS) {
      if (text.includes(phrase)) offenders.push(`${rel}: "${phrase}"`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `the tool cannot know who ran it; say what is guaranteed instead (never automatic, only --approve stamps, reviewed_by records the approver):\n${offenders.join("\n")}`
  );
});

test("the review surfaces still state what IS guaranteed", async () => {
  const commands = await readFile(path.join(repoRoot, "src", "commands.js"), "utf8");
  const cli = await readFile(path.join(repoRoot, "src", "cli.js"), "utf8");
  const mcp = await readFile(path.join(repoRoot, "src", "mcp", "tools.js"), "utf8");

  // Guards: without these the softening could be deleted outright and the banned-
  // phrase test above would still pass on an empty caveat.
  assert.match(commands, /Promotion to verified is never automatic/, "the review list caveat lost its promotion statement");
  assert.match(commands, /verified is an explicit decision, never an automatic one/, "the approve caveat lost its promotion statement");
  assert.match(commands, /reviewed_by records whoever did/, "the approve caveat no longer says who the stamp records");
  assert.match(cli, /never auto-verifies/, "the review help summary lost the no-auto-verify guarantee");
  assert.match(cli, /Promotion is never\s+automatic/, "the help review topic lost the no-auto-promotion guarantee");
  assert.match(mcp, /promotion to verified stays a CLI action .* never available over MCP/, "the MCP review tool no longer states that promotion is unavailable over MCP");
});

// The shipped rule and this repo's local rule are allowed to disagree — that is the
// whole point — so the shipped one is pinned here.
test("every shipped adapter template still requires human review", async () => {
  const adapterRoot = path.join(repoRoot, "templates", "adapters");
  const files = [];
  for (const entry of await readdir(adapterRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const inner of await readdir(path.join(adapterRoot, entry.name), { withFileTypes: true })) {
      if (inner.isFile() && inner.name.endsWith(".md")) {
        files.push(path.join(adapterRoot, entry.name, inner.name));
      }
    }
  }
  assert.ok(files.length > 0, "guard: no adapter templates found; this test checked nothing");

  const offenders = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    if (!/Use `verified` only after human review\./.test(text)) {
      offenders.push(path.relative(repoRoot, file).split(path.sep).join("/"));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `these ship to adopters and must keep requiring human review, whatever this repo does to itself:\n${offenders.join("\n")}`
  );
});
