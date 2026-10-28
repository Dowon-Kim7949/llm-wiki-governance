---
title: Glossary
tags:
  - llm-wiki
  - verified
status: verified
doc_type: glossary
project: llm-wiki-governance
last_updated: 2026-10-28
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-28
wiki_block_version: v1
source_files:
  - src/frontmatter-schema.js
  - src/commands.js
  - src/config.js
  - llm-wiki.config.json
evidence:
  - src/frontmatter-schema.js
  - src/config.js#symbol:VALID_STATUSES
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md
  - docs/llm-wiki/PUBLIC_API.md
visibility: internal
contains_sensitive_info: false
source_digests:
  - src/frontmatter-schema.js sha256:ec4476da72b5c2e2
  - src/commands.js sha256:9de9e64b3a165a88
  - src/config.js sha256:ef863d1307ba2dc9
  - llm-wiki.config.json sha256:16fa581c78b330eb
---

# Glossary

`llm-wiki-governance`에서 쓰는 핵심 용어입니다.

## Terms

- **Frontmatter** — 각 wiki 문서 상단의 YAML 블록. 필수 필드/enum은 `src/frontmatter-schema.js`가 정의한다.
- **status** — 문서 검토 상태. 허용값: `draft`, `needs_review`, `verified`, `deprecated`(`src/config.js` `VALID_STATUSES`). CLI/에이전트 **생성 시점** 산출물은 항상 `needs_review`(생성기에는 `verified` 경로가 없다).
- **verified** — 검토가 끝난 문서에만 부여하며, 누가 검토했는지는 `reviewed_by`가 말한다. `--strict`에서는 `reviewed_by`/`reviewed_at`가 없으면 실패. 도구는 스스로 승격하지 않고 명시적 `review --approve`/`--approve-all --yes`만이 스탬프한다 — **누가 그 명령을 실행하는지는 저장소 정책이다.** 이 저장소는 2026-08-03부터 에이전트 승인을 허용하고 `reviewed_by`에 에이전트를 적는다([index.md](index.md) Status). 도입처 기본값은 사람 검토다.
- **human_verified** (evidence tier) — `stats`가 계산하는 report-only 값이며 정의는 "`verified` + reviewer 메타 존재"다. **reviewer가 사람인지 검사하지 않으므로**, 이 저장소에서는 에이전트 승인분도 여기에 포함된다. 이름과 실제 의미가 어긋나 있고, 이 저장소의 수치를 인용할 때 그 사실을 함께 적어야 한다. 1.33.0부터 config `agentReviewers`에 에이전트 검토자 이름을 적으면 그 승인은 **agent_verified**로 분리된다(목록이 없으면 `null` = 구분 불가). 이 저장소는 2026-10-21에 config를 설정해 사람 4 / 에이전트 47로 갈라 센다.
- **source_files** — 문서 주장이 근거로 삼는 파일 목록(넓은 범위 근거). 키는 필수지만 빈 목록이 허용된다. 인라인 `source_files: []`도 빈 목록으로 읽는다(그 전에는 문자열 `"[]"`로 읽어 `frontmatter.array` 오류가 났다). `init`은 매니페스트 파일이 실제로 없으면 생성 문서에 빈 목록을 쓰고, 요구사항·결정 템플릿에는 매니페스트가 있어도 빈 목록을 쓴다(복사본이 첫날부터 근거 연결됨으로 보이지 않게).
- **evidence** — 파일/라인/심볼/섹션/라우트 단위의 정밀 근거 참조. 예: `src/cli.js#symbol:main`, `file#L10-L20`, `file#route:/users`. 본문 `## Evidence` 섹션과 정렬되어야 한다. 형식의 정의는 `src/frontmatter-schema.js#symbol:EVIDENCE_REFERENCE_PATTERN` 하나다(1.33.0). 파일 없는 `#anchor`는 아무 소스도 가리키지 않으므로 evidence가 아니다.
- **계획된 지식(planned knowledge)** — 의도한 동작을 말하는 문서. `doc_type`이 `requirement`이거나 결정 기록 타입(`decision`·`decision_log`·`adr`)이면 해당한다(`src/commands/scans.js#symbol:PLANNED_DOC_TYPES`). 이런 문서의 `verified`는 **계획 승인**이지 구현 완료가 아니다. 근거 없이 승인된 계획 문서는 `evidence.ungrounded`(warning) 대신 `evidence.planned_unlinked`(info)로 보고되고, `stats`는 `plannedKnowledge`로 따로 센다. 로컬 참조가 모두 해석되면 "linked"인데, 이는 구현 위치를 가리킬 뿐 완료를 뜻하지 않는다. 새 필드나 status 값 없이 기존 `doc_type`만으로 표현한다. 요구사항 생성 경로는 `init --greenfield`가 깔아 주는 `templates/REQUIREMENT.template.md`다. `review` 목록은 이런 문서를 `no-evidence` 대신 `planned`로 표시한다(1.38.0).
- **related** — 연결된 다른 wiki 문서 경로. 존재하지 않으면 `related.missing` 경고(P0-2에서 추가).
- **wikiGraph** — 위키 링크(이중 대괄호 표기) 기반 문서 그래프. 미해결 개념(unresolved concepts)·별칭(aliases)·고아 문서(orphans)를 집계한다.
- **adapter** — 에이전트에게 wiki 진입점을 알리는 파일. `AGENTS.md`(Codex), `CLAUDE.md`(Claude Code), `.cursor/rules/llm-wiki.mdc`(Cursor), `.github/copilot-instructions.md`(GitHub Copilot), 후보 `ANTIGRAVITY.md`.
- **profile** — 프로젝트 유형별 추가 문서 집합(`frontend`/`backend`/`fullstack`/`library`/`okf-v0.1`). `src/config.js` `PROFILE_DOCS`.
- **source_digests / 내용 앵커** — (1.36.0, 섀도) `review --approve`가 config `sourceDigests: true`일 때 스탬프하는 선택 frontmatter 리스트. 항목은 `<경로[로케이터]> sha256:<16 hex>`이고, 검토 시점에 인용 소스가 어떤 내용이었는지를 날짜·SHA·머지 방식과 무관하게 기록한다. `drift --anchor content`가 지금 내용과 비교해 날짜 판정 옆에 보인다. 1.41.0부터 비교 대상은 작업 트리가 아니라 `HEAD`이고, 루트·workspace `package.json`은 `version` 값을 빼고 digest를 계산한다(그 전 전체 파일 digest도 받아들인다). 같은 릴리스부터 `sourceDigests: true`이면 `drift`가 줄 범위·섹션 인용을 축소하기 전에 기록된 영역 digest가 `HEAD`와 같은지도 본다(C′) — finding을 남길 수만 있고 지우지 않는다.
- **locatorNarrowed** — (1.36.0) `impact` JSON 키. 줄 범위나 `.md` 섹션으로만 인용된 파일이 diff에 들었지만 인용된 영역은 그대로라 실패시키지 않은 인용의 목록. 건너뛴 사실을 숨기지 않으려고 보고한다. 1.37.0부터 `drift`에도 같은 키가 있고, 1.39.0부터 `drift`는 **리뷰 스탬프 커밋**도 동의할 때만 인용을 이 목록으로 보낸다.
- **리뷰 스탬프 커밋(review stamp commit)** — (1.39.0) 문서의 현재 `reviewed_at`(없으면 `last_updated`) 줄을 쓴 가장 최근 커밋. 그 커밋에 커밋된 값이 작업 트리의 값과 같을 때만 인정한다(`src/commands/scans.js#symbol:reviewStamp`). 리뷰일 끝 스냅샷은 날짜 순서로 고른 커밋이라 리뷰어가 보지 않은 곁가지 커밋일 수 있었고, 그래서 `drift`의 축소가 바뀐 인용을 숨겼다(N-20). 이 커밋을 정할 수 없으면 축소하지 않는다.
- **workspace 힌트(typeHint)** — (1.40.0) `init`이 `--type` 없이 `unknown`으로 감지한 npm/yarn workspace 저장소에서 멤버 매니페스트의 프레임워크 의존성을 보고 내는 `--type` 제안. 텍스트 `hint:` 줄과 JSON `typeHint`로만 나오고 감지 결과(`detection.projectType`)는 바꾸지 않는다(`src/detector.js#symbol:workspaceTypeHint`).
- **impact.plan_changed / changedPlans** — (1.39.0) `impact`의 반대 방향 신호. diff 안에서 승인된 계획 문서(계획된 지식)의 계획 서술 절이 바뀌면, 그 문서가 연결한 로컬 파일과 각 파일이 같은 diff에서 `changed`/`unchanged`/`missing`/`uncertain`인지를 info finding과 JSON `changedPlans`로 낸다. 검토할 후보 목록이지 충족 판정이 아니다. 판정 규칙은 `src/commands/plan-changes.js#symbol:scanPlanChanges`에 있다.
- **llm-wiki.config.json** — 프로젝트 루트의 선택적 설정 파일. 인식하는 키는 `type`·`profiles`·`agents`·`strict`·`rules`·`rulesPreset`·`requiredDocs`·`templates`·`reviewer`(별칭 `reviewedBy`)·`lang`·`docLanguage`·`harnessHealth`·`wikiBudget`(1.33.0, `{ "logTokens", "docTokens" }`)·`agentReviewers`(1.33.0, 이름 배열)·`promptProfile`(1.33.0, `"full"|"slim"`)·`governance`(1.30.0, `{ "mode": "lite"|"standard"|"strict" }`)·`checkRun`(1.36.0, `{ "ignore": ["dir/", "*.ext", "경로"] }`)·`sourceDigests`(1.36.0, boolean)이며, unknown 키는 무시돼 옛 파일이 계속 동작한다. **1.31.0부터 값 어휘도 검증한다**: `type`은 `KNOWN_TYPES`에, `agents`는 `SUPPORTED_AGENTS`에 대조하고 위반은 config 오류(exit 3), `agents`의 `all`은 CLI와 같이 세 이름으로 펼쳐진다 — 그 전에는 타입만 봐서 `{"type": "frontendd"}`가 조용히 통과했다. 적용 우선순위는 CLI 플래그 > config > 자동감지(`strict`는 additive라 config가 켤 수만 있다). `src/config-file.js`. 키별 의미는 [PUBLIC_API](PUBLIC_API.md)의 Configuration 절이 소유한다.
- **월별 권(log volume)** — `docs/llm-wiki/log-YYYY-MM.md`. `archive-log`(1.33.0)가 `log.md`에서 보존 기간을 넘긴 항목을 고치지 않고 통째로 옮겨 두는 파일이다(기존 권에 덧붙일 때는 줄끝만 그 권을 따른다). 집계(`stats`·orphan)에서는 `log.md` 하나로 센다. `log.md`와 같은 변경 로그 기록으로 취급된다(`isAppendOnlyLog`): 다시 쓰이지 않고 review·drift·impact 대상이 아니며, 민감정보·링크 스캔은 받는다.
- **rules / rulesPreset** — finding 규칙의 severity를 프로젝트 단위로 조정하는 수단. `rules`는 규칙 id → `off`/`blocked`/`error`/`warning`/`info` 맵이고, `rulesPreset`은 `relaxed`/`standard`/`strict` 명명 번들(`src/commands/findings.js` `RULE_PRESETS`)을 바닥값으로 깐다 — 명시적 `rules` 항목이 항상 프리셋을 이긴다. `sensitive.*`는 어느 쪽으로도 끌 수 없다. 둘 다 finding severity만 바꾸며 `--strict`(exit code 의미론)와는 별개다. **`off`는 보고를 끌 뿐 사실을 끄지 않는다**(1.38.0): finding으로 사실을 판정하는 `stats`(보강률·`reference_checked`·`stale_verified`)·`next`(Enrichment Checklist)·`review`(스캐폴드 승인 거부)는 자기가 읽는 규칙을 꺼진 상태에서도 읽는다(`src/governance.js#symbol:withRulesMeasured`). 1.39.0부터 `review`는 **모드의 floor만이** 끈 규칙(`governanceSuppressedRules`)도 승인 판정에서 되살린다 — 모드는 무엇을 보고할지만 바꾸고 무엇을 승인할 수 있는지는 바꾸지 않는다. 프로젝트가 이름으로 끈 규칙은 어느 모드에서든 꺼진 채다.
- **OKF v0.1** — 외부 지식 포맷 호환 프로필. `type`/`aliases`/`tags`와 위키 링크를 검증한다.
- **not_enriched** — 생성 후 아직 실제 내용으로 보강되지 않은 문서 신호(`content.not_enriched`, P0-3에서 추가). lite는 이 규칙의 보고를 끄지만 `review`는 그래도 이런 문서의 승인을 거부한다(1.38.0 전에는 lite에서 거부가 빠졌다). 그때 이미 승인된 문서는 `stats`의 `verifiedNotEnriched`(1.39.0)가 나열한다 — 사실의 목록이지 승인이 틀렸다는 판정이 아니다.
- **템플릿 문서(template doc)** — `docs/llm-wiki/templates/` 하위 문서. **도입처가 복사해 쓰는 뼈대이지 그 저장소를 서술하는 문서가 아니므로** 검토(`review`) 대상도, 최신성 게이트(`evidence.stale`/`impact.source_changed`) 대상도 아니다. 판정의 단일 소스는 `src/commands/wiki-files.js#symbol:isTemplateDoc`이며 `listWikiContentDocs`가 쓰던 경계와 같다. 1.29.1(2026-08-06) 이전에는 이 경계가 명령마다 달라서(N-14) 게이트는 지목하는데 `review`로는 손댈 수 없는 문서가 존재했다 — **해소 경로가 없는 finding**. 승격 대상이 아니라는 사실과 최신성 검사 대상이 아니라는 사실이 이제 같은 술어에서 나온다.
- **거버넌스 모드(governance mode)** — 이 저장소가 도는 운영 레벨. `lite`/`standard`/`strict` 세 값이며 config `governance.mode`(또는 `--mode`)로 정한다. **프로젝트 템플릿이 아니라 하나의 엔진 위의 정책 레벨**이라 세 레벨이 위키 레이아웃·frontmatter 계약·명령 표면·finding 레지스트리를 공유하고, 같은 저장소에서 제자리로 옮긴다. `lite`=개발 속도, `standard`=속도와 지식의 균형, `strict`=완전성·검증·인수인계. `governance` 블록이 없는 프로젝트는 `strict`로 해소된다(모드 이전 동작과 동일). 단일 소스는 `src/governance.js#symbol:getGovernancePolicy`.
- **rule floor** — 거버넌스 모드가 기여하는 rule-id → severity 바닥값. `rules`가 받는 것과 **같은 어휘**이며 `rulesPreset`·명시 `rules` **아래**에 키 단위로 깔린다(mode floor < `rulesPreset` < `rules`). `strict`의 floor는 **비어 있다** — 레지스트리의 기본 severity가 이미 strict 베이스라인이기 때문이고, 그것이 기존 프로젝트의 마이그레이션 보증이다. 어떤 모드도 `sensitive.*`를 건드릴 수 없고 기본이 `blocked`인 규칙도 만지지 않는다.
- **backfill** — `lite`에서 `strict`로 올린 뒤 불완전한 위키를 **현재 저장소를 진리의 원천으로 삼아** 재구성하는 명령. 저장소를 인벤토리하고(추적 소스·테스트·매니페스트·도메인 경계·git 이력) 유효 모드의 계획 문서 집합과 대조하고 인수인계 준비도를 이름 붙은 체크 9종으로 채점한다. `--write`는 빠진 문서를 `needs_review` 스텁으로만 만들고(산문 없음·adapter/스킬 없음) 서술은 출력되는 `backfill` 프롬프트가 에이전트에게 넘긴다. `--strict`는 미완성 준비도를 빌드 실패로 만든다.
- **근거 라벨(verified / inferred / unknown)** — `backfill`이 보고하는 모든 사실에 붙는 confidence 라벨이며 세 값이 섞이지 않는 것이 계약이다. *verified*=현재 소스·테스트·설정에서 읽음, *inferred*=디렉터리 경계·네이밍·git 이력에서 도출했고 **도출이라고 말한다**, *unknown*=저장소가 답할 수 없다. 세 번째가 핵심이다 — ADR도 없고 스스로 설명한 커밋도 없으면 “왜 이걸 골랐나”는 `unknown`으로 남으며, 그것을 그럴듯한 이야기로 채우는 것이 이 기능이 방어하는 실패다. 문서 `status`(`draft`/`needs_review`/`verified`/`deprecated`)와는 **다른 축**이다: `status`는 사람이 문서를 승인했는지를 말하고, 근거 라벨은 개별 주장이 무엇에 근거하는지를 말한다.

