#!/usr/bin/env node
// Impact-measurement harness runner (Gate 22). Zero-dependency, repo-internal,
// NOT part of the npm `files` allowlist (never shipped).
//
//   node bench/run.js                 run + write bench/results/baseline.json + .md
//   node bench/run.js --no-write      run + print only (no files written)
//   node bench/run.js --against <f>   run + print token deltas vs a prior results json
//
// See bench/METHODOLOGY.md for what is measured and the honesty caveats.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

import { collectFiles, readNamedFiles } from "./lib/fs-walk.js";
import { STRATEGIES } from "./lib/strategies.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(HERE);

const args = process.argv.slice(2);
const noWrite = args.includes("--no-write");
const againstIdx = args.indexOf("--against");
const againstPath = againstIdx >= 0 ? args[againstIdx + 1] : null;

function fmt(n) {
  return Math.round(n).toLocaleString("en-US");
}
function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}
function ratioNote(bTokens, baselineTokens) {
  if (baselineTokens === 0) return "n/a";
  const r = bTokens / baselineTokens;
  return `${r.toFixed(2)}x (${r < 1 ? "-" : "+"}${pct(Math.abs(1 - r))})`;
}

function loadConfig() {
  const cfg = JSON.parse(readFileSync(join(HERE, "tasks.json"), "utf8"));
  const matchRe = new RegExp(cfg.srcMatch);
  return { cfg, matchRe };
}

function buildContext(cfg, matchRe) {
  const srcFiles = collectFiles(REPO_ROOT, cfg.srcRoot, (rel) => matchRe.test(rel));
  const srcByPath = new Map(srcFiles.map((f) => [f.relPath, f]));
  const orientationDocs = readNamedFiles(REPO_ROOT, cfg.orientationDocs);
  const wikiCorpus = collectFiles(REPO_ROOT, "docs/llm-wiki", (rel) => rel.endsWith(".md"));
  const snippetWindow = cfg.snippetWindow ?? 40;
  return { srcFiles, srcByPath, orientationDocs, wikiCorpus, snippetWindow };
}

function run() {
  const { cfg, matchRe } = loadConfig();
  const ctx = buildContext(cfg, matchRe);
  const startedAt = Date.now();

  const totalSrcTokens = ctx.srcFiles.reduce((n, f) => n + f.tokens, 0);
  const orientationTokens = ctx.orientationDocs.reduce((n, f) => n + f.tokens, 0);
  const wikiCorpusTokens = ctx.wikiCorpus.reduce((n, f) => n + f.tokens, 0);

  const perTask = [];
  for (const task of cfg.tasks) {
    const results = STRATEGIES.map((fn) => fn(task, ctx));
    const byName = Object.fromEntries(results.map((r) => [r.strategy, r]));
    perTask.push({ task, byName });
  }

  const T = cfg.tasks.length;
  // Session totals: A0/A1/A2 re-read per task; B pays orientation ONCE, then targeted per task.
  const sessionA0 = perTask.reduce((n, p) => n + p.byName.A0_whole_repo.inputTokens, 0);
  const sessionA1 = perTask.reduce((n, p) => n + p.byName.A1_grep_guided.inputTokens, 0);
  const sessionA2 = perTask.reduce((n, p) => n + p.byName.A2_grep_snippet.inputTokens, 0);
  const sessionBTargeted = perTask.reduce((n, p) => n + p.byName.B_wiki_grounded.targetedTokens, 0);
  const sessionB = orientationTokens + sessionBTargeted;

  const a1Success = perTask.filter((p) => p.byName.A1_grep_guided.success).length;
  const bSuccess = perTask.filter((p) => p.byName.B_wiki_grounded.success).length;

  const elapsedMs = Date.now() - startedAt;

  const summary = {
    schema: "llm-wiki-bench/1",
    generatedAt: new Date().toISOString(),
    repo: "llm-wiki-governance",
    tokenEstimator: "chars/4 (see bench/lib/tokens.js)",
    snippetWindowLines: ctx.snippetWindow,
    corpus: {
      srcFiles: ctx.srcFiles.length,
      srcTokens: totalSrcTokens,
      orientationDocs: ctx.orientationDocs.length,
      orientationTokens,
      wikiCorpusDocs: ctx.wikiCorpus.length,
      wikiCorpusTokens,
    },
    tasks: perTask.map((p) => ({
      id: p.task.id,
      question: p.task.question,
      keywords: p.task.keywords,
      groundTruth: p.task.groundTruth,
      A0_whole_repo: sliceResult(p.byName.A0_whole_repo),
      A1_grep_guided: sliceResult(p.byName.A1_grep_guided),
      A2_grep_snippet: sliceResult(p.byName.A2_grep_snippet),
      B_wiki_grounded: sliceResult(p.byName.B_wiki_grounded),
    })),
    session: {
      taskCount: T,
      A0_whole_repo_tokens: sessionA0,
      A1_grep_guided_tokens: sessionA1,
      A2_grep_snippet_tokens: sessionA2,
      B_wiki_grounded_tokens: sessionB,
      B_orientation_once_tokens: orientationTokens,
      B_targeted_tokens: sessionBTargeted,
      B_amortized_per_task_tokens: Math.round(orientationTokens / T + sessionBTargeted / T),
      A1_success_rate: a1Success / T,
      B_success_rate: bSuccess / T,
      B_vs_A1_session: sessionB / sessionA1,
      B_vs_A2_session: sessionB / sessionA2,
      B_vs_A0_session: sessionB / sessionA0,
    },
    harnessComputeMs: elapsedMs,
  };

  printReport(summary, perTask);
  return summary;
}

