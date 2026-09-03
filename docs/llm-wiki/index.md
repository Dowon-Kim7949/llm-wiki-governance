---
title: LLM-WIKI Index
tags:
  - llm-wiki
  - verified
status: verified
doc_type: wiki_index
project: llm-wiki-governance
last_updated: 2026-08-19
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-09-03
wiki_block_version: v1
source_files:
  - package.json
  - src/cli.js
  - README.md
evidence:
related:
  - docs/llm-wiki/README.md
  - docs/llm-wiki/project-profile.md
  - docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md
  - docs/llm-wiki/PUBLIC_API.md
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Index

이 문서는 `llm-wiki-governance` 저장소 자체의 LLM-WIKI 진입점입니다. 이 패키지는 여러 개발 도구(Codex, Claude Code 등)와 CI에서 **AI가 쓴 프로젝트 문서를 검증·드리프트 감지·CI 강제**하는 거버넌스 CLI(OKF-compatible)이며, 이 wiki는 그 도구를 **자기 자신에게 적용(dogfooding)** 한 결과입니다. (1.16.0에서 `@dowonk-7949/llm-wiki-standard`에서 개명; CLI 명령은 `llm-wiki` 유지.)

## Status

- 이 문서 집합은 `llm-wiki init --write --type library`로 생성한 뒤 실제 소스 근거로 보강되었습니다.
- **2026-08-03부터 이 저장소는 자기 문서를 스스로 승격합니다**(유지보수자 결정). 이 저장소는 전체가 바이브코딩 산출물이자 제품의 dogfood이므로, 사람이 문서를 큐레이션하는 코드베이스를 전제한 규칙을 자기 자신에게는 적용하지 않습니다. `reviewed_by`는 config `reviewer`에서 오며 **에이전트를 이름으로 지목**합니다 — 스탬프가 사람 검토를 주장하지 않습니다.
- 따라서 이 wiki의 `verified`와 `stats`의 `human_verified` 수치는 **"에이전트 승인"으로 읽어야 합니다.** 2026-08-03 이전 승인분(reviewed_by: Dowon-Kim)만 실제 사람 검토입니다.
- 이 완화는 **이 저장소 한정**입니다. 제품이 도입처로 내보내는 규칙(`templates/adapters/*`)은 여전히 사람 검토를 요구하고, `docs/llm-wiki/` 밖의 어떤 파일도 `verified`를 씨앗으로 삼을 수 없습니다. 전체 계약은 `AGENTS.md`의 "Wiki discipline"이 소유합니다.
- **1.28.0(2026-08-03)부터 `impact --since <ref>`가 플래그 없이 빌드를 실패시킵니다**(`impact.source_changed` 기본 `error`). 소스를 바꾸면서 그 소스를 인용하는 `verified` 문서를 같은 변경에서 안 고치면 CI가 빨개집니다 — 이 저장소의 CI `governance` 잡이 `--since HEAD~1 --strict`로 실행합니다. 릴리스 노트(`doc_type: release_notes`)는 면제입니다. 완화는 `llm-wiki.config.json`의 `rules`/`rulesPreset`으로만 하고, 인용을 지워서 우회하지 않습니다.
- **1.29.0(2026-08-05, N-13)부터 `version` 값만 바뀐 `package.json`은 `impact`의 앵커 대조에서 빠집니다**(변경된 것으로는 계속 보고, `impact` 한정 — 날짜 앵커 `drift`는 계속 지목합니다). 릴리스 커밋은 정의상 매니페스트를 바꾸고 이 저장소 비면제 `verified` 문서 10건이 그 파일을 인용해서, 매 릴리스마다 조치 불가능한 finding이 나왔습니다. **0이 되지는 않습니다** — 버전 담지 파일 8종 기준 11 → 4이고, 남는 4건은 내용이 실제로 바뀐 `README.md`·`ROADMAP.md`·action.yml을 인용합니다.
- **1.29.1(2026-08-06, N-14)부터 `docs/llm-wiki/templates/` 하위 문서는 `drift`·`impact` 양쪽에서 빠집니다**(`review`가 열거하지 못하는 문서라 지목당해도 강등도 재스탬프도 불가능했습니다 — 해소 경로가 없는 finding). 같은 배치에서 `review`가 범위 밖 경로를 "not found"라고 답하던 거짓말을 고쳤고, append-only 로그를 명시 지정하면 `verified`로 스탬프하던 결함도 함께 막았습니다. 실측 `evidence.stale` 7 → 5이며 **0이 되지는 않습니다.**
- **1.29.2(2026-08-19)부터 생성 프롬프트가 "얼마나 읽을지"에 더해 "누가 읽을지"까지 정합니다**(`delegationPolicy`). 1.27.1의 `contextBudget`은 CLI가 돌려주는 양만 통제해서, 여러 문서를 훑는 읽기 폭발을 비싼 문맥이 그대로 치르는 경로가 남아 있었습니다. 새 블록은 **위치 파악·스코핑과 기계적 마감은 위임 가능**, **설계 판단·회귀 판정·실제 수정·위키/로그 서술은 위임 불가**로 가르고 함정 셋을 못박습니다 — 브리프 대신 원자료를 돌려받는 위임은 아무것도 사지 못한다 · **세션 모델은 고정하고 위임만 싼 모델로 보낸다**(중간에 세션 모델을 바꾸면 그때까지의 대화를 새 모델 가격으로 다시 읽습니다) · 위임이 검증되지 않은 주장을 사 주지는 않는다(대리인이 실소스를 읽고 근거를 보고하지 않으면 직접 읽습니다). 삽입 위치는 `contextBudget` 직후 3곳(`implementationPrompt`·`docsSyncPrompt`·`initialEnrichmentWorkflow`)입니다. 🚨 **에이전트별 분기는 불가능합니다** — 프롬프트는 codex·claude 공용 중립 문서로 나가므로 하네스 특정 문구는 `templates/adapters/*`의 몫입니다.

