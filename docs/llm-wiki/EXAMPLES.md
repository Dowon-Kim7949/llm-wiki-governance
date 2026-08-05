---
title: Examples
tags:
  - llm-wiki
  - verified
status: verified
doc_type: examples
project: llm-wiki-governance
last_updated: 2026-08-05
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Claude Code (delegated by Dowon-Kim)
reviewed_at: 2026-08-05
wiki_block_version: v1
source_files:
  - src/cli.js
  - README.md
evidence:
  - src/cli.js#symbol:printHelp
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/PUBLIC_API.md
visibility: internal
contains_sensitive_info: false
---

# Examples

실제로 검증된 사용 예시입니다. 명령/옵션 근거는 [Public Api](PUBLIC_API.md).

## Zero-base 프로젝트 초기화

```bash
llm-wiki init --dry-run --type library --agent codex --agent claude
llm-wiki init --write   --type library --agent codex --agent claude
llm-wiki validate --type library
```

## 생성 문서 언어 선택 (--doc-lang, 1.24)

```bash
llm-wiki quickstart --write --agent claude                # 위키 본문 = 영어(기본)
llm-wiki quickstart --write --agent claude --doc-lang ko  # 위키 본문 = 한국어
llm-wiki init --write --type backend --doc-lang ko        # 도메인 문서까지 한국어
```

`--doc-lang`은 생성 문서(와 handoff/스킬의 문서 작성 지시) 언어를, `--lang`은 findings/`explain` 메시지 언어를 고른다(독립적). config `llm-wiki.config.json`의 `docLanguage: "ko"`로도 기본값을 둘 수 있고 CLI가 우선한다. 기술 식별자(경로·JSON 키·frontmatter 필드·status 값·evidence locator)는 번역하지 않는다.

## 스킬 생성 + 최초 보강(bootstrap)

```bash
# init과 함께 에이전트 네이티브 스킬 생성:
#   --agent codex  -> .agents/skills/llm-wiki-<task>/SKILL.md
#   --agent claude -> .claude/skills/llm-wiki-<task>/SKILL.md
#   --skills       -> 모든 네이티브 형식(claude·codex·cursor·중립 프롬프트)
llm-wiki init --write --type backend --agent codex        # Codex 스킬 4개(bootstrap/feature/fix/docs-sync)
llm-wiki init --write --type backend --skills             # 모든 형식

# 최초 보강 워크플로를 프롬프트로도 받을 수 있다(스킬과 동일 규칙, handoff와 단일 소스 공유):
llm-wiki prompt --task bootstrap --type backend --agent codex
```

