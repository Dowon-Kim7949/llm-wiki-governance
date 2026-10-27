# bench/search-eval — search-docs ranking quality

A zero-dependency, read-only check of how well `search-docs` puts the right wiki
document near the top. It exists because the ranker could not be improved on
evidence before there was a set to measure against (engineering review, 2026-10-26,
P1-6: "evaluation set first").

```bash
node bench/search-eval/run.js          # Markdown table
node bench/search-eval/run.js --json   # per-query ranks
```

- **Corpus**: what `search-docs` searches by default in this repository
  (`loadContentDocs` + `applyFilters`): 52 documents on 2026-10-27, 33 of them release notes.
- **Queries**: `queries.json`, 40 queries (20 Korean, 20 English) with 1–3 relevant
  documents each, mixing keywords, questions, rule ids, and paraphrases.
- **Metrics**: recall@5 (share of a query's relevant documents in the top 5,
  averaged), hit@5 (a relevant document in the top 5), MRR (reciprocal rank of the
  first relevant document), and zero-result queries.
- **Rankers**: `shipped` calls the product's `rankDocsByQuery`, so the row always
  shows what users get. The 1.35.0 ranker is frozen in `run.js` as the reference,
  and it reproduces the 1.35.0 product's numbers exactly (checked against the
  released code on 2026-10-27). Every candidate gets the product's change-log demotion,
  so that rule is not what they differ by.

## Result (2026-10-27)

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

## Limits — read before quoting

- **Small and in-sample.** 40 queries over one 52-document wiki. The shipped
  ranker was chosen on this same set; one weight (+1 for a tags/aliases hit) was
  added after the first measurement. There is no held-out set, so the numbers are
  an upper bound for this corpus and say nothing about other wikis.
- **Agent-labeled, not human-reviewed.** An agent wrote the queries and labels
  from reading the wiki without running search, so the set is not fitted to the
  old ranker. It judged several documents from headings and excerpts, though, so
  a relevant document can be missing from a list. That biases recall down for
  every ranker alike.
- **One run, deterministic.** There is no sampling noise to average out. A
  different query set is the variance that matters, and it has not been measured.
- Not a claim about agent task outcomes. Better ranking is a precondition for
  fewer wasted reads, not evidence of them; see `../REAL_LLM_METHODOLOGY.md`.
