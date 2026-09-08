---
title: LLM-WIKI Governance Roadmap
tags:
  - llm-wiki
  - roadmap
  - package
  - cli
status: needs_review
doc_type: roadmap
project: llm-wiki-governance
last_updated: 2026-09-08
author: ai-generated
last_edited_by: Claude Code
wiki_block_version: v1
source_files:
  - package.json
  - src/cli.js
  - src/commands.js
  - src/frontmatter-schema.js
  - src/detector.js
  - src/git.js
  - src/config-file.js
  - .github/actions/validate/action.yml
  - .github/workflows/ci.yml
  - CHANGELOG.md
related:
  - GATE_REVIEW.md
  - VERIFICATION.md
  - RELEASE_CHECKLIST.md
  - docs/llm-wiki/VERSIONING.md
visibility: internal
contains_sensitive_info: false
---

> Language: [English](./ROADMAP.md) | [한국어](./ROADMAP.ko.md)

# LLM-WIKI Governance Roadmap

이 로드맵은 앞으로 할 일을 적는 문서다. 이미 구현한 것은 `CHANGELOG.ko.md`와 `docs/llm-wiki/log.md`, 그리고 `docs/llm-wiki/releases/` 아래 릴리스별 노트에 있다. 여기서는 안정 `1.0.0` 라인 이후의 `1.x` 마이너 릴리스를 한 번에 하나씩 순서대로 계획한다.

## 제품 원칙

```text
CLI는 구조와 안전 가드레일을 만든다.
Codex나 Claude Code가 소스 근거로 문서를 보강한다.
사람이 검토하고 verified 상태를 승인한다.
CI가 품질을 지속적으로 점검한다.
```

## 1.7.0까지 나간 것

`1.7.0`은 CI/CD 도입 라인이다. 쪼개 놓은 "팀 및 조직 확장" 계획에서 가장 먼저 떼어 낸 슬라이스이기도 하다. 읽기 전용 `validate`를 `npx`로 감싼 컴포지트 GitHub Action을 넣었고(`.github/actions/validate/action.yml`, 다른 액션을 끌어오지 않아 의존성이 없으며 정확한 `vX.Y.Z` 태그나 SHA로 참조한다), `v*` 태그를 push하면 `publish.yml`의 격리된 `contents: write` 잡이 러너의 `gh` CLI로 GitHub Release를 만든다. 릴리스 본문은 새로 붙인 부가 모드 `release-notes --body-only`에서 나오고 민감정보 스캔을 거쳐 걸리면 차단된다. 읽기 전용 리포트 명령 10개의 `help`에는 명령별 `--format json` 예시를 붙였다. 전부 하위호환이고 부가 명령 모드와 CI 산출물만 늘었다. Marketplace 게시와 떠 있는 `@v1` 태그는 후속 게이트로 미뤘다. `v*` 태그 네임스페이스를 먼저 정리해야 하기 때문이다. 범위는 `GATE_REVIEW.md`의 Gate 12에 있다.

`1.6.0`은 에이전트 네이티브 라인이다. `llm-wiki mcp`가 stdio 위에서 Model Context Protocol 서버를 띄워서, Claude Code나 Cursor 같은 MCP 클라이언트가 shell을 거치지 않고 위키를 툴로 질의하고 점검할 수 있게 했다. 읽기 전용 명령(`validate`, `audit`, `next`, `status`, `doctor`, `stats`, `graph`, `explain`, `handoff`, `prompt`)만 MCP 툴로 내보냈고 쓰기 명령은 내보내지 않았으며, 어떤 툴도 파일을 쓰지 않는다. 서드파티 SDK 없이 Node 내장 모듈만으로 JSON-RPC 2.0을 직접 구현해 무의존성 불변식을 지켰고, 결과는 1.5의 result 형태(`schemaVersion`)를 그대로 쓴다. 하위호환이고 새 명령과 모듈만 늘었다. 범위는 `GATE_REVIEW.md`의 Gate 11이다.

`1.5.0`은 프로그래매틱 API 라인이다. `package.json`의 `exports`(`src/index.js`)로 패키지를 in-process import할 수 있게 했고, 명령 함수 위에 동결된 `commands` 맵과 `normalizeOptions`, `parseArgs`/`run`, `SCHEMA_VERSION`을 공개했으며 반환 형태를 JSDoc typedef와 `PUBLIC_API.md`로 문서화했다. `--format json` 출력에는 맨 위에 `schemaVersion` 필드가 부가적으로 붙어서 CI 래퍼와 에디터가 출력 계약을 고정할 수 있다. 하위호환이고 새 import 표면과 JSON 필드 하나만 늘었다.

`1.4.0`은 "지식을 눈에 보이게" 라인이다. `llm-wiki graph`가 지식 그래프를 text·JSON·Mermaid·DOT로 내고, `llm-wiki stats`가 헬스 스코어를 내며, `--format html` 대시보드에 탐색용 Document Index와 사람 독자를 위한 공개 가이드를 넣었다. 여기에 라우트와 리소스 모듈 파일까지(FastAPI·Flask·Express·Rails·Go의 endpoints·routers 등) 디렉터리 도메인과 함께 `init`이 감지하는 파일 기반 도메인 감지를 더했다(GATE_REVIEW Gate 10).

`1.3.0`은 디텍터와 어댑터를 넓힌 라인이다. backend와 fullstack `init`이 업무 도메인 디렉터리를 감지해 overview에서 링크되는 도메인별 문서(`domains/NN_<name>.md`, `doc_type: domain`)를 만든다. PHP·Ruby·.NET 생태계 감지를 붙였고, Windsurf와 Gemini CLI를 writable 어댑터로 넣었으며(JetBrains AI는 info 수준 후보로만 뒀다), OKF `type`을 `doc_type`의 부가 alias로 받아들이게 했다.

`1.2.0`은 안전한 업그레이드와 마이그레이션 라인이다. `migrate`와 `doctor`가 `wiki_block_version`을 인식해 업그레이드 리포트를 내고, `fix` 엔진과 블록 버전 스탬프를 재사용하는 승인된 범위(미리보기 우선, `verified` 보존, GATE_REVIEW Gate 8) 안에서 `migrate --apply`를 열었다. 드리프트된 `verified` 문서를 `--downgrade`로 `needs_review`까지 내리는 `llm-wiki drift` 명령을 새로 넣었고(GATE_REVIEW Gate 9), `evidence.stale`을 라인 단위 정밀도로 올렸으며, `VERSIONING`과 `project-profile` 문서를 버전에 매이지 않는 서술로 바꿨다.

`1.1.0`은 inner loop를 정리한 라인이다. `evidence.stale`의 같은날 드리프트 경계를 고치고, 변경된 문서로 findings를 좁히는 `validate --changed`를 넣고, `pre-commit` 훅 템플릿과 packed tarball을 대상으로 한 CI Quick Start 점검을 붙였다. 앞서 `1.0.1`로 준비해 두었던 문서 작업, 그러니까 날짜 없는 로드맵 재작성과 `README`·`CHANGELOG`·`ROADMAP`의 영문·국문 쌍도 여기서 함께 흡수했다.

`1.0.0`은 CLI 명령과 옵션 표면, `--format json` 출력 형태, 필수 frontmatter 계약을 안정으로 선언한 릴리스다. 이때 이미 갖춰져 있던 것은 다음과 같다. 전체 명령 표면(`doctor`, `status`, `next`, `explain`, `validate`, `validate-frontmatter`, `audit`, `init`, `quickstart`, `migrate`(당시 dry-run 전용), `fix`, `handoff`, `prompt`, `release-notes`), 보수적인 쓰기 안전장치, 다중 생태계 감지(Node·Python·Go·Rust·JVM), 어댑터 4종(codex·claude·cursor·copilot)과 Antigravity 후보, `okf-v0.1` 프로필, frontmatter·링크·소스·근거·드리프트 검증, `--format html` 대시보드, 크로스플랫폼 릴리스 CI다. 자세한 것은 `CHANGELOG.ko.md`를 보면 된다. 이 로드맵은 이미 끝난 작업을 다시 나열하지 않는다.

## 이 로드맵을 운용하는 방식

- **모든 `1.x` 릴리스는 부가적이고 하위호환된다.** 새 명령과 옵션, 어댑터, 디텍터, 그리고 직접 켜야 동작하는 기능만 더한다. 여기 적힌 어떤 것도 `1.0.0` 계약을 깨지 않는다.
- **한 번에 하나씩, 순서대로 간다.** 순서는 레버리지와 리스크, 의존 관계를 보고 정하며, 각 릴리스는 일정이 아니라 필요가 생겼을 때 진행한다.
- **날짜는 붙이지 않는다.** 이 릴리스들에 목표 날짜를 두지 않는다. 일정보다 품질이 먼저다. 절반만 검증한 채 내보내느니 릴리스를 미룬다.
- **계약을 깨는 변경은 `1.x` 범위 밖이다.** 아래 "1.x 지평 너머"에 따로 모아 둔다.

## 릴리스 계획 (1.8–1.11): 팀과 조직으로 확장, 그리고 분할

목표는 저장소 하나, 유지보수자 한 명을 넘어선 도입을 지원하는 것이다.

이 라인은 원래 `1.7 — 팀 및 조직 확장` 하나였고, 게이트 하나짜리 크기의 서로 얽힌 기능 다섯을 묶고 있었다. 모노레포 프로필, 크로스레포 링크, config 스키마 확장, 가시성 거버넌스, GitHub Action과 Release가 그것이다. 이 묶음은 표면이 가장 넓고 의존 관계가 가장 많으며, 스스로 적어 놓은 대로 설계에 앞서 실제 다중 팀 피드백이 가장 필요한 부분이다. 다섯을 한 릴리스로 내보내는 것은 이 로드맵 자신의 두 규칙과 충돌한다. 한 번에 하나씩 순서대로 간다는 규칙, 그리고 절반만 검증한 채 내보내느니 미룬다는 규칙이다(하나가 늦으면 나머지 넷이 함께 막힌다). 그래서 리스크가 낮고 레버리지가 높은 것부터 순서대로 마이너 릴리스로 쪼갰다. 각 마이너는 필요가 생겼을 때 진행하고, 범위는 코드보다 먼저 새 `GATE_REVIEW.md` 게이트로 못박는다. 1.7은 Gate 12가 담당했고 다음은 1.8을 위한 Gate 13이다. 지금까지 모든 범위 결정을 규율해 온 방식 그대로다.

### 준비 작업 (부가적이며, 헤드라인 릴리스가 아니다)

뒤따르는 마이너들을 열어 주고, 큰 기능들이 필요로 하는 실사용 피드백이 흐르기 시작하게 만드는 작은 하위호환 패치들이다. 어느 것도 `1.0.0` 계약을 바꾸지 않는다.

**현재 상태.** 앞의 둘, 그러니까 config 로딩 통일과 스타터 config 스캐폴드 및 `doctor` echo는 `1.7.2`로 나갔다(Gate 13 준비 작업). 아래 설계 문서 항목은 아직 남아 있다.

