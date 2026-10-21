// archive-log (1.33.0): moving older change-log entries into monthly volumes
// without editing a single entry (GATE_REVIEW "Change-Log Volume Scope Decision").
//
// The property that earns this command the right to touch log.md is that every
// entry comes out byte for byte, so most assertions below compare raw text.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { archiveLogCommand, graphCommand, nextCommand, reviewCommand, statsCommand, validateCommand } from "../src/commands.js";
import { atomicTempPath, writeFileAtomic } from "../src/commands/archive-log.js";
import { parseLogEntries } from "../src/commands/wiki-hygiene.js";
import { isAppendOnlyLog } from "../src/commands/wiki-files.js";
import { helpText } from "../src/cli.js";
import * as api from "../src/index.js";

for (const [name, value] of [
  ["archiveLogCommand", archiveLogCommand],
  ["graphCommand", graphCommand],
  ["nextCommand", nextCommand],
  ["reviewCommand", reviewCommand],
  ["statsCommand", statsCommand],
  ["validateCommand", validateCommand],
  ["atomicTempPath", atomicTempPath],
  ["writeFileAtomic", writeFileAtomic],
  ["parseLogEntries", parseLogEntries],
  ["isAppendOnlyLog", isAppendOnlyLog],
  ["helpText", helpText]
]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

const BIN = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "llm-wiki.js");

const FRONTMATTER = [
  "---",
  "title: LLM-WIKI Change Log",
  "tags:",
  "  - llm-wiki",
  "status: verified",
  "doc_type: change_log",
  "project: demo",
  "last_updated: 2026-10-01",
  "author: test",
  "last_edited_by: test",
  "wiki_block_version: v1",
  "visibility: internal",
  "contains_sensitive_info: false",
  "---",
  ""
].join("\n");

const PREAMBLE = `${FRONTMATTER}\n# LLM-WIKI Change Log\n\nAppend-only. Newest first.\n\n`;

const ENTRIES = {
  oct: "## 2026-10-01 - feat: newest\n\n- status: needs_review\n- changed: src/a.js\n\n",
  sep: "## 2026-09-15 - fix: september\n\n- see [index](./index.md)\n\n```md\n## 2026-01-01 - not a heading, inside a fence\n```\n\n",
  undated: "## Notes kept by hand\n\nNot an entry.\n\n",
  augNew: "## 2026-08-20 - docs: august newer\n\n- body\n\n",
  augOld: "## 2026-08-02 - docs: august older\n\n- body\n\n",
  jul: "## 2026-07-22 - init: first\n\n- body\n"
};

async function makeWiki(logText) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-archive-log-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "demo" }), "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "log.md"), logText, "utf8");
  return cwd;
}

function fullLog() {
  return PREAMBLE + ENTRIES.oct + ENTRIES.sep + ENTRIES.undated + ENTRIES.augNew + ENTRIES.augOld + ENTRIES.jul;
}

const read = (cwd, rel) => readFile(path.join(cwd, ...rel.split("/")), "utf8");

test("parseLogEntries: preamble + blocks reproduce the input exactly; fenced and frontmatter lines never split", () => {
  const text = fullLog();
  const { preamble, blocks } = parseLogEntries(text);
  assert.equal(preamble + blocks.map((b) => b.text).join(""), text);
  assert.equal(preamble, PREAMBLE);
  assert.deepEqual(blocks.map((b) => b.month), ["2026-10", "2026-09", null, "2026-08", "2026-08", "2026-07"]);
  assert.ok(blocks[1].text.includes("not a heading, inside a fence"), "a ## line inside a code fence stays in its block");
});

