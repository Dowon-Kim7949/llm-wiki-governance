// Localized body content for generated wiki documents — the single
// language-selection layer for `init`/`quickstart` output (urgent i18n fix).
//
// Design:
//   - English is the default (this is an English-first product). Every English
//     branch below is byte-identical to the previous hardcoded body, so a default
//     run (docLang === "en") produces exactly the same files it did before, minus
//     the few strings that used to leak Korean (index/README/log/overview/domain).
//   - Korean is opt-in via `--doc-lang ko` / config `docLanguage: "ko"` and
//     reproduces (and completes) the previous Korean experience.
//   - ONLY prose is localized. Headings (## ...), titles (# ...), code spans,
//     file paths, JSON keys, frontmatter fields, status values, and evidence
//     locators stay verbatim in BOTH languages — they are technical identifiers,
//     and downstream logic (## Evidence alignment, enrichmentChecklist section
//     splitting, wiki-link/related resolution by title) depends on them.
//
// Leaf module: imports only i18n.js (normalizeLang) and task-prompts.js
// (apiServiceInventoryChecklist). No back-dependency on doc-templates.js/commands.js.
import { normalizeLang } from "../i18n.js";
import { apiServiceInventoryChecklist } from "../task-prompts.js";

// Two placeholder sentences kept verbatim from ENRICHMENT_PLACEHOLDER_SENTINELS
// (src/commands/scans.js). Embedding them in the Korean placeholder bodies makes
// `content.not_enriched` fire for a freshly-generated Korean wiki exactly like it
// does for English — without touching the sentinel registry.
const KO_SENTINEL_DRAFT = "이 문서는 `llm-wiki init --write`가 생성한 초안입니다.";
const KO_SENTINEL_TOPIC = "이 프로젝트에서 해당 주제의 기준 정보를 정리합니다.";

function isKo(docLang) {
  return normalizeLang(docLang) === "ko";
}

// ---- index.md ----------------------------------------------------------
// `indexDomainRead` is the localized read-order item 4 (see indexReadOrderItem).
// `greenfield` appends the planning entries (items 5-6); without it the body is
// byte-identical to the pre-greenfield one.
export function indexBody(docLang, { indexDomainRead, greenfield = false }) {
  if (isKo(docLang)) {
    return `# LLM-WIKI Index

이 문서는 프로젝트 LLM-WIKI의 공식 진입점입니다.

## Status

- 현재 문서는 CLI가 생성한 초안이므로 \`needs_review\` 상태입니다.
- 사람 검토가 끝난 뒤에만 \`verified\`로 승격할 수 있습니다.

## Recommended Read Order

1. \`docs/llm-wiki/index.md\`
2. \`docs/llm-wiki/README.md\`
3. \`docs/llm-wiki/project-profile.md\`
4. ${indexDomainRead}
${greenfield ? `5. [Requirements](./requirements/00_overview.md) — 프로젝트가 해야 할 일과 수용 기준(계획된 지식이며 구현 주장이 아닙니다)
6. \`docs/llm-wiki/decisions/\` — 아키텍처 결정 기록(\`doc_type: decision\`)
` : ""}`;
  }
  return `# LLM-WIKI Index

This document is the official entry point for the project's LLM-WIKI.

## Status

- This document is a CLI-generated draft, so its status is \`needs_review\`.
- It can be promoted to \`verified\` only after human review.

## Recommended Read Order

1. \`docs/llm-wiki/index.md\`
2. \`docs/llm-wiki/README.md\`
3. \`docs/llm-wiki/project-profile.md\`
4. ${indexDomainRead}
${greenfield ? `5. [Requirements](./requirements/00_overview.md) — what the project must do, with acceptance criteria (planned knowledge, not a claim about code)
6. \`docs/llm-wiki/decisions/\` — architecture decision records (\`doc_type: decision\`)
` : ""}`;
}

// Read-order item 4 of index.md — either a link to the domain overview (when
// domains are planned) or a generic pointer. The link path is a fixed identifier.
export function indexReadOrderItem(docLang, hasDomains) {
  if (isKo(docLang)) {
    return hasDomains
      ? "[Domain Overview](./domains/00_overview.md) — 도메인 지도와 작업 대상 문서"
      : "작업 대상 도메인 문서와 관련 source files";
  }
  return hasDomains
    ? "[Domain Overview](./domains/00_overview.md) — the domain map and the docs you will work in"
    : "The domain documents you will work in and their related source files";
}

// ---- README.md ---------------------------------------------------------
export function readmeBody(docLang) {
  if (isKo(docLang)) {
    return `# LLM-WIKI README

