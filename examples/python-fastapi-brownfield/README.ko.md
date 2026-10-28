# Python(FastAPI) 기존 프로젝트 워크스루

Language: [English](./README.md) | **한국어**

Python으로 쓴 작은 주문 가격 계산 서비스가 이미 있습니다. 이 워크스루는 그 코드에서 LLM-WIKI를 만들고, 검사가 무엇을 잡고 무엇을 못 잡는지 보여 줍니다. [Vue 3 데모](../vue3-typescript-demo/README.ko.md)의 비 JavaScript 짝입니다.

## 실행

```console
node examples/python-fastapi-brownfield/scripts/walkthrough.mjs
```

- 임시 git 저장소에서 돌고 PASS/FAIL 표(검사 21개)로 끝납니다.
- 옵션: `--keep`은 저장소 보존, `--quiet`는 표만 출력, `--cli <path>`는 다른 CLI 지정입니다.
- 필요한 것은 Node.js 18.18 이상과 git입니다. **Python은 필요 없습니다.** CLI는 파일을 읽을 뿐 실행하지 않습니다. 모델이나 API 키도 쓰지 않습니다.

## 실제로 실행하는 것과 미리 만들어 둔 것

| 부분 | 실제 / 미리 만든 것 |
| --- | --- |
| 서비스(`app-src/`: FastAPI 앱, 가격 규칙, pytest 테스트, `pyproject.toml`) | 미리 만든 fixture이며 실행하지 않습니다 |
| 모든 `llm-wiki` 명령과 종료 코드 | 실제 CLI |
| 에이전트가 쓸 위키 문서 두 개(`enrichment/`) | **미리 작성**. 실제 프로젝트에서는 `handoff`가 출력하는 프롬프트로 에이전트가 씁니다 |
| 코드 변경과 문서 수정 | 스크립트 편집 |

## 보여 주는 것

1. **`package.json` 없이 감지합니다.** `init`이 `pyproject.toml`로 Python 백엔드를 감지하고, `type: backend`를 기록하고, 생성 문서에 `pyproject.toml`을 인용하고, 프로젝트 이름을 `[project] name`에서 가져옵니다.
2. **에이전트 연결.** `--agent claude --agent codex`가 `CLAUDE.md`, `AGENTS.md`, 두 에이전트의 스킬을 쓰고, 모두 `docs/llm-wiki/index.md`를 가리킵니다. 에이전트가 그것을 실제로 따르는지는 여기서 시험하지 않습니다.
3. **잘못된 근거를 잡습니다.** 존재하지 않는 `#symbol:apply_coupon`을 인용한 문서는 `validate --strict`에서 `evidence.symbol_unverified`로 실패합니다.
4. **검색.** `search-docs`, `get-doc --section`, `get-related`가 가격 규칙 문서를 찾습니다.
5. **코드 → 문서 영향.** `app/services/pricing.py`에 쿠폰을 더하면 그 파일을 인용한 문서 하나만 `impact`에서 실패합니다.
6. **drift의 두 얼굴.** 검토한 날 커밋한 변경은 날짜 기준 `drift`가 보고하지 않습니다(문서화된 한계). 그 커밋을 잡는 것은 `impact`입니다. 다음 날 커밋한 변경은 보고됩니다.

## 보여 주지 않는 것

- **문장이 참인지.** 10단계에서 문서의 "VIP20은 20%"를 25%로 바꾸지만 코드는 여전히 20입니다. 인용이 여전히 해석되므로 `validate --strict`는 통과합니다.
- **인용한 Python 함수가 정의로 존재하는지.** `#symbol:`은 파일이 그 이름을 언급하는지만 봅니다. 어떤 언어도 파싱하지 않습니다.
- **Python 테스트 실행.** 여기서는 pytest를 돌리지 않습니다.
- **lite 기본값.** 워크스루는 `impact.source_changed`와 `evidence.missing`을 손으로 켭니다. 새 프로젝트는 lite로 시작하고, lite에서는 둘 다 꺼져 있습니다.
