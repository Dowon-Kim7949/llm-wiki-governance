# End-to-end walk-through: `init → enrich → validate → review`

A documented walk-through of the full LLM-WIKI loop on a small backend project
(`acme-widgets`, a Fastify service). The commands are real; the outputs are
trimmed and redacted for brevity. Nothing here is a runnable fixture — copy the
commands into your own repo.

This lives outside `docs/llm-wiki/` on purpose: it is a tutorial, not a governed
wiki document.

The loop in one line: **the CLI scaffolds → an agent enriches from real code
(stays `needs_review`) → a human reviews and promotes to `verified`.** No command
the CLI runs can promote a document on its own.

## 1. Scaffold — `quickstart --write`

Preview first (writes nothing), then create the files:

```console
$ npx llm-wiki-governance@latest quickstart --dry-run --type backend
# LLM-WIKI Quickstart

## Completed Steps
- doctor completed.
- init --dry-run completed.
- handoff prompt prepared.

## Init Summary
- project_type: backend
- confidence: explicit
- planned: 16
- skipped: 1

## Next Step
- CLI preview is complete. After you write the files for real, hand off to your
  coding agent and run the printed prompt.
...
```

```console
$ npx llm-wiki-governance@latest quickstart --write --type backend --agent claude
# creates docs/llm-wiki/** (core + backend profile + detected domains),
# the CLAUDE.md adapter, and prints the handoff prompt to paste into your agent.
```

Generated documents start as `status: needs_review` — empty scaffolds, not
knowledge yet. `--doc-lang ko` generates the wiki in Korean instead of English.

## 2. Enrich — paste the handoff prompt into your coding agent

The printed **Handoff Prompt** is an instruction for your coding agent (Claude
Code / Codex), *not* a CLI command. The agent reads `docs/llm-wiki/index.md`,
inspects the real routes/models/services, and replaces the placeholders with
source-backed content — updating `source_files` / `evidence` as it goes. Or run
the generated skill directly:

```
/llm-wiki-bootstrap      # first-time enrichment of the fresh scaffold
```

Everything the agent writes stays `needs_review`. The agent never sets
`verified`.

## 3. Validate — structure & safety (local / CI)

```console
$ npx llm-wiki-governance validate --strict
# LLM-WIKI Validate

## Summary
- result: pass
- project_type: backend
- findings: 0
```

When something is off, findings are `severity · rule · path` and are explainable:

```console
$ npx llm-wiki-governance validate
## Findings
- [warning] content.not_enriched docs/llm-wiki/domains/02_orders.md: still contains placeholder guidance
- [warning] evidence.missing    docs/llm-wiki/API_SERVICES.md: evidence points to a file that does not exist

$ npx llm-wiki-governance explain content.not_enriched   # what it means + how to fix
```

Wire `validate` into CI (see [`../docs/OPERATIONS.md`](../docs/OPERATIONS.md));
add `--strict` once the corpus is stable, and `--changed`/`impact` to fail a PR
that changes governed code without updating its doc.

## 4. Review — promote good docs to `verified` (the human step)

Generation is proven; the weakest part of the loop is a human actually reviewing
the backlog. `review` makes that cheap. **List mode is read-only** — it
risk-ranks the `needs_review` documents (never-enriched / thin / no-evidence /
broken-link first) so you spot-check the risky ones first:

```console
$ npx llm-wiki-governance review
# LLM-WIKI Review

## Summary
- needs_review: 6
- approvable: 5
- blocked_by_findings: 1

## Needs Review (risk-ranked)
- docs/llm-wiki/domains/02_orders.md — Orders [risk 65, no-evidence] findings: 2 (warning=2)
- docs/llm-wiki/API_SERVICES.md — API Services [risk 100, BLOCKED] findings: 1 (error=1)
- docs/llm-wiki/domains/01_widgets.md — Widgets [risk 5] findings: 0
...
```

After reading a doc and confirming it is source-backed, promote it. This is the
**only** way a document becomes `verified`, and it stamps just the review
metadata (`status: verified` + `reviewed_by` + `reviewed_at`) — never the body,
`source_files`, `evidence`, or `last_updated`:

```console
$ npx llm-wiki-governance review --approve docs/llm-wiki/domains/01_widgets.md --reviewer "Your Name"
## Summary
- result: pass
- reviewer: Your Name
- approved: 1
- refused: 0

## Approved (-> verified)
- docs/llm-wiki/domains/01_widgets.md: verified (reviewed_by Your Name)
```

Safeguards: it **refuses** any doc with blocking/structural findings (the
`API_SERVICES.md` above stays `needs_review` until its `evidence.missing` error
is fixed), never auto-verifies, and `--approve-all` requires an explicit `--yes`.
`reviewed_by` resolves `--reviewer` → config `reviewer` → git `user.name`, and
refuses to stamp rather than write a blank/fabricated reviewer.

## 5. Keep it current

- Update the wiki in the same change as the code (`prepare --task "…"`, then the `/llm-wiki-feature` or `/llm-wiki-fix` skill).
- `validate --changed --since <base>` and `impact --strict` in PR CI catch a governed-code change whose doc was not updated.
- `drift` reports `evidence.stale`; `drift --downgrade` flips a stale `verified` doc back to `needs_review` so it re-enters the `review` queue.
- Let agents self-serve with the read-only MCP server (`mcp`) instead of re-scanning the code.

## See also

- [`../docs/OPERATIONS.md`](../docs/OPERATIONS.md) — running this at small-repo / medium-repo / monorepo scale.
- [`../docs/llm-wiki/PUBLIC_API.md`](../docs/llm-wiki/PUBLIC_API.md) — full command / option reference.
- [`../GATE_REVIEW.md`](../GATE_REVIEW.md) — the accepted safety scope for every write path (including `review`, Gate 20).
