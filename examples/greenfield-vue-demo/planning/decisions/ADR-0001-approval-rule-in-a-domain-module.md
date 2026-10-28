---
title: "ADR-0001: The approval rule lives in a domain module"
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: decision
project: agent-task-board
last_updated: 2026-10-27
author: project-owner
last_edited_by: coding-agent
wiki_block_version: v1
source_files: []
evidence: []
related:
  - docs/llm-wiki/requirements/REQ-001-approval-before-agent-run.md
visibility: internal
contains_sensitive_info: false
---

# ADR-0001: The approval rule lives in a domain module

## Decision Status

- Accepted.

## Context

- [REQ-001](../requirements/REQ-001-approval-before-agent-run.md) must hold whatever the UI does, and the owners want its acceptance criteria checked by fast tests that need no browser.

## Decision

- The approval rule is a plain TypeScript module, `src/domain/approval.ts`, with no Vue or browser imports. Components call it; they do not re-implement it.

## Alternatives Considered

- Checking approval inside the Vue component that starts a run: rejected, because a second caller would bypass it and testing it would need a DOM.
- A Pinia store: rejected for the first release, because nothing else needs shared state yet.

## Consequences

- The rule is tested with `node --test` and no dependencies.
- Every place that starts an agent run has to go through `startAgentRun`.

## Evidence

- None yet: the module does not exist.

## Review Notes

- Recorded from the owners' statements; keep as `needs_review` until they review it.
