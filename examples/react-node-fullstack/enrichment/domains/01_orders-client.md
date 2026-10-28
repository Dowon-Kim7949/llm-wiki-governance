---
title: Orders (client)
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
  - client/src/components/OrderList.tsx
  - shared/orders-contract.json
evidence:
  - client/src/api/orders.ts#symbol:listOrders
  - client/src/api/orders.ts#symbol:formatTotal
related:
  - docs/llm-wiki/API_CONTRACTS.md
visibility: internal
contains_sensitive_info: false
---

# Orders (client)

## Summary

- The React client lists orders. `OrderList` loads them once on mount and shows each order's id, total and status.

## Behavior

- Totals arrive in cents and are shown in dollars with two decimals (`formatTotal`).
- A failed request throws with the HTTP status; there is no retry and no error view yet.

## Evidence

- `client/src/api/orders.ts#symbol:listOrders` — the request and the error on a non-2xx response.
- `client/src/api/orders.ts#symbol:formatTotal` — cents to a dollar string.

## Open Questions

- The error view is not designed.

## Review Notes

- Enriched from `client/src/` for the LLM-WIKI full-stack walkthrough.
