---
title: LLM-WIKI Index
tags:
  - llm-wiki
  - verified
status: verified
doc_type: wiki_index
project: llm-wiki-governance
last_updated: 2026-08-06
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-08-06
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
