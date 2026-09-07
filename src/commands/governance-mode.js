// The `mode` command and the analysis half of `backfill` (2026-09-07).
//
// `modeCommand` lives here in full: it reads the config and prints policy, so it
// needs nothing from commands.js. `backfillCommand` stays in commands.js because
// it COMPOSES other commands (init for the stubs, the scan family for coverage) —
// the same reason quickstartCommand lives there and the same reason this file must
// not import commands.js. Everything backfill needs that is analysis rather than
// composition is exported from here.
//
// The evidence discipline in this file is the product requirement, not a style
// choice. `backfill` exists to make a months-old lite repository handoff-ready,
// and the tempting way to do that is to write a confident story about the project.
// This module therefore reports three kinds of thing and keeps them apart:
//
//   verified  read from the current source, tests, or configuration
//   inferred  derived from directory boundaries, naming, or git history
//   unknown   the repository cannot answer it, and it stays unanswered
//
// Nothing here composes prose. The CLI measures; the printed prompt hands the
// writing to an agent under the same three labels.
import path from "node:path";
import { writeFile } from "node:fs/promises";
import { pathExists, toPosix } from "../files.js";
import { readTextAuto, readUtf8 } from "../encoding.js";
import { CONFIG_FILENAME, loadProjectConfig } from "../config-file.js";
import { VALID_STATUSES } from "../config.js";
import { parseFrontmatter } from "../frontmatter.js";
import { isAppendOnlyLog, listTargetMarkdown, isTemplateDoc } from "./wiki-files.js";
import { detectDomainDirectories, detectFrontendDomains, planDomainDocs } from "./domains.js";
import { runGit, trackedPaths } from "../git.js";
import { withText } from "./findings.js";
import {
  GOVERNANCE_MODES,
  LEGACY_GOVERNANCE_MODE,
  describeModeTransition,
  effectiveGovernanceMode,
  effectiveGovernancePolicy,
  getGovernancePolicy,
  governanceCapabilityMatrix,
  governanceModeSource
} from "../governance.js";

// ---- mode -----------------------------------------------------------------

