import { normalizeLang } from "./i18n.js";
import { LEGACY_GOVERNANCE_MODE, getGovernancePolicy } from "./governance.js";

export const SUPPORTED_TASK_PROMPTS = new Set(["bootstrap", "onboard", "prepare", "feature", "fix", "refactor", "docs-sync", "okf-extract", "backfill", "issue"]);

// Prompt profiles (1.33.0). `full` is the shipped text and stays byte-identical;
// `slim` is an OPT-IN rendering that keeps only what a frontier model cannot
// supply on its own:
//   - instructions that name this tool's commands, paths, files, and config keys
//     (locate with 'llm-wiki prepare ... --compact', read with 'get-doc --section');
//   - the contracts the tool enforces (needs_review, verified is human-only, the
//     append-only log, no sensitive values, the doc language, the run manifest, and
//     the governance mode's decision rule);
//   - the stop conditions and the exit criteria;
//   - the interpolated project facts (project type, profiles, evidence focus).
// What it drops is generic engineering know-how and rationale. (It also dropped
// the delegation budget, which `full` no longer carries either since 1.34.0.) No
// measurement says the shorter text is better, which is why the default is still
// `full`: the default changes only on a measurement, not on this comment.
export const PROMPT_PROFILES = Object.freeze(["full", "slim"]);
export const DEFAULT_PROMPT_PROFILE = "full";

export function isPromptProfile(value) {
  return typeof value === "string" && PROMPT_PROFILES.includes(value);
}

// Unknown input renders the default rather than throwing inside a prompt builder:
// a bad value from the CLI or the config file is already a usage/config error
// (exit 3) before any builder runs, so a second, louder failure here helps nobody.
function resolvePromptProfile(value) {
  return isPromptProfile(value) ? value : DEFAULT_PROMPT_PROFILE;
}

// The single instruction that tells an agent which language to WRITE generated
// LLM-WIKI content in (prose only). Driven by the resolved documentation language
// (`docLang`), it is shared by the handoff prompt, the bootstrap task, and the
// feature/fix/docs-sync/okf-extract skills so they never disagree. Technical
// identifiers are always excluded from translation — the same identifier classes
// the doc-content layer keeps verbatim.
export function documentLanguageDirective(docLang) {
  return normalizeLang(docLang) === "ko"
    ? "Documentation language: write all LLM-WIKI document content — prose, headings, summaries, review notes, and the log.md entry — in Korean. Do NOT translate technical identifiers: file paths, code symbols, JSON keys, frontmatter field names, status values (needs_review/verified), CLI commands/options, and evidence locators (#L, #symbol:, #section:, #route:) stay exactly as written."
    : "Documentation language: write all LLM-WIKI document content — prose, headings, summaries, review notes, and the log.md entry — in English. Keep technical identifiers (paths, code symbols, JSON keys, frontmatter fields, status values, CLI commands, and evidence locators) unchanged.";
}

// The context budget shared by every task prompt — the SINGLE source, so no
// workflow drifts into either extreme. It exists because the expensive part of an
// agent run is not the prompt, it is what the run PULLS IN: whole-file reads and
// full test output dwarf every other cost. Two invariants ride along:
//   - It narrows HOW source is read, never WHETHER it is read. task-path.js sets
//     mustReadSource for code changes and risky work, and the code is the final
//     fact — so the last resort is always "read more", not "guess cheaper".
//   - It stays project-agnostic: the artifacts are generated into other repos, so
//     it names llm-wiki's own retrieval flags and "the project's quiet reporter"
//     rather than any one repo's script names.
export function contextBudget() {
  return [
    "Context budget (spend tokens on evidence, not on volume):",
    "- Locate before reading: search/grep, or 'llm-wiki prepare --task \"<the task>\" --compact', then open only what the task needs.",
    "- Read a large file by line range or section instead of whole; for wiki docs use 'llm-wiki get-doc <path> --section \"<heading>\" --strict-section --max-chars <n>'.",
    "- Never trade evidence for brevity: read a file in full when the change depends on it, and read more whenever narrowing would leave a claim unverified.",
    "- Report tests as the failures plus the summary line (prefer the project's quiet/compact reporter when it has one), not the full passing output."
  ];
}

// The governance budget: the lever next to contextBudget (how much gets read).
// This one decides WHETHER the documentation work happens at all — the cost
// contextBudget cannot reach, because the cheapest doc-sync pass is the one a mode
// says is not needed. (A third block, delegationPolicy — who reads — was removed
// in 1.34.0: its paid A/B and a blind accuracy grading found no effect, and it
// was a quarter of every write prompt.)
//
// It is the load-bearing half of the feature in practice. The rule floor keeps a
// build from failing; this text is what an agent actually obeys after a three-line
// fix, and without it "lite" would only mean "the gate is off" while the agent
// still went and rewrote four documents.
//
// Bullets, never a numbered list: the recurring write workflows are pinned as
// goal / hard lines / exit criteria (1.27.2 prompt-shape discipline) and a numbered
// step here would re-introduce exactly the micro-step narration that removed.
// Mode-parameterized but otherwise static, and agent-neutral: one shared body
// renders into every skill format, so it cannot name a harness.
export function governanceBudget(mode = LEGACY_GOVERNANCE_MODE) {
  const policy = getGovernancePolicy(mode);
  // Kept deliberately tight. The block costs 187-273 estimated tokens (chars/4
  // proxy) on top of a ~1130-token write prompt, so every line has to earn its
  // place: the mode name, the decision rule, the permission to stop, and the one
  // override that keeps lite useful rather than merely cheap.
  const shared = [
    `- Generated for governance mode ${policy.mode}; 'llm-wiki mode' shows the current one, and 'llm-wiki init --write --skills --refresh' regenerates this workflow after a change.`
  ];

  if (policy.mode === "lite") {
    return [
      "Governance budget (lite — documentation is not the work here):",
      "- Do NOT touch the wiki for an ordinary change. Update it only when a new domain concept appeared, an architectural decision was made, a constraint a future agent must know was introduced, or a critical document is now demonstrably wrong.",
      "- When none of those applies, finish at the code and the tests and say \"no wiki change needed (lite)\". That is a complete result, not a skipped step — do not append to the log either.",
      "- Never run a repository-wide audit, a drift scan, or document generation here; those are explicit on-demand commands.",
      "- The one override: knowledge an agent cannot re-derive from the code. If the next agent would get it wrong, record it — that is the only documentation lite keeps.",
      ...shared
    ];
  }

  if (policy.mode === "standard") {
    return [
      "Governance budget (standard — protect the knowledge that outlives this change):",
      "- Update the wiki when the change moves a domain concept, an architectural boundary, a public contract, or a recorded constraint. Skip the doc work for a local refactor that leaves all four intact, and say you skipped it.",
      "- Inspect only the documents this change affects — scope them with 'llm-wiki impact --since <ref>' or 'llm-wiki prepare --task \"<the task>\" --compact'. A repository-wide audit is a separate explicit action.",
      "- Keep the source_files and evidence anchors of the documents you touch accurate; leave the rest alone.",
      ...shared
    ];
  }

  return [
    "Governance budget (strict — completeness and verification are the deliverable):",
    "- Update every affected document in the same task, and refresh its source_files and evidence anchors so the mapping still resolves.",
    "- Verify each claim you leave behind against the actual source. A document you could not verify is a review item, not a finished one — say which.",
    "- Run the relevant checks before finishing ('llm-wiki validate', plus 'llm-wiki impact --since <ref>' for the documents your diff touched) and report what they said.",
    ...shared
  ];
}