이 디렉터리는 프로젝트 지식, 의사결정, 작업 규칙을 LLM과 개발자가 함께 참조하기 위한 문서 공간입니다.

## Operating Rules

- 모든 wiki 문서는 YAML frontmatter를 가집니다.
- CLI 또는 LLM이 생성/수정한 문서는 \`needs_review\` 상태를 유지합니다.
- 민감정보 raw value는 기록하지 않습니다.
- 변경 기록은 \`docs/llm-wiki/log.md\`에 append-only로 남깁니다.
`;
  }
  return `# LLM-WIKI README

This directory is a shared documentation space where LLMs and developers reference the project's knowledge, decisions, and working rules together.

## Operating Rules

- Every wiki document has YAML frontmatter.
- Documents created or edited by the CLI or an LLM stay at status \`needs_review\`.
- Never record raw sensitive values.
- Record changes append-only in \`docs/llm-wiki/log.md\`.
`;
}

// ---- log.md ------------------------------------------------------------
// `manifestFound` is false when the repository had no manifest to cite (an empty
// or manifest-less repository): the entry then says so instead of naming a file
// that is not there. True keeps the body byte-identical.
export function logBody(docLang, lastUpdated, { manifestFound = true } = {}) {
  if (!manifestFound) {
    const evidenceLine = isKo(docLang)
      ? "  - (없음: 생성 시점에 애플리케이션 소스나 매니페스트가 없었다)"
      : "  - (none: no application source or manifest existed at creation)";
    return logBody(docLang, lastUpdated).replace("  - package.json\n", `${evidenceLine}\n`);
  }
  if (isKo(docLang)) {
    return `# LLM-WIKI Change Log

이 문서는 append-only 변경 로그입니다. 기존 항목은 수정하지 말고 새 변경 사항을 위에 추가합니다.

## ${lastUpdated} - LLM-WIKI 초기 문서 생성

- status: needs_review
- actor: llm-wiki-cli
- scope: docs
- changed:
  - docs/llm-wiki/
- summary:
  - \`llm-wiki init --write\` 명령으로 초기 LLM-WIKI 문서 구조를 생성했다.
- evidence:
  - package.json
- caveats:
  - CLI 생성 초안이므로 사람 검토가 필요하다.
`;
  }
  return `# LLM-WIKI Change Log

This is an append-only change log. Do not edit existing entries; add new changes at the top.

## ${lastUpdated} - LLM-WIKI initial documents created

- status: needs_review
- actor: llm-wiki-cli
- scope: docs
- changed:
  - docs/llm-wiki/
- summary:
  - Created the initial LLM-WIKI document structure with \`llm-wiki init --write\`.
- evidence:
  - package.json
- caveats:
  - This is a CLI-generated draft and requires human review.
`;
}

// ---- DOMAIN_FEATURES.md ------------------------------------------------
// `domainFeaturesDomains` is "" or a pre-built "## Domains\n\n<links>\n" block.
export function domainFeaturesBody(docLang, { domainFeaturesDomains }) {
  if (isKo(docLang)) {
    return `# Domain Features

이 문서는 사용자 대면 기능과 업무 도메인 기능을 소스 근거와 연결합니다.
${domainFeaturesDomains}
## What To Inspect

- 도메인 모듈, 서비스, 스토어, 컨트롤러, 라우트, 컴포넌트, 워크플로.
- 기대 동작을 보여주는 테스트나 픽스처.
- 경계를 넘어 데이터를 옮기는 API 클라이언트나 서비스 모듈.

## API Services

각 도메인이 사용하는 API 서비스를 문서화합니다. 서비스마다 다음을 담습니다:

${apiServiceInventoryChecklist(docLang).join("\n")}

## Open Questions

- 소스 근거나 사람 검토로 해소되기 전까지 불확실한 주장은 여기에 남깁니다. ${KO_SENTINEL_DRAFT}

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
`;
  }
  return `# Domain Features

This document maps user-facing and business-domain features to source evidence.
${domainFeaturesDomains}
## What To Inspect

- Domain modules, services, stores, controllers, routes, components, and workflows.
- Tests or fixtures that show expected behavior.
- API clients or service modules that move data across boundaries.

## API Services

Document each API service used by each domain. For every service, capture:

${apiServiceInventoryChecklist(docLang).join("\n")}

## Open Questions

- Keep uncertain claims here until source evidence or human review resolves them.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
`;
}

