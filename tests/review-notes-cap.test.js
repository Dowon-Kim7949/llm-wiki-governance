// The Review Notes cap and the archive's hand-counted headers (2026-08-03).
//
// ARCHITECTURE_CONVENTIONS states the rule: a document's `## Review Notes`
// section keeps the most recent 5 entries and older ones move verbatim to
// REVIEW_HISTORY.md. Nothing enforced it, and both halves rotted:
//
//   1. The cap was ignored. PUBLIC_API reached 38 entries, the roadmap 10,
//      BENCHMARK 8, EXAMPLES 8, domains/00_overview 8 — and the batch notes that
//      recorded the violation named only three of the five, because the list was
//      written by hand from memory instead of counted.
//   2. The archive's own counts drifted. Each header states `N건` and each origin
//      document states `(N entries, ...)`, both maintained by hand. On 2026-07-31
//      two headers were corrected (39→41, 44→47); the very next transfer computed
//      48 from the stale 47 while three more entries had already arrived, so the
//      Domain Features header claimed 48 over 51 actual entries. A count written
//      by hand next to the thing it counts will drift, and a document that states
//      a number is the strongest possible drift signal — so state it, and check it.
//
// The scope is deliberately every wiki document with a Review Notes section, not
// the "heavy documents" the prose used to say: "heavy" is not a predicate a test
// can evaluate, which is why the rule went unenforced for four days.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wikiDir = path.join(repoRoot, "docs", "llm-wiki");
const archivePath = path.join(wikiDir, "REVIEW_HISTORY.md");

const CAP = 5;

function rel(file) {
  return path.relative(repoRoot, file).split(path.sep).join("/");
}

async function wikiMarkdownFiles() {
  const out = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".md")) out.push(full);
    }
  }
  await walk(wikiDir);
  return out.sort();
}

// A note may wrap across lines (BENCHMARK.md does), so an entry is a line
// starting `- ` at column 0 and everything indented under it.
function sectionLines(text, heading) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${heading}\\s*$`).test(line));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s/.test(line));
  return end < 0 ? rest : rest.slice(0, end);
}

function countEntries(lines) {
  return lines.filter((line) => /^-\s/.test(line)).length;
}

// Each archive section is `## <Title>` followed by `원문서: [name](link) — N건(...)`.
function parseArchive(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading) {
      current = { title: heading[1], origin: null, claimed: null, entries: 0 };
      sections.push(current);
      continue;
    }
    if (!current) continue;
    if (/^원문서:/.test(line)) {
      current.origin = (/\]\(([^)]+)\)/.exec(line) || [])[1] ?? null;
      const claimed = /(\d+)건/.exec(line);
      current.claimed = claimed ? Number(claimed[1]) : null;
    }
    if (/^-\s/.test(line)) current.entries++;
  }
  return sections;
}

// `Older review notes (43 entries, ...) are archived in [REVIEW_HISTORY.md](...)`
function pointerCount(lines) {
  for (const line of lines) {
    const match = /Older review notes \((\d+) entries/.exec(line);
    if (match) return Number(match[1]);
  }
  return null;
}

function frontmatterList(text, key) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    const item = /^\s+-\s+(.+?)\s*$/.exec(line);
    if (!item) break;
    out.push(item[1]);
  }
  return out;
}

async function loadDocs() {
  const docs = [];
  for (const file of await wikiMarkdownFiles()) {
    const text = await readFile(file, "utf8");
    const notes = sectionLines(text, "Review Notes");
    if (!notes) continue;
    docs.push({ file, path: rel(file), entries: countEntries(notes), pointer: pointerCount(notes) });
  }
  return docs;
}

test("no wiki document holds more than five review notes", async () => {
  const docs = await loadDocs();
  assert.ok(docs.length > 0, "guard: no wiki document has a Review Notes section; this test checked nothing");

  const offenders = docs
    .filter((doc) => doc.entries > CAP)
    .map((doc) => `${doc.path}: ${doc.entries} entries`);

  assert.deepEqual(
    offenders,
    [],
    `move the oldest entries verbatim to REVIEW_HISTORY.md so each document keeps ${CAP}:\n${offenders.join("\n")}`
  );
});

test("every archive section names a real origin document and counts its own entries correctly", async () => {
  const text = await readFile(archivePath, "utf8");
  const sections = parseArchive(text);
  assert.ok(sections.length > 0, "guard: REVIEW_HISTORY.md has no sections; this test checked nothing");

  const problems = [];
  for (const section of sections) {
    if (!section.origin) {
      problems.push(`section "${section.title}": no 원문서 line naming the origin document`);
      continue;
    }
    const originPath = path.resolve(wikiDir, section.origin);
    try {
      await readFile(originPath, "utf8");
    } catch {
      problems.push(`section "${section.title}": 원문서 link ${section.origin} does not resolve`);
    }
    if (section.claimed === null) {
      problems.push(`section "${section.title}": 원문서 line states no N건 count`);
    } else if (section.claimed !== section.entries) {
      problems.push(`section "${section.title}": header says ${section.claimed}건, section holds ${section.entries}`);
    }
  }

  assert.deepEqual(problems, [], `the archive's hand-written counts drifted:\n${problems.join("\n")}`);
});

test("archive sections and origin documents agree on the entry count and on each other", async () => {
  const archiveText = await readFile(archivePath, "utf8");
  const sections = parseArchive(archiveText);
  const grounded = new Set(frontmatterList(archiveText, "source_files"));

  const problems = [];
  const archivedOrigins = new Set();
  for (const section of sections) {
    if (!section.origin) continue;
    const originPath = path.resolve(wikiDir, section.origin);
    const originRel = rel(originPath);
    archivedOrigins.add(originRel);

    let originText;
    try {
      originText = await readFile(originPath, "utf8");
    } catch {
      continue; // already reported by the section test
    }

    const notes = sectionLines(originText, "Review Notes");
    if (!notes) {
      problems.push(`${originRel}: archived in "${section.title}" but has no Review Notes section`);
      continue;
    }
    const pointer = pointerCount(notes);
    if (pointer === null) {
      problems.push(`${originRel}: entries were archived but the document does not point readers at REVIEW_HISTORY.md`);
    } else if (pointer !== section.entries) {
      problems.push(`${originRel}: pointer says ${pointer} entries, archive section "${section.title}" holds ${section.entries}`);
    }

    if (!grounded.has(originRel)) {
      problems.push(`REVIEW_HISTORY.md source_files does not list ${originRel}, whose entries it stores`);
    }
  }

  assert.ok(archivedOrigins.size > 0, "guard: no archive section resolved to an origin document");
  assert.deepEqual(problems, [], `the archive and its origin documents disagree:\n${problems.join("\n")}`);
});