export function buildTaskPrompt({ task, cwd, projectType, profiles = [], agents = [], docLang = null, governanceMode = LEGACY_GOVERNANCE_MODE, promptProfile = DEFAULT_PROMPT_PROFILE }) {
  if (!SUPPORTED_TASK_PROMPTS.has(task)) {
    return {
      task,
      result: "blocked",
      prompt: "",
      findings: [{
        severity: "blocked",
        rule: "prompt.unsupported_task",
        path: ".",
        message: `Unsupported prompt task: ${task ?? "missing"}. Supported tasks: ${[...SUPPORTED_TASK_PROMPTS].join(", ")}.`
      }]
    };
  }

  const context = {
    cwd,
    projectType: projectType ?? "unknown",
    profiles,
    agents: agents.length ? agents : ["codex", "claude"],
    docLang,
    governanceMode: getGovernancePolicy(governanceMode).mode
  };

  const profile = resolvePromptProfile(promptProfile);
  const prompt = profile === "slim"
    ? slimTaskPrompt(task, context)
    : task === "bootstrap"
      ? bootstrapPrompt(context)
      : task === "onboard"
        ? onboardPrompt(context)
        : task === "prepare"
          ? preparePrompt(context)
          : task === "docs-sync"
            ? docsSyncPrompt(context)
            : task === "okf-extract"
              ? okfExtractPrompt(context)
              : task === "backfill"
                ? backfillPrompt(context)
                : task === "issue"
                  ? issuePrompt(context)
                  : implementationPrompt(task, context);

  return {
    task,
    result: "pass",
    projectType: context.projectType,
    profiles: context.profiles,
    agents: context.agents,
    governanceMode: context.governanceMode,
    // Named only when it is not the default, so a `full` result — and every JSON
    // report that embeds one — stays byte-identical to the pre-profile output.
    ...(profile === DEFAULT_PROMPT_PROFILE ? {} : { promptProfile: profile }),
    prompt,
    findings: []
  };
}

// The API Services inventory checklist embedded in domain-oriented generated docs
// and in the enrichment prompts. Language-aware: English by default (byte-identical
// for existing callers) and Korean when docLang resolves to "ko". Backtick-quoted
// technical identifiers stay verbatim in both languages.
export function apiServiceInventoryChecklist(docLang = "en") {
  if (normalizeLang(docLang) === "ko") {
    return [
      "- API 서비스 이름.",
      "- 엔드포인트 또는 클라이언트 모듈.",
      "- HTTP 메서드 또는 호출 시그니처.",
      "- 요청 파라미터 또는 payload.",
      "- 응답 형태.",
      "- 인증·세션·토큰·쿠키 의존성.",
      "- 에러 처리.",
      "- 재시도 또는 타임아웃 동작.",
      "- 캐시 또는 상태 갱신 동작.",
      "- 관련 UI 또는 도메인 워크플로.",
      "- `source_files` 근거, 그리고 특정 파일·라인·심볼·섹션·라우트에 대한 선택적 `evidence` 참조; 정밀 참조는 본문 `## Evidence` 섹션에 함께 반영."
    ];
  }
  return [
    "- API service name.",
    "- Endpoint or client module.",
    "- HTTP method or call signature.",
    "- Request params or payload.",
    "- Response shape.",
    "- Auth, session, token, or cookie dependency.",
    "- Error handling.",
    "- Retry or timeout behavior.",
    "- Cache or state update behavior.",
    "- Related UI or domain workflow.",
    "- `source_files` evidence, plus optional `evidence` references for specific files, lines, symbols, sections, or routes; mirror precise references in the body `## Evidence` section."
  ];
}

// Project-type-specific evidence focus. Single source shared by the `handoff`
// prompt (commands.js) and the initial-enrichment workflow below, so both point an
// agent at the same parts of the codebase. Moved here from commands.js so it has no
// back-dependency on commands.js (task-prompts.js is a leaf module).
export function evidenceFocus(projectType) {
  const guidance = {
    frontend: [
      "Frontend evidence focus:",
      "- Inspect routes, pages, components, state management, API clients, accessibility behavior, and end-to-end user workflows."
    ],
    backend: [
      "Backend evidence focus:",
      "- Inspect API routes, controllers, services, data models, persistence, auth/security boundaries, jobs, and operational configuration."
    ],
    fullstack: [
      "Fullstack evidence focus:",
      "- Inspect UI flows, API contracts, client/server boundaries, shared schemas, environment configuration, data model changes, and release flow."
    ],
    library: [
      "Library evidence focus:",
      "- Inspect public exports, package entrypoints, type declarations, examples, versioning policy, compatibility guarantees, and release flow."
    ]
  };

  return guidance[projectType] ?? [
    "General evidence focus:",
    "- Inspect the files referenced by source_files first, then map architecture, workflows, configuration, tests, and open review questions from real code evidence."
  ];
}

