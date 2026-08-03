---
title: Public Api
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: public_api
project: llm-wiki-governance
last_updated: 2026-08-03
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Dowon-Kim
reviewed_at: 2026-07-31
wiki_block_version: v1
source_files:
  - src/cli.js
  - src/commands.js
  - src/commands/retrieval.js
  - src/release-notes.js
  - src/config-file.js
  - src/index.js
  - src/git.js
  - src/report.js
  - src/mcp/tools.js
  - src/mcp/dispatch.js
  - src/mcp/validate-args.js
  - src/frontmatter.js
  - src/commands/import-memory.js
  - package.json
evidence:
  - src/cli.js#symbol:COMMANDS
  - src/cli.js#symbol:parseArgs
  - src/cli.js#symbol:main
  - src/commands.js#symbol:migrateCommand
  - src/commands.js#symbol:impactCommand
  - src/commands.js#symbol:checkRunCommand
  - src/commands/fix-migrate.js#symbol:fixCommand
  - src/config-file.js#symbol:mergeConfigIntoOptions
  - src/index.js#symbol:commands
  - src/index.js#symbol:normalizeOptions
  - src/index.js#symbol:resolveOptions
  - src/cli.js#symbol:applyProjectConfig
  - src/commands.js#symbol:scaffoldProjectConfig
  - src/commands/findings.js#symbol:applyRuleConfig
  - src/commands/scans.js#symbol:scanThinBody
  - src/commands.js#symbol:findMissingDocs
  - src/commands.js#symbol:renderOverriddenDoc
  - src/commands.js#symbol:monorepoCommand
  - src/detector.js#symbol:detectWorkspaces
  - src/report.js#symbol:dashboardDocHref
  - src/mcp/tools.js#symbol:TOOL_DEFS
  - src/mcp/dispatch.js#symbol:handleMessage
  - src/mcp/validate-args.js#symbol:validateToolArguments
  - src/detector.js#symbol:KNOWN_TYPES
  - src/frontmatter.js#symbol:parseFrontmatter
  - src/git.js#symbol:changedFiles
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/domains/00_overview.md
  - docs/llm-wiki/EXAMPLES.md
visibility: internal
contains_sensitive_info: false
---

# Public Api

이 패키지의 공개 계약은 `llm-wiki` CLI 명령어 표면입니다(`package.json`의 `bin.llm-wiki` → `bin/llm-wiki.js`). 명령 매핑은 `src/cli.js`의 `COMMANDS`에 정의됩니다.

## Commands

