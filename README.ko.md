> Language: [English](./README.md) | [한국어](./README.ko.md)

# LLM-WIKI Governance

AI 코딩 에이전트가 쌓아 둔 프로젝트 지식(`docs/llm-wiki/`)을 계속 믿을 만한 상태로 유지해 주는 CLI입니다. 문서의 모든 설명을 실제 코드에 묶어 두고, 그 코드가 바뀌면 그것을 인용한 문서를 찾아 표시합니다. AI가 쓴 내용은 사람이 읽고 승인해야 확정되며, 이 절차를 CI에서 강제할 수 있습니다. 런타임 의존성은 하나도 없고 스택이나 에이전트를 가리지 않으며, OKF와 호환됩니다.

```text
기존 방식:        작업 -> 코드베이스 재탐색 -> 구조·규칙 재파악 -> 작업 수행
LLM-WIKI 방식:    작업 -> index.md 확인 -> 관련 (검증된) wiki 문서 확인 -> 필요한 소스만 확인 -> 작업 수행
```

## 빠른 시작

```bash
npm install -D llm-wiki-governance
npx llm-wiki quickstart --write --type frontend --agent claude   # 또는 --agent codex
```

`quickstart --write`는 프로젝트 종류를 알아낸 다음 위키와 adapter 파일을 만들고, 마지막에 handoff 프롬프트를 출력합니다. 그 프롬프트를 에이전트에 붙여넣으면 에이전트가 `docs/llm-wiki/index.md`부터 읽고 실제 소스를 근거로 문서를 채웁니다. 채워진 문서는 모두 `needs_review`로 남아 검토를 기다립니다. 무엇이 만들어지는지 먼저 보려면 `quickstart --dry-run`을 쓰세요.

`--skills`를 더하거나 `--agent claude|codex|cursor`를 지정하면 `bootstrap`·`feature`·`fix`·`docs-sync` 작업용 자동화 프롬프트까지 만들어 줍니다. 이미 OKF나 평범한 마크다운으로 지식 폴더를 갖고 계시다면 형식을 바꿀 필요가 없습니다. 그 폴더에 그대로 CLI를 대면 `--profile okf-v0.1`이 검증과 드리프트 감지, CI만 얹어 줍니다.

CLI를 돌리는 데는 모델이 필요 없습니다. 모델이 쓰이는 곳은 보강 단계 하나뿐이고 결과 품질도 거기서 갈리니, 처음 위키를 만들 때는 쓰시는 에이전트의 가장 강한 추론 모델을 쓰고 이후 `docs-sync` 같은 일상 작업은 값싼 모델로 돌리시면 됩니다.

## 무엇을 해 주나

- **신뢰 상태.** AI가 쓴 문서는 `needs_review`에 머물고 `verified`로 올리는 일은 사람만 할 수 있습니다. CLI가 자기 문서를 스스로 승인하는 경로는 없습니다.
- **근거와 드리프트.** 설명마다 실제 파일·라인·심볼이 붙어 있어서, 그 소스가 움직이면 `evidence.stale`과 `impact`가 재검토 대상으로 표시합니다.
- **CI 강제.** `validate`를 pre-commit이나 GitHub Actions에서 돌리면, 검토되지 않았거나 드리프트된 위키가 조용히 썩는 대신 빌드를 실패시킵니다.
- **에이전트의 질의.** 읽기 전용 MCP 서버를 붙이면 에이전트가 코드를 다시 훑는 대신 위키에 물어봅니다.
- **구조적 안전.** 쓰기는 항상 미리보기가 먼저이고, 변경 로그는 append-only이며, 민감해 보이는 값은 가려서 출력하고, 런타임 의존성은 없습니다.

## 명령

