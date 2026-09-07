// Governance modes: ONE engine, three policy levels (2026-09-07).
//
// The problem this solves was measured in real adoption, not imagined: the
// governance this package enforces can cost more than the work it protects. A
// three-line fix would trip `impact.source_changed` (an error since decision 21),
// pull the agent into a doc-sync pass, and re-open a drift scan that shells out to
// git once per verified document. On a personal project or a fast-moving frontend
// that price buys nothing. On a handoff, an audit, or an offboarding it is the
// whole point.
//
// So the lever is a MODE, not a template. All three modes share the same wiki
// layout, the same frontmatter contract, the same commands, and the same finding
// registry — a repository can sit in `lite` for months and escalate to `strict`
// the week someone leaves, with the repository itself as the source of truth. What
// changes is policy: which documents are expected to exist, which rules can fail a
// build, which scans are worth their cost, and what the generated agent prompts
// tell an agent to do after a code change.
//
// This module is the SINGLE place those decisions live. It is a leaf: no imports,
// no I/O, pure data plus lookups. Every other layer asks it a question instead of
// branching on the mode name — that is the whole reason it exists, because the
// alternative (an `if (mode === "lite")` in every command) is exactly the
// maintenance cost the feature is supposed to remove.
//
// The mode's `rules` map is deliberately expressed in the vocabulary the engine
// ALREADY has: the same rule-id -> severity toggles `llm-wiki.config.json` accepts
// in `rules`, and the same ones `rulesPreset` bundles. It layers UNDER both (see
// mergeConfigIntoOptions), so a mode never overrides something a project said
// explicitly, and nothing new had to be invented to make a mode gate differently.

import { CORE_REQUIRED_DOCS, PROFILE_DOCS } from "./config.js";

export const GOVERNANCE_MODES = Object.freeze(["lite", "standard", "strict"]);

// New projects get `lite`. Not because lite is "better", but because the cost of
// starting heavy is paid immediately and the benefit arrives months later, if at
// all — while escalating later is cheap and supported (see `backfill`).
export const DEFAULT_INIT_GOVERNANCE_MODE = "lite";

// A project whose config predates this feature (no `governance` block) resolves to
// `strict`, and strict's rule floor is EMPTY — so an existing repository behaves
// byte-for-byte as it did before modes existed. This asymmetry with
// DEFAULT_INIT_GOVERNANCE_MODE is the point: silently relaxing an existing
// project's gate would be a breaking change disguised as a default, and a CI job
// that stopped failing would be the worst possible way to learn about a new
// feature.
export const LEGACY_GOVERNANCE_MODE = "strict";

// The two expensive scans, named here so a command can ask "is this worth running"
// without knowing which mode it is in. Both are pure functions of a rule id:
// scanEvidenceDrift is the only producer of `evidence.stale` and scanReverseImpact
// the only producer of `impact.source_changed`, so when the rule is off the scan's
// entire output would be dropped by applyRuleConfig anyway. Skipping it is a cost
// saving with identical output, not a behavior change — and the saving is real:
// scanEvidenceDrift shells out to `git log` once per verified document.
export const SCAN_GATING_RULES = Object.freeze({
  evidenceDrift: "evidence.stale",
  reverseImpact: "impact.source_changed"
});

