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

## Phase 1: Usability Stabilization

Goal: make first use predictable and hard to misuse.

- Keep command-specific option validation strict.
- Keep `quickstart`, `handoff`, `status`, and `validate` guidance aligned between CLI help and README.
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
- Make `docs/llm-wiki/domains/00_overview.md` a stronger domain mapping guide.
- Keep all generated documents in `needs_review`.
- Consider project-local template overrides after the stable CLI contract is proven.

## Phase 4: Validation Depth

Goal: catch stale, broken, or unverifiable wiki content before it spreads.

- Add link validation for `docs/llm-wiki`. Status: implemented for local markdown links.
- Validate that `source_files` entries exist. Status: implemented for local path references.
- Add stricter `verified` policy checks in `--strict` mode. Status: implemented for missing `reviewed_by` and `reviewed_at`.
- Split validation findings by category for easier CI reporting. Status: implemented with `findingSummary.byCategory` and text report summaries.
- Keep sensitive-info detection conservative and non-leaking.

## Phase 5: Developer Support Commands

Goal: help maintainers decide the next useful action without reading every document.

- Keep improving `llm-wiki status`.
- Consider `llm-wiki next` for recommended next actions.
- Consider `llm-wiki explain <finding>` for remediation guidance.
- Consider `llm-wiki prompt --task <name>` for repeatable agent workflows.

## Phase 6: Team And Organization Adoption

Goal: make the package useful beyond a single personal project.

- Add profile presets such as `monorepo`, `mobile`, and `infra` when use cases are proven.
- Consider external rules files such as `llm-wiki.rules.json`.
- Provide GitHub Actions examples. Status: implemented with `templates/github-actions/llm-wiki-validate.yml`.
- Document team review policy examples for `needs_review` and `verified`.

## Phase 7: Release Quality

Goal: keep the npm package trustworthy across environments.

- Run Node LTS matrix tests.
- Run Windows, macOS, and Linux smoke tests.
- Add temp consumer install tests from packed npm tarballs.
- Verify Quick Start commands against packed artifacts before release.
- Keep release notes and migration notes aligned with CLI behavior.

## Near-Term Priority

1. Keep `help <command>` complete as commands evolve.
2. Expand `status` only after the current output proves useful.
3. Improve handoff prompt report saving and examples.
4. Add source file existence validation. Status: implemented for local path references.
5. Add GitHub Actions example workflow. Status: implemented.