// ---- domains/00_overview.md --------------------------------------------
// `domainsSection` is the localized domain link list or the empty-domains note.
export function overviewBody(docLang, { domainsSection }) {
  if (isKo(docLang)) {
    return `# Domain Overview

이 문서는 프로젝트의 도메인 지도입니다.

## Domains

${domainsSection}

## API Services

지도에 오른 도메인이 사용하는 API 서비스를 문서화합니다. 서비스마다 다음을 담습니다:

${apiServiceInventoryChecklist(docLang).join("\n")}

## Evidence

- 이 지도를 완성하며 확인한 source 파일, 테스트, 라우트, 클라이언트 모듈을 추가합니다.
- 특정 라우트에 근거가 달릴 때는 \`src/routes.ts#route:/example\`처럼 frontmatter \`evidence\` 항목을 여기에 함께 적습니다.

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
`;
  }
  return `# Domain Overview

This document is the domain map for the project.

## Domains

${domainsSection}

## API Services

Document each API service used by the mapped domains. For every service, capture:

${apiServiceInventoryChecklist(docLang).join("\n")}

## Evidence

- Add source files, tests, routes, and client modules inspected while completing this map.
- Mention any optional frontmatter \`evidence\` entries here, such as \`src/routes.ts#route:/example\`, when a claim depends on a specific route.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
`;
}

// The empty-domains note used by the overview when no domain was detected.
export function overviewEmptyDomainsNote(docLang) {
  return isKo(docLang)
    ? "- 자동 탐지된 domain이 없습니다. 프로젝트의 실제 업무 경계를 검토해 수동으로 추가하십시오."
    : "- No domains were auto-detected. Review the project's real business boundaries and add them by hand.";
}

// ---- project-profile.md ------------------------------------------------
// `__PROJECT_TYPE__` is replaced with the detected type by doc-templates.js.
export function projectProfileBody(docLang) {
  if (isKo(docLang)) {
    return `# Project Profile

## Detected Project

- type: \`__PROJECT_TYPE__\`
- confidence: generated during init

## Summary

- 한두 문장 요약: 소스 근거를 확인한 뒤 프로젝트의 목적, 주 런타임, 소유 경계를 기술합니다. ${KO_SENTINEL_DRAFT}

## What To Inspect

- 패키지 매니페스트, 빌드 설정, 런타임 진입점, 소스 디렉터리, 테스트, 배포 파일.
- 기존 README, 릴리스 노트, 이슈 템플릿, 아키텍처 문서.

## Evidence

- project profile을 완성하며 확인한 source 파일과 명령을 추가합니다.
- 정밀 파일·라인·심볼·섹션·라우트 참조가 필요하면 frontmatter \`evidence\` 항목을 여기에 함께 적습니다.

## Open Questions

- 불명확한 소유, 미지원 환경, 미완 설정 단계, 릴리스 가정을 추적합니다.

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
- 이 문서를 \`verified\`로 승격하지 않습니다. verified는 사람 승인 전용입니다.
`;
  }
  return `# Project Profile

## Detected Project

- type: \`__PROJECT_TYPE__\`
- confidence: generated during init

## Summary

- Concise summary: describe the project purpose, primary runtime, and ownership boundaries after inspecting source evidence.

## What To Inspect

- Package manifests, build configuration, runtime entrypoints, source directories, tests, and deployment files.
- Existing README, release notes, issue templates, or architecture docs.

## Evidence

- Add source files and commands inspected while completing the project profile.
- Mention any optional frontmatter \`evidence\` entries here for precise file, line, symbol, section, or route references.

## Open Questions

- Track unclear ownership, unsupported environments, incomplete setup steps, or release assumptions.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
- Do not promote this document to \`verified\`; verified status is human-approved only.
`;
}

