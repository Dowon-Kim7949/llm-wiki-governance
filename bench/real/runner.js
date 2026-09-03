#!/usr/bin/env node
// Real-LLM measurement PROTOTYPE. Design + honesty caveats in
// ../REAL_LLM_METHODOLOGY.md. Structures a real-agent B (no-retrieval) vs
// B2 (retrieval) run over the same tasks as the deterministic proxy harness.
//
// Zero-dependency (Node built-ins only). The actual model call is behind a
// pluggable AgentRunner seam; the DEFAULT runner THROWS so a run without a wired
// driver fails loudly and never fabricates tokens or answers. `--dry` exercises
// everything except the model call (prompt building, rubric, schema) so the
// harness is reviewable before any API budget is spent.
//
//   node bench/real/runner.js --dry                 validate harness, no model call
//   node bench/real/runner.js --print-prompts       dump the 6x2 prompts to paste into a coding agent (manual-driver path; see DRIVER_RUNBOOK.md)
//   node bench/real/runner.js --arm B  --repeats 3  real run (needs a wired AgentRunner)
//   node bench/real/runner.js --arm B2 --repeats 3
//
// A real run supplies an AgentRunner via bench/real/agent.js (git-ignored, adds a
// dev-only SDK dependency in the SCRIPT, never in the package) — see §5 of the design.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const HERE = dirname(fileURLToPath(import.meta.url));
const BENCH_ROOT = dirname(HERE);

// Answer-quality rubrics: the key claims a correct answer must state, per task.
// Authored from the source (reviewed by a human before a real grade). Locating
// success (ground-truth files) lives in tasks.json; this is the correctness bar.
export const RUBRICS = {
  "type-detection-mobile": [
    "identifies detectMobile as the mobile-type detector",
    "cites the Android build.gradle / AndroidManifest (or Flutter/iOS/RN) signal",
    "explains the Android build.gradle -> JVM library misclassification correction",
    "grounds the answer in src/detector.js"
  ],
  "audit-pipeline": [
    "audit composes the scan* family into a findings array",
    "severity is graded blocked > error > warning > pass",
    "grounds the answer in src/commands.js and src/commands/scans.js"
  ],
  "config-merge": [
    "a shared config-merge seam (applyProjectConfig) is used",
    "the same merge runs across the CLI, the programmatic API, and MCP",
    "grounds the answer in src/cli.js / src/index.js / src/config-file.js"
  ],
  "rule-toggle": [
    "config rules map toggles a rule off or overrides its severity",
    "applied centrally (applyRuleConfig)",
    "sensitive.* rules are never toggleable (safety)",
    "grounds the answer in src/commands/findings.js"
  ],
  "skill-generation": [
    "identifies writeSkillArtifacts as the generator",
    "covers Claude skill / Cursor rule / neutral prompt formats",
    "states existing files are never overwritten",
    "grounds the answer in src/commands/skills.js"
  ],
  "mcp-tools": [
    "read-only commands are exposed as MCP tools (TOOL_DEFS)",
    "no write/mutating command is exposed (read-only guarantee)",
    "grounds the answer in src/mcp/tools.js and src/mcp/dispatch.js"
  ]
};

export const ARMS = {
  // No-retrieval: the agent answers by reading source. The wiki is not offered.
  B: {
    id: "B",
    label: "no-retrieval (read source)",
    tools: ["read", "grep"],
    firstStep: "Answer by reading the SOURCE CODE only (grep for the terms, then read the matching files). Do NOT read docs/llm-wiki."
  },
  // Retrieval: the agent has the read-only wiki tools and queries the wiki first.
  B2: {
    id: "B2",
    label: "retrieval (query the wiki)",
    tools: ["search_docs", "get_doc", "get_related", "read", "grep"],
    firstStep: "Answer by QUERYING THE WIKI first: search_docs for the terms, then get_doc the most relevant matches. Only fall back to reading source if the wiki does not answer it."
  },
  // CONTROL for B2. Same tools, same firstStep — therefore a byte-identical prompt
  // (buildPrompt reads only `tools` and `firstStep`). The ONLY difference is the
  // wiki those tools query: point BENCH_WIKI_CWD at a stub wiki built by
  // bench/real/make-stub-wiki.mjs (same doc paths and titles, knowledge removed).
  //
  // What it decides: B2's token win could come from the wiki's KNOWLEDGE or merely
  // from having SEARCH TOOLING. If B2_empty lands near B2, the tooling explains the
  // win; if it lands near B (or worse), the enriched content does. Without this arm
  // no causal claim about the wiki is supportable.
  B2_empty: {
    id: "B2_empty",
    label: "retrieval control (tools over a stub wiki with no knowledge)",
    tools: ["search_docs", "get_doc", "get_related", "read", "grep"],
    firstStep: "Answer by QUERYING THE WIKI first: search_docs for the terms, then get_doc the most relevant matches. Only fall back to reading source if the wiki does not answer it."
  }
};

