---
title: Visibility Governance Policy
tags:
  - llm-wiki
  - verified
status: verified
doc_type: policy
project: llm-wiki-governance
last_updated: 2026-10-27
author: ai-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-27
wiki_block_version: v1
source_files:
  - src/frontmatter-schema.js
  - src/config.js
  - src/sensitive-info.js
evidence:
  - src/frontmatter-schema.js
  - src/config.js#symbol:VALID_VISIBILITIES
  - src/sensitive-info.js#symbol:scanSensitiveInfo
related:
  - docs/llm-wiki/project-profile.md
  - GATE_REVIEW.md
visibility: internal
contains_sensitive_info: false
source_digests:
  - src/frontmatter-schema.js sha256:ec4476da72b5c2e2
  - src/config.js sha256:ef863d1307ba2dc9
  - src/sensitive-info.js sha256:43e55bad6b87aaff
---

# Visibility Governance Policy

이 문서는 LLM-WIKI 문서의 `visibility` 필드(`internal` | `restricted` | `public`) 의미와,
그 값과 문서 내용의 일관성을 어떻게 점검할지에 대한 정책을 정의한다. `1.9` visibility
governance 기능(GATE_REVIEW Gate 14)의 설계 입력이며, `project-profile.md`의 Open
Question("팀/조직 도입 시 visibility 경계 정책 문서가 필요하다")을 해소한다.

## 레벨 정의 · Levels

- **`internal`** (기본값) — 조직 내부 공유. 대부분의 wiki 문서가 여기에 해당한다. 조직 밖으로
  나가지 않는다는 전제이므로 내부 세부 구현·경로·의사결정을 담을 수 있으나, **비밀값(토큰·자격
  증명 등)은 어느 레벨에서도 raw로 기록하지 않는다**(기존 sensitive-info 불변식).
  `init --greenfield`가 만드는 계획 문서(`requirements/00_overview.md`, `templates/REQUIREMENT.template.md`,
  `src/config.js#symbol:GREENFIELD_DOCS`)도 다른 생성 문서처럼 `internal`로 만들어진다. 출시 전 요구사항은
  대개 내부 계획이므로 공개 여부는 사람이 따로 정한다.
- **`restricted`** — 더 좁은 범위(특정 팀/역할)만 접근. `internal`보다 민감한 맥락을 담을 수
  있으나 접근 통제는 저장소/조직 레이어의 책임이며, 이 CLI는 값의 선언만 검증한다.
- **`public`** — 조직 밖 공개 가능. 공개해도 안전한 내용만 담아야 한다. **비밀값은 물론이고
  sensitive-info 스캔에 걸리는 값이 있으면 안 된다**(공개-내용 일관성).

## 일관성 규칙 · Consistency (1.9, opt-in)

`1.9`는 이미 필수인 `visibility` 필드를 **강제(enforce)하지 않고**, opt-in 일관성 린트를 추가한다.
기존 sensitive-info 스캔을 재사용한다:

- **public-vs-content**: `visibility: public` 문서가 sensitive-info 스캔에 매치되면 경고한다
  (공개 문서에 민감해 보이는 값이 있으면 leak 위험).
- **contains_sensitive_info 일관성**: `contains_sensitive_info: false`인데 sensitive-info
  스캔에 매치되면 선언과 내용이 어긋난다.

두 규칙은 스캔을 그대로 재사용하므로 스캔 범위가 넓어지면 함께 넓어진다. 1.35.0에서 스캔은
마지막 마디가 자격 증명 단어인 키(`access_token:`, `client_secret:`, `accessToken:` 등, 값이
자격 증명 모양일 때만)와 벤더 접두 토큰(`vendor_token`)까지 잡게 됐다.

### 불변식 · Invariants

- **off by default**: 규칙은 config `rules`로 명시 활성화해야 동작한다(1.8 토글 기계 재사용).
- **warning-level, read-only**: 절대 기본 `error`/`blocked`가 되지 않으며 파일을 수정하지 않는다.
  additive 불변식(1.0.0 계약)을 깨지 않기 위함이다.
- **접근 통제 아님**: 이 CLI는 `visibility` 값과 내용의 일관성만 점검한다. 실제 접근 통제(누가
  무엇을 보는가)는 저장소/조직 레이어의 책임이다.
- 민감정보는 어느 visibility 레벨에서도 raw로 기록하지 않는다(redaction 우선).