- **config 로딩을 명령 계층 아래로 통일한다.** 지금 `loadProjectConfig`와 `mergeConfigIntoOptions`(`src/config-file.js`)는 CLI 경로(`src/cli.js#main`)에서만 돈다. 1.5 프로그래매틱 API와 1.6 MCP 표면은 `llm-wiki.config.json`을 병합하지 않는다(Gate 11에 정직한 한계로 적어 두었다). 병합을 공통 진입부로 내려서 세 표면이 같은 유효 옵션을 쓰게 해야 한다. 그러지 않으면 config 확장이 새 안정 계약에 불일치를 박아 넣게 된다.
- **스타터 `llm-wiki.config.json`을 만들어 준다.** `init`과 `quickstart`가 최소 config를 쓴다. 부가적이고 미리보기가 먼저이며 `--write`에서만 쓰고 기존 파일은 절대 덮지 않는다. `doctor`는 병합된 유효 config를 그대로 보여 준다. 로드맵은 config 확장을 "최소 config가 실제로 쓰이는 것"에 걸어 두었는데, 정작 어떤 명령도 config를 만들어 주지 않으면 사용이 쌓일 수가 없다. 이 작업이 게이트의 전제 조건을 관측 가능하게 만든다.
- **뒤따르는 마이너들이 기대는 설계 입력을 코드보다 먼저 쓴다.** 빠져 있는 가시성 거버넌스 정책 문서(`project-profile`의 Open Question), `tests/fixtures/` 아래 모노레포 픽스처, 크로스레포 참조 포맷 스펙이며, 각각을 승인된 `GATE_REVIEW` 게이트로 기록한다.

### 1.8: config 스키마 확장

**나갔다. Gate 13이 완성됐다.** config 관련 세 기능이 모두 들어갔다. `1.8.0`에 프로젝트별 rule 토글(`rules` 맵)과 직접 켜는 `content.thin_body` lint가, `1.8.1`에 커스텀 문서셋(`requiredDocs`)과 템플릿 오버라이드(`templates`, 절대 `verified`가 될 수 없다는 가드레일 포함)가 들어갔다. severity를 한곳으로 모으는 선행 작업도 끝냈고, 감사로 동작이 보존됐음을 확인해 불일치 0을 얻었다. 다음 예정 마이너는 가시성 거버넌스(`1.9`)다.

미리 잡아 둔 `llm-wiki.config.json`의 seam을(모르는 키는 이미 설계상 무시한다) 커스텀 문서 세트, 프로젝트별 규칙 토글, 템플릿 오버라이드로 넓힌다. 이것이 하드 의존성 게이트다. 모노레포(패키지별 config)와 가시성 거버넌스(규칙 토글)가 모두 이걸 소비하기 때문이다. 선행 작업이 둘 있다. 규칙 토글이 앞뒤가 맞으려면 스캔마다 인라인으로 박혀 있는 severity를 레지스트리 하나로 모아야 하고, 템플릿 오버라이드가 `status: verified`를 설정하는 일은 절대 없도록 하드 가드레일을 둬야 한다. 토글 기계를 스스로 써 보기 위해 더 촘촘한 보강 린팅(`content.thin_body`, warning 수준)을 토글 가능한 규칙으로 함께 넣는다. 스캐폴드된 config가 설계 근거가 될 실사용을 만들어 낸 다음에 당긴다.

### 1.9: 가시성 거버넌스

**`1.9.0`으로 나갔다.** 민감정보 스캔을 재사용하는 직접 켜는 일관성 lint 두 개(`visibility.public_sensitive`, `visibility.declared_mismatch`)와 정책 문서 `docs/llm-wiki/VISIBILITY.md`가 들어갔다(GATE_REVIEW Gate 14). 기본은 꺼짐이고 warning이며 읽기 전용이고, 민감값은 드러내지 않는다. 다음 예정 마이너는 `1.10`이다.

이미 필수인 `internal|restricted|public` 필드를 config 규칙 토글로 선택 강제한다. 기본은 꺼짐, warning 수준, 읽기 전용이며, public 선언과 실제 내용이 맞는지 보는 검사에 민감정보 스캔을 재사용한다. 규모는 작지만 1.8 config 설계를 실제 기능으로 처음부터 끝까지 증명하는 역할을 하므로, 더 큰 소비자인 모노레포가 여기 기대기 전에 검증된다. 정책 문서와 그 게이트가 먼저 나와야 진행할 수 있고, 기본이 error나 blocked인 규칙이 되어서는 절대 안 된다. 부가성 불변식이 깨지기 때문이다.

### 1.10: 모노레포 프로필

**`1.10.0`으로 나갔다.** `monorepo` 명령이 npm과 yarn의 `workspaces`를 감지해 패키지마다 validate를 돌리고, 부가적인 `packages[]` roll-up으로 집계한다(GATE_REVIEW Gate 15). 읽기 전용이고 단일 저장소 출력은 바이트까지 동일하며, pnpm과 YAML은 후속으로 미뤘다. 패키지 사이를 잇는 집계 그래프와 더 깊은 glob도 이후 과제다. 다음 예정 마이너는 `1.11`이다.

검증과 그래프를 집계하는 패키지별 위키를, 이미 cwd로 파라미터화돼 있는 파이프라인(`audit`, `collectWikiGraph`, `findMissingDocs`) 위에 직접 켜는 map으로 얹는다. JSON 형태는 엄격히 부가적인 `packages[]`뿐이라 단일 저장소 출력은 바이트까지 그대로다. config 토글과 실제 CI 피드백, 보강 신호를 손에 쥔 다음에 만든다. `detector.js`에 워크스페이스 감지를 부가적으로 먼저 넣고, 의존성 없이 pnpm과 YAML 워크스페이스를 파싱하는 일은 정직하게 미룬다. npm과 yarn의 `workspaces`가 먼저다.

### 1.11: 크로스레포 지식 링크

**`1.11.0`으로 나갔고, 1.7–1.11 라인이 여기서 끝났다.** 예약한 `repo:<name>/<path>` 참조 스킴과 http(s)를 위키 링크와 frontmatter 참조에서 external로 인식하게 해서, 크로스레포 참조가 missing-target 규칙에 걸리지 않게 했다(GATE_REVIEW Gate 16). 인식만 하고 fetch나 verify는 하지 않는다.

보수적이고 fetch하지 않는 참조 포맷(예약 스킴)을 두어, 다른 저장소에 있는 API 스펙이나 도메인 문서, 서비스 계약을 가리키는 크로스레포 참조가 missing-target 규칙에 걸리지 않고 해소되게 한다. 인식은 하되 절대 검증하지 않는다. 검증하려면 네트워크나 git이 필요해서 무의존성 불변식이 깨지기 때문이다. 이 항목을 마지막에 둔 이유는 설계 부담이 가장 크고 피드백이 가장 필요하며, 모노레포와 config 확장, 가시성이 먼저 갖춰져야 하기 때문이다. 다만 지금 당장 가능한 슬라이스는 먼저 낼 수 있다. external 참조 분류기를 강화해서 크로스레포 `[[..]]` 링크가 잘못된 `wiki_link.missing`을 뱉지 않게 하는 것이다.

이렇게 쪼갠 이유는 이렇다. 순서는 레버리지와 리스크, 의존 관계로 정했다. 각 마이너는 따로 내고 따로 검증할 수 있고, 가장 크고 피드백이 필요한 기능인 모노레포와 크로스레포는 더 값싼 도입 작업과 config 작업이 CLI를 실제 다중 팀 사용 앞에 세워 준 뒤에 온다.

## 릴리스 계획 (1.12–1.14): 감지 대상과 적응 범위 확장

**상태는 완료다.** `1.12`(모바일, Gate 17), `1.13`(infra/DevOps, Gate 18), `1.14`(stdlib 서버, Gate 19)가 모두 나갔다. `1.7–1.11`의 "팀 및 조직 확장" 라인도 `1.11.1`로 npm에 올라가면서 끝났다. 다음 라인은 이 도구가 다룰 수 있는 프로젝트의 폭을 넓힌다. `1.3`에서 했던 PHP·Ruby·.NET 작업의 후속 테마이며, 같은 규율을 따른다. 한 번에 한 마이너씩 순서대로 가고, 각각의 범위를 코드보다 먼저 새 `GATE_REVIEW.md` 게이트로 못박는다(Gate 17 → 18 → 19). 세 항목은 서로 크게 얽혀 있지 않아서 하드 의존성이 아니라 레버리지와 리스크로 순서를 정했다.

### 1.12: 모바일 프로필 (Gate 17)

**`1.12.0`으로 나갔다.** `mobile`이라는 프로젝트 유형을 부가적으로 새로 넣었다. Android(`build.gradle`·`build.gradle.kts`·`settings.gradle`에 있는 Android Gradle Plugin이나 AndroidX 신호, `AndroidManifest.xml`), Flutter(`flutter:` 섹션이 있는 `pubspec.yaml`), Apple/iOS(`*.xcodeproj`·`*.xcworkspace`, `Podfile`, Apple 플랫폼을 대상으로 하는 `Package.swift`), React Native(`package.json`의 `react-native` 의존성)를 감지하고 모바일 문서셋을 추가한다. **이걸 먼저 한 이유는 실제 오분류까지 함께 고치기 때문이다.** 그전까지 Android `build.gradle`은 `jvm` 더하기 `library`로 감지됐다(`src/detector.js`). 부가적이고 직접 켜는 방식이며(감지 유형과 프로필 문서가 새로 생기고 `--type`에 값이 하나 늘어난다), 감지는 매니페스트와 파일 신호에 범위를 제한한 스캔을 더한 것으로 빌드 도구를 절대 호출하지 않는다. 의존성도 없다. 범위는 `GATE_REVIEW.md`의 Gate 17이다.

### 1.13: infra/DevOps 프로필 (Gate 18)

**`1.13.0`으로 나갔다.** `infra`라는 프로젝트 유형을 부가적으로 새로 넣었다. `Dockerfile`, Docker Compose, Kubernetes 매니페스트, Helm 차트(`Chart.yaml`), Terraform(`*.tf`)을 감지하고 infra/DevOps 문서셋을 추가한다. Gate 17과 같은, 범위를 제한한 감지 패턴을 그대로 재사용하기 때문에 두 번째에 뒀다. 부가적이고 직접 켜는 방식이며 의존성이 없다. 신호 파일이 있는지 보고 내용을 제한적으로 훑을 뿐, 클러스터나 레지스트리에 접근하지도 `terraform`·`kubectl`·`helm`을 부르지도 않는다. 범위는 `GATE_REVIEW.md`의 Gate 18이다.

### 1.14: stdlib 서버 감지 (Gate 19)

**`1.14.0`으로 나갔고, 1.12–1.14 라인이 여기서 끝났다.** 1.3에서 미뤄 두었던 오래된 백로그 항목을 끌어올렸다. Go의 `net/http`와 Python stdlib HTTP 서버를 `library`가 아니라 `backend`로 분류하며, 오탐을 막기 위해 범위를 제한한 소스 스캔으로 HTTP import와 서버 시작 호출을 모두 확인한다. 셋 중 가장 작아서 마지막에 뒀다. 유일한 리스크가 과분류라서 휴리스틱은 보수적이고 한 방향으로만 간다. `library`에서 `backend`로 올리기만 하고 내리지는 않는다. 의존성은 없다. 범위는 `GATE_REVIEW.md`의 Gate 19다.

## 릴리스 계획 (1.15–1.16): 완료

