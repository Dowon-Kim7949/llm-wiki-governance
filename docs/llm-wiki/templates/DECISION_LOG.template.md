---
title: Decision Log.template
tags:
  - llm-wiki
  - verified
status: verified
doc_type: template
project: project
last_updated: 2026-07-21
author: cli-generated
last_edited_by: Codex
reviewed_by: Dowon-Kim
reviewed_at: 2026-07-30
wiki_block_version: v1
source_files:
  - package.json
evidence:

related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

# Decision Log.template

## Summary

- Concise summary: describe the purpose of this document in one or two source-backed bullets.
- Generated documents based on this reviewed template start as `needs_review` drafts.

## What To Inspect

- Source files listed in frontmatter `source_files`.
- Related wiki documents listed in frontmatter `related`.
- Tests, configuration, routes, APIs, workflows, or public interfaces connected to this topic.

## Evidence

- Add file paths, symbols, routes, commands, or test names inspected while completing this document.
- Mention any optional frontmatter `evidence` entries here, such as `src/api.ts#symbol:getUser`, `src/routes.ts#route:/users`, or `README.md#section:Usage`.
- Prefer source-backed statements over guesses.


## Open Questions

- Track unclear ownership, missing source evidence, stale assumptions, or decisions that need human review.

## Review Notes

- Keep generated documents as `needs_review` until human review is complete.
- Promote a generated document to `verified` only after human approval.
- 2026-08-03(1.28.0 배포 준비)에 `impact.source_changed`가 이 템플릿을 지목해 인용 소스 `package.json`을 재확인했다. 이번 릴리스 커밋의 실제 diff는 `package.json`의 version(1.27.2 → 1.28.0), `src/cli.js`의 `drift` usage 요약 + `help drift` Options 블록, README 2종의 Upgrading 절 배포 상태 문장과 액션 핀, ROADMAP 2종의 shipped 절 추가, `.github/actions/validate/action.yml`의 `version` 입력 기본값(1.27 → 1.28)이 전부다. 템플릿 본문은 결정 기록의 **형식**이라 패키지 version과 결합되어 있지 않다 — **불변**.