test("archive-log previews by default and writes nothing", async () => {
  const cwd = await makeWiki(fullLog());
  const result = await archiveLogCommand({ cwd });
  assert.equal(result.command, "archive-log");
  assert.equal(result.dryRun, true);
  assert.equal(result.result, "pass");
  assert.equal(result.keepMonths, 2);
  assert.equal(result.cutoffMonth, "2026-09");
  assert.deepEqual(result.planned, [
    { month: "2026-08", file: "docs/llm-wiki/log-2026-08.md", entries: 2, existing: false },
    { month: "2026-07", file: "docs/llm-wiki/log-2026-07.md", entries: 1, existing: false }
  ]);
  assert.deepEqual(result.applied, []);
  assert.ok(result.skipped.some((line) => line.includes("Notes kept by hand")), "undated sections are reported, not moved");
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), fullLog());
  await assert.rejects(read(cwd, "docs/llm-wiki/log-2026-08.md"));
});

test("archive-log --write moves whole entries byte for byte and keeps the window, preamble, and undated sections", async () => {
  const cwd = await makeWiki(fullLog());
  const result = await archiveLogCommand({ cwd, write: true, today: "2026-10-02" });
  assert.equal(result.result, "pass");
  assert.equal(result.applied.length, 2);

  const log = await read(cwd, "docs/llm-wiki/log.md");
  assert.equal(log, PREAMBLE + ENTRIES.oct + ENTRIES.sep + ENTRIES.undated);

  const aug = await read(cwd, "docs/llm-wiki/log-2026-08.md");
  assert.ok(aug.endsWith(ENTRIES.augNew + ENTRIES.augOld), "entries keep their order and bytes");
  assert.match(aug, /^---\ntitle: LLM-WIKI Change Log — 2026-08\n/);
  assert.match(aug, /\nstatus: needs_review\n/, "a tool-created record never seeds verified");
  assert.match(aug, /\nlast_updated: 2026-10-02\n/);

  const jul = await read(cwd, "docs/llm-wiki/log-2026-07.md");
  assert.ok(jul.endsWith(ENTRIES.jul), "the last entry, without a trailing blank line, moves verbatim");

  // Every original entry exists exactly once across log.md and the volumes.
  const all = [log, aug, jul].flatMap((text) => parseLogEntries(text).blocks.map((b) => b.text.trimEnd()));
  const original = parseLogEntries(fullLog()).blocks.map((b) => b.text.trimEnd());
  assert.deepEqual([...all].sort(), [...original].sort());

  // Idempotent: a second run has nothing to move.
  const again = await archiveLogCommand({ cwd, write: true });
  assert.deepEqual(again.applied, []);
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), log);
});

test("archive-log adds later entries for an already-archived month on top of its volume", async () => {
  const cwd = await makeWiki(fullLog());
  await archiveLogCommand({ cwd, write: true });
  const late = "## 2026-08-31 - docs: backdated\n\n- body\n\n";
  const logPath = path.join(cwd, "docs", "llm-wiki", "log.md");
  await writeFile(logPath, (await readFile(logPath, "utf8")) + late, "utf8");

  const result = await archiveLogCommand({ cwd, write: true });
  assert.deepEqual(result.applied, [{ month: "2026-08", file: "docs/llm-wiki/log-2026-08.md", entries: 1, existing: true }]);
  const aug = await read(cwd, "docs/llm-wiki/log-2026-08.md");
  assert.ok(aug.endsWith(late + ENTRIES.augNew + ENTRIES.augOld));
  assert.equal(aug.match(/^title: /gm).length, 1, "the existing header is kept, not duplicated");
});

test("archive-log preserves CRLF line endings", async () => {
  const crlf = fullLog().replace(/\n/g, "\r\n");
  const cwd = await makeWiki(crlf);
  await archiveLogCommand({ cwd, write: true });
  const log = await read(cwd, "docs/llm-wiki/log.md");
  const aug = await read(cwd, "docs/llm-wiki/log-2026-08.md");
  assert.ok(!/[^\r]\n/.test(log), "log.md stays CRLF");
  assert.ok(!/[^\r]\n/.test(aug), "the new volume is written CRLF");
  assert.ok(aug.endsWith((ENTRIES.augNew + ENTRIES.augOld).replace(/\n/g, "\r\n")));
});

