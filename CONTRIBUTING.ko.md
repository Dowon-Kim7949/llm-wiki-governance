> Language: [English](./CONTRIBUTING.md) | [한국어](./CONTRIBUTING.ko.md)

# llm-wiki-governance 기여 가이드

`llm-wiki-governance`에 관심 가져 주셔서 감사합니다. AI가 쓴 프로젝트 문서를 검증하고, 드리프트를 잡아내고, 설명을 실제 코드에 묶어 두는 무의존성 거버넌스 CLI이며 OKF와 호환됩니다. 이 문서에서는 개발 환경을 어떻게 갖추고, 무엇을 어떻게 고치고, PR을 어떻게 여는지 설명합니다.

기여에 참여하시면 [행동 강령](./CODE_OF_CONDUCT.ko.md)을 지키기로 동의한 것으로 봅니다.

## 어떤 기여가 있나

- **버그 신고.** [버그 리포트](https://github.com/Dowon-Kim7949/llm-wiki-governance/issues/new?template=bug_report.md)를 열어 주세요.
- **기능 제안.** [기능 요청](https://github.com/Dowon-Kim7949/llm-wiki-governance/issues/new?template=feature_request.md)을 열어 주시되, [ROADMAP.ko.md](./ROADMAP.ko.md)에 이미 잡혀 있는 항목인지 먼저 확인해 주시면 좋겠습니다.
- **문서 개선.** README, CHANGELOG, ROADMAP과 `docs/llm-wiki/` 아래의 LLM-WIKI가 대상입니다.
- **취약점 신고.** 공개 이슈로 열지 마시고 [보안 정책](./SECURITY.ko.md)을 따라 주세요.

## 준비물

- **Node.js 18.18.0 이상**입니다. `package.json`의 `engines`를 보세요.
- 런타임 서드파티 의존성이 없습니다. CLI는 Node 내장 모듈만 씁니다. 충분히 논의된 분명한 이유가 없다면 이 원칙은 그대로 지켜 주세요.

## 시작하기

```bash
git clone https://github.com/Dowon-Kim7949/llm-wiki-governance.git
cd llm-wiki-governance
npm install
npm test             # node --test tests/*.test.js
```

자주 쓰는 스크립트는 다음과 같습니다.

| 명령 | 하는 일 |
|---|---|
| `npm test` | 테스트를 돌립니다 (`node --test tests/*.test.js`) |
| `npm run verify` | 테스트에 `validate-frontmatter`까지 더한 릴리스 게이트 점검 |
| `npm run doctor` | 환경과 프로젝트를 진단합니다 |
| `npm run audit` | 이 저장소의 LLM-WIKI 전체를 감사합니다 |
| `npm run validate-frontmatter` | 위키 frontmatter 계약을 검증합니다 |
| `npm run lint` | 의존성 없는 문법 게이트로, 모든 소스에 `node --check`를 겁니다 |
| `npm run test:coverage` | Node 내장 커버리지로 테스트합니다 (`node --test --experimental-test-coverage`, Node 20 이상) |
| `npm run sbom` | 공급망 검토용 CycloneDX SBOM을 냅니다 (`npm sbom`) |

개발 중에는 `node bin/llm-wiki.js <command>`로 CLI를 바로 실행할 수 있습니다.

## 이 저장소의 규칙

이 저장소는 자기 표준을 스스로에게 적용합니다. 그래서 지식 기반이 `docs/llm-wiki/`에 그대로 들어 있습니다. 코드든 문서든 고치기 전에 [`docs/llm-wiki/index.md`](./docs/llm-wiki/index.md)를 먼저 읽어 주세요.

- **모든 파일은 UTF-8입니다.** Markdown도 UTF-8로 읽고 씁니다.
- **크로스플랫폼을 지킵니다.** CI가 Linux·Windows·macOS에서 Node 18.18·20·22·24 조합으로 돕니다. OS에 종속된 경로 처리를 피하고 `node:path`를 쓰세요.
- **민감정보는 넣지 않습니다.** 문서에도, 로그에도, 리포트에도, 프롬프트에도 넣지 않습니다.
- **LLM-WIKI 규율이 있습니다.**
  - LLM이 만들거나 고친 문서는 편집한 시점에 `needs_review`로 둡니다. 다만 이 저장소에서는 그다음에 에이전트가 `review --approve-all --yes`로 스스로 승격하고 `reviewed_by`에 에이전트 이름을 적습니다. 2026-08-03에 유지보수자가 내린 결정이며, 이 저장소 자체가 바이브코딩 산출물이자 제품의 dogfood이기 때문입니다. 계약 전문은 `AGENTS.md`의 "Wiki discipline"에 있습니다. 이 완화는 이 저장소에만 해당합니다. 이 패키지가 도입처로 내보내는 규칙은 여전히 사람 검토를 요구하고, `docs/llm-wiki/` 밖의 어떤 파일도 `verified`를 씨앗으로 삼을 수 없습니다.
  - 코드나 문서를 고치면 관련 위키 문서를 함께 갱신하고 [`docs/llm-wiki/log.md`](./docs/llm-wiki/log.md)에 항목을 덧붙입니다. 이 로그는 append-only입니다.
- **영문과 국문을 쌍으로 유지합니다.** `README`, `CHANGELOG`, `ROADMAP`과 이 커뮤니티 문서들은 영문(`*.md`, 정본)과 국문(`*.ko.md`)을 함께 두고 맨 위에 `> Language:` 상호링크를 답니다. 한쪽을 고쳤으면 짝도 함께 고쳐 주세요.
- **새 검증을 추가하신다면** 기존 패턴을 그대로 따라 주세요. `scan<Something>(cwd)` 함수를 만들고, 그 findings를 `audit`에 합류시키고, rule 이름은 `category.subrule` 형식으로 짓고, `FINDING_EXPLANATIONS`에 등록해서 `explain`이 조치 방법을 안내하게 하면 됩니다. 자세한 내용은 [`docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md`](./docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md)에 있습니다.

## 테스트

- 동작이 바뀌면 `tests/` 아래 테스트를 추가하거나 고쳐 주세요.
- 테스트는 결정적이어야 하고 특정 플랫폼에 기대면 안 됩니다.
- PR을 열기 전에 `npm test`와 `npm run verify`가 통과해야 합니다. CI가 전체 매트릭스를 돌립니다.

## 품질 게이트와 의존성

이 프로젝트는 런타임 의존성뿐 아니라 개발 의존성도 0으로 유지합니다. 어쩌다 그렇게 된 게 아니라 의도한 정체성입니다. 기여자 입장에서는 두 가지가 달라집니다.

- **스타일은 linter가 아니라 리뷰로 지킵니다.** ESLint도 Prettier도 없습니다. `npm run lint`는 소스에 `node --check`를 거는 문법 게이트일 뿐이고(`scripts/lint-syntax.mjs`), 공백 규칙은 `.editorconfig`가 담고 있습니다. 주변 코드의 스타일을 따라 주세요. 거기서 벗어나면 리뷰에서 짚습니다.
- **커버리지는 Node 내장 기능을 씁니다.** `npm run test:coverage`가 `node --test --experimental-test-coverage`(Node 20 이상)를 돌립니다. `nyc`나 `c8`가 아닙니다. 게이트가 아니라 참고용이라, 커버리지 도구가 의존성으로 들어오지 않습니다.

충분히 논의된 이유가 없다면 런타임 의존성이든 개발 의존성이든, lockfile 항목이든 **추가하지 말아 주세요.** 이 프로젝트의 정체성인 zero-dependency 원칙이 깨집니다. 공급망 검토는 `npm run sbom`이 내주는 CycloneDX SBOM과, push와 PR마다 도는 GitHub 네이티브 CodeQL 워크플로로 합니다.

## 커밋과 PR

1. 포크한 다음 `main`에서 토픽 브랜치를 만듭니다.
2. 메시지를 분명히 쓰고 커밋 하나에 한 가지만 담습니다.
3. 로컬에서 `npm run verify`가 통과하는지 확인합니다.
4. `main`을 대상으로 PR을 열고 [PR 템플릿](./.github/pull_request_template.md)을 채웁니다.
5. CI가 전부 통과해야 합니다. 테스트, frontmatter 검증, `doctor`, `npm pack --dry-run`, consumer install이 돕니다.

PR은 작고 범위를 좁게 유지해 주세요. 관련 없는 변경은 따로 떼어 내면 리뷰가 훨씬 수월합니다.

## 릴리스

릴리스는 유지보수자가 합니다. 배포는 `v*` 태그를 붙이면 npm Trusted Publishing으로 자동 진행됩니다(`.github/workflows/publish.yml`). 게이트와 의사결정 기록은 [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)와 [`GATE_REVIEW.md`](./GATE_REVIEW.md)를 보세요.

## 질문이 있다면

[이슈](https://github.com/Dowon-Kim7949/llm-wiki-governance/issues)를 열어 주세요. 다만 README와 `docs/llm-wiki/`를 먼저 훑어봐 주시면 좋겠습니다. 답이 이미 거기 있는 경우가 많습니다.
