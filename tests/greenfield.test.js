// Greenfield support: a project that starts before its code does. Pins the three
// properties the feature exists for, not the template prose:
//   1. An empty repository's scaffold claims no source it does not have (the
//      generated documents used to cite a package.json that was not there).
//   2. Planned knowledge (doc_type requirement / decision) stays distinguishable
//      from source-backed knowledge: an approved plan is info, never a defect and
//      never "implemented"; a resolving reference is "linked", never "complete".
//   3. The same documents converge on the existing engine once code exists:
//      validate resolves the evidence, impact watches it, search finds it.
// And the brownfield side: without --greenfield, a repository with a manifest
// gets the same scaffold it got before.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  explainCommand,
  handoffCommand,
  impactCommand,
  initCommand,
  quickstartCommand,
  reviewCommand,
  searchDocsCommand,
  statsCommand,
  validateCommand
} from "../src/commands.js";
import { normalizeOptions, resolveOptions } from "../src/index.js";
import { GREENFIELD_DOCS } from "../src/config.js";
import { parseFrontmatter } from "../src/frontmatter.js";
import { DECISION_DOC_TYPES } from "../src/commands/governance-mode.js";
import { PLANNED_DOC_TYPES } from "../src/commands/scans.js";
import { governanceBudget, greenfieldPlanningWorkflow } from "../src/task-prompts.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "llm-wiki.js");
const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

async function emptyRepo(prefix = "llm-wiki-greenfield-") {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

function opts(cwd, extra = {}) {
  return normalizeOptions({ cwd, agents: [], profiles: [], ...extra });
}

// The options the CLI would run with: llm-wiki.config.json merged in, so the mode
// init recorded (and its rule floor) applies.
async function cliOpts(cwd, extra = {}) {
  const { options, errors } = await resolveOptions({ cwd, agents: [], profiles: [], ...extra });
  assert.deepEqual(errors, []);
  return options;
}

async function frontmatterOf(cwd, rel) {
  return parseFrontmatter(await readFile(path.join(cwd, ...rel.split("/")), "utf8")).frontmatter;
}

async function wikiFiles(cwd) {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".md")) out.push(path.relative(cwd, full).split(path.sep).join("/"));
    }
  }
  await walk(path.join(cwd, "docs", "llm-wiki"));
  return out.sort();
}

function plannedDoc({ status = "needs_review", docType = "requirement", sourceFiles = "source_files: []", evidence = [], extra = [] } = {}) {
  return [
    "---", "title: REQ-001 Approval before agent run", "tags:", "  - llm-wiki", `status: ${status}`,
    `doc_type: ${docType}`, "project: gf", "last_updated: 2026-10-27", "author: human", "last_edited_by: t",
    ...extra, "wiki_block_version: v1", sourceFiles,
    ...(evidence.length ? ["evidence:", ...evidence.map((item) => `  - ${item}`)] : []),
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal", "contains_sensitive_info: false", "---", "",
    "# REQ-001 Approval before agent run", "",
    "## Requirement", "", "- An AI coding agent must not start a task until an authorized developer approves it.", "",
    "## Acceptance Criteria", "", "- AC-1: a task that is not approved cannot start an agent run.", "",
    "## Evidence", "", ...(evidence.length ? evidence.map((item) => `- ${item}`) : ["- None yet."]), ""
  ].join("\n");
}

const VERIFIED_STAMP = ["reviewed_by: Fixture Reviewer", "reviewed_at: 2026-10-27"];

async function writeDoc(cwd, rel, text) {
  await mkdir(path.dirname(path.join(cwd, ...rel.split("/"))), { recursive: true });
  await writeFile(path.join(cwd, ...rel.split("/")), text, "utf8");
}

// ---- 1. no fabricated source ------------------------------------------------