- **1.15: 스킬 생성 (Gate 21).** `init`과 `quickstart`가 `feature`·`fix`·`docs-sync` 작업을 위한 위키 기반 자동화 프롬프트를 Claude 스킬과 Cursor 룰, 에이전트 중립 프롬프트로 만들어 주고 각 본문에 프로젝트 도메인 맵을 넣는다. 직접 켜야 하고, 미리보기가 먼저이며, 기존 파일을 덮지 않고, 인식만 할 뿐 실행하지는 않는다. `1.15.0`에서 나갔고 `1.15.1`에서 재시작 안내를 덧붙였다. 스킬은 세션이 시작될 때 로드되기 때문이다.
- **1.16: 개명과 거버넌스 리포지셔닝, 그리고 영어 우선 출력.** 패키지 이름을 `@dowonk-7949/llm-wiki-standard`에서 `llm-wiki-governance`(unscoped)로 바꿨고 `llm-wiki` 명령은 그대로 뒀다. 포지셔닝을 "AI가 쓴 프로젝트 문서를 위한 거버넌스(OKF 호환)"로 옮겼고, CLI 출력을 영어 우선으로 바꿨다. 붙여 넣는 handoff 프롬프트는 완전히 영어이고, help와 About, Next Step은 영어를 앞세운다. 부가적이고 표현에 관한 변경이라 `1.0.0`의 명령·`--format json`·프로그래매틱 API·frontmatter 계약과 zero-dependency는 그대로다. `1.16.1`에서는 README 제목과 `keywords` 같은 스토어프론트 표기를 손봤다. 새 게이트는 없다.

## 릴리스 계획 (post-1.16): 가치를 먼저 증명하고, 메모리 루프를 닫는다

독립적으로 진행한 제품 정체성 감사(`outputs/audits/product-identity-audit.md`, 결론은 조건부 Go)는 거버넌스 코어가 실재하고 이름도 정확하다고 봤다. 다만 궁극적인 가치 사슬, 그러니까 지속되는 프로젝트 메모리가 재탐색을 줄이고 그것이 토큰 절감과 더 빠르고 안전한 작업으로 이어진다는 사슬이 아직 검증되지 않았고, 런치 주장 두 개(프로즈의 의미적 "검증", MCP로 문서 본문을 "query")는 철회해야 한다고 지적했다. 그래서 이 라인은 먼저 측정하고, 그다음에 메모리 스토리를 진짜로 만드는 기능 둘을 만든다. 규율은 그대로 코드보다 게이트가 먼저이고, 이후 게이트마다 Gate 22 하네스로 다시 측정한다. 순서는 측정, 레버리지가 가장 큰 거버넌스 완결, 그리고 "프로젝트 메모리"를 참으로 만드는 메커니즘이다.

### Gate 22: 임팩트 측정 (앞으로 당김)

더 만들기 전에 코어 가치를 증명하거나 반증한다. 재현 가능하고 직접 켜야 하며 의존성이 없는 벤치마크 하네스가 대표 태스크를 위키가 있을 때와 없을 때로 각각 돌려서 입력 토큰과 열어 본 파일 수, 태스크 성공 여부, 소요 시간을 기록한다. 위키를 읽고 유지하는 비용까지 세는 정직한 방법론과 기준선을 남긴다. 주로 검증 트랙이라 이미 나간 계약은 바뀌지 않고 `bench` 헬퍼는 후속 마이너로 미룬다. 불리한 결과도 그대로 보고한다. **숫자가 뒷받침하기 전까지 토큰이나 속도 주장은 싣지 않는다.** 한 가지 유의할 점은, 재탐색을 줄이는 메커니즘을 완성하는 것이 retrieval(Gate 24)이라는 것이다. 그래서 헤드라인은 raw 기준선이 아니라 retrieval 전후의 차이다. 범위는 `GATE_REVIEW.md`의 Gate 22(accepted)다.

**상태는 하네스와 기준선 완료다.** `bench/` 하네스를 만들었고(의존성이 없고 저장소 안에만 있으며 npm `files` 밖이라 배포되지 않는다) 기준선을 기록했다. `bench/README.md`, `bench/METHODOLOGY.md`, `bench/results/baseline.md`에 있고 거버넌스 기록은 `docs/llm-wiki/BENCHMARK.md`다. 이 저장소를 대상으로 한 첫 측정(태스크 6개) 결과, 세션 단위로 보면 거버넌스 위키는 파일 전체를 grep하는 A1의 0.59배, 보수적인 snippet grep인 A2의 0.89배 입력 토큰을 썼다. 다만 단일 태스크 6개 중 3개에서는 보수적 하한인 A2에 진다. 탐색 성공률은 100 대 100으로 동률이었다. 즉 여기서 입증된 이점은 findability가 아니라 컨텍스트 크기이고, 오리엔테이션 읽기 비용을 여러 태스크가 있는 세션에 나눠 담을 때만 성립한다. 예상대로 소박하고 정직한 기준선이며, 헤드라인은 여전히 retrieval 전후의 차이다. 이후 게이트마다 `node bench/run.js --against`로 다시 잰다.

**Gate 24 이후 재측정 결과는 우리에게 불리했고, 그대로 적는다(2026-07-21).** 단순히 `--against`로 다시 돌렸더니 `B vs A2`가 0.89배에서 1.05배로 움직였다. 보수적 snippet grep 하한 대비 토큰 이점이 뒤집힌 것이다. 다만 이건 retrieval 메커니즘 때문이 아니라 코퍼스 드리프트 때문이다. 전략 B는 대상 소스를 통독할 뿐이고, 하네스가 Gate 24의 `get_doc`이나 `search_docs`를 부르지 않는다.

**retrieval 델타는 따로 측정해서 얻었다(2026-07-21).** Gate 24를 직접 모델링하는 다섯 번째 arm `B2_retrieval`을 추가했다. 실제로 배포된 `search-docs`를 같은 스코어링으로 돌리고, 소스를 다시 읽는 대신 상위로 매칭된 위키 문서의 본문을 `get-doc`으로 읽는다. B2와 B는 같은 코퍼스에서 돌기 때문에 `B2 vs B`가 드리프트를 상쇄하고 메커니즘만 남긴다. 결과는 B2가 B의 0.19배(−81.5%)이고, 보수적 snippet grep 하한인 A2에 대해서도 0.19배(−80.5%)였다. retrieval 이전 arm인 B가 A2 대비 갖지 못했던 이점이다. grounding 성공률은 100%였고 K=1에서도 견고했다. 다만 이건 여전히 결정적인 `chars/4` 프록시이지 실제 LLM 실측이 아니다. **실측이 뒷받침하기 전까지 README에 토큰이나 속도 주장을 싣는 것은 금지다.** `bench/results/current.md`와 `docs/llm-wiki/BENCHMARK.md`를 보라.

### Gate 23: 변경된 소스에서 위키로 가는 역방향 임팩트 게이트

감사가 찾아낸 가장 큰 비전과 현실의 간극이다. 당시 drift는 날짜 기반이라 정작 가장 중요한 경우, 그러니까 코드와 문서가 서로 다른 곳이나 다른 PR에서 바뀌는 경우를 놓쳤다. `source_files`와 `evidence`의 git diff 역색인을 만들어서, 참조된 코드를 건드리는 변경이 관련 `verified` 문서를 표시하게 한다(working tree와 PR base를 모두 인식한다). strict 거버넌스 프리셋에서는 drift만으로 CI를 실패시킬 수 있다. "위키가 코드를 따라간다"를 실제로, 그리고 CI가 강제하는 것으로 만든다. 부가적이고 직접 켜야 하며 의존성이 없다. 범위는 `GATE_REVIEW.md`의 Gate 23이고 1.17.0용으로 accepted됐다. 기존 `changedFiles`와 `verifiedSourceAnchors` 프리미티브를 재사용하는 배선 작업이 대부분이다.

**상태는 1.17.0에 나갔다.** 읽기 전용 `impact` 명령이, 참조한 `source_files`나 `evidence`가 현재 변경집합(working tree 또는 `--since <ref>`)에 들어 있는데 정작 문서 자신은 같은 diff에서 안 바뀐 `verified` 문서를 표시한다. 날짜 기준인 `evidence.stale`을 diff 기준으로, 그리고 머지 전 시점으로 보완하는 셈이다. 토글 가능한 `impact.source_changed`를 새로 넣었고 기본은 warning이며, `--strict`를 주면 CI를 실패시키는 error로 올라가고 변경집합이 비어 있으면 아무 일도 하지 않는다. `driftTargets`와 `scanReverseImpact`가 순수 함수인 `verifiedSourceAnchors` 추출기를 공유하며 동작은 보존된다. 릴리스 노트는 `docs/llm-wiki/releases/v1.17.0.md`에 있다.

### Gate 24: 읽기 전용 retrieval(search/get)을 MCP와 API에

런치에서 철회했던 "프로젝트 메모리, 에이전트가 위키를 query한다"는 스토리를 참으로 만든다. status와 visibility 필터가 붙은 읽기 전용 `list_docs`·`search_docs`·`get_doc`·`get_related`를 MCP와 프로그래매틱 API에 추가한다. 거버넌스 보고가 아니라 문서 본문을 돌려주는 것이 핵심이다. 재탐색과 토큰의 차이가 나타날 지점이므로 여기서 다시 측정한다. 부가적이고 직접 켜야 하며 의존성이 없다.

**상태는 1.18.0에 나갔다.** 읽기 전용 연산 네 개, 그러니까 `list-docs`와 `search-docs`(의존성 없는 키워드·부분문자열 검색이며 semantic이 아니다), `get-doc`, `get-related`가 프로그래매틱 API와 MCP, CLI에서 문서 본문을 돌려준다. MCP 툴 이름은 `list_docs`·`search_docs`·`get_doc`·`get_related`다. `listWikiContentDocs`와 frontmatter 파서, `collectWikiGraph`, 민감정보 스캔을 재사용한다. 읽기 전용이고, restricted 문서와 민감 문서는 list와 search에서 기본으로 빠지며(`--include-sensitive`로 켤 수 있다), 돌려주는 본문과 스니펫에서는 민감한 줄을 가려서 raw 값이 나가지 않는다. 코드는 `src/commands/retrieval.js`에 있고 릴리스 노트는 `docs/llm-wiki/releases/v1.18.0.md`다. **여기서 Gate 22 벤치를 다시 재서** retrieval 전후의 헤드라인 차이를 낸다(`node bench/run.js --against`).

### Gate 25: 근거의 의미를 단계로 나누기 (2026-07-21 accepted, 구현 완료)

감사가 실증한 신뢰 갭을 메운다. 그전까지는 존재하지 않는 symbol을 인용해도 그대로 통과했다. `reference_checked`와 `human_verified`를 구분하고, symbol과 section이 실제로 있는지 검사하며, 근거 없는 `verified`를 표시한다. 부가적이고 직접 켜야 하며 의존성이 없다.

**구현을 마쳤고 다음 마이너에 실렸다.** `scanEvidenceReferences`가 `#symbol:`과 `#section:` 타깃이 실제로 있는지 보수적으로 검사한다(`evidence.symbol_unverified`와 `evidence.section_unverified`를 내는데, 파일이 그 이름을 아예 언급하지 않을 때만 발화하고 섹션은 `.md`에서만 보며 `--strict`에서 승격된다). `scanUngroundedVerified`는 `source_files`도 `evidence`도 없는 `verified` 문서를 표시한다(`evidence.ungrounded`, warning, config로 토글 가능). 계산된 `evidenceTier`(`reference_checked`인지 `human_verified`인지)를 `stats` JSON에 부가적으로 노출하며 새 frontmatter 필드나 status 값은 만들지 않는다. 진짜 AST나 언어 서버를 쓴 symbol 해석, `route`의 실재 확인은 v1에서 뺐다. 의존성을 유지하기 위해서다. 테스트 251건에 `validate --strict` 0을 받았고, 자체 적용 결과는 50개 중 50개가 reference_checked, 50개 중 14개가 human_verified였다. 범위는 `GATE_REVIEW.md`의 Gate 25(accepted)다.

