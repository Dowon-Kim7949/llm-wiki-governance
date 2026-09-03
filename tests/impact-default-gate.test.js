// Decision 21 (maintainer, 2026-08-03): the missing-doc gate fails BY DEFAULT.
//
// `impact --since <ref>` used to report `impact.source_changed` as a warning, so
// it exited 0 unless `--strict` was passed. That made the one rule this tool
// exists for — source moved, its documentation did not — the only detection rule
// that could not fail a build without opting in. It now defaults to `error`.
//
// This is a BREAKING change to the exit-code contract: an adopter who upgrades
// gets a red build on the first commit that changes source without touching the
// document that cites it. The escape hatches are deliberate and tested here,
// because a breaking change with no documented way back is not a decision, it is
// an ambush:
//   - `"impact.source_changed": "warning"` (or "info"/"off") in llm-wiki.config.json
//   - `rulesPreset: "relaxed"`, which keeps it at info
//
// The recorded counter-argument stays on the record: the baseline false-positive
// rate for this rule was measured at 27% or 57% depending on one unmade policy
// call (whether a shifted line anchor counts as a true positive), and a single
// hub file can fan out to 14 findings. The maintainer decided to default it on
// with those numbers known.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { impactCommand } from "../src/commands.js";
import { normalizeOptions } from "../src/index.js";
import { fileURLToPath } from "node:url";
import { FINDING_EXPLANATIONS, RULE_PRESETS } from "../src/commands/findings.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

async function impactRepo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-impact-default-"));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "impact-default" }, null, 2)}\n`, { encoding: "utf8" });
  await writeFile(path.join(cwd, "a.ts"), "one\n", { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(
    path.join(cwd, "docs", "llm-wiki", "api.md"),
    [
      "---", "title: Api", "tags:", "  - llm-wiki", "  - verified", "status: verified",
      "doc_type: public_api", "project: impact-default", "last_updated: 2026-07-11",
      "author: cli-generated", "reviewed_by: Someone", "reviewed_at: 2026-07-11",
      "wiki_block_version: v1", "source_files:", "  - a.ts", "evidence:", "  - a.ts",
      "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
      "contains_sensitive_info: false", "---", "", "# Api", "", "Describes a.ts.", "",
      "## Evidence", "", "- a.ts — the module this document describes.", ""
    ].join("\n"),
    { encoding: "utf8" }
  );
  const git = (args) => execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" } });
  git(["init"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "init"]);
  // Source moves; its document does not.
  await writeFile(path.join(cwd, "a.ts"), "one\ntwo\n", { encoding: "utf8" });
  return cwd;
}

const impactFindings = (result) => result.findings.filter((f) => f.rule === "impact.source_changed");

test("impact fails by default when a verified doc's source changed and the doc did not", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await impactRepo();

  const result = await impactCommand(normalizeOptions({ cwd }));
  const found = impactFindings(result);
  assert.equal(found.length, 1, "the rule must still fire exactly once here");
  assert.equal(found[0].severity, "error", "severity is error without --strict");
  assert.equal(result.result, "fail", "the command grades itself as a failure, so CI exits 1");
});

test("impact's default severity and its push site agree", () => {
  // ARCHITECTURE_CONVENTIONS makes defaultSeverity the single source of truth for
  // rule -> severity, audited against the push sites. A change to one and not the
  // other would make `explain` describe a rule the scan does not emit.
  assert.equal(FINDING_EXPLANATIONS["impact.source_changed"].defaultSeverity, "error");
});

test("a project can put impact.source_changed back to a warning, or turn it off", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await impactRepo();

  const warned = await impactCommand(normalizeOptions({ cwd, rules: { "impact.source_changed": "warning" } }));
  assert.equal(impactFindings(warned)[0].severity, "warning");
  assert.equal(warned.result, "warning", "exit 0 again — this is the documented way back");

  const off = await impactCommand(normalizeOptions({ cwd, rules: { "impact.source_changed": "off" } }));
  assert.equal(impactFindings(off).length, 0);
  assert.equal(off.result, "pass");
});

