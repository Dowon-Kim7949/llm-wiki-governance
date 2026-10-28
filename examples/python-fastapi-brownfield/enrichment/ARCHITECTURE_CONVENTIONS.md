---
title: Architecture Conventions
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: architecture_conventions
project: order-service
last_updated: 2026-10-28
author: cli-generated
last_edited_by: demo-enrichment
wiki_block_version: v1
source_files:
  - app/main.py
  - pyproject.toml
evidence:
  - app/models.py#symbol:OrderRequest
  - app/models.py#symbol:OrderTotal
related:
  - docs/llm-wiki/index.md
  - docs/llm-wiki/DOMAIN_FEATURES.md
visibility: internal
contains_sensitive_info: false
---

# Architecture Conventions

## Summary

- A FastAPI service in three layers: `app/main.py` registers routers, `app/routers/` maps HTTP to calls, and `app/services/` holds the business rules with no HTTP in them.

## Module Layout

- `app/main.py` — the FastAPI app and router registration. No business rule lives here.
- `app/routers/` — one module per resource; request validation is pydantic's.
- `app/services/` — rules that can be tested without a server.
- `app/models.py` — pydantic request and response shapes shared by routers and services.
- `tests/` — pytest tests for the services (`pip install -e .[test]`, then `pytest`).

## Conventions

- Money is an integer number of cents everywhere; there are no floats in prices.
- A service raises a domain exception and the router maps it to an HTTP status.

## Evidence

- `app/models.py#symbol:OrderRequest` — the request shape (items and an optional coupon).
- `app/models.py#symbol:OrderTotal` — the response shape, all integer cents.

## Open Questions

- None.

## Review Notes

- Enriched from `app/main.py`, `app/models.py` and `pyproject.toml` for the LLM-WIKI brownfield walkthrough.
