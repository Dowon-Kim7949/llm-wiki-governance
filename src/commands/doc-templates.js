// Generated wiki-document content templates (docMetadata + per-doc body
// builders), extracted from commands.js on 2026-07-15 (behavior-preserving).
// Pure content generation from detection/domain inputs; no findings/scan logic.
import path from "node:path";
import { toPosix } from "../files.js";
import { todayIsoDate } from "../template-renderer.js";
import { apiServiceInventoryChecklist } from "../task-prompts.js";
import { emptyDomainContext } from "./domains.js";

export function docMetadata(rel, detection, lastUpdated = todayIsoDate(), domainContext = emptyDomainContext()) {
  const fallbackTitle = titleFromPath(rel);
  const commonRelated = ["docs/llm-wiki/index.md", "docs/llm-wiki/log.md"].filter((item) => item !== rel);

  // A detected individual domain document: doc_type `domain`, source_files from
  // the detected directories, linked back to the overview and DOMAIN_FEATURES.
  const domainPlan = domainContext.plans.find((plan) => plan.rel === rel);
  if (domainPlan) {
    return {
      title: domainPlan.domainName,
      docType: "domain",
      sourceFiles: domainPlan.sourceFiles,
      related: ["docs/llm-wiki/domains/00_overview.md", "docs/llm-wiki/DOMAIN_FEATURES.md", ...domainContext.relatedExtras],
      body: domainDocBody(domainPlan)
    };
  }

  // Dynamic Domains section for the overview: markdown links to each detected
  // domain doc (which also makes those docs non-orphan), or a review prompt.
  const hasDomains = domainContext.plans.length > 0;
  const domainsSection = hasDomains
    ? domainLinkList(domainContext.plans, "./")
    : "- 자동 탐지된 domain이 없습니다. 프로젝트의 실제 업무 경계를 검토해 수동으로 추가하십시오.";

  // P6 (orphan/link pre-wiring): when domain docs are planned, wire them into the
  // two top-level entry points too — not only the overview. The index links the
  // domain map, and DOMAIN_FEATURES lists each domain doc. Gated on hasDomains so
  // a domain-less scaffold stays byte-identical.
  const indexDomainRead = hasDomains
    ? "[Domain Overview](./domains/00_overview.md) — 도메인 지도와 작업 대상 문서"
    : "작업 대상 도메인 문서와 관련 source files";
  const indexRelated = hasDomains
    ? ["docs/llm-wiki/README.md", "docs/llm-wiki/domains/00_overview.md", "docs/llm-wiki/log.md"]
    : ["docs/llm-wiki/README.md", "docs/llm-wiki/log.md"];
  const domainFeaturesDomains = hasDomains
    ? `\n## Domains\n\n${domainLinkList(domainContext.plans, "./domains/")}\n`
    : "";

  const map = {
    "docs/llm-wiki/index.md": {
      title: "LLM-WIKI Index",
      docType: "wiki_index",
      related: indexRelated,
      body: `# LLM-WIKI Index

이 문서는 프로젝트 LLM-WIKI의 공식 진입점입니다.

## Status

- 현재 문서는 CLI가 생성한 초안이므로 \`needs_review\` 상태입니다.
- 사람 검토가 끝난 뒤에만 \`verified\`로 승격할 수 있습니다.

## Recommended Read Order

1. \`docs/llm-wiki/index.md\`
2. \`docs/llm-wiki/README.md\`
3. \`docs/llm-wiki/project-profile.md\`
4. ${indexDomainRead}
`
    },
    "docs/llm-wiki/README.md": {
      title: "LLM-WIKI README",
      docType: "wiki_readme",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/project-profile.md"],
      body: `# LLM-WIKI README

이 디렉터리는 프로젝트 지식, 의사결정, 작업 규칙을 LLM과 개발자가 함께 참조하기 위한 문서 공간입니다.

## Operating Rules

- 모든 wiki 문서는 YAML frontmatter를 가집니다.
- CLI 또는 LLM이 생성/수정한 문서는 \`needs_review\` 상태를 유지합니다.
- 민감정보 raw value는 기록하지 않습니다.
- 변경 기록은 \`docs/llm-wiki/log.md\`에 append-only로 남깁니다.
`
    },
    "docs/llm-wiki/log.md": {
      title: "LLM-WIKI Change Log",
      docType: "change_log",
      related: ["docs/llm-wiki/index.md"],
      body: `# LLM-WIKI Change Log

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
`
    },
    "docs/llm-wiki/DOMAIN_FEATURES.md": {
      title: "Domain Features",
      docType: "domain_overview",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/domains/00_overview.md"],
      body: `# Domain Features

This document maps user-facing and business-domain features to source evidence.
${domainFeaturesDomains}
## What To Inspect

- Domain modules, services, stores, controllers, routes, components, and workflows.
- Tests or fixtures that show expected behavior.
- API clients or service modules that move data across boundaries.

## API Services

Document each API service used by each domain. For every service, capture:

${apiServiceInventoryChecklist().join("\n")}

## Open Questions

- Keep uncertain claims here until source evidence or human review resolves them.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
`
    },
    "docs/llm-wiki/domains/00_overview.md": {
      title: "Domain Overview",
      docType: "domain_overview",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/DOMAIN_FEATURES.md"],
      body: `# Domain Overview

This document is the domain map for the project.

## Domains

${domainsSection}

## API Services

Document each API service used by the mapped domains. For every service, capture:

${apiServiceInventoryChecklist().join("\n")}

## Evidence

- Add source files, tests, routes, and client modules inspected while completing this map.
- Mention any optional frontmatter \`evidence\` entries here, such as \`src/routes.ts#route:/example\`, when a claim depends on a specific route.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
`
    },
    "docs/llm-wiki/profiles/okf-v0.1.md": {
      title: "OKF v0.1 Profile",
      docType: "profile",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/GLOSSARY.md"],
      body: `# OKF v0.1 Profile

This profile is for projects that want selected LLM-WIKI documents to double as an OKF v0.1 knowledge corpus.

## Validation Contract

- Add frontmatter \`type\` explicitly to every document validated with \`--profile okf-v0.1\`.
- Keep standard LLM-WIKI \`doc_type\`; do not assume \`doc_type\` automatically satisfies OKF \`type\`.
- Optional \`aliases\` must be an array when present.
- Optional \`tags\` must be an array when present.
- Body wiki links such as \`[[Concept Name]]\` must resolve to a wiki file path, basename, frontmatter \`title\`, or frontmatter \`aliases\` entry.

## OKF-Style Writing

- Start concept-style documents with a short summary section.
- Use concise headings and bullet lists.
- Prefer durable facts, stable relationships, and explicit source evidence.
- Use \`[[wiki links]]\` only when the linked concept is known or intentionally queued for review.

## Evidence

- Add source documents, source files, or extraction inputs inspected before making claims.
- Mention any optional frontmatter \`evidence\` entries here for precise file, line, symbol, section, or route references.

## Open Questions

- Track unresolved aliases, missing concepts, unclear entity boundaries, and extraction caveats.

## Review Notes

- Keep AI-extracted or AI-edited OKF-compatible documents as \`needs_review\` until human review is complete.
`
    },
    "docs/llm-wiki/templates/OKF_CONCEPT.template.md": okfTemplateMetadata({
      title: "OKF Concept Template",
      okfType: "concept",
      heading: "Concept Name",
      summary: "Define the concept in one or two concise, source-backed bullets.",
      sections: [
        ["Definition", ["State the durable meaning of this concept.", "Link related concepts with `[[Concept Name]]` where known."]],
        ["Relationships", ["List parent, child, adjacent, or contrasting concepts.", "Use bullets and avoid long prose."]]
      ]
    }),
    "docs/llm-wiki/templates/OKF_PROJECT.template.md": okfTemplateMetadata({
      title: "OKF Project Template",
      okfType: "project",
      heading: "Project Name",
      summary: "Summarize the project purpose, owner, and current state in concise bullets.",
      sections: [
        ["Scope", ["Describe the project boundary and notable exclusions.", "Link related systems, teams, or concepts with `[[Concept Name]]`."]],
        ["Status", ["Capture current state, milestones, blockers, and review caveats."]]
      ]
    }),
    "docs/llm-wiki/templates/OKF_API_REFERENCE.template.md": okfTemplateMetadata({
      title: "OKF API Reference Template",
      okfType: "api_reference",
      heading: "API Name",
      summary: "Summarize what the API does and which workflow or domain uses it.",
      sections: [
        ["Contract", ["Record endpoint or client module, method or call signature, request shape, and response shape.", "Capture auth/session/token/cookie dependency."]],
        ["Behavior", ["Capture error handling, retry or timeout behavior, cache or state updates, and related `[[Workflow]]`."]]
      ]
    }),
    "docs/llm-wiki/templates/OKF_MEETING_NOTE.template.md": okfTemplateMetadata({
      title: "OKF Meeting Note Template",
      okfType: "meeting_note",
      heading: "Meeting Title",
      summary: "Summarize the meeting purpose, date, and most important outcome.",
      sections: [
        ["Decisions", ["List decisions with owners or follow-up links.", "Use `[[Concept Name]]` links for projects, systems, or policies."]],
        ["Action Items", ["List owner, action, due date, and evidence or source note when available."]]
      ]
    }),
    "docs/llm-wiki/templates/OKF_EVENT.template.md": okfTemplateMetadata({
      title: "OKF Event Template",
      okfType: "event",
      heading: "Event Name",
      summary: "Summarize what happened, when it happened, and why it matters.",
      sections: [
        ["Timeline", ["List dated facts in chronological order.", "Link related incidents, releases, systems, or people with `[[Concept Name]]`."]],
        ["Impact", ["Describe affected users, systems, documents, or decisions."]]
      ]
    }),
    "docs/llm-wiki/OKF_CONVERSION_GUIDE.md": {
      title: "OKF Conversion Guide",
      docType: "conversion_guide",
      related: ["docs/llm-wiki/profiles/okf-v0.1.md", "docs/llm-wiki/templates/OKF_CONCEPT.template.md", "docs/llm-wiki/GLOSSARY.md"],
      body: `# OKF Conversion Guide

This guide explains how to convert selected LLM-WIKI documents into OKF v0.1-compatible knowledge documents without weakening the LLM-WIKI review model.

## Principle

- Conversion is review-assisted, not automatic.
- Do not assume LLM-WIKI \`doc_type\` automatically satisfies OKF \`type\`.
- Write OKF \`type\` explicitly after source inspection and human or agent review.
- Keep AI-converted documents as \`needs_review\` until human review is complete.

## Metadata Mapping

| LLM-WIKI field | OKF v0.1 field | Conversion guidance |
| --- | --- | --- |
| \`doc_type\` | \`type\` | Use as a candidate only. Review and write explicit OKF \`type\`. |
| \`tags\` | \`tags\` | Preserve useful tags as an array. Remove workflow-only tags if they do not help retrieval. |
| \`aliases\` | \`aliases\` | Preserve aliases as an array when present. Add reviewed synonyms only. |
| \`related\` | body \`[[wiki links]]\` | Convert durable related concepts into body wiki links where useful. |
| \`source_files\` | \`Evidence\` section | Preserve source evidence in an Evidence section or equivalent source-backed note. |
| \`status\` | review state | Keep converted documents as \`needs_review\`; \`verified\` remains human-approved only. |

## Conversion Workflow

1. Read the source LLM-WIKI document and related source files.
2. Choose the target OKF template: concept, project, api_reference, meeting_note, or event.
3. Write explicit OKF frontmatter with required \`type\` and optional \`aliases\` and \`tags\`.
4. Move durable relationships into body \`[[wiki links]]\`.
5. Preserve source evidence and unresolved questions.
6. Run \`llm-wiki validate --profile okf-v0.1\`.
7. Leave the result as \`needs_review\` until human review is complete.

## Open Questions

- Track uncertain type mappings, unresolved aliases, missing wiki links, and source gaps here before conversion.

## Review Notes

- This guide is a generated draft and should remain \`needs_review\` until the team approves the conversion policy.
`
    },
    "docs/llm-wiki/project-profile.md": {
      title: "Project Profile",
      docType: "project_profile",
      body: `# Project Profile

## Detected Project

- type: \`${detectionProjectTypePlaceholder}\`
- confidence: generated during init

## Review Notes

- 프로젝트명, 주요 런타임, 배포 환경, 소유 팀을 사람 검토 후 보강합니다.
`
    }
  };

  const meta = map[rel] ?? {
    title: fallbackTitle,
    docType: docTypeFromPath(rel),
    body: `# ${fallbackTitle}

이 문서는 \`llm-wiki init --write\`가 생성한 초안입니다.

## Purpose

- 이 프로젝트에서 해당 주제의 기준 정보를 정리합니다.
- 실제 구현 파일을 확인한 뒤 source evidence를 보강합니다.

## Review Notes

- 사람 검토 전까지 \`needs_review\` 상태를 유지합니다.
`
  };

  return {
    title: meta.title,
    docType: meta.docType,
    sourceFiles: meta.sourceFiles ?? [detection.primaryManifest ?? "package.json"],
    related: meta.related ?? commonRelated,
    body: generatedDocBody(rel, map[rel], fallbackTitle).replaceAll(detectionProjectTypePlaceholder, detection.projectType)
  };
}