// The control is only valid while its prompt matches B2's exactly. Asserted at
// import time so a well-meaning edit to one arm cannot silently invalidate the run.
export function assertControlPromptParity() {
  const a = JSON.stringify(ARMS.B2.tools) === JSON.stringify(ARMS.B2_empty.tools);
  const b = ARMS.B2.firstStep === ARMS.B2_empty.firstStep;
  if (!a || !b) {
    throw new Error(
      "B2_empty must keep B2's tools and firstStep verbatim, otherwise the control " +
      "measures prompt differences instead of wiki content."
    );
  }
}
assertControlPromptParity();

export function loadTasks() {
  // Default: this repo's tasks (bench/tasks.json). Override with BENCH_TASKS to
  // run a different target's task set (e.g. bench/tasks-external-vue-app.json for
  // the anonymized external SPA protocol) — absolute path, or relative to bench/.
  const override = process.env.BENCH_TASKS;
  const isAbs = (p) => p.startsWith("/") || /^[A-Za-z]:[\\/]/.test(p);
  const path = override
    ? (isAbs(override) ? override : join(process.cwd(), override)) // relative to where you run the command
    : join(BENCH_ROOT, "tasks.json");
  const cfg = JSON.parse(readFileSync(path, "utf8"));
  return cfg.tasks;
}

// Symmetric prompt: identical task text for both arms; only the available tools
// and the first step differ (so a token delta reflects the mechanism, not phrasing).
export function buildPrompt(task, arm) {
  return [
    "You are a senior engineer answering a code-comprehension question about this repository.",
    "",
    `Question: ${task.question}`,
    "",
    `Approach: ${arm.firstStep}`,
    `Available tools: ${arm.tools.join(", ")}.`,
    "",
    "Give a precise answer that names the responsible file(s) and symbol(s) and explains the mechanism.",
    "Keep the answer focused; do not read more than you need."
  ].join("\n");
}

// Default AgentRunner: refuses to run. A real run must inject a driver that
// returns { answer, inputTokens, outputTokens, wallMs, toolCalls, openedPaths }.
export function stubAgentRunner() {
  return async () => {
    throw new Error(
      "No AgentRunner wired. This prototype never fabricates results. " +
      "Provide a real driver (see bench/REAL_LLM_METHODOLOGY.md §5) or use --dry to validate the harness."
    );
  };
}

// Default grader: returns an ungraded result (human/LLM-judge grades later, blind).
export function manualGrader() {
  return async (task) => ({ graded: false, keyClaims: RUBRICS[task.id] ?? [], score: null });
}

export async function runArm({ arm, repeats, agentRunner, grader, isoStamp }) {
  const tasks = loadTasks();
  const runner = agentRunner ?? stubAgentRunner();
  const grade = grader ?? manualGrader();
  const results = [];
  for (const task of tasks) {
    const prompt = buildPrompt(task, arm);
    const runs = [];
    for (let i = 0; i < repeats; i++) {
      const observed = await runner(prompt, { arm: arm.id, task, tools: arm.tools });
      const graded = await grade(task, observed);
      runs.push({ ...observed, grade: graded });
    }
    results.push({ id: task.id, question: task.question, groundTruth: task.groundTruth, prompt, runs });
  }
  return {
    schema: "llm-wiki-bench-real/1",
    executed: true,
    generatedAt: isoStamp,
    arm: arm.id,
    armLabel: arm.label,
    repeats,
    tasks: results
  };
}

// ---- CLI -----------------------------------------------------------------

function parse(argv) {
  const args = argv.slice(2);
  const opts = {
    dry: args.includes("--dry"),
    printPrompts: args.includes("--print-prompts"),
    arm: null,
    repeats: 1
  };
  const armIdx = args.indexOf("--arm");
  if (armIdx >= 0) opts.arm = args[armIdx + 1];
  const repIdx = args.indexOf("--repeats");
  if (repIdx >= 0) opts.repeats = Math.max(1, Number(args[repIdx + 1]) || 1);
  return opts;
}

