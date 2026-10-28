---
title: LLM-WIKI Index
tags:
  - llm-wiki
  - verified
status: verified
doc_type: wiki_index
project: llm-wiki-governance
last_updated: 2026-10-28
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-28
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
source_digests:
  - package.json sha256:a18a7e2bc101d0dd
  - src/cli.js sha256:7d0df7982416faef
  - README.md sha256:536dd7dd59614670
---

# LLM-WIKI Index

이 문서는 `llm-wiki-governance` 저장소 자체의 LLM-WIKI 진입점입니다. 이 패키지는 여러 개발 도구(Codex, Claude Code 등)와 CI에서 **AI가 쓴 프로젝트 문서를 검증·드리프트 감지·CI 강제**하는 거버넌스 CLI(OKF-compatible)이며, 이 wiki는 그 도구를 **자기 자신에게 적용(dogfooding)** 한 결과입니다. (1.16.0에서 `@dowonk-7949/llm-wiki-standard`에서 개명; CLI 명령은 `llm-wiki` 유지.)

## Status

- 이 문서 집합은 `llm-wiki init --write --type library`로 생성한 뒤 실제 소스 근거로 보강되었습니다.
- **2026-08-03부터 이 저장소는 자기 문서를 스스로 승격합니다**(유지보수자 결정). 이 저장소는 전체가 바이브코딩 산출물이자 제품의 dogfood이므로, 사람이 문서를 큐레이션하는 코드베이스를 전제한 규칙을 자기 자신에게는 적용하지 않습니다. `reviewed_by`는 config `reviewer`에서 오며 **에이전트를 이름으로 지목**합니다 — 스탬프가 사람 검토를 주장하지 않습니다.
- **누가 승인했는지는 `stats`가 갈라 셉니다.** `llm-wiki.config.json`의 `agentReviewers`에 그 `reviewer` 값을 등록해 두었으므로, 에이전트가 승인한 `verified` 문서는 `evidenceTiers.agentVerified`로, 2026-08-03 이전 승인분(reviewed_by: Dowon-Kim)만 `humanVerified`로 셉니다(2026-10-21 기준 사람 4 / 에이전트 47). `verified` 수 자체는 두 주체를 합친 값입니다.
- 이 완화는 **이 저장소 한정**입니다. 제품이 도입처로 내보내는 규칙(`templates/adapters/*`)은 여전히 사람 검토를 요구하고, `docs/llm-wiki/` 밖의 어떤 파일도 `verified`를 씨앗으로 삼을 수 없습니다. 전체 계약은 `AGENTS.md`의 "Wiki discipline"이 소유합니다.
- **`impact --since <ref>`는 플래그 없이 빌드를 실패시킵니다**(1.28.0부터 `impact.source_changed` 기본 `error`). 소스를 바꾸면서 그 소스를 인용하는 `verified` 문서를 같은 변경에서 안 고치면 CI가 빨개집니다 — 이 저장소의 CI `governance` 잡이 `--since HEAD~1 --strict`로 실행합니다. 릴리스 노트(`doc_type: release_notes`)는 면제이고, `version` 한 줄만 바뀐 `package.json`(N-13)과 `docs/llm-wiki/templates/` 하위(N-14)도 대조에서 빠지지만 **릴리스 커밋의 finding이 0이 되지는 않습니다.** 완화는 `rules`/`rulesPreset`으로만 하고, 인용을 지워서 우회하지 않습니다. 실패했을 때는 출력의 `Documents to re-review` 표(1.35.0부터)를 먼저 보세요. 고칠 문서와, 그 문서가 인용하는 바뀐 소스가 바로 나옵니다(`--format json`의 `impactedDocuments`도 같은 내용). 1.36.0부터 `source_files`에 두지 않고 줄 범위나 `.md` 섹션으로만 인용한 파일은 그 영역이 실제로 바뀐 경우에만 지목되고, 영역이 그대로인 인용은 `locator_narrowed`로 보고됩니다. 1.37.0부터 날짜 앵커 `drift`도 `.md` 섹션 인용을 같은 방식으로 좁힙니다.
- **신규 프로젝트(Greenfield)도 같은 위키로 시작합니다**(1.38.0). `init`/`quickstart --greenfield`가 요구사항·결정 문서를 계획된 지식(`doc_type: requirement`/`decision`)으로 만들고, 코드가 생기면 같은 문서에 구현 근거를 연결해 기존 `validate`·`impact`·`drift`로 넘어갑니다. 승인된 계획에 연결된 근거가 없으면 경고가 아니라 `evidence.planned_unlinked`(info)입니다. 기능 서술은 [Domain Features](DOMAIN_FEATURES.md), 실행 예는 [Examples](EXAMPLES.md)에 있습니다. 같은 릴리스에서 신규 프로젝트의 기본값인 lite가 꺼 둔 규칙 때문에 `review --approve-all`이 손대지 않은 스캐폴드를 `verified`로 올리던 결함(1.30.0부터)을 고쳤습니다. `stats`·`next`도 이제 꺼진 규칙의 사실을 읽습니다.
- **이 저장소는 config에 `governance.mode: strict`를 명시합니다.** 블록이 없어도 `strict`로 해소되지만, CI를 게이트하는 레벨을 기본값에 맡기면 `doctor`의 `source:` 필드가 드러내라고 있는 바로 그 애매함이 생깁니다.
- 릴리스별로 무엇이 왜 바뀌었는지(1.29.2 `delegationPolicy` 도입과 1.34.0의 제거, 1.30.0 거버넌스 모드와 그 도그푸딩 결함, 1.31.0 레벨 정합, 1.32.0 CI 템플릿 비용 등)는 [CHANGELOG](../../CHANGELOG.md)와 [log.md](log.md)(및 그 월별 권)가 소유하고, 현재 기능 서술은 [Domain Features](DOMAIN_FEATURES.md)에 있습니다. 이 절에는 이 저장소를 읽는 방법만 둡니다.
- **`bench/`의 외부 대상 실측 산출물은 익명화본입니다**(2026-09-03부터). 측정값·표본 수·채점 절차는 원본 그대로지만 대응표가 이 저장소에 없어 동일 대상의 완전한 재실행은 불가능합니다. 계약은 [`docs/BENCHMARK_DISCLOSURE.md`](../BENCHMARK_DISCLOSURE.md)가 소유하고, `bench/tasks.json`은 별개의 완전 공개 harness fixture입니다.

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
- 변경 기록은 [log.md](log.md)에 append-only로 남깁니다. 항목은 고치지 않습니다. 1.33.0부터는 오래된 항목을 `archive-log`로 월별 권(`log-YYYY-MM.md`)에 원문 그대로 옮길 수 있습니다. 이 저장소는 2026-10-21에 실행해 2026-07·08 항목을 [log-2026-07.md](log-2026-07.md)·[log-2026-08.md](log-2026-08.md)로 옮겼습니다.
- 민감정보 raw value는 wiki에 기록하지 않습니다.
- Markdown은 UTF-8로 읽고 씁니다.