function sliceResult(r) {
  return {
    inputTokens: r.inputTokens,
    filesOpened: r.filesOpened,
    success: r.success,
    orientationTokens: r.orientationTokens,
    targetedTokens: r.targetedTokens,
    openedFiles: r.openedFiles,
  };
}

function printReport(s, perTask) {
  const L = [];
  L.push("");
  L.push("LLM-WIKI Impact Measurement — Gate 22 baseline");
  L.push("=".repeat(64));
  L.push(`generated: ${s.generatedAt}`);
  L.push(`estimator: ${s.tokenEstimator}`);
  L.push("");
  L.push("Corpus:");
  L.push(`  source scanned : ${s.corpus.srcFiles} files, ${fmt(s.corpus.srcTokens)} tokens`);
  L.push(`  wiki orientation read (paid once/session): ${s.corpus.orientationDocs} docs, ${fmt(s.corpus.orientationTokens)} tokens`);
  L.push(`  full wiki corpus (author + maintain cost): ${s.corpus.wikiCorpusDocs} docs, ${fmt(s.corpus.wikiCorpusTokens)} tokens`);
  L.push("");
  L.push(`Per-task input tokens (B charges FULL orientation to each task = pessimistic for wiki; A2 window +/-${s.snippetWindowLines} lines):`);
  L.push(
    "  " +
      pad("task", 22) +
      pad("A0 whole", 11) +
      pad("A1 grepFull", 14) +
      pad("A2 grepSnip", 14) +
      pad("B wiki", 13) +
      pad("A ok", 6) +
      pad("B ok", 6) +
      "B vs A2"
  );
  for (const p of perTask) {
    const a0 = p.byName.A0_whole_repo;
    const a1 = p.byName.A1_grep_guided;
    const a2 = p.byName.A2_grep_snippet;
    const b = p.byName.B_wiki_grounded;
    L.push(
      "  " +
        pad(p.task.id, 22) +
        pad(fmt(a0.inputTokens), 11) +
        pad(`${fmt(a1.inputTokens)}(${a1.filesOpened})`, 14) +
        pad(`${fmt(a2.inputTokens)}(${a2.filesOpened})`, 14) +
        pad(`${fmt(b.inputTokens)}(${b.filesOpened})`, 13) +
        pad(a1.success ? "yes" : "NO", 6) +
        pad(b.success ? "yes" : "NO", 6) +
        ratioNote(b.inputTokens, a2.inputTokens)
    );
  }
  L.push("");
  L.push("Session view (6 tasks; A0/A1/A2 re-read per task, B pays orientation ONCE):");
  L.push(`  A0 whole-repo total : ${fmt(s.session.A0_whole_repo_tokens)} tokens`);
  L.push(`  A1 grep-full total  : ${fmt(s.session.A1_grep_guided_tokens)} tokens   success ${pct(s.session.A1_success_rate)}`);
  L.push(`  A2 grep-snippet     : ${fmt(s.session.A2_grep_snippet_tokens)} tokens   (conservative code-only floor)`);
  L.push(`  B  wiki-grounded    : ${fmt(s.session.B_wiki_grounded_tokens)} tokens   success ${pct(s.session.B_success_rate)}`);
  L.push(`     = ${fmt(s.session.B_orientation_once_tokens)} orientation (once) + ${fmt(s.session.B_targeted_tokens)} targeted reads`);
  L.push(`  B amortized / task  : ${fmt(s.session.B_amortized_per_task_tokens)} tokens`);
  L.push("");
  L.push(`  B vs A1 (session)   : ${ratioNote(s.session.B_wiki_grounded_tokens, s.session.A1_grep_guided_tokens)}`);
  L.push(`  B vs A2 (session)   : ${ratioNote(s.session.B_wiki_grounded_tokens, s.session.A2_grep_snippet_tokens)}  <- conservative test`);
  L.push(`  B vs A0 (session)   : ${ratioNote(s.session.B_wiki_grounded_tokens, s.session.A0_whole_repo_tokens)}`);
  L.push("");
  L.push("Honest verdict (auto-computed):");
  for (const line of verdict(s)) L.push("  " + line);
  L.push("");
  L.push(`harness compute time: ${s.harnessComputeMs} ms (NOT agent latency — that needs the LLM follow-up)`);
  L.push("");
  console.log(L.join("\n"));
}