## Evidence

- `src/frontmatter-schema.js` — `visibility` enum(`internal`|`public`|`restricted`)과 필수 필드.
- `src/config.js#symbol:VALID_VISIBILITIES` — 허용 visibility 값 집합.
- `src/sensitive-info.js#symbol:scanSensitiveInfo` — 1.9 일관성 규칙이 재사용할 민감정보 스캔.

## Open Questions

- `restricted`의 세부 접근 경계(어떤 팀/역할)를 config로 선언·검증할지는 실사용 피드백 후 별도
  검토한다(현재는 값 선언만 검증).
- 조직 정책에 따라 특정 `doc_type`을 특정 visibility로 강제하고 싶을 수 있으나(예: release_notes는
  최소 internal), 이는 default-blocking 금지 불변식과 상충하지 않게 opt-in으로만 다룬다.

## Review Notes

Older review notes (1 entries, 2026-07-15 → 2026-07-15) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-07-16에 1.12.0에서 `src/config.js`가 변경되어(mobile 문서셋 `PROFILE_DOCS.mobile` 추가) `evidence.stale`이 발생했다. 이 문서 내용(visibility 정책)은 무관하며 변경되지 않았다. 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-16)로 baseline을 refresh해 `verified`로 재승인했다(내용 불변).

- 2026-09-08(1.31.0)에 `impact`가 이 문서를 지목해 인용 소스 `src/config.js`(앵커 `#symbol:VALID_VISIBILITIES`)를 재확인했다. 파일은 바뀌었지만 변경 내용은 에이전트 어휘 2종(`SUPPORTED_AGENTS`·`ALL_AGENTS`)을 `src/cli.js`에서 이 leaf 모듈로 **옮겨 온 신규 export**뿐이고, `VALID_VISIBILITIES`와 이 문서가 서술하는 visibility 계약은 무변경이다. 본문 **불변**.
- 2026-10-20(1.33.0)에 `impact`가 이 문서를 지목해 `src/frontmatter-schema.js`를 대조했다. 바뀐 것은 `evidence` 참조 정규식을 `EVIDENCE_REFERENCE_PATTERN` export로 꺼내 런타임 파서와 함께 쓰게 한 것뿐이다. 이 문서가 근거로 삼는 `visibility` enum과 필수 필드 목록은 그대로다. 이 문서의 `evidence` 세 줄이 새 단일 정규식을 통과하는지 `validate-frontmatter`로 확인했고, 결과는 pass였다.
- 2026-10-26(1.35.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `src/sensitive-info.js`를 대조했다. `scanSensitiveInfo`의 시그니처와 finding 형태(`type`·`line`·`message`, 값 미포함)는 그대로이고, 기존 패턴 6종도 그대로다. 바뀐 것은 탐지 범위가 넓어진 것이다. 마지막 마디가 자격 증명 단어인 키를 잡되 값이 자격 증명 모양일 때만 잡고, 벤더 접두 토큰을 새 유형 `vendor_token`으로 잡는다. 이 문서가 서술하는 두 opt-in 린트는 스캔을 그대로 재사용하므로 계약은 같지만, 같은 문서에서 더 일찍 걸릴 수 있다. 그 사실을 일관성 규칙 절에 한 문단으로 더했다. 실측으로 로컬 위키 11곳(394개 파일)에서 새로 잡힌 줄은 0이었다. 같은 날 PR CI에서 CodeQL이 그 첫 구현의 다항 시간 정규식(`js/polynomial-redos`, high)을 잡았다. 실제로 20,000자 한 줄에 0.15–1.5초가 걸렸다. 이 문서의 린트가 그 스캔을 재사용하므로 같은 지연이 그대로 옮아왔을 것이다. 후보를 키 하나당 상한 있는 한 번의 매칭으로 찾고, 모든 수량자에 상한을 두는 선형 구조로 바꿨다. 탐지 결과는 바뀌지 않았다(위키 9곳 314개 파일에서 1.34.0 대비 +0/−0, 합성 코퍼스 동일). 계약도 바뀌지 않았다.
- 2026-10-27(1.36.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `src/frontmatter-schema.js`를 대조했다. 바뀐 것은 선택 필드 `source_digests` 추가뿐이고 `visibility` enum과 이 문서가 다루는 두 규칙은 그대로다. 본문 불변.
