// Wiki hygiene (1.33.0): the checks that keep a long-lived wiki CHEAP to read, and
// the change-log parser `archive-log` shares with them.
//
// Every rule here is opt-in, and none of them is part of any rulesPreset or
// governance mode. Two are toggled through config `rules` (the content.thin_body
// pattern) and two stay silent until a budget is configured (the
// harness.preload_budget pattern), so adding this module changes no finding, no
// exit code, and no output byte for a project that has not asked for it.
//
//   markdown_link.anchor_missing  a local link's #fragment names no heading in the
//                                 target document (markdown_link.missing drops the
//                                 fragment on purpose, so a renamed heading broke
//                                 every inbound anchor with every gate green)
//   content.dated_heading         a knowledge document carries a date in a heading,
//                                 i.e. history accreting outside log.md
//   budget.log_over               log.md exceeds wikiBudget.logTokens
//   budget.doc_over               a content document exceeds wikiBudget.docTokens
//
// Depends only on the Node stdlib and leaf modules; no back-dependency on
// commands.js.
import path from "node:path";
import { listMarkdownFiles, pathExists, toPosix } from "../files.js";
import { readUtf8 } from "../encoding.js";
import { parseFrontmatter } from "../frontmatter.js";
import { extractMarkdownLinkTargets, nextStopTable, resolveMarkdownLinkTarget } from "./references.js";
import { isAppendOnlyLog, isTemplateDoc, listWikiContentDocs } from "./wiki-files.js";
import { estimateTokens } from "./retrieval.js";
import { FRESHNESS_EXEMPT_DOC_TYPES } from "./scans.js";
import { DECISION_DOC_TYPES } from "./governance-mode.js";

// ---------------------------------------------------------------------------
// Markdown structure helpers

// CommonMark 4.5. An opening fence is 0-3 spaces of indent and a run of at least
// three backticks or tildes; a backtick fence's info string may not contain a
// backtick (such a line is inline code, not a fence). A closing fence uses the same
// character, is at least as long, and is followed by nothing but spaces or tabs.
const FENCE_OPEN_RE = /^ {0,3}(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE_RE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

// Splits text into lines that keep their own line ending, so callers can slice
// and re-join without touching a single byte.
export function splitLinesKeepEnds(text) {
  const lines = [];
  let start = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === "\n") {
      lines.push(text.slice(start, index + 1));
      start = index + 1;
    }
  }
  if (start < text.length) lines.push(text.slice(start));
  return lines;
}

function stripEol(line) {
  return line.replace(/\r?\n$/, "");
}

function openingFence(text) {
  const match = text.match(FENCE_OPEN_RE);
  if (!match) return null;
  if (match[1][0] === "`" && match[2].includes("`")) return null;
  return match[1];
}

function closesFence(text, fence) {
  const match = text.match(FENCE_CLOSE_RE);
  return Boolean(match) && match[1][0] === fence[0] && match[1].length >= fence.length;
}

// Marks which lines sit inside a leading frontmatter block or a fenced code block
// (a heading inside either is not a heading), and reports the index of a fence
// that is still open when the text ends — everything after it is code to a
// renderer, so a caller that splits on headings cannot trust the split.
function scanStructure(lines) {
  const mask = new Array(lines.length).fill(false);
  let index = 0;
  if (lines.length > 0 && stripEol(lines[0]).replace(/^﻿/, "") === "---") {
    mask[0] = true;
    for (index = 1; index < lines.length; index += 1) {
      mask[index] = true;
      if (stripEol(lines[index]) === "---") {
        index += 1;
        break;
      }
    }
  }
  let fence = null;
  let fenceStart = null;
  for (; index < lines.length; index += 1) {
    const text = stripEol(lines[index]);
    if (fence) {
      mask[index] = true;
      if (closesFence(text, fence)) {
        fence = null;
        fenceStart = null;
      }
    } else {
      const opened = openingFence(text);
      if (opened) {
        mask[index] = true;
        fence = opened;
        fenceStart = index;
      }
    }
  }
  return { mask, unclosedFence: fence ? fenceStart : null };
}

