---
title: Library
tags:
  - llm-wiki
  - verified
status: verified
doc_type: profile
project: llm-wiki-governance
last_updated: 2026-08-19
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-08-20
wiki_block_version: v1
source_files:
  - package.json
  - src/cli.js
evidence:
  - package.json
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/PUBLIC_API.md
  - docs/llm-wiki/VERSIONING.md
visibility: internal
contains_sensitive_info: false
---

# Library

## Summary

- 이 프로젝트는 `library` 프로필로 관리한다: 공개 계약(CLI 명령 표면), 버전 정책, 예시, 릴리스 흐름이 핵심 문서다.
- 라이브러리형 문서 세트: [Public Api](../PUBLIC_API.md), [Versioning](../VERSIONING.md), [Examples](../EXAMPLES.md), [Release Flow](../RELEASE_FLOW.md).

## Why library

- 산출물이 `bin`으로 노출되는 CLI이고 런타임 서드파티 의존성이 없다(package.json). 소비자는 npm/npx/yarn로 설치해 명령을 호출하므로, 공개 표면·버전 계약·예시가 프론트/백엔드형 문서보다 중요하다.

## Evidence

- `package.json` — `bin.llm-wiki`, `type: module`, 의존성 부재로 라이브러리/CLI 성격 확인.

## Open Questions

- 추후 프로그래매틱 import API(예: `src/commands.js` 핸들러 직접 호출)를 공개 계약으로 문서화할지 결정 필요.

## Review Notes

- 2026-07-13에 패키지 진입점과 배포 형태를 기준으로 검토했다.
- 2026-08-03에 HEAD의 `src/cli.js` 변경(`--watch-needs-review` 신설·drift 전용 등록, impact 도움말의 error-by-default 재서술)을 대조했다 — 이 문서는 명령 개수나 게이트 기본 심각도를 주장하지 않고 근거도 이번 커밋에서 변경되지 않은 `package.json`(`bin.llm-wiki`·`type: module`·의존성 부재)뿐이라 본문 불변.
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 2건을 재확인했다: `package.json`, `src/cli.js`. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서는 library 프로파일의 필수 문서 집합과 근거 규약을 서술하며 version 숫자를 고정하지 않고, `src/cli.js`는 `#symbol:main`(인자 파싱·디스패치)을 근거로 삼는데 `main()`은 무변경이다 — 본문 **불변**.
