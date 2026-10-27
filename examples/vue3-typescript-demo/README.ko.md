> Language: [English](./README.md) | [한국어](./README.ko.md)

# Vue 3 + TypeScript 데모

작은 Vue 3 할 일 목록 앱과, 그 소스를 보고 쓴 프로젝트 위키, 그리고 위키를 유지할 가치가
있게 만드는 게이트 하나를 보여 줍니다. 리뷰를 마친 문서가 설명하는 코드를 PR이 바꾸면,
그 문서를 고치고 다시 리뷰할 때까지 `llm-wiki impact`가 실패합니다.

모든 과정이 로컬에서 돌아갑니다. API 키, AI 서비스, 서버, 데이터베이스가 필요 없고, 앱의
데이터는 메모리에 있는 목 데이터입니다.

## 무엇을 보게 되나

| 단계 | 명령 | 기대 결과 |
| --- | --- | --- |
| 1. 초기화 | `llm-wiki init --write` | 스캐폴드 문서 10개와 `llm-wiki.config.json`; `validate` 통과 |
| 2. 프로젝트 지식 작성 | `npm run demo:enrich` | Vue 소스를 보고 쓴 문서 2개가 스캐폴드를 대체 |
| 3. 검증과 리뷰 | `llm-wiki validate --strict`, `llm-wiki review --approve …` | finding 0건; 두 문서가 `verified`; 기준 커밋 |
| 4. 소스 변경 | `npm run demo:change-source` | 할 일 제목 상한이 80자에서 120자로 |
| 5. 문서 영향 감지 | `llm-wiki impact --since HEAD` | **exit 1**: `DOMAIN_FEATURES.md`가 바뀐 파일을 인용하는데 갱신되지 않음 |
| 6. 갱신과 재리뷰 | `npm run demo:update-doc`, `llm-wiki review --approve …` | 문서가 120자로 바뀌고 다시 `verified` |
| 7. 복구 확인 | `llm-wiki impact --since HEAD` | exit 0 |

## 준비물

- Node.js 20.19+ 또는 22.12+ (Vite 8의 요구사항입니다. `llm-wiki` CLI 자체는 18.18+에서 돕니다)
- npm, git

## 전체 시나리오를 한 번에 실행

```bash
cd examples/vue3-typescript-demo
npm install
npm run demo
```

`npm run demo`는 앱을 임시 디렉터리 아래 새 git 저장소로 복사하고, `npm install`이 설치한
`llm-wiki` CLI로 모든 단계를 그 안에서 실행해 종료 코드를 하나씩 확인한 뒤, 복사본을
지웁니다. 클론해 둔 이 저장소는 건드리지 않습니다. 마지막 출력은 다음과 같습니다.

```text
## Result
PASS  init --write                                         expected exit 0, got exit 0
...
PASS  impact detects the stale document                    expected exit 1, got exit 1
...
PASS  impact for that commit, as CI on a push sees it      expected exit 0, got exit 0

All 11 checks passed.
```

각 명령의 실제 출력은 발췌(요약, 승인, finding)로 보여 줍니다. 전체 출력은 `-- --full`,
만든 저장소를 남기려면 `-- --keep`을 붙입니다.

## 앱 실행

```bash
npm run dev      # http://localhost:5173
npm run build    # vue-tsc 타입 검사 후 vite build
```

화면에는 목 데이터 할 일 3개가 나옵니다. 할 일을 추가하면 제목 앞뒤 공백을 지우고, 빈
제목이나 80자를 넘는 제목은 거부합니다. 열린 할 일이 완료한 할 일보다 먼저 나오고, 카운터는
필터와 관계없이 열린 할 일을 셉니다. 위키가 서술하는 규칙이 바로 이것입니다.

## 단계별로 직접 따라 하기

`impact`는 git 이력을 비교하고 저장소 루트에서 실행해야 합니다. 그래서 데모를 이 저장소
밖의 별도 저장소로 복사해서 작업합니다.

```bash
npm run demo:workspace -- ~/vue3-wiki-demo   # 데모를 복사하고 첫 커밋을 만든다
cd ~/vue3-wiki-demo
npm install
```

첫 커밋은 사용자의 git 신원으로 만듭니다. git이 누구인지 묻는다면 `user.name`과
`user.email`을 먼저 설정하세요.

### 1단계 — 초기화

```bash
npx llm-wiki init --write
npx llm-wiki validate
npm run demo:enable-gate
```

