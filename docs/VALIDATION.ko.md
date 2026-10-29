> Language: [English](./VALIDATION.md) | [한국어](./VALIDATION.ko.md)

# 검증: 무엇을 보였고, 어떻게 재현하며, 무엇을 아직 못 보였나

이 문서는 `llm-wiki-governance`를 자기 위키 밖에서 무엇에 대해 확인했는지, 각 확인을 재현하는 정확한 명령, 그리고 아직 근거가 **없는** 주장을 적습니다. 1.40.0(2026-10-28) 시점에 한 대의 기계에서 돌린 결과로 썼고, 아래 근거 라벨이 어떤 주장은 실행했고 어떤 주장은 기록만 있는지 구분합니다.

## 근거 라벨

| 라벨 | 뜻 |
| --- | --- |
| **Verified** | 이 문서를 위해 실행했고 결과를 적었습니다. |
| **Recorded** | 이전 릴리스·CI·벤치마크에 기록이 있지만 이번에 다시 돌리지 않았습니다. |
| **Inferred** | 코드나 검증된 결과에서 따라 나오지만 직접 실행하지 않았습니다. |
| **Proposed** | 구현하거나 측정하지 않았습니다. |
| **Unknown** | 어느 쪽 근거도 없습니다. |

이번 실행 환경은 Windows 11, Node.js 22.14.0, git 2.39.2입니다. 그 뒤 CI 매트릭스(Ubuntu·Windows·macOS × Node 18.18/20/22/24)가 PR #8의 커밋 `4c37b20`에서 같은 테스트를 돌렸습니다(2026-10-28). 12개 잡이 모두 통과했고, governance gate와 Ubuntu·Windows의 consumer install도 통과했습니다. 이것은 이 문서를 위해 돌린 실행이 아니라 **Recorded** CI 결과입니다. 워크스루는 `npm test` 안에서 돌기 때문에 그 매트릭스의 모든 플랫폼에서 돌았습니다.

## 전부 재현하기

필요한 것은 Node.js 18.18 이상과 git입니다. `npm install`, 모델, API 키는 필요 없습니다.

```console
git clone https://github.com/Dowon-Kim7949/llm-wiki-governance.git
cd llm-wiki-governance
npm test                      # 아래 검사 전부(워크스루 네 개 포함)
node examples/greenfield-vue-demo/scripts/demo.mjs walkthrough
node examples/vue3-typescript-demo/scripts/demo.mjs walkthrough
node examples/python-fastapi-brownfield/scripts/walkthrough.mjs
node examples/react-node-fullstack/scripts/walkthrough.mjs
```

워크스루는 각자 임시 git 저장소에서 돌고, 명령마다 실제 출력을 보여 주고, PASS/FAIL 표로 끝난 뒤 저장소를 지웁니다(`--keep`이면 남깁니다). 기대 결과는 `All N checks passed.`와 종료 코드 0입니다.

## 깨끗한 환경에서 재현(Verified)

위 실행은 체크아웃 안의 `bin/llm-wiki.js`를 씁니다. 사용자가 실제로 설치하는 패키지도 따로 확인했습니다. `npm pack`(파일 69개, 325,944바이트)으로 만든 tarball을 저장소 밖 새 프로젝트에 설치했습니다. 이때 `HOME`, npm 캐시, npm 설정은 비웠고, git 전역·시스템 설정은 쓰지 않았습니다. 설치한 사본으로 확인한 결과는 이렇습니다.

- `--version`은 `1.40.0`을 출력했고, 설치된 패키지에 선언된 의존성이 없습니다.
- README의 Quick Start가 적힌 그대로 돌았습니다. 기존 프로젝트에서는 `quickstart --write --type frontend --agent claude`를, 빈 저장소에서는 `quickstart --write --greenfield`를 실행했고, 이어서 `validate`, `review`, `status`, `next`, `stats`, `explain`을 실행했습니다. 모두 종료 코드 0이었습니다.
- 워크스루 네 개를 저장소 밖으로 복사한 `examples/`에서, 설치한 패키지를 `--cli`로 지정해 돌렸고 모두 통과했습니다.

