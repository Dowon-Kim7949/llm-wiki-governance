#!/usr/bin/env node
// Helper for the LLM-WIKI greenfield demo: a project whose wiki starts before its
// code. Every llm-wiki command in the walkthrough is the real CLI; this script only
// does what a person or an agent would do by hand — write the plan, write the
// code, link the two, change the code — so the steps behave the same on Windows,
// macOS and Linux. No model runs here: the plan the agent would draft with the
// printed handoff prompt is a prebuilt fixture (planning/), and the walkthrough
// says so where it uses it.
//
//   node scripts/demo.mjs walkthrough [--cli <path>] [--keep] [--full] [--quiet]
//       Runs the whole scenario in a temporary git repository and checks each
//       expected result. Exits 1 if any expectation fails.
//   node scripts/demo.mjs workspace <dir>
//       Creates <dir> as the empty starting repository (one commit, a README) so
//       you can run the steps by hand.
//   node scripts/demo.mjs plan | implement | link | enable-gate | change-source | update-requirement
//       The scenario's file edits, applied to the current directory.
//
// Plain Node.js (18.18+) with no dependencies; git must be on PATH. The app's own
// tests need Node 22.6+ (TypeScript type stripping); on older Node the walkthrough
// says it skipped them rather than reporting them as passed.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const demoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REVIEWER = "Demo Reviewer";
const WIKI = "docs/llm-wiki";
const REQ_001 = `${WIKI}/requirements/REQ-001-approval-before-agent-run.md`;
const REQ_002 = `${WIKI}/requirements/REQ-002-approval-audit-trail.md`;
const ADR_0001 = `${WIKI}/decisions/ADR-0001-approval-rule-in-a-domain-module.md`;
const PROFILE = `${WIKI}/project-profile.md`;
const OVERVIEW = `${WIKI}/requirements/00_overview.md`;
const RULE = "src/domain/approval.ts";
const RULE_TESTS = "tests/approval.test.ts";

function today() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function fail(message) {
  console.error(`demo: ${message}`);
  process.exit(1);
}

// Copy a fixture tree into `to`. Wiki fixtures get today's date, as an edit would.
function copyTree(from, to, written = [], base = to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue;
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyTree(source, target, written, base);
    } else {
      const text = fs.readFileSync(source, "utf8");
      fs.writeFileSync(target, entry.name.endsWith(".md") ? text.replace(/^last_updated: .*$/m, `last_updated: ${today()}`) : text, "utf8");
      written.push(path.relative(base, target).split(path.sep).join("/"));
    }
  }
  return written;
}

// Replace `from` with `to` exactly `count` times, or stop: a silent no-op would
// make the rest of the scenario meaningless.
function replaceExactly(text, from, to, count, file) {
  const found = text.split(from).length - 1;
  if (found !== count) fail(`${file}: expected ${count} occurrence(s) of "${from}", found ${found}`);
  return text.split(from).join(to);
}

function editFile(cwd, rel, edit) {
  const file = path.join(cwd, rel);
  if (!fs.existsSync(file)) fail(`${rel} not found in ${cwd}`);
  fs.writeFileSync(file, edit(fs.readFileSync(file, "utf8")), "utf8");
}

function requireWiki(cwd) {
  if (!fs.existsSync(path.join(cwd, WIKI, "requirements", "00_overview.md"))) {
    fail("docs/llm-wiki/requirements/00_overview.md not found; run `llm-wiki init --write --greenfield` first");
  }
}

// --- scenario edits --------------------------------------------------------

// What the agent writes from the owners' statements with the planning prompt.
function plan(cwd) {
  requireWiki(cwd);
  return copyTree(path.join(demoRoot, "planning"), path.join(cwd, WIKI)).map((rel) => `${WIKI}/${rel}`);
}

// The first implementation: the app, the domain rule, and its tests.
function implement(cwd) {
  return copyTree(path.join(demoRoot, "implementation"), cwd);
}

// The same planning documents with the implementation linked as evidence.
function link(cwd) {
  requireWiki(cwd);
  return copyTree(path.join(demoRoot, "linking"), path.join(cwd, WIKI)).map((rel) => `${WIKI}/${rel}`);
}

function enableGate(cwd) {
  const file = path.join(cwd, "llm-wiki.config.json");
  if (!fs.existsSync(file)) fail("llm-wiki.config.json not found; run `llm-wiki init --write --greenfield` first");
  const config = JSON.parse(fs.readFileSync(file, "utf8"));
  config.rules = { ...config.rules, "impact.source_changed": "error" };
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return fs.readFileSync(file, "utf8");
}