test("archive-log --keep-months widens the window; nothing to move is a clean pass", async () => {
  const cwd = await makeWiki(fullLog());
  const result = await archiveLogCommand({ cwd, keepMonths: 4 });
  assert.equal(result.cutoffMonth, "2026-07");
  assert.deepEqual(result.planned, []);
  assert.equal(result.result, "pass");
});

test("archive-log on a wiki without log.md, or a log without dated entries, writes nothing", async () => {
  const empty = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-archive-log-none-"));
  const none = await archiveLogCommand({ cwd: empty, write: true });
  assert.equal(none.result, "pass");
  assert.deepEqual(none.applied, []);

  const undated = await makeWiki(PREAMBLE + ENTRIES.undated);
  const res = await archiveLogCommand({ cwd: undated, write: true });
  assert.deepEqual(res.applied, []);
  assert.equal(await read(undated, "docs/llm-wiki/log.md"), PREAMBLE + ENTRIES.undated);
});

test("monthly volumes are change-log records: review and the freshness gates leave them alone", async () => {
  assert.equal(isAppendOnlyLog("docs/llm-wiki/log.md"), true);
  assert.equal(isAppendOnlyLog("docs/llm-wiki/log-2026-08.md"), true);
  assert.equal(isAppendOnlyLog("docs/llm-wiki/log-2026.md"), false);
  assert.equal(isAppendOnlyLog("docs/llm-wiki/domains/log-2026-08.md"), false);

  const cwd = await makeWiki(fullLog());
  await archiveLogCommand({ cwd, write: true });
  const review = await reviewCommand({ ...api.normalizeOptions({ cwd }), approve: ["docs/llm-wiki/log-2026-08.md"] });
  assert.ok(!(review.approved ?? []).some((item) => String(item.path ?? item).includes("log-2026-08.md")), "review never approves a volume");

  const { options } = await api.resolveOptions({ cwd });
  const validation = await validateCommand(options);
  const volumeFindings = validation.findings.filter((f) => /log-2026-0[78]\.md$/.test(f.path ?? ""));
  assert.deepEqual(volumeFindings, [], "a written volume passes validate on its own");
});

test("CLI: --keep-months must be a positive integer (usage error, exit 3)", () => {
  for (const bad of ["0", "-1", "abc", "1.5"]) {
    let status = 0;
    try {
      execFileSync(process.execPath, [BIN, "archive-log", "--keep-months", bad], { stdio: "pipe" });
    } catch (error) {
      status = error.status;
    }
    assert.equal(status, 3, `--keep-months ${bad}`);
  }
});

test("CLI: archive-log --format json carries the documented top-level keys", async () => {
  const cwd = await makeWiki(fullLog());
  const out = execFileSync(process.execPath, [BIN, "archive-log", "--cwd", cwd, "--format", "json"], { encoding: "utf8" });
  const json = JSON.parse(out);
  for (const key of ["schemaVersion", "command", "write", "dryRun", "result", "keepMonths", "cutoffMonth", "planned", "applied", "alreadyArchived", "skipped", "findings"]) {
    assert.ok(key in json, `json has ${key}`);
  }
  assert.equal(json.schemaVersion, api.SCHEMA_VERSION);
});

// ---------------------------------------------------------------------------
// Pre-release review fixes (1.33.0). Each test below failed against the first
// implementation.

const entry = (date, title = "x") => `## ${date} - ${title}\n\n- body ${date}\n\n`;
const logPathOf = (cwd) => path.join(cwd, "docs", "llm-wiki", "log.md");
const wikiDirOf = (cwd) => path.join(cwd, "docs", "llm-wiki");

