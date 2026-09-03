// Phase 0 defect batch (2026-07-31), from HARNESS_GOVERNANCE_ROADMAP A-6 and the
// "지금 해야 함" backlog. Every case here was reproduced against the shipped code
// before the fix; each test names the defect it pins so a regression is legible.
//
// The batch shares one theme: the tool can SEE more than it can SAY. Detection
// exists, but the surfaces that would let a human or CI act on it are either
// mislabelled (drift always "pass"), unreachable (`explain --cwd` exits 3), or
// quietly pointed at the wrong input (check-run's lexicographic "latest").
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parseArgs, main, helpText } from "../src/cli.js";
import { normalizeOptions } from "../src/index.js";
import { driftCommand, fixCommand, impactCommand, checkRunCommand, reviewCommand } from "../src/commands.js";
import { SUPPORTED_TASK_PROMPTS } from "../src/task-prompts.js";
import { changedFiles } from "../src/git.js";
import { RULE_PRESETS, FINDING_EXPLANATIONS } from "../src/commands/findings.js";

const execFileAsync = promisify(execFile);

// A verified document whose evidence anchor is older than the source file it
// cites, which is what scanEvidenceDrift keys on.
function verifiedDoc({ reviewedAt = "2020-01-01", sourceFile = "src/app.js" } = {}) {
  return `---
title: Index
tags:
  - llm-wiki
  - verified
status: verified
doc_type: index
project: fixture
last_updated: ${reviewedAt}
author: cli-generated
last_edited_by: cli
reviewed_by: Fixture Human
reviewed_at: ${reviewedAt}
wiki_block_version: v1
source_files:
  - ${sourceFile}
evidence:
  - ${sourceFile}#L1
related:
  - docs/llm-wiki/index.md
visibility: internal
contains_sensitive_info: false
---

# Index

A verified fixture document whose cited source changed after its review date, so
evidence.stale fires. The body is long enough to clear the thin-body lint and to
read as genuinely enriched prose rather than an untouched scaffold.

## Evidence

- ${sourceFile}#L1
`;
}

// A git repo is required for the drift/impact paths: both resolve staleness from
// git history rather than filesystem mtimes.
async function makeGitWiki({ doc = verifiedDoc(), sourceFile = "src/app.js" } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-phase0-"));
  const wiki = path.join(cwd, "docs", "llm-wiki");
  await mkdir(wiki, { recursive: true });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  await writeFile(path.join(cwd, sourceFile), "export const a = 1;\n", "utf8");
  await writeFile(path.join(wiki, "index.md"), doc, "utf8");

  const git = (...args) => execFileAsync("git", ["-C", cwd, ...args]);
  await git("init", "-q");
  await git("config", "user.email", "fixture@example.com");
  await git("config", "user.name", "Fixture");
  await git("add", ".");
  await git("commit", "-q", "-m", "initial");
  return { cwd, git, wiki, sourceFile };
}

// --- A-6 #3: prompt --task list -------------------------------------------

// `help prompt` is only reachable through main(), so capture stdout the way the
// monorepo contract test does.
async function captureHelp(topic) {
  const lines = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  console.log = (...args) => lines.push(args.join(" "));
  console.error = (...args) => lines.push(args.join(" "));
  try {
    await main(["help", topic]);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode;
  }
  return lines.join("\n");
}

test("prompt --task help lists every supported task, not a hand-copied subset", async () => {
  const expected = [...SUPPORTED_TASK_PROMPTS];
  assert.equal(expected.length, 8, "guard: the supported set is the source of truth");

  for (const topic of [helpText(), await captureHelp("prompt")]) {
    const line = topic.split("\n").find((entry) => entry.includes("llm-wiki prompt --task"));
    assert.ok(line, "help must document prompt --task");
    for (const task of expected) {
      assert.ok(
        line.includes(task),
        `help omits the supported task "${task}"; it drifted from SUPPORTED_TASK_PROMPTS`
      );
    }
  }
});

