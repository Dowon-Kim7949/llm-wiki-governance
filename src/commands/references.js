// Reference and link parsing helpers, extracted from commands.js on 2026-07-16
// (behavior-preserving refactor, GATE_REVIEW stabilization). These are the pure
// building blocks that recognize and normalize the different reference shapes the
// wiki understands: evidence references (file#L10, file#symbol:Name, ...),
// external/cross-repo references, Markdown links, and [[wiki links]]. Self-
// contained: depends only on the Node stdlib, encoding.js and the frontmatter
// schema's evidence pattern; no back-dependency on commands.js.
import path from "node:path";
import { readUtf8 } from "../encoding.js";
import { EVIDENCE_REFERENCE_PATTERN } from "../frontmatter-schema.js";

const EVIDENCE_REFERENCE_SHAPE = new RegExp(EVIDENCE_REFERENCE_PATTERN);

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractMarkdownSection(markdown, title) {
  const lines = String(markdown ?? "").split(/\r?\n/);
  const headingPattern = new RegExp(`^##\\s+${escapeRegex(title)}\\s*$`, "i");
  const start = lines.findIndex((line) => headingPattern.test(line.trim()));
  if (start === -1) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^#{1,2}\s+\S/.test(lines[index].trim())) {
      end = index;
      break;
    }
  }

  const sectionLines = lines.slice(start + 1, end);
  const text = sectionLines.join("\n");
  const bullets = sectionLines.filter((line) => /^\s*[-*]\s+\S/.test(line));

  return { text, bullets };
}

export function parseEvidenceReference(reference) {
  if (!reference) return null;
  // Shape is the schema pattern's call alone (see EVIDENCE_REFERENCE_PATTERN);
  // everything below only extracts the locator and checks what a pattern can't.
  if (!EVIDENCE_REFERENCE_SHAPE.test(String(reference).trim())) return null;
  if (isExternalSourceReference(reference)) return { source: reference, locator: null, external: true };

  const hashIndex = reference.indexOf("#");
  const source = (hashIndex === -1 ? reference : reference.slice(0, hashIndex)).trim();
  const locatorText = hashIndex === -1 ? null : reference.slice(hashIndex + 1).trim();

  if (!source || source.startsWith("#")) return null;
  if (locatorText === "") return null;
  if (locatorText === null) {
    // Also accept a colon-line locator — `path:10` or `path:10-20`, the notation
    // editors and grep emit — as equivalent to `path#L10` / `path#L10-L20`, so an
    // agent that writes evidence that way is not falsely flagged evidence.missing.
    // (External refs like http://host:80/… were already returned above.)
    const colonLine = source.match(/^(.+):([1-9]\d*)(?:-([1-9]\d*))?$/);
    if (colonLine) {
      const start = Number(colonLine[2]);
      const end = Number(colonLine[3] ?? colonLine[2]);
      if (end >= start) return { source: colonLine[1].trim(), locator: { kind: "line", start, end }, external: false };
    }
    return { source, locator: null, external: false };
  }

  const lineMatch = locatorText.match(/^L([1-9]\d*)(?:-(?:L)?([1-9]\d*))?$/i);
  if (lineMatch) {
    const start = Number(lineMatch[1]);
    const end = Number(lineMatch[2] ?? lineMatch[1]);
    if (end < start) return null;
    return { source, locator: { kind: "line", start, end }, external: false };
  }

  const typedMatch = locatorText.match(/^(symbol|section|route):(.+)$/);
  if (!typedMatch) return null;

  const kind = typedMatch[1];
  const value = typedMatch[2].trim();
  if (!value) return null;
  if (kind === "route" && !value.startsWith("/")) return null;

  return { source, locator: { kind, value }, external: false };
}

export async function getLineCount(file, cache) {
  if (cache.has(file)) return cache.get(file);
  const content = await readUtf8(file);
  const lineCount = content.length === 0 ? 0 : content.split(/\r\n|\r|\n/).length;
  cache.set(file, lineCount);
  return lineCount;
}

// A reserved, NON-fetching cross-repo reference (1.11, GATE_REVIEW Gate 16):
// `repo:<name>/<path>`. It is recognized so cross-repo references are not flagged as
// missing targets, but it is NEVER fetched or verified (verification would need
// network/git and break the zero-dependency invariant) — recognition only.
export function isCrossRepoReference(reference) {
  return /^repo:\S/i.test(String(reference));
}

export function isExternalSourceReference(source) {
  return /^https?:\/\//i.test(source) || isCrossRepoReference(source) || source.startsWith("#");
}

// Link extraction runs over every wiki document in validate and audit, so a pull
// request controls its input. Until 1.35.x it used three regexes:
//   inline     /(^|[^!])\[[^\]\n]+\]\(([^)\n]+)\)/g
//   reference  /^\s*\[[^\]\n]+\]:\s*(\S+)(?:\s+.*)?$/gm
//   wiki       /\[\[([^\]\n]+)\]\]/g
// Each one backtracked in quadratic time: one line of 50,000 "[" or 50,000 blank
// lines held validate for 4-7 seconds, and the cost grows with the square. The
// scanners below return the same targets in the same order, quirks included (an
// inline link glued to the end of the previous one is skipped, and a reference
// definition swallows the line after it). They precompute "next stop character"
// tables so that each candidate position is decided in constant time.
// tests/linear-markdown-scan.test.js compares them with the old regexes on
// random input.
const WHITESPACE = /\s/;
const LINE_TERMINATORS = new Set(["\n", "\r", " ", " "]);

