---
title: Impact Measurement Baseline
tags:
  - llm-wiki
  - benchmark
  - needs_review
status: needs_review
doc_type: reference
project: llm-wiki-governance
last_updated: 2026-07-21
author: ai-generated
last_edited_by: Claude Code
wiki_block_version: v1
source_files:
  - bench/run.js
  - bench/lib/strategies.js
  - bench/tasks.json
  - bench/results/baseline.json
evidence:
  - bench/run.js
  - bench/lib/strategies.js#symbol:strategyWikiGrounded
  - bench/results/baseline.md
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
비용의 **결정적 프록시**를 4가지 방식으로 잰다(LLM 미실행):

- **A0 whole-repo** — 모든 `src` 파일 통독(순진한 상한).
- **A1 grep-full** — 위키 없이 질문의 cold 키워드로 grep해 매칭 파일을 통독.
- **A2 grep-snippet** — 같은 grep 히트지만 매치 주변 ±40줄만 읽는 **보수적(위키에 가장 불리한)** 코드-only 하한.
- **B wiki-grounded** — 위키 오리엔테이션 문서를 먼저 읽고, 그 문서가 키워드에 대해 가리키는 evidence 포인터의 소스만 읽음.

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

## 한계 · Caveats

- `chars/4`는 실제 토크나이저가 아니다(절대값 근사). 벽시계 시간·답변 품질은 미측정 →
  더 무거운 LLM 실측이 후속(별도). 위키 **유지 비용**은 공개했으나 모델링하지 않았다.
- 단일·자기참조 레포(성숙한 evidence 링크 위키)라 더 크거나 얇거나 낡은 위키로 일반화 불가.
- **핵심 caveat(순서):** "재발견 감소" 메커니즘은 retrieval(Gate 24)에서 완성된다. 그 전에 잰
  베이스라인은 modest한 게 정상이며, 로드맵 헤드라인은 raw 베이스라인이 아니라
  **retrieval 전/후 델타**다. 이후 게이트마다 `node bench/run.js --against`로 재측정한다.

## 규율 · Governance

- 이 결과를 근거로 **어떤 토큰/속도/생산성 주장도 README/런치 카피에 넣지 않는다**(측정된 수치가
  뒷받침하기 전까지). 넣는다면 A1 기준인지 보수적 A2 기준인지 명시한다.
- 이 문서는 에이전트(Claude Code)가 작성했으므로 `needs_review`다 — 사람 검토 후 `verified`.

## Evidence

- `bench/run.js` — harness 오케스트레이터(4개 arm 실행·세션 집계·정직 verdict·베이스라인 기록).
- `bench/lib/strategies.js#symbol:strategyWikiGrounded` — B arm: 위키 본문에서 대상 소스를 파생(비순환).
- `bench/results/baseline.md` — 자동 생성 베이스라인 결과표.
- `GATE_REVIEW.md#section:Impact Measurement Scope Decision` — 수용된 Gate 22 범위·불변식·수용 기준.
