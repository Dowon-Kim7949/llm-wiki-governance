---
title: Impact Measurement Baseline
tags:
  - llm-wiki
  - benchmark
  - verified
status: verified
doc_type: reference
project: llm-wiki-governance
last_updated: 2026-07-31
author: ai-generated
last_edited_by: Claude Code
reviewed_by: Dowon-Kim
reviewed_at: 2026-08-03
wiki_block_version: v1
source_files:
  - bench/run.js
  - bench/lib/strategies.js
  - bench/tasks.json
  - bench/tasks-csap.json
  - bench/real/runner.js
  - bench/real/make-stub-wiki.mjs
  - bench/real/aggregate.mjs
  - bench/results/baseline.json
  - bench/results/current.json
  - bench/results/real-driver-csap-sdk-2026-07-24.md
  - bench/results/real-driver-csap-sdk-empty-control-2026-07-27.md
  - bench/results/real-driver-csap-sdk-empty-control-2026-07-27-grading.md
  - bench/results/real-driver-csap-sdk-empty-control-2026-07-27-ratification.md
evidence:
  - bench/run.js
  - bench/lib/strategies.js#symbol:strategyWikiGrounded
  - bench/lib/strategies.js#symbol:strategyWikiRetrieval
  - bench/real/runner.js#symbol:assertControlPromptParity
  - bench/results/baseline.md
  - bench/results/current.md
  - bench/results/real-driver-csap-sdk-2026-07-24.md
  - bench/results/real-driver-csap-sdk-2026-07-24-grading.md
  - bench/results/real-driver-csap-sdk-empty-control-2026-07-27.md
  - bench/results/real-driver-csap-sdk-empty-control-2026-07-27-grading.md
  - bench/results/real-driver-csap-sdk-empty-control-2026-07-27-ratification.md
  - GATE_REVIEW.md#section:Impact Measurement Scope Decision
related:
  - docs/llm-wiki/project-profile.md
  - GATE_REVIEW.md
  - ROADMAP.md
visibility: internal
contains_sensitive_info: false
---

# Impact Measurement Baseline

이 문서는 Gate 22(Impact Measurement, `GATE_REVIEW.md` accepted)의 결과 기록이다.
"거버넌스 코어는 실재하나 가치 사슬(durable memory → 재발견 감소 → 토큰 절감)은 아직
입증되지 않았다"는 product-identity 감사 결론에 대응해, **feature 게이트를 더 쌓기 전에**
위키가 실제로 코드 작업 컨텍스트를 줄이는지 측정하는 재현 가능·zero-dep·repo-내부
harness(`bench/`)를 만들고 베이스라인을 남긴 것이다. 이 도구는 npm `files` allowlist 밖이라
배포되지 않는다. 방법론과 한계는 [`bench/METHODOLOGY.md`](../../bench/METHODOLOGY.md), 자동
생성 결과는 [`bench/results/baseline.md`](../../bench/results/baseline.md)를 참조.

## 무엇을 쟀나 · What is measured

대표 질문 6개(detector·audit 파이프라인·config 병합·rule 토글·skill 생성·MCP)에 답하려면
관련 소스를 **찾아 읽어야** 하고, 그 읽기가 입력 컨텍스트(토큰)다. harness는 그 컨텍스트
비용의 **결정적 프록시**를 5가지 방식으로 잰다(LLM 미실행):

- **A0 whole-repo** — 모든 `src` 파일 통독(순진한 상한).
- **A1 grep-full** — 위키 없이 질문의 cold 키워드로 grep해 매칭 파일을 통독.
- **A2 grep-snippet** — 같은 grep 히트지만 매치 주변 ±40줄만 읽는 **보수적(위키에 가장 불리한)** 코드-only 하한.
- **B wiki-grounded** — 위키 오리엔테이션 문서를 먼저 읽고, 그 문서가 키워드에 대해 가리키는 evidence 포인터의 **소스**를 통독(**pre-retrieval** 위키 모델).
- **B2 wiki-retrieval** *(Gate 24)* — 소스 재독 대신 위키를 질의: `search-docs`로 검색해 상위 매칭 **문서 본문**을 `get-doc`으로 읽음. `B2 vs B`는 같은 코퍼스라 retrieval 메커니즘만 분리한다(아래 전용 절).

B의 대상 파일은 **정답 키가 아니라 위키 본문에서 파생**되므로, 위키의 evidence 포인터가
불완전하면 B는 실제로 대상 파일을 못 찾아 `success=false`가 된다(비순환·정직).

## 베이스라인 헤드라인 · Baseline (2026-07-21)

측정 대상: 소스 29파일 83,262 tokens, 오리엔테이션 6문서 12,761 tokens(세션당 1회),
전체 위키 코퍼스 47문서 67,698 tokens(작성·유지 비용, 공개하되 태스크당 미부과).
추정기: `chars/4`(절대값은 근사, arm 간 **비율**은 divisor가 상쇄되어 견고).

세션(6태스크; A0/A1/A2는 태스크마다 재독, B는 오리엔테이션 1회 후 대상만):

| arm | tokens | vs B |
| --- | ---: | ---: |
| A0 whole-repo | 499,572 | — |
| A1 grep-full | 386,912 | B = 0.59x (−41%) |
| A2 grep-snippet (보수적 하한) | 256,649 | B = 0.89x (−11%) |
| **B wiki-grounded** | **228,648** | — |

- **탐색 성공률: 위키 100% vs grep 100% 동률.** 이 레포·이 태스크에서는 grep도 정답 코드를
  찾았으므로, 베이스라인이 보여주는 위키의 이점은 **탐색(findability)이 아니라 컨텍스트
  크기**다.