// The canonical initial-enrichment workflow — the SINGLE source shared by the
// `handoff` prompt (commands.js) and the `bootstrap` task/skill, so both describe
// the same rules for turning an `init --write` skeleton into a code-grounded wiki.
// `entrypoints` names what to read first (handoff passes the selected adapter
// file(s); bootstrap passes a generic instruction). `projectType` selects the
// evidence focus. Callers pass repo-relative text only — no machine-absolute paths.
export function initialEnrichmentWorkflow({ projectType = "unknown", entrypoints, docLang = null, governanceMode = LEGACY_GOVERNANCE_MODE, promptProfile = DEFAULT_PROMPT_PROFILE } = {}) {
  const entry = entrypoints || "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md";
  if (resolvePromptProfile(promptProfile) === "slim") {
    return slimEnrichmentWorkflow({ projectType, entry, docLang, governanceMode });
  }
  return [
    documentLanguageDirective(docLang),
    `1. Read ${entry} first.`,
    "2. Review the init-generated documents and their source_files to see what still needs grounding.",
    "3. Investigate the actual code, config, routing, public APIs, data models, and key workflows before making any claim.",
    ...evidenceFocus(projectType),
    ...contextBudget(),
    ...governanceBudget(governanceMode),
    "4. Replace placeholder content with descriptions backed by real source evidence. Do not guess — leave anything uncertain as an explicit review item instead of inventing detail.",
    "5. For backend/fullstack projects, also enrich the related docs/llm-wiki/domains/*.md documents.",
    "When a domain document mentions API usage, include this API Services inventory:",
    ...apiServiceInventoryChecklist(),
    "6. Tidy the related frontmatter entries and local Markdown links between related documents.",
    "7. Record broad evidence in source_files and precise evidence in the frontmatter evidence entries, mirrored in the body ## Evidence section.",
    "8. Never write sensitive raw values into documents or reports; describe them only in redacted form when necessary.",
    "9. Keep every created or edited wiki document at status: needs_review.",
    "10. Do not promote anything to verified — verified is human-approved only.",
    "11. Append docs/llm-wiki/log.md in append-only style with the changed files, evidence, caveats, and remaining review items.",
    "12. When finished, run the appropriate validate / audit / stats checks and summarize the results, and call out the areas with thin or missing evidence and the items a human must review before verified."
  ].join("\n");
}

// The first-time enrichment task: turn the init-generated skeleton into a
// code-grounded wiki. Shares initialEnrichmentWorkflow() with `handoff` so the two
// never drift apart. Preconditions are stated because bootstrap runs AFTER init has
// written the skeleton (index.md, core/profile docs, and detected domains/*.md).
function bootstrapPrompt(context) {
  return `You are a senior engineer bootstrapping an LLM-WIKI from real source evidence.

Workspace:
${context.cwd}

Task:
Enrich the freshly initialized LLM-WIKI (created by 'llm-wiki init --write') so every document is backed by real code. The project type is ${context.projectType}. Active profiles: ${formatList(context.profiles)}. Target agent context: ${formatList(context.agents)}.
Preconditions: this runs after init has generated docs/llm-wiki/index.md, the core/profile documents, and (when detected) docs/llm-wiki/domains/*.md.

Required workflow:
${initialEnrichmentWorkflow({ projectType: context.projectType, entrypoints: "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md", docLang: context.docLang, governanceMode: context.governanceMode })}

Expected final response:
- Changed wiki docs (and any domain docs enriched).
- Source evidence inspected.
- validate / audit / stats run and results.
- Areas with thin or missing evidence, and items a human must review before verified.`;
}

// Grounding rules shared by the read-only guided skills (onboard + prepare) — the
// SINGLE source so the two never drift. Both surfaces are read-only: they explain
// and scope, they do not change files.
function guidedGroundingRules() {
  return [
    "- Prefer the deterministic CLI result as your starting map, then confirm against the ACTUAL source — the code is the source of truth; the wiki is a compressed map to it.",
    "- Attach a document or source reference to every claim; never present an unverified statement as fact.",
    "- Do not guess. Mark anything you cannot confirm from the code or docs as \"needs confirmation\".",
    "- Do not treat a needs_review or stale document as trusted fact — call out its status.",
    "- Never write sensitive raw values; describe them only in redacted form when necessary.",
    "- Read-only by default: do not modify files in this workflow.",
    ...contextBudget()
  ].join("\n");
}

// llm-wiki-onboard: guided onboarding for a newcomer. Read-only — explains a work
// area from real code evidence; it does not change files.
function onboardPrompt(context) {
  return `You are a patient senior engineer onboarding a newcomer to this project.

Workspace:
${context.cwd}

Task:
Help a new developer understand this project (type: ${context.projectType}; active profiles: ${formatList(context.profiles)}) and a specific work area, from real code evidence, before they make any change. Target agent context: ${formatList(context.agents)}.

Required workflow:
1. Read the nearest project instructions (AGENTS.md / CLAUDE.md / your agent's instruction file) and docs/llm-wiki/index.md first.
2. Run 'llm-wiki onboard' (add --domain <name> when a work area is given) and use its assembled learning path as your starting map.
3. Verify the actual wiki documents and the related source files directly — do not rely on the summary alone.
4. Explain the project's purpose in plain language a newcomer can follow, without over-simplifying the technical facts.
5. Explain the main work areas (domains) and the business terms they use.
6. Walk through ONE representative request/workflow from start to end.
7. Explain the key invariants, the risky areas, and the tests that cover them.
8. Produce 3–5 comprehension-check questions grounded in the docs/source.
9. When the user answers, give evidence-based feedback (point at the doc/source).
${guidedGroundingRules()}

Expected final response:
- Project orientation (plain language, with evidence).
- The work area's key documents, source entrypoints, and tests.
- One representative flow explained end to end.
- Invariants / risks / freshness warnings surfaced from the docs.
- 3–5 comprehension checks for the newcomer.`;
}