const detectionProjectTypePlaceholder = "__PROJECT_TYPE__";

function generatedDocBody(rel, mappedMeta, fallbackTitle) {
  if (rel === "docs/llm-wiki/project-profile.md") return projectProfileBody();
  return mappedMeta?.body ?? defaultGeneratedDocBody(fallbackTitle, rel);
}

function projectProfileBody() {
  return `# Project Profile

## Detected Project

- type: \`${detectionProjectTypePlaceholder}\`
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

function okfTemplateMetadata({ title, okfType, heading, summary, sections }) {
  return {
    title,
    docType: "template",
    related: ["docs/llm-wiki/profiles/okf-v0.1.md", "docs/llm-wiki/GLOSSARY.md"],
    body: okfTemplateBody({ heading, okfType, summary, sections })
  };
}

function okfTemplateBody({ heading, okfType, summary, sections }) {
  const renderedSections = sections
    .map(([sectionTitle, bullets]) => `## ${sectionTitle}

${bullets.map((bullet) => `- ${bullet}`).join("\n")}`)
    .join("\n\n");

  return `# ${heading}

## OKF Frontmatter Example

\`\`\`yaml
---
type: ${okfType}
aliases:
  - ${heading} Alias
tags:
  - okf
  - needs-review
---
\`\`\`

## Summary

- ${summary}

${renderedSections}

## Evidence

- Add source documents, source files, transcripts, tickets, commits, or extraction inputs inspected before making claims.
- Mention any optional LLM-WIKI frontmatter \`evidence\` entries here for precise file, line, symbol, section, or route references.

## Open Questions

- Track unresolved aliases, missing source evidence, unclear boundaries, or concepts that need human review.

## Review Notes

- Keep AI-extracted or AI-edited OKF-compatible documents as \`needs_review\` when stored in an LLM-WIKI project.
- Do not promote this document to \`verified\`; verified status is human-approved only.
`;
}