- **정직한 불리 결과(요구대로 보고):** 보수적 A2 대비 **단일 태스크 3/6에서 위키가 더 비싸다**
  (config-merge +37%, skill-generation +41%, mcp-tools +43%). 위키가 큰 파일을 가리켜 통독하는데
  snippet-grep은 매치 창만 읽기 때문. 세션에서 위키가 앞서는 11%는 전적으로
  오리엔테이션 비용의 **분할상환** 덕이다 — 1~2태스크짜리 세션이면 A2가 이긴다.

## Gate 24 재측정 · Re-measurement after retrieval shipped (2026-07-21)

Gate 24(읽기 전용 retrieval, 1.18.0) 배포 후 `node bench/run.js --against bench/results/baseline.json`으로
재측정했다(baseline.json은 "before" 기준이라 덮어쓰지 않음). 결과는 **정직하게 불리**하다:

| arm | baseline (Gate 22) | 재측정 (Gate 24 후) | 이동 |
| --- | ---: | ---: | ---: |
| B vs A1 (session) | 0.59x (−41%) | 0.69x (−31%) | 이점 축소 |
| **B vs A2 (보수적 하한)** | **0.89x (−11%)** | **1.05x (+5.3%)** | **역전 — 이제 위키가 더 비쌈** |
| B wiki-grounded total | 228,648 | 294,783 | +29% |
| 오리엔테이션(1회) | 12,761 | 14,441 | 코퍼스 성장 |
| 전체 위키 코퍼스 | 47문서 67,698 | 50문서 75,512 | 성장 |

- **왜 나빠졌나:** 위키가 커지며 더 많은 소스를 가리키자, 전략 B의 **대상 소스 통독**이 늘었다(215,887→280,342).
  A2는 매치 창만 읽으므로, 위키가 성장할수록 "대상 파일을 통독하는" B 모델은 보수적 하한 대비 상대적으로 불리해진다.
- **핵심(정직):** 이 재측정은 **retrieval 메커니즘이 아니라 코퍼스 드리프트**를 잰 것이다. harness의 전략 B는
  대상 **소스**를 통독할 뿐 Gate 24의 `get_doc`/`search_docs`를 **호출하지 않는다**. 즉 raw 재실행만으로는 로드맵이 원한
  **"retrieval 전/후 델타"를 만들 수 없다.** 이를 위해 아래의 retrieval-aware 전략 `B2_retrieval`을 추가했다(다음 절).
- **재측정 결론:** raw 재실행만으로는 Gate 24의 가치를 보일 수 없다(오히려 드리프트로 불리하게 보인다). retrieval 델타는
  아래 `B2_retrieval` 절에서 측정한다. README/런치 토큰·속도 주장은 그 측정이 나온 뒤에도 **여전히 금지**다(아래 규율 — 실제 LLM 실측 전까지).

## B2 retrieval 델타 · Retrieval mechanism, measured (2026-07-21)

위 재측정이 드리프트만 보이는 문제를 풀기 위해 harness에 다섯 번째 arm **`B2_retrieval`**을 추가했다. B2는 Gate 24
메커니즘을 그대로 모델링한다: 소스를 다시 읽는 대신 **위키를 질의**한다 — 배포된 `search-docs`(zero-dep 키워드/AND,
`src/commands/retrieval.js`와 **동일 스코어링**)를 돌리고 상위 매칭 **문서 본문**을 `get-doc`으로 읽는다(소스 재독 없음).
append-only `log.md`는 검색은 되지만 get-doc하지 않는다(체인지로그이지 서브시스템 설명이 아님 — 명시). B2가 읽는 문서 수는
공개 파라미터 `retrievalGetDocs`(기본 2)다.

**핵심: B2와 B는 같은 코퍼스·같은 태스크에서 돌므로, `B2 vs B`는 코퍼스 드리프트를 상쇄하고 retrieval 메커니즘만 분리한다**
— raw `--against`가 못 하던 바로 그 "전/후 델타"다.

현재 실행(소스 30파일 91,555 tokens, 위키 50문서 ~77k tokens; 정확 수치·태스크별 표는 자동 생성
[`bench/results/current.md`](../../bench/results/current.md)):

| arm | session tokens | vs B2 |
| --- | ---: | ---: |
| A0 whole-repo | 549,330 | — |
| A1 grep-full | 425,138 | — |
| A2 grep-snippet (보수적 하한) | 280,064 | — |
| B wiki-grounded (pre-retrieval, 소스 통독) | 294,783 | — |
| **B2 wiki-retrieval (Gate 24)** | **54,586** | — |

- **B2 vs B = 0.19× (−81.5%)** — retrieval 델타(같은 코퍼스, 드리프트 상쇄). 위키 본문을 읽는 게 위키가 가리키는 소스를
  통독하는 것의 약 1/5 비용이다. **이것이 메커니즘 자체의 효과**다.
- **B2 vs A2 = 0.19× (−80.5%)** — retrieval은 보수적 snippet-grep 하한도 이긴다. pre-retrieval arm B는 이 하한에 **졌었다**
  (1.05×). 즉 토큰 이점이 "통독 대비"에서 "규율 있는 snippet 읽기 대비"로 넘어왔다.
- **B2 grounding success = 100%** — 6/6 태스크에서 상위 매칭 문서 본문이 ground-truth 소스를 **모두 참조**했다(에이전트를
  코드를 열지 않고도 정확한 파일로 grounding). 민감도: **K=1**(최상위 1문서만)에서도 100%이고 토큰 이점은 더 크다 —
  기본 K=2는 더 비싼·보수적 선택이다.
- **정직 caveat(범위):** B2의 success는 **grounding 프록시**(위키가 올바른 코드를 가리키고 설명함)이지, 에이전트가 소스를
  전혀 안 열고 수정을 끝낸다는 뜻이 아니다. 최종 편집은 여전히 그 한 파일을 열 수 있다 — B2는 위키가 없애 주는 **재발견/오리엔테이션
  비용**을 재는 것이지 작업 전체가 아니다. 또한 `chars/4` 프록시·단일 자기참조 레포·top-K 순진 랭킹은 [`bench/METHODOLOGY.md`](../../bench/METHODOLOGY.md)
  §8의 한계 그대로다.
