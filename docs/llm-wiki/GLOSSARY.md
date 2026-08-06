---
title: Glossary
tags:
  - llm-wiki
  - verified
status: verified
doc_type: glossary
project: llm-wiki-governance
last_updated: 2026-08-06
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-08-06
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
- **status** — 문서 검토 상태. 허용값: `draft`, `needs_review`, `verified`, `deprecated`(`src/config.js` `VALID_STATUSES`). CLI/에이전트 **생성 시점** 산출물은 항상 `needs_review`(생성기에는 `verified` 경로가 없다).
- **verified** — 검토가 끝난 문서에만 부여하며, 누가 검토했는지는 `reviewed_by`가 말한다. `--strict`에서는 `reviewed_by`/`reviewed_at`가 없으면 실패. 도구는 스스로 승격하지 않고 명시적 `review --approve`/`--approve-all --yes`만이 스탬프한다 — **누가 그 명령을 실행하는지는 저장소 정책이다.** 이 저장소는 2026-08-03부터 에이전트 승인을 허용하고 `reviewed_by`에 에이전트를 적는다([index.md](index.md) Status). 도입처 기본값은 사람 검토다.
- **human_verified** (evidence tier) — `stats`가 계산하는 report-only 값이며 정의는 "`verified` + reviewer 메타 존재"다. **reviewer가 사람인지 검사하지 않으므로**, 이 저장소에서는 에이전트 승인분도 여기에 포함된다. 이름과 실제 의미가 어긋나 있고, 이 저장소의 수치를 인용할 때 그 사실을 함께 적어야 한다.
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
- **템플릿 문서(template doc)** — `docs/llm-wiki/templates/` 하위 문서. **도입처가 복사해 쓰는 뼈대이지 그 저장소를 서술하는 문서가 아니므로** 검토(`review`) 대상도, 최신성 게이트(`evidence.stale`/`impact.source_changed`) 대상도 아니다. 판정의 단일 소스는 `src/commands/wiki-files.js#symbol:isTemplateDoc`이며 `listWikiContentDocs`가 쓰던 경계와 같다. 2026-08-06 이전에는 이 경계가 명령마다 달라서(N-14) 게이트는 지목하는데 `review`로는 손댈 수 없는 문서가 존재했다 — **해소 경로가 없는 finding**. 승격 대상이 아니라는 사실과 최신성 검사 대상이 아니라는 사실이 이제 같은 술어에서 나온다.

## Evidence

- `src/frontmatter-schema.js` — 필수 필드, status/visibility enum, evidence 참조 패턴 정의.
- `src/config.js#symbol:VALID_STATUSES` — 허용 status 값 집합.

## Review Notes

Older review notes (2 entries, 2026-07-13 → 2026-07-16) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-07-20에 1.14.1 노출-테스트 fix 배치에 따라 재검토했다: 용어 목록은 불변이며(광의의 `src/commands.js` 참조만), 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-20)로 재승인하고 review baseline을 갱신해 `evidence.stale`을 해소했다.
- 2026-07-31에 `evidence.stale`(commands.js가 2026-07-28 이후 변경) 대응으로 재검토하다가 **실제 내용 오류**를 찾아 고쳤다: `llm-wiki.config.json` 항목이 인식 키를 `type`/`profiles`/`agents`/`strict` 4개로만 적고 있었으나 `src/config-file.js`는 11개(`rules`·`rulesPreset`·`requiredDocs`·`templates`·`reviewer`(별칭 `reviewedBy`)·`lang`·`docLanguage` 추가)를 받는다. 키 목록을 소스와 맞추고 상세 계약 소유권을 PUBLIC_API Configuration 절로 넘겼으며, 거버넌스 핵심 어휘인 `rules`/`rulesPreset` 항목을 신설했다(프리셋=바닥값, 명시 `rules` 우선, `sensitive.*` 비토글, `--strict`와 무관). `related`에 PUBLIC_API를 추가했다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-08-03에 `status`·`verified` 정의를 이 저장소의 새 승격 정책에 맞게 고치고 **`human_verified` tier를 용어로 신설했다**(유지보수자 결정 반영). `verified` 항목이 "사람 검토가 끝난 문서에만 부여"라고 단정하고 있었는데, 이 저장소는 2026-08-03부터 에이전트 승인을 허용하므로 그 문장은 거짓이 됐다 — 도구가 스스로 승격하지 않는다는 사실(명시적 `--approve`만이 스탬프한다)과 **누가 그 명령을 실행하는지는 저장소 정책이라는 사실**을 분리해 적었다. `status` 항목의 "CLI/에이전트 산출물은 항상 `needs_review`"도 **생성 시점** 한정으로 좁혔다(생성기에 `verified` 경로가 없다는 것은 여전히 참이다). `human_verified`를 새로 적은 이유는 그 이름이 실제 계산과 어긋나기 때문이다 — 정의는 "`verified` + reviewer 메타 존재"일 뿐 사람인지 검사하지 않으므로, 이 저장소의 그 수치는 에이전트 승인분을 포함한다. 인용할 때 함께 적어야 한다. 에이전트(Claude Code) 편집이며 새 정책에 따라 같은 작업 안에서 승격했다 — `reviewed_by`는 에이전트다.
- 2026-08-03에 `impact.source_changed` 기본 severity의 error화, 신규 규칙 2종(`run.manifest_untracked` info·`run.change_set_undeclared` warning), `strict` 프리셋에서 `impact.source_changed` 항목 제거, `FRESHNESS_EXEMPT_DOC_TYPES`(release_notes) 면제, `drift --watch-needs-review` 도입에 따라 재검토했다: 이 문서가 severity·빌드 실패·`--strict`에 대해 취한 입장 셋 — `verified`의 "`--strict`에서 `reviewed_by`/`reviewed_at` 없으면 실패"(`frontmatter.verified_review`는 HEAD에서도 기본 warning), `related.missing` 경고, `rules`/`rulesPreset`이 severity만 바꾸고 `--strict`(exit code 의미론)와 별개라는 문장(`RULE_PRESETS` 주석이 그대로 재확인) — 이 모두 여전히 참이고, `human_verified` 정의의 근거인 `evidenceTier()`도 무변경이며 근거 파일 `src/frontmatter-schema.js`·`src/config.js`·`src/config-file.js`는 이 커밋에서 아예 바뀌지 않았다(`src/commands.js`는 광의 앵커일 뿐이다) — **내용 불변, 무편집**. 신규 규칙 2종과 exit code 계약은 같은 커밋에서 갱신된 [PUBLIC_API](PUBLIC_API.md)가 소유하므로, 규칙을 열거하지 않는 용어집에 옮겨 적지 않았다.
- 2026-08-04에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `src/commands.js`를 재확인했다. 이번 변경은 `impact`의 change set에서 `version`만 바뀐 `package.json`을 빼는 판정기(`versionOnlyManifestChanges`)를 더하고 고친 것이며, 이 용어집이 정의하는 어휘(`status`·`verified`·`human_verified`·`source_files`·`evidence`·`rules`/`rulesPreset`)의 계약은 하나도 건드리지 않았다 — `rules`/`rulesPreset`이 severity만 바꾸고 `--strict`와 별개라는 문장도 그대로 참이다. 새 제외 규칙은 설정 키가 아니라 하드코딩이므로 `rules` 항목에 추가할 것도 없다. 본문 **불변**. 재스탬프가 no-op이 되는 N-11 때문에 노트로 남긴다.
