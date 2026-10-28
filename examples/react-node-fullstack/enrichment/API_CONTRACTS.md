---
title: API Contracts
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: public_api
project: shop
last_updated: 2026-10-28
author: cli-generated
last_edited_by: demo-enrichment
wiki_block_version: v1
source_files:
  - shared/orders-contract.json
evidence:
  - server/src/routes/orders.js#symbol:ordersRouter
  - client/src/api/orders.ts#symbol:listOrders
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/domains/01_orders-client.md
  - docs/llm-wiki/domains/02_orders-server.md
visibility: internal
contains_sensitive_info: false
---

# API Contracts

## Summary

- The client and the server meet at one endpoint, written down once in `shared/orders-contract.json`. Both sides are typed by hand against it; nothing generates either side from the file.

## Endpoints

- `GET /api/orders` returns an array of orders. Each order has `id` (string), `totalCents` (integer, cents) and `status` (`pending`, `paid` or `shipped`).

## Changing The Contract

- Change `shared/orders-contract.json`, the server route, and the client type in the same pull request. A contract change touches both domain documents as well.

## Evidence

- `server/src/routes/orders.js#symbol:ordersRouter` — the server side of `GET /api/orders`.
- `client/src/api/orders.ts#symbol:listOrders` — the client side of the same endpoint.

## Open Questions

- Pagination is not specified; the server returns every order.

## Review Notes

- Enriched from the contract file and both sides of the endpoint for the LLM-WIKI full-stack walkthrough.
