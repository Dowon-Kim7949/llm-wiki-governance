---
title: LLM-WIKI Standard Roadmap
tags:
  - llm-wiki
  - roadmap
  - package
  - cli
status: needs_review
doc_type: roadmap
project: llm-wiki-standard
last_updated: 2026-07-08
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - README.md
  - src/cli.js
  - src/commands.js
  - templates/github-actions/llm-wiki-validate.yml
  - tests/verification.test.js
related:
  - GATE_REVIEW.md
  - VERIFICATION.md
  - RELEASE_CHECKLIST.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Standard Roadmap

This roadmap keeps product direction separate from the README. The README should stay focused on first-use guidance, while this document tracks package strengthening work for maintainers.

## Product Principle

```text
CLI creates structure and safety rails.
Codex or Claude Code enriches docs from source evidence.
Humans review and approve verified status.
CI continuously checks quality.
```

## OKF v0.1 Comparison

Working baseline: OKF v0.1 represents knowledge as Markdown documents with YAML frontmatter. The required field is `type`; optional fields include `aliases` and `tags`. The body should use clear Markdown headings and bullet lists, and related concepts or entities should be connected with wiki links such as `[[Concept Name]]`.

Current fit:

- Strong: LLM-WIKI already uses Markdown plus YAML frontmatter, preserves source-backed context through `source_files`, keeps AI-written content in `needs_review`, and validates frontmatter, local markdown links, source references, encoding, and sensitive-info findings.
- Partial: LLM-WIKI uses `doc_type` instead of OKF's required `type`; `tags` already exists, but `aliases` is not part of the required/recommended contract; generated templates are project documentation oriented rather than concept/entity/event oriented.
- Gap: LLM-WIKI does not yet validate or generate `[[wiki links]]`, does not extract entities/events from raw text, and does not provide an OKF v0.1 output mode or schema.

Design implication:

LLM-WIKI should remain a source-evidence documentation standard by default, and add OKF v0.1 compatibility as an explicit profile or output mode. A low-loss mapping can be `doc_type` -> `type`, existing `tags` -> `tags`, optional new `aliases` -> `aliases`, and `related` plus local markdown links -> candidate `[[wiki links]]` in generated OKF bodies.

## Phase 1: Usability Stabilization

Goal: make first use predictable and hard to misuse.

- Keep command-specific option validation strict.
- Keep `quickstart`, `handoff`, `status`, and `validate` guidance aligned between CLI help and README.
- Keep `README.md` as the default English entrypoint and maintain `README.ko.md` as the Korean entrypoint, with language links at the top of both files.
- Add and maintain `llm-wiki help <command>` for every public command.
- Keep error messages actionable and include the safest next command.
- Keep JSON output stable enough for CI and wrappers.

## Phase 2: Agent Handoff Quality

Goal: make Codex and Claude Code start useful work immediately after CLI setup.

- Keep handoff prompts explicit about adapter entrypoints.
- Support project-type-specific handoff prompts. Status: implemented for frontend, backend, fullstack, and library evidence focus.
- Include expected agent output format: changed files, source evidence, review items, and caveats.
- Keep Antigravity handoff blocked until the adapter contract is confirmed.
- Support saving handoff prompts to reviewable files via `--out`.

## Phase 3: Generated Document Quality

Goal: make CLI-created drafts easier for agents and humans to complete.

- Improve templates with `What to inspect`, `Evidence`, `Open questions`, and `Review notes` sections.
- Add OKF v0.1-oriented templates for `concept`, `project`, `api_reference`, `meeting_note`, and `event` documents.
- Ensure generated OKF-style documents use concise wiki tone, clear headings, bullet lists, and `[[wiki links]]` where related concepts are known.
- Make `docs/llm-wiki/domains/00_overview.md` a stronger domain mapping guide.
- Keep all generated documents in `needs_review`.
- Consider project-local template overrides after the stable CLI contract is proven.