// Auto-computed, honest read of the numbers — favorable OR unfavorable.
function verdict(s) {
  const out = [];
  const sess = s.session;
  const winA1 = sess.B_wiki_grounded_tokens < sess.A1_grep_guided_tokens;
  out.push(
    winA1
      ? `Vs A1 (grep, read whole matching files): across a ${sess.taskCount}-task session the governed wiki costs FEWER input tokens (${ratioNote(sess.B_wiki_grounded_tokens, sess.A1_grep_guided_tokens)} of A1).`
      : `Vs A1 (grep, whole files): the wiki costs MORE input tokens (${ratioNote(sess.B_wiki_grounded_tokens, sess.A1_grep_guided_tokens)} of A1) — UNFAVORABLE, reported as required.`
  );
  const winA2 = sess.B_wiki_grounded_tokens < sess.A2_grep_snippet_tokens;
  out.push(
    winA2
      ? `Vs A2 (grep, snippet-only — the CONSERVATIVE code-only floor): the wiki STILL costs fewer tokens (${ratioNote(sess.B_wiki_grounded_tokens, sess.A2_grep_snippet_tokens)} of A2), so the win survives the "grep doesn't read whole files" critique.`
      : `Vs A2 (grep snippet-only, the conservative floor): the wiki costs MORE than a disciplined snippet-reading grep (${ratioNote(sess.B_wiki_grounded_tokens, sess.A2_grep_snippet_tokens)} of A2) — an HONEST limit: the token win holds only against whole-file reading, not against careful snippet reading.`
  );
  if (sess.B_success_rate >= sess.A1_success_rate) {
    out.push(
      `Locating success: wiki ${pct(sess.B_success_rate)} vs grep ${pct(sess.A1_success_rate)} — on this repo grep also found the target code, so the wiki's demonstrated advantage here is CONTEXT SIZE, not locating. (A cold grep with no symbol names could miss; not shown by these tasks.)`
    );
  } else {
    out.push(
      `Locating success: wiki ${pct(sess.B_success_rate)} vs grep ${pct(sess.A1_success_rate)} — the wiki MISSED a ground-truth file (incomplete evidence pointer); a real, honest gap to fix.`
    );
  }
  out.push(
    "Caveat: token counts are a chars/4 proxy; wall-clock + answer-quality need the deferred LLM run. Wiki authoring/maintenance is a real cost not charged per-task (disclosed as the corpus figure). The rediscovery-reduction mechanism completes at retrieval (Gate 24) — the headline is the before/after-retrieval delta, not this raw baseline."
  );
  return out;
}

