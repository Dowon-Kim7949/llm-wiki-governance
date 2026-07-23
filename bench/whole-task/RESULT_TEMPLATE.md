# Whole-Task Experiment Result — <agent> — <YYYY-MM-DD>

> Copy this template to `results/whole-task-<agent>-<YYYY-MM-DD>.md`. Record raw
> evidence, not just numbers. Never fabricate a score. This is NOT the retrieval
> bench — keep the file name prefixed `whole-task-`.

## Setup
- date: <YYYY-MM-DD>
- agent / model: <e.g. Claude Opus 4.8 via Claude Code>
- repo under test: <name @ ref>  (external, representative — note if self-referential)
- wiki state: <version built at / % verified / de-drifted?>
- task set: <path>  (N = <count> per kind)
- arms run: source-only / wiki-retrieval / guided
- grading: <human | labeled judge model>

## A. Onboarding (comprehension)
| task | arm | evidence-cited % | confident-wrong | source files opened | tokens | wall (s) | rubric pass |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| … | source-only | | | | | | |
| … | wiki-retrieval | | | | | | |
| … | guided | | | | | | |

## B. Tech add / fix (error & rework)
| task | arm | first-attempt ok | tests pass | regressions | wrong-file edits | doc-update miss | rework rounds | tokens | wall (s) |
| --- | --- | --- | --- | ---: | ---: | --- | ---: | ---: | ---: |
| … | source-only | | | | | | | | |
| … | wiki-retrieval | | | | | | | | |
| … | guided | | | | | | | | |

## Honest summary
- guided-vs-baseline (within this one agent/model): <ratio + direction, or "inconclusive at N=…">
- what actually helped / did not: <evidence>
- caveats: single agent / single repo / N=<n> / grading = <who>. Scoped result, not a headline.
- README token/speed/productivity claims remain out of scope unless a pre-registered,
  adequately-powered run supports them.
