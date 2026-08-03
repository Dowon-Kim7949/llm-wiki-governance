---
title: Versioning
tags:
  - llm-wiki
  - verified
status: verified
doc_type: versioning
project: llm-wiki-governance
last_updated: 2026-07-31
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Dowon-Kim
reviewed_at: 2026-07-31
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

## Evidence

- `package.json` — `version` 필드가 배포 버전의 단일 소스이며 릴리스 태그와 대조된다.

## Open Questions

- 새 검증 규칙(`related.missing`, `content.not_enriched`)이 warning→error(strict)로 승격되는 시점을 어느 릴리스에서 문서화할지.

## Review Notes

- 2026-07-14에 버전 정책을 version-agnostic으로 전환하고(특정 버전 숫자 표기 제거 → `package.json` 단일 소스 참조) 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-07-15에 1.7.0 릴리스 준비로 인용 소스(`package.json` 버전 bump·`RELEASE_CHECKLIST.md` version-agnostic 갱신)가 바뀌어 evidence.stale이 떴으나, version-agnostic 정책 내용은 그대로 정확함을 확인하고 검토 기준일을 갱신해 해소했다(사람 검토 reviewed_by: Dowon-Kim). 내용 변경 없음.
- 2026-07-31에 **CI 게이트가 처음으로 이 문서를 잡았다**. `0b56a56`이 `RELEASE_CHECKLIST.md`에 2줄(액션 `version` 입력값과 README 액션 태그 참조를 Release Metadata 점검 대상에 추가)을 더했는데 이 문서는 그대로였다. 내용 대조 결과 **version-agnostic 정책 서술은 그대로 정확하다** — 위 2026-07-15 항목과 같은 상황이다(내용 변경 불필요, 재기준선만 필요). 다만 이번에는 `drift`가 아니라 `impact`가 잡았다: `drift`는 날짜 앵커라 같은 날(2026-07-30) 변경을 검토가 "덮은" 것으로 보지만, `impact`는 diff 앵커라 pre-merge에서 본다 — 두 명령이 상보적이라는 설계가 실제로 작동한 사례다. `verified`→`needs_review`로 강등해 게이트를 해소했다(주장을 **제거**하는 안전한 방향). 사람이 `review --approve`로 재승인할 대상이다.
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `package.json`을 재확인했다. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서의 SemVer 계약 서술은 유효하지만, **이번 배포가 그 계약의 예외라는 사실을 본문에 명시했다**: exit code 계약을 바꾸는 `impact.source_changed` 기본값 변경은 MAJOR에 해당하는데 유지보수자 결정으로 MINOR(1.28.0)로 나간다. 계약을 조용히 어기고 넘어가지 않도록 문서에 남긴다.