test("init on an empty repository cites no source instead of a package.json that is not there", async () => {
  const cwd = await emptyRepo();
  const result = await initCommand(opts(cwd, { write: true }));
  assert.equal(result.result, "pass");
  // The reported detection keeps its shape (a contract); only rendering changed.
  assert.equal(result.detection.primaryManifest, "package.json");
  for (const rel of await wikiFiles(cwd)) {
    const frontmatter = await frontmatterOf(cwd, rel);
    assert.deepEqual(frontmatter.source_files, [], `${rel} cites no source`);
  }
  assert.match(result.text, /No manifest exists yet: generated documents cite no source/);
  const log = await readFile(path.join(cwd, "docs", "llm-wiki", "log.md"), "utf8");
  assert.doesNotMatch(log, /^  - package\.json$/m);
  assert.match(log, /none: no application source or manifest existed/);

  // The source check is structural, so it runs whatever the mode; with the config
  // init recorded (lite) the fresh scaffold passes strict validation.
  const legacy = await validateCommand(opts(cwd, { strict: true }));
  assert.deepEqual(legacy.findings.filter((finding) => finding.rule === "source_files.missing"), []);
  const validated = await validateCommand(await cliOpts(cwd, { strict: true }));
  assert.equal(validated.result, "pass", JSON.stringify(validated.findings));

  const stats = await statsCommand(opts(cwd));
  assert.equal(stats.stats.evidenceBacked, 0, "an empty repository is not 100% evidence-backed");
});