| 명령 | 하는 일 |
| --- | --- |
| `quickstart` · `init` | 위키와 adapter 파일을 만들고 에이전트 handoff 프롬프트를 출력합니다. |
| `validate` · `audit` · `status` | 로컬과 CI에서 쓰는 구조·안전 검증 · 전체 finding 리포트 · 현재 위키 상태. |
| `drift` · `impact` | 인용한 소스가 움직인 문서를 표시합니다. 앞은 날짜 기준, 뒤는 PR 기준선과의 diff 기준입니다. |
| `review` | `needs_review` 백로그를 위험도 순으로 보여 줍니다. `verified`로 가는 길은 `--approve`뿐입니다. |
| `mode` · `backfill` | 거버넌스 레벨을 읽고 바꿉니다 · 저장소가 증명할 수 있는 것으로 불완전한 위키를 다시 세웁니다. |
| `onboard` · `prepare` | 업무 영역을 익히거나, 구현 전에 작업 범위를 훑습니다. 읽기 전용입니다. |
| `list-docs` · `search-docs` · `get-doc` · `get-related` | 문서 본문을 돌려주는 읽기 전용 조회입니다. 민감한 줄은 가려서 나옵니다. |
| `graph` · `stats` | 지식 그래프(text/JSON/Mermaid/DOT) · 헬스 스냅샷. |
| `mcp` | 읽기 전용 MCP 서버를 띄웁니다. |
| `fix` · `migrate` · `handoff` · `prompt` · `check-run` · `harness-health` · `import-memory` | 범위를 한정한 자동 수정, 문서 계약 업그레이드, 에이전트 프롬프트, 하네스 점검입니다. |

쓰기는 `--write`나 `--apply`, `--approve`를 직접 줬을 때만 일어나고 나머지는 전부 읽기 전용입니다. `--lang ko`를 붙이면 findings 메시지가 한국어로 나오고, `--doc-lang ko`를 붙이면 생성되는 위키 본문이 한국어가 됩니다. CLI를 spawn하는 대신 패키지를 import해서 쓸 수도 있습니다(`import { commands, run } from "llm-wiki-governance"`).

명령과 옵션, exit code를 전부 보려면 `npx llm-wiki help <command>`를 오프라인으로 돌리거나 [PUBLIC_API.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/PUBLIC_API.md)를 보세요.

CI에서 돌리려면 [`templates/github-actions/llm-wiki-validate.yml`](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/templates/github-actions/llm-wiki-validate.yml)을 복사하거나, 컴포지트 액션을 한 스텝으로 참조하되 태그를 정확히 고정하세요: `uses: Dowon-Kim7949/llm-wiki-governance/.github/actions/validate@v1.30.1`. 저장소 규모별 레시피는 [docs/OPERATIONS.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/OPERATIONS.md)에 있습니다.

## 거버넌스 모드

문서를 얼마나 갖춰 둘지는 그 프로젝트가 지금 어느 단계에 있느냐에 따라 달라져야 합니다. 그래서 검사 엔진은 그대로 두고 정책 수위만 세 단계로 나눴습니다. 같은 저장소 안에서 언제든 올리고 내릴 수 있습니다.

| | `lite` | `standard` | `strict` |
| --- | --- | --- | --- |
| 무엇을 우선하나 | 개발 속도 | 속도와 지식을 함께 | 완전성과 검증, 인수인계 |
| 코드를 고친 뒤 문서 작업 | 코드만 봐서는 알 수 없는 것만 | 도메인·아키텍처·계약이 움직였을 때 | 영향받은 문서 전부 |
| 드리프트와 문서 누락 게이트 | 끕니다 | 보고만 합니다(warning) | 빌드를 실패시킵니다(error) |
| `audit` · `backfill` | 필요할 때만 | 필요할 때만 | 핵심 워크플로 |

```json
{ "governance": { "mode": "lite" } }
```

`init`과 `quickstart`은 새 프로젝트에 `lite`를 깔아 둡니다. `governance` 블록이 아예 없는 프로젝트는 `strict`로 해소되는데, 그 규칙 집합은 모드가 생기기 전에 이 CLI가 강제하던 것과 정확히 같습니다. 그러니 버전을 올려도 직접 켜기 전까지는 달라지는 게 없습니다. 구조 검사와 안전 검사는 어느 모드에서도 그대로 돕니다. 깨진 frontmatter, 실제로 없는 `source_files` 경로, 끊어진 링크, 민감정보 탐지는 모드를 낮춘다고 함께 낮아지지 않습니다.

의도한 사용법은 평소 몇 달을 `lite`로 지내다가 인수인계를 앞두고 `strict`로 올리는 것입니다. `llm-wiki mode set strict --write`는 설정 키 하나만 쓰고 스캔을 돌리지 않으며, 비싼 재구성은 `llm-wiki backfill`을 직접 부를 때만 일어납니다. `backfill`은 모든 사실에 `verified`·`inferred`·`unknown` 라벨을 달고, 아무도 남기지 않은 근거를 지어내지 않습니다.

