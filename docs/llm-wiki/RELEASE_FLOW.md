---
title: Release Flow
tags:
  - llm-wiki
  - verified
status: verified
doc_type: release_flow
project: llm-wiki-governance
last_updated: 2026-10-28
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-10-29
wiki_block_version: v1
source_files:
  - package.json
  - docs/RELEASE_CHECKLIST.md
  - templates/github-actions/llm-wiki-validate.yml
  - .github/workflows/publish.yml
evidence:
  - package.json#section:scripts
  - docs/RELEASE_CHECKLIST.md#section:Publish
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/VERSIONING.md
visibility: internal
contains_sensitive_info: false
source_digests:
  - package.json sha256:6917cd4e241bf53a
  - docs/RELEASE_CHECKLIST.md sha256:2fb22a641ffb93b8
  - templates/github-actions/llm-wiki-validate.yml sha256:b57506f63529776e
  - .github/workflows/publish.yml sha256:2243d9c5bfe8ec69
---

# Release Flow

## Pipeline

1. 로컬 검증: `npm run verify`(= `node --test tests/*.test.js` + `validate-frontmatter`), 그리고 `doctor`/`init --dry-run`/`diff --check`.
2. `main` push는 CI(검증)만 실행한다. 배포는 하지 않는다.
3. 배포는 `v<version>` 태그 push로만 트리거된다: `.github/workflows/publish.yml`.
4. publish 워크플로는 태그 버전과 `package.json` 버전 일치를 확인한 뒤 공개 배포한다 — **인증과 provenance 모두 npm Trusted Publishing(OIDC 신원)**이 담당한다(아래 Prerequisites).
5. 이어서 격리된 `contents: write` 잡(`needs: publish`)이 러너 내장 `gh` CLI로 GitHub Release를 만든다. 본문은 `llm-wiki release-notes --body-only`에서 생성하며(민감정보 스캔을 거쳐 매치 시 차단), 서드파티 릴리스 액션을 쓰지 않아 무의존성을 유지한다(1.7, GATE_REVIEW Gate 12).
6. 배포 후 clean consumer(npm/npx/yarn) 설치·smoke 테스트로 확인한다.

## Prerequisites

- npm Trusted Publisher(GitHub Actions, 워크플로 파일명 `publish.yml`) 등록. npmjs.com 패키지
  Settings의 *Trusted publishing* 또는 `npm trust github <pkg> --file publish.yml --repo
  <owner/repo> --env npm-release --allow-publish`(npm ≥ 11.15.0, 계정 2FA 필수)로 한다.
  **등록은 저장소 이름이 아니라 저장소 객체에 묶이므로**, 같은 이름으로 새 저장소를 만들면
  다시 등록해야 한다.
- GitHub Environment `npm-release`의 필수 리뷰어/승인 규칙 설정(사람 승인이 필요할 때).
- **인증 주체는 OIDC다. 레지스트리 메타데이터로 확인한다.** `npm view llm-wiki-governance@<version> --json`의
  `_npmUser`가 인증한 신원을 기록한다. 실측(2026-09-08): 1.29.5·1.30.0·1.30.1 모두
  `{name: "GitHub Actions", email: "npm-oidc-no-reply@github.com", trustedPublisher: {id: "github",
  oidcConfigId: "oidc:a5a81843-…"}}`이다 — 즉 **npm Trusted Publishing(OIDC)이 인증했다.** 사람 계정
  (`dowonk-7949`)으로 찍힌 것은 수동 배포한 1.16.0뿐이다. 새 버전을 낸 뒤 이 필드를 확인하는 것이
  인증 경로를 판정하는 가장 값싼 방법이며, `npm publish --dry-run`은 레지스트리 PUT을 하지 않으므로
  인증을 검증하지 못한다.