// ---- generic generated doc body ---------------------------------------
// Used for every core/profile doc not in the explicit map (ARCHITECTURE, API,
// DATA_MODEL, GLOSSARY, OPERATIONS, SECURITY, profiles/*, template stubs, ...).
export function defaultDocBody(docLang, title, domainApiSection) {
  if (isKo(docLang)) {
    return `# ${title}

## Summary

- 한두 문장 요약: 소스 근거로 뒷받침해 이 문서의 목적을 기술합니다. ${KO_SENTINEL_TOPIC}
- Status: ${KO_SENTINEL_DRAFT}

## What To Inspect

- frontmatter \`source_files\`에 나열된 소스 파일.
- frontmatter \`related\`에 나열된 관련 wiki 문서.
- 이 주제와 연결된 테스트, 설정, 라우트, API, 워크플로, 공개 인터페이스.

## Evidence

- 이 문서를 완성하며 확인한 파일 경로, 심볼, 라우트, 명령, 테스트 이름을 추가합니다.
- \`src/api.ts#symbol:getUser\`, \`src/routes.ts#route:/users\`, \`README.md#section:Usage\` 같은 선택적 frontmatter \`evidence\` 항목을 여기에 함께 적습니다.
- 추측보다 소스 근거에 기반한 서술을 우선합니다.
${domainApiSection}

## Open Questions

- 불명확한 소유, 누락된 소스 근거, 오래된 가정, 사람 검토가 필요한 결정을 추적합니다.

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
- 이 문서를 \`verified\`로 승격하지 않습니다. verified는 사람 승인 전용입니다.
`;
  }
  return `# ${title}

## Summary

- Concise summary: describe the purpose of this document in one or two source-backed bullets.
- Status: this is a \`needs_review\` draft created by \`llm-wiki init --write\`.

## What To Inspect

- Source files listed in frontmatter \`source_files\`.
- Related wiki documents listed in frontmatter \`related\`.
- Tests, configuration, routes, APIs, workflows, or public interfaces connected to this topic.

## Evidence

- Add file paths, symbols, routes, commands, or test names inspected while completing this document.
- Mention any optional frontmatter \`evidence\` entries here, such as \`src/api.ts#symbol:getUser\`, \`src/routes.ts#route:/users\`, or \`README.md#section:Usage\`.
- Prefer source-backed statements over guesses.
${domainApiSection}

## Open Questions

- Track unclear ownership, missing source evidence, stale assumptions, or decisions that need human review.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
- Do not promote this document to \`verified\`; verified status is human-approved only.
`;
}

// The `## API Services` block appended to domain-oriented default docs.
export function domainApiServicesSection(docLang) {
  if (isKo(docLang)) {
    return `
## API Services

이 도메인이 사용하는 API 서비스를 문서화합니다. 서비스마다 다음을 담습니다:

${apiServiceInventoryChecklist(docLang).join("\n")}
`;
  }
  return `
## API Services

Document each API service used by this domain. For every service, capture:

${apiServiceInventoryChecklist(docLang).join("\n")}
`;
}