### Gate 26: 에이전트 실행 러너와 완료 계약

스스로 진화하는 워크플로의 한 조각이다. 스킬 실행이 구조화된 manifest를 남기고(바뀐 코드, 영향받은 문서, 로그 갱신, 검증) CI가 빠진 위키 갱신을 잡아낸다. 프로즈는 여전히 에이전트가 쓰되 파이프라인은 강제되는 형태다. 크고 아직 모호해서 마지막에 뒀다. 코드보다 게이트가 먼저다.

### P3 도입 장벽 (여기에 흡수)

기존에 큰 문서셋을 갖고 있는 brownfield 적합성 문제, 그리고 JS를 쓰지 않는 팀에게 Node 런타임이 장벽이 되는 문제는 별도 기능으로 다루지 않는다. 위 게이트들, 특히 23과 24 안에서 다루고, 측정(Gate 22)이 실제로 도입이 어디서 막히는지 보여 준 뒤에 다시 본다.

## 아직 배치하지 않은 1.x 백로그

해 볼 만하지만 아직 어느 릴리스에도 넣지 않은 부가 후보들이다.

- 실제 워크플로가 드러나면 `prompt --task` 프리셋을 더 추가한다.

위 릴리스 계획으로 올라간 것: stdlib 서버 감지(1.14, Gate 19).

1.7.0에서 나간 것: 명령별 JSON `help` 예시. 위 릴리스 계획으로 올라간 것: 더 촘촘한 보강 린팅(1.8에서 토글 가능한 `content.thin_body` 규칙으로).

## 1.x 지평 너머 (지금은 계획하지 않는다)

`1.0.0` 계약을 깨기 때문에 앞으로 major 버전이 필요한 변경들이다. 잊지 않으려고 적어 두되 일정은 없고, 실제 필요가 생겼을 때만 당긴다.

- frontmatter 계약 정리. 중복인 `verified` 태그를 없애고(status가 이미 담고 있다), `doc_type`을 OKF `type`으로 통일해 별칭을 걷어낸다.
- 기본값 전환. `content.not_enriched`와 `related.missing`을 error로 올리거나, 드리프트 자동 강등을 직접 켜는 것이 아니라 기본으로 만든다.

## 하지 않기로 했거나 미룬 것 (현재 판단)

- **core에 Markdown을 HTML로 바꾸는 정적 사이트 생성기나 렌더러를 넣는 것은 하지 않는다.** 무런타임 의존성 불변식과 충돌하고 MkDocs나 Docusaurus 영역으로 범위가 번지며, 생태계가 이미 Markdown-in-git 코퍼스를 더 잘 렌더링한다. 한정된 퍼블리시 가이드와 대시보드 인덱스(1.4)로 목표를 훨씬 싸게 달성한다.
- **원문을 OKF로 완전 자동 추출하는 것은 미룬다.** `okf-extract`로 프롬프트를 돕는 방식을 유지한다. 엔티티와 이벤트를 자동으로 뽑아내는 일은 사람 검토 모델과 충돌한다.
- **모든 문서에 `owner`를 필수로 만드는 것은 하지 않는다.** 기존 저장소를 오류로 뒤덮고 점진적 도입과 충돌한다.
- **`verified` 자동 승격은 절대 하지 않는다.** `verified`는 마이그레이션 엔진을 포함한 모든 명령에서 사람만 승인한다.
- **Notion 네이티브 모드는 계획하지 않는다.** Notion은 손실이 생기는 import가 필요하다. 수요가 생기면 core 기능이 아니라 단방향 Markdown → Notion 미러로 다룬다.

## 출시 계획 (post-1.19): 외부 실사용에서 나온 DX 개선

실제 Vue/Quasar SPA에 LLM-WIKI를 구축하면서 받은 QA와 DX 피드백에서 나온 라인이다. 부가적이고 의존성이 없으며 backend와 fullstack 출력은 바이트까지 동일하다.

- **1.20: 프론트엔드 DX와 근거 DX, retrieval (npm 1.20.0).** 프론트엔드와 모바일(SPA) 도메인 탐지를 넣었다. `pages`·`views`·`features`·`modules`·`screens` 폴더와 vue·react-router의 라우트 그룹을 정규식으로 본다. 도메인이 하나도 안 잡힐 때 명시적으로 안내하고 `--domains`를 받으며, `get-doc --section`으로 필요한 부분만 읽고, `search-docs`에서 change log를 뒤로 미루며, `evidence.section_unlisted`를 경로 기준으로 매칭해 locator 형식에 관대해졌다.
- **1.21: 도메인 온보딩과 보강 DX (npm 1.21.0).** 도메인 문서를 `index`와 `DOMAIN_FEATURES` 진입점에 미리 연결하고(P6), `next`에 문서별 보강 체크리스트를 붙였으며(P5), 탐지와 `not_enriched` 휴리스틱을 투명하게 설명하는 문서와 스냅샷 회귀 테스트를 넣었다(P7).
- **1.22: findings 다국어 (npm 1.22.0).** 사람이 읽는 findings 프로즈를 선택적으로 한국어로 낼 수 있게 했다(외부 피드백 P4, Gate 27). 전역 `--lang ko|en`(기본 `en`)과 config `lang`이 finding `message`와 `explain` 프로즈를 지역화한다. message는 공유 `applyRuleConfig` seam을 거치므로 text와 `--format json` 양쪽에 반영된다. 카탈로그는 의존성 없는 `src/i18n.js`이고 영어로 fallback한다. rule ID와 `--format json` 형태, CLI 명령, 경로는 영어로 고정이며 기본값 `en`에서는 바이트까지 동일하다.
- **1.23: bootstrap 스킬과 Codex 네이티브 스킬 (npm 1.23.0).** 최초 위키 작성만을 위한 `bootstrap` 태스크를 넣었다(스킬 `/llm-wiki-bootstrap`과 `prompt --task bootstrap`). `init --write`가 만든 뼈대를 실제 코드 근거로 보강하고 전부 `needs_review`로 유지한다. 규칙은 `src/task-prompts.js`의 `initialEnrichmentWorkflow` 한 곳에서 `handoff` 프롬프트와 공유하므로 갈라지지 않는다. 여기에 Codex 네이티브 스킬 출력(`.agents/skills/llm-wiki-<task>/SKILL.md`)을 더했고, `selectedSkillFormats`가 형식을 대칭으로 고른다(`--agent codex`·`claude`·`cursor`면 해당 형식, `--skills`면 전부). 부가적이고 의존성이 없으며 스킬을 요청하지 않으면 바이트까지 동일하다. 유일한 동작 변경은 `--agent codex`만 줬을 때 Codex 스킬이 생성된다는 것이다.
- **1.24 (배포됨): 안내형 온보딩과 작업 준비.** 거버넌스 코어 위에 사람과 에이전트를 위한 워크플로를 얹는 읽기 전용 명령 두 개다. `onboard`는 신입을 위한 도메인 학습 경로를 짜 주고(문서, 소스와 테스트 진입점, 불변조건, 최신성 경고, 이해도 점검), `prepare --task`는 구현 전에 작업 범위를 모아 준다(관련 문서, 후보 소스와 테스트, 위험). 둘 다 단정하지 않고 후보로 제시한다. retrieval 랭킹(`rankDocsByQuery`)과 그래프를 재사용하며 CLI·API·MCP에서 모두 쓸 수 있고, `llm-wiki-onboard`와 `llm-wiki-prepare` 스킬을 새로 넣었으며 feature와 fix 스킬이 prepare를 인지하도록 했다. 전체 작업 단위 실험을 위한 별도 뼈대(`bench/whole-task/`, dry-run 전용이고 수치를 조작하지 않는다)도 추가했다. 부가적이고 읽기 전용이며 의존성이 없다. 초안 상태로 미룬 것은 안내형 feature/fix CLI 모드와 사람 승인용 `review` 명령, 언어 서버·AST 분석기다. 범위는 `GATE_REVIEW.md`의 "Guided Onboarding and Task Preparation"이다.
- **1.24 (같은 묶음): 생성 문서의 언어 선택 (급한 다국어 대응).** 영어 우선 제품인데 생성되는 위키 문서에 한국어가 새어 나가던 버그를 고쳤다. 이제 `init`과 `quickstart`가 만드는 모든 문서 본문이 기본 영어다(본문·제목·자리표시자·review note·초기 로그에 한국어가 하나도 없다). 생성 문서와 에이전트의 문서 작성 언어를 고르는 전역 `--doc-lang en|ko`와 config `docLanguage`를 넣었고 `--lang`과는 독립이다. 언어 선택 계층을 `src/commands/doc-content.js` 한 곳으로 모았고, 기술 식별자는 번역하지 않으며, 이미 영어였던 문서는 바이트까지 동일하다. 미룬 것은 기존 문서 자동 번역, 언어 변환 명령, 한국어 OKF 템플릿이다. 범위는 `GATE_REVIEW.md`의 "Documentation Language Selection"이다.
- **1.25 (배포됨): 토큰 효율, 가장 싸면서 안전한 경로를 고른다.** 정확도와 최신성, 사람 검토를 희생하지 않으면서 올바르고 검증된 변경까지 드는 토큰을 줄이는 작업이다. 부가적이고 직접 켜야 하며 의존성이 없다. 작업 텍스트와 후보 수, 문서 status만 보고(정답 파일명은 쓰지 않는다) `source_direct`·`wiki_first`·`hybrid` 중 하나를 고르는 결정적 경로 선택기를 넣었고, 위험한 작업이나 stale 문서, 코드 변경에는 안전 오버라이드가 걸린다. retrieval 쪽 토큰 제어로 `get-doc --strict-section`(전체 본문으로 되돌아가지 않는다)과 `--max-chars`(가림 처리 후 정확히 자른다), `--compact`를 넣었고, `prepare --compact`가 최소 문맥 묶음을 돌려주며, 섹션 제목에 가중치를 준 랭킹을 적용했다. feature·fix·docs-sync 스킬을 더 간결하게 다듬었고(위키 맵을 스냅샷이 아니라 런타임에 읽는다. 안전 규칙은 전부 유지했고 bootstrap은 더 자세한 안내를 그대로 뒀다), 사용자가 손대지 않은 관리 스킬만 갱신하는 안전한 `--refresh`를 붙였다. MCP 쪽 토큰 제어와, content와 structuredContent에 본문이 중복되지 않게 하는 compact 경로도 넣었다. 프록시 벤치 arm `B3_retrieval_compact`도 추가했다(chars/4 전용). 사람 결정으로 미룬 것은 유료로 돌리는 다중 프로젝트·다중 모델 실측이다. 범위는 `GATE_REVIEW.md`의 "Token-Efficiency: Cheapest-Safe-Path Selection + Compact Retrieval"이다.
- **실측 완료 (2026-07-22).** 외부 Vue/Quasar 프로젝트를 대상으로 실제 LLM을 써서 N=3 벤치를 돌려(Claude Opus 4.8) chars/4 프록시를 대체했다. 최신 위키가 있으면 에이전트가 소스를 읽지 않고도 같은 정확도로 답했고 토큰을 10% 남짓 아꼈다(태스크에 따라 다르다). 반면 오래된 위키는 오답을 냈다. 이득의 본질이 raw 속도가 아니라 신선함에서 오는 정확도라는 뜻이다. 범위가 제한된 결과다(에이전트 하나, 저장소 하나). `docs/llm-wiki/BENCHMARK.md`를 보라.
- **벤치 엄밀성 하네스 (2026-07-22에 뼈대만, 아직 안 돌림).** 파일럿이 단일 total만 냈던 것과 달리 입력과 출력 토큰을 나눠서 내는 SDK 경로 드라이버다(`bench/real/agent.js`와 `bench/tasks-external-vue-app.json`). dry 검증은 끝났고 유료 실행은 API 예산을 기다리고 있다. Claude에만 나타나는 특성인지 확인할 교차 에이전트(GPT) 드라이버는 미뤘다. `bench/real/DRIVER_RUNBOOK.md`를 보라.
- **아직 만들지 않은 후보.** `fix` 시점의 도메인 링크 재배선, 유료 SDK 경로 실행과 교차 에이전트 벤치, 리포트 chrome과 severity 단어의 지역화, 그리고 한국어·영어 외 언어다.