// llm-wiki-prepare: scope a change before implementing. Read-only — it investigates
// and hands off; it does not change code.
function preparePrompt(context) {
  return `You are a senior engineer scoping a change before any code is written.

Workspace:
${context.cwd}

Task:
Investigate the scope of a requested change (project type: ${context.projectType}; active profiles: ${formatList(context.profiles)}) so an implementer starts with the right documents, source, risks, and tests. Target agent context: ${formatList(context.agents)}.

Required workflow:
1. Restate the requested task in one clear sentence.
2. Run 'llm-wiki prepare --task "<the task>"' and use its candidates as your starting map.
3. Verify the related documents and the actual source before drawing any conclusion.
4. Explain the CURRENT behavior with evidence (docs + source).
5. Present the expected impact as CANDIDATES ("the docs reference this file", "this looks like a candidate"), never as "you must edit X" or "this is the cause".
6. Call out the areas that should NOT change.
7. Find the tests and validation a change here would need.
8. If the docs conflict with the code, report the conflict and do NOT implement.
9. If evidence is missing, do not guess — produce confirmation questions instead.
10. To implement, hand off to the /llm-wiki-feature or /llm-wiki-fix skill (this skill does not change code).
${guidedGroundingRules()}

Expected final response:
- The restated task.
- Relevant docs, candidate source files, and candidate tests (as candidates).
- Current behavior, with evidence.
- Areas not to touch, recorded invariants/risks, and freshness warnings.
- Open questions to confirm before implementing, and the recommended next skill.`;
}

// The recurring write workflows (feature/fix/refactor, and docs-sync below) are
// structured as goal / hard lines / exit criteria instead of a numbered step list
// (prompt-shape discipline, 1.27.2). The verification machinery — validate,
// check-run, tests — is what makes dropping the step narration safe: the contract
// is enforced at the exit, not restated at every step. Every load-bearing line of
// the old list survives (entrypoint, source inspection, STOP on conflict/scope,
// needs_review, log append, sensitive-info, context budget); only the step-by-step
// steering ("produce a plan", "locate before editing") is gone. One-shot
// procedural workflows (bootstrap/onboard/prepare/okf-extract) keep their
// checklists — there the sequence is the content.
function implementationPrompt(task, context) {
  const taskTitle = {
    feature: "post-wiki feature development",
    fix: "post-wiki bug fix",
    refactor: "post-wiki refactor"
  }[task];

  return `You are a senior engineer working in an LLM-WIKI-enabled project.

Workspace:
${context.cwd}

Task:
Run a ${taskTitle} workflow. The project type is ${context.projectType}. Active profiles: ${formatList(context.profiles)}. Target agent context: ${formatList(context.agents)}.

Goal:
Read docs/llm-wiki/index.md first. Inspect actual source files before making claims or code changes. Make the requested code change with the smallest safe scope, grounded in the wiki and verified against the actual source. Update every affected LLM-WIKI document in the same task, so the wiki keeps telling the truth about the code.

Hard lines (never cross these):
${documentLanguageDirective(context.docLang)}
- If the docs conflict with the code, or the scope grows beyond what was asked, STOP and confirm with a human before implementing. When the scope is unclear, scope it first with 'llm-wiki prepare --task "<the task>"' (or the /llm-wiki-prepare skill).
- Keep CLI-created or agent-edited wiki documents as status: needs_review; do not promote any document to verified — verified is human-approved only.
- Never write sensitive raw values into documents, logs, or reports.
${contextBudget().join("\n")}
${governanceBudget(context.governanceMode).join("\n")}

Exit criteria (done means all of these):
- The requested change is implemented and verified against the actual source.
- Every affected LLM-WIKI document is updated in the same task.
- Append docs/llm-wiki/log.md in append-only style with changed files, evidence, caveats, and review notes.
- Relevant tests ran, or the reason they were not run is stated exactly.

How you work between those lines — reading order, planning depth, edit sequence — is your call; the goal and the exit criteria are the contract.

When a domain document mentions API usage, include this API Services inventory:
${apiServiceInventoryChecklist(context.docLang).join("\n")}

Expected final response:
- Changed files.
- Source evidence inspected.
- Tests run and results.
- Wiki docs updated.
- Remaining review items or caveats.`;
}

function docsSyncPrompt(context) {
  return `You are a senior documentation maintenance engineer working in an LLM-WIKI-enabled project.

Workspace:
${context.cwd}

Task:
Run a docs-sync workflow. The project type is ${context.projectType}. Active profiles: ${formatList(context.profiles)}. Target agent context: ${formatList(context.agents)}.

Goal:
Read docs/llm-wiki/index.md first. Detect changed code and documentation context using git status, git diff, and relevant source files. Inspect actual source files before deciding a wiki document is stale, then bring every stale LLM-WIKI document back in line with what the code actually does.

Hard lines (never cross these):
${documentLanguageDirective(context.docLang)}
- Update stale LLM-WIKI documents only; avoid unrelated code edits.
- Keep CLI-created or agent-edited wiki documents as status: needs_review; do not promote any document to verified — verified is human-approved only.
- Never write sensitive raw values into documents, logs, or reports.
${contextBudget().join("\n")}
${governanceBudget(context.governanceMode).join("\n")}

Exit criteria (done means all of these):
- Every stale document found is updated, or explicitly reported as still stale with the reason.
- Append docs/llm-wiki/log.md in append-only style with changed docs, source evidence, caveats, and review notes.
- Relevant validation ran, or the reason it was not run is stated exactly.

How you work between those lines is your call; the goal and the exit criteria are the contract.

When a domain document mentions API usage, include this API Services inventory:
${apiServiceInventoryChecklist(context.docLang).join("\n")}

Expected final response:
- Changed wiki docs.
- Source evidence inspected.
- Validation run and results.
- Remaining stale areas or review items.`;
}

