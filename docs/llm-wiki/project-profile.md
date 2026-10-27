---
title: Project Profile
tags:
  - llm-wiki
  - verified
status: verified
doc_type: project_profile
project: llm-wiki-governance
last_updated: 2026-10-21
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-27
wiki_block_version: v1
source_files:
  - package.json
  - bin/llm-wiki.js
  - src/cli.js
evidence:
  - package.json
  - bin/llm-wiki.js
  - src/cli.js#symbol:main
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
source_digests:
  - package.json sha256:f3f1cc9932fdcd62
  - bin/llm-wiki.js sha256:6af8af1e6a7df978
  - src/cli.js sha256:6c135d9a743008be
---

# Project Profile

## Detected Project

- type: `library` (Node ESM CLI 패키지; 공개 계약은 `llm-wiki` 명령어 표면)
- npm 패키지명: `llm-wiki-governance` (1.16.0에서 `@dowonk-7949/llm-wiki-standard`에서 개명; 옛 스코프드 패키지는 deprecate되어 새 이름을 가리킨다).
- 버전: `package.json`의 `version`이 단일 소스다(이 문서는 특정 버전 숫자를 고정하지 않는다).

## Summary

- `llm-wiki-governance`는 Codex·Claude Code·CI·로컬 터미널에서 **AI가 쓴 프로젝트 문서를 검증·드리프트 감지·CI 강제**하는 거버넌스 CLI다(초기 문서 생성도 함께 제공). 1.16.0에서 포지셔닝을 "공통 표준"에서 **거버넌스 레이어(OKF-compatible)**로 옮겼다.
- 특정 도구 전용이 아니라 여러 adapter(`AGENTS.md`, `CLAUDE.md`, 후보 `ANTIGRAVITY.md`)에서 함께 쓰는 도구-중립 거버넌스를 지향한다.
- 보수적 쓰기 정책이 핵심이다: 기본은 미리보기, 실제 쓰기는 명시적 `--write`/`--apply` 시에만(예: `init --write`, `migrate --apply`, `archive-log --write`). 모든 쓰기는 `verified` 문서 내용을 보존하고 결과를 `needs_review`로 남긴다.

## Runtime & Packaging

- 런타임: Node.js `>=18.18.0` (package.json `engines`), `type: module` (ESM).
- 진입점: `bin/llm-wiki.js` → `src/cli.js`의 `main()`.
- 의존성: 런타임 서드파티 의존성 없음(Node 내장 모듈만 사용).
- tarball 구성(1.34.0): `bin/`·`src/`·`templates/`·`rules/`·`adapters/`·`profiles/`와 README 2종·`LICENSE`·`package.json`뿐이다. 런타임이 자기 위치에서 읽는 것은 `package.json`과 `templates/`가 전부라, 프로젝트 문서 md는 싣지 않는다(packed 557,702 → 278,450 B, unpacked 1,704,003 → 941,286 B).
- 배포: `v*` 태그 push → `.github/workflows/publish.yml`의 npm Trusted Publishing. 1.7부터 같은 태그 트리거에 격리된 `contents: write` 잡이 추가돼 러너 `gh` CLI로 GitHub Release도 만든다(본문은 `release-notes --body-only`; GATE_REVIEW Gate 12). 자세한 내용은 [Release Flow](RELEASE_FLOW.md).

## Ownership

- 저장소: `github.com/Dowon-Kim7949/llm-wiki-governance`.
- 릴리스 게이트/의사결정 기록은 `GATE_REVIEW.md`, 방향성은 `ROADMAP.md` 참조.

## Evidence

- `package.json` — 패키지명, `version`(배포 버전의 단일 소스), `engines.node >=18.18.0`, `bin.llm-wiki`, ESM 설정.
- `bin/llm-wiki.js` — CLI 실행 진입점.
- `src/cli.js#symbol:main` — 인자 파싱과 명령 디스패치.

## Open Questions

- Antigravity adapter 파일명 계약이 아직 미확정이라 `ANTIGRAVITY.md`는 info-level 후보로만 다룬다.
- 팀/조직 도입 시 visibility 경계(internal/restricted/public) 정책 문서가 필요하다.

## Review Notes

Older review notes (4 entries, 2026-07-14 → 2026-08-03) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 2건을 재확인했다: `package.json`, `src/cli.js#symbol:main`. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. `package.json` 변경은 version 한 줄이고 이 문서는 “`version`이 단일 소스다(이 문서는 특정 버전 숫자를 고정하지 않는다)”라고 스스로 밝히고 있으므로 서술이 그대로 유효하며, 런타임·진입점·무의존성·배포 절차 서술도 이번 diff와 무관하다. `main()`은 무변경(바뀐 것은 `COMMAND_HELP.drift`와 usage 문자열) — 본문 **불변**.

- 2026-09-07(1.30.0)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 2건을 재확인했다: `package.json`, `src/cli.js#symbol:main`. `package.json` 변경은 version 한 줄(1.29.5 → 1.30.0)이고 이 문서는 스스로 “`version`이 단일 소스다(이 문서는 특정 버전 숫자를 고정하지 않는다)”라고 밝히므로 서술이 그대로 유효하다. `src/cli.js`에서 바뀐 것은 `COMMANDS` 맵의 `mode`·`backfill` 등록, `defaultOptions`의 `mode`/`modeAction`, `parseArgs`의 `--mode`와 `mode set <레벨>` 위치 인자, `COMMAND_OPTION_RULES`·`helpText`·`COMMAND_HELP`이며 **`main()`은 무변경**이다(파싱 → 디스패치 → 리포트 → exit code 계약이 그대로다). 런타임(Node `>=18.18.0`)·진입점·무의존성(신규 import는 내부 `./governance.js`뿐)·배포 절차 서술도 이번 diff와 무관하다 — 본문 **불변**.

- 2026-09-08(1.31.0)에 `impact`가 이 문서를 지목해 인용 소스 3건(`package.json`·`bin/llm-wiki.js`·`src/cli.js#symbol:main`)을 재확인했다. `package.json`은 version 한 줄만 바뀌었고 이 문서는 스스로 "`version`이 단일 소스다"라고 밝히고 있으므로 유효하다. `bin/llm-wiki.js`는 무변경이다. `src/cli.js`의 변경은 `helpText()`·`COMMAND_HELP.mode`·import 정리뿐이라 **`main()`은 무변경**이고, 런타임·진입점·무의존성 서술도 이번 diff와 무관하다(새 import는 내부 `./config.js`뿐이다). 본문 **불변**.
- 2026-10-26(1.35.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `src/cli.js`(앵커 `#symbol:main`)를 대조했다. `cli.js`의 변경은 `helpText`의 두 줄이고 `main()`은 그대로다. `package.json`은 `version`만 바뀌어 앵커 대조에서 빠졌다(N-13). 이 문서는 버전 숫자를 고정하지 않으므로 런타임·진입점·무의존성·배포 서술이 그대로 유효하다. 본문 **불변**.
- 2026-10-27(1.36.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `src/cli.js#symbol:main`을 대조했다. `main()`에 첫 인자 `--version`/`-v` 분기가 생겼지만 진입점과 디스패치 구조, 런타임·무의존성·배포 서술은 그대로다. 본문 불변.