## 출시 계획 (post-1.25): 견고화와 도입 — **1.26.0으로 출시 (2026-07-27)**

공개 저장소를 대상으로 한 외부 제3자의 심층 분석(2026-07-24)은 설계와 거버넌스 코어를 "탁월하고 내부적으로 일관된다"고 평가했고 zero-dependency 자세를 대표 강점으로 꼽았다. 다만 더 넓은 도입을 막는 병목은 기능이 아니라 운영 표준화와 엔지니어링 위생에 있다고 지적했다. 이 라인은 그 리포트에 답한다. 앞선 measure-first 라인(Gate 27까지 완료)과 global-reach 프로그램에 맞추되, 무런타임 의존성 정체성이라는 제약 안에서 진행한다.

**상태는 완료다.** 이 라인 전체가 2026-07-27에 1.26.0으로 나갔다. 이 라인이 드러낸 결정 세 개는 모두 권장안대로 확정됐다. 커버리지는 Node 내장을 쓰고 nyc나 c8를 쓰지 않으며, lint는 `node --check` 게이트로 하고 ESLint나 Prettier를 devDependency로 넣지 않으며, Gate 20을 승인해 헤드라인 `review` 명령으로 만들었다. 런타임 의존성도 devDependency도 0을 유지한다. 아래 계획은 무엇을 왜 제안했는지 남기기 위해 원문 그대로 둔다. 항목별 결과는 `CHANGELOG.ko.md`의 1.26.0 항목을 보라.

이 라인에서 **일부러 닫지 않은** 항목이 둘 있다. README 성능 헤드라인은 계속 금지이고(Track C를 보라), 벤치에서 "위키 내용"과 "retrieval 툴"을 분리해 줄 빈 위키 통제 arm은 아직 돌리지 않았다.

리포트의 사각지대도 적어 둔다. 공개된 파일만 읽었기 때문에 "미지정"으로 표시된 항목 상당수는 역량 격차가 아니라 문서 가시성 격차다. 내부 설계 노트와 measure-first 벤치 라인, 토큰 효율 작업을 볼 수 없었다. 아래 계획에는 진짜 격차만 남기고 나머지는 뺐다. 그리고 README 성능 헤드라인은 실제 다중 저장소·다중 모델 측정이 뒷받침하기 전까지 계속 금지다. 하네스 수치는 `chars/4` 프록시다.

### Track A: 엔지니어링 위생과 공급망 견고화 (부가적이며 런타임 의존성을 늘리지 않는다)

리포트의 비기능 항목들이다. 어느 것도 런타임 의존성을 더하지 않고, 그중 둘은 이 로드맵이 조용히 처리하지 말고 명시적으로 내려야 할 정체성 결정을 담고 있다.

- **컴포지트 액션의 기본 `version`을 고정한다.** `.github/actions/validate/action.yml`의 `version` 입력 기본값이 `"latest"`다(11행). 그래서 소비자가 액션을 태그로 고정해도 정작 실행되는 CLI 버전은 떠 있다. 공급망 재현성을 위해 기본값을 `X.Y`나 `X.Y.Z`로 고정하거나 필수 입력으로 만든다. 가장 값싼 항목이고 순수 CI라 게이트가 필요 없다. (리포트 8번)
- **테스트 커버리지 수집과 선택적 CI 임계값을 Node 내장으로 한다.** `node --test --experimental-test-coverage`(Node 20 이상이며 이미 CI 매트릭스에 있다. `.github/workflows/ci.yml`)로 커버리지를 모아 공개하고, 원하면 막지 않는 하한선을 둔다. **여기서 정체성 결정이 하나 필요하다. 이 방식은 zero-dependency를 지킨다. 리포트가 문자 그대로 제안한 nyc나 c8는 devDependency를 더해서 "런타임 의존성도 devDependency도 없다"는 정체성을 깬다. 그래서 권장 답은 nyc나 c8가 아니라 내장 기능이다.** (리포트 6번)
- **보안 스캔을 자동화한다.** GitHub 네이티브 CodeQL 워크플로를 넣고(패키지 의존성이 없다) 시크릿 스캔을 문서화한다. 원하면 `npm sbom`으로 SBOM도 낸다. 전부 CI와 GitHub 네이티브라 런타임 의존성도 패키지 의존성도 0이다. (리포트 9번)
- **운영 거버넌스 메타데이터를 갖춘다.** `CODEOWNERS`, 유지보수자와 승인자 매트릭스, 릴리스 승인자 노트다. 순수하게 저장소 설정과 문서다. (리포트 11번)
- **lint와 format, typecheck 입장. zero-dependency와 부딪히는 유일하게 강한 지점이다.** 내장 JS 린터가 없으므로 이 제안은 커버리지처럼 깔끔하게 충족할 수가 없다. **정체성 결정이 반드시 명시적으로 필요하고, 조용히 devDependency를 넣는 것은 안 된다.** 선택지는 둘이다. (a) zero-dependency를 유지하고 CI에 `node --check` 문법 게이트와 `.editorconfig`를 두면서 "스타일은 린터 의존성이 아니라 리뷰로 강제한다"는 입장을 문서로 밝힌다. (b) 범위를 한정한 devDependency(ESLint·Prettier)를 받아들이고 "devDependency 없음" 주장을 접는다. 권장은 (a)다. 리포트가 스스로 칭찬한 정체성을 지키고, 그 입장을 `CONTRIBUTING`에 공개적으로 적는다. (리포트 7번)

### Track B: 거버넌스 완결 (리포트가 기능 HIGH로 꼽은 항목)

- **Gate 20 결정, 사람 검토에서 `verified`까지 가는 워크플로.** 리포트는 검토와 승인 워크플로를 최상위 기능 격차로 따로 지목했다. 내부적으로도 첫 외부 end-to-end 실행이 `needs_review` 백로그를 남겼는데 이를 검토하고 승인할 수단이 없던 이후로 `GATE_REVIEW.md`의 Gate 20이 `proposed_for_next` 상태로 오래 머물러 있었다. 읽기 전용 `review` 명령이 `needs_review` 내용 문서를 위험 순서로 나열하고(얇은 문서, 근거 없는 문서, 깨진 링크, 미보강 순) 문서별 품질과 근거 요약으로 빠르게 훑게 해 준다. `verified` 승격은(`reviewed_by`와 `reviewed_at` 기록) 오직 명시적이고 확인을 거친 `--approve <경로>`에서만 일어나고 자동은 절대 없다. 여기가 루프에서 가장 약하고 가장 수동적인 부분이자 거버넌스 코어 그 자체다. **권장은 Gate 20을 수용해 이 라인의 헤드라인 기능으로 만드는 것이다.** 부가적이고 직접 켜야 하며 기본 읽기 전용이고 의존성이 없다. `verified`는 모든 명령에서 사람만 할 수 있다는 원칙을 그대로 지킨다.
- **MCP 접근 경계 문서.** MCP 서버가 전제하는 신뢰 모델(로컬 stdio 서브프로세스 또는 CI 러너, stdout은 프로토콜 채널, 읽기 전용 툴, 쓰기 없음)을 문서로 남기고, 원격 브로커로 노출하지 말라고 경고하며, 민감한 저장소를 위한 지침을 준다. 순수하게 문서이고 코드 변경은 없다. (리포트 2번)

### Track C: 도입 자산 (리포트의 MED·LOW 항목과 global-reach P2)

- **처음부터 끝까지 도는 예제와 픽스처.** `init → enrich → validate → review`를 작게 실제로 돌려 보는 예제(또는 문서화된 `examples/` 워크스루), 넓힌 테스트 픽스처, 실제 `quickstart` 출력 스냅샷이다. (리포트 3번)
- **규모별 운영 가이드.** 소규모 저장소, 중규모 저장소, 모노레포를 위한 짧은 가이드다. 어떤 플래그를 쓰고 CI 비용은 얼마이며 문서 수를 어떻게 가져갈지를 담는다. (리포트 4번)
- **README 아키텍처 다이어그램과 감사 출력 예시.** command → scan → report 파이프라인 다이어그램과, 값을 가린 실제 감사 출력 몇 개다. (리포트 5번)
- **이미 있는 벤치를 주기 실행과 릴리스 CI 가드에 배선한다.** `bench/` 하네스는 공개 리포트가 볼 수 있는 것보다 훨씬 성숙하다. `node bench/run.js --against <baseline>`을 다시 돌려 회귀를 표시하는, 직접 켜는 잡을 추가한다. **`chars/4` 프록시는 어디까지나 프록시다. 실제 다중 저장소·다중 모델 측정이 뒷받침하기 전까지 README에 토큰이나 속도 헤드라인을 싣지 않는다.** (리포트 10번)

### 이 라인 너머 (게이트를 두고, 실제 도입 신호가 당길 때)

global-reach 프로그램의 P3 도입 장벽, 그러니까 기존에 큰 문서셋을 가진 brownfield 적합성과 JS를 쓰지 않는 팀의 Node 런타임 허들은 각자의 게이트 뒤에 미뤄 둔다. 측정과 위 도입 자산이 실제로 도입이 막히는 지점을 드러낼 때만 당긴다.

## 릴리스 계획 (post-1.26): 감사 잔여 항목, 차용한 기법, 문맥 규율 — **1.27.1로 배포 (2026-07-29)**

이 라인은 새 게이트를 제안하지 않는다. 다른 곳에서 이미 범위가 정해진 작업을 마감할 뿐이다.