test("the prompt.unsupported_task explanation lists every supported task", () => {
  const explanation = FINDING_EXPLANATIONS["prompt.unsupported_task"];
  const text = explanation.remediation.join(" ");
  for (const task of [...SUPPORTED_TASK_PROMPTS]) {
    assert.ok(text.includes(task), `explain omits the supported task "${task}"`);
  }
});

// --- A-6 #4: explain --cwd -------------------------------------------------

test("explain accepts --cwd, which selects the config that supplies its language", () => {
  const { errors } = parseArgs(["explain", "evidence.stale", "--cwd", "."]);
  assert.deepEqual(errors, [], "explain --cwd must not be a usage error");
});

test("explain --cwd really does change the output, so the whitelist is earned", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-explain-"));
  await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify({ lang: "ko" }), "utf8");

  const lines = [];
  const originalLog = console.log;
  const originalExitCode = process.exitCode;
  console.log = (...args) => lines.push(args.join(" "));
  try {
    const code = await main(["explain", "evidence.stale", "--cwd", cwd]);
    assert.equal(code, 0);
  } finally {
    console.log = originalLog;
    process.exitCode = originalExitCode;
  }
  // config `lang: ko` reaches explain only via --cwd; without the option the
  // command could never be pointed at another project's config.
  assert.match(lines.join("\n"), /[가-힣]/, "config lang: ko must localize explain prose");
});

// --- A-6 #5: fix --write must not touch the append-only log ---------------

test("fix --write refuses to rewrite the append-only log", async () => {
  const { cwd } = await makeGitWiki();
  // log.md carries wiki frontmatter, so it is a candidate for the same mechanical
  // remediation that fixes every other document.
  const logPath = path.join(cwd, "docs", "llm-wiki", "log.md");
  const log = `---
title: LLM-WIKI Change Log
tags:
  - llm-wiki
status: needs_review
doc_type: change_log
project: fixture
last_updated: 2020-01-01
author: cli-generated
wiki_block_version: v1
source_files:
  - package.json
evidence:
related:
  - docs/llm-wiki/missing-doc.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Change Log

Append-only. Existing entries must never be edited.
`;
  await writeFile(logPath, log, "utf8");

  const before = await readFile(logPath, "utf8");
  await fixCommand(normalizeOptions({ cwd, write: true }));
  const after = await readFile(logPath, "utf8");

  assert.equal(after, before, "fix --write must leave the append-only log byte-identical");
});

test("fix reports the log as skipped rather than silently planning an edit", async () => {
  const { cwd } = await makeGitWiki();
  const logPath = path.join(cwd, "docs", "llm-wiki", "log.md");
  await writeFile(logPath, `---
title: LLM-WIKI Change Log
tags:
  - llm-wiki
status: needs_review
doc_type: change_log
project: fixture
last_updated: 2020-01-01
author: cli-generated
wiki_block_version: v1
source_files:
  - package.json
evidence:
related:
  - docs/llm-wiki/missing-doc.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Change Log
`, "utf8");

  const result = await fixCommand(normalizeOptions({ cwd }));
  const mentionsLog = (entries) => (entries ?? []).some((entry) => String(entry).includes("log.md"));
  assert.ok(!mentionsLog(result.planned), "the log must never appear in the fix plan");
  assert.ok(mentionsLog(result.skipped), "the log must be reported as deliberately skipped");
});

// --- A-6 #6: review --approve on a warning-only scaffold -------------------