| 명령 | 목적 | 쓰기 |
| --- | --- | --- |
| `doctor` | 런타임/패키지 준비 상태, 초기화 여부, 안전 정책 신호, CI 거버넌스 배선 여부(`ci_governance`) 점검 | 없음 |
| `status` | 초기화 여부·문서 상태 카운트·구조/링크/adapter 상태 | 없음 |
| `next` | audit 결과 기반 다음 조치 추천(advisory) | 없음 |
| `explain <finding> [--cwd <path>]` | finding 규칙 의미와 안전한 조치법 설명. `--cwd`는 2026-07-31(Phase 0)에 허용 목록에 추가됐다 — `main()`이 모든 명령에 `applyProjectConfig`를 적용하므로 `--cwd`가 어느 `llm-wiki.config.json`의 `lang` 키를 읽을지 정하고, 그것이 설명 산문 언어를 바꾼다. 그 전에는 문서가 일반 옵션으로 제시한 호출이 exit 3이었다 | 없음 |
| `validate` | audit 커버리지 재사용 구조/안전 검증(CI용) | 없음 |
| `validate-frontmatter` | 필수 frontmatter 필드/값만 검증. 2026-07-27 감사부터 중복 frontmatter 키를 `frontmatter.duplicate_key`(warning, config `rules`로 토글 가능)로 보고한다 — 파서는 last-wins 유지, finding에는 키 이름만(값 미노출). `audit`/`validate`/`status`도 같은 finding을 상속(미릴리스, main 한정). 2026-07-31(측정 배치)부터 `result`가 다른 명령과 같은 4단계 사다리(`blocked`/`fail`/`warning`/`pass`)를 쓰고 JSON 페이로드에도 additive로 `result` 필드가 실린다 — 그 전에는 이 명령만 2단계(`fail`/`pass`)라, warning만 있는 실행이 본문에 `result: pass`를 찍으면서 `--strict` exit는 1이었다(도입 저장소 실측). 보고는 무엇이 발견됐는지를 말하고, warning이 빌드를 막을지는 `--strict`가 정한다 | 없음 |
| `monorepo` | npm/yarn workspaces 감지 후 패키지별 validate를 집계(additive `packages[]`; 단일 레포 출력 불변)(1.10). **허용 옵션(2026-07-31 확정)**: `--cwd`·`--strict`·`--agent`·`--format`·`--out`. `--strict`와 `--agent`는 각 패키지의 `validateCommand`로 전파되므로 실제로 적용된다(`--strict`는 패키지별 evidence severity를 warning→error로 승격). `--type`/`--profile`은 **거부된다**(usage error, exit 3) — `monorepoCommand`가 패키지별로 `type: null`·`profiles: []`로 덮어쓰므로 받아도 아무 효과가 없기 때문이다. 그 외 미지원 옵션도 다른 28개 명령과 동일하게 exit 3이다. 한계: workspaces가 없는 저장소에서는 `workspaces_detected: 0`으로 `result: pass`를 반환한다 — 한 저장소의 패키지를 집계하는 명령이고, 별개 저장소들의 거버넌스 상태를 한 장으로 보는 수단은 아니다 | 없음 |
| `audit` | detection/structure/frontmatter/related/evidence/link/adapter/enrichment findings | 없음 |
| `quickstart --dry-run\|--write` | doctor+init+frontmatter+handoff 프롬프트 | `--write` 시 |
| `handoff` | Codex/Claude Code 인수인계 프롬프트 출력 | `--out` 시 |
| `prompt --task <name>` | 반복 작업 프롬프트. 지원 값 **8종**: `bootstrap`/`onboard`/`prepare`/`feature`/`fix`/`refactor`/`docs-sync`/`okf-extract` — 단일 소스는 `src/task-prompts.js#symbol:SUPPORTED_TASK_PROMPTS`이고 MCP `prompt` 툴의 enum도 여기서 파생된다(미지원 값은 blocked, exit 2). `bootstrap`은 init 뼈대의 최초 보강용이며 `handoff`와 규칙을 공유한다. 반복 write 워크플로(`feature`/`fix`/`refactor`/`docs-sync`)는 1.27.2부터 Goal/Hard lines/Exit criteria 3블록, 절차형 원샷(`bootstrap`/`onboard`/`prepare`/`okf-extract`)은 체크리스트를 유지한다 | `--out` 시 |
| `init --dry-run\|--write` | 누락 wiki 문서·선택 adapter 생성. backend/fullstack(디렉터리/파일 도메인)·frontend/mobile(SPA `pages`/`views`/... 폴더 + vue/react-router 라우트 그룹)은 도메인별 문서(`domains/NN_<name>.md`)도 생성 — 도메인 미탐지 시 침묵하지 않고 명시 안내, `--domains a,b,c`로 수동 지정 가능. 1.15부터 `--skills`(또는 `--agent claude\|codex\|cursor`)로 위키-그라운디드 자동화 프롬프트 아티팩트(Claude 스킬 `.claude/skills/`·Codex 스킬 `.agents/skills/`·Cursor 룰·중립 프롬프트, bootstrap/feature/fix/docs-sync; opt-in·미덮어씀; 1.25.0부터 bootstrap만 도메인 맵 스냅샷·나머지는 실행 시점 맵, `--refresh`로 사용자 미수정 관리 스킬만 갱신) 생성. 어댑터 선택은 `--with-adapters`(에이전트 미지정 시 전체) / `--no-adapters`(어댑터 없음 — **선언적**이라 플래그 순서와 무관하고, 명시적 opt-out이므로 config `agents`가 목록을 되채우지 않는다) | `--write` 시 |
| `migrate [--apply]` | `wiki_block_version` 업그레이드 리포트 + 계획. `--apply`로 `fix` 범위 재사용해 문서를 현재 계약으로 올림(preview-first, `verified` 보존; GATE_REVIEW Gate 8) | `--apply` 시 |
| `fix [--write]` | 승인된 범위의 안전한 자동수정(누락 Tier A frontmatter 필드, `## Evidence` 섹션 보완, 깨진 related/링크 `needs_review` 스텁, 수정 문서 `last_updated` 갱신). 기본은 미리보기 | `--write` 시 |
| `drift [--downgrade] [--strict]` | `verified` 문서의 `evidence.stale` 드리프트 리포트. `--downgrade`로 드리프트 문서를 `needs_review`로 강등(GATE_REVIEW Gate 9). 2026-07-31(Phase 0)부터 드리프트 finding이 별도 `driftFindings` 배열뿐 아니라 **`findings`에도** 들어가고 `result`가 `pass`가 아니라 `warning`이 되며 `--strict`를 받는다 — 그 전에는 방금 드리프트를 증명한 위키에 대해 `result: pass`·exit 0을 보고했고 `--strict`를 거부해 어떤 파이프라인도 드리프트로 실패할 수 없었다. `--strict` 없이는 exit code가 여전히 0이라 기존 파이프라인에 추가해도 깨지지 않는다. 2026-07-31(측정 배치)부터 `--downgrade`가 `status`와 함께 **`tags`의 상태 태그도** `verified`→`needs-review`로 맞춘다(이미 있는 상태 태그만 고치고 없으면 만들지 않는다) | `--downgrade` 시 |
| `import-memory [<path>] [--apply]` | (1.27.1, ECC Technique Extraction) ECC 하네스의 portable `ecc.memory.v1` Markdown 메모리(기본 vault `.ecc/memory`; 파일/디렉터리 지정 가능)를 `docs/llm-wiki/imported/<memory-id>.md`의 **needs_review 위키 초안**으로 변환하는 단방향 임포터. frontmatter는 템플릿 seam으로만 생성해 verified 생성 구조적 불가(`doc_type: imported_memory`), 민감정보 히트 메모리는 기본 skip(값 미노출, 강제 플래그 없음), 기존 파일 미덮어씀, inactive(rejected/superseded) skip, `source_files`/`evidence`는 빈 채로 두어 grounding은 사람 리뷰 단계 몫(출처는 본문 `## Import Provenance`). 신규 `import.*` finding 4종. **MCP 미노출**(쓰기 명령) | `--apply` 시 |
| `impact [--since <ref>] [--strict]` | (읽기전용, 1.17) diff 기준 reverse-impact: 참조 소스가 현재 diff(working tree, 또는 `--since <ref>` PR/CI 기준)에서 바뀌었는데 문서 자신은 안 바뀐 `verified` 문서를 flag. date 기준 `evidence.stale`(drift)의 pre-merge 보완. 기본 warning, `--strict`로 CI 실패(GATE_REVIEW Gate 23). 2026-07-31(Phase 0)부터 `--since <ref>` 경로도 **미추적 파일**(`ls-files --others --exclude-standard`)을 포함한다 — 그 전에는 PR 작업트리에서 새로 만들어졌지만 아직 커밋되지 않은 소스 파일을 못 봐서, 누락을 exit code로 막는 유일한 명령이 정작 그 상황에서 눈이 멀었다. gitignore된 빌드 산출물은 계속 제외된다 | 없음 |
| `check-run [--run <path>] [--strict]` | (읽기전용, 1.19) `.llm-wiki/runs/`의 최신(또는 `--run <path>`) run manifest를 읽어 — "최신"은 2026-07-31(Phase 0)부터 매니페스트의 `timestamp` 필드 기준이고(없으면 mtime, 그래도 동률이면 파일명) 그 전에는 **파일명 사전순 마지막**이었다. 파일명이 `run-<task>-<타임스탬프>`라 task 이름이 타임스탬프를 지배했고(`fix` > `feature` > `docs-sync`), 실측으로 이 저장소에서 최신은 2026-07-30 feature 실행인데 2026-07-27 fix 실행을 검사했다 — 완료 게이트가 엉뚱한 실행을 검증하고도 pass를 보고하는 최악의 실패 형태였다. `timestamp`를 쓰는 이유는 fresh clone에서도 살아남고(mtime과 달리) 실제 매니페스트 파일명 규칙이 균일하지 않기 때문이다 — 스킬(`/llm-wiki-<task>`) 실행이 주장한 파이프라인을 검증한다: 바뀐 소스마다 그걸 참조하는 위키 문서가 touch됐는지(`run.doc_gap`), 로그 append 여부(`run.log_missing`), validate 통과 여부(`run.unvalidated`). `impact`(diff-앵커)의 intent-앵커 보완. 기본 warning, `--strict`로 CI 실패. 쓰기 없음(매니페스트는 에이전트가 작성)(GATE_REVIEW Gate 26). 2026-07-28(미릴리스)부터 optional `testEvidence {red, green}` 필드도 검증 — feature/fix 실행이 소스를 바꿨는데 RED→GREEN 테스트 증거가 없으면 `run.test_evidence_missing`(warning, toggleable; 구 manifest·docs-sync/bootstrap 면제) | 없음 |
| `review [--approve <path>]... [--approve-all --yes] [--reviewer <name>] [--include-sensitive]` | (읽기전용 기본, Gate 20) needs_review 문서를 위험도 정렬(never-enriched/thin/no-evidence/broken-link 우선)해 문서별 품질·evidence 요약과 함께 나열(사람 spot-check용). `--approve <path>`(반복·쉼표구분 가능) 또는 `--approve-all --yes`로 지정 문서에 **`status: verified` + `reviewed_by` + `reviewed_at` + `tags`의 상태 태그만** 스탬프(2026-07-31 측정 배치에서 `tags` 동기화 추가 — 그 전에는 `status`만 바뀌어 문서가 `status: verified`인 채 `needs-review` 태그를 달고 있었고, 도입 저장소 한 곳에서 22개 중 12개가 이 상태였다. 이미 있는 상태 태그만 고치고 없으면 만들지 않는다) — 자동 승격 절대 없음, blocking/구조적 finding(blocked/error) 문서는 거부, body/source_files/evidence/last_updated 미변경. 2026-07-31(Phase 0)부터 **보강되지 않은 스캐폴드도 거부**한다 — `content.not_enriched`가 있는 문서는 severity와 무관하게 승격 불가이며(`NEVER_APPROVE_RULES`) `review.not_enriched`(error) finding으로 이유를 밝힌다. 그 전에는 그 규칙이 warning이라 안전선이 **`--strict` 사용 여부에 의존**했고, 생성 직후 손대지 않은 스캐폴드가 `verified`가 될 수 있었다. severity는 보고의 문제이고 "검토할 내용이 아직 없다"는 문서의 사실이라 규칙 id로 판정한다. 이 게이트는 `--approve-all` 대상 선정(`approvable`)에도 함께 걸린다. reviewed_by는 `--reviewer` > config `reviewer` > git `user.name` 순 해소, 없으면 스탬프 거부(공란/날조 금지). `--approve-all`은 `--yes` 없으면 거부하고 승격 예정 수만 보고. MCP는 LIST만 노출 | `--approve`/`--approve-all --yes` 시 |
| `graph` | 지식 그래프(문서 + 해소된 문서→문서 링크)를 출력. `--format text\|json\|mermaid\|dot`(graph 전용 토큰) | 없음 |
| `stats` | wiki 헬스 스냅샷(verified%/enrichment%/evidence coverage/staleness/orphan) + 헬스 스코어. 1.19부터 `--format json`에 계산된 `evidenceTiers`(`reference_checked`/`human_verified`)를 additive로 부가(신규 frontmatter 필드/status값 없음) | 없음 |
| `list-docs` | (읽기전용 retrieval, 1.18) 문서 메타데이터(path/title/status/doc_type/visibility/last_updated/tags) 열거. `--status`/`--visibility`/`--doc-type` 필터. 본문 미반환. restricted/민감 문서는 `--include-sensitive` 없으면 제외 | 없음 |
| `search-docs <query>` | (읽기전용 retrieval, 1.18) 제목/본문/frontmatter에 대한 **zero-dep 키워드/부분문자열** 검색(semantic 아님). 모든 term이 있어야 매치(AND), 점수순 랭크 + 스니펫. `--limit`(기본 20). restricted/민감 문서 제외(같은 `--include-sensitive`), 스니펫 redact | 없음 |
| `get-doc <path> [--section <terms>] [--strict-section] [--compact] [--max-chars <n>]` | (읽기전용 retrieval, 1.18) 문서 하나의 frontmatter + 본문 반환. `<path>`는 repo-relative/wiki-relative/bare name 허용. 민감 라인 redact. `--section <terms>`는 관련 `##` 섹션(+프리앰블)만 반환하는 집중 읽기(큰 문서용; `##` 섹션이 없거나 매치 없으면 full body로 fallback; 필터 시 additive `document.section` `{query,returned,total}` 부가). **토큰 제어(1.25.0, opt-in)**: `--strict-section`은 매치 없을 때 full body를 반환하지 않고 `document.section.noSectionMatch:true`; `--max-chars <n>`은 반환 본문을 정확히 캡(redaction **후** 클램프); `--compact`는 frontmatter echo 생략. 이 옵션 중 하나라도 쓰면 `document`에 additive `chars`/`estimatedTokens`(chars/4 PROXY)/`truncated`가 붙는다(미사용 시 기본 출력 byte-identical) | 없음 |
| `get-related <path>` | (읽기전용 retrieval, 1.18) 문서의 해소된 그래프 이웃(outbound/inbound: wiki 링크[이중 대괄호]·related·markdown 링크) 반환 | 없음 |
| `onboard [--domain <n>] [--goal <t>]` | (읽기전용 guided, 1.24) 신입용 도메인 학습 경로를 기존 위키에서 결정적으로 조립(읽을 문서·소스/테스트 진입점·불변조건/위험·최신성 경고·이해도 점검·다음 단계). CLI는 설명을 창작하지 않음. 도메인 미탐지 시 침묵 대신 사용 가능 목록·생성법 안내. 제한/민감 문서 제외·텍스트 redact | 없음 |
| `prepare --task <text> [--compact] [--max-chars <n>]` | (읽기전용 guided, 1.24) 구현 전 작업 범위 조사(관련 문서[search-docs 랭킹 재사용]·그래프 이웃·후보 도메인/소스/테스트·API/상태/화면/설정 문서·불변조건·최신성 경고·미확정·범위 점검표). 후보로 표현하며 원인·안전을 단정하지 않음(코드가 최종 사실). /llm-wiki-feature·/llm-wiki-fix로 인계. **토큰 제어(1.25.0, opt-in)**: `--compact`는 전체 리포트 대신 한 번의 호출로 선택 경로(`source_direct`/`wiki_first`/`hybrid`)+이유·≤3 문서(+status 기반 freshness)·최상위 문서의 관련 섹션 1개(전체 본문 미덤프)·후보 소스·다음 조회·`chars`/`estimatedTokens`(chars/4 PROXY)를 반환. `--max-chars <n>`으로 섹션 본문 캡. 기본(전체) 출력 불변 | 없음 |
| `release-notes [--body-only]` | 마지막 `v*` 태그 이후 conventional commit으로 릴리스 노트 문서 생성. `--body-only`는 변경 섹션 본문만 출력(frontmatter/H1/스캐폴드 라인 제외, GitHub Release 본문용)하고 본문 민감정보 스캔에 매치 시 차단(exit 2, 본문 withhold) | `--out` 시 |

