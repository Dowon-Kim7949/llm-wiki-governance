---
title: llm-wiki-governance Product Identity Audit
tags:
  - llm-wiki
  - product-audit
  - governance
status: needs_review
doc_type: audit
project: llm-wiki-governance
last_updated: 2026-07-21
author: Codex
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - package.json
  - README.md
  - src/commands.js
  - src/commands/scans.js
  - src/commands/fix-migrate.js
  - src/task-prompts.js
  - src/mcp/tools.js
  - tests/verification.test.js
  - tests/mcp.test.js
  - outputs/distribution/launch-post.md
evidence:
  - package.json
  - src/commands.js#symbol:quickstartCommand
  - src/commands.js#symbol:initCommand
  - src/commands.js#symbol:validateCommand
  - src/commands/scans.js#symbol:scanEvidenceDrift
  - src/commands/fix-migrate.js#symbol:driftCommand
  - src/task-prompts.js#symbol:buildTaskPrompt
  - src/mcp/tools.js#symbol:TOOL_DEFS
  - tests/verification.test.js#L1486-L1768
  - tests/mcp.test.js#L40-L67
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md
  - docs/llm-wiki/PUBLIC_API.md
  - outputs/distribution/launch-post.md
visibility: internal
contains_sensitive_info: false
---

# llm-wiki-governance 제품 정체성 감사

## Executive verdict

- **현재 실제 정체성:** AI가 관리하는 Markdown 프로젝트 wiki에 상태·참조 무결성·git 기반 drift·수동 인간 승인·CI 규칙을 얹는 **문서 거버넌스 CLI**다. 초기 scaffold와 에이전트용 작업 프롬프트도 제공하지만, 프로젝트 기억을 실제로 작성·검색·학습시키는 시스템은 아니다.
- **제작자가 의도한 정체성:** 코딩 에이전트가 세션을 넘나들며 code-grounded wiki를 읽고 보강하고, 거버넌스가 오래되거나 미검증인 지식을 걸러 재탐색과 컨텍스트 비용을 줄이는 지속적 프로젝트 메모리 계층이다.
- **둘의 일치도:** **58/100**
- **독립 패키지로서의 정당성:** **68/100**
- **지금 공개 가능 여부:** **Conditional Go**
- **가장 중요한 한 문장:** 현재 제품은 “자가발달하는 프로젝트 메모리”가 아니라, 그것을 팀 규율로 운영할 때 필요한 **검증 가능한 메타데이터와 drift 경보를 제공하는 governance toolkit**이다.

### 실제 제품 구성 판정

가장 가까운 답은 **E. 결합**이다. 다만 결합의 무게중심은 분명히 B와 A에 있다.

| 요소 | 현재 구현 기여도 | 판정 |
| --- | ---: | --- |
| A. AI 작성 문서 lint/validation CLI | 25% | frontmatter, 링크, source path, evidence 형식·라인 범위, 민감정보, placeholder를 검사한다. |
| B. stale evidence와 인간 승인을 관리하는 governance layer | 50% | verified/needs_review 상태, review metadata, git drift, downgrade, strict CI가 가장 차별적인 구현이다. |
| C. 코딩 에이전트용 지속적 프로젝트 메모리 시스템 | 10% | Markdown 저장소와 adapter는 지속성을 제공하지만 검색·본문 retrieval·메모리 선택기는 없다. |
| D. 작업할수록 wiki가 발전하는 self-evolving workflow | 15% | feature/fix/docs-sync prompt와 skill은 있으나 실행과 의미적 갱신은 에이전트 준수에 의존한다. |

이 비율은 README의 비전이 아니라 공개 API와 실제 side effect 기준이다. 공개 command map은 검증·보고·scaffold·prompt 생성 중심이다(`src/index.js:104-123`). 의미적 문서 보강은 `buildHandoff`와 `buildTaskPrompt`가 외부 에이전트에게 지시할 뿐이다(`src/commands.js:1595-1665`, `src/task-prompts.js:58-123`).

## Capability matrix

