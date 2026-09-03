// Tests for the one-way ECC memory importer (`import-memory`): portable
// ecc.memory.v1 Markdown memories -> needs_review LLM-WIKI drafts under
// docs/llm-wiki/imported/. Every fixture lives in a temp directory — this
// repository's own docs/llm-wiki is never touched by these tests.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { importMemoryCommand } from "../src/commands.js";
import { parseFrontmatter, validateFrontmatter } from "../src/frontmatter.js";
import { parseArgs } from "../src/cli.js";
import { TOOL_DEFS } from "../src/mcp/tools.js";
import * as api from "../src/index.js";

const DEFAULT_BODY = `We keep session tokens server-side only.

## Details

Rotation happens weekly; read the auth module before changing this.`;

test("import-memory previews by default: plans drafts, writes nothing", async () => {
  const cwd = await makeProject("import-preview-");
  await writeMemory(cwd, "mem_auth_decision.md", eccMemory());

  const result = await importMemoryCommand(api.normalizeOptions({ cwd }));

  assert.equal(result.command, "import-memory");
  assert.equal(result.apply, false);
  assert.equal(result.dryRun, true);
  assert.equal(result.result, "pass");
  assert.equal(result.planned.length, 1);
  assert.ok(result.planned[0].includes("docs/llm-wiki/imported/mem_auth_decision.md"));
  assert.equal(result.imported.length, 0);
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "imported", "mem_auth_decision.md")), false);
  assert.ok(result.text.includes("Preview only"), "text report says nothing was written");
});

test("import-memory --apply writes a schema-valid needs_review draft and preserves the body", async () => {
  const cwd = await makeProject("import-apply-");
  await writeMemory(cwd, "mem_auth_decision.md", eccMemory());

  const result = await importMemoryCommand(api.normalizeOptions({ cwd, apply: true }));

  assert.equal(result.result, "pass");
  assert.equal(result.dryRun, false);
  assert.equal(result.imported.length, 1);
  const target = path.join(cwd, "docs", "llm-wiki", "imported", "mem_auth_decision.md");
  const raw = await readFile(target, { encoding: "utf8" });
  const { frontmatter, body, errors } = parseFrontmatter(raw);
  assert.deepEqual(errors, []);
  // Structural guarantee: the shared wiki template hardcodes needs_review, so an
  // import can never mint a verified document.
  assert.equal(frontmatter.status, "needs_review");
  assert.equal(frontmatter.doc_type, "imported_memory");
  assert.deepEqual(validateFrontmatter(frontmatter), [], "generated frontmatter passes the wiki schema");
  assert.ok(body.includes("Rotation happens weekly"), "memory body preserved verbatim");
  assert.ok(body.includes("mem_auth_decision"), "provenance records the ECC id");
  assert.ok(body.includes("ecc.memory.v1"), "provenance records the source schema");
});

test("import-memory skips sensitive-looking memories by default and never echoes the value", async () => {
  const cwd = await makeProject("import-sensitive-");
  // Clearly fake credential-shaped value, assembled so the literal never sits in
  // this file and can never be mistaken for a real secret.
  const fakeSecret = ["dummy", "credential", "1234567890"].join("-");
  await writeMemory(cwd, "mem_leaky.md", eccMemory({
    id: "mem_leaky",
    body: `api_key: "${fakeSecret}"\n\nOther context worth keeping.`
  }));

  const preview = await importMemoryCommand(api.normalizeOptions({ cwd }));
  assert.equal(preview.planned.length, 0);
  assert.equal(preview.skipped.length, 1);
  assert.ok(preview.findings.some((f) => f.rule === "import.sensitive_skipped" && f.severity === "warning"));
  assert.ok(!preview.text.includes(fakeSecret), "text report never carries the value");
  assert.ok(!JSON.stringify(preview).includes(fakeSecret), "no payload field carries the value");

  const applied = await importMemoryCommand(api.normalizeOptions({ cwd, apply: true }));
  assert.equal(applied.imported.length, 0);
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "imported", "mem_leaky.md")), false);
});

test("import-memory never overwrites an existing target", async () => {
  const cwd = await makeProject("import-exists-");
  await writeMemory(cwd, "mem_kept.md", eccMemory({ id: "mem_kept" }));
  const target = path.join(cwd, "docs", "llm-wiki", "imported", "mem_kept.md");
  await mkdir(path.dirname(target), { recursive: true });
  const sentinel = "ORIGINAL CONTENT - do not clobber\n";
  await writeFile(target, sentinel, { encoding: "utf8" });

  const result = await importMemoryCommand(api.normalizeOptions({ cwd, apply: true }));

  assert.equal(result.imported.length, 0);
  assert.ok(result.skipped.some((line) => line.includes("mem_kept.md") && line.includes("already exists")));
  assert.equal(await readFile(target, { encoding: "utf8" }), sentinel, "existing file is byte-identical");
});

test("import-memory reports malformed and non-ecc files instead of importing them", async () => {
  const cwd = await makeProject("import-malformed-");
  await writeMemory(cwd, "not-a-memory.md", "just prose, no frontmatter at all\n");
  await writeMemory(cwd, "other-schema.md", "---\nschema: other.format.v9\ntitle: Not ours\n---\n\nBody.\n");

  const result = await importMemoryCommand(api.normalizeOptions({ cwd }));

  assert.equal(result.planned.length, 0);
  assert.equal(result.result, "pass", "skips are reported; the run itself still succeeds");
  assert.ok(result.findings.some((f) => f.rule === "import.invalid_memory" && f.severity === "warning"));
  assert.ok(result.findings.some((f) => f.rule === "import.unsupported_schema" && f.severity === "warning"));
  assert.equal(result.skipped.length, 2);
});

