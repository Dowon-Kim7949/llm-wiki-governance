# Real-driver PILOT — Claude, behavioral-only (2026-07-22)

> **NOT the publishable measurement.** This is a protocol-validation pilot of the option-B
> manual-driver path ([`../real/DRIVER_RUNBOOK.md`](../real/DRIVER_RUNBOOK.md)), run via
> **isolated Claude Code Explore subagents** (one fresh context per task-arm). It captures the
> **behavioral + correctness** axes only — tool-call count, files/docs opened, and rubric
> correctness. It does **NOT** capture BPE tokens or wall-clock (subagent usage isn't surfaced
> to the driver), so it **does not unblock any README token/speed claim**. N=1. Model: Claude
> Code Explore subagent (Claude).

## Per-task

| Task | B calls | B opened (src) | B correct | B2 calls | B2 opened | B2 source? | B2 correct |
| --- | --- | --- | --- | --- | --- | --- | --- |
| type-detection-mobile | 5 | 1 | ✓ | 8 | 2 docs | no | ✓ |
| audit-pipeline | 6 | 3 | ✓ | 5 | 1 doc | no | ✓ |
| config-merge | 8 | 2 | ✓ | 5 | 1 doc | no | ✓ |
| rule-toggle | 7 | 1 | ✓ | 6 | 2 docs | no | ✓ |
| skill-generation | 5 | 2 | ✓ | 8 | 1 doc + 1 src | **yes (fallback)** | ✓ |
| mcp-tools | 5 | 3 | ✓ | 9 | 2 docs | no | ✓ |
| **sum** | **36** | **12** | **6/6** | **41** | **10** | **1/6** | **6/6** |
| **mean** | **6.0** | **2.0** | | **6.83** | **1.67** | | |

## Deltas (B2 relative to B)

- **Tool calls: 1.14× (B2 +14%, WORSE).** Wiki search + reading 1–2 docs took as many or more
  calls than a targeted grep+read. Not a win on this axis.
- **Files/docs opened: 0.83× (B2 −17%).** Marginal.
- **Source files opened: B 6/6 → B2 1/6.** B2 reached correct, grounded answers from 1–2
  targeted wiki docs WITHOUT opening source in 5 of 6 tasks.
- **Correctness: 6/6 tie.** Both arms found and correctly answered every task (matches the
  proxy's 100%/100% findability tie).

## Honest read

1. **The behavioral proxy (tool-call count) does NOT show a retrieval win here — it is slightly
   negative (+14%).** This is an unfavorable, honest result on that axis.
2. **The real qualitative signal is source-avoidance:** B2 answered correctly by reading small
   targeted wiki docs and never opening source in 5/6 — the rediscovery/orientation cost the
   proxy's B2 arm was designed to model. But "opened a doc vs opened a source file" is a
   **size** difference, not a **count** difference — and size (tokens) is exactly what this
   run cannot measure.
3. **The token headline is still unmeasured.** Only `/cost` from interactive sessions (or the
   SDK path) can settle whether the smaller doc reads translate to fewer tokens. Until then the
   README token/speed claim stays forbidden.

## Findings worth acting on

- **`search-docs` scorer noise:** `docs/llm-wiki/log.md` (append-only change log) ranks #1 for
  most queries under the naive keyword scorer, forcing B2 to skip it and search again — this
  inflated B2's tool-call count (e.g. mobile: 8 calls). A scorer fix (deprioritize/skip the
  change log) would directly improve the retrieval arm. (Already noted in the B2-arm design.)
- The protocol itself runs cleanly end-to-end: isolated fresh context per arm, read-only, no
  repo mutation, all 12 arms produced gradeable answers.

## To get the real number

Run the same 12 arms interactively in Claude Code (fresh session each), read `/cost` per run,
record tokens + wall-clock. See [`../real/DRIVER_RUNBOOK.md`](../real/DRIVER_RUNBOOK.md). A Codex
pass gives a second, separately-labeled data point.
