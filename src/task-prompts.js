import { normalizeLang } from "./i18n.js";

export const SUPPORTED_TASK_PROMPTS = new Set(["bootstrap", "onboard", "prepare", "feature", "fix", "refactor", "docs-sync", "okf-extract"]);

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

export function buildTaskPrompt({ task, cwd, projectType, profiles = [], agents = [], docLang = null }) {
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
    docLang
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
            : implementationPrompt(task, context);

  return {
    task,
    result: "pass",
    projectType: context.projectType,
    profiles: context.profiles,
    agents: context.agents,
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
export function initialEnrichmentWorkflow({ projectType = "unknown", entrypoints, docLang = null } = {}) {
  const entry = entrypoints || "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md";
  return [
    documentLanguageDirective(docLang),
    `1. Read ${entry} first.`,
    "2. Review the init-generated documents and their source_files to see what still needs grounding.",
    "3. Investigate the actual code, config, routing, public APIs, data models, and key workflows before making any claim.",
    ...evidenceFocus(projectType),
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
${initialEnrichmentWorkflow({ projectType: context.projectType, entrypoints: "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md", docLang: context.docLang })}

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
    "- Read-only by default: do not modify files in this workflow."
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

Required workflow:
${documentLanguageDirective(context.docLang)}
1. Read docs/llm-wiki/index.md first.
2. For a guided or newcomer task, or when the scope is unclear, first run 'llm-wiki prepare --task "<the task>"' (or the /llm-wiki-prepare skill) to scope the work and confirm the current behavior from evidence. If the docs conflict with the code, or the scope is larger than you expected, STOP and confirm with a human before implementing.
3. Locate related domain, API, component, architecture, workflow, and decision documents before editing.
4. Inspect actual source files before making claims or code changes.
5. Produce a short implementation plan.
6. Make the requested code change with the smallest safe scope.
7. Update every affected LLM-WIKI document in the same task.
8. Append docs/llm-wiki/log.md in append-only style with changed files, evidence, caveats, and review notes.
9. Keep CLI-created or agent-edited wiki documents as status: needs_review.
10. Do not promote any document to verified; verified is human-approved only.
11. Run relevant tests, or explain exactly why they were not run.

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

Required workflow:
${documentLanguageDirective(context.docLang)}
1. Read docs/llm-wiki/index.md first.
2. Detect changed code and documentation context using git status, git diff, and relevant source files.
3. Locate affected domain, API, component, architecture, workflow, and decision documents.
4. Inspect actual source files before deciding a wiki document is stale.
5. Update stale LLM-WIKI documents only; avoid unrelated code edits.
6. Append docs/llm-wiki/log.md in append-only style with changed docs, source evidence, caveats, and review notes.
7. Keep CLI-created or agent-edited wiki documents as status: needs_review.
8. Do not promote any document to verified; verified is human-approved only.
9. Run relevant validation or explain exactly why it was not run.

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

Expected final response:
- Extracted document list.
- Source evidence inspected.
- Unresolved wiki links or ambiguous concepts.
- Review items before any human approval.`;
}

function formatList(values) {
  return values.length ? values.join(", ") : "none";
}