다음 검사는 이 도구가 아니라 예제 애플리케이션을 시험하는 것이라 따로 둡니다.

- FastAPI 소스의 `python -I -m py_compile`
- Express 서버의 `node --check`
- greenfield 구현 자체의 테스트(`node --experimental-strip-types --test`, 4개 통과)
- Vue 데모의 `npm run build`(`vue-tsc`와 `vite build`). 이 빌드는 새로 설치하지 않고 예제에 이미 설치된 의존성을 썼습니다.

FastAPI, Express, React 앱은 한 번도 띄우지 않았습니다.

Windows 11 / Node.js 22.14.0에서만 돌렸습니다. 사람이 README를 따라 한 것이 아니라 자동화한 재현입니다([사용성](#사용성) 참고).

## 스택별 검증 현황

| 스택 | 확인 방법 | 상태 |
| --- | --- | --- |
| Vue 3 + TypeScript, 새 프로젝트(greenfield) | `examples/greenfield-vue-demo`, 검사 23개: 빈 저장소 → 계획 → 승인 → 구현 → 근거 연결 → 코드 변경 지목 → 요구사항 변경 시 연결 파일 나열 → 깨끗한 최종 상태 | **Verified**(스크립트로 처음부터 끝까지) |
| Vue 3 + TypeScript, 기존 코드(brownfield) | `examples/vue3-typescript-demo`(`tests/vue-demo-walkthrough.test.js`) | **Verified**(스크립트로 처음부터 끝까지) |
| Python / FastAPI, 기존 코드 | `examples/python-fastapi-brownfield`, 검사 21개: `pyproject.toml`로 감지, 에이전트 어댑터, 지어낸 인용 탐지, 검색, `impact`, `drift`의 두 경우 | **Verified**(스크립트로 처음부터 끝까지. Python 자체는 실행하지 않음) |
| React + Node(Express), npm workspaces, 공유 API 계약 | `examples/react-node-fullstack`, 검사 15개: workspace 힌트, `--type fullstack`, 계약 변경 하나가 문서 셋을 지목, 한쪽 변경은 그쪽만 지목 | `--type fullstack`을 명시했을 때 **Verified**. 감지만으로는 `unknown` |
| Go, Rust, JVM, PHP, Ruby, .NET | 감지 단위 테스트(`tests/verification.test.js`) | **부분**: 감지만, 처음부터 끝까지는 안 돌림 |
| Flutter, Android, iOS, React Native | 감지 단위 테스트, Flutter `init --write` 테스트 하나 | **부분**: 감지와 init만 |
| Terraform, Docker, Helm, Kubernetes | 감지 단위 테스트(`infra`) | **부분**: 감지만 |
| Svelte / SvelteKit | `svelte`가 프론트엔드 신호일 뿐, 그 밖에는 없음 | **Unknown** |
| pnpm workspaces | 파싱하지 않음(YAML은 의존성이 필요). `monorepo`가 미지원으로 보고 | **미지원** |

매니페스트를 알아본다고 그 프레임워크를 지원한다는 뜻은 아닙니다. 위 스택은 모두 같은 장치를 씁니다. 문서가 파일, 줄 범위, 마크다운 섹션, 이름을 인용합니다. `#symbol:`은 파일이 그 이름을 언급하는지만 봅니다. 어떤 언어도 파싱하지 않으므로, 주석에만 나오는 Python 함수 이름을 인용해도 해석됩니다.

## 검사가 보여 주는 것(Verified)

- **코드가 생기기 전에 프로젝트를 시작할 수 있습니다.** `init --greenfield`는 없는 소스를 지어내지 않고, 연결된 것이 없는 승인 요구사항은 `info`(`evidence.planned_unlinked`)이지 "구현됨"이 아닙니다.
- **계획된 지식이 소스 기반 지식이 됩니다.** 요구사항이 구현 파일과 테스트를 인용하면 그때부터 같은 `validate`·`impact`·`drift`가 감시합니다.
- **잘못된 근거를 잡습니다.** 없는 함수를 인용하면 `validate --strict`가 실패합니다(Python 워크스루 4단계).
- **소스 변경은 그것을 인용한 문서만 찾아냅니다.** `impact`가 인용 파일이 바뀐 문서만 지목합니다(워크스루 네 개 모두).
- **요구사항 변경은 연결된 파일을 찾아냅니다**(1.39.0, `impact.plan_changed`). 코드가 요구사항과 함께 바뀐 경우와 그렇지 않은 경우 모두입니다(greenfield 7~8단계).
- **변경 하나가 여러 문서에 걸칠 수 있고**, 한쪽만 바뀌면 그쪽 문서만 걸립니다(풀스택 4~6단계).
- **CI 동작은 거버넌스 모드를 따릅니다.** `impact.source_changed`는 lite에서 꺼짐, standard에서 warning, strict에서 error입니다(`tests/governance-modes.test.js`. 1.30.0부터 Recorded이고 `npm test`에서 다시 돕니다).
- **모든 finding에는 문서화된 해소 방법이 있습니다.** 다시 읽고 다시 승인하거나 `drift --downgrade`입니다(각 워크스루가 자기가 낸 finding을 해소합니다).
- **읽기 전용 MCP 서버와 프로그래밍 API는 git이 옵션이나 경로로 읽을 `since`를 거부합니다**(1.40.0, `tests/git-revision-guard.test.js`). 가드를 빼면 테스트 7개 중 5개가 실패합니다. 어느 테스트도 임시 저장소 밖에 쓰지 않습니다.

## 검사가 보여 주지 않는 것(이것도 Verified, 한계로서)

- **해석되는 인용이 문장을 참으로 만들지 않습니다.** Python 워크스루는 코드가 20%인데 문서의 "20%"를 "25%"로 바꿉니다. `validate --strict`가 통과합니다(10단계).
- **승인된 요구사항은 구현된 요구사항이 아니고**, 연결된 파일은 수용 기준이 성립한다는 증거가 아닙니다. 어떤 명령도 프로젝트 테스트를 돌리지 않습니다.
- **요구사항과 같은 diff에서 바뀐 파일이 그 변경을 구현했다는 증거도 아닙니다.** greenfield 7단계는 그런 파일을 `changed`로 표시할 뿐입니다.
- **날짜 기준 drift에는 경계 사례가 있습니다.** 검토한 날 커밋한 변경은 보고하지 않습니다(Python 8단계). 늦은 머지 뒤 그 파일에 다른 커밋이 없으면 아예 보지 못합니다(N-15, `tests/known-gaps.test.js` GAP 5). 머지 전에 검토한 브랜치를 squash나 rebase로 머지하면 과하게 보고합니다. 검토 브랜치를 검토 당일에 squash나 rebase하면, 그 브랜치가 얹힌 변경까지 검토한 것으로 봅니다(`tests/drift-narrowing-baseline.test.js`). git 이력은 검토자가 무엇을 봤는지 알려 주지 못합니다.
- **에이전트가 승인한 문서는 사람이 검토한 문서가 아닙니다.** `reviewed_by`는 `review --approve`에 준 이름을 기록할 뿐입니다. 이 저장소 자신의 위키는 기록된 유지보수자 결정(`AGENTS.md`)에 따라 에이전트가 승인하며, 도입처에 권하는 정책이 아닙니다.
- **CLI 결과가 깨끗하다고 애플리케이션 테스트를 대신하지 않습니다.** 워크스루는 애플리케이션을 실행하지 않습니다.

## 공개 주장과 그 근거

README의 각 주장이 무엇에 기대는지 정리했습니다. 근거가 여러 개면, 그 주장의 강도는 가장 약한 근거만큼입니다.

| 주장 | 근거 | 근거 내용과 한계 |
| --- | --- | --- |
| 런타임 의존성 없음 | 실행 | 패키지한 tarball을 깨끗한 환경에 설치했고 `dependencies`가 비어 있습니다 |
| Node.js ≥ 18.18, Windows·macOS·Linux | CI 기록 | PR #8(`4c37b20`)에서 12개 잡 모두 통과. OS 셋 × Node 18.18/20/22/24 |
| Node·Python·Go·Rust·JVM·PHP·Ruby·.NET·모바일·인프라 감지 | 실행한 테스트. Vue·Python·React + Node는 스크립트 워크스루도 있음 | 감지는 프레임워크 지원이 아닙니다(위 스택 표) |
| 에이전트 여섯 종의 어댑터 제공 | 실행한 테스트 | 파일이 생성되고 위키를 가리키는지까지 확인했습니다 |
| 에이전트가 그 어댑터와 스킬을 따른다 | **검증하지 않음** | 모델을 돌리지 않았습니다 |
| 각 인용이 해석되는지 검사한다 | 실행한 테스트, 스크립트 워크스루 | 인용이 해석된다고 문장이 참이 되지는 않습니다 |
| 인용 소스가 바뀐 문서를 `drift`·`impact`가 지목한다 | 실행한 테스트, 스크립트 워크스루 | 지목은 "틀렸다"가 아니라 "다시 읽어라"입니다. 날짜 검사에는 위 한계가 있습니다 |
| 승인한 요구사항은 계획이지 구현이 아니다 | 실행한 테스트, 스크립트 워크스루 | `impact.plan_changed`는 파일을 나열할 뿐 판정하지 않습니다 |
| 모든 MCP 툴은 읽기 전용이다 | 실행한 테스트(1.40.0) | 1.40.0 전에는 사실이 아니었습니다([GHSA-qwp4-w8vx-r72r](https://github.com/Dowon-Kim7949/llm-wiki-governance/security/advisories/GHSA-qwp4-w8vx-r72r)). `cwd`는 샌드박스가 아닙니다([SECURITY.ko.md](../.github/SECURITY.ko.md#mcp-서버-신뢰-모델)) |
| 키워드 검색 hit@5 85.0% | 이 저장소 자신의 위키에서 실행 | 한 코퍼스의 held-out 질의 결과입니다. 일반적인 정확도 수치가 아닙니다 |
| 보강하지 않은 위키가 위키 없음보다 나빴다 | 실제 모델 실행, 기록 | 외부 저장소 하나, 모델 하나, 과제 여섯 개입니다([BENCHMARK_DISCLOSURE.ko.md](./BENCHMARK_DISCLOSURE.ko.md)) |
| 개발 시간을 줄이거나 환각을 줄인다 | **검증하지 않음** | 측정하지 않았습니다 |
| 처음 보는 사람이 README만으로 도입할 수 있다 | **검증하지 않음** | 자동화 재현뿐이고, 독립 개발자는 아직 없습니다 |

## AI 에이전트 연동

- **Verified(결정적 검사):** `init --agent claude --agent codex`가 `CLAUDE.md`, `AGENTS.md`, `.claude/skills/…`, `.agents/skills/…`를 쓰고 모두 `docs/llm-wiki/index.md`를 가리킵니다(Python 워크스루 2단계). 프롬프트 생성과 스킬 내용은 `tests/prompt-*.test.js`, `tests/skill-token-budget.test.js`, `tests/shipped-assets.test.js`가 다룹니다.
- **검증하지 않음:** 에이전트가 그 지시를 실제로 따르는지. 이 문서를 위해 모델을 돌리지 않았습니다. 한 번 실행한 일화를 위해 구독 사용량을 쓰지 않기로 한 결정입니다.

## 효과

- **Recorded(다시 돌리지 않음):** `bench/`의 이전 유료 벤치마크가 위키가 있을 때와 없을 때의 토큰 사용량과 답변 품질을 쟀습니다. 한계는 [`BENCHMARK_DISCLOSURE.ko.md`](./BENCHMARK_DISCLOSURE.ko.md)와 결과 자체에 있습니다(대상 하나, 에이전트 채점에 사람 표본 확인, 토큰은 근사치). 이 도구가 결함을 줄이거나 개발자 시간을 아낀다는 것을 보이지는 않습니다.
- **측정하지 않음:** 작업 완료율, 회귀, 검토 노력, 문서 수리 노력, 실제 팀에서 아낀 시간.
- **제안하는 프로토콜(예산이 생기면):**
  - *설정:* 고정한 커밋의 같은 저장소에서 같은 코딩 과제를 돌립니다. 비교군은 위키 없음, 일부러 낡게 둔 위키, 관리된 위키 셋입니다. 비교군마다 에이전트 설정은 하나로 고정하고 도구 접근은 서로 격리합니다. 과제와 완료 기준은 실행 전에 씁니다.
  - *채점:* 가능한 곳에서는 프로젝트 자체 테스트가 완료를 판정합니다. 나머지는 미리 쓴 채점 기준으로, 다른 계열의 모델과 사람 표본이 비교군을 모른 채 채점합니다.
  - *보고:* 완료율, 맞는 파일을 찾았는지, 테스트가 잡은 회귀, 에이전트 설명에 들어간 틀린 주장의 비율, 경과 시간, 근사치가 아니라 API가 돌려준 호출별 토큰 수를 보고합니다. 위키를 최신으로 유지하는 데 든 시간도 보고합니다. 유지 비용이 아끼는 비용보다 크면 그것은 부정적인 결과입니다.
  - *회계:* 구독형 CLI로는 호출별 사용량을 얻을 수 없고 비교군끼리 격리되지도 않습니다. 비용에 관한 주장은 API로 돌린 실행만 뒷받침할 수 있습니다. 홍보용 숫자를 만들려고 돌리는 실행은 하지 않습니다.

## 사용성

- **스크립트로만 확인했습니다.** 위 명령은 모두 스크립트나 유지보수자의 에이전트가 돌렸습니다. **이 문서를 위해 README를 따라 해 본 독립 개발자는 없습니다.** 처음 보는 사람이 도움 없이 설치하고 이해하고 검증할 수 있는지는 **Unknown**입니다.
- **프로토콜은 준비했고, 아직 돌리지 않았습니다.** [`USABILITY_PROTOCOL.ko.md`](./USABILITY_PROTOCOL.ko.md)는 이 프로젝트를 처음 보는 개발자와 1시간 동안 진행하는 세션입니다. greenfield 과제와 brownfield 과제, 체크리스트, 기록할 항목을 담았습니다. 결과는 실제 세션에서 나온 것만 여기에 더합니다.
- **유지보수자 쪽 첫 실행 점검(2026-10-29), 독립 점검 아님.** 유지보수자의 에이전트가 새 샘플 프로젝트에서 배포된 1.41.0의 README를 따라 했습니다. 발견한 것은 네 가지입니다. 새 프로젝트의 변경 점검이 아무 안내 없이 꺼져 있었습니다. CLI가 승인 명령을 말하지 않으면서 승인을 사람 전용으로 설명했습니다. 직접 쓰는 사람을 위한 안내가 없었습니다. 출력의 `llm-wiki` 명령 이름은 그대로 입력하면 실행되지 않았습니다. 1.42.0이 각각을 고쳤습니다. 도구를 만든 쪽이 한 휴리스틱 점검이므로 위의 **Unknown** 판정은 바뀌지 않습니다.

### 자발적 첫 사용 보고

[첫 사용 이슈 양식](https://github.com/Dowon-Kim7949/llm-wiki-governance/issues/new?template=first_run.yml)으로 들어온 보고를 날짜, 플랫폼, 막힌 단계, 조치(수정 / 이슈로 추적 / 변경 없음 결정)만 적어 여기에 모읍니다. 보고자는 식별하지 않습니다. 관찰한 세션이 아니라 자가 보고이므로 위 프로토콜과 따로 두고, 이것만으로 사용성 판정을 바꾸지 않습니다.

| 날짜 | 플랫폼 | 막힌 곳 | 조치 |
| --- | --- | --- | --- |
| 아직 없음 | | | |
