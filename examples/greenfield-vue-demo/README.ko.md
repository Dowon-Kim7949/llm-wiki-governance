# Greenfield 데모: 코드보다 위키가 먼저 시작한다

Language: [English](./README.md) | **한국어**

**코드가 아직 없는** 프로젝트를 실행해 보는 시나리오입니다. 진행 순서는 이렇습니다.

1. 빈 저장소에서 계획(요구사항, 수용 기준, 아키텍처 결정 하나)을 기록하고 승인합니다.
2. 작은 Vue 3 + TypeScript 앱으로 요구사항 하나를 구현하고, 그 코드와 테스트를 요구사항에 연결합니다.
3. 코드를 바꾸면 `impact`가 다시 검토할 요구사항을 지목합니다.

[Vue 3 데모](../vue3-typescript-demo/README.ko.md)는 이 데모의 Brownfield 판입니다. 그쪽은 앱이 먼저 있고 위키를 앱에서 써 냅니다. 두 데모는 아래 5단계에서 만나고, 그 뒤로는 같은 근거 기반 위키입니다.

> `--greenfield`는 아직 배포된 릴리스에 없습니다. 워크스루는 이 체크아웃에서 실행하세요. 스크립트가 `examples/` 옆의 `bin/llm-wiki.js`를 알아서 찾습니다.

## 실행

```console
node examples/greenfield-vue-demo/scripts/demo.mjs walkthrough
```

- 임시 git 저장소에서 돌고, 각 명령의 실제 출력을 보여 준 뒤 PASS/FAIL 표로 끝납니다.
- 검사는 20개입니다. Node 22.6 미만에서는 18개입니다. 의존성 없이는 앱의 TypeScript 테스트를 돌릴 수 없어서 "통과"가 아니라 "건너뜀"으로 표시합니다.
- 옵션: `--full`은 출력 전체, `--keep`은 저장소 보존, `--cli <path>`는 다른 CLI 지정입니다.
- 필요한 것은 Node.js 18.18 이상과 git이고, 모델이나 API 키는 쓰지 않습니다.

## 실제로 실행하는 것과 미리 만들어 둔 것

| 단계 | 하는 일 | 실제 / 미리 만든 것 |
| --- | --- | --- |
| 1 | 빈 저장소(README 하나뿐) | 실제 |
| 2 | `init --write --greenfield`, `handoff --greenfield`, `validate --strict` | 실제 CLI |
| 3 | 계획: project profile, REQ-001, REQ-002(보류), ADR-0001 | [`planning/`](./planning/)에 **미리 작성**. 실제 프로젝트에서는 `handoff --greenfield`가 출력하는 프롬프트로 에이전트가 사용자의 말을 받아 초안을 씁니다 |
| 3 | `review --approve`. `--reviewer "Demo Reviewer"`가 프로젝트 소유자를 대신합니다 | 실제 CLI |
| 4 | REQ-001 구현 | [`implementation/`](./implementation/)에 **미리 작성**. 테스트는 Node 22.6 이상에서 실제로 돌립니다 |
| 5 | 코드와 테스트를 REQ-001·ADR-0001에 연결 | [`linking/`](./linking/)에 **미리 작성** |
| 5-8 | `validate`, `review`, `stats`, `search-docs`, `impact` | 실제 CLI |
| 6-7 | 코드 변경과 요구사항 수정 | 스크립트 편집(`scripts/demo.mjs`) |

## 단계

1. **빈 상태에서 시작합니다.** 매니페스트도 코드도 없고, 인용할 것도 없습니다.
2. **신규 프로젝트로 초기화합니다.** `init --write --greenfield`가 `requirements/00_overview.md`, 요구사항 템플릿, ADR 형식의 결정 템플릿을 추가합니다. 생성 문서는 소스를 인용하지 않습니다. 인용할 소스가 없기 때문입니다(예전 `init`은 없는 `package.json`을 인용했습니다). `validate --strict`가 통과합니다.
3. **계획을 기록하고 승인합니다.** 요구사항 승인은 계획 승인입니다.
   - `validate`는 연결된 근거가 없는 승인 계획을 `evidence.planned_unlinked`로 보고합니다.
   - 이것은 **info**입니다. 사실을 알리지만 빌드를 실패시키지 않고, "구현됨"이라고 말하지도 않습니다.
   - `stats`는 `planned_knowledge: 3 (approved 3); implementation evidence linked 0, unresolved 0, none 3`을 보여 줍니다.
4. **REQ-001을 구현합니다.** 규칙은 `src/domain/approval.ts`에 있고, `tests/approval.test.ts`가 수용 기준마다 테스트를 하나씩 둡니다.
5. **구현을 연결합니다.**
   - REQ-001은 frontmatter `evidence`에 함수들과 테스트 파일을 인용합니다.
   - ADR-0001은 모듈 머리 주석을 줄 범위로 인용합니다.
   - `validate`가 참조가 실제로 있는지 확인하고, 소유자가 다시 승인합니다. `stats`는 이제 `linked 2 ... none 1`입니다.
   - REQ-002는 보류된 요구사항이라 연결 없는 승인 계획으로 남습니다.
   - 끝으로 config에서 `impact.source_changed`를 켭니다(`mode set standard --write`로 켜면 warning으로 켜집니다).
6. **코드를 바꿉니다.** 새 규칙은 "작업을 요청한 사람은 그 작업을 승인할 수 없다"입니다.
   - `impact --since HEAD`가 exit 1로 끝나고 REQ-001만 지목합니다.
   - ADR-0001은 인용한 머리 줄이 바뀌지 않아 줄 범위로 축소되고, REQ-002는 코드를 인용하지 않습니다.
7. **요구사항을 고치고 다시 검토합니다.** AC-5를 추가하고 승인하면 `impact`가 작업 트리와 커밋 양쪽에서 통과합니다.
8. **최종 상태입니다.** `validate --strict`가 통과합니다. 남는 것은 보류된 REQ-002에 대한 info 한 줄뿐입니다.

단계를 손으로 따라가려면 이 체크아웃 밖에 빈 저장소를 만들고, 같은 스크립트로 편집을 하나씩 적용합니다.

```console
node examples/greenfield-vue-demo/scripts/demo.mjs workspace ~/greenfield-wiki-demo
cd ~/greenfield-wiki-demo
node <checkout>/bin/llm-wiki.js init --write --greenfield
node <checkout>/examples/greenfield-vue-demo/scripts/demo.mjs plan   # 이어서 implement, link, enable-gate, change-source, update-requirement
```

## 이 데모가 보여 주지 않는 것

- **코드가 요구사항을 충족한다는 것.** 연결된 참조는 REQ-001이 어디에 구현됐는지 보여 줄 뿐입니다. 충족 여부는 테스트가 확인하고, 그것으로 충분한지는 사람이 판단합니다. 어떤 `llm-wiki` 명령도 테스트를 돌리거나 요구사항을 판정하지 않습니다.
- **요구사항 수정이 코드를 지목하는 것.** `impact`는 코드에서 문서 방향으로만 작동합니다. 요구사항이 바뀌면 연결된 코드와 테스트는 사람이 다시 확인합니다.
- **수용 기준 단위 추적.** 근거는 문서 단위로 추적하므로 요구사항 하나에 문서 하나가 단위입니다. 문서 안의 수용 기준은 하나하나 추적하지 않습니다.
- **lite 모드 기본값.** 이 데모는 `impact.source_changed`를 손으로 켭니다. 신규 프로젝트는 lite로 시작하고, lite에서는 `impact`와 `drift`가 꺼져 있습니다.
