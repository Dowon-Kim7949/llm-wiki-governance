# Benchmark disclosure — what the public artifacts are, and what was redacted

*Korean: [BENCHMARK_DISCLOSURE.ko.md](./BENCHMARK_DISCLOSURE.ko.md). The two files state the
same facts; if they ever disagree, that is a bug — please open an issue.*

This repository publishes real measurement artifacts under `bench/`. Some of those runs were
performed against a **private, proprietary application that is not part of this repository**.
This document states plainly what was measured, what was removed before publication, and what
you therefore cannot do with the published copies.

## 1. What was actually measured

The retrieval-vs-source benchmark line (`2026-07-22`, `2026-07-24`, `2026-07-27`) ran against a
**real, external, single-page web application** — Vue 3 / Quasar / TypeScript, with Pinia stores,
an axios-based API layer, a cookie-session auth flow and a client-side idle timer. It was a
working production codebase, not a fixture written for the benchmark, and it was chosen precisely
because it is a *representative consumer project* rather than this tool's own repository.

The runs were read-only. No commit, push, or edit was made to the target repository.

## 2. Why the public copies are redacted

That target is **private and proprietary code owned by a third party**. Publishing the artifacts
verbatim would have published, in reconstructable detail:

- the project, repository, branch and deployment-environment names
- real module and component paths, and real symbol names
- real API endpoint routes
- the sign-in, session, MFA and token-refresh rules, including status codes
- session-storage key names and how their contents are protected
- business-domain field names and internal status codes
- idle/timeout thresholds
- backend hostnames and a development server address

So the public artifacts are **redacted artifacts**. Two kinds of redaction were applied:

**a) Stable pseudonyms.** Every identifier above is replaced by a stable pseudonym, the same one
everywhere it occurs, so the artifacts stay internally consistent and readable. Placeholders are
written in angle brackets and name a *role*, not a file: `<login-page>`, `<user-store>`,
`<api-client>`, `<http-client>`, `<router-table>`, `<item-store>`,
`<session-timeout-composable>`, and so on. Endpoint routes appear as generic equivalents
(`/api/auth/login`, `/api/items`), storage keys as `example_session_key_*`, the target itself as
`external-vue-quasar-app` on branch `benchmark-baseline`, and other repositories measured in the
governance work as `external-frontend-a` / `external-frontend-b` / `external-project-c` under
`external-organization`. Exact thresholds and internal status codes are replaced by role names
(`<expiry-status>`, `<refresh-signal-code>`) rather than approximated.

The original-to-pseudonym table is deliberately **not** in this repository.

**b) Withheld answer prose.** The raw result files (`bench/results/real-B*.json`) recorded each
model answer in full. Those answers were close reads of the private source — function-by-function
flows with line numbers — and pseudonyms alone would not have made them safe to publish. Each
`tasks[].runs[].answer` is therefore replaced by a redaction notice, with
`answerRedacted: true` and `answerOriginalChars` recording the original length. The grading
worksheets in the same directory quote only short, non-reconstructive phrases as grading evidence;
their longer verbatim quotations were reduced to public summaries that keep the verdict and its
reasoning.

## 3. What was NOT changed

No measurement was altered. The following are the originals, byte for byte where the surrounding
text allowed it:

- input/output token counts, wall-clock times, tool-call counts
- per-arm and per-task scores, rubric fractions, and accuracy aggregates
- sample sizes and repeat counts (`N`), arm definitions and arm labels
- model identifiers and execution dates
- the questions asked and the rubric structure
- every recorded caveat, limitation, negative result, and correction — including the runs and
  tasks where retrieval *lost*, and the stale-wiki run that produced a confidently wrong
  security answer

Where a measurement's surrounding sentence contained an identifier, only the identifier changed.
Nothing was recomputed. The task file and the report filenames previously carried the target's
project name; they were renamed to the pseudonym (`bench/tasks-external-vue-app.json` and
`bench/results/real-driver-external-vue-app-*.md`) and every reference to them in the repository
was updated. Renames were made with `git mv`, so the file history is preserved.

## 4. What you can and cannot do with these artifacts

**You can** review the methodology, the arm design, the prompts, the rubric, the grading
procedure, the aggregation code, and the full numeric record — which is the point of publishing
them.

**You cannot re-run the historical measurement.** The corpus it measured is private and is not
distributed here, so an identical re-run against the same target is **not possible** from this
repository, by anyone who does not already have access to that codebase. This is a real limit on
reproducibility, and it is not fixed by the redaction — the redaction is why the artifacts can be
published at all, not a substitute for the corpus.

## 5. The public harness fixture is a different thing

`bench/tasks.json` is a **separate, fully public** task set: six code-comprehension tasks over
**this repository's own** source and wiki, with `bench/real/make-stub-wiki.mjs` building the
`B2_empty` control fixture. `node bench/real/runner.js --dry` validates the whole harness against
it with no model call and no cost.

That fixture exists to verify that the **harness works**. It is a harness smoke test. It is
**not** the source of any historical number in `bench/results/`, and its results must never be
pooled with them or presented as continuous with them. No synthetic Vue/Quasar fixture was
created for this repository: a public, self-contained fixture already existed, and inventing a
second one would have added package scope without adding evidence.

## 6. Residual exposure we are not claiming to have removed

Honesty about the limits of this pass:

- **Git history.** This redaction changes the current tree only. Earlier commits still contain
  the original identifiers, and no history rewrite was performed. See
  `docs/llm-wiki/log.md` for the dated record of this change.
- **Commit hashes of the private repositories** remain in the governance measurement tables in
  `docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md`. They are the reproduction basis for those
  measurements and are inert without access to the repositories they belong to, but they are not
  removed.
- **Architectural observations** about the anonymized targets survive in the measurement
  rationale — for example that one target's API layer is a single large facade, because that fact
  is *why* a proposed anchor-narrowing rule was measured as worthless there. These describe shape,
  not content, and they are load-bearing evidence for conclusions this repository already
  published.
- **Previously published versions** of this package and its artifacts are unaffected by this
  change.

## 7. How to describe these results

The accurate label is: *measured on an external, private Vue/Quasar SPA; single repository, single
model, six tasks, N=3; agent-graded with the grading standard human-ratified on a sampled review;
public artifacts redacted for third-party confidentiality.*

Not "human-graded", not "reproducible", and not a bold headline number — this repository's
standing rule against performance headlines in `README.md` is unchanged by this document.
