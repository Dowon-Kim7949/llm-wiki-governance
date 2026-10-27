// The date-anchored drift scan honors Markdown section citations (2026-10-27).
//
// 1.36.0 taught `impact` to compare a file cited only through line ranges or
// Markdown sections region by region. `drift` already narrowed line ranges (via
// `git log -L`) but treated a section like a bare path, so a document citing one
// section of a long guide drifted on every edit anywhere in it. A section is now
// compared between the repository as of the end of the review day and HEAD. The
// tests pin both directions: an edit outside the cited section is reported under
// locatorNarrowed instead of drifting, and every case that cannot be compared
// exactly still drifts at file level — narrowing must never become a false
// negative in a freshness gate.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { normalizeOptions } from "../src/index.js";
import { driftCommand } from "../src/commands.js";
import { scanEvidenceDriftDetailed } from "../src/commands/scans.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const GUIDE = [
  "# Manual",
  "",
  "## Install",
  "",
  "Run the installer.",
  "",
  "## Usage",
  "",
  "Call the tool.",
  "",
  "### Flags",
  "",
  "--x does y.",
  "",
  "## Troubleshooting",
  "",
  "Restart.",
  ""
].join("\n");

const wikiDoc = (cwd, name, sourceFiles, evidence) => writeFile(
  path.join(cwd, "docs", "llm-wiki", name),
  [
    "---", `title: ${name}`, "tags:", "  - llm-wiki", "  - verified", "status: verified",
    "doc_type: public_api", "project: sections", "last_updated: 2026-02-01",
    "author: cli-generated", "last_edited_by: t", "reviewed_by: t", "reviewed_at: 2026-02-01",
    "wiki_block_version: v1", "source_files:", ...sourceFiles.map((s) => `  - ${s}`),
    "evidence:", ...evidence.map((e) => `  - ${e}`),
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
    "contains_sensitive_info: false", "---", "", `# ${name}`, "", "Body.", ""
  ].join("\n"),
  { encoding: "utf8" }
);

// Both dates have to be set: `git log --since` and `rev-list --before` read the
// COMMITTER date, and `commit --date` sets only the author date.
function gitAt(cwd) {
  return (args, at) => execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@e",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@e",
      ...(at ? { GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at } : {})
    }
  });
}

const commit = (git, message, at) => {
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@e", "commit", "-m", message], at);
};

// Committed 2026-01-01, reviewed 2026-02-01, then <edit> committed 2026-03-01.
async function sectionRepo(docs, edit) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-drift-section-"));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "sections" }, null, 2)}\n`, { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await writeFile(path.join(cwd, "docs", "guide.md"), GUIDE, { encoding: "utf8" });
  await writeFile(path.join(cwd, "src", "tool.js"), "// ## Usage\nexport const tool = 1;\n", { encoding: "utf8" });
  for (const [name, sourceFiles, evidence] of docs) await wikiDoc(cwd, name, sourceFiles, evidence);
  const git = gitAt(cwd);
  git(["init"]);
  commit(git, "init", "2026-01-01T00:00:00+0000");
  await edit(cwd);
  commit(git, "edit", "2026-03-01T00:00:00+0000");
  return cwd;
}

const replaceIn = async (cwd, rel, from, to) => {
  const file = path.join(cwd, ...rel.split("/"));
  const before = await readFile(file, "utf8");
  assert.ok(before.includes(from), `fixture: ${rel} must contain ${JSON.stringify(from)}`);
  await writeFile(file, before.replace(from, to), { encoding: "utf8" });
};

const byPath = (findings) => new Map(findings.map((finding) => [finding.path, finding]));

