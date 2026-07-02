---
title: LLM-WIKI Standard Package Gate Review
tags:
  - llm-wiki
  - package
  - gate-review
  - needs-review
status: needs_review
doc_type: gate_review
project: sinkholemonitor-frontend
last_updated: 2026-07-02
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - ACTION_PLAN.md
  - LLM_WIKI_STANDARD_MODEL.md
  - LLM_WIKI_CLI_WORKFLOW_DESIGN.md
  - LLM_WIKI_MIGRATION_STRATEGY.md
  - packages/llm-wiki-standard/src/commands.js
  - packages/llm-wiki-standard/VERIFICATION.md
related:
  - packages/llm-wiki-standard/README.md
  - packages/llm-wiki-standard/PRERELEASE_CHECKLIST.md
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Standard Package Gate Review

This document prepares Gate 5 implementation review for `packages/llm-wiki-standard/`. It records recommended default decisions so review can focus on exceptions instead of re-deciding every open item.

## Review Status

| Gate | Status | Recommended decision |
| --- | --- | --- |
| Gate 2 Standard Model Approval | `needs_review` | Accept the current core/frontmatter/status model as the prerelease baseline, with all generated/edited docs remaining `needs_review`. |
| Gate 3 CLI and Adapter Approval | `needs_review` | Accept the current command set for prerelease; keep `validate` audit-backed and adapter checks opt-in with `--agent`. |
| Gate 4 Migration Policy Approval | `needs_review` | Keep all file-writing migration apply behavior blocked in this release. Use dry-run/report output only. |
| Gate 5 Implementation Approval | `needs_review` | Approve as an internal prerelease candidate after local verification passes; do not publish as a stable package. |

## Recommended Decisions

| Area | Recommendation | Reason |
| --- | --- | --- |
| Release level | Ship as internal prerelease only. | The package is useful for review and CI trials, but Gate 2 through Gate 4 are still `needs_review`. |
| Package identity | Use `@dowon-kim7949/llm-wiki-standard` and `0.0.1-internal.0` for the GitHub Packages internal prerelease. | The personal-account registry path has been selected, while the release remains non-stable and `needs_review`. |
| CLI command set | Keep `doctor`, `validate`, `validate-frontmatter`, `audit`, `init --dry-run`, and `migrate --dry-run`. | This covers review workflows without writing project files. |
| `validate` behavior | Keep `validate` audit-backed for prerelease; do not split stricter validators yet. | The audit-backed path is already tested and easier for teams to adopt incrementally. |
| CI default | Start with `llm-wiki validate` as warning-friendly. Delay `--strict` until missing docs are intentionally resolved. | Current repositories can adopt checks without immediate build failures from review-only warnings. |
| Report artifacts | Allow `--out` reports for PR/review attachments. Commit reports only when they document an approved migration or audit milestone. | Avoid noisy generated artifacts while preserving review evidence when useful. |
| Adapter handling | Keep root adapter creation/modification opt-in and dry-run/suggestion oriented through repeated `--agent`. | Existing `AGENTS.md`, `CLAUDE.md`, and Antigravity files can contain team-specific policy. |
| Antigravity | Keep `ANTIGRAVITY.md` as an info-level candidate until the tool contract is confirmed. | The actual loading filename is still tool-contract dependent. |
| Distribution path | Publish through GitHub Packages linked to a private `Dowon-Kim7949/llm-wiki-standard` repository after re-authentication. | GitHub Packages supports private package access control while allowing npm/yarn consumers to install through `npm.pkg.github.com`. |
| Missing docs in this repository | Keep the current five audit findings as review items. Do not create them in this package-hardening task. | The user explicitly constrained missing docs to dry-run/report/review handling. |
| `migrate --apply` | Keep blocked. Do not implement partial safe-add apply in this prerelease. | Even safe-add writes can create ownership and review ambiguity before Gate 4 is accepted. |
| Cross-platform verification | Mark Windows local verification complete; track macOS/Linux as prerelease follow-up. | The current workspace can verify Windows directly, while shell differences still need real environments. |

## Current Implementation Scope

Implemented prototype commands:

- `llm-wiki doctor`
- `llm-wiki validate`
- `llm-wiki validate-frontmatter`
- `llm-wiki audit`
- `llm-wiki init --dry-run`
- `llm-wiki migrate --dry-run`

Implemented safety behavior:

