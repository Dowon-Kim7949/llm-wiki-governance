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
source_files: []
evidence: []
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/requirements/00_overview.md
visibility: internal
contains_sensitive_info: false
---

# Project Profile

## Detected Project

- type: `unknown`
- stage: greenfield — this repository held only a README when the plan was recorded.

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

- None yet: no application source exists. This document states the owners' intent.

## Open Questions

- Who holds the `lead` and `maintainer` roles outside the demo is not decided.

## Review Notes

- Recorded from the owners' statements; keep as `needs_review` until they review it.
