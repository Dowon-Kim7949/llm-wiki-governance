// Read-only retrieval over the governed wiki (1.18, Gate 24). Four operations
// that return document CONTENT (not governance reports): listDocsCommand
// (enumerate with filters), searchDocsCommand (zero-dep keyword/substring — NOT
// semantic/vector), getDocCommand (frontmatter + body by path), and
// getRelatedCommand (resolved graph neighbors). This is the "the agent queries
// the wiki instead of re-deriving from code" surface (GATE_REVIEW Gate 24).
//
// Invariants: read-only (nothing is written); honors visibility + reuses the
// sensitive-info scan — restricted/sensitive docs are excluded from list/search
// by default (opt-in options.includeSensitive), and every returned body/snippet
// has sensitive-looking lines redacted — and every echoed frontmatter value
// (get-doc payload, titles, tags) likewise — so a raw secret is never returned;
// zero-dependency (keyword/substring + the existing wiki graph, no embeddings/
// index/network). Depends only on leaf helpers (wiki-files, wiki-graph,
// frontmatter, sensitive-info, encoding, files, findings) — no back-dependency
// on commands.js.
import path from "node:path";
import { readUtf8 } from "../encoding.js";
import { toPosix } from "../files.js";
import { parseFrontmatter } from "../frontmatter.js";
import { scanSensitiveInfo } from "../sensitive-info.js";
import { isAppendOnlyLog, listWikiContentDocs } from "./wiki-files.js";
import { collectWikiGraph } from "./wiki-graph.js";
import { formatFinding, summarizeFindings, withText } from "./findings.js";

const REDACTION = "[redacted: sensitive-looking value omitted]";
const DEFAULT_SEARCH_LIMIT = 20;
const DEFAULT_SECTION_LIMIT = 3;

// Load every wiki content doc with parsed frontmatter, body, and a sensitivity
// flag (declared contains_sensitive_info, restricted visibility, or a
// sensitive-info scan hit). Sorted by path for deterministic output.
export async function loadContentDocs(cwd) {
  const files = await listWikiContentDocs(cwd);
  const docs = [];
  for (const file of files) {
    const raw = await readUtf8(file);
    const parsed = parseFrontmatter(raw);
    const frontmatter = parsed.frontmatter ?? {};
    const display = redactFrontmatter(frontmatter);
    docs.push({
      path: toPosix(path.relative(cwd, file)),
      frontmatter,
      displayFrontmatter: display.frontmatter,
      frontmatterRedacted: display.redacted,
      body: parsed.body ?? "",
      sensitiveHits: scanSensitiveInfo(raw).length,
      visibility: typeof frontmatter.visibility === "string" ? frontmatter.visibility : null
    });
  }
  return docs.sort((left, right) => left.path.localeCompare(right.path));
}

function isRestrictedOrSensitive(doc) {
  return doc.visibility === "restricted"
    || doc.frontmatter.contains_sensitive_info === true
    || doc.sensitiveHits > 0;
}

// Redact sensitive-looking lines using the same scan the report writer safety-net
// uses, so no returned body/snippet ever carries a raw secret. A flagged PEM header
// guards a block: its base64 body carries no key name, so the line scan cannot flag
// those lines. Withhold everything through the matching END line, or to the end of
// the text when the block is never closed.
const PEM_END = /-----END [A-Z0-9 ]+-----/;
export function redactSensitive(text) {
  if (!text) return text;
  const hits = scanSensitiveInfo(text);
  if (hits.length === 0) return text;
  const lines = text.split(/\r?\n/);
  const flagged = new Set(hits.map((hit) => hit.line));
  for (const hit of hits) {
    if (hit.type !== "private_key" && hit.type !== "certificate") continue;
    // hit.line is 1-based, so index hit.line is the line after the header.
    for (let index = hit.line; index < lines.length; index++) {
      flagged.add(index + 1);
      if (PEM_END.test(lines[index])) break;
    }
  }
  return lines.map((line, index) => (flagged.has(index + 1) ? REDACTION : line)).join("\n");
}

