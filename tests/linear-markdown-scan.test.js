// Linear-time replacements for regexes that backtracked quadratically (1.35.x
// security review). Two kinds of test per scanner:
//   1. differential: the scanner and the regex it replaced agree on thousands of
//      random strings built from the characters that matter to that regex, so
//      the change cannot have moved a single match;
//   2. time bound: a pathological input that took seconds on the regex finishes
//      well inside a loose bound (slow CI runners included).
import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { extractMarkdownLinkTargets, extractWikiLinkTargets } from "../src/commands/references.js";
import { dropInlineTags, headingSlug, keepLinkLabels, stripUnderscoreEmphasis, trimClosingHashes } from "../src/commands/wiki-hygiene.js";
import { enrichmentChecklist, sectionHeadingText } from "../src/commands/scans.js";
import { replaceFrontmatterScalar, upsertFrontmatterScalar } from "../src/commands/fix-migrate.js";
import { importedDocName } from "../src/commands/import-memory.js";
import { forArtifact } from "../src/commands/skills.js";

for (const [name, value] of [
  ["extractMarkdownLinkTargets", extractMarkdownLinkTargets],
  ["extractWikiLinkTargets", extractWikiLinkTargets],
  ["dropInlineTags", dropInlineTags],
  ["headingSlug", headingSlug],
  ["keepLinkLabels", keepLinkLabels],
  ["trimClosingHashes", trimClosingHashes],
  ["replaceFrontmatterScalar", replaceFrontmatterScalar],
  ["upsertFrontmatterScalar", upsertFrontmatterScalar],
  ["importedDocName", importedDocName],
  ["forArtifact", forArtifact],
  ["stripUnderscoreEmphasis", stripUnderscoreEmphasis],
  ["sectionHeadingText", sectionHeadingText],
  ["enrichmentChecklist", enrichmentChecklist]
]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

// The regexes as they shipped in 1.35.0, kept here as the oracle. The two link
// regexes are the exception: they state the corrected behavior (GATE_REVIEW
// "Link-Extraction False Negatives"). The 1.35.0 forms were
//   /(^|[^!])\[[^\]\n]+\]\(([^)\n]+)\)/g        — consumed the character before "["
//   /^\s*\[[^\]\n]+\]:\s*(\S+)(?:\s+.*)?$/gm   — `\s+` ran into the next line
const regexImpl = {
  markdownLinks(markdown) {
    const targets = [];
    for (const match of markdown.matchAll(/(?<!!)\[[^\]\n]+\]\(([^)\n]+)\)/g)) targets.push(match[1]);
    // After the value: horizontal whitespace and the rest of that line, or nothing.
    for (const match of markdown.matchAll(/^\s*\[[^\]\n]+\]:\s*(\S+)(?:[^\S\n\r\p{Zl}\p{Zp}]+.*)?$/gmu)) targets.push(match[1]);
    return targets;
  },
  wikiLinks(markdown) {
    return [...markdown.matchAll(/\[\[([^\]\n]+)\]\]/g)].map((match) => match[1]);
  },
  closingHashes: (text) => text.replace(/\s+#+\s*$/, ""),
  imageLabels: (text) => text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1"),
  linkLabels: (text) => text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"),
  // Not a sanitizer: the old heading-slug step, kept verbatim as the oracle.
  inlineTags: (text) => text.replace(/<[^>]+>/g, ""),
  trailingBreaks: (inner) => inner.replace(/[\r\n]+$/, ""),
  replaceScalar(inner, key, value) {
    const pattern = new RegExp(`^(\\s*${key}:)[^\\r\\n]*$`, "m");
    return pattern.test(inner) ? inner.replace(pattern, `$1 ${value}`) : null;
  },
  docName(file) {
    const stem = file.replace(/\.md$/i, "").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
    return `${stem || "memory"}.md`;
  },
  forArtifact: (prompt) => prompt.replace(/\n\nWorkspace:\n[^\n]*\n/, "\n").replace(/ Target agent context: [^.\n]*\./, ""),
  underscoreEmphasis(text) {
    let current = text;
    for (;;) {
      const next = current.replace(/(^|[^\p{L}\p{N}_])(_{1,3})(?=[^\s_])(.*?[^\s_])\2(?![\p{L}\p{N}_])/gu, "$1$3");
      if (next === current) return current;
      current = next;
    }
  },
  sectionHeading: (line) => /^##\s+(.+?)\s*$/.exec(line)?.[1].trim() ?? null
};

