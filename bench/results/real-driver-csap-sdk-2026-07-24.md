# Real-LLM bench — SDK-path driver, csap-roadkeeper-frontend (N=3)

> **Scope, read first.** This is a **single-repo, single-model** real-LLM measurement, not a
> broad benchmark. It is a *scoped footnote*, not a headline. Per `bench/METHODOLOGY.md` §10 and
> `bench/real/DRIVER_RUNBOOK.md`, **no token/speed headline ships in the README or launch copy**
> on the strength of this run. The honest ceiling of this result is: "on these six tasks, on this
> one repo, with this one model."

## What ran

- **Driver:** `bench/real/agent.js` (SDK path, `client.beta.messages.toolRunner`), orchestrated by
  `bench/real/runner.js`. Real per-call `usage` → real **input/output token split**.
- **Model:** `claude-opus-4-8`, `max_tokens: 8000`/turn, `thinking: adaptive`, `effort: high`.
- **Target repo:** `csap-roadkeeper-frontend@aws-global` (external, non-self-referential Vue3/Quasar SPA).
- **Wiki queried (arm B2):** the repo's committed `docs/llm-wiki` via the read-only `search-docs`/`get-doc`/`get-related` CLI.
- **Tasks:** `bench/tasks-csap.json` — 6 cold-keyword comprehension tasks (auth-signin, routing-map,
  api-layer, hazard-domain, session-timeout, state-mgmt). Questions avoid internal symbol names so
  arm B is not rigged.
- **Arms:** **B** = no-retrieval (own `read`/`grep`, wiki blocked) vs **B2** = retrieval
  (`search_docs`/`get_doc`/`get_related` + `read`/`grep`, wiki first). Same task text both arms;
  only the first-step + tool set differ. Fresh session per (task, arm, repeat).
- **Repeats:** N=3 (measurement). N=1 also run first as calibration.
- **Date:** 2026-07-24. Harness read-only; csap never mutated.

## Fixture health (verified good before the run)

`llm-wiki stats` on the target: **22/22 docs verified, enriched 100%, evidence 100%,
staleVerified 0**. `validate --strict` → 0 findings. `drift` → 0. The two historically drift-prone
areas were re-grounded against source before trusting B2: **auth-signin** (wiki correctly states
RSA-OAEP client-side password encryption + cookie session — the old "plaintext" drift is gone) and
**hazard-domain** (wiki correctly maps `/hazards_list` → `OverallHazardsListPage.vue`). The
stale-wiki confound of earlier runs is therefore absent — this is a clean fixture.

## Results — N=3 (per-task mean input tokens)

| task | B input | B2 input | B2/B | B output | B2 output |
| --- | --: | --: | --: | --: | --: |
| auth-signin | 56,010 | 19,497 | 0.35× | 2,145 | 1,769 |
| routing-map | 7,385 | 23,378 | **3.17×** | 1,325 | 1,484 |
| api-layer | 26,046 | 38,598 | 1.48× | 1,855 | 2,242 |
| hazard-domain | 83,894 | 20,040 | 0.24× | 1,564 | 1,383 |
| session-timeout | 47,417 | 27,209 | 0.57× | 2,039 | 1,596 |
| state-mgmt | 64,719 | 18,452 | 0.29× | 1,591 | 1,376 |

### Headline ratios (report the RATIO, not the totals — totals include agent/tool scaffolding)

| metric | B (no-retrieval) | B2 (retrieval) | B2/B |
| --- | --: | --: | --: |
| input tokens (18 runs) | 856,410 | 441,521 | **0.516× (−48.4%)** |
| output tokens (18 runs) | 31,554 | 29,549 | 0.936× (−6.4%) |
| cost @ $5/$25 per 1M | $5.0709 | $2.9463 | 0.581× (−41.9%) |

- **Pooled (N=1 + N=3 = 4 samples/task):** input B2/B = **0.593× (−40.7%)**, output = 0.952×.
  The pooled figure is the more conservative one to cite.

## Run-to-run variance (why N=1 is not enough)

Input-token coefficient of variation across the 3 repeats is high on several tasks — e.g.
session-timeout B CV=59%, api-layer B CV=39%, auth-signin B2 CV=41%. N=1 alone gave input B2/B =
0.83× (−17%) because of unlucky single samples (a routing-map spike and a hazard-domain B2 spike);
N=3 means land at −48%. **Cite the mean with the spread, never a single run.** More repeats (N≥5)
would tighten the interval further.

## Behavior (mechanism check)

- **Arm B** opened the ground-truth source files directly every task (5–8 tool calls, no wiki) — behaves as designed.
- **Arm B2** queried the wiki first; on 3/6 tasks (auth-signin, routing-map, hazard-domain) it
  answered from the wiki with **zero** source reads, and on the other 3 it opened 1–2 source files
  as fallback — the intended "wiki first, source only if needed" pattern.
