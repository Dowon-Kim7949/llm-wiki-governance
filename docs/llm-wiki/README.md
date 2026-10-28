---
title: LLM-WIKI README
tags:
  - llm-wiki
  - verified
status: verified
doc_type: wiki_readme
project: llm-wiki-governance
last_updated: 2026-10-27
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-28
wiki_block_version: v1
source_files:
  - package.json
  - README.md
evidence:
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/project-profile.md
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
source_digests:
  - package.json sha256:7c299ceb0ae61c09
  - README.md sha256:c66473dc9b5fde80
---

# LLM-WIKI README

이 디렉터리는 `llm-wiki-governance` 저장소의 지식·의사결정·작업 규칙을 LLM과 개발자가 함께 참조하기 위한 공간입니다. 이 wiki는 패키지가 제공하는 CLI를 저장소 자신에게 적용한 dogfooding 결과입니다.

## Entry Point

- 시작점은 [index.md](index.md)이며 권장 읽기 순서를 안내합니다.
- 사용자 대상 설치/사용 안내는 저장소 루트 `README.md`를, 릴리스 게이트는 `GATE_REVIEW.md`를, 방향성은 `ROADMAP.md`를 참조하세요.
- 초급자와 팀원을 위한 설명 자료는 [LLM-WIKI 팀 브리핑 덱](../../outputs/team-briefing/llm-wiki-briefing.html)을 참조하세요(옛 `v1.5.1.pptx`는 이 HTML 덱으로 대체됨).
- 루트의 외부 공개 문서는 영문 `.md`(정본)와 국문 `.ko.md`를 쌍으로 유지합니다: `README`, `CHANGELOG`, `ROADMAP`. 두 파일 상단에 `> Language:` 상호링크를 두고, 한쪽을 고치면 짝도 함께 갱신합니다. `package.json` `files`에는 README 쌍만 등록합니다 — 1.34.0부터 `CHANGELOG`·`ROADMAP`·`GATE_REVIEW` 같은 프로젝트 문서는 런타임이 읽지 않으므로 npm tarball에 싣지 않고 GitHub에만 둡니다.
- 루트 `README.md`/`README.ko.md`는 사용자용이라 LLM-WIKI frontmatter를 두지 않고, `ROADMAP`은 frontmatter를 두며 국문본이 이를 미러링합니다. 이들 루트 문서는 `docs/llm-wiki/` 밖이라 `validate`/`validate-frontmatter` 스캔 대상이 아닙니다.

## Operating Rules

- 모든 wiki 문서는 YAML frontmatter를 가집니다.
- CLI 또는 에이전트가 생성/수정한 문서는 편집 시점에 `needs_review`로 둡니다. **이 저장소에서는 그 뒤 에이전트가 `review --approve-all --yes`로 스스로 승격합니다**(2026-08-03 유지보수자 결정; `reviewed_by`는 config `reviewer`가 지목하는 에이전트 이름). 도입처로 나가는 규칙은 불변이며 계약 전문은 `AGENTS.md` "Wiki discipline"에 있습니다 — [index.md](index.md) Status 절도 함께 보세요.
- 민감정보 raw value는 기록하지 않습니다.
- 변경 기록은 [log.md](log.md)에 append-only로 남깁니다. 1.33.0에서 이 원칙을 다시 정의했습니다. 항목은 절대 고치지 않지만, 오래된 항목을 통째로 월별 권(`log-YYYY-MM.md`, log.md와 같은 디렉터리)에 원문 그대로 옮기는 것은 허용합니다. 옮기는 도구는 `archive-log`이고 기본은 미리보기, `--write`일 때만 씁니다. 월별 권도 log.md와 같은 불변 기록이라 `review`·`drift`·`impact`·`fix`가 건너뛰고, 새 권은 `needs_review`로 시작합니다. 이 저장소에서는 아직 실행하지 않았습니다.
- 문서가 아직 보강되지 않으면 `llm-wiki validate`가 `content.not_enriched`로 표시합니다.

## Review Notes

