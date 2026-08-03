---
title: Domain Overview
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: domain_overview
project: llm-wiki-governance
last_updated: 2026-08-03
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Dowon-Kim
reviewed_at: 2026-08-03
wiki_block_version: v1
source_files:
  - src/commands.js
  - src/cli.js
  - src/mcp/tools.js
  - src/commands/retrieval.js
  - src/commands/guided.js
  - src/commands/import-memory.js
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
- **Migrate & Repair (이관·자동수정)** — `migrate [--apply]`: 기본은 이관 계획 미리보기, `--apply` 시 `fix` 범위 재사용 + `wiki_block_version` 업그레이드로 문서를 현재 계약으로 올림(`verified` 내용 보존; GATE_REVIEW Gate 8). `fix [--write]`: 승인된 좁은 범위의 안전한 자동수정(누락 Tier A frontmatter 필드, `## Evidence` 보완, 깨진 related/링크 `needs_review` 스텁, `last_updated` 갱신; 기본 미리보기). `drift [--downgrade]`: `evidence.stale` 드리프트를 리포트하고 `--downgrade` 시 드리프트된 `verified` 문서를 `needs_review`로 강등한다 — `status`·`last_updated`와 함께 `tags`의 상태 태그도 맞춘다(이미 있는 상태 태그만 고치고 없으면 만들지 않으며, `review --approve`와 같은 `syncStatusTag`를 쓴다; 2026-07-31 N-4 수정)(GATE_REVIEW Gate 9). `verified` 내용·`docs/llm-wiki/` 밖은 건드리지 않는다. 근거: `src/commands.js` `fixCommand`.
- **Release (릴리스)** — `release-notes`: 마지막 `v*` 태그 이후 conventional commit을 한국어 우선 이중언어 섹션으로 묶어 릴리스 노트 문서를 생성(`--out` 시 쓰기). `--body-only`는 변경 섹션 본문만 출력(frontmatter/H1/스캐폴드 제외, GitHub Release 본문용)하고 본문 민감정보 스캔에 매치 시 차단(exit 2)한다(1.7). 1.7 CI/CD 도입의 컴포지트 validate Action과 태그 트리거 GitHub Release 잡은 새 명령 도메인이 아니라 저장소/CI 표면이다(GATE_REVIEW Gate 12).
- **Change tracking (변경 추적)** — `impact [--since <ref>] [--strict]`: **diff 앵커** 역영향 — 참조 소스가 현재 변경집합에 있는데 문서 자신은 같은 diff에서 안 바뀐 `verified` 문서를 `impact.source_changed`로 flag한다. 날짜 앵커 `evidence.stale`이 놓치는 "코드와 문서가 다른 PR에서 바뀌는" 경우를 잡는 pre-merge 보완이다(1.17, Gate 23). `check-run [--run <path>] [--strict]`: **intent 앵커** — `.llm-wiki/runs/`의 run manifest가 주장한 파이프라인(바뀐 소스마다 참조 문서 touch·log append·validate 통과·feature/fix의 RED→GREEN 테스트 증거)을 검증한다(1.19, Gate 26). 둘 다 읽기 전용이고 기본 warning이며 `--strict`로 CI를 실패시킨다. 근거: `src/commands.js` `impactCommand`, `checkRunCommand`.
- **Retrieval (조회)** — `list-docs`, `search-docs <query>`, `get-doc <path>`, `get-related <path>`: 거버넌스 리포트가 아니라 문서 **본문**을 반환하는 유일한 명령군이다(1.18, Gate 24). `search-docs`는 **zero-dep 키워드/부분문자열** 검색이며 semantic/벡터가 아니다. 제한/민감 문서는 list/search에서 기본 제외되고(opt-in `--include-sensitive`), 반환 본문·스니펫은 민감 라인을 redact한다. `get-doc`은 토큰 제어(`--section`/`--strict-section`/`--compact`/`--max-chars`)를 opt-in으로 받는다(1.25.0). 근거: `src/commands/retrieval.js` `searchDocsCommand`.
- **Review (검토·승인)** — `review`: `needs_review` 백로그를 위험도 정렬해 문서별 품질·evidence 요약과 함께 나열한다(기본 읽기 전용). 명시적 `--approve <path>` 또는 `--approve-all --yes`로만 `status: verified` + `reviewed_by` + `reviewed_at` + `tags`의 상태 태그 **네 곳만** 스탬프하며 **자동 승격은 절대 없다**(`tags` 동기화는 2026-07-31 N-4 수정에서 `drift --downgrade`와 공유하는 `syncStatusTag`로 추가됐다 — 이미 있는 상태 태그만 고치고 없으면 만들지 않는다) — blocked/error severity finding이 남은 문서와 보강되지 않은 스캐폴드(`review.not_enriched`)는 거부하고, 본문·`source_files`·`evidence`·`last_updated`는 건드리지 않는다(`drift --downgrade`의 역방향). MCP는 LIST만 노출한다(Gate 20, 1.26). 근거: `src/commands.js` `reviewCommand`.
- **Scale (규모)** — `monorepo`: npm/yarn `workspaces`를 감지해 `docs/llm-wiki`가 있는 각 패키지를 validate하고 additive `packages[]`로 집계한다. 읽기 전용이며 단일 레포 출력은 byte-identical하다. pnpm/YAML workspaces는 zero-dep 유지를 위해 미파싱(unsupported 보고)이다(1.10, Gate 15). 허용 옵션은 `--cwd`·`--strict`·`--agent`·`--format`·`--out`이고 `--strict`·`--agent`는 각 패키지 validate로 전파된다. `--type`·`--profile`은 패키지별로 덮어써져 무효이므로 거부한다(2026-07-31, exit code 동작 변경). 근거: `src/commands.js` `monorepoCommand`, `src/cli.js` `COMMAND_OPTION_RULES`.
- **Import (임포트)** — `import-memory [<path>] [--apply]`: 외부 하네스(ECC)의 portable 메모리를 `docs/llm-wiki/imported/`의 **needs_review 초안**으로 변환하는 단방향 임포터. 기본 preview이고 `--apply` 시에만 쓴다. frontmatter는 템플릿 seam으로만 생성해 `verified` 생성이 구조적으로 불가능하며, 민감정보 히트 메모리는 기본 skip하고 기존 파일은 덮어쓰지 않는다. 쓰기 명령이므로 **MCP 미노출**이다. 근거: `src/commands/import-memory.js` `importMemoryCommand`.
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
- `src/mcp/tools.js#symbol:TOOL_DEFS` — Agent-native(MCP) 도메인이 노출하는 읽기 전용 툴의 단일 소스(현재 17종).
- `src/commands.js#symbol:impactCommand` — Change tracking의 diff 앵커 역영향.
- `src/commands.js#symbol:checkRunCommand` — Change tracking의 intent 앵커(run manifest 파이프라인 검증).
- `src/commands.js#symbol:reviewCommand` — Review 도메인의 위험도 정렬 나열과 사람 전용 `verified` 스탬프.
- `src/commands.js#symbol:monorepoCommand` — Scale 도메인의 패키지별 validate 집계.
- `src/commands/retrieval.js#symbol:searchDocsCommand` — Retrieval 도메인의 zero-dep 키워드 검색(semantic 아님).
- `src/commands/guided.js#symbol:onboardCommand` — Guide 도메인에 합류한 guided 학습 경로 조립.
- `src/commands/import-memory.js#symbol:importMemoryCommand` — Import 도메인의 단방향 임포터(preview 기본, verified 생성 구조적 불가).

