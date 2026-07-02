---
title: LLM-WIKI Standard Package Prototype
tags:
  - llm-wiki
  - package
  - cli
  - needs-review
status: needs_review
doc_type: package_readme
project: sinkholemonitor-frontend
last_updated: 2026-07-02
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - ACTION_PLAN.md
  - LLM_WIKI_CLI_WORKFLOW_DESIGN.md
  - LLM_WIKI_MIGRATION_STRATEGY.md
  - packages/llm-wiki-standard/package.json
related:
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Standard Package Prototype

This package is a Phase 7 prototype for the cross-platform LLM-WIKI common standard. It is not a Codex-only plugin. The CLI and templates are intended to be usable from Codex, Claude Code, Google Antigravity, local terminals, and CI.

The implementation is intentionally conservative because Gate 2 through Gate 4 are still `needs_review`.

## Internal GitHub Packages Distribution

This internal prerelease is prepared for GitHub Packages under the personal account `Dowon-Kim7949`.

Package metadata:

- package: `@dowon-kim7949/llm-wiki-standard`
- version: `0.0.1-internal.0`
- registry: `https://npm.pkg.github.com`
- repository: `https://github.com/Dowon-Kim7949/llm-wiki-standard.git`

The package-level `.npmrc` maps only the lowercase GitHub Packages scope:

```ini
@dowon-kim7949:registry=https://npm.pkg.github.com
```

Do not commit raw tokens. Publishers and consumers should authenticate through a user-level `.npmrc`, `npm login --scope=@dowon-kim7949 --auth-type=legacy --registry=https://npm.pkg.github.com`, or a CI secret such as `GITHUB_TOKEN`.

Consumer projects should add the same scope mapping and install with:

```bash
npm install @dowon-kim7949/llm-wiki-standard@0.0.1-internal.0
yarn add @dowon-kim7949/llm-wiki-standard@0.0.1-internal.0
```

Current local caveat: `gh auth status` identifies the active account as `Dowon-Kim7949`, but the stored token is invalid. Re-authentication is required before creating the private repository or publishing.

## Implemented Commands

```bash
node packages/llm-wiki-standard/bin/llm-wiki.js doctor
node packages/llm-wiki-standard/bin/llm-wiki.js validate
node packages/llm-wiki-standard/bin/llm-wiki.js validate-frontmatter
node packages/llm-wiki-standard/bin/llm-wiki.js audit
node packages/llm-wiki-standard/bin/llm-wiki.js init --dry-run
node packages/llm-wiki-standard/bin/llm-wiki.js migrate --dry-run
```

`validate` is the review-ready CI entry point for this prototype. It currently reuses audit coverage for structure, frontmatter, selected agent adapter, encoding, and sensitive-information checks.

Reports can be printed as `text`, `json`, or `markdown` with `--format`. Reports can also be saved as UTF-8 Markdown with `needs_review` frontmatter:

```bash
node packages/llm-wiki-standard/bin/llm-wiki.js audit --format markdown --out docs/llm-wiki/audits/audit.md
```

`--type` selects one detected or explicit project type, while `--profile` can be repeated to add review-time profile coverage:

```bash
node packages/llm-wiki-standard/bin/llm-wiki.js init --dry-run --type frontend --profile library
```

`--agent` can be repeated to opt into adapter checks or dry-run suggestions for specific tools:

```bash
node packages/llm-wiki-standard/bin/llm-wiki.js init --dry-run --agent codex --agent claude
node packages/llm-wiki-standard/bin/llm-wiki.js audit --agent all
```

Supported agent values are `codex`, `claude`, `antigravity`, and `all`. When no `--agent` is provided, adapter files are not required and adapter suggestions are not included. `--agent all` expands to Codex, Claude Code, and Antigravity, while Antigravity remains an info-level candidate because its instruction-file contract is not confirmed.

CLI usage errors are fail-fast:

- unknown options return usage error exit code `3`
- options that require values, such as `--cwd`, `--type`, `--profile`, `--agent`, `--format`, and `--out`, return usage error exit code `3` when the value is missing
- unsupported report formats are rejected before command execution

## Safety Scope

- Markdown reads and writes use explicit UTF-8 helpers.
- Sensitive-looking values are reported by type and path only. Raw values are not printed.
- Report output is scanned before write and is refused if sensitive-looking content is present.
- `init` is dry-run only in this prototype unless a future reviewed apply policy is added.
- `migrate --apply` is blocked in this prototype. Use `migrate --dry-run` or `migrate --dry-run --out <path>` for planning.
- Adapter files are provided as package templates only. Existing root `AGENTS.md`, `CLAUDE.md`, or `ANTIGRAVITY.md` files are not overwritten.
- Adapter checks and suggestions are opt-in with `--agent`; no-agent audit/validate does not require `CLAUDE.md` or `ANTIGRAVITY.md`.

## Gate Review

`GATE_REVIEW.md` is the Gate 5 review package. It summarizes the recommended prerelease decisions, unapproved Gate 2 through Gate 4 boundaries, current implementation scope, verification coverage, known warnings, and remaining external checks.

`PRERELEASE_CHECKLIST.md` is the execution checklist for an internal prerelease. It lists local verification, blocked safety gates, release metadata, external shell checks, and go/no-go criteria.

## Prototype Structure

```text
packages/llm-wiki-standard/
  package.json
  bin/
  src/
  templates/
  rules/
  adapters/
  profiles/
  tests/
  README.md
  GATE_REVIEW.md
  PRERELEASE_CHECKLIST.md
```

## Caveats

- [needs_review] Package name and publish target are prepared for the `Dowon-Kim7949` GitHub Packages internal prerelease, but the package remains `needs_review`.
- [needs_review] `migrate --apply` requires Gate 4 review before implementation.
- [needs_review] YAML parsing is intentionally small and validates the standard frontmatter subset only.
- [needs_review] Antigravity adapter handling remains suggested/info-only until the instruction filename and loading behavior are verified.
