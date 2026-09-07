import { normalizeLang } from "./i18n.js";
import { LEGACY_GOVERNANCE_MODE, getGovernancePolicy } from "./governance.js";

export const SUPPORTED_TASK_PROMPTS = new Set(["bootstrap", "onboard", "prepare", "feature", "fix", "refactor", "docs-sync", "okf-extract", "backfill"]);

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

// The delegation budget: the cost lever context narrowing cannot reach. contextBudget()
// decides HOW MUCH gets read; this decides WHO reads it. A sweep across many documents
// belongs in a cheap, disposable context that hands back a brief, while the judgment and
// the prose stay with the agent holding the reasoning. Stated as a budget rather than a
// procedure, so it composes with the "how you work between those lines is your call"
// contract instead of re-introducing the micro-steps 1.27.2 removed.
//
// Deliberately agent-NEUTRAL, for two reasons. The generated artifact body is a single
// shared text rendered into every skill format (Claude/Codex/Cursor/neutral) and is built
// with agents: [] so it cannot vary by harness; and initialEnrichmentWorkflow() embeds
// this block in the canonical text that verification.test.js pins as a verbatim substring
// of both `bootstrap` and `handoff`. Naming a specific harness belongs in that harness's
// adapter (templates/adapters/*), not here.
export function delegationPolicy() {
  return [
    "Delegation budget (spend the expensive context on judgment, not on reading):",
    "- Locating and scoping is dispatchable: when an answer needs a sweep across many documents or files, send a read-only subagent on a cheaper model and take back a brief — findings, file:line evidence, and what stayed unconfirmed — instead of pulling the raw material into this context.",
    "- Judgment is not dispatchable: the design decision, the regression call, the edit itself, and the wiki/log prose stay here. A cheaper agent can apply text you already wrote; it cannot write the sentence that explains why the change was made.",
    "- Mechanical finishing is dispatchable: running the checks, writing the run manifest, and applying edits you have already decided on.",
    "- Dispatch only when it pays: a brief plus its dispatch costs more than reading one file, and a delegate that hands back the raw material has bought nothing. When the harness can choose a model per dispatch, send the dispatch to the cheaper one and keep the session's own model fixed — switching the session model mid-task re-reads the conversation so far at the new model's price.",
    "- Delegation never buys an unverified claim: either the delegate reads the actual source and reports the evidence, or you read it yourself — never skip the source because a dispatch felt expensive."
  ];
}

// The governance budget: the third lever, next to contextBudget (how much gets
// read) and delegationPolicy (who reads it). This one decides WHETHER the
// documentation work happens at all — the cost the other two cannot reach, because
// the cheapest doc-sync pass is the one a mode says is not needed.
//
// It is the load-bearing half of the feature in practice. The rule floor keeps a
// build from failing; this text is what an agent actually obeys after a three-line
// fix, and without it "lite" would only mean "the gate is off" while the agent
// still went and rewrote four documents.
//
// Bullets, never a numbered list: the recurring write workflows are pinned as
// goal / hard lines / exit criteria (1.27.2 prompt-shape discipline) and a numbered
// step here would re-introduce exactly the micro-step narration that removed.
// Mode-parameterized but otherwise static, and agent-neutral for the same reason
// delegationPolicy is: one shared body renders into every skill format.
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

export function buildTaskPrompt({ task, cwd, projectType, profiles = [], agents = [], docLang = null, governanceMode = LEGACY_GOVERNANCE_MODE }) {
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

  const prompt = task === "bootstrap"
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
              : implementationPrompt(task, context);

  return {
    task,
    result: "pass",
    projectType: context.projectType,
    profiles: context.profiles,
    agents: context.agents,
    governanceMode: context.governanceMode,
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
export function initialEnrichmentWorkflow({ projectType = "unknown", entrypoints, docLang = null, governanceMode = LEGACY_GOVERNANCE_MODE } = {}) {
  const entry = entrypoints || "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md";
  return [
    documentLanguageDirective(docLang),
    `1. Read ${entry} first.`,
    "2. Review the init-generated documents and their source_files to see what still needs grounding.",
    "3. Investigate the actual code, config, routing, public APIs, data models, and key workflows before making any claim.",
    ...evidenceFocus(projectType),
    ...contextBudget(),
    ...delegationPolicy(),
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
${delegationPolicy().join("\n")}
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
${delegationPolicy().join("\n")}
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
${delegationPolicy().join("\n")}

Expected final response:
- Documents created or filled, with the confidence label distribution.
- Source evidence inspected, and the source mappings rebuilt.
- What stayed INFERRED, and on what basis.
- What stayed UNKNOWN, as questions for the outgoing maintainer.
- The readiness checks still incomplete, and why each one cannot be closed by writing text.`;
}

function formatList(values) {
  return values.length ? values.join(", ") : "none";
}