- publish 잡의 `actions/setup-node`는 `registry-url`을 받지만, **2026-10-27부터 어떤 스텝도 저장된
  npm 토큰을 받지 않는다**(GATE_REVIEW "Publish Credential Cleanup" 결정). 인증은 Trusted Publishing만
  한다. 등록이 깨지면 저장된 토큰으로 넘어가지 않고 릴리스가 실패한다. 근거는 두 가지다. 1.16.1–1.29.2
  19개 버전이 토큰 env 없이 같은 형태로 게시됐고, 1.29.5–1.35.0 8개 버전도 레지스트리상 인증 주체가 전부
  OIDC다. 사전 점검 스텝이 npm 11.5.1 미만이거나 OIDC 토큰 요청이 불가능하면 잡을 먼저 실패시키고,
  `tests/publish-workflow.test.js`가 워크플로에 `secrets.` 참조가 다시 생기면 실패한다. `registry-url`을
  주면 OIDC가 무력화된다는 1.29.4의 전제는 **거짓이다**.
- **아직 증명되지 않은 것:** 토큰 없이 다음 릴리스가 성공하는지는 실제 배포로만 확인된다. 실패하면
  Trusted Publisher 등록(저장소·`publish.yml`·환경 `npm-release`)부터 확인한다. env 복원은 롤백일 뿐
  해결책이 아니다. 성공을 `_npmUser`로 확인한 뒤 유지보수자가 환경 secret을 지우고 npmjs.com에서 토큰을
  폐기한다.
- **1.29.3·1.29.4 실패의 원인은 워크플로가 아니라 등록이었다.** Trusted Publisher 등록은 저장소 이름이
  아니라 **저장소 객체**에 묶이므로, 2026-09-03 저장소 교체(옛 저장소를 private archive로 돌리고 같은
  이름으로 새 public 저장소를 만든 것)로 등록이 무효화됐다. 그 뒤 새 저장소로 재등록되면서
  config id가 `oidc:a5a81843-…`가 되고 1.29.5부터 복구됐다. **1.29.3·1.29.4는 npm 결번이다.**

## Checklist

- 상세 절차는 저장소 루트 `docs/RELEASE_CHECKLIST.md`의 Local Verification / Safety Gates / Release Metadata / Publish 섹션을 따른다.
- **버전을 손으로 적는 자리가 `package.json` 말고 둘 더 있다.** 도입처가 실제로 받아 실행하는 핀이라 낡으면 조용히 구버전이 돈다.
  - `templates/github-actions/llm-wiki-validate.yml`의 `npx -y llm-wiki-governance@<X.Y>` — **1.32.0부터 `tests/verification.test.js`가 `package.json` 버전에서 X.Y를 계산해 대조하므로, 안 올리면 테스트가 실패한다.** 1.32.0에서 템플릿이 `npm ci` + `npx --no-install` 대신 이 형태를 쓰게 되면서 생긴 자리다.
  - `.github/actions/validate/action.yml`의 `version` 입력 기본값(patch 없는 `X.Y` 형식) — 같은 배치에서 같은 방식의 테스트를 붙였다. 이 값은 1.27.0–1.27.2에 걸쳐 실제로 낡은 적이 있고, 그래서 `docs/RELEASE_CHECKLIST.md`가 그 사고를 근거로 이 항목을 명시 지목한다.
- 태그 버전과 `package.json` 일치는 publish 워크플로가 확인하지만(위 Pipeline 4), 위 두 핀은 **태그를 밀기 전 로컬 테스트에서만** 걸린다.
- **테스트가 보지 않는 문서 속 핀도 있다.** README 2종의 컴포지트 액션 태그(`validate@v<X.Y.Z>`, `docs/RELEASE_CHECKLIST.md`가 지목)와 [EXAMPLES](EXAMPLES.md)의 CI 예시 `npx -y llm-wiki-governance@<X.Y>` 네 줄이다. 실행되는 핀이 아니라 복사되는 예시라 낡아도 아무것도 실패하지 않는다 — EXAMPLES는 1.36.0이 나간 뒤에도 `@1.35`였고 1.37.0 준비 중에 발견해 `@1.37`로 고쳤다. 범프할 때 `git grep -n "@<이전 X.Y>"`로 같이 찾는다.
- **브랜치에서 "아직 배포 안 됨"으로 적은 표기도 범프 때 정리한다(1.38.0).** 기능을 릴리스보다 먼저 문서화하면 README 2종·데모 README·위키 여러 곳이 그 사실을 적는다(1.38.0의 `--greenfield`는 열두 곳이었다). 범프 커밋에서 `git grep -n "미배포\|not in a published release\|배포된 릴리스에 없"`로 찾아 버전으로 바꾼다. `log.md`·`REVIEW_HISTORY.md`의 과거 항목은 당시 사실이므로 그대로 둔다.
- **tarball 구성도 확인한다(1.34.0).** `npm pack --dry-run`에는 `bin/`·`src/`·`templates/`·`templates/rules/`·`adapters/`·`templates/profiles/`와 README 2종·`LICENSE`만 나와야 한다. 프로젝트 문서를 `files`에 다시 넣으면 `tests/verification.test.js`가 실패한다.