// Frontmatter is echoed too (get-doc's default payload, plus titles and tags in
// every listing), and once a value is parsed away from its key the line scan can
// no longer see `api_token: ...` as an assignment. Rebuild "key: value" for each
// scalar and run the same scan, so a secret declared in frontmatter is withheld
// exactly like a body line. Untouched values are returned by reference, keeping
// the output for a clean document identical.
function redactFrontmatter(frontmatter) {
  let redacted = false;
  const visit = (value, key) => {
    if (typeof value === "string" || typeof value === "number") {
      const text = String(value);
      if (scanSensitiveInfo(`${key}: ${text}`).length > 0 || scanSensitiveInfo(text).length > 0) {
        redacted = true;
        return REDACTION;
      }
      return value;
    }
    if (Array.isArray(value)) {
      const next = value.map((item) => visit(item, key));
      return next.some((item, index) => item !== value[index]) ? next : value;
    }
    if (value && typeof value === "object") {
      let changed = false;
      const next = {};
      for (const [childKey, childValue] of Object.entries(value)) {
        next[childKey] = visit(childValue, childKey);
        if (next[childKey] !== childValue) changed = true;
      }
      return changed ? next : value;
    }
    return value;
  };
  return { frontmatter: visit(frontmatter ?? {}, ""), redacted };
}

function docType(frontmatter) {
  if (typeof frontmatter.doc_type === "string" && frontmatter.doc_type.trim()) return frontmatter.doc_type;
  if (typeof frontmatter.type === "string" && frontmatter.type.trim()) return frontmatter.type;
  return null;
}

export function docSummary(doc) {
  const fm = doc.displayFrontmatter ?? doc.frontmatter;
  return {
    path: doc.path,
    title: typeof fm.title === "string" ? fm.title : null,
    status: typeof fm.status === "string" ? fm.status : null,
    docType: docType(fm),
    visibility: doc.visibility,
    lastUpdated: typeof fm.last_updated === "string" ? fm.last_updated : null,
    tags: Array.isArray(fm.tags) ? fm.tags.filter((tag) => typeof tag === "string") : []
  };
}

function filterPayload(options) {
  return {
    status: typeof options.status === "string" ? options.status : null,
    visibility: typeof options.visibility === "string" ? options.visibility : null,
    docType: typeof options.docType === "string" ? options.docType : null,
    includeSensitive: Boolean(options.includeSensitive)
  };
}

// Shared status/visibility/docType/sensitivity filter for list and search.
// excludedSensitive counts docs dropped only for the sensitivity gate (0 when
// includeSensitive is set). Returns { kept, excludedSensitive }.
export function applyFilters(docs, options) {
  let excludedSensitive = 0;
  const kept = docs.filter((doc) => {
    if (!options.includeSensitive && isRestrictedOrSensitive(doc)) {
      excludedSensitive += 1;
      return false;
    }
    if (typeof options.status === "string" && doc.frontmatter.status !== options.status) return false;
    if (typeof options.visibility === "string" && doc.visibility !== options.visibility) return false;
    if (typeof options.docType === "string" && docType(doc.frontmatter) !== options.docType) return false;
    return true;
  });
  return { kept, excludedSensitive };
}

export async function listDocsCommand(options) {
  const docs = await loadContentDocs(options.cwd);
  const { kept, excludedSensitive } = applyFilters(docs, options);
  const items = kept.map(docSummary);

  const summary = [
    `documents: ${items.length}`,
    `total_scanned: ${docs.length}`,
    `excluded_sensitive: ${excludedSensitive}${options.includeSensitive ? " (included)" : ""}`
  ];
  if (docs.length === 0) summary.push("wiki: not initialized (run init --write first)");

  return withText({
    command: "list-docs",
    result: "pass",
    filters: filterPayload(options),
    excludedSensitive,
    documents: items,
    findings: []
  }, "LLM-WIKI Documents", [
    { title: "Summary", body: summary },
    { title: "Documents", body: items.map((item) => `${item.path} — ${item.title ?? "(no title)"} [${item.status ?? "?"}/${item.visibility ?? "?"}]`) },
    { title: "Caveats", body: ["Read-only; metadata only (no bodies — use get-doc <path>). Restricted/sensitive docs are excluded unless --include-sensitive."] }
  ]);
}