`init`은 `frontend` 프로젝트로 감지하고 `docs/llm-wiki/` 아래 문서 10개를 모두
`needs_review`로 만들며, `governance.mode: lite`인 `llm-wiki.config.json`도 만듭니다.
`lite`는 문서 수를 작게 유지하고 스캐폴드를 전부 채우라고 요구하지 않으므로 `validate`가
통과합니다. 대신 `impact.source_changed`도 꺼 둡니다. `demo:enable-gate`가 이 규칙 하나만
다시 켭니다. 명시한 규칙이 모드보다 우선합니다.

```json
{
  "type": "frontend",
  "governance": {
    "mode": "lite"
  },
  "rules": {
    "impact.source_changed": "error"
  }
}
```

### 2단계 — 프로젝트 지식 작성

```bash
npm run demo:enrich
```

`enrichment/`의 문서 2개를 스캐폴드 위에 복사합니다. 실제 프로젝트에서는 사람이나 코딩
에이전트가 코드를 읽고 이 문서를 씁니다. CLI는 스캐폴드와 그 작업용 프롬프트
(`/llm-wiki-bootstrap`)를 만들 뿐, 지식 자체를 쓰지는 않습니다.

- `ARCHITECTURE_CONVENTIONS.md`는 `src/main.ts`, `src/App.vue`, 컴포넌트 2개,
  `src/types.ts`, `build` 스크립트를 인용하고 이 파일들이 따르는 규약을 적습니다.
- `DOMAIN_FEATURES.md`는 `src/stores/tasks.ts`를 인용하고
  `src/stores/tasks.ts#symbol:MAX_TITLE_LENGTH` 같은 심볼 단위 근거와 함께, 80자 제목 상한을
  포함한 할 일 규칙을 적습니다.

### 3단계 — 검증, 리뷰, 기준 커밋

```bash
npx llm-wiki validate --strict
npx llm-wiki review
npx llm-wiki review --approve docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md --approve docs/llm-wiki/DOMAIN_FEATURES.md --reviewer "Your Name"
git add -A
git commit -m "docs: LLM-WIKI baseline"
```

옵션 없는 `review`는 `needs_review` 목록을 보여 줄 뿐 아무것도 바꾸지 않습니다. 문서를
`verified`로 만드는 방법은 `--approve`뿐입니다. `reviewed_by`와 `reviewed_at`을 찍고,
차단 finding이 있는 문서는 거부합니다. `impact`가 지키는 것은 `verified` 문서뿐입니다.
나머지 스캐폴드 5개는 `needs_review`로 남는데, `lite`에서는 괜찮습니다.

### 4단계 — 소스 변경

```bash
npm run demo:change-source
```

`src/stores/tasks.ts`의 `MAX_TITLE_LENGTH`가 80에서 120으로 바뀝니다. 문서는 여전히
80이라고 말합니다.

### 5단계 — 문서 영향 감지

```bash
npx llm-wiki impact --since HEAD
```

```text
## Summary
- result: fail
...
## Documents to re-review
| Document | Changed source it cites |
| --- | --- |
| `docs/llm-wiki/DOMAIN_FEATURES.md` | `src/stores/tasks.ts` |
...
## Findings
- [error] impact.source_changed docs/llm-wiki/DOMAIN_FEATURES.md: Verified document depends on src/stores/tasks.ts, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.
```

종료 코드는 1이고, CI 잡을 실패시키는 것이 바로 이 값입니다. `ARCHITECTURE_CONVENTIONS.md`는
스토어를 인용하지 않으므로 목록에 나오지 않습니다.

### 6단계 — 문서 갱신과 재리뷰

```bash
npm run demo:update-doc
npx llm-wiki validate --strict
npx llm-wiki review --approve docs/llm-wiki/DOMAIN_FEATURES.md --reviewer "Your Name"
```

`demo:update-doc`는 사람이 할 수정을 그대로 합니다. 규칙 문장과 근거 줄을 120으로 고치고,
`status`를 `needs_review`로 되돌리고(고친 문서는 아직 리뷰 전입니다), 이유를 리뷰 노트에
남깁니다. 다시 승인하면 새 리뷰 스탬프가 찍힙니다.

### 7단계 — 복구 확인

```bash
npx llm-wiki impact --since HEAD
git add -A
git commit -m "feat: allow 120-character task titles"
```

문서가 코드와 함께 바뀌었으므로 `impact`가 exit 0으로 끝납니다. CI에서는 `HEAD` 대신 PR의
기준 브랜치와 비교합니다. 이 패키지가 배포하는 워크플로 템플릿
[`templates/github-actions/llm-wiki-validate.yml`](../../templates/github-actions/llm-wiki-validate.yml)은
`fetch-depth: 0`으로 체크아웃한 뒤 `impact --since "origin/<기준 브랜치>" --strict`를 실행합니다.

