// A rule switched off stops being REPORTED; it must not stop being TRUE. Lite
// switches content.not_enriched, evidence.missing and evidence.stale off, and three
// readers derived facts from those findings, so in lite (1.30.0 – 1.37.0):
//   - stats counted every untouched scaffold as enriched, every dangling evidence
//     path as reference_checked, and reported stale_verified 0 without looking;
//   - next printed an empty enrichment checklist ("No placeholder documents");
//   - review --approve-all promoted untouched scaffolds to verified, past the
//     gate whose stated contract is that a bulk approval cannot sweep them up.
// Each test compares the toggled run with the same run on the registry defaults,
// and checks the other half too: validate in lite stays as quiet as before.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { initCommand, nextCommand, reviewCommand, statsCommand, validateCommand } from "../src/commands.js";
import { scanEnrichment } from "../src/commands/scans.js";
import { GOVERNANCE_MODES, getGovernancePolicy, withRulesMeasured } from "../src/governance.js";
import { normalizeOptions, resolveOptions } from "../src/index.js";

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

async function cliOpts(cwd, extra = {}) {
  const { options, errors } = await resolveOptions({ cwd, agents: [], profiles: [], ...extra });
  assert.deepEqual(errors, []);
  return options;
}

// A plain `init --write` in a repository with a manifest: the mode it records for
// a new project is lite.
async function liteScaffold(prefix) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), prefix));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "toggle-demo" })}\n`, { encoding: "utf8" });
  await initCommand(normalizeOptions({ cwd, agents: [], profiles: [], write: true }));
  const options = await cliOpts(cwd);
  assert.equal(options.governanceMode, "lite", "guard: init records lite for a new project");
  assert.equal(options.rules["content.not_enriched"], "off", "guard: lite switches the rule off");
  return { cwd, options };
}

async function scaffoldPaths(cwd) {
  return new Set((await scanEnrichment(cwd)).filter((finding) => finding.rule === "content.not_enriched").map((finding) => finding.path));
}

function wikiDoc({ title, status = "needs_review", reviewedAt = "2026-02-01", sourceFiles = [], evidence = [] }) {
  const list = (key, values) => (values.length ? [`${key}:`, ...values.map((value) => `  - ${value}`)] : [`${key}: []`]);
  return [
    "---", `title: ${title}`, "tags:", "  - llm-wiki", `  - ${status === "verified" ? "verified" : "needs-review"}`, `status: ${status}`,
    "doc_type: public_api", "project: toggle-demo", `last_updated: ${reviewedAt}`, "author: cli-generated",
    "last_edited_by: t", "reviewed_by: t", `reviewed_at: ${reviewedAt}`, "wiki_block_version: v1",
    ...list("source_files", sourceFiles), ...list("evidence", evidence),
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal", "contains_sensitive_info: false", "---",
    "", `# ${title}`, "", "Body written from the source.", ""
  ].join("\n");
}

async function liteProject(prefix, docs, files = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), prefix));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "llm-wiki.config.json"), `${JSON.stringify({ governance: { mode: "lite" } })}\n`, { encoding: "utf8" });
  for (const [rel, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(cwd, rel)), { recursive: true });
    await writeFile(path.join(cwd, rel), text, { encoding: "utf8" });
  }
  for (const [name, text] of Object.entries(docs)) await writeFile(path.join(cwd, "docs", "llm-wiki", `${name}.md`), text, { encoding: "utf8" });
  return cwd;
}

test("withRulesMeasured: restores only the named rules that are off, and leaves dialed severities alone", () => {
  const options = { cwd: ".", rules: { "content.not_enriched": "off", "evidence.missing": "info", "encoding.bom": "off" } };
  const measured = withRulesMeasured(options, ["content.not_enriched", "evidence.missing"]);
  assert.deepEqual(measured.rules, { "evidence.missing": "info", "encoding.bom": "off" });
  assert.deepEqual(options.rules["content.not_enriched"], "off", "the caller's options are not mutated");
  assert.equal(withRulesMeasured(options, ["evidence.stale"]), options, "nothing off among the named rules: same object");
  assert.equal(withRulesMeasured({ cwd: "." }, ["content.not_enriched"]).rules, undefined);
});