Older review notes (9 entries, 2026-08-03 → 2026-09-14) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-10-26에 `impact`가 이 문서를 지목해 루트 `README.md` 변경을 대조했다. 루트 README의 구성을 바꾸고 절 다섯 개를 더했으며, 사실보다 넓던 문장을 고쳤다. 이 문서가 소유한 규약은 세 가지다. EN/KO 쌍을 유지하고 상단에 `> Language:` 상호링크를 두는 것, 루트 README에 frontmatter를 두지 않는 경계, `validate` 스캔 범위다. 셋 다 그대로 참이다. **쌍 유지 규약도 지켰다**: `README.ko.md`를 같은 절 구성으로 함께 고쳤고, 액션 태그는 두 파일 모두 `@v1.34.0`이다. 한국어판은 짝 문서가 있는 링크(`CHANGELOG.ko.md`·`ROADMAP.ko.md`·`SECURITY.ko.md`·`CONTRIBUTING.ko.md`·`BENCHMARK_DISCLOSURE.ko.md`)를 국문본으로 가리키고, 짝이 없는 영문 문서(`OPERATIONS.md`·`GATE_REVIEW.md`)에는 "영문"이라고 표시했다. 본문 **불변**. 같은 날 1.35.0 준비에서 다시 지목됐다. 루트 README에 세 가지를 더했다: 액션 핀 `@v1.35.0`, job summary 안내 문단, 이 저장소 위키가 에이전트 승인이라는 사실. `README.ko.md`에도 같은 위치에 같은 내용을 넣었다(쌍 규약 유지). 이 문서가 소유한 규약은 그대로다. 다만 마지막 사실은 이 문서의 상태 전이 규칙(편집 시 `needs_review`, 작업 끝에 `review --approve-all --yes`)이 루트 README에서도 공개된다는 뜻이다.
- 2026-10-27에 `impact`가 인용 소스 `README.md`(루트)의 변경으로 이 문서를 지목했다. 루트 README에는 "Try it on a demo app" 절과 문서 표 한 줄이 추가됐을 뿐이다. 이 문서가 다루는 위키 운영 규칙과는 관계가 없어 본문은 **불변**이다.
- 2026-10-27(1.36.0 준비)에 `impact`가 인용 소스 `README.md`(루트)의 변경으로 이 문서를 지목했다. 루트 README를 188줄에서 121줄로 줄이면서 절을 합치고 1.36.0 동작(BM25 검색, 로케이터 축소, `--version`)을 반영했다. 이 문서가 소유한 규약(EN/KO 쌍과 상단 `> Language:` 상호링크, 루트 README에 frontmatter 없음, 패키지 포함)은 두 파일 모두 그대로 지킨다. 본문 불변.
- 2026-10-27(1.37.0 준비)에 `impact`가 인용 소스 `README.md`(루트)의 변경으로 이 문서를 지목했다. 루트 README에서 바뀐 것은 컴포지트 액션 핀(`@v1.36.0` → `@v1.37.0`)과 "변경 감지는 대부분 파일 단위" 불릿이다. 그 불릿은 줄 범위·섹션 축소를 `impact`만 한다고 적고 있었는데, `drift`는 줄 범위를 원래 좁혀 왔고 1.37.0부터 `.md` 섹션도 좁히므로 둘 다로 고쳤다. `README.ko.md`의 같은 위치도 함께 고쳐 쌍 규약을 지켰다. 이 문서가 소유한 규약은 그대로라 본문 **불변**이다. 이 노트로 6건이 되어 가장 오래된 2026-09-08(1.31.0) 항목을 `REVIEW_HISTORY.md`로 원문 그대로 옮겼다(아카이브 7 → 8건).
- 2026-10-27(greenfield, 미배포)에 `impact`가 인용 소스 `README.md`(루트)의 변경으로 이 문서를 지목했다. 루트 README의 빠른 시작에 코드가 없는 프로젝트용 `--greenfield` 문단이 추가됐고, `README.ko.md`의 같은 위치에도 대응 문단을 넣어 EN/KO 쌍을 유지했다. 이 문서가 다루는 위키 운영 규칙과는 관계가 없어 본문은 **불변**이다. 이 노트로 6건이 되므로 가장 오래된 2026-09-14 항목을 `REVIEW_HISTORY.md`로 원문 그대로 옮겨 5건을 유지했다(아카이브 8 → 9건).