| 의도한 가치 | 구현 수준 | 근거 | 사용자에게 보이는 정도 | 개선 필요성 |
| --- | --- | --- | --- | --- |
| wiki scaffold 생성 | **Fully implemented** | `initCommand`/ `initWrite`가 프로젝트 유형별 문서, adapter, config, 선택적 skill을 생성하며 모든 문서를 `needs_review`로 둔다(`src/commands.js:875-891, 966-1085`). E2E에서 15 wiki 문서와 총 26개 artifact 생성. | 높음 | scaffold 수와 품질을 프로젝트 크기에 맞게 줄일 옵션이 필요하다. |
| 실제 코드 기반 문서 작성 | **Instruction/prompt only** | scaffold body는 일반 placeholder다(`src/commands/doc-templates.js:33-120`). 실제 코드 분석은 handoff가 에이전트에게 지시한다(`src/commands.js:1644-1652`). | quickstart 문구에서는 자동 파이프라인처럼 느껴질 수 있음 | 에이전트 실행 연동 또는 변경 근거를 수집하는 enrichment runner가 필요하다. |
| 기능 추가·수정 후 관련 wiki 갱신 | **Instruction/prompt only** | feature/fix/refactor prompt의 6~7단계가 wiki와 log 갱신을 요구한다(`src/task-prompts.js:73-83`). CLI는 코드 변경과 관련 문서를 매핑해 수정하지 않는다. | skill 사용 시 중간 | 실패 시 강제하거나 누락을 검출하는 change-impact rule이 필요하다. |
| 신규 페이지 생성과 기존 페이지 보강 | **Partially implemented** | init은 감지된 domain 문서와 누락 문서를 만들고 fix는 깨진 링크 대상 stub을 만든다(`src/commands.js:878-888`, `src/commands/fix-migrate.js:308-327`). 기존 페이지 의미 보강은 prompt뿐이다. | 중간 | 새 개념 발견→페이지 생성→index 연결을 실행 가능한 workflow로 만들어야 한다. |
| 페이지 관계와 색인 갱신 | **Partially implemented** | scaffold가 `related`를 채우고 graph가 related/Markdown/wiki link를 읽는다(`src/commands/wiki-graph.js:26-155`). graph는 관찰만 하며 index를 갱신하지 않는다. | graph 명령으로 보임 | orphan을 validation finding으로 승격하고 index/related 안전 갱신 기능이 필요하다. |
| 오래된 지식 탐지 | **Partially implemented** | verified 문서가 가리킨 git-tracked 파일의 review date 이후 commit을 찾는다. line evidence만 있을 때 line-range로 좁힌다(`src/commands/scans.js:359-476`, `src/git.js:7-33`). 의미적 stale, 미참조 코드, working-tree 변경, git 없는 환경은 놓친다. | 높음 | commit hash 기반 baseline과 changed-source→doc 역색인이 필요하다. |
| AI 수정 상태 기록 | **Partially implemented** | CLI write와 template override는 `needs_review`를 강제하고 prompt도 이를 요구한다(`src/commands.js:1006-1012, 1218-1246`). 외부 에이전트가 직접 `verified`와 임의 reviewer를 쓰는 것은 막지 못한다. | 높음 | signed reviewer identity 또는 PR approval 연계가 필요하다. |
| 인간 검증 | **Partially implemented** | `verified`에는 strict mode에서 `reviewed_by/reviewed_at`가 필요하다(`src/frontmatter.js:122-129`). 별도 verify 명령, 인증, diff review UI는 없고 사람이 YAML을 편집한다. | 개념은 높고 UX는 낮음 | review queue와 명시적 verify command/PR gate가 필요하다. |
| 검증 wiki를 다음 작업 입력으로 재사용 | **Partially implemented** | AGENTS/CLAUDE/Cursor adapter가 index를 먼저 읽게 하고 task skill이 관련 domain을 먼저 읽으라고 한다(`templates/adapters/*`, `src/commands/skills.js:72-93`). verified만 선택하거나 문서 본문을 반환하는 retrieval은 없다. | adapter 설치 시 중간 | `search_docs`, `get_doc`, status/evidence filter가 필요하다. |
| 실패·잘못된 수정 결과가 다음 cycle에 반영 | **Not implemented** | log/open questions를 기록하라는 prompt는 있으나 실패 결과를 구조화해 다음 prompt/retrieval 순위에 반영하는 코드가 없다. | 낮음 | feedback record, rejected claim, regression link와 다음 작업 주입이 필요하다. |
| benchmark/telemetry로 비용·속도 증명 | **Not implemented** | 저장소 전체 검색에서 token benchmark, telemetry, 비교 실험이 없다. | README에서 효익 주장은 보임 | 동일 작업 A/B benchmark와 opt-in local telemetry가 필요하다. |

## “자가발달하는 LLM wiki” 판정

자가발달을 “작업 결과가 자동 또는 검증 가능한 반자동 경로로 지식 구조에 반영되고, 실패 피드백까지 다음 cycle을 바꾸는 것”으로 정의하면 **현재는 구현되어 있지 않다**. 구현된 것은 다음의 세 조각이다.

1. 결정론적 scaffold와 domain 후보 감지.
2. 에이전트가 읽고 갱신하도록 하는 adapter/prompt/skill.
3. 사람이 승인한 문서가 가리키는 파일의 git drift 경보.

