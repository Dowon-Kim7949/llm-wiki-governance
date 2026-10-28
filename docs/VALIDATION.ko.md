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

이번 실행 환경은 Windows 11, Node.js 22.14.0, git 2.39.2입니다. CI 매트릭스(Ubuntu·Windows·macOS × Node 18.18/20/22/24)가 모든 PR에서 같은 테스트를 돌리지만, 이 문서를 쓸 때 이 브랜치에서는 아직 돌지 않았습니다. **다른 플랫폼은 이전 릴리스에 대해서는 Recorded, 이번 릴리스에 대해서는 CI가 돌기 전까지 Unknown**입니다.

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

## 검사가 보여 주지 않는 것(이것도 Verified, 한계로서)

- **해석되는 인용이 문장을 참으로 만들지 않습니다.** Python 워크스루는 코드가 20%인데 문서의 "20%"를 "25%"로 바꿉니다. `validate --strict`가 통과합니다(10단계).
- **승인된 요구사항은 구현된 요구사항이 아니고**, 연결된 파일은 수용 기준이 성립한다는 증거가 아닙니다. 어떤 명령도 프로젝트 테스트를 돌리지 않습니다.
- **요구사항과 같은 diff에서 바뀐 파일이 그 변경을 구현했다는 증거도 아닙니다.** greenfield 7단계는 그런 파일을 `changed`로 표시할 뿐입니다.
- **날짜 기준 drift에는 경계 사례가 있습니다.** 검토한 날 커밋한 변경은 보고하지 않습니다(Python 8단계). 늦은 머지 뒤 그 파일에 다른 커밋이 없으면 아예 보지 못합니다(N-15, `tests/known-gaps.test.js` GAP 5). 머지 전에 검토한 브랜치를 squash나 rebase로 머지하면 과하게 보고합니다.
- **에이전트가 승인한 문서는 사람이 검토한 문서가 아닙니다.** `reviewed_by`는 `review --approve`에 준 이름을 기록할 뿐입니다. 이 저장소 자신의 위키는 기록된 유지보수자 결정(`AGENTS.md`)에 따라 에이전트가 승인하며, 도입처에 권하는 정책이 아닙니다.
- **CLI 결과가 깨끗하다고 애플리케이션 테스트를 대신하지 않습니다.** 워크스루는 애플리케이션을 실행하지 않습니다.

## AI 에이전트 연동

- **Verified(결정적 검사):** `init --agent claude --agent codex`가 `CLAUDE.md`, `AGENTS.md`, `.claude/skills/…`, `.agents/skills/…`를 쓰고 모두 `docs/llm-wiki/index.md`를 가리킵니다(Python 워크스루 2단계). 프롬프트 생성과 스킬 내용은 `tests/prompt-*.test.js`, `tests/skill-token-budget.test.js`, `tests/shipped-assets.test.js`가 다룹니다.
- **검증하지 않음:** 에이전트가 그 지시를 실제로 따르는지. 이 문서를 위해 모델을 돌리지 않았습니다. 한 번 실행한 일화를 위해 구독 사용량을 쓰지 않기로 한 결정입니다.

## 효과

- **Recorded(다시 돌리지 않음):** `bench/`의 이전 유료 벤치마크가 위키가 있을 때와 없을 때의 토큰 사용량과 답변 품질을 쟀습니다. 한계는 [`BENCHMARK_DISCLOSURE.ko.md`](./BENCHMARK_DISCLOSURE.ko.md)와 결과 자체에 있습니다(대상 하나, 에이전트 채점에 사람 표본 확인, 토큰은 근사치). 이 도구가 결함을 줄이거나 개발자 시간을 아낀다는 것을 보이지는 않습니다.
- **측정하지 않음:** 작업 완료율, 회귀, 검토 노력, 문서 수리 노력, 실제 팀에서 아낀 시간.
- **제안하는 프로토콜(예산이 생기면):** 같은 저장소의 같은 커밋에서 같은 코딩 과제 세트를 돌립니다. 비교군은 위키 없음, 낡은 위키, 관리된 위키 셋입니다. 비교군마다 에이전트 설정은 하나로 고정하고 도구 접근은 비교군끼리 격리합니다. 채점 기준은 실행 전에 쓰고, 다른 계열의 모델과 사람 표본이 채점합니다. 보고할 것은 완료율, 맞는 파일을 찾았는지, 프로젝트 자체 테스트가 잡은 회귀, 경과 시간, 그리고 근사치가 아니라 API가 돌려준 호출별 토큰 수입니다.

## 사용성

- **스크립트로만 확인했습니다.** 위 명령은 모두 스크립트나 유지보수자의 에이전트가 돌렸습니다. **이 문서를 위해 README를 따라 해 본 독립 개발자는 없습니다.** 처음 보는 사람이 도움 없이 설치하고 이해하고 검증할 수 있는지는 **Unknown**입니다.