## Evidence

- `src/frontmatter-schema.js` — 필수 필드, status/visibility enum, evidence 참조 패턴 정의.
- `src/config.js#symbol:VALID_STATUSES` — 허용 status 값 집합.

## Review Notes

Older review notes (6 entries, 2026-07-13 → 2026-08-03) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-08-04에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `src/commands.js`를 재확인했다. 이번 변경은 `impact`의 change set에서 `version`만 바뀐 `package.json`을 빼는 판정기(`versionOnlyManifestChanges`)를 더하고 고친 것이며, 이 용어집이 정의하는 어휘(`status`·`verified`·`human_verified`·`source_files`·`evidence`·`rules`/`rulesPreset`)의 계약은 하나도 건드리지 않았다 — `rules`/`rulesPreset`이 severity만 바꾸고 `--strict`와 별개라는 문장도 그대로 참이다. 새 제외 규칙은 설정 키가 아니라 하드코딩이므로 `rules` 항목에 추가할 것도 없다. 본문 **불변**. 재스탬프가 no-op이 되는 N-11 때문에 노트로 남긴다.

- 2026-09-07(1.30.0)에 용어 4종을 신설하고 한 곳의 낡은 목록을 고쳤다: **거버넌스 모드**·**rule floor**·**backfill**·**근거 라벨(verified/inferred/unknown)**을 추가하고, `llm-wiki.config.json` 항목이 직접 나열하는 인식 키 목록에 `governance`를 더했다(그 목록은 이 문서가 손으로 나열하므로 새 키가 생기면 반드시 낡는다 — 2026-07-31에 같은 자리에서 같은 이유로 한 번 고쳤다). `impact.source_changed`가 지목한 인용 소스 `src/commands.js`의 변경은 `backfillCommand` 신설과 모드 배선이며 기존 용어 정의는 하나도 낡지 않았다. **(이어서)** 같은 배치의 도그푸딩으로 `src/commands.js`가 다시 바뀌었다(의사결정 기록 탐색 범위, append-only 로그 제외). 새로 넣은 용어 4종의 정의는 그대로 유효하다 — **근거 라벨** 항목이 이미 “그것을 그럴듯한 이야기로 채우는 것이 이 기능이 방어하는 실패”라고 적고 있고, 이번 수정은 그 방어를 **명령 자신에게** 적용한 것이다. 용어 본문 **불변**.