test("an edit outside the cited section is reported as narrowed, not drift; broad citations still drift", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await sectionRepo([
    ["narrow.md", ["package.json"], ["docs/guide.md#section:Usage"]],
    ["broad.md", ["docs/guide.md"], ["docs/guide.md#section:Usage"]],
    ["bare.md", ["package.json"], ["docs/guide.md#section:Usage", "docs/guide.md"]],
    ["nonmd.md", ["package.json"], ["src/tool.js#section:Usage"]]
  ], async (dir) => {
    await replaceIn(dir, "docs/guide.md", "Restart.", "Restart, then retry.");
    await replaceIn(dir, "src/tool.js", "tool = 1", "tool = 2");
  });

  const { findings, locatorNarrowed } = await scanEvidenceDriftDetailed(cwd, {});
  const flagged = byPath(findings);
  assert.ok(!flagged.has("docs/llm-wiki/narrow.md"), "an edit in another section must not drift a document that cites only Usage");
  assert.deepEqual(locatorNarrowed, [
    { path: "docs/llm-wiki/narrow.md", source: "docs/guide.md", locators: ["#section:Usage"] }
  ], "and the skip is reported, not silent");
  assert.equal(flagged.get("docs/llm-wiki/broad.md")?.params.reference, "docs/guide.md", "a source_files entry keeps the whole file watched (N-7)");
  assert.equal(flagged.get("docs/llm-wiki/bare.md")?.params.reference, "docs/guide.md", "one bare citation keeps the whole file watched");
  assert.equal(flagged.get("docs/llm-wiki/nonmd.md")?.params.reference, "src/tool.js", "a section of a non-Markdown file cannot be located, so it stays file-level");
});

test("an edit inside the cited section, including a subsection, drifts and names the section", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await sectionRepo([
    ["narrow.md", ["package.json"], ["docs/guide.md#section:Usage"]]
  ], (dir) => replaceIn(dir, "docs/guide.md", "--x does y.", "--x does z."));

  const { findings, locatorNarrowed } = await scanEvidenceDriftDetailed(cwd, {});
  assert.equal(byPath(findings).get("docs/llm-wiki/narrow.md")?.params.reference, "docs/guide.md#section:Usage");
  assert.deepEqual(locatorNarrowed, []);
});

test("a cited section that can no longer be located drifts at file level", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // Renaming the heading leaves zero matches at HEAD; an ambiguous match (several
  // headings containing the text) is the same case on the other side.
  const renamed = await sectionRepo([
    ["narrow.md", ["package.json"], ["docs/guide.md#section:Usage"]]
  ], (dir) => replaceIn(dir, "docs/guide.md", "## Usage", "## How to call it"));
  assert.equal(byPath((await scanEvidenceDriftDetailed(renamed, {})).findings).get("docs/llm-wiki/narrow.md")?.params.reference, "docs/guide.md");

  const ambiguous = await sectionRepo([
    ["narrow.md", ["package.json"], ["docs/guide.md#section:Usage"]]
  ], (dir) => replaceIn(dir, "docs/guide.md", "## Troubleshooting", "## Usage problems"));
  assert.equal(byPath((await scanEvidenceDriftDetailed(ambiguous, {})).findings).get("docs/llm-wiki/narrow.md")?.params.reference, "docs/guide.md");
});

test("line ranges and sections of one file narrow together", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await sectionRepo([
    ["mixed.md", ["package.json"], ["docs/guide.md#L1-L1", "docs/guide.md#section:Install"]]
  ], (dir) => replaceIn(dir, "docs/guide.md", "Restart.", "Restart, then retry."));

  const { findings, locatorNarrowed } = await scanEvidenceDriftDetailed(cwd, {});
  assert.ok(!byPath(findings).has("docs/llm-wiki/mixed.md"), "until 1.37.0 a section next to a line range made the whole file broad");
  assert.deepEqual(locatorNarrowed.map((entry) => entry.locators), [["#L1", "#section:Install"]]);
});

test("the drift command reports locator_narrowed in JSON and text", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await sectionRepo([
    ["narrow.md", ["package.json"], ["docs/guide.md#section:Usage"]]
  ], (dir) => replaceIn(dir, "docs/guide.md", "Restart.", "Restart, then retry."));

  const result = await driftCommand(normalizeOptions({ cwd }));
  assert.equal(result.result, "pass");
  assert.deepEqual(result.locatorNarrowed, [
    { path: "docs/llm-wiki/narrow.md", source: "docs/guide.md", locators: ["#section:Usage"] }
  ]);
  assert.match(result.text, /locator_narrowed: 1 \(docs\/llm-wiki\/narrow\.md -> docs\/guide\.md\)/);
});