이 셋은 self-evolving workflow의 좋은 기반이지만, 연결 실행기는 없다. `skills.js`도 주석에서 “recognize-don't-run”이라고 명시하며 artifact만 쓴다(`src/commands/skills.js:1-10`). 따라서 현재 정직한 표현은 **“agent-maintained wiki workflow with governance”**이지 “self-evolving wiki”가 아니다.

## End-to-end evidence

### 저장소 자체

- `npm test`: **232/232 pass**, 0 fail, 약 20초. 핵심 테스트는 quickstart(`tests/verification.test.js:389`), prompt(`:510, 533`), evidence(`:1541-1598`), drift(`:1600-1788`), graph/stats(`:1806-1860`), skills(`:3644-3702`), MCP read-only surface(`tests/mcp.test.js:40-67`)를 포함한다.
- `npm run verify`: 테스트 232개와 `validate-frontmatter` 모두 통과; 저장소 wiki 47개 frontmatter finding 0.
- `node bin/llm-wiki.js audit --format json`: result `pass`, findings 0. 그러나 graph에는 47개 문서 중 **orphan 32개**가 있었다. orphan은 graph metric일 뿐 audit finding이 아니므로 pass를 막지 않는다.
- `node bin/llm-wiki.js stats --format json`: 47 docs, verified 17(36%), needs_review 30, enriched 100%, evidence coverage 100%, health 79. evidence coverage는 참조의 진실성이 아니라 non-empty `source_files|evidence` 여부다(`src/commands.js:1140-1164`).
- `node bin/llm-wiki.js drift`: drifted verified docs 0.
- `node bin/llm-wiki.js validate --strict`: pass, findings 0.
- `npm pack --dry-run --json`: 68 files, packed 186,550 bytes, unpacked 587,799 bytes. `bin`, `src`, `templates`, `rules`, `profiles`가 포함된다. 테스트와 `docs/llm-wiki`는 npm tarball에 포함되지 않는다.

### 격리 샘플 프로젝트

임시 git 저장소 `%TEMP%/llm-wiki-product-audit-4d48506bf2cf442eb9c94a040b6ad0ce`를 만들고 아래를 실행했다.

1. `quickstart --dry-run --type library --agent codex --skills`: 쓰기 없이 26개 artifact를 계획하고 handoff prompt를 출력.
2. `quickstart --write ...`: 26개 생성. 그중 wiki Markdown 15개, AGENTS adapter, config, Claude/Cursor/neutral task artifacts가 포함됐다. 모든 wiki는 `needs_review`.
3. `validate`: 11 warnings(placeholder 10 + project detection 1), exit 0.
4. `validate --strict`: 동일 finding의 result text는 `warning`이지만 strict exit code는 1. strict는 warning severity를 변환하지 않고 exit 정책에서 실패시킨다.
5. `stats --format json`: 미보강 scaffold인데도 source_files가 있어 evidence coverage **100%**, verified 0%, enriched 33%, health 44.
6. 생성 문서에 실제로 존재하지 않는 `src/index.js#symbol:DefinitelyMissing`를 evidence로 추가하고 사람 검증 metadata를 넣었다. `validate`는 evidence 관련 finding 없이 통과했다. validator가 symbol 문자열 형식과 source file 존재만 보고 symbol 존재는 검사하지 않기 때문이다(`src/commands/scans.js:248-303`; 테스트도 “symbol locator 수용”만 검증, `tests/verification.test.js:1541-1561`).
7. 문서 검증일을 2026-07-19로 commit하고 `package.json`을 2026-07-20 commit에서 변경했다. `drift`가 `evidence.stale` 1건을 찾았고 `drift --downgrade`가 해당 문서를 `verified → needs_review`로 바꾸고 `last_updated`를 갱신했다.
8. 이 과정에서 CLI는 stale 문서 내용을 고치거나 log/index를 갱신하지 않았다. 사람이 다시 에이전트를 실행하고 검토해야 cycle이 이어진다.

### npm 배포본

- `npm view llm-wiki-governance ...`: latest는 **1.16.1**, description은 저장소 `package.json`과 동일.
- registry tarball을 별도 임시 디렉터리에 풀어 현재 저장소의 68개 배포 파일과 비교했다. raw hash 차이는 일부 CRLF/LF 정규화뿐이었고, 줄바꿈 정규화 후 **content mismatch 0**이었다.
- 따라서 이 감사에서 “현재 저장소 구현”과 “npm 1.16.1 구현”은 의미상 동일하다. 단, `.github/actions/validate/action.yml`과 workflow는 npm tarball이 아니라 GitHub 저장소 표면이다.

## Value-chain analysis