test("brownfield: with a manifest and no --greenfield the scaffold is unchanged (the decision template aside)", async () => {
  const cwd = await emptyRepo("llm-wiki-brownfield-");
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "bf", dependencies: { vue: "^3.0.0" } }, null, 2)}\n`, "utf8");
  const result = await initCommand(opts(cwd, { write: true, minimal: true }));
  assert.equal(result.result, "pass");
  assert.equal("greenfield" in result, false, "no greenfield key in a non-greenfield report");
  assert.doesNotMatch(result.text, /Starting Point/);
  for (const rel of GREENFIELD_DOCS) assert.equal(existsSync(path.join(cwd, ...rel.split("/"))), false, `${rel} not created`);
  assert.deepEqual((await frontmatterOf(cwd, "docs/llm-wiki/project-profile.md")).source_files, ["package.json"]);
  const index = await readFile(path.join(cwd, "docs", "llm-wiki", "index.md"), "utf8");
  assert.doesNotMatch(index, /requirements\/00_overview\.md/);
  const log = await readFile(path.join(cwd, "docs", "llm-wiki", "log.md"), "utf8");
  assert.match(log, /^  - package\.json$/m);
  // 1.38.0: every init writes the ADR skeleton, citing no source, so a decision
  // copied from it in an existing codebase starts unlinked too.
  const decision = await readFile(path.join(cwd, "docs", "llm-wiki", "templates", "DECISION_LOG.template.md"), "utf8");
  assert.match(decision, /# ADR-NNNN/);
  assert.match(decision, /## Alternatives Considered/);
  assert.deepEqual((await frontmatterOf(cwd, "docs/llm-wiki/templates/DECISION_LOG.template.md")).source_files, []);
  assert.deepEqual(
    (await frontmatterOf(cwd, "docs/llm-wiki/templates/DECISION_LOG.template.md")).related,
    ["docs/llm-wiki/index.md", "docs/llm-wiki/log.md"],
    "no link to a requirement template that a non-greenfield init does not create"
  );
  const stats = await statsCommand(opts(cwd));
  assert.deepEqual(stats.stats.plannedKnowledge, { documents: 0, approved: 0, linked: 0, unresolved: 0, unlinked: 0 });
  assert.doesNotMatch(stats.text, /planned_knowledge/, "no planned line for a wiki without planned documents");
});

// ---- greenfield scaffold -----------------------------------------------------

test("init --greenfield previews first, then adds the planning documents", async () => {
  const cwd = await emptyRepo();
  const preview = await initCommand(opts(cwd, { dryRun: true, greenfield: true }));
  assert.equal(preview.greenfield, true);
  for (const rel of GREENFIELD_DOCS) assert.ok(preview.planned.some((line) => line.startsWith(`${rel} would be created`)), rel);
  assert.equal(existsSync(path.join(cwd, "docs")), false, "dry run writes nothing");

  const result = await initCommand(opts(cwd, { write: true, greenfield: true }));
  assert.equal(result.result, "pass");
  for (const rel of GREENFIELD_DOCS) assert.ok(existsSync(path.join(cwd, ...rel.split("/"))), `${rel} created`);
  assert.equal((await frontmatterOf(cwd, "docs/llm-wiki/requirements/00_overview.md")).doc_type, "requirements_overview");
  const profile = await readFile(path.join(cwd, "docs", "llm-wiki", "project-profile.md"), "utf8");
  assert.match(profile, /## Scope/);
  assert.match(profile, /## Constraints/);
  assert.match(profile, /stage: greenfield/);
  const decision = await readFile(path.join(cwd, "docs", "llm-wiki", "templates", "DECISION_LOG.template.md"), "utf8");
  assert.match(decision, /# ADR-NNNN/);
  assert.match(decision, /doc_type: decision/);
  const requirement = await readFile(path.join(cwd, "docs", "llm-wiki", "templates", "REQUIREMENT.template.md"), "utf8");
  assert.match(requirement, /## Acceptance Criteria/);
  assert.match(requirement, /doc_type: requirement/);
  const index = await readFile(path.join(cwd, "docs", "llm-wiki", "index.md"), "utf8");
  assert.match(index, /\[Requirements\]\(\.\/requirements\/00_overview\.md\)/);

  // Every generated link and related entry resolves, so strict validation passes in
  // the mode init recorded.
  assert.equal(JSON.parse(await readFile(path.join(cwd, "llm-wiki.config.json"), "utf8")).governance.mode, "lite");
  const validated = await validateCommand(await cliOpts(cwd, { strict: true }));
  assert.equal(validated.result, "pass", JSON.stringify(validated.findings));
  const linkFindings = (await validateCommand(opts(cwd, { mode: "strict" }))).findings
    .filter((finding) => ["markdown_link.missing", "related.missing", "source_files.missing"].includes(finding.rule));
  assert.deepEqual(linkFindings, []);
  // The unfilled planning docs still read as scaffolds where the rule runs.
  const audited = await validateCommand(opts(cwd, { mode: "strict" }));
  const unenriched = new Set(audited.findings.filter((finding) => finding.rule === "content.not_enriched").map((finding) => finding.path));
  assert.ok(unenriched.has("docs/llm-wiki/project-profile.md"));
  assert.ok(unenriched.has("docs/llm-wiki/requirements/00_overview.md"));
});

test("init --greenfield is idempotent and never overwrites an existing file", async () => {
  const cwd = await emptyRepo();
  await writeDoc(cwd, "docs/llm-wiki/project-profile.md", "---\ntitle: Mine\n---\n\n# Mine\n");
  const first = await initCommand(opts(cwd, { write: true, greenfield: true }));
  assert.ok(first.skipped.some((line) => line.startsWith("docs/llm-wiki/project-profile.md exists")));
  assert.equal(await readFile(path.join(cwd, "docs", "llm-wiki", "project-profile.md"), "utf8"), "---\ntitle: Mine\n---\n\n# Mine\n");
  const before = await readFile(path.join(cwd, "docs", "llm-wiki", "requirements", "00_overview.md"), "utf8");
  const second = await initCommand(opts(cwd, { write: true, greenfield: true }));
  assert.deepEqual(second.created, []);
  assert.equal(await readFile(path.join(cwd, "docs", "llm-wiki", "requirements", "00_overview.md"), "utf8"), before);
});

test("templates cite no source even when a manifest exists, so a copied requirement starts unlinked", async () => {
  const cwd = await emptyRepo();
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "gf" })}\n`, "utf8");
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  assert.deepEqual((await frontmatterOf(cwd, "docs/llm-wiki/templates/REQUIREMENT.template.md")).source_files, []);
  assert.deepEqual((await frontmatterOf(cwd, "docs/llm-wiki/templates/DECISION_LOG.template.md")).source_files, []);
  assert.deepEqual((await frontmatterOf(cwd, "docs/llm-wiki/project-profile.md")).source_files, ["package.json"], "a real manifest is still cited");
});