test("review --approve refuses a document that is only a scaffold", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-review-"));
  const wiki = path.join(cwd, "docs", "llm-wiki");
  await mkdir(wiki, { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");
  // A never-enriched scaffold: content.not_enriched is a *warning*, so the old
  // guard (which refused only blocked/error) promoted it to verified.
  await writeFile(path.join(wiki, "index.md"), `---
title: Index
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: index
project: fixture
last_updated: 2026-07-31
author: cli-generated
last_edited_by: cli
wiki_block_version: v1
source_files:
  - package.json
evidence:
related:
visibility: internal
contains_sensitive_info: false
---

# Index

Concise summary: describe what this project is and who uses it.

## Evidence

Add file paths, symbols, routes, commands, or test names inspected while writing this.
`, "utf8");

  const result = await reviewCommand(normalizeOptions({
    cwd,
    approve: ["docs/llm-wiki/index.md"],
    reviewer: "Fixture Human"
  }));

  const content = await readFile(path.join(wiki, "index.md"), "utf8");
  assert.match(content, /status: needs_review/, "an unenriched scaffold must not become verified");
  assert.ok(
    (result.findings ?? []).some((finding) => finding.rule === "review.not_enriched"),
    `review must say why it refused; got ${JSON.stringify(result.findings)}`
  );
});

// --- A-6 #8: check-run picks the newest manifest --------------------------

test("check-run inspects the newest manifest, not the last one alphabetically", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-checkrun-"));
  const runs = path.join(cwd, ".llm-wiki", "runs");
  await mkdir(runs, { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");

  // "fix" sorts after "feature", so the OLDER fix manifest wins a filename sort
  // even though the feature manifest carries the later timestamp.
  await writeFile(path.join(runs, "run-fix-2026-07-01T00-00-00.json"), JSON.stringify({
    task: "fix", timestamp: "2026-07-01T00:00:00Z",
    changedSource: [], touchedDocs: [], logAppended: true,
    validated: { command: "validate", result: "pass" }
  }), "utf8");
  await writeFile(path.join(runs, "run-feature-2026-07-30T00-00-00.json"), JSON.stringify({
    task: "feature", timestamp: "2026-07-30T00:00:00Z",
    changedSource: [], touchedDocs: [], logAppended: true,
    validated: { command: "validate", result: "pass" }
  }), "utf8");

  const result = await checkRunCommand(normalizeOptions({ cwd }));
  assert.match(
    String(result.manifest ?? ""),
    /run-feature-2026-07-30/,
    `check-run must select the newest manifest; selected ${result.manifest}`
  );
});

test("check-run falls back to mtime when a manifest omits its timestamp", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-checkrun-mtime-"));
  const runs = path.join(cwd, ".llm-wiki", "runs");
  await mkdir(runs, { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "fixture", version: "0.0.0" }), "utf8");

  // Real manifests in this repo are not uniformly named and some carry no
  // parseable timestamp, so the fallback has to be exercised, not assumed.
  const body = { changedSource: [], touchedDocs: [], logAppended: true, validated: { command: "validate", result: "pass" } };
  await writeFile(path.join(runs, "run-fix-legacy.json"), JSON.stringify({ task: "fix", ...body }), "utf8");
  await new Promise((resolve) => setTimeout(resolve, 20));
  await writeFile(path.join(runs, "run-docs-sync-legacy.json"), JSON.stringify({ task: "docs-sync", ...body }), "utf8");

  const result = await checkRunCommand(normalizeOptions({ cwd }));
  // "docs-sync" sorts BEFORE "fix", so a filename sort could never pick it.
  assert.match(String(result.manifest ?? ""), /run-docs-sync-legacy/);
});

// --- A-6 #9: drift must be able to fail CI --------------------------------

test("drift accepts --strict", () => {
  const { errors } = parseArgs(["drift", "--strict"]);
  assert.deepEqual(errors, [], "drift --strict must not be a usage error");
});

test("drift surfaces stale evidence as findings so a gate can see it", async () => {
  const { cwd, git, sourceFile } = await makeGitWiki();
  await writeFile(path.join(cwd, sourceFile), "export const a = 2;\n", "utf8");
  await git("add", ".");
  await git("commit", "-q", "-m", "change source after review");

  const result = await driftCommand(normalizeOptions({ cwd }));
  assert.ok(result.driftFindings.length > 0, "guard: the fixture must actually drift");
  assert.ok(
    (result.findings ?? []).some((finding) => finding.rule === "evidence.stale"),
    "drift must report stale evidence in `findings`, where exit-code logic looks"
  );
  assert.equal(result.result, "warning", "a drifted wiki is not a passing wiki");
});