- **2026-07-27 품질 감사에서 남은 항목들.** 중복된 frontmatter 키를 조용한 last-wins 대신 표면으로 드러내고, MCP `inputSchema`를 실제로 강제하며(`-32602`), `--type`을 `KNOWN_TYPES` 한 곳으로 검증한다. `GATE_REVIEW.md`의 감사 항목에 기록해 두었다.
- **외부 에이전트 하네스(ECC, MIT)에서 차용한 기법 네 가지.** `GATE_REVIEW.md`의 "ECC Technique Extraction Scope Decision"으로 결정했다. run manifest의 `testEvidence` red→green 트레일, 생성 스킬 아티팩트의 `estimated-tokens` 예산, 이름 붙인 `rulesPreset` 번들, 단방향 `import-memory` 임포터다. ECC는 기법의 출처로만 읽었다. 의존성도 아니고 이 저장소의 툴체인도 아니다. 검토한 것 중 둘(confidence 스코어링, 세션 "instincts")은 이유를 적어 기각했다.
- **생성 프롬프트의 문맥 규율.** 토큰 효율 라인(1.25)은 CLI가 돌려주는 것을 통제했지만 에이전트가 끌어오는 것은 통제하지 않았다. 이 배치가 나머지 절반을 닫는다. 모든 작업 프롬프트와 스킬에 공유 문맥 예산을 넣고, run manifest 계약이 자기 payload에 상한을 갖게 했다. 소스를 어떻게 읽을지만 좁히고 읽을지 말지는 건드리지 않으며, 코드가 최종 사실이라는 불변식을 프롬프트 본문에 명시한다.

**`chars/4` 프록시는 어디까지나 프록시다.** `estimated-tokens` 스탬프와 각 스킬 고정 본문이 30% 남짓 커진 것은 프록시 수치이자 설계상 감수한 트레이드오프로 보고하며, 실제 다중 저장소·다중 모델 측정이 뒷받침하기 전까지 README에 토큰이나 속도 헤드라인을 싣지 않는다.

## 릴리스 계획 (post-1.27.1): 프롬프트 형태 규율 — **1.27.2로 배포 (2026-07-30)**

새 게이트는 없다. 범위 결정은 `GATE_REVIEW.md`의 "Prompt-Shape Discipline (Unhobbling) Scope Decision"에 기록했다. 유지보수자가 검토한 지침, 그러니까 불필요한 설정은 지우고, 목표와 넘지 말아야 할 선과 종료 기준만 전달하며, 비법 대신 관찰하고 보완하라는 원칙을 하나의 분류 규칙으로 적용했다. 생성되는 모든 지시 줄을 steering과 계약, 안전으로 분류하고 steering만 삭제할 수 있게 한 것이다. 계약은 `validate`와 `check-run`, 테스트가 종료 시점에 강제하기 때문이다.

- **어댑터 선적재를 줄였다.** Claude Code 어댑터 템플릿(마커 v1에서 v2로)이 `@`-include를 `index.md`와 `project-profile.md`로 줄이고, 무거운 문서는 retrieval 명령으로 필요할 때 읽는다. 이 저장소의 `CLAUDE.md`도 템플릿과 같게 맞췄다. 선적재가 30.3k에서 1.4k 토큰 남짓으로 줄었는데 `chars/4` 프록시 값이다.
- **프롬프트를 세 블록으로 바꿨다.** `feature`·`fix`·`refactor`·`docs-sync` 프롬프트와 스킬이 Goal, Hard lines, Exit criteria를 서술하고 그 사이는 에이전트에 맡긴다(마커 v4에서 v5로). 계약과 안전에 해당하는 줄은 전부 보존했고 회귀 테스트로 고정했다. 절차형 원샷 워크플로는 일부러 체크리스트로 남겼다.
- **Review Notes를 아카이브했다.** 무거운 위키 문서는 최근 5건만 남기고 오래된 항목은 `docs/llm-wiki/REVIEW_HISTORY.md`로 원문 그대로 옮겼다. 승인 효력은 frontmatter가 정본이고, append-only 로그는 `log.md`가 소유한다.
- **삭제 기준을 계측 가능하게 만들었다.** steering 줄은 없을 때 발화하는 신호가(`run.*` finding, validate·audit findings, 테스트 실패) 없으면 삭제 후보다. 프롬프트 표면을 다시 볼 시점은 달력이 아니라 모델 업그레이드나 몇 번의 릴리스 주기다.

**측정하지 않았다는 점을 분명히 적는다.** 이렇게 재구성한 것이 과제 성과에 어떤 영향을 주는지는 벤치 arm이 없어 모른다. 선적재 수치도 파일 크기 산술(`chars/4` 프록시)이다. README 헤드라인 금지는 그대로다.

## 릴리스 계획 (post-1.27.2): 하네스 거버넌스 Phase 0와 누락 게이트 기본 활성화 — **1.28.0으로 배포 (2026-08-03)**

`docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md`에서 나온 라인이다. Phase 0으로 결함부터 고치고 우리가 실제로 출하하는 채널에 게이트를 배선했으며, 2026-08-03에 유지보수자가 결정한 J장 11건을 함께 처리했다. 범위 결정은 `GATE_REVIEW.md`의 "Phase 0 Gate Wiring", "Phase 0 Defect Batch", "Monorepo CLI Contract Parity"에 기록했다.

- **누락 게이트가 기본으로 켜진다 (결정 21).** `impact.source_changed`가 `warning`에서 `error`로 올라가서, `impact --since <ref>`가 플래그 없이도 빌드를 실패시키고 이 규칙에 대해 `--strict`는 아무 일도 하지 않는다. 형태만 보면 SemVer MAJOR지만 유지보수자 결정으로 MINOR로 내보낸다. `^1.27.2`가 자동으로 올라오기 때문에, config로 되돌리는 방법 두 가지(`rules` 또는 `rulesPreset: "relaxed"`)를 README 두 종과 CHANGELOG 두 종, 릴리스 노트에 모두 적었다.
- **릴리스 노트를 면제했다 (결정 28).** `doc_type: release_notes`인 문서는 `evidence.stale`과 `impact.source_changed` 양쪽에서 건너뛴다. 이것이 결정 21을 실제로 쓸 만하게 만들었고(기본값을 켠 커밋에서 finding이 23건에서 9건으로 줄었다), 커버리지가 줄어드는 일이라는 것도 그대로 적는다.
- **우리가 출하하는 네 채널이 게이트를 돌린다.** pre-commit 훅, 워크플로 템플릿(`fetch-depth: 0`을 포함한다. 없으면 `--since`가 조용히 무력화된다), 컴포지트 액션(`command` 입력이며 이게 없으면 누락 게이트를 이 경로로 아예 실행할 수 없다), 그리고 이 저장소의 CI다.
- **Phase 1의 `harness-health`.** 위키가 아니라 하네스를 검사하는 첫 명령이다. 어댑터와 생성 스킬, 상시 선적재 표면을 본다. 읽기 전용이고 토글 가능한 규칙이 네 종인데 그중 둘은 프로젝트가 예산 숫자를 주기 전까지 비활성이다. Phase 1만 승인했고 `fleet` roll-up은 이 신호가 실제로 유용하다고 판정될 때까지 만들지 않는다(브리프 J-27의 권고 (b)).
- **감지기 8건을 연결했다.** stale이라고 스스로 증명한 위키에 pass를 보고하던 `drift`, 미보강 스캐폴드를 그대로 받던 `review --approve`, 파일명으로 매니페스트를 고르던 `check-run`, 커밋되지 않은 새 소스를 못 보던 `impact --since`, 그리고 작은 것 넷이다. 전부 감지는 하는데 말을 못 하던 것들이다.
- **측정하고 나서 출하하지 않기로 한 것도 있다 (결정 24).** `review` 명령을 우회한 승인을 게이트로 잡자는 안은 verified 문서 129건에 대해 42번 발화했지만 실제 우회는 0건이었다. 권고 자신의 전제 조건이 실패한 것이다. 대신 측정이 더 나은 규칙을 지목했다. `reviewed_at`이 승격 커밋보다 앞서는 경우인데 전체 코퍼스에서 1건이었다. 이건 별도 결정으로 남긴다.

**숫자는 게이트와 함께 다닌다.** `impact.source_changed`의 기준선 오탐률은 아직 내려지지 않은 정책 판단에 따라 27%나 57%이고, 허브 파일 하나가 최대 14건으로 번지며, 기본값을 켠 커밋에서는 finding 6건 중 1건만 조치 대상이었다. `harness-health`는 저장소 5곳에서 나온 finding 33건에서 오탐 0을 기록했다. 여기서 "참"은 보고한 사실이 맞다는 뜻이지 조치할 가치가 있다는 뜻이 아니다. 새 CI 템플릿을 파일럿 저장소에서 확인하는 일은 지시에 따라 건너뛰었다. `chars/4` 프록시와 README 헤드라인 금지는 그대로다.

## 릴리스 계획 (post-1.28.0): 릴리스 커밋이 자기 매니페스트 때문에 실패하지 않게 — **1.29.0으로 배포 (2026-08-05)**

항목 하나짜리 릴리스이고, 직전 릴리스가 스스로 치른 대가에서 그대로 나왔다. `impact.source_changed`는 1.28.0에서 error가 됐는데, 그것이 가장 먼저 한 일이 자기를 출하한 릴리스 커밋에서 발화하는 것이었다. 릴리스는 정의상 `package.json`을 바꾸고, 이 저장소의 면제되지 않은 `verified` 문서 10건이 그 파일을 인용하고 있기 때문이다. 이제 `impact`는 그런 매니페스트를 변경된 것으로 보고하되 앵커로는 쓰지 않는다. N-13으로 기록했고(`docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md` H장, 선택지 (c), 2026-08-04 유지보수자 결정) 기각한 대안 둘과 그 대가도 함께 적어 두었다. 범위 결정은 `GATE_REVIEW.md`의 "Version-Only Manifest Scope Decision"이다.

- **일부러 좁게 만들었다.** `package.json`에만 적용한다. 루트 매니페스트는 항상 보고, 중첩된 것은 루트가 `workspaces`를 선언하고 그 glob의 리터럴 접두사 아래일 때만 본다. `pyproject.toml`과 `Cargo.toml`은 넣지 않았다. 파서가 필요하고, 무의존성이 그 대칭성보다 값어치가 크기 때문이다. 비교는 키 순서까지 구분한다. Node가 조건부 `exports`를 키 순서로 해석하므로 순서가 바뀐 것은 실제 변경이다.
- **조용히 처리하지 않는다.** `anchoring_files`가 `changed_files` 옆에 제외된 경로를 이름과 함께 찍고, `--format json`은 `versionOnlyExcluded[]`를 싣는다. 보이지 않는 예외는 출하 텍스트가 동작을 앞지르는 것과 같은 부류의 실패이고 방향만 반대다.
- **`drift`는 손대지 않았다.** `evidence.stale`은 날짜 앵커라서 버전만 올려도 그 매니페스트를 인용한 문서를 계속 지목한다. 이 제외는 `impact`에만 해당한다.
- **기각한 것과 그 이유.** 이 저장소 config에서 규칙을 낮추는 방안은 매니페스트만이 아니라 모든 소스 변경의 차단력을 없앤다. 1.28.0에서 게이트가 실제로 잡아낸 진짜 1건까지 함께 묻혔을 것이다. 매 릴리스마다 팬아웃을 다시 검토하는 방안은 게이트를 고무도장으로 만들고, Review Notes 5건 상한 때문에 릴리스마다 아카이브 회전을 강제한다.

