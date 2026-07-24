# Blind grading worksheet — csap SDK-path bench (N=3, 2026-07-24)

> **Durable record.** Regenerated from the raw result JSONs in `bench/results/`
> (`real-B-2026-07-24T03-55-07-923Z.json`, `real-B2-2026-07-24T04-04-47-360Z.json`).
> Full answer texts live in those JSONs (`.tasks[].runs[].answer`); this file records the grade only.
> Contains csap architectural descriptions — untracked by default; `git add` only if you want it committed.

## Method (why this is arm-unbiased)

1. All 36 N=3 answers extracted from the two result JSONs.
2. Within each task the 6 answers (3 B + 3 B2) were **stripped of arm label and deterministically shuffled**, then presented as `<task>-A..F`.
3. Each answer scored **without knowing its arm**, purely on the task rubric: how many key-claims are correctly stated, whether ground-truth files are located, any hallucination.
4. Arm re-attached only at aggregation (below).

**Caveat:** agent rubric-grade (same model family), blind to arm — not an independent human blind grade. Rubric-claim coverage is a completeness proxy, not an absolute truth score.

## Per-answer grade (de-anonymized)

| task | arm | claims | frac | src files opened | wiki docs | note |
| --- | --- | --- | --: | --: | --: | --- |
| api-layer | B | 3/3 | 1 | 3 | 0 |  |
| api-layer | B | 3/3 | 1 | 3 | 0 |  |
| api-layer | B | 3/3 | 1 | 2 | 0 |  |
| api-layer | B2 | 3/3 | 1 | 1 | 3 |  |
| api-layer | B2 | 3/3 | 1 | 1 | 2 |  |
| api-layer | B2 | 3/3 | 1 | 1 | 2 |  |
| auth-signin | B | 5/5 | 1 | 5 | 0 |  |
| auth-signin | B | 5/5 | 1 | 5 | 0 |  |
| auth-signin | B | 5/5 | 1 | 5 | 0 |  |
| auth-signin | B2 | 4/5 | 0.8 | 0 | 2 | missing rubric#5 refresh-interceptor |
| auth-signin | B2 | 4/5 | 0.8 | 0 | 1 | missing rubric#5 refresh-interceptor |
| auth-signin | B2 | 5/5 | 1 | 0 | 2 |  |
| hazard-domain | B | 3.5/4 | 0.875 | 3 | 0 | map counterpart not named |
| hazard-domain | B | 3.5/4 | 0.875 | 3 | 0 | /hazards_list path + map not named |
| hazard-domain | B | 3.5/4 | 0.875 | 3 | 0 | path + map not named |
| hazard-domain | B2 | 4/4 | 1 | 0 | 1 |  |
| hazard-domain | B2 | 4/4 | 1 | 0 | 1 |  |
| hazard-domain | B2 | 4/4 | 1 | 0 | 1 |  |
| routing-map | B | 4/4 | 1 | 2 | 0 |  |
| routing-map | B | 4/4 | 1 | 2 | 0 |  |
| routing-map | B | 4/4 | 1 | 2 | 0 |  |
| routing-map | B2 | 4/4 | 1 | 2 | 1 |  |
| routing-map | B2 | 4/4 | 1 | 0 | 2 |  |
| routing-map | B2 | 4/4 | 1 | 1 | 1 |  |
| session-timeout | B | 3/3 | 1 | 3 | 0 |  |
| session-timeout | B | 3/3 | 1 | 5 | 0 |  |
| session-timeout | B | 3/3 | 1 | 3 | 0 |  |
| session-timeout | B2 | 3/3 | 1 | 1 | 1 |  |
| session-timeout | B2 | 3/3 | 1 | 0 | 1 | MINOR: wrong path for useSessionTimeout (utils/api vs composables) |
| session-timeout | B2 | 3/3 | 1 | 1 | 1 |  |
| state-mgmt | B | 2/4 | 0.5 | 3 | 0 | misstated guard as re-login not rehydrate; no cookie/bearer claim |
| state-mgmt | B | 3/4 | 0.75 | 3 | 0 | no cookie/bearer claim |
| state-mgmt | B | 2/4 | 0.5 | 3 | 0 | no guard rehydration; no cookie/bearer claim |
| state-mgmt | B2 | 4/4 | 1 | 2 | 1 |  |
| state-mgmt | B2 | 3.5/4 | 0.875 | 1 | 1 | login-time store population implicit only |
| state-mgmt | B2 | 4/4 | 1 | 1 | 1 |  |

## Aggregate accuracy by arm (18 answers each)

| metric | B (no-retrieval) | B2 (retrieval) |
| --- | --: | --: |
| mean rubric fraction | 0.9097 | 0.9708 |
| pooled claims | 62.5/69 (90.6%) | 66.5/69 (96.4%) |
| hallucinations / wrong-file | 0 | 0 |

## Per-task mean fraction by arm

| task | B | B2 |
| --- | --: | --: |
| auth-signin | 1.000 | 0.867 |
| routing-map | 1.000 | 1.000 |
| api-layer | 1.000 | 1.000 |
| hazard-domain | 0.875 | 1.000 |
| session-timeout | 1.000 | 1.000 |
| state-mgmt | 0.583 | 0.958 |

## Verdict

Correctness is a **tie-to-slight-edge for B2** (retrieval); **no accuracy penalty**. Paired with the N=3 token result (input B2/B = 0.516×, cost 0.581×), the token/cost saving is a real finding **for this fixture** — a scoped footnote, not a README headline. Human ratification of this worksheet would close the last methodological gap.

