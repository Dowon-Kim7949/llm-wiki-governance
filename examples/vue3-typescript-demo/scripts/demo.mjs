#!/usr/bin/env node
// Helper for the LLM-WIKI Vue 3 demo. Every llm-wiki command in the walkthrough is
// the real CLI; this script only does the file edits a person or an agent would
// make by hand, so the steps behave the same on Windows, macOS and Linux.
//
//   node scripts/demo.mjs walkthrough [--cli <path>] [--keep] [--full] [--quiet]
//       Runs the whole scenario in a temporary git repository and checks each
//       expected result. Exits 1 if any expectation fails. Each command's output
//       is shown in excerpt (its summary, approvals and findings); --full shows
//       all of it, --quiet only the final result table.
//   node scripts/demo.mjs workspace <dir>
//       Copies this demo to <dir> as a standalone git repository (first commit
//       included) so you can run the steps by hand.
//   node scripts/demo.mjs enable-gate | enrich | change-source | update-doc
//       The scenario's file edits, applied to the current directory.
//
// Plain Node.js (18.18+) with no dependencies; git must be on PATH.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const demoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COPY_SKIP = new Set(["node_modules", "dist", ".git", "docs", "llm-wiki.config.json"]);
const REVIEWER = "Demo Reviewer";
const DOMAIN_DOC = "docs/llm-wiki/DOMAIN_FEATURES.md";
const ARCHITECTURE_DOC = "docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md";
const STORE = "src/stores/tasks.ts";

function today() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function fail(message) {
  console.error(`demo: ${message}`);
  process.exit(1);
}

function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (COPY_SKIP.has(entry.name)) continue;
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(source, target);
    else fs.copyFileSync(source, target);
  }
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

// --- scenario edits --------------------------------------------------------

function enableGate(cwd) {
  const file = path.join(cwd, "llm-wiki.config.json");
  if (!fs.existsSync(file)) fail("llm-wiki.config.json not found; run `llm-wiki init --write` first");
  const config = JSON.parse(fs.readFileSync(file, "utf8"));
  config.rules = { ...config.rules, "impact.source_changed": "error" };
  fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return fs.readFileSync(file, "utf8");
}

function enrich(cwd) {
  const wiki = path.join(cwd, "docs", "llm-wiki");
  if (!fs.existsSync(wiki)) fail("docs/llm-wiki not found; run `llm-wiki init --write` first");
  const written = [];
  for (const name of fs.readdirSync(path.join(demoRoot, "enrichment"))) {
    const text = fs.readFileSync(path.join(demoRoot, "enrichment", name), "utf8");
    fs.writeFileSync(path.join(wiki, name), text.replace(/^last_updated: .*$/m, `last_updated: ${today()}`), "utf8");
    written.push(`docs/llm-wiki/${name}`);
  }
  return written;
}

function changeSource(cwd) {
  editFile(cwd, STORE, (text) => replaceExactly(text, "export const MAX_TITLE_LENGTH = 80", "export const MAX_TITLE_LENGTH = 120", 1, STORE));
}

