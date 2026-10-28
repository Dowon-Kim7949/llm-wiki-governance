---
title: LLM-WIKI Change Log
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: change_log
project: llm-wiki-governance
last_updated: 2026-08-06
author: cli-generated
last_edited_by: Claude Code
wiki_block_version: v1
source_files:
  - package.json
evidence:

related:
  - docs/llm-wiki/index.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Change Log

이 문서는 append-only 변경 로그입니다. 기존 항목은 수정하지 말고 새 변경 사항을 위에 추가합니다.

## 2026-10-28 - fix(security,drift,detector): N-25 재검증 — CLI는 영향 밖이었고, 스탬프 커밋과 TOML 배열 테이블에 결함이 더 있었다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs, wiki
- changed: `src/git.js`(리비전 뒤 `--`, `commitsTouchingKey`·`committedBy` 신설, `lastCommitTouchingKey` 제거, `isPathIgnored`에 `--`) · `src/release-notes.js`(range 뒤 `--`) · `src/commands/scans.js`(`reviewStamp`) · `src/detector.js`(`tomlSectionName`의 배열 테이블) · 테스트 4파일(+9) · CHANGELOG 2종 · SECURITY 2종 · README 2종 · ROADMAP 2종 · `docs/VALIDATION.md`(.ko) · 신규 `docs/USABILITY_PROTOCOL.md`(.ko) · 위키 `PUBLIC_API`·`ARCHITECTURE_CONVENTIONS`·`DOMAIN_FEATURES`·`HARNESS_GOVERNANCE_ROADMAP`(59 정정, 60~63 신설)·`VERSIONING`
- summary:
  - N-25를 독립적으로 다시 검토했다. 배포 tarball 69개를 인터페이스별로 확인했다. CLI는 파서가 `-`로 시작하는 값을 거부해서 영향이 없었고, 영향받은 것은 MCP와 프로그래밍 API다(`llm-wiki-governance` 1.16.0~1.38.0, 옛 패키지 1.5.0~1.15.1). 앞선 기록의 "CLI 세 명령도 같다"는 틀린 서술이라 정정했다.
  - 회귀 테스트에 측정 결함이 있었다. 정해진 파일 이름만 확인해서 `release-notes` 경로를 놓쳤는데, 이를 고쳤다.
  - 정확성 결함도 하나 막았다. 리비전 뒤에 `--`가 없어서 파일 이름을 준 `since`가 pathspec으로 읽히고, 틀린 변경 집합이 오류 없이 반환됐다. 이제 `--`를 붙인다.
  - N-20 재검증에서, 스탬프 커밋으로 리뷰보다 늦은 커밋이 골라지는 이력 두 가지(본문 예시 줄, 리뷰 브랜치의 squash·rebase)를 재현하고 막았다.
  - N-24의 줄 단위 리더가 배열 테이블 헤더(대괄호를 두 겹 쓰는 `bin` 같은 헤더)를 섹션 경계로 읽지 못하던 결함을 고쳤다. 처음 쓴 위키 서술에는 그 헤더를 대괄호째 적어서 `wiki_link.missing` 5건이 났고, `validate --strict`가 그것을 잡아 표현을 바꿨다.
  - 승인 게이트는 모드 floor가 심각도를 낮춘 규칙을 복원하지 않는다. floor에 그런 규칙이 새로 생기면 실패하는 가드 테스트를 넣었다.
- evidence: 가드 테스트 7개 중 5개가 가드 없는 트리에서 실패하고 수정본에서는 통과 · 새 drift 테스트 2건이 `57ec108` 트리에서 실패 · TOML 테스트가 수정 전에는 `cli-tool`을 반환 · 깨끗한 환경(tarball 설치, 격리한 HOME·npm·git 설정)에서 README Quick Start와 워크스루 4종 통과 · 전체 테스트 수는 최종 실행 결과로 CHANGELOG에 기록
- caveats:
  - MCP `cwd`의 신뢰 경계와 git 로컬 설정은 고치지 않고 `SECURITY.md`에 문서화했다.
  - 리뷰 당일의 squash·rebase는 여전히 위음성이다(테스트로 고정).
  - 이 기록 시점에 CI 매트릭스는 아직 돌지 않았다.
  - 재현 세부를 담은 내부 보안 평가와 보안 권고 초안은 이 저장소에 두지 않았다.

## 2026-10-28 - fix(security): 읽기 전용 MCP 서버가 git 옵션 주입으로 파일을 썼다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs, wiki
- changed: `src/git.js`(`assertRevision`, 호출자 리비전을 받는 네 함수에 적용) · `src/release-notes.js`(`collectCommits`) · `tests/git-revision-guard.test.js`(신규 3) · CHANGELOG 2종(1.40.0 절에 보안 항목, 테스트 수 789 → 792) · 위키 `PUBLIC_API`(MCP 절)·`ARCHITECTURE_CONVENTIONS`(git.js)·`HARNESS_GOVERNANCE_ROADMAP`(N-25)
- summary: 최종 보고의 보안 절을 쓰려고 `--since` 검증 여부를 확인하다 찾았다. MCP `validate`의 `since`가 git에 그대로 닿아 `--output=<경로>`가 diff를 그 경로에 썼다(임시 저장소에서 재현). CLI 세 명령도 같은 형태였다. `-`로 시작하는 리비전을 거부한다. git이 받는 리비전 중 `-`로 시작하는 것은 없다.
- evidence: 재현 스크립트가 수정 전 `true`(파일 생성), 수정 후 `false` · 신규 테스트 3건 통과 · 전체 테스트 792
- caveats: 1.38.0까지 배포된 버전에 있는 문제다. 1.39.0만 따로 배포하면 이 수정이 빠진다(브랜치 `feat/1-39-correctness`에는 없다). 공개 저장소에 이 커밋을 push하면 문제의 형태가 드러나므로, 배포 순서와 GitHub 보안 권고 여부는 유지보수자 결정이다.

## 2026-10-28 - release: 1.40.0 준비 — 이 저장소 밖에서도 같은 검사

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: release, docs, wiki
- changed: `package.json`(1.39.0 → 1.40.0) · `tests/verification.test.js`(버전 단언) · `.github/actions/validate/action.yml`(기본값 1.40) · `templates/github-actions/llm-wiki-validate.yml`(핀 3줄) · `CHANGELOG.md`·`CHANGELOG.ko.md`(1.40.0 절) · `ROADMAP.md`·`ROADMAP.ko.md`(출시 절) · README 2종(액션 핀) · 위키 `VERSIONING`(1.40.0 MINOR 판정 절)·`EXAMPLES`(CI 예시 핀)·`REVIEW_HISTORY`(서문 한 줄)
- summary: 앞 커밋(`16a231a`)을 1.40.0 MINOR로 묶는다. 출하되는 변경은 `init`의 `typeHint`, `unknown` 감지에 대한 type review item 제외, Python·Rust 생성 문서의 프로젝트 이름 셋이고, 셋 다 다른 스택 워크스루가 찾은 결함에서 나왔다. 예제와 검증 문서는 tarball에 들어가지 않으므로 그것만으로 릴리스하지 않았을 것이다 — 버전을 목표 숫자에 맞춘 것이 아니라는 판단을 VERSIONING에 남겼다.
- evidence: 테스트 789/789 · `validate --strict`·`impact --since main --strict` pass(재승인 후 확인)
- caveats: 1.39.0과 같은 날 두 릴리스를 준비했다. 둘 다 로컬 커밋뿐이고 push·태그·배포는 유지보수자 승인 대기다. 1.39.0만 먼저 낼 수 있도록 브랜치를 나눴다(`feat/1-39-correctness` ⊂ `feat/1-40-validation`). 공유 덱의 대상 버전은 배포 전이라 바꾸지 않았다.

## 2026-10-28 - feat(validation): 다른 스택에서 처음부터 끝까지 — Python·React+Node 워크스루와 감지 결함 셋

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, examples, docs, wiki
- changed: `src/detector.js`(`workspaceTypeHint`, `tomlSectionName`, 프레임워크 의존성 목록 상수화, `unknown` 감지에 대한 type 차이 review item 제외) · `src/commands.js`(`init`의 `hint:` 줄과 JSON `typeHint`) · `examples/python-fastapi-brownfield/`·`examples/react-node-fullstack/`(신규, 앱·보강 문서·워크스루·README 2종) · `examples/_shared/walkthrough-kit.mjs`(신규) · `examples/greenfield-vue-demo/`(요구사항을 코드보다 먼저 바꾸는 8단계, 검사 20 → 23) · `examples/README.md` · `tests/cross-stack-detection.test.js`(신규 4)·`tests/stack-walkthroughs.test.js`(신규 2)·`tests/greenfield-demo-walkthrough.test.js`(검사 수) · `docs/VALIDATION.md`·`.ko.md`(신규, 위키 밖) · README 2종("다른 스택" 문단) · `outputs/distribution/introduction-2026-10.md`(공개 소개 초안, 게시 안 함) · 위키 9종
- summary: 미션의 1.40.0 목표 "이 저장소 밖에서도 된다는 것을 재현 가능하게 보인다"를 스크립트 워크스루로 했다. Python 서비스(검사 21개)와 React + Express workspace(검사 15개)를 각각 실제 CLI로 처음부터 끝까지 돌리자 이 저장소의 테스트로는 안 보이던 결함 셋이 첫날 나왔다. workspace 풀스택이 `unknown`으로 감지되고(N-22), 그 안내대로 `--type`을 기록하면 `validate --strict`가 매번 깨지고(N-23), Python 서비스가 디렉터리 이름으로 불렸다(N-24). N-22는 감지 결과를 바꾸지 않고 `init`이 제안하게 했다 — 바꾸면 type 없이 초기화된 기존 workspace 저장소의 필수 문서가 바뀐다. greenfield 데모에는 1.39.0의 `impact.plan_changed`를 코드와 함께 바뀐 경우와 코드보다 먼저 바뀐 경우 둘 다 넣었다.
- evidence: 테스트 783 → 789 전부 통과 · 워크스루 greenfield 23/23·Python 21/21·풀스택 15/15 · `tests/cross-stack-detection.test.js`는 1.39.0 코드에서 실패(가져올 함수가 없다), N-23은 수정 전 풀스택 워크스루의 `validate --strict` 실패로 재현
- decision: 기존 두 데모를 공유 키트로 옮기지 않았다(동작이 같고 증명이 늘지 않는다). 실제 에이전트 실행은 하지 않았다(유지보수자 선택: 결정적 검사만) — 어댑터·스킬 파일이 위키를 가리키는지까지가 검증 범위다.
- caveats: 스택 워크스루는 애플리케이션을 실행하지 않는다(Python·npm 설치 없음). Go·Rust·JVM·PHP·Ruby·.NET·모바일·인프라는 여전히 감지 단위 테스트뿐이다. README를 따라 해 본 독립 개발자는 없다(`docs/VALIDATION.md` 사용성 절).

## 2026-10-28 - release: 1.39.0 준비 — 막으라고 있는 것을 통과시키던 게이트 두 개와 계획 → 코드 방향

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: release, docs, wiki
- changed: `package.json`(1.38.0 → 1.39.0) · `tests/verification.test.js`(버전 단언) · `.github/actions/validate/action.yml`(기본값 1.39) · `templates/github-actions/llm-wiki-validate.yml`(핀 3줄) · `CHANGELOG.md`·`CHANGELOG.ko.md`(1.39.0 절, 1.37.0 절의 거짓 주장 두 곳에 정정 표기) · `ROADMAP.md`·`ROADMAP.ko.md`(출시 절) · README 2종(액션 핀, greenfield 문단에 `impact.plan_changed` 한 문장, "변경 감지" 항목에 축소 조건 한 구절) · 위키 `VERSIONING`(1.39.0 MINOR 판정 절)·`EXAMPLES`(CI 예시 핀)·`REVIEW_HISTORY`(서문 한 줄)
- summary: 앞 커밋(`63310ff`)을 1.39.0 MINOR로 묶는다. info 규칙 하나와 부가 JSON 키 둘이고, 게이트 수정 두 건(N-20, N-21)은 finding을 더하거나 승인을 거부할 수 있어 CHANGELOG에 동작 변경으로 이름 붙였다. 1.37.0 CHANGELOG의 "숨기지 않는다"는 지우지 않고 취소선과 정정 표기를 달았다 — 이력은 당시 주장을 보여 주고, 틀렸다는 사실도 같은 자리에서 보여야 한다.
- evidence: `impact --since HEAD --strict` pass(재승인 후) · 테스트 수는 CHANGELOG에 적은 783을 실제 실행으로 확인
- caveats: 공유 덱(`outputs/team-briefing/`)의 대상 버전 표기(v1.38.0 다섯 곳)는 **고치지 않았다** — 덱은 배포된 최신 버전을 가리키고 1.39.0은 배포 전이다(push·태그·배포는 유지보수자 승인 대기). 배포할 때 정렬한다. 위키 `README.md`의 `evidence.stale`(10-28의 1.38.0 릴리스 커밋이 원인, 이 브랜치 이전부터 있던 상태)도 이번 재승인으로 해소했다.

## 2026-10-28 - fix(drift,review) + feat(impact): 축소가 바뀐 인용을 숨겼고, lite가 strict의 승인 거부를 비켜 갔다 · impact.plan_changed

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs, wiki
- changed: `src/git.js`(`lastCommitTouchingKey`·`lineRangeChangedBetween`·`renamedPaths`, `commitAtEndOf` 주석 정정) · `src/commands/scans.js`(`reviewStamp`·`citedRegionsSinceStamp`, `driftTargets`의 `baselineKey`) · `src/config-file.js`(`governanceSuppressedRules`) · `src/commands.js`(`reviewCommand` 승인 측정 확대, `statsCommand`의 `verifiedNotEnriched`, `impactCommand`의 `changedPlans`) · `src/commands/plan-changes.js`(신규) · `src/commands/findings.js`·`src/i18n.js`(`impact.plan_changed` 등록, en/ko) · `src/cli.js`(`help drift`·`help impact`) · `src/commands/doc-content.js`(요구사항 개요의 "변경" 줄) · 테스트 `drift-narrowing-baseline`(신규 12)·`impact-plan-changed`(신규 10)·`rule-toggle-measurement`(+4)·`verification`(줄 범위 픽스처가 리뷰를 커밋하도록) · 위키 10종
- summary: 외부 검토(ChatGPT, 2026-10-28)가 지적한 "drift 섹션 축소의 위음성 가능성"을 커밋 날짜를 고정한 git 이력으로 재현했다. 리뷰일 끝 스냅샷은 날짜 순서로 고른 커밋이라, 리뷰 당일 날짜의 곁가지 커밋이 리뷰 뒤 머지되거나, 리뷰 당일 리뷰 뒤에 커밋되거나, committer date가 과거인 리뷰 뒤 커밋이 있으면 바뀐 인용 영역을 "그대로"로 읽고, 무관한 후속 편집으로 파일 단위 검사가 잡았을 문서를 지웠다(N-20). 1.37.0 CHANGELOG의 "숨기지 않는다"는 거짓이었고, 1.37.0 이전부터 있던 줄 범위 축소도 같은 경우에 숨겼다. 이제 리뷰 스탬프를 쓴 커밋도 동의해야 축소한다. 같은 날 lite 승인 경로를 다시 훑다가, config `"strict": true`인 lite가 strict·standard가 거부하는 문서(존재하지 않는 파일 인용)를 승인하는 것을 세 모드로 재현했다(N-21). `review`가 모드의 floor만이 끈 규칙도 측정한다. 1.38.0 이전 lite에서 승인된 스캐폴드는 `stats.verifiedNotEnriched`로 보이게 했다(바꾸지는 않는다). 계획 → 코드 방향 `impact.plan_changed`(info)는 2026-10-28 설계 검토안에서 한 가지를 바꿨다: 연결 파일이 같은 diff에서 바뀌었다고 침묵하지 않고 파일별 `changed`/`unchanged`/`missing`/`uncertain`으로 표시한다.
- evidence: `tests/drift-narrowing-baseline.test.js` 12건 중 5건, `rule-toggle-measurement`의 모드 승인 일치 테스트가 1.38.0(main 워크트리)에서 실패하고 이 변경에서 통과 · 전체 테스트 exit 0 · lint 105 files OK
- decision: 축소만 보수화했다(유지보수자 선택, 2026-10-28). N-15의 파일 단위 늦은 머지 위음성은 2026-10-21 결정대로 한계로 남긴다. "측정된 사실 → 정책 → finding" 엔진 재설계는 하지 않았다 — 확인된 결함 둘이 소비자 단위 측정으로 닫혔다.
- caveats: 스탬프를 커밋하지 않은 문서는 이제 축소되지 않는다(과거 날짜의 미커밋 스탬프에서만 드러난다). squash·rebase 오탐과 시간대 의존 경계는 그대로다. `impact.plan_changed`는 영어 템플릿 제목으로만 비의미 절을 알아보고, 모르는 제목은 의미 있는 변경으로 센다.

## 2026-10-28 - release: 1.38.0 준비 — 코드보다 먼저 시작하는 프로젝트

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: release, docs, wiki
- changed: `package.json`(1.37.0 → 1.38.0) · `tests/verification.test.js`(버전 단언) · `.github/actions/validate/action.yml`(기본값 1.38) · `templates/github-actions/llm-wiki-validate.yml`(핀 3줄) · `CHANGELOG.md`·`CHANGELOG.ko.md`(1.38.0 절) · `ROADMAP.md`·`ROADMAP.ko.md`(출시 절) · README 2종(액션 핀, `--greenfield` 표기, 모드 절에 "꺼진 규칙은 보고만 안 한다" 한 문장) · `examples/greenfield-vue-demo/README*.md`("미배포" 안내 교체) · `outputs/team-briefing/`(대상 버전, 22장 타임라인에 1.38 행·`.now` 이동, 발표 노트) · 위키 `EXAMPLES`(CI 예시 핀 4줄)·`RELEASE_FLOW`(Checklist에 "미배포 표기 정리" 항목)
- summary: 같은 PR의 세 커밋(greenfield, 꺼진 규칙 측정 + P2, 스킬 갱신)을 1.38.0 MINOR로 묶는다. 새 옵션 하나와 부가 JSON이고, lite에서 스캐폴드를 명시 승인할 때 exit 0 → 1로 바뀌는 것이 이름 붙인 예외다(문서화된 게이트 복구). 브랜치에서 "미배포"로 적어 둔 표기 열두 곳을 버전으로 바꿨다.
- evidence: 테스트 757/757 · lint 102 files OK · `impact --since origin/main --strict` pass(PR 전체, CI와 같은 기준)
- caveats: 커밋 단위 `impact --since HEAD~1`은 이 릴리스 커밋만 놓고 보면 index·위키 README·HARNESS_GOVERNANCE_ROADMAP·REVIEW_HISTORY 4건을 지목한다. 넷 다 같은 PR의 앞선 커밋에서 본문을 고쳤고, CI는 PR 전체(`origin/main`, 병합 뒤에는 병합 커밋의 `HEAD~1` = 이전 main)로 본다(1.37.0과 같은 구성). 공유 덱 Artifact는 재게시하지 않았다(유지보수자 지시, 파일만 정렬).

## 2026-10-28 - chore(skills): 이 저장소의 생성 스킬 20개를 현재 생성기로 다시 만들었다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: harness
- changed: `.claude/skills/llm-wiki-{bootstrap,feature,fix,docs-sync,backfill}/SKILL.md` · `.agents/skills/…`(같은 5종) · `.cursor/rules/llm-wiki-*.mdc`(5종) · `.llm-wiki/prompts/llm-wiki-*.md`(5종)
- summary: 2026-10-27 greenfield 항목이 "observed"로 남긴 별건이다. 커밋된 관리 스킬이 1.34.0 이후 갱신되지 않아 그때 제거한 Delegation budget 블록을 아직 담고 있었다. `init --write --skills --refresh`로 사용자 미수정 관리 아티팩트만 다시 썼다. 바뀐 것은 그 블록 삭제와, 직전 커밋까지의 거버넌스 예산 한 구절("요구사항 문서를 구현했으면 그 근거도 갱신")이며 `estimated-tokens`가 줄었다(feature 1584 → 1269, chars/4 프록시). onboard·prepare는 이미 최신이었다.
- evidence: 20 files, +56/−176 · `harness-health` findings 0 · `impact --since HEAD --strict` pass · 테스트 757/757
- caveats: 내용 변경은 생성기 출력 그대로이며 손으로 고친 줄은 없다.