| 연결 | 판정 | 이유 |
| --- | --- | --- |
| governed wiki → trusted project memory | **Plausible** | review state, reference existence, drift downgrade는 신뢰도를 높인다. 그러나 의미적 진실성, reviewer identity, 미참조 변경은 검증하지 않는다. |
| trusted project memory → reduced rediscovery | **Weak** | index와 adapter는 선택적 읽기를 유도하지만 실제 검색·본문 retrieval·verified filter가 없다. 에이전트가 규칙을 따르고 wiki가 충분히 잘 쓰였을 때만 성립한다. |
| reduced rediscovery → lower context/credit use | **Plausible as a hypothesis, unsupported as a result** | 요약 문서가 코드보다 짧다면 가능하지만 유지·검증·중복 읽기 비용을 포함한 측정이 없다. |
| lower context/credit use → faster and safer feature work | **Unsupported** | benchmark, task success rate, latency, token, defect 비교가 없다. 적은 컨텍스트가 정확도 향상을 보장하지도 않는다. |

전체 사슬은 **첫 화살표만 제품이 직접 강화**한다. 나머지는 좋은 wiki, adapter 준수, 올바른 retrieval, 측정이라는 외부 조건에 의존한다.

## 크레딧·토큰·컨텍스트 절약 평가

- **전체 저장소 대신 필요한 wiki 페이지를 선택적으로 읽게 하는가?** 지시 수준에서는 그렇다. index의 read order와 skill의 domain map이 관련 페이지를 먼저 읽게 한다(`src/commands/skills.js:72-93`). 하지만 선택 알고리즘이나 verified-only 강제는 없다.
- **retrieval 인터페이스가 있는가?** 실질적으로 없다. MCP tools는 `validate/audit/next/status/doctor/stats/graph/explain/handoff/prompt`뿐이다(`src/mcp/tools.js:41-130`). `search`, `list_docs`, `get_doc`, `get_related`가 없고 문서 본문을 반환하지 않는다. “MCP로 wiki를 query”라는 표현은 보고/점검을 query한다고 좁혀야 맞다.
- **AGENTS/CLAUDE/Cursor 연결:** 구현되어 있다. adapter 생성과 entrypoint 검사도 있다(`src/commands/adapters.js:16-99, 126-158`). 다만 기존 파일을 overwrite하지 않아 기존 정책과 자동 merge되지 않는다.
- **매 작업 후 축적 프로토콜:** feature/fix/refactor/docs-sync prompt에 명확히 적혀 있다(`src/task-prompts.js:73-123`). 실행·완료 검증은 없다.
- **원본 코드 재탐색 감소 메커니즘:** Markdown 요약, index, domain map이라는 간접 메커니즘뿐이다. 캐시, semantic search, code-to-doc 역색인, change impact map은 없다.
- **추가 token 위험:** 높다. 기본 library scaffold만 15개 문서를 만들었고 Claude adapter는 5개 문서를 고정 read order로 둔다. 저장소 자체는 47개 wiki 문서와 orphan 32개를 보유한다. wiki와 코드를 함께 읽거나 stale 여부를 확인하면 오히려 컨텍스트가 늘 수 있다.
- **측정 자료:** 없다. “fewer tokens/credits”, “faster”, “fewer errors”는 현재 **검증되지 않은 제품 가설**이다. 구현상 가능한 메커니즘이라고만 말할 수 있다.

## 기능 작업 한 cycle의 실제 강제 수준

| 단계 | 실제 주체 | 강제 수준 |
| --- | --- | --- |
| 기존 wiki/index 읽기 | 에이전트 | adapter/skill/prompt 지시. CLI가 읽기 완료를 확인하지 않는다. |
| 관련 문서와 파일 찾기 | 에이전트 | domain map과 graph가 보조. 자동 retrieval 없음. |
| 기능 구현 | 에이전트/개발자 | 패키지 범위 밖. |
| wiki와 log 갱신 | 에이전트/개발자 | prompt-only. 변경 코드와 관련 wiki가 함께 바뀌었는지 CI rule 없음. |
| evidence/frontmatter/link 검사 | CLI | 코드로 구현. strict 여부에 따라 CI 실패 가능. |
| stale 탐지 | CLI + git history | verified 문서와 참조된 commit history에 한해 구현. working tree와 의미 변경은 미검출. |
| 인간 검증 | 사람 | YAML status/reviewer를 수동 수정. 인증·승인 UI 없음. |
| 다음 세션 재사용 | 에이전트 | adapter가 index를 먼저 읽도록 지시. verified만 골라 읽지는 않는다. |
| 잘못된 결과 학습 | 없음 | log/open question 기록 권고 외 자동 feedback loop 없음. |

