# Real-LLM bench — `B2_empty` control arm, csap-roadkeeper-frontend (N=3)

> **What this run decides.** The 2026-07-24 measurement found arm B2 (retrieval) used
> **48.4% fewer input tokens** than arm B (no retrieval). That result could not say *why*: the
> win might come from the wiki's **knowledge**, or merely from the agent having **search tooling**.
> Until that was separated, no causal claim about the wiki was supportable — it is the reason the
> README performance headline stayed forbidden. This arm separates them.

## What ran

- **Arm:** `B2_empty` — B2's tools and a **byte-identical prompt** (`runner.js` asserts the parity
  at import time), same model, same tasks. The single difference is the wiki the tools query.
- **Fixture:** a stub wiki built by `bench/real/make-stub-wiki.mjs` from the target's real wiki —
  same 22 document paths, filenames, titles, and frontmatter, with `source_files` and `evidence`
  emptied (they name ground-truth files) and every body replaced by the generator's unenriched
  placeholder. 167,236 → 17,685 bytes. This is exactly what a repo looks like after
  `init --write` and before anyone enriches it.
- **Model:** `claude-opus-4-8`, `max_tokens: 8000`/turn, `thinking: adaptive`, `effort: high`.
- **Target repo:** `csap-roadkeeper-frontend@aws-global` — source reads/greps still hit the real
  repo, only the wiki tools were redirected. csap was never modified.
- **Repeats:** N=3 × 6 tasks = 18 runs. **Date:** 2026-07-27.

**Pre-flight validation (free, before any spend):** zero of the 13 ground-truth paths survive in
the stub; `search-docs` match counts drop from 12/3/18 to 1/0/1 on auth / session-timeout / hazard
while the tools still function; all six tasks report prompt parity OK; the runner refuses
`--arm B2_empty` without `BENCH_WIKI_CWD` so it cannot silently re-run B2.

## Result

| arm | runs | input | output | cost | input vs B | cost vs B |
| --- | --: | --: | --: | --: | --: | --: |
| B (no retrieval) | 18 | 856,410 | 31,554 | $5.0709 | — | — |
| B2 (retrieval, real wiki) | 18 | 441,521 | 29,549 | $2.9463 | **0.516× (−48.4%)** | 0.581× (−41.9%) |
| **B2_empty (tools, stub wiki)** | 18 | 976,159 | 42,832 | $5.9516 | **1.140× (+14.0%)** | 1.174× (+17.4%) |

**The control landed above B, not near B2.** Retrieval tooling over a wiki with no knowledge is
not merely neutral — it is a **net cost of +14% input tokens and +17% spend** versus not having
the wiki at all. `B2_empty` used **2.21× the input tokens of B2**.

### What this establishes

**The −48.4% win belongs to the wiki's enriched content, not to the retrieval tooling.** This was
the last load-bearing confound in the 2026-07-24 result, and it resolves in favor of the content.

The mechanism is visible in the behavior, not just the totals:

| arm | source files opened / run | wiki docs read / run | runs answering with 0 source reads |
| --- | --: | --: | --: |
| B | 3.22 | 0.00 | 0/18 |
| B2 | 0.67 | 1.39 | **8/18** |
| B2_empty | 2.39 | 1.11 | **0/18** |

`B2_empty` queried the stub wiki on essentially every run (1.11 `get_doc` calls/run), got nothing
usable, and fell back to reading source at nearly arm-B rates. **Not one of its 18 runs could
answer from the wiki**, against 8 of 18 for B2. So `B2_empty` ≈ B's source work *plus* the wasted
retrieval round-trip — which is precisely the +14%.

### A second, independent finding

**An unenriched wiki is worse than no wiki.** A scaffold that was generated and never filled in
costs the agent real tokens for nothing. That is not a footnote — it is a direct argument for the
enrichment and review discipline the tool enforces, and it is exactly the state
`content.not_enriched` flags.

## Per-task input tokens (mean)

| task | B | B2 | B2_empty | B2/B | B2_empty/B |
| --- | --: | --: | --: | --: | --: |
| auth-signin | 56,010 | 19,497 | 69,842 | 0.35× | 1.25× |
| routing-map | 7,385 | 23,378 | 20,733 | 3.17× | 2.81× |
| api-layer | 26,046 | 38,598 | 37,210 | 1.48× | 1.43× |
| hazard-domain | 83,894 | 20,040 | 75,809 | 0.24× | 0.90× |
| session-timeout | 47,417 | 27,209 | 32,616 | 0.57× | 0.69× |
| state-mgmt | 64,719 | 18,452 | 89,176 | 0.29× | 1.38× |

**The effect is not uniform, and two tasks contradict the aggregate:** on hazard-domain (0.90×)
and session-timeout (0.69×) the stub arm still beat B. Doc titles and paths survive in the stub, so
some orientation value may remain; run-to-run variance (max input CV 36%) may also account for it.
Reported rather than smoothed over.

## Honest caveats (read before quoting any number)

1. **The stub is a generous control.** It keeps document paths, filenames, and titles. A wiki that
   was truly absent would very likely cost more still, so **+14% is a lower bound** on the
   tooling-only penalty, not an upper one.
2. **Correctness is UNGRADED for this arm.** All 18 runs produced substantive answers (2.3–3.9k
   chars) and opened ground-truth files, but no rubric grade was performed. Do not pair the +14%
   with any accuracy claim. (B and B2 were blind-graded on 2026-07-24: 0.910 vs 0.971, zero
   hallucinations.)
3. **Single repo, single model, 6 tasks, N=3.** Unchanged from the prior run. This control closes
   the tooling-vs-knowledge question *for this fixture*; it does not make the result general.
4. **The gap against the 2026-07-22 run (−10%) is still unexplained.** Two real measurements of the
   same repo differ by 4–5×; driver path, token accounting, and fixture differ, but not
   demonstrably by that much.
5. **README / launch token and speed headlines remain FORBIDDEN.** This run removes the strongest
   objection to the finding, and the maintainer ratified the grading standard on a sampled review
   (2026-07-27), but neither enlarges the sample: the publication conditions (≥3 repo types,
   ≥2 model families, N≥5) are still unmet. Scoped footnote only.

## Cost

| run | input | output | cost |
| --- | --: | --: | --: |
| B2_empty N=3 | 976,159 | 42,832 | **$5.9516** |

Plus a $0.00018 one-call auth smoke test. This exceeded the $3–5.5 estimate given beforehand: the
stub arm both fell back to source *and* spent more output/thinking tokens (42,832 vs B's 31,554)
working around a wiki that could not help it. **Cumulative paid spend across all real runs:
≈$17.10** (2026-07-24 $11.15 + this $5.95), against the $19 cap noted in the runbook — roughly
$1.90 of headroom remains, so any further paid arm needs a new budget decision.

## Reproduce

```
node bench/real/make-stub-wiki.mjs --src <target-repo> --out <scratch> --force
BENCH_TARGET_REPO=<target-repo> BENCH_WIKI_CWD=<scratch> BENCH_TASKS=<...>/bench/tasks-csap.json \
  node bench/real/runner.js --arm B2_empty --repeats 3
node bench/real/aggregate.mjs bench/results/real-B-*.json bench/results/real-B2-*.json bench/results/real-B2_empty-*.json
```

Raw per-run data (every answer, token split, opened path, wiki doc):
`bench/results/real-B2_empty-2026-07-27T03-38-58-669Z.json`.