export async function modeCommand(options) {
  const cwd = options.cwd;
  const configFile = path.join(cwd, CONFIG_FILENAME);
  const { found, config, errors } = await loadProjectConfig(cwd);
  const effective = effectiveGovernanceMode(options);
  const source = governanceModeSource(options);
  const policy = getGovernancePolicy(effective);
  const onDisk = config?.governance?.mode ?? null;

  if (options.modeAction !== "set") {
    return modeReport({ options, effective, source, policy, onDisk, found, configFile });
  }

  const requested = options.mode;
  const transition = describeModeTransition(onDisk ?? LEGACY_GOVERNANCE_MODE, requested);
  const write = options.write === true;

  // A malformed config is a refusal, not a rewrite. Writing would mean parsing
  // failed and we invented a replacement file, silently discarding whatever the
  // user actually wrote in it.
  if (found && errors.length > 0) {
    return withText({
      command: "mode",
      result: "blocked",
      mode: effective,
      requestedMode: requested,
      source,
      policy: describePolicy(policy),
      capabilities: governanceCapabilityMatrix(),
      transition,
      configPath: toPosix(path.relative(cwd, configFile)) || CONFIG_FILENAME,
      written: false,
      planned: [],
      findings: errors.map((message) => ({ severity: "blocked", rule: "structure.config_invalid", path: CONFIG_FILENAME, message }))
    }, "LLM-WIKI Governance Mode — Blocked", [
      { title: "Blocked", body: [`${CONFIG_FILENAME} could not be parsed, so the mode was not changed. Fix the file and re-run.`, ...errors] }
    ]);
  }

  const planned = [`${CONFIG_FILENAME}: governance.mode = "${requested}"${onDisk ? ` (was "${onDisk}")` : found ? " (key added)" : " (file created)"}.`];

  if (!write) {
    return withText({
      command: "mode",
      result: "ready",
      mode: effective,
      requestedMode: requested,
      source,
      policy: describePolicy(getGovernancePolicy(requested)),
      capabilities: governanceCapabilityMatrix(),
      transition,
      configPath: toPosix(path.relative(cwd, configFile)) || CONFIG_FILENAME,
      written: false,
      planned,
      findings: []
    }, "LLM-WIKI Governance Mode — Ready (needs --write)", [
      { title: "Transition", body: transition },
      { title: "Planned Config Change", body: planned },
      { title: "Next Step", body: [`Nothing was written. Re-run with: llm-wiki mode set ${requested} --write`] },
      { title: "Caveats", body: modeSetCaveats(requested) }
    ]);
  }

  const raw = found ? await readTextAuto(configFile) : "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) parsed = {};
  // Only `governance.mode` is touched; every other key (and any key this version
  // does not know about) is written back as-is.
  const next = { ...parsed, governance: { ...(parsed.governance && typeof parsed.governance === "object" && !Array.isArray(parsed.governance) ? parsed.governance : {}), mode: requested } };
  await writeFile(configFile, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8" });

  return withText({
    command: "mode",
    result: "pass",
    mode: requested,
    requestedMode: requested,
    source: "config",
    policy: describePolicy(getGovernancePolicy(requested)),
    capabilities: governanceCapabilityMatrix(),
    transition,
    configPath: toPosix(path.relative(cwd, configFile)) || CONFIG_FILENAME,
    written: true,
    planned: [],
    findings: []
  }, "LLM-WIKI Governance Mode Changed", [
    { title: "Transition", body: transition },
    { title: "Written", body: planned },
    { title: "Next Step", body: modeSetNextSteps(requested) },
    { title: "Caveats", body: modeSetCaveats(requested) }
  ]);
}

function modeReport({ options, effective, source, policy, onDisk, found, configFile }) {
  const cwd = options.cwd;
  const summary = [
    `mode: ${effective}`,
    `source: ${describeSource(source)}`,
    `config_file: ${found ? "present" : "absent"}${onDisk ? ` (governance.mode = ${onDisk})` : found ? " (no governance block)" : ""}`,
    `intent: ${policy.intent}`
  ];

  return withText({
    command: "mode",
    result: "pass",
    mode: effective,
    requestedMode: null,
    source,
    policy: describePolicy(policy),
    capabilities: governanceCapabilityMatrix(),
    transition: [],
    configPath: toPosix(path.relative(cwd, configFile)) || CONFIG_FILENAME,
    written: false,
    planned: [],
    findings: []
  }, "LLM-WIKI Governance Mode", [
    { title: "Summary", body: summary },
    { title: "What This Mode Does", body: [policy.summary] },
    { title: "Rule Floor", body: formatRuleFloor(policy) },
    { title: "Capability Matrix", body: formatCapabilityMatrix() },
    { title: "Change It", body: [
      `llm-wiki mode set <${GOVERNANCE_MODES.join("|")}> --write`,
      "Changing the mode writes one config key and runs no scan. The expensive reconstruction is a separate, explicit: llm-wiki backfill"
    ] }
  ]);
}

function describeSource(source) {
  if (source === "cli") return "--mode (this invocation only)";
  if (source === "config") return `${CONFIG_FILENAME} governance.mode`;
  return `default (no governance.mode set; legacy projects resolve to ${LEGACY_GOVERNANCE_MODE} so behavior is unchanged)`;
}

function describePolicy(policy) {
  return {
    mode: policy.mode,
    intent: policy.intent,
    summary: policy.summary,
    profileDocs: policy.profileDocs,
    domainDocs: policy.domainDocs,
    rules: { ...policy.rules },
    docsSync: policy.docsSync,
    driftDetection: policy.driftDetection,
    verification: policy.verification,
    sourceTracking: policy.sourceTracking,
    governanceCi: policy.governanceCi,
    fullAudit: policy.fullAudit,
    backfill: policy.backfill,
    handoffReadiness: policy.handoffReadiness
  };
}

function formatRuleFloor(policy) {
  const entries = Object.entries(policy.rules);
  if (entries.length === 0) {
    return ["none — the finding registry's own default severities apply (this is the pre-modes baseline)."];
  }
  return [
    ...entries.map(([rule, action]) => `${rule}: ${action}`),
    "A floor only: llm-wiki.config.json rulesPreset overrides it, and an explicit rules entry overrides both. Safety rules (sensitive.*) are never dialed by any mode."
  ];
}

function formatCapabilityMatrix() {
  const rows = governanceCapabilityMatrix();
  const width = Math.max(...rows.map((row) => row.capability.length));
  const head = `${"capability".padEnd(width)} | lite | standard | strict`;
  return [
    head,
    "-".repeat(head.length),
    ...rows.map((row) => `${row.capability.padEnd(width)} | ${row.values.lite} | ${row.values.standard} | ${row.values.strict}`)
  ];
}

function modeSetNextSteps(mode) {
  if (mode === "strict") {
    return [
      "Strict governance is now enabled. Nothing was scanned or generated — escalation is instant by design.",
      "Reconstruct what lite did not keep: llm-wiki backfill",
      "Create the missing document stubs: llm-wiki backfill --write",
      "Then fill them from source evidence: llm-wiki prompt --task backfill (or the printed prompt), and finally llm-wiki handoff --agent claude"
    ];
  }
  if (mode === "lite") {
    return [
      "Lite governance is now enabled. Existing documents are untouched — lite changes what is EXPECTED, not what exists.",
      "Regenerate the agent skills so they carry the lite workflow: llm-wiki init --write --skills --refresh",
      "Escalate whenever completeness matters again: llm-wiki mode set strict --write"
    ];
  }
  return [
    "Standard governance is now enabled: the drift and impact detection still report, but they no longer fail a build by default.",
    "Regenerate the agent skills so they carry the standard workflow: llm-wiki init --write --skills --refresh",
    "Escalate before a handoff: llm-wiki mode set strict --write, then llm-wiki backfill"
  ];
}

function modeSetCaveats(mode) {
  return [
    "The mode changes policy, never content: no document is created, edited, promoted, or demoted by this command.",
    "Generated agent skills embed the workflow of the mode that was active when they were written. Re-run init --write --skills --refresh so an agent reads the new one.",
    `Governance CI: ${getGovernancePolicy(mode).governanceCi}. Check what your pipeline actually enforces with: llm-wiki doctor`
  ];
}

// ---- backfill: inventory --------------------------------------------------

// What the repository ACTUALLY contains, measured. Every field carries its own
// confidence, because the difference between "package.json says this is a
// library" (verified) and "there is a directory called domains" (inferred) is the
// difference between a handoff document and a plausible fiction.
export async function collectRepositoryInventory(cwd, detection) {
  const tracked = trackedPaths(cwd, ".");
  const gitAvailable = tracked !== null;
  const files = tracked ? [...tracked] : [];
  const sourceFiles = files.filter(isSourceLikePath);
  const testFiles = files.filter(isTestLikePath);
  const manifests = files.filter((rel) => MANIFEST_NAMES.has(path.posix.basename(rel)));
  const projectType = detection?.projectType ?? "unknown";

  return {
    gitAvailable,
    trackedFiles: gitAvailable ? files.length : null,
    sourceFiles: gitAvailable ? sourceFiles.length : null,
    testFiles: gitAvailable ? testFiles.length : null,
    manifests: manifests.sort(),
    extensions: gitAvailable ? topExtensions(sourceFiles) : [],
    history: gitAvailable ? readHistory(cwd) : { available: false, commits: null, firstCommit: null, lastCommit: null },
    projectType,
    confidence: detection?.confidence ?? "unknown",
    domainPlans: await detectDomainPlans(cwd, projectType)
  };
}

// The SAME boundary detectors init plans domain documents with, so backfill's
// inventory and init's document set can never disagree about what a domain is.
// Returns the planned rel path alongside each name, which is what lets the report
// say "this domain exists in the source and has no wiki document" — a measured
// gap, not an opinion about the domain.
async function detectDomainPlans(cwd, projectType) {
  let detected = [];
  try {
    if (projectType === "backend" || projectType === "fullstack") detected = await detectDomainDirectories(cwd);
    else if (projectType === "frontend" || projectType === "mobile") detected = await detectFrontendDomains(cwd);
  } catch {
    return [];
  }
  return planDomainDocs(detected).map((plan) => ({ name: plan.domainName, slug: plan.slug, rel: plan.rel, sourceFiles: plan.sourceFiles }));
}

const MANIFEST_NAMES = new Set([
  "package.json", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml",
  "pom.xml", "build.gradle", "build.gradle.kts", "Gemfile", "composer.json",
  "tsconfig.json", "Dockerfile", "docker-compose.yml", "pubspec.yaml"
]);

const SOURCE_EXTENSIONS = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".vue", ".svelte",
  ".py", ".go", ".rs", ".java", ".kt", ".rb", ".php", ".cs", ".swift", ".dart",
  ".scala", ".c", ".h", ".cc", ".cpp", ".hpp", ".sql"
]);