function okfExtractPrompt(context) {
  return `You are an AI Knowledge Editor working in an LLM-WIKI-enabled project.

Workspace:
${context.cwd}

Task:
Run an OKF v0.1 extraction workflow as a prompt-assisted process, not automatic extraction. The project type is ${context.projectType}. Active profiles: ${formatList(context.profiles)}. Target agent context: ${formatList(context.agents)}.

Required workflow:
${documentLanguageDirective(context.docLang)}
1. Read docs/llm-wiki/index.md first when storing results in an LLM-WIKI project.
2. Inspect the provided raw text or source files before extracting knowledge.
3. Convert durable concepts, projects, APIs, meeting notes, or events into Markdown documents with YAML frontmatter.
4. Use OKF v0.1 frontmatter: required type, optional aliases, and optional tags.
5. Use clear Markdown headings and bullet lists.
6. Connect related concepts in the body with wiki links such as [[Concept Name]].
7. Preserve broad source evidence in LLM-WIKI source_files and precise references in optional evidence entries when documents are stored under docs/llm-wiki; mention each precise reference in the body ## Evidence section.
8. Keep AI-extracted documents as status: needs_review when stored in an LLM-WIKI project.
9. Do not promote any extracted document to verified; verified is human-approved only.
10. List unresolved concepts, aliases to review, and extraction caveats.
${contextBudget().join("\n")}

Expected final response:
- Extracted document list.
- Source evidence inspected.
- Unresolved wiki links or ambiguous concepts.
- Review items before any human approval.`;
}

// llm-wiki-backfill: reconstruct a wiki that was deliberately not kept complete,
// from the repository as it stands today. This is the escalation workflow, and the
// only prompt in this package whose PRIMARY risk is not doing too little — it is
// doing too much. An agent asked to "reconstruct project knowledge for a handoff"
// will happily produce a fluent account of why the architecture is the way it is,
// and none of it is checkable. Every rule below exists to stop that: an evidence
// ladder that ranks the source above the story, three explicit labels, and a
// standing instruction that unrecoverable history stays unrecovered.
//
// Keeps its numbered checklist for the same reason bootstrap/onboard do: here the
// sequence IS the content, because the order of evidence is the safeguard.
function backfillPrompt(context) {
  return `You are a senior engineer reconstructing an LLM-WIKI from the repository as it stands today, so this project can be handed to someone else.

Workspace:
${context.cwd}

Task:
Recover as many EVIDENCE-BACKED facts about this project as possible, and clearly identify what cannot be recovered. The project type is ${context.projectType}. Active profiles: ${formatList(context.profiles)}. Target agent context: ${formatList(context.agents)}. Governance mode: ${context.governanceMode}.
Preconditions: run 'llm-wiki backfill' first and use its inventory, coverage, evidence ledger, and readiness report as your starting map. 'llm-wiki backfill --write' creates the missing document stubs; this workflow fills them.

What this task IS and IS NOT:
- It IS: recover what the repository can prove, and name what it cannot.
- It is NOT: produce a complete and convincing story about the project. A plausible history that nobody can verify is worse than an admitted gap, because the next developer will act on it.

Evidence ladder (prefer the higher source; never let a lower one contradict a higher one):
1. current source code — what the system does today
2. tests — the behavior somebody committed to
3. configuration and manifests — how it is built, wired, and deployed
4. existing wiki documents — a compressed map, not an authority
5. ADRs / decision records — the only real source for WHY
6. git commit messages — intent where the author recorded it
7. git diff / history — what changed and when, not why
8. locally available issue/PR metadata — context where present, if any

Label every claim you write with one of three confidence levels, and keep them apart:
- verified: read directly from the current source, tests, or configuration. Cite the file (and symbol or line range) in source_files / evidence.
- inferred: derived from directory boundaries, naming, or history. Write it as inferred, in the sentence itself ("inferred from commit history"), never as plain fact.
- unknown: the repository cannot answer it. Say so in the document, and leave it as an open review item.

${documentLanguageDirective(context.docLang)}
1. Read docs/llm-wiki/index.md and the 'llm-wiki backfill' report first, then work the gaps it names.
2. Establish CURRENT behavior before anything historical: entrypoints, architecture, data flow, external integrations, public contracts, configuration, and the business rules the code actually enforces.
3. Rebuild the source mapping as you go: broad evidence in source_files, precise references in the frontmatter evidence entries, mirrored in the body ## Evidence section. A document with no source mapping is not finished.
4. For each domain the report lists as a source boundary with no document, describe what the code in it does. The boundary is evidence; the business MEANING of the domain is not — mark it inferred unless a test, a contract, or a document confirms it.
5. Then, and only then, attempt history. Look for ADRs, decision records, and commit messages that recorded a rationale. Where one exists, cite the commit or the document. Where none exists, write "Decision reason: unknown" and stop — do NOT reconstruct a rationale from file layout, naming, dependency choices, or commit subjects.
6. Never present the ABSENCE of evidence as evidence. "No ADR exists for this" is a fact; "this was probably chosen for performance" is an invention.
7. Cover the handoff areas the report and the profile documents ask for, ONLY where evidence exists: purpose, technology stack, local setup, build/run, deployment, directory and architecture overview, important source locations, core domain concepts, major data flows, external integrations, API usage, state management, important business rules, operational constraints, known issues, technical debt, recorded decisions, and open items. Where a section has no evidence, keep the section and record it as unknown rather than deleting it or filling it in.
8. Produce an explicit "Unknown / needs human confirmation" list — the questions only the outgoing maintainer can answer. This list is a deliverable, not a failure.
9. Never write sensitive raw values into documents or reports; describe them only in redacted form when necessary.
10. Keep every created or edited wiki document at status: needs_review.
11. Do not promote anything to verified — verified is human-approved only, and a reconstructed document is precisely the kind that needs a human to read it.
12. Append docs/llm-wiki/log.md in append-only style with the documents touched, the evidence used, what stayed inferred, and what stayed unknown.
13. Finish by running 'llm-wiki backfill' again (add --strict for the pre-handoff gate) and report which readiness checks are now complete and which are not.
${contextBudget().join("\n")}

Expected final response:
- Documents created or filled, with the confidence label distribution.
- Source evidence inspected, and the source mappings rebuilt.
- What stayed INFERRED, and on what basis.
- What stayed UNKNOWN, as questions for the outgoing maintainer.
- The readiness checks still incomplete, and why each one cannot be closed by writing text.`;
}