- **결론:** raw 재실행이 드리프트로 불리해 보였던 것과 달리, retrieval을 **직접 모델링하면** 큰(−80% 규모) 토큰 감소가 정직하게
  드러난다. 그럼에도 이는 결정적 토큰 프록시이지 실제 LLM 실측이 아니므로 README/런치 토큰·속도 주장은 **여전히 금지**다.

## 실측 · Real-LLM measurement (external project, N=3, 2026-07-22)

`chars/4` 프록시를 넘어 **실제 LLM 실행**으로 처음 측정했다. 대상은 외부 대표 프로젝트
`csap-roadkeeper-frontend`(Vue3/Quasar, 브랜치 `aws-global`; 위키는 1.19로 구축·0% verified),
드라이버는 Claude Code Explore 서브에이전트(**Opus 4.8**), 6개 cold-keyword 코드이해 태스크
× 2 arm(B=소스만, B2=위키 retrieval) × **N=3**. 서브에이전트별 실제 토큰·wall-clock을 캡처했다
(단일 total 토큰; 프로덕트 MCP가 아닌 CLI `search-docs`/`get-doc` 경로). **csap 저장소는 무변경**
(위키 드리프트 수정본은 job tmp의 스크래치 복사본에서만).

- **최신(de-drifted) 위키, N=3:** B2 = 0.90× 토큰(**−10%**), 0.95× wall(−5%), **정확도 18/18 동률**,
  B2는 **전부 위키만으로 응답(소스 fallback 0)**. 태스크 의존적: auth 0.76×·hazard 0.67× 승,
  routing 1.17× 패(소스가 파일 2개뿐), api/session/state ≈ 무승부. B2가 B보다 변동이 작다.
- **stale(as-built 1.19) 위키:** B2가 보안상 **오답**(로그인 비밀번호 평문이라 주장; 실제 aws-global
  소스는 RSA-OAEP 클라이언트 암호화)을 냈고, hazard 문서 드리프트로 소스 fallback 발생 → B2 5/6.
  두 드리프트 모두 이 도구가 `evidence.stale`/`source_files.missing`로 잡는 조건이었다.

**정직한 결론:** retrieval의 토큰 이득은 **실재하나 modest·태스크 의존**(−10%)이다. **결정적 가치는
효율이 아니라 신선도-종속 정확도** — stale 위키는 자신 있게 오답을 내고, 문서 최신화로 18/18 회복.
즉 verify·drift·`validate --changed` 거버넌스가 retrieval의 신뢰를 만든다. 상세·원자료:
`bench/results/real-driver-csap-aws-global-pilot-2026-07-22.md`.

## 실측 2 · Real-LLM, SDK 경로 + 블라인드 채점 (csap, N=3, 2026-07-24)

위 2026-07-22 실측의 두 가지 약점(서브에이전트 경로라 **input/output 토큰 미분리**, 정확도가
자기채점 위험)을 없앤 **두 번째 유료 실측**이다. 드라이버는 SDK 경로
`bench/real/agent.js`(Anthropic SDK `toolRunner`, 설계상 git-ignore — SDK dep 격리)를
[`bench/real/runner.js`](../../bench/real/runner.js)가 오케스트레이션하며, 호출별 실제 `usage`에서
**input/output 토큰을 분리**해 기록한다. 모델 `claude-opus-4-8`, 태스크는
[`bench/tasks-csap.json`](../../bench/tasks-csap.json)의 6개 cold-keyword 이해 태스크,
arm은 **B**(retrieval 없음: 자체 read/grep, 위키 차단) vs **B2**(retrieval: `search_docs`/`get_doc`/
`get_related` 우선), (task, arm, repeat)마다 새 세션, **N=3**(+ N=1 캘리브레이션). csap 저장소는 무변경.

**픽스처 건강도(실행 전 확인):** 대상 위키 `llm-wiki stats` = **22/22 verified · enriched 100% ·
evidence 100% · staleVerified 0**, `validate --strict` 0, `drift` 0. 2026-07-22 실행을 오염시켰던
드리프트(auth 평문 오답·hazard 매핑)가 **없는 깨끗한 픽스처**다.

| metric (18 runs/arm) | B (no-retrieval) | B2 (retrieval) | B2/B |
| --- | --: | --: | --: |
| **input tokens** | 856,410 | 441,521 | **0.516× (−48.4%)** |
| output tokens | 31,554 | 29,549 | 0.936× (−6.4%) |
| cost @ $5/$25 per 1M | $5.0709 | $2.9463 | 0.581× (−41.9%) |

- **인용은 보수적으로:** N=1+N=3 pooled(태스크당 4샘플) input B2/B = **0.593× (−40.7%)**. 이 pooled
  수치를 기본으로 인용한다. 태스크별 변동이 커(session-timeout B CV=59%, api-layer B CV=39%,
  auth-signin B2 CV=41%) **N=1은 부족**하다 — N=1만으로는 0.83×(−17%)였다. 항상 평균+분산을 함께 쓴다.
- **메커니즘 확인:** B는 매 태스크 ground-truth 소스를 직접 열었고(5–8 tool call), B2는 위키를 먼저
  질의해 **6개 중 3개(auth-signin·routing-map·hazard-domain)는 소스를 한 번도 안 열고** 답했다.
  나머지 3개는 소스 1–2개 fallback — 의도한 "위키 먼저, 필요할 때만 소스" 패턴 그대로다.
- **retrieval이 지는 케이스(공개):** routing-map은 **3.17×로 B2가 패배**한다. `src/router/routes.ts`가
  작아 B가 싸게 읽는 반면 B2는 위키 질의 비용을 내고도 소스를 연다. retrieval의 이득은
  **from-source 경로가 비쌀수록**(hazard-domain 0.24×, state-mgmt 0.29×) 커진다.

