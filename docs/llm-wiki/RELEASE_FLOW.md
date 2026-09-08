---
title: Release Flow
tags:
  - llm-wiki
  - verified
status: verified
doc_type: release_flow
project: llm-wiki-governance
last_updated: 2026-09-08
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-09-08
wiki_block_version: v1
source_files:
  - package.json
  - RELEASE_CHECKLIST.md
  - templates/github-actions/llm-wiki-validate.yml
  - .github/workflows/publish.yml
evidence:
  - package.json#section:scripts
  - RELEASE_CHECKLIST.md#section:Publish
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/VERSIONING.md
visibility: internal
contains_sensitive_info: false
---

# Release Flow

## Pipeline

1. 로컬 검증: `npm run verify`(= `node --test tests/*.test.js` + `validate-frontmatter`), 그리고 `doctor`/`init --dry-run`/`diff --check`.
2. `main` push는 CI(검증)만 실행한다. 배포는 하지 않는다.
3. 배포는 `v<version>` 태그 push로만 트리거된다: `.github/workflows/publish.yml`.
4. publish 워크플로는 태그 버전과 `package.json` 버전 일치를 확인한 뒤 공개 배포한다 — 인증은 `npm-release` 환경 secret의 패키지 한정 토큰, provenance는 OIDC 신원(아래 Prerequisites).
5. 이어서 격리된 `contents: write` 잡(`needs: publish`)이 러너 내장 `gh` CLI로 GitHub Release를 만든다. 본문은 `llm-wiki release-notes --body-only`에서 생성하며(민감정보 스캔을 거쳐 매치 시 차단), 서드파티 릴리스 액션을 쓰지 않아 무의존성을 유지한다(1.7, GATE_REVIEW Gate 12).
6. 배포 후 clean consumer(npm/npx/yarn) 설치·smoke 테스트로 확인한다.

## Prerequisites

- npm Trusted Publisher(GitHub Actions, 워크플로 파일명 `publish.yml`) 등록. npmjs.com 패키지
  Settings의 *Trusted publishing* 또는 `npm trust github <pkg> --file publish.yml --repo
  <owner/repo> --env npm-release --allow-publish`(npm ≥ 11.15.0, 계정 2FA 필수)로 한다.
  **등록은 저장소 이름이 아니라 저장소 객체에 묶이므로**, 같은 이름으로 새 저장소를 만들면
  다시 등록해야 한다.
- GitHub Environment `npm-release`의 필수 리뷰어/승인 규칙 설정(사람 승인이 필요할 때).
- publish 잡의 `actions/setup-node`에 `registry-url`을 주고, `Publish to npm` 스텝의 `env`에서
  `NODE_AUTH_TOKEN` 변수를 같은 이름의 `npm-release` 환경 secret으로 채운다. secret은 **패키지 한정 granular
  access token**이며 GitHub Environment `npm-release`에 보관한다(저장소 secret이 아님). 인증은
  이 토큰이, provenance는 OIDC 신원(워크플로의 `id-token` 쓰기 권한)이 담당한다 — 실제 배포된 모든 버전이 이
  조합이다. ⚠️ 두 가지 실패 형태를 실측으로 확인했다(1.29.3·1.29.4): 토큰 없이 `registry-url`만
  있으면 setup-node가 `NODE_AUTH_TOKEN`을 플레이스홀더 문자열로 채워 npm이 그것을 자격증명으로
  보내고 레지스트리가 **404**를 돌려준다; `registry-url`을 빼면 npm은 자격증명을 전혀 갖지 못해
  **`ENEEDAUTH`** 를 낸다. 이 저장소에서는 OIDC 토큰 교환이 완료되지 않아 **토큰 없는
  OIDC 단독 인증은 아직 동작하지 않는다.** 토큰이 만료되면 교체하고, 절대 커밋하지 않는다.

## Checklist

- 상세 절차는 저장소 루트 `RELEASE_CHECKLIST.md`의 Local Verification / Safety Gates / Release Metadata / Publish 섹션을 따른다.

## Evidence

- `package.json#section:scripts` — `verify`/`validate`/`doctor`/`audit` 스크립트 정의.
- `RELEASE_CHECKLIST.md#section:Publish` — 태그 생성/푸시와 배포 확인 절차.

## Review Notes

- 2026-07-14에 1.3.0 릴리스 설정과 체크리스트를 기준으로 재검토했다.
- 2026-07-15에 1.7.0 CI/CD 도입을 반영했다: `v*` 태그 push 시 `publish.yml`이 npm Trusted Publishing에 더해 격리된 `contents: write` GitHub Release 잡(`gh` CLI·`release-notes --body-only` 본문)을 실행한다(Gate 12). 사람 검토(reviewed_by: Dowon-Kim)를 거쳐 `verified`로 재승인했다.
- 2026-09-07(1.29.5 배포)에 `impact.source_changed`가 인용 소스 `.github/workflows/publish.yml`의 변경으로 이 문서를 지목했고, **Prerequisites를 실측으로 정정했다.** 같은 내용을 두 번 태그했다가 배포에 실패했다: `v1.29.3`은 `registry-url`만 있고 토큰이 없어 setup-node의 플레이스홀더 `NODE_AUTH_TOKEN`으로 인증을 시도해 404, `v1.29.4`는 그 입력을 제거해 OIDC 폴백을 노렸으나 npm이 자격증명을 전혀 찾지 못해 `ENEEDAUTH`. Trusted Publisher 등록(저장소 **객체**에 묶임)을 새 저장소로 다시 해도 결과가 같아 **이 저장소에서 OIDC 토큰 교환은 완료되지 않는다**는 것이 확인됐다. 1.29.5는 `npm-release` 환경 secret의 패키지 한정 토큰으로 인증하고 provenance는 OIDC로 유지한다 — 1.29.2까지 실제로 쓰인 조합이다. 이 노트의 이전 판이 "`registry-url` 제거로 해소했다"고 적은 것은 **틀렸으며**, 그 판은 게시된 적이 없어 이 정정으로 대체한다. **1.29.3·1.29.4는 npm 결번.** 에이전트(Claude Code) 편집이라 `needs_review`로 강등 후 이 저장소 정책대로 에이전트 승격했다.
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `package.json`을 재확인했다. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서는 릴리스 절차(태그 push → Trusted Publishing → GitHub Release)를 서술하고 version을 “태그와 대조되는 단일 소스”로만 인용하므로 숫자 변경으로 서술이 낡지 않는다 — 본문 **불변**. 1.28.0도 이 절차를 그대로 따른다(버전 범프 커밋 → `v1.28.0` 태그 push → Trusted Publishing; 수동 `npm publish` 없음).