// Inline code spans on one line (CommonMark 6.1): a backtick run closed by the next
// run of the same length; an unmatched run is literal text. Returns
// [start, end, contentStart, contentEnd] per span.
function codeSpanRanges(line) {
  const ranges = [];
  let index = 0;
  while (index < line.length) {
    if (line[index] !== "`") {
      index += 1;
      continue;
    }
    let runEnd = index;
    while (runEnd < line.length && line[runEnd] === "`") runEnd += 1;
    const length = runEnd - index;
    let scan = runEnd;
    let close = -1;
    while (scan < line.length) {
      if (line[scan] !== "`") {
        scan += 1;
        continue;
      }
      let end = scan;
      while (end < line.length && line[end] === "`") end += 1;
      if (end - scan === length) {
        close = scan;
        break;
      }
      scan = end;
    }
    if (close === -1) {
      index = runEnd;
      continue;
    }
    ranges.push([index, close + length, runEnd, close]);
    index = close + length;
  }
  return ranges;
}

// The line with every inline code span replaced by spaces (same length), so a
// link or an id="" written as an example inside backticks is not read as one.
function blankCodeSpans(line) {
  let out = line;
  for (const [start, end] of codeSpanRanges(line)) {
    out = `${out.slice(0, start)}${" ".repeat(end - start)}${out.slice(end)}`;
  }
  return out;
}