// Deterministic PRNG (mulberry32) so a failure reproduces from the printed input.
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomStrings(seed, pieces, count, maxPieces) {
  const next = rng(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    let text = "";
    const length = Math.floor(next() * (maxPieces + 1));
    for (let j = 0; j < length; j++) text += pieces[Math.floor(next() * pieces.length)];
    out.push(text);
  }
  return out;
}

function agree(label, inputs, actual, expected) {
  for (const input of inputs) {
    assert.deepEqual(actual(input), expected(input), `${label} differs for ${JSON.stringify(input)}`);
  }
}

const LINK_PIECES = ["[", "]", "(", ")", "!", "\n", "\r", " ", "\t", ":", "a", "b", "\u2028", "\u00a0", "[a](b)", "[x]: y"];

test("markdown link targets: the scanner matches the regexes that state its behavior", () => {
  agree("extractMarkdownLinkTargets", randomStrings(1, LINK_PIECES, 6000, 24), extractMarkdownLinkTargets, regexImpl.markdownLinks);
  // The two false negatives the 1.35.0 regexes had, now found: a link glued to the
  // previous one, and every definition in a run of consecutive definitions.
  assert.deepEqual(extractMarkdownLinkTargets("[a](b)[c](d) [e](f)"), ["b", "d", "f"]);
  assert.deepEqual(extractMarkdownLinkTargets("[a]: one\n[b]: two\n[c]: three"), ["one", "two", "three"]);
  // Unchanged: images are not links, a title stays on its definition's line, and a
  // destination may sit on the line after the colon.
  assert.deepEqual(extractMarkdownLinkTargets("![img](pic.png) [doc](guide.md)\n\n  [ref]: ../x.md \"t\""), ["guide.md", "../x.md"]);
  assert.deepEqual(extractMarkdownLinkTargets("![a](x)[b](y)"), ["y"]);
  assert.deepEqual(extractMarkdownLinkTargets("[a]: one \"title\"\n[b]:\n  two"), ["one", "two"]);
});

test("wiki link targets: the scanner matches the regex it replaced", () => {
  agree("extractWikiLinkTargets", randomStrings(2, ["[", "]", "\n", "a", " ", "[[a]]"], 6000, 24), extractWikiLinkTargets, regexImpl.wikiLinks);
  assert.deepEqual(extractWikiLinkTargets("see [[Glossary]] and [[[nested]]]"), ["Glossary", "[nested"]);
});

test("heading slug helpers: each scanner matches the regex it replaced", () => {
  agree("trimClosingHashes", randomStrings(3, ["#", " ", "\t", "a", "\u00a0", "\n"], 6000, 16), trimClosingHashes, regexImpl.closingHashes);
  const labelInputs = randomStrings(4, ["!", "[", "]", "(", ")", "a", "\n", "![a](b)"], 6000, 20);
  agree("keepLinkLabels(image)", labelInputs, (text) => keepLinkLabels(text, true), regexImpl.imageLabels);
  agree("keepLinkLabels(link)", labelInputs, (text) => keepLinkLabels(text, false), regexImpl.linkLabels);
  agree("dropInlineTags", randomStrings(5, ["<", ">", "a", " ", "<b>"], 6000, 20), dropInlineTags, regexImpl.inlineTags);
  assert.equal(headingSlug("Install <code>x</code> with [the CLI](cli.md) ##"), "install-x-with-the-cli");
});

test("CodeQL-flagged trims: each loop matches the regex it replaced", () => {
  const scalarPieces = ["status: a", "status:", "statu", "\n", "\r", " ", "\t", "x", "\u2028", "\u00a0"];
  for (const value of ["verified", "a$&b", "$'", "$`"]) {
    agree(
      `replaceFrontmatterScalar(${value})`,
      randomStrings(9, scalarPieces, 3000, 12),
      (inner) => replaceFrontmatterScalar(inner, "status", value),
      (inner) => regexImpl.replaceScalar(inner, "status", value)
    );
  }
  agree(
    "upsertFrontmatterScalar",
    randomStrings(6, ["\r", "\n", "a", "title: t"], 3000, 12),
    (inner) => upsertFrontmatterScalar(inner, "reviewed_at", "2026-10-27"),
    (inner) => `${regexImpl.trailingBreaks(inner)}\nreviewed_at: 2026-10-27`
  );
  agree("importedDocName", randomStrings(7, ["-", ".", "a", "B", " ", "_", "md", "!"], 6000, 14), (file) => importedDocName({}, file), regexImpl.docName);
  agree(
    "forArtifact",
    randomStrings(8, [" Target agent context: ", ".", "\n", "a", " ", "\n\nWorkspace:\n"], 6000, 12),
    forArtifact,
    regexImpl.forArtifact
  );
});

