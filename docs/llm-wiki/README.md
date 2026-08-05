---
title: LLM-WIKI README
tags:
  - llm-wiki
  - verified
status: verified
doc_type: wiki_readme
project: llm-wiki-governance
last_updated: 2026-08-03
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-08-05
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
---

# LLM-WIKI README

이 디렉터리는 `llm-wiki-governance` 저장소의 지식·의사결정·작업 규칙을 LLM과 개발자가 함께 참조하기 위한 공간입니다. 이 wiki는 패키지가 제공하는 CLI를 저장소 자신에게 적용한 dogfooding 결과입니다.

## Entry Point

- 시작점은 [index.md](index.md)이며 권장 읽기 순서를 안내합니다.
- 사용자 대상 설치/사용 안내는 저장소 루트 `README.md`를, 릴리스 게이트는 `GATE_REVIEW.md`를, 방향성은 `ROADMAP.md`를 참조하세요.
- 초급자와 팀원을 위한 설명 자료는 [LLM-WIKI 팀 브리핑 덱](../../outputs/team-briefing/llm-wiki-briefing.html)을 참조하세요(옛 `v1.5.1.pptx`는 이 HTML 덱으로 대체됨).
- 루트의 외부 공개 문서는 영문 `.md`(정본)와 국문 `.ko.md`를 쌍으로 유지합니다: `README`, `CHANGELOG`, `ROADMAP`. 두 파일 상단에 `> Language:` 상호링크를 두고, 새 `.ko.md`는 `package.json` `files`에 등록하며, 한쪽을 고치면 짝도 함께 갱신합니다.
- 루트 `README.md`/`README.ko.md`는 사용자용이라 LLM-WIKI frontmatter를 두지 않고, `ROADMAP`은 frontmatter를 두며 국문본이 이를 미러링합니다. 이들 루트 문서는 `docs/llm-wiki/` 밖이라 `validate`/`validate-frontmatter` 스캔 대상이 아닙니다.

## Operating Rules

- 모든 wiki 문서는 YAML frontmatter를 가집니다.
- CLI 또는 에이전트가 생성/수정한 문서는 편집 시점에 `needs_review`로 둡니다. **이 저장소에서는 그 뒤 에이전트가 `review --approve-all --yes`로 스스로 승격합니다**(2026-08-03 유지보수자 결정; `reviewed_by`는 config `reviewer`가 지목하는 에이전트 이름). 도입처로 나가는 규칙은 불변이며 계약 전문은 `AGENTS.md` "Wiki discipline"에 있습니다 — [index.md](index.md) Status 절도 함께 보세요.
- 민감정보 raw value는 기록하지 않습니다.
- 변경 기록은 [log.md](log.md)에 append-only로 남깁니다.
- 문서가 아직 보강되지 않으면 `llm-wiki validate`가 `content.not_enriched`로 표시합니다.

## Review Notes

- 2026-08-03에 HEAD의 루트 `README.md` 변경(impact 기본 error Upgrading 절·`drift --watch-needs-review`·release_notes 면제·adapter 본문 영어 고정)을 이 문서 전 항목과 대조했다. 이 문서는 impact/drift 게이트와 adapter 언어에 대해 아무 주장도 하지 않고(게이트 계약은 `AGENTS.md`·index.md에 위임), EN/KO 짝 갱신 규칙은 이번 커밋에서 `README.md`·`README.ko.md`가 함께 바뀌어 지켜졌으며, `review --approve-all --yes`와 `content.not_enriched`도 소스에서 재확인돼 **불변** — 본문 무수정(`package.json`은 이번 커밋에서 변경 없음).
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 2건을 재확인했다: `package.json`, `README.md`. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서가 소유한 것은 위키 운영 규칙(상태 전이·근거 규약·로그)이고 루트 README의 Upgrading 절·액션 핀은 그 규칙과 무관하며, `package.json`의 version 한 줄도 마찬가지다 — 본문 **불변**.
- 2026-08-04에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `README.md`를 재확인했다. 루트 README에서 바뀐 것은 `impact` 행과 드리프트 불릿의 **버전만 올린 매니페스트 제외** 서술(그리고 그것이 `impact` 한정임을 명시한 범위 문장)이다. 이 문서가 소유한 것은 위키 운영 규칙이고 게이트별 계약 서술은 `PUBLIC_API.md`가 소유하므로 옮겨 적을 것이 없다 — 본문 **불변**. 재스탬프가 no-op이 되는 N-11 때문에 노트로 남긴다.