## Key Options

- `--cwd <path>` — **모든 명령이 받는 것은 아니다**(2026-07-31 확인): `explain`은 `format`/`out`만 허용하므로 `explain <rule> --cwd .`는 usage error(exit 3)이고, `mcp`는 `--cwd`만 받는다. 명령별 허용 옵션의 단일 소스는 `src/cli.js#symbol:COMMAND_OPTION_RULES`이며, 2026-07-31부터 29개 명령 전체가 이 맵에 등록되어 있다(이전에는 `monorepo`가 빠져 무검증이었다 — Commands 표의 `monorepo` 행 참조). `--type <frontend|backend|fullstack|library|mobile|infra|mixed|unknown>`(2026-07-27 감사부터 `--format`/`--lang`처럼 **검증**된다 — 미지원 유형은 usage error, exit 3; 단일 소스는 `src/detector.js#symbol:KNOWN_TYPES`. 이전 표기는 mobile/infra가 빠진 stale 목록이었다), `--profile <p>...`, `--agent <codex|claude|cursor|copilot|windsurf|gemini|jetbrains|antigravity|all>...` (`all`은 codex/claude/antigravity 세 개만 확장; 나머지는 명시 선택. writable: codex/claude/cursor/copilot/windsurf/gemini, candidate: jetbrains/antigravity)
- `--format <text|json|markdown|html>`(대부분 명령), `graph`는 `--format <text|json|mermaid|dot>`(mermaid/dot는 graph 전용). `--out <path>`, `--strict`, `--minimal`
- `--lang <en|ko>`(전역 옵션, 1.22, 기본 `en`) — 사람이 읽는 findings **프로즈**(finding `message` + `explain`의 meaning/why/remediation)를 한국어로 지역화한다. config `lang`으로도 설정 가능(CLI 우선). rule ID·`--format json` 키/shape·CLI 명령·경로는 항상 영어; `--format json`의 `message`는 `--lang ko`에서만 한국어가 되고 `rule` 키·shape는 불변(소비자는 `rule`로 매칭). 기본 `en`은 모든 포맷에서 byte-identical.
- `--doc-lang <en|ko>`(전역 옵션, 1.24, 기본 `en`) — `init`/`quickstart`이 **생성하는 위키 문서 본문**과 handoff/`prompt`/생성 스킬의 **에이전트 문서 작성 지시** 언어를 고른다. config `docLanguage`로도 설정 가능(CLI 우선). `--lang`과 독립적이다(하나는 findings 언어, 하나는 생성 문서 언어). 잘못된 값은 usage error(exit 3). 기술 식별자(경로·코드 심볼·JSON 키·frontmatter 필드·status 값·CLI 명령·evidence locator)는 두 언어 모두 번역하지 않는다. `init`/`quickstart` 결과는 선택된 문서 언어를 `docLanguage` 필드(및 텍스트)로 표시한다. 기본 `en`은 이미 영어였던 문서에 대해 byte-identical.
- `--domain <name>`·`--goal <text>` (onboard — 학습할 업무 영역/목표), `--task <text>` (prepare/prompt — 필수).
- `--write`, `--dry-run`, `--apply` (migrate/import-memory), `--downgrade` (drift), `--existing <skip|overwrite>`, `--version <x.y.z>`, `--since <git-ref>` (release-notes/validate/impact), `--body-only` (release-notes), `--changed` (validate), `--run <path>` (check-run — 특정 run manifest 지정; 생략 시 `.llm-wiki/runs/`의 최신), `--domains <a,b,c>` (init/quickstart — 도메인 수동 지정), `--approve <path>` (review — 반복·쉼표구분 가능; 지정 needs_review 문서를 verified로 승격), `--approve-all`+`--yes` (review — 승격 가능한 모든 needs_review 문서를 승격, `--yes` 없으면 거부), `--reviewer <name>` (review — `reviewed_by` 소스; 미지정 시 config `reviewer` → git `user.name`, 없으면 스탬프 거부), `--include-sensitive` (list-docs/search-docs/review — 제한/민감 문서 포함). `--strict`는 warning을 exit 1로 승격한다(대부분의 명령; `impact --strict`·`check-run --strict`는 CI 실패로 만든다).

## Exit Codes

- `0` pass(그리고 `--strict`가 아니면 warning), `1` error(또는 `--strict`에서 warning), `2` blocked, `3` 사용법 오류. 근거: `src/cli.js`의 `exitCodeFor()`.

## Configuration

- 프로젝트 루트의 `llm-wiki.config.json`으로 `type`/`profiles`/`agents`/`strict`의 영속 기본값을 선언할 수 있다.
- 1.24부터 `lang`(findings/`explain` 프로즈 언어)과 `docLanguage`(생성 문서 + 에이전트 문서 작성 지시 언어) 키를 `"en"|"ko"`로 선언할 수 있다(잘못된 값은 config 오류). CLI `--lang`/`--doc-lang`이 각각 우선한다. 둘 다 미설정 시 `en`.
- 1.8부터 `rules` 맵으로 개별 finding rule을 끄거나 severity를 재정의한다: `{ "rule.id": "off"|"blocked"|"error"|"warning"|"info" }`. `audit`/`status`/`validate-frontmatter`에 중앙 적용되고(그래서 `validate`·`next`도 상속) CLI·API·MCP 모두에 반영된다. 레지스트리 rule만 토글되며 **`sensitive.*`(민감정보)는 절대 토글 불가**(안전 불변식). opt-in lint `content.thin_body`(기본 off)는 `rules`에 설정해 켠다.
- 2026-07-28(ECC Technique Extraction; 1.27.1로 배포)부터 `rulesPreset` 키로 명명 프리셋 번들을 고를 수 있다: `"relaxed"`(휴리스틱/정렬성 warning 11건 완화; error/blocked 기본 무접촉) | `"standard"`(의도적 no-op 베이스라인, byte-identical) | `"strict"`(opt-in lint 활성화 + 거버넌스 코어 4건 error 상향 + 2026-07-31(Phase 0)부터 `impact.source_changed`도 error 상향 — 누락(소스는 바뀌고 문서는 안 바뀜)을 잡는 **유일한** 규칙이 "strict"라는 이름의 프리셋에서 warning으로 남아 있었다; `relaxed`는 계속 info로 낮춘다). 번들 단일 소스는 `src/commands/findings.js#symbol:RULE_PRESETS`(frozen), 확장은 config 병합 시점이라 CLI/API/MCP + monorepo per-package가 자동 상속. 명시적 `rules` 항목이 항상 프리셋에 우선하고(프리셋=바닥), `sensitive.*`는 프리셋으로도 토글 불가, unknown 값은 config 오류(exit 3), `doctor`가 적용 프리셋을 에코. 프리셋은 findings severity만 바꾸며 `--strict` 플래그(exit code 의미론)와 별개다.
- 1.8부터 `requiredDocs`(문서 경로 배열)로 프로젝트 자체 필수 문서를 core/profile 목록에 추가한다(같은 `structure.required_doc` 검사; 검증 전용, `init`은 임의 문서를 scaffold하지 않음). `templates`(생성문서경로→템플릿파일경로)로 생성 문서를 프로젝트-로컬 템플릿에서 만든다 — **오버라이드는 body만 쓰고 frontmatter는 항상 CLI가 생성해 `status: verified`를 절대 만들 수 없다**(구조적 가드레일).
- 적용 우선순위: CLI 플래그 > config > 자동감지. 잘못된 config는 exit code `3`으로 거부된다.
- 배포물에는 포함되지 않는 저장소-로컬 설정이다(`package.json` `files` 미포함).

## Programmatic API

CLI 표면과 별개로, 패키지를 in-process로 import해 쓸 수 있는 프로그래매틱 API를 `package.json` `exports`(`.` → `src/index.js`)로 공개한다. CI 래퍼·에디터·테스트가 `llm-wiki` 바이너리를 spawn하지 않고 명령을 실행할 때 쓴다.

```js
import { commands, normalizeOptions, resolveOptions, parseArgs, run, SCHEMA_VERSION } from "llm-wiki-governance";

// 1) 부분 옵션으로 직접 호출
const result = await commands.audit(normalizeOptions({ cwd: process.cwd() }));
// result.command === "audit", result.result: "pass" | ..., result.findings: Finding[]
// result.schemaVersion === SCHEMA_VERSION

// 2) argv를 파싱해 실행 (parseArgs 결과를 그대로 넘겨도 됨)
const parsed = parseArgs(["audit", "--cwd", process.cwd(), "--strict"]);
const audited = await commands.audit(normalizeOptions(parsed));  // parseArgs 결과 직접 수용

// 2b) config 인식: 프로젝트의 llm-wiki.config.json을 CLI처럼 병합 (1.7.2)
const { options, errors } = await resolveOptions({ cwd: process.cwd() });
if (errors.length === 0) await commands.audit(options);          // 세 표면(CLI/API/MCP) 동일 effective options

// 3) CLI 전체를 in-process로 실행하고 exit code로 성패 분기
const code = await run(["audit", "--cwd", process.cwd()]);       // 0 pass / 1 error / 2 blocked / 3 usage
```