const POLICIES = Object.freeze({
  lite: Object.freeze({
    mode: "lite",
    intent: "Optimize for development speed.",
    summary: "Keep only the knowledge an agent cannot infer from the code: what the project is, the domain vocabulary, the constraints, and the decisions.",

    // Document scope. Core only — the same set `--minimal` produces, which already
    // includes the index, the project profile, architecture conventions, domain
    // features, the glossary, the log, and the decision-log template. That is
    // exactly the "essential context + ADR" surface lite is supposed to keep; per
    // component / per function / per file documentation is what it must not
    // generate, and the cheapest way not to generate it is not to plan it.
    profileDocs: false,
    domainDocs: false,

    // Rule floor. Everything switched off here is a COMPLETENESS or FRESHNESS
    // check — the class of finding that says "a document could be better", not "a
    // document is wrong". Structural rules stay on in every mode because they are
    // cheap and they catch real breakage: a malformed frontmatter block, a
    // dangling source_files path, a broken link. Safety rules (sensitive.*) are
    // not toggleable by any mode, preset, or config — applyRuleConfig refuses.
    rules: Object.freeze({
      "evidence.stale": "off",
      "impact.source_changed": "off",
      "content.not_enriched": "off",
      "evidence.ungrounded": "off",
      "evidence.missing": "off",
      "encoding.bom": "off",
      // Demoted rather than off: a missing core document is worth SAYING, it is
      // just not worth failing a build over in a mode whose contract is "do not
      // interrupt development".
      "structure.required_doc": "info"
    }),

    // Descriptive capabilities. These drive the `mode` report and the capability
    // matrix; they are documentation of what the policy above actually does, not a
    // second source of behavior.
    docsSync: "minimal",
    driftDetection: "off",
    verification: "minimal",
    sourceTracking: "selective",
    governanceCi: "off",
    detailedFeatureDocs: "off",
    fullAudit: "on-demand",
    backfill: "on-demand",
    handoffReadiness: "limited"
  }),

  standard: Object.freeze({
    mode: "standard",
    intent: "Balance development speed and project knowledge.",
    summary: "Keep the domain and architecture knowledge current without treating every code change as a documentation event.",

    profileDocs: true,
    domainDocs: true,

    // One entry, and it is the load-bearing one. `impact.source_changed` is the
    // rule that turns "you changed a file a verified document cites" into a failed
    // build. Standard keeps the DETECTION (so an audit still reports it) and drops
    // the BLOCK, which is the whole difference between "important knowledge stays
    // manageable" and "ordinary development is gated on documentation". Everything
    // else is left at its registry default on purpose: spelling the defaults out
    // would fight the push-time --strict escalations, the same reasoning that keeps
    // RULE_PRESETS.standard empty.
    rules: Object.freeze({
      "impact.source_changed": "warning"
    }),

    docsSync: "impact-based",
    driftDetection: "on-demand",
    verification: "selective",
    sourceTracking: "important-docs",
    governanceCi: "optional",
    detailedFeatureDocs: "selective",
    fullAudit: "on-demand",
    backfill: "on-demand",
    handoffReadiness: "good"
  }),

  strict: Object.freeze({
    mode: "strict",
    intent: "Optimize for documentation completeness, verification, and handoff readiness.",
    summary: "Reconstruct, verify, and keep the full project knowledge — the mode for handoff, offboarding, audits, and long-term maintenance.",

    profileDocs: true,
    domainDocs: true,

    // EMPTY ON PURPOSE, and this is a contract rather than an omission: the
    // registry's own defaultSeverity values ARE the strict baseline (that is what
    // this package shipped before modes existed). An empty floor is what makes
    // `strict` byte-identical to a pre-modes config, which is what makes
    // LEGACY_GOVERNANCE_MODE a safe migration default.
    rules: Object.freeze({}),

    docsSync: "active",
    driftDetection: "enabled",
    verification: "strong",
    sourceTracking: "broad",
    governanceCi: "expected",
    detailedFeatureDocs: "on",
    fullAudit: "core-workflow",
    backfill: "core-workflow",
    handoffReadiness: "comprehensive"
  })
});

export function isGovernanceMode(value) {
  return typeof value === "string" && GOVERNANCE_MODES.includes(value);
}

// The policy for a mode. Unknown or missing input resolves to the legacy mode
// rather than throwing: this is called from option-merge paths that run on every
// command, and a config error is already reported by loadProjectConfig with a
// clear message and exit 3. Failing twice, once as a crash, helps nobody.
export function getGovernancePolicy(mode) {
  return POLICIES[isGovernanceMode(mode) ? mode : LEGACY_GOVERNANCE_MODE];
}

