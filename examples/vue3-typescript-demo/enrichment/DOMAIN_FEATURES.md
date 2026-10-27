---
title: Domain Features
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: domain_overview
project: llm-wiki-vue3-typescript-demo
last_updated: 2026-10-27
author: cli-generated
last_edited_by: demo-enrichment
wiki_block_version: v1
source_files:
  - src/stores/tasks.ts
evidence:
  - src/stores/tasks.ts#symbol:MAX_TITLE_LENGTH
  - src/stores/tasks.ts#symbol:validateTitle
  - src/stores/tasks.ts#symbol:useTaskStore
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md
visibility: internal
contains_sensitive_info: false
---

# Domain Features

## Summary

- One feature area: a task list held in memory by `src/stores/tasks.ts`.
- There is no server, database, or authentication. The three starting tasks are mock data, and a reload restores them.

## Features

- **Add a task.** The title is trimmed first. An empty title is rejected with "Enter a title." A title longer than 80 characters is rejected with "Keep the title within 80 characters."
- **Complete or reopen a task** by toggling its checkbox.
- **Remove a task.**
- **Filter** by `all`, `active` (open) or `done`. In every filter, open tasks come before done tasks, and each group keeps the order in which tasks were added.
- **Open-task counter.** Counts the open tasks in the whole list, whatever the filter.

## API Services

- None. The app makes no network calls.

## Evidence

- `src/stores/tasks.ts#symbol:MAX_TITLE_LENGTH` — the 80-character title limit.
- `src/stores/tasks.ts#symbol:validateTitle` — the two rejection messages.
- `src/stores/tasks.ts#symbol:useTaskStore` — add, toggle, remove, filter, ordering, and the counter.

## Open Questions

- None.

## Review Notes

- 2026-10-27 — Enriched from `src/stores/tasks.ts` for the LLM-WIKI demo.