## 시나리오가 바꾸는 파일

| 파일 | 바꾸는 것 | 변경 |
| --- | --- | --- |
| `docs/llm-wiki/**` | `init --write` | 문서 10개 생성, 모두 `needs_review` |
| `llm-wiki.config.json` | `init --write`, `demo:enable-gate` | `mode: lite`로 생성, 규칙 하나 추가 |
| `docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md`, `docs/llm-wiki/DOMAIN_FEATURES.md` | `demo:enrich`, 이어서 `review --approve` | 소스 근거 내용으로 교체, `verified` 스탬프 |
| `src/stores/tasks.ts` | `demo:change-source` | `MAX_TITLE_LENGTH` 80 → 120 |
| `docs/llm-wiki/DOMAIN_FEATURES.md` | `demo:update-doc`, 이어서 `review --approve` | 규칙 문장 80 → 120, 리뷰 노트, 재스탬프 |

`demo:*` 스크립트는 파일만 고칩니다. `llm-wiki` 명령은 모두 실제 CLI입니다.

## 검사가 증명하는 것과 증명하지 않는 것

- **`validate`**는 구조를 봅니다. frontmatter, 링크, 인용한 파일의 존재, 인용한 심볼 이름이
  그 파일에 나오는지, 민감해 보이는 값.
- **`impact`**는 파일 단위, diff 기반입니다. `verified` 문서가 인용한 파일이 바뀌었는데 문서는
  그대로인 경우를 잡습니다. 변경 내용은 읽지 않습니다. 6단계에서 "120" 대신 "100"이라고
  써도 `validate --strict`, `review --approve`, `impact`가 모두 exit 0으로 끝납니다(이
  시나리오에서 직접 확인했습니다). **CLI는 문서가 사실인지 검사하지 않습니다.** 그것은
  리뷰어의 일이고, `review --approve`는 그 리뷰어가 누구였는지를 기록합니다.
- **`drift`**는 날짜 기반입니다. 인용한 소스가 문서의 리뷰 날짜 **이후에** 커밋된 `verified`
  문서를 지목합니다. `lite`에서는 꺼져 있습니다. 이 시나리오에서 규칙을 켜고 확인해 보니,
  리뷰와 **같은 날** 커밋된 소스 변경은 `drift`가 보고하지 않았고 `impact`는 보고했습니다.
  PR 게이트에는 `impact`를 쓰고, `drift`는 시간이 지나며 낡은 문서를 찾는 데 씁니다.
- **CI** 강제는 종료 코드로 이뤄집니다. 파이프라인이 이 명령을 실행하지 않으면 아무 일도
  일어나지 않습니다.

## 깨끗한 상태로 되돌리기

- `npm run demo`는 아무것도 남기지 않습니다(`-- --keep`을 주면 경로를 출력합니다).
- 직접 따라 한 작업 폴더는 지우고 `npm run demo:workspace`를 다시 실행하면 됩니다.
- 이 폴더의 `node_modules/`와 `dist/`는 git이 무시합니다.

## 문제 해결

| 증상 | 원인과 해결 |
| --- | --- |
| `llm-wiki-governance is not installed here` | 이 폴더에서 먼저 `npm install`을 실행하세요. |
| `git is not available` | git을 설치하고 `PATH`에 있는지 확인하세요. |
| `demo:workspace`에서 `Please tell me who you are` | `git config --global user.name`과 `user.email`을 설정하세요. |
| Node 18에서 `npm run dev` 실패 | Vite 8은 Node 20.19+ 또는 22.12+가 필요합니다. |
| `impact`가 아무것도 보고하지 않음 | 저장소 루트에서 실행하세요. 문서를 먼저 승인하세요(`impact`는 `needs_review` 문서를 보지 않습니다). `llm-wiki.config.json`의 규칙을 확인하세요(`lite`는 이 규칙을 끕니다). |
| `demo:workspace`에서 `is inside an existing git repository` | 이 저장소를 포함해 어떤 저장소에도 속하지 않은 폴더를 고르세요. |
| PowerShell·cmd 경로 | `npm run demo:workspace -- $HOME\vue3-wiki-demo` (PowerShell), `%USERPROFILE%\vue3-wiki-demo` (cmd) |

이 시나리오는 이 저장소의 테스트 스위트
([`tests/vue-demo-walkthrough.test.js`](../../tests/vue-demo-walkthrough.test.js))가 CI를 돌
때마다 현재 CLI로 실행하므로, 위의 명령과 종료 코드는 계속 사실로 유지됩니다. 이 예제는
npm 패키지에 들어가지 않습니다.