- **2026-09-03부터 `bench/`의 외부 대상 실측 산출물은 익명화본입니다.** 그 실행의 대상은 제3자 소유 비공개 Vue/Quasar SPA였으므로, 프로젝트·저장소·브랜치명·모듈 경로·심볼·API 경로·세션/MFA/토큰 갱신 규칙·스토리지 키·업무 필드명·상태 코드·타이머 임계값·백엔드 호스트를 **안정적 가명**(`<login-page>` 같은 역할명)으로 치환하고 원시 결과의 모델 답변 프로즈를 **보류**했습니다(`answerRedacted: true`). **측정값·arm·표본 수·모델명·날짜·채점 절차·기록된 한계는 원본 그대로**이고 대응표는 이 저장소에 없습니다 — 따라서 **동일 대상의 완전한 재실행은 이 저장소만으로 불가능합니다.** 전체 계약은 [`docs/BENCHMARK_DISCLOSURE.md`](../BENCHMARK_DISCLOSURE.md)가 소유합니다. `bench/tasks.json`(대상 = 이 저장소 자신)은 별개의 **완전 공개 harness fixture**이며 역사적 수치의 출처가 아닙니다.

## Recommended Read Order

1. [Project Profile](project-profile.md) — 이 패키지가 무엇이고 어떤 런타임/소유 경계를 갖는지
2. [Architecture Conventions](ARCHITECTURE_CONVENTIONS.md) — 모듈 구조와 command → scan → report 파이프라인
3. [Public API](PUBLIC_API.md) — CLI 명령어 표면(이 패키지의 공개 계약)
4. [Domain Overview](domains/00_overview.md) — 명령어군/서브시스템 지도
5. [Glossary](GLOSSARY.md) — 핵심 용어
6. 작업 대상에 맞는 [Versioning](VERSIONING.md) · [Release Flow](RELEASE_FLOW.md) · [Examples](EXAMPLES.md)
7. [Harness Governance Roadmap](HARNESS_GOVERNANCE_ROADMAP.md) — 하네스(에이전트가 이 저장소를 개발하는 환경) 자체의 거버넌스 로드맵: 자기관리 게이트·측정·결정 기록

## Operating Rules

- CLI 또는 에이전트가 생성/수정한 문서는 편집 시점에 `needs_review`로 두고, 작업 끝에 `review --approve-all --yes`로 승격합니다(위 Status 참조). 드리프트(`evidence.stale`/`impact`)도 `reviewed_at` 재스탬프로 해소하며 소스 대조를 전제하지 않습니다 — 그 대가로 **이 저장소에서 두 게이트는 관측 도구가 아닙니다.**
- 변경 기록은 [log.md](log.md)에 append-only로 남깁니다.
- 민감정보 raw value는 wiki에 기록하지 않습니다.
- Markdown은 UTF-8로 읽고 씁니다.