function defaultGeneratedDocBody(title, rel) {
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
${domainApiServicesSection(rel)}

## Open Questions

- Track unclear ownership, missing source evidence, stale assumptions, or decisions that need human review.

## Review Notes

- Keep this document as \`needs_review\` until human review is complete.
- Do not promote this document to \`verified\`; verified status is human-approved only.
`;
}

function domainApiServicesSection(rel) {
  if (!isDomainOrientedDoc(rel)) return "";

  return `
## API Services

Document each API service used by this domain. For every service, capture:

${apiServiceInventoryChecklist().join("\n")}
`;
}

// Markdown link list to each planned domain doc, relative to the linking doc:
// prefix "./" from the overview (same directory), "./domains/" from a wiki-root
// doc like index or DOMAIN_FEATURES. Shared so the wired paths stay consistent
// and resolvable by the graph. Pure.
function domainLinkList(plans, prefix) {
  return plans.map((plan) => `- [${plan.domainName}](${prefix}${plan.rel.split("/").pop()})`).join("\n");
}

// Body for a detected individual domain document. Directory-boundary detected;
// the actual responsibilities are left for human/source-backed enrichment — no
// invented business meaning.
function domainDocBody(plan) {
  const sources = plan.sourceFiles.map((sourceFile) => `- \`${sourceFile}\``).join("\n");
  return `# ${plan.domainName}

이 문서는 \`llm-wiki init --write\`가 디렉터리 경계로 탐지한 도메인 \`${plan.domainName}\`의 초안입니다. 실제 책임과 로직은 아래 source를 확인한 뒤 사람이 보강합니다.

## Responsibility

- 이 도메인이 담당하는 업무 경계와 핵심 워크플로를 source를 확인한 뒤 정리합니다.
- 추측하지 말고 실제 코드/테스트/라우트 근거로 기술합니다.

## Source Directories

${sources}
${domainApiServicesSection(plan.rel)}
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

function isDomainOrientedDoc(rel) {
  const normalized = toPosix(rel);
  return normalized.includes("/domains/") || normalized.endsWith("/DOMAIN_FEATURES.md");
}

function titleFromPath(rel) {
  const base = path.basename(rel, ".md");
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function docTypeFromPath(rel) {
  if (rel.includes("/profiles/")) return "profile";
  if (rel.includes("/domains/")) {
    // Only the overview map is a domain_overview; individual domain docs are `domain`.
    return path.basename(rel, ".md") === "00_overview" ? "domain_overview" : "domain";
  }
  if (rel.includes("/templates/")) return "template";
  return path.basename(rel, ".md").toLowerCase().replace(/[^a-z0-9]+/g, "_");
}
