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
evidence: []
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

- None yet: no code implements this requirement.

## Open Questions

- Whether an approval should expire is not decided.

## Review Notes

- Recorded from the owners' statements; keep as `needs_review` until they review it.