특히 pre-commit 시점의 source 변경은 아직 commit history에 없으므로 `fileChangedSince`가 잡지 못한다(`src/git.js:13-15`). `validate --changed`도 “바뀐 finding path”만 남기므로 source file 변경으로 관련 wiki 누락을 찾는 기능이 아니다(`src/commands.js:607-626`). 같은 날짜의 commit은 review 시각이 없어 그 날 23:59:59까지 검증이 덮는 것으로 간주한다(`src/git.js:7-15`). 이 경계는 false positive를 줄이지만 review 이후 같은 날 변경을 놓친다.

## 이름과 설명 평가

### 현재 표면

- 패키지명: `llm-wiki-governance`
- README H1: `LLM-WIKI Governance`
- npm description: “Governance for AI-written project docs: verify, catch drift, keep them code-grounded, enforce in CI. OKF-compatible, zero-dependency.”

### 용어별 정확도

| 표현 | 판정 |
| --- | --- |
| governance | **정확함.** 가장 강한 구현과 이름이 일치한다. |
| llm-wiki | **대체로 정확함.** Markdown corpus, scaffold, graph, adapters가 있다. 단, LLM 자체는 포함하지 않는다. |
| self-evolving | **과장.** 실행/학습 loop가 없고 prompt 준수에 의존한다. 현재 주요 description에는 없어 다행이다. |
| project memory | **용도 설명으로만 가능.** 제품 자체가 memory retrieval system은 아니다. |
| code-grounded | **부분 과장.** 파일·라인 참조 검사는 하지만 evidence가 optional이고 빈 source_files도 유효하며 symbol/section/route 의미는 검사하지 않는다. |
| credit/token efficiency | **주장 금지.** mechanism hypothesis만 있고 측정이 없다. |
| agent workflow | **부분적으로 정확.** adapter/prompt/skill을 생성하지만 agent를 실행하거나 결과를 확인하지 않는다. |

현재 이름과 H1은 유지할 만하다. npm description의 `verify`는 “사람 승인을 관리한다”는 뜻으로 읽히지만 의미적 사실 검증으로 오해될 수 있고, `keep them code-grounded`도 강하다.

### 권장 문구

- **npm description (120자 이내):** `Governance CLI for AI-maintained project wikis: review states, reference checks, git drift alerts, and CI.`
- **GitHub repository description:** `Review-state, evidence-reference, and git-drift governance for AI-maintained Markdown project wikis.`
- **README H1 아래 한 문장:** `A zero-dependency CLI that scaffolds and validates agent-maintained project wikis, tracks human review state, and flags git-based evidence drift.`
- **Reddit용 한 문장:** `I built a CLI that gives an AI-maintained Markdown project wiki review states, reference checks, and git-based stale warnings—without pretending it verifies the prose itself.`
- **가장 정확한 category label:** **AI-maintained documentation governance CLI**

## Launch-post recommendation

### 노출 점수

| 가치 | 점수(0~10) | 평가 |
| --- | ---: | --- |
| stale 문서 탐지 | 9 | 핵심 문제와 drift/downgrade가 선명하다. |
| human verification | 9 | needs_review/verified와 self-promotion 금지가 명확하다. |
| code-grounded evidence | 8 | 노출은 강하지만 “every claim”과 symbol 검증 표현이 구현보다 앞선다. |
| 지속적 프로젝트 메모리 | 4 | wiki use case로만 짧게 등장한다. |
| 작업할수록 개선되는 wiki | 3 | skill/dogfood 언급은 있으나 loop 설명이 없다. |
| 반복 코드 탐색 감소 | 4 | MCP 문장 한 번이며 실제 retrieval 도구가 없어 과장이다. |
| 컨텍스트·크레딧 효율 | 2 | 직접 설명·측정이 없다. 오히려 이 점은 현재 정직하다. |
| 기능 추가·수정 생산성 | 2 | use case나 workflow outcome을 입증하지 않는다. |
| Claude Code/Codex/Cursor 간 재사용성 | 6 | 도구 이름은 나오지만 동일 wiki를 어떻게 공유하는지 구체성이 약하다. |

독자가 “고급 Markdown lint 도구”로만 이해할 위험은 **6/10**이다. stale/human gate가 일반 link checker보다 강하므로 10은 아니지만, 실제 실행 기능의 대부분이 scan/report이고 memory retrieval은 없어서 그 인상이 완전히 틀린 것도 아니다.

### 판정

**현재 초안은 폐기할 필요는 없지만, 공개 전 대폭 수정해야 한다.** 다음을 고쳐야 한다.

- “every doc/claim ties to real code” → “docs can declare source/evidence references; the CLI checks their shape and target file/line existence.”
- “agent can query the wiki instead of re-reading the codebase” → “agent can query governance reports and graph metadata over MCP.” 현재 MCP는 본문 retrieval을 하지 않는다.
- “From then on the tool keeps them honest” → “the tool flags reference drift; humans/agents still update the prose.”
- symbol existence와 의미적 truth를 검증하지 않는 한계를 명시한다.
- token/속도 절감은 결과가 아니라 검증할 가설로 둔다.