## 2026-10-28 - fix(governance): 꺼진 규칙이 사실까지 지우고 있었다 — lite의 스캐폴드 일괄 승인 · P2 3건

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs, wiki
- changed: `src/governance.js`(`withRulesMeasured`) · `src/commands.js`(`statsCommand`·`nextCommand`·`reviewCommand`가 읽는 규칙만 되살려 audit, `STATS_MEASURED_RULES`, review 항목 `planned`·`planned` 플래그·조건부 caveat) · `src/cli.js`(`help mode`의 lite 설명 한 문장, `help init`의 결정 템플릿 문장) · `src/commands/doc-templates.js`(결정 템플릿을 모든 init에서 ADR 골격·`source_files: []`, `logBody`에 감지된 매니페스트 전달) · `src/commands/doc-content.js`(`logBody({ manifest })`) · `tests/rule-toggle-measurement.test.js`(신규 7건) · `tests/greenfield.test.js`(brownfield 단언 갱신, 신규 2건) · 위키 10종(PUBLIC_API, DOMAIN_FEATURES, GLOSSARY, ARCHITECTURE_CONVENTIONS, HARNESS_GOVERNANCE_ROADMAP, domains/00_overview, EXAMPLES, index, project-profile, profiles/library)
- summary: 지난 항목이 caveat로 남긴 "lite의 `stats` enriched 100%"를 고치려다 같은 원인이 더 무거운 결함을 내고 있음을 확인했다. lite는 `content.not_enriched`·`evidence.missing`·`evidence.stale`을 `off`로 두고 `off`는 finding을 지우는데, `stats`·`next`·`review`가 그 finding으로 사실을 판정했다. 빈 저장소 실측(`init --greenfield`, lite): `stats` 보강 12/12, `next` 체크리스트 0, `review --approve-all --yes`가 스캐폴드 포함 8건 중 8건 승인. 같은 저장소 standard는 6/12, 6, 2건. 이제 세 명령이 자기가 읽는 규칙만 audit 한 번에서 기본 severity로 되돌리고(`backfill`의 `rules: {}`와 같은 원칙), lite와 standard의 수치가 같다. P2 3건: 결정 템플릿을 모든 init에서 ADR 골격으로, 첫 로그 항목이 감지된 매니페스트를 적도록, `review`가 계획 문서를 `planned`로 표시하도록 했다. 같은 PR에서 1.38.0으로 내므로 위키의 "미배포" 표기를 1.38.0으로 바꿨다.
- evidence: 테스트 748 → 757(실측) · 신규 7건은 수정을 끈 상태(`withRulesMeasured`가 입력을 그대로 반환)에서 7건 모두 실패함을 확인 · lint 102 files OK · PR #7 CI 18/18(greenfield 커밋, 3 OS × Node 18.18/20/22/24)
- decision: lite에서 스캐폴드를 명시 승인하면 exit 0 → 1이 된다. 문서화된 게이트("일괄 승인이 스캐폴드를 쓸어 담지 못한다", 2026-07-31)를 되살리는 수정이라 이름 붙인 예외로 MINOR에 싣는다. lite의 `stats`는 이제 드리프트 스캔 비용을 치른다(`backfill`과 같다). `validate`·`audit`·`drift`가 lite에서 보고하는 것은 그대로다.
- caveats: 결정 템플릿 변경은 새로 만드는 파일에만 적용된다(init은 기존 파일을 덮어쓰지 않는다). `review`의 위험 점수는 계획 문서에도 그대로 "근거 없음" 가산(+25)을 준다 — 표시만 바꿨다.

## 2026-10-27 - feat(greenfield): 코드가 없는 프로젝트도 같은 위키로 시작한다 (미배포)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, examples, docs, wiki
- changed: `src/cli.js`(`--greenfield` 파싱·`COMMAND_OPTION_RULES`(init/quickstart/handoff)·도움말, stats JSON 키 목록) · `src/commands.js`(`resolveInitGovernanceMode`, `manifestPresent`·`startingPointLines`, greenfield 후보, quickstart 핸드오프 모드, `buildHandoff`/`handoffNextStep` greenfield, `stats.plannedKnowledge`) · `src/commands/doc-templates.js`(`greenfieldDocMetadata`, 매니페스트 없으면 `source_files` 빈 목록) · `src/commands/doc-content.js`(greenfield 본문 4종 en/ko, `indexBody` 읽기 순서, `logBody` 근거 줄) · `src/commands/scans.js`(`PLANNED_DOC_TYPES`·`isPlannedDoc`·`localReferencePaths`, `scanUngroundedVerified` 분기) · `src/commands/findings.js`·`src/i18n.js`(`evidence.planned_unlinked`) · `src/config.js`(`GREENFIELD_DOCS`) · `src/frontmatter.js`(인라인 `[]`) · `src/task-prompts.js`(`greenfieldPlanningWorkflow`, 거버넌스 예산 3모드 한 구절) · `src/index.js`(typedef) · `tests/greenfield.test.js`(16건)·`tests/greenfield-demo-walkthrough.test.js`(1건) · `examples/greenfield-vue-demo/`(신규) · `examples/README.md` · README 2종 · 위키 11종(index, project-profile, profiles/library, EXAMPLES, GLOSSARY, VISIBILITY, ARCHITECTURE_CONVENTIONS, domains/00_overview, DOMAIN_FEATURES, PUBLIC_API, HARNESS_GOVERNANCE_ROADMAP)
- summary: 빈 저장소에서 v1.37.0 `quickstart`를 실제로 돌려 결함 셋을 찾았다. 생성 문서 10건이 없는 `package.json`을 인용했고(`validate` 경고 10건·`stats` 근거 100%), `quickstart`는 lite를 쓰면서 strict라고 안내했으며, ADR 템플릿은 일반 플레이스홀더였다. 셋을 고친 뒤, 새 엔진이나 필드 없이 기존 `doc_type`으로 "계획된 지식"(requirement + 결정 기록 타입)을 정의했다. 근거 없이 승인된 계획은 `evidence.planned_unlinked`(info)이고 `stats`가 따로 센다. 근거를 연결하면 기존 validate·impact·drift가 그대로 감시한다.
- evidence: 테스트 731 → 748(실측) · lint·`validate --strict`·`audit` 통과 · 데모 워크스루 20/20(Node 22.14), 데모 앱 `npm install`·`vue-tsc`·`vite build`·테스트 4건 통과 · 수동 수명주기 스모크(빈 저장소 → 승인 → 연결 → 코드 변경 → impact exit 1)
- decision: `evidence.ungrounded` 대신 info를 받는 대상에 기존 결정 기록 타입(`decision`·`decision_log`·`adr`)도 포함했다(유지보수자 승인, 2026-10-27). 도입처에서 `--strict`가 실패하던 경우가 통과로 바뀔 수 있는 완화이며, 같은 대상은 info로 계속 보고된다.
- observed: 이 저장소가 커밋한 생성 스킬 20개(`.claude`·`.agents`·`.cursor`·`.llm-wiki`)는 1.34.0 이후 갱신되지 않아 제거된 Delegation budget 블록을 아직 담고 있다. `init --skills --refresh`를 돌리면 그 블록이 빠져 범위 밖 변경이 되므로 되돌렸고 별건으로 남긴다(유지보수자 결정).
- caveats: 미배포이며 버전·CHANGELOG는 건드리지 않았다(CHANGELOG는 릴리스 때 쓴다). 연결된 참조는 구현 위치일 뿐 완료가 아니고, 요구사항 수정은 코드를 지목하지 않으며, 문서 안 수용 기준은 개별 추적되지 않는다. lite의 `stats` enriched가 꺼진 규칙 때문에 100%로 나오는 기존 결함은 고치지 않았다.

## 2026-10-27 - release: 1.37.0 준비 — drift 섹션 축소, search-docs --all-terms, held-out 검색 평가

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, bench, docs, wiki, release
- changed: `src/commands/scans.js`(`scanEvidenceDriftDetailed`, date-앵커 drift가 `narrowingLocators`로 줄 범위·`.md` 섹션 축소, `locatorNarrowed`) · `src/git.js`(`commitAtEndOf`·`fileAtRefFromCwd`) · `src/commands/fix-migrate.js`(drift JSON `locatorNarrowed`·요약 `locator_narrowed`·Caveats) · `src/commands/retrieval.js`(`--all-terms` → `requireAll`, JSON `terms`·`allTerms`) · `src/cli.js`(`--all-terms` 파싱·옵션 규칙·도움말, drift 도움말 Narrowing 절) · `src/mcp/tools.js`(`allTerms` 스키마·매핑) · `src/index.js`(typedef) · `bench/search-eval/run.js`(`--queries`, `shipped --all-terms` 행) · `bench/search-eval/heldout.json`(신규) · 테스트 `tests/drift-section-narrowing.test.js`(신규 5건)와 search·MCP 단언 · 위키 13종 · README·CHANGELOG·ROADMAP 각 2종 · 액션·템플릿 핀 · 덱 · 버전 1.37.0
- summary: 1.36.0에서 `impact`에 넣은 로케이터 축소를 날짜 앵커 `drift`에도 넣었다. 줄 범위는 원래 `git log -L`로 좁혀 왔으므로 새로 생긴 것은 `.md` 섹션이다. 리뷰 날짜가 끝나는 시점의 저장소 스냅샷과 `HEAD`에서 섹션을 꺼내 비교하고, 한쪽이라도 영역을 못 찾으면 파일 단위로 돌아간다. `search-docs --all-terms`는 1.36.0에서 미룬 AND 복귀 경로다(점수는 같고 거르기만 한다). 순위기를 고른 뒤 별도 에이전트가 검색을 돌리지 않고 만든 held-out 질의 40개로 검색을 다시 쟀다.
- evidence: 테스트 725 → 731(실측) · held-out에서 출시 순위기 hit@5 85.0%, 1.35.0 AND 10.0%(결과 0건 34/40), `--all-terms` 17.5%(결과 0건 27/40) · 기존 drift 동등성 테스트(`drift-batched-listing`)와 줄 범위 테스트 무변경 통과
- observed: 같은 날 위키 본문을 고치는 것만으로 held-out MRR이 0.589 → 0.600으로 움직였다. 그 전 측정에서 "기능어·조사 제거가 MRR은 못 올렸다"(0.606 대 0.589)고 적으려 했던 해석은 이 흔들림보다 작은 차이라 버렸다. 코퍼스가 위키 자신이라 수치마다 측정 시점을 적는다.
- caveats: held-out도 에이전트 라벨이고 질의 40개·위키 하나다. 섹션 스냅샷은 committer date 기준이라 N-15(늦은 머지)의 한계를 물려받고, 틀리면 지목하는 쪽(오탐)으로만 틀린다. 벤치 v2(유료 실측)는 무료로 같은 것을 잴 수 없어 하지 않았다(다른 계열 채점자와 호출별 토큰이 필요하다).

## 2026-10-27 - docs(release): 1.36.0 검색 계약 변경을 MINOR로 확정, 테스트 수 정정

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs, wiki
- changed: `docs/llm-wiki/VERSIONING.md`(1.36.0 노트에 유지보수자의 MINOR 확정과 근거) · `CHANGELOG.md`·`CHANGELOG.ko.md`(테스트 수 683 → 724를 725로)
- summary: 유지보수자가 검색 AND → any-term 변경을 MINOR로 확정했다. VERSIONING의 major 정의에 해당하지 않고, 예전 결과가 새 결과에 모두 포함되며, `search-docs`는 CI 게이트 밖이라 종료 코드가 그대로다. AND로 돌아가는 CLI 플래그는 다음 후보로 미뤘다.
- evidence: `npm test` 실측 725/725(직전 항목과 CHANGELOG의 724는 마지막 수정 커밋 이전 수치)
- caveats: 기존 항목(위 1.36.0 준비 항목의 "→ 724")은 append-only 규칙대로 고치지 않았다.

## 2026-10-27 - release: 1.36.0 준비 — 1.35.0 검토 후보 전부(로케이터·검색·check-run·섀도 기록)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, bench, docs, wiki, release
- changed: `src/cli.js`(`--version`/`-v`, 인자 없는 `help`, 도움말 문구) · `src/commands/scans.js`(`changedCitedSources`·`locatedRegion`, `scanReverseImpact`가 `{findings, locatorNarrowed}` 반환) · `src/commands.js`(impact `locatorNarrowed`, `review.unattested_promotion`, check-run `ignored`, `source_digests` 스탬프) · `src/commands/source-digests.js`(신규) · `src/commands/fix-migrate.js`(`upsertFrontmatterList`, `drift --anchor content`) · `src/commands/retrieval.js`(BM25·`searchTerms`·`matchedTerms`) · `src/config-file.js`(`checkRun`·`sourceDigests`) · 스키마 2종 · `src/mcp/tools.js` 설명 · `bench/search-eval/`(신규) · 테스트 6종 신규/갱신 · 위키 12종 · README·CHANGELOG·ROADMAP 각 2종 · GATE_REVIEW · 덱 · `outputs/distribution/CLAIMS.md` · 버전 1.36.0 · 이 저장소 config(`checkRun.ignore`, `sourceDigests: true`)
- summary: 1.35.0 검토가 열어 둔 후보를 모두 만들었다. `impact`는 줄 범위·`.md` 섹션으로만 인용한 파일을 영역 단위로 비교하고, 비교할 수 없으면 파일 단위로 남긴다. `search-docs`는 AND를 버리고 BM25 any-term이 됐다(평가셋 hit@5 42.5% → 92.5%). `check-run`은 두 갭 규칙이 함께 읽는 산문 목록을 받는다. 내용 해시와 승인 출처는 섀도·opt-in이라 기본 결과를 바꾸지 않는다. 제안서의 `reviewed_via` 필드는 `reviewed_by`+`agentReviewers`에서 도출되는 값이라 만들지 않았다.
- evidence: 테스트 683(1.35.0) → 724 · 1.35.0 순위기를 평가 실행기 안에 고정해 출시 코드와 같은 수치(42.5%, 0.272, 0건 18)를 재현함을 확인 · `review.unattested_promotion`을 이 저장소 이력 316커밋에 재생: 첫 구현은 승격 187건 중 43건 지목(전부 같은 날 재승인), 오늘 날짜 보류 후 0건 · 이 저장소 `check-run`에서 산문 6건이 경고 대신 `ignored`로
- observed: 섀도 비교가 같은 날의 수정 두 건을 잡았다. GLOSSARY 승인 뒤 `llm-wiki.config.json`을, HARNESS 승인 뒤 그것이 인용하는 `GATE_REVIEW.md`를 고쳤고, 날짜 앵커는 둘 다 fresh였다. 두 문서를 다시 읽어 서술이 유효함을 확인하고 다시 승인했다. 그 전에 승인 순서 결함도 하나 드러났다(인용된 위키 문서를 frontmatter째 해시해서 같은 실행의 승인 스탬프가 내용 변경으로 보였다) — 마크다운 소스는 본문만 해시하도록 고쳤다.
- caveats: 검색 평가셋은 에이전트가 라벨을 붙인 40개이고 순위기를 같은 셋으로 골랐다(held-out 없음). 승인 출처 규칙의 정답 사례는 이력에 없어 픽스처로만 확인했다. 내용 해시는 이 저장소에서 기록을 시작했을 뿐 날짜 앵커와의 비교 결과는 아직 없다. 공유 덱 Artifact는 재게시하지 않았다.

## 2026-10-27 - fix(links): 붙은 인라인 링크와 연속된 참조 정의의 거짓 음성 수정

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs, wiki
- changed: `src/commands/references.js`(인라인 앞 글자를 소비하지 않음, 참조 정의는 자기 줄에서 끝남) · 줄 종결자 집합 4곳의 표기(문자 그대로 → 이스케이프) · `tests/linear-markdown-scan.test.js`(비교 기준을 고친 동작으로 교체, 결함 단언 2개 반전) · `tests/verification.test.js`(통합 테스트 1건) · `GATE_REVIEW.md`("Link-Extraction False Negatives" 결정) · 위키 `ARCHITECTURE_CONVENTIONS.md`(`references.js` 서술 정정) 외 재확인 노트 5건, `REVIEW_HISTORY.md` 이관 6건
- summary: 유지보수자 결정에 따라 링크 추출의 거짓 음성 둘을 고쳤다. 앞 링크에 붙은 인라인 링크와, 연속된 참조 정의의 두 번째 이후 정의다. 그런 형태로 쓴 문서에서는 원래 깨져 있던 링크가 `markdown_link.missing`으로 새로 보고되고, `fix`가 그 링크의 stub을 만든다. 출시된 검사가 보고하는 내용이 바뀌므로 다음 MINOR에서 이름 붙인 변경으로 다룬다.
- evidence: 차분 테스트 6,000건 중 인라인 234건과 참조 70건이 옛 동작과 결과가 갈린다 · 통합 테스트가 main 코드에서 실패하고 이번 코드에서 통과한다 · 로컬 위키 9곳에서 `validate`·`audit`·`graph`·`fix` 미리보기가 main과 같다 · 테스트 693/693
- caveats: 로컬 위키에는 해당 형태가 없어서 이 측정은 "기존 도입처 영향 없음"까지만 말한다. 그런 형태를 쓰는 저장소에서 finding이 몇 건 늘지는 측정하지 않았다. 로컬 위키 비교에서 `roadmonitor`·`roadmonitor-frontend`는 뺐다(유지보수자 지시).

## 2026-10-27 - fix(security): 정규식 감사 후속 — 남아 있던 제곱 시간 2건과 링크 추출 결함 측정

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs, wiki
- changed: `src/commands/scans.js`(`sectionHeadingText`) · `src/commands/wiki-hygiene.js`(`stripUnderscoreEmphasis` 한 번 처리를 선형 스캔으로, 반복 16단계 상한) · `tests/linear-markdown-scan.test.js`(차분 1건, 시간 상한 3건) · `GATE_REVIEW.md`("Regex Audit Follow-up", "Link-Extraction False Negatives") · 위키 재확인 노트 5건, `REVIEW_HISTORY.md` 이관 5건
- summary: PR 입력이 닿는 명령 경로의 정규식을 목록으로 뽑아 하나씩 실측했다. 기본 `validate`의 `## ` 절 이름 추출(placeholder 문장이 있는 문서에서 도달)과, 옵트인 앵커 규칙의 밑줄 강조 제거가 제곱 시간이었다. 둘 다 같은 결과의 선형 처리로 바꿨다. 정적 판독으로 후보에 올랐던 evidence 콜론 표기는 실측상 선형이었다. 링크 추출 결함 2건(붙은 링크 누락, 참조 정의의 다음 줄 삼킴)은 고친 빌드로 측정했고, 로컬 위키 9곳에서 차이가 0이었다. 실제 위키에 그 형태가 없기 때문이다. 수정 권고와 함께 결정을 기다린다.
- evidence: 시간 상한 3건이 옛 정규식에서 2.2–9.8초로 실패하고 새 코드에서 0.3초 이내로 통과한다 · 차분 테스트 각 8,000건(강조 변화 1,844건, 여러 번 반복 64건, 제목 620건) · 로컬 위키 9곳에서 앵커 5,065개, `## ` 줄 2,907개, `validate`·`audit` JSON 모두 차이 0
- caveats: 밑줄 강조가 16단계보다 깊게 중첩된 제목은 옛 결과와 다를 수 있다. 워크플로 줄 분류(`doctor`)와 `init`의 Route 패턴은 이차 시간이지만 고치지 않았다(입력을 통제하는 사람이 이미 더 큰 권한을 가진다). 로컬 위키 비교에서 `roadmonitor`·`roadmonitor-frontend`는 뺐다(유지보수자 지시).