test("lite: stats measures enrichment the way the registry defaults do", async () => {
  const { cwd, options } = await liteScaffold("llm-wiki-toggle-stats-");
  const scaffolds = await scaffoldPaths(cwd);
  assert.ok(scaffolds.size > 0, "guard: a fresh scaffold has placeholder documents");

  const lite = (await statsCommand(options)).stats;
  const defaults = (await statsCommand({ ...options, rules: {} })).stats;
  assert.equal(lite.notEnriched, scaffolds.size, "every placeholder document is counted, not just the reported ones");
  assert.equal(lite.enriched, defaults.enriched);
  assert.equal(lite.enrichedPct, defaults.enrichedPct);
  assert.ok(lite.enrichedPct < 100, "a fresh lite wiki is not 100% enriched");
  assert.equal(lite.healthScore, defaults.healthScore);

  // Reported is a separate question, and lite's answer is unchanged.
  const validated = await validateCommand(options);
  assert.ok(!validated.findings.some((finding) => finding.rule === "content.not_enriched"), "lite still does not report it");
});

test("lite: next lists the documents to fill instead of an empty checklist", async () => {
  const { cwd, options } = await liteScaffold("llm-wiki-toggle-next-");
  const scaffolds = await scaffoldPaths(cwd);
  const next = await nextCommand(options);
  assert.deepEqual(new Set(next.enrichmentChecklist.map((entry) => entry.path)), scaffolds);
  assert.ok(next.actions.some((action) => action.id === "enrich-placeholder-docs"));
  assert.doesNotMatch(next.text, /No placeholder documents detected/);
});

test("lite: review --approve-all never promotes an untouched scaffold, and naming one is refused", async () => {
  const { cwd, options } = await liteScaffold("llm-wiki-toggle-review-");
  const scaffolds = await scaffoldPaths(cwd);

  const listed = await reviewCommand(options);
  const unapprovable = listed.documents.filter((doc) => !doc.approvable).map((doc) => doc.path);
  assert.ok(unapprovable.length > 0, "the list says which documents cannot be approved");
  for (const rel of unapprovable) assert.ok(scaffolds.has(rel), `${rel} is unapprovable because it is a scaffold`);

  const scaffold = unapprovable[0];
  const named = await reviewCommand({ ...options, approve: [scaffold], reviewer: "t" });
  assert.deepEqual(named.approved, []);
  assert.ok(named.refused.some((entry) => entry.path === scaffold && /unenriched scaffold/.test(entry.reason)));
  assert.ok(named.findings.some((finding) => finding.rule === "review.not_enriched" && finding.path === scaffold));

  const all = await reviewCommand({ ...options, approveAll: true, yes: true, reviewer: "t" });
  const approved = all.approved.map((entry) => (typeof entry === "string" ? entry : entry.path));
  for (const rel of approved) assert.ok(!scaffolds.has(rel), `${rel} was approved while still a scaffold`);
});

test("strict with content.not_enriched off in config: the approval gate still holds", async () => {
  const { cwd } = await liteScaffold("llm-wiki-toggle-config-");
  await writeFile(
    path.join(cwd, "llm-wiki.config.json"),
    `${JSON.stringify({ governance: { mode: "strict" }, rules: { "content.not_enriched": "off" } })}\n`,
    { encoding: "utf8" }
  );
  const options = await cliOpts(cwd);
  assert.equal(options.rules["content.not_enriched"], "off", "guard: switched off by hand, not by a mode");
  const scaffolds = await scaffoldPaths(cwd);
  const all = await reviewCommand({ ...options, approveAll: true, yes: true, reviewer: "t" });
  const approved = all.approved.map((entry) => (typeof entry === "string" ? entry : entry.path));
  for (const rel of approved) assert.ok(!scaffolds.has(rel), `${rel} was approved while still a scaffold`);
});

