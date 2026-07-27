# Distribution kit

Prepared material for making `llm-wiki-governance` findable. **Nothing in this directory has been
published, posted, or submitted.** Every act of publication is the maintainer's, under the
maintainer's own accounts.

This directory is outside the npm `files` allowlist, so none of it ships with the package.

## Why this exists now

The July 2026 launch was a single comment in a Reddit megathread. Six days later the repository
had **3 stars, 0 forks, 0 issues** — so the product has never actually been tried by anyone
outside. That is a distribution result, not a product verdict: the technical work is mature
(26 minor releases, 27 commands, read-only MCP, zero dependencies) and as of 2026-07-27 there is
finally a **controlled** measurement showing the value mechanism is real.

The earlier kit was deleted as stale in commit `7509020`. This one is rewritten around the new
evidence.

## Read in this order

| File | What it is |
| --- | --- |
| [`CLAIMS.md`](./CLAIMS.md) | **Start here.** What may and may not be said, and the evidence behind each. Every other file obeys it. |
| [`README-note.md`](./README-note.md) | Two proposed README changes, drafted not applied — the storefront still cites a superseded measurement. |
| [`registries.md`](./registries.md) | MCP registries and awesome lists: ready-to-paste entries, exact tool list, sequencing. |
| [`launch-post.md`](./launch-post.md) | Show HN and X drafts. |
| [`reddit-post.md`](./reddit-post.md) | r/ClaudeAI drafts (feed post and megathread comment variants). |
| [`reply-kit.md`](./reply-kit.md) | Prepared answers for the first hours of a thread. Concede first, then correct. |

## The discipline these are written under

No performance headline. The measurement is a **scoped footnote**: one repository, one model, six
tasks, N=3, agent-graded. Wherever a number appears, all four conditions appear with it, along
with the task where retrieval lost. The most persuasive line available is a negative result about
our own category — *an unenriched wiki is worse than no wiki* — and that is deliberate: a project
that publishes its own unfavourable findings is easier to believe about the favourable ones.

## Before publishing anything

1. **Human ratification of the grading worksheet** (`bench/results/…-empty-control-2026-07-27-grading.md`).
   "Agent-graded" is the last obvious line of attack; a maintainer spot-check closes it.
2. **Decide the two README changes** in `README-note.md`.
3. Pick a sequence — `registries.md` recommends MCP registries first, Show HN last and only with
   two hours free to sit in the thread.

## Measuring the outcome

Baseline at 2026-07-27: **3 stars, 0 forks, 0 issues, 0 watchers.** Ignore npm downloads — this
project's own CI installs the tarball on every push across an OS matrix and mirrors scrape new
packages, so the ~1,500 July downloads are mostly machines. Re-check the honest counters two weeks
after any submission round.