test("parseLogEntries: a heading date that is not a calendar day is not a date", () => {
  const { blocks } = parseLogEntries(entry("2024-02-29", "leap") + entry("2026-02-29", "not leap") + entry("2026-13-01") + entry("2026-00-07") + entry("2026-04-31") + entry("2026-12-31"));
  assert.deepEqual(blocks.map((b) => b.month), ["2024-02", null, null, null, null, "2026-12"]);
  assert.deepEqual(blocks.map((b) => b.invalidDate), [null, "2026-02-29", "2026-13-01", "2026-00-07", "2026-04-31", null]);
});

test("archive-log: an impossible calendar date is held in log.md as invalid-date and never sets the window or names a volume", async () => {
  const bad = ["2026-99-01", "2026-13-01", "2026-00-07", "2026-02-29"];
  const log = PREAMBLE + entry(bad[0], "typo newest") + entry("2026-10-01") + entry("2026-09-01") + entry(bad[1]) + entry(bad[2]) + entry(bad[3]) + entry("2026-08-01");
  const cwd = await makeWiki(log);
  const result = await archiveLogCommand({ cwd, write: true, now: "2026-10-20T00:00:00Z" });
  assert.equal(result.result, "pass");
  assert.equal(result.cutoffMonth, "2026-09", "the window counts back from the newest VALID date");
  assert.deepEqual(result.applied.map((p) => [p.month, p.entries]), [["2026-08", 1]]);
  for (const date of bad) {
    assert.ok(result.skipped.some((line) => line.includes(date) && line.includes("invalid-date")), `${date} reported as invalid-date`);
  }
  const after = await read(cwd, "docs/llm-wiki/log.md");
  for (const date of bad) assert.ok(after.includes(`## ${date} - `), `${date} stays in log.md`);
  assert.deepEqual((await readdir(wikiDirOf(cwd))).sort(), ["log-2026-08.md", "log.md"]);
});

test("archive-log: an entry dated after tomorrow (UTC) is held as future-dated and left out of the window; the clock is injectable", async () => {
  const log = PREAMBLE + entry("2062-10-01", "typo of 2026") + entry("2026-10-21", "tomorrow") + entry("2026-10-01") + entry("2026-09-20") + entry("2026-08-01");
  const cwd = await makeWiki(log);
  const result = await archiveLogCommand({ cwd, write: true, now: new Date("2026-10-20T23:30:00Z") });
  assert.equal(result.cutoffMonth, "2026-09", "a typo year must not push every real entry out of the window");
  assert.deepEqual(result.applied.map((p) => [p.month, p.entries]), [["2026-08", 1]]);
  assert.ok(result.skipped.some((line) => line.includes("2062-10-01") && line.includes("future-dated")));
  assert.ok(!result.skipped.some((line) => line.includes('"2026-10-21 - tomorrow"')), "today + 1 day is still accepted (time zones)");
  const after = await read(cwd, "docs/llm-wiki/log.md");
  assert.ok(after.includes("## 2062-10-01 - typo of 2026"));
  assert.ok(after.includes("## 2026-09-20 - x"));

  const earlier = await archiveLogCommand({ cwd: await makeWiki(log), now: "2026-10-19" });
  assert.ok(earlier.skipped.some((line) => line.includes('"2026-10-21 - tomorrow"') && line.includes("future-dated")), "the injected clock decides what is future");
  await assert.rejects(archiveLogCommand({ cwd, now: "not a date" }), RangeError);
});

