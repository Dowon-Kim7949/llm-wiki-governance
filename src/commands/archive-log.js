// `archive-log` (1.33.0): moves change-log entries older than a retention window
// out of docs/llm-wiki/log.md into monthly volumes next to it
// (docs/llm-wiki/log-YYYY-MM.md).
//
// Why a write command may touch log.md at all: the log is append-only because it
// is historical evidence, and evidence is preserved as long as no ENTRY is ever
// edited. This command never edits an entry. It moves whole `## ` blocks — byte for
// byte, except that an entry added to an EXISTING volume takes that volume's line
// endings — and refuses to write unless re-parsing the planned files gives every
// original entry back exactly once (GATE_REVIEW "Change-Log Volume Scope Decision").
//
// Why volumes sit NEXT TO log.md and not in a subdirectory: an entry's relative
// links (./index.md, ../../src/...) stay valid only in the same directory. A
// deeper archive would force rewriting links inside entries, which is editing them.
//
// Preview by default; --write applies. Each file is written to a temporary sibling
// (never a *.md name) and renamed into place, volumes first and log.md last. A run
// interrupted between two renames leaves an entry in both log.md and its volume,
// never in neither, and the next run finds the copy already in the volume and only
// removes it from log.md (alreadyArchived). Depends only on the Node stdlib and
// leaf modules; no back-dependency on commands.js.
import path from "node:path";
import { randomBytes } from "node:crypto";
import { readdir, rename, rm, writeFile } from "node:fs/promises";
import { findMojibakeIndicators, readUtf8 } from "../encoding.js";
import { parseFrontmatter } from "../frontmatter.js";
import { formatFinding, withText } from "./findings.js";
import { parseLogEntries } from "./wiki-hygiene.js";

export const DEFAULT_KEEP_MONTHS = 2;

const LOG_REL = "docs/llm-wiki/log.md";
const REPORT_TITLE = "LLM-WIKI Archive Log";

function shiftMonth(month, delta) {
  const [year, mon] = month.split("-").map(Number);
  const total = year * 12 + (mon - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function describeValue(value) {
  return typeof value === "string" ? JSON.stringify(value) : String(value);
}

// The CLI rejects a bad --keep-months as a usage error (exit 3) before any command
// runs. A programmatic caller gets the same refusal rather than the default
// window: a write command must not reinterpret the scope it was asked for.
function resolveKeepMonths(value) {
  if (value === undefined || value === null) return DEFAULT_KEEP_MONTHS;
  if (Number.isInteger(value) && value > 0) return value;
  throw new RangeError(`keepMonths (--keep-months) must be a positive integer: ${describeValue(value)}`);
}

// The clock is injectable (options.now: a Date or an ISO string) so the
// future-dated cut is testable; it is used for nothing else but the default
// last_updated stamp of a new volume.
function resolveNow(value) {
  if (value === undefined || value === null) return new Date();
  const date = value instanceof Date ? new Date(value.getTime()) : typeof value === "string" ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new RangeError(`now must be a Date or an ISO date string: ${describeValue(value)}`);
  }
  return date;
}

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

// One day of slack past today (UTC) so an entry written in a time zone ahead of
// UTC is not held back; anything later is a typo, not a log entry.
function tomorrowUtc(now) {
  return isoDay(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)));
}

function detectEol(text) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function withTrailingEol(text, eol) {
  return /\n$/.test(text) ? text : `${text}${eol}`;
}

function toEol(text, eol) {
  return text.replace(/\r?\n/g, eol);
}

// Identity of a block as written into one file. Trailing whitespace is ignored
// only because a block that was last in log.md may gain a line ending once
// another block follows it.
function exactKey(text) {
  return text.trimEnd();
}

// Identity of an entry across files: line endings are ignored as well, because an
// entry added to an existing volume takes that volume's line endings.
function contentKey(text) {
  return text.replace(/\r\n/g, "\n").trimEnd();
}

