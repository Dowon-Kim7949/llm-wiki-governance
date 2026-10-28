---
title: Versioning
tags:
  - llm-wiki
  - verified
status: verified
doc_type: versioning
project: llm-wiki-governance
last_updated: 2026-10-27
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-28
wiki_block_version: v1
source_files:
  - package.json
  - RELEASE_CHECKLIST.md
evidence:
  - package.json
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/RELEASE_FLOW.md
  - docs/llm-wiki/PUBLIC_API.md
visibility: internal
contains_sensitive_info: false
source_digests:
  - package.json sha256:363aafcd2545dc99
  - RELEASE_CHECKLIST.md sha256:b4b79745790da0f0
---

# Versioning

## Policy

- 시맨틱 버전을 따른다. 배포 버전의 단일 진실 소스는 `package.json`의 `version` 필드이며, 이 문서는 특정 버전 숫자를 고정하지 않는다(버전을 알려면 `package.json`을 본다).
- `1.0.0`에서 안정 계약(명령·옵션 표면, `--format json` 출력 형태, 필수 frontmatter 계약)을 확정했고, 이후 `1.x`는 하위 호환(부가)만 더한다. 계약 파괴 변경은 major를 요한다.
- 릴리스는 `v<version>` 태그 push로 트리거되고, 태그 버전은 반드시 `package.json` 버전과 일치해야 한다.
- 하위 호환이 깨질 수 있는 변경(명령 이름/JSON 출력 형태 변경, 필수 frontmatter 계약 변경)은 major로 올린다. `PUBLIC_API`의 안정성 원칙 참조.

## What Bumps the Version

- **patch(x.y.Z)**: 버그 수정, 메시지/출력 다듬기, 새 검증 규칙 추가(warning 레벨, 기본 통과 유지).
- **minor(x.Y.0)**: 하위 호환되는 새 명령·옵션 추가, 기존 동작을 깨지 않는 기능 확장.
- **major(X.0.0)**: 안정 계약의 파괴적 변경(명령·옵션 제거·이름 변경, JSON 출력 형태 변경, 필수 frontmatter 계약 변경).
- **tarball에 무엇을 싣는지는 안정 계약이 아니다.** 실행에 쓰이지 않는 파일을 빼는 것은 버전 판정의 근거가 아니다 — 1.34.0에서 프로젝트 문서 md를 tarball에서 뺐고, 그 릴리스가 MINOR인 이유는 생성 프롬프트가 바뀌었기 때문이다. 생성 프롬프트·스킬의 **텍스트**도 고정 계약이 아니지만, 도입처가 `--refresh`로 받는 산출물이 바뀌므로 PATCH가 아니라 MINOR로 낸다.

## 기록된 예외 — 1.28.0

- **1.28.0은 위 규칙의 예외다.** `impact.source_changed`의 기본 severity를 `warning` → `error`로
  바꾼 것은 **exit code 계약 변경**이라 위 major 정의에 해당한다(`llm-wiki impact --since <ref>`가
  플래그 없이 exit 1이 되고, 이 규칙에 대해 `--strict`가 no-op이 된다). 그럼에도 **유지보수자의
  명시적 결정으로 MINOR(1.28.0)로 배포했다**(2026-08-03).
- 이 예외를 조용히 넘기지 않기 위한 상쇄 조치가 함께 나갔다: `^1.27.2`를 쓰는 도입처가 **자동으로**
  올라온다는 사실과 **돌아가는 길 2가지**(config `rules`의
  `"impact.source_changed": "warning"|"info"|"off"`, 또는 `rulesPreset: "relaxed"`)를 CHANGELOG
  2종·README 2종·ROADMAP 2종에 모두 적었다.
- **선례로 삼지 않는다.** 다음에 같은 형태의 변경이 오면 기본은 major이며, 이 항목은 "규칙을
  바꾼 기록"이 아니라 "규칙을 어긴 기록"이다.