## 2026-10-27 - docs(examples): 실행 가능한 Vue 3 + TypeScript 데모와 README 연결

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: examples, test, docs, wiki
- changed: `examples/vue3-typescript-demo/**`(앱·보강 문서 2종·`scripts/demo.mjs`·README 영/한) · `tests/vue-demo-walkthrough.test.js` · `README.md`·`README.ko.md`("Try it on a demo app" 절, 문서 표 1행) · `examples/README.md`(링크) · 위키 `EXAMPLES.md`(머리말 단락)
- summary: 핵심 주장(소스가 바뀌면 리뷰된 문서가 따라오는지 CI가 막는다)을 손으로 재현할 예제가 없었다. lite 모드에 `impact.source_changed`만 켠 Vue 앱에서 7단계(init → 보강 → 검증·승인 → 소스 변경 → `impact` exit 1 → 문서 갱신·재승인 → exit 0)를 `npm run demo`로 돌리고 종료 코드 11개를 확인한다. 수동 경로는 저장소 밖 작업 폴더에서 같은 단계를 밟는다.
- evidence: 배포판 1.35.0과 이 체크아웃의 CLI 모두 11/11 · 수동 경로 전 단계 실행 · `npm run build` 통과 · headless Chrome으로 렌더링과 제목 규칙 확인 · `npm pack` 67개 파일로 `examples/` 미포함
- caveats: CLI는 문서가 사실인지 검사하지 않는다(문서를 "100"으로 잘못 고쳐도 전 단계 통과, 실측). 날짜 기준 `drift`는 lite에서 꺼져 있고, 켜도 같은 날 커밋된 변경을 놓친다(실측). 둘 다 데모 README에 적었다.

## 2026-10-27 - ci(publish): 인증에 쓰이지 않던 npm 토큰 폴백 제거

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: ci, test, docs, wiki
- changed: `.github/workflows/publish.yml`(토큰 env 제거, 사전 점검 스텝, checkout 2곳 `persist-credentials` 끔) · `tests/publish-workflow.test.js` · `GATE_REVIEW.md`("Publish Credential Cleanup" 결정 문단) · 위키 `RELEASE_FLOW.md`(Prerequisites)
- summary: 레지스트리 기록상 1.16.1–1.35.0 전 버전을 OIDC가 인증했고, archive 이력상 1.16.1–1.29.2는 토큰 env 없이 같은 형태로 게시됐다. 저장된 토큰은 인증에 쓰인 적이 없고, Trusted Publisher 등록이 깨질 때 조용한 폴백만 만들었으므로 걷어냈다.
- evidence: 회귀 테스트가 1.35.0 워크플로에서 실패하고 이번 것에서 통과 · YAML 파싱 · 사전 점검 스크립트 3경로 로컬 실행
- caveats: 다음 릴리스가 성공하는지는 실제 배포로만 증명된다. 환경 secret 삭제와 npmjs.com 토큰 폐기는 그 뒤 유지보수자가 한다(에이전트 미실행).

## 2026-10-27 - fix(security): CodeQL 경보 7건 판정과 PR 입력 Markdown의 제곱 시간 정규식 제거

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs, wiki
- changed: `src/commands/references.js`·`wiki-hygiene.js`·`fix-migrate.js`·`import-memory.js`·`skills.js`(선형 스캔) · `tests/linear-markdown-scan.test.js` · `tests/verification.test.js`(RegExp 조립 → substring) · `GATE_REVIEW.md`("Security Review Batch") · 위키 `ARCHITECTURE_CONVENTIONS.md`(`references.js` 서술) 외 재확인 노트 7건, `REVIEW_HISTORY.md` 이관 9건
- summary: 열린 경보 7건을 재현해 판정했다. 실제 제곱 시간 3건은 고쳤고(악용 경로는 약함), 주입 경보 1건과 테스트 URL 경보 2건은 오탐이다. 테스트 1건은 정리했다. 경보 밖에서 더 심한 것을 찾았다. 기본 `validate`·`audit`의 링크 추출 정규식이 PR이 고칠 수 있는 문서 한 줄에서 제곱으로 역추적했다(`[` 50,000자에 4.3초).
- evidence: 차분 테스트(무작위 입력, 옛 정규식 대조) · 옛 정규식에서 4.7–34초로 실패하는 시간 상한 테스트 · 로컬 위키 9곳 300개 파일에서 옛/새 결과 차이 0, `validate`·`audit` JSON 동일 · 50만 자 병적 문서도 1초 이내
- caveats: 정규식의 특이 동작 둘(붙은 링크 누락, 참조 정의의 다음 줄 삼킴)은 그대로 재현했고, 고치는 일은 도입처 finding이 늘어나는 별도 결정이다. `src/` 전체 정규식 전수 감사는 하지 않았다(블랙박스 52형태만 측정). 로컬 위키 비교에서 `roadmonitor`·`roadmonitor-frontend`는 뺐다(유지보수자 지시).

## 2026-10-26 - docs(deck): 1.35.0 정렬 — 배포 전에 PR에 함께 넣었다

- status: needs_review (위키 문서 변경 없음 — 로그만)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs (outputs/team-briefing)
- changed: `llm-wiki-briefing.html`(제목·버전 배지 v1.35.0, 21장 "1.29 – 1.29.2"로 병합, 22장 "1.30 → 1.35"에 1.35 행) · `SPEAKER_NOTES.md`(대상 버전, 21·22장 대본, 1.35 한 줄 설명, 시간 조절 팁) · `README.md`(대상 버전)
- summary: 지금까지 덱 정렬은 배포 뒤 별도 커밋으로 했다. 이번에는 PR 병합이 에이전트에게 `deny`로 막혀 있어서(`.claude/settings.json`의 `gh pr merge`), 유지보수자의 병합 한 번으로 끝나도록 배포 전에 같은 PR에 넣었다. 22장에 행이 하나 늘지 않게, 가장 오래된 1.29.2 행을 21장의 "1.29 – 1.29.1" 행과 합쳤다. 공유 Artifact는 재게시하지 않는다(유지보수자 지시).
- evidence: headless Chrome으로 DevTools 프로토콜을 써서 슬라이드 높이를 쟀다. 1366×768·1440×900·1920×1080 세 해상도 모두 21·22장 높이가 기준선과 같다(858/878/894px, 862/882/898px). 1.35 행의 첫 문구는 22장을 19px 늘려 1440×900에서 넘쳤으므로 줄였다.
- caveats: 이 headless 측정에서는 **기준선에서도** 1366×768의 21·22장이 넘친다(858·862px > 768). 1.34.0 덱 정렬 커밋은 "Chrome 실측 757·747px, 넘침 0장"이라고 기록했는데, 두 측정이 어긋나는 원인(글꼴 로딩이나 측정 방식으로 추정)은 확인하지 않았다. 그래서 이번 기준은 "기준선보다 높아지지 않는다"로 잡았다.