**숫자는 이 저장소에서 직접 쟀다.** `package.json`만 바뀐 diff에서는 10건에서 0건이 됐다. 릴리스가 건드리는, 버전을 담고 있는 파일 8종을 기준으로 하면 11건에서 4건이고, 이번 릴리스 커밋의 실측값이 정확히 4건이었다. 넷 다 내용이 실제로 바뀐 `README.md`나 컴포지트 액션을 인용한다. **0이 되지는 않으며, 이 변경을 설명하는 모든 자리에 그 사실을 함께 적었다.** 그리고 그 4건을 해소하자 2차 발화가 1건 나왔다. 방금 고친 문서들을 인용하는 리뷰 노트 아카이브였다. 그래서 총 5건을 처리했고, 위키의 팬아웃이 소스에서 문서로 1홉이 아니라는 것도 확인했다. 4건 중 3건은 실제로 낡은 주장을 담고 있어서 재스탬프가 아니라 본문을 고쳤고, 그중 하나는 N-13 항목 자신에 있던 것으로 같은 거짓 전제를 다른 6개 문서에서 고친 정정 배치를 살아남은 것이었다. 첫 구현은 세 가지가 틀렸고 적대적 검증이 배포 전에 셋 다 잡았으며, 테스트는 mutation으로 구멍 4개가 드러난 뒤 9건에서 17건이 됐다.

## 릴리스 계획 (post-1.29.0): 게이트가 `review`로는 손댈 수 없는 문서를 지목했다 — **1.29.1로 배포 (2026-08-06)**

이번에도 항목 하나이고, 이번에도 직전 릴리스가 남긴 대가다. 1.29.0은 CHANGELOG 두 종에 알려진 문제를 함께 실어 보냈다. 최신성 게이트가 `review`로는 구조적으로 재스탬프할 수 없는 문서를 지목하는 문제였다. 문서 열거자가 둘로 갈라져 있던 것이 원인이다. `review`는 `/templates/`를 제외하는 `listWikiContentDocs`를 쓰는데, `validate`와 `drift`, `impact`는 `docs/llm-wiki` 전체를 걷는 `listTargetMarkdown`을 쓴다. N-14로 기록했고(`docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md` 46번) 선택은 기록된 권고인 (c)와 (b)다. 범위 결정은 `GATE_REVIEW.md`의 "Template Scope Decision (N-14, 2026-08-06)"이다.

- **잡음이 아니라 해소할 방법이 없는 finding이었다.** 낡은 템플릿을 강등해도 아무것도 돌아오지 않았고, `--approve-all`은 그것을 건너뛰면서 `needs_review_remaining: 0`이라고 보고했으며, 파일을 명시적으로 지정하면 분명히 `docs/llm-wiki` 안에 있는데도 `not found under docs/llm-wiki`라고 답했다. 1.28.0부터 `impact.source_changed`가 기본 `error`이므로, 위키 템플릿을 두는 도입처는 해소할 수단 없이 빌드가 실패할 수 있었다.
- **술어는 공유하고 열거자는 합치지 않았다.** `isTemplateDoc`를 export하고 최신성 스캔 두 개가 그것으로 건너뛴다. 열거자를 합쳐 버리면 템플릿이 승격 대상이 되어 경계가 반대 방향으로 무너진다. 술어 하나를 공유하면 경계는 그대로 유지되고 두 답이 다시 갈라질 수도 없다.
- **같은 배치에서 인접한 결함 하나도 고쳤다.** append-only 로그는 `--approve-all`에서는 건너뛰어졌는데 명시적으로 지정하면 `verified`로 스탬프됐다. 같은 경계에 답이 둘이었던 셈이다. 이제 두 경로 모두 거부한다.
- **PATCH로 판정했고 근거를 기록에 남겼다.** 구현 시점 메모에는 "MINOR가 보수적인 읽기"라고 적혀 있었지만 결정은 반대로 갔다. 명령도 옵션도 리포트 필드도 하나 움직이지 않았고, 1.29.0이 MINOR였던 이유가 바로 그 출력 필드 둘을 추가했기 때문이다. 동작 변경도 관대해지는 방향뿐이라 도입처 빌드가 새로 깨지지 않는다.

**숫자는 이 저장소에서 직접 쟀다.** `evidence.stale`이 7건에서 5건이 됐다. 사라진 2건이 정확히 해소 경로가 없던 템플릿이고, 남은 5건은 1.29.0이 남긴 통상적인 릴리스 후 드리프트다. **0이 되지 않으며 그럴 의도도 없다.** 테스트는 6건 늘어 509건에서 515건이 됐고 `skipped`는 0이다. 픽스처에는 frontmatter가 바이트까지 같은 비템플릿 형제를 대조군으로 두어서, 경로가 아닌 다른 이유로 게이트가 멈추면 통과가 아니라 실패하도록 했다. RED은 파일 단위 크래시가 아니라 테스트별로 확인했다. 이 저장소 테스트는 로드 시점에 import를 가드하기 때문에 새 export를 통째로 stash하면 크래시 하나만 나오고 아무것도 증명하지 못한다.

## 릴리스 계획 (post-1.29.1): 프롬프트가 "얼마나"에 더해 "누가" 읽을지까지 정한다 — **1.29.2로 배포 (2026-08-18)**

이번에도 항목 하나이고, 1.27.1이 열어 둔 공백을 닫는다. `contextBudget`은 생성된 프롬프트가 에이전트에게 얼마나 읽으라고 말할지를 좁혔을 뿐, 누가 읽을지는 말하지 않았다. 그래서 변경 지점을 찾고 범위를 잡기 위한 훑기, 그러니까 파일 여럿을 열어 대부분 한 번 읽고 버리는 작업이 여전히 추론을 쥐고 있는 비싼 문맥의 가격으로 치러졌다. 1.29.2는 네 번째 레버를 더한다. `src/task-prompts.js`의 `delegationPolicy()`가 만드는 위임 예산이며, `contextBudget()` 바로 뒤 호출 지점 세 곳(`implementationPrompt`, `docsSyncPrompt`, `initialEnrichmentWorkflow`)에 이어 붙는다.

- **내용은 "위임하라"는 권유가 아니라 위임의 경계다.** 위치를 찾고 범위를 잡는 일은 위임할 수 있고, 돌아오는 것은 브리프여야 한다. 발견한 것과 `file:line` 근거, 확인하지 못한 것이지 원자료가 아니다. 판단은 위임할 수 없다. 설계 결정과 회귀 위험 판정, 실제 수정, 그리고 위키와 로그 서술은 제자리에 남는다. 값싼 에이전트는 이미 써 준 텍스트를 넣을 수는 있어도 왜 그런지를 설명하는 문장은 쓸 수 없기 때문이다. 기계적인 마감은 다시 위임할 수 있다. 검사 실행, run 매니페스트, 이미 결정된 편집의 적용이 그렇다.
- **함정 셋을 못박은 이유는, 각각이 아끼는 것보다 조용히 더 쓰기 때문이다.** 브리프 대신 원자료를 돌려받는 위임은 아무것도 사지 못한다. 세션 모델은 고정하고 위임만 값싼 모델로 보내야 한다. 작업 도중에 세션 모델을 바꾸면 그때까지의 대화 전체를 새 모델의 입력 가격으로 다시 읽기 때문이다. 그리고 위임한다고 해서 검증되지 않은 주장까지 사 주지는 않는다. 대리인이 실제 소스를 읽고 근거를 보고하든지, 아니면 직접 읽어야 한다.
- **에이전트 중립은 우연이 아니라 계약이다.** 첫 초안은 Claude 특정 문장을 `agents`로 분기했다가 중립 프롬프트와 Cursor 룰로 새어 나갔다. `buildTaskPrompt`가 빈 `agents` 목록을 `["codex", "claude"]`로 넓히기 때문이다. 특정 하네스를 지목하는 문구는 `templates/adapters/` 아래 그 하네스의 어댑터가 맡을 몫이고, 이제 테스트가 어떤 인자로도 이 텍스트를 바꿀 수 없다는 것을 고정한다.
- **일부러 넣지 않은 곳도 있다.** 읽기 전용 스코핑(`onboard`, `prepare`)과 포맷 변환(`okf-extract`)에는 이 블록이 없다. 거기서는 위임해서 읽는 것이 작업 그 자체라 블록이 잡음이 된다. 위임하는 작업 넷의 관리 스킬 아티팩트 16개를 갱신했고, `onboard`와 `prepare` 아티팩트가 바이트까지 동일하게 돌아온 것이 의도한 곳에만 들어갔다는 검사가 됐다.

**대가는 적어 두고, 절감은 주장하지 않는다.** 영향을 받는 스킬 본문은 각각 30% 남짓 커진다(`fix`는 1077에서 1406, `bootstrap`은 1171에서 1501이며 `chars/4` 프록시이지 실측 토큰이 아니다). 한 번도 위임하지 않는 도입처에는 순수한 비용이다. 이 블록이 사려는 절감은 여기서 측정하지 않았고 주장하지도 않는다. 1.27.1이 `contextBudget`에 대해 지킨 것과 같은 정직 선이다. 테스트는 3건 늘어 515건에서 518건이 됐고 `skipped`는 0이다. 하나는 소스가 순수하고 결정적이며 `agents`에 영향받지 않고 위임하는 프롬프트 5종에는 그대로 박히고 읽기 전용 3종에는 없다는 것을 고정하고, 하나는 경계 문장 자체를 고정해 블록이 일반론적 조언으로 물러지지 못하게 하며, 하나는 디스크에 생성된 스킬 아티팩트에서 같은 분할을 고정한다. **PATCH**로 판정했다. 명령도 옵션도 리포트 필드도 하나 움직이지 않고, 변경은 도입처가 자기 일정에 따라 다시 생성하는 프롬프트 안의 부가 텍스트다.

## 릴리스 계획 (post-1.29.5): 엔진 하나에 정책 레벨 셋 — **1.30.0으로 출하 (2026-09-07)**

거버넌스의 비용을 튜닝 세부사항이 아니라 일급 제품 문제로 다룬 첫 릴리스다. 이전의 레버는 전부 거버넌스를 돌리는 비용을 낮추는 것이었다. `contextBudget`(1.27.1), 릴리스 커밋 예외(1.29.0), 템플릿 예외(1.29.1), `delegationPolicy`(1.29.2)가 그랬다. 그중 무엇도 도입처가 실제로 계속 묻던 질문에는 답하지 못했다. **지금 이 작업을 아예 해야 하는가?** 개인 프로젝트에서 세 줄을 고쳤는데 `impact.source_changed`(결정 21 이후 기본 error)가 발화하고, 에이전트가 doc-sync 패스로 끌려가고, `verified` 문서마다 `git log`를 부르는 드리프트 스캔이 다시 열린다. 그 값은 인수인계를 앞두면 옳고, 평범한 화요일 오후에는 쓸모없다.

1.30.0은 기존 엔진 위에 `governance.mode`라는 정책 레벨을 얹는다. `lite`, `standard`, `strict` 셋이다. 프로젝트 템플릿 세 종이 아니다. 세 레벨은 위키 레이아웃과 frontmatter 계약, 명령 표면, finding 레지스트리를 그대로 공유하고, 저장소는 제자리에서 언제든 레벨을 옮긴다. 그리고 주로 지원하려는 경로는 몇 달을 `lite`로 지내다가 누군가 떠나는 주에 `strict`로 올리는 것이다.

