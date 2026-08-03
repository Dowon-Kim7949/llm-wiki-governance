---
title: Domain Overview
tags:
  - llm-wiki
  - verified
status: verified
doc_type: domain_overview
project: llm-wiki-governance
last_updated: 2026-08-03
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-08-03
wiki_block_version: v1
source_files:
  - src/commands.js
  - src/cli.js
  - src/mcp/tools.js
  - src/commands/retrieval.js
  - src/commands/guided.js
  - src/commands/import-memory.js
  - src/commands/harness-health.js
evidence:
  - src/commands.js#symbol:validateCommand
  - src/commands.js#symbol:initCommand
  - src/commands.js#symbol:nextCommand
  - src/commands/fix-migrate.js#symbol:fixCommand
  - src/cli.js#symbol:COMMANDS
  - src/mcp/tools.js#symbol:TOOL_DEFS
  - src/commands.js#symbol:impactCommand
  - src/commands.js#symbol:checkRunCommand
  - src/commands.js#symbol:reviewCommand
  - src/commands.js#symbol:monorepoCommand
  - src/commands/retrieval.js#symbol:searchDocsCommand
  - src/commands/guided.js#symbol:onboardCommand
  - src/commands/import-memory.js#symbol:importMemoryCommand
  - src/commands/harness-health.js#symbol:harnessHealthCommand
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/DOMAIN_FEATURES.md
  - docs/llm-wiki/PUBLIC_API.md
visibility: internal
contains_sensitive_info: false
---

# Domain Overview

이 문서는 `llm-wiki-governance`의 "도메인" 지도입니다. 여기서 도메인은 UI가 아니라 **명령어군/서브시스템**을 의미합니다.

## Domains

