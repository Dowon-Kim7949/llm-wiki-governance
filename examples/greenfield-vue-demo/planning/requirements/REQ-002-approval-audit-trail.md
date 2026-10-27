---
title: "REQ-002: Approval audit trail"
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
visibility: internal
contains_sensitive_info: false
---

# REQ-002: Approval audit trail

## Requirement

- Every approval and every refused approval is recorded with who, when, and which task, so a reviewer can reconstruct why an agent run was allowed.

## Acceptance Criteria

- AC-1: Approving a task records the approver, the task, and the time.
- AC-2: A refused approval records the reason it was refused.

## Constraints

- Deferred: not part of the first release.

## Related Decisions

- None yet.

## Evidence

- None yet: deferred, and no code implements it.

## Open Questions

- Where the records are stored (browser storage or a later backend) is not decided.

## Review Notes

- Approved as a plan for a later release; it is expected to stay unlinked until then.