## 2026-10-26 - fix(sensitive): 넓힌 탐지 패턴이 다항 시간으로 역추적하고 있었다(CodeQL js/polynomial-redos)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, wiki
- changed: `src/sensitive-info.js`(선형 구조로 재작성) · `tests/sensitive-info.test.js`(시간 상한 테스트 1건) · 위키 `VISIBILITY.md`(같은 날 노트 확장)
- summary: 1.35.0 PR(#1)의 CI에서 CodeQL이 `src/sensitive-info.js`의 새 패턴에 high 경고 1건을 냈다. 지목된 곳은 끝 구분자를 지우는 `/[,;]+$/`였다. 같은 관점으로 보니 키의 중첩 수량자 `[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*`와 벤더 패턴의 상한 없는 반복·전방 탐색도 위험했다. 재현하니 셋 다 제곱으로 늘었다. 20,000자 한 줄에 0.15–1.5초가 걸렸고, 1.34.0은 1ms 미만이었다. 이 스캔은 `validate`·조회·리포트 쓰기에서 문서 내용에 돌므로, 병적인 줄 하나가 게이트를 멈출 수 있었다. 고친 방식은 세 가지다.
  - 후보는 lookbehind로 식별자 덩어리의 시작에서만 찾고, 상한 128자 한 번의 매칭으로 잡는다. 키가 자격 증명 이름인지는 그 문자열에 대해 따로 판정한다.
  - 끝 구분자는 반복문으로 지운다.
  - 모든 수량자와 전방 탐색에 상한을 둔다.
- evidence: 수정 후 같은 입력은 20,000자에서 0.1–12ms, 100,000자에서 0.6–62ms로 선형이다. 새 시간 상한 테스트는 수정 전 코드에서 5,846ms로 실패하고 수정 후 통과한다. 탐지 결과는 1.34.0 대비 위키 9곳(314개 파일)에서 +0/−0이고, 합성 코퍼스의 참 양성 8건도 직전 구현과 같다. `sensitive-info`·`frontmatter` 테스트는 13/13이다.
- caveats: 비교 코퍼스에서 `roadmonitor`·`roadmonitor-frontend`를 뺐다(유지보수자 지시: 그 프로젝트의 정보는 건드리지 않는다). 그래서 앞선 측정의 11곳이 이번에는 9곳이다. 다른 저장소의 소스 트리 재스캔은 하지 않았다. 이 결함은 출시 전에 PR CI에서 잡혔고 배포된 버전에는 없다.

## 2026-10-26 - docs(wiki): 버전 범프 커밋이 VERSIONING을 evidence.stale로 지목했다 — 1.35.0의 MINOR 판정 대조

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: wiki
- changed: `VERSIONING.md`(Review Note 1건) · `REVIEW_HISTORY.md`(`Versioning` 절 신설, 노트 1건 이관)
- summary: 릴리스 커밋이 들어간 뒤 `validate --strict`가 `VERSIONING.md`의 `evidence.stale` 1건을 냈다. 날짜 앵커 drift는 N-13의 version-only 면제를 쓰지 않아, 커밋된 버전 범프를 "검토 이후 바뀐 소스"로 본다. 작업트리 상태일 때는 git 이력에 없어서 보이지 않았다. 서술은 그대로 맞으므로 대조 결과를 노트로 남겼다. 같은 자리에서 1.35.0이 이 문서의 정의상 MINOR인지 대조했다. 탐지 확장은 계약 변경이 아니라 결함 수정이고, 이름 붙인 동작 변경으로 CHANGELOG에 적었다.
- evidence: `validate --strict` 1 → 0, `review-notes-cap` 3/3.
- caveats: CI는 `validate --strict`를 돌리지 않아(verify는 `validate-frontmatter`, governance는 `impact`) 배포를 막는 항목은 아니었다. 이 저장소의 기준을 지키려고 고쳤다.

## 2026-10-26 - docs: SECURITY가 조회 redaction 범위를 1.35.0 이전 기준으로 말하고 있었다

- status: needs_review (위키 문서 변경 없음 — 로그만)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs
- changed: `SECURITY.md`·`SECURITY.ko.md`(MCP 신뢰 모델 절의 redaction 문장) · `outputs/distribution/launch-kit-2026-10.md`(제목 버전, 1분 설명에 PR 리포트 한 문장)
- summary: SECURITY의 "returned bodies/snippets redact sensitive-looking lines"는 1.35.0 수정 전의 범위만 말하고 있었다. 지금은 본문 줄, 탐지된 PEM 블록 전체, `get_doc`의 frontmatter 값까지 가린다. 1.35.0 이전 버전은 뒤의 둘을 가리지 않았다는 사실과, 올리라는 안내를 영·한 같은 위치에 적었다. 런치 키트는 제목의 버전을 1.35.0으로 맞췄다.
- evidence: `impact`(작업트리) 0, `tests/impact-default-gate.test.js` 7/7(SECURITY.md는 이 테스트의 문구 감시 대상이다).
- caveats: 없음. 유지보수자 지시로 이 커밋 뒤의 push·병합·태그·배포는 에이전트가 진행한다.

## 2026-10-26 - release: 1.35.0 — 코드가 하는 만큼만 말하기

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: release, src, test, docs, wiki
- changed: 버전 1.34.0 → 1.35.0(`package.json`, 테스트 단언, 템플릿 핀 3곳, 액션 `version` 기본값, README 핀 2곳) · `src/commands.js`(`impact` PR 리포트) · `.github/actions/validate/action.yml`(입력 `summary`) · `src/cli.js`(도움말 문구) · `tests/impact-report.test.js`(4건) · CHANGELOG·ROADMAP 영·한 · `GATE_REVIEW.md`("Trust Batch Scope Decision") · README 2종(승인 정책, job summary) · `docs/ORCA_PARALLEL_DEV.md`(승인 정책 정합) · 위키 13종 + `REVIEW_HISTORY.md`
- summary: 유지보수자 결정(2026-10-26, 세션 안에서)은 네 가지다. 범위는 1.35.0 후보 일괄, 이 저장소의 자기 승인은 유지하되 문서를 정합, 탐지 측정은 로컬 위키 사용, 멈추는 지점은 로컬 릴리스 커밋(push·태그 없음). 이 커밋에는 그중 PR 리포트, 도움말 문구, 승인 정책 문서, 릴리스 메타데이터가 들어간다. 보안 수정(`7858644`)과 탐지 확장(`0525bf7`)은 앞선 커밋에 있다.
- evidence:
  - `impact`가 지목한 verified 13종을 대조했다. 새 출력·입력과 충돌하는 서술은 없었다.
  - 새 동작을 실제로 반영한 문서는 6종이다(PUBLIC_API·EXAMPLES·DOMAIN_FEATURES·ARCHITECTURE·00_overview·index). HARNESS 로드맵에는 결함 48~52를 등록했고, 나머지 6종은 불변이라 노트로 기록했다.
  - `profiles/library.md`는 노트 상한을 처음 넘어서, `REVIEW_HISTORY.md`에 `Library Profile` 절을 새로 만들었다.
  - 새 테스트 4건은 원래 코드에서 모두 실패하고 수정 후 통과한다.
  - 결과: `npm run verify` 682/682, lint OK(88개 파일), `validate --strict` 0, `audit` pass, `drift` 0, `impact`는 이 커밋 단독과 `origin/main` 이후 전체 모두 0(`stamp_only_exclusions` 0), `npm pack --dry-run`은 67개 파일·285.1 kB이며 허용된 최상위 항목만 담는다.
- caveats:
  - N-11(같은 날 두 번째 재스탬프는 no-op) 때문에, 오늘 이미 승인한 문서(00_overview·EXAMPLES·index·PUBLIC_API·위키 README)는 재스탬프가 아니라 본문을 실제로 고쳐야 게이트를 통과했다. 각 변경은 이번 릴리스가 바꾼 사실을 담은 것이다. 다만 `index.md`에 더한 문장(실패 시 표를 먼저 보라)은 유용해서 넣었지만, 게이트 통과에도 필요했다는 점을 밝혀 둔다.
  - 워크플로 템플릿에는 job summary를 넣지 않았다. `pipefail` 없는 `bash -e`에서 파이프는 실패를 삼키기 때문이다.
  - 발표 덱(`outputs/team-briefing/`) 정렬은 관례대로 배포 뒤에 한다.
  - push·태그·npm 배포는 하지 않았다.

## 2026-10-26 - feat(sensitive): 탐지기가 `access_token:`·`client_secret:` 같은 키와 벤더 토큰을 못 보고 있었다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs
- changed: `src/sensitive-info.js`(접미 자격 증명 키 + 값 모양 게이트, 신규 유형 `vendor_token`) · `tests/sensitive-info.test.js`(신규 4건) · 위키 `VISIBILITY.md`(일관성 규칙이 재사용하는 스캔의 범위) · `outputs/distribution/CLAIMS.md`(탐지 범위 문장)
- summary: 기존 패턴의 `\b(token|secret|password)\b`는 `_`가 단어 문자라서 `access_token`·`client_secret`·`db_password` 앞에 경계를 찾지 못했다. 그래서 YAML이나 설정 형태로 흔히 쓰는 이런 줄이 `validate`를 통과했고, 승인까지 받을 수 있었다. 이제 마지막 마디가 자격 증명 단어인 키(snake·kebab·점 표기와 camelCase)를 잡는다. 다만 값이 자격 증명 모양일 때만 잡는다. 영숫자 계열 12자 이상, 숫자와 문자를 함께 포함, 플레이스홀더 제외가 조건이다. `ghp_`·`github_pat_`·`AKIA`·`xoxb-`·`sk-`·`AIza`·`sk_live_`·`npm_` 접두 토큰은 키 이름이 없어도 `vendor_token`으로 잡는다. 기존 패턴 6종과 finding 형태는 그대로다.
- evidence: 탐지기를 바꾸기 전에 측정했다. 로컬 위키 11곳(394개 파일, 84,231줄)에서 기존 대비 새로 잡힌 줄은 0, 잡히지 않게 된 줄도 0이었다. 같은 저장소들의 소스 1,219개 파일로 오탐 스트레스를 걸었다. 값 모양 게이트가 없는 안은 새 적중 45건이 전부 코드 참조(`nextPageToken`, `mapToken` 등)였고, 게이트를 둔 실제 구현은 새로 잡힌 줄 1건(벤더 형식 문자열)에 잃은 줄 0이었다. 합성 코퍼스의 의도한 참 양성 9줄은 기존 탐지기와 새 패턴을 합쳐 전부 잡혔고, 코드·참조·플레이스홀더 음성 사례는 전부 조용했다. 새 테스트 4건 중 3건은 원래 탐지기에서 실패하고(음성 사례 1건은 원래도 통과), 수정 후 4건 모두 통과한다. `npm test` 678/678.
- caveats: `sensitive.*`는 끌 수 없는 blocked 규칙이라, 이 확장이 도입처 문서를 새로 막으면 우회 수단이 없다. 측정 코퍼스는 이 PC의 저장소 11곳이 전부다. 측정 원문은 어디에도 기록하지 않았고, 개수와 키 이름·값 모양만 봤다. 테스트의 벤더 형식 문자열은 외부 시크릿 스캐너가 오탐하지 않도록 런타임에 조립한다.

## 2026-10-26 - docs: README 재구성과 공개 주장 감사 — 사실보다 넓게 말하던 문장들을 고쳤다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs, wiki
- changed: `README.md`·`README.ko.md`(재구성) · `CONTRIBUTING.md`·`.ko.md`(한 문장) · `docs/ORCA_PARALLEL_DEV.md`(이 저장소 예외 명시) · `bench/REAL_LLM_METHODOLOGY.md`(상태 노트) · `outputs/distribution/`(`CLAIMS.md` 갱신·감사표, 런치 키트 신설, 7월 초안 5종에 상태 배너) · 위키 `EXAMPLES.md`·`README.md`(Review Note) · `index.md`(재스탬프) · `REVIEW_HISTORY.md`(노트 2건 회전)
- summary: 저장소 전반 검토(엔지니어링·문서·홍보) 중 문서 쪽 결과다. README는 골격을 유지한 채 빠진 답을 채웠다. 동작 방식, 지시 파일과의 차이, 하지 않는 일, CI 절, 운영 비용, 문제 해결, 문서 안내가 새로 들어갔다. 동시에 공개 주장을 소스와 대조해, 사실보다 넓게 말하던 문장을 고쳤다.
  - "Every claim is tied to real code": 실제로는 인용이 대상을 가리키는지만 검사한다.
  - "only a human promotes … can never self-approve": 강제되지 않는다. 이 저장소 자체가 에이전트 승인이다.
  - "Works on any stack, with any agent": 감지하는 스택과 adapter 대상만 적었다.
  - 모드를 빼고 말한 "fails the build": 새 프로젝트는 `lite`라 드리프트 게이트가 꺼져 있다.
  - `ORCA_PARALLEL_DEV.md`의 "agents write, only a human verifies"는 이 저장소 정책과 정면으로 충돌하고 있었다. `AGENTS.md`가 생성 스킬과의 충돌을 처리한 방식대로 예외를 명시했다. 정책 선택 자체는 유지보수자 몫이다.
  - `CLAIMS.md`는 수치(명령 32개·MCP 툴 18개)와 금지 주장(유일성, 사람만 승인, 비밀 절대 미반환)을 갱신하고 감사표를 붙였다.
- evidence: README가 기대는 사실은 소스로 다시 확인했다. `COMMANDS` 32개, `MCP_TOOLS` 18개, `src/`의 네트워크 모듈 import 0건, `doctor`·`next`·`explain` 도움말 문구, OPERATIONS 앵커 두 개다. `impact`가 지목한 verified 3종(EXAMPLES·index·위키 README)은 README에서 가져오는 서술을 각각 대조했고, 셋 다 불변이다. EXAMPLES와 위키 README에는 대조 결과를 Review Note로 남겼다. `index.md`는 Review Notes 절이 없는 상시 적재 문서라서 노트 절을 새로 만들지 않고 재스탬프만 했다. 그래서 이 변경의 `stamp_only_exclusions`는 1로 보고된다. 대조한 내용은 index 32행의 정체성 서술이며, 새 README와 일치한다.
- caveats: README 길이는 빈 줄 제외 74 → 125줄(전체 104 → 172줄)로, 계획한 약 120줄을 조금 넘었다. `llm-wiki help`의 "fewer tokens, fewer errors"는 소스 변경이라 이번 범위에서 고치지 않았다. npm 상점 페이지는 다음 배포 전까지 옛 README를 보여 준다. 버전 범프 없음. push 안 함.

## 2026-10-26 - fix(retrieval): PEM 블록이 헤더 한 줄만 가려지고 키 본문은 반환되고 있었다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs
- changed: `src/commands/retrieval.js`(`redactSensitive`가 탐지된 PEM 헤더부터 짝 END 줄까지 블록째 가림) · `tests/verification.test.js`(회귀 테스트 1건) · 위키 `PUBLIC_API.md`(`get-doc` 행, 같은 날 Review Note 확장) · `domains/00_overview.md`(Retrieval 항목 한 구절, 같은 날 노트 확장)
- summary: 바로 앞 수정을 검증하다가 찾은 같은 계열의 결함이다. 민감정보 탐지기는 PEM 블록의 헤더 줄만 잡는다. base64 본문 줄에는 키 이름이 없으니 줄 스캔으로는 잡을 수 없다. 그런데 retrieval의 redaction이 줄 단위라서, `get-doc`·`search-docs` 스니펫·`onboard`·`prepare`가 헤더 한 줄만 가리고 키 본문을 그대로 돌려줬다. 이제 `private_key`/`certificate`로 탐지된 줄부터 짝 END 줄까지, 닫히지 않은 블록이면 끝까지를 가린다. 탐지기(`scanSensitiveInfo`)와 finding 판정은 바꾸지 않았다.
- evidence: 가짜 블록(헤더 + 가짜 본문 2줄 + END) 픽스처로 측정했다. 수정 전 노출은 CLI `get-doc` 2줄, `search-docs --include-sensitive` 스니펫 2건, MCP `get_doc` 4회였고, 수정 후에는 모두 0이며 END 뒤 본문은 그대로 남는다. 새 테스트는 원래 코드에서 실패하고 수정 후 통과한다. 테스트 소스의 PEM 헤더는 외부 시크릿 스캐너가 오탐하지 않도록 런타임에 조립한다.
- caveats: `validate`는 이 문서를 원래도 `sensitive.redacted` blocked로 막았으므로 CI를 통과한 커밋에는 남기 어렵다. 노출 경로는 커밋 전 워킹트리를 읽는 MCP·CLI 조회였다. push 안 함.

## 2026-10-26 - fix(retrieval): get-doc이 frontmatter의 민감해 보이는 값을 가리지 않고 돌려주고 있었다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: src, test, docs
- changed: `src/commands/retrieval.js`(frontmatter redaction 뷰. `get-doc`·`list-docs`·`search-docs`가 이 뷰를 쓴다) · `tests/verification.test.js`(회귀 테스트 1건) · 위키 `PUBLIC_API.md`(retrieval 3행) · `domains/00_overview.md`(Retrieval 항목) · `REVIEW_HISTORY.md`(노트 2건 회전)
- summary: 저장소 전반 검토 중에 재현한 결함이다. `get-doc`의 기본 출력(CLI JSON, MCP `get_doc`)은 frontmatter 객체를 그대로 실어 보내고, redaction은 본문 줄에만 걸었다. 같은 탐지기가 그 문서를 민감 문서로 분류해 `list-docs`/`search-docs`에서는 기본 제외하는데도, `get-doc`은 경로를 지정하면 게이트가 없어 frontmatter 값이 원문으로 나갔다. 수정 후에는 각 스칼라를 `key: value`로 재구성해 같은 스캔에 걸고, 걸린 값만 표식으로 바꾼다. 깨끗한 문서는 참조를 그대로 돌려주므로 기본 출력이 byte-identical이다.
- evidence: frontmatter의 `secret` 키에 가짜 값을 넣은 픽스처로 측정했다. 수정 전에는 CLI JSON에 1회, MCP에 1회 노출됐고, 수정 후에는 0회다. 새 테스트는 원래 코드에서 실패하고(원문 포함 `true`), 수정 후 통과한다. `npm test` 673/673, lint OK.
- caveats: 탐지 패턴은 바꾸지 않았다. `api_token`·`access_token`처럼 `_token`으로 끝나는 키는 `\b` 경계 때문에 본문에서도 탐지되지 않는데, 이것은 별개의 공백이다. 탐지기를 바꾸면 모든 명령의 blocked 판정 범위가 같이 바뀌므로 별도로 결정한다. CHANGELOG 기재와 버전 범프는 하지 않았다(릴리스 시 기재). push 안 함.

## 2026-10-21 - docs+test: N-15 기록 — drift는 머지가 메인에 들어온 날짜를 보지 못한다(고치지 않기로 결정)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: test, docs
- changed: `tests/known-gaps.test.js`(GAP 5 추가) · 위키 `HARNESS_GOVERNANCE_ROADMAP.md`(결함 등록부 47번 N-15) · `PUBLIC_API.md`(`drift` 행 알려진 한계) · `REVIEW_HISTORY.md`(2차 팬아웃 기록) · `docs/OPERATIONS.md`(도입처용: 머지 전략별로 `drift`가 보는 것)
- summary: 1.34.0에서 찾은 늦은 머지 위음성을 고치려고 git 동작부터 재현했다. 시나리오 다섯 × 방식 셋이다. `--full-history`는 다른 쪽 부모와 다르기만 하면 머지를 보고해서 탈락했다. `--first-parent`는 위음성을 정확히 닫지만, **PR 안에서 소스를 고치고 문서를 재검토한 흐름**을 새 오탐으로 만든다. PR CI는 실행마다 새로 만든 머지 커밋 위에서 돌고, 그 날짜가 재검토 다음 날이면 출하 템플릿의 `validate --strict`가 실패한다. 그래서 흔한 오탐을 드문 위음성과 바꾸는 거래로 판단해 유지보수자에게 선택지 셋(문서화·커밋 기준 재설계·opt-in)을 냈고, **문서화**로 결정했다. 같은 원인의 반대쪽 결과(squash·rebase 머지에서는 PR 안 재검토 문서가 머지 직후 stale)도 함께 적었다. 근본 해법인 커밋 기준 비교는 drift의 의미를 바꾸므로 별도 설계 결정으로 남겼다.
- evidence: `--first-parent` 사본과 현재 코드의 `drift`를 로컬 저장소 11곳에서 비교한 결과 **추가 0 / 제거 0**이었다(이력상 머지 커밋 182개, 2026-07 이후 메인라인 머지 16개). 위음성도 노이즈도 실측되지 않았다는 뜻이다. GAP 5 테스트는 현재 동작에서 통과하고, `--first-parent` 변이를 넣으면 실패한다(한계가 닫히면 실제로 알린다). 변이 뒤 `src/git.js` 무변경 확인.
- caveats: 제품 코드는 바꾸지 않았다. 버전 범프 없음(문서·테스트만). push 안 함.

## 2026-10-21 - docs(deck): 1.34.0 배포 이후 정렬 — 덱이 줄인 패키지를 예전 크기로 말하고 있었다

- status: needs_review (편집 시점)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs
- changed: `outputs/team-briefing/llm-wiki-briefing.html` · `SPEAKER_NOTES.md` · `README.md`
- summary: 1.34.0 배포(npm, 2026-10-21) 뒤 발표 덱을 맞췄다. 표기 3곳을 `v1.34.0`으로 바꾸고 타임라인 ②에 1.34 행을 넣었으며, "가장 최근" 표시를 옮겼다. 이번 릴리스가 덱의 사실 하나를 직접 틀리게 만들었다 — "내려받기 0.5MB 남짓, 풀면 1.7MB"를 실측(packed 278,450 B, unpacked 938,856 B)에 맞춰 "0.3MB 정도, 풀면 0.9MB"로 고쳤다. 1.29.2 행은 그 기능이 1.34에서 빠졌다는 표시를 달았다. 행이 하나 늘어난 만큼 1.29–1.29.1 행을 줄여 ①장으로 옮기고, 1366×768에서 넘치던 줄을 정리했다(1.25·1.26·1.27·1.28 부연, 1.30 한 문장, 1.34 행을 두 줄로). 스피커 노트에는 21·22장 범위와 대본, 1.34 한 줄 설명을 넣었다.
- evidence: Chrome에서 UTF-8로 서빙해 실측했다. 1920×1080·1440×900·1366×768에서 넘치는 슬라이드 0장. 21·22장 높이는 757·747px로 개선 전과 같다. 1280×720에서는 개선 전 덱도 두 장이 넘친다(이번에 생긴 문제가 아니다). `impact --since HEAD` pass, `validate --strict` 0.
- caveats: 공유 Artifact 링크는 아직 이전 판(v1.33.0)이다. 조직 공유라 재게시는 유지보수자 확인 뒤에 한다.

## 2026-10-21 - release: 1.34.0 — 받기도, 돌리기도, 읽기도 가볍게

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: code, test, release, docs
- changed: `src/git.js`(`pathsChangedSince` 신설) · `src/commands/scans.js`(`changeFilter`, `scanEvidenceDrift`의 음성 필터) · `src/task-prompts.js`(`delegationPolicy` 정의와 삽입 4곳 제거) · `package.json`(`files`를 실행 파일과 README·LICENSE로 축소, 1.33.0 → 1.34.0) · `tests/drift-batched-listing.test.js`(신규 4건) · `tests/agent-token-discipline.test.js`(위임 테스트 3건 → 재유입 가드 1건) · `tests/prompt-profile.test.js`(slim 비율 상한 50% → 70%, full/slim 구분 표지 교체) · `tests/verification.test.js` · `RELEASE_CHECKLIST.md` · `GATE_REVIEW.md`("Delegation Policy Scope Decision"에 제거 기록) · CHANGELOG 쌍 · ROADMAP 쌍 · README 2종·action.yml·템플릿 핀 · 위키 14종 + `REVIEW_HISTORY.md`
- summary: 유지보수자가 "패키지를 가볍게"를 요청해, 측정해서 무게가 아무것도 사지 못하는 곳 세 군데를 덜어냈다. ① 날짜 앵커 드리프트가 인용 파일마다 `git log`를 띄워 6개 명령 시간의 80–90%를 쓰고 있었다(이 저장소 72회). 기준일마다 변경 경로 목록을 한 번 받아 **음성 필터로만** 쓰고, 목록에 든 앵커는 기존 파일별 쿼리가 판정하게 해서 finding이 바이트 동일하다. 목록이 상위 집합이려면 사용자 config가 줄이지 못해야 해서 플래그 넷을 고정했다. 처음엔 소문자 정규화도 넣었지만, git pathspec은 Windows `core.ignorecase`에서도 대소문자를 구분해서(직접 확인) 뺐다. ② tarball의 46%가 런타임이 읽지 않는 프로젝트 문서였다(코드가 자기 위치에서 읽는 것은 `package.json`·`templates/`뿐임을 grep으로 확인). `files`를 줄이고 이를 요구하던 RELEASE_CHECKLIST 줄과 wiki README의 `.ko.md` 등록 규칙을 고쳤다. ③ `delegationPolicy`를 뺐다 — 유료 A/B와 블라인드 채점 모두 효과를 찾지 못했는데 쓰기 프롬프트의 약 25%였다. 결정과 한계는 GATE_REVIEW에 남겼고, `contextBudget`·`governanceBudget`은 측정한 적이 없어 다른 경우로 보고 남겼다. 같은 자리에서 이미 출시된 1.33.0을 "미출시"·"예정"이라 적던 현재형 서술 17곳(6종)과, 설정을 마친 `agentReviewers`를 "아직 안 바꿨다"고 적던 GLOSSARY 문장을 고쳤다.
- evidence: `validate --strict` 4.0–4.4초 → 0.7초, `drift` 3.7초 → 0.3초(이 저장소, 3회·2회 측정). 위키가 있는 로컬 저장소 11곳에서 개선 전(origin/main worktree)과 후의 `drift`·`validate --strict` JSON 22쌍이 **전부 동일**했다. 이 중 드리프트가 실제로 있는 곳이 두 곳이다(`evidence.stale` 8·28). 부하가 없던 첫 실행에서 가장 큰 위키 `drift`가 17.9초 → 0.7초였다. 두 번째 실행은 전체 테스트와 동시에 돌아 절대 시간이 흔들렸지만(개선 전 `validate` 최대 57초) 22쌍 모두 동일했다. 플래그 넷을 하나씩 뺀 변이는 모두 새 테스트가 잡았다. 테스트 671/671, lint OK. tarball은 packed 557,702 → 278,450 B, unpacked 1,704,003 → 941,286 B. `fix` 프롬프트는 5,200 → 3,881자, Claude 스킬 7종은 42,876 → 36,241 B.
- caveats: 드리프트가 **리뷰 뒤 머지로만 들어온 오래된 브랜치의 변경**을 잡지 못하는 기존 위음성을 찾았다(`git log -- <path>`의 히스토리 단순화). 이번 변경은 출력 보존이 원칙이라 고치지 않고 테스트로 "보존된 동작"이라고 고정했다. 기존 도입처 스킬은 `--refresh` 전까지 위임 블록을 유지한다. push·태그·배포는 하지 않았다.

## 2026-10-21 - docs: 1.33.0 배포 이후 정렬 — 발표 덱이 1.31에서 멈춰 있었고, 커밋이 드리프트 12건을 만들었다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs
- changed: `outputs/team-briefing/llm-wiki-briefing.html` · `SPEAKER_NOTES.md` · `README.md` · 위키 12종 재스탬프(`ARCHITECTURE_CONVENTIONS`·`BENCHMARK`·`DOMAIN_FEATURES`·`domains/00_overview`·`EXAMPLES`·`GLOSSARY`·`HARNESS_GOVERNANCE_ROADMAP`·`profiles/library`·`project-profile`·`PUBLIC_API`·`README`·`VISIBILITY`) · `REVIEW_HISTORY.md`
- summary: 1.33.0 배포(npm, 2026-10-21) 뒤 버전을 담은 산출물을 맞췄다. 덱은 표지가 `v1.32.0`인데 타임라인이 **1.31에서 멈춘 채 "가장 최근"**이라고 적고 있었다 — 1.32.0 정렬이 표기 5곳만 바꾸고 행을 넣지 않았다. 1.32·1.33 행을 넣고, 화면을 넘지 않게 1.28을 짧게 줄여 ①장으로 옮기고 1.29·1.29.1을 한 행으로 합쳤다. 덱의 사실 주장도 소스에 대조했다: 원칙 슬라이드의 "1.0 이후 **한 번도 어기지 않은** … 하위 호환"은 VERSIONING의 1.28.0 "규칙을 어긴 기록"과, 같은 덱의 1.31 행과도 모순이라 "지켜온"으로 고치고 1.28을 명시했다. 압축 해제 크기 1.6MB → 1.7MB(레지스트리 `unpackedSize` 1,704,003). MCP 18개는 맞았다. 스피커 노트의 21·22장 범위와 대본, 1.32·1.33 한 줄 설명을 맞췄다. 그리고 범프 커밋이 날짜 앵커 드리프트를 만들었다 — 10-20에 미커밋 diff에 대조해 고친 문서 12종이, 같은 소스가 10-21에 커밋되면서 `evidence.stale`(63건)이 됐다. 재스탬프로 해소했고, 그 재스탬프가 `REVIEW_HISTORY.md`를 2차로 지목해 1.30.1 선례대로 머리말에 기록 한 줄을 남겼다.
- evidence: 덱 렌더 실측(Chrome, UTF-8로 서빙): 1920×1080·1440×900·1366×768 모두 뷰포트를 넘는 슬라이드 0장. 21장 737 → 757px, 22장 728 → 747px(1366×768 뷰포트 764px). `validate --strict` 63 → 0, `drift --strict` exit 0, `impact --since HEAD` pass.
- caveats: 공유 Artifact 링크(조직 공유, 즉시 반영)는 이 시점에 아직 **`v1.31.0`**이다 — 1.32.0 때 재게시가 빠졌다. 재게시는 유지보수자 확인 뒤에 한다. `drift`가 릴리스 커밋마다 이렇게 뜨는 것(미커밋 상태에서 검토 → 커밋 날짜가 검토일 이후)은 이 저장소 작업 방식의 구조적 결과이고, 이번에도 재스탬프 말고 해소 경로는 없다.

## 2026-10-21 - release: 1.33.0 범프 — 이 저장소가 자기 로그를 보관하고, 승인 주체를 갈라 세고, 선적재 index를 줄였다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: release, test, config, docs
- changed: `package.json`(1.32.0 → 1.33.0) · `tests/verification.test.js`(버전 단언) · `.github/actions/validate/action.yml`(기본 `1.33`) · `templates/github-actions/llm-wiki-validate.yml`(핀 `@1.33` 3곳) · README 2종(액션 핀 `@v1.33.0`) · CHANGELOG 쌍(1.33.0 — 2026-10-21) · ROADMAP 2종(1.33.0 출시 절) · `tests/mcp.test.js`(stdio 테스트 픽스처) · `llm-wiki.config.json`(`agentReviewers`) · 위키 `index.md`(Status 축소) · `VERSIONING.md`·`RELEASE_FLOW.md`·`EXAMPLES.md`(노트/핀) · `REVIEW_HISTORY.md`(Release Flow 절 신설) · `log.md` → `log-2026-07.md`·`log-2026-08.md`
- summary: 2026-10-21 유지보수자가 승인한 1.33.0 마무리 6단계를 집행했다. ① `tests/mcp.test.js`의 stdio 왕복 테스트 2건이 `--cwd repoRoot`로 이 저장소 전체에 `stats`를 돌려(14–21초) 20초 타임아웃과 경합하던 간헐 실패를, 문서 1개짜리 tmp 위키 픽스처로 바꿔 없앴다(단언은 그대로, 2건 합계 0.5초). ② `VERSIONING.md`의 `evidence.stale`은 2026-09-08 이후 `package.json` 변경 3건이 전부 `version` 한 줄이라 서술이 맞았다. 같은 자리에서 1.33.0의 MINOR 판정을 문서 정의에 대조했다 — bare `#anchor`의 `evidence.shape` error는 1.32.0 공개 스키마가 이미 거부하던 것이라 계약 변경이 아니라 결함 수정이다(HEAD 스키마로 직접 확인). ③ config에 `agentReviewers`를 넣어 `stats`가 사람 4 / 에이전트 47로 갈라 센다. ④ 항상 선적재되는 `index.md`의 Status에서 릴리스별 장문 bullet(1.29.0–1.32.0)을 걷어 내고 읽는 법만 남겼다. 지운 수치(N-13 11→4, N-14 7→5, 173–234 토큰, 196 KB, `harness-health` 9→0 등)는 모두 CHANGELOG나 다른 위키 문서에 있음을 grep으로 확인했고, Status에만 있던 사실 하나(이 저장소가 `governance.mode: strict`를 명시하는 이유)는 한 줄로 남겼다. ⑤ 이 저장소 자신에 `archive-log --write`를 실행했다. ⑥ 범프 뒤 `impact`가 `RELEASE_FLOW.md`를 지목해, 그 Checklist가 말하는 핀 대조 테스트(`split(".").slice(0, 2)`)를 소스에서 확인하고 노트를 남겼다. 노트가 6건이 되어 가장 오래된 1건을 `REVIEW_HISTORY.md`로 옮겼다.
- evidence: `index.md` 15,731 → 5,890 B(−9,841, 약 −63%). `CLAUDE.md`·`AGENTS.md`가 @-import하므로 세션마다 그만큼 덜 싣는다. `archive-log --write`: 213개 항목 → `log-2026-07.md`(192)·`log-2026-08.md`(21), 18개 잔류. `log.md` 515,047 → 68,478 B. 새 권 2개 모두 `status: needs_review`. 옮겨진 항목을 가리키는 `log.md#…` 앵커는 저장소 전체에서 0건이었다. `validate --strict` finding 0. orphan 34(변동 없음). `impact --since HEAD` pass(stamp_only 0). `stats` humanVerified 4 / agentVerified 47.
- caveats: push·태그·npm 배포는 하지 않았다(승인 밖). CHANGELOG의 날짜 2026-10-21은 범프 커밋 날짜이고, 배포일이 다르면 태그 시점에 맞춘다. 발표 덱(`outputs/team-briefing/`)의 `v1.32.0` 표기는 배포 후 정렬 대상이라 건드리지 않았다. `slim` 기본값 전환은 측정이 필요해 하지 않았다. N-9/N-11(GATE_REVIEW "Stamp-Only Exemption")은 여전히 미결이다.

## 2026-10-20 - docs(wiki): 1.33.0 미커밋분이 지목한 verified 문서 7종 해소 — 그중 2건은 원래 낡아 있던 서술 (미출시)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs
- changed: `EXAMPLES.md` · `profiles/library.md` · `project-profile.md` · `index.md` · `README.md`(위키) · `BENCHMARK.md` · `VISIBILITY.md`
- summary: `impact --since HEAD`가 지목한 7건마다 인용 소스(`src/cli.js`·루트 `README.md`·`GATE_REVIEW.md`·`src/frontmatter-schema.js`)의 실제 diff를 대조했다. 거짓이 된 서술은 없었다. 대신 문서마다 이번 변경 때문에 생긴 공백이나 원래 낡아 있던 문장을 고쳐서 diff에 넣었다. 재스탬프만으로 지나가지 않았다. ① `EXAMPLES.md`: "Codex 스킬 4개"는 **원래 낡은 서술**이었다(실제 `init --agent codex`로 7개 생성 확인). `archive-log`·`--prompt-profile slim`·`prompt --task issue` 예제 절도 새로 썼다. ② `profiles/library.md`: Open Question("프로그래매틱 API를 공개 계약으로 문서화할지")은 `PUBLIC_API.md`가 이미 해소한 **낡은 질문**이었다. 이를 해소로 바꾸고, 동결 `commands` 맵에 `archive-log` 키가 더해진 것이 승인된 계약 변경이라는 점을 Summary에 적었다. ③ `project-profile.md`·`index.md`·위키 `README.md`: 명시적 쓰기 예시와 log 운영 규칙에 1.33.0의 재정의를 반영했다("항목은 고치지 않되 통째로 월별 권에 옮길 수 있다", 이 저장소는 미실행). ④ `BENCHMARK.md`: slim의 "약 44–50%"는 문자 수이지 측정이 아니라는 점과 헤드라인 금지를 규율 절에 더했다. ⑤ `VISIBILITY.md`: visibility enum은 무변경이고, 이 문서의 evidence가 새 단일 정규식을 통과하는 것을 Review Note로 남겼다.
- evidence: `impact --since HEAD` result pass(7 → 0, `stamp_only_exclusions` 0). `npm test` 669/669. `validate-frontmatter` pass. `archive-log` 미리보기 213개 항목 → 2개 권, 17개 잔류. `prompt --task fix` 문자 수 slim 2,700 / full 5,641(48%).
- caveats: `validate --strict`가 `VERSIONING.md`의 `evidence.stale`(package.json, 2026-09-14 1.32.0 커밋) warning 1건을 낸다. 이번 작업 전부터 있던 것이고 손대지 않았다. index.md는 항상 선적재되는 문서라 한 줄만 늘렸다. Status 축소는 여전히 별도 결정이다. 버전 범프·커밋은 하지 않았다.

## 2026-10-20 - feat+fix: 1.33.0 범위 확장(slim 프롬프트·issue 프리셋·승인 주체·evidence 형식 단일화)과 archive-log 출하 전 결함 14건 (미출시)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: code, test, docs
- changed: `src/task-prompts.js`(`PROMPT_PROFILES`·slim 렌더러·`issue`) · `src/commands/skills.js` · `src/commands.js`(`promptCommand` 모드 전달·`impact.stamp_only`·`stats` 승인 주체·월별 권 제외) · `src/commands/scans.js`(`changedAnchorMatcher`·`agentReviewerSet`) · `src/frontmatter-schema.js`(`EVIDENCE_REFERENCE_PATTERN`) · `src/commands/references.js` · `src/commands/archive-log.js`·`wiki-hygiene.js`·`wiki-files.js`(`isLogVolume`)·`wiki-graph.js`·`governance-mode.js` · `src/commands/findings.js`·`src/i18n.js`·`src/config-file.js`·`src/cli.js`·`src/index.js`·`src/mcp/tools.js` · `rules/frontmatter.schema.json`·`rules/README.md` · `templates/adapters/*`(규칙 1줄) · 테스트 신규 5·수정 4 · CHANGELOG 쌍 · GATE_REVIEW · 위키 PUBLIC_API·ARCHITECTURE_CONVENTIONS·GLOSSARY·DOMAIN_FEATURES·domains/00_overview·HARNESS_GOVERNANCE_ROADMAP
- summary: 외부 실무자 글(AI Native FE 150일 회고) 분석에서 나온 권고를 1.33.0 미출시 범위에 넣었다. 새 기능은 모두 opt-in이고, 기본 동작이 바뀌는 곳 4가지는 CHANGELOG에 이름을 붙였다(`prompt`가 거버넌스 모드를 따름 — 기존 결함, 파일 없는 `#anchor` evidence 거부, `stats` 텍스트 꼬리, `log-YYYY-MM.md` 이름 문서). 출하 전 검토가 archive-log에서 재현되는 결함 14건(미래 날짜 오타 하나로 보존 기간 전체 이동, 기존 권 인코딩 미검사, 재실행 시 중복, 비원자적 쓰기, CommonMark와 다른 펜스 판정 등)을 찾아 고쳤다. N-9/N-11은 결정하지 않았다 — opt-in 가시화만 더했고 근거는 GATE_REVIEW에 적었다.
- evidence: `npm test` 669/669(596 + 73), `npm run lint` OK. slim의 기본값 `full`은 프롬프트·스킬·CLI 출력 8,520건을 변경 전후로 비교해 바이트 동일. evidence 형식 단일화는 로컬 도입 위키 11곳의 evidence 1,292항목에서 판정 변화 0. `agentReviewers` 실측(이 저장소 reviewer 1개): human_verified 51 → 사람 4 / 에이전트 47.
- caveats: 버전 범프·배포·커밋은 하지 않았고, 이 저장소 자신의 log 보관·새 규칙 활성화·`agentReviewers` 설정·index.md Status 축소도 하지 않았다(별도 결정). `impact --since HEAD`가 verified 문서를 지목하므로 커밋 전에 해소해야 한다. 바로 아래 2026-10-01 항목의 도입처 프로젝트명 2개를 가명으로 바꿨다 — 미커밋 상태라 공개 HEAD에는 없었지만, 실측 대상 익명화 계약(`docs/BENCHMARK_DISCLOSURE.md`)과 어긋났다. slim을 기본값으로 바꾸는 것은 측정 뒤에만 한다. 테스트는 로컬 Windows·Node 22 한 조합에서만 돌렸다.

## 2026-10-01 - feat(archive-log): 변경 로그 월별 보관 + 기본 off 위키 위생 규칙 4종 (1.33.0 준비, 미출시)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: code, test, docs
- changed: `src/commands/archive-log.js`(신규) · `src/commands/wiki-hygiene.js`(신규) · `src/commands/wiki-files.js`(`isAppendOnlyLog`가 월별 권 포함) · `src/commands/findings.js`(규칙 5종) · `src/config-file.js`(`wikiBudget`) · `src/commands.js`·`src/cli.js`·`src/index.js`(배선) · `tests/archive-log.test.js`·`tests/wiki-hygiene.test.js`(신규) · `tests/verification.test.js`(고정 맵 기대값) · README·CHANGELOG·SECURITY 쌍 · GATE_REVIEW · 위키 PUBLIC_API·DOMAIN_FEATURES·GLOSSARY·ARCHITECTURE_CONVENTIONS
- summary: 도입 프로젝트 두 곳이 손으로 줄인 위키 읽기 비용을 지원 경로로 만들었다. 표면(새 명령·옵션·JSON·고정 맵 키)은 유지보수자 승인. append-only는 "항목은 고치지 않는다, 항목 전체를 원문 그대로 월별 권으로 옮기는 것만 허용"으로 재정의(GATE_REVIEW "Change-Log Volume Scope Decision").
- evidence: `npm test` 596/596(580 + 16), 변이 2종(권 합치는 순서 역전·술어 원복)을 새 테스트가 각각 잡음. 실제 log 사본 2종(도입처 A 120항목, 도입처 B 263항목)에 `--write` 후 별도 재파싱으로 원본 항목이 모두 정확히 한 번·바이트 그대로 있음을 확인.
- caveats: 이 저장소 자신의 log(508KB, 미리보기상 192/228 이동)와 새 규칙 활성화(측정: 날짜 제목 24·log 예산 1·문서 예산 2·앵커 0)는 적용하지 않았다 — 별도 결정. 버전 범프·배포는 하지 않았다.

## 2026-09-14 - release: 1.32.0 — 게이트를 가장 값싼 형태로 깎고 배포한다

- status: verified (재스탬프로 해소, review --approve-all --yes)
- actor: Claude Code (유지보수자 지시)
- scope: templates, docs, release
- changed:
  - templates/github-actions/llm-wiki-validate.yml
  - docs/OPERATIONS.md
  - package.json · .github/actions/validate/action.yml · tests/verification.test.js · README.md · README.ko.md (버전 1.31.0 → 1.32.0)
  - CHANGELOG.md · CHANGELOG.ko.md · ROADMAP.md · ROADMAP.ko.md (1.32.0 절 신설)
  - outputs/team-briefing/ (대상 버전 라벨만)
- summary:
  - 같은 날 앞 항목이 러너 선택과 `npm test` 스텝을 다뤘다면, 이번은 **템플릿에 남아 있던 나머지 비용을 마저 깎고 실제로 배포**한다. 앞 항목의 변경은 커밋만 돼 있어서 **npm 경로로 도입하는 곳에는 닿지 않았다** — `templates/`는 npm tarball에 실려 나가므로 배포해야 전달된다.
  - **의존성 설치를 없앴다.** 게이트에 필요한 패키지는 런타임 의존성이 없는 이 패키지 하나뿐인데 도입처의 트리 전체를 설치하고 있었다. `npm ci` + `npx --no-install llm-wiki`가 `npx -y llm-wiki-governance@1.32`가 됐다. 부수 효과로 **이 패키지를 devDependency로 둘 필요가 없어졌다.** 패키지 이름을 전체로 적는 것이 중요하다 — 짧은 `npx llm-wiki`는 이 패키지의 bin 이름과 같은 **무관한 npm 패키지**를 받아 실행한다.
  - **`timeout-minutes: 10`과 `concurrency`의 `cancel-in-progress`를 넣었다.** 둘 다 템플릿에 아예 없었다. 상한이 없으면 멈춘 스텝이 GitHub 기본값 6시간까지 돌고, 더 새 커밋이 올라와 판정이 무의미해진 run도 끝까지 돌며 계속 과금됐다.
  - **MINOR로 판정했다. `src/`는 한 줄도 바뀌지 않았다.** PATCH보다 큰 이유는 템플릿을 새로 복사하면 동작이 다르기 때문이고(의존성 설치 없음, 테스트 없음), MAJOR보다 작은 이유는 이미 복사해 간 템플릿은 그쪽 저장소의 파일이라 버전을 올려도 움직이지 않기 때문이다.
- evidence:
  - templates/github-actions/llm-wiki-validate.yml — 실행부가 스텝 5개로 줄었다(checkout · setup-node · 게이트 3). `npm ci`도 `npm test`도 없다.
  - docs/OPERATIONS.md#section:Running the gates without spending Actions minutes — 깎은 항목 4종과 `fetch-depth: 0`이 남는 이유.
  - .github/actions/validate/action.yml — `version` 입력 기본값 `1.32`(X.Y 형식). RELEASE_CHECKLIST가 1.27.0–1.27.2에 이것이 낡았던 사고를 근거로 명시 지목하는 항목이다.
- caveats:
  - **절감은 측정하지 않았다.** 테스트 스텝 제거분은 도입처 스위트 길이에, 나머지는 도입처가 self-hosted로 옮기는지에 달려 있다. CHANGELOG·ROADMAP의 어떤 문장도 숫자를 주장하지 않는다.
  - **이미 템플릿을 복사해 간 도입처는 이 릴리스로 아무것도 얻지 못한다.** 그들의 워크플로는 그들의 파일이다 — 다시 복사하거나 네 가지를 직접 반영해야 한다. 이 사실을 CHANGELOG 2종에 명시했다.
  - 팀 브리핑 덱은 **라벨만** 1.32.0으로 맞추고 본문은 건드리지 않았다. RELEASE_CHECKLIST의 조건은 "사용자 노출 동작(명령·옵션·usage·MCP 표면) 변경 시"인데 이번 릴리스는 CLI를 바꾸지 않았기 때문이다.
  - `impact`가 지목한 문서는 이번에도 본문 대조 후 재스탬프로 해소했고, `stamp_only_exclusions`가 그만큼 남는다 — 제품 자신이 "이 문서들은 이번 실행에서 실제로 검사되지 않았다"고 말하는 상태다(N-9).

## 2026-09-14 - ci(templates): 도입처가 러너 분을 쓰지 않고도 게이트를 돌릴 수 있게 한다

- status: verified (재스탬프로 해소, review --approve-all --yes)
- actor: Claude Code (유지보수자 지시)
- scope: templates, docs
- changed:
  - templates/github-actions/llm-wiki-validate.yml
  - docs/OPERATIONS.md
  - README.md
  - README.ko.md
- summary:
  - **이 프로젝트가 도입처에 권하는 CI 채널은 GitHub-hosted 러너를 기본으로 쓰고, 그 비용을 어디에도 적지 않았다.** 공개 저장소에서는 무료라 보이지 않던 문제인데, 비공개 저장소에서는 매 분이 과금되고 조직 계정에서는 그 한도를 **조직의 모든 저장소가 공유**한다 — 즉 이 도구를 도입하는 비용이 다른 팀이 쓰던 예산에서 나간다.
  - 워크플로 템플릿의 `runs-on`을 `${{ vars.LLM_WIKI_RUNNER || 'ubuntu-latest' }}`로 바꿨다. 도입처가 **파일을 포크하지 않고 변수 하나로** self-hosted 러너에 붙일 수 있고, 변수를 안 두면 기존 동작 그대로다. self-hosted 러너의 분은 과금되지 않으면서 required status check의 강제력은 유지된다.
  - 같은 템플릿에서 `npm test` 스텝을 **삭제**했다. 어떤 게이트도 그 결과에 의존하지 않는데 비공개 저장소에서는 보통 이 파일에서 가장 비싼 스텝이고, 도입처 자신의 CI가 이미 테스트를 돌린다면 같은 값을 두 번 낸다. 되살리는 방법을 주석으로 남겼다 — 이 워크플로가 그 저장소의 유일한 CI인 경우다.
  - 파일 상단과 `docs/OPERATIONS.md`에 비용 구조와 **요금 0인 두 채널**을 적었다: 러너가 아예 필요 없는 `templates/git-hooks/pre-commit`, 그리고 self-hosted 러너. 둘은 등가가 아니다 — 훅은 각 클론에 살고 `--no-verify`로 우회되며 required check가 될 수 없다. 협조하는 팀에는 충분하지만 위키 상태를 브랜치에서 증명해야 하면 부족하다는 것을 그대로 적었다.
  - self-hosted 전환의 함정 셋을 문서에 못박았다: 레이블에 맞는 러너가 **온라인이기 전에** 변수를 두면 잡이 실패하지 않고 24시간 큐에 머물러 required check가 조용히 PR을 막는다 · 러너에 Node가 필요하다 · **공개 저장소에는 self-hosted 러너를 붙이면 안 된다**(포크 PR이 그 머신에서 임의 코드를 실행한다).
- evidence:
  - templates/github-actions/llm-wiki-validate.yml — `runs-on`의 변수 폴백, 삭제된 테스트 스텝 자리의 주석, 상단 러너 분 설명.
  - docs/OPERATIONS.md#section:Running the gates without spending Actions minutes — 두 채널의 비등가성과 `gh variable set` 절차.
  - templates/git-hooks/pre-commit — 러너 없이 같은 두 검사를 working tree에 돌리는 기존 채널(이번에 신설한 것이 아니라 요금 0 경로로 승격해 문서화한 것).
- caveats:
  - **`impact`가 지목한 `verified` 5종(EXAMPLES · index · README · HARNESS_GOVERNANCE_ROADMAP · RELEASE_FLOW)은 본문을 고치지 않고 재스탬프로 해소했다.** 대조 결과 서술이 틀린 곳이 없었다: 템플릿을 인용하는 두 문서는 `npm test`도 `runs-on`도 서술하지 않고(로드맵 190~197줄 표가 적는 "실제 실행 명령"은 `validate-frontmatter`·`validate --strict`로 불변), README를 인용하는 세 문서는 CI 문단의 내용을 재서술하지 않는다.
  - Review Note를 추가하지 않았다. 다섯 중 넷이 이미 5건 상한이라 문서마다 아카이브 회전(항목 이동 + 포인터와 헤더 숫자 갱신)이 필요한데, 그렇게 얻는 것은 이 항목과 중복되는 기록이다. 이 결정으로 **해당 문서들의 Review Notes만 읽어서는 이번 변경을 알 수 없다** — 경위는 이 로그가 정본이다.
  - 도입처의 Actions 분을 실제로 얼마나 줄이는지는 **측정하지 않았다.** `npm test` 제거분은 도입처 테스트 스위트 길이에 달렸고, 나머지는 도입처가 self-hosted로 옮기는지에 달렸다. 이 항목의 어떤 숫자도 절감 주장으로 읽으면 안 된다.

## 2026-09-08 - docs(wiki): 1.31.0이 지목한 문서 11종 해소 — 9곳은 서술이 실제로 틀려 있었다

- status: verified (Review Note 후 review --approve-all --yes)
- actor: Claude Code (같은 지시의 2차 팬아웃)
- scope: docs (위키 11문서 + 아카이브 회전 6건 + 발표 덱 재조정)
- 계기:
  1.31.0 커밋 직후 `impact --since HEAD~1 --strict`가 11건, `drift --strict`가 18건을 냈다.
  릴리스 커밋의 정상적인 2차 팬아웃이지만, 이번에는 **재스탬프로 넘길 수 없는 것이 9곳**이었다.
- 실제로 틀려 있던 서술 9곳(재확인이 아니라 내용 수정):
  `ARCHITECTURE_CONVENTIONS` 5곳 — `src/config.js` 줄이 소유물 목록에서 새로 옮겨 온 에이전트
  어휘를 빼고 있었고, `scans.js` 줄에 N-8 경로 prefix 매칭이 없었고, `config-file.js` 줄에 값
  어휘 검증이 없었고, `skills.js` 줄의 "refresh 감지는 여전히 content hash"가 거짓이 됐고,
  `fix-migrate.js` 줄에 `driftCommand`의 rule-map 게이트가 없었다.
  `DOMAIN_FEATURES` 3곳 — 모드 절이 `lite`가 건너뛰는 스캔을 열거하면서 `drift` 명령 자체는
  게이트 밖이라는 사실을 적지 않았고(그 공백이 곧 이번 결함이다), reverse-impact 절이 규칙
  severity는 적고 **앵커 매칭 방식**은 적지 않았으며(N-8이 정확히 거기 있었다), 스킬 예산 줄이
  refresh 판정을 content hash로만 적었다.
  `GLOSSARY` 1곳 — `llm-wiki.config.json` 항목이 인식 키만 적고 **값 검증**을 적지 않았다.
  ⚠️ **공통 패턴**: 이번에 고친 9곳 중 5곳은 "무엇을 하는가"는 맞고 "무엇을 하지 않는가"가
  빠진 문장이었다. 게이트가 없다는 사실은 게이트가 생길 때까지 아무 finding도 내지 않는다.
- 본문 불변 + Review Note로 넘긴 것:
  `profiles/library.md`·`project-profile.md`(둘 다 `src/cli.js` 인용, `main()` 무변경) ·
  `docs/llm-wiki/README.md`(루트 README 변경은 내용이고 이 문서는 구조 규약만 소유 — 쌍 유지가
  실제로 지켜졌는지 EN/KO 양쪽에서 확인했다) · `VISIBILITY.md`(`config.js`는 바뀌었지만 인용
  심볼 `VALID_VISIBILITIES`는 무변경) · `BENCHMARK.md`(인용 섹션 앵커가 가리키는
  `Impact Measurement Scope Decision` 절은 글자 하나 안 바뀜 — **섹션 로케이터를 존중하지 않는
  알려진 노이즈이고 1.31.0도 그것은 고치지 않았다**).
  `index.md`는 Status에 1.31.0 항목 2개를 더했다(이 문서는 Review Notes 절이 없다).
- 아카이브 회전 6건:
  상한 5건에 걸린 문서(`ARCHITECTURE_CONVENTIONS`·`DOMAIN_FEATURES`·`GLOSSARY`·`00_overview`·
  `project-profile`·`README`)에서 최고령 노트 1건씩을 `REVIEW_HISTORY.md`로 옮기고, 손으로
  유지되는 세 숫자(아카이브 헤더 `N건`·원문서 포인터 `N entries`·실제 불릿 수)를 함께 갱신했다.
  `tests/review-notes-cap.test.js` 3건이 그 등식을 고정하며 통과한다.
- 발표 덱:
  1.31 항목을 넣자 슬라이드 22가 화면을 넘겨 마지막 항목이 잘렸다 — **두 장으로 나눈 이유가
  바로 그것이었으므로** 세 번째 장을 만드는 대신 경계를 한 칸 옮겼다(① 1.0→1.27, ② 1.28→1.31).
  브라우저에서 698px 높이로 두 장 모두 한 화면에 들어가는 것을 눈으로 확인했다. 노트의 장 제목·
  대본·시간 배분도 함께 맞췄다. ⚠️ 첫 시도에서 "1년 가까이 고칠 방법이 없던 경고"라고 썼는데
  `harness-health`는 1.28.0(2026-08-03) 출하라 5주다 — 이 릴리스가 고치고 있는 바로 그 유형의
  과장이라 발견 즉시 고쳤다.
- 게이트:
  validate --strict 0 · validate-frontmatter 0 · audit --strict 0 · drift --strict 0 ·
  harness-health --strict 0 · **impact --since HEAD~1 0** · review 0 · tests 579/579.

## 2026-09-08 - feat(governance): 게이트와 리포트와 출하 문서가 서로 다른 말을 하고 있었다 (1.31.0)

- status: needs_review (에이전트 편집 — 배치 끝에 review --approve-all --yes)
- actor: Claude Code (유지보수자 지시: "전부 해결작업을 진행하고, 오케스트레이션이 가능하면 그렇게 진행해")
- scope: src (5파일) · tests (신규 2파일 + 수정 3) · docs (위키 4 + 루트 8 + 템플릿 3 + outputs 6)
- 계기:
  1.30.0이 정책 레벨 셋을 출하했는데 제품에게 그 레벨을 다 가르치지 못했다. 출하 지면을 훑어
  보니 같은 공백이 세 형태로 나왔다 — 레벨을 무시하는 게이트(`drift`), `mode`를 다른 뜻으로 쓰는
  리포트 4곳, 모드 이전 동작을 설명하는 문서. 여기에 하네스 거버넌스 실행에서 측정된 결함 4건이
  아직 열려 있었고, 그중 `harness-health` finding 9건은 해소 경로가 없어 풍경처럼 취급되고 있었다.
- 동작 변경(빌드를 새로 실패시킬 수 있는 것 2건):
  `impact`가 디렉터리 앵커를 지목한다(N-8). 정확 문자열 비교였는데 git은 파일만 열거하므로
  `src/commands/`를 인용한 문서가 한 번도 안 잡혔다 — 이 제품이 존재하는 이유인 게이트의 위음성.
  `llm-wiki.config.json`의 `type`·`agents`가 CLI와 같은 목록으로 검증된다. `{"type":"frontendd"}`가
  통과한 뒤 알 수 없는 유형으로 동작했고 `{"agents":["all"]}`은 문자열 그대로 넘어갔다(CLI 경로는
  이미 펼친 뒤였다) — 설정 하나에 답이 둘.
  반대 방향 1건: `drift`가 모드와 설정 severity를 따르므로 `lite`에서 exit 1 → 0이 된다.
- 리포트:
  `mode:`를 `strict:` + `governance_mode:`로 쪼갰다(validate·impact·check-run·harness-health).
  레벨의 **출처**는 이 넷에 찍지 않았다 — governance-modes 테스트가 "strict를 명시하는 것과 아무
  것도 안 쓰는 것이 byte-identical"을 마이그레이션 보증으로 단언하고, `(config)` 대 `(default)`가
  그걸 깬다. `impact`의 caveat에는 출처를 남겼다(그 문장의 목적이 "초록이 뜻하는 바"를 말하는 것).
  `drift` 요약은 `mode:` → `run:`, 신규 `evidence.stale: on|off`.
  `impact`에 `stamp_only_exclusions` 추가(N-9) — 검토 스탬프만 바뀐 문서를 이름으로 보고하되
  **exit code는 움직이지 않는다.** 강제하면 N-11과 부딪친다(같은 자기제외가 해소 경로다).
- 되돌린 구현 1건:
  N-7을 "좁히기 조건이 깨졌다"로 읽고 `source_files`의 로케이터를 정밀 앵커로 처리했다가
  **되돌렸다.** GLOSSARY가 `source_files`를 넓은 앵커로 정의하고, 좁히기 경로는 이미 있다 —
  파일을 `evidence`에만 라인 범위로 인용하면 된다(픽스처로 확인). 이 저장소엔 로케이터를
  `source_files`에 쓴 문서가 0건이라 지역 소비자가 없고, 도입처에서는 넓게 쓴 앵커를 조용히
  좁혀 위음성을 만든다. 로드맵의 N-7 결론을 정정했다.
- 해소 경로가 없던 finding 9 → 0:
  `init --refresh`가 본문만 비교해서(양쪽에 `stripMarker()`), 본문이 최신인 산출물은 낡은 마커를
  영원히 갖고 `harness-health`는 영원히 보고했다. 이제 그 경우를 다시 스탬프하고 "refreshed"가
  아니라 "re-stamped"로 보고한다. 이 막힌 길을 고정하던 테스트도 틀려 있었다 — 부분 문자열로
  단언해서 손대지 않은 형제 산출물이 조건을 만족시켰고, 결함이 있든 없든 통과했다.
  남은 1건은 실재 피해였다: 이 저장소 `AGENTS.md`가 adapter v1인데 `CLAUDE.md`는 v2여서,
  1.27.2의 locate-before-reading 규율이 없는 이전 지침을 그 규율을 출하한 저장소가 Codex에게
  건네고 있었다. 손으로 v2로 올렸다(기존 adapter는 절대 덮어쓰지 않으므로 그것이 유일한 경로다).
- 출하 문서가 코드와 어긋난 자리(개수로 줄이지 않고 하나씩):
  CI 템플릿이 `npm ci` 뒤에 맨 `npx llm-wiki`를 세 번 돌리면서 devDependency 전제를 적지 않았다 —
  npm에 무관한 `llm-wiki` 패키지가 있으므로 러너에서 **남의 코드를 내려받아 실행**했다.
  `--no-install`로 바꿨고(이 저장소 CI·pre-commit 훅과 동일), 템플릿의 어떤 `npx`도 그 플래그
  없이는 안 된다는 단언을 테스트에 넣었다.
  README가 `help`에 없는 exit code 레퍼런스를 약속했다 → help에 `Exit codes` 블록 추가.
  `help`가 13개 명령이 받는 `--mode`를 언급하지 않았다. `help mode`가 init 기본값을 틀리게 적었다.
  릴리스 준비도가 `migrate_apply: keep blocked`(1.2에 해금됨)를 찍었다.
  README 2종이 생성 스킬 7종 중 4종만 적었다. SECURITY 2종이 쓰기 표면(`mode set --write`가
  비위키 파일을 쓴다)과 MCP 툴 18종을 축소해 적었다. OPERATIONS가 거버넌스 모드를 언급하지 않아,
  `lite`에서 아무것도 잡지 않는 초록 `impact` 스텝을 게이트로 오해할 수 있었다.
  PUBLIC_API가 명령을 30개로 세고(실제 32) 1.30.0 export 4종을 빠뜨렸다.
  git-hooks README가 검사 하나인 훅을 설명했다(실제 둘, 두 번째가 핵심).
  GATE_REVIEW와 PUBLIC_API가 "다음 릴리스는 SemVer MAJOR"라고 5주간 적고 있었다(1.28.0 MINOR로 출하).
  RELEASE_FLOW가 배포 인증을 토큰이라고 적었다 — 레지스트리 `_npmUser`는 1.29.5·1.30.0·1.30.1
  전부 OIDC라고 말한다. 거짓 문장 4건을 Review Note에 이름으로 적고 모르는 것도 적었다.
  결정 4건이 기록 없이 출하돼 있었다(1.29.2 `delegationPolicy`의 **음성** 측정 포함).
- EN/KO 짝:
  `SECURITY.ko.md`에 68줄 절 하나가 통째로 없었다. `ROADMAP.md`가 7월 날짜와 "(this release)"를
  달고 있었다. 프로즈의 `\u0000` 이스케이프가 겹쳐 적혀 있었다(로그의 것은 append-only라 그대로
  두고 여기 정정을 적는다 — 2026-07-15 v1.7.1 항목의 `\\u0000`는 소스가 `\u0000` 하나이므로
  잘못이다). 이 로그의 1.30.1 대응 CHANGELOG 항목이 "사실 3건"이라고 과장했다(둘).
- 게이트/테스트:
  tests 568 → 579 (신규 `anchor-semantics` 7 · `stamp-only-exclusion` 4). RED는 파일 단위가 아니라
  테스트별로 확인했다 — 수정 3건을 되돌리면 앵커 7건 중 3건 실패·4건 통과이고, 통과하는 4건은
  일부러 바꾸지 않은 계약을 고정한다. `harness-health` 9 → 0 · validate --strict 0.
  ⚠️ **N-8과 config 검증은 이 저장소에서 findings를 늘리지 않았다** — 디렉터리 앵커를 쓰는 문서가
  0건이고 config도 유효하기 때문이다. 즉 두 변경의 도입처 영향은 이 저장소로는 관측되지 않으며,
  근거는 외부 저장소 5곳 실측(디렉터리 앵커 19건)과 픽스처 테스트뿐이다.

## 2026-09-08 - fix(roadmap): 국문만 고쳐 둔 항목 순서를 영문에도 반영했다

- status: verified (Review Note 후 review --approve-all --yes)
- actor: Claude Code (유지보수자 확인 요청에서 발견)
- scope: docs (영문 ROADMAP 순서 정렬 + 위키 Review Note 1건·아카이브 회전 1건)
  "이제 문제 없나"는 확인 요청을 받고 EN/KO 쌍을 실제로 대조하다 찾았다. 2026-09-08 국문 재작성
  때 ROADMAP.ko.md의 post-1.19 목록에서 1.25가 1.24보다 앞에 있던 순서를 바로잡았는데, 영문
  ROADMAP.md는 그대로 뒀다. CONTRIBUTING이 "한쪽을 고치면 짝도 함께 고쳐 주세요"를 요구하므로
  그 규칙을 어긴 상태였다.
  영문도 1.24(released) → 1.24(bundled) → 1.25 순으로 맞췄다. 항목 본문은 글자 하나 건드리지
  않은 순수 이동이라, 스크립트가 재배열 후 파일 바이트 수가 같은지를 단언한다.
  같은 자리에서 나머지 쌍도 대조했다. README는 EN/KO 모두 절 7개가 같은 순서로 대응하고 104줄로
  동일하며, ROADMAP도 절 38개로 일치한다. SECURITY.ko의 누락 절은 이번 라인에서 이미 복원했다.
  CHANGELOG의 절 제목이 언어별로 다른 것(Added/추가)은 의도된 지역화이지 불일치가 아니다.
  impact가 HARNESS_GOVERNANCE_ROADMAP.md를 지목해서, 그 문서가 ROADMAP.md에 대해 하는 말을
  확인했다 — 소유 경계(릴리스별 계획은 ROADMAP이 소유)와 스캔 범위(루트 문서는 listTargetMarkdown
  밖)뿐이라 목록 순서와 무관하다. 본문 불변으로 두고 Review Note를 남겼으며, 상한 5건을 지키려
  최고령 1건을 REVIEW_HISTORY.md로 돌렸다(12 → 13건).
  tests 568/568 · validate --strict 0 · impact 0 · drift 0 · review 0

## 2026-09-08 - docs(deck): 타임라인이 화면을 넘겨서, 두 장으로 나눠 마무리 앞으로 옮겼다

- status: needs_review (에이전트 편집 — `outputs/`는 위키 내용 문서가 아니라 승격 대상 없음)
- actor: Claude Code (유지보수자 지시·설계 제안 채택)
- scope: docs (발표 덱 구조 변경; 22장 → 23장)
- 문제:
  - 발전 타임라인이 11번 슬라이드에 항목 19개로 있었고 **화면보다 훨씬 길었다.** 1440x900에서
    한 화면에 1.16까지만 보였고, 그 상태로 방향키를 누르면 스크롤 스냅이 **다음 장으로 건너뛰었다.**
    발표 중 이 장만 스크롤로 넘겨야 했다.
- 바꾼 것:
  - **두 장으로 나눠 마무리 바로 앞으로 옮겼다.** 21 = 발전 스토리 ①(1.0 → 1.26), 22 = 발전
    스토리 ②(1.27 → 1.30), 23 = 마무리. 이력은 본문 흐름보다 부록에 가깝다는 판단이고,
    유지보수자 제안(마지막 인사 전으로 이동 + 분할) 그대로다.
  - **나누는 지점은 개수가 아니라 내용 밀도로 잡았다.** 1.0~1.26은 설명이 한 줄이라 **2단**으로
    13개(7+6)를 넣고, 1.27~1.30은 설명이 2~3줄에 정직 포인트까지 있어 **1단**으로 6개를 뒀다.
    2단을 전면 적용하지 않은 이유는 좁은 단에서 긴 설명이 더 접혀 높이 이득이 사라지기 때문이다.
  - **`.tl--compact` 변형과 `.histhead`를 추가했다.** 이 두 장에만 적용되며 항목 간격·글자
    크기만 줄이고 **본문은 한 글자도 지우지 않았다**. 제목도 한 줄로 들어가게 폭을 넓혔다.
  - 발표자 노트를 따라 재구성했다. 옛 11절을 21·22절로 나누고 릴리스별 "한 줄 설명" 7건을
    **원문 그대로** 옮겼으며(1.26은 21절, 1.27~1.30은 22절), 12~21절을 11~20절로, 마무리를
    23절로 당겼다. 벤치 슬라이드 상호참조(21장 → 20장)와 표지의 장수(22장 → 23장)도 고쳤다.
  - 폴더 `README.md`의 "무엇이 바뀌면 어디를 고치나" 대응표를 새 번호로 전부 갱신했다.
- evidence:
  - 게시본을 브라우저로 확인: 21·22 두 장 모두 **스크롤 없이 한 화면에** 들어간다(21은 1.0~1.26
    13개 전부, 22는 1.27~1.30 6개 전부에 1.30의 "가장 최근" 주황 마커까지). 23/23 마무리 정상.
  - 슬라이드 23개 = 노트 23절, `class="now"` 1개, 낡은 "다음 두 장에서" 전방참조 0.
- caveats:
  - 덱 하단 카운터는 스무스 스크롤 중 requestAnimationFrame으로 갱신돼서, 자동화로 키를 연속
    입력하며 찍은 스크린샷과는 한 박자 어긋나 보인다. 덱의 기존 동작이고 사람이 넘기는 속도에서는
    문제가 되지 않는다 — 이번 변경으로 생긴 것이 아니다.
  - 장수가 22 → 23으로 늘어 발표 시간이 40~50초쯤 늘어난다. 노트의 장별 배분(21은 40초,
    22는 50초)으로 반영했지만 실제 리허설은 하지 않았다.

## 2026-09-08 - fix(deck): 덱이 MCP 툴 개수를 1.30.0 이전 숫자로 말하고 있었다

- status: needs_review (에이전트 편집 — `outputs/`는 위키 내용 문서가 아니라 승격 대상 없음)
- actor: Claude Code (유지보수자 지시로 브라우저 눈 확인 수행)
- scope: docs (발표 덱 1줄 교정)
- changed:
  - `outputs/team-briefing/llm-wiki-briefing.html` 슬라이드 8 — "열려 있는 건 읽기/확인 **17개**뿐"을
    **18개**로 고쳤다. 1.30.0이 MCP에 읽기 전용 `mode` 툴을 더해 17 → 18이 됐는데, 덱 정렬 배치가
    타임라인과 버전 표기만 보고 이 문장을 놓쳤다. 소스로 확인했다: `MCP_TOOLS.length === 18`
    (validate·audit·next·status·doctor·stats·graph·explain·**mode**·handoff·prompt·list_docs·
    search_docs·get_doc·get_related·onboard·review·prepare).
  - Artifact 재게시(같은 URL) 후 브라우저에서 반영 확인.
- evidence:
  - 브라우저로 22장 전부 넘겨 확인(게시본 기준, 1440x900). 레이아웃 깨짐·줄바꿈 깨짐·오탈자 없음,
    콘솔 에러 0. 버전 표기 4곳(탭 제목·표지 필·타임라인 eyebrow·마무리 필) 모두 v1.30.1.
  - 1.30 타임라인 항목이 전문 렌더되고 "가장 최근" 주황 마커가 1.29.2에서 1.30으로 이동한 것 확인.
  - 숫자 주장 일괄 점검: 노트의 "21장" 2건은 21번 슬라이드 상호참조로 정상, 노트 절 22개 = 슬라이드
    22장 일치.
- caveats:
  - **슬라이드 11(타임라인)이 화면보다 훨씬 길다.** 1440x900에서 한 화면에 1.16까지만 보이고 1.30까지
    보려면 스크롤이 필요하며, 이 상태에서 방향키를 누르면 다음 장으로 건너뛴다(실제로 확인 중
    11 → 12로 건너뛰었다). 발표 시 이 장은 스크롤로 넘겨야 한다. 항목이 20개라 구조적인 문제이고,
    이번 배치에서 고치지 않았다 — 장을 쪼개면 노트 12~22장 번호를 전부 밀어야 한다.
  - 확인은 게시본(Artifact) 기준이다. 저장소의 HTML은 doctype·head가 없어 로컬 파일로 직접 열면
    quirks mode로 렌더된다(게시 시 래퍼가 붙는다). 브라우저 확장이 `file://`을 막아 로컬 렌더는
    확인하지 못했다.

## 2026-09-08 - chore(wiki): 1.30.1 릴리스 후 재기준선

- status: verified (재스탬프 후 `review --approve-all --yes`)
- actor: Claude Code (유지보수자 지시)
- scope: wiki (재스탬프 6건 + 아카이브 머리말 1줄; 서술 내용 변경 없음)
- changed:
  - `drift --downgrade` → `review --approve-all --yes`로 `evidence.stale` 6건을 해소했다
    (`HARNESS_GOVERNANCE_ROADMAP`·`PUBLIC_API`·`project-profile`·`RELEASE_FLOW`·`VERSIONING`·
    `profiles/library`). 릴리스 커밋이 `package.json`의 커밋 날짜를 옮겨서 생긴 통상적 드리프트다.
    `impact`의 version-only 매니페스트 면제(N-13)는 `drift`에 적용되지 않는다 — 날짜 앵커라
    **무엇이** 바뀌었는지가 아니라 **언제** 바뀌었는지만 보기 때문이고, 1.29.0에서 의도적으로 그렇게 정했다.
  - `REVIEW_HISTORY.md` 머리말에 재기준선 한 줄을 추가했다. 위 재스탬프가 2차 팬아웃을 만들어
    `impact.source_changed`가 이 문서를 지목했는데, 여기서는 재스탬프가 **no-op**이었다
    (`reviewed_at`이 이미 같은 날짜 — N-11). 파일이 안 바뀌니 게이트가 계속 울고, 커밋해도 CI가
    `--since HEAD~1`로 같은 것을 다시 잡는다. 그래서 손댄 이유를 기록으로 남겼고, 그 내용은
    **아카이브로 옮긴 항목이 없다**는 사실이다(세 문서의 Review Notes는 상한 아래이고 내용도 그대로).
- evidence: tests 568/568 · validate --strict 0 · impact 0 · drift 0 · review 0
- caveats:
  - 이 항목의 첫 작성분은 셸이 백틱을 명령 치환으로 먹어 코드 식별자가 전부 빈칸이 됐다.
    커밋 전에 스크립트 파일로 다시 썼다.

## 2026-09-08 - docs(deck): 팀 발표 덱이 1.29.2에 멈춰 있어 거버넌스 모드를 한 글자도 담고 있지 않았다

- status: needs_review (에이전트 편집 — `outputs/`는 위키 내용 문서가 아니라 승격 대상 없음)
- actor: Claude Code (유지보수자 지시)
- scope: docs (사내 발표 자료; `package.json` `files` 밖이라 npm 배포물 무관 → 버전 bump 없음)
- changed:
  - `outputs/team-briefing/llm-wiki-briefing.html` — 표지·타임라인 eyebrow·마무리의 버전 표기를
    `v1.29.2` → `v1.30.1`. 슬라이드 11(발전 타임라인)에 **1.30 항목 신설**하고 "가장 최근" 표시
    (`class="now"`)를 1.29.2에서 1.30으로 넘겼다. 내용은 lite/standard/strict 세 단계, 엔진은 하나,
    같은 저장소에서 오간다, 인수인계 앞두면 strict + `backfill`, 기존 프로젝트는 무영향, 그리고
    이 덱의 관례인 **정직 포인트**(지시문 15~21% 증가는 확실, 절감은 미측정).
  - `outputs/team-briefing/SPEAKER_NOTES.md` — 대상 버전, 11장 제목, 타임라인 나레이션 갱신 +
    **"1.30 한 줄 설명(질문 나오면)"** 블록 신설(최근 릴리스마다 두는 관례를 따랐다).
  - `outputs/team-briefing/README.md` — 대상 버전 `v1.30.1`.
  - Artifact 재게시 — 같은 URL(`13dfc476-…`)에 갱신본을 올려 공유 링크를 유지했다.
- 판단:
  - **슬라이드는 22장 그대로 두고 타임라인 항목만 늘렸다.** 이 덱의 실제 관례가 그렇다 —
    슬라이드 15(최근 능력)는 1.15·1.18·1.19에 고정돼 1.20~1.29 어느 릴리스에서도 손대지 않았고,
    1.28의 breaking 변경조차 타임라인 한 줄로 처리됐다. 슬라이드를 늘리면 노트 12~22장 번호를
    전부 밀어야 하는데 그만한 근거가 없다.
  - **1.30.1은 타임라인에 넣지 않았다.** 문서 전용 패치는 타임라인에 올리지 않는 것이
    1.26.1~1.26.3의 선례다(그때도 표지 버전만 올라갔다). 버전 표기만 1.30.1이고 타임라인 마지막
    항목은 1.30이다.
- evidence:
  - 슬라이드 수 22 유지, `class="now"` 정확히 1개, 잔여 `v1.29.2` 표기 0
  - 덱 하단 카운터는 `slides.length`로 계산하므로 별도 수정 불필요
- caveats:
  - 브라우저로 처음부터 끝까지 넘겨 보는 눈 확인은 하지 않았다(README "갱신 후 확인" 항목).
    타임라인 항목이 길어 슬라이드 11이 화면보다 길어질 수 있는데, 그 경우를 위한 낮은 임계값
    IntersectionObserver가 이미 덱에 들어 있다.

## 2026-09-08 - chore(release): 1.30.1 배포 준비 (문서 전용)

- status: needs_review (에이전트 편집 — 위키 내용 문서는 건드리지 않아 승격 대상 없음)
- actor: Claude Code (유지보수자 지시로 배포 진행)
- scope: release (버전·CHANGELOG 2종·README 2종의 액션 핀·버전 단언 테스트)
- changed:
  - `package.json` — `1.30.0` → `1.30.1`. 런타임·CLI·공개 API 무변경이므로 PATCH이며,
    npm 패키지 페이지에 다시 쓴 README를 올리기 위한 배포다(1.26.1~1.26.3과 같은 이유).
  - `CHANGELOG.md`·`CHANGELOG.ko.md` — 1.30.1 항목 신설.
  - `README.md`·`README.ko.md` — 축약하면서 빠졌던 CI 안내를 한 문단으로 되살리고 컴포지트 액션을
    `@v1.30.1`로 고정했다. `RELEASE_CHECKLIST.md`가 "README 2종이 현재 태그의 컴포지트 액션을
    참조할 것"을 요구하는데, 축약이 그 줄을 지워서 체크리스트를 통과할 수 없는 상태였다. 축약 자체보다
    체크리스트가 옳다고 판단했다 — 그 항목은 1.27.0~1.27.2에서 핀이 실제로 낡았던 사고 때문에 생겼다.
  - `tests/verification.test.js` — 패키지 버전을 못박는 단언을 `1.30.1`로 갱신(릴리스 절차의 일부).
- evidence:
  - `npm test` — 568/568 pass, fail 0, skipped 0
  - `validate --strict`·`impact`·`drift`·`review`·`validate-frontmatter` — 전부 pass, finding 0
  - `npm pack --dry-run` — `llm-wiki-governance-1.30.1.tgz`, 78 파일, `rules/frontmatter.schema.json`·
    `README.ko.md`·`CHANGELOG.ko.md` 포함 확인
  - `doctor` — `governance_mode: strict`, `ci_governance: 4 blocking`, omission gate 있음
- caveats:
  - `.github/actions/validate/action.yml`의 `version` 기본값은 `"1.30"` 그대로다. PATCH라 `X.Y`가
    바뀌지 않아 갱신 대상이 아니다.
  - ROADMAP 2종에는 항목을 추가하지 않았다. 문서 전용 PATCH는 로드맵 라인을 만들지 않는 것이
    1.26.1~1.26.3의 선례다.
  - 팀 브리핑 덱은 갱신하지 않았다. `RELEASE_CHECKLIST.md`의 조건은 "사용자 대상 동작(명령·옵션·
    사용법·MCP 툴 표면)이 바뀐 경우"인데 이번 릴리스는 해당하지 않는다.
  - 배포 인증은 OIDC 단독이 아니라 `npm-release` 환경 secret의 패키지 한정 토큰 경로다
    (v1.29.3·v1.29.4에서 OIDC 토큰 교환이 완료되지 않은 것이 기록돼 있다). provenance는 계속 OIDC.