// ---- detected per-domain doc -------------------------------------------
export function domainDocBody(docLang, plan, domainApiSection) {
  const sources = plan.sourceFiles.map((sourceFile) => `- \`${sourceFile}\``).join("\n");
  if (isKo(docLang)) {
    return `# ${plan.domainName}

이 문서는 \`llm-wiki init --write\`가 디렉터리 경계로 탐지한 도메인 \`${plan.domainName}\`의 초안입니다. 실제 책임과 로직은 아래 source를 확인한 뒤 사람이 보강합니다.

## Responsibility

- 이 도메인이 담당하는 업무 경계와 핵심 워크플로를 source를 확인한 뒤 정리합니다.
- 추측하지 말고 실제 코드/테스트/라우트 근거로 기술합니다.

## Source Directories

${sources}
${domainApiSection}
## Evidence

- 위 source 디렉터리의 엔트리포인트, 서비스, 라우트, 모델, 테스트를 확인해 근거를 채웁니다.
- frontmatter \`evidence\`에 \`파일#L10\`, \`파일#symbol:Name\`, \`파일#route:/path\` 같은 정밀 참조를 추가할 수 있습니다.

## Open Questions

- 불확실한 소유·경계·의존성은 사람 검토 전까지 여기에 남깁니다.

## Review Notes

- 사람 검토 전까지 \`needs_review\` 상태를 유지합니다.
- 이 문서를 \`verified\`로 승격하지 않습니다. verified는 사람 승인 전용입니다.
`;
  }
  return `# ${plan.domainName}

This is a draft for the domain \`${plan.domainName}\`, detected by \`llm-wiki init --write\` from directory boundaries. Enrich the actual responsibilities and logic by hand after inspecting the sources below.

## Responsibility

- Describe this domain's business boundary and key workflows after inspecting the sources.
- Do not guess; describe it from real code, tests, and route evidence.

## Source Directories

${sources}
${domainApiSection}
## Evidence

- Inspect the entrypoints, services, routes, models, and tests in the source directories above to fill in evidence.
- You can add precise references to frontmatter \`evidence\`, such as \`file#L10\`, \`file#symbol:Name\`, or \`file#route:/path\`.

## Open Questions

- Keep uncertain ownership, boundaries, and dependencies here until human review.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
- Do not promote this document to \`verified\`; verified status is human-approved only.
`;
}

// ---- greenfield (init --greenfield) --------------------------------------
// Bodies for a project that has little or no source yet. They record INTENT —
// purpose, requirements, acceptance criteria, decisions — and say in every
// document that intent is not evidence: none of them cites a source, and each
// tells the reader when and how one gets linked. Generated documents carry an
// ENRICHMENT_PLACEHOLDER_SENTINELS sentence (or KO_SENTINEL_DRAFT) so
// content.not_enriched and review --approve treat an unfilled one as a scaffold;
// the two templates carry it in the section a copy must replace.

// project-profile.md, greenfield variant. `__PROJECT_TYPE__` as in projectProfileBody.
export function greenfieldProjectProfileBody(docLang) {
  if (isKo(docLang)) {
    return `# Project Profile

## Detected Project

- type: \`__PROJECT_TYPE__\`
- confidence: generated during init
- stage: greenfield — 이 wiki를 만들 때 애플리케이션 소스가 거의 또는 전혀 없었습니다.

## Summary

- 한두 문장 요약: 이 프로젝트가 누구의 어떤 문제를 푸는지, 성공이 어떤 모습인지 프로젝트 소유자의 말로 기술합니다. ${KO_SENTINEL_DRAFT}

## Scope

- 범위: 첫 릴리스들이 제공해야 하는 기능. 각각을 [Requirements](./requirements/00_overview.md)의 요구사항 문서로 연결합니다.
- 비목표: 이 프로젝트가 의도적으로 하지 않는 일.

## Constraints

- 모든 요구사항이 물려받는 비기능 제약: 런타임과 플랫폼, 성능, 보안과 개인정보, 접근성, 호환성, 예산, 일정.
- 제약의 근거가 된 결정은 \`docs/llm-wiki/decisions/\`에 ADR로 남깁니다.

## Evidence

- 계획된 지식입니다. 애플리케이션 소스가 생기기 전까지 이 문서는 어떤 소스도 인용하지 않습니다(\`source_files: []\`). 존재하지 않는 파일을 넣지 않습니다.
- 코드가 생기면 매니페스트와 진입점(예: \`package.json\`, \`src/main.ts\`)을 \`source_files\`에 넣고, 위의 계획 서술을 코드가 실제로 하는 일로 바꿉니다.

## Open Questions

- 열린 제품 질문, 확정되지 않은 제약, 아직 내리지 않은 결정을 추적합니다.

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
- 코드가 생기기 전에 승인하면 적힌 의도를 승인하는 것이지 구현을 승인하는 것이 아닙니다.
`;
  }
  return `# Project Profile

## Detected Project

- type: \`__PROJECT_TYPE__\`
- confidence: generated during init
- stage: greenfield — little or no application source existed when this wiki was created.

## Summary

- Concise summary: describe the problem this project solves, for whom, and what success looks like, in the words of the people who own the project.

## Scope

- In scope: the capabilities the first releases must deliver. Link each one to its requirement document in [Requirements](./requirements/00_overview.md).
- Non-goals: what this project deliberately does not do.

## Constraints

- Non-functional constraints every requirement inherits: runtime and platform, performance, security and privacy, accessibility, compatibility, budget, and deadlines.
- Record the decision behind a constraint as an ADR in \`docs/llm-wiki/decisions/\`.

## Evidence

- Planned knowledge: until application source exists, this document cites no source (\`source_files: []\`). Do not add a file that is not there.
- When code exists, add the manifest and entrypoints (for example \`package.json\`, \`src/main.ts\`) to \`source_files\` and replace the planned statements above with what the code actually does.

## Open Questions

- Track open product questions, unconfirmed constraints, and decisions not yet made.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
- Approving it before code exists approves the stated intent, not an implementation.
`;
}

