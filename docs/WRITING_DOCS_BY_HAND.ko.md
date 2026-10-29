> Language: [English](./WRITING_DOCS_BY_HAND.md) | [한국어](./WRITING_DOCS_BY_HAND.ko.md)

# 문서 직접 쓰기

LLM-WIKI Governance를 쓰는 데 코딩 에이전트는 필수가 아닙니다. 검사는 문서가 무엇을 말하고 무엇을 인용하는지를 볼 뿐, 누가 썼는지는 보지 않습니다. 이 문서는 `quickstart`가 만든 뼈대 문서 하나를 `verified`까지 가져간 뒤, 코드 변경을 변경 점검이 잡아내는 것까지 따라갑니다.

명령은 `npm install -D llm-wiki-governance` 뒤에 쓰는 `npx llm-wiki …` 형태로 적었습니다. 로컬 설치 없이 쓴다면 `npx llm-wiki-governance …`로 바꾸세요.

## 1. 뼈대 만들기

```bash
npm install -D llm-wiki-governance
npx llm-wiki-governance quickstart --write --doc-lang ko
```

`docs/llm-wiki/`와 `llm-wiki.config.json`이 생깁니다. `--agent`를 주지 않으면 에이전트 adapter 파일은 만들지 않습니다. 출력되는 handoff 프롬프트는 에이전트용이니 넘어가도 됩니다.

## 2. 문서를 하나 골라 placeholder를 바꾸기

`docs/llm-wiki/project-profile.md`부터 시작하세요. 본문에 "Concise summary: describe the project purpose…" 같은 안내 문장이 들어 있습니다. 이것을 프로젝트에 대한 사실로 바꿉니다.

본문에 아래 생성 문장이 하나라도 남아 있으면 그 문서는 채워지지 않은 것(`content.not_enriched`)으로 판정되고, `review --approve`가 승인을 거부합니다.

- `Concise summary: describe`
- `Add file paths, symbols, routes, commands, or test names inspected`
- `Add source files and commands inspected while completing`
- `Add source files, tests, routes, and client modules inspected`
- `Track unclear ownership`
- `Keep uncertain claims here until source evidence`
- `List each domain, owner area`
- `이 프로젝트에서 해당 주제의 기준 정보를 정리합니다.` (`--doc-lang ko` 뼈대)
- ``이 문서는 `llm-wiki init --write`가 생성한 초안입니다.`` (`--doc-lang ko` 뼈대)

어느 문서의 어느 절에 placeholder가 남았는지는 `npx llm-wiki next`가 문서별로 보여 줍니다.

## 3. 문서가 설명하는 파일을 인용하기

frontmatter에 문서가 다루는 파일을 적습니다.

```yaml
source_files:
  - package.json
  - src/index.js
evidence:
  - src/index.js#symbol:addTodo
```

- `source_files`는 파일 단위입니다. 파일이 조금만 바뀌어도 그 문서는 다시 볼 후보가 됩니다.
- `evidence`는 더 좁힐 수 있습니다. `path#L10-L20`(라인 범위), `path#symbol:name`(파일에 언급돼야 하는 심볼), `path#section:Heading`(마크다운 섹션), `path#route:/api/x` 형식입니다. 라인 범위와 마크다운 섹션으로 인용하면 `impact`가 같은 파일의 다른 곳 편집은 무시합니다.
- `evidence` 항목은 본문 `## Evidence` 절에도 적어 두세요. 본문에 없는 항목은 `validate --strict`가 보고합니다.

`status: needs_review`는 그대로 둡니다. `author`와 `last_edited_by`는 생성된 값 그대로 두거나 본인 이름으로 바꿔도 되고, 검증과 승인에는 영향이 없습니다.

## 4. 검사하고 승인하기

```bash
npx llm-wiki validate          # 구조와 인용 검사
npx llm-wiki review            # 승인 가능한 문서를 위험도 순으로
npx llm-wiki review --approve docs/llm-wiki/project-profile.md
```

`review --approve`는 `status: verified`, `reviewed_by`, `reviewed_at`만 쓰고 다른 것은 바꾸지 않습니다. `reviewed_by`는 `--reviewer <이름>`, 그다음 `llm-wiki.config.json`의 `reviewer`, 그다음 git `user.name` 순으로 정해집니다. 도구는 그 이름을 기록할 뿐 누가 명령을 실행했는지 증명하지 못합니다. 누가 승인할 수 있는지는 프로젝트가 정합니다.

승인은 문장이 참인지 검사하지 않습니다. 누군가 맞다고 판단했다는 사실을 기록할 뿐입니다.

## 5. 변경 점검을 켜고 실제로 걸리는 것 보기

`quickstart`는 새 프로젝트를 `lite`로 시작하며, 이 모드에서는 변경 점검이 꺼져 있습니다. 켜고 커밋합니다.

```bash
npx llm-wiki mode set standard --write
git add -A && git commit -m "wiki: project profile"
```

인용한 파일을 바꾸고 커밋합니다.

```bash
# src/index.js 수정
git commit -am "change addTodo"
npx llm-wiki impact --since HEAD~1
```

`impact`가 "Documents to re-review"에 `docs/llm-wiki/project-profile.md`와 바뀐 소스를 보여 줍니다. 문서를 다시 읽고 더 이상 맞지 않는 부분을 고친 뒤 다시 승인하세요. 이 표시는 "틀렸다"가 아니라 "다시 보라"는 뜻입니다. 문서가 여전히 맞다면 다시 승인하는 것으로 끝입니다.

`standard`에서는 경고로, `strict`에서는 빌드 실패로 나옵니다. 이력 전체를 날짜 기준으로 보려면 `drift`를 씁니다. 다만 승인한 당일에는 같은 날 커밋된 변경을 `drift`가 보지 못하니, 처음 시험할 때는 `impact`를 쓰세요.

## 다음으로 볼 곳

- 거버넌스 모드와 모드별 검사: [README, 거버넌스 모드](../README.ko.md#거버넌스-모드)
- CI에서 돌리기: [README, CI에서 돌리기](../README.ko.md#ci에서-돌리기), [OPERATIONS.md](./OPERATIONS.md)(영문)
- 처음 보는 규칙: `npx llm-wiki explain <rule>`
- 여기 적힌 대로 되지 않았다면: [첫 사용 보고 남기기](https://github.com/Dowon-Kim7949/llm-wiki-governance/issues/new?template=first_run.yml)