## Phase 4: Validation Depth

Goal: catch stale, broken, or unverifiable wiki content before it spreads.

- Publish and validate a JSON Schema for required frontmatter fields, valid statuses, visibility values, and review metadata.
- Add an OKF v0.1 validation profile that requires `type`, accepts optional `aliases` and `tags`, and checks that these fields have the expected scalar/array shapes.
- Add link validation for `docs/llm-wiki`. Status: implemented for local markdown links.
- Add wiki-link validation for `[[Concept Name]]` references, including missing target detection and optional alias resolution.
- Validate that `source_files` entries exist. Status: implemented for local path references.
- Add stricter `verified` policy checks in `--strict` mode. Status: implemented for missing `reviewed_by` and `reviewed_at`.
- Add evidence-span references so important claims can point to a file, symbol, route, section, or line range instead of only a broad source file.
- Split validation findings by category for easier CI reporting. Status: implemented with `findingSummary.byCategory` and text report summaries.
- Keep sensitive-info detection conservative and non-leaking.

## Phase 5: Developer Support Commands

Goal: help maintainers decide the next useful action without reading every document.

- Keep improving `llm-wiki status`.
- Consider `llm-wiki next` for recommended next actions.
- Consider `llm-wiki explain <finding>` for remediation guidance.
- Consider `llm-wiki prompt --task <name>` for repeatable agent workflows.
- Consider `llm-wiki prompt --task okf-extract` to print an AI Knowledge Editor prompt for converting raw text into OKF v0.1 Markdown.

## Phase 6: Team And Organization Adoption

Goal: make the package useful beyond a single personal project.

- Add profile presets such as `monorepo`, `mobile`, and `infra` when use cases are proven.
- Add an `okf-v0.1` profile for teams that want LLM-WIKI documents to double as a knowledge base corpus.
- Consider external rules files such as `llm-wiki.rules.json`.
- Provide GitHub Actions examples. Status: implemented with `templates/github-actions/llm-wiki-validate.yml`.
- Document team review policy examples for `needs_review` and `verified`.
- Document organization-level policy for internal, restricted, and public knowledge boundaries.

## Phase 7: Release Quality

Goal: keep the npm package trustworthy across environments.

- Run Node LTS matrix tests.
- Run Windows, macOS, and Linux smoke tests.
- Add temp consumer install tests from packed npm tarballs.
- Verify Quick Start commands against packed artifacts before release.
- Keep release notes and migration notes aligned with CLI behavior.

## Phase 8: OKF v0.1 Interoperability

Goal: support OKF v0.1 without weakening the existing LLM-WIKI safety model.

- Add `--profile okf-v0.1` validation for `type`, `aliases`, `tags`, and `[[wiki links]]`.
- Add an OKF conversion guide that maps LLM-WIKI metadata to OKF v0.1 metadata: `doc_type` -> `type`, `tags` -> `tags`, optional `aliases` -> `aliases`, `related` -> body wiki links where appropriate.
- Add fixtures for concept, project, person, meeting note, event, and API reference examples.
- Decide whether raw-text conversion belongs in the CLI, in an agent prompt template, or in a separate package. Default should be prompt-assisted extraction first, not fully automatic extraction.
- Keep `needs_review` as the default for all AI-extracted OKF documents.
- Add optional graph/report output that lists detected wiki links, unresolved concepts, aliases, and orphan documents.

## Near-Term Priority

1. Publish the frontmatter contract as JSON Schema and validate against it.
2. Add `aliases` as an optional frontmatter field and decide how `doc_type` and OKF `type` coexist.
3. Add `[[wiki links]]` parsing and missing-target validation.
4. Design `--profile okf-v0.1` before adding conversion commands.
5. Improve generated document templates with evidence, open questions, review notes, and OKF-style concise summaries.
6. Decide whether raw-text OKF extraction is a CLI command or an agent prompt workflow.
