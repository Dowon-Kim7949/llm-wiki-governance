# bench/ — LLM-WIKI impact-measurement harness (Gate 22)

A reproducible, **zero-dependency**, repo-internal harness that measures whether the
governed wiki actually reduces the context needed to work on this codebase —
**before** the post-1.16 feature gates build more on top of that premise.

It exists because the product-identity audit rated the governance core real but the
*value chain* (durable memory → less rediscovery → fewer tokens) **unproven**, and
because the launch copy had to drop token-savings language for lack of evidence.
This harness is that evidence track. Scope: `GATE_REVIEW.md` (Gate 22, accepted).

## Run it

```bash
node bench/run.js              # run + write bench/results/current.{json,md}
node bench/run.js --no-write   # run + print only
node bench/run.js --against bench/results/baseline.json   # print deltas vs the frozen before-retrieval reference
```

No install, no flags, no network. Node >= 18, built-ins only.
`results/baseline.{json,md}` is the **frozen Gate 22 before-retrieval reference** and is
never overwritten; the live run writes `results/current.{json,md}`.

## What it does (one paragraph)

For six representative "how does X work?" questions about this repo, it assembles the
input context five ways and measures the **estimated input tokens**, **files opened**,
and **whether the ground-truth code was surfaced**:

- **A0 whole-repo** — read every source file (naive upper bound).
- **A1 grep-full** — code-only: grep `src/` for the question's cold terms, read each matching file in full.
- **A2 grep-snippet** — code-only, conservative: same grep hits, only the lines around each match (the *least* wiki-favorable code-only baseline).
- **B wiki-grounded** — read the wiki orientation docs, then follow the evidence pointers they surface, reading the pointed-to **source** in full. This is the **pre-retrieval** wiki model.
- **B2 wiki-retrieval** *(Gate 24)* — query the wiki: run the shipped `search-docs` (zero-dep keyword/AND-semantics, same scoring as `src/commands/retrieval.js`), then `get-doc` the top matched **doc bodies** — no source re-read. **B2-vs-B runs on the same corpus, so it isolates the retrieval mechanism from corpus drift** — the honest before/after-retrieval delta.

Read [`METHODOLOGY.md`](METHODOLOGY.md) for task selection, token accounting (including
the wiki read + maintenance cost), and the honest list of limitations. The frozen
before-retrieval reference is [`results/baseline.md`](results/baseline.md); the current
run (with B2) is [`results/current.md`](results/current.md).

## Invariants

- **Zero runtime dependency** — Node built-ins only (matches the package invariant).
- **Never shipped** — `bench/` is deliberately **not** in `package.json` `files`, so it
  is never published to npm. It is a repo-internal validation tool.
- **No CLI / `--format json` / frontmatter contract change** — Gate 22 is a validation
  track; any future shipped `bench` command is a separate, later minor.
- **Honest reporting** — unfavorable results are reported, not hidden. No token/speed
  claim ships in the README/launch until a measured result supports it.