test("archive-log: a log.md or an existing volume that does not decode cleanly blocks the run (encoding.mojibake) and nothing is written", async () => {
  const log = PREAMBLE + entry("2026-10-01") + entry("2026-09-01") + entry("2026-08-20");
  const cwd = await makeWiki(log);
  const volumePath = path.join(wikiDirOf(cwd), "log-2026-08.md");
  const head = Buffer.from("---\ntitle: v\nstatus: needs_review\ndoc_type: change_log\n---\n\n# v\n\n## 2026-08-01 - old\n\n- ", "utf8");
  const cp949 = Buffer.from([0xc7, 0xd1, 0xb1, 0xdb, 0x0a]); // CP949 text: invalid UTF-8
  const bytes = Buffer.concat([head, cp949]);
  await writeFile(volumePath, bytes);
  const result = await archiveLogCommand({ cwd, write: true });
  assert.equal(result.result, "blocked");
  assert.deepEqual(result.findings.map((f) => [f.severity, f.rule, f.path]), [["blocked", "encoding.mojibake", "docs/llm-wiki/log-2026-08.md"]]);
  assert.deepEqual(result.applied, []);
  assert.ok((await readFile(volumePath)).equals(bytes), "the volume keeps its original bytes");
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), log);

  const broken = await makeWiki(`${PREAMBLE}${entry("2026-10-01")}${entry("2026-09-01")}## 2026-08-01 - �\n`);
  const fromLog = await archiveLogCommand({ cwd: broken, write: true });
  assert.equal(fromLog.result, "blocked");
  assert.deepEqual(fromLog.findings.map((f) => [f.rule, f.path]), [["encoding.mojibake", "docs/llm-wiki/log.md"]]);
});

test("archive-log: rerunning after an interrupted write removes what is already in its volume from log.md without appending it twice", async () => {
  const cwd = await makeWiki(fullLog());
  await archiveLogCommand({ cwd, write: true, today: "2026-10-02" });
  const aug = await read(cwd, "docs/llm-wiki/log-2026-08.md");
  const jul = await read(cwd, "docs/llm-wiki/log-2026-07.md");

  // Every volume was written, log.md never was.
  await writeFile(logPathOf(cwd), fullLog(), "utf8");
  const preview = await archiveLogCommand({ cwd });
  assert.deepEqual(preview.planned, []);
  assert.equal(preview.alreadyArchived.length, 3);
  const rerun = await archiveLogCommand({ cwd, write: true });
  assert.equal(rerun.result, "pass");
  assert.deepEqual(rerun.applied, [], "nothing is appended a second time");
  assert.deepEqual(rerun.alreadyArchived.map((e) => [e.file, e.heading]), [
    ["docs/llm-wiki/log-2026-08.md", "2026-08-20 - docs: august newer"],
    ["docs/llm-wiki/log-2026-08.md", "2026-08-02 - docs: august older"],
    ["docs/llm-wiki/log-2026-07.md", "2026-07-22 - init: first"]
  ]);
  assert.equal(await read(cwd, "docs/llm-wiki/log-2026-08.md"), aug);
  assert.equal(await read(cwd, "docs/llm-wiki/log-2026-07.md"), jul);
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), PREAMBLE + ENTRIES.oct + ENTRIES.sep + ENTRIES.undated);

  // Only the first volume was written.
  await writeFile(logPathOf(cwd), fullLog(), "utf8");
  await rm(path.join(wikiDirOf(cwd), "log-2026-07.md"));
  const partial = await archiveLogCommand({ cwd, write: true, today: "2026-10-02" });
  assert.deepEqual(partial.applied, [{ month: "2026-07", file: "docs/llm-wiki/log-2026-07.md", entries: 1, existing: false }]);
  assert.deepEqual(partial.alreadyArchived.map((e) => e.month), ["2026-08", "2026-08"]);
  assert.equal(await read(cwd, "docs/llm-wiki/log-2026-08.md"), aug);
  assert.equal(await read(cwd, "docs/llm-wiki/log-2026-07.md"), jul);
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), PREAMBLE + ENTRIES.oct + ENTRIES.sep + ENTRIES.undated);
});