- **routing-map is the one task where retrieval loses** (3.17×): `src/router/routes.ts` is small, so
  arm B reads it cheaply, while B2 pays for a wiki query *and* still opens the source. Retrieval's
  win grows with how expensive the from-source path is (hazard-domain, state-mgmt).

## Correctness — GRADED (blind-to-arm agent rubric grade, 2026-07-24)

The harness records answers with `score: null` and **never self-grades**. A token win is meaningless
if B2 answers are worse. All 36 N=3 answers were therefore graded against each task's ground-truth +
rubric. **How the grade was made honest:** answers were extracted, **stripped of their arm label, and
shuffled within each task** (see `real-driver-csap-sdk-2026-07-24-grading.md`); each was then scored
purely on rubric-claim coverage (how many of the task's key claims it states correctly, files located,
any hallucination) **without knowing which arm produced it**. Arms were re-attached only at aggregation.

> **What this grade is / is not.** This is an **agent rubric-grade, blind to arm** — rigorous and
> arm-unbiased, but produced by a model in the same family as the one under test, **not** an independent
> human blind grade. It raises confidence; it does not replace a human ratification pass. Numbers below
> are rubric-claim coverage, a completeness proxy, not an absolute "truth score".

### Result — accuracy by arm (18 answers each)

| metric | B (no-retrieval) | B2 (retrieval) |
| --- | --: | --: |
| mean rubric-claim fraction | **0.910** | **0.971** |
| pooled claims stated | 62.5 / 69 (90.6%) | 66.5 / 69 (96.4%) |
| hallucinations / wrong-file answers | **0** | **0** |

Per task (mean fraction): auth-signin B 1.00 / B2 0.87 · routing-map 1.00 / 1.00 · api-layer 1.00 / 1.00 ·
hazard-domain B 0.875 / B2 1.00 · session-timeout 1.00 / 1.00 · state-mgmt B **0.58** / B2 **0.96**.

**Verdict: correctness is a tie-to-slight-edge for B2 — there is no accuracy penalty for retrieval.**
The only task where B beat B2 is auth-signin, where 2/3 B2 answers omitted the 419/`201403` refresh-
interceptor rubric point (arguably out of scope for "how does sign-in work"); B, having opened
`axiosInstance.ts` directly, always mentioned it. Conversely B2's edge is concentrated in **state-mgmt**
(B often missed "no bearer token / HTTP-only cookie" and misstated the `beforeEach` guard as
"redirect to re-login" rather than "rehydrate the store from sessionStorage") and **hazard-domain** —
places where the verified wiki supplied a correct architectural fact the source-only arm skimmed past.
Two minor inaccuracies total, both non-fatal: one B2 session-timeout answer put `useSessionTimeout.ts`
under `utils/api/` instead of `composables/`; one B state-mgmt answer inverted the guard's behavior.

**Paired conclusion (scoped):** on these 6 tasks / this 1 repo / this 1 model, retrieval (B2) cut input
tokens **−48.4%** and cost **−41.9%** at N=3 **with no loss of correctness** (in fact +6pp rubric coverage).
The token/cost saving is therefore a *real* finding for this fixture — but it stays a **scoped footnote**,
not a README/launch headline (single-repo, single-model, N=3, agent-graded). A human ratification of the
worksheet would close the last methodological gap.

## Cost / spend

| run | input | output | cost |
| --- | --: | --: | --: |
| N=1 calibration — B | 283,244 | 10,794 | $1.686 |
| N=1 calibration — B2 | 234,685 | 10,764 | $1.443 |
| N=3 — B | 856,410 | 31,554 | $5.071 |
| N=3 — B2 | 441,521 | 29,549 | $2.946 |
| **total (all paid runs)** | | | **$11.15** |

Plus a ~$0.0002 one-call smoke test. Well under the $19 hard cap.

## Honest caveats (read before quoting any number)

1. **Single repo, single model, 6 tasks, N=3.** Not a multi-project / multi-model claim.
2. **Tooling vs knowledge is not isolated here.** B2's win could partly be the *tools*, not the
   *wiki content*. To separate them, add a third arm — B2's retrieval tools over an **empty/stub
   wiki** — and re-run. Not done in this pass.
3. **Correctness is unmeasured** (see above). Do not pair the −48% with any accuracy claim until the
   blind grade is in.
4. **README/launch token & speed headlines remain FORBIDDEN** on the strength of this run. This file
   is the scoped evidence record, not marketing copy.
5. These are **real** model-reported token counts (not the `chars/4` proxy) — that is the one thing
   this run upgrades over the proxy/whole-task harnesses. Keep the three harness vocabularies separate.