- **`commands`** — CLI 명령 이름 → 핸들러 함수의 **동결(frozen) 맵**. 키 집합은 `src/cli.js`의 `COMMANDS`와 1:1이며 안정 계약이다. 각 핸들러는 정규화된 옵션 객체를 받아 결과 객체로 resolve한다.
- **개별 함수 export** — `audit`, `doctor`, `validateCommand`, `fixCommand`, `graphCommand` 등 소스 이름으로도 직접 import할 수 있으며 `commands` 맵의 값과 동일 참조다.
- **`normalizeOptions(overrides?)`** — 부분 옵션을 받아 모든 기본값을 채우고 `cwd`를 절대경로로 해석한 완전한 옵션 객체를 돌려준다(배열은 매 호출마다 새로 만든다). 편의상 `parseArgs` 결과(`{ command, options, errors }`)를 그대로 넘겨도 되며, 이 경우 중첩된 `.options`를 override로 쓴다 → `normalizeOptions(parseArgs(argv))`와 `normalizeOptions(parseArgs(argv).options)`가 동일 결과를 낸다(전체 객체가 조용히 기본값으로 폴백되지 않는다). **동기(sync)** 이며 config는 로드하지 않는다(계약 불변).
- **`resolveOptions(overrides?)`** — `normalizeOptions`의 **config 인식(async) 동반자**(1.7.2). 완전 옵션을 만든 뒤 프로젝트의 `llm-wiki.config.json`(`cwd` 기준)을 로드·병합해 CLI가 계산하는 것과 동일한 effective options를 `{ options, errors }`로 돌려준다. 명시/override 값이 이기고 config는 미설정 항목만 채우며 `strict`는 additive로만 켤 수 있다. `errors`는 CLI가 exit 3으로 처리하는 조건(잘못된 JSON·필드·config-supplied agent)과 동일하며, 호출자가 표면화 방식을 정한다. 이로써 CLI·프로그래매틱 API·MCP 세 표면이 하나의 config에서 동일 옵션을 해석한다(공유 `src/cli.js#applyProjectConfig`). 동기 `normalizeOptions`·동결 `commands` 맵은 불변이고 `resolveOptions`는 부가 export다.
- **`parseArgs(argv)`** — argv 배열을 `{ command, options, errors }`로 파싱한다(CLI와 동일). **`run(argv)`** — argv를 받아 출력까지 처리하고 **숫자 exit code를 반환**한다(0 pass / 1 error·strict-warning / 2 blocked / 3 usage). `process.exitCode`도 같은 값으로 설정하므로 `bin/llm-wiki.js`는 그대로 동작한다.
- **`SCHEMA_VERSION`** — JSON 출력의 `schemaVersion` 필드 및 결과 객체의 `schemaVersion`과 같은 정수. shell-out이든 import든 동일 계약을 pin할 수 있다.

### Result Shape

모든 명령 결과는 최소 다음 공통 필드를 가진다(명령별 payload가 추가된다):

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| `schemaVersion` | `number` | 출력 계약 버전(= `SCHEMA_VERSION`). 결과 객체에 **항상** 담기며, `--format json` 출력 최상단에도 그대로 나타난다. |
| `command` | `string` | 명령 이름(판별자). |
| `result` | `string?` | 종합 등급(`pass`/`warning`/`fail`/`blocked` 등). `doctor`/`graph` 등 일부는 없음. |
| `findings` | `Finding[]` | 발견 항목(비어 있을 수 있음). |
| `text` | `string?` | **항상 사람용 텍스트 리포트**. `format`은 CLI/`run()` stdout과 `--out` 파일 렌더링에만 영향을 주고, 반환 객체의 `.text` 내용은 바꾸지 않는다. `--format json` **파일** 출력에서만 제거된다. |

`Finding`은 `{ severity: "blocked"|"error"|"warning"|"info", rule: string, path: string, message: string }`. 명령별 payload(예: `detection`, `wikiGraph`, `findingSummary`, `documentStatus`, `stats`, `graph`, `upgradeReport`, `applied`/`planned`/`skipped`)는 `src/index.js`의 JSDoc typedef와 각 핸들러를 근거로 한다.

프로그래매틱 소비자가 JSON을 원하면 결과 객체 자체가 데이터이므로 `JSON.stringify(result)`를 쓰거나 `run([..., "--format", "json"])`의 stdout을 파싱한다. `.text`를 JSON으로 기대하지 말 것.

### `schemaVersion`

단일 소스는 `src/config.js`의 `JSON_SCHEMA_VERSION`이다. **부가(additive)** 필드이므로 기존 필드(`command` 등)는 그대로이고 기존 소비자를 깨지 않는다. 두 곳에서 동일하게 나타난다: (1) 모든 명령의 **반환 객체**(1.5.1부터 — 결과 객체가 스스로 계약을 밝힌다), (2) `--format json` 출력과 `--out *.json` 파일 최상단. mermaid/dot 등 비-JSON 출력에는 붙지 않는다. JSON 형태에 **파괴적** 변경(필드 제거/개명/타입 변경)이 있을 때만 이 정수를 올린다.

### HTML 대시보드 링크

`audit`/`validate`/`status`의 `--format html` 대시보드에는 Document Index가 있고, 각 문서 링크(`<a href>`)는 **`--out` 파일의 위치 기준 상대경로**로 계산된다(1.5.1부터). 예를 들어 `--out docs/reports/dash.html`로 쓰면 링크가 그 파일에서 위키 문서로 가는 상대경로가 되어, 하위 폴더에서 열어도 링크가 깨지지 않는다. `--out` 없이 stdout으로 출력할 때는 repo-root 기준 상대경로를 그대로 쓴다.

## MCP Server (Agent-native) — 1.6

`llm-wiki mcp`는 **stdio 위에서 Model Context Protocol(MCP) 서버**를 실행한다. 에이전트(Claude Code·Cursor 등 MCP 클라이언트)가 CLI를 spawn하지 않고 위키를 **툴로 질의·점검**하게 한다. 서드파티 SDK 없이 Node 내장만으로 **개행 구분 JSON-RPC 2.0**을 직접 구현한다(무의존성 불변식 유지). 프로그래매틱으로는 `startMcpServer(options)`로 실행하고, 순수 핸들러 `handleMcpMessage(msg, ctx)`·툴 정의 `MCP_TOOLS`·`MCP_PROTOCOL_VERSION`도 export된다.

MCP 클라이언트 등록 예시:

```json
{ "mcpServers": {
  "llm-wiki": { "command": "npx", "args": ["-y", "llm-wiki-governance", "mcp"] }
}}
```

### 노출 툴 (모두 읽기 전용)

`validate` · `audit` · `next` · `status` · `doctor` · `stats` · `graph` · `explain` · `handoff` · `prompt` · `list_docs` · `search_docs` · `get_doc` · `get_related` · `onboard` · `prepare` · `review`(`list_docs`/`search_docs`/`get_doc`/`get_related`는 1.18 읽기 전용 retrieval — 거버넌스 리포트가 아니라 문서 **본문**을 반환; `onboard`/`prepare`는 1.24 guided; `review`는 Gate 20 needs_review 백로그의 **LIST만** 노출. MCP 툴 이름은 snake_case, CLI 명령은 kebab-case `list-docs` 등). **쓰기/변경 명령(init/fix/migrate/drift/quickstart)과 `review`의 승격(`--approve`)은 MCP로 노출하지 않는다** — 에이전트는 위키를 조회·점검할 뿐 바꾸지 않는다(`annotations.readOnlyHint: true`); `verified` 승격은 사람의 CLI 액션으로만 일어난다. 각 툴 인자는 `inputSchema`(JSON Schema)로 선언되며 `cwd`(기본=서버 실행 위치)·`type`·`profiles`·`strict`, retrieval 툴은 `query`/`path`/`status`/`visibility`/`docType`/`includeSensitive`/`limit` 등을 받는다. **2026-07-27 감사부터 이 스키마가 실제로 강제된다**: 위반 호출(잘못된 type, enum 밖 값, 필수 인자 누락, `minimum` 미만, unknown 인자[`additionalProperties:false`], 비객체 `arguments`)은 명령 실행 **전에** JSON-RPC `-32602 Invalid params`(`error.data = {tool, errors}`)로 거부된다 — 이전에는 조용히 강제 변환/무시돼 그대로 실행됐다(예: `validate {strict:"true"}`가 non-strict로 실행). `type` enum은 `KNOWN_TYPES` 단일 소스에서 파생돼 mobile/infra를 포함한다(이전 enum은 stale). `agents`는 명시 나열만 수용한다 — CLI 전용 `all` 별칭은 MCP에서 미수용(확장 경로 없음). 검증기는 순수·zero-dep `src/mcp/validate-args.js`.

### 툴 결과 형태

`tools/call` 결과는 `structuredContent`(명령 결과 객체 = `schemaVersion` 포함, `.text` 제거)와 `content[{type:"text"}]`(사람용 텍스트 리포트; graph는 요청 format의 렌더링, mermaid/dot 포함)로 반환한다. 명령이 예외를 던지면 프로토콜 에러가 아니라 `isError: true` 결과로 감싼다(MCP 관례).

### 프로토콜 처리

- 지원 메서드: `initialize`(protocolVersion 협상 — 지원 버전만 echo, 아니면 pinned로 폴백), `notifications/initialized`, `ping`, `tools/list`, `tools/call`.
- JSON-RPC 2.0 준수: 알림(id 없음)에는 무응답, 미지원 메서드 `-32601`, 잘못된 툴/파라미터 `-32602`, 파싱 오류 `-32700`, 배열(배치)은 `-32600`(2025-06-18은 배칭 제거).
- stdout은 프로토콜 전용(로그는 stderr). stdin EOF 시 정상 종료.

## Stability