## Review Notes

- 2026-07-14에 1.3.0 명령어군과 공통 관심사를 기준으로 재검토했다.
- 2026-07-14에 도메인 지도를 현행화했다: 누락됐던 Knowledge(`graph`/`stats`, 1.4)·Release(`release-notes`)·Agent-native(`mcp`, 1.6)를 추가하고, stale했던 "migrate --apply 안정판 차단" 서술을 Gate 8(해금, preview-first) 기준으로 정정했으며, `drift`(Gate 9)를 반영했다. 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-15에 1.7 CI/CD 도입을 반영했다: Release 도메인에 `release-notes --body-only`(GitHub Release 본문용, 민감정보 스캔·차단)를 추가하고, 컴포지트 validate Action·태그 트리거 Release 잡은 저장소/CI 표면임을 명시했다(Gate 12). 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-16에 1.11.1 commands.js 모듈 분리(동작 보존 내부 리팩터)를 반영했다: 도메인 지도는 불변이며, Evidence의 `fixCommand` 포인터를 `src/commands/fix-migrate.js`로 갱신했다. 코드에 맞춰 문서를 수정한 뒤 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-16)를 거쳐 `verified`로 재승인했다.
- 2026-07-20에 1.14.1 노출-테스트 fix 배치에 따라 재검토했다: 도메인 지도는 불변이며(`src/commands.js`·`src/commands/fix-migrate.js`의 handoff 진입점·`needsWriteFlag` 변경은 명령 도메인 구조에 영향 없음), 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-20)로 재승인하고 review baseline을 갱신해 `evidence.stale`을 해소했다.
- 2026-07-31에 **도메인 지도의 구조적 누락을 교정했다**(문서 검토 중 발견, 코드 변경 없음). 이 지도는 1.7 시점의 8개 도메인에 멈춰 있어서, `src/cli.js#symbol:COMMANDS`와 대조했을 때 **명령 11개가 어느 도메인에도 없었다**: `impact`(1.17)·`check-run`(1.19)·retrieval 4종(1.18)·guided 2종(1.24)·`review`(1.26)·`monorepo`(1.10)·`import-memory`. 명령 표면의 38%가 빠진 지도였고, `onboard`가 신입에게 읽히는 문서라 영향이 컸다. Change tracking·Retrieval·Review·Scale·Import 5개 도메인을 추가하고 `onboard`/`prepare`를 Guide에 합류시켰으며, 각 도메인에 구현 심볼 근거를 붙였다(frontmatter `evidence` 7개·본문 Evidence 7개 추가, 전부 소스에서 심볼 존재 확인). 또한 Agent-native 항목이 MCP 노출 툴을 **10종으로 나열**하던 것을 실제 **17종**으로 정정했다 — `MCP_TOOLS.length`를 직접 실행해 확인했고, 1.6 시점 목록이 1.18/1.24/1.26을 거치며 갱신되지 않은 것이었다. **같은 날 이어서** Scale 도메인에 `monorepo`의 허용 옵션 계약을 적었다(유지보수자 승인으로 CLI 계약을 나머지 28개 명령과 균일화 — 미지원 옵션 exit 3, help 토픽 신설; exit code 동작 변경). 에이전트(Claude Code) 편집이라 `needs_review`를 유지한다 — 사람 검토 후 재승인 예정.
- 2026-07-31(백로그 16 오탐률 측정 중 발견)에 **이 문서가 사실과 다른 문장을 담고 있었음을 교정했다.** `review --approve`가 "**3필드만**" 스탬프한다고 단정했으나, 같은 날 N-4 수정이 `syncStatusTag`를 추가해 실제로는 네 곳을 쓴다(`src/commands.js:1393-1397` — `status`·`reviewed_by`·`reviewed_at`·`tags`의 상태 태그). 그 수정은 `PUBLIC_API.md`만 갱신하고 이 문서를 놓쳤다. 같은 문장의 스캐폴드 거부(`review.not_enriched`)도 함께 보강했다. **도구가 이 드리프트를 보지 못한 경위를 남긴다**: 머지 후에는 워킹트리 diff가 비어 `impact`가 볼 대상이 없고, `reviewed_at`(2026-07-31)이 소스 변경일과 같아 `evidence.stale`의 날짜 앵커가 "검토가 덮었다"고 판정한다. PR 기준으로 되돌려 `impact --since <PR base> --strict`를 다시 돌리면 이 문서가 `impact.source_changed`로 정확히 잡힌다 — 즉 규칙은 옳고 관측 시점이 지나갔을 뿐이다. 발견은 어떤 배포 명령도 아니라 백로그 16 프로토타입(섹션 단위 텍스트 대조)이 했다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등했고 검토 메타는 날조하지 않았다.
- 2026-08-03에 **`impact` 게이트가 이 문서를 옳게 지목했고, 그것을 노이즈로 분류한 내 판정이 틀렸다.** N-10 배치(배포 텍스트의 거짓 쓰기 범위 수정)에서 이 문서의 `review --approve` 서술은 이미 정확했지만(직전 세션에 교정) **`drift [--downgrade]` 서술은 같은 `tags` 동기화를 빠뜨린 채였다** — N-4가 두 명령을 같은 `syncStatusTag`로 묶었으므로 계약도 양쪽에 있어야 한다. `drift` 항목에 상태 태그 동기화와 그 보수적 조건(이미 있는 태그만 고침)을 추가했다. **이 문서가 이 배치의 11건 팬아웃 중 참 양성 5번째이며, 참/노이즈 판정이 4/7에서 5/6으로 바뀌었다**(로드맵 N-10 절에 정정 기록). 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입. 별건: 이 문서의 Review Notes는 이 항목으로 8건이 되어 5건 상한을 넘고 아카이브 섹션이 없다(`PUBLIC_API.md` 38건·로드맵 9건과 같은 미집행 상태).
