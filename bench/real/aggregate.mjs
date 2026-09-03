#!/usr/bin/env node
// Aggregate real-LLM bench result JSONs into a comparison table.
//
// The 2026-07-24 pass aggregated by hand, which is fine once and a liability
// twice — a three-arm comparison (B / B2 / B2_empty) has enough moving parts that
// the arithmetic should be reproducible. Zero dependencies; reads only the result
// files you name, so it can never silently pick up a stale or mismatched run.
//
//   node bench/real/aggregate.mjs <result.json>... [--baseline B]
//
// Reports the RATIO against the baseline arm, not raw totals: totals include the
// agent's own scaffolding and are not portable across drivers (DRIVER_RUNBOOK.md).

import { readFileSync } from "node:fs";
import { basename } from "node:path";

// Opus pricing, per 1M tokens. Update alongside the model, and note it in output.
const PRICE = { input: 5, output: 25 };

function parseArgs(argv) {
  const args = argv.slice(2);
  const files = [];
  let baseline = "B";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--baseline") { baseline = args[++i]; continue; }
    files.push(args[i]);
  }
  return { files, baseline };
}

function cost(inTok, outTok) {
  return (inTok * PRICE.input + outTok * PRICE.output) / 1_000_000;
}

function mean(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function stdev(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

function load(file) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  if (!data.executed) throw new Error(`${file}: not an executed run`);
  const perTask = new Map();
  let totalIn = 0, totalOut = 0, runs = 0;
  const models = new Set();
  for (const task of data.tasks) {
    const ins = [], outs = [], srcFiles = [], wikiDocs = [];
    for (const run of task.runs) {
      ins.push(run.inputTokens || 0);
      outs.push(run.outputTokens || 0);
      srcFiles.push((run.openedPaths || []).length);
      wikiDocs.push((run.wikiDocs || []).length);
      totalIn += run.inputTokens || 0;
      totalOut += run.outputTokens || 0;
      runs++;
      if (run.model) models.add(run.model);
    }
    perTask.set(task.id, {
      input: mean(ins), output: mean(outs),
      cv: mean(ins) ? stdev(ins) / mean(ins) : 0,
      srcFiles: mean(srcFiles), wikiDocs: mean(wikiDocs),
      zeroSourceRuns: srcFiles.filter((n) => n === 0).length, repeats: srcFiles.length
    });
  }
  return {
    arm: data.arm, label: data.armLabel, repeats: data.repeats, runs,
    totalIn, totalOut, perTask, file: basename(file),
    models: [...models], generatedAt: data.generatedAt
  };
}

function main() {
  const { files, baseline } = parseArgs(process.argv);
  if (!files.length) {
    console.error("Usage: node bench/real/aggregate.mjs <result.json>... [--baseline B]");
    process.exitCode = 3;
    return;
  }
  const arms = files.map(load);
  const base = arms.find((a) => a.arm === baseline);
  if (!base) {
    console.error(`Baseline arm "${baseline}" not among: ${arms.map((a) => a.arm).join(", ")}`);
    process.exitCode = 3;
    return;
  }
  const repeats = new Set(arms.map((a) => a.repeats));
  const L = [];
  L.push(`# Real-LLM bench aggregate (baseline: ${baseline})`);
  L.push("");
  L.push(`models: ${[...new Set(arms.flatMap((a) => a.models))].join(", ")}   pricing: $${PRICE.input}/$${PRICE.output} per 1M`);
  if (repeats.size > 1) L.push(`WARNING: arms have different repeat counts (${[...repeats].join(", ")}) — not directly comparable.`);
  L.push("");
  L.push("## Totals");
  L.push("");
  L.push(`| arm | runs | input | output | cost | input vs ${baseline} | cost vs ${baseline} |`);
  L.push("| --- | --: | --: | --: | --: | --: | --: |");
  for (const a of arms) {
    const c = cost(a.totalIn, a.totalOut);
    const ri = a.totalIn / base.totalIn;
    const rc = c / cost(base.totalIn, base.totalOut);
    const pct = (r) => `${r.toFixed(3)}x (${r < 1 ? "" : "+"}${((r - 1) * 100).toFixed(1)}%)`;
    L.push(`| ${a.arm} | ${a.runs} | ${a.totalIn.toLocaleString()} | ${a.totalOut.toLocaleString()} | $${c.toFixed(4)} | ${a.arm === baseline ? "—" : pct(ri)} | ${a.arm === baseline ? "—" : pct(rc)} |`);
  }
  L.push("");
  L.push("## Per-task mean input tokens");
  L.push("");
  L.push(`| task | ${arms.map((a) => a.arm).join(" | ")} | ${arms.filter((a) => a.arm !== baseline).map((a) => `${a.arm}/${baseline}`).join(" | ")} |`);
  L.push(`| --- | ${arms.map(() => "--:").join(" | ")} | ${arms.filter((a) => a.arm !== baseline).map(() => "--:").join(" | ")} |`);
  for (const taskId of base.perTask.keys()) {
    const cells = arms.map((a) => Math.round(a.perTask.get(taskId)?.input ?? 0).toLocaleString());
    const ratios = arms.filter((a) => a.arm !== baseline).map((a) => {
      const b = base.perTask.get(taskId).input;
      const v = a.perTask.get(taskId)?.input ?? 0;
      return b ? `${(v / b).toFixed(2)}x` : "—";
    });
    L.push(`| ${taskId} | ${cells.join(" | ")} | ${ratios.join(" | ")} |`);
  }
  L.push("");
  L.push("## Behavior (mean per run)");
  L.push("");
  L.push(`| arm | source files opened | wiki docs read | runs answering with 0 source reads | max input CV |`);
  L.push("| --- | --: | --: | --: | --: |");
  for (const a of arms) {
    const tasks = [...a.perTask.values()];
    const zero = tasks.reduce((n, t) => n + t.zeroSourceRuns, 0);
    const maxCv = Math.max(...tasks.map((t) => t.cv));
    L.push(`| ${a.arm} | ${mean(tasks.map((t) => t.srcFiles)).toFixed(2)} | ${mean(tasks.map((t) => t.wikiDocs)).toFixed(2)} | ${zero}/${a.runs} | ${(maxCv * 100).toFixed(0)}% |`);
  }
  L.push("");
  L.push("Ratios, not totals, are the portable quantity. High CV means a single repeat is");
  L.push("not trustworthy — cite the mean with its spread. Token results say nothing about");
  L.push("correctness: grade the answers blind to arm before pairing the two.");
  console.log(L.join("\n"));
}

main();