### 권장 Reddit 본문

**Title:** I built a governance CLI for AI-maintained project wikis—what should it verify beyond git drift?

I keep a Markdown project wiki for coding agents so knowledge can survive across sessions. The useful part is persistence; the dangerous part is that stale prose can look authoritative.

`llm-wiki-governance` is a zero-dependency Node CLI for that governance problem. It scaffolds `docs/llm-wiki` plus agent instruction files, keeps CLI/agent-edited docs at `needs_review`, checks frontmatter, links and declared source/evidence references, and flags a verified document when referenced git-tracked code changed after its review date. A human can then update it or run `drift --downgrade`.

It also generates feature/fix/docs-sync prompts for Claude Code, Codex and Cursor. Those prompts tell the agent to read the wiki first and update it with the code. Important limitation: the CLI does not write the source-grounded prose, verify that prose is semantically true, or prove token savings. Its MCP server exposes governance reports and graph metadata, not semantic document search.

```bash
npx llm-wiki-governance@latest quickstart --dry-run --type library --agent claude
npx llm-wiki-governance@latest quickstart --write --type library --agent claude
npx llm-wiki-governance@latest validate --strict
```

I have dogfooded it and am looking for the next hard requirement: should a tool like this prioritize change-impact mapping, verified-only retrieval, or review workflow integration?

## 경쟁 대안과 독립 패키지 정당성

| 대안 | 지속성 | 신뢰성/자동화 | agent 독립성 | human review | 도입 비용·token overhead | llm-wiki-governance 대비 |
| --- | --- | --- | --- | --- | --- | --- |
| CLAUDE.md | git에 지속 | 행동 지시뿐, stale 검출 없음 | 낮음 | 없음 | 매우 낮음 | 본 패키지는 상태·drift·CI가 강하지만 Claude 전용 단순성은 못 이긴다. |
| AGENTS.md | git에 지속 | 행동 지시뿐 | 중간 | 없음 | 매우 낮음 | 본 패키지는 공통 corpus와 검증을 추가하지만 문서량이 늘어난다. |
| Cursor Rules | git에 지속 | Cursor에서 자동 주입 | 낮음 | 없음 | 낮음 | 본 패키지는 multi-agent 규칙과 governance에 유리하다. |
| 일반 Markdown/wiki | 높음 | 수동, 의미 품질은 사람 의존 | 높음 | 자유롭게 가능 | 낮음~중간 | 본 패키지는 계약·상태·drift를 표준화한다. |
| link checker | 높음 | 링크 존재 자동화 | 높음 | 없음 | 낮음 | evidence drift와 review state가 본 패키지의 명확한 우위다. |
| custom CI script | 조직에 따라 높음 | 필요한 만큼 강함 | 높음 | 구현 가능 | 초기 개발비 높고 이후 맞춤성 높음 | 이 패키지는 즉시 쓰는 공통 규칙/보고/API가 장점이다. 대형 팀은 결국 custom integration이 필요할 수 있다. |
| MCP 프로젝트 검색 | 세션/인덱스에 따라 | 코드 retrieval 자동화 | MCP client 범위 | 보통 없음 | query token은 들지만 최신 코드에 직접 근거 | 본 패키지는 저장된 지식과 승인 상태가 강점, 검색 자체는 크게 약하다. 상호 보완 관계다. |
| RAG/code search | index 지속 | 최신 코드 검색·ranking | 도구에 따라 | 보통 없음 | 인프라/embedding 비용, 재해석 token | 본 패키지는 작고 audit-friendly하나 정확한 retrieval과 freshness coverage가 약하다. |
| “매 작업 후 docs 수정” 단순 prompt | git에 지속 | agent 준수 의존 | 높음 | 수동 가능 | 거의 0 | 본 패키지의 독립 가치는 schema, drift, downgrade, CI, graph, report API에 있다. 이것들이 필요 없으면 단순 prompt가 낫다. |

brownfield 적용성은 scaffold/adapter가 기존 파일을 보존하고 Markdown을 사용한다는 점에서 좋다. 반대로 15개 이상 문서 scaffold, Node runtime, strict CI 설정, 인간 review 운영은 도입 비용이다. **독립 패키지의 존재 이유는 “project memory 생성”이 아니라 서로 다른 agent가 쓰는 문서에 공통 trust-state와 drift contract를 주는 것**이다.

## 가장 강한 실패 이유

### 1. 의미적 갱신과 self-evolution이 prompt 준수에 의존 — Critical