// A new rule: the developer who requested a task cannot approve it. Changes the
// body of approveTask and adds its test; the module header (lines 1-3) stays.
function changeSource(cwd) {
  editFile(cwd, RULE, (text) => replaceExactly(
    text,
    "    throw new Error(`${approver.name} (${approver.role}) is not allowed to approve tasks`);\n  }\n",
    "    throw new Error(`${approver.name} (${approver.role}) is not allowed to approve tasks`);\n  }\n  if (approver.name === task.requestedBy) {\n    throw new Error(`${approver.name} requested task ${task.id} and cannot approve it`);\n  }\n",
    1,
    RULE
  ));
  editFile(cwd, RULE_TESTS, (text) => `${text.trimEnd()}\n\ntest("AC-5: the developer who requested a task cannot approve it", () => {\n  const task = createTask("t2", "Update the changelog", "dev-lead");\n  assert.throws(() => approveTask(task, lead), /cannot approve it/);\n});\n`);
}

function updateRequirement(cwd) {
  editFile(cwd, REQ_001, (text) => {
    let next = replaceExactly(text, "- AC-4: An approved task can start an agent run.\n", "- AC-4: An approved task can start an agent run.\n- AC-5: The developer who requested a task cannot approve it.\n", 1, REQ_001);
    next = replaceExactly(next, "refuses an approver without an approver role (AC-3).", "refuses an approver without an approver role (AC-3) and the developer who requested the task (AC-5).", 1, REQ_001);
    next = replaceExactly(next, "one test per criterion, AC-1 to AC-4", "one test per criterion, AC-1 to AC-5", 1, REQ_001);
    // An edited document goes back to needs_review until someone reviews it again.
    next = replaceExactly(next, "status: verified", "status: needs_review", 1, REQ_001);
    next = replaceExactly(next, "  - verified\n", "  - needs-review\n", 1, REQ_001);
    next = next.replace(/^last_updated: .*$/m, `last_updated: ${today()}`);
    return `${next.trimEnd()}\n- ${today()}: the owners added AC-5 (no self-approval); \`approveTask\` and its test were changed with it.\n`;
  });
}

// --- workspace -------------------------------------------------------------

function git(cwd, args, extraConfig = []) {
  const result = spawnSync("git", [...extraConfig, ...args], { cwd, encoding: "utf8" });
  if (result.error) fail(`git is not available: ${result.error.message}`);
  if (result.status !== 0) fail(`git ${args.join(" ")} failed:\n${result.stderr}`);
  return result.stdout;
}

function createWorkspace(target, { identity } = {}) {
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) fail(`${target} exists and is not empty`);
  copyTree(path.join(demoRoot, "starter"), target);
  git(target, ["init", "-q"]);
  // The walkthrough's throwaway repository gets a fixed identity and no signing,
  // so it runs on a machine with neither configured. A workspace you keep uses
  // your own git settings.
  const config = identity
    ? ["-c", "user.name=LLM-WIKI Demo", "-c", "user.email=demo@example.invalid", "-c", "commit.gpgsign=false"]
    : [];
  git(target, ["add", "-A"]);
  git(target, ["commit", "-q", "-m", "An empty repository: a README and nothing else"], config);
  return config;
}

// --- walkthrough -----------------------------------------------------------

const EXCERPT_SECTIONS = new Set([
  "Summary",
  "Starting Point",
  "Handoff Prompt",
  "Needs Review (risk-ranked)",
  "Approved (-> verified)",
  "Documents to re-review",
  "Findings",
  "Matches"
]);

function excerpt(output) {
  const kept = [];
  let keep = true;
  for (const line of output.trimEnd().split("\n")) {
    if (line.startsWith("## ")) keep = EXCERPT_SECTIONS.has(line.slice(3).trim());
    if (keep || line.startsWith("# ")) kept.push(line);
  }
  return kept.join("\n");
}

