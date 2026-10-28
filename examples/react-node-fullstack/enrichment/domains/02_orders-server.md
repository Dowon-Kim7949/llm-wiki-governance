---
title: Orders (server)
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: domain
project: shop
last_updated: 2026-10-28
author: cli-generated
last_edited_by: demo-enrichment
wiki_block_version: v1
source_files:
  - server/src/routes/orders.js
  - shared/orders-contract.json
evidence:
  - server/src/routes/orders.js#symbol:ORDERS
  - server/src/routes/orders.js#symbol:ordersRouter
related:
  - docs/llm-wiki/API_CONTRACTS.md
visibility: internal
contains_sensitive_info: false
---

# Orders (server)

## Summary

- The Express server answers `GET /api/orders` from an in-memory list. There is no database.

## Behavior

- Orders are returned in the order they are stored, with no filtering and no paging.

## Evidence

- `server/src/routes/orders.js#symbol:ORDERS` — the stored orders.
- `server/src/routes/orders.js#symbol:ordersRouter` — the route.

## Open Questions

- Where orders will be persisted is not decided.

## Review Notes

- Enriched from `server/src/` for the LLM-WIKI full-stack walkthrough.