test("follow-up audit: underscore emphasis and section headings match the regexes they replaced", () => {
  // Letters, digits, an astral code point, NBSP and line terminators all change
  // what the u-flag regex treats as a word character, whitespace or `.`.
  const emphasisPieces = ["_", "__", "___", "____", " ", "a", "1", "-", "é", "\u{1F600}", "\u00a0", "\u2028", "x_", "_y", " _a", "a_ "];
  agree("stripUnderscoreEmphasis", randomStrings(10, emphasisPieces, 8000, 16), stripUnderscoreEmphasis, regexImpl.underscoreEmphasis);
  // Nesting within the pass cap, where the fixpoint takes one pass per level.
  for (const depth of [1, 2, 5, 16]) {
    const nested = `${" _a".repeat(depth)}${" a_".repeat(depth)}`;
    assert.equal(stripUnderscoreEmphasis(nested), regexImpl.underscoreEmphasis(nested), `depth ${depth}`);
  }
  const headingPieces = ["#", "##", "###", " ", "\t", "a", "b", "\r", "\u2028", "\u00a0", "## "];
  agree("sectionHeadingText", randomStrings(11, headingPieces, 8000, 10), sectionHeadingText, regexImpl.sectionHeading);
  assert.deepEqual(
    enrichmentChecklist("## Summary\n- Concise summary: describe the purpose\n##   Evidence  \nplain"),
    [{ section: "Summary", hint: "Concise summary: describe the purpose" }]
  );
});

// Coverage instrumentation (`npm run test:coverage`, the informational CI coverage
// job) slows these JavaScript loops several times over: the nested-emphasis case took
// 1.8 s there and 0.2 s without it. Regex matching is not instrumented, so the wide
// bound used under coverage only catches a catastrophic regression; the 1.5 s bound
// that separates the scanners from the old regexes is enforced by every
// uninstrumented run, including the twelve CI verify jobs.
const TIME_BOUND_MS = process.env.NODE_V8_COVERAGE ? 15000 : 1500;

function assertFast(label, run) {
  const started = performance.now();
  run();
  const elapsed = performance.now() - started;
  assert.ok(elapsed < TIME_BOUND_MS, `${label} took ${elapsed.toFixed(0)} ms (bound ${TIME_BOUND_MS} ms)`);
}

test("pathological inputs are scanned in linear time", () => {
  // Each input took seconds on the regex it replaced (measured 2026-10-27, Node 22:
  // 50,000 "[" held validate for 4.3 s, and the cost grew with the square).
  // Every input carries the "](" / "]:" / "]]" that the scanners check for first,
  // so the bound measures the scan itself, not the early return.
  const n = 100000;
  assertFast("inline links over '['", () => extractMarkdownLinkTargets(`](${"[".repeat(n)}`));
  assertFast("inline links over '[a]('", () => extractMarkdownLinkTargets("[a](".repeat(n / 2)));
  assertFast("reference definitions over blank lines", () => extractMarkdownLinkTargets(`${"\n".repeat(n)}x ]:`));
  assertFast("reference definitions over '[' lines", () => extractMarkdownLinkTargets(`${"[\r".repeat(n / 2)}]:`));
  assertFast("wiki links over '['", () => extractWikiLinkTargets(`]]${"[".repeat(n)}`));
  assertFast("heading slug over '<'", () => headingSlug(`x${"<".repeat(2 * n)}`));
  assertFast("heading slug over '!['", () => headingSlug(`x${"![".repeat(n)}](`));
  assertFast("heading slug over spaces", () => headingSlug(`a${" ".repeat(2 * n)}x`));
  assertFast("frontmatter trailing breaks", () => upsertFrontmatterScalar(`a${"\n".repeat(n)}x`, "reviewed_at", "2026-10-27"));
  assertFast("frontmatter key search over blank lines", () => replaceFrontmatterScalar(`${"\n".repeat(n)}x`, "status", "verified"));
  assertFast("memory file name dashes", () => importedDocName({}, `a${"-".repeat(n)}b`));
  assertFast("agent context marker", () => forArtifact(" Target agent context: ".repeat(n / 2)));
  // Follow-up audit (2026-10-27): 40,000 characters took 0.3-1.0 s on the regexes.
  assertFast("underscore openers without a closer", () => headingSlug(" _a".repeat(n / 3)));
  assertFast("underscore emphasis nested past the pass cap", () => stripUnderscoreEmphasis(`${" _a".repeat(n / 3)}${" a_".repeat(n / 3)}`));
  assertFast("section heading with a long inner space run", () => enrichmentChecklist(`## x${" ".repeat(n)}y\nConcise summary: describe`));
});
