// Generated wiki-document content templates (docMetadata + per-doc body
// builders), extracted from commands.js on 2026-07-15 (behavior-preserving).
// Pure content generation from detection/domain inputs; no findings/scan logic.
import path from "node:path";
import { toPosix } from "../files.js";
import { todayIsoDate } from "../template-renderer.js";
import { emptyDomainContext } from "./domains.js";
import {
  indexBody,
  indexReadOrderItem,
  readmeBody,
  logBody,
  domainFeaturesBody,
  overviewBody,
  overviewEmptyDomainsNote,
  projectProfileBody as localizedProjectProfileBody,
  defaultDocBody,
  domainApiServicesSection as localizedDomainApiServicesSection,
  domainDocBody as localizedDomainDocBody
} from "./doc-content.js";

// `docLang` selects the language of the generated document PROSE ("en" default,
// "ko" opt-in). Only prose is localized; titles, headings, code spans, paths, JSON
// keys, frontmatter fields, status values, and evidence locators stay verbatim.
export function docMetadata(rel, detection, lastUpdated = todayIsoDate(), domainContext = emptyDomainContext(), docLang = "en") {
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
      body: domainDocBody(domainPlan, docLang)
    };
  }

  // Dynamic Domains section for the overview: markdown links to each detected
  // domain doc (which also makes those docs non-orphan), or a review prompt.
  const hasDomains = domainContext.plans.length > 0;
  const domainsSection = hasDomains
    ? domainLinkList(domainContext.plans, "./")
    : overviewEmptyDomainsNote(docLang);

  // P6 (orphan/link pre-wiring): when domain docs are planned, wire them into the
  // two top-level entry points too — not only the overview. The index links the
  // domain map, and DOMAIN_FEATURES lists each domain doc. Gated on hasDomains so
  // a domain-less scaffold stays byte-identical.
  const indexDomainRead = indexReadOrderItem(docLang, hasDomains);
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
      body: indexBody(docLang, { indexDomainRead })
    },
    "docs/llm-wiki/README.md": {
      title: "LLM-WIKI README",
      docType: "wiki_readme",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/project-profile.md"],
      body: readmeBody(docLang)
    },
    "docs/llm-wiki/log.md": {
      title: "LLM-WIKI Change Log",
      docType: "change_log",
      related: ["docs/llm-wiki/index.md"],
      body: logBody(docLang, lastUpdated)
    },
    "docs/llm-wiki/DOMAIN_FEATURES.md": {
      title: "Domain Features",
      docType: "domain_overview",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/domains/00_overview.md"],
      body: domainFeaturesBody(docLang, { domainFeaturesDomains })
    },
    "docs/llm-wiki/domains/00_overview.md": {
      title: "Domain Overview",
      docType: "domain_overview",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/DOMAIN_FEATURES.md"],
      body: overviewBody(docLang, { domainsSection })
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
      body: localizedProjectProfileBody(docLang)
    }
  };

  const meta = map[rel] ?? {
    title: fallbackTitle,
    docType: docTypeFromPath(rel)
  };

  return {
    title: meta.title,
    docType: meta.docType,
    sourceFiles: meta.sourceFiles ?? [detection.primaryManifest ?? "package.json"],
    related: meta.related ?? commonRelated,
    body: generatedDocBody(rel, map[rel], fallbackTitle, docLang).replaceAll(detectionProjectTypePlaceholder, detection.projectType)
  };
}

const detectionProjectTypePlaceholder = "__PROJECT_TYPE__";

function generatedDocBody(rel, mappedMeta, fallbackTitle, docLang) {
  return mappedMeta?.body ?? defaultGeneratedDocBody(fallbackTitle, rel, docLang);
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

function defaultGeneratedDocBody(title, rel, docLang) {
  const domainApiSection = isDomainOrientedDoc(rel) ? localizedDomainApiServicesSection(docLang) : "";
  return defaultDocBody(docLang, title, domainApiSection);
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
// invented business meaning. Language-localized via doc-content.js.
function domainDocBody(plan, docLang) {
  const domainApiSection = isDomainOrientedDoc(plan.rel) ? localizedDomainApiServicesSection(docLang) : "";
  return localizedDomainDocBody(docLang, plan, domainApiSection);
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
