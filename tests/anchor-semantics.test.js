// Anchor semantics: the broad/precise contract (N-7 re-examined), directory
// anchors in the reverse-impact gate (N-8), and the append-only log's scope.
//
// N-8 was measured across five repositories and then sat unfixed, and it was
// invisible to the suite: its fix landed with 568 of 568 tests still green, which
// is why this file exists.
//
// N-7 is the interesting one, because the answer is NOT a code change. It
// measured 58 of 58 line-range anchors never narrowing anything, and concluded
// the narrowing condition was broken. Re-examined 2026-09-08: `source_files` is
// the BROAD anchor by published contract (GLOSSARY.md) and `evidence` the precise
// one, so a document that lists a file in `source_files` has declared a
// whole-file dependency — the scan is doing what the vocabulary says. The way to
// ask for narrowing already exists and is tested below. Reading a locator in
// `source_files` as precise was implemented and reverted: no document in this
// repository writes one, and for an adopter it would silently narrow anchors they
// wrote as broad, which is a false negative in a freshness gate.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { verifiedSourceAnchors, scanEvidenceDrift, scanReverseImpact, scanSourceFiles } from "../src/commands/scans.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const FM = (extra) => ({
  status: "verified",
  doc_type: "public_api",
  reviewed_at: "2026-07-01",
  last_updated: "2026-07-01",
  ...extra
});

const wikiDoc = (cwd, name, sourceFiles, evidence, extra = []) => writeFile(
  path.join(cwd, "docs", "llm-wiki", name),
  [
    "---", `title: ${name}`, "tags:", "  - llm-wiki", "  - verified", "status: verified",
    "doc_type: public_api", "project: anchors", "last_updated: 2026-02-01",
    "author: cli-generated", "last_edited_by: t", "reviewed_by: t", "reviewed_at: 2026-02-01",
    "wiki_block_version: v1", "source_files:", ...sourceFiles.map((s) => `  - ${s}`),
    "evidence:", ...evidence.map((e) => `  - ${e}`),
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
    "contains_sensitive_info: false", ...extra, "---", "", `# ${name}`, "", "Body.", ""
  ].join("\n"),
  { encoding: "utf8" }
);

// ---------------------------------------------------------------------------
// The broad/precise contract, at the classifier
// ---------------------------------------------------------------------------

test("source_files is the broad anchor and evidence is the precise one", () => {
  const anchors = verifiedSourceAnchors(FM({
    source_files: ["src/cli.js"],
    evidence: ["src/commands.js#L10-L20"]
  }));
  assert.deepEqual(anchors.sources, ["src/cli.js"], "a bare source_files entry is broad");
  assert.deepEqual(anchors.evidenceRefs, [{ base: "src/commands.js", locator: { kind: "line", start: 10, end: 20 } }]);
  assert.deepEqual(anchors.files, ["src/cli.js", "src/commands.js"], "both are watched");
});

test("a broad anchor outranks a precise one for the SAME file, and that is the contract", () => {
  // This is the shape N-7 measured 58 times. It is not a defect: the document
  // said "the whole file backs me" in the field whose documented meaning is
  // exactly that. Pinned so a future change to narrow it has to argue with a
  // test rather than with a comment.
  const anchors = verifiedSourceAnchors(FM({
    source_files: ["src/big.ts"],
    evidence: ["src/big.ts#L1-L3"]
  }));
  assert.deepEqual(anchors.sources, ["src/big.ts"]);
  assert.deepEqual(anchors.files, ["src/big.ts"]);
});

// ---------------------------------------------------------------------------
// …and end to end: the escape hatch works
// ---------------------------------------------------------------------------