test("the first log entry cites the manifest that was detected, not package.json", async () => {
  const cwd = await emptyRepo("llm-wiki-pyproject-");
  await writeFile(path.join(cwd, "pyproject.toml"), "[project]\nname = \"py-demo\"\n", "utf8");
  const result = await initCommand(opts(cwd, { write: true }));
  assert.equal(result.detection.primaryManifest, "pyproject.toml", "guard: the Python manifest is the primary one");
  const log = await readFile(path.join(cwd, "docs", "llm-wiki", "log.md"), "utf8");
  assert.match(log, /^  - pyproject\.toml$/m);
  assert.doesNotMatch(log, /package\.json/);
  assert.deepEqual((await frontmatterOf(cwd, "docs/llm-wiki/project-profile.md")).source_files, ["pyproject.toml"]);
});

test("init --greenfield --doc-lang ko writes Korean prose under verbatim headings", async () => {
  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true, docLang: "ko" }));
  const requirement = await readFile(path.join(cwd, "docs", "llm-wiki", "templates", "REQUIREMENT.template.md"), "utf8");
  assert.match(requirement, /## Acceptance Criteria/);
  assert.match(requirement, /수용 기준/);
  const profile = await readFile(path.join(cwd, "docs", "llm-wiki", "project-profile.md"), "utf8");
  assert.match(profile, /비목표/);
});

// ---- 2. planned knowledge stays distinct ---------------------------------------

test("an approved requirement with nothing linked is info, not evidence.ungrounded, and does not fail --strict", async () => {
  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  await writeDoc(cwd, "docs/llm-wiki/requirements/REQ-001-approval.md", plannedDoc({ status: "verified", extra: VERIFIED_STAMP }));
  // A descriptive verified document with no grounding keeps the warning.
  await writeDoc(cwd, "docs/llm-wiki/NOTES.md", plannedDoc({ status: "verified", docType: "notes", extra: VERIFIED_STAMP }));

  const notesUngrounded = (result) => result.findings.some((finding) => finding.rule === "evidence.ungrounded" && finding.path === "docs/llm-wiki/NOTES.md");
  for (const mode of ["strict", "standard", "lite"]) {
    const result = await validateCommand(await cliOpts(cwd, { mode, strict: true }));
    const planned = result.findings.filter((finding) => finding.rule === "evidence.planned_unlinked");
    assert.deepEqual(planned.map((finding) => [finding.path, finding.severity]), [["docs/llm-wiki/requirements/REQ-001-approval.md", "info"]], mode);
    assert.equal(result.findings.some((finding) => finding.rule === "evidence.ungrounded" && finding.path.includes("REQ-001")), false, mode);
    assert.deepEqual(result.findings.filter((finding) => finding.path.includes("REQ-001") && finding.severity !== "info"), [], `${mode}: nothing on the approved plan can fail --strict`);
    // Descriptive documents are unaffected: the warning stays wherever the mode keeps the rule.
    assert.equal(notesUngrounded(result), mode !== "lite", `${mode}: evidence.ungrounded on a descriptive doc`);
  }

  const explained = await explainCommand(opts(cwd, { findingRule: "evidence.planned_unlinked" }));
  assert.equal(explained.explanation.defaultSeverity, "info");
});

test("every decision doc type counts as planned knowledge, and an external-only reference is not implementation evidence", async () => {
  for (const docType of DECISION_DOC_TYPES) assert.ok(PLANNED_DOC_TYPES.has(docType), docType);
  assert.ok(PLANNED_DOC_TYPES.has("requirement"));

  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  await writeDoc(cwd, "docs/llm-wiki/decisions/ADR-0001-domain-module.md", plannedDoc({
    status: "verified", docType: "decision", extra: VERIFIED_STAMP,
    sourceFiles: "source_files:\n  - https://example.com/product-brief"
  }));
  const result = await validateCommand(opts(cwd, { mode: "strict" }));
  assert.ok(result.findings.some((finding) => finding.rule === "evidence.planned_unlinked" && finding.path === "docs/llm-wiki/decisions/ADR-0001-domain-module.md"));
});

