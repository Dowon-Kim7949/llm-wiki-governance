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

# LLM-WIKI Standard Package / LLM-WIKI 표준 패키지

## 한국어

`@dowonk-7949/llm-wiki-standard`는 여러 개발 도구와 CI에서 같은 LLM-WIKI 운영 규칙을 점검하고 초기화 계획을 만들기 위한 내부 prerelease CLI 패키지입니다. Codex 전용 플러그인이 아니라 Codex, Claude Code, Google Antigravity 후보 adapter, 로컬 터미널, CI에서 함께 쓰는 공통 표준 패키지를 목표로 합니다.

현재 버전은 `0.0.1-internal.1`이며 안정 release가 아닙니다. Gate 2~4 정책은 여전히 `needs_review`이므로, 실제 파일 변경보다 audit, validate, dry-run, report 중심으로 동작합니다.

### 배포 상태

- package: `@dowonk-7949/llm-wiki-standard`
- version: `0.0.1-internal.1`
- registry: `https://registry.npmjs.org`
- repository: `git+https://github.com/Dowon-Kim7949/llm-wiki-standard.git`
- status: GitHub repository public 전환 완료, npmjs public publish 완료, npm/npx/yarn consumer 검증 완료

설치:

```bash
npm install @dowonk-7949/llm-wiki-standard@0.0.1-internal.1
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 doctor
yarn add @dowonk-7949/llm-wiki-standard@0.0.1-internal.1
```

npmjs public package로 배포하면 소비자는 별도 GitHub Packages 인증이나 `.npmrc` 없이 설치할 수 있습니다.

### 명령어

```bash
llm-wiki doctor
llm-wiki validate
llm-wiki validate-frontmatter
llm-wiki audit
llm-wiki init --dry-run
llm-wiki migrate --dry-run
```

설치하지 않고 저장소 내부에서 실행할 때는 다음처럼 직접 호출할 수 있습니다.

```bash
node bin/llm-wiki.js audit
node bin/llm-wiki.js init --dry-run --agent claude
```

### 도구별 빠른 시작

Zero Base 프로젝트 루트에서 아래 명령을 실행합니다. 현재 prerelease는 실제 파일 생성보다 dry-run 계획 확인을 우선합니다.

Codex:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent codex
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent codex
```

Claude Code:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent claude
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent claude
```

Google Antigravity:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent antigravity
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent antigravity
```

모든 adapter 후보를 한 번에 확인:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent all
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent all
```

Yarn을 쓰는 프로젝트에서는 먼저 설치한 뒤 같은 명령을 실행합니다.

```bash
yarn add @dowonk-7949/llm-wiki-standard@0.0.1-internal.1
yarn llm-wiki init --dry-run --type frontend --agent codex
yarn llm-wiki audit --agent codex
```

`--type frontend`는 예시입니다. Back-end, Full Stack, Library 프로젝트라면 각각 `--type backend`, `--type fullstack`, `--type library`로 바꿉니다.

### 주요 옵션

- `--cwd <path>`: 대상 프로젝트 루트
- `--type <frontend|backend|fullstack|library|mixed|unknown>`: 명시 project type
- `--profile <profile>`: 추가 profile, 반복 가능
- `--agent <codex|claude|antigravity|all>`: adapter 점검/제안 대상, 반복 가능
- `--format <text|json|markdown>`: 출력 형식
- `--out <path>`: report 저장 경로
- `--strict`: warning을 실패로 처리
- `--minimal`: core 문서 중심의 최소 계획

`--agent`를 지정하지 않으면 adapter missing warning이나 adapter suggestion을 내지 않습니다. `--agent all`은 Codex, Claude Code, Antigravity를 모두 선택한 것처럼 동작하지만, Antigravity는 instruction 파일명이 확정되지 않았으므로 info-level candidate로만 유지합니다.

### 안전 정책

- Markdown은 UTF-8로 읽고 씁니다.
- 민감정보 의심 값은 raw value를 출력하거나 report에 쓰지 않습니다.
- `init`은 이 prerelease에서 `--dry-run`만 지원합니다.
- `migrate --apply`는 Gate 4 승인 전까지 blocked 상태입니다.
- 기존 `AGENTS.md`, `CLAUDE.md`, `ANTIGRAVITY.md`는 overwrite하지 않습니다.
- CLI가 생성하거나 수정한 wiki/report 문서는 `needs_review` 상태를 유지합니다.

### 검증

```bash
node --test tests/*.test.js
node bin/llm-wiki.js validate-frontmatter
```

현재 Windows 환경에서 package tests, frontmatter validation, GitHub repository public 전환, npmjs public publish, npm install, npx 실행, yarn add 및 `yarn llm-wiki doctor` 실행을 확인했습니다. macOS/Linux shell 검증은 후속 항목입니다.