test("drift --strict exits 1 on drift, and 0 on a clean wiki", async () => {
  const { cwd, git, sourceFile } = await makeGitWiki();
  await writeFile(path.join(cwd, sourceFile), "export const a = 2;\n", "utf8");
  await git("add", ".");
  await git("commit", "-q", "-m", "change source after review");

  const originalLog = console.log;
  const originalExitCode = process.exitCode;
  console.log = () => {};
  try {
    assert.equal(await main(["drift", "--cwd", cwd, "--strict"]), 1, "drift --strict must fail on drift");
    // Without --strict the exit code stays 0, so wiring drift into an existing
    // pipeline cannot break it by accident.
    assert.equal(await main(["drift", "--cwd", cwd]), 0, "plain drift stays advisory");
  } finally {
    console.log = originalLog;
    process.exitCode = originalExitCode;
  }
});

// --- A-6 #10: impact --since misses untracked files -----------------------

test("impact --since sees a source file that is added but not yet committed", async () => {
  const { cwd } = await makeGitWiki();
  const base = (await execFileAsync("git", ["-C", cwd, "rev-parse", "HEAD"])).stdout.trim();
  // A brand-new source file in a PR working tree: untracked, so a plain
  // `git diff <ref>` never mentions it and the missing-doc check goes blind.
  await writeFile(path.join(cwd, "src", "brand-new.js"), "export const b = 2;\n", "utf8");

  // The defect lives in changedFiles, which is the baseline both impact and the
  // Gate 26 cross-check are meant to share, so pin it at the seam...
  const changed = changedFiles(cwd, base).map((entry) => entry.replace(/\\/g, "/"));
  assert.ok(
    changed.includes("src/brand-new.js"),
    `changedFiles(--since) must include untracked source; saw ${JSON.stringify(changed)}`
  );
  // ...and confirm the count impact reports actually moves, so the fix reaches
  // the command a pipeline runs rather than only the helper.
  const result = await impactCommand(normalizeOptions({ cwd, since: base }));
  assert.ok(result.changedFiles > 0, "impact --since must count the untracked file");
});

test("changedFiles still excludes gitignored paths under --since", async () => {
  const { cwd, git } = await makeGitWiki();
  const base = (await execFileAsync("git", ["-C", cwd, "rev-parse", "HEAD"])).stdout.trim();
  await writeFile(path.join(cwd, ".gitignore"), "ignored/\n", "utf8");
  await git("add", ".gitignore");
  await git("commit", "-q", "-m", "add gitignore");
  await mkdir(path.join(cwd, "ignored"), { recursive: true });
  await writeFile(path.join(cwd, "ignored", "build.js"), "export const c = 3;\n", "utf8");

  const changed = changedFiles(cwd, base).map((entry) => entry.replace(/\\/g, "/"));
  assert.ok(
    !changed.some((entry) => entry.startsWith("ignored/")),
    `--exclude-standard must keep build output out; saw ${JSON.stringify(changed)}`
  );
});

// --- backlog 3: the missing-detection rule fails a build ------------------
// Backlog 3 asked that `strict` escalate this rule, because the preset named
// strict was escalating seven presentational rules while the one detection rule
// that can fail a build stayed advisory. Decision 21 (2026-08-03) went further
// and made error the DEFAULT, which subsumes the preset entry — so the assertion
// moved from "strict escalates it" to "nothing has to escalate it". The
// requirement backlog 3 expressed is now stronger, not dropped.

test("the missing-detection rule fails a build with no preset and no --strict", () => {
  assert.equal(
    FINDING_EXPLANATIONS["impact.source_changed"].defaultSeverity,
    "error",
    "the one rule that detects a missing doc update must fail a build by default"
  );
  assert.equal(
    RULE_PRESETS.strict["impact.source_changed"],
    undefined,
    "strict must not carry a no-op escalation of a rule that already defaults to error"
  );
});

test("rulesPreset relaxed still relaxes it, and standard stays a no-op", () => {
  assert.equal(RULE_PRESETS.relaxed["impact.source_changed"], "info");
  assert.deepEqual(RULE_PRESETS.standard, {}, "standard must remain byte-identical to no preset");
});