async function driftRepo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-anchor-drift-"));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "anchors" }, null, 2)}\n`, { encoding: "utf8" });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  const body = (tail) => Array.from({ length: 40 }, (_, i) => (i === 39 ? tail : `line ${i + 1}`)).join("\n") + "\n";
  await writeFile(path.join(cwd, "src", "big.ts"), body("line 40"), { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });

  // The escape hatch: cited ONLY in evidence, with a line range. source_files
  // points somewhere else, which validate accepts. Both documents are reviewed at
  // 2026-02-01, AFTER the init commit (2026-01-01) and BEFORE the tail commit
  // (now) — so the init commit is out of every baseline and only the tail edit can
  // produce a finding.
  await wikiDoc(cwd, "narrow.md", ["package.json"], ["src/big.ts#L1-L3"]);
  // The broad declaration: listed in source_files.
  await wikiDoc(cwd, "broad.md", ["src/big.ts"], ["src/big.ts"]);

  // `git log --since=<date>` filters on the COMMITTER date, and `commit --date=`
  // sets only the AUTHOR date — so dating the first commit that way leaves its
  // committer date at "now", every anchor looks changed, and the narrowing
  // assertion below fails for a reason that has nothing to do with narrowing.
  // Both dates have to be set, through the environment.
  const git = (args, at) => execFileSync("git", args, {
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
  git(["init"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@e", "commit", "-m", "init"], "2026-01-01T00:00:00+0000");

  // Change the END of the file, far from the cited range, after the baseline.
  await writeFile(path.join(cwd, "src", "big.ts"), body("line 40 CHANGED"), { encoding: "utf8" });
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@e", "commit", "-m", "touch the tail"], "2026-03-01T00:00:00+0000");
  return cwd;
}

test("an evidence-only line range narrows drift; a source_files entry still fires", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await driftRepo();
  const flagged = new Set((await scanEvidenceDrift(cwd, {})).map((finding) => finding.path));

  assert.ok(
    flagged.has("docs/llm-wiki/broad.md"),
    "a whole-file declaration must still be flagged — otherwise narrowing traded noise for a false negative"
  );
  assert.ok(
    !flagged.has("docs/llm-wiki/narrow.md"),
    "citing lines 1-3 in evidence alone must NOT be flagged by an edit to line 40 — this is the documented way to narrow"
  );
});

test("source_files.missing says what to do when the entry carries a locator", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-anchor-located-"));
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "src", "cli.js"), "export const x = 1;\n", { encoding: "utf8" });
  await wikiDoc(cwd, "located.md", ["src/cli.js#symbol:main", "src/gone.js"], []);

  const findings = (await scanSourceFiles(cwd)).filter((f) => f.rule === "source_files.missing");
  const located = findings.find((f) => f.params.source === "src/cli.js#symbol:main");
  const absent = findings.find((f) => f.params.source === "src/gone.js");

  assert.ok(located, "a locator in source_files is still reported");
  assert.match(located.message, /carries a locator/, "and it no longer claims an existing file does not exist");
  assert.match(located.message, /move the locator to evidence/, "the message names the fix");
  assert.ok(absent, "a genuinely absent path is still reported");
  assert.match(absent.message, /does not exist/, "and keeps the original wording");
});

// ---------------------------------------------------------------------------
// N-8: directory anchors in the reverse-impact gate
// ---------------------------------------------------------------------------

async function impactRepoWithDirAnchor() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-anchor-impact-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await wikiDoc(cwd, "dir.md", ["src/commands"], ["src/commands"]);
  await wikiDoc(cwd, "dirslash.md", ["src/commands/"], ["src/commands/"]);
  await wikiDoc(cwd, "file.md", ["src/cli.js"], ["src/cli.js"]);
  // A neighbour whose anchor is a parent of nothing changed — the control that
  // fails if the new matcher is too eager.
  await wikiDoc(cwd, "unrelated.md", ["src/mcp"], ["src/mcp"]);
  return cwd;
}

test("N-8: a directory anchor is flagged when a file under it changed", async () => {
  const cwd = await impactRepoWithDirAnchor();
  const flagged = new Set((await scanReverseImpact(cwd, new Set(["src/commands/scans.js"]))).map((f) => f.path));

  assert.ok(flagged.has("docs/llm-wiki/dir.md"), "`src/commands` must match `src/commands/scans.js`");
  assert.ok(flagged.has("docs/llm-wiki/dirslash.md"), "a trailing slash must not change the answer");
  assert.ok(!flagged.has("docs/llm-wiki/file.md"), "an unchanged file anchor must stay quiet");
  assert.ok(!flagged.has("docs/llm-wiki/unrelated.md"), "a directory containing nothing changed must stay quiet");
});

test("N-8: prefix matching cannot fire on a partial path segment", async () => {
  // `src/command` is not a parent of `src/commands/scans.js`, and a matcher built
  // on a bare startsWith would have said it was.
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-anchor-prefix-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await wikiDoc(cwd, "partial.md", ["src/command"], ["src/command"]);
  assert.deepEqual(
    await scanReverseImpact(cwd, new Set(["src/commands/scans.js"])),
    [],
    "`src/command` must not match `src/commands/...`"
  );
});

// ---------------------------------------------------------------------------
// The append-only log is out of scope for both gates (N-14 class)
// ---------------------------------------------------------------------------

test("the append-only change log is out of scope for the freshness gates", async () => {
  // review refuses to stamp log.md — both the --approve-all path and naming it
  // explicitly — so a flagged log.md would be a finding with no way to clear it,
  // the same shape as the template defect N-14. Today it is unreachable only
  // because the log happens to sit at needs_review; this pins the boundary so the
  // two enumerators cannot disagree if that ever changes.
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-anchor-log-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "log.md"),
    [
      "---", "title: LLM-WIKI Change Log", "tags:", "  - llm-wiki", "  - verified",
      "status: verified", "doc_type: change_log", "project: anchors",
      "last_updated: 2026-01-01", "author: cli-generated", "last_edited_by: t",
      "reviewed_by: t", "reviewed_at: 2026-01-01", "wiki_block_version: v1",
      "source_files:", "  - src/cli.js", "evidence:", "  - src/cli.js",
      "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
      "contains_sensitive_info: false", "---", "", "# Log", "", "Entries.", ""
    ].join("\n"),
    { encoding: "utf8" }
  );
  assert.deepEqual(
    await scanReverseImpact(cwd, new Set(["src/cli.js"])),
    [],
    "impact must not flag a document review cannot stamp"
  );
});