test("archive-log: files are written through a same-directory non-.md temp file, and a failed rename leaves no temp file behind", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-archive-atomic-"));
  const target = path.join(dir, "log-2026-08.md");
  const temp = atomicTempPath(target);
  assert.equal(path.dirname(temp), dir);
  assert.ok(!/\.md$/i.test(temp), "a leftover temp file must never be read as a wiki document");
  assert.notEqual(atomicTempPath(target), temp, "temp names do not collide");

  await writeFileAtomic(target, "hello\n");
  assert.equal(await readFile(target, "utf8"), "hello\n");
  assert.deepEqual(await readdir(dir), ["log-2026-08.md"]);

  // A non-empty directory in the way makes the rename fail on every platform.
  const occupied = path.join(dir, "log-2026-07.md");
  await mkdir(path.join(occupied, "x"), { recursive: true });
  await assert.rejects(writeFileAtomic(occupied, "data\n"));
  assert.deepEqual((await readdir(dir)).sort(), ["log-2026-07.md", "log-2026-08.md"]);
});

test("archive-log: a log.md that ends inside an unterminated code fence is blocked with the fence's line, never silently misfiled", async () => {
  const log = `${PREAMBLE}${entry("2026-10-01")}${entry("2026-09-01")}## 2026-08-10 - fence\n\n\`\`\`js\nconst a = 1;\n\n${entry("2026-07-01")}${entry("2026-06-01")}`;
  const cwd = await makeWiki(log);
  const result = await archiveLogCommand({ cwd, write: true });
  assert.equal(result.result, "blocked");
  const fenceLine = log.split("\n").indexOf("```js") + 1;
  assert.deepEqual(result.findings.map((f) => [f.severity, f.rule, f.params.line]), [["blocked", "archive.integrity", fenceLine]]);
  assert.match(result.findings[0].message, new RegExp(`line ${fenceLine}\\b`));
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), log);
  assert.deepEqual(await readdir(wikiDirOf(cwd)), ["log.md"]);
});

test("parseLogEntries follows CommonMark fences: same character, at least as long, only spaces after; a backtick info string is not a fence", () => {
  const cases = [
    ["````md\n```\n## 2026-01-01 - inside\n````\n", 0],
    ["~~~\n```\n## 2026-01-01 - inside\n~~~\n", 0],
    ["```\n``` not a closing fence\n## 2026-01-01 - inside\n```\n", 0],
    ["```\nx\n```   \n## 2026-01-01 - outside\n", 1],
    ["   ```\nx\n```\n## 2026-01-01 - outside\n", 1],
    ["```js`x\n## 2026-01-01 - outside\n", 1],
    ["    ```\n## 2026-01-01 - outside\n", 1]
  ];
  for (const [text, count] of cases) {
    const parsed = parseLogEntries(text);
    assert.equal(parsed.blocks.length, count, JSON.stringify(text));
    assert.equal(parsed.preamble + parsed.blocks.map((b) => b.text).join(""), text);
  }
  assert.equal(parseLogEntries("## 2026-01-01 - a\n\n```\nopen\n").unclosedFenceLine, 3);
  assert.equal(parseLogEntries("## 2026-01-01 - a\n\n```\nclosed\n```\n").unclosedFenceLine, null);
});

test("parseLogEntries: a UTF-8 BOM does not hide the first entry", () => {
  const text = `﻿${entry("2026-10-01")}${entry("2026-09-01")}`;
  const parsed = parseLogEntries(text);
  assert.deepEqual(parsed.blocks.map((b) => b.month), ["2026-10", "2026-09"]);
  assert.equal(parsed.preamble, "﻿");
  assert.equal(parsed.preamble + parsed.blocks.map((b) => b.text).join(""), text);
});

