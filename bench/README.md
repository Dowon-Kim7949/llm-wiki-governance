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
node bench/run.js              # run + write bench/results/baseline.{json,md}
node bench/run.js --no-write   # run + print only
node bench/run.js --against bench/results/baseline.json   # print deltas vs a prior run
```

No install, no flags, no network. Node >= 18, built-ins only.

## What it does (one paragraph)

For six representative "how does X work?" questions about this repo, it assembles the
input context four ways and measures the **estimated input tokens**, **source files
opened**, and **whether the ground-truth code was surfaced**:

- **A0 whole-repo** — read every source file (naive upper bound).
- **A1 grep-full** — code-only: grep `src/` for the question's cold terms, read each matching file in full.
- **A2 grep-snippet** — code-only, conservative: same grep hits, only the lines around each match (the *least* wiki-favorable code-only baseline).
- **B wiki-grounded** — read the wiki orientation docs, then follow the evidence pointers they surface. B's targeted files are **derived from wiki content, not the answer key**, so B can genuinely fail.

Read [`METHODOLOGY.md`](METHODOLOGY.md) for task selection, token accounting (including
the wiki read + maintenance cost), and the honest list of limitations. The recorded
baseline is [`results/baseline.md`](results/baseline.md).

## Invariants

- **Zero runtime dependency** — Node built-ins only (matches the package invariant).
- **Never shipped** — `bench/` is deliberately **not** in `package.json` `files`, so it
  is never published to npm. It is a repo-internal validation tool.
- **No CLI / `--format json` / frontmatter contract change** — Gate 22 is a validation
  track; any future shipped `bench` command is a separate, later minor.
- **Honest reporting** — unfavorable results are reported, not hidden. No token/speed
  claim ships in the README/launch until a measured result supports it.