// docs/llm-wiki/requirements/00_overview.md — the requirements map.
export function requirementsOverviewBody(docLang) {
  if (isKo(docLang)) {
    return `# Requirements

이 문서는 요구사항 지도입니다. 요구사항 하나당 \`docs/llm-wiki/requirements/\` 아래 문서 하나를 두고, [requirement template](../templates/REQUIREMENT.template.md)으로 만듭니다.

## Requirements

- 아직 없습니다. 각 요구사항을 그 문서로 가는 Markdown 링크 한 줄로 나열합니다(예: 제목 \`REQ-001: <short title>\`, 대상 \`./REQ-001-<short-slug>.md\`). ${KO_SENTINEL_DRAFT}

## Lifecycle

- 계획: 요구사항 문서는 의도한 동작과 수용 기준을 적습니다. 소스를 인용하지 않으며 사람이 검토하기 전까지 \`needs_review\`입니다.
- 승인: \`llm-wiki review --approve <path>\`가 계획을 \`verified\`로 표시합니다. 이것은 요구사항 승인이지 구현 주장이 아닙니다. \`llm-wiki validate\`는 연결된 근거가 없는 승인 요구사항을 \`evidence.planned_unlinked\`(info)로 보고합니다.
- 연결: 코드가 생기면 구현 파일과 테스트를 요구사항의 frontmatter \`evidence\`에 넣습니다. \`validate\`는 각 참조가 실제로 있는지 확인합니다. 그 코드가 바뀌면 \`impact\`와 \`drift\`가 승인된 요구사항을 다시 검토 대상으로 지목합니다(이 두 검사를 켜는 모드에서만 — \`llm-wiki mode\`로 확인하며, lite는 둘 다 끕니다).
- 변경: 요구사항이 바뀌면 문서를 고치고(다시 \`needs_review\`), 연결된 코드와 테스트는 사람이 다시 확인합니다. CLI는 요구사항 수정을 코드 쪽으로 추적하지 않습니다.
- \`llm-wiki stats\`는 계획 문서를 승인 여부와 근거 연결 상태로 세고, \`llm-wiki list-docs --doc-type requirement\`는 목록을 보여 줍니다.

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
`;
  }
  return `# Requirements

This is the requirements map: one document per requirement under \`docs/llm-wiki/requirements/\`, created from [the requirement template](../templates/REQUIREMENT.template.md).

## Requirements

- None yet. Concise summary: describe each requirement as one Markdown link to its document (for example the title \`REQ-001: <short title>\` pointing at \`./REQ-001-<short-slug>.md\`).

## Lifecycle

- Planned: a requirement document states intended behavior and its acceptance criteria. It cites no source and stays \`needs_review\` until a human reviews it.
- Approved: \`llm-wiki review --approve <path>\` marks the plan \`verified\`. That approves the requirement; it does not claim an implementation. \`llm-wiki validate\` reports an approved requirement with nothing linked as \`evidence.planned_unlinked\` (info).
- Linked: when code exists, add the implementing files and tests to the requirement's frontmatter \`evidence\`. \`validate\` checks that each reference exists; \`impact\` and \`drift\` flag the approved requirement for re-review when that code changes (in the modes that run them — \`llm-wiki mode\` shows which; lite turns both off).
- Changed: when a requirement changes, edit its document (it returns to \`needs_review\`) and re-check the linked code and tests by hand — the CLI does not trace a requirement edit forward into code.
- \`llm-wiki stats\` counts planned documents by approval and linked evidence; \`llm-wiki list-docs --doc-type requirement\` lists them.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
`;
}