// table[i] = the first index >= i whose character satisfies `isStop`, or text.length.
export function nextStopTable(text, isStop) {
  const table = new Int32Array(text.length + 1);
  table[text.length] = text.length;
  for (let i = text.length - 1; i >= 0; i--) {
    table[i] = isStop(text[i]) ? i : table[i + 1];
  }
  return table;
}

function inlineLinkTargets(text) {
  if (!text.includes("](")) return [];
  const targets = [];
  const bracketStop = nextStopTable(text, (ch) => ch === "]" || ch === "\n");
  const parenStop = nextStopTable(text, (ch) => ch === ")" || ch === "\n");
  // A link whose "[" is at `open`: the index just past its ")", or -1.
  const linkEnd = (open) => {
    if (text[open] !== "[") return -1;
    const close = bracketStop[open + 1];
    if (close === open + 1 || text[close] !== "]" || text[close + 1] !== "(") return -1;
    const end = parenStop[close + 2];
    if (end === close + 2 || text[end] !== ")") return -1;
    targets.push(text.slice(close + 2, end));
    return end + 1;
  };
  let position = 0;
  while (position < text.length) {
    // `^` (start of input only) is tried before `[^!]`, which consumes the
    // character in front of the "[".
    let end = position === 0 ? linkEnd(0) : -1;
    if (end === -1 && text[position] !== "!") end = linkEnd(position + 1);
    position = end === -1 ? position + 1 : end;
  }
  return targets;
}

function referenceDefinitionTargets(text) {
  if (!text.includes("]:")) return [];
  const targets = [];
  const isSpace = (ch) => WHITESPACE.test(ch);
  const spaceEnd = nextStopTable(text, (ch) => !isSpace(ch));
  const wordEnd = nextStopTable(text, isSpace);
  const bracketStop = nextStopTable(text, (ch) => ch === "]" || ch === "\n");
  const lineEnd = nextStopTable(text, (ch) => LINE_TERMINATORS.has(ch));
  let position = 0;
  while (position < text.length) {
    // `^` with the m flag: the start of input or just after a line terminator.
    // `\s*` crosses line breaks, so leading blank lines belong to the match.
    if (position > 0 && !LINE_TERMINATORS.has(text[position - 1])) {
      position += 1;
      continue;
    }
    const open = spaceEnd[position];
    const close = open < text.length ? bracketStop[open + 1] : open;
    if (text[open] !== "[" || close === open + 1 || text[close] !== "]" || text[close + 1] !== ":") {
      position += 1;
      continue;
    }
    const valueStart = spaceEnd[close + 2];
    const valueEnd = wordEnd[valueStart];
    if (valueEnd === valueStart) {
      position += 1;
      continue;
    }
    targets.push(text.slice(valueStart, valueEnd));
    // `(?:\s+.*)?$`: any whitespace after the value (line breaks included), then
    // the rest of that line.
    position = valueEnd === text.length ? valueEnd : lineEnd[spaceEnd[valueEnd]];
  }
  return targets;
}

export function extractMarkdownLinkTargets(markdown) {
  return [...inlineLinkTargets(markdown), ...referenceDefinitionTargets(markdown)];
}

export function extractWikiLinkTargets(markdown) {
  if (!markdown.includes("]]")) return [];
  const targets = [];
  const bracketStop = nextStopTable(markdown, (ch) => ch === "]" || ch === "\n");
  let position = 0;
  while (position < markdown.length) {
    if (markdown[position] === "[" && markdown[position + 1] === "[") {
      const close = bracketStop[position + 2];
      if (close > position + 2 && markdown[close] === "]" && markdown[close + 1] === "]") {
        targets.push(markdown.slice(position + 2, close));
        position = close + 2;
        continue;
      }
    }
    position += 1;
  }
  return targets;
}

export function normalizeMarkdownLinkTarget(target) {
  const trimmed = target.trim();
  const withoutTitle = trimmed.startsWith("<")
    ? trimmed.match(/^<([^>]+)>/)?.[1] ?? trimmed
    : trimmed.split(/\s+/)[0];
  const withoutQuery = withoutTitle.split("?")[0];
  const withoutAnchor = withoutQuery.split("#")[0];

  try {
    return decodeURIComponent(withoutAnchor).replaceAll("\\", "/");
  } catch {
    return withoutAnchor.replaceAll("\\", "/");
  }
}

export function isSkippedMarkdownLink(link) {
  return link === "" || link.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(link);
}

export function resolveMarkdownLinkTarget(cwd, fromFile, link) {
  if (link.startsWith("/")) {
    return path.join(cwd, link.slice(1));
  }
  if (link.startsWith("docs/")) {
    return path.join(cwd, link);
  }
  return path.resolve(path.dirname(fromFile), link);
}

export function addWikiLinkTarget(targetIndex, value, document) {
  const normalized = normalizeWikiLinkKey(value);
  if (normalized && !targetIndex.has(normalized)) targetIndex.set(normalized, document);
}

export function normalizeWikiLinkTarget(rawTarget) {
  const withoutAlias = String(rawTarget).split("|")[0];
  const withoutAnchor = withoutAlias.split("#")[0];
  const trimmed = withoutAnchor.trim();
  if (!trimmed) return "";

  try {
    return decodeURIComponent(trimmed).replaceAll("\\", "/");
  } catch {
    return trimmed.replaceAll("\\", "/");
  }
}

export function normalizeWikiLinkKey(value) {
  if (value === undefined || value === null) return "";
  const normalized = normalizeWikiLinkTarget(value)
    .replace(/^\/+/, "")
    .replace(/^docs\/llm-wiki\//i, "")
    .replace(/\.md$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  return normalized;
}