export async function searchDocsCommand(options) {
  const query = typeof options.query === "string" ? options.query.trim() : "";
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : DEFAULT_SEARCH_LIMIT;
  const docs = await loadContentDocs(options.cwd);
  const { kept, excludedSensitive } = applyFilters(docs, options);
  const matches = rankDocsByQuery(kept, query);
  const limited = matches.slice(0, limit).map(({ deprioritized, ...rest }) => rest);

  const summary = [
    `query: ${query || "(empty)"}`,
    `matches: ${matches.length}${matches.length > limited.length ? ` (showing ${limited.length})` : ""}`,
    `searched: ${kept.length} docs`,
    `excluded_sensitive: ${excludedSensitive}${options.includeSensitive ? " (included)" : ""}`
  ];

  return withText({
    command: "search-docs",
    result: "pass",
    query,
    limit,
    filters: filterPayload(options),
    excludedSensitive,
    matchCount: matches.length,
    matches: limited,
    findings: []
  }, "LLM-WIKI Search", [
    { title: "Summary", body: summary },
    { title: "Matches", body: limited.map((match) => `${match.path} (score ${match.score}) — ${match.snippet}`) },
    { title: "Caveats", body: ["Keyword/substring search only (deterministic, NOT semantic). Read-only; returns snippets — use get-doc <path> for full content. Restricted/sensitive docs excluded unless --include-sensitive; snippets are redacted."] }
  ]);
}

// Diagnostic-only token estimate (chars/4). This is a PROXY, never a real token
// count — surface it as `estimatedTokens` so nobody mistakes it for a measured
// figure. Use clampText/maxChars for any limit that must be exact.
export function estimateTokens(text) {
  return Math.ceil((text ? String(text).length : 0) / 4);
}

// Exact character clamp. Returns { text, chars, truncated }; text.length is
// guaranteed <= maxChars. Clamp AFTER redaction so a truncated tail can never
// expose a secret. A non-positive/absent maxChars is a no-op.
export function clampText(text, maxChars) {
  const value = text ?? "";
  if (!Number.isInteger(maxChars) || maxChars <= 0 || value.length <= maxChars) {
    return { text: value, chars: value.length, truncated: false };
  }
  const cut = value.slice(0, maxChars);
  return { text: cut, chars: cut.length, truncated: true };
}

// Focused read: split a markdown body into a preamble (before the first "## "
// heading) and level-2 sections, then return the preamble plus the top-`limit`
// sections that match the query terms, in document order. A term hit in a section
// HEADING outweighs body hits (a heading match is a stronger relevance signal).
//
// Non-strict (default, backward-compatible): falls back to the FULL body when there
// is no query, no "## " section, or no section matches — so a caller always gets a
// usable answer. Strict ({ strict: true }): when sections exist but none match (or
// there are no sections to match against a real query), returns an EMPTY body with
// noSectionMatch:true instead of the full body — this is the token guard that stops
// a failed --section from silently ballooning into a whole-document read. Zero-dep,
// deterministic. Return shape (superset): { body, sectioned, returned, total,
// noSectionMatch }.
export function selectSections(body, query, limit = DEFAULT_SECTION_LIMIT, { strict = false } = {}) {
  const terms = (typeof query === "string" ? query : "").toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { body, sectioned: false, returned: 0, total: 0, noSectionMatch: false };
  const lines = body.split("\n");
  const preamble = [];
  const sections = [];
  let current = null;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (current) sections.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    } else {
      preamble.push(line);
    }
  }
  if (current) sections.push(current);
  if (sections.length === 0) {
    // Strict has no section to focus on and must not return the whole body.
    if (strict) return { body: "", sectioned: false, returned: 0, total: 0, noSectionMatch: true };
    return { body, sectioned: false, returned: 0, total: 0, noSectionMatch: false };
  }
  const scored = sections.map((sec, idx) => {
    const headingHay = sec[0].toLowerCase();
    const hay = sec.join("\n").toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (headingHay.includes(term)) score += 5; // heading match ranks above body-only match
      score += occurrences(hay, term);
    }
    return { idx, text: sec.join("\n"), score };
  });
  const matching = scored.filter((sec) => sec.score > 0);
  if (matching.length === 0) {
    if (strict) return { body: "", sectioned: false, returned: 0, total: sections.length, noSectionMatch: true };
    return { body, sectioned: false, returned: 0, total: sections.length, noSectionMatch: false };
  }
  const top = matching
    .slice()
    .sort((left, right) => right.score - left.score || left.idx - right.idx)
    .slice(0, limit)
    .sort((left, right) => left.idx - right.idx);
  const assembled = [preamble.join("\n").trim(), ...top.map((sec) => sec.text)]
    .filter(Boolean)
    .join("\n\n");
  return { body: assembled, sectioned: true, returned: top.length, total: sections.length, noSectionMatch: false };
}