- **Diagnose (진단)** — `doctor`, `status`: 런타임/패키지 준비 상태, 초기화 여부, 문서 상태 카운트, CI 거버넌스 배선 여부. 근거: `src/commands.js` `doctor`, `statusCommand`, `describeCiGovernance`.
- **Validate (검증)** — `validate`, `validate-frontmatter`, `audit`: 구조/frontmatter/source_files/related/evidence/link/adapter/enrichment 스캔. `validate`는 `audit` 커버리지를 재사용한다.
- **Generate (생성)** — `init --dry-run|--write`, `quickstart`: 누락 문서와 선택 adapter 파일 생성. `--write` 명시 시에만 실제 쓰기.
- **Guide (안내)** — `handoff`, `prompt`, `next`, `explain`: 에이전트 인수인계 프롬프트, 반복 작업 프롬프트, 다음 조치 추천, finding 규칙 설명. 1.24부터 guided 표면 2개가 합류한다: `onboard [--domain <n>] [--goal <t>]`(신입용 도메인 학습 경로를 기존 위키에서 결정적으로 조립 — 읽을 문서·소스/테스트 진입점·불변조건·최신성 경고·이해도 점검), `prepare --task <text> [--compact]`(구현 착수 전 범위 조사 — 관련 문서·후보 소스/테스트·위험을 **후보 어법**으로 제시하며 원인·안전을 단정하지 않는다). 둘 다 완전 읽기 전용이고 CLI는 설명을 창작하지 않는다. 근거: `src/commands/guided.js` `onboardCommand`, `prepareCommand`.
- **Knowledge (지식)** — `graph`, `stats`: 지식 그래프(문서→문서 링크)를 text/JSON/Mermaid/DOT로 출력, 위키 헬스 스냅샷(verified%/enrichment%/evidence coverage + 헬스 스코어). 둘 다 읽기 전용(1.4).
- **Migrate & Repair (이관·자동수정)** — `migrate [--apply]`: 기본은 이관 계획 미리보기, `--apply` 시 `fix` 범위 재사용 + `wiki_block_version` 업그레이드로 문서를 현재 계약으로 올림(`verified` 내용 보존; GATE_REVIEW Gate 8). `fix [--write]`: 승인된 좁은 범위의 안전한 자동수정(누락 Tier A frontmatter 필드, `## Evidence` 보완, 깨진 related/링크 `needs_review` 스텁, `last_updated` 갱신; 기본 미리보기). `drift [--downgrade] [--watch-needs-review]`: `evidence.stale` 드리프트를 리포트하고 `--downgrade` 시 드리프트된 `verified` 문서를 `needs_review`로 강등한다 — `status`·`last_updated`와 함께 `tags`의 상태 태그도 맞춘다(이미 있는 상태 태그만 고치고 없으면 만들지 않으며, `review --approve`와 같은 `syncStatusTag`를 쓴다; 2026-07-31 N-4 수정)(GATE_REVIEW Gate 9). 2026-08-03(결정 28)부터 **`drift`만** 받는 opt-in `--watch-needs-review`가 날짜 앵커 최신성 검사를 `needs_review` 문서까지 넓힌다(기본 off). `impact`에는 **의도적으로 넓히지 않는다** — 그 규칙은 이제 error이므로, 자문용 opt-in이 미검토 문서로 빌드를 실패시키게 두면 안 된다. release note 면제(Change tracking 항목 참조)가 이 opt-in보다 우선한다. `verified` 내용·`docs/llm-wiki/` 밖은 건드리지 않는다. 근거: `src/commands.js` `fixCommand`.
- **Release (릴리스)** — `release-notes`: 마지막 `v*` 태그 이후 conventional commit을 한국어 우선 이중언어 섹션으로 묶어 릴리스 노트 문서를 생성(`--out` 시 쓰기). `--body-only`는 변경 섹션 본문만 출력(frontmatter/H1/스캐폴드 제외, GitHub Release 본문용)하고 본문 민감정보 스캔에 매치 시 차단(exit 2)한다(1.7). 1.7 CI/CD 도입의 컴포지트 validate Action과 태그 트리거 GitHub Release 잡은 새 명령 도메인이 아니라 저장소/CI 표면이다(GATE_REVIEW Gate 12).
- **Change tracking (변경 추적)** — `impact [--since <ref>] [--strict]`: **diff 앵커** 역영향 — 참조 소스가 현재 변경집합에 있는데 문서 자신은 같은 diff에서 안 바뀐 `verified` 문서를 `impact.source_changed`로 flag한다. 날짜 앵커 `evidence.stale`이 놓치는 "코드와 문서가 다른 PR에서 바뀌는" 경우를 잡는 pre-merge 보완이다(1.17, Gate 23). **2026-08-03(결정 21)부터 `impact.source_changed`의 기본 severity는 error이며, 플래그 하나 없이 exit 1이다 — exit code 계약이 바뀌는 breaking change이고, 이 규칙에 한해 `--strict`는 no-op이다.** 이유는 이것이 이 도구가 존재하는 이유(소스는 옮겨졌는데 그 문서는 그대로)를 잡는 유일한 규칙인데도, 빌드를 실패시키려면 프로젝트가 먼저 opt-in해야 했던 **유일한** 탐지 규칙이었기 때문이다. **되돌리는 길**은 `llm-wiki.config.json`의 `rules`에 `"impact.source_changed": "warning"`(또는 `"info"`/`"off"`)을 적거나, 이 규칙을 `info`로 유지하는 `rulesPreset: "relaxed"`를 쓰는 것이다(`strict` 프리셋은 no-op이 되므로 이 규칙을 더 이상 나열하지 않는다). 도입처 영향은 그대로 말한다: 업그레이드한 저장소는 **문서를 건드리지 않은 채 소스를 바꾼 첫 커밋에서 빨간 빌드를 받는다.** 그래서 다음 릴리스는 SemVer **MAJOR**다(이 변경에서 `package.json` 버전은 올리지 않았고 태그도 자르지 않았다). 함께 남기는 반론: 이 규칙의 기준선 오탐률은 **27% 또는 57%**(라인 앵커가 밀린 경우를 참 양성으로 셀지가 아직 미결 정책 판단이라 둘 다 살아 있다)이고 허브 파일 하나가 최대 **14건**으로 팬아웃한다 — 유지보수자는 이 수치를 알고도 기본 on을 택했다. `check-run [--run <path>] [--strict]`: **intent 앵커** — `.llm-wiki/runs/`의 run manifest가 주장한 파이프라인(바뀐 소스마다 참조 문서 touch·log append·validate 통과·feature/fix의 RED→GREEN 테스트 증거)을 검증한다(1.19, Gate 26). 2026-08-03(결정 22, 결함 N-6)부터 `--run` 없이 고르는 매니페스트는 **git이 추적하는 것을 우선**한다 — 매니페스트를 커밋하는 저장소에서 "디스크 최신"은 에이전트가 방금 쓰고 아직 커밋하지 않은 파일이라, 초록인 로컬 실행이 CI(최신 커밋본을 고른다)를 더 이상 예측하지 못했고 그 갈라짐이 조용했다. tracked-only는 **아니다**: 매니페스트를 gitignore하는 저장소(이 저장소와 도입처 4곳 중 1곳)는 추적본이 0이라 디스크 집합으로 폴백하고, 대신 신규 `run.manifest_untracked`(**info**)가 "깨끗한 체크아웃은 선택된 파일을 못 본다"고 말한다 — gitignore는 정당한 정책이라 `--strict`가 벌하면 안 되고, tracked-only 규칙이었다면 이 저장소 자신의 문서화된 절차(`AGENTS.md` 75줄)가 깨졌다. 같은 날 결정 23으로 매니페스트의 **자기 신고를 git과 대조**하는 `run.change_set_undeclared`(warning)가 붙었다: `changedSource`를 비워 신고하면 `run.doc_gap`이 구조적으로 발화할 수 없는데도 아무도 그것을 보지 못했다(제안자와 검증자가 같은 주체라는 gap 4의 절반). 대조 대상은 **추적 중인 수정분만**(`git diff --name-only HEAD`)이고 untracked 집합은 절대 쓰지 않는다 — 첫 구현이 untracked까지 썼다가 `.obsidian/` 에디터 설정과 개인 메모 파일에 즉시 발화했고(이 저장소에서 실측) 배포 전에 고쳤다. git이 "변경 없음"이라고 하면 침묵하고(이미 커밋된 실행과 구분 불가), `docs/llm-wiki/**`·`.llm-wiki/**`는 제외한다(touchedDocs와 실행 자신의 기록). 나머지 절반 — 실행이 커밋된 뒤에는 대조할 대상이 없다 — 은 알려진 gap으로 기록돼 있다. 둘 다 읽기 전용이다. **`--strict` 요구는 이제 비대칭이다**: `check-run`의 `run.*`와 `drift`의 `evidence.stale`은 여전히 warning이라 CI를 실패시키려면 `--strict`가 필요하고 `impact`만 플래그 없이 실패한다 — 의도된 비대칭이며 테스트가 고정한다. `doctor`의 CI 거버넌스 판정도 여기에 맞춰, 플래그 없는 `llm-wiki impact --since ...` 단계를 더 이상 "NO omission gate"로 세지 않고 게이트로 계수한다. **release note 면제**(결정 28): `doc_type: release_notes` 문서(OKF `type` 표기 포함)는 `evidence.stale`과 `impact.source_changed` **양쪽**에서 하드코딩으로 제외된다 — 제품에 있는 유일한 다른 경로 skip(append-only 로그)과 같은 자리다. 대가는 정직하게 적는다: 이 저장소 문서 **52건 중 33건이 지금 들어가 있는 검사에서 빠진다.** 그래도 옳은 거래인 이유는 릴리스 노트가 이미 나간 릴리스의 불변 기록이면서 매 릴리스 바뀌는 `package.json`을 앵커하고, 결정 21 이후로는 무관한 소스가 움직였다는 이유만으로 **빌드를 실패시킬 수 있기** 때문이다(결정 21 커밋에서 나온 impact finding 23건 중 16건이 정확히 그것이었고, 면제 후 이 저장소의 impact 수는 **23 → 9**로 줄었으며 남은 릴리스 노트는 0건이다). 근거: `src/commands.js` `impactCommand`, `checkRunCommand`, `src/git.js` `trackedPaths`·`modifiedTrackedFiles`.
- **Retrieval (조회)** — `list-docs`, `search-docs <query>`, `get-doc <path>`, `get-related <path>`: 거버넌스 리포트가 아니라 문서 **본문**을 반환하는 유일한 명령군이다(1.18, Gate 24). `search-docs`는 **zero-dep 키워드/부분문자열** 검색이며 semantic/벡터가 아니다. 제한/민감 문서는 list/search에서 기본 제외되고(opt-in `--include-sensitive`), 반환 본문·스니펫은 민감 라인을 redact한다. `get-doc`은 토큰 제어(`--section`/`--strict-section`/`--compact`/`--max-chars`)를 opt-in으로 받는다(1.25.0). 근거: `src/commands/retrieval.js` `searchDocsCommand`.
- **Review (검토·승인)** — `review`: `needs_review` 백로그를 위험도 정렬해 문서별 품질·evidence 요약과 함께 나열한다(기본 읽기 전용). 명시적 `--approve <path>` 또는 `--approve-all --yes`로만 `status: verified` + `reviewed_by` + `reviewed_at` + `tags`의 상태 태그 **네 곳만** 스탬프하며 **자동 승격은 절대 없다**(`tags` 동기화는 2026-07-31 N-4 수정에서 `drift --downgrade`와 공유하는 `syncStatusTag`로 추가됐다 — 이미 있는 상태 태그만 고치고 없으면 만들지 않는다) — blocked/error severity finding이 남은 문서와 보강되지 않은 스캐폴드(`review.not_enriched`)는 거부하고, 본문·`source_files`·`evidence`·`last_updated`는 건드리지 않는다(`drift --downgrade`의 역방향). MCP는 LIST만 노출한다(Gate 20, 1.26). 근거: `src/commands.js` `reviewCommand`.
- **Scale (규모)** — `monorepo`: npm/yarn `workspaces`를 감지해 `docs/llm-wiki`가 있는 각 패키지를 validate하고 additive `packages[]`로 집계한다. 읽기 전용이며 단일 레포 출력은 byte-identical하다. pnpm/YAML workspaces는 zero-dep 유지를 위해 미파싱(unsupported 보고)이다(1.10, Gate 15). 허용 옵션은 `--cwd`·`--strict`·`--agent`·`--format`·`--out`이고 `--strict`·`--agent`는 각 패키지 validate로 전파된다. `--type`·`--profile`은 패키지별로 덮어써져 무효이므로 거부한다(2026-07-31, exit code 동작 변경). 근거: `src/commands.js` `monorepoCommand`, `src/cli.js` `COMMAND_OPTION_RULES`.
- **Import (임포트)** — `import-memory [<path>] [--apply]`: 외부 하네스(ECC)의 portable 메모리를 `docs/llm-wiki/imported/`의 **needs_review 초안**으로 변환하는 단방향 임포터. 기본 preview이고 `--apply` 시에만 쓴다. frontmatter는 템플릿 seam으로만 생성해 `verified` 생성이 구조적으로 불가능하며, 민감정보 히트 메모리는 기본 skip하고 기존 파일은 덮어쓰지 않는다. 쓰기 명령이므로 **MCP 미노출**이다. 근거: `src/commands/import-memory.js` `importMemoryCommand`.
- **Harness (하네스 자체)** — `harness-health [--agent <agent>] [--preload-budget <n>] [--skill-token-cap <n>] [--strict]`: 위키 문서가 아니라 **하네스 파일 자신**(에이전트 어댑터·생성된 스킬 산출물·항상 선적재되는 표면)을 보는 유일한 명령이다. 읽기 전용·결정적이며 파일을 쓰지 않는다(Phase 1 R0, 2026-08-03, 결정 27번 권고 (b)). 규칙 4종: `harness.marker_drift`(스탬프된 생성 버전이 이 패키지가 배포하는 버전보다 낮음) · `harness.user_modified`(스킬 산출물이 생성기를 더 이상 따라가지 않음 — 마커가 아예 없거나, 있는데 본문이 그 해시와 다름) · `harness.preload_budget` · `harness.skill_too_long`. 전부 기본 warning이고 `--strict`에서 error이며 config `rules`로 토글된다. **뒤의 두 규칙은 숫자를 주기 전까지 침묵한다**(`--preload-budget`/`--skill-token-cap` 또는 config `harnessHealth`) — 모든 크기 수치가 `estimateTokens`의 chars/4 **프록시**이고 이 저장소는 그로부터 유도한 임계값을 배포하지 않기 때문이다. 어댑터에는 콘텐츠 해시가 없어 "손댔는지"가 판정 불가이므로 `userModified: null`로 보고한다(템플릿 diff 추정은 정당한 커스터마이즈를 전부 발화시킨다). 어댑터 부재는 여기가 아니라 `audit`의 `adapter.missing`이 본다. 쓰기 명령이 아니지만 `monorepo`·`impact`·`check-run`·`drift`와 같은 선례로 **MCP 미노출**이다. 근거: `src/commands/harness-health.js` `harnessHealthCommand`, `src/commands/adapters.js` `adapterMarkerVersion`, `src/commands/skills.js` `inspectSkillArtifact`.
- **Agent-native (에이전트 네이티브)** — `mcp`: stdio 위 Model Context Protocol 서버를 실행해 읽기 전용 명령을 MCP 툴로 노출한다. 현재 **17종**: `validate`·`audit`·`next`·`status`·`doctor`·`stats`·`graph`·`explain`·`handoff`·`prompt`(1.6) + retrieval 4종 `list_docs`·`search_docs`·`get_doc`·`get_related`(1.18) + guided 2종 `onboard`·`prepare`(1.24) + `review`의 LIST만(Gate 20). 툴 이름 집합의 단일 소스는 `src/mcp/tools.js#symbol:TOOL_DEFS`이며, 이 목록은 1.6의 10종에서 확장된 것이다. 무의존성(Node 내장 JSON-RPC), **쓰기 미노출**(`buildToolOptions`가 write/apply/approve 옵션을 아예 만들지 않는다), `inputSchema` 실제 강제(위반은 `-32602`)(1.6, GATE_REVIEW Gate 11). 근거: `src/mcp/tools.js` `TOOL_DEFS`.

