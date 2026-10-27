---
title: Architecture Conventions
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: architecture_conventions
project: llm-wiki-vue3-typescript-demo
last_updated: 2026-10-27
author: cli-generated
last_edited_by: demo-enrichment
wiki_block_version: v1
source_files:
  - package.json
  - index.html
  - src/main.ts
  - src/App.vue
  - src/components/TaskForm.vue
  - src/components/TaskList.vue
  - src/types.ts
evidence:
  - package.json#section:scripts
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/DOMAIN_FEATURES.md
visibility: internal
contains_sensitive_info: false
---

# Architecture Conventions

## Summary

- A Vite + Vue 3 single-page app written in TypeScript. There is no router, no server, and no persistence.
- `src/main.ts` mounts `App.vue` on the `#app` element in `index.html`; `App.vue` renders two components.

## Layout

| Path | Role |
| --- | --- |
| `src/main.ts` | Creates the app and mounts it. |
| `src/App.vue` | Page shell: renders `TaskForm` and `TaskList`. |
| `src/components/TaskForm.vue` | Input for a new task; shows the message the store returns when a title is rejected. |
| `src/components/TaskList.vue` | Filter buttons, the task list, and the open-task counter. |
| `src/types.ts` | Shared types: `Task` and `TaskFilter`. |
| `src/stores/tasks.ts` | The task store. Its rules are documented in [Domain Features](DOMAIN_FEATURES.md). |

## Conventions

- Components use `<script setup lang="ts">`.
- Components read and change task state only through `useTaskStore()`. The state it returns is read-only, so a component cannot assign to it directly.
- Shared types live in `src/types.ts`, not inside components.
- `npm run build` runs `vue-tsc --noEmit` before `vite build`, so a type error fails the build.

## Evidence

- `src/main.ts`, `src/App.vue` — mounting and the page shell.
- `src/components/TaskForm.vue`, `src/components/TaskList.vue` — both call `useTaskStore()`; neither assigns to store state.
- `package.json#section:scripts` — `build` type-checks before bundling.

## Review Notes

- 2026-10-27 — Enriched from the source files listed above for the LLM-WIKI demo.