- 명령 이름·JSON 출력 형태는 CI/래퍼가 의존하므로 보수적으로 유지한다.
- 프로그래매틱 API(`commands` 맵 키, 개별 함수 export, `SCHEMA_VERSION`, 공통 결과 필드)는 안정 계약이다. 명령별 payload 필드는 CLI `--format json`과 동일한 부가적(additive) SemVer 정책을 따른다.
- `migrate --apply`는 GATE_REVIEW Gate 8 범위로 활성화돼 있다(preview-first, `fix` 범위 + `wiki_block_version` 업그레이드, `verified` 내용·status 불변). `graph`/`stats`는 읽기전용이다.
- `fix`는 `GATE_REVIEW.md`의 "Autofix (--fix) Scope Decision"에 명시된 좁은 범위만 수정한다: `verified` 문서 내용·`docs/llm-wiki/` 밖 파일·`source_files`/`evidence` 값·Tier B 필드(title/doc_type/project/author)·미보강 내용은 건드리지 않는다.
- `llm-wiki.config.json` 스키마는 Gate 13(1.8)으로 성장했다: `type`/`profiles`/`agents`/`strict`에 더해 `rules`(rule 토글)·`requiredDocs`(커스텀 문서셋)·`templates`(템플릿 오버라이드, never-`verified` 가드레일)가 추가돼 config 성장이 완성됐다. unknown 키는 여전히 무시돼 옛 파일이 계속 동작한다. 1.7.2부터 `init`/`quickstart --write`가 최소 config를 scaffold하고 `doctor`가 effective config를 echo한다. config 파일은 **BOM 인식**으로 읽는다 — UTF-8 BOM(Windows PowerShell `Out-File -Encoding utf8`·구형 메모장의 기본)이나 UTF-16으로 저장돼도 정상 로드되며, 진짜 malformed JSON만 `is not valid JSON`(exit 3)이다.
- **명령별 옵션 검증과 help 토픽은 이제 29개 명령 전체에 걸쳐 균일하다(2026-07-31, 유지보수자 승인 하에 수정).** 이전에는 `monorepo`만 `COMMAND_OPTION_RULES`와 `COMMAND_HELP` 양쪽에서 빠져 있어 `monorepo --strict --write`가 usage error 없이 exit 0으로 통과하고 `help monorepo`가 `Unknown help topic`(exit 3)이었다. **이것은 exit code 동작 변경이다**: 이전에 exit 0으로 조용히 통과했던 미지원 옵션 조합이 이제 exit 3이다. 정당화 근거는 화이트리스트를 명령이 **실제로 적용하는** 옵션에 맞춘 것이다 — `--strict`/`--agent`는 패키지별 `validateCommand`로 전파되므로 허용하고, `--type`/`--profile`은 패키지별로 덮어써져 무효이므로 거부한다. 범위 결정은 `GATE_REVIEW.md`("Monorepo CLI Contract Parity"), 계약은 `tests/cli-monorepo-contract.test.js`가 고정한다.
- 참고로 정상 동작이 확인된 인접 계약: `prompt --task <미지원>` → blocked, **exit 2**; `explain <rule> --cwd .` → usage error, **exit 3**(`explain`은 `--cwd`를 받지 않는다 — Key Options 참조).
- MCP 서버(1.6)는 읽기 전용 툴만 노출하고 무의존성(Node 내장 JSON-RPC)으로 구현한다. MCP 툴 이름 집합과 결과 형태(1.5 result + `schemaVersion`)가 새 안정 계약이다(GATE_REVIEW Gate 11). 1.7.2부터 MCP 툴 호출도 대상 프로젝트의 `llm-wiki.config.json`을 `resolveOptions`로 병합해 CLI·API와 동일한 effective options를 쓴다(malformed config는 `isError`로 표면화).

## Evidence

- `src/cli.js#symbol:COMMANDS` — 명령 이름 → 핸들러 매핑.
- `src/cli.js#symbol:parseArgs` — 옵션/사용법 검증과 exit code 근거.
- `src/commands.js#symbol:migrateCommand` — `wiki_block_version` 업그레이드 리포트 + `--apply`(Gate 8 범위).
- `src/commands/fix-migrate.js#symbol:fixCommand` — 범위 한정 자동수정(기본 미리보기, `--write` 적용).
- `src/config-file.js#symbol:mergeConfigIntoOptions` — config 기본값과 CLI 플래그의 병합 우선순위.
- `src/index.js#symbol:commands` — 프로그래매틱 API의 동결된 명령 맵과 개별 함수 export.
- `src/commands.js#symbol:monorepoCommand` — `monorepo` 명령: 패키지별 validate 집계, additive `packages[]`(1.10).
- `src/detector.js#symbol:detectWorkspaces` — npm/yarn `workspaces` 감지(pnpm/YAML unsupported)(1.10).
- `src/index.js#symbol:normalizeOptions` — 부분 옵션 또는 `parseArgs` 결과(`.options`)를 완전 옵션으로 정규화(`src/cli.js#symbol:defaultOptions` 공유). 동기·config 미로드.
- `src/index.js#symbol:resolveOptions` — config 인식 옵션 해석(normalizeOptions + `llm-wiki.config.json` 병합); CLI·API·MCP 세 표면 공유(1.7.2).
- `src/commands/findings.js#symbol:applyRuleConfig` — config `rules` 토글을 findings에 중앙 적용(off 드롭·severity override; `sensitive.*` 비토글)(1.8).
- `src/commands/scans.js#symbol:scanThinBody` — opt-in `content.thin_body` lint(기본 off, config로 활성화)(1.8).
- `src/commands.js#symbol:findMissingDocs` — config `requiredDocs`를 core/profile 필수 목록에 병합해 `structure.required_doc`로 검사(1.8).
- `src/commands.js#symbol:renderOverriddenDoc` — config `templates` 오버라이드(body-only; frontmatter는 항상 CLI 생성이라 `verified` 불가)(1.8).
- `src/cli.js#symbol:applyProjectConfig` — config 로드+병합+agent 재정규화의 공유 구현(세 표면이 동일 effective options를 얻는 seam).
- `src/commands.js#symbol:scaffoldProjectConfig` — init/quickstart의 starter config scaffold(additive·preview-first·기존 파일 미덮어씀).
- `src/cli.js#symbol:main` — `run(argv)`의 실체. 숫자 exit code를 반환하고 `process.exitCode`도 설정한다.
- `src/commands/findings.js#symbol:withText` — 모든 명령 결과 객체에 `schemaVersion`을 부여한다.
- `src/config.js#symbol:JSON_SCHEMA_VERSION` — 결과 객체·`--format json`의 `schemaVersion` 단일 소스.
- `src/report.js#symbol:dashboardDocHref` — HTML 대시보드 Document Index 링크를 `--out` 위치 기준 상대경로로 계산.
- `src/mcp/tools.js#symbol:TOOL_DEFS` — MCP로 노출하는 읽기 전용 툴 정의(commands 위 얇은 래퍼).
- `src/mcp/dispatch.js#symbol:handleMessage` — MCP JSON-RPC 핸들러(initialize/tools.list/tools.call/ping; 프로토콜 준수). 2026-07-27부터 `tools/call`이 실행 전에 인자를 스키마 검증한다.
- `src/mcp/validate-args.js#symbol:validateToolArguments` — MCP 툴 인자 검증기(순수·zero-dep; TOOL_DEFS가 쓰는 JSON-Schema 서브셋만). 위반은 `-32602 Invalid params`(`data:{tool,errors}`)(2026-07-27 감사).
- `src/detector.js#symbol:KNOWN_TYPES` — `--type`(CLI)·MCP `type` enum이 수용하는 프로젝트 유형의 단일 소스(mobile/infra 포함)(2026-07-27 감사).
- `src/frontmatter.js#symbol:parseFrontmatter` — additive `duplicateKeys` 반환 → `frontmatter.duplicate_key`(warning, toggleable) finding의 근원(2026-07-27 감사).
- `src/commands.js#symbol:impactCommand` — `impact` 명령: diff 기준 reverse-impact(read-only; Gate 23, 1.17).
- `src/commands.js#symbol:checkRunCommand` — `check-run` 명령: `.llm-wiki/runs/` run manifest로 스킬 실행 파이프라인(changedSource↔touchedDocs·log·validate)을 검증(read-only; `run.*` findings; Gate 26, 1.19).
- `src/commands/retrieval.js` — read-only retrieval 4개 핸들러(`listDocsCommand`/`searchDocsCommand`/`getDocCommand`/`getRelatedCommand`): 문서 본문 반환, visibility 존중 + sensitive-info redaction, zero-dep 키워드 검색(Gate 24, 1.18).
- `src/git.js#symbol:changedFiles` — 변경집합 프리미티브(working tree / `--since <ref>`); `impact`와 `validate --changed`가 공유.
- `src/commands.js#symbol:reviewCommand` — `review` 명령: needs_review 백로그를 위험도 정렬해 나열(read-only)하고 `--approve`/`--approve-all --yes`로 지정 문서에 `status: verified`+`reviewed_by`+`reviewed_at`+`tags`의 상태 태그(이미 있는 경우만)를 스탬프(자동 승격 없음; blocking/구조적 finding 문서 거부; `drift --downgrade`의 역방향). reviewed_by는 `--reviewer`>config>`gitUserName`. seam 재사용: `src/git.js#symbol:gitUserName`·`src/commands/fix-migrate.js#symbol:upsertFrontmatterScalar`·`syncStatusTag`·`src/commands/findings.js`의 `review.reviewer_unresolved`/`review.confirmation_required` 규칙(Gate 20).

## Review Notes