## Cross-Cutting Concerns

- **Detection** (`src/detector.js`) — package.json 신호로 project type/profile 추론.
- **Safety** — 기존 wiki/adapter 보존, `log.md` append-only, 민감정보 redaction, UTF-8 강제.
- **Reporting** (`src/report.js`) — 모든 명령이 공통 finding/summary 구조와 text/json/markdown 출력을 공유.

## Evidence

- `src/commands.js#symbol:validateCommand` — Validate 도메인의 진입점(audit 재사용).
- `src/commands.js#symbol:initCommand` — Generate 도메인의 dry-run/write 분기.
- `src/commands.js#symbol:nextCommand` — Guide 도메인의 조치 추천.
- `src/commands/fix-migrate.js#symbol:fixCommand` — Repair 도메인의 범위 한정 자동수정.
- `src/cli.js#symbol:COMMANDS` — 전체 명령 표면(도메인 지도가 이를 반영해야 한다). 이 지도의 완전성은 이 맵과의 대조로만 확인할 수 있다.
- `src/commands/harness-health.js#symbol:harnessHealthCommand` — Harness 도메인의 진입점. 위키 문서가 아니라 하네스 파일 자신을 읽는 유일한 명령.
- `src/mcp/tools.js#symbol:TOOL_DEFS` — Agent-native(MCP) 도메인이 노출하는 읽기 전용 툴의 단일 소스(현재 17종).
- `src/commands.js#symbol:impactCommand` — Change tracking의 diff 앵커 역영향. `impact.source_changed`는 2026-08-03(결정 21)부터 기본 error라 `--strict` 없이 빌드를 실패시킨다(그 규칙에 한해 `--strict`는 no-op).
- `src/commands.js#symbol:checkRunCommand` — Change tracking의 intent 앵커(run manifest 파이프라인 검증). 매니페스트 선택은 git 추적본 우선(결정 22/N-6)이고, 신규 `run.manifest_untracked`(info)·`run.change_set_undeclared`(warning)를 낸다.
- `src/git.js#symbol:trackedPaths`·`modifiedTrackedFiles` — `check-run`이 쓰는 git seam 2종: 디렉터리별 추적 경로 집합(레포가 아니면 빈 집합이 아니라 `null`=미상이라 "추적 안 함"과 혼동되지 않는다)과 HEAD 대비 추적 수정분(untracked 미포함).
- `src/commands/scans.js#symbol:FRESHNESS_EXEMPT_DOC_TYPES` — release note를 `evidence.stale`·`impact.source_changed` 양쪽에서 빼는 하드코딩 면제(결정 28).
- `src/commands.js#symbol:reviewCommand` — Review 도메인의 위험도 정렬 나열과 사람 전용 `verified` 스탬프.
- `src/commands.js#symbol:monorepoCommand` — Scale 도메인의 패키지별 validate 집계.
- `src/commands/retrieval.js#symbol:searchDocsCommand` — Retrieval 도메인의 zero-dep 키워드 검색(semantic 아님).
- `src/commands/guided.js#symbol:onboardCommand` — Guide 도메인에 합류한 guided 학습 경로 조립.
- `src/commands/import-memory.js#symbol:importMemoryCommand` — Import 도메인의 단방향 임포터(preview 기본, verified 생성 구조적 불가).

