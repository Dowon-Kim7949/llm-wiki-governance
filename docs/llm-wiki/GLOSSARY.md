---
title: Glossary
tags:
  - llm-wiki
  - verified
status: verified
doc_type: glossary
project: llm-wiki-governance
last_updated: 2026-07-31
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Dowon-Kim
reviewed_at: 2026-07-31
wiki_block_version: v1
source_files:
  - src/frontmatter-schema.js
  - src/commands.js
  - src/config.js
evidence:
  - src/frontmatter-schema.js
  - src/config.js#symbol:VALID_STATUSES
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md
  - docs/llm-wiki/PUBLIC_API.md
visibility: internal
contains_sensitive_info: false
---

# Glossary

`llm-wiki-governance`에서 쓰는 핵심 용어입니다.

## Terms

- **Frontmatter** — 각 wiki 문서 상단의 YAML 블록. 필수 필드/enum은 `src/frontmatter-schema.js`가 정의한다.
- **status** — 문서 검토 상태. 허용값: `draft`, `needs_review`, `verified`, `deprecated`(`src/config.js` `VALID_STATUSES`). CLI/에이전트 산출물은 항상 `needs_review`.
- **verified** — 사람 검토가 끝난 문서에만 부여. `--strict`에서는 `reviewed_by`/`reviewed_at`가 없으면 실패.
- **source_files** — 문서 주장이 근거로 삼는 파일 목록(넓은 범위 근거).
- **evidence** — 파일/라인/심볼/섹션/라우트 단위의 정밀 근거 참조. 예: `src/cli.js#symbol:main`, `file#L10-L20`, `file#route:/users`. 본문 `## Evidence` 섹션과 정렬되어야 한다.
- **related** — 연결된 다른 wiki 문서 경로. 존재하지 않으면 `related.missing` 경고(P0-2에서 추가).
- **wikiGraph** — 위키 링크(이중 대괄호 표기) 기반 문서 그래프. 미해결 개념(unresolved concepts)·별칭(aliases)·고아 문서(orphans)를 집계한다.
- **adapter** — 에이전트에게 wiki 진입점을 알리는 파일. `AGENTS.md`(Codex), `CLAUDE.md`(Claude Code), `.cursor/rules/llm-wiki.mdc`(Cursor), `.github/copilot-instructions.md`(GitHub Copilot), 후보 `ANTIGRAVITY.md`.
- **profile** — 프로젝트 유형별 추가 문서 집합(`frontend`/`backend`/`fullstack`/`library`/`okf-v0.1`). `src/config.js` `PROFILE_DOCS`.
- **llm-wiki.config.json** — 프로젝트 루트의 선택적 설정 파일. 인식하는 키는 `type`·`profiles`·`agents`·`strict`·`rules`·`rulesPreset`·`requiredDocs`·`templates`·`reviewer`(별칭 `reviewedBy`)·`lang`·`docLanguage`이며, unknown 키는 무시돼 옛 파일이 계속 동작한다. 적용 우선순위는 CLI 플래그 > config > 자동감지(`strict`는 additive라 config가 켤 수만 있다). `src/config-file.js`. 키별 의미는 [PUBLIC_API](PUBLIC_API.md)의 Configuration 절이 소유한다.
- **rules / rulesPreset** — finding 규칙의 severity를 프로젝트 단위로 조정하는 수단. `rules`는 규칙 id → `off`/`blocked`/`error`/`warning`/`info` 맵이고, `rulesPreset`은 `relaxed`/`standard`/`strict` 명명 번들(`src/commands/findings.js` `RULE_PRESETS`)을 바닥값으로 깐다 — 명시적 `rules` 항목이 항상 프리셋을 이긴다. `sensitive.*`는 어느 쪽으로도 끌 수 없다. 둘 다 finding severity만 바꾸며 `--strict`(exit code 의미론)와는 별개다.
- **OKF v0.1** — 외부 지식 포맷 호환 프로필. `type`/`aliases`/`tags`와 위키 링크를 검증한다.
- **not_enriched** — 생성 후 아직 실제 내용으로 보강되지 않은 문서 신호(`content.not_enriched`, P0-3에서 추가).

## Evidence

- `src/frontmatter-schema.js` — 필수 필드, status/visibility enum, evidence 참조 패턴 정의.
- `src/config.js#symbol:VALID_STATUSES` — 허용 status 값 집합.

## Review Notes

- 2026-07-13에 현재 frontmatter 및 CLI 용어 계약을 기준으로 검토했다.
- 2026-07-16에 1.11.1 commands.js 모듈 분리(동작 보존 내부 리팩터)에 따라 재검토했다: GLOSSARY는 광의의 `src/commands.js` 참조만 있어 내용은 불변이며, 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-16)로 재승인하고 review baseline을 갱신해 `evidence.stale`을 해소했다.
- 2026-07-20에 1.14.1 노출-테스트 fix 배치에 따라 재검토했다: 용어 목록은 불변이며(광의의 `src/commands.js` 참조만), 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-20)로 재승인하고 review baseline을 갱신해 `evidence.stale`을 해소했다.
- 2026-07-31에 `evidence.stale`(commands.js가 2026-07-28 이후 변경) 대응으로 재검토하다가 **실제 내용 오류**를 찾아 고쳤다: `llm-wiki.config.json` 항목이 인식 키를 `type`/`profiles`/`agents`/`strict` 4개로만 적고 있었으나 `src/config-file.js`는 11개(`rules`·`rulesPreset`·`requiredDocs`·`templates`·`reviewer`(별칭 `reviewedBy`)·`lang`·`docLanguage` 추가)를 받는다. 키 목록을 소스와 맞추고 상세 계약 소유권을 PUBLIC_API Configuration 절로 넘겼으며, 거버넌스 핵심 어휘인 `rules`/`rulesPreset` 항목을 신설했다(프리셋=바닥값, 명시 `rules` 우선, `sensitive.*` 비토글, `--strict`와 무관). `related`에 PUBLIC_API를 추가했다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
