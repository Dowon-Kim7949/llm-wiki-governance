// N-9: `impact` does not flag a document that appears in the diff, on the reading
// "the document was updated in this change, so it is not an omission". A review
// stamp satisfies that test without anyone re-reading anything, so one unrelated
// `review --approve-all` inside a PR's range exempts every document it stamped for
// the whole PR. Measured harm (case C-1): a stale contract description passed the
// gate exactly that way.
//
// The fix here is a REPORT, not an enforcement change, and that is deliberate. The
// same self-exclusion is how the documented remediation clears a finding —
// `drift --downgrade`, then `review --approve-all` — so making a stamp stop
// exempting a document would leave real drift with no resolution path, which is
// defect N-11 pointing the other way. Closing both needs a decision about what
// re-affirmation is; until then the reader is told which documents this run did not
// really check, and no exit code moves.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { explainCommand, impactCommand } from "../src/commands.js";
import { main } from "../src/cli.js";
import { FINDING_EXPLANATIONS, RULE_PRESETS } from "../src/commands/findings.js";
import { normalizeOptions } from "../src/index.js";

for (const [name, value] of [["impactCommand", impactCommand], ["explainCommand", explainCommand], ["main", main]]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const docText = (name, { status = "verified", reviewedAt = "2026-01-01", body = "Describes a.ts." } = {}) => [
  "---", `title: ${name}`, "tags:", "  - llm-wiki",
  status === "verified" ? "  - verified" : "  - needs-review",
  `status: ${status}`,
  "doc_type: public_api", "project: stamp-only", "last_updated: 2026-01-01",
  "author: cli-generated", "last_edited_by: t", "reviewed_by: t", `reviewed_at: ${reviewedAt}`,
  "wiki_block_version: v1", "source_files:", "  - a.ts", "evidence:", "  - a.ts",
  "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
  "contains_sensitive_info: false", "---", "", `# ${name}`, "", body, ""
].join("\n");

async function repo({ config = null } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-stamp-only-"));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "stamp-only" }, null, 2)}\n`, { encoding: "utf8" });
  // Committed with the fixture so the config file itself is not part of the diff.
  if (config) await writeFile(path.join(cwd, "llm-wiki.config.json"), `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8" });
  await writeFile(path.join(cwd, "a.ts"), "one\n", { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "stamped.md"), docText("stamped"), { encoding: "utf8" });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "rewritten.md"), docText("rewritten"), { encoding: "utf8" });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "untouched.md"), docText("untouched"), { encoding: "utf8" });

  const git = (args) => execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" }
  });
  git(["init"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@e", "commit", "-m", "init"]);

  // The anchored source moves.
  await writeFile(path.join(cwd, "a.ts"), "one\ntwo\n", { encoding: "utf8" });
  return cwd;
}

test("a review-stamp-only document change is reported as such", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  const stamped = path.join(cwd, "docs", "llm-wiki", "stamped.md");

  // Exactly what `drift --downgrade` then `review --approve-all` produces: status,
  // the status tag, the two review fields, last_updated. No prose moves.
  const before = await readFile(stamped, "utf8");
  await writeFile(stamped, before
    .replace("reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01")
    .replace("last_updated: 2026-01-01", "last_updated: 2026-06-01")
    .replace("reviewed_by: t", "reviewed_by: an agent"), { encoding: "utf8" });

  const result = await impactCommand(normalizeOptions({ cwd }));
  const flagged = result.findings.filter((f) => f.rule === "impact.source_changed").map((f) => f.path);

  assert.deepEqual(
    result.stampOnlyExclusions,
    ["docs/llm-wiki/stamped.md"],
    "the stamped document must be named as not really checked by this run"
  );
  assert.ok(
    !flagged.includes("docs/llm-wiki/stamped.md"),
    "the exclusion itself is unchanged on purpose — enforcing it would break the documented remediation (N-11)"
  );
  assert.ok(flagged.includes("docs/llm-wiki/untouched.md"), "a document nobody touched is still flagged");
  assert.match(result.text, /stamp_only_exclusions: 1 \(docs\/llm-wiki\/stamped\.md\)/);
});

test("a document whose prose actually changed is not reported as stamp-only", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  const rewritten = path.join(cwd, "docs", "llm-wiki", "rewritten.md");
  const before = await readFile(rewritten, "utf8");
  await writeFile(rewritten, before
    .replace("Describes a.ts.", "Describes a.ts, which now has a second line.")
    .replace("reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01"), { encoding: "utf8" });

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.deepEqual(
    result.stampOnlyExclusions,
    [],
    "a real update must not be counted as a stamp — the two must stay distinguishable"
  );
});

test("the report never changes the exit code", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  const stamped = path.join(cwd, "docs", "llm-wiki", "stamped.md");
  const before = await readFile(stamped, "utf8");
  await writeFile(stamped, before.replace("reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01"), { encoding: "utf8" });

  const withStamp = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(withStamp.stampOnlyExclusions.length, 1);
  // untouched.md is still flagged either way, so the result is driven by findings,
  // never by this count. Pinned because a "report only" that quietly failed builds
  // would be the exact dishonesty this repository treats as its top defect class.
  assert.equal(withStamp.result, "fail");
  assert.ok(!withStamp.findings.some((f) => f.path === "docs/llm-wiki/stamped.md"));
});

test("a newly added document is not mistaken for a stamp-only change", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  await writeFile(path.join(cwd, "docs", "llm-wiki", "brand-new.md"), docText("brand-new"), { encoding: "utf8" });
  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.deepEqual(result.stampOnlyExclusions, [], "a file with no baseline has no stamp to compare");
});

// ---------------------------------------------------------------------------
// Opt-in rule `impact.stamp_only`: the same report as findings. The maintainer
// decision is "make it visible, do not block it" (N-9/N-11), so the rule is OFF
// unless named in config `rules`, and a warning when it is on.

const STAMP_RULE = "impact.stamp_only";

// Runs the real CLI entry point so the config file is loaded and the exit code is
// the one a CI job would see.
async function runCli(args) {
  const lines = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  console.log = (...parts) => lines.push(parts.join(" "));
  console.error = (...parts) => lines.push(parts.join(" "));
  try {
    const code = await main(args);
    return { code, output: lines.join("\n") };
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode;
  }
}

async function restamp(cwd, name, replacements) {
  const file = path.join(cwd, "docs", "llm-wiki", name);
  let text = await readFile(file, "utf8");
  for (const [from, to] of replacements) text = text.replace(from, to);
  await writeFile(file, text, { encoding: "utf8" });
}

// Every verified document that cites a.ts is either stamp-only or really edited,
// so impact.source_changed has nothing to flag and only the opt-in rule can speak.
async function allStampedRepo(config) {
  const cwd = await repo({ config });
  await restamp(cwd, "stamped.md", [["reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01"]]);
  await restamp(cwd, "untouched.md", [["reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01"], ["reviewed_by: t", "reviewed_by: an agent"]]);
  await restamp(cwd, "rewritten.md", [["Describes a.ts.", "Describes a.ts, which now has a second line."]]);
  return cwd;
}

const stampFindings = (result) => result.findings.filter((f) => f.rule === STAMP_RULE);

test("impact.stamp_only is off by default: findings, output, and exit code are unchanged", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  await restamp(cwd, "stamped.md", [["reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01"]]);

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.deepEqual(stampFindings(result), [], "a project that did not ask for the rule sees nothing new");
  assert.deepEqual(result.findings.map((f) => f.rule), ["impact.source_changed", "impact.source_changed"]);
  assert.doesNotMatch(result.text, /impact\.stamp_only/);

  const json = await runCli(["impact", "--cwd", cwd, "--format", "json"]);
  assert.equal(json.code, 1, "untouched.md still fails the build exactly as before");
  assert.ok(!json.output.includes(STAMP_RULE));

  // "off" is the same as not naming the rule at all, byte for byte.
  const off = await impactCommand(normalizeOptions({ cwd, rules: { [STAMP_RULE]: "off" } }));
  assert.equal(off.text, result.text);
  assert.deepEqual(off.findings, result.findings);
});

test("impact.stamp_only on: one warning per stamp-only verified document, exit code 0", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await allStampedRepo({ rules: { [STAMP_RULE]: "warning" } });

  const run = await runCli(["impact", "--cwd", cwd, "--format", "json"]);
  assert.equal(run.code, 0, "a warning never fails the build without --strict");
  const result = JSON.parse(run.output);
  assert.deepEqual(result.stampOnlyExclusions, ["docs/llm-wiki/stamped.md", "docs/llm-wiki/untouched.md"]);
  const found = stampFindings(result);
  assert.deepEqual(found.map((f) => f.path), ["docs/llm-wiki/stamped.md", "docs/llm-wiki/untouched.md"], "one finding per document");
  assert.ok(found.every((f) => f.severity === "warning"));
  assert.ok(found.every((f) => /Only the review stamp changed/.test(f.message) && /excluded it from impact\.source_changed/.test(f.message)));
  assert.ok(found.every((f) => f.message.includes("depends on a.ts")), "the changed source the stamp hid is named");
  assert.ok(!found.some((f) => f.path === "docs/llm-wiki/rewritten.md"), "a real edit is not a stamp");
  assert.equal(result.findings.filter((f) => f.rule === "impact.source_changed").length, 0);
  assert.equal(result.result, "warning");
});

test("impact.stamp_only does not report a stamp-only downgrade", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  // Exactly what `drift --downgrade` writes: status, the status tag, last_updated.
  await restamp(cwd, "stamped.md", [
    ["status: verified", "status: needs_review"],
    ["  - verified", "  - needs-review"],
    ["last_updated: 2026-01-01", "last_updated: 2026-06-01"]
  ]);
  const result = await impactCommand(normalizeOptions({ cwd, rules: { [STAMP_RULE]: "warning" } }));
  assert.deepEqual(result.stampOnlyExclusions, ["docs/llm-wiki/stamped.md"], "the report still names it");
  assert.deepEqual(stampFindings(result), [], "downgrading is the recommended remediation, not a bypass");
});

test("impact.stamp_only is silent while impact.source_changed is off (lite)", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await allStampedRepo({ governance: { mode: "lite" }, rules: { [STAMP_RULE]: "warning" } });
  const run = await runCli(["impact", "--cwd", cwd, "--format", "json"]);
  const result = JSON.parse(run.output);
  assert.equal(result.stampOnlyExclusions.length, 2);
  assert.deepEqual(stampFindings(result), [], "nothing is excluded from a check that does not run");
  assert.equal(run.code, 0);
});

test("impact.stamp_only raised to error fails the build (and so does --strict at warning)", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const asError = await allStampedRepo({ rules: { [STAMP_RULE]: "error" } });
  const failed = await runCli(["impact", "--cwd", asError, "--format", "json"]);
  assert.equal(failed.code, 1);
  const result = JSON.parse(failed.output);
  assert.equal(result.result, "fail");
  assert.ok(stampFindings(result).length === 2 && stampFindings(result).every((f) => f.severity === "error"));

  // The N-11 trap explain warns about: --strict fails on warnings too.
  const asWarning = await allStampedRepo({ rules: { [STAMP_RULE]: "warning" } });
  assert.equal((await runCli(["impact", "--cwd", asWarning, "--strict", "--format", "json"])).code, 1);
  // "info" stays visible under --strict without failing it.
  const asInfo = await allStampedRepo({ rules: { [STAMP_RULE]: "info" } });
  const info = await runCli(["impact", "--cwd", asInfo, "--strict", "--format", "json"]);
  assert.equal(info.code, 0);
  assert.ok(stampFindings(JSON.parse(info.output)).every((f) => f.severity === "info"));
});

test("impact.stamp_only is a registered, opt-in rule and explain warns about raising it", async () => {
  const entry = FINDING_EXPLANATIONS[STAMP_RULE];
  assert.ok(entry, "registered, so config rules can toggle it");
  assert.equal(entry.category, "impact");
  assert.equal(entry.defaultSeverity, "warning");
  for (const [name, preset] of Object.entries(RULE_PRESETS)) {
    assert.ok(!(STAMP_RULE in preset), `${name} preset must not switch it on: it is opt-in only`);
  }

  const explained = await explainCommand(normalizeOptions({ findingRule: STAMP_RULE }));
  assert.equal(explained.result, "pass");
  assert.match(explained.text, /N-11/);
  assert.match(explained.text, /"error"/);
  assert.match(explained.text, /--strict/);

  const cli = await runCli(["explain", STAMP_RULE]);
  assert.equal(cli.code, 0);
  assert.match(cli.output, /impact\.stamp_only/);
});