// docs/llm-wiki/templates/REQUIREMENT.template.md — copied once per requirement.
export function requirementTemplateBody(docLang) {
  if (isKo(docLang)) {
    return `# REQ-NNN: Requirement Title

요구사항마다 이 템플릿을 \`docs/llm-wiki/requirements/REQ-NNN-<short-slug>.md\`로 복사합니다. 문서 하나에 요구사항 하나를 두어야 근거·drift·impact가 요구사항 단위로 유지됩니다. 복사본 frontmatter의 \`title\`과 \`doc_type: requirement\`를 정하고, [Requirements](../requirements/00_overview.md)에서 링크하고, 사람이 검토하기 전까지 \`status: needs_review\`로 둡니다.

## Requirement

- 한두 문장 요약: 의도한 동작 — 누가, 어떤 조건에서, 무엇을 필요로 하는지 — 을 프로젝트 소유자가 말한 대로 적습니다. 이것은 계획된 지식이지 기존 코드의 설명이 아닙니다. ${KO_SENTINEL_DRAFT}

## Acceptance Criteria

- AC-1: 관찰하고 확인할 수 있는 조건(given / when / then). 각 기준은 테스트나 이름 붙인 수동 확인으로 검사할 수 있어야 합니다.
- AC-2: ...

## Constraints

- 이 요구사항에만 해당하는 비기능 제약(성능, 보안, 접근성, 호환성). 프로젝트 전체 제약은 project profile에 둡니다.

## Related Decisions

- 이 요구사항을 결정한 \`docs/llm-wiki/decisions/\`의 ADR을 링크합니다.

## Evidence

- 아직 없음: 코드가 이 요구사항을 구현하기 전까지 소스를 인용하지 않습니다(\`source_files: []\`, \`evidence\` 없음).
- 코드가 생기면 구현 소스 파일과 수용 기준을 확인하는 테스트를 frontmatter \`evidence\`(예: \`src/<module>.ts#symbol:<function>\`, \`tests/<module>.test.ts\`)와 여기에 적고, 각 테스트가 어느 기준을 덮는지 밝힙니다.
- 참조가 해석된다는 것은 구현 위치를 보여 줄 뿐 완료를 뜻하지 않습니다. 테스트를 돌리고, 판단은 검토가 합니다.

## Open Questions

- 소유자의 결정이 필요한 미해결 제품 질문과 가정.

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
- 승인(\`verified\`)은 요구사항을 승인하는 것이지 구현을 승인하는 것이 아닙니다. \`llm-wiki validate\`는 연결된 근거가 없는 승인 요구사항을 \`evidence.planned_unlinked\`(info)로 보고합니다.
`;
  }
  return `# REQ-NNN: Requirement Title

Copy this template to \`docs/llm-wiki/requirements/REQ-NNN-<short-slug>.md\` for each requirement — one requirement per document, so evidence, drift, and impact stay per requirement. Set \`title\` and \`doc_type: requirement\` in the copy's frontmatter, link it from [Requirements](../requirements/00_overview.md), and keep \`status: needs_review\` until a human reviews it.

## Requirement

- Concise summary: describe the intended behavior — who needs what, under which condition — as the project's owners stated it. This is planned knowledge, not a description of existing code.

## Acceptance Criteria

- AC-1: An observable, checkable condition (given / when / then). Each criterion should be checkable by a test or a named manual check.
- AC-2: ...

## Constraints

- Non-functional constraints specific to this requirement (performance, security, accessibility, compatibility). Project-wide constraints live in the project profile.

## Related Decisions

- Link the ADRs in \`docs/llm-wiki/decisions/\` that shape this requirement.

## Evidence

- None yet: until code implements this requirement, it cites no source (\`source_files: []\`, no \`evidence\`).
- When code exists, list the implementing source files and the tests that check the acceptance criteria in frontmatter \`evidence\` (for example \`src/<module>.ts#symbol:<function>\`, \`tests/<module>.test.ts\`) and here, naming which criteria each test covers.
- A resolving reference shows where the requirement is implemented, never that it is complete. Run the tests; review decides.

## Open Questions

- Unresolved product questions and assumptions that need the owner's decision.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
- Approving it (\`verified\`) approves the requirement, not an implementation; \`llm-wiki validate\` reports an approved requirement with nothing linked as \`evidence.planned_unlinked\` (info).
`;
}

