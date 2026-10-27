#!/usr/bin/env node
// Search-quality evaluation (P1-6, 2026-10-27): recall@5, hit@5, MRR and the
// zero-result rate of search-docs over bench/search-eval/queries.json, for the
// shipped ranker and a few zero-dependency candidates. Read-only; prints a
// Markdown table and, with --json, the per-query ranks.
//
//   node bench/search-eval/run.js [--cwd <repo>] [--queries <file>] [--json]
//
// --queries picks the query set (default queries.json, the set the 1.36.0 ranker
// was chosen on; heldout.json is the set written afterwards, 1.37.0).
//
// The corpus is exactly what search-docs searches by default (loadContentDocs +
// applyFilters). `shipped` calls the product's rankDocsByQuery, so this file can
// never drift from what users get; every candidate is implemented here and only
// here, and is compared against it.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyFilters, loadContentDocs, rankDocsByQuery, redactSensitive } from "../../src/commands/retrieval.js";
import { isAppendOnlyLog } from "../../src/commands/wiki-files.js";
import { normalizeOptions } from "../../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cwd = args.includes("--cwd") ? path.resolve(args[args.indexOf("--cwd") + 1]) : path.resolve(here, "..", "..");
const asJson = args.includes("--json");
const queriesFile = args.includes("--queries") ? path.resolve(args[args.indexOf("--queries") + 1]) : path.join(here, "queries.json");
const K = 5;

const { queries } = JSON.parse(readFileSync(queriesFile, "utf8"));
const { kept: docs } = applyFilters(await loadContentDocs(cwd), normalizeOptions({ cwd }));

// Korean particles and endings that glue onto a noun ("로그를", "문서는"), longest
// first so "으로" wins over "로". Stripped only from a term of 3+ characters, so a
// two-syllable noun is never cut to one.
const KO_SUFFIXES = ["에서는", "으로는", "에서", "으로", "하려면", "에게", "부터", "까지", "처럼", "는", "은", "이", "가", "을", "를", "의", "에", "로", "와", "과", "도", "나"];
const EN_STOPWORDS = new Set(["a", "an", "the", "and", "or", "of", "to", "in", "for", "on", "at", "is", "are", "be", "do", "does", "i", "how", "what", "why", "which", "that", "this", "it", "with", "by", "from", "look", "like"]);

function stem(term) {
  if (!/[가-힣]/.test(term) || term.length < 3) return term;
  for (const suffix of KO_SUFFIXES) {
    if (term.endsWith(suffix) && term.length - suffix.length >= 2) return term.slice(0, -suffix.length);
  }
  return term;
}

function termsOf(query, { stopwords = false, stemming = false } = {}) {
  let terms = String(query).toLowerCase().split(/\s+/).filter(Boolean);
  if (stopwords) terms = terms.filter((term) => !EN_STOPWORDS.has(term));
  if (stemming) terms = terms.map(stem);
  return [...new Set(terms)];
}

function fields(doc) {
  const fm = doc.displayFrontmatter ?? doc.frontmatter;
  const title = typeof fm.title === "string" ? fm.title.toLowerCase() : "";
  const meta = [title, ...(Array.isArray(fm.tags) ? fm.tags : []), ...(Array.isArray(fm.aliases) ? fm.aliases : [])]
    .filter((value) => typeof value === "string").join(" ").toLowerCase();
  const body = redactSensitive(doc.body).toLowerCase();
  const headings = body.split("\n").filter((line) => /^#{1,6}\s/.test(line)).join("\n");
  return { title, meta, body, headings };
}
const FIELDS = new Map(docs.map((doc) => [doc.path, fields(doc)]));

function count(hay, term) {
  let n = 0;
  for (let at = hay.indexOf(term); at !== -1; at = hay.indexOf(term, at + term.length)) n += 1;
  return n;
}

// Same order rule as the product: change logs after reference documents, then
// score, then path. Every candidate gets it, so it is not what they differ by.
const DEMOTED = new Set(docs.filter((doc) => isAppendOnlyLog(doc.path) || doc.frontmatter.doc_type === "change_log").map((doc) => doc.path));
const sortRanked = (scored) => scored
  .filter((entry) => entry.score > 0)
  .sort((a, b) => Number(DEMOTED.has(a.path)) - Number(DEMOTED.has(b.path)) || b.score - a.score || a.path.localeCompare(b.path))
  .map((entry) => entry.path);

// The 1.35.0 formula over a given term list, any-term semantics.
function substringScore(terms, { headingWeight = 0 } = {}) {
  return sortRanked(docs.map((doc) => {
    const f = FIELDS.get(doc.path);
    let score = 0;
    for (const term of terms) {
      if (f.title.includes(term)) score += 10;
      if (f.meta.includes(term)) score += 3;
      score += count(f.body, term);
      if (headingWeight && f.headings.includes(term)) score += headingWeight;
    }
    return { path: doc.path, score };
  }));
}

// BM25 over substring term frequency (no tokenizer, so Korean still matches
// inside words), plus a title bonus. k1/b are the textbook defaults.
function bm25(terms) {
  const lengths = docs.map((doc) => FIELDS.get(doc.path).body.length);
  const avg = lengths.reduce((a, b) => a + b, 0) / Math.max(1, lengths.length);
  const df = new Map(terms.map((term) => [term, docs.filter((doc) => FIELDS.get(doc.path).body.includes(term)).length]));
  return sortRanked(docs.map((doc, index) => {
    const f = FIELDS.get(doc.path);
    let score = 0;
    for (const term of terms) {
      const tf = count(f.body, term);
      const idf = Math.log(1 + (docs.length - df.get(term) + 0.5) / (df.get(term) + 0.5));
      score += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (lengths[index] / avg))));
      if (f.title.includes(term)) score += 2;
    }
    return { path: doc.path, score };
  }));
}

