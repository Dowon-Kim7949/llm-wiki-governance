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
export function indexBody(docLang, { indexDomainRead }) {
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
`;
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
`;
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
export function logBody(docLang, lastUpdated) {
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