- `init` without `--dry-run` is blocked.
- `migrate --apply` is blocked until Gate 4 approves automatic migration scope.
- `audit`, `validate`, `init --dry-run`, and `migrate --dry-run` can save UTF-8 Markdown or JSON reports with `--out`.
- `--profile` can be repeated to add profile-specific review coverage without changing the detected or explicit `--type`.
- `--agent` can be repeated to opt into Codex, Claude Code, or Antigravity adapter checks and dry-run suggestions.
- No-agent `audit`, `validate`, `init --dry-run`, and `migrate --dry-run` do not require adapter files or emit adapter suggestions.
- `--agent all` expands to Codex, Claude Code, and Antigravity; Antigravity remains info-level only.
- `package.json` is prepared with `name: @dowon-kim7949/llm-wiki-standard`, `version: 0.0.1-internal.0`, `publishConfig.registry: https://npm.pkg.github.com`, and the private repository URL.
- Package-level `.npmrc` maps `@dowon-kim7949` to GitHub Packages without storing a token.
- `--format markdown` prints Markdown report output, while `--format json` prints structured JSON.
- Unknown options, missing option values, and unsupported output formats are rejected with usage error exit code `3`.
- Markdown reports include `needs_review` frontmatter.
- Generated reports are scanned before write and refused if sensitive-looking content would be written.
- Adapter handling remains template/dry-run only; root adapter files are not overwritten.

## Verification Summary

Local fixture tests cover:

- zero-base, Front-end, Back-end, and Full Stack detection paths
- existing LLM-WIKI frontmatter validation
- Korean UTF-8 content scan
- sensitive-looking value redaction
- `migrate --apply` blocked behavior
- UTF-8 Markdown report output with `needs_review` frontmatter
- `validate` command coverage over audit-backed checks
- usage error handling for unknown options and missing option values
- repeated `--profile` parsing and profile document planning
- repeated `--agent` parsing, `--agent all` expansion, selected-agent adapter suggestions, and selected-agent adapter warnings
- package prerelease readiness shown by `doctor`

Current repository checks to rerun before review:

```powershell
& 'C:\Users\samkj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/*.test.js
& 'C:\Users\samkj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' bin/llm-wiki.js validate-frontmatter
& 'C:\Users\samkj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' bin/llm-wiki.js init --dry-run --cwd ..\.. --agent claude
& 'C:\Users\samkj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' bin/llm-wiki.js audit --cwd ..\.. --agent claude
```

From repository root:

```powershell
& 'C:\Users\samkj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' packages/llm-wiki-standard/bin/llm-wiki.js validate
& 'C:\Users\samkj\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' packages/llm-wiki-standard/bin/llm-wiki.js audit
```

The executable prerelease checklist is `PRERELEASE_CHECKLIST.md`.

## Known Warnings

The current repository no-agent `validate` is expected to warn about review-only missing wiki documents:

- `docs/llm-wiki/project-profile.md`
- `docs/llm-wiki/profiles/frontend.md`
- `docs/llm-wiki/E2E_WORKFLOWS.md`

When adapter checks are explicitly selected, additional selected-agent findings are expected:

- `--agent claude`: `CLAUDE.md` missing warning
- `--agent antigravity` or `--agent all`: `ANTIGRAVITY.md` info-level candidate

These files should not be created in this review-preparation step. They remain migration or project-standard review items.

## Remaining External Checks

- Run the package test and basic CLI commands on macOS and Linux shells.
- Confirm the Google Antigravity instruction filename and automatic loading behavior.
- Re-authenticate `gh` for `Dowon-Kim7949`, then create the private package repository and publish to GitHub Packages.
- Decide when a real project should resolve the current review-only missing docs.

## Caveats

- [needs_review] This package remains a prototype and is private/unpublished.
- [needs_review] `gh auth status` shows `Dowon-Kim7949` as the active account, but the stored token is invalid; repository creation and package publish are blocked until re-authentication.
- [needs_review] macOS and Linux shell execution still require direct verification.
- [needs_review] Secret-pattern detection is conservative and can produce false positives.
- [needs_review] Gate 5 should not be treated as approval for migration apply behavior.
- [needs_review] CLI parsing remains minimal and should be revisited if short aliases become release requirements.
- [needs_review] Earlier five-warning repository expectations included adapter findings by default; the prerelease candidate now makes adapter warnings selected-agent only, so no-agent root validation reports the three missing wiki docs instead.