**정확도 — 블라인드 채점(arm 라벨 제거·태스크 내 셔플 후 루브릭 채점, 집계 시에만 arm 재결합):**

| metric (18 answers/arm) | B | B2 |
| --- | --: | --: |
| mean rubric-claim fraction | 0.910 | **0.971** |
| pooled claims | 62.5/69 (90.6%) | 66.5/69 (96.4%) |
| 환각·오파일 | **0** | **0** |

- **결론: 정확도는 동률~B2 소폭 우위 — retrieval에 정확도 패널티가 없다.** B2 우위는 state-mgmt
  (B 0.58 vs B2 0.96; B가 "bearer 토큰 없음/HTTP-only 쿠키"를 놓치고 `beforeEach` 가드를 오설명)와
  hazard-domain에 몰려 있다. 반대로 auth-signin만 B 우위(1.00 vs 0.87)로, B2 답변 2/3이 419/`201403`
  refresh-interceptor 루브릭 항목을 누락했다. 경미한 부정확 2건뿐(모두 비치명적).
- **채점의 한계(중요):** 이것은 **arm에 블라인드한 에이전트 루브릭 채점**이지 **독립적 사람 블라인드
  채점이 아니다**(테스트 대상과 같은 모델 계열). rubric-claim coverage는 완전성 프록시이지 절대
  진리 점수가 아니다. **2026-07-27에 유지보수자(Dowon-Kim)가 채점 기준을 표본 검토로 비준했다**
  (아래 §통제 arm 참조) — 단 이는 기준의 비준이지 54개 전량의 독립 재채점은 아니다.
- **비용:** 유료 실행 총 **$11.15**(N=1 캘리브레이션 $3.13 + N=3 $8.02), $19 하드캡 이내.

**2026-07-22 실측(−10%)과의 불일치 — 숨기지 않고 기록한다.** 같은 레포·같은 6태스크인데 델타가
−10% vs −48.4%로 크게 다르다. 알려진 차이는 세 가지다: (1) 드라이버 경로(서브에이전트 vs SDK),
(2) 토큰 회계(단일 total 토큰 vs 모델 보고 **input/output 분리** — retrieval의 이득은 input 쪽에
몰리므로 total로 합치면 희석된다), (3) 픽스처(job tmp 스크래치 de-drift본 vs 커밋된 22/22 verified
위키). 이 세 가지로 방향은 설명되지만 **격차 전부가 설명되지는 않았다**. 따라서 두 수치를 모두
남기고, 교차-실행 비교는 **미해결**로 둔다.

**통제 실험은 2026-07-27에 실행됐다 — 아래 §통제 arm 참조.** 상세·원자료:
[`bench/results/real-driver-csap-sdk-2026-07-24.md`](../../bench/results/real-driver-csap-sdk-2026-07-24.md),
채점 워크시트 [`…-grading.md`](../../bench/results/real-driver-csap-sdk-2026-07-24-grading.md).

## 통제 arm · `B2_empty` — 툴이 아니라 내용이었다 (csap, N=3, 2026-07-27)

위 −48.4%는 **왜** 줄었는지 말하지 못했다: 위키의 **내용** 때문일 수도, 그냥 **검색 툴**이
있었기 때문일 수도 있다. 이걸 분리하지 못하는 한 위키에 대한 인과 주장은 성립하지 않으며,
이것이 README 헤드라인 금지의 가장 큰 근거였다. `B2_empty`가 그 질문에 답한다.

**설계.** B2와 **도구·프롬프트가 바이트 동일**하고(러너가 import 시점에 패리티를 단언한다)
모델·태스크도 같다. 유일한 차이는 그 도구가 조회하는 위키다 — `make-stub-wiki.mjs`가 만든
**스텁 위키**(문서 22개의 경로·파일명·제목·frontmatter는 그대로, `source_files`/`evidence`는
정답 파일명을 담고 있어 **비움**, 본문은 미보강 placeholder; 167,236→17,685 bytes). 즉
`init --write` 직후 아무도 보강하지 않은 상태다. 소스 read/grep은 여전히 진짜 csap을 향한다.

| arm | input | cost | vs B |
| --- | --: | --: | --: |
| B (retrieval 없음) | 856,410 | $5.0709 | — |
| B2 (retrieval, 실제 위키) | 441,521 | $2.9463 | **0.516× (−48.4%)** |
| **B2_empty (툴, 스텁 위키)** | 976,159 | $5.9516 | **1.140× (+14.0%)** |

**통제군은 B2가 아니라 B보다도 위에 떨어졌다.** 지식 없는 위키에 retrieval 툴만 붙이면
중립도 아니고 **입력 토큰 +14%·비용 +17.4%의 순손실**이다(B2 대비 2.21배).

- **결론: −48.4%는 retrieval 툴이 아니라 위키의 보강된 내용이 만든 것이다.** 2026-07-24 결과에
  남아 있던 마지막 핵심 교란요인이 내용 쪽으로 해소됐다.
- **메커니즘 확인(총량이 아니라 행동으로):** 소스 파일 열람/런 = B 3.22 · B2 0.67 · B2_empty 2.39,
  **소스를 한 번도 안 열고 답한 런 = B2 8/18 vs B2_empty 0/18**. B2_empty는 거의 매 런 스텁을
  질의하고(1.11 get_doc/런) 쓸 게 없어 B에 가까운 수준으로 소스를 다시 읽었다 — 즉
  "B의 소스 작업 + 헛된 조회 왕복" = +14%다.
- **부수적이지만 독립적인 발견: 미보강 위키는 없느니만 못하다.** 생성만 하고 채우지 않은
  스캐폴드는 아무 대가 없이 토큰만 쓴다. 이 도구가 `content.not_enriched`로 잡는 바로 그 상태이며,
  보강·검토 규율이 선택이 아니라는 직접적 근거다.