- 2026-07-14에 1.3.0 CLI 명령·옵션 계약(migrate --apply, drift, 신규 --agent, OKF type alias 포함)을 기준으로 재검토하고 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-14에 1.4.0의 새 명령(`graph`, `stats`)과 graph 전용 `--format mermaid|dot`을 반영하고, stale했던 "migrate --apply 차단" 서술을 정정한 뒤, 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-14에 1.5 프로그래매틱 API(`package.json` `exports` → `src/index.js`, 동결된 `commands` 맵·개별 함수 export·`normalizeOptions`·`parseArgs`/`run`·`SCHEMA_VERSION`)와 `--format json`의 부가적 `schemaVersion` 필드를 반영하고, 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-14에 1.5.1 API/출력 결함 수정을 반영했다(소비 프로젝트 스모크 테스트 발견): 결과 객체가 `schemaVersion`을 항상 담고 `.text`는 항상 텍스트임을 명시, `normalizeOptions`가 `parseArgs` 결과를 수용, `run(argv)`가 exit code 반환, HTML 대시보드 링크를 `--out` 기준 상대경로로. 모두 additive/refinement라 안정 계약을 깨지 않는다. 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-14에 1.6 에이전트 네이티브(MCP 서버 `llm-wiki mcp`) 계약을 추가했다: stdio JSON-RPC 2.0 직접 구현(무의존성), 읽기 전용 툴 10개(쓰기 미노출), 결과는 `structuredContent`(schemaVersion 포함)+텍스트. 적대적 다차원 리뷰(프로토콜/정확성/안전/통합/테스트)로 확정 결함(버전 협상·알림 무응답·배치 처리·graph 설명)을 수정했다. 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-15에 1.7 계약을 반영했다: `release-notes`에 `--body-only`(변경 섹션 본문만; frontmatter/H1/스캐폴드 제외, 본문 민감정보 스캔·매치 시 차단 exit 2)를 추가하고 Key Options에 등재했다. `src/release-notes.js`를 source_files에 추가했다. 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-15에 1.7.2(enabling-prep) 계약을 반영했다: `resolveOptions`(config 인식 async 옵션 해석)를 프로그래매틱 API에 추가하고, MCP 툴 호출이 `llm-wiki.config.json`을 병합하도록 갱신하면서 1.6의 "MCP는 config 미병합" 서술을 정정했다. `init`/`quickstart`의 starter config scaffold와 `doctor`의 effective-config echo도 명시했다. 모두 additive(동기 `normalizeOptions`·동결 `commands` 맵 불변). 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-15에 1.8.0 config schema growth(Gate 13)를 반영했다: `llm-wiki.config.json`의 `rules` 맵으로 finding rule을 끄거나 severity를 재정의하는 per-project 토글(중앙 `applyRuleConfig`, `sensitive.*`는 안전상 비토글)과 opt-in lint `content.thin_body`(기본 off)를 추가하고, `doctor`가 토글 수를 echo함을 명시했다. Configuration/Stability에 `rules`를 등재했다. additive·opt-in. 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-15에 1.8.1 config schema growth 2부(Gate 13 완성)를 반영했다: `requiredDocs`(커스텀 문서셋; `structure.required_doc`로 검사, 검증 전용)와 `templates`(템플릿 오버라이드; body-only라 `verified` 불가한 구조적 가드레일)를 Configuration/Stability/Evidence에 등재하고 `doctor`가 개수를 echo함을 명시했다. additive·opt-in. 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-15에 1.10.0 monorepo profile(Gate 14→15)을 반영했다: 명령 표면에 opt-in `monorepo` 명령(npm/yarn workspaces 감지 후 패키지별 validate 집계, additive `packages[]`, 단일 레포 출력 byte-identical)을 등재하고 Evidence에 `monorepoCommand`·`detectWorkspaces`를 추가했다. additive·opt-in. 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-16에 1.11.1 commands.js 모듈 분리(동작 보존 내부 리팩터)를 반영했다: 공개 CLI/프로그래매틱 API 표면은 byte-identical(동결 `commands` 맵·re-export 불변)이며, Evidence의 구현 심볼 포인터만 이동 모듈로 갱신했다(`fixCommand`→fix-migrate, `applyRuleConfig`/`withText`→findings, `scanThinBody`→scans). 코드에 맞춰 문서를 수정한 뒤 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-16)를 거쳐 `verified`로 재승인했다.
- 2026-07-20에 1.14.1 노출-테스트 fix 배치를 검토했다: 공개 CLI/프로그래매틱 API 표면은 불변이다 — exit code 의미(`0`/`1`/`2`/`3`)와 `result` 필드 열거(개방형)가 그대로라 no-flag `init`/`quickstart`의 `ready`(exit 0) 리네임과 모순되지 않는다. 내용 불변으로 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-20) 후 review baseline을 갱신해 `evidence.stale`을 해소했다.
- 2026-07-20에 1.15.0 스킬 생성(Gate 21)을 반영했다: `init`/`quickstart`에 부가 옵션 `--skills`를 추가하고(위키-그라운디드 자동화 프롬프트 아티팩트 생성; `--agent claude\|cursor`로도 트리거) command 표에 기술했다. additive(옵션 미사용 시 표면·출력 불변), 동결 프로그래매틱 API 맵·`--format json` 형태 불변. 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-20)를 거쳐 `verified`로 재승인했다.
- 2026-07-21에 1.17.0 reverse-impact(Gate 23, accepted)를 반영했다: 신규 read-only `impact [--since <ref>] [--strict]` 명령을 Commands 표·Key Options·Evidence(동결 `commands` 맵에도 `impact` 추가)에 등재하고, 변경집합 프리미티브 `src/git.js#changedFiles`를 source_files/evidence에 넣었다. additive(옵션·명령 미사용 시 기존 표면 불변), `--format json`·frontmatter·zero-dep 불변. 에이전트(Claude Code) 편집이라 `needs_review`로 강등 — 사람 검토 후 재승인 예정.
- 2026-07-21에 1.18.0 read-only retrieval(Gate 24, accepted)를 반영했다: 신규 4개 명령 `list-docs`/`search-docs <query>`/`get-doc <path>`/`get-related <path>`을 Commands 표에, 대응 MCP 툴 `list_docs`/`search_docs`/`get_doc`/`get_related`(snake_case)을 노출 툴 목록에, `src/commands/retrieval.js`를 Evidence에 등재했다. 거버넌스 리포트가 아니라 문서 **본문**을 반환하는 첫 표면 — 프로그래매틱 API 동결 맵에도 4개 kebab 키를 additive로 추가. `search-docs`는 zero-dep 키워드/부분문자열(semantic 아님), restricted/민감 문서는 list/search 기본 제외(opt-in `--include-sensitive`)·반환 본문/스니펫은 민감 라인 redact, 쓰기 표면 없음. `1.0.0` 계약·`--format json`·frontmatter·zero-dep 불변. 에이전트(Claude Code) 편집이라 `needs_review`로 강등 — 사람 검토 후 재승인 예정.
- 2026-07-22에 1.19 명령 표면 doc-sync 갭을 메웠다: 야간 자율 실행의 Gate 25/26 커밋이 ARCHITECTURE/DOMAIN_FEATURES만 갱신하고 PUBLIC_API는 놓쳐, 배포된 read-only `check-run [--run <path>] [--strict]` 명령(Gate 26)과 `stats --format json`의 계산된 `evidenceTiers`(Gate 25)가 누락돼 있었다. Commands 표에 `check-run` 행(intent-앵커 run manifest 검증; `run.*` findings; 쓰기 없음)을, Key Options에 `--run <path>`을, Evidence·frontmatter evidence에 `src/commands.js#symbol:checkRunCommand`를, `stats` 행에 `evidenceTiers` 부가 노출을 등재했다. check-run은 `impact`와 마찬가지로 CLI/API 전용(MCP 미노출). additive·read-only·`--format json`·frontmatter·zero-dep·`1.0.0` 계약 불변. 코드에 맞춰 문서를 수정한 뒤 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-22)를 거쳐 `verified`로 재승인했다(1.16.0→1.19 명령 표면 누적분 포함).
- 2026-07-22에 `get-doc`에 `--section <terms>` 집중 읽기 옵션을 추가했다(벤치가 지목한 "큰 문서 전문 읽기가 토큰-비쌈" 문제 대응): 관련 `##` 섹션+프리앰블만 반환하고, `##` 섹션이 없거나 매치가 없으면 full body로 fallback하며, 필터 시에만 additive `document.section` `{query,returned,total}`을 부가한다(기본 출력 불변). CLI 플래그·MCP `get_doc.section`·프로그래매틱 옵션 3표면 배선. 실측: 잘 구조화된 문서에 −53%(PUBLIC_API 자체), 거대 단일 섹션 문서엔 미미(1~8%). additive·read-only·zero-dep·`1.0.0` 계약 불변, 미릴리스(main 한정, 다음 minor에서 배포·버전 태깅 예정). 에이전트(Claude Code) 편집이라 `needs_review`로 강등 — 사람 검토 후 재승인 예정.
- 2026-07-22에 1.22.0 findings i18n(Gate 27, P4)의 전역 `--lang <en|ko>` 옵션과 config `lang`을 Key Options에 등재했다(프로즈만 지역화; rule ID·`--format json` 키/shape·CLI 명령·경로 영어 고정, `message`는 `--lang ko`에서만 지역화하되 `rule`/shape 불변, 기본 `en` byte-identical). 1.22.0 npm 배포 후 이 추가분과 앞선 `get-doc --section` 반영분을 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-22)를 거쳐 `verified`로 재승인했다. 명령·옵션 표면이 현재 CLI(`src/cli.js`)·프로그래매틱 API(`src/index.js`)와 일치함을 확인했다(275 tests·validate --strict 0; npm dist-tags.latest=1.22.0).
- 2026-07-23에 `prompt --task` 표면에 `bootstrap`을 추가하고(CLI 도움말·MCP `prompt` 툴 enum 동기), `init`/`quickstart --skills`·`--agent codex`가 Codex 네이티브 스킬(`.agents/skills/`)을 생성함을 command 표에 반영했다. `bootstrap`은 최초 보강용이며 `handoff`와 규칙을 공유한다. 동결 프로그래매틱 `commands` 맵·`--format json` shape 불변(신규 명령 없음; `prompt` 태스크 enum만 확장). additive·zero-dep. 284 tests·validate --strict 0. 에이전트(Claude Code) 편집이라 `needs_review`로 강등 — 사람 검토 후 재승인 예정.
- 2026-07-23에 위 bootstrap/Codex 반영분을 release-prep 1.23.0의 일부로 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-23)를 거쳐 `verified`로 재승인했다. 1.23.0 `package.json` 범프로 생긴 evidence.stale 드리프트도 reviewed_at 갱신으로 함께 해소했다(284 tests·validate --strict 0).
- 2026-07-23에 Guided Onboarding and Task Preparation(1.24 대상; 읽기 전용 `onboard`/`prepare` 명령·스킬, 검색 랭킹 `rankDocsByQuery` 재사용)을 반영했다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등한다 — 사람 검토 전까지 미확정이며 허위 검토 메타를 넣지 않는다. 이번 소스 변경(`src/commands/guided.js` 신규 등)으로 소스를 참조하는 다른 verified 문서도 재검토가 필요하다(그 문서들은 `drift --downgrade`로 정직하게 needs_review 처리).
- 2026-07-23에 생성 문서 언어 선택(긴급 i18n, 1.24.0)을 반영했다: 전역 `--doc-lang <en|ko>`(Key Options)와 config `docLanguage`(Configuration)를 등재했다 — `init`/`quickstart` 생성 문서와 에이전트 문서 작성 지시 언어를 고르며 `--lang`과 독립, CLI가 config 우선, 잘못된 값은 exit 3. 단일 언어 선택 계층 `src/commands/doc-content.js`, 기술 식별자 미번역, 기본 `en`은 이미 영어였던 문서에 byte-identical. 에이전트(Claude Code) 편집이라 `needs_review` 유지 — 사람 검토 전까지 미확정이며 허위 검토 메타를 넣지 않는다. 307 tests·validate --strict 0.
- 2026-07-23에 위 1.24.0(doc-language i18n + guided onboarding) 반영분을 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-23)를 거쳐 `verified`로 재승인했다. 옵션·config 표면 서술이 현재 소스(HEAD c7a1a7a, npm dist-tags.latest=1.24.0)와 일치함을 확인했다.
- 2026-07-23에 토큰 효율 retrieval 토큰 제어(제안, opt-in)를 command 표에 반영했다: `get-doc`에 `--strict-section`/`--compact`/`--max-chars`, `prepare`에 `--compact`/`--max-chars`를 추가했다. 모두 additive·opt-in이라 미사용 시 표면·`--format json` 형태 byte-identical(신규 옵션 사용 시에만 `document`에 `chars`/`estimatedTokens`/`truncated`, prepare compact 페이로드 부가). 동결 프로그래매틱 API 맵의 키 집합·exit code 의미 불변. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정.
- 2026-07-23(1.25.0 릴리스)에 `init`/`quickstart`의 부가 옵션 `--refresh`(사용자 미수정 관리 스킬만 갱신; 사용자·커스텀 스킬 미덮어씀)를 command 표에 반영하고, MCP `get_doc`/`prepare`에 토큰 제어 옵션(`strictSection`/`compact`/`maxChars`)이 노출됨을 기록했다. 모두 additive·opt-in이라 미사용 시 표면·`--format json`·동결 맵 불변. 에이전트 편집이라 `needs_review` 유지 — 사람 재검토 후 `verified` 예정.
- 2026-07-24에 위 1.25.0 반영분(command 표의 `get-doc --strict-section`/`--compact`/`--max-chars`·`prepare --compact`/`--max-chars`·`init`/`quickstart --refresh`, MCP `get_doc`/`prepare` 토큰 제어 옵션)을 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-24)를 거쳐 `verified`로 재승인했다. command 표·옵션 표면이 현재 소스(HEAD 5fe3aff, npm dist-tags.latest=1.25.0)와 일치하고 동결 프로그래매틱 API 맵의 키 집합·`--format json` 형태가 불변임을 확인했다(319 tests·validate --strict 0).
- 2026-07-24에 Gate 20 read-only `review` 워크플로(GATE_REVIEW "Review Workflow Scope Decision", accepted 2026-07-24)를 반영했다: Commands 표에 `review [--approve <path>]... [--approve-all --yes] [--reviewer <name>] [--include-sensitive]` 행을, Key Options에 `--approve`/`--approve-all`/`--yes`/`--reviewer`/`--include-sensitive`를, MCP 노출 툴 목록에 `review`(LIST만; 승격은 CLI 전용)을, Evidence에 `src/commands.js#symbol:reviewCommand` 포인터를 등재했다. needs_review 백로그를 위험도 정렬해 나열(read-only)하고 명시적 `--approve`/`--approve-all --yes`로만 `status: verified`+`reviewed_by`+`reviewed_at`을 스탬프하며 자동 승격은 절대 없다(blocking/구조적 finding 문서 거부; reviewed_by 미해소 시 스탬프 거부). 동결 프로그래매틱 API `commands` 맵에 `review` 키를 additive로 추가(`src/index.js`). additive·`1.0.0` 계약·`--format json` shape·zero-dep 불변. 319 tests·validate --strict 0. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-27에 저장소 품질 감사에서 재현한 버그 2건의 수정을 옵션 표면 문서에 반영했다: (1) Commands 표 `init` 행에 그동안 **문서화되지 않았던** `--with-adapters`/`--no-adapters`를 등재하고, `--no-adapters`가 선언적(플래그 순서 무관)이며 명시적 opt-out이라 config `agents`가 목록을 되채우지 않음을 명시했다 — 수정 전에는 순서에 따라 결과가 달랐고 비워진 목록을 config가 되살렸다. (2) Contract Notes의 config 항목에 config 파일이 **BOM 인식**으로 읽힌다는 점(UTF-8 BOM·UTF-16 로드 성공, 진짜 malformed만 exit 3)을 추가했다. 공개 계약 관점: 명령/JSON shape/exit code 의미/동결 `commands` 맵 키 집합 불변이고, `defaultOptions()`에 `noAdapters: false`가 **additive**로 늘었다(`normalizeOptions`가 spread하므로 프로그래매틱 API 반환 객체에 키 1개 추가). 330 tests·lint OK·validate --strict 0. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-27에 위 버그 수정 2건 반영분을 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-27)를 거쳐 `verified`로 재승인했다. 옵션 표면 서술이 현재 소스와 일치함을 확인했다: `--no-adapters`는 `src/cli.js`에서 `options.noAdapters`만 세우고 argv 순회 후 일괄 적용되며(선언적), `src/config-file.js`의 config 병합이 그 플래그를 가드로 존중한다. config 읽기는 `readTextAuto`(BOM 인식)다. 이 재승인은 1.26.3 릴리스의 일부다(330 tests·lint OK·validate --strict 0).
- 2026-07-27(야간)에 같은 날 품질 감사의 잔여 3건을 공개 계약 문서에 반영했다(미릴리스, main 한정). **(1) MCP inputSchema 강제**: `tools/call` 인자가 실행 전에 검증되어 위반은 `-32602 Invalid params`(`error.data={tool,errors}`)로 거부된다(이전엔 조용히 강제 변환/무시). stale했던 `type` enum을 `KNOWN_TYPES` 단일 소스로 교정(mobile/infra 포함), `agents`의 CLI 전용 `all` 미수용을 명시, `prompt`의 `task` enum을 `SUPPORTED_TASK_PROMPTS`(onboard/prepare 포함)로 정렬. **(2) CLI `--type` 검증**: Key Options의 stale 목록(mobile/infra 누락)을 교정하고 미지원 유형이 usage error(exit 3)임을 명시 — **작은 동작 변경**(이전엔 `--type banana`가 exit 0). **(3) `frontmatter.duplicate_key`**: `validate-frontmatter` 행에 신규 warning rule(toggleable, 값 미노출)을 등재. 계약 관점: 신규 명령/JSON shape 변경/동결 `commands` 맵 키 변경 없음, `parseFrontmatter` 반환에 additive `duplicateKeys` 키 1개 추가, 스키마 위반 MCP 호출과 미지원 `--type`만 새로 거부된다. 347 tests·lint OK·validate --strict 0. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-28에 ECC 기법 추출 배치(유지보수자 지시, GATE_REVIEW "ECC Technique Extraction Scope Decision"; 미릴리스)를 공개 계약 문서에 반영했다. **(1) 신규 write 명령 `import-memory [<path>] [--apply]`**를 Commands 표에 등재(preview 기본·`--apply` 쓰기·verified 생성 구조적 불가·민감 히트 기본 skip·MCP 미노출)하고 동결 프로그래매틱 `commands` 맵에 `import-memory` kebab 키를 additive로 추가했다(`src/index.js`; `defaultOptions()`에 `memoryPath` 키 additive). **(2) config `rulesPreset`**("relaxed"|"standard"|"strict") 키를 Configuration에 등재 — 명시 `rules` 우선, sensitive.* 보호, unknown 값 exit 3, doctor 에코. **(3) `check-run`의 `testEvidence {red, green}`** optional 필드와 `run.test_evidence_missing`(warning)을 Commands 표에 반영(구 manifest 면제). **(4)** 생성 스킬 아티팩트의 `estimated-tokens` 스탬프는 생성물 형식 변경이라 이 문서의 계약 표면에는 항목이 없다(스킬 생성 행 자체는 불변). 계약 관점: 기존 명령/JSON shape/exit code 의미 불변, 신규 명령·config 키·manifest 필드는 전부 additive·opt-in. 380 tests·lint OK(55 files)·validate --strict 0. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-30에 1.26.3 이후 누적분(2026-07-27 야간 감사 잔여 3건 + 2026-07-28 ECC 기법 추출 배치 — 모두 1.27.1로 배포됨)을 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-30 — 유지보수자 지시로 세션 내 재승인)를 거쳐 `verified`로 재승인했다. 스탬프 전에 낡은 배포 상태 표기를 교정했다: `import-memory` 행과 `rulesPreset` 항목의 "(미릴리스)"를 1.27.1 배포 사실로 갱신. 동결 `commands` 맵 28키가 현재 `src/index.js`와 일치하고, 1.27.2는 명령/옵션/JSON shape 표면 무변경(프롬프트 산문·어댑터 템플릿만)임을 확인했다. 386 tests·validate --strict 0.
- 2026-07-31에 **문서를 읽는 대신 명령을 실행해 대조한 결과 사실 오류 3건과 계약 이탈 2건을 찾아 반영했다**(코드 변경 없음). 직전 재승인(2026-07-30)이 "fact-checking 후"였는데도 남아 있던 것들이며, 공통점은 **문서를 읽는 방식으로는 잡히지 않고 명령을 실행해야 드러난다**는 점이다. **(1)** `prompt --task` 지원 값을 6종에서 실제 **8종**으로 정정했다(`onboard`/`prepare` 누락) — CLI가 미지원 값에 대해 스스로 출력하는 목록과 대조했고, 열거 대신 단일 소스 `SUPPORTED_TASK_PROMPTS`를 함께 가리키도록 했다(미지원 값은 blocked, exit 2로 실측). **(2)** Key Options의 `--cwd <path>`가 공통 옵션처럼 제시돼 있었으나 `explain`은 받지 않는다(`explain <rule> --cwd .` → exit 3 실측) — 예외와 단일 소스(`COMMAND_OPTION_RULES`)를 명시했다. **(3)** Stability에 **알려진 계약 이탈** 항목을 신설해 `monorepo`의 옵션 무검증(`monorepo --strict --write` → exit 0 실측)과 `help monorepo`의 exit 3을 결함으로 기록했다 — 문서를 실제 동작에 맞춰 정당화하지 않고, 이 표의 "옵션 없음"이 의도된 계약이며 그것을 강제하지 못하는 것이 결함임을 명시했다. 이 둘의 코드 수정은 exit code 계약을 건드리므로(지금 통과하는 호출이 exit 3으로 바뀐다) **사람 승인 대기**로 남겼다. **(4)** `monorepo` 행에 workspaces 없는 저장소에서 `pass`를 반환한다는 한계도 함께 적었다. 이 문서의 MCP 툴 목록(17종)은 이미 정확했다. 386 tests·lint OK·validate --strict 0(이 문서 귀속 finding 0건). 에이전트(Claude Code) 편집이라 `needs_review` 유지 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-31(이어서)에 위 계약 이탈 2건이 **유지보수자 승인으로 수정되어** 서술을 결함 기록에서 확정 계약으로 바꿨다. 그 과정에서 **같은 날 내가 적은 서술 하나가 틀렸음을 확인하고 정정했다**: Commands 표에 `monorepo`의 "옵션 없음"이 의도된 계약이라고 적었으나, `monorepoCommand`가 `{ ...options }`를 각 패키지의 `validateCommand`로 전파하므로 `--strict`(패키지별 evidence severity warning→error)와 `--agent`(패키지별 adapter 스캔)는 **실제로 적용된다**. 테스트로 재현해 확인했다(`--strict` 없이 warning/result warning, `--strict`로 error/result fail). 따라서 화이트리스트는 "옵션 없음"이 아니라 `cwd`·`strict`·`agent`·`format`·`out`이고, `--type`/`--profile`은 패키지별로 `type: null`·`profiles: []`로 덮어써져 무효이므로 거부한다. `help monorepo` 토픽도 신설해 다른 28개와 같은 형식(Usage/Purpose/Notes/JSON)을 갖췄다. **exit code 동작 변경**임을 Stability에 명시했다. 399 tests(신규 6, RED 3건 선실패 확인)·lint OK(58 files). 에이전트(Claude Code) 편집이라 `needs_review` 유지 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-31(Phase 0 게이트 배선)에 로드맵 "지금 해야 함" 1~2번을 처리했다. **(1) `doctor`의 `ci_governance`를 차단력 기준으로 재정의**했다 — 그 전에는 호출 존재만 세어 `doctor`/`status` 같은 항상 exit 0인 리포트도 게이트로 계수했다(호출 존재 ≠ 게이트 존재). 이제 `N blocking, M advisory`로 나누고 **누락 게이트(`impact`/`check-run`/`drift` + `--strict`)가 없으면 그 사실을 명시**한다. 검출 정규식이 `node bin/llm-wiki.js <command>` 형태를 못 봐서 이 저장소 자신의 게이트가 안 보이던 것도 고쳤다. 알려진 한계: 호출은 보지만 **실행 디렉터리는 보지 않는다**(zero-dep·YAML 미파싱) — 매칭된 파일 경로를 함께 보고하므로 사람이 판별할 수 있고, 수치는 상한으로 읽어야 한다. **(2) composite action(`.github/actions/validate/action.yml`)에 `command` 입력을 추가**했다 — 그 전에는 `args=(validate ...)`로 하드코딩돼 있어 이 액션으로는 누락 게이트를 **물리적으로 걸 수 없었다**. 읽기 전용 명령 11종만 허용(쓰기 명령은 exit 3)하고, 각 플래그는 그 명령이 실제로 받는 경우에만 붙인다(`COMMAND_OPTION_RULES`가 이제 미지원 옵션을 exit 3으로 거부하므로 필수). 기본값 `validate`라 기존 사용자는 무변경. 424 tests·lint OK(59 files). 에이전트(Claude Code) 편집이라 `needs_review` 유지 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-31(Phase 0 결함 배치)에 하네스 거버넌스 로드맵의 "지금 해야 함" 3~7번을 코드로 처리하고 공개 계약 표면을 갱신했다: `explain`이 `--cwd`를 받고(설정의 `lang`이 산문 언어를 정하므로 실효 옵션), `drift`가 `--strict`를 받고 드리프트를 `findings`에 실어 `result: warning`을 보고하며(그 전엔 항상 `pass`+exit 0이라 CI 게이트 불가), `impact --since`가 미추적 파일을 포함하고, `check-run`의 "최신" 매니페스트가 파일명 사전순이 아니라 `timestamp` 기준이 됐고, `review --approve`가 보강되지 않은 스캐폴드를 `review.not_enriched`로 거부하며, `rulesPreset: strict`가 `impact.source_changed`를 error로 올린다. `--strict` 없는 exit code는 전부 보존했다(drift는 0 유지). 신규 finding 규칙 1건(`review.not_enriched`)·신규 옵션 2건(`explain --cwd`, `drift --strict`)은 additive이고, `review`의 승격 거부와 `check-run`의 선택 변경은 **의도된 동작 변경**이라 GATE_REVIEW "Phase 0 Defect Batch"에 기록했다. 415 tests·lint OK(59 files)·validate --strict 5(사람 재기준선 대기분, 이 배치와 무관)·validate-frontmatter 0. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-07-31(측정 결함 배치)에 도입 저장소 4곳 실측에서 나온 결함 2건을 반영했다. **(1) `validate-frontmatter`의 `result`가 다른 모든 명령과 같은 4단계 사다리**(`blocked`/`fail`/`warning`/`pass`)를 쓰고 JSON 페이로드에 `result` 필드가 additive로 실린다 — 그 전에는 이 명령만 2단계라 warning만 있는 실행이 본문에 `result: pass`를 찍으면서 `--strict` exit는 1이었고, CI 로그를 읽는 사람에게 "통과인데 실패"로 보였다. 이것은 **보고 값의 변경**이라 계약 변경으로 기록한다(exit code 의미는 불변). **(2) `review --approve`와 `drift --downgrade`가 `status`와 함께 `tags`의 상태 태그도 맞춘다** — 그 전에는 `status`만 바뀌어 문서가 `status: verified`인 채 `needs-review` 태그를 유지했고, 어느 경로로 강등했느냐에 따라 결과가 갈렸다(도입 저장소 한 곳에서 22개 중 12개가 불일치). 이미 있는 상태 태그만 고치고 없으면 만들지 않으므로, 태그로 상태를 추적하지 않는 문서는 그대로다. 신규 명령·옵션 0건, 동결 `commands` 맵·exit code 의미 불변. 부수로, 새 헬퍼의 인라인 리스트 정규식이 2차 백트래킹(`js/polynomial-redos`, CodeQL이 PR #1에서 검출)이라 선형으로 고쳤다 — 계약 표면 영향 없음. 438 tests(신규 9)·validate --strict 0·validate-frontmatter 0. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-08-03에 **도구가 인쇄하는 텍스트가 자기 쓰기 범위를 거짓으로 말하던 것을 고쳤다**(N-10, N-4의 네 번째 여진). `review --approve`의 caveat·help는 "ONLY status + reviewed_by + reviewed_at", `drift --downgrade`의 caveat·help는 "status + last_updated only"라고 단정했지만, 2026-07-31 N-4 수정 이후 두 명령은 공유 `syncStatusTag`로 `tags`의 상태 태그도 쓴다. 발견 경로가 중요하다 — **유지보수자의 실제 승인 실행**에서 리포트의 주장과 diff(문서당 3줄)가 어긋났고, 배포된 어떤 검증 명령도 이것을 보지 못했다. 소스 8곳(`src/commands.js` 3 · `src/cli.js` 4 · `src/commands/fix-migrate.js` 1)을 고쳤고 신규 테스트 4건이 수정 전 소스에서 전건 RED임을 확인했다(list caveat · approve caveat · drift caveat · help 4표면). 442 tests(신규 4)·lint OK(61 files)·`validate --strict` 0. 명령 표(2026-07-31에 갱신됨)는 이미 정확했지만 **같은 문서의 `## Evidence` 재서술이 거짓**이었다 — 같은 계약이 한 문서 안에 두 번 서술돼 있고 수정이 표에만 닿았다. 함께 고치고 seam 목록에 `syncStatusTag`를 추가했다. 별건으로 기록한다: 이 문서의 Review Notes는 37건으로 무거운 문서 5건 상한(`ARCHITECTURE_CONVENTIONS.md` 규칙)을 이미 크게 넘겨 있으며 이 노트로 38건이 된다 — 아카이브 이전은 이 배치 범위 밖이라 별도 배치가 필요하다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