- 2026-09-08(1.31.0)에 `impact`가 이 문서를 지목해 `llm-wiki.config.json` 항목을 고쳤다. 인식 키 목록은 맞았지만 **값 검증**을 적지 않았고, 1.31.0부터 `type`은 `KNOWN_TYPES`에 `agents`는 `SUPPORTED_AGENTS`에 대조돼 위반이 exit 3이다(`all`은 CLI와 같이 펼쳐진다). 그 전에는 타입만 봐서 `{"type": "frontendd"}`가 조용히 통과한 뒤 알 수 없는 유형으로 동작했다 — 이 항목이 키만 적고 값 계약을 안 적어 둔 동안 그 비대칭이 보이지 않았다. 같은 자리에서 `source_files`(넓은 범위 근거)·`evidence`(정밀 근거) 정의를 재확인했다: 1.31.0이 N-7을 다시 검토해 **이 정의가 계약이라고 확정**했으므로(로케이터를 `source_files`에서 정밀 앵커로 읽는 구현을 했다가 되돌렸다) 두 줄은 **불변**이다.
- 2026-10-26(1.35.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `src/commands.js`를 대조했다. 바뀐 것은 `impactCommand`의 출력 키 추가뿐이고, 이 문서가 정의하는 용어(`needs_review`·`verified`·`source_files`·`evidence`·drift 등)의 의미는 그대로다. 새 출력 키(`impactedDocuments`)는 용어가 아니라 필드이므로 `PUBLIC_API.md`가 소유한다. 본문 **불변**.
- 2026-10-27(1.36.0 준비)에 `impact`가 이 문서를 지목해 `src/frontmatter-schema.js`(선택 필드 `source_digests` 추가)와 `src/commands.js`를 대조했다. config 키 목록에 `checkRun`·`sourceDigests`를 넣고 용어 `source_digests`·`locatorNarrowed`를 더했다. `status`·`verified` 정의는 그대로다.