## Review Notes

Older review notes (7 entries, 2026-07-14 → 2026-07-31) are archived in [REVIEW_HISTORY.md](../REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](../log.md).

- 2026-08-03에 **`impact` 게이트가 이 문서를 옳게 지목했고, 그것을 노이즈로 분류한 내 판정이 틀렸다.** N-10 배치(배포 텍스트의 거짓 쓰기 범위 수정)에서 이 문서의 `review --approve` 서술은 이미 정확했지만(직전 세션에 교정) **`drift [--downgrade]` 서술은 같은 `tags` 동기화를 빠뜨린 채였다** — N-4가 두 명령을 같은 `syncStatusTag`로 묶었으므로 계약도 양쪽에 있어야 한다. `drift` 항목에 상태 태그 동기화와 그 보수적 조건(이미 있는 태그만 고침)을 추가했다. **이 문서가 이 배치의 11건 팬아웃 중 참 양성 5번째이며, 참/노이즈 판정이 4/7에서 5/6으로 바뀌었다**(로드맵 N-10 절에 정정 기록). 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입. 별건: 이 문서의 Review Notes는 이 항목으로 8건이 되어 5건 상한을 넘고 아카이브 섹션이 없다(`PUBLIC_API.md` 38건·로드맵 9건과 같은 미집행 상태).
- 2026-08-03에 Review Notes 5건 상한 집행 배치에서 오래된 4건(2026-07-14 → 2026-07-16)을 `REVIEW_HISTORY.md`의 신규 `Domain Overview` 절로 원문 그대로 옮겼다(8건 → 4건 + 이 노트 = 5건). **직전 노트가 위반 문서를 열거했는데 그 목록이 불완전했다** — 자신을 8건, `PUBLIC_API.md`를 38건, 로드맵을 9건으로 적었지만 `BENCHMARK.md`·`EXAMPLES.md`도 8건이었고 로드맵은 이미 10건이었다. 이것은 이 저장소가 기준선 오탐률 라벨링에서 **가장 강한 참 양성**으로 분류한 형태와 정확히 같다(문서가 명시적으로 열거한 목록이 불완전해짐). 열거의 위험을 지적한 문서가 같은 날 스스로 그 함정에 빠진 셈이고, 그래서 이번에는 계수를 `tests/review-notes-cap.test.js`에 넘겼다. 도메인 지도·명령 귀속·Evidence는 불변이다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-08-03에 **`impact` 게이트가 다시 옳았고, 이번에는 재스탬프로 넘길 뻔한 것을 잡았다.** `harness-health`(Phase 1 R0)를 추가한 커밋이 이 문서를 `impact.source_changed`로 지목했는데, 정책상 드리프트는 소스 대조 없이 `reviewed_at` 재스탬프로 해소해도 되는 상태다. 그런데 이 문서는 본문 Evidence에 **"도메인 지도가 `src/cli.js#symbol:COMMANDS`를 반영해야 한다"** 고 스스로 적어 두었고, 2026-07-31에 명령 11개(표면의 38%)를 놓친 전력이 있다 — 즉 여기서 재스탬프는 그 이력을 그대로 반복하는 선택이었다. 신규 도메인 **Harness (하네스 자체)** 를 추가했다: 위키 문서가 아니라 어댑터·스킬 산출물·선적재 표면을 보는 유일한 명령군이며, 규칙 4종·예산 2종의 opt-in 성격·어댑터 `userModified: null` 결정·MCP 미노출 선례를 함께 적었다. MCP 노출은 17종 그대로다(이 명령은 노출하지 않는다). **교훈: 자동 해소가 허용되는 드리프트와 실제로 갱신해야 하는 드리프트를 가르는 것은 게이트가 아니라 문서가 스스로 선언한 완전성 계약이다.**
- 2026-08-03에 도메인 지도의 **거짓이 된 문장 하나**를 고쳤다. Change tracking 항목이 `impact`와 `check-run`을 묶어 "둘 다 기본 warning이며 `--strict`로 CI를 실패시킨다"고 적고 있었는데, 결정 21 이후 앞의 절반만 참이다. 두 명령을 갈라 적었다. 함께: `check-run`의 추적분 우선 선택과 신규 교차검증, Migrate & Repair의 `--watch-needs-review` 옵트인, `release_notes` 면제. **이 문서가 같은 배치에서 두 번째로 옳았다** — 지도가 자기 완전성 계약을 스스로 선언해 둔 덕분에 재스탬프로 넘길 뻔한 갱신을 잡았고, 이번에는 게이트가 아니라 문장 자체가 낡았다.
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`(기본 error)가 이 문서를 지목해 인용 소스를 재확인했다: `src/cli.js`. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서가 `src/cli.js`에서 취하는 것은 **명령 디스패치 목록**인데 이번 diff는 `drift` 한 명령의 도움말 문자열만 건드렸고 명령 집합·분류·개수(30)는 그대로다 — 명령어군 지도 **불변**. 본문 변경 없음.
