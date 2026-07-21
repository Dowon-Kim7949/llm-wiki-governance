// The three measured strategies for the impact-measurement harness (Gate 22).
//
// A representative "task" is a question a developer/agent must answer before
// making a change. Answering it means LOCATING and reading the relevant source.
// Each strategy assembles the input context a different way; we measure the
// token cost of that context and whether it actually surfaced the ground-truth
// source files needed to answer.
//
//   A0  whole-repo      — read every src file (naive "load everything" upper bound).
//   A1  grep-guided     — code-only, no wiki: grep src for the question's keywords,
//                         read every matching file IN FULL (path or content match).
//   A2  grep-snippet    — code-only, CONSERVATIVE: same grep hits, but read only a
//                         bounded window of lines around each match (a disciplined
//                         agent reads match context, not whole files). This is the
//                         LEAST wiki-favorable code-only baseline; if the wiki still
//                         wins against A2, the result is robust to the "grep doesn't
//                         read whole files" critique.
//   B   wiki-grounded   — read the wiki orientation docs first, then follow the
//                         evidence pointers those docs surface for the keywords.
//                         B's targeted file set is DERIVED FROM WIKI CONTENT, not
//                         from the answer key — so if the wiki's evidence pointers
//                         are incomplete, B genuinely fails to find a ground-truth
//                         file (success=false). This keeps the comparison honest.
//
// "success" = did the strategy's opened set contain ALL ground-truth files.
// This is a LOCATING-success proxy; answer-quality needs the heavier LLM run
// (documented as deferred follow-up in METHODOLOGY.md).

import { estimateTokens } from "./tokens.js";

const SRC_PATH_RE = /src\/[A-Za-z0-9_./-]+\.js/g;
const DEFAULT_SNIPPET_WINDOW = 40;

function lc(s) {
  return s.toLowerCase();
}

// Count tokens of only the lines within +/- window of any keyword-matching line,
// with overlapping windows merged (deduped line set). Models an agent that reads
// match context rather than whole files.
function snippetTokens(content, keys, window) {
  const lines = content.split(/\r?\n/);
  const keep = new Set();
  for (let i = 0; i < lines.length; i++) {
    const ll = lc(lines[i]);
    if (keys.some((k) => ll.includes(k))) {
      const lo = Math.max(0, i - window);
      const hi = Math.min(lines.length - 1, i + window);
      for (let j = lo; j <= hi; j++) keep.add(j);
    }
  }
  if (keep.size === 0) return 0;
  const selected = [...keep].sort((a, b) => a - b).map((j) => lines[j]);
  return estimateTokens(selected.join("\n"));
}

function sumTokens(files) {
  return files.reduce((n, f) => n + f.tokens, 0);
}

function isSubset(needles, haystackSet) {
  return needles.every((n) => haystackSet.has(n));
}

// A0 — whole-repo: open everything.
export function strategyWholeRepo(task, ctx) {
  const opened = ctx.srcFiles.map((f) => f.relPath);
  const openedSet = new Set(opened);
  return {
    strategy: "A0_whole_repo",
    inputTokens: sumTokens(ctx.srcFiles),
    filesOpened: opened.length,
    openedFiles: opened,
    success: isSubset(task.groundTruth, openedSet),
    orientationTokens: 0,
    targetedTokens: sumTokens(ctx.srcFiles),
  };
}

// A1 — grep-guided code-only: read every src file that matches a keyword.
export function strategyGrepGuided(task, ctx) {
  const keys = task.keywords.map(lc);
  const matched = ctx.srcFiles.filter((f) => {
    const hay = lc(f.relPath + "\n" + f.content);
    return keys.some((k) => hay.includes(k));
  });
  const opened = matched.map((f) => f.relPath);
  const openedSet = new Set(opened);
  return {
    strategy: "A1_grep_guided",
    inputTokens: sumTokens(matched),
    filesOpened: opened.length,
    openedFiles: opened,
    success: isSubset(task.groundTruth, openedSet),
    orientationTokens: 0,
    targetedTokens: sumTokens(matched),
  };
}

// A2 — grep-snippet: same grep hits as A1, but only match-context lines counted.
export function strategyGrepSnippet(task, ctx) {
  const keys = task.keywords.map(lc);
  const window = ctx.snippetWindow ?? DEFAULT_SNIPPET_WINDOW;
  const matched = ctx.srcFiles.filter((f) => {
    const hay = lc(f.relPath + "\n" + f.content);
    return keys.some((k) => hay.includes(k));
  });
  let tokens = 0;
  for (const f of matched) tokens += snippetTokens(f.content, keys, window);
  const opened = matched.map((f) => f.relPath);
  const openedSet = new Set(opened);
  return {
    strategy: "A2_grep_snippet",
    inputTokens: tokens,
    filesOpened: opened.length,
    openedFiles: opened,
    success: isSubset(task.groundTruth, openedSet),
    orientationTokens: 0,
    targetedTokens: tokens,
  };
}

// B — wiki-grounded: orientation read, then follow the evidence pointers the
// wiki surfaces for the keywords. Targeted files are extracted from wiki text.
export function strategyWikiGrounded(task, ctx) {
  const keys = task.keywords.map(lc);
  const targeted = new Set();

  for (const doc of ctx.orientationDocs) {
    const lines = doc.content.split(/\r?\n/);
    for (const line of lines) {
      const ll = lc(line);
      if (!keys.some((k) => ll.includes(k))) continue;
      const found = line.match(SRC_PATH_RE);
      if (!found) continue;
      for (const raw of found) {
        // strip any #symbol:/#L anchors already excluded by the regex ($ at .js)
        if (ctx.srcByPath.has(raw)) targeted.add(raw);
      }
    }
  }

  const targetedFiles = [...targeted].map((p) => ctx.srcByPath.get(p));
  const orientationTokens = sumTokens(ctx.orientationDocs);
  const targetedTokens = sumTokens(targetedFiles);
  const openedSet = new Set(targeted);

  return {
    strategy: "B_wiki_grounded",
    // Per-task cost charges the FULL orientation read to this one task (pessimistic
    // for the wiki). run.js also reports the amortized/session view where the
    // orientation read is paid once and shared across all tasks.
    inputTokens: orientationTokens + targetedTokens,
    filesOpened: targetedFiles.length,
    openedFiles: [...targeted],
    success: isSubset(task.groundTruth, openedSet),
    orientationTokens,
    targetedTokens,
  };
}

export const STRATEGIES = [
  strategyWholeRepo,
  strategyGrepGuided,
  strategyGrepSnippet,
  strategyWikiGrounded,
];
