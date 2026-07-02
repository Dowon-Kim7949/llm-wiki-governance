---
title: LLM-WIKI Standard Package Prerelease Checklist
tags:
  - llm-wiki
  - package
  - prerelease
  - checklist
  - needs-review
status: needs_review
doc_type: prerelease_checklist
project: sinkholemonitor-frontend
last_updated: 2026-07-02
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - packages/llm-wiki-standard/package.json
  - packages/llm-wiki-standard/GATE_REVIEW.md
  - packages/llm-wiki-standard/VERIFICATION.md
related:
  - packages/llm-wiki-standard/README.md
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Standard Package Prerelease Checklist

Use this checklist before sharing `packages/llm-wiki-standard/` as an internal prerelease candidate.

## Local Verification

- [ ] Run `node --test tests/*.test.js` from `packages/llm-wiki-standard/`.
- [ ] Run `node bin/llm-wiki.js validate-frontmatter` from `packages/llm-wiki-standard/`.
- [ ] Run `node bin/llm-wiki.js init --dry-run --cwd ..\.. --agent claude` from `packages/llm-wiki-standard/`.
- [ ] Run `node bin/llm-wiki.js audit --cwd ..\.. --agent claude` from `packages/llm-wiki-standard/`.
- [ ] Run `node packages/llm-wiki-standard/bin/llm-wiki.js validate` from the repository root.
- [ ] Confirm repository warnings are the expected review-only findings listed in `GATE_REVIEW.md`.
- [ ] Run `node bin/llm-wiki.js doctor --format markdown` from `packages/llm-wiki-standard/` and confirm package prerelease readiness is shown.

## Safety Gates

- [ ] Confirm `init` without `--dry-run` is still blocked.
- [ ] Confirm `migrate --apply` is still blocked.
- [ ] Confirm adapter checks and suggestions require explicit `--agent` selection.
- [ ] Confirm adapter files are templates or dry-run suggestions only.
- [ ] Confirm no-agent `audit` and `validate` do not require `CLAUDE.md` or `ANTIGRAVITY.md`.
- [ ] Confirm generated reports keep `status: needs_review`.
- [ ] Confirm sensitive-looking values are redacted and never written raw.

## Release Metadata

- [ ] Confirm package name is `@dowon-kim7949/llm-wiki-standard`.
- [ ] Confirm version is `0.0.1-internal.0`.
- [ ] Confirm `publishConfig.registry` is `https://npm.pkg.github.com`.
- [ ] Confirm package-level `.npmrc` maps `@dowon-kim7949` to GitHub Packages and does not contain a token.
- [ ] Confirm `repository.url` points to `https://github.com/Dowon-Kim7949/llm-wiki-standard.git`.
- [ ] Do not label this package stable while Gate 2 through Gate 4 remain `needs_review`.

## GitHub Packages Release Prep

- [ ] Re-authenticate `gh` for `Dowon-Kim7949`; current stored token is invalid.
- [ ] Create the private `Dowon-Kim7949/llm-wiki-standard` repository.
- [ ] Push the package source to the private repository.
- [ ] Authenticate npm with a personal access token classic or CI `GITHUB_TOKEN`; do not commit the token.
- [ ] Run `npm publish` from `packages/llm-wiki-standard/` after local verification passes.
- [ ] Verify consumer install with `npm install @dowon-kim7949/llm-wiki-standard@0.0.1-internal.0`.

## External Verification

- [ ] Run package tests on macOS.
- [ ] Run package tests on Linux.
- [ ] Run basic CLI commands on macOS and Linux shells.
- [ ] Confirm Google Antigravity instruction filename and loading behavior before treating `ANTIGRAVITY.md` as more than a candidate.

## Go/No-go Recommendation

Go for internal prerelease when:

- local Windows verification passes,
- package readiness is visible in `doctor`,
- `migrate --apply` remains blocked,
- known no-agent and selected-agent warnings are documented,
- GitHub Packages auth and private repository setup are confirmed,
- no sensitive values appear in reports.

No-go for stable publication until:

- macOS/Linux shell verification passes,
- Gate 2 through Gate 4 are reviewed,
- migration apply policy is explicitly accepted or intentionally omitted.
