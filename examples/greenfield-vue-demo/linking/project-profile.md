---
title: Project Profile
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: project_profile
project: agent-task-board
last_updated: 2026-10-27
author: project-owner
last_edited_by: coding-agent
wiki_block_version: v1
source_files:
  - package.json
  - src/main.ts
evidence: []
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/requirements/00_overview.md
visibility: internal
contains_sensitive_info: false
---

# Project Profile

## Detected Project

- type: `frontend` (Vue 3 + TypeScript, built with Vite)
- stage: first release in progress — REQ-001 is implemented, REQ-002 is deferred.

## Summary

- Agent Task Board lets developers queue work for an AI coding agent. The owners want one guarantee above all: an agent never starts on a task that an authorized developer has not approved.

## Scope

- In scope: creating tasks, approving them, and starting an agent run on an approved task ([REQ-001](./requirements/REQ-001-approval-before-agent-run.md)).
- Deferred: an audit trail of approvals ([REQ-002](./requirements/REQ-002-approval-audit-trail.md)).
- Non-goals: running the agent itself, merging its changes, or deploying anything.

## Constraints

- Vue 3 + TypeScript in the browser; no backend in the first release.
- The approval rule must be testable without a browser ([ADR-0001](./decisions/ADR-0001-approval-rule-in-a-domain-module.md)).

## Evidence

- `package.json`: Vue 3, Vite, and `npm test`, which runs the domain tests with Node's type stripping and no test framework.
- `src/main.ts`: mounts `App.vue`, the only component; it calls the domain module and shows its refusals.

## Open Questions

- Who holds the `lead` and `maintainer` roles outside the demo is not decided.

## Review Notes

- Updated once code existed: the planned statements were checked against `package.json` and `src/main.ts`; back to `needs_review` for the owners to approve again.