test("the relaxed preset still keeps impact.source_changed at info", () => {
  // relaxed exists for noisy active repositories, and this rule is the noisiest
  // one measured (a hub file fans out to 14 findings). If the preset stopped
  // dialing it down, `relaxed` would hard-fail the very repos it is meant for.
  assert.equal(RULE_PRESETS.relaxed["impact.source_changed"], "info");
});

test("the strict preset no longer needs to escalate impact.source_changed", () => {
  // It escalated the rule to error back when the default was warning. With the
  // default now error, an entry here would be a no-op that also violates the
  // preset registry's own rule about touching error-default rules.
  assert.equal(RULE_PRESETS.strict["impact.source_changed"], undefined);
});

test("nothing this command ships still tells the user impact is a warning", async (t) => {
  // This repository has shipped text that lied about its own behaviour twice
  // (N-10, and the drift/review caveats before it), and both times the wrong
  // sentence outlived the change by days because no test could read prose. The
  // sweep that found this one turned up six places when the report named one, so
  // the guard is a census over the shipped surfaces rather than a spot check.
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await impactRepo();
  const printed = (await impactCommand(normalizeOptions({ cwd }))).text;
  assert.doesNotMatch(printed, /[Dd]efault warning/, "the command's own caveats must not call this rule a warning");
  assert.match(printed, /error by default/i);

  // The census named three source files while calling itself a census over the
  // shipped surfaces. On 2026-08-04 a sweep found docs/OPERATIONS.md still telling
  // the reader "--strict is what makes it block" — in the same file whose next
  // section had just been rewritten to say the opposite — and the composite
  // action's input description implying strict: true was load-bearing. Neither was
  // in scope, and neither phrasing matched the pattern. Both are now covered.
  const SURFACES = [
    "src/cli.js",
    "src/commands.js",
    "src/i18n.js",
    "src/commands/findings.js",
    "src/commands/scans.js",
    "README.md",
    "README.ko.md",
    "GATE_REVIEW.md",
    "docs/OPERATIONS.md",
    "SECURITY.md",
    "templates/git-hooks/pre-commit",
    "templates/github-actions/llm-wiki-validate.yml",
    ".github/actions/validate/action.yml",
    ".github/workflows/ci.yml"
  ];
  // "--strict is what makes it block" / "--strict makes it fail" / "so --strict is
  // required", and the flat claim that the rule is a warning.
  const BLOCK_CLAIM = /--strict`?\s*(is what makes|is required|makes|fails|to fail)/;
  const WARNING_CLAIM = /impact\.source_changed`?\s+(is|as)\s+a\s+warning/i;
  // A line may say any of it while marking itself as history or as a correction.
  const ALLOWED = /no-op|does not change|used to be|no longer|superseded|since 1\.28\.0|is not\b/i;

  // Sentence-scoped, because a Markdown bullet is one line and routinely covers
  // `impact` in one sentence and `drift`/`check-run` — which DO still need
  // `--strict` — in the next. A sentence naming both is ambiguous and skipped; that
  // is a known hole, and the alternative (line-scoped) produced a false positive on
  // the very sentence that states the deliberate asymmetry.
  for (const file of SURFACES) {
    const text = await readFile(path.join(REPO_ROOT, file), "utf8");
    text.split("\n").forEach((line, index) => {
      if (!/impact/i.test(line)) return;
      for (const sentence of line.split(/(?<=\.)\s+/)) {
        if (!/impact/i.test(sentence)) continue;
        if (/\bdrift\b|check-run/i.test(sentence)) continue;
        if (!BLOCK_CLAIM.test(sentence) && !WARNING_CLAIM.test(sentence)) continue;
        assert.ok(
          ALLOWED.test(sentence),
          `${file}:${index + 1} still tells the reader --strict is what makes impact block, or calls the rule a warning: ${sentence.trim()}`
        );
      }
    });
  }
});

test("--strict does not double-escalate an already-failing rule", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await impactRepo();
  const lax = await impactCommand(normalizeOptions({ cwd }));
  const strict = await impactCommand(normalizeOptions({ cwd, strict: true }));
  assert.equal(impactFindings(lax)[0].severity, "error");
  assert.equal(impactFindings(strict)[0].severity, "error");
  assert.equal(lax.result, strict.result, "--strict is now a no-op for this rule");
});