function updateDoc(cwd) {
  editFile(cwd, DOMAIN_DOC, (text) => {
    let next = replaceExactly(text, "80 characters", "120 characters", 2, DOMAIN_DOC);
    next = replaceExactly(next, "the 80-character title limit", "the 120-character title limit", 1, DOMAIN_DOC);
    // An edited document goes back to needs_review until someone reviews it again.
    next = replaceExactly(next, "status: verified", "status: needs_review", 1, DOMAIN_DOC);
    next = replaceExactly(next, "  - verified\n", "  - needs-review\n", 1, DOMAIN_DOC);
    next = next.replace(/^last_updated: .*$/m, `last_updated: ${today()}`);
    return `${next.trimEnd()}\n- ${today()} — The title limit was raised from 80 to 120 characters (\`MAX_TITLE_LENGTH\`); the rule text above was updated to match.\n`;
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
  copyTree(demoRoot, target);
  git(target, ["init", "-q"]);
  // The walkthrough's throwaway repository gets a fixed identity and no signing,
  // so it runs on a machine with neither configured. A workspace you keep uses
  // your own git settings.
  const config = identity
    ? ["-c", "user.name=LLM-WIKI Demo", "-c", "user.email=demo@example.invalid", "-c", "commit.gpgsign=false"]
    : [];
  git(target, ["add", "-A"]);
  git(target, ["commit", "-q", "-m", "Vue app before LLM-WIKI"], config);
  return config;
}

// --- walkthrough -----------------------------------------------------------

// The report sections worth reading in a demo; the rest (graph statistics, caveats)
// is still in the real output and printed with --full.
const EXCERPT_SECTIONS = new Set([
  "Summary",
  "Created",
  "Needs Review (risk-ranked)",
  "Approved (-> verified)",
  "Documents to re-review",
  "Findings",
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

const shellQuote = (arg) => (/[\s"]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);

function resolveCli(explicit) {
  if (explicit) return path.resolve(explicit);
  try {
    const require = createRequire(path.join(demoRoot, "package.json"));
    return path.join(path.dirname(require.resolve("llm-wiki-governance/package.json")), "bin", "llm-wiki.js");
  } catch {
    fail("llm-wiki-governance is not installed here; run `npm install` first (or pass --cli <path to bin/llm-wiki.js>)");
  }
  return "";
}

function walkthrough(argv) {
  const cliIndex = argv.indexOf("--cli");
  const cli = resolveCli(cliIndex === -1 ? null : argv[cliIndex + 1]);
  const keep = argv.includes("--keep");
  const full = argv.includes("--full");
  const quiet = argv.includes("--quiet");
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "llm-wiki-vue3-demo-"));
  const results = [];
  const say = (text) => {
    if (!quiet) console.log(text);
  };

  const llmWiki = (args) => {
    const run = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
    return { status: run.status, output: `${run.stdout}${run.stderr}` };
  };
  // Run a command, show its real output, and record whether it met the expectation.
  const step = (label, args, expectStatus, check = () => true) => {
    say(`\n$ llm-wiki ${args.map(shellQuote).join(" ")}`);
    const { status, output } = llmWiki(args);
    say(full ? output.trimEnd() : excerpt(output));
    say(`(exit ${status})`);
    const ok = status === expectStatus && check(output);
    results.push({ label, expected: `exit ${expectStatus}`, actual: `exit ${status}`, ok });
    return output;
  };
  const section = (title) => say(`\n## ${title}`);

  const identity = createWorkspace(cwd, { identity: true });
  const commit = (message) => {
    git(cwd, ["add", "-A"]);
    git(cwd, ["commit", "-q", "-m", message], identity);
  };
  say(`Workspace: ${cwd}`);
  say(`CLI: ${cli}`);

  section("Step 1 - Initialize: create the wiki scaffold");
  step("init --write", ["init", "--write"], 0, () => fs.existsSync(path.join(cwd, "docs", "llm-wiki", "index.md")));
  step("validate (lite mode accepts scaffolds)", ["validate"], 0);
  say("\nTurn on the one gate this demo is about (llm-wiki.config.json):");
  say(enableGate(cwd).trimEnd());

  section("Step 2 - Create project knowledge from the Vue source");
  for (const written of enrich(cwd)) say(`wrote ${written}`);

  section("Step 3 - Validate, review, and record a baseline");
  step("validate --strict", ["validate", "--strict"], 0);
  step("review (read-only backlog)", ["review"], 0, (out) => out.includes(DOMAIN_DOC));
  step("review --approve", ["review", "--approve", ARCHITECTURE_DOC, "--approve", DOMAIN_DOC, "--reviewer", REVIEWER], 0, (out) => /approved: 2\b/.test(out));
  commit("docs: LLM-WIKI baseline");
  say("\n$ git commit -m \"docs: LLM-WIKI baseline\"");
  step("impact on a clean baseline", ["impact", "--since", "HEAD"], 0);

  section("Step 4 - Change source code");
  changeSource(cwd);
  say(`edited ${STORE}: MAX_TITLE_LENGTH 80 -> 120 (the document still says 80)`);

  section("Step 5 - Detect documentation impact");
  step("impact detects the stale document", ["impact", "--since", "HEAD"], 1, (out) =>
    out.includes(`impact.source_changed ${DOMAIN_DOC}`) && !out.includes(`impact.source_changed ${ARCHITECTURE_DOC}`));

  section("Step 6 - Update the document, validate, and review it again");
  updateDoc(cwd);
  say(`edited ${DOMAIN_DOC}: rule text 80 -> 120, status back to needs_review, review note added`);
  step("validate --strict after the edit", ["validate", "--strict"], 0);
  step("review --approve the updated document", ["review", "--approve", DOMAIN_DOC, "--reviewer", REVIEWER], 0, (out) => /approved: 1\b/.test(out));

  section("Step 7 - Confirm recovery");
  step("impact passes once the document moves with the code", ["impact", "--since", "HEAD"], 0);
  commit("feat: allow 120-character task titles");
  say("\n$ git commit -m \"feat: allow 120-character task titles\"");
  step("impact for that commit, as CI on a push sees it", ["impact", "--since", "HEAD~1"], 0);

  console.log("\n## Result");
  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label.padEnd(52)} expected ${result.expected}, got ${result.actual}`);
  }
  const failed = results.filter((result) => !result.ok).length;
  if (keep) console.log(`\nWorkspace kept at ${cwd}`);
  else fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 5 });
  console.log(failed === 0 ? `\nAll ${results.length} checks passed.` : `\n${failed} of ${results.length} checks failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

// --- entry -----------------------------------------------------------------

const [command, ...rest] = process.argv.slice(2);
const here = process.cwd();
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
    if (inside.stdout.trim() === "true") fail(`${target} is inside an existing git repository; choose a folder outside it, such as ~/vue3-wiki-demo`);
    createWorkspace(target);
    console.log(`Created ${target} with one commit ("Vue app before LLM-WIKI").`);
    console.log("Next: cd into it, run `npm install`, then follow the README from Step 1.");
    break;
  }
  case "enable-gate":
    console.log(enableGate(here).trimEnd());
    break;
  case "enrich":
    for (const written of enrich(here)) console.log(`wrote ${written}`);
    break;
  case "change-source":
    changeSource(here);
    console.log(`${STORE}: MAX_TITLE_LENGTH 80 -> 120`);
    break;
  case "update-doc":
    updateDoc(here);
    console.log(`${DOMAIN_DOC}: rule text 80 -> 120, status needs_review, review note added`);
    break;
  default:
    fail("usage: demo.mjs walkthrough|workspace <dir>|enable-gate|enrich|change-source|update-doc");
}