// llm-wiki issue: draft a GitHub issue body from the conversation and the wiki.
// Read-only like onboard/prepare — it writes text for a human to file, and it
// changes neither the wiki nor the code. The point of the preset is the reader:
// an issue is handed to an agent that was NOT in the conversation, so every rule
// below is about making the text mean one thing to that reader. Work-unit history
// (who decided what, what was tried) belongs in the issue and never in the wiki —
// the wiki records what is true of the project, not how one task went.
//
// Deliberately NOT a generated skill (SKILL_TASKS): skills are an always-loaded
// surface, and this preset is invoked on demand through `prompt --task issue`.
function issuePrompt(context) {
  return `You are a senior engineer drafting a GitHub issue body from this conversation and the project's LLM-WIKI.

Workspace:
${context.cwd}

Task:
Write the body of a GitHub issue for the work agreed in this conversation (project type: ${context.projectType}; active profiles: ${formatList(context.profiles)}). Target agent context: ${formatList(context.agents)}.
This is a read-only workflow: draft text only. Do not modify the wiki, the code, or any other file; filing the issue is the user's call.

Required workflow:
1. Restate the agreed work in one sentence. If the conversation has not settled what the work is, ask before drafting.
2. Run 'llm-wiki prepare --task "<the task>" --compact' to find the wiki documents and source files that govern this work, and read only what the issue has to point at.
3. Check every fact you will state against those documents or the actual source. Leave out what you cannot confirm, or list it under Open questions.
4. Draft the issue body with exactly these sections, in this order:
   - Background / why: the reason this work is being done.
   - Goal: the contract, written as an observable end state (what is true when the work is done), not as a list of steps.
   - Out of scope / must not change: what this work must not do, and the areas, contracts, or behaviors that must stay as they are.
   - Done when: verifiable completion criteria — for each one, the command, test, or observable behavior that proves it.
   - Related wiki docs and evidence: links to the documents and source paths 'llm-wiki prepare' found (repo-relative paths, with #section or line anchors where useful). Link them; do not restate their content.
   - Risks / invariants: what could break, and the invariants the wiki records for this area.
   - Open questions: what is still undecided or unconfirmed.

Writing rules:
- Write only confirmed facts and the scope that was agreed. Do not add scope, solutions, or estimates nobody agreed to.
- Avoid wording that can be read more than one way: name the exact file, command, field, or behavior; write "must" / "must not" rather than "should" / "ideally"; give numbers instead of "fast" or "small".
- Write for an agent that was not in this conversation: it must understand the same task from the issue alone. Spell out every term and reference the conversation used implicitly.
- The history of this unit of work (who decided what, what was tried) belongs in the issue, not in the wiki: do not edit any wiki document or append docs/llm-wiki/log.md for it.
- Do not treat a needs_review or stale document as settled fact — link it and say its status.
- Never write sensitive raw values into the issue; describe them only in redacted form when necessary.
${contextBudget().join("\n")}

Expected final response:
- A one-line issue title and the issue body in Markdown, ready to paste.
- What you left out as unconfirmed, and why.`;
}

// --- slim prompt profile ---------------------------------------------------
// One renderer per task, built from the shared pieces below. Every line either
// names this tool (a command, a path, a file, a config key), states a contract
// the tool enforces, says when to stop, says when the work is done, or carries
// an interpolated project fact. Anything a capable model already knows — how to
// plan, how to read code, why evidence matters — is left to the model.

// The part of contextBudget() that names this tool: locate first, then read a
// section, and never let narrowing replace the source a claim rests on.
function slimLocateLine() {
  return "- Locate, then read: 'llm-wiki prepare --task \"<the task>\" --compact', then 'llm-wiki get-doc <path> --section \"<heading>\" --strict-section --max-chars <n>'. Never skip the source a claim depends on.";
}

const SLIM_REVIEW_LINE = "- Wiki documents you create or edit stay at status: needs_review; verified is human-approved only.";
const SLIM_SENSITIVE_LINE = "- Never write sensitive raw values into documents, logs, or reports.";
// A pointer to the checklist the generated domain-doc template already carries
// (apiServiceInventoryChecklist), not a second copy of it.
const SLIM_API_LINE = "- When a domain document mentions API usage, fill the API Services inventory its template lists (endpoint, method, params, response, auth/session dependency, errors, retry/timeout, cache/state, source evidence).";

// The governance mode's decision rule, without the reasoning. The mode name, the
// complete-without-docs outcome of lite, and the regeneration command all stay:
// they are what makes a stale generated workflow recognizable as stale.
function slimGovernanceBudget(mode) {
  const policy = getGovernancePolicy(mode);
  const rule = {
    lite: "- Governance budget (lite): Do NOT touch the wiki for an ordinary change — only for a new domain concept, an architectural decision, a constraint a future agent must know, or a critical document now demonstrably wrong (knowledge an agent cannot re-derive from the code). Otherwise finish at code and tests and report \"no wiki change needed (lite)\", without a log append. No repository-wide audit, drift scan, or document generation.",
    standard: "- Governance budget (standard): update the wiki only when the change moves a domain concept, an architectural boundary, a public contract, or a recorded constraint; otherwise skip the doc work and say so. Scope the documents with 'llm-wiki impact --since <ref>' (no repository-wide audit) and keep their source_files and evidence anchors accurate.",
    strict: "- Governance budget (strict): update every affected document in the same task and refresh its source_files and evidence anchors; verify each claim against the actual source and name any you could not; before finishing run 'llm-wiki validate' and 'llm-wiki impact --since <ref>' and report what they said."
  }[policy.mode];
  return [
    rule,
    `- Generated for governance mode ${policy.mode} ('llm-wiki mode' shows the current one; 'llm-wiki init --write --skills --refresh' regenerates this workflow).`
  ];
}