test("archive-log: a file whose name differs from a planned volume only by case blocks the run on every platform", async () => {
  const log = PREAMBLE + entry("2026-10-01") + entry("2026-09-01") + entry("2026-08-20");
  const cwd = await makeWiki(log);
  const other = path.join(wikiDirOf(cwd), "LOG-2026-08.md");
  await writeFile(other, "# hand-made\n", "utf8");
  const result = await archiveLogCommand({ cwd, write: true });
  assert.equal(result.result, "blocked");
  assert.deepEqual(result.findings.map((f) => [f.severity, f.rule, f.path]), [["blocked", "archive.volume_conflict", "docs/llm-wiki/LOG-2026-08.md"]]);
  assert.equal(await readFile(other, "utf8"), "# hand-made\n");
  assert.deepEqual((await readdir(wikiDirOf(cwd))).sort(), ["LOG-2026-08.md", "log.md"]);
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), log);
  assert.equal(isAppendOnlyLog("docs/llm-wiki/LOG-2026-08.md"), false, "only the lowercase canonical name is a volume");
  assert.equal(isAppendOnlyLog("docs/llm-wiki/log-2026-13.md"), false, "only a real month names a volume");
  assert.equal(isAppendOnlyLog("docs/llm-wiki/log-2026-00.md"), false, "only a real month names a volume");

  // The log itself is found by exact name too, so LOG.md means "no log" on every platform.
  const upper = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-archive-log-upper-"));
  await mkdir(wikiDirOf(upper), { recursive: true });
  await writeFile(path.join(wikiDirOf(upper), "LOG.md"), log, "utf8");
  const none = await archiveLogCommand({ cwd: upper, write: true });
  assert.equal(none.result, "pass");
  assert.deepEqual(none.applied, []);
  assert.deepEqual(await readdir(wikiDirOf(upper)), ["LOG.md"]);
});

test("archive-log: an existing empty or whitespace-only volume is written like a new one, header and frontmatter included", async () => {
  for (const blank of ["", "  \n\n"]) {
    const cwd = await makeWiki(PREAMBLE + entry("2026-10-01") + entry("2026-09-01") + entry("2026-08-01"));
    await writeFile(path.join(wikiDirOf(cwd), "log-2026-08.md"), blank, "utf8");
    const result = await archiveLogCommand({ cwd, write: true, today: "2026-10-02" });
    assert.equal(result.result, "pass", JSON.stringify(blank));
    const volume = await read(cwd, "docs/llm-wiki/log-2026-08.md");
    assert.match(volume, /^---\ntitle: LLM-WIKI Change Log — 2026-08\n/);
    assert.ok(volume.endsWith(entry("2026-08-01")));
    const { options } = await api.resolveOptions({ cwd });
    const findings = (await validateCommand(options)).findings.filter((f) => /log-2026-08\.md$/.test(f.path ?? ""));
    assert.deepEqual(findings, [], JSON.stringify(blank));
  }
});

test("archive-log: the volume header states the real order, and entries added to an existing volume take that volume's line endings", async () => {
  const cwd = await makeWiki(fullLog());
  await archiveLogCommand({ cwd, write: true });
  const aug = await read(cwd, "docs/llm-wiki/log-2026-08.md");
  assert.doesNotMatch(aug, /newest entry comes first/);
  assert.match(aug, /keep the order they had in log\.md/);

  const volumeHead = "---\ntitle: v\nstatus: needs_review\ndoc_type: change_log\nproject: demo\nlast_updated: 2026-09-01\nauthor: t\nlast_edited_by: t\nwiki_block_version: v1\nvisibility: internal\ncontains_sensitive_info: false\n---\n\n# v\n\n";
  const lfVolume = `${volumeHead}## 2026-08-01 - old\n\n- body\n`;

  const lfLog = await makeWiki(PREAMBLE + entry("2026-10-01") + entry("2026-09-01") + entry("2026-08-20"));
  await writeFile(path.join(wikiDirOf(lfLog), "log-2026-08.md"), lfVolume.replace(/\n/g, "\r\n"), "utf8");
  assert.equal((await archiveLogCommand({ cwd: lfLog, write: true })).result, "pass");
  const intoCrlf = await read(lfLog, "docs/llm-wiki/log-2026-08.md");
  assert.ok(!/[^\r]\n/.test(intoCrlf), "no bare LF inside a CRLF volume");
  assert.ok(intoCrlf.includes(`${entry("2026-08-20")}## 2026-08-01 - old`.replace(/\n/g, "\r\n")));

  const crlfLog = await makeWiki((PREAMBLE + entry("2026-10-01") + entry("2026-09-01") + entry("2026-08-20")).replace(/\n/g, "\r\n"));
  await writeFile(path.join(wikiDirOf(crlfLog), "log-2026-08.md"), lfVolume, "utf8");
  assert.equal((await archiveLogCommand({ cwd: crlfLog, write: true })).result, "pass");
  const intoLf = await read(crlfLog, "docs/llm-wiki/log-2026-08.md");
  assert.ok(!intoLf.includes("\r"), "no CR inside an LF volume");
  assert.ok(intoLf.includes(`${entry("2026-08-20")}## 2026-08-01 - old`));
  assert.ok(!/[^\r]\n/.test(await read(crlfLog, "docs/llm-wiki/log.md")), "log.md keeps its own CRLF");
});