- **균일하지 않다(공개):** 6개 중 2개(hazard-domain 0.90×·session-timeout 0.69×)는 스텁 arm이
  여전히 B를 이겼다. 스텁에 제목·경로가 남아 약간의 오리엔테이션 값이 있을 수 있고, 런간 변동
  (input CV 최대 36%)일 수도 있다. 뭉개지 않고 그대로 적는다.
- **스텁은 관대한 통제다.** 제목·경로를 남겼으므로 위키가 아예 없는 경우는 더 비쌀 가능성이 크다 —
  **+14%는 상한이 아니라 하한**이다.
- **정확도도 블라인드 채점했다(2026-07-27, 무료).** 54개 답변(arm당 18개)을 arm 라벨 제거·태스크 내
  셔플 후 채점하고 집계 시에만 arm을 재결합했다:

  | metric | B | B2 | B2_empty |
  | --- | --: | --: | --: |
  | mean rubric frac | 0.910 | **0.978** | 0.911 |
  | pooled claims | 62.5/69 | **67/69** | 62/69 |
  | 환각·오파일 | 1 | 0 | 0 |

  **B2_empty(0.911) = B(0.910).** 스텁 위키는 정확도를 전혀 사주지 못하면서 토큰만 +14% 더 썼다.
  정확도를 올린 건 보강된 위키뿐이다(+6.8pp). **두 축(토큰·정확도) 모두 이득의 원인을 내용으로 지목한다.**
  절차 안정성 검증: arm B를 2026-07-24 워크시트를 보지 않고 블라인드 재채점했더니 **0.9097·62.5/69로
  정확히 재현**됐고, 당시 기록된 개별 결함 2건(B의 가드 역설명, B2의 `useSessionTimeout` 경로 오류)도
  독립적으로 같은 arm에 재귀속됐다. 채점자는 여전히 **사람이 아닌 에이전트**다(같은 모델 계열) —
  **2026-07-27 사람 비준 완료(승인, Dowon-Kim)** — 결론을 무효화할 수 있는 유일한 질문("arm 간
  잣대가 같았는가")을 겨냥해 **불리하게 고른 7개 표본**(격차 최대 태스크·B가 이긴 태스크·최저점·
  관대함 점검)을 매칭 3중쌍으로 검토했고, 점수 변경 사유는 나오지 않았다. 워크시트에는 가장
  논쟁적인 판정(state-mgmt 4번 항목)을 **제외했을 때의 민감도**도 계산해 뒀다: B 0.942 ·
  B2_empty 0.953 · B2 0.978로 **결론 불변**. 표기는 **"agent-graded, 채점 기준 사람 비준(표본)"**
  이며 "human-graded"가 아니다 — 독립 재채점은 아니기 때문이다. 기록:
  [`…-ratification.md`](../../bench/results/real-driver-csap-sdk-empty-control-2026-07-27-ratification.md).
- **비용 $5.9516**(사전 추정 $3~5.5 초과 — 스텁 arm은 소스 fallback에 더해 출력/사고 토큰도 더 썼다:
  42,832 vs B 31,554). 실측 누적 **약 $17.10** / 런북 $19 캡 — 잔여 약 $1.90.

상세·원자료: [`bench/results/real-driver-csap-sdk-empty-control-2026-07-27.md`](../../bench/results/real-driver-csap-sdk-empty-control-2026-07-27.md).

## 한계 · Caveats

- `chars/4`는 실제 토크나이저가 아니다(절대값 근사). 이 프록시 하네스 자체는 벽시계 시간·답변
  품질을 재지 않는다 — 실제 LLM 토큰과 답변 품질은 §실측(2026-07-22)·§실측 2(2026-07-24 블라인드
  채점)에서 별도로 측정했다. 위키 **유지 비용**은 공개했으나 여전히 모델링하지 않았다.
- 단일·자기참조 레포(성숙한 evidence 링크 위키)라 더 크거나 얇거나 낡은 위키로 일반화 불가.
- **핵심 caveat(순서):** "재발견 감소" 메커니즘은 retrieval(Gate 24)에서 완성된다. 그 전에 잰
  베이스라인은 modest한 게 정상이며, 로드맵 헤드라인은 raw 베이스라인이 아니라
  **retrieval 전/후 델타**다. 이후 게이트마다 `node bench/run.js --against`로 재측정한다.

## 규율 · Governance

- **2026-07-22 실측 이후 갱신된 규율:** 이제 실제 LLM **N=3** 측정이 존재하므로 README/포지셔닝에
  **스코프를 명시한 정직한 수치**는 허용한다 — 단 **볼드 헤드라인은 금지**한다(−10% 평균에 한 태스크는
  +17%, 단일 에이전트[Opus 4.8]·단일 레포·6 태스크·total-token 프록시). 항상 **정확도-동률 + 신선도-종속**을
  앞세우고 수치엔 조건(N=3, 모델, 레포)을 붙인다. `chars/4` 프록시 수치(−81.5% 등)를 README에 싣는 것은
  계속 금지(프록시이지 실측 아님).
- **2026-07-24 SDK 실측 이후 갱신된 규율:** 이제 (a) 모델 보고 **input/output 분리** 토큰과
  (b) **arm-블라인드 채점**이 함께 있는 측정이 존재한다. 그래도 **README·런치 카피의 토큰/속도
  헤드라인은 계속 금지**한다 — 단일 레포·단일 모델·6 태스크·N=3·**에이전트 채점**(사람 블라인드
  채점 아님)·`B2_empty_wiki` 통제 미실행이기 때문이다. 이 결과는 **스코프 명시 각주**로만 쓴다.
  인용할 때는 N=3 단독(−48.4%)이 아니라 **pooled −40.7%**를 기본으로 하고, 지는 태스크
  (routing-map 3.17×)와 "정확도 패널티 없음(0.910 vs 0.971, 환각 0)"을 **함께** 적는다.
  공개 주장 승격 조건은 아래 §토큰-효율 벤치 확장의 "장기 공개 주장 조건"이 그대로 적용된다.