**`impact`를 필수 체크에 넣기 전에 읽어 주세요.** `strict`에서는 `impact.source_changed`가 기본 `error`라서 `llm-wiki impact --since <ref>`가 아무 플래그 없이도 빌드를 실패시킵니다. `governance.mode`를 `standard`(보고만)나 `lite`(끔)로 두거나, `llm-wiki.config.json`의 `rules`에 `"impact.source_changed": "warning"`을 넣으면 됩니다. 배경과 실측 오탐률, 되돌리는 방법 전부는 [CHANGELOG.ko.md](./CHANGELOG.ko.md)의 1.28.0 항목에 있습니다.

## 에이전트 연동 (MCP)

`llm-wiki mcp`는 stdio 위에서 [Model Context Protocol](https://modelcontextprotocol.io) 서버를 띄웁니다. Node 내장 모듈만 씁니다. MCP 클라이언트에는 이렇게 등록합니다.

```json
{ "mcpServers": { "llm-wiki": { "command": "npx", "args": ["-y", "llm-wiki-governance", "mcp"] } } }
```

노출되는 툴은 전부 읽기 전용이라 에이전트가 위키를 조회할 수는 있어도 쓰지는 못하고, `verified` 승격은 사람이 CLI에서 직접 할 때만 일어납니다. 이 서버는 로컬 stdio 서브프로세스로 도는 것을 전제하고 인증 기능이 없으니, 직접 인증 프록시를 두지 않은 채로 네트워크에 노출하지 마세요. 신뢰 모델은 [SECURITY.ko.md](./SECURITY.ko.md#mcp-서버-신뢰-모델)에 있습니다.

## 지원 환경

| | |
| --- | --- |
| **런타임** | Node.js 18.18.0 이상 · Windows, macOS, Linux |
| **의존성** | 없습니다. 런타임 서드파티 의존성이 하나도 없습니다 |
| **감지 대상** | Node · Python · Go · Rust · JVM · PHP · Ruby · .NET · 모바일(Android / Flutter / iOS / React Native) · 인프라(Docker / Compose / Kubernetes / Helm / Terraform) |
| **표준** | OKF 호환입니다. `--profile okf-v0.1`이 Open Knowledge Format의 `type`·`aliases`·`tags`를 검증합니다 |
| **에이전트/에디터** | Codex(`AGENTS.md`), Claude Code(`CLAUDE.md`), Cursor, GitHub Copilot, Windsurf, Gemini CLI, 그리고 모든 MCP 클라이언트 |
| **단독 사용** | CLI는 에이전트 없이도 그대로 동작합니다 |

## 더 알아보기

- [PUBLIC_API.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/PUBLIC_API.md) — 명령과 옵션, exit code, 설정, 프로그래매틱 API, MCP 레퍼런스 전부.
- [docs/OPERATIONS.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/OPERATIONS.md) — 소규모 저장소, 중규모 저장소, 모노레포에서 운영하는 방법(플래그, CI 비용, 문서 수 전략). 영문입니다.
- [BENCHMARK.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/BENCHMARK.md) — 무엇을 쟀고 무엇은 재지 못했는지, 불리하게 나온 실행까지. 먼저 알아 두실 결과가 하나 있습니다. 만들어만 두고 보강하지 않은 위키는 위키가 아예 없을 때보다 오히려 나쁘게 측정됐습니다. 값은 조회 도구가 아니라 유지된 내용에서 나옵니다.
- [CHANGELOG.ko.md](./CHANGELOG.ko.md) · [ROADMAP.ko.md](./ROADMAP.ko.md) — 출시 이력과 방향.
- [GATE_REVIEW.md](./GATE_REVIEW.md) — 승인된 안전 범위(fix/migrate/drift/MCP/스킬)와 릴리스 게이트. 영문입니다.
- [EXAMPLES.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/EXAMPLES.md) — 실사용 예시.
- 커뮤니티: [CONTRIBUTING.ko.md](./CONTRIBUTING.ko.md) · [CODE_OF_CONDUCT.ko.md](./CODE_OF_CONDUCT.ko.md) · [SECURITY.ko.md](./SECURITY.ko.md).