test("import-memory reports unknown frontmatter keys and preserves the body", async () => {
  const cwd = await makeProject("import-unknown-");
  await writeMemory(cwd, "mem_extra.md", eccMemory({ id: "mem_extra", extraFrontmatter: "custom_priority: high\n" }));

  const result = await importMemoryCommand(api.normalizeOptions({ cwd, apply: true }));

  assert.equal(result.imported.length, 1);
  assert.ok(result.imported[0].includes("custom_priority"), "unrecognized key is reported by name");
  const raw = await readFile(path.join(cwd, "docs", "llm-wiki", "imported", "mem_extra.md"), { encoding: "utf8" });
  assert.ok(raw.includes("custom_priority"), "unrecognized key is recorded in the draft provenance");
  assert.ok(raw.includes("Rotation happens weekly"), "body still preserved");
});

test("import-memory skips memories whose ECC status is not active", async () => {
  const cwd = await makeProject("import-inactive-");
  await writeMemory(cwd, "mem_old.md", eccMemory({ id: "mem_old", status: "superseded" }));

  const result = await importMemoryCommand(api.normalizeOptions({ cwd, apply: true }));

  assert.equal(result.imported.length, 0);
  assert.ok(result.skipped.some((line) => line.includes("superseded")));
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "imported", "mem_old.md")), false);
});

test("import-memory fails on a missing explicit source and guides on the missing default", async () => {
  const cwd = await makeProject("import-missing-");

  const explicit = await importMemoryCommand(api.normalizeOptions({ cwd, memoryPath: "no/such/vault" }));
  assert.equal(explicit.result, "fail");
  assert.ok(explicit.findings.some((f) => f.rule === "import.source_missing" && f.severity === "error"));

  const defaulted = await importMemoryCommand(api.normalizeOptions({ cwd }));
  assert.equal(defaulted.result, "pass");
  assert.equal(defaulted.planned.length, 0);
  assert.ok(defaulted.text.includes(".ecc/memory"), "guides the user to the default vault location");
});

test("import-memory accepts a single memory file as the source", async () => {
  const cwd = await makeProject("import-file-");
  await writeMemory(cwd, "mem_single.md", eccMemory({ id: "mem_single" }));

  const result = await importMemoryCommand(api.normalizeOptions({
    cwd,
    memoryPath: path.join(".ecc", "memory", "mem_single.md")
  }));

  assert.equal(result.planned.length, 1);
  assert.ok(result.planned[0].includes("docs/llm-wiki/imported/mem_single.md"));
});

test("import-memory imports a whole vault directory deterministically", async () => {
  const cwd = await makeProject("import-batch-");
  await writeMemory(cwd, "mem_beta.md", eccMemory({ id: "mem_beta", title: "Beta note" }));
  await writeMemory(cwd, "mem_alpha.md", eccMemory({ id: "mem_alpha", title: "Alpha note" }));

  const result = await importMemoryCommand(api.normalizeOptions({ cwd, apply: true }));

  assert.equal(result.imported.length, 2);
  assert.ok(result.imported[0].includes("mem_alpha.md"), "deterministic (sorted) order");
  assert.ok(result.imported[1].includes("mem_beta.md"));
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "imported", "mem_alpha.md")), true);
  assert.equal(await fileExists(path.join(cwd, "docs", "llm-wiki", "imported", "mem_beta.md")), true);
});

test("parseArgs wires import-memory: positional path, --apply, conflict and option guards", () => {
  const ok = parseArgs(["import-memory", ".ecc/memory", "--apply"]);
  assert.equal(ok.command, "import-memory");
  assert.deepEqual(ok.errors, []);
  assert.equal(ok.options.memoryPath, ".ecc/memory");
  assert.equal(ok.options.apply, true);

  const conflict = parseArgs(["import-memory", "--dry-run", "--apply"]);
  assert.ok(conflict.errors.some((e) => e.includes("cannot be used together")));

  const foreign = parseArgs(["import-memory", "--strict"]);
  assert.ok(foreign.errors.some((e) => e.includes("--strict is not supported by import-memory")));
});

test("import-memory is in the frozen API map but never exposed over MCP", () => {
  assert.equal(typeof api.commands["import-memory"], "function");
  assert.equal(api.commands["import-memory"], api.importMemoryCommand);
  // MCP stays a read-only surface: write commands are never exposed as tools.
  const toolNames = TOOL_DEFS.map((tool) => tool.name);
  assert.ok(!toolNames.includes("import_memory"));
  assert.ok(!toolNames.includes("import-memory"));
});

function eccMemory({ id = "mem_auth_decision", title = "Auth flow decision", kind = "decision", status = "active", extraFrontmatter = "", body = DEFAULT_BODY } = {}) {
  return `---
schema: ecc.memory.v1
id: ${id}
title: ${title}
kind: ${kind}
scope: project
trust: unreviewed
status: ${status}
source_harness: claude
target_harnesses:
  - all
tags:
  - auth
links:
created_at: 2026-07-20T10:00:00.000Z
updated_at: 2026-07-21T09:30:00.000Z
${extraFrontmatter}---

${body}
`;
}

async function makeProject(prefix) {
  return mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
}

async function writeMemory(cwd, name, content) {
  const dir = path.join(cwd, ".ecc", "memory");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), content, { encoding: "utf8" });
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}