생성된 `llm-wiki-bootstrap` 스킬(또는 `prompt --task bootstrap`)을 에이전트에 붙여넣으면, `init --write`가 만든 뼈대를 실제 코드 근거로 보강하고 모든 문서를 `needs_review`로 남긴다(도구는 스킬 파일만 만들고 실행은 에이전트가 한다 — recognize-don't-run). 기존 스킬 파일은 덮어쓰지 않는다.

## 온보딩·작업 준비 (onboard · prepare)

```bash
# 신입이 업무 영역을 코드 근거와 함께 학습(읽기 전용):
llm-wiki onboard                          # 프로젝트 전체 오리엔테이션
llm-wiki onboard --domain authentication  # 특정 업무 영역
llm-wiki onboard --domain authentication --lang ko

# 기능 추가/수정 착수 전 범위 조사(읽기 전용, 후보만 제시·단정 없음):
llm-wiki prepare --task "로그인 실패 횟수를 화면에 표시"
llm-wiki prepare --task "사용자 목록 API의 500 오류 수정" --lang ko
```

`onboard`는 읽을 문서·소스/테스트 진입점·불변조건·최신성 경고·이해도 점검 질문을 기존 위키에서 조립하고, `prepare`는 관련 문서·후보 소스/테스트·위험·범위 점검표를 낸다. 둘 다 CLI가 설명을 창작하지 않으며(코드가 최종 사실) 아무것도 쓰지 않는다 — 실제 설명·구현은 `/llm-wiki-onboard`·`/llm-wiki-prepare` 스킬과 이어지는 `/llm-wiki-feature`·`/llm-wiki-fix`가 담당한다. 흐름: 신입 → onboard → prepare → feature/fix → 사람 검토.

## 이 저장소를 dogfooding한 방법

```bash
# 뼈대 생성(core + library profile + adapters)
node bin/llm-wiki.js init --write --type library --agent codex --agent claude
# 이후 각 문서를 실제 소스 근거로 보강하고 재검증
node bin/llm-wiki.js validate --type library
```

## CI에서 검증

```bash
npx llm-wiki validate-frontmatter
npx llm-wiki validate --strict --agent codex
npx llm-wiki impact --since origin/main     # 소스는 바뀌고 그 문서는 안 바뀐 verified 문서 — 플래그 없이 exit 1
npx llm-wiki drift --strict                 # 날짜 앵커 최신성 — 이쪽은 --strict가 있어야 실패한다
```

`--strict`는 warning을 실패로 처리하므로 `related.missing`·`content.not_enriched`·`evidence.*`가 릴리스 게이트에서 CI를 실패시킬 수 있다.

`impact`는 예외다. 2026-08-03(결정 21)부터 `impact.source_changed`의 기본 severity가 warning이 아니라 **error**라, `--strict` 없이 exit 1이고 이 규칙에 대해 `--strict`는 no-op이다 — 즉 위 블록의 `impact` 줄을 필수 체크에 넣는 순간, 자기를 인용하는 문서를 함께 건드리지 않고 소스만 바꾼 첫 커밋에서 빌드가 빨개진다. 되돌리는 길은 코드가 아니라 설정이다: `llm-wiki.config.json`의 `rules`에 `"impact.source_changed": "warning"`(또는 `"info"`/`"off"`)을 두거나, `rulesPreset: "relaxed"`(이 규칙을 `info`로 유지)를 쓴다. `strict` 프리셋은 이 규칙을 더 이상 나열하지 않는다(no-op이라서다). `drift`·`check-run`의 규칙은 아직 warning이라 두 명령은 계속 `--strict`가 있어야 빌드를 실패시킨다 — 의도된 비대칭이다.

릴리스 커밋에 대한 예외가 하나 있다(N-13, 1.29.0부터): `version` 값만 바뀐 `package.json`은 `changed_files`에는 계속 세지만 앵커 대조에서는 빠지므로, 버전만 올리는 커밋이 그 매니페스트를 인용하는 문서들 때문에 실패하지 않는다. 요약에 `anchoring_files`와 제외된 경로가 함께 인쇄되고 `--format json`에는 `versionOnlyExcluded[]`가 붙는다. 다른 키가 바뀌었거나, `version`이 실제로 움직이지 않았거나(재포맷·줄바꿈 변환), 조건부 `exports`의 키 순서가 바뀌었거나, 매니페스트가 파싱되지 않거나, 비교할 기준 내용이 없으면 그대로 센다. `impact` 한정이므로 위 블록의 `drift --strict` 줄은 버전만 올려도 계속 지목할 수 있다. **릴리스 커밋의 게이트 비용이 0이 되지는 않는다** — 같은 커밋에서 `README.md`·`ROADMAP.md`·action.yml처럼 내용이 실제로 바뀐 파일을 인용하는 문서는 계속 발화하고, 그건 진짜 양성에 가깝다.

## 드리프트 감시 범위 넓히기 (--watch-needs-review, 결정 28)

```bash
llm-wiki drift                        # 기본: verified 문서만 date-앵커 최신성 검사
llm-wiki drift --watch-needs-review   # needs_review 문서까지 함께 본다(기본 off)
```

`--watch-needs-review`는 **`drift`만** 받는다. `impact`에는 의도적으로 넓히지 않는데, 그 규칙은 결정 21 이후 error라 자문용 opt-in이 검토되지 않은 문서에게 빌드를 실패시킬 권한을 주게 되기 때문이다. `doc_type: release_notes` 문서는 `evidence.stale`·`impact.source_changed` 양쪽에서 면제되며, 이 면제가 위 opt-in보다 우선한다.

## 다음 조치 추천 / 규칙 설명

```bash
llm-wiki next
llm-wiki explain content.not_enriched
```

## Evidence

- `src/cli.js#symbol:printHelp` — 지원 명령·옵션의 실제 사용법 문자열.

## Review Notes

Older review notes (6 entries, 2026-07-13 → 2026-07-23) are archived in [REVIEW_HISTORY.md](REVIEW_HISTORY.md); this section keeps only the most recent 5. The append-only change log stays in [log.md](log.md).

- 2026-07-23에 "생성 문서 언어 선택(--doc-lang, 1.24)" 예시 섹션을 추가했다(`quickstart --write --agent claude` 영어 기본 / `--doc-lang ko` 한국어 / config `docLanguage`). 예시 명령은 현재 CLI 표면과 일치한다. 에이전트(Claude Code) 편집이라 `needs_review` 유지 — 사람 검토 후 재승인 예정.
- 2026-07-23에 위 1.24.0(doc-language i18n + guided onboarding) 반영분을 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-23)를 거쳐 `verified`로 재승인했다. `--doc-lang` 예시가 현재 CLI 표면(HEAD c7a1a7a, npm dist-tags.latest=1.24.0)과 일치함을 확인했다.
- 2026-08-03에 Review Notes 5건 상한 집행 배치에서 오래된 4건(2026-07-13 → 2026-07-23)을 `REVIEW_HISTORY.md`의 신규 `Examples` 절로 원문 그대로 옮겼다(8건 → 4건 + 이 노트 = 5건). **이 문서도 인수인계의 위반 목록에서 빠져 있었다**(`BENCHMARK.md`와 함께) — 손으로 적은 목록 대신 전 문서를 계수해서야 드러났고, 이제 `tests/review-notes-cap.test.js`가 그 계수를 대신한다. 예제 본문·명령 표기는 불변이다. 에이전트(Claude Code) 편집이라 `verified`→`needs_review`로 강등 — 사람 검토 후 재승인 예정, 허위 검토 메타 미기입.
- 2026-08-03에 결정 21·28로 바뀐 `src/cli.js`(신규 `--watch-needs-review`, `impact` 도움말 재작성)와 `README.md`(Upgrading 절)를 대조했다: 기존 예시 중 거짓이 된 문장은 하나도 없었고(이 문서는 `impact --strict`를 쓴 적이 없고 `--strict` 설명은 `validate` 한정이라 그 문장은 **불변**), 대신 CI 절에 `impact --since`가 플래그 없이 exit 1이라는 계약과 되돌리는 설정 두 가지(`rules`의 `warning`/`info`/`off`, `rulesPreset: "relaxed"`)를 더하고 `drift --watch-needs-review` 예시 절을 신설했다 — 두 예시 모두 실제 실행으로 확인했다(`impact --since HEAD~1` → error 6건·exit 1).
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 문서를 지목해 인용 소스 2건을 재확인했다: `src/cli.js`, `README.md`. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 이 문서의 예제는 `drift`의 usage 요약을 인용하지 않고(직전 노트에서 추가한 것은 `impact` CI 레시피다), README 변경은 Upgrading 절의 **배포 상태 문장**(“다음 릴리스는 MAJOR·미릴리스” → “1.28.0으로 배포”)과 액션 핀 문자열이라 예제가 재현하는 동작에 영향이 없다 — **불변**. 본문 변경 없음.