## Evidence

- `package.json#section:scripts` — `verify`/`validate`/`doctor`/`audit` 스크립트 정의.
- `docs/RELEASE_CHECKLIST.md#section:Publish` — 태그 생성/푸시와 배포 확인 절차.

## Review Notes

Older review notes (4 entries, 2026-07-14 → 2026-10-21) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-09-07(1.29.5 배포)에 `impact.source_changed`가 인용 소스 `.github/workflows/publish.yml`의 변경으로 이 문서를 지목했고, **Prerequisites를 실측으로 정정했다.** 같은 내용을 두 번 태그했다가 배포에 실패했다: `v1.29.3`은 `registry-url`만 있고 토큰이 없어 setup-node의 플레이스홀더 `NODE_AUTH_TOKEN`으로 인증을 시도해 404, `v1.29.4`는 그 입력을 제거해 OIDC 폴백을 노렸으나 npm이 자격증명을 전혀 찾지 못해 `ENEEDAUTH`. Trusted Publisher 등록(저장소 **객체**에 묶임)을 새 저장소로 다시 해도 결과가 같아 **이 저장소에서 OIDC 토큰 교환은 완료되지 않는다**는 것이 확인됐다. 1.29.5는 `npm-release` 환경 secret의 패키지 한정 토큰으로 인증하고 provenance는 OIDC로 유지한다 — 1.29.2까지 실제로 쓰인 조합이다. 이 노트의 이전 판이 "`registry-url` 제거로 해소했다"고 적은 것은 **틀렸으며**, 그 판은 게시된 적이 없어 이 정정으로 대체한다. **1.29.3·1.29.4는 npm 결번.** 에이전트(Claude Code) 편집이라 `needs_review`로 강등 후 이 저장소 정책대로 에이전트 승격했다.
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 `package.json`을 재확인했다. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서는 릴리스 절차(태그 push → Trusted Publishing → GitHub Release)를 서술하고 version을 “태그와 대조되는 단일 소스”로만 인용하므로 숫자 변경으로 서술이 낡지 않는다 — 본문 **불변**. 1.28.0도 이 절차를 그대로 따른다(버전 범프 커밋 → `v1.28.0` 태그 push → Trusted Publishing; 수동 `npm publish` 없음).
- 2026-10-26(1.35.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `templates/github-actions/llm-wiki-validate.yml`을 대조했다. 이번 diff에서 그 템플릿이 바뀐 것은 버전 핀 세 줄(`@1.34` → `@1.35`)이 전부이고, 이 문서가 적어 둔 MINOR 릴리스 절차(템플릿과 액션 기본값의 핀을 함께 올린다)를 그대로 따른 것이다. 본문 **불변**.
- 2026-10-27에 `impact`가 인용 소스 `.github/workflows/publish.yml`의 변경으로 이 문서를 지목했고, **Prerequisites를 고쳤다.** publish 스텝이 더 이상 저장된 npm 토큰을 받지 않는다(GATE_REVIEW "Publish Credential Cleanup" 결정). 사전 점검 스텝과 `tests/publish-workflow.test.js`도 추가됐다. "남겨 둔 이유는 폴백"이라는 이전 서술은 사실이 아니게 됐다. 다음 릴리스의 성공 여부는 아직 증명되지 않았다고 명시했다.
- 2026-10-27(1.36.0 준비)에 `impact`가 이 문서를 지목해 인용 소스 `templates/github-actions/llm-wiki-validate.yml`을 대조했다. 바뀐 것은 버전 핀 세 줄(`@1.35` → `@1.36`)이 전부이고, 이 문서가 말하는 범프 절차(테스트가 X.Y를 계산해 대조) 그대로다. 본문 불변.
