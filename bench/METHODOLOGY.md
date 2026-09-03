# Methodology — LLM-WIKI impact measurement (Gate 22)

This document defines exactly what the harness measures, the choices behind it, and —
in the same spirit as the tool's own governance/honesty brand — a candid list of the
things that could make the numbers wrong or unrepresentative. Read it before quoting
any figure from [`results/baseline.md`](results/baseline.md).

## 1. The question being measured

Before you change code you must **find and read the relevant source**. That reading is
input context — it costs tokens (money/latency for an agent) and attention (for a
human). The claim under test is:

> A governed, code-grounded wiki lets you assemble that context with **less** total
> input than reading code directly.

The harness measures a **deterministic proxy** for that context cost. It does **not**
run an LLM (that is the heavier follow-up in §7); it does not claim to measure answer
quality or wall-clock. It measures *how many tokens of context each strategy pulls in*
and *whether that context actually contained the code needed to answer*.

## 2. The strategies (arms)

Each of six tasks (a natural-language question) is answered five ways:

| Arm | What it reads | Represents |
| --- | --- | --- |
| **A0 whole-repo** | every `src/**/*.js` file | naive "load the whole codebase" upper bound |
| **A1 grep-full** | every src file whose path or content contains a query keyword, **read in full** | a no-wiki agent that greps then opens each hit |
| **A2 grep-snippet** | the same grep hits, but only the lines within ±40 of each match | a *disciplined* no-wiki agent that reads match context, not whole files |
| **B wiki-grounded** | the wiki orientation docs, then the **source files** the wiki's evidence pointers name for this query, read in full | a wiki-first agent, **pre-retrieval** (still reads code) |
| **B2 wiki-retrieval** | the shipped `search-docs` result, then the top matched wiki **doc bodies** (`get-doc`) — **no source re-read** | the Gate 24 retrieval mechanism (query the wiki instead of re-deriving from code) |

**A2 is the conservative, least-wiki-favorable code-only baseline.** A real agent's
code-only cost sits somewhere between A2 (snippet) and A1 (whole file); we report both
and treat **B-vs-A2** as the honest stress test.

### B2 — the retrieval arm (Gate 24), and why B2-vs-B is the honest delta

B2 models the mechanism the roadmap actually cares about: the agent runs the shipped
`search-docs` (zero-dep keyword/substring, AND-semantics, the **same scoring** as
`src/commands/retrieval.js` — title +10, tags/aliases +3, body-occurrence per term)
and then `get-doc`s the top matched **doc bodies** instead of re-reading source. Its
cost is the search snippets (what the agent triages) plus those doc bodies.

Two modeling choices, both disclosed:

1. **The append-only `log.md` is searched but never `get-doc`'d.** Under the naive
   scorer the changelog ranks at or near the top for *every* query (it mentions
   everything), but an agent can see from the snippet that it is release history, not a
   subsystem explanation, and would not open it to understand code. Including it would
   over-charge B2 for an unrealistic read. (This also surfaces a real limitation of the
   shipped scorer worth a future fix: it does not down-rank the changelog.)
2. **B2 reads the top-`retrievalGetDocs` matched content docs (default 2).** This is a
   conservative, disclosed parameter, exactly like A2's ±40 window. Sensitivity: at
   **K=1** (read only the single top doc) grounding success is still 100% and the token
   win is *larger*, so K=2 is the more expensive, more conservative choice.