- **2026-07-27 통제 arm 이후 갱신된 규율:** `B2_empty`가 "툴 때문 아니냐"는 최대 반론을 닫았고,
  결과는 **내용 쪽 손을 들어줬다**(툴만으로는 +14% 손해). 그럼에도 **헤드라인 금지는 유지**한다 —
  남은 결함이 그대로이기 때문이다: 여전히 단일 레포·단일 모델·6 태스크·N=3이고, 2026-07-22
  실측(−10%)과의 4~5배 격차가 미해명이며, B2_empty의 정확도는 미채점이다. 다만 이제
  **인과 주장 자체는 스코프 안에서 성립**하므로, 각주에는 "retrieval 툴이 아니라 **보강된 내용**이
  절감을 만든다(통제 arm으로 확인, 이 픽스처 한정)"까지 쓸 수 있다. 함께 쓸 수 있는 더 강한
  문장은 효율이 아니라 거버넌스 쪽이다: **"미보강 위키는 없느니만 못하다(+14%)."**
- 이 문서는 에이전트(Claude Code)가 작성했으므로 `needs_review`다 — 사람 검토 후 `verified`.

## 토큰-효율 벤치 확장 (proxy 실행됨 · real 하네스는 executed:false)

목표는 스킬 문장 축소가 아니라 **올바른·검증된 코드 변경까지의 총토큰**을 줄이는 것이다. 이를
측정하려면 두 벤치를 **분리 유지**하고(어휘 혼용 금지), 각각에 arm을 **추가**한다.

**실행 상태(축을 혼동하지 말 것).** 위 §실측 2의 2026-07-24 유료 실행은 **retrieval 축(B vs B2)**을
잰 것이고, 아래 **토큰-효율 축(B3 compact/section-scoping · whole-task)의 real 하네스는 여전히
`executed:false`**다. 아래 B3 수치는 전부 chars/4 **프록시**(진단용)이며, 실제 다중 프로젝트·다중
모델 실측 전에는 README 헤드라인 수치로 쓰지 않는다.

