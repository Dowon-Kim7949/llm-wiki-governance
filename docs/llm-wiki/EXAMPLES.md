---
title: Examples
tags:
  - llm-wiki
  - verified
status: verified
doc_type: examples
project: llm-wiki-governance
last_updated: 2026-07-23
author: cli-generated
last_edited_by: Claude Code
reviewed_by: Dowon-Kim
reviewed_at: 2026-07-23
wiki_block_version: v1
source_files:
  - src/cli.js
  - README.md
evidence:
  - src/cli.js#symbol:printHelp
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/PUBLIC_API.md
visibility: internal
contains_sensitive_info: false
---

# Examples

실제로 검증된 사용 예시입니다. 명령/옵션 근거는 [Public Api](PUBLIC_API.md).

## Zero-base 프로젝트 초기화

```bash
llm-wiki init --dry-run --type library --agent codex --agent claude
llm-wiki init --write   --type library --agent codex --agent claude
llm-wiki validate --type library
```

## 스킬 생성 + 최초 보강(bootstrap)

```bash
# init과 함께 에이전트 네이티브 스킬 생성:
#   --agent codex  -> .agents/skills/llm-wiki-<task>/SKILL.md
#   --agent claude -> .claude/skills/llm-wiki-<task>/SKILL.md
#   --skills       -> 모든 네이티브 형식(claude·codex·cursor·중립 프롬프트)
llm-wiki init --write --type backend --agent codex        # Codex 스킬 4개(bootstrap/feature/fix/docs-sync)
llm-wiki init --write --type backend --skills             # 모든 형식

# 최초 보강 워크플로를 프롬프트로도 받을 수 있다(스킬과 동일 규칙, handoff와 단일 소스 공유):
llm-wiki prompt --task bootstrap --type backend --agent codex
```

생성된 `llm-wiki-bootstrap` 스킬(또는 `prompt --task bootstrap`)을 에이전트에 붙여넣으면, `init --write`가 만든 뼈대를 실제 코드 근거로 보강하고 모든 문서를 `needs_review`로 남긴다(도구는 스킬 파일만 만들고 실행은 에이전트가 한다 — recognize-don't-run). 기존 스킬 파일은 덮어쓰지 않는다.

## 이 저장소를 dogfooding한 방법

```bash
# 뼈대 생성(core + library profile + adapters)
node bin/llm-wiki.js init --write --type library --agent codex --agent claude
# 이후 각 문서를 실제 소스 근거로 보강하고 재검증
node bin/llm-wiki.js validate --type library
```

## CI에서 검증

```bash
npx llm-wiki validate-frontmatter
npx llm-wiki validate --strict --agent codex
```

`--strict`는 warning을 실패로 처리하므로 `related.missing`·`content.not_enriched`·`evidence.*`가 릴리스 게이트에서 CI를 실패시킬 수 있다.

## 다음 조치 추천 / 규칙 설명

```bash
llm-wiki next
llm-wiki explain content.not_enriched
```

## Evidence

- `src/cli.js#symbol:printHelp` — 지원 명령·옵션의 실제 사용법 문자열.

## Review Notes

- 2026-07-13에 CLI 도움말과 공개 명령 표면을 기준으로 검토했다.
- 2026-07-16에 1.12.0 release-prep에서 `README.md`가 변경되어(감지 대상 행 추가) `evidence.stale`이 발생했다. 이 문서 내용은 무관하며 변경되지 않았다. 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-16)로 baseline을 refresh해 `verified`를 유지한다(내용 불변).
- 2026-07-20에 1.14.3 release-prep에서 `src/cli.js`가 변경되어(bare 명령/`--help` 오리엔테이션 헤더 추가) `evidence.stale`이 발생했다. 이 문서의 명령 예시는 그대로 유효하며 내용은 변경되지 않았다. 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-20)로 baseline을 refresh해 `verified`를 유지한다(내용 불변).
- 2026-07-23에 "스킬 생성 + 최초 보강(bootstrap)" 예시 섹션을 추가했다(`--agent codex`→`.agents/skills/`, `--agent claude`→`.claude/skills/`, `--skills`→모든 형식, `prompt --task bootstrap`). 예시 명령은 현재 CLI 표면과 일치한다. 에이전트(Claude Code) 편집이라 `needs_review`로 강등 — 사람 검토 후 재승인 예정.
- 2026-07-23에 위 bootstrap/Codex 반영분을 release-prep 1.23.0의 일부로 사람 검토(reviewed_by: Dowon-Kim, reviewed_at: 2026-07-23)를 거쳐 `verified`로 재승인했다. 1.23.0 `package.json` 범프로 생긴 evidence.stale 드리프트도 reviewed_at 갱신으로 함께 해소했다(284 tests·validate --strict 0).