**B2-vs-B is the key comparison.** B and B2 run on the *same* corpus and the *same*
tasks; the only thing that differs is the mechanism (read the pointed-to source vs read
the wiki's digest of it). So B2-vs-B **cancels corpus drift** and isolates the retrieval
effect — which the plain `--against baseline.json` re-run could not (that only showed the
corpus growing). B2 charges **no orientation read**: `search-docs` *is* the on-demand
orientation, so the agent does not pre-load the six orientation docs.

### Why B is derived from wiki content, not the answer key

B does **not** get told the ground-truth files. Instead it reads the six orientation
docs and, for each line that mentions a query keyword, extracts the `src/...js` paths
on that line (the wiki's evidence pointers). Its targeted set is whatever the **wiki
actually says**. If the wiki's pointers are incomplete, B fails to surface a
ground-truth file and its `success` is `false` — a real, honest gap. This is what
makes the comparison non-circular.

## 3. Task selection

Six tasks dogfood the harness on this repo, chosen to span distinct subsystems
(detector, command pipeline, config plumbing, findings/rules, skill generation, MCP)
so the result is not a single-file fluke. Each task declares:

- `question` — the developer-facing question.
- `keywords` — **cold** search terms taken from the *question only*.
- `groundTruth` — the source files that must be read to answer (the success oracle).

The task set lives in [`tasks.json`](tasks.json) so it is reviewable and extensible.

### The cold-keyword rule (important for fairness)

Keywords are deliberately restricted to domain words a person who has **not yet read
the code** would type (`mobile`, `config`, `scan`, `severity`, …). We **exclude
internal symbol names** (`detectMobile`, `applyRuleConfig`, `TOOL_DEFS`, …): those are
exactly what the wiki hands you, so putting them in the query would give the answer to
the code-only arms and rig the test. This is a **conservative** choice — it can even
*understate* the wiki, because a cold grep may miss code the wiki names outright, while
we still credit the grep arms with finding it whenever the term happens to appear.

## 4. Token accounting

- **Estimator.** `tokens ≈ chars / 4` (see [`lib/tokens.js`](lib/tokens.js)). This is a
  rough proxy, not a real BPE tokenizer (which would add a dependency and vary by
  ±20–30% on code). Because **every arm uses the same estimator, the divisor cancels in
  the ratio between arms** — and the ratio is the number this gate cares about. Absolute
  token counts are approximate.
- **Per-task vs session.** A0/A1/A2 re-read source for every task. B pays the wiki
  **orientation read once per session** and then only its targeted reads. So we report
  two views: a **per-task** table (B charged the full orientation each row —
  *pessimistic* for the wiki) and a **session** roll-up (orientation paid once —
  realistic for a working session). The per-task table is where the wiki looks worst.
- **Wiki read cost is counted.** The orientation read (12.8k tokens for this repo) is
  charged to B, not hidden. It is the honest overhead that only amortizes across several
  tasks.
- **Wiki maintenance cost is disclosed.** The full wiki corpus size (docs + tokens) is
  reported as a one-time authoring + ongoing maintenance cost. It is **not** charged
  per task (it is a fixed sunk/maintenance cost, not a per-query cost), but it is stated
  so a reader can weigh it. A wiki that is expensive to keep fresh can erase a per-query
  token win; this harness does not measure freshness effort.
- **Read granularity asymmetry (conservative toward the wiki).** B reads each targeted
  file **in full**, even though the wiki gives line/symbol-level pointers that would let
  a real agent read only a region. A line-scoped B would be cheaper still, so B-vs-A2 is
  conservative in B's favor on this axis (and A2's snippet-only reading is conservative
  against B on the other axis — the two roughly bracket the truth).

## 5. Success (a locating proxy, not a quality measure)

`success = the arm's opened file set ⊇ the task's ground-truth files`. This asks *did the
strategy surface the code needed to answer?* — not *did it produce a correct answer.*
Answer quality needs the LLM run (§7). On this repo the grep arms also score 100%, so
the baseline does **not** demonstrate a *findability* advantage for the wiki — only a
*context-size* advantage. A cold grep on a concept the code does not name literally
could miss where the wiki would not, but these six tasks do not exhibit that.

**For B2 the "opened set" is different**, because B2 reads wiki docs, not source. B2's
success is *the set of ground-truth source files **referenced** (via `src/…js` evidence
pointers) by the doc bodies it read* ⊇ the ground truth. This is a **grounding** proxy:
the wiki pointed the agent at exactly the right code and explained it, so the agent is
grounded without opening the file. It is **not** a claim that the agent can complete the
edit without ever reading source — for the final change it may still open the one file
the doc names (which retrieval has now identified precisely). So B2's token figure is the
**retrieval / orientation-context** cost, not the final-edit read.

## 6. Variance

The harness is **deterministic**: same inputs → identical output (no sampling, no
randomness, no clock-dependent logic except the `generatedAt` stamp). Re-running
produces the same numbers until the source or wiki changes. Cross-repo variance
(different codebases, different wiki quality) is **not** captured — see §8.

## 7. What this baseline does NOT measure (deferred, heavier follow-up)

- **Real tokens** from a real tokenizer, and **real wall-clock latency**.
- **Answer quality / task success** from an actual agent run (Claude Code) on both arms.
  B2's grounding-success proxy (§5) still is not proof the agent produces a correct edit.
- The **retrieval** effect is now **modeled by the B2 arm** (added after Gate 24). Note
  what changed: the plain `run.js --against baseline.json` re-run only measured *corpus
  drift* (the wiki grew, so the pre-retrieval arm B read more source and looked worse) —
  it could not measure retrieval, because B never calls `search-docs`/`get-doc`. B2 does,
  and **B2-vs-B on the same corpus** is the isolated before/after-retrieval delta. It is
  still a deterministic token proxy, not a real agent run.

## 8. Threats to validity (read this before quoting a number)

1. **chars/4 is not a tokenizer.** Absolute counts are approximate; trust ratios, not
   absolutes.
2. **A1 overstates and A2's window is arbitrary.** Whole-file grep reading (A1)
   overstates code-only cost; the ±40-line window (A2) is a chosen parameter. The true
   code-only cost is a range, not a point.
3. **The success tie.** Grep found the ground truth on all six tasks, so no findability
   advantage is shown. Do not claim the wiki "finds code grep can't" from this data.
4. **Single, self-referential repo.** This is the tool measuring itself on a small
   (~83k-token) codebase with a mature, carefully evidence-linked wiki. Results will not
   transfer to a larger repo, a thinner wiki, or a stale one.
5. **Amortization assumption.** B's session win depends on doing several tasks per
   orientation read. For a one-shot task, the conservative snippet grep (A2) wins.
6. **Deterministic proxy ≠ agent behavior.** A real agent interleaves search, partial
   reads, and reasoning; this harness models a clean "gather then read" pass.
7. **Maintenance cost is disclosed, not modeled.** Keeping the wiki fresh is real
   effort this harness does not quantify.
8. **B2 is a grounding proxy, not an edit proxy.** B2's big token win is real *for
   getting oriented on what the code does and where* (§5). A task that requires reading
   the actual implementation to make the change will still pay a source read on top —
   B2 measures the rediscovery/orientation cost the wiki removes, not the whole job.
9. **B2's `get-doc` set is top-K by a naive scorer.** The ranking is keyword-occurrence,
   not semantic; a task whose wiki coverage is thin or whose keywords collide with an
   unrelated doc could put the right doc below K and make B2 miss. On these six tasks the
   evidence-dense architecture/API/domain docs win the ranking, and grounding is 100% at
   K=1 and K=2 — but that robustness is a property of *this* wiki, not a guarantee.

## 9. Reproducing / extending

- Run: `node bench/run.js` (writes `results/current.{json,md}`; `results/baseline.{json,md}`
  is the frozen Gate 22 **before-retrieval** reference and is left untouched).
- Add a task: append to `tasks.json` (`id`, `question`, `keywords`, `groundTruth`).
- Compare the current run to the frozen before-retrieval reference: `node bench/run.js --against results/baseline.json`.
- Change the conservative window: edit `snippetWindow` in `tasks.json`.
- Change how many matched doc bodies B2 reads: edit `retrievalGetDocs` in `tasks.json` (default 2).

## 10. Honesty stance

Unfavorable results are reported, not hidden — an "overhead > benefit" outcome reshapes
the roadmap rather than being suppressed. **No token / speed / productivity claim ships
in the README or launch copy until a measured result supports it**, and any such claim
must cite whether it rests on A1 or the conservative A2 comparison.