// The effective mode for an options object. Tolerates options built WITHOUT the
// config merge (normalizeOptions, direct in-process command calls, and most of
// this package's own tests do exactly that) by falling back to the legacy mode —
// so no existing caller changes behavior by not knowing about modes.
export function effectiveGovernanceMode(options) {
  const explicit = options && options.governanceMode;
  if (isGovernanceMode(explicit)) return explicit;
  const raw = options && options.mode;
  if (isGovernanceMode(raw)) return raw;
  return LEGACY_GOVERNANCE_MODE;
}

export function effectiveGovernancePolicy(options) {
  return getGovernancePolicy(effectiveGovernanceMode(options));
}

// The mode `init`/`quickstart` scaffold WITH — the one place where the new-project
// default (lite) and the legacy default (strict) must be told apart, because init
// is the only command that runs before a project has said anything.
//
// The discriminator is evidence, not a flag: a repository that already has a
// config file, or already has a wiki, has been governed by the pre-modes contract
// and must keep behaving that way (silently narrowing an existing project's
// document set would be a breaking change dressed up as a default). A repository
// with neither is genuinely new, and gets lite.
//
// Both facts are passed in rather than read here so this stays pure and testable,
// and so a caller that does not know them (a direct in-process command call that
// skipped the config merge) lands on the conservative legacy answer.
export function initGovernanceMode(options, { configMode = null, configPresent = true, wikiInitialized = true } = {}) {
  if (isGovernanceMode(options && options.mode)) return options.mode;
  if (options && options.governanceModeSource === "config" && isGovernanceMode(options.governanceMode)) {
    return options.governanceMode;
  }
  // The recorded mode, read straight from the file rather than from the merged
  // options. Load-bearing for in-process callers that never ran the config merge:
  // without it a second `init` on a project the first one scaffolded would resolve
  // a DIFFERENT mode than the config it just wrote, and every generated skill would
  // report itself as needing a refresh forever.
  if (isGovernanceMode(configMode)) return configMode;
  if (configPresent || wikiInitialized) return LEGACY_GOVERNANCE_MODE;
  return DEFAULT_INIT_GOVERNANCE_MODE;
}

// Where the effective mode came from, for the `mode`/`doctor` reports. Users get
// this wrong constantly with layered config, and "lite" printed without "(from
// llm-wiki.config.json)" invites an edit to the wrong file.
export function governanceModeSource(options) {
  const source = options && options.governanceModeSource;
  if (source === "cli" || source === "config" || source === "default") return source;
  return "default";
}

// True when a rule is switched off in the EFFECTIVE rule map (mode floor, preset,
// and explicit config already merged). Used to skip a scan whose only output is
// that rule — see SCAN_GATING_RULES. Reads options.rules rather than the policy so
// a project that turned the rule off by hand gets the same saving as a mode that
// turned it off; the cost lever should not require adopting a mode.
export function ruleSuppressed(options, rule) {
  const rules = options && options.rules;
  if (!rules || typeof rules !== "object") return false;
  return rules[rule] === "off";
}

// The document set a mode PLANS — and therefore also the set it treats as
// "required" when one is missing. Moved here from commands.js because it is a
// policy decision, not an init detail, and because init and the missing-document
// scan must never disagree about it: they call this one function, so a mode that
// does not plan a document cannot be nagged about that document's absence. That
// single property is most of what makes lite lightweight — `structure.required_doc`
// stops firing for profile docs because they were never expected, not because the
// finding was silenced.
//
// `minimal` (the --minimal flag) still wins independently of the mode: it predates
// modes and adopters use it, so it keeps meaning exactly "core only".
export function plannedWikiDocs({ projectType = "unknown", minimal = false, profiles = [], mode = LEGACY_GOVERNANCE_MODE } = {}) {
  if (minimal || !getGovernancePolicy(mode).profileDocs) return [...CORE_REQUIRED_DOCS];
  const profileDocs = profiles.flatMap((profile) => PROFILE_DOCS[profile] ?? []);
  return [...new Set([...CORE_REQUIRED_DOCS, ...(PROFILE_DOCS[projectType] ?? PROFILE_DOCS.unknown), ...profileDocs])];
}

