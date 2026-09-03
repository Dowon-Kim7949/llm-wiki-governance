# Whole-Task Experiment — Methodology (SCAFFOLD ONLY)

> **This is a separate experiment from the retrieval bench** (`bench/run.js`,
> `bench/real/`). Do NOT mix their names, arms, or results. The retrieval bench
> measures *token cost of finding context*; this experiment measures *whether the
> guided workflow makes a human/agent understand and change the code better*.
>
> **Status: scaffold only.** This directory ships a methodology, a task format, a
> grading rubric, a sample fixture, a dry-run runner, and a result-file format. It
> does **not** execute models, make paid calls, or produce numbers. `runner.js`
> refuses to emit results unless a driver is wired, and never fabricates a score.

## Two questions

### A. Onboarding (comprehension)
> Does a newcomer/agent that used the `onboard` skill understand a work area more
> accurately than one working from source (or wiki retrieval) alone?

Candidate measures (per task, graded against the rubric's evidence points):
- domain-explanation accuracy; representative-flow accuracy; business-term understanding;
- risk-area identification; share of answers with a doc/source citation;
- count of confident-but-wrong statements; source files opened; tokens; wall-clock.

### B. Tech add / fix (error & rework)
> Does `prepare` + `feature`/`fix` reduce errors and rework vs a plain agent?

Candidate measures (per task):
- first-attempt success; tests pass; regressions; wrong files edited;
- related-doc update misses; log/manifest misses; human-review findings; rework rounds;
- tokens; wall-clock.

## Arms (documented minimum)

1. **source-only** — agent works from source only (no wiki).
2. **wiki-retrieval** — agent may query the wiki (`search-docs`/`get-doc`/`get-related`) but not the guided skills.
3. **guided** — agent runs `onboard` (question A) or `prepare` → `feature`/`fix` (question B).

Compare **within one agent/model** (a different model is a separate, separately-labeled
number). Report the guided-vs-baseline **ratio**, not absolute totals across models.

## Task format

`tasks.sample.json` (and any real task set) is an array of:

```json
{
  "id": "auth-onboard",
  "kind": "onboard" | "prepare-fix" | "prepare-feature",
  "domain": "authentication",                       // onboard only (optional)
  "task": "Fix the 500 on the user-list endpoint",  // prepare-* only
  "rubric": {
    "evidencePoints": ["...checkable facts a correct answer must cite..."],
    "mustNotClaim": ["...confident-wrong statements to penalize..."],
    "passCriteria": ["...for prepare-*: tests found, invariants respected, ..."]
  }
}
```

Rubrics are **hand-authored, checkable facts** (grounded in the real code), not
model-generated — otherwise the experiment grades itself.

## Grading

Human (or a clearly-labeled separate judge model) scores each answer against the
rubric. This scaffold does not auto-grade. Record raw evidence, not just a number.

## Honesty rules (same discipline as the retrieval bench)

- No paid model calls or external sends from this scaffold.
- Never fabricate a result or a success rate. A missing driver = no number.
- Single agent / single repo / small N is a scoped result, not a headline. Note N, model, repo.
- Keep this experiment's results in files named `whole-task-*` so they are never
  confused with the retrieval bench's `baseline`/`current`/`real-driver-*` files.

## Result file format

See `RESULT_TEMPLATE.md`. One file per run, named
`bench/whole-task/results/whole-task-<agent>-<YYYY-MM-DD>.md`, recording: date, agent/model,
repo + wiki state, arms run, per-task rubric scores, and an honest summary with caveats.