function dryReport() {
  const tasks = loadTasks();
  const L = [];
  L.push("Real-LLM bench — DRY (no model call; harness validation only)");
  L.push("=".repeat(64));
  L.push(`tasks: ${tasks.length}   arms: ${Object.values(ARMS).map((a) => `${a.id} (${a.label})`).join(", ")}`);
  L.push("Design + honesty caveats: bench/REAL_LLM_METHODOLOGY.md");
  L.push("");
  for (const task of tasks) {
    L.push(`# ${task.id}`);
    L.push(`  ground-truth: ${task.groundTruth.join(", ")}`);
    L.push(`  rubric key-claims: ${(RUBRICS[task.id] ?? task.rubric ?? []).length}`);
    for (const arm of Object.values(ARMS)) {
      const p = buildPrompt(task, arm);
      L.push(`  [${arm.id}] tools=${arm.tools.join("/")}  prompt=${p.length} chars`);
    }
    const parity = buildPrompt(task, ARMS.B2) === buildPrompt(task, ARMS.B2_empty);
    L.push(`  control parity (B2 prompt == B2_empty prompt): ${parity ? "OK" : "BROKEN"}`);
    L.push("");
  }
  L.push("B2_empty is a CONTROL: identical prompt and tools to B2, pointed via");
  L.push("BENCH_WIKI_CWD at a stub wiki (bench/real/make-stub-wiki.mjs). It isolates");
  L.push("wiki KNOWLEDGE from retrieval TOOLING — run it before claiming either.");
  L.push("");
  L.push("Every task has a rubric; both arm prompts build. To run for real, wire an");
  L.push("AgentRunner (bench/REAL_LLM_METHODOLOGY.md §5). The default runner throws —");
  L.push("this harness never fabricates tokens or answers.");
  console.log(L.join("\n"));
}

// Print every (task, arm) prompt verbatim so a human driving a coding agent
// (Claude Code / Codex / Cursor) can paste them — see bench/real/DRIVER_RUNBOOK.md.
// Single source of truth: same buildPrompt/ARMS the executed run uses.
function printPrompts() {
  const tasks = loadTasks();
  const L = [];
  for (const task of tasks) {
    for (const arm of [ARMS.B, ARMS.B2]) {
      L.push(`===== TASK ${task.id} — ARM ${arm.id} (${arm.label}) =====`);
      L.push(`# ground-truth: ${task.groundTruth.join(", ")}`);
      L.push(`# run in a FRESH session; record input/output tokens, wall-clock, tool calls, opened files`);
      L.push("");
      L.push(buildPrompt(task, arm));
      L.push("");
    }
  }
  console.log(L.join("\n"));
}

function writeResult(summary) {
  const dir = join(BENCH_ROOT, "results");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `real-${summary.arm}-${summary.generatedAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(file, JSON.stringify(summary, null, 2) + "\n", "utf8");
  console.log(`wrote ${file}`);
}

async function main() {
  const opts = parse(process.argv);
  if (opts.printPrompts) {
    printPrompts();
    return;
  }
  if (opts.dry) {
    dryReport();
    return;
  }
  if (!opts.arm || !ARMS[opts.arm]) {
    console.error("Specify --arm B|B2|B2_empty (or --dry). See bench/REAL_LLM_METHODOLOGY.md.");
    process.exitCode = 3;
    return;
  }
  if (opts.arm === "B2_empty" && !process.env.BENCH_WIKI_CWD) {
    console.error(
      "B2_empty is the stub-wiki control: set BENCH_WIKI_CWD to a stub built by\n" +
      "bench/real/make-stub-wiki.mjs. Without it the arm would query the REAL wiki\n" +
      "and silently reproduce B2 instead of controlling for it."
    );
    process.exitCode = 3;
    return;
  }
  // A real run needs a wired AgentRunner. Import it lazily so --dry never requires it.
  let agentRunner = null;
  let grader = null;
  try {
    const mod = await import("./agent.js");
    agentRunner = mod.agentRunner ?? null;
    grader = mod.grader ?? null;
  } catch {
    // no agent.js — fall through to the stub, which throws with guidance.
  }
  const isoStamp = new Date().toISOString();
  const summary = await runArm({ arm: ARMS[opts.arm], repeats: opts.repeats, agentRunner, grader, isoStamp });
  writeResult(summary);
}

// Only run main() when invoked directly (allows importing the pure helpers).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}
