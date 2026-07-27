# Blind grading worksheet — three-arm csap bench (B / B2 / B2_empty, N=3, 2026-07-27)

> **What this adds.** The `B2_empty` control arm settled the *token* question — the −48.4% belongs
> to the wiki's content, not the retrieval tooling. It left one thing open: whether the control's
> answers were still **correct**. All 54 answers (18 per arm) were therefore graded blind to arm.

## Method (why this is arm-unbiased)

1. All 54 answers extracted from the three N=3 result JSONs by
   `bench/real/make-grading-worksheet.mjs`.
2. Within each task, the 9 answers (3 per arm) were **stripped of their arm label and shuffled by
   a deterministic content hash**, then presented as `<task>-A..I`.
3. Each answer was scored **without knowing its arm**, purely on rubric-claim coverage: how many of
   the task's key claims it states correctly, whether the responsible files are located, any
   hallucination. Grades were written to `grades.json` **before** the label map was opened.
4. Arms were re-attached only at aggregation.

**Consistency check — the strongest evidence that this grading is stable.** Arm B and arm B2 were
graded here a second time, blind, without reference to the 2026-07-24 worksheet. Arm B reproduced
**exactly**: 0.9097 mean fraction, 62.5/69 pooled, against 0.910 / 62.5/69 recorded on 2026-07-24.
Both previously-noted individual defects were independently re-found and re-attributed to the same
arms: the inverted router-guard claim landed on **B**, and the `useSessionTimeout` path error on
**B2**. Arm B2 came out 0.978 here against 0.971 recorded — a single half-claim difference on one
state-mgmt answer out of 69.

**Caveat, unchanged and load-bearing:** this is an **agent** rubric-grade, blind to arm, from a
model in the same family as the one under test — not an independent human blind grade. Blinding
removes label bias, not every cue: an answer can still betray its arm by citing a wiki document.
Rubric-claim coverage is a completeness proxy, not an absolute truth score.

## Result — accuracy by arm (18 answers each)

| metric | B (no retrieval) | B2 (retrieval, real wiki) | B2_empty (tools, stub wiki) |
| --- | --: | --: | --: |
| mean rubric-claim fraction | 0.910 | **0.978** | 0.911 |
| pooled claims stated | 62.5 / 69 (90.6%) | **67 / 69 (97.1%)** | 62 / 69 (89.9%) |
| hallucinations / wrong-file | 1 | 0 | 0 |

**`B2_empty` scored the same as `B` (0.911 vs 0.910).** The stub wiki bought no accuracy whatsoever
— while costing +14% input tokens. Only the enriched wiki moved accuracy, by +6.8pp.

This closes the control on the second axis. The token result already showed the tooling alone is a
net cost; the grade shows the tooling alone is also an accuracy no-op. **Both axes attribute the
benefit to the wiki's verified content, not to having retrieval tools.**

## Per task (mean rubric fraction)

| task | B | B2 | B2_empty |
| --- | --: | --: | --: |
| auth-signin | **1.000** | 0.867 | 0.800 |
| routing-map | 1.000 | 1.000 | 1.000 |
| api-layer | 1.000 | 1.000 | 1.000 |
| hazard-domain | 0.875 | **1.000** | 0.917 |
| session-timeout | 1.000 | 1.000 | 1.000 |
| state-mgmt | 0.583 | **1.000** | 0.750 |

Three of six tasks are a clean tie at 1.000 across all arms. The spread is concentrated in two
places, and they point in opposite directions:

- **B2's edge is state-mgmt (0.583 → 1.000) and hazard-domain (0.875 → 1.000)** — places where the
  verified wiki supplied an architectural fact the source-only arm skimmed past (the HTTP-only
  cookie / no-bearer-token point, and the router guard's rehydration behavior).
- **B's edge is auth-signin (1.000 vs 0.867 / 0.800)** — B opened `axiosInstance.ts` directly every
  time and so always caught the 419/`201403` refresh-interceptor claim, which the wiki-first arms
  often did not reach. Reading source has its own advantage, and it shows up here.
- `B2_empty` sits between B and B2 on state-mgmt (0.750) and hazard-domain (0.917) but *below* B on
  auth-signin (0.800) — it read less source than B while getting nothing from the wiki. Net: a wash.

## Errors found (both arms, stated plainly)

- **One hallucination-class error, in arm B** (state-mgmt): the router `beforeEach` guard is
  described as *forcing a re-login* when the Pinia store is empty, when it in fact *rehydrates the
  store from sessionStorage* — an inversion of the mechanism.
- **One minor path error, in arm B2** (session-timeout): `useSessionTimeout.ts` placed under
  `utils/api/` instead of `composables/`.
- No wrong-file answers in any arm; every answer was substantive.

## Per-answer grades (de-anonymised)

| task | arm | claims | frac | src files | wiki docs | note |
| --- | --- | --- | --: | --: | --: | --- |
| api-layer | B | 3/3 | 1.000 | 3 | 0 |  |
| api-layer | B | 3/3 | 1.000 | 3 | 0 |  |
| api-layer | B | 3/3 | 1.000 | 2 | 0 |  |
| api-layer | B2 | 3/3 | 1.000 | 1 | 2 |  |
| api-layer | B2 | 3/3 | 1.000 | 1 | 2 |  |
| api-layer | B2 | 3/3 | 1.000 | 1 | 3 |  |
| api-layer | B2_empty | 3/3 | 1.000 | 2 | 1 |  |
| api-layer | B2_empty | 3/3 | 1.000 | 3 | 2 |  |
| api-layer | B2_empty | 3/3 | 1.000 | 3 | 2 |  |
| auth-signin | B | 5/5 | 1.000 | 5 | 0 |  |
| auth-signin | B | 5/5 | 1.000 | 5 | 0 |  |
| auth-signin | B | 5/5 | 1.000 | 5 | 0 |  |
| auth-signin | B2 | 4/5 | 0.800 | 0 | 1 | no refresh interceptor |
| auth-signin | B2 | 4/5 | 0.800 | 0 | 2 | no 419/201403 refresh interceptor |
| auth-signin | B2 | 5/5 | 1.000 | 0 | 2 |  |
| auth-signin | B2_empty | 3.5/5 | 0.700 | 3 | 2 | cookie session only implied; no refresh interceptor |
| auth-signin | B2_empty | 4.5/5 | 0.900 | 3 | 1 | refresh endpoint named but not as the interceptor |
| auth-signin | B2_empty | 4/5 | 0.800 | 3 | 1 | no refresh interceptor |
| hazard-domain | B | 3.5/4 | 0.875 | 3 | 0 | /hazards_list path + map not named |
| hazard-domain | B | 3.5/4 | 0.875 | 3 | 0 | map counterpart not named |
| hazard-domain | B | 3.5/4 | 0.875 | 3 | 0 | path + map not named |
| hazard-domain | B2 | 4/4 | 1.000 | 0 | 1 |  |
| hazard-domain | B2 | 4/4 | 1.000 | 0 | 1 |  |
| hazard-domain | B2 | 4/4 | 1.000 | 0 | 1 | map identified by route + renderer |
| hazard-domain | B2_empty | 3.5/4 | 0.875 | 1 | 1 | map counterpart not named |
| hazard-domain | B2_empty | 3.5/4 | 0.875 | 2 | 1 | map counterpart not named |
| hazard-domain | B2_empty | 4/4 | 1.000 | 2 | 1 |  |
| routing-map | B | 4/4 | 1.000 | 2 | 0 |  |
| routing-map | B | 4/4 | 1.000 | 2 | 0 |  |
| routing-map | B | 4/4 | 1.000 | 2 | 0 |  |
| routing-map | B2 | 4/4 | 1.000 | 0 | 2 |  |
| routing-map | B2 | 4/4 | 1.000 | 1 | 1 |  |
| routing-map | B2 | 4/4 | 1.000 | 2 | 1 |  |
| routing-map | B2_empty | 4/4 | 1.000 | 2 | 0 |  |
| routing-map | B2_empty | 4/4 | 1.000 | 2 | 0 |  |
| routing-map | B2_empty | 4/4 | 1.000 | 2 | 1 |  |
| session-timeout | B | 3/3 | 1.000 | 3 | 0 |  |
| session-timeout | B | 3/3 | 1.000 | 3 | 0 |  |
| session-timeout | B | 3/3 | 1.000 | 5 | 0 |  |
| session-timeout | B2 | 3/3 | 1.000 | 0 | 1 | MINOR: wrong path for useSessionTimeout (utils/api vs composables) |
| session-timeout | B2 | 3/3 | 1.000 | 1 | 1 |  |
| session-timeout | B2 | 3/3 | 1.000 | 1 | 1 |  |
| session-timeout | B2_empty | 3/3 | 1.000 | 2 | 1 |  |
| session-timeout | B2_empty | 3/3 | 1.000 | 2 | 1 |  |
| session-timeout | B2_empty | 3/3 | 1.000 | 2 | 1 |  |
| state-mgmt | B | 2/4 | 0.500 | 3 | 0 | no router-rehydration claim; no cookie/no-bearer claim |
| state-mgmt | B | 2/4 | 0.500 | 3 | 0 | WRONG: guard described as forcing re-login rather than rehydrating |
| state-mgmt | B | 3/4 | 0.750 | 3 | 0 | no cookie/no-bearer claim |
| state-mgmt | B2 | 4/4 | 1.000 | 1 | 1 |  |
| state-mgmt | B2 | 4/4 | 1.000 | 1 | 1 |  |
| state-mgmt | B2 | 4/4 | 1.000 | 2 | 1 |  |
| state-mgmt | B2_empty | 3/4 | 0.750 | 3 | 1 | no cookie/no-bearer claim |
| state-mgmt | B2_empty | 3/4 | 0.750 | 3 | 1 | no cookie/no-bearer claim |
| state-mgmt | B2_empty | 3/4 | 0.750 | 3 | 2 | no cookie/no-bearer claim |

## Verdict

Paired with the token result — input `B2/B` = 0.516× (−48.4%), `B2_empty/B` = 1.140× (+14.0%) —
the three arms say one coherent thing **for this fixture**:

| | tokens vs B | accuracy |
| --- | --: | --: |
| retrieval tools + **enriched** wiki | **−48.4%** | **0.978** |
| retrieval tools + **stub** wiki | **+14.0%** | 0.911 |
| no wiki at all | — | 0.910 |

**The verified content is what pays. The tooling on its own costs tokens and returns nothing.**

Scope is unchanged: one repo, one model, six tasks, N=3, agent-graded. **README/launch token and
speed headlines remain forbidden**; this is a scoped, linked footnote. Human ratification of this
worksheet remains the one open methodological gap.

## Reproduce

```
node bench/real/make-grading-worksheet.mjs --out <dir> --tasks bench/tasks-csap.json \
  bench/results/real-B-*.json bench/results/real-B2-*.json bench/results/real-B2_empty-*.json
# grade <dir>/worksheet.md WITHOUT opening <dir>/map.json, then join on the labels
```