test("archive-log API: an invalid keepMonths is rejected like the CLI usage error, never replaced by the default", async () => {
  const cwd = await makeWiki(fullLog());
  for (const bad of [0, -1, 1.5, "1", "abc", true, Number.NaN]) {
    await assert.rejects(
      archiveLogCommand({ cwd, write: true, keepMonths: bad }),
      (error) => error instanceof RangeError && /keep-months/.test(error.message),
      `keepMonths ${String(bad)}`
    );
  }
  assert.equal(await read(cwd, "docs/llm-wiki/log.md"), fullLog(), "nothing was written");
  assert.equal((await archiveLogCommand({ cwd })).keepMonths, 2, "omitted means the default");
  assert.equal((await archiveLogCommand(api.normalizeOptions({ cwd }))).keepMonths, 2, "the CLI's null default means the default");
});

test("help: the global Safety section states archive-log's write boundary", () => {
  const safety = helpText().split("\nSafety:\n")[1].split("\n\n")[0];
  const line = safety.split("\n").find((entry) => entry.trim().startsWith("archive-log "));
  assert.ok(line, "Safety has an archive-log line");
  assert.match(line, /previews by default and writes only with --write/);
  assert.match(line, /never writes outside docs\/llm-wiki/);
});

test("monthly volumes do not move health_score, evidence coverage, or orphan counts (stats, graph, next)", async () => {
  const cwd = await makeWiki(fullLog());
  await writeFile(path.join(wikiDirOf(cwd), "index.md"), [
    "---", "title: Index", "status: verified", "doc_type: index", "project: demo", "last_updated: 2026-10-01",
    "author: test", "last_edited_by: test", "wiki_block_version: v1", "source_files:", "  - package.json",
    "visibility: internal", "contains_sensitive_info: false", "---", "", "# Index", "", "- [log](./log.md)", ""
  ].join("\n"), "utf8");
  const { options } = await api.resolveOptions({ cwd });
  const snapshot = async () => {
    const { stats } = await statsCommand(options);
    const { graph } = await graphCommand({ ...options, format: "json" });
    const next = await nextCommand(options);
    const orphanAction = next.actions.find((action) => action.id === "connect-orphan-documents");
    return {
      stats: {
        documents: stats.documents,
        healthScore: stats.healthScore,
        status: stats.status,
        verifiedPct: stats.verifiedPct,
        evidenceBacked: stats.evidenceBacked,
        evidencePct: stats.evidencePct,
        orphanDocuments: stats.orphanDocuments
      },
      graphOrphans: graph.orphanDocuments,
      nextOrphans: orphanAction ? orphanAction.paths : []
    };
  };
  const before = await snapshot();
  const result = await archiveLogCommand({ cwd, write: true });
  assert.equal(result.applied.length, 2, "two volumes were created");
  assert.deepEqual(await snapshot(), before);
});