function pad(s, n) {
  s = String(s);
  return s.length >= n ? s + " " : s + " ".repeat(n - s.length);
}

function writeResults(summary) {
  const dir = join(HERE, "results");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "baseline.json"), JSON.stringify(summary, null, 2) + "\n", "utf8");
  writeFileSync(join(dir, "baseline.md"), renderMarkdown(summary), "utf8");
  console.log(`wrote bench/results/baseline.json and bench/results/baseline.md`);
}

function renderMarkdown(s) {
  const M = [];
  M.push("# LLM-WIKI Impact Measurement — Gate 22 baseline");
  M.push("");
  M.push("> Auto-generated by `node bench/run.js`. Do not hand-edit; re-run to refresh.");
  M.push("> See [`../METHODOLOGY.md`](../METHODOLOGY.md) for what is measured and the honesty caveats.");
  M.push("");
  M.push(`- generated: \`${s.generatedAt}\``);
  M.push(`- token estimator: ${s.tokenEstimator}`);
  M.push(`- source scanned: ${s.corpus.srcFiles} files, ${fmt(s.corpus.srcTokens)} tokens`);
  M.push(`- wiki orientation read (once/session): ${s.corpus.orientationDocs} docs, ${fmt(s.corpus.orientationTokens)} tokens`);
  M.push(`- full wiki corpus (author + maintain): ${s.corpus.wikiCorpusDocs} docs, ${fmt(s.corpus.wikiCorpusTokens)} tokens`);
  M.push("");
  M.push("## Strategies");
  M.push("");
  M.push("- **A0 whole-repo** — read every source file (naive upper bound).");
  M.push("- **A1 grep-full** — code-only: grep src for the cold query terms, read each matching file in full.");
  M.push(`- **A2 grep-snippet** — code-only, conservative: same grep hits, but count only +/-${s.snippetWindowLines} lines around each match (a disciplined agent reading match context). This is the LEAST wiki-favorable code-only baseline.`);
  M.push("- **B wiki-grounded** — read the wiki orientation docs, then follow the evidence pointers they surface for the query. Targeted files are DERIVED FROM WIKI CONTENT (not the answer key), so B can genuinely miss.");
  M.push("");
  M.push("## Per-task input tokens");
  M.push("");
  M.push("B charges the full orientation read to each task (pessimistic for the wiki); see the session view for the amortized number. `B vs A2` compares against the conservative floor.");
  M.push("");
  M.push("| task | A0 whole | A1 grep-full (files) | A2 grep-snip (files) | B wiki (files) | A found | B found | B vs A2 |");
  M.push("| --- | ---: | ---: | ---: | ---: | :---: | :---: | ---: |");
  for (const t of s.tasks) {
    M.push(
      `| \`${t.id}\` | ${fmt(t.A0_whole_repo.inputTokens)} | ${fmt(t.A1_grep_guided.inputTokens)} (${t.A1_grep_guided.filesOpened}) | ${fmt(t.A2_grep_snippet.inputTokens)} (${t.A2_grep_snippet.filesOpened}) | ${fmt(t.B_wiki_grounded.inputTokens)} (${t.B_wiki_grounded.filesOpened}) | ${t.A1_grep_guided.success ? "yes" : "**NO**"} | ${t.B_wiki_grounded.success ? "yes" : "**NO**"} | ${ratioNote(t.B_wiki_grounded.inputTokens, t.A2_grep_snippet.inputTokens)} |`
    );
  }
  M.push("");
  M.push("## Session view (6 tasks)");
  M.push("");
  M.push("A0/A1/A2 re-read source per task; B pays the orientation read once, then targeted reads per task.");
  M.push("");
  M.push("| metric | value |");
  M.push("| --- | ---: |");
  M.push(`| A0 whole-repo total | ${fmt(s.session.A0_whole_repo_tokens)} |`);
  M.push(`| A1 grep-full total | ${fmt(s.session.A1_grep_guided_tokens)} |`);
  M.push(`| A2 grep-snippet total (conservative floor) | ${fmt(s.session.A2_grep_snippet_tokens)} |`);
  M.push(`| B wiki-grounded total | ${fmt(s.session.B_wiki_grounded_tokens)} |`);
  M.push(`| — orientation (once) | ${fmt(s.session.B_orientation_once_tokens)} |`);
  M.push(`| — targeted reads | ${fmt(s.session.B_targeted_tokens)} |`);
  M.push(`| B amortized / task | ${fmt(s.session.B_amortized_per_task_tokens)} |`);
  M.push(`| A1 locating success | ${pct(s.session.A1_success_rate)} |`);
  M.push(`| B locating success | ${pct(s.session.B_success_rate)} |`);
  M.push(`| **B vs A1 (session)** | **${ratioNote(s.session.B_wiki_grounded_tokens, s.session.A1_grep_guided_tokens)}** |`);
  M.push(`| **B vs A2 (session, conservative)** | **${ratioNote(s.session.B_wiki_grounded_tokens, s.session.A2_grep_snippet_tokens)}** |`);
  M.push(`| B vs A0 (session) | ${ratioNote(s.session.B_wiki_grounded_tokens, s.session.A0_whole_repo_tokens)} |`);
  M.push("");
  M.push(`> Wiki authoring/maintenance cost (disclosed, not charged per-task): the full wiki corpus is ${fmt(s.corpus.wikiCorpusDocs)} docs / ${fmt(s.corpus.wikiCorpusTokens)} tokens.`);
  M.push("");
  M.push("## Honest verdict (auto-computed)");
  M.push("");
  for (const line of verdict(s)) M.push(`- ${line}`);
  M.push("");
  return M.join("\n");
}

function compare(current, priorPath) {
  const prior = JSON.parse(readFileSync(priorPath, "utf8"));
  const c = current.session;
  const p = prior.session;
  console.log("");
  console.log(`Delta vs ${priorPath}:`);
  const rows = [
    ["A1 grep-full", p.A1_grep_guided_tokens, c.A1_grep_guided_tokens],
    ["A2 grep-snippet", p.A2_grep_snippet_tokens, c.A2_grep_snippet_tokens],
    ["B wiki-grounded", p.B_wiki_grounded_tokens, c.B_wiki_grounded_tokens],
    ["B vs A1 ratio", p.B_vs_A1_session, c.B_vs_A1_session],
    ["B vs A2 ratio", p.B_vs_A2_session, c.B_vs_A2_session],
    ["B success rate", p.B_success_rate, c.B_success_rate],
  ];
  for (const [name, was, now] of rows) {
    console.log(`  ${pad(name, 20)} ${was} -> ${now}`);
  }
  console.log("");
}

const summary = run();
if (againstPath) compare(summary, againstPath);
if (!noWrite && !againstPath) writeResults(summary);