## 2026-09-08 - docs(readme): README가 제품 사양서로 자라서 처음 온 사람에게 너무 무거웠다

- status: verified (에이전트 편집 후 `review --approve-all --yes`로 승격; 이 저장소 정책)
- actor: Claude Code (유지보수자 지시)
- scope: docs (루트 README 2종 축약 + 게이트가 지목한 위키 3종 + 아카이브 1종; 코드·CLI·계약 무변경)
- changed:
  - `README.md`·`README.ko.md` — 각각 **270 → 102줄**. 남긴 것은 소개, 빠른 시작, 핵심 기능 5가지,
    명령 표(그룹당 한 줄), 거버넌스 모드(표 + 3문단), MCP, 지원 환경, 링크. 걷어낸 것은 RAG 대비 표,
    권장 모델 표, "작동 방식"(mermaid + 샘플 출력), "거버넌스 실전"(15줄짜리 면제 규칙 문단 포함),
    "업그레이드: impact가 이제 빌드를 실패시킵니다" 절 전체, "실제로 도움이 되나?" 절. 두 파일을
    같은 구조·같은 줄 수로 맞췄다.
  - 잘라낸 내용은 **버리지 않고 이미 있는 문서로 넘겼다.** 8개 항목(impact error 기본값과 탈출구 2종,
    오탐률 27%/57%, 릴리스 노트 면제, version-only 매니페스트 면제, templates/ 제외, 모드 상세,
    벤치 수치, 명령별 상세)이 `GATE_REVIEW.md`·`CHANGELOG`·`PUBLIC_API.md`·`BENCHMARK.md`·
    `docs/OPERATIONS.md`에 동등하거나 더 자세히 있음을 대조로 확인했다.
  - **안전 고지는 남겼다.** `impact`를 필수 체크에 넣기 전 읽으라는 경고와 완화 3경로
    (`governance.mode` `standard`/`lite`, `rules`의 `warning`)를 거버넌스 모드 절에 한 문단으로
    유지하고 상세는 CHANGELOG 1.28.0으로 링크했다. 벤치 수치는 README에서 뺐고, 대신 사용 판단에
    필요한 결론 하나(보강하지 않은 위키는 없느니만 못하다)만 링크와 함께 남겼다 — README 성능
    헤드라인 금지 규칙과도 맞는 방향이다.
  - `docs/llm-wiki/README.md`·`EXAMPLES.md` — `impact.source_changed`가 지목해 인용 소스
    `README.md`를 재확인하고 Review Note를 각 1건 추가(본문 불변). 상한 5건을 지키려고 각각
    최고령 1건을 `REVIEW_HISTORY.md`로 원문 그대로 이동.
  - `docs/llm-wiki/index.md` — 같은 게이트가 지목했고 본문 주장(1.29.0 실측 서술)이 축약과 무관해
    재스탬프만 했다. Review Notes 절이 없는 문서다.
  - `docs/llm-wiki/REVIEW_HISTORY.md` — 이동분 2건 수용, `Wiki README` 1→2건·`Examples` 8→9건.