test("lite: reference_checked counts only documents whose evidence resolves", async () => {
  const cwd = await liteProject("llm-wiki-toggle-refs-", {
    resolves: wikiDoc({ title: "Resolves", evidence: ["src/present.js"] }),
    dangling: wikiDoc({ title: "Dangling", evidence: ["src/absent.js"] })
  }, { "src/present.js": "export const v = 1;\n" });
  const options = await cliOpts(cwd);
  assert.equal(options.rules["evidence.missing"], "off", "guard: lite switches evidence.missing off");

  const lite = (await statsCommand(options)).stats;
  const defaults = (await statsCommand({ ...options, rules: {} })).stats;
  assert.equal(lite.evidenceTiers.referenceChecked, 1, "the dangling evidence path does not count as checked");
  assert.equal(lite.evidenceTiers.referenceChecked, defaults.evidenceTiers.referenceChecked);
  assert.equal(lite.evidenceBacked, 2, "evidence_coverage still counts citations, resolved or not");

  const validated = await validateCommand(options);
  assert.ok(!validated.findings.some((finding) => finding.rule === "evidence.missing"), "lite still does not report it");
});

test("lite: stale_verified is measured, not assumed zero", { skip: !hasGit() && "git not available" }, async () => {
  const cwd = await liteProject("llm-wiki-toggle-stale-", {
    stale: wikiDoc({ title: "Stale", status: "verified", reviewedAt: "2026-02-01", sourceFiles: ["src/a.js"], evidence: ["src/a.js"] })
  }, { "src/a.js": "export const v = 1;\n" });
  const git = (args, at) => execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e", GIT_AUTHOR_DATE: at, GIT_COMMITTER_DATE: at }
  });
  git(["init", "-q", "-b", "main"], "2026-01-01T00:00:00+0000");
  git(["add", "-A"], "2026-01-01T00:00:00+0000");
  git(["-c", "commit.gpgsign=false", "commit", "-q", "-m", "init"], "2026-01-01T00:00:00+0000");
  await writeFile(path.join(cwd, "src", "a.js"), "export const v = 2;\n", { encoding: "utf8" });
  git(["add", "-A"], "2026-03-01T00:00:00+0000");
  git(["-c", "commit.gpgsign=false", "commit", "-q", "-m", "change after review"], "2026-03-01T00:00:00+0000");

  const options = await cliOpts(cwd);
  assert.equal(options.rules["evidence.stale"], "off", "guard: lite switches evidence.stale off");
  const lite = (await statsCommand(options)).stats;
  const defaults = (await statsCommand({ ...options, rules: {} })).stats;
  assert.equal(defaults.staleVerified, 1, "guard: the fixture is stale on the registry defaults");
  assert.equal(lite.staleVerified, 1);

  const validated = await validateCommand(options);
  assert.ok(!validated.findings.some((finding) => finding.rule === "evidence.stale"), "lite still does not report it");
});

// 2026-10-28. The approval gate refuses a document with an error finding, and
// --strict (or config "strict": true) makes evidence.missing an error. Lite turns
// that rule off, so with "strict": true the same document — enriched, but citing a
// file that does not exist — was refused under strict and standard and approved
// under lite.
// The body names the reference under ## Evidence, so evidence.missing is the only
// finding --strict raises to an error (evidence.section_missing would be another).
async function modeProject(prefix, config) {
  const dangling = wikiDoc({ title: "Dangling", evidence: ["src/absent.js"] })
    .replace("Body written from the source.", "Body written from the source.\n\n## Evidence\n\n- src/absent.js");
  return liteProject(prefix, { dangling }, { "llm-wiki.config.json": `${JSON.stringify(config)}\n` });
}

test("a governance mode decides what is reported, never what review can approve", async () => {
  for (const strict of [true, false]) {
    const verdicts = {};
    for (const mode of ["strict", "standard", "lite"]) {
      const cwd = await modeProject(`llm-wiki-toggle-gate-${mode}-`, { governance: { mode }, strict });
      const options = await cliOpts(cwd);
      const listed = await reviewCommand(options);
      verdicts[mode] = listed.documents.find((doc) => doc.path === "docs/llm-wiki/dangling.md")?.approvable;
    }
    assert.deepEqual(verdicts, { strict: !strict, standard: !strict, lite: !strict }, `strict: ${strict}`);
  }

  const cwd = await modeProject("llm-wiki-toggle-gate-approve-", { governance: { mode: "lite" }, strict: true });
  const options = await cliOpts(cwd);
  const named = await reviewCommand({ ...options, approve: ["docs/llm-wiki/dangling.md"], reviewer: "t" });
  assert.deepEqual(named.approved, [], "lite no longer approves what strict and standard refuse");
  const validated = await validateCommand(options);
  assert.ok(!validated.findings.some((finding) => finding.rule === "evidence.missing"), "and lite still does not report it");
});