// Shared header. Keeps the "\n\nWorkspace:\n<cwd>\n" block and the
// " Target agent context: <agents>." clause in the exact shapes skills.js
// forArtifact() strips from a committed artifact.
function slimHeader(title, context, extra = "") {
  return `${title}

Workspace:
${context.cwd}

Project type: ${context.projectType}. Active profiles: ${formatList(context.profiles)}. Target agent context: ${formatList(context.agents)}.${extra}`;
}

function slimTaskPrompt(task, context) {
  if (task === "bootstrap") return slimBootstrapPrompt(context);
  if (task === "onboard") return slimOnboardPrompt(context);
  if (task === "prepare") return slimPreparePrompt(context);
  if (task === "docs-sync") return slimDocsSyncPrompt(context);
  if (task === "okf-extract") return slimOkfExtractPrompt(context);
  if (task === "backfill") return slimBackfillPrompt(context);
  if (task === "issue") return slimIssuePrompt(context);
  return slimImplementationPrompt(task, context);
}

function slimEnrichmentWorkflow({ projectType, entry, docLang, governanceMode }) {
  return [
    documentLanguageDirective(docLang),
    `1. Read ${entry} first, then the init-generated documents and their source_files.`,
    "2. Ground every claim in the actual code; leave anything unconfirmed as an explicit review item instead of guessing.",
    ...evidenceFocus(projectType),
    slimLocateLine(),
    ...slimGovernanceBudget(governanceMode),
    "3. Replace placeholder content with source-backed descriptions; for backend/fullstack projects also enrich docs/llm-wiki/domains/*.md.",
    SLIM_API_LINE,
    "4. Broad evidence goes in source_files, precise evidence in the frontmatter evidence entries, mirrored in the body ## Evidence section; keep related frontmatter and local Markdown links tidy.",
    "5. Never write sensitive raw values. Keep every created or edited wiki document at status: needs_review; verified is human-approved only.",
    "6. Append docs/llm-wiki/log.md (append-only) with changed files, evidence, caveats, and remaining review items.",
    "7. Finish with 'llm-wiki validate' (plus audit / stats where the governance budget allows), summarize the results, and name the thin-evidence areas and the items a human must review before verified."
  ].join("\n");
}

function slimBootstrapPrompt(context) {
  return `${slimHeader("LLM-WIKI bootstrap workflow: back every document 'llm-wiki init --write' generated with real code.", context)}

${slimEnrichmentWorkflow({ projectType: context.projectType, entry: "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md", docLang: context.docLang, governanceMode: context.governanceMode })}

Report: docs changed, source evidence, check results, review items.`;
}

function slimImplementationPrompt(task, context) {
  const title = { feature: "feature development", fix: "bug fix", refactor: "refactor" }[task];
  return `${slimHeader(`LLM-WIKI ${task} workflow (post-wiki ${title}).`, context)}

Goal: make the requested change in the smallest safe scope, verified against the actual source, and leave the LLM-WIKI true to the code within the governance budget below.

Hard lines:
${documentLanguageDirective(context.docLang)}
- Read docs/llm-wiki/index.md first, and inspect actual source files before making claims or code changes.
${slimLocateLine()}
- If the docs conflict with the code, or the scope grows beyond what was asked, STOP and confirm with a human.
${SLIM_REVIEW_LINE}
${SLIM_SENSITIVE_LINE}
${slimGovernanceBudget(context.governanceMode).join("\n")}

Exit criteria:
- The change is implemented and verified against the actual source.
- The wiki updates the governance budget calls for are made and logged in docs/llm-wiki/log.md (append-only) with changed files, evidence, and review notes.
- Relevant tests ran, or the reason they did not is stated.

${SLIM_API_LINE}

Report: changed files, source evidence, tests and results, wiki docs updated, open review items.`;
}

function slimDocsSyncPrompt(context) {
  return `${slimHeader("LLM-WIKI docs-sync workflow.", context)}

Goal: find the LLM-WIKI documents that recent code changes made stale (git status, git diff, then the source) and bring each back in line with what the code does.

Hard lines:
${documentLanguageDirective(context.docLang)}
- Read docs/llm-wiki/index.md first, and inspect actual source files before deciding a document is stale.
${slimLocateLine()}
- Update stale LLM-WIKI documents only; avoid unrelated code edits. If the code itself looks wrong, report it instead of changing it.
${SLIM_REVIEW_LINE}
${SLIM_SENSITIVE_LINE}
${slimGovernanceBudget(context.governanceMode).join("\n")}

Exit criteria:
- Every stale document found is updated, or reported as still stale with the reason.
- docs/llm-wiki/log.md is appended (append-only) with changed docs, evidence, and review notes.
- Relevant validation ('llm-wiki validate') ran, or the reason it did not is stated.

${SLIM_API_LINE}

Report: changed wiki docs, source evidence, validation results, remaining stale areas or review items.`;
}

// Read-only guided rules (onboard/prepare), slim form of guidedGroundingRules().
function slimGuidedRules() {
  return [
    "- Read-only: do not modify files. Start from the CLI result, then confirm against the actual source; cite a doc or source for every claim and mark anything unconfirmed \"needs confirmation\".",
    "- A needs_review or stale document is not trusted fact — say its status. Never write sensitive raw values.",
    slimLocateLine()
  ].join("\n");
}

