---
title: Domain Features
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: domain_overview
project: order-service
last_updated: 2026-10-28
author: cli-generated
last_edited_by: demo-enrichment
wiki_block_version: v1
source_files:
  - app/services/pricing.py
  - app/routers/orders.py
evidence:
  - app/services/pricing.py#symbol:calculate_total
  - app/services/pricing.py#symbol:COUPONS
  - app/routers/orders.py#symbol:quote_order
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md
visibility: internal
contains_sensitive_info: false
---

# Domain Features

## Summary

- One feature area: quoting an order total. There is no persistence; the service prices what it is sent.

## Features

- **Quote an order.** `POST /orders/quote` takes line items (SKU, unit price in cents, quantity) and an optional coupon, and returns the subtotal, the discount and the total, all in integer cents.
- **Coupons.** `WELCOME10` takes 10% off the subtotal and `VIP20` takes 20%. The discount is rounded down to a whole cent. Any other code is refused with HTTP 422.

## API Services

- `POST /orders/quote` in `app/routers/orders.py`. The router only maps an unknown coupon to 422; the arithmetic is in `app/services/pricing.py`.

## Evidence

- `app/services/pricing.py#symbol:calculate_total` — subtotal, discount (rounded down) and total.
- `app/services/pricing.py#symbol:COUPONS` — the two coupon codes and their percentages.
- `app/routers/orders.py#symbol:quote_order` — the endpoint and the 422 for an unknown coupon.

## Open Questions

- Whether coupons can be combined is not decided; the code accepts one.

## Review Notes

- Enriched from `app/services/pricing.py` and `app/routers/orders.py` for the LLM-WIKI brownfield walkthrough.