test("a rule switched off by name stays off for the approval gate, in every mode", async () => {
  // Only the mode's own floor is measured: an explicit entry is the project's
  // narrowest statement and wins, in lite exactly as it does in standard.
  for (const mode of ["standard", "lite"]) {
    const cwd = await modeProject(`llm-wiki-toggle-gate-named-${mode}-`, { governance: { mode }, strict: true, rules: { "evidence.missing": "off" } });
    const options = await cliOpts(cwd);
    assert.ok(!(options.governanceSuppressedRules ?? []).includes("evidence.missing"), `${mode}: guard: not recorded as a mode-only off`);
    const listed = await reviewCommand(options);
    assert.equal(listed.documents.find((doc) => doc.path === "docs/llm-wiki/dangling.md")?.approvable, true, mode);
  }
});

test("governanceSuppressedRules names the rules a mode alone switched off", async () => {
  const lite = await cliOpts(await modeProject("llm-wiki-toggle-floor-lite-", { governance: { mode: "lite" } }));
  assert.deepEqual([...lite.governanceSuppressedRules].sort(), [
    "content.not_enriched", "encoding.bom", "evidence.missing", "evidence.stale", "evidence.ungrounded", "impact.source_changed"
  ]);
  const strict = await cliOpts(await modeProject("llm-wiki-toggle-floor-strict-", { governance: { mode: "strict" } }));
  assert.equal(strict.governanceSuppressedRules, undefined, "strict's floor is empty, so its option set is unchanged");
  const legacy = await cliOpts(await modeProject("llm-wiki-toggle-floor-legacy-", {}));
  assert.equal(legacy.governanceSuppressedRules, undefined);
});

test("stats lists verified documents that still carry scaffold placeholder text, in every mode", async () => {
  const scaffoldBody = (title) => wikiDoc({ title, status: "verified", sourceFiles: ["package.json"] })
    .replace("Body written from the source.", "Concise summary: describe what this document covers.");
  for (const mode of ["lite", "strict"]) {
    const cwd = await liteProject(`llm-wiki-toggle-verified-scaffold-${mode}-`, {
      approvedScaffold: scaffoldBody("Approved scaffold"),
      draftScaffold: wikiDoc({ title: "Draft scaffold" }).replace("Body written from the source.", "Concise summary: describe it."),
      written: wikiDoc({ title: "Written", status: "verified", sourceFiles: ["package.json"] })
    }, { "package.json": "{}\n", "llm-wiki.config.json": `${JSON.stringify({ governance: { mode } })}\n` });
    const result = await statsCommand(await cliOpts(cwd));
    assert.deepEqual(result.stats.verifiedNotEnriched, ["docs/llm-wiki/approvedScaffold.md"], mode);
    assert.match(result.text, /verified_not_enriched: 1 \(docs\/llm-wiki\/approvedScaffold\.md\)/);
  }

  const clean = await liteProject("llm-wiki-toggle-verified-clean-", {
    written: wikiDoc({ title: "Written", status: "verified", sourceFiles: ["package.json"] })
  }, { "package.json": "{}\n" });
  const result = await statsCommand(await cliOpts(clean));
  assert.deepEqual(result.stats.verifiedNotEnriched, []);
  assert.doesNotMatch(result.text, /verified_not_enriched/, "the line is printed only when there is something to say");
});

// review restores, for its approval gate, only the rules a mode switched OFF. A
// floor that DEMOTES a rule (error → warning) is not restored, so a demoted
// document-level rule would let lite or standard approve what strict refuses — the
// N-21 class again, by another route. Today the only demotions cannot decide the
// approval of a needs_review document: structure.required_doc names a document that
// does not exist, and impact.source_changed concerns verified documents. A new
// demotion has to be added here, with its reason, or restored by review.
test("a mode floor demotes a rule only where review's approval cannot depend on it", () => {
  const demotable = new Set(["structure.required_doc", "impact.source_changed"]);
  for (const mode of GOVERNANCE_MODES) {
    for (const [rule, severity] of Object.entries(getGovernancePolicy(mode).rules)) {
      if (severity === "off") continue;
      assert.ok(demotable.has(rule), `${mode} floor sets ${rule} to ${severity}`);
    }
  }
});
