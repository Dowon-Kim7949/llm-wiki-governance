---
title: LLM-WIKI Rule Assets
tags:
  - llm-wiki
  - templates/rules
  - needs-review
status: needs_review
doc_type: rule_asset_index
project: llm-wiki-governance
last_updated: 2026-07-02
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - templates/rules/frontmatter.schema.json
  - templates/rules/frontmatter-required.json
  - src/frontmatter.js
  - src/frontmatter-schema.js
  - src/config.js
related:
  - README.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Rule Assets

This directory stores machine-readable rules for the CLI. Rules remain `needs_review` until a human reviewer verifies changes for the consuming project.

## Frontmatter Schema

- `rules/frontmatter.schema.json` is the published JSON Schema contract for LLM-WIKI frontmatter.
- The schema defines required fields, valid `status` values, valid `visibility` values, optional `aliases` and `evidence`, and the review metadata expected when a document is `verified`.
- Optional `evidence` entries are small string references: `file`, `file#L10`, `file#L10-L20`, `file:10-20`, `file#symbol:Name`, `file#section:Heading`, `file#route:/path`, a full `https://` URL, or a `repo:<name>/<path>` cross-repo reference. A bare `#anchor` names no source and is not valid evidence.
- Runtime validation uses the same contract through `src/frontmatter-schema.js`. The evidence `pattern` is defined once there (`EVIDENCE_REFERENCE_PATTERN`, 1.33.0) and the runtime parser accepts only what it matches, so an editor validating against this schema and the CLI agree on shape; the CLI additionally rejects a backwards line range, which a pattern cannot express.
- `rules/frontmatter-required.json` remains a compact legacy summary for wrappers that only need field and enum lists.