// `_` emphasis delimiters, which GitHub drops from the rendered heading text. A run
// opens only when it is not glued to a letter or digit on its left, and closes only
// when it is not glued to one on its right, so snake_case and __dunder__ inside a
// word stay; an unmatched `_` stays. (`*` needs no handling: the slug drops it.)
//
// Until 1.35.x this was the regex
//   /(^|[^\p{L}\p{N}_])(_{1,3})(?=[^\s_])(.*?[^\s_])\2(?![\p{L}\p{N}_])/gu
// replaced with "$1$3" until nothing changed. Each pass re-scanned to the end of the
// line from every opener without a closer, and nested emphasis took one pass per
// level, so both shapes went quadratic. One pass is now a scan over code points with
// next-closer tables and gives the regex's result; the passes stop at
// MAX_EMPHASIS_PASSES, which only a heading nested deeper than that can notice.
const MAX_EMPHASIS_PASSES = 16;
// ASCII answers without a regex call; anything else asks the same classes the regex used.
const isWordChar = (ch) => {
  const code = ch.charCodeAt(0);
  if (code < 128) return (code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95;
  return /[\p{L}\p{N}_]/u.test(ch);
};
const isSpaceCodePoint = (ch) => {
  const code = ch.charCodeAt(0);
  if (code < 128) return code === 32 || (code >= 9 && code <= 13);
  return /\s/u.test(ch);
};
const isLineTerminator = (ch) => ch === "\n" || ch === "\r" || ch === "\u2028" || ch === "\u2029";

function emphasisPass(text) {
  if (!text.includes("_")) return text;
  const cp = Array.from(text);
  const n = cp.length;
  const runLength = new Int32Array(n + 1);
  for (let i = n - 1; i >= 0; i--) runLength[i] = cp[i] === "_" ? runLength[i + 1] + 1 : 0;
  // nextCloser[k][i]: the first e >= i where a closing run of exactly k underscores
  // starts: after a character that is neither whitespace nor "_", and not followed
  // by a letter, digit or "_".
  const nextCloser = [null];
  for (let k = 1; k <= 3; k++) {
    const table = new Int32Array(n + 1);
    table[n] = n;
    for (let e = n - 1; e >= 0; e--) {
      const closes = e > 0 && runLength[e] === k && !isSpaceCodePoint(cp[e - 1]) && cp[e - 1] !== "_" &&
        (e + k === n || !isWordChar(cp[e + k]));
      table[e] = closes ? e : table[e + 1];
    }
    nextCloser.push(table);
  }
  const nextBreak = new Int32Array(n + 1);
  nextBreak[n] = n;
  for (let i = n - 1; i >= 0; i--) nextBreak[i] = isLineTerminator(cp[i]) ? i : nextBreak[i + 1];

  // The emphasis whose opening run starts at `start`: [contentStart, closer, k], or null.
  const emphasisAt = (start) => {
    const k = runLength[start];
    const contentStart = start + k;
    if (k < 1 || k > 3 || contentStart >= n || isSpaceCodePoint(cp[contentStart]) || cp[contentStart] === "_") return null;
    const closer = nextCloser[k][contentStart + 1];
    return closer < n && closer <= nextBreak[contentStart] ? [contentStart, closer, k] : null;
  };

  let out = "";
  let copied = 0;
  let position = 0;
  while (position < n) {
    // `^` (position 0 only) is tried before `[^\p{L}\p{N}_]`, which keeps the
    // character in front of the run.
    let lead = 0;
    let found = position === 0 ? emphasisAt(0) : null;
    if (!found && !isWordChar(cp[position])) {
      lead = 1;
      found = emphasisAt(position + 1);
    }
    if (!found) {
      position += 1;
      continue;
    }
    const [contentStart, closer, k] = found;
    out += cp.slice(copied, position + lead).join("") + cp.slice(contentStart, closer).join("");
    position = closer + k;
    copied = position;
  }
  return out + cp.slice(copied).join("");
}

export function stripUnderscoreEmphasis(text) {
  let current = text;
  for (let pass = 0; pass < MAX_EMPHASIS_PASSES; pass++) {
    const next = emphasisPass(current);
    if (next === current) return current;
    current = next;
  }
  return current;
}

// The heading helpers below replace four regexes that backtracked in quadratic
// time on one long heading line (50,000 "<", "![" or spaces held validate for about
// a second with the anchor rule on, growing with the square):
//   closing hashes  /\s+#+\s*$/
//   image, link     /!\[([^\]]*)\]\([^)]*\)/g, /\[([^\]]*)\]\([^)]*\)/g
//   inline HTML     /<[^>]+>/g
// Each scanner gives the same result as its regex (tests/linear-markdown-scan.test.js
// compares them on random input). The tag remover is not an HTML sanitizer and does
// not need to be one: its output only feeds headingSlug, which keeps letters,
// numbers, "-", "_" and spaces, and is compared with link fragments, never rendered.
const isWhitespace = (ch) => /\s/.test(ch);

// /\s+#+\s*$/ removed: trailing whitespace, a run of "#", and the whitespace run
// before it, at the very end of the text.
export function trimClosingHashes(text) {
  let end = text.length;
  while (end > 0 && isWhitespace(text[end - 1])) end -= 1;
  const hashesEnd = end;
  while (end > 0 && text[end - 1] === "#") end -= 1;
  if (end === hashesEnd) return text;
  const hashesStart = end;
  while (end > 0 && isWhitespace(text[end - 1])) end -= 1;
  return end === hashesStart ? text : text.slice(0, end);
}

// `[label](destination)` -> `label`; with `image`, `![label](destination)` instead.
export function keepLinkLabels(text, image) {
  const opener = image ? "![" : "[";
  if (!text.includes("](")) return text;
  const bracketClose = nextStopTable(text, (ch) => ch === "]");
  const parenClose = nextStopTable(text, (ch) => ch === ")");
  let out = "";
  let copied = 0;
  let position = 0;
  for (let open = text.indexOf(opener); open !== -1; open = text.indexOf(opener, position)) {
    const labelStart = open + opener.length;
    const close = bracketClose[labelStart];
    const end = text[close] === "]" && text[close + 1] === "(" ? parenClose[close + 2] : text.length;
    if (end < text.length) {
      out += text.slice(copied, open) + text.slice(labelStart, close);
      copied = end + 1;
      position = end + 1;
    } else {
      position = open + 1;
    }
  }
  return out + text.slice(copied);
}

// /<[^>]+>/g removed: from each "<" to the next ">" with at least one character between.
export function dropInlineTags(text) {
  let out = "";
  let position = 0;
  while (position < text.length) {
    const open = text.indexOf("<", position);
    if (open === -1) break;
    const close = text.indexOf(">", open + 1);
    if (close === -1) break;
    if (close === open + 1) {
      out += text.slice(position, close);
      position = close;
      continue;
    }
    out += text.slice(position, open);
    position = close + 1;
  }
  return out + text.slice(position);
}

// Heading text as GitHub renders it for slugging: code span content kept literally,
// link and image text kept, destinations, inline HTML, emphasis delimiters, and
// code backticks dropped, closing #s trimmed.
function headingPlainText(raw) {
  const text = trimClosingHashes(String(raw ?? ""));
  const codes = [];
  let rest = "";
  let last = 0;
  for (const [start, end, contentStart, contentEnd] of codeSpanRanges(text)) {
    let content = text.slice(contentStart, contentEnd);
    if (content.length >= 2 && content.startsWith(" ") && content.endsWith(" ") && content.trim() !== "") {
      content = content.slice(1, -1);
    }
    rest += `${text.slice(last, start)}${codes.length}`;
    codes.push(content);
    last = end;
  }
  rest += text.slice(last);
  rest = dropInlineTags(keepLinkLabels(keepLinkLabels(rest, true), false));
  rest = stripUnderscoreEmphasis(rest).replace(/`/g, "");
  return rest.replace(/(\d+)/g, (whole, position) => codes[Number(position)]).trim();
}

// GitHub-style heading slug: lowercase, drop everything that is not a letter,
// mark, number, connector, hyphen or space, then spaces become hyphens. Unicode
// letters (Hangul, CJK, ...) are kept, which is what the renderer does.
export function headingSlug(text) {
  return headingPlainText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, "")
    .replace(/ /g, "-");
}

const ATX_HEADING_RE = /^ {0,3}#{1,6}(?:[ \t]+(.*))?$/;
// GitHub renders an ATX heading inside a blockquote with an anchor too.
const QUOTED_ATX_HEADING_RE = /^(?: {0,3}>[ \t]?)+ {0,3}#{1,6}(?:[ \t]+(.*))?$/;
const SETEXT_UNDERLINE_RE = /^ {0,3}(?:=+|-+)[ \t]*$/;
const THEMATIC_BREAK_RE = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
// A list item or a blockquote: a paragraph that starts here belongs to the
// container, so an unindented underline after it is a thematic break, not a
// setext heading.
const CONTAINER_START_RE = /^ {0,3}(?:[-+*]|\d{1,9}[.)])(?:[ \t]|$)|^ {0,3}>/;
const ANCHOR_ATTR_RE = /\b(?:id|name)\s*=\s*["']([^"']+)["']/g;

// Every anchor a document exposes: ATX and setext heading slugs with GitHub's
// duplicate suffixes, plus explicit HTML id/name attributes outside inline code.
export function documentAnchors(markdown) {
  const lines = splitLinesKeepEnds(String(markdown ?? "").replace(/^﻿/, ""));
  const { mask } = scanStructure(lines);
  const anchors = new Set();
  // github-slugger: a slug already handed out — by any heading, including one whose
  // own text ends in -N — bumps that base's counter until a free slug is found, so
  // `x`, `x-1`, `x` yields x, x-1, x-2.
  const occurrences = new Map();
  const addHeading = (rawText) => {
    const base = headingSlug(rawText);
    if (base === "") return;
    let slug = base;
    while (occurrences.has(slug)) {
      const next = occurrences.get(base) + 1;
      occurrences.set(base, next);
      slug = `${base}-${next}`;
    }
    occurrences.set(slug, 0);
    anchors.add(slug);
  };

  let paragraph = [];
  let inContainer = false;
  lines.forEach((line, index) => {
    if (mask[index]) {
      paragraph = [];
      inContainer = false;
      return;
    }
    const text = stripEol(line);
    for (const attr of blankCodeSpans(text).matchAll(ANCHOR_ATTR_RE)) {
      anchors.add(attr[1].toLowerCase());
    }
    if (text.trim() === "") {
      paragraph = [];
      inContainer = false;
      return;
    }
    const atx = text.match(ATX_HEADING_RE) ?? text.match(QUOTED_ATX_HEADING_RE);
    if (atx) {
      addHeading(atx[1] ?? "");
      paragraph = [];
      inContainer = false;
      return;
    }
    if (SETEXT_UNDERLINE_RE.test(text) && paragraph.length > 0 && !inContainer) {
      addHeading(paragraph.join(" "));
      paragraph = [];
      return;
    }
    if (SETEXT_UNDERLINE_RE.test(text) || THEMATIC_BREAK_RE.test(text)) {
      paragraph = [];
      inContainer = false;
      return;
    }
    if (CONTAINER_START_RE.test(text)) {
      paragraph = [];
      inContainer = true;
      return;
    }
    // A lazy continuation line of a list item or quote, or an indented code line.
    if (inContainer || (paragraph.length === 0 && /^(?: {4}|\t)/.test(text))) return;
    paragraph.push(text.trim());
  });
  return anchors;
}

// Text with frontmatter, fenced code, and inline code spans blanked out, so example
// links inside code samples are not treated as links.
function proseOnly(markdown) {
  const lines = splitLinesKeepEnds(String(markdown ?? ""));
  const { mask } = scanStructure(lines);
  return lines.map((line, index) => {
    if (mask[index]) return line.replace(/[^\r\n]/g, " ");
    const text = stripEol(line);
    return `${blankCodeSpans(text)}${line.slice(text.length)}`;
  }).join("");
}

function splitLinkFragment(target) {
  const trimmed = String(target).trim();
  const bare = trimmed.startsWith("<")
    ? trimmed.match(/^<([^>]+)>/)?.[1] ?? trimmed
    : trimmed.split(/\s+/)[0];
  const hashAt = bare.indexOf("#");
  if (hashAt === -1) return null;
  const pathPart = bare.slice(0, hashAt).split("?")[0];
  const fragment = bare.slice(hashAt + 1);
  const decode = (value) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };
  return { pathPart: decode(pathPart).replaceAll("\\", "/"), fragment: decode(fragment) };
}

// ---------------------------------------------------------------------------
// markdown_link.anchor_missing (opt-in via rules)

function ruleEnabled(options, rule) {
  const setting = options && options.rules && options.rules[rule];
  return Boolean(setting) && setting !== "off";
}

// GitHub prefixes every rendered heading and HTML id with this; links copied from
// the rendered page carry it.
const USER_CONTENT_PREFIX = "user-content-";

export async function scanAnchorLinks(cwd, options) {
  if (!ruleEnabled(options, "markdown_link.anchor_missing")) return [];
  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  if (!(await pathExists(wikiRoot))) return [];

  const anchorCache = new Map();
  const anchorsOf = async (file) => {
    if (!anchorCache.has(file)) anchorCache.set(file, documentAnchors(await readUtf8(file)));
    return anchorCache.get(file);
  };

  const findings = [];
  for (const file of await listMarkdownFiles(wikiRoot)) {
    const rel = toPosix(path.relative(cwd, file));
    // An immutable change-log record cannot be edited, so a historical anchor
    // that has since moved would be a finding with no resolution path (N-14).
    if (isAppendOnlyLog(rel) || isTemplateDoc(rel)) continue;
    const content = await readUtf8(file);

    for (const target of extractMarkdownLinkTargets(proseOnly(content))) {
      const parts = splitLinkFragment(target);
      if (!parts || parts.fragment === "") continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(parts.pathPart)) continue;

      let targetFile = file;
      if (parts.pathPart !== "") {
        if (!/\.md$/i.test(parts.pathPart)) continue;
        targetFile = resolveMarkdownLinkTarget(cwd, file, parts.pathPart);
        // A missing file is markdown_link.missing's finding, not this rule's.
        if (!(await pathExists(targetFile))) continue;
      }

      const anchors = await anchorsOf(targetFile);
      const wanted = parts.fragment.toLowerCase();
      const unprefixed = wanted.startsWith(USER_CONTENT_PREFIX) ? wanted.slice(USER_CONTENT_PREFIX.length) : null;
      if (!anchors.has(wanted) && !(unprefixed !== null && anchors.has(unprefixed))) {
        const link = `${parts.pathPart}#${parts.fragment}`;
        findings.push({
          severity: "warning",
          rule: "markdown_link.anchor_missing",
          path: rel,
          message: `Markdown link anchor does not match any heading in ${parts.pathPart === "" ? "this document" : parts.pathPart}: ${link}.`,
          params: { link }
        });
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// content.dated_heading (opt-in via rules)

// A date only when it stands on its own: glued to a letter, digit, underscore, or
// hyphen on its left it is part of an identifier (OPS-2026-10-01, v2026-10-01).
const DATE_IN_HEADING_RE = /(?<![A-Za-z0-9_-])(?:19|20)\d{2}-\d{2}-\d{2}\b/;

// Documents that ARE dated history by design: change logs, release notes (the
// freshness gates' exemption), and decision records (backfill's decision set).
const DATED_HISTORY_DOC_TYPES = new Set(["change_log", ...FRESHNESS_EXEMPT_DOC_TYPES, ...DECISION_DOC_TYPES]);

// History is expected to live in log.md. Documents that ARE history — the log,
// its monthly volumes, and anything typed as one of DATED_HISTORY_DOC_TYPES — are
// exempt, as are templates.
export async function scanDatedHeadings(cwd, options) {
  if (!ruleEnabled(options, "content.dated_heading")) return [];
  const findings = [];
  for (const file of await listWikiContentDocs(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    if (isAppendOnlyLog(rel)) continue;
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const declared = parsed.frontmatter ? (parsed.frontmatter.doc_type ?? parsed.frontmatter.type) : null;
    const docType = typeof declared === "string" ? declared.trim().toLowerCase() : "";
    if (DATED_HISTORY_DOC_TYPES.has(docType)) continue;

    const lines = splitLinesKeepEnds(content);
    const { mask } = scanStructure(lines);
    lines.forEach((line, index) => {
      if (mask[index]) return;
      const match = stripEol(line).match(ATX_HEADING_RE);
      if (!match || !DATE_IN_HEADING_RE.test(match[1] ?? "")) return;
      const heading = headingPlainText(match[1]);
      findings.push({
        severity: "warning",
        rule: "content.dated_heading",
        path: rel,
        message: `Heading carries a date, which usually means history is accreting in a knowledge document: "${heading}" (line ${index + 1}).`,
        params: { heading, line: index + 1 }
      });
    });
  }
  return findings;
}

// ---------------------------------------------------------------------------
// budget.log_over / budget.doc_over (silent until wikiBudget is configured)

export async function scanWikiBudget(cwd, options) {
  const budget = options && options.wikiBudget;
  if (!budget || (budget.logTokens == null && budget.docTokens == null)) return [];
  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  if (!(await pathExists(wikiRoot))) return [];

  const findings = [];
  if (Number.isInteger(budget.logTokens)) {
    const logFile = path.join(wikiRoot, "log.md");
    if (await pathExists(logFile)) {
      const tokens = estimateTokens(await readUtf8(logFile));
      if (tokens > budget.logTokens) {
        findings.push({
          severity: "warning",
          rule: "budget.log_over",
          path: "docs/llm-wiki/log.md",
          message: `log.md is ~${tokens} estimated tokens, over the configured budget of ${budget.logTokens}; move older months into volumes with archive-log.`,
          params: { tokens, budget: budget.logTokens }
        });
      }
    }
  }
  if (Number.isInteger(budget.docTokens)) {
    for (const file of await listWikiContentDocs(cwd)) {
      const rel = toPosix(path.relative(cwd, file));
      if (isAppendOnlyLog(rel)) continue;
      const tokens = estimateTokens(await readUtf8(file));
      if (tokens > budget.docTokens) {
        findings.push({
          severity: "warning",
          rule: "budget.doc_over",
          path: rel,
          message: `Document is ~${tokens} estimated tokens, over the configured budget of ${budget.docTokens}.`,
          params: { tokens, budget: budget.docTokens }
        });
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Change-log entries (shared with archive-log)

const LOG_HEADING_DATE_RE = /^## (\d{4})-(\d{2})-(\d{2})\b/;

// True when year-month-day names a real day on the proleptic Gregorian calendar.
// Plain arithmetic on purpose: Date.UTC maps years 0-99 onto 1900-1999.
export function isCalendarDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12 || day < 1) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day <= days;
}

// Splits a change log into its preamble and `## ` blocks. A block runs from its
// heading line to the line before the next `## ` heading (outside frontmatter and
// fenced code), so concatenating preamble + blocks reproduces the input byte for
// byte; a leading UTF-8 BOM belongs to the preamble.
//
// Per block: `date`/`month` are set only when the heading starts with an ISO date
// that is a real calendar day; `invalidDate` holds a date-shaped prefix that is not
// one (2026-13-01, 2026-02-29), so a caller can treat it as undated and say why.
// `unclosedFenceLine` is the 1-based line of a code fence still open at the end of
// the text, or null: past that line a renderer shows code, so the block split
// there cannot be trusted.
export function parseLogEntries(text) {
  const source = String(text ?? "");
  const bom = source.startsWith("﻿") ? "﻿" : "";
  const lines = splitLinesKeepEnds(source.slice(bom.length));
  const { mask, unclosedFence } = scanStructure(lines);
  const unclosedFenceLine = unclosedFence === null ? null : unclosedFence + 1;
  const starts = [];
  lines.forEach((line, index) => {
    if (!mask[index] && /^## (?!#)/.test(line)) starts.push(index);
  });
  if (starts.length === 0) return { preamble: bom + lines.join(""), blocks: [], unclosedFenceLine };

  const preamble = bom + lines.slice(0, starts[0]).join("");
  const blocks = starts.map((start, position) => {
    const end = position + 1 < starts.length ? starts[position + 1] : lines.length;
    const blockText = lines.slice(start, end).join("");
    const match = lines[start].match(LOG_HEADING_DATE_RE);
    const raw = match ? `${match[1]}-${match[2]}-${match[3]}` : null;
    const valid = Boolean(match) && isCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]));
    return {
      text: blockText,
      heading: stripEol(lines[start]).slice(3),
      line: start + 1,
      date: valid ? raw : null,
      month: valid ? `${match[1]}-${match[2]}` : null,
      invalidDate: match && !valid ? raw : null
    };
  });
  return { preamble, blocks, unclosedFenceLine };
}
