---
title: Library
tags:
  - llm-wiki
  - verified
status: verified
doc_type: profile
project: llm-wiki-governance
last_updated: 2026-10-28
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-28
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
source_digests:
  - package.json sha256:592836e8b901c7be
  - src/cli.js sha256:7cfa335ece8b01a7
---

# Library

## Summary

- 이 프로젝트는 `library` 프로필로 관리한다: 공개 계약(CLI 명령 표면), 버전 정책, 예시, 릴리스 흐름이 핵심 문서다.
- 라이브러리형 문서 세트: [Public Api](../PUBLIC_API.md), [Versioning](../VERSIONING.md), [Examples](../EXAMPLES.md), [Release Flow](../RELEASE_FLOW.md).
- 공개 계약은 CLI 명령 표면과 **프로그래매틱 import API** 두 가지다. 후자는 [Public Api](../PUBLIC_API.md)가 안정 계약으로 문서화한다. `commands`는 `src/cli.js`의 `COMMANDS`와 1:1인 동결 맵이라, 명령을 더하면 그 키 집합도 바뀐다. 1.33.0의 `archive-log`가 그런 경우이고, 유지보수자 승인을 받은 계약 변경으로 기록돼 있다(`GATE_REVIEW.md` "Change-Log Volume Scope Decision"). 기존 명령에 옵션만 더하는 변경(1.37.0의 `search-docs --all-terms`, 1.38.0의 `init`/`quickstart`/`handoff --greenfield`)은 이 맵을 바꾸지 않는다 — 옵션 허용 목록은 `COMMAND_OPTION_RULES`가 따로 가진다.

## Why library

- 산출물이 `bin`으로 노출되는 CLI이고 런타임 서드파티 의존성이 없다(package.json). 소비자는 npm/npx/yarn로 설치해 명령을 호출하므로, 공개 표면·버전 계약·예시가 프론트/백엔드형 문서보다 중요하다. 소비자가 받는 tarball에는 실행에 필요한 것과 README·LICENSE만 들어 있다(1.34.0) — 프로젝트 문서는 GitHub가 정본이다.

## Evidence

- `package.json` — `bin.llm-wiki`, `type: module`, 의존성 부재로 라이브러리/CLI 성격 확인.

## Open Questions

- 현재 없음. 이전 질문("프로그래매틱 import API를 공개 계약으로 문서화할지")은 `PUBLIC_API.md`의 프로그래매틱 API 절로 해소됐다. 2026-10-20에 확인했다.

## Review Notes

Older review notes (2 entries, 2026-07-13 → 2026-08-03) are archived in [REVIEW_HISTORY.md](../REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](../log.md).

- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 2건을 재확인했다: `package.json`, `src/cli.js`. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서는 library 프로파일의 필수 문서 집합과 근거 규약을 서술하며 version 숫자를 고정하지 않고, `src/cli.js`는 `#symbol:main`(인자 파싱·디스패치)을 근거로 삼는데 `main()`은 무변경이다 — 본문 **불변**.

- 2026-09-07(1.30.0)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `src/cli.js`를 재확인했다. 변경은 `mode`/`backfill` 명령 등록·`--mode` 옵션·help 3곳이고 이 문서가 서술하는 것은 라이브러리 프로필의 문서 집합과 공개 계약 관례이므로 본문 **불변**이다. 읽는 사람이 알아야 할 사실 하나만 덧붙인다: 이 프로필의 문서(`PUBLIC_API.md`·`VERSIONING.md`·`EXAMPLES.md`·`RELEASE_FLOW.md`)는 **`lite` 모드에서 계획되지 않는다** — `standard`/`strict`에서만 생성 대상이며, 그래서 `lite` 프로젝트에서 이들이 없는 것은 누락이 아니다.

- 2026-09-08(1.31.0)에 `impact`가 이 문서를 지목해 인용 소스 `src/cli.js`를 재확인했다. 이번 변경은 `helpText()`의 `Exit codes` 블록 추가, Governance modes 블록의 `--mode` 수용 명령 목록, `COMMAND_HELP.mode`의 init 기본값 문장 교체, 그리고 `SUPPORTED_AGENTS`/`ALL_AGENTS`를 `src/config.js`로 옮긴 import 정리가 전부다 — `main()`·`parseArgs`·`COMMAND_OPTION_RULES` 키 집합은 무변경이고, 이 문서가 인용하는 것은 library 프로필의 문서 집합과 CLI 표면의 존재이지 도움말 문구가 아니다. 본문 **불변**.
- 2026-10-26(1.35.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `src/cli.js`를 대조했다. 바뀐 것은 `helpText`의 "Why" 두 줄뿐이다(조건 없는 이득 주장을 조건부로 바꿈). 이 문서가 서술하는 라이브러리 프로필(패키지 진입점·배포 형태)은 그대로이므로 본문 **불변**이다. 노트가 5건이라, 가장 오래된 1건을 `REVIEW_HISTORY.md`에 새로 만든 `Library Profile` 절로 옮겼다.
- 2026-10-27(1.36.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `src/cli.js`를 대조했다. 바뀐 것은 `main()`의 `--version`/`-v` 분기, 인자 없는 `help` 처리, 몇몇 명령의 도움말 문구다. 명령 집합(`COMMANDS`)과 프로그래매틱 API는 그대로라 본문은 불변이다.