// True when per-domain documents should NOT be planned. An explicitly named
// --domains list always wins: policy decides the default, never overrides a
// direct instruction.
export function suppressDomainDocs(options) {
  if (options && options.minimal) return true;
  const named = Array.isArray(options && options.domains) ? options.domains.length : 0;
  if (named > 0) return false;
  return !effectiveGovernancePolicy(options).domainDocs;
}

// The capability matrix, as data. Rendered by `llm-wiki mode` and pinned by tests
// so the published table can never claim a capability the policies do not have —
// the failure mode of every "feature matrix" ever written.
export function governanceCapabilityMatrix() {
  return [
    { capability: "Essential project context", field: null, values: { lite: "yes", standard: "yes", strict: "yes" } },
    { capability: "Decision log / ADR support", field: null, values: { lite: "yes", standard: "yes", strict: "yes" } },
    { capability: "Profile documents (API/data-model/release-flow…)", field: "profileDocs", values: matrixValues("profileDocs", { false: "not planned", true: "planned" }) },
    { capability: "Per-domain documents", field: "domainDocs", values: matrixValues("domainDocs", { false: "not planned", true: "planned" }) },
    { capability: "Detailed feature docs", field: "detailedFeatureDocs", values: matrixValues("detailedFeatureDocs") },
    { capability: "Source tracking", field: "sourceTracking", values: matrixValues("sourceTracking") },
    { capability: "Docs sync after a code change", field: "docsSync", values: matrixValues("docsSync") },
    { capability: "Drift detection (evidence.stale)", field: "driftDetection", values: matrixValues("driftDetection") },
    { capability: "Verification pressure", field: "verification", values: matrixValues("verification") },
    { capability: "Governance CI expected", field: "governanceCi", values: matrixValues("governanceCi") },
    { capability: "Full audit", field: "fullAudit", values: matrixValues("fullAudit") },
    { capability: "Backfill", field: "backfill", values: matrixValues("backfill") },
    { capability: "Handoff readiness", field: "handoffReadiness", values: matrixValues("handoffReadiness") }
  ];
}

function matrixValues(field, labels = null) {
  const values = {};
  for (const mode of GOVERNANCE_MODES) {
    const raw = POLICIES[mode][field];
    values[mode] = labels ? labels[String(raw)] : String(raw);
  }
  return values;
}

// A human-readable diff between two modes, for the `mode set` report. Says what
// the switch actually changes so a user is never told "mode changed" and left to
// guess whether their build just started failing.
export function describeModeTransition(from, to) {
  const before = getGovernancePolicy(from);
  const after = getGovernancePolicy(to);
  if (before.mode === after.mode) return [`mode unchanged: ${after.mode}`];

  const lines = [`${before.mode} -> ${after.mode}`, `intent: ${after.intent}`];
  const ruleIds = [...new Set([...Object.keys(before.rules), ...Object.keys(after.rules)])].sort();
  for (const rule of ruleIds) {
    const wasSet = before.rules[rule] ?? "registry default";
    const isSet = after.rules[rule] ?? "registry default";
    if (wasSet !== isSet) lines.push(`rule ${rule}: ${wasSet} -> ${isSet}`);
  }
  for (const field of ["profileDocs", "domainDocs", "docsSync", "driftDetection", "verification", "sourceTracking", "governanceCi", "fullAudit", "handoffReadiness"]) {
    if (before[field] !== after[field]) lines.push(`${field}: ${before[field]} -> ${after[field]}`);
  }
  return lines;
}