- evidence:
  - `npm test` — 568/568 pass, fail 0, skipped 0
  - `validate --strict` / `impact` / `drift` / `review` / `validate-frontmatter` — 전부 pass, finding 0
  - 축약 직후 `impact`가 **error 3건**을 냈다(`EXAMPLES.md`·`index.md`·`README.md`가 루트
    `README.md`를 인용). 게이트가 의도대로 동작한 것이고, 세 문서의 주장이 실제로 깨졌는지 대조한
    뒤 해소했다.
- caveats:
  - **도그푸딩이 내 실수를 잡았다.** `EXAMPLES.md`의 아카이브 포인터를 8건 그대로 두고
    `REVIEW_HISTORY`만 9건으로 고쳤는데, `tests/review-notes-cap.test.js`의 정합성 검사가
    "pointer says 8 entries, archive section holds 9"로 실패시켰다. 사람 눈으로는 넘어갈 불일치다.
  - 영문 README가 `PUBLIC_API.md`를 상세 레퍼런스로 가리키는데 **그 문서 본문은 한국어다**(한글 30.5%).
    축약으로 이 의존이 더 커져서, 영문 README에는 `npx llm-wiki help <command>`가 영어 경로임을
    명시하고 PUBLIC_API 링크에 한국어임을 적었다. 영문 레퍼런스 부재 자체는 미해결이다.
  - 국문 README에서 `docs/OPERATIONS.md`와 `GATE_REVIEW.md`가 영문임을 링크에 표시했다.