// Display only: the command is run with an argument array, never through a shell.
const shellQuote = (arg) => (/[\s"\\]/.test(arg) ? `"${arg.replace(/[\\"]/g, "\\$&")}"` : arg);

// The CLI: --cli, else an installed llm-wiki-governance, else the checkout this
// demo lives in (examples/ sits next to bin/).
function resolveCli(explicit) {
  if (explicit) return path.resolve(explicit);
  try {
    const require = createRequire(path.join(demoRoot, "scripts", "demo.mjs"));
    return path.join(path.dirname(require.resolve("llm-wiki-governance/package.json")), "bin", "llm-wiki.js");
  } catch {
    const checkout = path.resolve(demoRoot, "..", "..", "bin", "llm-wiki.js");
    if (fs.existsSync(checkout)) return checkout;
  }
  fail("llm-wiki-governance not found; pass --cli <path to bin/llm-wiki.js>");
  return "";
}

// TypeScript type stripping arrived in Node 22.6. Below that the app tests cannot
// run without dependencies, and the walkthrough says it skipped them.
export function canRunAppTests(version = process.versions.node) {
  const [major, minor] = version.split(".").map(Number);
  return major > 22 || (major === 22 && minor >= 6);
}

function walkthrough(argv) {
  const cliIndex = argv.indexOf("--cli");
  const cli = resolveCli(cliIndex === -1 ? null : argv[cliIndex + 1]);
  const keep = argv.includes("--keep");
  const full = argv.includes("--full");
  const quiet = argv.includes("--quiet");
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "llm-wiki-greenfield-demo-"));
  const results = [];
  const say = (text) => {
    if (!quiet) console.log(text);
  };

  const record = (label, expectStatus, status, ok) => {
    results.push({ label, expected: `exit ${expectStatus}`, actual: `exit ${status}`, ok: ok && status === expectStatus });
  };
  // Run a command, show its real output, and record whether it met the expectation.
  const step = (label, args, expectStatus, check = () => true) => {
    say(`\n$ llm-wiki ${args.map(shellQuote).join(" ")}`);
    const run = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
    const output = `${run.stdout}${run.stderr}`;
    say(full ? output.trimEnd() : excerpt(output));
    say(`(exit ${run.status})`);
    record(label, expectStatus, run.status, check(output));
    return output;
  };
  const appTests = (label) => {
    if (!canRunAppTests()) {
      say(`\napp tests: skipped — Node ${process.versions.node} cannot strip TypeScript types (needs 22.6+). Not counted as passed.`);
      return;
    }
    const args = ["--experimental-strip-types", "--no-warnings", "--test", RULE_TESTS];
    say(`\n$ node ${args.join(" ")}`);
    const run = spawnSync(process.execPath, args, { cwd, encoding: "utf8" });
    const output = `${run.stdout}${run.stderr}`;
    const summary = output.split("\n").filter((line) => /^# (tests|pass|fail) /.test(line) || /^not ok/.test(line));
    say(full ? output.trimEnd() : summary.join("\n"));
    say(`(exit ${run.status})`);
    record(label, 0, run.status, true);
  };
  const section = (title) => say(`\n## ${title}`);
  const firstMatch = (output) => output.split("\n").find((line) => line.startsWith(`- ${WIKI}/`)) ?? "";

  const identity = createWorkspace(cwd, { identity: true });
  const commit = (message) => {
    git(cwd, ["add", "-A"]);
    git(cwd, ["commit", "-q", "-m", message], identity);
    say(`\n$ git commit -m "${message}"`);
  };
  say(`Workspace: ${cwd}`);
  say(`CLI: ${cli}`);

  section("Step 1 - Start from an empty repository");
  say("README.md is the only file. There is no code, no manifest, and nothing to cite as evidence.");

  section("Step 2 - Initialize the wiki for a new project");
  step("init --write --greenfield", ["init", "--write", "--greenfield"], 0, (out) =>
    out.includes("No manifest exists yet") && fs.existsSync(path.join(cwd, OVERVIEW)));
  step("handoff --greenfield prints the planning prompt", ["handoff", "--greenfield", "--agent", "claude"], 0, (out) =>
    out.includes("Do not invent a requirement") && out.includes("Cite no source that does not exist"));
  step("validate --strict (no fabricated source)", ["validate", "--strict"], 0);

  section("Step 3 - Record the plan and approve it");
  say("In a real project you tell your agent what the project is for and it drafts these documents with the prompt above.");
  say("No model runs in this walkthrough, so it copies a prebuilt plan (examples/greenfield-vue-demo/planning/):");
  for (const written of plan(cwd)) say(`wrote ${written}`);
  step("validate --strict on the recorded plan", ["validate", "--strict"], 0);
  say("\nThe next step stands in for the project owners reading the plan; --reviewer names who approved it.");
  step("review --approve the plan", ["review", "--approve", PROFILE, "--approve", OVERVIEW, "--approve", REQ_001, "--approve", REQ_002, "--approve", ADR_0001, "--reviewer", REVIEWER], 0, (out) => /approved: 5\b/.test(out));
  step("validate: an approved plan is info, not a defect", ["validate", "--strict"], 0, (out) =>
    out.includes(`evidence.planned_unlinked ${REQ_001}`) && !out.includes("[warning]"));
  step("stats: three plans approved, nothing linked", ["stats"], 0, (out) =>
    out.includes("planned_knowledge: 3 (approved 3); implementation evidence linked 0, unresolved 0, none 3"));
  commit("docs: the approved plan");

  section("Step 4 - Implement REQ-001");
  say("Your agent would now run 'llm-wiki prompt --task feature' for REQ-001. The walkthrough copies the result (examples/greenfield-vue-demo/implementation/):");
  for (const written of implement(cwd)) say(`wrote ${written}`);
  appTests("app tests: REQ-001 acceptance criteria");
  commit("feat: approval before agent run (REQ-001)");

  section("Step 5 - Link the implementation to the plan");
  for (const written of link(cwd)) say(`wrote ${written}`);
  step("validate --strict: the linked references resolve", ["validate", "--strict"], 0);
  step("review --approve the linked documents", ["review", "--approve", REQ_001, "--approve", ADR_0001, "--approve", PROFILE, "--reviewer", REVIEWER], 0, (out) => /approved: 3\b/.test(out));
  step("stats: two plans linked, the deferred one is not", ["stats"], 0, (out) =>
    out.includes("planned_knowledge: 3 (approved 3); implementation evidence linked 2, unresolved 0, none 1"));
  step("search-docs finds the requirement", ["search-docs", "approver role agent run"], 0, (out) => firstMatch(out).startsWith(`- ${REQ_001}`));
  say("\nTurn on the gate this demo is about (llm-wiki.config.json; 'llm-wiki mode set standard --write' turns it on as a warning):");
  say(enableGate(cwd).trimEnd());
  commit("docs: link REQ-001 and ADR-0001 to their implementation");
  step("impact on a clean baseline", ["impact", "--since", "HEAD"], 0);

  section("Step 6 - Change the implementation");
  changeSource(cwd);
  say(`edited ${RULE}: approveTask now refuses the task's own requester (the header, lines 1-3, is unchanged)`);
  say(`edited ${RULE_TESTS}: added a test for the new rule`);
  appTests("app tests after the change");
  step("impact flags the requirement whose code changed", ["impact", "--since", "HEAD"], 1, (out) =>
    out.includes(`impact.source_changed ${REQ_001}`)
    && !out.includes(`impact.source_changed ${ADR_0001}`)
    && !out.includes(`impact.source_changed ${REQ_002}`));

  section("Step 7 - Update the requirement and review it again");
  updateRequirement(cwd);
  say(`edited ${REQ_001}: added AC-5, updated the evidence notes, status back to needs_review`);
  step("validate --strict after the edit", ["validate", "--strict"], 0);
  step("review --approve the updated requirement", ["review", "--approve", REQ_001, "--reviewer", REVIEWER], 0, (out) => /approved: 1\b/.test(out));
  step("impact passes once the requirement moves with the code", ["impact", "--since", "HEAD"], 0);
  commit("feat: a requester cannot approve their own task (REQ-001 AC-5)");
  step("impact for that commit, as CI on a push sees it", ["impact", "--since", "HEAD~1"], 0);

  section("Step 8 - Final state");
  step("validate --strict: clean; the deferred plan stays unlinked", ["validate", "--strict"], 0, (out) =>
    out.includes(`evidence.planned_unlinked ${REQ_002}`) && !out.includes(`evidence.planned_unlinked ${REQ_001}`));

  console.log("\n## Result");
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label.padEnd(64)} expected ${result.expected}, got ${result.actual}`);
  }
  const failed = results.filter((result) => !result.ok).length;
  if (keep) console.log(`\nWorkspace kept at ${cwd}`);
  else fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 5 });
  console.log(failed === 0 ? `\nAll ${results.length} checks passed.` : `\n${failed} of ${results.length} checks failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

// --- entry -----------------------------------------------------------------

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [command, ...rest] = process.argv.slice(2);
  const here = process.cwd();
  const report = (written) => {
    for (const rel of written) console.log(`wrote ${rel}`);
  };
  switch (command) {
    case "walkthrough":
      walkthrough(rest);
      break;
    case "workspace": {
      if (!rest[0]) fail("usage: demo.mjs workspace <dir>");
      const target = path.resolve(rest[0]);
      // A workspace inside another repository (this one, say) would be a nested
      // repository in that checkout. impact runs from the repository root, so the
      // demo gets a repository of its own.
      let existing = target;
      while (!fs.existsSync(existing)) existing = path.dirname(existing);
      const inside = spawnSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: existing, encoding: "utf8" });
      if (inside.stdout.trim() === "true") fail(`${target} is inside an existing git repository; choose a folder outside it, such as ~/greenfield-wiki-demo`);
      createWorkspace(target);
      console.log(`Created ${target} with one commit (a README and nothing else).`);
      console.log("Next: cd into it and follow the README from Step 2.");
      break;
    }
    case "plan":
      report(plan(here));
      break;
    case "implement":
      report(implement(here));
      break;
    case "link":
      report(link(here));
      break;
    case "enable-gate":
      console.log(enableGate(here).trimEnd());
      break;
    case "change-source":
      changeSource(here);
      console.log(`${RULE}: approveTask refuses the task's own requester; ${RULE_TESTS}: test added`);
      break;
    case "update-requirement":
      updateRequirement(here);
      console.log(`${REQ_001}: AC-5 added, evidence notes updated, status needs_review`);
      break;
    default:
      fail("usage: demo.mjs walkthrough|workspace <dir>|plan|implement|link|enable-gate|change-source|update-requirement");
  }
}
