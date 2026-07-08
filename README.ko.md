---
title: LLM-WIKI Standard Package Korean README
tags:
  - llm-wiki
  - package
  - cli
  - stable
  - korean
status: needs_review
doc_type: package_readme
project: llm-wiki-standard
last_updated: 2026-07-08
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - README.md
  - package.json
  - src/cli.js
  - src/commands.js
  - templates/github-actions/llm-wiki-validate.yml
  - tests/verification.test.js
related:
  - README.md
  - GATE_REVIEW.md
  - VERIFICATION.md
  - RELEASE_CHECKLIST.md
visibility: internal
contains_sensitive_info: false
---

> Language: [English](./README.md) | [한국어](./README.ko.md)

# LLM-WIKI Standard Package

`@dowonk-7949/llm-wiki-standard`는 로컬 터미널, CI, Codex, Claude Code, 후보 adapter 파일에서 함께 사용할 수 있는 LLM-WIKI 문서 구조를 만들고 검증하는 CLI 패키지입니다.

이 CLI는 위키를 자동으로 완성하지 않습니다. 안전한 시작 구조를 만들고, 생성 문서를 `needs_review` 상태로 유지하며, 이후 Codex 또는 Claude Code에 넘길 handoff prompt를 출력합니다.

## 권장 흐름

```text
CLI setup
-> Codex 또는 Claude Code 보강
-> 사람 검토
-> 선택적 verified 승인
-> CI 검증
```

| 단계 | 담당 | 목적 |
| --- | --- | --- |
| CLI setup | `llm-wiki` | 프로젝트를 감지하고, 누락된 wiki 파일과 선택한 adapter 파일을 만들며, frontmatter를 검증하고 다음 agent prompt를 출력합니다. |
| Agent enrichment | Codex 또는 Claude Code | 실제 코드를 읽고 architecture, domain, API, workflow, operations 내용을 source evidence 기반으로 보강합니다. |
| Human review | Maintainer | 정확성을 확인하고 불확실한 주장을 제거하며 문서를 `needs_review`에서 `verified`로 올릴지 결정합니다. |
| CI validation | `llm-wiki validate` | 구조, adapter entrypoint, frontmatter, 로컬 markdown 링크, source file reference, encoding, sensitive-info 규칙을 검사합니다. |

## 빠른 시작

프로젝트 루트에서 실행합니다.

```bash
npm install -D @dowonk-7949/llm-wiki-standard
npx llm-wiki quickstart --write --type frontend --agent codex
```

Claude Code를 사용할 때는 다음처럼 실행합니다.

```bash
npm install -D @dowonk-7949/llm-wiki-standard
npx llm-wiki quickstart --write --type frontend --agent claude
```

`quickstart --write`는 CLI setup을 실행한 뒤 다음과 같은 안내와 handoff prompt를 출력합니다.

```text
CLI 작업이 완료되었습니다. Codex 또는 Claude Code에게 넘어가서 아래 프롬프트를 실행하세요.
```

출력된 handoff prompt를 Codex 또는 Claude Code에 붙여넣으십시오. Agent는 adapter 파일과 `docs/llm-wiki/index.md`를 읽고, 실제 source file을 근거로 wiki를 보강합니다. `verified` 승인은 사람이 검토한 뒤에만 수행합니다.

미리보기만 원하면 `quickstart --dry-run`을 사용하십시오.

```bash
npx llm-wiki quickstart --dry-run --type frontend --agent codex
```

## 단계별 실행

```bash
npx llm-wiki doctor
npx llm-wiki init --dry-run --type frontend --agent codex
npx llm-wiki init --write --type frontend --agent codex
npx llm-wiki validate-frontmatter
npx llm-wiki handoff --agent codex
```

Agent가 wiki를 보강한 뒤에는 다음을 실행합니다.

```bash
npx llm-wiki validate --type frontend --agent codex
```

현재 wiki 상태를 확인하려면 다음을 실행합니다.

```bash
npx llm-wiki status --agent codex
```

## Codex에서 시작하기

```bash
npx llm-wiki quickstart --write --type frontend --agent codex
```

그 다음 출력된 handoff prompt를 Codex에 붙여넣습니다. Codex adapter 파일은 `AGENTS.md`이며, 이 파일은 Codex가 `docs/llm-wiki/index.md`에서 탐색을 시작하도록 안내해야 합니다.

Codex가 해야 할 작업:

- `AGENTS.md`와 `docs/llm-wiki/index.md`를 읽습니다.
- 주장이나 설명을 쓰기 전에 실제 source file을 확인합니다.
- 누락된 `docs/llm-wiki` 내용을 source-backed detail로 보강합니다.
- 생성하거나 수정한 문서는 `needs_review` 상태로 둡니다.
- 검토 메모를 `docs/llm-wiki/log.md`에 append-only로 남깁니다.
- 문서를 `verified`로 승격하지 않습니다.

## Claude Code에서 시작하기

```bash
npx llm-wiki quickstart --write --type frontend --agent claude
```

그 다음 출력된 handoff prompt를 Claude Code에 붙여넣습니다. Claude Code adapter 파일은 `CLAUDE.md`이며, 이 파일은 Claude Code가 `docs/llm-wiki/index.md`에서 탐색을 시작하도록 안내해야 합니다.

## CLI가 하는 일

- 로컬 signal 또는 `--type`으로 project type을 감지합니다.
- 공통 `docs/llm-wiki` 문서 구조를 만듭니다.
- 선택한 adapter 파일을 없을 때만 만듭니다. 예: `AGENTS.md`, `CLAUDE.md`.
- frontmatter, encoding, local markdown link, adapter entrypoint, sensitive-info 규칙을 검증합니다.
- wiki frontmatter의 local `source_files` 항목이 실제로 존재하는지 확인합니다.
- frontend, backend, fullstack, library evidence focus를 포함한 Codex 또는 Claude Code handoff prompt를 출력합니다.
- CLI가 생성한 문서는 `needs_review` 상태로 둡니다.

