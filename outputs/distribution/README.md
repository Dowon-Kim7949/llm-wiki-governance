# Distribution kit

Prepared material for making `llm-wiki-governance` findable. **Nothing in this directory has been
published, posted, or submitted.** Every act of publication is the maintainer's, under the
maintainer's own accounts.

This directory is outside the npm `files` allowlist, so none of it ships with the package.

## Why this exists now

The July 2026 launch was a single comment in a Reddit megathread. Six days later the repository
had **3 stars, 0 forks, 0 issues** — so the product has never actually been tried by anyone
outside. That is a distribution result, not a product verdict: the technical work is mature
(1.34.0 on 2026-10-21; 32 CLI commands, 18 read-only MCP tools, zero dependencies) and since
2026-07-27 there has been a **controlled** measurement showing the value mechanism is real on one
repository.

The earlier kit was deleted as stale in commit `7509020`. The July drafts below were written
against 1.26.x; on 2026-10-26 they were bannered and [`launch-kit-2026-10.md`](./launch-kit-2026-10.md)
replaced them as the starting point.

## Read in this order

| File | What it is |
| --- | --- |
| [`CLAIMS.md`](./CLAIMS.md) | **Start here.** What may and may not be said, the evidence behind each, and the 2026-10-26 audit of every public surface. Every other file obeys it. |
| [`launch-kit-2026-10.md`](./launch-kit-2026-10.md) | **Current drafts.** Positioning, taglines, GitHub "About", Show HN, Reddit, dev.to, LinkedIn, Korean communities, replies, sequencing, and what to measure. |
| [`registries.md`](./registries.md) | MCP registries and awesome lists: sequencing still stands; counts must be updated before use. |
| [`launch-post.md`](./launch-post.md) | *Superseded.* July Show HN and X drafts, kept as history. |
| [`reddit-post.md`](./reddit-post.md) | *Superseded.* July r/ClaudeAI drafts, kept as history. |
| [`reply-kit.md`](./reply-kit.md) | July answers for the first hours of a thread. Partly out of date; read the kit's reply notes first. |
| [`README-note.md`](./README-note.md) | *Historical.* The July README change; the README has since been cut down and carries no figure. |

## The discipline these are written under

No performance headline. The measurement is a **scoped footnote**: one repository, one model, six
tasks, N=3, agent-graded with the standard ratified on a sampled review. Wherever a number appears, all four conditions appear with it, along
with the task where retrieval lost. The most persuasive line available is a negative result about
our own category — *an unenriched wiki is worse than no wiki* — and that is deliberate: a project
that publishes its own unfavourable findings is easier to believe about the favourable ones.

## Before publishing anything

1. ~~Human ratification of the grading worksheet.~~ **Done 2026-07-27** — the maintainer reviewed
   the adversarial 7-answer sample in `bench/results/…-ratification.md` and ratified the standard
   (verdict (a), no scores changed). Publishing is no longer blocked on it.
2. ~~Decide the two README changes.~~ **Done 2026-07-27** — applied at the conservative pooled
   figure and shipped as 1.26.1 (a README fix only reaches the npm page via a publish). See
   `README-note.md`.
3. Pick a sequence — `registries.md` recommends MCP registries first, Show HN last and only with
   two hours free to sit in the thread.

**Both preconditions are now clear. Nothing blocks publishing except the decision to do it.**

## Measuring the outcome

Baseline at 2026-07-27: **3 stars, 0 forks, 0 issues, 0 watchers.** Ignore npm downloads — this
project's own CI installs the tarball on every push across an OS matrix and mirrors scrape new
packages, so the ~1,500 July downloads are mostly machines. Re-check the honest counters two weeks
after any submission round.

Baseline at 2026-10-26, on the current public repository: **0 stars, 0 forks, 0 issues** (open or
closed). npm reported 70 downloads in the week to 2026-10-22 and 199 in the 30 days to that date;
for the reason above, read neither as adoption. Nothing has been posted since July.
