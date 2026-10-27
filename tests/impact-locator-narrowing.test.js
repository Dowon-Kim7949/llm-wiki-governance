// impact honors line and Markdown-section locators (2026-10-27). Until now a
// verified document that cited `guide.md#section:Install` failed impact when ANY
// line of guide.md moved, because the scan compared file names only. A file cited
// ONLY in evidence, only through line ranges or Markdown sections, is now compared
// region by region against the baseline; an unchanged region is reported under
// locatorNarrowed instead of failing. Everything that cannot be compared exactly
// stays file-level — that is the half these tests pin hardest, because the gate is
// an error by default and a narrowing that guesses wrong is a false negative.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { impactCommand } from "../src/commands.js";
import { locatedRegion } from "../src/commands/scans.js";
import { normalizeOptions } from "../src/index.js";

for (const [name, value] of [["execFileSync", execFileSync], ["impactCommand", impactCommand], ["locatedRegion", locatedRegion], ["normalizeOptions", normalizeOptions]]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

const GUIDE = [
  "# Guide", "", "## Install", "", "npm i x", "", "### Install on Windows", "", "use npx", "",
  "## Usage", "", "```bash", "# Install comment inside a fence is not a heading", "run x", "```", "", "call x", ""
].join("\n");
const CODE = ["line 1", "line 2", "line 3", "line 4", "line 5", ""].join("\n");

function verifiedDoc({ sourceFiles = [], evidence = [] }) {
  return [
    "---", "title: Api", "tags:", "  - llm-wiki", "status: verified",
    "doc_type: public_api", "project: narrowing", "last_updated: 2026-10-01",
    "author: cli-generated", "reviewed_by: Someone", "reviewed_at: 2026-10-01",
    "wiki_block_version: v1",
    ...(sourceFiles.length ? ["source_files:", ...sourceFiles.map((entry) => `  - ${entry}`)] : ["source_files: []"]),
    ...(evidence.length ? ["evidence:", ...evidence.map((entry) => `  - ${entry}`)] : []),
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
    "contains_sensitive_info: false", "---", "", "# Api", "", "Describes the sources.", ""
  ].join("\n");
}

async function repo(doc) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-impact-narrow-"));
  await writeFile(path.join(cwd, "guide.md"), GUIDE, "utf8");
  await writeFile(path.join(cwd, "code.ts"), CODE, "utf8");
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "api.md"), verifiedDoc(doc), "utf8");
  const git = (args) => execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, ...GIT_ENV } });
  git(["init", "-q"]);
  git(["config", "core.autocrlf", "false"]);
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "base"]);
  return { cwd, git };
}

async function edit(cwd, file, from, to) {
  const target = path.join(cwd, file);
  await writeFile(target, (await readFile(target, "utf8")).replace(from, to), "utf8");
}

const failedOn = (result) => result.findings.filter((finding) => finding.rule === "impact.source_changed").map((finding) => finding.params.sources);

test("locatedRegion: a section runs to the next heading of the same or a higher level", () => {
  const install = locatedRegion(GUIDE, { kind: "section", value: "Install" });
  assert.equal(install, null, "'Install' matches two headings (Install, Install on Windows), so it is ambiguous");
  const usage = locatedRegion(GUIDE, { kind: "section", value: "usage" });
  assert.ok(usage.startsWith("## Usage"));
  assert.ok(usage.includes("# Install comment inside a fence"), "a # line inside a fenced block does not end the section");
  assert.ok(usage.includes("call x"));
  const windows = locatedRegion(GUIDE, { kind: "section", value: "Install on Windows" });
  assert.ok(windows.startsWith("### Install on Windows") && !windows.includes("## Usage"));
  assert.equal(locatedRegion(GUIDE, { kind: "section", value: "Missing" }), null);
});

test("locatedRegion: a line range past the end of the file cannot be located", () => {
  assert.equal(locatedRegion(CODE, { kind: "line", start: 2, end: 3 }), "line 2\nline 3");
  assert.equal(locatedRegion("a\r\nb\r\n", { kind: "line", start: 1, end: 2 }), "a\nb", "CRLF and LF read the same");
  assert.equal(locatedRegion(CODE, { kind: "line", start: 5, end: 40 }), null);
  assert.equal(locatedRegion(CODE, { kind: "symbol", value: "x" }), null, "symbols have no computable extent");
});