test("stats counts planned documents by approval and by linked, unresolved, or no evidence — even in lite", async () => {
  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await writeFile(path.join(cwd, "src", "approval.ts"), "export function canStartAgentRun() { return false; }\n", "utf8");
  await writeDoc(cwd, "docs/llm-wiki/requirements/REQ-001-a.md", plannedDoc({ status: "verified", extra: VERIFIED_STAMP }));
  await writeDoc(cwd, "docs/llm-wiki/requirements/REQ-002-b.md", plannedDoc({ evidence: ["src/approval.ts#symbol:canStartAgentRun"] }));
  // lite turns evidence.missing off; the count must not mistake silence for a link.
  await writeDoc(cwd, "docs/llm-wiki/requirements/REQ-003-c.md", plannedDoc({ evidence: ["src/missing.ts"] }));
  await writeDoc(cwd, "docs/llm-wiki/requirements/REQ-004-d.md", plannedDoc({ evidence: ["src/approval.ts:1-1"] }));

  const stats = await statsCommand(opts(cwd, { mode: "lite", rules: { "evidence.missing": "off" } }));
  assert.deepEqual(stats.stats.plannedKnowledge, { documents: 4, approved: 1, linked: 2, unresolved: 1, unlinked: 1 });
  assert.match(stats.text, /planned_knowledge: 4 \(approved 1\); implementation evidence linked 2, unresolved 1, none 1/);
  assert.match(stats.text, /verified means the plan was approved, not that it is implemented/);
});

test("review labels a requirement without evidence planned, not no-evidence", async () => {
  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  await writeDoc(cwd, "docs/llm-wiki/requirements/REQ-001-a.md", plannedDoc());
  const listed = await reviewCommand(await cliOpts(cwd));
  const requirement = listed.documents.find((doc) => doc.path === "docs/llm-wiki/requirements/REQ-001-a.md");
  assert.equal(requirement.planned, true);
  assert.equal(requirement.evidenceBacked, false, "the evidence fact itself is unchanged");
  const line = listed.text.split("\n").find((text) => text.includes("REQ-001-a.md"));
  assert.match(line, /planned/);
  assert.doesNotMatch(line, /no-evidence/);
  assert.match(listed.text, /approving it approves the plan, not an implementation/);
  // A descriptive document with no evidence keeps the old flag.
  const profile = listed.text.split("\n").find((text) => text.includes("docs/llm-wiki/project-profile.md"));
  assert.match(profile, /no-evidence/);
});

test("the frontmatter parser reads `key: []` as an empty list and leaves other inline lists alone", () => {
  const { frontmatter } = parseFrontmatter("---\nsource_files: []\nevidence: [ ]\ntags: [a, b]\n---\n");
  assert.deepEqual(frontmatter.source_files, []);
  assert.deepEqual(frontmatter.evidence, []);
  assert.equal(frontmatter.tags, "[a, b]", "only the empty flow sequence is read");
});

// ---- 3. convergence on the existing engine -------------------------------------

test("linking evidence later: validate resolves it, the info clears, and impact watches the requirement", { skip: !hasGit() }, async () => {
  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  const rel = "docs/llm-wiki/requirements/REQ-001-approval.md";
  await writeDoc(cwd, rel, plannedDoc());
  const approved = await reviewCommand(opts(cwd, { approve: [rel], reviewer: "Fixture Reviewer" }));
  assert.deepEqual(approved.approved, [rel], JSON.stringify(approved.refused));

  // Code appears; the requirement links it and goes back to review.
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await mkdir(path.join(cwd, "tests"), { recursive: true });
  await writeFile(path.join(cwd, "src", "approval.ts"), "export function canStartAgentRun(t: { s: string }) { return t.s === \"approved\"; }\n", "utf8");
  await writeFile(path.join(cwd, "tests", "approval.test.ts"), "// checks AC-1\n", "utf8");
  await writeDoc(cwd, rel, plannedDoc({ evidence: ["src/approval.ts#symbol:canStartAgentRun", "tests/approval.test.ts"] }));
  const linked = await validateCommand(opts(cwd, { strict: true, mode: "strict" }));
  assert.deepEqual(linked.findings.filter((finding) => finding.path === rel), [], JSON.stringify(linked.findings));
  const reapproved = await reviewCommand(opts(cwd, { approve: [rel], reviewer: "Fixture Reviewer" }));
  assert.deepEqual(reapproved.approved, [rel]);
  assert.equal((await validateCommand(opts(cwd, { mode: "strict" }))).findings.some((finding) => finding.rule === "evidence.planned_unlinked"), false);

  execFileSync("git", ["init", "-q"], { cwd, stdio: "ignore" });
  execFileSync("git", ["add", "-A"], { cwd, stdio: "ignore", env: GIT_ENV });
  execFileSync("git", ["-c", "commit.gpgsign=false", "commit", "-q", "-m", "linked"], { cwd, stdio: "ignore", env: GIT_ENV });
  await writeFile(path.join(cwd, "src", "approval.ts"), "export function canStartAgentRun(t: { s: string; by?: string }) { return t.s === \"approved\" && Boolean(t.by); }\n", "utf8");
  const impact = await impactCommand(opts(cwd, { since: "HEAD", mode: "strict" }));
  const flagged = impact.findings.filter((finding) => finding.rule === "impact.source_changed").map((finding) => finding.path);
  assert.deepEqual(flagged, [rel]);
});

