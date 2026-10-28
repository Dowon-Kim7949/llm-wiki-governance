# React + Node 풀스택 워크스루

Language: [English](./README.md) | **한국어**

React 클라이언트와 Express 서버가 npm workspaces(`client/`, `server/`)에 있고, API 계약 하나(`shared/orders-contract.json`)에서 만납니다. 이 워크스루는 그 경계를 넘는 변경을 위키가 어떻게 따라가는지 보여 줍니다. 계약을 한 번 바꾸면 문서 세 개가 지목되고, 서버만 바꾸면 서버 쪽 문서만 지목됩니다.

## 실행

```console
node examples/react-node-fullstack/scripts/walkthrough.mjs
```

- 임시 git 저장소에서 돌고 PASS/FAIL 표(검사 15개)로 끝납니다.
- 옵션: `--keep`은 저장소 보존, `--quiet`는 표만 출력, `--cli <path>`는 다른 CLI 지정입니다.
- 필요한 것은 Node.js 18.18 이상과 git입니다. 아무것도 설치하거나 띄우지 않습니다. CLI는 파일을 읽을 뿐 실행하지 않습니다.

## 보여 주는 것

1. **workspace 저장소 감지.** 루트 `package.json`에는 프레임워크가 없어 감지 결과는 `unknown`입니다. `init --dry-run`이 힌트를 덧붙입니다. 멤버 매니페스트에 React와 Vite(`client`), Express(`server`)가 있으니 `--type fullstack`이 맞다는 것입니다. 감지 결과 자체는 일부러 바꾸지 않습니다. type 없이 초기화한 저장소는 `validate`마다 다시 감지하므로, 바꾸면 그 저장소에 새 필수 문서가 생기기 때문입니다.
2. **`init --write --type fullstack`**이 type을 `llm-wiki.config.json`에 기록하고, `validate --strict`가 깨끗하게 통과합니다. (1.40.0 전에는 `unknown`으로 감지된 저장소에 type을 명시하면 실행마다 warning이 났습니다.)
3. **양쪽 문서와 계약 문서.** 클라이언트 도메인 문서, 서버 도메인 문서, `API_CONTRACTS.md`가 각 쪽 코드와 계약 파일을 인용합니다.
4. **변경 하나, 문서 여럿.** 계약에 필드를 더하면 세 문서 모두 `impact`에서 실패합니다. 양쪽 코드와 세 문서를 같은 변경에서 고치면 통과합니다.
5. **한쪽만 바꾸기.** 서버 라우트에서 주문을 정렬하면 서버 문서와 계약 문서만 지목되고 클라이언트 문서는 지목되지 않습니다.

## 보여 주지 않는 것

- **양쪽이 실제로 맞는지.** 계약 파일은 코드가 손으로 맞춰 쓰는 문서입니다. 여기서는 그 파일로 타입을 생성하거나 서버 응답이 클라이언트 기대와 같은지 검사하지 않습니다. 그것은 계약 테스트의 몫입니다.
- **앱 실행.** `npm install`, 빌드, 서버 실행 모두 없습니다.
- **workspace별 위키.** 저장소 하나에 위키 하나입니다. 패키지마다 위키를 두는 `llm-wiki monorepo`는 쓰지 않습니다.
