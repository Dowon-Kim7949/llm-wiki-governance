// monorepo's CLI contract (2026-07-31). monorepo was the only command missing
// from both COMMAND_OPTION_RULES and COMMAND_HELP, so `monorepo --strict --write`
// exited 0 with no usage error while every other command rejects an unsupported
// option with exit 3, and `help monorepo` reported "Unknown help topic" (exit 3).
//
// The load-bearing property is that the whitelist matches what the command
// ACTUALLY honors, not what its documentation guessed: monorepoCommand spreads its
// options into each package's validateCommand, so --strict really does escalate
// per-package severities. --type/--profile are explicitly overridden per package
// (type: null, profiles: []), so accepting them would silently do nothing.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parseArgs, main } from "../src/cli.js";
import { normalizeOptions } from "../src/index.js";
import { monorepoCommand } from "../src/commands.js";

const PACKAGE_DOC = `---
title: Index
tags:
  - llm-wiki
status: needs_review
doc_type: index
project: fixture
last_updated: 2026-07-31
author: cli-generated
last_edited_by: cli
wiki_block_version: v1
source_files:
  - package.json
evidence:
  - src/missing.js#L1
related:
  - docs/llm-wiki/index.md
visibility: internal
contains_sensitive_info: false
---

# Index

Fixture package wiki whose evidence cites a file that does not exist, so
evidence.missing fires as a warning and --strict escalates it to an error.

## Evidence

- src/missing.js#L1
`;

// A root package.json with npm workspaces plus one workspace package that has a
// wiki. detectWorkspaces reads the root manifest; monorepoCommand validates each
// package that has docs/llm-wiki.
async function makeWorkspace() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-monorepo-"));
  await writeFile(
    path.join(cwd, "package.json"),
    JSON.stringify({ name: "root", private: true, workspaces: ["packages/a"] }),
    "utf8"
  );
  const pkg = path.join(cwd, "packages", "a");
  await mkdir(path.join(pkg, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(pkg, "package.json"), JSON.stringify({ name: "a", version: "0.0.0" }), "utf8");
  await writeFile(path.join(pkg, "docs", "llm-wiki", "index.md"), PACKAGE_DOC, "utf8");
  return cwd;
}

function evidenceMissing(result) {
  const finding = (result.findings ?? []).find((entry) => entry.rule === "evidence.missing");
  assert.ok(finding, "fixture must produce an evidence.missing finding");
  return finding;
}

test("monorepo: an unsupported option is a usage error, like every other command", () => {
  const { errors } = parseArgs(["monorepo", "--write"]);
  assert.ok(
    errors.some((error) => /Option --write is not supported by monorepo\./.test(error)),
    `monorepo must reject --write; got ${JSON.stringify(errors)}`
  );
});

test("monorepo: --type and --profile are rejected because they are overridden per package", () => {
  for (const option of ["type", "profile"]) {
    const { errors } = parseArgs(["monorepo", `--${option}`, "library"]);
    assert.ok(
      errors.some((error) => new RegExp(`Option --${option} is not supported by monorepo\\.`).test(error)),
      `monorepo must reject --${option}; got ${JSON.stringify(errors)}`
    );
  }
});

test("monorepo: the options it actually honors stay accepted", () => {
  const accepted = [
    ["monorepo"],
    ["monorepo", "--strict"],
    ["monorepo", "--cwd", "."],
    ["monorepo", "--agent", "codex"],
    ["monorepo", "--format", "json"],
    ["monorepo", "--out", "report.md"],
    ["monorepo", "--lang", "ko"]
  ];
  for (const argv of accepted) {
    const { errors } = parseArgs(argv);
    assert.deepEqual(errors, [], `${argv.join(" ")} must not be a usage error`);
  }
});

test("monorepo: --strict really does escalate a per-package finding", async () => {
  const cwd = await makeWorkspace();
  const lax = await monorepoCommand(normalizeOptions({ cwd, strict: false }));
  const strict = await monorepoCommand(normalizeOptions({ cwd, strict: true }));

  assert.equal(evidenceMissing(lax).severity, "warning");
  assert.equal(evidenceMissing(strict).severity, "error");
  // This is why --strict must stay on the whitelist: rejecting it would remove a
  // flag the command genuinely applies to every package it validates.
  assert.equal(lax.result, "warning");
  assert.equal(strict.result, "fail");
});

test("monorepo: findings are prefixed with the package path", async () => {
  const cwd = await makeWorkspace();
  const result = await monorepoCommand(normalizeOptions({ cwd }));
  assert.match(evidenceMissing(result).path, /^packages\/a::/);
});

test("help monorepo resolves to a real topic instead of exiting 3", async () => {
  const lines = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  console.log = (...args) => lines.push(args.join(" "));
  console.error = (...args) => lines.push(args.join(" "));
  try {
    const code = await main(["help", "monorepo"]);
    const text = lines.join("\n");
    assert.doesNotMatch(text, /Unknown help topic/);
    assert.equal(code, 0, "help monorepo must be a known topic");
    assert.match(text, /llm-wiki monorepo/);
    assert.match(text, /workspaces/);
    // Every other help topic documents its JSON shape; monorepo must too.
    assert.match(text, /JSON \(--format json\)/);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode;
  }
});