export async function getDocCommand(options) {
  const docs = await loadContentDocs(options.cwd);
  const doc = resolveDoc(docs, options.docPath);
  if (!doc) return notFound("get-doc", "LLM-WIKI Document", options.docPath);

  const query = typeof options.section === "string" ? options.section.trim() : "";
  // Additive, opt-in token controls (defaults keep the pre-existing output identical):
  //   strictSection — a failed --section returns no_section_match instead of the full body.
  //   maxChars      — exact character cap on the returned body (clamped after redaction).
  //   compact       — omit the full frontmatter echo (metadata + body only).
  const strict = Boolean(options.strictSection) && query.length > 0;
  const maxChars = Number.isInteger(options.maxChars) && options.maxChars > 0 ? options.maxChars : null;
  const compact = Boolean(options.compact);
  const usedNewOption = strict || compact || maxChars !== null;

  const selection = query
    ? selectSections(doc.body, query, DEFAULT_SECTION_LIMIT, { strict })
    : { body: doc.body, sectioned: false, returned: 0, total: 0, noSectionMatch: false };

  const noSectionMatch = strict && selection.noSectionMatch;
  const selectedBody = selection.body;
  const redactedBody = redactSensitive(selectedBody);
  const redacted = redactedBody !== selectedBody || Boolean(doc.frontmatterRedacted);
  const clamped = clampText(redactedBody, maxChars);
  const bodyOut = clamped.text;

  const meta = docSummary(doc);
  const document = compact
    ? { ...meta, body: bodyOut, redacted }
    : { ...meta, frontmatter: doc.displayFrontmatter ?? doc.frontmatter, body: bodyOut, redacted };
  // Additive: only present when --section actually filtered (default output unchanged).
  if (selection.sectioned) document.section = { query, returned: selection.returned, total: selection.total };
  else if (noSectionMatch) document.section = { query, returned: 0, total: selection.total, noSectionMatch: true };
  // Diagnostic size fields only appear when a new option was used, so the default
  // get-doc output stays byte-identical for existing consumers.
  if (usedNewOption) {
    document.chars = clamped.chars;
    document.estimatedTokens = estimateTokens(bodyOut);
    if (clamped.truncated) document.truncated = true;
  }

  const summary = [
    `path: ${doc.path}`,
    `title: ${meta.title ?? "(no title)"}`,
    `status: ${meta.status ?? "?"}`,
    `visibility: ${meta.visibility ?? "?"}`,
    `redacted: ${redacted ? "yes (sensitive-looking lines omitted)" : "no"}`
  ];
  if (selection.sectioned) {
    summary.push(`section: ${selection.returned}/${selection.total} sections matching "${query}" (omit --section for the full body)`);
  } else if (noSectionMatch) {
    summary.push(`section: no match for "${query}" — full body withheld (--strict-section). Retry with different terms or omit --strict-section.`);
  }
  if (usedNewOption) summary.push(`chars: ${clamped.chars}${clamped.truncated ? ` (truncated to --max-chars ${maxChars})` : ""}; estimatedTokens~${document.estimatedTokens} (chars/4 proxy)`);

  // Compact keeps the body ONLY in the structured payload (document.body) and
  // shows a pointer in the human-readable report — so an MCP client that feeds
  // both content.text and structuredContent to the model does not receive the
  // body twice. Default (non-compact) output is unchanged: the body stays inline.
  const bodyTextSection = compact
    ? (bodyOut
      ? `(compact: body in structuredContent/JSON — ${clamped.chars} chars${clamped.truncated ? ", truncated" : ""}; omitted from this text to avoid duplication)`
      : (noSectionMatch ? "(no matching section; full body withheld — --strict-section)" : "(empty)"))
    : (bodyOut || (noSectionMatch ? "(no matching section; full body withheld — --strict-section)" : "(empty)"));
  return withText({
    command: "get-doc",
    result: "pass",
    document,
    findings: []
  }, "LLM-WIKI Document", [
    { title: "Summary", body: summary },
    { title: "Body", body: bodyTextSection },
    { title: "Caveats", body: ["Read-only. Sensitive-looking lines are redacted; frontmatter visibility/contains_sensitive_info are preserved so a caller can see the doc's own declaration."] }
  ]);
}

