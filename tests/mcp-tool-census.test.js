// The three places that TELL a reader which tools the MCP server exposes, and
// which no other gate compares against the server itself (2026-08-20).
//
// `src/mcp/tools.js#symbol:TOOL_DEFS` is the single source of the exposed tool
// set. Three hand-kept prose copies of that set exist:
//   1. `src/cli.js` — the `mcp` line of the top-level help Safety block.
//   2. `src/cli.js` — the `Tools (all read-only ...)` block of `help mcp`.
//   3. `src/mcp/dispatch.js` — the `instructions` string returned on initialize,
//      which every MCP client shows its agent as the server's own description.
// All three had gone stale, and each by a DIFFERENT amount: the Safety line
// listed 14 of 17 (omitting `onboard`, `review`, `prepare`), `help mcp` still
// listed the original 1.6 ten, and the server instructions omitted `review`.
// One product, three different answers to the same question.
//
// The omission is not cosmetic — `prepare` is the tool an agent should reach for
// to scope a question, so help that hides it steers agents back into re-deriving
// from source, which is the cost this package exists to remove.
//
// Nothing caught it, because a doc string that UNDER-claims still parses, still
// lints, and still passes every behavioral MCP test. This is the census guard.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_DEFS } from "../src/mcp/tools.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Every prose copy of the tool set, with the anchor that finds it and how many
// lines it spans. `span` is deliberately explicit: a copy that grows past it
// fails loudly here rather than silently dropping out of the census.
const COPIES = [
  { label: "top-level help Safety block", file: "src/cli.js", anchor: "mcp starts a read-only Model Context Protocol server", span: 1 },
  { label: "help mcp Tools block", file: "src/cli.js", anchor: "Tools (all read-only", span: 3 },
  { label: "MCP initialize instructions", file: "src/mcp/dispatch.js", anchor: "Read-only LLM-WIKI tools.", span: 1 }
];

// Match a tool name only as a whole token: `prompt` must not be satisfied by
// `prompts`, and `status` must not be satisfied by `statusFilter`.
function mentions(text, name) {
  return new RegExp(`(^|[^A-Za-z0-9_])${name}([^A-Za-z0-9_]|$)`).test(text);
}

async function blockAt(copy) {
  const source = await readFile(path.join(repoRoot, copy.file), "utf8");
  const lines = source.split(/\r?\n/);
  const at = lines.findIndex((l) => l.includes(copy.anchor));
  assert.ok(at >= 0, `${copy.file} no longer contains "${copy.anchor}" — update this guard with it`);
  return lines.slice(at, at + copy.span).join("\n");
}

for (const copy of COPIES) {
  test(`the ${copy.label} names every MCP tool the server exposes`, async () => {
    const block = await blockAt(copy);
    const missing = TOOL_DEFS.map((t) => t.name).filter((name) => !mentions(block, name));
    assert.deepEqual(missing, [], `TOOL_DEFS entries absent from the ${copy.label}`);
  });
}

// The opposite direction — claiming a tool that does not exist — is only checked
// where the list is machine-parseable. The Safety line carries a clean
// slash-separated list inside parentheses; the other two copies are prose.
test("the top-level help claims no MCP tool that does not exist", async () => {
  const block = await blockAt(COPIES[0]);
  const listed = (block.match(/\(([^)]*\/[^)]*)\)/) || [, ""])[1].split("/").map((s) => s.trim()).filter(Boolean);
  assert.ok(listed.length > 0, "the mcp help line no longer carries a slash-separated tool list");
  const known = new Set(TOOL_DEFS.map((t) => t.name));
  const phantom = listed.filter((name) => !known.has(name));
  assert.deepEqual(phantom, [], "the help line names tools that TOOL_DEFS does not expose");
});