### 관련 문서

- `GATE_REVIEW.md`: Gate 5 review, 정책 caveat, known warnings
- `VERIFICATION.md`: 검증 기록
- `PRERELEASE_CHECKLIST.md`: 내부 prerelease 체크리스트

## English

`@dowonk-7949/llm-wiki-standard` is an internal prerelease CLI package for checking and planning LLM-WIKI adoption across multiple developer tools and CI environments. It is not a Codex-only plugin. It is intended to work from Codex, Claude Code, Google Antigravity candidate adapters, local terminals, and CI.

The current version is `0.0.1-internal.1`. It is not a stable release. Gate 2 through Gate 4 policies are still `needs_review`, so the package intentionally favors audit, validate, dry-run, and report workflows over file-writing automation.

### Distribution Status

- package: `@dowonk-7949/llm-wiki-standard`
- version: `0.0.1-internal.1`
- registry: `https://registry.npmjs.org`
- repository: `git+https://github.com/Dowon-Kim7949/llm-wiki-standard.git`
- status: GitHub repository public conversion completed, npmjs public publish completed, and npm/npx/yarn consumer checks passed

Install:

```bash
npm install @dowonk-7949/llm-wiki-standard@0.0.1-internal.1
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 doctor
yarn add @dowonk-7949/llm-wiki-standard@0.0.1-internal.1
```

As an npmjs public package, consumers can install it without GitHub Packages authentication or a project `.npmrc`.

### Commands

```bash
llm-wiki doctor
llm-wiki validate
llm-wiki validate-frontmatter
llm-wiki audit
llm-wiki init --dry-run
llm-wiki migrate --dry-run
```

When running from the package repository without installing:

```bash
node bin/llm-wiki.js audit
node bin/llm-wiki.js init --dry-run --agent claude
```

### Tool-Specific Quick Start

Run these commands from the root of a zero-base project. This prerelease favors dry-run planning over writing files.

Codex:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent codex
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent codex
```

Claude Code:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent claude
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent claude
```

Google Antigravity:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent antigravity
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent antigravity
```

Check every adapter candidate at once:

```bash
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 init --dry-run --type frontend --agent all
npx @dowonk-7949/llm-wiki-standard@0.0.1-internal.1 audit --agent all
```

For Yarn projects, install the package first and then run the same CLI:

```bash
yarn add @dowonk-7949/llm-wiki-standard@0.0.1-internal.1
yarn llm-wiki init --dry-run --type frontend --agent codex
yarn llm-wiki audit --agent codex
```

`--type frontend` is only an example. Use `--type backend`, `--type fullstack`, or `--type library` for other project shapes.

### Key Options

- `--cwd <path>`: target project root
- `--type <frontend|backend|fullstack|library|mixed|unknown>`: explicit project type
- `--profile <profile>`: additional profile, repeatable
- `--agent <codex|claude|antigravity|all>`: selected adapter check/suggestion target, repeatable
- `--format <text|json|markdown>`: output format
- `--out <path>`: report output path
- `--strict`: treat warnings as failures
- `--minimal`: plan only the core document set

If no `--agent` is provided, adapter missing warnings and adapter suggestions are omitted. `--agent all` selects Codex, Claude Code, and Antigravity, while Antigravity remains an info-level candidate until its instruction filename is confirmed.

### Safety Policy

- Markdown is read and written as UTF-8.
- Sensitive-looking raw values are not printed or written to reports.
- `init` is dry-run only in this prerelease.
- `migrate --apply` remains blocked until Gate 4 approval.
- Existing `AGENTS.md`, `CLAUDE.md`, and `ANTIGRAVITY.md` files are not overwritten.
- CLI-created or CLI-edited wiki/report documents remain `needs_review`.

### Verification

```bash
node --test tests/*.test.js
node bin/llm-wiki.js validate-frontmatter
```

Verified locally on Windows: package tests, frontmatter validation, GitHub repository public conversion, npmjs public publish, npm install, npx execution, yarn add, and `yarn llm-wiki doctor`. macOS/Linux shell checks remain follow-ups.

### Related Documents

- `GATE_REVIEW.md`: Gate 5 review, policy caveats, known warnings
- `VERIFICATION.md`: verification record
- `PRERELEASE_CHECKLIST.md`: internal prerelease checklist

## Caveats

- [needs_review] This package remains an internal prerelease, not a stable release.
- [needs_review] `migrate --apply` requires Gate 4 review before implementation.
- [needs_review] YAML parsing is intentionally small and validates only the standard frontmatter subset.
- [needs_review] Antigravity adapter handling remains suggested/info-only until the instruction filename and loading behavior are verified.
