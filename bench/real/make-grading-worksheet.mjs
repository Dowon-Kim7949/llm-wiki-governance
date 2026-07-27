#!/usr/bin/env node
// Build a BLIND grading worksheet from real-bench result JSONs.
//
// Grading answers while knowing which arm produced them is worthless — the whole
// point of the accuracy check is that it cannot be talked into agreeing with the
// token result. This script strips arm labels, shuffles every answer within its
// task, and writes two files:
//
//   worksheet.md  — task question + rubric + anonymised answers (grade from THIS only)
//   map.json      — the label -> arm mapping (do NOT open until the grades are fixed)
//
// The shuffle is a deterministic content hash, not RNG, so the same inputs always
// produce the same worksheet and a grade can be re-derived later.
//
//   node bench/real/make-grading-worksheet.mjs --out <dir> <result.json>...
//
// Known limit, inherent and worth stating in any writeup: an answer can still
// betray its arm through content (e.g. citing a wiki document). Blinding removes
// label bias, not every cue.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";
import { createHash } from "node:crypto";

function parseArgs(argv) {
  const args = argv.slice(2);
  const files = [];
  let out = null;
  let tasksFile = process.env.BENCH_TASKS || null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out") { out = args[++i]; continue; }
    if (args[i] === "--tasks") { tasksFile = args[++i]; continue; }
    files.push(args[i]);
  }
  return { files, out, tasksFile };
}

const LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function main() {
  const { files, out, tasksFile } = parseArgs(process.argv);
  if (!files.length || !out) {
    console.error("Usage: node bench/real/make-grading-worksheet.mjs --out <dir> [--tasks <tasks.json>] <result.json>...");
    process.exitCode = 3;
    return;
  }

  const rubrics = new Map();
  const questions = new Map();
  if (tasksFile) {
    for (const t of JSON.parse(readFileSync(tasksFile, "utf8")).tasks) {
      rubrics.set(t.id, t.rubric ?? []);
      questions.set(t.id, t.question);
    }
  }

  // Collect every answer, tagged with its arm (kept out of the worksheet).
  const byTask = new Map();
  for (const file of files) {
    const data = JSON.parse(readFileSync(file, "utf8"));
    for (const task of data.tasks) {
      if (!byTask.has(task.id)) byTask.set(task.id, []);
      if (!questions.has(task.id)) questions.set(task.id, task.question);
      task.runs.forEach((run, i) => {
        byTask.get(task.id).push({
          arm: data.arm,
          source: `${basename(file)}#run${i + 1}`,
          answer: (run.answer || "").trim(),
          openedPaths: run.openedPaths || [],
          wikiDocs: run.wikiDocs || []
        });
      });
    }
  }

  const sheet = [];
  const map = {};
  sheet.push("# Blind grading worksheet");
  sheet.push("");
  sheet.push("Grade each answer ONLY against its task rubric: how many key claims are correctly");
  sheet.push("stated, whether the responsible files are located, and any hallucination. The arm");
  sheet.push("that produced each answer is withheld on purpose — do not guess it, and do not open");
  sheet.push("map.json until every grade is written down.");
  sheet.push("");

  for (const [taskId, entries] of byTask) {
    // Deterministic, arm-independent ordering: sort by a hash of the answer text.
    const ordered = entries
      .map((e) => ({ ...e, key: createHash("sha256").update(e.answer).digest("hex") }))
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));

    sheet.push(`## ${taskId}`);
    sheet.push("");
    sheet.push(`**Question:** ${questions.get(taskId) ?? "(unknown)"}`);
    sheet.push("");
    const rubric = rubrics.get(taskId) ?? [];
    if (rubric.length) {
      sheet.push(`**Rubric (${rubric.length} key claims):**`);
      rubric.forEach((r, i) => sheet.push(`${i + 1}. ${r}`));
      sheet.push("");
    }
    ordered.forEach((entry, i) => {
      const label = `${taskId}-${LABELS[i]}`;
      map[label] = { arm: entry.arm, source: entry.source, openedPaths: entry.openedPaths, wikiDocs: entry.wikiDocs };
      sheet.push(`### ${label}`);
      sheet.push("");
      sheet.push(entry.answer);
      sheet.push("");
    });
  }

  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "worksheet.md"), sheet.join("\n"), "utf8");
  writeFileSync(join(out, "map.json"), JSON.stringify(map, null, 2) + "\n", "utf8");
  const counts = {};
  for (const v of Object.values(map)) counts[v.arm] = (counts[v.arm] || 0) + 1;
  console.log(`worksheet: ${join(out, "worksheet.md")}`);
  console.log(`map (do not read until graded): ${join(out, "map.json")}`);
  console.log(`answers: ${Object.keys(map).length} (${Object.entries(counts).map(([k, v]) => `${k}=${v}`).join(", ")}) across ${byTask.size} tasks`);
}

main();