- **retrieval 벤치(proxy `bench/run.js`, chars/4) — B3 arm 구축 완료(비유료)**: 기존 A0/A1/A2/B/B2에
  `B3_retrieval_compact`를 추가했다(`bench/lib/strategies.js#symbol:strategyWikiRetrievalCompact`).
  §Token-Efficiency의 compact/section-scoped 읽기를 모델링한다: `search-docs` 후 상위-K 문서의
  **관련 섹션만**(get-doc `--section`/`--strict-section` 의미; 매칭 실패 시 전체 본문 미덤프) 읽고
  제목 가중 랭킹을 반영한다(B2가 shipped retrieval을 미러하듯 B3도 미러). B3 vs B2(동일 코퍼스)가
  **section-scoping 메커니즘**을 격리한다. **정직한 결과(chars/4 PROXY, 진단용)**: 이 dogfood 코퍼스
  6-task에서 B3는 B2 대비 **0.65× (−34.5%)** 토큰이지만 grounding이 **100%→83.3%로 하락**했다(1개
  태스크에서 evidence가 미선택 섹션에 있었음). verdict는 이를 숨기지 않고 보고하며 "grounding이
  토큰보다 중요하면 B2 또는 `--section`(비-strict)을 쓰라"고 안내한다 — 즉 compact/strict는 **opt-in
  트레이드오프**다. `bench/results/current.md`에 반영. **README 헤드라인 금지(chars/4 프록시).**
  - `B2_empty_wiki` 통제 arm과 **real 하네스 B3**(유료 SDK 드라이버가 get_doc의 섹션 옵션을 지원해야 함)는
    **유료 후속으로 보류**(`bench/REAL_LLM_METHODOLOGY.md` §6 위협 #3). 2026-07-24 유료 실행에도
    **포함되지 않았다** — 그 실행은 retrieval 축(B vs B2) 전용이다.
- **전체-작업 벤치(`bench/whole-task/`, dry 스캐폴드) — `guided-compact` arm 추가(dry, 비유료)**: 기존
  `source-only`/`wiki-retrieval`/`guided`에 `guided-compact`(`prepare --compact` + `get-doc
  --strict-section` 경유 compact/adaptive 경로)를 추가했다. 러너는 드라이버 없으면 계속 **수치를
  조작하지 않고 exit**하고 `--dry`로 4-arm 계획만 출력한다. 폐기 가능한 복사본/worktree에서 실제
  기능 추가·버그 수정·문서 동기화를 수행하도록 설계하되 **실행은 유료 후속**이다. 평가 항목:
  요구사항 충족·테스트 통과·회귀·환각·위키 갱신·log append·needs_review 유지·run manifest/check-run·
  첫 시도 성공률·재시도 수·누적 입력/출력/캐시 토큰·시간·도구 호출·읽은 소스/문서 크기·중복 문맥.
  평균만이 아니라 태스크별·중앙값·범위(p90)를 보고한다.
- **누출 방지·공정성(유지)**: 프롬프트에 정답 파일명·내부 심볼을 넣지 않는다(`buildPrompt`가 유일
  프롬프트 소스; groundTruth/rubric는 채점 전용). 동일 모델·설정·깨끗한 세션·동일 태스크.
- **장기 공개 주장 조건**: frontend/backend/library ≥3종 · Claude·GPT ≥2 에이전트 · arm·task당
  N≥5 · 정확도/테스트 하락 0 · 보안 오답 0 · 불리 결과도 공개 · 유지·작성 비용 별도 공개.
- retrieval 결과와 전체-작업 결과는 **별도 파일·별도 표**로 보고하며 하나의 수치로 합치지 않는다.

## Evidence

- `bench/run.js` — harness 오케스트레이터(5개 arm 실행·세션 집계·정직 verdict; current.* 기록, baseline.*는 frozen).
- `bench/lib/strategies.js#symbol:strategyWikiGrounded` — B arm: 위키 본문에서 대상 소스를 파생해 소스 통독(pre-retrieval, 비순환).
- `bench/lib/strategies.js#symbol:strategyWikiRetrieval` — B2 arm: `search-docs`(동일 스코어링) + 상위 매칭 문서 본문 `get-doc`(소스 재독 없음); B2 vs B가 드리프트를 상쇄한 retrieval 델타.
- `bench/results/baseline.md` — frozen Gate 22 before-retrieval 결과표.
- `bench/results/current.md` — 현재 실행(B2 포함) 자동 생성 결과표.
- `bench/results/real-driver-csap-sdk-2026-07-24.md` — 2026-07-24 SDK 경로 유료 실측 기록(N=3 input/output 분리 토큰·비용·태스크별 표·픽스처 건강도·caveat).
- `bench/results/real-driver-csap-sdk-2026-07-24-grading.md` — 같은 실행의 블라인드 채점 워크시트(arm 라벨 제거·셔플·답변별 루브릭 점수·집계).
- `bench/real/runner.js#symbol:assertControlPromptParity` — `B2_empty`가 B2의 도구·firstStep을 그대로 유지하는지 import 시점에 단언(어긋나면 통제가 아니라 프롬프트 차이를 재게 되므로 즉시 예외).
- `bench/real/make-stub-wiki.mjs` — 스텁 위키 생성기: 문서 경로·제목·frontmatter 유지, `source_files`/`evidence` 비움(정답 파일명 누출 차단), 본문은 미보강 placeholder. 대상 저장소 미변경.
- `bench/real/aggregate.mjs` — 결과 JSON들을 3-arm 비교표로 집계(비율 우선, 총량 아님). 기존 2026-07-24 손계산 수치를 소수점까지 재현해 검증했다.
- `bench/results/real-driver-csap-sdk-empty-control-2026-07-27.md` — `B2_empty` 통제 arm 실행 기록(설계·사전 검증·3-arm 표·행동 지표·caveat·비용).
- `bench/results/real-driver-csap-sdk-empty-control-2026-07-27-ratification.md` — 사람 비준 워크시트와 판정(승인, Dowon-Kim 2026-07-27): 불리하게 고른 7개 표본·매칭 3중쌍·항목별 판정 근거·민감도 분석(가장 논쟁적 판정 제외 시에도 결론 불변).
- `bench/results/real-driver-csap-sdk-empty-control-2026-07-27-grading.md` — 3-arm 54개 답변 블라인드 채점 기록(방법·arm별 집계·태스크별·답변별 표·B 재현 검증).
- `bench/real/make-grading-worksheet.mjs` — 블라인드 채점 워크시트 생성기: arm 라벨 제거 + 해시 기반 결정적 셔플, 정답 map은 별도 파일로 분리(채점 전 열지 않음).
- `GATE_REVIEW.md#section:Impact Measurement Scope Decision` — 수용된 Gate 22 범위·불변식·수용 기준.

## Review Notes

- 2026-07-22에 Gate 22 베이스라인 + Gate 24 재측정(정직/불리) + B2 retrieval 델타를 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-22)를 거쳐 `verified`로 승인했다(최초 verified 승격). **핵심 불변 조건**: 이 문서의 모든 수치(특히 B2 −81.5%/−80.5%)는 `chars/4` **프록시**이지 실제 LLM 실행 결과가 아니다. 따라서 README·런치 카피에 토큰/속도/생산성 수치를 싣는 것은 **여전히 금지**이며, 실측(`bench/real/` 실행)이 뒷받침될 때까지 이 규율을 유지한다. 실측 방법은 `bench/REAL_LLM_METHODOLOGY.md` 참조.
- 2026-07-22에 **실제 LLM N=3 실측**(외부 프로젝트 `csap-roadkeeper-frontend`@`aws-global`, Opus 4.8)을 반영했다: "실측 · Real-LLM measurement" 섹션 추가(최신 위키에서 B2 −10% 토큰·−5% wall·정확도 18/18 동률·소스 fallback 0; stale 위키는 보안 오답 → 신선도-종속 정확도가 핵심)와 규율 갱신(스코프 명시 정직 수치 허용, 볼드 헤드라인·`chars/4` 프록시 수치는 계속 금지). 원자료: `bench/results/real-driver-csap-aws-global-pilot-2026-07-22.md`. 에이전트(Claude Code) 편집이라 `needs_review`로 강등 — 사람 검토 후 재승인 예정.
- 2026-07-23에 토큰-효율 벤치 확장의 **비유료 부분을 구축**했다(유료는 보류): proxy 하네스에
  `B3_retrieval_compact` arm(`strategyWikiRetrievalCompact`)을 추가·실행(chars/4)해 B3 vs B2
  **−34.5% 토큰 / grounding 100%→83.3%**의 정직한 트레이드오프를 `current.*`에 기록했고, whole-task
  러너에 `guided-compact` arm(dry)을 추가했다. real 하네스 B3·`B2_empty_wiki` 통제·실제 유료 실행은
  **보류**(사람 예산 결정). 모든 수치는 chars/4 PROXY(진단용)이라 README 헤드라인 금지 규율을 유지한다.
  fabricated 수치 없음. 에이전트(Claude Code) 편집이라 `needs_review` 유지.