export async function getRelatedCommand(options) {
  const graph = await collectWikiGraph(options.cwd);
  const target = resolveGraphPath(graph, options.docPath);
  if (!target) return notFound("get-related", "LLM-WIKI Related", options.docPath);

  const outbound = graph.edges.filter((edge) => edge.source === target).map((edge) => ({ path: edge.target, kind: edge.kind }));
  const inbound = graph.edges.filter((edge) => edge.target === target).map((edge) => ({ path: edge.source, kind: edge.kind }));
  return withText({
    command: "get-related",
    result: "pass",
    document: target,
    related: { outbound, inbound },
    findings: []
  }, "LLM-WIKI Related", [
    { title: "Summary", body: [`document: ${target}`, `outbound: ${outbound.length}`, `inbound: ${inbound.length}`] },
    { title: "Outbound (links to)", body: outbound.map((node) => `${node.path} (${node.kind})`) },
    { title: "Inbound (linked from)", body: inbound.map((node) => `${node.path} (${node.kind})`) },
    { title: "Caveats", body: ["Read-only. Neighbors are resolved wiki [[links]], related frontmatter, and local markdown links. Use get-doc <path> to read a neighbor."] }
  ]);
}

// ---- shared helpers ----------------------------------------------------

// Query terms as the ranker sees them: lowercased whitespace-split words, deduped,
// minus English function words, with a trailing Korean particle or ending removed
// from a Hangul term of 3+ characters ("로그를" -> "로그"), so a question finds the
// documents a keyword would. Matching stays substring-based, so a term still hits
// inside a longer word. A query made only of function words keeps them.
const SEARCH_STOPWORDS = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "for", "on", "at", "is", "are", "be", "do", "does", "i", "how", "what", "why", "which", "that", "this", "it", "with", "by", "from", "look", "like"]);
const KOREAN_SUFFIXES = ["에서는", "으로는", "에서", "으로", "하려면", "에게", "부터", "까지", "처럼", "는", "은", "이", "가", "을", "를", "의", "에", "로", "와", "과", "도", "나"];

export function searchTerms(query) {
  const words = [...new Set(String(query ?? "").toLowerCase().split(/\s+/).filter(Boolean))];
  const content = words.filter((word) => !SEARCH_STOPWORDS.has(word));
  return [...new Set((content.length > 0 ? content : words).map(stripKoreanSuffix))];
}

function stripKoreanSuffix(term) {
  if (term.length < 3 || !/[가-힣]/.test(term)) return term;
  for (const suffix of KOREAN_SUFFIXES) {
    if (term.endsWith(suffix) && term.length - suffix.length >= 2) return term.slice(0, -suffix.length);
  }
  return term;
}

// Pure keyword ranking over already-filtered docs. Single source shared by
// search-docs and the guided onboard/prepare surfaces, so they never reimplement
// the search engine.
//
// Ranked by BM25 over substring term counts in the redacted body (k1 1.2, b 0.75,
// idf over the docs passed in), plus +2 per term found in the title and +1 per
// term found only in tags/aliases (1.36.0). A document matches when ANY term is
// found, and `matchedTerms` says how many were. The earlier AND-only substring
// count returned nothing for 18 of 40 queries in bench/search-eval; see that
// directory for the measured comparison. `requireAll: true` still restricts the
// result to documents that contain every term.
//
// Returns matches sorted by (change-log-deprioritized, score desc, path asc); each
// carries path/title/status/score/matchedTerms/snippet plus the internal
// `deprioritized` key (callers that expose results strip it, as search-docs does).
// Scores are rounded to 4 decimals so the order cannot depend on the last bit of
// a logarithm.
export function rankDocsByQuery(docs, query, { requireAll = false } = {}) {
  const terms = searchTerms(query);
  if (terms.length === 0) return [];
  const prepared = docs.map((doc) => {
    // Score and echo the redacted view, as the body below already is.
    const fm = doc.displayFrontmatter ?? doc.frontmatter;
    const title = typeof fm.title === "string" ? fm.title : "";
    const metaHay = []
      .concat(Array.isArray(fm.tags) ? fm.tags : [])
      .concat(Array.isArray(fm.aliases) ? fm.aliases : [])
      .filter((value) => typeof value === "string")
      .join(" ")
      .toLowerCase();
    const bodyRedacted = redactSensitive(doc.body);
    return { doc, title, titleHay: title.toLowerCase(), metaHay, bodyRedacted, bodyHay: bodyRedacted.toLowerCase() };
  });
  const averageLength = prepared.reduce((sum, entry) => sum + entry.bodyHay.length, 0) / Math.max(1, prepared.length);
  const idf = new Map(terms.map((term) => {
    const df = prepared.filter((entry) => entry.bodyHay.includes(term)).length;
    return [term, Math.log(1 + (prepared.length - df + 0.5) / (df + 0.5))];
  }));

  const matches = [];
  for (const entry of prepared) {
    let score = 0;
    let matchedTerms = 0;
    const lengthNorm = 0.25 + 0.75 * (entry.bodyHay.length / (averageLength || 1));
    for (const term of terms) {
      const tf = occurrences(entry.bodyHay, term);
      const inTitle = entry.titleHay.includes(term);
      const inMeta = !inTitle && entry.metaHay.includes(term);
      if (tf > 0 || inTitle || inMeta) matchedTerms += 1;
      score += idf.get(term) * ((tf * 2.2) / (tf + 1.2 * lengthNorm));
      if (inTitle) score += 2;
      else if (inMeta) score += 1;
    }
    if (matchedTerms === 0) continue;
    if (requireAll && matchedTerms < terms.length) continue;
    matches.push({
      path: entry.doc.path,
      title: entry.title || null,
      status: typeof entry.doc.frontmatter.status === "string" ? entry.doc.frontmatter.status : null,
      score: Math.round(score * 10000) / 10000,
      matchedTerms,
      snippet: buildSnippet(entry.bodyRedacted, terms),
      // Internal sort key (stripped before return). The append-only change log
      // accumulates every keyword, so it would dominate the results;
      // deprioritize change logs so reference docs rank above them. The log is
      // still returned (demoted, not excluded).
      deprioritized: isAppendOnlyLog(entry.doc.path) || entry.doc.frontmatter.doc_type === "change_log"
    });
  }
  matches.sort((left, right) =>
    Number(left.deprioritized) - Number(right.deprioritized)
    || right.score - left.score
    || left.path.localeCompare(right.path));
  return matches;
}