- **근거:** `task-prompts.js:73-123`은 읽기·코드 변경·wiki/log 갱신을 지시하지만 실행하지 않는다. `skills.js:1-10`도 artifact만 쓴다고 명시한다.
- **영향:** 에이전트가 wiki를 빼먹거나 잘못 고쳐도 “작업할수록 발전”하지 않는다. 핵심 의도와 가장 큰 간극이다.
- **완화 가능성:** 높음. git diff로 changed source→reverse evidence map을 만들고, 관련 wiki가 같은 PR에서 갱신되지 않으면 finding을 내는 것부터 시작할 수 있다.

### 2. “code-grounded/verified”가 의미적 truth를 보장하는 것처럼 보임 — Critical

- **근거:** evidence는 optional이고 schema의 `source_files`는 빈 배열도 허용한다(`src/frontmatter-schema.js:7-44`). symbol/section/route는 source file 존재만 확인한다(`src/commands/scans.js:248-303`). E2E의 존재하지 않는 symbol도 통과했다.
- **영향:** 형식적으로 깨끗하지만 내용이 틀린 문서가 verified가 될 수 있다. 잘못된 기억을 더 신뢰하게 만드는 역효과가 가능하다.
- **완화 가능성:** 중간. AST/language server 기반 locator 확인, claim-evidence diff review, “reference-checked, not truth-verified” 용어 분리가 필요하다.

### 3. 다음 세션 retrieval이 없어 memory 가치가 약함 — High

- **근거:** MCP tool 목록에 문서 검색/본문 읽기가 없다(`src/mcp/tools.js:41-130`). graph도 metadata/edge만 반환한다. adapter는 index/read order 지시뿐이다.
- **영향:** 사용자는 결국 파일 검색 또는 코드 검색을 따로 해야 한다. “MCP로 wiki를 query해 repo 재탐색 감소” 주장이 성립하지 않는다.
- **완화 가능성:** 높음. read-only `list_docs/search_docs/get_doc/get_related`와 status/visibility/evidence filter를 추가할 수 있다.

### 4. drift에 중요한 blind spot과 기본 CI 비강제성이 있음 — High

- **근거:** git log의 commit만 검사하므로 working-tree 변경을 놓친다(`src/git.js:13-15`). 같은 날짜 변경은 end-of-day 기준으로 덮는다. git 실패는 조용히 false다(`src/commands/scans.js:402-467`). `evidence.stale` 기본 severity는 warning이고 standard validate는 exit 0이다. composite action의 `strict` 기본값도 false다(`.github/actions/validate/action.yml`).
- **영향:** 가장 필요한 “코드와 wiki가 함께 바뀌는 PR”에서 누락을 잡지 못하거나 CI를 통과시킬 수 있다.
- **완화 가능성:** 높음. review commit SHA 저장, working-tree/PR base diff 검사, strict governance preset, stale 기본 error 옵션을 제공한다.

### 5. 절감·생산성보다 유지 비용이 커질 수 있고 증거가 없음 — High

- **근거:** 기본 library E2E는 wiki 15개를 생성했고 10개가 placeholder였다. 저장소 자체는 47개 중 30개 needs_review, orphan 32개다. benchmark/telemetry가 없다.
- **영향:** 작은 저장소는 wiki와 코드의 이중 유지, 인간 gate, 추가 읽기 때문에 더 느려질 수 있다.
- **완화 가능성:** 중간. minimal-by-default, task-based lazy pages, A/B benchmark, token/latency/defect 측정이 필요하다.

추가 위험으로는 수동 reviewer metadata를 누구나 쓸 수 있다는 점, 사람 gate의 병목, Node 설치가 비-JS 팀에 주는 심리적 비용, 47개 문서 graph orphan이 audit pass에 영향을 주지 않는 점이 있다.

## 가장 강한 채택 이유

가장 가치가 큰 대상은 다음 조건을 동시에 많이 만족하는 팀이다.

- Claude Code, Codex, Cursor 등 여러 agent를 번갈아 사용하며 tool-specific instruction만으로는 공통 지식 규율이 부족한 팀.
- 수개월~수년 유지되는 중대형 git 저장소로, 아키텍처·도메인·운영 규칙의 재발견 비용이 큰 팀.
- 잘못된 내부 문서가 사고·보안·호환성 문제로 이어져 “누가 언제 검토했는가”와 stale 경보가 필요한 팀.
- Markdown-in-git, PR, strict CI, 인간 review를 이미 자연스럽게 사용하는 팀.
- RAG/code search를 대체하려는 팀이 아니라, 그 위에 사람이 승인한 요약·결정 지식의 trust layer를 추가하려는 팀.

채택 이유는 기능 수가 아니다. **일반 prompt나 AGENTS.md만으로는 제공하지 못하는 review state + evidence reference + git drift + downgrade + 공통 CI contract를 한 패키지로 얻는 것**이다.

사용하지 않아도 되는 대상:

- 한 명이 한 agent로 짧게 만드는 소형/단기 저장소.
- 코드 검색이 빠르고 문서 오류 비용이 낮은 프로젝트.
- wiki를 검토할 사람이나 PR/CI 운영 의지가 없는 팀.
- 최신 소스 retrieval이 핵심이고 durable 요약 문서가 필요 없는 팀.
- 이미 custom docs governance와 code-to-doc impact tooling을 보유한 조직.

## Positioning recommendation

### 현재 구현으로 정직하게 주장할 수 있는 것

- AI-maintained Markdown wiki용 zero-dependency governance CLI.
- `needs_review/verified` 상태와 review metadata 계약.
- frontmatter, 링크, source/evidence 참조 형식·파일·라인 범위 검사.
- verified 문서가 참조한 git-tracked 파일의 날짜 기반 drift 경보와 opt-in downgrade.
- scaffold, multi-agent adapter, repeatable task prompt/skill 생성.
- read-only governance reports/graph를 제공하는 MCP 및 programmatic API.
- strict 설정 시 CI에서 warning을 실패로 처리할 수 있음.

### 아직 주장하면 안 되는 것

- self-evolving/autonomous wiki.
- 모든 claim의 의미적 사실성 검증.
- MCP semantic retrieval 또는 agent가 wiki 본문을 query한다는 표현.
- token/credit 절감, 더 빠른 기능 개발, 오류 감소가 입증됐다는 주장.
- 변경된 코드와 관련 wiki가 항상 함께 갱신된다는 보장.
- human identity가 인증된 approval/audit trail이라는 주장.

### 검증 후 주장할 수 있는 것

- benchmark에서 repo scan 대비 input token/latency가 감소하면 context efficiency.
- 동일 feature/fix task에서 성공률·결함·수정 횟수가 개선되면 faster/safer development.
- search/get MCP와 verified-only filter가 생기면 agent-queryable project memory.
- changed-source reverse map과 wiki update gate가 생기면 continuously maintained workflow.
- reviewer identity/PR approval 연계가 생기면 auditable human verification.

## Top 5 product changes

1. **Changed-source → wiki reverse impact gate:** source_files/evidence 역색인을 만들고 git diff의 변경 소스가 가리키는 verified 문서를 즉시 stale 후보로 표시한다. working tree와 PR base를 지원하고 review date 대신 commit SHA를 기준으로 한다.
2. **실제 read-only retrieval API/MCP:** `list_docs`, `search_docs`, `get_doc`, `get_related`, `get_context_for_task`를 추가하고 status/visibility/project/domain filter 및 token budget을 제공한다.
3. **Agent update runner와 completion contract:** feature/fix/docs-sync skill 실행 후 changed code, affected docs, log update, validation을 구조화된 manifest로 남기고 CI가 누락을 검출하게 한다. 의미 작성은 agent가 하되 pipeline은 제품이 책임진다.
4. **Evidence semantic strength 단계화:** `reference_checked`와 `human_verified`를 구분하고, 지원 언어부터 symbol/route/section 존재를 실제 검사한다. 빈 evidence/source_files와 “verified인데 근거 없음”을 strict governance preset에서 실패시킨다.
5. **효율성 benchmark와 minimal adoption path:** 대표 brownfield 저장소에서 no-wiki vs governed-wiki의 tokens, latency, source files opened, task success, stale-error rate, human maintenance minutes를 비교한다. scaffold는 minimal/lazy를 기본으로 재설계한다.

## 최종 판단

`llm-wiki-governance`는 단순 link checker보다 분명히 강하고, “AI가 쓴 문서를 곧바로 신뢰하지 않는다”는 제품 원칙은 코드에 실제로 반영되어 있다. 특히 verified 문서의 git drift와 downgrade, CLI가 스스로 verified를 만들지 않는 guardrail, read-only MCP surface, preview-first writes는 일관되고 테스트도 충분하다.

그러나 궁극적 가치 사슬의 중심인 **지속적 프로젝트 메모리 → 선택적 재사용 → 재탐색/비용 감소 → 기능 작업 향상**은 아직 제품이 직접 수행하지 않는다. 현재는 사용자가 agent prompt, Markdown 편집, human review, CI 설정을 성실히 운영할 때 그 효과가 생길 수 있는 구조다. 따라서 공개 자체는 가능하지만, 런치 메시지는 governance에 고정하고 self-evolving, semantic truth, MCP retrieval, token/productivity 효과를 선행 주장해서는 안 된다.

**Conditional Go 조건:** launch copy의 과장 세 군데(every claim, MCP query, keeps honest)를 수정하고, README의 token 절감 문구를 가설로 낮추며, 다음 핵심 release를 reverse impact detection과 retrieval에 집중한다.
