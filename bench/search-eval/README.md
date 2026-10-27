# bench/search-eval — search-docs ranking quality

A zero-dependency, read-only check of how well `search-docs` puts the right wiki
document near the top. It exists because the ranker could not be improved on
evidence before there was a set to measure against (engineering review, 2026-10-26,
P1-6: "evaluation set first").

```bash
node bench/search-eval/run.js                                        # queries.json, Markdown table
node bench/search-eval/run.js --queries bench/search-eval/heldout.json   # the held-out set (1.37.0)
node bench/search-eval/run.js --json                                 # per-query ranks
```

- **Corpus**: what `search-docs` searches by default in this repository
  (`loadContentDocs` + `applyFilters`): 52 documents on 2026-10-27, 33 of them release notes.
  The corpus is the wiki itself, so every wiki edit moves the numbers a little; each
  result below names the date it was measured on.
- **Queries**: `queries.json`, 40 queries (20 Korean, 20 English) with 1–3 relevant
  documents each, mixing keywords, questions, rule ids, and paraphrases. The 1.36.0
  ranker was chosen on this set. `heldout.json` (1.37.0) is a second set of 40, written
  afterwards — see "Held-out set" below.
- **Metrics**: recall@5 (share of a query's relevant documents in the top 5,
  averaged), hit@5 (a relevant document in the top 5), MRR (reciprocal rank of the
  first relevant document), and zero-result queries.
- **Rankers**: `shipped` calls the product's `rankDocsByQuery`, so the row always
  shows what users get, and `shipped --all-terms` the same ranker restricted to
  documents that contain every term. The 1.35.0 ranker is frozen in `run.js` as the
  reference, and it reproduces the 1.35.0 product's numbers exactly (checked against the
  released code on 2026-10-27). Every candidate gets the product's change-log demotion,
  so that rule is not what they differ by.

## Result on queries.json (2026-10-27, when 1.36.0 was chosen)

| ranker | recall@5 | hit@5 | MRR | zero-result queries |
| --- | --- | --- | --- | --- |
| 1.35.0 (AND substring) | 37.1% | 42.5% | 0.272 | 18 of 40 |
| 1.35.0 + any-term fallback | 59.2% | 70.0% | 0.415 | 0 |
| headings weighted, any-term | 76.7% | 87.5% | 0.416 | 0 |
| BM25, raw terms | 74.6% | 87.5% | 0.612 | 0 |
| BM25 + stopwords/particles | 83.3% | 92.5% | 0.659 | 0 |
| **shipped in 1.36.0** | **83.3%** | **92.5%** | **0.660** | **0** |

The largest single defect was the AND rule: 18 of 40 queries returned nothing,
because a question or a paraphrase almost never has every word in one document.
1.36.0 ships BM25 over substring counts, with a title and tags/aliases bonus,
English function words dropped, and trailing Korean particles stripped.

## Held-out set (1.37.0)

`heldout.json` was written after the 1.36.0 ranker was chosen, by a separate agent
that did not run `search-docs`, this evaluator, the CLI or any MCP search tool, and
did not grep the query strings over the wiki: it judged relevance by reading the
documents. About half of the queries start outside the wiki (git commit subjects,
CHANGELOG entries, README) and half from task situations. No label was edited after
a ranker had been run against the set; the only check before the first run was that
every labeled path exists.

Measured 2026-10-27 on the 1.37.0 wiki (52 documents):

| ranker | recall@5 | hit@5 | MRR | zero-result queries |
| --- | --- | --- | --- | --- |
| 1.35.0 (AND substring) | 10.0% | 10.0% | 0.100 | 34 of 40 |
| 1.35.0 + any-term fallback | 50.0% | 65.0% | 0.310 | 0 |
| headings weighted, any-term | 55.0% | 70.0% | 0.334 | 0 |
| BM25, raw terms | 65.0% | 80.0% | 0.591 | 0 |
| **shipped (1.36.0 ranker)** | **70.0%** | **85.0%** | **0.600** | **0** |
| shipped `--all-terms` | 16.3% | 17.5% | 0.108 | 27 of 40 |

The same wiki on `queries.json`: shipped 82.1% / 92.5% / 0.688 / 0, `--all-terms`
44.6% / 55.0% / 0.431 / 10.

On queries it never saw, the shipped ranker keeps most of its lead over the 1.35.0 AND
rule, but less of it than the selection set showed (hit@5 85.0% against 92.5%). Read
the held-out numbers as the estimate and the queries.json numbers as an in-sample upper
bound. `--all-terms` returns nothing for most question-shaped queries: it is for
keyword lookups where every term must be present, not a default.

**The corpus is the wiki, so editing the wiki moves the numbers.** While this release
was being written, wiki edits alone moved the held-out MRR of the shipped ranker from
0.589 to 0.600 and the selection-set MRR from 0.660 to 0.688. A difference smaller
than that — dropping function words and particles or not, 0.591 against 0.600 — is
not a finding.

## Limits — read before quoting

- **Small.** 40 + 40 queries over one 52-document wiki, and the numbers say nothing
  about other wikis. The held-out set removes selection bias, not the small sample.
- **Agent-labeled, not human-reviewed.** Both sets were written and labeled by agents
  reading the wiki without running search, so neither is fitted to a ranker. Both
  judged several long documents from headings and excerpts, though, so a relevant
  document can be missing from a list. That biases recall down for every ranker alike.
- **One run, deterministic.** There is no sampling noise to average out. A
  different query set is the variance that matters; the held-out set is one more draw
  of it, not a distribution.
- Not a claim about agent task outcomes. Better ranking is a precondition for
  fewer wasted reads, not evidence of them; see `../REAL_LLM_METHODOLOGY.md`.