function notFound(command, title, requested) {
  const findings = [{
    severity: "error",
    rule: "retrieval.not_found",
    path: normalizeGiven(requested),
    message: `No wiki document matches: ${requested ?? "(none)"}.`
  }];
  return withText({
    command,
    result: "fail",
    requested: typeof requested === "string" ? requested : null,
    document: null,
    related: null,
    findingSummary: summarizeFindings(findings),
    findings
  }, title, [
    { title: "Summary", body: ["result: fail", `requested: ${requested ?? "(none)"}`] },
    { title: "Findings", body: findings.map(formatFinding) },
    { title: "Caveats", body: ["Pass a path under docs/llm-wiki (for example docs/llm-wiki/GLOSSARY.md, GLOSSARY.md, or GLOSSARY). Read-only."] }
  ]);
}

function occurrences(haystack, term) {
  if (!term) return 0;
  let count = 0;
  let index = haystack.indexOf(term);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(term, index + term.length);
  }
  return count;
}

function buildSnippet(body, terms) {
  const flat = body.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const lower = flat.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const found = lower.indexOf(term);
    if (found !== -1 && (at === -1 || found < at)) at = found;
  }
  if (at === -1) return flat.length > 160 ? `${flat.slice(0, 160)} …` : flat;
  const start = Math.max(0, at - 60);
  const end = Math.min(flat.length, at + 100);
  return `${start > 0 ? "… " : ""}${flat.slice(start, end)}${end < flat.length ? " …" : ""}`;
}

function normalizeGiven(given) {
  return typeof given === "string" && given.trim() ? toPosix(given.trim()) : ".";
}

// Accept flexible doc references: a repo-relative path, a docs/llm-wiki-relative
// path, with or without the .md extension.
function candidatePaths(given) {
  const clean = toPosix(String(given ?? "").trim().replace(/^\.\//, "").replace(/^\/+/, ""));
  const withMd = clean.endsWith(".md") ? clean : `${clean}.md`;
  return new Set([clean, withMd, `docs/llm-wiki/${clean}`, `docs/llm-wiki/${withMd}`]);
}

function resolveDoc(docs, given) {
  if (!given) return null;
  const candidates = candidatePaths(given);
  const exact = docs.find((doc) => candidates.has(doc.path));
  if (exact) return exact;
  const clean = toPosix(String(given).trim());
  return docs.find((doc) => doc.path.endsWith(`/${clean}`) || doc.path.endsWith(`/${clean}.md`)) ?? null;
}

function resolveGraphPath(graph, given) {
  if (!given) return null;
  const candidates = candidatePaths(given);
  const doc = graph.documents.find((entry) => candidates.has(entry.path));
  if (doc) return doc.path;
  const clean = toPosix(String(given).trim());
  return graph.documents.find((entry) => entry.path.endsWith(`/${clean}`) || entry.path.endsWith(`/${clean}.md`))?.path ?? null;
}