test("search finds a requirement by its words, with and without --all-terms", async () => {
  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  const rel = "docs/llm-wiki/requirements/REQ-001-approval.md";
  await writeDoc(cwd, rel, plannedDoc());
  for (const allTerms of [false, true]) {
    const result = await searchDocsCommand(opts(cwd, { query: "authorized developer approves", allTerms }));
    assert.equal(result.matches[0]?.path, rel, `allTerms=${allTerms}`);
  }
});

// ---- handoff / quickstart -------------------------------------------------------

test("quickstart on a new repository names the mode it actually records (lite), with or without --greenfield", async () => {
  for (const greenfield of [false, true]) {
    const cwd = await emptyRepo();
    const result = await quickstartCommand(opts(cwd, { write: true, greenfield, agents: ["claude"] }));
    const config = JSON.parse(await readFile(path.join(cwd, "llm-wiki.config.json"), "utf8"));
    assert.equal(config.governance.mode, "lite");
    assert.equal(result.handoff.governanceMode, "lite", `greenfield=${greenfield}`);
    assert.match(result.text, /Governance mode: lite[.\s]/);
    // 1.42.0: outside greenfield, say that lite switched the change checks off.
    if (!greenfield) assert.match(result.text, /change checks are off: impact and drift report nothing/);
  }
});

test("handoff --greenfield prints the planning prompt: record what the user states, cite nothing that does not exist", async () => {
  const cwd = await emptyRepo();
  await initCommand(opts(cwd, { write: true, greenfield: true }));
  const result = await handoffCommand(opts(cwd, { greenfield: true, agents: ["claude"] }));
  assert.equal(result.handoff.greenfield, true);
  assert.match(result.handoff.prompt, /Do not invent a requirement, an acceptance criterion, a constraint, or a decision/);
  assert.match(result.handoff.prompt, /Cite no source that does not exist/);
  assert.match(result.handoff.prompt, /Do not promote anything to verified/);
  assert.doesNotMatch(result.handoff.prompt, /Investigate the actual code/);
  assert.equal(greenfieldPlanningWorkflow({ docLang: "ko" }).startsWith("Documentation language: write all LLM-WIKI document content"), true);

  const plain = await handoffCommand(opts(cwd, { agents: ["claude"] }));
  assert.equal("greenfield" in plain.handoff, false);
  assert.match(plain.handoff.prompt, /Investigate the actual code/);
});

test("every governance budget tells an agent to link the evidence of a requirement it implements", () => {
  for (const mode of ["lite", "standard", "strict"]) {
    assert.match(governanceBudget(mode).join("\n"), /requirement document/, mode);
  }
});

test("CLI: --greenfield is accepted by init, quickstart, and handoff, and rejected elsewhere", async () => {
  const cwd = await emptyRepo();
  const run = (...args) => spawnSync(process.execPath, [cli, ...args, "--cwd", cwd], { encoding: "utf8" });
  assert.equal(run("init", "--dry-run", "--greenfield").status, 0);
  assert.equal(run("quickstart", "--dry-run", "--greenfield").status, 0);
  assert.equal(run("handoff", "--greenfield", "--agent", "claude").status, 0);
  const rejected = run("validate", "--greenfield");
  assert.equal(rejected.status, 3, rejected.stderr);
  const help = spawnSync(process.execPath, [cli, "help", "init"], { encoding: "utf8" });
  assert.match(help.stdout, /--greenfield/);
});
