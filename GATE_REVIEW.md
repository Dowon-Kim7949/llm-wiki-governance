---
title: LLM-WIKI Standard Package Gate Review
tags:
  - llm-wiki
  - package
  - gate-review
  - stable
status: needs_review
doc_type: gate_review
project: llm-wiki-standard
last_updated: 2026-07-06
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - package.json
  - src/commands.js
  - tests/verification.test.js
related:
  - README.md
  - VERIFICATION.md
  - RELEASE_CHECKLIST.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Standard Package Gate Review

This document records the default decisions for the `0.1.0` stable release line.

## Review Status

| Gate | Status | Decision |
| --- | --- | --- |
| Gate 2 Standard Model Approval | `accepted_for_0.1.0` | Keep the current frontmatter/status model; CLI-created or CLI-edited docs remain `needs_review` until human review. |
| Gate 3 CLI and Adapter Approval | `accepted_for_0.1.0` | Keep `doctor`, `validate`, `validate-frontmatter`, `audit`, `init --dry-run`, `init --write`, and `migrate --dry-run`. Adapter checks remain opt-in with `--agent`. |
| Gate 4 Migration Policy Approval | `accepted_for_0.1.0` | Keep `migrate --apply` blocked for the stable release. Regeneration is available through explicit `init --write --existing overwrite`. |
| Gate 5 Implementation Approval | `accepted_for_0.1.0` | Ship `@dowonk-7949/llm-wiki-standard@0.1.0` as the first stable npmjs release candidate. |

## Stable Decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Release level | Publish as stable `0.1.0`. | The package has a small, explicit command surface and conservative write policy. |
| Distribution path | Publish through the public npm registry. | npm, npx, and yarn consumers can install without GitHub Packages authentication. |
| Existing docs | Keep by default; rewrite only with `--existing overwrite`. | Existing project knowledge should not be erased accidentally. |
| Uninitialized wiki | Report one confirmation-oriented warning when `docs/llm-wiki/index.md` is missing. | Agents should ask whether to proceed or initialize LLM-WIKI instead of flooding the user with document-level warnings. |
| Append-only log | Never overwrite `docs/llm-wiki/log.md`. | The log is historical evidence. |
| Adapter files | Never overwrite existing adapter files. | Teams often keep local tool policy there. |
| Antigravity | Keep `ANTIGRAVITY.md` as an info-level candidate. | The loading contract is still tool-dependent. |
| Migration apply | Keep blocked. | Automatic migration writes need a separate accepted scope. |
| CI default | Use `llm-wiki validate`; add `--strict` when teams want warnings to fail. | This lets existing repositories adopt the standard incrementally. |

## Current Implementation Scope

Implemented commands:

- `llm-wiki doctor`
- `llm-wiki validate`
- `llm-wiki validate-frontmatter`
- `llm-wiki audit`
- `llm-wiki init --dry-run`
- `llm-wiki init --write`
- `llm-wiki migrate --dry-run`

Implemented safety behavior:

- `init` writes only when `--write` is explicit.
- Existing wiki docs are skipped unless `--existing overwrite` is explicit.
- A missing `docs/llm-wiki/index.md` is reported as one `structure.wiki_missing` finding before document-level checks run.
- `docs/llm-wiki/log.md` and existing adapter files are never overwritten.
- `--agent` opts into Codex, Claude Code, or Antigravity adapter checks.
- `--agent all` expands to Codex, Claude Code, and Antigravity.
- Markdown and reports are written as UTF-8.
- Sensitive-looking raw values are redacted from findings and blocked before report writes.

## Release Caveats

- `migrate --apply` remains intentionally blocked.
- `validate` reuses audit coverage rather than separate layered validators.
- YAML parsing covers the standard frontmatter subset only.
- Antigravity adapter handling remains suggested/info-only until the tool contract is confirmed.