function slimOnboardPrompt(context) {
  return `${slimHeader("LLM-WIKI onboard workflow (read-only): help a newcomer understand this project and one work area from real code evidence.", context)}

1. Read the project instructions (AGENTS.md / CLAUDE.md / your agent's instruction file) and docs/llm-wiki/index.md, then run 'llm-wiki onboard' (add --domain <name> for a work area) as the starting map.
2. Explain the purpose, the work areas and their terms, one representative flow end to end, and the invariants, risky areas, and the tests that cover them.
3. Ask 3–5 comprehension questions grounded in the docs/source, and answer the newcomer's replies with doc/source pointers.
${slimGuidedRules()}

Report: orientation, the area's key docs / source entrypoints / tests, one flow end to end, invariants / risks / freshness warnings, and 3–5 comprehension checks.`;
}

function slimPreparePrompt(context) {
  return `${slimHeader("LLM-WIKI prepare workflow (read-only): scope a requested change before any code is written.", context)}

1. Restate the task in one sentence, then run 'llm-wiki prepare --task "<the task>"' and use its candidates as the starting map.
2. Explain the current behavior with evidence. Present impact as candidates, never as "you must edit X"; name the areas that must not change and the tests a change would need.
3. If the docs conflict with the code, report the conflict and do NOT implement. If evidence is missing, ask confirmation questions instead of guessing.
4. To implement, hand off to the /llm-wiki-feature or /llm-wiki-fix skill.
${slimGuidedRules()}

Report: the restated task; candidate docs, source, and tests; current behavior; areas not to touch, invariants / risks, freshness warnings; open questions and the next skill.`;
}

function slimOkfExtractPrompt(context) {
  return `${slimHeader("LLM-WIKI OKF v0.1 extraction workflow (prompt-assisted, not automatic).", context)}

${documentLanguageDirective(context.docLang)}
1. Read docs/llm-wiki/index.md first when storing results in an LLM-WIKI project, and inspect the raw text or source before extracting.
2. Write each durable concept, project, API, meeting note, or event as Markdown with OKF v0.1 frontmatter (required type; optional aliases and tags), clear headings, and [[Concept Name]] wiki links.
3. Under docs/llm-wiki: broad evidence in source_files, precise references in evidence entries mirrored in the body ## Evidence section; keep documents at status: needs_review — verified is human-approved only.
4. List unresolved concepts, aliases to review, and extraction caveats.
${slimLocateLine()}

Report: extracted documents, source evidence, unresolved links or ambiguous concepts, and review items.`;
}

// Keeps everything that makes backfill safe — the evidence ladder, the three
// labels, the no-fabrication rule, the unknown list, the readiness re-run — and
// drops only the narration around it.
function slimBackfillPrompt(context) {
  return `${slimHeader("LLM-WIKI backfill workflow: recover the evidence-backed facts about this project for a handoff, and name what cannot be recovered.", context, ` Governance mode: ${context.governanceMode}.`)}
Preconditions: run 'llm-wiki backfill' first and work from its inventory, coverage, evidence ledger, and readiness report; 'llm-wiki backfill --write' creates the missing document stubs this workflow fills.

Evidence ladder (a lower source never contradicts a higher one): current source code > tests > configuration and manifests > existing wiki documents > ADRs / decision records (the only source for WHY) > commit messages > git diff / history > local issue/PR metadata.
Label every claim, and keep the labels apart:
- verified: read from the current source, tests, or configuration — cite it in source_files / evidence.
- inferred: derived from directory boundaries, naming, or history — say "inferred" in the sentence itself.
- unknown: the repository cannot answer it — say so and leave an open review item.

${documentLanguageDirective(context.docLang)}
1. Read docs/llm-wiki/index.md and the 'llm-wiki backfill' report first, then work the gaps it names.
2. Establish CURRENT behavior before history: entrypoints, architecture, data flow, integrations, public contracts, configuration, enforced business rules. Rebuild the source mapping as you go (source_files, plus frontmatter evidence mirrored in ## Evidence); a document without one is not finished.
3. For a source boundary with no document, describe what its code does; its business meaning stays inferred unless a test, contract, or document confirms it.
4. Only then attempt history. Cite the ADR, decision record, or commit that recorded a rationale; where none exists write "Decision reason: unknown" — do NOT reconstruct a rationale from layout, naming, dependencies, or commit subjects. Absence of evidence is not evidence.
5. Cover the handoff areas the report names only where evidence exists; keep an unevidenced section and mark it unknown.
6. Produce an "Unknown / needs human confirmation" list for the outgoing maintainer.
7. Never write sensitive raw values. Keep every created or edited wiki document at status: needs_review; verified is human-approved only.
8. Append docs/llm-wiki/log.md (append-only) with the documents touched, the evidence used, and what stayed inferred or unknown.
9. Finish by re-running 'llm-wiki backfill' (--strict for the pre-handoff gate) and report which readiness checks are complete.
${slimLocateLine()}

Report: documents created or filled with the label distribution; source mappings rebuilt; what stayed INFERRED and why; what stayed UNKNOWN, as questions; the readiness checks still incomplete and why.`;
}

function slimIssuePrompt(context) {
  return `${slimHeader("LLM-WIKI issue workflow (read-only): draft a GitHub issue body for the work agreed in this conversation.", context)}

1. Restate the agreed work in one sentence; if it is not settled, ask before drafting.
2. Run 'llm-wiki prepare --task "<the task>" --compact' to find the wiki docs and source that govern it, and check every fact you state against them.
3. Draft these sections, in order: Background / why; Goal (an observable end state, not steps); Out of scope / must not change; Done when (verifiable criteria); Related wiki docs and evidence (link the docs and source paths prepare found — do not restate them); Risks / invariants; Open questions.

Rules:
- Confirmed facts and agreed scope only; anything unconfirmed goes under Open questions.
- No wording that reads more than one way: exact files, commands, fields, and behaviors; "must" / "must not"; numbers instead of adjectives.
- Write for an agent that was not in this conversation.
- Work-unit history belongs in the issue, not the wiki: do not edit wiki documents, docs/llm-wiki/log.md, or any other file.
- A needs_review or stale document is not settled fact — say its status. Never write sensitive raw values.

Report: a one-line issue title and the Markdown body, ready to paste, plus what you left out as unconfirmed.`;
}

function formatList(values) {
  return values.length ? values.join(", ") : "none";
}