const VENDOR_SEGMENTS = ["node_modules/", "vendor/", "dist/", "build/", ".venv/", "site-packages/"];

function isSourceLikePath(rel) {
  const posix = toPosix(rel);
  if (VENDOR_SEGMENTS.some((segment) => posix.includes(segment))) return false;
  return SOURCE_EXTENSIONS.has(path.posix.extname(posix).toLowerCase());
}

// Conventional test locations and suffixes only. Deliberately not clever: a
// heuristic that guesses wrong here would inflate a number a receiving developer
// reads as coverage.
function isTestLikePath(rel) {
  const posix = toPosix(rel);
  if (!isSourceLikePath(posix)) return false;
  return /(^|\/)(tests?|spec|__tests__)\//.test(posix) || /\.(test|spec)\.[a-z]+$/.test(posix) || /(^|\/)test_[^/]+$/.test(posix);
}

function topExtensions(files, limit = 5) {
  const counts = new Map();
  for (const rel of files) {
    const ext = path.posix.extname(toPosix(rel)).toLowerCase();
    counts.set(ext, (counts.get(ext) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([ext, count]) => `${ext}: ${count}`);
}

// Best-effort history read. Every failure mode (no git, no commits, a shallow
// clone) resolves to "unavailable" rather than a guess, because a wrong commit
// count in a handoff report is worse than a missing one.
function readHistory(cwd) {
  try {
    const commits = Number.parseInt(runGit(cwd, ["rev-list", "--count", "HEAD"]).trim(), 10);
    const first = runGit(cwd, ["log", "--reverse", "--pretty=format:%ad", "--date=short", "--max-parents=0"]).trim().split("\n")[0] || null;
    const last = runGit(cwd, ["log", "-1", "--pretty=format:%ad", "--date=short"]).trim() || null;
    return { available: Number.isInteger(commits), commits: Number.isInteger(commits) ? commits : null, firstCommit: first, lastCommit: last };
  } catch {
    return { available: false, commits: null, firstCommit: null, lastCommit: null };
  }
}

// ---- backfill: wiki coverage ---------------------------------------------

// Coverage of the wiki against the planned document set, plus the per-document
// facts the readiness checklist needs. Reads each document once.
export async function collectWikiCoverage(cwd, plannedDocs) {
  const wikiEntry = path.join(cwd, "docs", "llm-wiki", "index.md");
  const initialized = await pathExists(wikiEntry);
  const statusCounts = Object.fromEntries([...VALID_STATUSES].map((status) => [status, 0]));
  statusCounts.unknown = 0;

  const missing = [];
  for (const rel of plannedDocs) {
    if (!(await pathExists(path.join(cwd, rel)))) missing.push(rel);
  }

  const documents = [];
  const unmapped = [];
  const decisionDocs = [];
  for (const file of initialized ? await listTargetMarkdown(cwd) : []) {
    const rel = toPosix(path.relative(cwd, file));
    if (isTemplateDoc(rel)) continue;
    // The append-only change log is outside the review scope by design (`review`
    // refuses to stamp it, N-14), so counting it as a needs_review document made
    // the review_backlog readiness check impossible to close in EVERY repository
    // that keeps a log — found by running this command on this repository. A check
    // with no resolution path is the defect class this product has already fixed
    // twice; it does not get to ship a third one.
    if (isAppendOnlyLog(rel)) continue;
    const parsed = parseFrontmatter(await readUtf8(file));
    const frontmatter = parsed.frontmatter ?? {};
    const status = frontmatter.status;
    if (status && VALID_STATUSES.has(status)) statusCounts[status] += 1;
    else statusCounts.unknown += 1;

    const sources = normalizeList(frontmatter.source_files);
    if (sources.length === 0) unmapped.push(rel);
    if (isDecisionDoc(rel, frontmatter)) decisionDocs.push(rel);
    documents.push({ path: rel, status: status ?? "unknown", sourceFiles: sources });
  }

  return {
    initialized,
    plannedCount: plannedDocs.length,
    documentCount: documents.length,
    missing,
    unmapped,
    // Wiki documents plus repository-level records in the conventional locations.
    // Searched OUTSIDE docs/llm-wiki too, because the first run of this command on
    // this repository reported "no decision record" while a 196 KB decision log sat
    // in the root — the check had only looked at the wiki.
    decisionDocs: [...decisionDocs, ...repositoryDecisionRecords(cwd)],
    statusCounts,
    documents
  };
}

// A decision record is identified by its declared doc_type or by the naming
// conventions this package ships (DECISION_LOG / ADR / decisions/). Template
// skeletons are already excluded by the caller — a blank template is not history.
function isDecisionDoc(rel, frontmatter) {
  const docType = String(frontmatter.doc_type ?? frontmatter.type ?? "").toLowerCase();
  if (docType === "decision_log" || docType === "decision" || docType === "adr") return true;
  return DECISION_PATH_RE.test(toPosix(rel).toLowerCase());
}

// The conventional homes for architecture decision records, as a path predicate.
// Deliberately conventions ONLY: this repository keeps its decisions in
// `GATE_REVIEW.md`, and adding a pattern for that name would be overfitting to the
// one repository the check was tested on — which is why the finding below names the
// locations it searched instead of claiming the repository has none.
const DECISION_PATH_RE = /(^|\/)(adr|adrs|decisions?)\/|(^|\/)decisions?\.md$|(^|\/)adr[-_.]|decision[-_]?log/;

// Repository-level records, read from git so untracked scratch files never count.
// Best-effort: with no git, this contributes nothing and the finding's wording
// (which names its own scope) stays true.
function repositoryDecisionRecords(cwd) {
  const tracked = trackedPaths(cwd, ".");
  if (!tracked) return [];
  return [...tracked]
    .map((rel) => toPosix(rel))
    .filter((rel) => rel.toLowerCase().endsWith(".md"))
    .filter((rel) => !rel.startsWith("docs/llm-wiki/"))
    .filter((rel) => !rel.includes("/fixtures/"))
    .filter((rel) => DECISION_PATH_RE.test(rel.toLowerCase()))
    .sort();
}

// The locations the decision-record check actually searches, quoted verbatim in
// every message that reports finding none. A negative claim has to carry its own
// scope: "no decision record HERE" is measurable, "this repository cannot answer
// why" is not — and the second one is what the first version printed.
export const DECISION_RECORD_SCOPE =
  "docs/llm-wiki documents declaring doc_type decision_log/decision/adr, plus docs/adr/, docs/decisions/, adr/, decisions/, DECISIONS.md and ADR-*.md anywhere in the tree";

function normalizeList(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === "string" && entry.trim()).map((entry) => entry.trim());
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

// ---- backfill: evidence ledger + readiness -------------------------------

// The three-label ledger. Each entry is a sentence the CLI can defend from
// something it read; the `unknown` list is the deliberate output of the command,
// not a shortfall in it.
export function buildEvidenceLedger({ inventory, coverage, staleDocs, unresolvedSources }) {
  const verified = [];
  const inferred = [];
  const unknown = [];

  if (inventory.gitAvailable) {
    verified.push(`Tracked files: ${inventory.trackedFiles} (source ${inventory.sourceFiles}, tests ${inventory.testFiles}) — git ls-files.`);
    if (inventory.extensions.length > 0) verified.push(`Source language mix: ${inventory.extensions.join(", ")} — file extensions of tracked source.`);
  } else {
    unknown.push("Repository inventory: git is unavailable here, so file counts, history, and change dates could not be read.");
  }
  if (inventory.manifests.length > 0) {
    verified.push(`Build/dependency manifests: ${inventory.manifests.join(", ")} — present in the tree.`);
  }
  verified.push(`Current wiki state: ${coverage.documentCount} document(s), ${formatCounts(coverage.statusCounts)} — read from frontmatter.`);

  // "explicit" is not a weak detector guess — it means a human declared the type
  // (--type, or `type` in llm-wiki.config.json), which is configuration evidence
  // and ranks above anything the detector infers. Reporting a declared value as
  // "inferred from partial signals" told the reader to distrust the one fact the
  // project had actually stated about itself.
  if (inventory.confidence === "explicit") {
    verified.push(`Project type: ${inventory.projectType} — declared explicitly (--type or llm-wiki.config.json "type"), not inferred.`);
  } else if (inventory.confidence === "high") {
    verified.push(`Project type: ${inventory.projectType} (detector confidence high) — manifest and dependency evidence.`);
  } else {
    inferred.push(`Project type: ${inventory.projectType} (detector confidence ${inventory.confidence}) — inferred from partial signals; confirm before writing it into a handoff.`);
  }
  if (inventory.domainPlans.length > 0) {
    inferred.push(`Domain candidates: ${inventory.domainPlans.map((plan) => plan.name).join(", ")} — inferred from directory/route boundaries only. The BOUNDARY is evidence; the business meaning of each domain is not.`);
    const undocumented = inventory.domainPlans.filter((plan) => !coverage.documents.some((doc) => doc.path === plan.rel));
    if (undocumented.length > 0) {
      unknown.push(`${undocumented.length} domain boundar(ies) exist in the source with no wiki document, so their purpose and business rules are undocumented: ${undocumented.map((plan) => plan.name).join(", ")}.`);
    }
  }
  if (inventory.history.available) {
    inferred.push(`Change history: ${inventory.history.commits} commit(s), ${inventory.history.firstCommit} to ${inventory.history.lastCommit}. History shows WHAT changed and when; a rationale is only present where a commit recorded one.`);
  }

  if (coverage.decisionDocs.length === 0) {
    unknown.push(`Original architectural rationale: no decision record was found in the locations this check searches (${DECISION_RECORD_SCOPE}). If this project records decisions somewhere else, name that file in the handoff; if it records them nowhere, the rationale is unrecoverable and stays unknown — ask the outgoing maintainer.`);
  } else {
    verified.push(`Recorded decisions: ${coverage.decisionDocs.length} document(s) (${coverage.decisionDocs.slice(0, 5).join(", ")}${coverage.decisionDocs.length > 5 ? ", …" : ""}).`);
  }
  if (coverage.missing.length > 0) {
    unknown.push(`${coverage.missing.length} planned document(s) do not exist yet, so the knowledge they would hold is undocumented: ${coverage.missing.slice(0, 8).join(", ")}${coverage.missing.length > 8 ? ", …" : ""}.`);
  }
  if (coverage.unmapped.length > 0) {
    unknown.push(`${coverage.unmapped.length} document(s) declare no source_files, so which code they describe is unrecorded: ${coverage.unmapped.slice(0, 8).join(", ")}${coverage.unmapped.length > 8 ? ", …" : ""}.`);
  }
  if (unresolvedSources.length > 0) {
    unknown.push(`${unresolvedSources.length} source_files entr(ies) do not resolve to a file, so those documents point at code that moved or vanished.`);
  }
  if (staleDocs.length > 0) {
    unknown.push(`${staleDocs.length} verified document(s) cite source that changed after the review date, so their current accuracy is unconfirmed.`);
  }
  if (coverage.statusCounts.needs_review > 0) {
    inferred.push(`${coverage.statusCounts.needs_review} document(s) are needs_review: written but not human-approved. Treat their content as a draft, not as project fact.`);
  }

  return { verified, inferred, unknown };
}

// The readiness checklist. Deliberately boolean and small: a percentage invites a
// team to ship at 80% without knowing which fifth is missing, while a named
// incomplete check tells the receiving developer exactly what they will not be
// told. Ordered from "nothing to hand over" to "polish".
export function gradeHandoffReadiness({ inventory, coverage, staleDocs, unresolvedSources, notEnrichedDocs, brokenLinks, policy }) {
  const checks = [
    { key: "wiki_initialized", ok: coverage.initialized, detail: coverage.initialized ? "docs/llm-wiki/index.md exists." : "docs/llm-wiki/index.md is missing — run init --write first." },
    { key: "planned_docs_present", ok: coverage.missing.length === 0, detail: coverage.missing.length === 0 ? `all ${coverage.plannedCount} planned document(s) exist.` : `${coverage.missing.length} of ${coverage.plannedCount} planned document(s) missing.` },
    { key: "documents_enriched", ok: notEnrichedDocs.length === 0, detail: notEnrichedDocs.length === 0 ? "no document still holds generated placeholder text." : `${notEnrichedDocs.length} document(s) still hold generated placeholder text.` },
    { key: "source_mapping", ok: coverage.unmapped.length === 0 && unresolvedSources.length === 0, detail: `${coverage.unmapped.length} document(s) with no source_files, ${unresolvedSources.length} unresolved source path(s).` },
    { key: "evidence_fresh", ok: staleDocs.length === 0, detail: staleDocs.length === 0 ? "no verified document cites source that changed after its review." : `${staleDocs.length} verified document(s) have drifted from their cited source.` },
    { key: "link_integrity", ok: brokenLinks === 0, detail: brokenLinks === 0 ? "no broken document links." : `${brokenLinks} broken document link(s).` },
    { key: "review_backlog", ok: coverage.statusCounts.needs_review === 0, detail: coverage.statusCounts.needs_review === 0 ? "nothing is waiting for human review." : `${coverage.statusCounts.needs_review} document(s) awaiting human review — a handoff should not ship unreviewed claims as fact.` },
    { key: "decision_history", ok: coverage.decisionDocs.length > 0, detail: coverage.decisionDocs.length > 0 ? `${coverage.decisionDocs.length} decision record(s) present.` : "no decision record in the locations this check searches — name the file in the handoff if this project keeps them elsewhere, otherwise the original rationale stays unknown (writing more text cannot close it)." },
    { key: "history_readable", ok: inventory.history.available, detail: inventory.history.available ? `git history readable (${inventory.history.commits} commits).` : "git history unreadable, so change context cannot be reconstructed." }
  ];

  const incomplete = checks.filter((check) => !check.ok);
  return {
    mode: policy.mode,
    expectation: policy.handoffReadiness,
    passed: checks.length - incomplete.length,
    total: checks.length,
    checks,
    incomplete: incomplete.map((check) => check.key)
  };
}

// ---- backfill: formatters ------------------------------------------------

export function formatInventory(inventory) {
  const lines = [
    `project_type: ${inventory.projectType} (${inventory.confidence})`,
    inventory.gitAvailable
      ? `tracked_files: ${inventory.trackedFiles} (source ${inventory.sourceFiles}, tests ${inventory.testFiles})`
      : "tracked_files: unavailable (git could not be read)",
    `manifests: ${inventory.manifests.length ? inventory.manifests.join(", ") : "none detected"}`,
    `domain_candidates: ${inventory.domainPlans.length ? inventory.domainPlans.map((plan) => plan.name).join(", ") : "none detected"}`
  ];
  if (inventory.extensions.length > 0) lines.push(`source_mix: ${inventory.extensions.join(", ")}`);
  lines.push(inventory.history.available
    ? `history: ${inventory.history.commits} commit(s), ${inventory.history.firstCommit} → ${inventory.history.lastCommit}`
    : "history: unavailable");
  return lines;
}

export function formatCoverage(coverage) {
  const lines = [
    `initialized: ${coverage.initialized ? "yes" : "no"}`,
    `documents: ${coverage.documentCount}`,
    `planned: ${coverage.plannedCount}`,
    `missing: ${coverage.missing.length}`,
    `statuses: ${formatCounts(coverage.statusCounts)}`,
    `without source_files: ${coverage.unmapped.length}`,
    `decision records: ${coverage.decisionDocs.length}`
  ];
  if (coverage.missing.length > 0) {
    lines.push("missing documents:");
    lines.push(...coverage.missing.map((rel) => `  - ${rel}`));
  }
  return lines;
}

export function formatLedger(ledger) {
  const section = (label, entries) => (entries.length === 0
    ? [`${label}: none`]
    : [`${label}:`, ...entries.map((entry) => `  - ${entry}`)]);
  return [
    ...section("verified (read from source/tests/config)", ledger.verified),
    ...section("inferred (derived — label it as inferred, never assert it)", ledger.inferred),
    ...section("unknown (the repository cannot answer this)", ledger.unknown)
  ];
}

export function formatReadiness(readiness) {
  return [
    `readiness: ${readiness.passed}/${readiness.total} checks complete (mode ${readiness.mode}, expectation: ${readiness.expectation})`,
    ...readiness.checks.map((check) => `[${check.ok ? "ok" : "incomplete"}] ${check.key}: ${check.detail}`)
  ];
}

function formatCounts(counts) {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => `${key}=${count}`)
    .join(", ") || "none";
}

export { effectiveGovernancePolicy };