// docs/llm-wiki/templates/DECISION_LOG.template.md, greenfield variant: an ADR
// skeleton. The default (non-greenfield) template stays the generic body.
export function decisionTemplateBody(docLang) {
  if (isKo(docLang)) {
    return `# ADR-NNNN: Decision Title

아키텍처 결정마다 이 템플릿을 \`docs/llm-wiki/decisions/ADR-NNNN-<short-slug>.md\`로 복사합니다. 복사본 frontmatter의 \`title\`과 \`doc_type: decision\`을 정하고, 사람이 검토하기 전까지 \`status: needs_review\`로 둡니다.

## Decision Status

- Proposed | Accepted | Superseded by ADR-NNNN — 결정 자체의 상태이며, 문서의 검토 \`status\`와는 별개입니다.

## Context

- 결정이 필요했던 문제, 압력, 제약. 이 결정이 받치는 요구사항을 링크합니다.

## Decision

- 한두 문장 요약: 무엇을 결정했는지, 읽는 사람이 코드를 그 결정과 대조할 수 있게 적습니다. ${KO_SENTINEL_DRAFT}

## Alternatives Considered

- 기각한 선택지와 그 이유.

## Consequences

- 쉬워지는 것, 어려워지는 것, 앞으로 계속 참이어야 하는 것.

## Evidence

- 계획된 지식입니다. 결정이 아직 구현되지 않았다면 ADR은 소스를 인용하지 않아도 됩니다. 승인(\`verified\`)은 결정이 받아들여졌다는 기록이지 코드가 그것을 따른다는 뜻이 아닙니다.
- 코드가 결정을 구현하면 그 파일을 frontmatter \`evidence\`(예: \`src/<module>.ts\`)와 여기에 적습니다. 그때부터 그 코드가 바뀌면 drift와 impact가 ADR을 지목합니다.

## Review Notes

- 사람 검토가 끝나기 전까지 이 문서를 \`needs_review\`로 유지합니다.
`;
  }
  return `# ADR-NNNN: Decision Title

Copy this template to \`docs/llm-wiki/decisions/ADR-NNNN-<short-slug>.md\` for each architecture decision. Set \`title\` and \`doc_type: decision\` in the copy's frontmatter and keep \`status: needs_review\` until a human reviews it.

## Decision Status

- Proposed | Accepted | Superseded by ADR-NNNN — the decision's own state, separate from the document's review \`status\`.

## Context

- The problem, the forces, and the constraints that made a decision necessary. Link the requirements it serves.

## Decision

- Concise summary: describe what was decided, stated so a reader can check code against it.

## Alternatives Considered

- Each option that was rejected, and why.

## Consequences

- What becomes easier, what becomes harder, and what must now stay true.

## Evidence

- Planned knowledge: an ADR may cite no source while the decision is not implemented. Approving it (\`verified\`) records that the decision was accepted, not that code follows it.
- When code implements the decision, list the implementing files in frontmatter \`evidence\` (for example \`src/<module>.ts\`) and here; drift and impact then flag the ADR when that code changes.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
`;
}