- 2026-07-27에 **2026-07-24 SDK 경로 유료 실측**(커밋 `0e2b012`)을 문서에 반영했다 — 그 커밋은
  `bench/results/`에만 결과를 남기고 이 위키 문서를 갱신하지 않아 문서가 실행 사실보다 뒤처져
  있었다. 추가/수정: (1) §실측 2 신설(input B2/B **0.516× −48.4%**, cost 0.581× −41.9%, pooled
  **−40.7%**, 블라인드 루브릭 채점 B 0.910 vs B2 **0.971**·환각 0, 픽스처 22/22 verified, 비용 $11.15),
  지는 태스크(routing-map 3.17×)와 2026-07-22 −10%와의 **미해결 불일치**, 미실행 통제
  (`B2_empty_wiki`)를 함께 명시. (2) §규율에 2026-07-24 이후 규율 추가 — **README/런치 토큰·속도
  헤드라인은 계속 금지**(단일 레포·단일 모델·N=3·에이전트 채점·통제 미실행), 인용은 pooled −40.7%
  기준. (3) §토큰-효율 벤치 확장 제목·도입부를 축 기준으로 정정 — 2026-07-24 실행은 **retrieval
  축**이고 **B3/whole-task real 하네스는 여전히 `executed:false`**임을 분리 명시(이전 제목
  "(설계, executed:false)"가 "유료 실측이 전혀 없다"로 오독될 수 있었음). (4) §한계의 "답변 품질
  미측정"을 프록시 하네스 한정으로 한정. (5) frontmatter·§Evidence에 새 근거 2건 등재. 새 수치는
  전부 원자료에서 전사했고 지어낸 값은 없다. 에이전트(Claude Code) 편집이라 `needs_review` 유지 —
  사람 검토 후 `verified` 승격 예정(허위 검토 메타 미기입).
- 2026-07-27에 **채점 기준을 사람이 비준**했다(승인, reviewed_by: Dowon-Kim). 결론을 무효화할 수
  있는 유일한 질문(arm 간 잣대 일관성)을 겨냥해 불리하게 고른 7개 표본을 매칭 3중쌍으로 제시하고
  민감도 분석(가장 논쟁적 판정 제외 시 B 0.942·B2_empty 0.953·B2 0.978, 결론 불변)을 함께 냈으며,
  점수 변경 사유는 없었다. 표기를 **"agent-graded, 채점 기준 사람 비준(표본)"**으로 통일하고
  README(EN/KO)·bench 기록·배포 자료의 관련 문구를 모두 맞췄다. **독립 재채점이 아님을 어디서도
  흐리지 않는다.** 이로써 벤치 라인의 마지막 방법론 갭이 닫혔으나 **README 헤드라인 금지는 유지**
  된다(비준은 신뢰도를 올릴 뿐 표본을 늘리지 않는다). 신규 기록
  `bench/results/…-empty-control-2026-07-27-ratification.md`.
- 2026-07-27에 **`B2_empty` 통제 arm을 구축·실행**해 tooling-vs-knowledge 교란요인을 닫았다
  (유지보수자 지시, 유료 $5.95). 하네스: `runner.js`에 B2와 도구·프롬프트가 바이트 동일한
  `B2_empty` arm + import-time `assertControlPromptParity` + `BENCH_WIKI_CWD` 누락 시 실행 거부,
  신규 `make-stub-wiki.mjs`(지식만 제거한 스텁 위키), 신규 `aggregate.mjs`(3-arm 집계; 기존
  손계산 수치 재현으로 검증). 유료 실행 전 무료 검증: 정답 경로 누출 0/13, search-docs 매치
  12/3/18→1/0/1, 6개 태스크 패리티 OK. **결과: B2_empty = B의 1.140×(+14.0% input, +17.4% cost)**
  — B2가 아니라 B보다도 위. 따라서 **−48.4%는 툴이 아니라 보강된 내용의 효과**이고, 부수적으로
  **미보강 위키는 없느니만 못하다**는 독립적 발견을 얻었다. 불리·미확정도 함께 적었다: 6개 중
  2개 태스크는 스텁 arm이 여전히 B를 이김, 스텁이 제목·경로를 남긴 관대한 통제라 +14%는 하한,
  2026-07-22와의 격차 여전히 미해명. **이어서 3-arm 54개 답변을 블라인드 채점(무료)**해 정확도 축도
  닫았다: B 0.910 · B2 **0.978** · B2_empty 0.911 — 즉 **스텁 위키는 정확도를 전혀 사주지 못하면서
  토큰만 더 쓴다**(두 축 모두 원인은 내용). 절차 검증으로 arm B가 2026-07-24 채점과 정확히 재현됐다
  (0.9097·62.5/69, 개별 결함 2건도 같은 arm에 재귀속). 채점자는 여전히 에이전트(사람 비준 미완).
  §규율에 2026-07-27 규율을 추가했으나
  **README 헤드라인 금지는 유지**한다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로
  강등한다 — 사람 검토 후 재승인 예정(허위 검토 메타 미기입).
- 2026-07-22에 실측 후속 엄밀성 하네스를 **scaffolded**(미실행)했다: SDK 경로 드라이버 `bench/real/agent.js`(Anthropic SDK tool_runner; read/grep + 읽기 전용 `llm-wiki` retrieval 툴; env로 target-agnostic; 읽기 전용)가 서브에이전트 경로에 없던 **input/output 토큰 분리**를 제공한다. `bench/tasks-csap.json`(6 태스크 재현), `bench/real/package.json`(SDK를 bench-local dep로 격리 → 배포 패키지 zero-dep 불변), `runner.js`의 `BENCH_TASKS` 오버라이드, `DRIVER_RUNBOOK.md` § SDK path 실행법을 함께 추가했다. `--dry`로 배선 검증(모델 호출·비용 0). **유료 실행과 교차 에이전트(GPT) 드라이버는 보류**(유저 지시). 커밋되는 재현 산출물은 tasks-csap.json·package.json·runner.js·runbook이며 `agent.js`는 설계상 git-ignore(SDK dep 격리)다. 에이전트 편집이라 `needs_review` 유지.
- 2026-07-30에 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-30 — 유지보수자 지시로 세션 내 재승인)를 거쳐 `verified`로 재승인했다. 2026-07-27 통제군(B2_empty) 실측·비준 이후 벤치 사실관계 변경이 없고, 1.27.1(문맥 규율)·1.27.2(프롬프트 형태 규율)는 벤치를 재실행하지 않았으며 이 문서도 그렇게 주장하지 않음을 확인했다. README 헤드라인 금지 유지.
