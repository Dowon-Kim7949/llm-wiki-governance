export const SUPPORTED_TASK_PROMPTS = new Set(["bootstrap", "feature", "fix", "refactor", "docs-sync", "okf-extract"]);

export function buildTaskPrompt({ task, cwd, projectType, profiles = [], agents = [] }) {
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
    agents: agents.length ? agents : ["codex", "claude"]
  };

  const prompt = task === "bootstrap"
    ? bootstrapPrompt(context)
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

export function apiServiceInventoryChecklist() {
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
export function initialEnrichmentWorkflow({ projectType = "unknown", entrypoints } = {}) {
  const entry = entrypoints || "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md";
  return [
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
${initialEnrichmentWorkflow({ projectType: context.projectType, entrypoints: "the nearest AGENTS.md (or your agent's instruction file) and docs/llm-wiki/index.md" })}

Expected final response:
- Changed wiki docs (and any domain docs enriched).
- Source evidence inspected.
- validate / audit / stats run and results.
- Areas with thin or missing evidence, and items a human must review before verified.`;
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
1. Read docs/llm-wiki/index.md first.
2. Locate related domain, API, component, architecture, workflow, and decision documents before editing.
3. Inspect actual source files before making claims or code changes.
4. Produce a short implementation plan.
5. Make the requested code change with the smallest safe scope.
6. Update every affected LLM-WIKI document in the same task.
7. Append docs/llm-wiki/log.md in append-only style with changed files, evidence, caveats, and review notes.
8. Keep CLI-created or agent-edited wiki documents as status: needs_review.
9. Do not promote any document to verified; verified is human-approved only.
10. Run relevant tests, or explain exactly why they were not run.

When a domain document mentions API usage, include this API Services inventory:
${apiServiceInventoryChecklist().join("\n")}

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
${apiServiceInventoryChecklist().join("\n")}

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
