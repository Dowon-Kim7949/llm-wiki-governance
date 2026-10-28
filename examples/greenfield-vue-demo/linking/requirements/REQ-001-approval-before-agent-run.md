---
title: "REQ-001: Approval before agent run"
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: requirement
project: agent-task-board
last_updated: 2026-10-27
author: project-owner
last_edited_by: coding-agent
wiki_block_version: v1
source_files: []
evidence:
  - src/domain/approval.ts#symbol:startAgentRun
  - src/domain/approval.ts#symbol:approveTask
  - tests/approval.test.ts
related:
  - docs/llm-wiki/requirements/00_overview.md
  - docs/llm-wiki/decisions/ADR-0001-approval-rule-in-a-domain-module.md
visibility: internal
contains_sensitive_info: false
---

# REQ-001: Approval before agent run

## Requirement

- An AI coding agent must not start work on a task until a developer with an approver role (`lead` or `maintainer`) has approved that task.

## Acceptance Criteria

- AC-1: A newly created task is in `pending_approval`.
- AC-2: Starting an agent run on a task that is not approved is refused.
- AC-3: An approval by someone without an approver role is refused.
- AC-4: An approved task can start an agent run.

## Constraints

- The rule holds whatever the UI does: it is checked where a run starts, not only by a disabled button.

## Related Decisions

- [ADR-0001: The approval rule lives in a domain module](../decisions/ADR-0001-approval-rule-in-a-domain-module.md)

## Evidence

- `src/domain/approval.ts#symbol:startAgentRun` refuses a run unless the task is approved (AC-2, AC-4).
- `src/domain/approval.ts#symbol:approveTask` refuses an approver without an approver role (AC-3).
- `tests/approval.test.ts` has one test per criterion, AC-1 to AC-4 (`npm test`).
- These references show where REQ-001 is implemented. The tests passing is what checks it, and a reviewer decides whether that is enough.

## Open Questions

- Whether an approval should expire is not decided.

## Review Notes

- Implementation evidence linked after the first implementation; back to `needs_review` for the owners to approve again.