function countKeys(keys) {
  const counts = new Map();
  for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
  return counts;
}

function sameMultiset(left, right) {
  if (left.length !== right.length) return false;
  const counts = countKeys(left);
  for (const key of right) {
    const remaining = counts.get(key) ?? 0;
    if (remaining === 0) return false;
    counts.set(key, remaining - 1);
  }
  return true;
}

function sameSequence(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function volumeHeader(month, logFrontmatter, eol, today) {
  const field = (name, fallback) => {
    const value = logFrontmatter && logFrontmatter[name];
    return typeof value === "string" && value.trim() !== "" ? value : fallback;
  };
  const title = `${field("title", "LLM-WIKI Change Log")} — ${month}`;
  const lines = [
    "---",
    `title: ${title}`,
    "tags:",
    "  - llm-wiki",
    "status: needs_review",
    "doc_type: change_log",
    `project: ${field("project", "llm-wiki")}`,
    `last_updated: ${today}`,
    "author: llm-wiki archive-log",
    "last_edited_by: llm-wiki archive-log",
    `wiki_block_version: ${field("wiki_block_version", "v1")}`,
    // A volume cites no source: it is a record, never a drift target.
    "source_files:",
    "evidence:",
    "related:",
    "  - docs/llm-wiki/log.md",
    `visibility: ${field("visibility", "internal")}`,
    "contains_sensitive_info: false",
    "---",
    "",
    `# ${title}`,
    "",
    `Entries from ${month}, moved out of [log.md](./log.md) by \`llm-wiki archive-log\` without editing them. Like log.md, this file is an immutable record: entries are never edited here. Entries keep the order they had in log.md; entries moved by a later run are placed above the ones already here.`,
    "",
    ""
  ];
  return lines.join(eol);
}

// The temporary sibling a file is written to before it is renamed into place:
// same directory (so the rename stays on one filesystem), a dot-prefixed unique
// name, and a .tmp extension, so a leftover is never enumerated as a wiki document.
export function atomicTempPath(file) {
  return path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}-${randomBytes(6).toString("hex")}.tmp`);
}

export async function writeFileAtomic(file, text) {
  const temp = atomicTempPath(file);
  try {
    // "wx": never write through a name that already exists.
    await writeFile(temp, text, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    // EEXIST means the name belongs to someone else; anything else may have left
    // a partial file of ours.
    if (!error || error.code !== "EEXIST") await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
  try {
    await rename(temp, file);
  } catch (error) {
    await rm(temp, { force: true }).catch(() => {});
    throw error;
  }
}

async function listDirectory(dir) {
  try {
    return await readdir(dir);
  } catch (error) {
    if (error && (error.code === "ENOENT" || error.code === "ENOTDIR")) return [];
    throw error;
  }
}

// Same rule id and message as the encoding scan, so explain/i18n already cover it.
function mojibakeFinding(rel) {
  return { severity: "blocked", rule: "encoding.mojibake", path: rel, message: "Mojibake indicators detected; automatic rewrite skipped." };
}

function unclosedFenceFinding(rel, line) {
  return {
    severity: "blocked",
    rule: "archive.integrity",
    path: rel,
    message: `${path.posix.basename(rel)} ends inside a code fence opened at line ${line}; every heading after it is code to a renderer, so its entries cannot be told apart. Nothing was written.`,
    params: { line }
  };
}

function caseConflictFinding(plannedRel, actualName) {
  return {
    severity: "blocked",
    rule: "archive.volume_conflict",
    path: `docs/llm-wiki/${actualName}`,
    message: `${actualName} differs from the planned volume ${path.posix.basename(plannedRel)} only by letter case: a case-insensitive filesystem would merge the volume into it, a case-sensitive one would create a second record for the month. Nothing was written.`,
    params: { planned: plannedRel }
  };
}

function report(fields, sections) {
  return withText({
    command: "archive-log",
    write: fields.write,
    dryRun: !fields.write,
    result: fields.result ?? "pass",
    keepMonths: fields.keepMonths,
    cutoffMonth: fields.cutoffMonth ?? null,
    planned: fields.planned ?? [],
    applied: fields.applied ?? [],
    alreadyArchived: fields.alreadyArchived ?? [],
    skipped: fields.skipped ?? [],
    findings: fields.findings ?? []
  }, REPORT_TITLE, sections);
}

function modeLine(write) {
  return `mode: ${write ? "write" : "dry-run"}`;
}

function nothingToDo(context, skipped, caveat, cutoffMonth = null) {
  const summary = [modeLine(context.write)];
  if (cutoffMonth) summary.push(`keep months: ${context.keepMonths} (entries from ${cutoffMonth} on stay in log.md)`);
  summary.push("entries to move: 0");
  return report({ ...context, cutoffMonth, skipped }, [
    { title: "Summary", body: summary },
    { title: "Skipped", body: skipped },
    { title: "Caveats", body: [caveat] }
  ]);
}

function blocked(context, findings, reason, extra = {}) {
  return report({ ...context, ...extra, result: "blocked", findings }, [
    { title: "Summary", body: [modeLine(context.write), `result: blocked (${reason})`] },
    { title: "Blocked", body: findings.map(formatFinding) },
    { title: "Caveats", body: ["Nothing was written. archive-log moves entries only when every file it would write can be read cleanly and re-parsed back into the original entries; fix the reported file rather than bypassing the check."] }
  ]);
}

export async function archiveLogCommand(options) {
  const write = options.write === true;
  const keepMonths = resolveKeepMonths(options.keepMonths);
  const now = resolveNow(options.now);
  const today = typeof options.today === "string" ? options.today : isoDay(now);
  const futureAfter = tomorrowUtc(now);
  const wikiRoot = path.join(options.cwd, "docs", "llm-wiki");
  const logFile = path.join(wikiRoot, "log.md");
  const context = { write, keepMonths };

  // One directory listing decides what exists, by exact name: pathExists would
  // answer yes for LOG.md on a case-insensitive filesystem and no on a
  // case-sensitive one, and this command must plan the same files on both.
  const names = await listDirectory(wikiRoot);
  if (!names.includes("log.md")) {
    return nothingToDo(context, [], "docs/llm-wiki/log.md does not exist; nothing to archive.");
  }

  const original = await readUtf8(logFile);
  if (findMojibakeIndicators(original).length > 0) {
    return blocked(context, [mojibakeFinding(LOG_REL)], "log.md does not decode cleanly");
  }
  const parsed = parseLogEntries(original);
  if (parsed.unclosedFenceLine !== null) {
    return blocked(context, [unclosedFenceFinding(LOG_REL, parsed.unclosedFenceLine)], "unterminated code fence in log.md");
  }

  // Only real, non-future dates take part. An impossible date (2026-13-01) or a
  // typo year (2062 for 2026) would otherwise either name a bogus volume or set the
  // window so far ahead that every genuine entry moves out of log.md.
  const eligible = [];
  const skipped = [];
  for (const block of parsed.blocks) {
    if (block.invalidDate) {
      skipped.push(`${LOG_REL}: "${block.heading}": invalid-date (${block.invalidDate} is not a calendar day); kept in place.`);
    } else if (!block.date) {
      skipped.push(`${LOG_REL}: "${block.heading}": undated (no leading YYYY-MM-DD date); kept in place.`);
    } else if (block.date > futureAfter) {
      skipped.push(`${LOG_REL}: "${block.heading}": future-dated (after ${futureAfter}, tomorrow in UTC); kept in place and left out of the retention window.`);
    } else {
      eligible.push(block);
    }
  }
  if (eligible.length === 0) {
    return nothingToDo(context, skipped, "No dated `## YYYY-MM-DD` entries were found; nothing to archive.");
  }

  const newestMonth = eligible.map((block) => block.month).sort().at(-1);
  const cutoffMonth = shiftMonth(newestMonth, -(keepMonths - 1));
  const moved = eligible.filter((block) => block.month < cutoffMonth);
  if (moved.length === 0) {
    return nothingToDo(context, skipped, "log.md already holds only the retention window.", cutoffMonth);
  }

  const movedSet = new Set(moved);
  const kept = parsed.blocks.filter((block) => !movedSet.has(block));
  const months = [...new Set(moved.map((block) => block.month))].sort().reverse();
  const logEol = detectEol(original);
  const logFrontmatter = parseFrontmatter(original).frontmatter;

  // Plan every file in memory first; collect every reason to refuse before
  // anything touches the disk.
  const refusals = [];
  const volumes = [];
  for (const month of months) {
    const name = `log-${month}.md`;
    const rel = `docs/llm-wiki/${name}`;
    for (const other of names) {
      if (other !== name && other.toLowerCase() === name) refusals.push(caseConflictFinding(rel, other));
    }
    const exists = names.includes(name);
    const before = exists ? await readUtf8(path.join(wikiRoot, name)) : null;
    if (before !== null && findMojibakeIndicators(before).length > 0) {
      refusals.push(mojibakeFinding(rel));
      continue;
    }
    // An empty (or whitespace-only) file is written like a new volume, header and
    // frontmatter included; otherwise it would stay a record with no frontmatter.
    const blank = before === null || before.trim() === "";
    const existing = blank ? null : parseLogEntries(before);
    if (existing && existing.unclosedFenceLine !== null) {
      refusals.push(unclosedFenceFinding(rel, existing.unclosedFenceLine));
      continue;
    }
    const eol = blank ? logEol : detectEol(before);
    let head = blank ? volumeHeader(month, logFrontmatter, eol, today) : existing.preamble;
    if (head !== "" && !head.endsWith("\n")) head += eol;
    const existingBlocks = existing ? existing.blocks : [];

    // An entry already in the volume (a previous run renamed the volume into place
    // and stopped before log.md) is not appended again, only removed from log.md.
    const pool = countKeys(existingBlocks.map((block) => contentKey(block.text)));
    const appended = [];
    const already = [];
    for (const block of moved.filter((item) => item.month === month)) {
      const key = contentKey(block.text);
      const remaining = pool.get(key) ?? 0;
      if (remaining > 0) {
        pool.set(key, remaining - 1);
        already.push(block);
      } else {
        appended.push(block);
      }
    }
    // log.md holds the newest entries, so what is still there for this month is
    // newer than what an earlier run moved: it goes above the existing entries.
    // A new volume takes the entries verbatim; an existing one gets its own EOL.
    const appendedTexts = appended.map((block) => withTrailingEol(blank ? block.text : toEol(block.text, eol), eol));
    const text = head + appendedTexts.join("") + existingBlocks.map((block) => block.text).join("");
    volumes.push({ month, rel, file: path.join(wikiRoot, name), exists, blank, head, appendedTexts, already, existingBlocks, text });
  }
  if (refusals.length > 0) {
    return blocked(context, refusals, "a planned volume cannot be written safely", { cutoffMonth, skipped });
  }

  const newLog = parsed.preamble + kept.map((block, index) => (index < kept.length - 1 ? withTrailingEol(block.text, logEol) : block.text)).join("");

  // Integrity: re-parse what would be written. log.md must give back exactly the
  // kept entries, each volume exactly its preamble + appended + previous entries,
  // and across all of them every original log.md entry must appear exactly once.
  const reparsedLog = parseLogEntries(newLog);
  let intact = reparsedLog.unclosedFenceLine === null
    && reparsedLog.preamble === parsed.preamble
    && sameSequence(reparsedLog.blocks.map((block) => exactKey(block.text)), kept.map((block) => exactKey(block.text)));
  const accounted = reparsedLog.blocks.map((block) => contentKey(block.text));
  for (const volume of volumes) {
    const reparsed = parseLogEntries(volume.text);
    const added = reparsed.blocks.slice(0, volume.appendedTexts.length);
    const previous = reparsed.blocks.slice(volume.appendedTexts.length);
    intact = intact
      && reparsed.unclosedFenceLine === null
      && reparsed.preamble === volume.head
      && sameSequence(added.map((block) => exactKey(block.text)), volume.appendedTexts.map(exactKey))
      && sameSequence(previous.map((block) => exactKey(block.text)), volume.existingBlocks.map((block) => exactKey(block.text)));
    accounted.push(...added.map((block) => contentKey(block.text)));
    const pool = countKeys(previous.map((block) => contentKey(block.text)));
    for (const block of volume.already) {
      const key = contentKey(block.text);
      const remaining = pool.get(key) ?? 0;
      if (remaining === 0) intact = false;
      else pool.set(key, remaining - 1);
      accounted.push(key);
    }
  }
  intact = intact && sameMultiset(accounted, parsed.blocks.map((block) => contentKey(block.text)));

  const changed = volumes.filter((volume) => volume.appendedTexts.length > 0);
  const plan = changed.map((volume) => ({
    month: volume.month,
    file: volume.rel,
    entries: volume.appendedTexts.length,
    existing: volume.exists
  }));
  const alreadyArchived = volumes.flatMap((volume) => volume.already.map((block) => ({ month: volume.month, file: volume.rel, heading: block.heading })));

  if (!intact) {
    const findings = [{
      severity: "blocked",
      rule: "archive.integrity",
      path: LOG_REL,
      message: "Re-parsing the planned files did not reproduce the original entries exactly; nothing was written.",
      params: {}
    }];
    return blocked(context, findings, "integrity check failed", { cutoffMonth, planned: plan, skipped });
  }

  if (write) {
    for (const volume of changed) await writeFileAtomic(volume.file, volume.text);
    await writeFileAtomic(logFile, newLog);
  }

  const lines = changed.map((volume) => {
    const count = volume.appendedTexts.length;
    const kind = !volume.exists ? "new volume" : volume.blank ? "empty file written as a new volume" : "added to an existing volume";
    return `${volume.rel}: ${count} entr${count === 1 ? "y" : "ies"} (${kind})`;
  });
  const alreadyLines = alreadyArchived.map((item) => `${item.file}: "${item.heading}" is already in the volume; removed from log.md only.`);
  return report({
    ...context,
    cutoffMonth,
    planned: write ? [] : plan,
    applied: write ? plan : [],
    alreadyArchived,
    skipped
  }, [
    {
      title: "Summary",
      body: [
        modeLine(write),
        `keep months: ${keepMonths} (entries from ${cutoffMonth} on stay in log.md)`,
        `entries to move: ${moved.length - alreadyArchived.length} into ${changed.length} volume${changed.length === 1 ? "" : "s"}`,
        `entries already in their volume (removed from log.md only): ${alreadyArchived.length}`,
        `entries kept in log.md: ${kept.length}`
      ]
    },
    { title: write ? "Applied" : "Planned", body: lines },
    { title: "Already Archived", body: alreadyLines },
    { title: "Skipped", body: skipped },
    {
      title: "Caveats",
      body: [
        write
          ? "Entries were moved without editing and verified by re-parsing before writing; an entry added to an existing volume takes that volume's line endings. Each file was written to a temporary sibling and renamed into place, volumes first and log.md last. Volumes are immutable records like log.md: review, drift, impact, and fix leave them alone."
          : "Preview only; no files were written. Run archive-log --write to apply.",
        "The retention window counts back from the newest valid dated entry, not from today. The clock is used only to hold back entries dated after tomorrow (UTC) as future-dated.",
        "New volumes start at status needs_review; like log.md, their status is set by hand because review does not cover change-log records."
      ]
    }
  ]);
}
