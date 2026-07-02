---
title: LLM-WIKI Verification Fixtures
tags:
  - llm-wiki
  - verification
  - fixtures
  - needs-review
status: needs_review
doc_type: test_fixture_index
project: sinkholemonitor-frontend
last_updated: 2026-07-02
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - ACTION_PLAN.md
  - packages/llm-wiki-standard/tests/verification.test.js
related:
  - packages/llm-wiki-standard/README.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Verification Fixtures

The Phase 8 verification tests create temporary fixture projects at runtime instead of committing many generated projects.

Covered scenarios:

- empty zero-base project `init --dry-run`
- frontend detection and profile document suggestions
- backend detection and profile document suggestions
- fullstack detection and contract boundary suggestions
- existing LLM-WIKI frontmatter validation
- Korean UTF-8 content audit
- migration dry-run safety
- `migrate --apply` blocked behavior
- sensitive-looking value redaction