test("impact: an edit outside the only cited section is narrowed and reported, not failed", { skip: !hasGit() }, async () => {
  const { cwd } = await repo({ evidence: ["guide.md#section:Usage"] });
  await edit(cwd, "guide.md", "use npx", "use pnpm dlx");

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(result.result, "pass");
  assert.deepEqual(failedOn(result), []);
  assert.deepEqual(result.locatorNarrowed, [{ path: "docs/llm-wiki/api.md", source: "guide.md", locators: ["#section:Usage"] }]);
  assert.match(result.text, /locator_narrowed: 1 \(docs\/llm-wiki\/api\.md -> guide\.md\)/);
  assert.deepEqual(result.changedPaths, ["guide.md"], "the file is still reported as changed");
});

test("impact: an edit inside the cited section still fails", { skip: !hasGit() }, async () => {
  const { cwd } = await repo({ evidence: ["guide.md#section:Usage"] });
  await edit(cwd, "guide.md", "call x", "call y");

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(result.result, "fail");
  assert.deepEqual(failedOn(result), ["guide.md"]);
  assert.deepEqual(result.locatorNarrowed, []);
});

test("impact: a line range narrows; an edit inside it, or a shift that moves it, still fails", { skip: !hasGit() }, async () => {
  const outside = await repo({ evidence: ["code.ts#L1-L2"] });
  await edit(outside.cwd, "code.ts", "line 4", "line four");
  const narrowed = await impactCommand(normalizeOptions({ cwd: outside.cwd }));
  assert.equal(narrowed.result, "pass");
  assert.deepEqual(narrowed.locatorNarrowed, [{ path: "docs/llm-wiki/api.md", source: "code.ts", locators: ["#L1-L2"] }]);

  const inside = await repo({ evidence: ["code.ts:2"] });
  await edit(inside.cwd, "code.ts", "line 2", "line two");
  assert.deepEqual(failedOn(await impactCommand(normalizeOptions({ cwd: inside.cwd }))), ["code.ts"]);

  const shifted = await repo({ evidence: ["code.ts#L3-L4"] });
  await edit(shifted.cwd, "code.ts", "line 1\n", "line 0\nline 1\n");
  assert.deepEqual(failedOn(await impactCommand(normalizeOptions({ cwd: shifted.cwd }))), ["code.ts"],
    "positions are compared, not tracked: a shift is reported, never hidden");
});

test("impact: any broad citation of the same file keeps it file-level", { skip: !hasGit() }, async () => {
  const cases = [
    { sourceFiles: ["guide.md"], evidence: ["guide.md#section:Usage"] },
    { evidence: ["guide.md#section:Usage", "guide.md"] },
    { evidence: ["guide.md#section:Usage", "guide.md#symbol:x"] },
    { evidence: ["guide.md#section:Install"] }, // ambiguous heading
    { evidence: ["code.ts#L4-L40"] } // range past the end
  ];
  for (const doc of cases) {
    const { cwd } = await repo(doc);
    await edit(cwd, "guide.md", "use npx", "use pnpm dlx");
    await edit(cwd, "code.ts", "line 5", "line five");
    const result = await impactCommand(normalizeOptions({ cwd }));
    assert.equal(result.result, "fail", JSON.stringify(doc));
    assert.deepEqual(result.locatorNarrowed, [], JSON.stringify(doc));
  }
});

test("impact: a section of a non-Markdown file stays file-level", { skip: !hasGit() }, async () => {
  const { cwd } = await repo({ evidence: ["code.ts#section:line 1"] });
  await edit(cwd, "code.ts", "line 5", "line five");
  assert.deepEqual(failedOn(await impactCommand(normalizeOptions({ cwd }))), ["code.ts"]);
});

test("impact: --since compares against that ref, not HEAD", { skip: !hasGit() }, async () => {
  const { cwd, git } = await repo({ evidence: ["guide.md#section:Usage"] });
  git(["tag", "base"]);
  await edit(cwd, "guide.md", "call x", "call y");
  git(["commit", "-q", "-am", "touch usage"]);

  const sinceBase = await impactCommand(normalizeOptions({ cwd, since: "base" }));
  assert.deepEqual(failedOn(sinceBase), ["guide.md"], "the cited section changed between base and the working tree");
  const sinceHead = await impactCommand(normalizeOptions({ cwd, since: "HEAD" }));
  assert.deepEqual(sinceHead.changedPaths, []);
});

test("impact: a new file with no baseline copy is not narrowed", { skip: !hasGit() }, async () => {
  const { cwd } = await repo({ evidence: ["fresh.md#section:Usage"] });
  await writeFile(path.join(cwd, "fresh.md"), "## Usage\n\nnew\n", "utf8");
  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.deepEqual(failedOn(result), ["fresh.md"]);
  assert.deepEqual(result.locatorNarrowed, []);
});
