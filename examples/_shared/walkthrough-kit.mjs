// Shared harness for the stack walkthroughs (examples/python-fastapi-brownfield,
// examples/react-node-fullstack). Each walkthrough copies a small application into
// a temporary git repository, runs the real llm-wiki CLI against it, and checks the
// result of every step. Nothing here runs a model or the application itself.
//
// Plain Node.js (18.18+) with no dependencies; git must be on PATH.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

export function fail(message) {
  console.error(`walkthrough: ${message}`);
  process.exit(1);
}

export function copyTree(from, to, written = [], base = to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "__pycache__") continue;
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(source, target, written, base);
    else {
      fs.copyFileSync(source, target);
      written.push(path.relative(base, target).split(path.sep).join("/"));
    }
  }
  return written;
}

// Replace `from` with `to` exactly `count` times, or stop: a silent no-op would make
// the rest of the scenario meaningless.
export function editFile(cwd, rel, from, to, count = 1) {
  const file = path.join(cwd, ...rel.split("/"));
  if (!fs.existsSync(file)) fail(`${rel} not found in ${cwd}`);
  const text = fs.readFileSync(file, "utf8");
  const found = text.split(from).length - 1;
  if (found !== count) fail(`${rel}: expected ${count} occurrence(s) of ${JSON.stringify(from)}, found ${found}`);
  fs.writeFileSync(file, text.split(from).join(to), "utf8");
}

// The CLI: --cli, else an installed llm-wiki-governance, else the checkout the
// walkthrough lives in (examples/ sits next to bin/).
export function resolveCli(argv, scriptPath) {
  const index = argv.indexOf("--cli");
  if (index !== -1 && argv[index + 1]) return path.resolve(argv[index + 1]);
  try {
    const require = createRequire(scriptPath);
    return path.join(path.dirname(require.resolve("llm-wiki-governance/package.json")), "bin", "llm-wiki.js");
  } catch {
    const checkout = path.resolve(path.dirname(scriptPath), "..", "..", "..", "bin", "llm-wiki.js");
    if (fs.existsSync(checkout)) return checkout;
  }
  fail("llm-wiki-governance not found; pass --cli <path to bin/llm-wiki.js>");
  return "";
}

// A throwaway repository with a fixed identity and no signing, so the walkthrough
// runs on a machine with neither configured.
const IDENTITY = ["-c", "user.name=LLM-WIKI Walkthrough", "-c", "user.email=walkthrough@example.invalid", "-c", "commit.gpgsign=false", "-c", "core.autocrlf=false"];

export function createSession(argv, scriptPath, prefix) {
  const cli = resolveCli(argv, scriptPath);
  const quiet = argv.includes("--quiet");
  const keep = argv.includes("--keep");
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const results = [];
  const say = (text) => {
    if (!quiet) console.log(text);
  };
  const git = (args, env = {}) => {
    const run = spawnSync("git", [...IDENTITY, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
    if (run.error) fail(`git is not available: ${run.error.message}`);
    if (run.status !== 0) fail(`git ${args.join(" ")} failed:\n${run.stderr}`);
    return run.stdout;
  };
  const commit = (message, env = {}) => {
    git(["add", "-A"]);
    git(["commit", "-q", "-m", message], env);
    say(`\n$ git commit -m "${message}"`);
  };
  // Run the CLI, show its output, and record whether it met the expectation.
  const step = (label, args, expectStatus, check = () => true) => {
    say(`\n$ llm-wiki ${args.join(" ")}`);
    const run = spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8" });
    const output = `${run.stdout}${run.stderr}`;
    say(output.trimEnd());
    say(`(exit ${run.status})`);
    let ok = run.status === expectStatus;
    try {
      ok = ok && Boolean(check(output));
    } catch {
      ok = false;
    }
    results.push({ label, expected: `exit ${expectStatus}`, actual: `exit ${run.status}`, ok });
    return output;
  };
  // A check that is not a CLI exit code (a file the CLI wrote, say).
  const expect = (label, ok) => results.push({ label, expected: "true", actual: String(Boolean(ok)), ok: Boolean(ok) });
  const section = (title) => say(`\n## ${title}`);
  const finish = () => {
    console.log("\n## Result");
    for (const result of results) {
      console.log(`${result.ok ? "PASS" : "FAIL"}  ${result.label.padEnd(66)} expected ${result.expected}, got ${result.actual}`);
    }
    const failed = results.filter((result) => !result.ok).length;
    if (keep) console.log(`\nWorkspace kept at ${cwd}`);
    else fs.rmSync(cwd, { recursive: true, force: true, maxRetries: 5 });
    console.log(failed === 0 ? `\nAll ${results.length} checks passed.` : `\n${failed} of ${results.length} checks failed.`);
    process.exit(failed === 0 ? 0 : 1);
  };
  git(["init", "-q"]);
  git(["checkout", "-q", "-b", "main"]);
  say(`Workspace: ${cwd}`);
  say(`CLI: ${cli}`);
  return { cli, cwd, say, git, commit, step, expect, section, finish };
}

export const read = (cwd, rel) => fs.readFileSync(path.join(cwd, ...rel.split("/")), "utf8");
export const exists = (cwd, rel) => fs.existsSync(path.join(cwd, ...rel.split("/")));
export const json = (output) => JSON.parse(output.replace(/^﻿/, ""));

// `git commit` dated the next day, to show what the date-anchored drift sees once a
// day has passed. Committer date is what `git log --since` reads.
export function nextDay() {
  const date = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
  return { GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date };
}