## 2026-09-08 - docs(ko): 한국어 문서가 영어 원문의 문장 구조를 그대로 옮겨 사람이 쓴 글로 읽히지 않았다

- status: needs_review (에이전트 편집 — 이 배치는 `docs/llm-wiki/` 내용 문서를 건드리지 않아
  `review --approve-all`이 승격할 대상이 없다. 로그는 1.29.1부터 승격 대상에서 제외된다)
- actor: Claude Code (유지보수자 지시)
- scope: docs (사람이 읽는 한국어 문서 6종; 코드·CLI·계약 무변경)
- changed:
  - `README.ko.md` — 전면 재작성. 삽입구용 em dash 62 → 13(정의 목록 자리만 남김), 조사에 붙은
    굵은 글씨 제거, `harness-health`·retrieval 행과 "실제로 도움이 되나?" 절만 한다체였던 것을
    합니다체로 통일. 1.30.0 사실 보강 3건: `impact` 행에 모드별 기본 severity, `rules`/
    `rulesPreset` 우선순위에 모드 바닥값, 업그레이드 절에 `governance.mode` 경로.
    "더 알아보기"의 ROADMAP 링크를 국문판으로 교정.
  - `CHANGELOG.ko.md` — 전면 재작성(과거 릴리스 기록 포함, 유지보수자 결정). em dash 235 → 53.
    `### Added`/`Changed`/`Fixed`/`Notes`/`Breaking`/`Tests`/`Internal`/`Safety`/
    `Documentation`로 갈려 있던 하위 절 제목을 한국어로 통일. 버전 항목 51개와 모든 수치·판정·
    유보 문구는 원문 그대로.
  - `ROADMAP.ko.md` — 전면 재작성. em dash 162 → 9. 오역 1건 교정("프로젝트 *브레드스*를
    확장한다" → "다룰 수 있는 프로젝트의 폭을 넓힌다"), "하니스"/"하네스" 표기 혼용 통일,
    post-1.19 목록에서 1.25가 1.24보다 앞서 있던 순서 교정. `last_updated` 재스탬프.
  - `CONTRIBUTING.ko.md` — 재작성. "런타임 AND 개발 의존성" 같은 직역 정리. 국문 문서인데
    영문판을 가리키던 내부 링크 3건을 국문판으로 교정(CODE_OF_CONDUCT·SECURITY·ROADMAP).
  - `SECURITY.ko.md` — 재작성 + **누락 절 복원**. 영문판의 "Reporting a sensitive-info false
    positive"(68줄, 하위 절 4개)가 국문판에 통째로 빠져 있었다. `#mcp-서버-신뢰-모델` 앵커는
    README가 참조하므로 제목 문자열을 보존했다.
  - `docs/BENCHMARK_DISCLOSURE.ko.md` — 재작성. 측정값·가명 규칙·잔여 노출 서술은 원문 그대로.
- unchanged:
  - `CODE_OF_CONDUCT.ko.md` — Contributor Covenant 2.1의 표준 번역이라 손대지 않았다. 임의로
    고치면 원문과 어긋난다.
  - `docs/llm-wiki/` 하위 위키 52종 — 에이전트가 읽는 문서라 이번 범위 밖(유지보수자 결정).
- evidence:
  - `npm test` — 568/568 pass, fail 0, skipped 0 (출하 문구를 읽는 prose census 테스트 포함)
  - `validate --strict` — result pass, findings 0
  - `impact` — result pass, impacted_verified_docs 0
  - `validate-frontmatter` — result pass, findings 0
- caveats:
  - 영문 정본과의 쌍이 세 곳에서 의도적으로 갈렸다: README.ko의 1.30.0 사실 보강 3건, ROADMAP.ko의
    항목 순서 교정, CONTRIBUTING.ko의 국문 링크. 영문판에 같은 내용을 반영할지는 미결이다.
  - 문장 재작성이므로 수치·판정·유보는 하나도 바꾸지 않았으나, 문구 대조는 사람 검토가 필요하다.

## 2026-09-07 - fix(governance): 도그푸딩에서 새 명령이 자기 증거보다 넓은 부정을 단언하고, 통과 불가한 준비도 체크를 요구했다

- status: needs_review (에이전트 편집 — 배치 끝에 `review --approve-all --yes`로 승격)
- actor: Claude Code (유지보수자 지시 — `feat/governance-modes` 브랜치에서 도그푸딩 후 merge)
- scope: src + tests + wiki (1.30.0 같은 라인)
- changed:
  - `src/commands/governance-mode.js` — 의사결정 기록 탐색을 위키 밖 관례 위치까지 확장
    (`repositoryDecisionRecords`·`DECISION_PATH_RE`), 탐색 범위 문구를 `DECISION_RECORD_SCOPE`
    상수로 단일화, 커버리지 집계에서 append-only 로그 제외
  - `src/commands.js` — `backfill.unknown_history` 메시지가 자기 탐색 범위를 밝히도록 교체
  - `llm-wiki.config.json` — 이 저장소가 자기 레벨을 명시(`governance.mode: strict`)
  - `tests/governance-modes.test.js` — 회귀 3건(범위 문구·위키 밖 ADR 탐지·로그 제외)
  - `docs/llm-wiki/PUBLIC_API.md`·`DOMAIN_FEATURES.md`·`ARCHITECTURE_CONVENTIONS.md` — 계약·기능·모듈
    서술 갱신 + Review Note(각각 아카이브로 1건 회전)
  - `docs/llm-wiki/GLOSSARY.md`·`domains/00_overview.md`·`HARNESS_GOVERNANCE_ROADMAP.md` — 같은
    리뷰 이벤트이므로 기존 1.30.0 노트를 **연장**(새 항목 추가 아님)
  - `docs/llm-wiki/index.md`·`REVIEW_HISTORY.md`
  - `log`(이 항목)
- summary:
  - **발견 경로가 이 배치의 요점이다.** 코드 리뷰가 아니라 **이 저장소에 `backfill`을 실행해서**
    나왔다. 기능이 통과한 테스트 43건 중 어느 것도 이 두 결함을 보지 못했다 — 픽스처는 전부 갓
    init된 임시 저장소였고, 두 결함은 **성숙한 저장소에서만** 드러나는 종류다.
  - ① **증거보다 넓은 부정.** `backfill`이 `docs/llm-wiki/` 안만 뒤지고 "why the current design was
    chosen is **not recoverable from this repository**"라고 단언했다. 이 저장소 루트에는 자기
    `project-profile.md`가 "릴리스 게이트/의사결정 기록"으로 지목하는 **196 KB `GATE_REVIEW.md`**가
    있다. 이것은 이 기능이 방어하려고 만들어진 실패 유형 그 자체다 — 검증한 범위보다 넓은 주장.
    고친 방향 둘: git이 추적하는 관례 위치(`docs/adr/`·`docs/decisions/`·`adr/`·`decisions/`·
    `DECISIONS.md`·`ADR-*.md`)까지 찾고, **못 찾았을 때 자기가 뒤진 범위를 문장 안에 적는다.**
    `GATE_REVIEW.md`용 패턴을 넣지 **않은** 것은 의도다 — 시험한 단 하나의 저장소 파일명에 맞추는
    것은 overfitting이고, 그래서 대신 "다른 데 있으면 인수인계에서 그 파일을 지목하라"고 말한다.
  - ② **통과 불가한 준비도 체크.** `review_backlog`가 append-only 로그를 `needs_review` 백로그로
    셌다. 로그는 관례상 영구 `needs_review`이고 `review`가 의도적으로 스탬프하지 않으므로(N-14),
    **로그를 쓰는 모든 저장소에서 `backfill --strict`가 영원히 실패**했을 것이다. 이 제품이 이미 두
    번 고친 "해소 경로가 없는 finding" 계열의 세 번째이고, 하마터면 세 번째를 출하할 뻔했다.
    실측: 이 저장소 준비도 7/9 → **8/9**(남은 1건은 `decision_history`이고 그것은 **사실**이다).
  - **도그푸딩의 세 번째 결과**는 결함이 아니라 결정이다: 이 저장소가 `llm-wiki.config.json`에
    `governance.mode: strict`를 명시하게 했다. 블록이 없어도 `strict`로 해소되지만, CI를 게이트하는
    레벨을 기본값에 맡기는 것은 `doctor`의 `source:` 필드가 드러내라고 존재하는 애매함이다.
    이제 `doctor`가 `source: config`로 보고한다.
- evidence:
  - `src/commands/governance-mode.js#symbol:DECISION_RECORD_SCOPE` ·
    `src/commands/governance-mode.js#symbol:collectWikiCoverage` · `src/commands.js#symbol:backfillCommand`
  - 실행 확인: `backfill` 준비도 7/9 → 8/9, `review_backlog` incomplete → ok,
    `decision_history` 문구가 탐색 범위를 명시. `mode`·`doctor`가 `source: config` 보고.
  - 테스트 565 → **568**(신규 3), `skipped 0`. `validate --strict` 0 · `audit` 0 · `impact` 0 ·
    `drift` 0 · `validate-frontmatter` 0 · `lint` OK.
- caveats:
  - **관례 밖 이름은 여전히 못 잡는다.** 이 저장소의 `GATE_REVIEW.md`가 그 예이고, 그래서
    `decision_history` 체크는 이 저장소에서 계속 incomplete다. 그것을 통과시키려면 파일명 패턴을
    늘리는 대신 사람이 인수인계에서 그 파일을 지목해야 한다 — 체크의 문구가 그렇게 말한다.
  - 앞 항목에 적은 하네스 공백(**모드 변경 후 낡은 스킬을 제품이 finding으로 잡지 못한다**)은
    이 배치에서도 **미해결**이다.
  - 테스트 픽스처가 전부 신규 저장소라 이런 결함을 못 봤다는 사실 자체가 남은 위험이다. 성숙한
    저장소를 흉내내는 픽스처(문서 50건·verified 49건·긴 이력)는 이 배치에서 만들지 않았다.

## 2026-09-07 - feat(governance): 거버넌스가 자기가 보호하는 작업보다 비쌀 수 있었고, 그것을 고를 수 있는 레벨이 없었다

- status: needs_review (에이전트 편집 — 작업 끝에 `review --approve-all --yes`로 승격)
- actor: Claude Code (유지보수자 요청 — lite/standard/strict 거버넌스 모드 구현)
- scope: src + tests + docs + wiki (1.30.0)
- changed:
  - `src/governance.js` (신규) — 중앙 정책 레이어(leaf, I/O 없음)
  - `src/commands/governance-mode.js` (신규) — `mode` 명령 + `backfill`의 분석 절반
  - `src/config-file.js` — `governance.mode` 파싱·검증, mode floor를 `rulesPreset` 아래에 병합
  - `src/cli.js` — `mode`/`backfill` 명령 등록, `--mode` 옵션, `mode set <레벨>` 위치 인자, help 3곳
  - `src/commands.js` — `backfillCommand`, 모드별 계획 문서 집합, 비싼 스캔 2종의 비용 게이트,
    `doctor`의 `governance_mode` 줄, `handoff`의 `governanceMode`, config scaffold에 모드 씨앗
  - `src/task-prompts.js` — `governanceBudget()` 블록 + `backfill` 태스크 프롬프트
  - `src/commands/skills.js` — `llm-wiki-backfill` 스킬 추가, 생성 시점 모드 전달
  - `src/commands/findings.js` — `backfill.unknown_history`·`backfill.not_ready`·`structure.config_invalid`
  - `src/mcp/tools.js`·`src/mcp/dispatch.js` — 읽기 전용 `mode` 툴(17 → 18종)
  - `src/index.js` — `commands.mode`·`commands.backfill` + 정책 레이어 export
  - `tests/governance-modes.test.js` (신규, 43건) + 기존 테스트 3파일의 의도적 갱신
  - `README.md`·`README.ko.md`·`CHANGELOG.md`·`CHANGELOG.ko.md`·`ROADMAP.md`·`ROADMAP.ko.md`
  - `docs/llm-wiki/PUBLIC_API.md`·`DOMAIN_FEATURES.md`·`ARCHITECTURE_CONVENTIONS.md`·`index.md`
  - `package.json`(1.29.5 → 1.30.0)·`.github/actions/validate/action.yml`
  - `log`(이 항목)
- summary:
  - **문제는 관측된 것이다.** 이 패키지가 강제하는 거버넌스가 그것이 보호하는 작업보다 비쌀 수
    있다. 세 줄 수정이 `impact.source_changed`(결정 21부터 기본 error)를 발화시키고, 에이전트를
    doc-sync 패스로 끌고 가고, `verified` 문서마다 `git log`를 부르는 드리프트 스캔을 다시 연다.
    이전의 모든 레버는 거버넌스를 *돌리는* 비용을 낮췄고(1.27.1·1.29.0·1.29.1·1.29.2), 아무것도
    "지금 이 작업을 아예 해야 하는가"에는 답하지 못했다.
  - **모드는 엔진이 이미 갖고 있던 어휘로 표현했다.** 레벨은 rule-id → severity floor를 기여하고
    `rulesPreset`·명시 `rules` 아래에 키 단위로 깔린다. 새 게이트 기계를 만들지 않았기 때문에
    `src/governance.js`가 프레임워크가 아니라 leaf 모듈이다.
  - **`strict`의 floor는 비어 있고 그것이 마이그레이션 보증이다.** `governance` 블록이 없는
    프로젝트는 `strict`로 해소되고 1.29.5와 바이트 단위로 같게 동작한다(테스트로 고정: 같은 저장소에
    대해 `governance.mode: "strict"`를 명시한 config와 블록이 없는 config의 `validate` 출력이
    동일해야 한다). 새 프로젝트 기본값 `lite`는 의도적으로 별개의 질문이며 `init`이 근거로
    해소한다 — 명시 `--mode` > 기록된 모드 > *이 저장소에 이미 config나 위키가 있는가*.
  - **비용 게이트는 동작 변경이 아니다.** `evidence.stale`이 꺼져 있으면 `applyRuleConfig`가
    어차피 그 finding을 전부 버리므로, 스캔을 건너뛰는 것은 동일 출력에 대한 절감이다. 유효 rule
    map을 읽으므로 모드를 도입하지 않고 규칙을 손으로 끈 프로젝트도 같은 절감을 얻는다.
  - **`backfill`은 이력을 발명하지 않는다.** CLI는 산문을 전혀 조립하지 않고 측정만 하며, 모든
    사실에 *verified*/*inferred*/*unknown* 라벨을 단다. `unknown` 목록은 산출물이다.
- evidence:
  - `src/governance.js` · `src/commands/governance-mode.js` · `src/config-file.js` ·
    `src/task-prompts.js#symbol:governanceBudget` · `src/commands.js#symbol:backfillCommand`
  - 실행 확인(임시 저장소, 실제 CLI): `init --write`(새 프로젝트 → lite, 코어 10문서, config에
    `governance.mode: lite` 씨앗) → `mode`(레벨·출처·rule floor·capability matrix) →
    `mode set strict --write`(전환 16줄, 스캔 0, 문서 0) → `backfill`(준비도 5/9, unknown 3건,
    누락 5문서) → `backfill --write`(준비도 6/9, 누락 0) → `doctor`(`governance_mode: strict
    (source: config, ...)`) → `mode set turbo --write`(exit 3)
  - 테스트 522 → 565(`node --test`, `skipped 0`), `lint-syntax: OK (77 files)`
- caveats:
  - **`governanceBudget` 블록의 비용은 측정했고 절감은 측정하지 않았다.** ~1130 토큰짜리 쓰기
    프롬프트에 추정 173–234 토큰(chars/4 프록시)을 더한다 — 15–21% 증가다. 그것이 doc-sync 패스를
    없애서 값을 하는지는 미측정이며, 이 저장소는 미측정 절감을 주장하지 않는다(1.27.1의
    `contextBudget`과 같은 자세).
  - **기존 init 테스트 21건이 실패했고, 그것은 기능이 아니라 기본값이 바뀐 결과다.** 그 테스트들은
    감지 → 프로필/도메인 문서 매핑을 고정하는데, 새 픽스처는 config도 위키도 없어서 정의상 "새
    프로젝트"이므로 이제 `lite`로 해소된다. 문서 계획 엔진을 시험하는 호출에 `mode: "strict"`를
    명시하는 방식으로 갱신했다(우회가 아니라 "어느 레벨을 시험하는지 말하라"는 요구다). 새
    `lite` 기본값 자체는 신규 테스트가 별도로 고정한다.
  - **생성된 스킬은 작성 시점 모드의 워크플로를 담는다.** 모드를 바꾼 뒤
    `init --write --skills --refresh`를 돌리지 않으면 에이전트는 옛 워크플로를 읽는다. 블록이 자기
    안에 그 사실과 갱신 명령을 적어 두지만, 제품이 이 불일치를 **finding으로 잡지는 않는다** —
    남은 결함으로 기록한다.
  - `mcp.test.js`의 stdio 왕복 테스트가 전체 스위트 부하에서 25초 타임아웃으로 간헐 실패한다.
    단독 실행에서는 이 브랜치와 손대지 않은 기준선 양쪽 모두 통과하므로 이 변경과 무관한 기존
    flake로 판단했다.
  - 이 저장소 자신은 `governance` 블록을 두지 않으므로 계속 `strict`다(자기 게이트를 낮추지 않았다).

## 2026-09-03 - chore(docs): sanitized public mirror의 새 root commit을 기준으로 evidence 재검증

- status: verified → needs_review → verified (에이전트 승격)
- actor: Claude Code (유지보수자 지시 — 공개 미러 정리)
- scope: wiki (프론트매터 스탬프만)
- changed:
  - `docs/llm-wiki/project-profile.md` · `RELEASE_FLOW.md` · `VERSIONING.md` · `VISIBILITY.md` ·
    `profiles/library.md` — `reviewed_at`·`last_updated` 재스탬프(`VISIBILITY.md`는 `reviewed_by`도)
  - `log`(이 항목)
- summary:
  - 이 저장소는 익명화된 트리를 **단일 root commit**으로 새로 만든 sanitized public mirror다.
    그 결과 모든 파일의 git 최종 변경 날짜가 root commit 날짜가 되었고, `reviewed_at`이 그보다
    이른 `verified` 문서 5종에 대해 날짜 앵커 신선도 규칙(`evidence.stale`)이 **정상적으로**
    발화했다(경고 14건, `drift` 5건).
  - **파일 내용은 원본 익명화 커밋과 바이트 동일하다** — 같은 내용으로 원본 저장소에서는 이 게이트가
    0건이다. 즉 이것은 문서가 낡았다는 신호가 아니라 **이력을 압축한 구조의 부작용**이다.
  - 제품이 제공하는 공식 경로로만 해소했다: `drift --downgrade`로 5종을 `needs_review`로 내리고
    `review --approve-all --yes`로 재스탬프했다. `review --approve`는 설계상 스탬프만 쓰고
    본문·`source_files`·`evidence`를 건드리지 않는다.
  - `reviewed_by`는 `llm-wiki.config.json`의 `reviewer`에서 오며 **에이전트를 이름으로 지목한다** —
    스탬프가 사람 검토를 주장하지 않는다. 이 저장소의 자기승격 정책(`AGENTS.md` "Wiki discipline")
    그대로이며, 사람이 검토했다고 기록하지 않았다.
  - **측정값·실험 정의·redaction metadata는 건드리지 않았다.** 벤치 원시 JSON, 태스크 정의,
    제품 소스(`src/`·`bin/`), 테스트, `package.json`, workflow는 이번 변경에 포함되지 않는다.
    역사적 벤치 실행 날짜(2026-07-22/24/27)도 그대로다.
- evidence:
  - src/commands/scans.js
  - llm-wiki.config.json
- caveats:
  - ⚠️ **`VISIBILITY.md`의 `reviewed_by`가 사람 이름(2026-07-21 실제 사람 검토)에서 에이전트로
    바뀌었다.** 승격 스탬프가 이전 값을 덮기 때문이며, 그 결과 이 위키에서 실제 사람 검토 기록을
    가진 비아카이브 문서가 하나 줄었다. 사람 검토 이력을 보존하려면 그 문서는 재스탬프 대상에서
    빼야 하지만, 그러면 squash 미러에서는 `evidence.stale`이 계속 남는다 — **두 가지를 동시에
    만족시킬 수 없다.** 어느 쪽을 택할지는 유지보수자 결정 사항으로 남긴다.
  - 이 재검증은 소스 대조를 전제하지 않는다(이 저장소 정책 그대로). 따라서 이 미러에서도
    `drift`·`impact`는 관측 도구가 아니다.

- status: verified → needs_review → verified (에이전트 승격)
- actor: Claude Code (유지보수자 지시 — 공개 저장소 익명화 검토)
- scope: bench, docs, wiki, src(주석), tests(픽스처)
- changed:
  - 대상의 프로젝트명이 파일명에 들어 있던 태스크 파일과 보고서 6종을 가명으로 rename(git mv, 이력 보존) → **`bench/tasks-external-vue-app.json`**, `bench/results/real-driver-external-vue-app-*`. 저장소 안의 모든 참조·frontmatter `source_files`/`evidence`를 함께 갱신
  - `bench/results/real-B*.json` 5종 — `tasks[].runs[].answer` 프로즈 66건 보류(`answerRedacted: true` + `answerOriginalChars`), 최상위 `redaction` 메타 추가. **측정 필드는 무수정**
  - `bench/results/*.md` 6종·`bench/tasks-external-vue-app.json`·`bench/real/DRIVER_RUNBOOK.md`·`bench/real/runner.js`·`bench/README.md` — 식별자 가명화, 채점 워크시트의 답변 전문 인용 4건을 공개용 요약으로 축약
  - `docs/BENCHMARK_DISCLOSURE.md` + `.ko.md` — **신규**. 무엇을 측정했고 무엇을 지웠는지, 그리고 원본 corpus 없이는 재실행이 불가능하다는 사실
  - `README.md`·`README.ko.md` — 벤치 문단에 익명화 고지 링크(패키지에 포함되는 문서)
  - `docs/llm-wiki/BENCHMARK.md`·`DOMAIN_FEATURES.md`·`HARNESS_GOVERNANCE_ROADMAP.md`·`REVIEW_HISTORY.md`·`GATE_REVIEW.md`·`ROADMAP*.md`·`CHANGELOG*.md`·`outputs/distribution/CLAIMS.md`
  - `src/commands.js`·`src/commands/domains.js` — 도메인 탐지 **예시 주석**의 업무 도메인 단어 교체(동작 무변경), `tests/verification.test.js` — 같은 픽스처 이름 교체
  - `log`(이 항목)
- summary:
  - 공개 저장소가 담고 있던 것은 프로젝트·저장소·브랜치명뿐이 아니었다. **실제 dev 백엔드의 IP:포트와 사내 호스트명**, 로그인 2단계 흐름과 상태 코드 조합, 세션 스토리지 키와 그 암호화 취급, 유휴 타이머 임계값, 업무 필드명, 그리고 **비공개 앱의 소스 코드 스니펫**까지 있었다. 지시받은 패턴 목록에 없던 인프라 노출이 가장 민감했다.
  - **원시 결과의 답변 프로즈는 가명 치환만으로 안전해지지 않는다.** 66건이 함수 단위 흐름에 라인 번호까지 붙은 정독 결과였다. 그래서 프로즈는 보류하고 측정값(`inputTokens`·`outputTokens`·`wallMs`·`toolCalls`·`model`·`arm`·`repeats`·날짜)은 한 자도 건드리지 않았다. 대응표는 저장소에 두지 않았다.
  - **점수·표본 수·결론·기록된 한계는 보존했다.** retrieval이 진 태스크, 낡은 위키가 낸 보안 오답, 3.17배 손실, "agent-graded" 표기 규율까지 그대로다. 익명화는 성과를 다시 쓰는 작업이 아니다.
  - **블랭킷 치환이 제품을 깨뜨렸다 — 게이트가 아니라 테스트가 잡았다.** `ApiService` 규칙이 제품 심볼 `domainApiServicesSection`에, 바레 `routes.ts` 규칙이 제품 자신의 앵커 예시 `src/routes.ts#route:/users`에 걸렸고, 업무 도메인 라우트 규칙이 같은 이름의 픽스처 **디렉터리** 경로에도 걸려 `src/pages<item-route>`라는 존재할 수 없는 경로를 만들어 테스트 4건이 실패했다. 세 규칙을 경계 인식 정규식으로 바꾸고 픽스처를 복구해 522/522로 되돌렸다. 규약: **식별자 치환은 대상 문자열이 제품 소스의 부분 문자열인지 먼저 확인한다.**
  - **치환은 뜻도 깨뜨린다.** 축약형을 전칭으로 풀어 쓴 사실을 서술한 문장이 양변 동일("`X` → `X`")이 되고, 서로 다른 두 경로가 같은 가명으로 합쳐져 "A라 했으나 실제는 B" 문장이 무의미해졌다. 기계 치환 후 **문장 단위 손검수**가 필요하다는 뜻이고, 3곳을 손으로 고쳤다.
  - 버전 접두어가 붙은 전체 경로만 규칙에 있어서, 문서 한 곳이 **접두어 없이 인용한 엔드포인트 조각 1건**이 규칙을 그대로 빠져나갔다. 전수 검색을 지시받은 패턴 목록이 아니라 **경로 형태**(`/auth/…`·`/api/…`)로 다시 돌려서 찾았다 — 목록 기반 검색만으로는 닫히지 않는다.
  - 공개 재현용 합성 fixture는 **만들지 않았다.** `bench/tasks.json`(대상 = 이 저장소 자신) + `make-stub-wiki.mjs`가 이미 완전 공개 fixture이고 `runner.js --dry`가 이를 검증한다. 두 번째를 발명하면 근거는 안 늘고 패키지 범위만 넓어진다.
- evidence:
  - bench/tasks-external-vue-app.json
  - bench/real/runner.js
  - docs/BENCHMARK_DISCLOSURE.md
- caveats:
  - **이력 재작성은 하지 않았다.** 과거 커밋에는 원본 식별자가 그대로 남아 있다. 현재 트리 정리만으로 닫히지 않는 위험이며 유지보수자 결정 사항이다.
  - 비공개 저장소의 **커밋 해시**는 거버넌스 측정 표에 남겼다. 그 측정의 재현 근거이고 해당 저장소 접근 없이는 무의미하다.
  - 익명화된 대상의 **아키텍처 형상 서술**(예: 단일 대형 파사드)은 남겼다 — 앵커 축소 규칙이 그 저장소에서 무효로 측정된 이유 자체이기 때문이다.
  - **이미 npm에 배포된 버전**은 이 변경의 영향을 받지 않는다.
  - 미추적 상태인 2026-08-19 delegation-bench 산출물 5건에도 같은 식별자가 있으나, 유지보수자의 대기 중 작업이고 공개 경로에 없어 **건드리지 않았다**. 추적하려면 먼저 익명화가 필요하다.