## CLI가 하지 않는 일

- Codex 또는 Claude Code를 자동 실행하지 않습니다.
- 모든 source file을 읽고 domain knowledge를 자동으로 완성하지 않습니다.
- 문서를 `verified`로 승격하지 않습니다.
- 기존 adapter 파일을 덮어쓰지 않습니다.
- `docs/llm-wiki/log.md`를 덮어쓰지 않습니다.
- `migrate --apply`는 아직 활성화하지 않습니다.

## 명령어

| 명령 | 사용 시점 |
| --- | --- |
| `llm-wiki doctor` | local runtime, package readiness, project detection을 확인합니다. |
| `llm-wiki status` | 초기화 상태, document status count, missing docs, adapter state, markdown link/source file finding을 확인합니다. |
| `llm-wiki quickstart --dry-run` | 파일을 쓰지 않고 setup과 handoff prompt를 미리 봅니다. |
| `llm-wiki quickstart --write` | 누락된 wiki 파일을 만들고 frontmatter를 검증한 뒤 handoff prompt를 출력합니다. |
| `llm-wiki handoff` | setup 이후 Codex 또는 Claude Code에 넘길 다음 prompt를 출력합니다. |
| `llm-wiki init --dry-run` | 생성 예정 파일을 미리 봅니다. |
| `llm-wiki init --write` | 누락된 wiki 파일과 선택한 adapter 파일을 생성합니다. |
| `llm-wiki validate-frontmatter` | frontmatter만 검사합니다. |
| `llm-wiki validate` | local check 또는 CI용 구조/안전 검증을 수행합니다. |
| `llm-wiki audit` | 더 넓은 audit report를 생성합니다. |
| `llm-wiki migrate --dry-run` | 파일을 쓰지 않고 검토 가능한 migration plan을 만듭니다. |

명령별 도움말:

```bash
npx llm-wiki help quickstart
npx llm-wiki help status
```

Handoff prompt를 report로 저장하려면 다음을 사용합니다.

```bash
npx llm-wiki handoff --agent codex --out docs/llm-wiki/tasks/initial-enrichment.prompt.md
```

## 공통 옵션

- `--cwd <path>`: 검사하거나 작성할 project root입니다.
- `--type <frontend|backend|fullstack|library|mixed|unknown>`: 명시적 project type입니다.
- `--profile <profile>`: 추가 profile입니다. 반복 사용할 수 있습니다.
- `--agent <codex|claude|antigravity|all>`: 선택한 adapter target입니다. 반복 사용할 수 있습니다.
- `--format <text|json|markdown>`: output format입니다.
- `--out <path>`: report file을 씁니다.
- `--strict`: warning을 failure로 처리합니다.
- `--minimal`: core document만 생성합니다.
- `--write`: 명시적 write가 필요한 명령에서 쓰기 작업을 허용합니다.
- `--existing <skip|overwrite>`: 기존 wiki document 처리 방식입니다. 기본값은 `skip`입니다.

`--agent antigravity`는 아직 adapter candidate입니다. Tool contract가 확정되기 전에는 Antigravity handoff prompt를 출력하지 않습니다.

## 안전 정책

- Markdown은 UTF-8로 읽고 씁니다.
- 민감정보로 보이는 raw value는 출력하거나 report에 쓰지 않습니다.
- 기존 wiki 문서는 기본적으로 유지하고, 명시적 `--existing overwrite`가 있을 때만 다시 씁니다.
- Local `source_files` 항목은 project root 기준으로 존재하는 file을 가리켜야 합니다.
- `docs/llm-wiki` 내부 local markdown link는 존재하는 상대 파일을 가리켜야 합니다. URL, `mailto:`, anchor-only link는 제외합니다.
- `--strict` 모드에서 `verified` 문서는 `reviewed_by`와 `reviewed_at`을 포함해야 합니다.
- `docs/llm-wiki/log.md`는 append-only이며 덮어쓰지 않습니다.
- 기존 `AGENTS.md`, `CLAUDE.md`, `ANTIGRAVITY.md` 파일은 덮어쓰지 않습니다.
- `migrate --apply`는 자동 migration 범위가 의도적으로 승인될 때까지 blocked 상태입니다.
- CLI가 생성하거나 agent가 수정한 wiki/report 문서는 사람 검토 전까지 `needs_review` 상태입니다.

## 검증

```bash
npm test
npx llm-wiki validate-frontmatter
npx llm-wiki doctor --format markdown
```

## GitHub Actions 예시

이 패키지를 사용하는 프로젝트에서는 `templates/github-actions/llm-wiki-validate.yml`을 `.github/workflows/llm-wiki-validate.yml`로 복사할 수 있습니다.

```bash
npm test
npx llm-wiki validate-frontmatter
npx llm-wiki validate --strict --agent codex
```

## 릴리스 자동화

CI는 pull request와 `main` push에서 검증을 실행합니다. Publish는 `.github/workflows/publish.yml`을 통한 `v*` tag push로 제한됩니다.

검증 후 version `0.1.2`를 배포하려면 다음을 실행합니다.

```bash
git tag v0.1.2
git push origin v0.1.2
```

## 관련 문서

- `README.md`: 영어 README.
- `GATE_REVIEW.md`: stable release gate decision과 caveat.
- `VERIFICATION.md`: verification record.
- `RELEASE_CHECKLIST.md`: stable release checklist.