## 기록된 판정 — 1.39.0 (MINOR, 2026-10-28)

- **minor 근거.** 새 info 규칙 `impact.plan_changed` 하나와 부가 JSON 키 둘(`impact.changedPlans`,
  `stats.verifiedNotEnriched`)이다. 명령·옵션·JSON 키를 제거하거나 이름을 바꾸지 않았고
  `schemaVersion`도 그대로다. 텍스트 출력은 계획이 diff에 있을 때만 줄과 절이 붙는다.
- **종료 코드.** `impact.plan_changed`는 모든 모드에서 info라 `result`와 종료 코드를 바꾸지 않는다.
  `findingSummary.info`와 `findings:` 수는 늘 수 있다 — finding 개수를 세는 소비자에게는 관측 가능한
  변화이므로 CHANGELOG에 이름 붙여 적었다. 프로젝트가 `rules`로 이 규칙을 올리면 빌드를 실패시킬 수
  있고, 그것은 그 프로젝트의 선택이다.
- **게이트 수정 두 건은 1.28.0식 예외가 아니라 결함 수정이다.** `drift` 축소의 두 번째 기준선(N-20)은
  `evidence.stale`을 더 낼 수만 있고, lite의 승인 판정 측정(N-21)은 strict·standard가 이미 거부하던
  문서를 lite에서도 거부한다. 둘 다 문서가 이미 약속한 계약("축소는 숨기지 않는다", "일괄 승인이
  게이트를 우회하지 못한다")을 되살린다. 그래도 `--strict` 파이프라인을 새로 실패시키거나 승인을
  거부할 수 있으므로, 1.31.0의 N-8과 1.38.0의 lite 승인 거부처럼 CHANGELOG에 동작 변경으로 이름을
  붙였다.

## Evidence

- `package.json` — `version` 필드가 배포 버전의 단일 소스이며 릴리스 태그와 대조된다.

## Open Questions

- 새 검증 규칙(`related.missing`, `content.not_enriched`)이 warning→error(strict)로 승격되는 시점을 어느 릴리스에서 문서화할지.

## Review Notes

Older review notes (2 entries, 2026-07-14 → 2026-07-15) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-07-31에 **CI 게이트가 처음으로 이 문서를 잡았다**. `0b56a56`이 `RELEASE_CHECKLIST.md`에 2줄(액션 `version` 입력값과 README 액션 태그 참조를 Release Metadata 점검 대상에 추가)을 더했는데 이 문서는 그대로였다. 내용 대조 결과 **version-agnostic 정책 서술은 그대로 정확하다** — 위 2026-07-15 항목과 같은 상황이다(내용 변경 불필요, 재기준선만 필요). 다만 이번에는 `drift`가 아니라 `impact`가 잡았다: `drift`는 날짜 앵커라 같은 날(2026-07-30) 변경을 검토가 "덮은" 것으로 보지만, `impact`는 diff 앵커라 pre-merge에서 본다 — 두 명령이 상보적이라는 설계가 실제로 작동한 사례다. `verified`→`needs_review`로 강등해 게이트를 해소했다(주장을 **제거**하는 안전한 방향). 사람이 `review --approve`로 재승인할 대상이다.
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `package.json`을 재확인했다. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서의 SemVer 계약 서술은 유효하지만, **이번 배포가 그 계약의 예외라는 사실을 본문에 명시했다**: exit code 계약을 바꾸는 `impact.source_changed` 기본값 변경은 MAJOR에 해당하는데 유지보수자 결정으로 MINOR(1.28.0)로 나간다. 계약을 조용히 어기고 넘어가지 않도록 문서에 남긴다.
- 2026-10-21(1.33.0 준비)에 `evidence.stale`이 이 문서를 지목했다. 2026-09-08 이후 `package.json` 변경은 `cd2cbfe`(→1.30.1)·`3c7d6fd`(→1.31.0)·`17f2dec`(→1.32.0) 3건이고 전부 `version` 한 줄이라 version-agnostic 서술은 그대로 맞다. 같은 자리에서 1.33.0의 MINOR 판정을 이 문서의 정의에 대조했다: 빌드를 새로 실패시킬 수 있는 유일한 변경은 bare `#anchor` evidence의 `evidence.shape`(error)인데, **1.32.0의 공개 스키마(`rules/frontmatter.schema.json`의 evidence `pattern`)는 이미 그것을 거부하고 있었고**(HEAD 스키마로 직접 확인) 런타임만 받아 주던 불일치를 공개 계약 쪽으로 맞춘 것이다. 그래서 "필수 frontmatter 계약 변경"(major)이 아니라 결함 수정으로 보고, 1.28.0식 예외로 기록하지 않는다(실측 도입처 위키 11곳 evidence 1,292건 중 영향 0).
- 2026-10-26(1.35.0 배포 직전)에 `evidence.stale`이 이 문서를 지목했다. 인용 소스 `package.json`이 2026-10-21 이후 바뀌었기 때문이다. 바뀐 것은 `version` 한 줄(1.34.0 → 1.35.0)이라 version-agnostic 서술은 그대로 맞다. 날짜 앵커 drift는 N-13의 version-only 면제를 쓰지 않으므로, 릴리스 커밋마다 이 문서를 지목한다. 같은 자리에서 1.35.0의 MINOR 판정을 이 문서의 정의에 대조했다. 추가된 것은 `impact` JSON의 additive 키 2개와 컴포지트 액션 입력 하나라 minor 정의(하위 호환 기능 확장)에 맞다. 빌드를 새로 막을 수 있는 변경은 민감정보 탐지 확장 하나다(`client_secret:` 같은 키에 자격 증명 모양 값이 있으면 blocked). 이것은 명령·옵션·JSON 형태·frontmatter 계약 어느 것도 바꾸지 않는다. 기존 패턴의 `\b` 경계 때문에 의도한 대상을 놓치던 결함을 고친 것이다. 그래서 1.33.0의 `evidence.shape`처럼 결함 수정으로 보고, 1.28.0식 예외(major 규칙 위반)로는 기록하지 않는다. 다만 실제로 빌드를 막을 수 있으므로, 1.31.0의 N-8처럼 CHANGELOG에 동작 변경으로 이름 붙여 적었다(로컬 위키 11곳 실측 영향 0). 본문 정책 서술은 **불변**이다.
- 2026-10-27(1.36.0 범프)에 `evidence.stale`이 `package.json` 커밋으로 이 문서를 지목했다. 바뀐 것은 `version` 한 줄(1.35.0 → 1.36.0)이고, 이 문서는 버전 숫자를 고정하지 않으므로 서술은 유효하다. 1.36.0은 MINOR로 잡았다. 명령·옵션·JSON 키를 제거하거나 이름을 바꾸지 않았고, 동작이 바뀐 셋(검색이 any-term으로 결과를 더 냄, `impact`가 라인·섹션 인용에서 finding을 덜 냄, 링크 추출 수정으로 `markdown_link.missing`이 늘 수 있음)은 1.31.0처럼 CHANGELOG에 이름을 붙여 적었다. 검색 계약 변경을 major로 볼지는 유지보수자의 판단으로 남겼고, 유지보수자가 같은 날 MINOR로 확정했다. 위 major 정의(명령·옵션 제거, JSON 출력 형태, 필수 frontmatter)에 해당하지 않고, 예전 결과는 새 결과에 모두 포함되며(기본 limit 20에서 순위가 밀리는 경우만 예외), `search-docs`는 CI 게이트가 아니라 종료 코드가 바뀌지 않는다는 판단이다. AND로 돌아가는 CLI 플래그는 이번 릴리스에 넣지 않았다. 본문 불변.
