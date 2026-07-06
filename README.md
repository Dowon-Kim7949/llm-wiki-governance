---
title: LLM-WIKI Standard Package
tags:
  - llm-wiki
  - package
  - cli
  - stable
status: needs_review
doc_type: package_readme
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
  - GATE_REVIEW.md
  - VERIFICATION.md
  - RELEASE_CHECKLIST.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Standard Package / LLM-WIKI 표준 패키지

## 한국어

`@dowonk-7949/llm-wiki-standard`는 여러 개발 도구와 CI에서 같은 LLM-WIKI 운영 규칙을 점검하고 초기 문서를 생성하기 위한 안정판 CLI 패키지입니다. Codex 전용 플러그인이 아니라 Codex, Claude Code, Google Antigravity 후보 adapter, 로컬 터미널, CI에서 함께 쓰는 공통 표준 패키지입니다.

현재 안정 버전은 `0.1.0`입니다.

### 설치

```bash
npm install -D @dowonk-7949/llm-wiki-standard@0.1.0
npx @dowonk-7949/llm-wiki-standard@0.1.0 doctor
yarn add -D @dowonk-7949/llm-wiki-standard@0.1.0
```

### 빠른 시작

Zero Base 프로젝트 루트에서:

```bash
yarn llm-wiki init --write --type frontend --agent codex
yarn llm-wiki validate --type frontend --agent codex
```

`docs/llm-wiki/index.md`가 없는 프로젝트에서 `validate`를 먼저 실행하면 세부 문서 누락을 나열하지 않고, LLM-WIKI를 초기화할지 또는 그대로 진행할지 사용자 확인이 필요하다는 단일 warning을 냅니다.

기존 LLM-WIKI 문서가 전사 방침과 달라 다시 작성해야 한다면 명시적으로 overwrite를 선택합니다.

```bash
yarn llm-wiki init --write --type frontend --agent codex --existing overwrite
yarn llm-wiki validate --type frontend --agent codex
```

`--existing overwrite`는 일반 wiki 문서에만 적용됩니다. `docs/llm-wiki/log.md`와 기존 `AGENTS.md`, `CLAUDE.md`, `ANTIGRAVITY.md` adapter 파일은 덮어쓰지 않습니다.

### 명령어

```bash
llm-wiki doctor
llm-wiki validate
llm-wiki validate-frontmatter
llm-wiki audit
llm-wiki init --dry-run
llm-wiki init --write
llm-wiki migrate --dry-run
```

### 주요 옵션

- `--cwd <path>`: 대상 프로젝트 루트
- `--type <frontend|backend|fullstack|library|mixed|unknown>`: 명시 project type
- `--profile <profile>`: 추가 profile, 반복 가능
- `--agent <codex|claude|antigravity|all>`: adapter 점검/제안 대상, 반복 가능
- `--format <text|json|markdown>`: 출력 형식
- `--out <path>`: report 저장 경로
- `--strict`: warning을 실패로 처리
- `--minimal`: core 문서 중심의 최소 계획
- `--write`: `init`에서 실제 파일 생성
- `--existing <skip|overwrite>`: 기존 wiki 문서 처리 방식, 기본값은 `skip`

### 안전 정책

- Markdown은 UTF-8로 읽고 씁니다.
- 민감정보 의심 값은 raw value를 출력하거나 report에 쓰지 않습니다.
- `init --write`는 누락된 LLM-WIKI 문서와 선택된 adapter 파일만 생성합니다.
- 기존 wiki 문서는 기본적으로 유지하며, `--existing overwrite`를 명시한 경우에만 다시 씁니다.
- `docs/llm-wiki/log.md`는 append-only 파일이므로 덮어쓰지 않습니다.
- 기존 `AGENTS.md`, `CLAUDE.md`, `ANTIGRAVITY.md`는 덮어쓰지 않습니다.
- `migrate --apply`는 안정판에서도 자동 변경 범위가 명확해질 때까지 차단됩니다.
- CLI가 생성하거나 수정한 wiki/report 문서는 사람 검토 전까지 `needs_review` 상태를 유지합니다.

### 검증

```bash
node --test tests/*.test.js
node bin/llm-wiki.js validate-frontmatter
node bin/llm-wiki.js doctor --format markdown
```

## English

`@dowonk-7949/llm-wiki-standard` is a stable CLI package for checking LLM-WIKI operating rules and generating initial wiki documentation across developer tools and CI. It is not Codex-only; it is intended for Codex, Claude Code, Google Antigravity candidate adapters, local terminals, and CI.

The current stable version is `0.1.0`.

### Install

```bash
npm install -D @dowonk-7949/llm-wiki-standard@0.1.0
npx @dowonk-7949/llm-wiki-standard@0.1.0 doctor
yarn add -D @dowonk-7949/llm-wiki-standard@0.1.0
```

### Quick Start

From a zero-base project root:

```bash
yarn llm-wiki init --write --type frontend --agent codex
yarn llm-wiki validate --type frontend --agent codex
```

When `validate` runs before `docs/llm-wiki/index.md` exists, it emits one confirmation-oriented warning instead of listing every missing document.

When existing LLM-WIKI docs should be regenerated to match the company standard:

```bash
yarn llm-wiki init --write --type frontend --agent codex --existing overwrite
yarn llm-wiki validate --type frontend --agent codex
```

`--existing overwrite` applies to ordinary wiki docs only. `docs/llm-wiki/log.md` and existing `AGENTS.md`, `CLAUDE.md`, and `ANTIGRAVITY.md` adapter files are not overwritten.

### Commands

```bash
llm-wiki doctor
llm-wiki validate
llm-wiki validate-frontmatter
llm-wiki audit
llm-wiki init --dry-run
llm-wiki init --write
llm-wiki migrate --dry-run
```

### Safety Policy

- Markdown is read and written as UTF-8.
- Sensitive-looking raw values are not printed or written to reports.
- `init --write` creates missing LLM-WIKI docs and selected adapter files only.
- Existing wiki docs are kept by default and rewritten only with explicit `--existing overwrite`.
- `docs/llm-wiki/log.md` is append-only and is not overwritten.
- Existing `AGENTS.md`, `CLAUDE.md`, and `ANTIGRAVITY.md` files are not overwritten.
- `migrate --apply` remains blocked until the automatic migration scope is intentionally accepted.
- CLI-created or CLI-edited wiki/report documents remain `needs_review` until human review.

### Verification

```bash
node --test tests/*.test.js
node bin/llm-wiki.js validate-frontmatter
node bin/llm-wiki.js doctor --format markdown
```

### Release Automation

CI runs verification on pull requests and `main` pushes only. Publishing is restricted to `v*` tag pushes through `.github/workflows/publish.yml`.

Before the first automated publish, register an npm Trusted Publisher for GitHub Actions with workflow filename `publish.yml`. The publish job uses the GitHub Environment `npm-release`; configure required reviewers or deployment approval rules for that environment in GitHub UI.

To publish version `0.1.0` after verification:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Related Documents

- `GATE_REVIEW.md`: stable release gate decisions and caveats
- `VERIFICATION.md`: verification record
- `RELEASE_CHECKLIST.md`: stable release checklist