const shipped = (query) => rankDocsByQuery(docs, query).map((match) => match.path);

// The 1.35.0 ranker, frozen here as the reference the change is measured
// against: every whitespace term must appear (AND), then +10 per term in the
// title, +3 per term in title/tags/aliases, +1 per body occurrence.
const rawTerms = (query) => String(query).toLowerCase().split(/\s+/).filter(Boolean);

function v135(query) {
  const terms = rawTerms(query);
  return sortRanked(docs.map((doc) => {
    const f = FIELDS.get(doc.path);
    if (!terms.every((term) => f.title.includes(term) || f.meta.includes(term) || f.body.includes(term))) return { path: doc.path, score: 0 };
    let score = 0;
    for (const term of terms) {
      if (f.title.includes(term)) score += 10;
      if (f.meta.includes(term)) score += 3;
      score += count(f.body, term);
    }
    return { path: doc.path, score };
  }));
}

const RANKERS = {
  "1.35.0 (AND substring)": v135,
  "1.35.0 + any-term fallback": (query) => {
    const and = v135(query);
    return and.length > 0 ? and : substringScore(rawTerms(query));
  },
  "headings, any-term": (query) => substringScore(termsOf(query, { stopwords: true, stemming: true }), { headingWeight: 5 }),
  "bm25 (raw terms)": (query) => bm25(termsOf(query)),
  "bm25 + terms (candidate)": (query) => bm25(termsOf(query, { stopwords: true, stemming: true })),
  "shipped (product rankDocsByQuery)": shipped,
  "shipped --all-terms": (query) => rankDocsByQuery(docs, query, { requireAll: true }).map((match) => match.path)
};

function evaluate(rank) {
  const rows = queries.map((q) => {
    const ranked = rank(q.query);
    const firstHit = ranked.findIndex((p) => q.relevant.includes(p));
    const topK = ranked.slice(0, K);
    return {
      id: q.id,
      lang: q.lang,
      results: ranked.length,
      firstRank: firstHit === -1 ? null : firstHit + 1,
      recallAtK: q.relevant.filter((p) => topK.includes(p)).length / q.relevant.length
    };
  });
  const summarize = (subset) => ({
    n: subset.length,
    recallAtK: subset.reduce((a, r) => a + r.recallAtK, 0) / subset.length,
    hitAtK: subset.filter((r) => r.firstRank !== null && r.firstRank <= K).length / subset.length,
    mrr: subset.reduce((a, r) => a + (r.firstRank ? 1 / r.firstRank : 0), 0) / subset.length,
    zeroResults: subset.filter((r) => r.results === 0).length
  });
  return { rows, all: summarize(rows), ko: summarize(rows.filter((r) => r.lang === "ko")), en: summarize(rows.filter((r) => r.lang === "en")) };
}

const report = Object.fromEntries(Object.entries(RANKERS).map(([name, rank]) => [name, evaluate(rank)]));

if (asJson) {
  console.log(JSON.stringify({ cwd, queriesFile: path.basename(queriesFile), corpus: docs.length, queries: queries.length, k: K, report }, null, 2));
} else {
  const pct = (value) => `${(value * 100).toFixed(1)}%`;
  console.log(`queries: ${path.basename(queriesFile)} (${queries.length}) · corpus: ${docs.length} docs · k = ${K}\n`);
  console.log("| ranker | recall@5 | hit@5 | MRR | zero-result queries | ko hit@5 | en hit@5 |");
  console.log("| --- | --- | --- | --- | --- | --- | --- |");
  for (const [name, { all, ko, en }] of Object.entries(report)) {
    console.log(`| ${name} | ${pct(all.recallAtK)} | ${pct(all.hitAtK)} | ${all.mrr.toFixed(3)} | ${all.zeroResults} | ${pct(ko.hitAtK)} | ${pct(en.hitAtK)} |`);
  }
}