- **모드는 엔진이 이미 갖고 있던 어휘로 표현된다.** 각 레벨은 rule-id에서 severity로 가는 바닥값을 기여한다. `rules`가 받는 것과 같은 토글이고 `rulesPreset`이 묶는 것과 같은 것이며, 둘 아래에 키 단위로 깔린다. 즉 mode floor보다 `rulesPreset`이, 그보다 명시한 `rules`가 우선한다. 모드가 다르게 게이트하기 위해 새로 발명해야 했던 것이 하나도 없고, 그래서 `src/governance.js`는 프레임워크가 아니라 I/O 없는 leaf 모듈이다. 대안이었던 방식, 그러니까 모든 명령 안에 `if (mode === "lite")`를 심는 것이야말로 이 기능이 없애려는 유지보수 비용 그 자체다.
- **`strict`의 rule floor가 비어 있다는 것이 곧 마이그레이션 보증이다.** 레지스트리의 기본 severity가 이미 strict 베이스라인이므로, `governance` 블록이 없는 프로젝트는 `strict`로 해소되고 1.29.5와 바이트 단위로 같게 동작한다. 새 프로젝트 기본값(`lite`)은 의도적으로 별개의 질문이다. `init`이 근거를 보고 해소한다. 명시한 `--mode`가 있으면 그것을, 없으면 기록된 모드를, 그것도 없으면 이 저장소에 이미 설정이나 위키가 있는지를 본다. 기존 프로젝트의 게이트를 조용히 완화하는 것은 기본값의 옷을 입은 breaking change였을 것이다.
- **`lite`는 억제가 아니라 구조로 가볍다.** 코어 문서 집합만 계획하므로 `structure.required_doc`이 프로필 문서에 대해 발화를 멈춘다. 애초에 기대한 적이 없기 때문이다. 그리고 유일한 산출이 꺼진 규칙인 스캔 두 종은 돌린 뒤 걸러내는 대신 아예 건너뛴다. 이 절감은 유효 rule map을 읽으므로, 모드를 전혀 도입하지 않고 규칙을 손으로 끈 프로젝트도 같은 절감을 얻는다.
- **승격과 감사를 일부러 별개 명령으로 뒀다.** `mode set strict --write`는 설정 키 하나를 쓰고 스캔을 하지 않는다. 비싼 재구성은 요청받았을 때 `backfill`이 한다. 숨은 비싼 작업을 피해야 할 실패 양식으로 못박았고, 모드 변경이 finding을 하나도 내지 않는다는 테스트가 이를 고정한다.
- **`backfill`은 저장소가 증명할 수 있는 것을 복구하고, 나머지를 지어내기를 거부한다.** 이 명령이 방어해야 했던 유혹은 실재한다. 인수인계용으로 프로젝트 지식을 재구성하라고 시키면 에이전트는 아키텍처가 왜 이렇게 됐는지에 대한 유창한 설명을 기꺼이 만들어 내는데, 그중 검증 가능한 것은 하나도 없다. 그래서 CLI는 산문을 전혀 조립하지 않는다. 측정하고, 모든 사실에 verified·inferred·unknown 라벨을 달고, `unknown` 목록을 산출물로 취급한다. ADR도 없고 스스로 설명한 커밋도 없는 곳에서 "왜 이걸 골랐나"는 `unknown`으로 남아 떠나는 유지보수자에게 물을 질문이 되고, `decision_history` 준비도 체크는 자기 문장으로 텍스트를 생성해서는 닫을 수 없다고 말한다.
- **프롬프트가 세 번째 레버를 담는다.** `contextBudget`이 얼마나 읽을지를 묶었고, `delegationPolicy`가 누가 읽을지를 정했고, `governanceBudget`이 문서 작업을 할 것인지를 정한다. 절감이 아니라 비용으로 정직하게 적는다. 이 블록은 1130 토큰 남짓인 쓰기 프롬프트에 추정 173~234 토큰(`chars/4` 프록시)을 더하고 이는 15~21% 증가인데, 그것이 doc-sync 패스를 없애서 값을 하는지는 측정하지 않았다. 이 저장소는 측정하지 않은 절감을 주장하지 않는다.

**MINOR로 판정했다.** 새 명령 둘(`mode`, `backfill`), 새 옵션 하나(`--mode`), 새 태스크 프롬프트와 스킬 하나(`backfill`), 새 MCP 툴 하나(`mode`, 읽기 전용), 새 명령에서만 발화하는 새 finding 규칙 셋, 그리고 부가적인 JSON 필드가 늘었을 뿐, 설정이나 위키가 있는 프로젝트에서는 기존 명령의 finding도 exit code도 문서 집합도 하나 바뀌지 않는다. 테스트는 43건 늘어 522건에서 565건이 됐고 `skipped`는 0이다. 여기에는 lite에서 시작해 드리프트를 만들고 strict로 올린 뒤 backfill과 handoff까지 가는 전체 시나리오를 실제 git 저장소에 대고 돌리는 end-to-end 수락 픽스처가 들어 있다.

## 출시 계획 (post-1.30.1): 게이트와 리포트와 문서가 같은 말을 하게 한다 — **1.31.0으로 출시 (2026-09-08)**

1.30.0은 제품에 정책 레벨 셋을 줬다. 그런데 제품에게 그 레벨을 다 가르치지는 못했고, 출하 지면을 감사해 보니 그 공백이 세 곳에서 동시에 나왔다. 레벨을 무시하는 게이트(`drift`), `mode`라는 단어를 다른 뜻으로 쓰는 리포트, 그리고 모드 이전의 동작을 설명하는 문서였다. 그와 함께 하네스 거버넌스 실행에서 측정된 결함 4건이 아직 열려 있었고, 그중 하나 — 해소 경로가 없는 `harness-health` finding 9건 — 은 너무 오래 열려 있어서 풍경처럼 취급되고 있었다.

이 릴리스를 묶는 원칙은 하나다. 거버넌스 도구가 자기 문서 드리프트를 못 고친 채로 남의 문서 드리프트를 지적할 자격은 없다.

- **모드가 마지막까지 그것을 무시하던 게이트에 닿았다.** `drift`가 이제 1.30.0부터 `audit`·`validate`가 해 온 대로 실효 rule map을 보고, findings를 `applyRuleConfig`로 통과시킨다. 그 전에는 `lite`인 프로젝트에서 `drift --strict`가 자기 모드가 꺼 둔 규칙으로 빌드를 실패시킬 수 있었고, `drift --downgrade`가 그 규칙 때문에 문서를 되돌렸다.
- **리포트가 어떤 정책으로 돌았는지 말한다.** `mode: strict`는 "`--strict`를 줬다"는 뜻이었는데, 1.30.0부터 같은 이름의 거버넌스 레벨과 충돌한다. 네 지면이 이제 `strict:`와 `governance_mode:`를 따로 찍고, `drift`는 `evidence.stale`을 스캔했는지 자체를 말한다 — `lite`에서 초록으로 끝난 실행을 신선함으로 읽을 수 없게.
- **N-8 종결: 디렉터리 앵커가 `impact`에서 발화한다.** reverse-impact 스캔이 정확한 문자열을 비교하는데 git은 파일을 열거하므로, 디렉터리를 인용한 문서는 한 번도 지목되지 않았다 — 이 제품이 존재하는 이유인 게이트에서의 위음성이고, 날짜 앵커 스캔은 같은 편집에 발화하고 있었다. **게이트가 더 엄격해지고 지금까지 통과하던 빌드를 새로 실패시킬 수 있다.** 되돌리는 설정 경로는 그대로다.
- **N-9는 강제하지 않고 보고하며, 그 이유를 기록했다.** 검토 스탬프만으로 `impact`의 자기제외 조건이 충족되므로, PR 범위 안의 무관한 `review --approve-all` 한 번이 그것이 스탬프한 문서 전부를 면제시킨다. 새 `stamp_only_exclusions`가 그 문서들을 이름으로 알려 주고 exit code는 절대 움직이지 않는다 — 같은 자기제외가 문서화된 해소 경로가 finding을 지우는 방식이기도 해서, 강제하면 실제 드리프트를 해소할 수 없게 되기 때문이다(N-11). 둘을 함께 닫으려면 "재확인이란 무엇인가"에 대한 결정이 필요하고, 그 결정은 이제 스캔 안에 암묵적으로 있는 대신 `GATE_REVIEW.md`에 미결로 있다.
- **N-7은 다시 검토해 이전 결론을 뒤집었다.** 좁히기 조건이 깨졌다고 기록돼 있었다(라인 범위 앵커 58/58 가려짐). 그건 공표된 계약이다. `source_files`가 넓은 앵커이고 `evidence`가 정밀 앵커이며, 파일을 `evidence`에**만** 라인 범위로 인용하면 이미 drift가 좁혀진다 — 픽스처로 확인했다. `source_files`의 로케이터를 정밀 앵커로 읽는 구현을 했다가 되돌렸다. 도입처에서는 넓게 써 둔 앵커를 조용히 좁히게 되고, 위음성은 신선도 수정이 움직여선 안 되는 방향이기 때문이다. 남는 것은 발견 가능성의 공백이고 문서에서 메꿨다.
- **해소 경로가 없던 finding 9건이 0이 됐다.** `init --refresh`가 본문만 비교해서, 본문이 현재 생성기와 같은 산출물은 낡은 마커를 영원히 갖고 `harness-health`는 그것을 영원히 보고했다. 이제 `--refresh`가 그 경우를 다시 스탬프한다(그리고 "refreshed"가 아니라 "re-stamped"라고 말한다). 남은 한 건 — 이 저장소 자신의 `AGENTS.md`가 adapter v1에 머물러 있고 `CLAUDE.md`는 v2였던 것 — 은 실재하는 문제였다. 1.27.2의 locate-before-reading 규율이 없는 그 이전 지침을, 그것을 출하한 바로 그 저장소가 Codex에게 건네고 있었다.
- **config 지면이 CLI의 어휘를 갖게 됐다.** `llm-wiki.config.json`의 `type`과 `agents`가 이제 `--type`·`--agent`가 쓰는 같은 목록으로 검증되고, `all`이 양쪽 경로에서 펼쳐진다. 설정 하나가 서로 다른 답 둘로 해소되는 것은 CLI·프로그래매틱 API·MCP가 같은 effective options를 계산한다는 문서화된 약속과 어긋난다. **이것도 지금까지 통과하던 빌드를 새로 실패시킬 수 있다.** 이미 틀려 있던 설정에 대해서다.
- **기록 없이 출하돼 있던 결정 4건을 기록했다.** 1.29.2 `delegationPolicy`의 **음성** 측정 결과 — A/B 실행에서 절감이 검출되지 않았다 — 까지 포함해서다. 성공만 담는 결정 기록은 마케팅 문서다.

**MINOR로 판정하고 예외 2건을 이름 붙였다.** 1.28.0과 같은 처리다. 리포트 키 2개와 help 절 1개가 늘고, 새 명령도 제거된 옵션도 없지만, 조용히 틀린 답을 소리 내어 맞는 답으로 바꾸는 변경 둘이 지금까지 통과하던 빌드를 실패시킬 수 있다. 테스트는 568건에서 579건이 됐고, RED는 파일 단위 실패가 아니라 테스트별로 확인했다.

## 비목표 (안전 원칙은 바뀌지 않는다)

- `--write`나 `--apply`를 명시적으로 주지 않으면 쓰지 않는다. 어디서나 미리보기가 먼저다.
- `log.md`와 기존 adapter 파일은 절대 덮어쓰지 않는다. 민감정보 raw value는 절대 기록하지 않는다.
- core CLI에 런타임 서드파티 의존성을 두지 않는다.
- AI나 CLI가 작성한 문서는 사람이 검증하기 전까지 `needs_review`로 남는다.
