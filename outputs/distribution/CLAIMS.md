# Claims sheet — what may and may not be said in public

**Read this before writing or editing any public copy.** Every other file in this directory is
written against these rules. The evidence is strong enough now to say something real; it is not
strong enough to say what marketing copy usually wants to say. The gap between those two is where
credibility is lost, so the boundary is written down rather than remembered.

Nothing in this directory has been posted. Publishing is the maintainer's action.

---

## The evidence we actually have

A controlled three-arm measurement on **one external repository**
(`csap-roadkeeper-frontend`, a Vue 3 / Quasar SPA — not this project), 6 cold-keyword
comprehension tasks, **N=3** (18 runs per arm), model `claude-opus-4-8`, run 2026-07-24 and
2026-07-27. Full record: `docs/llm-wiki/BENCHMARK.md` and `bench/results/`.

| arm | input tokens vs B | blind rubric accuracy |
| --- | --: | --: |
| **B** — no wiki, agent reads source | baseline | 0.910 |
| **B2** — retrieval tools over the real, verified wiki | **0.516× (−48.4%)** | **0.978** |
| **B2_empty** — same tools, same prompt, over a stub wiki with the knowledge removed | **1.140× (+14.0%)** | 0.911 |

Two things follow, and only these two:

1. **The saving comes from the wiki's content, not from having search tools.** The control arm —
   identical tools and a byte-identical prompt over an unenriched wiki — cost *more* than having no
   wiki at all, and scored the same as no wiki on accuracy.
2. **An unenriched wiki is worse than no wiki.** A scaffold nobody filled in costs tokens and
   returns nothing.

Both hold **for this fixture**. Neither is a general claim.

---

## Permitted

- The table above, **with all four conditions attached in the same breath**: one repository, one
  model, six tasks, N=3, agent-graded — and a link to `BENCHMARK.md`.
- The conservative figure when quoting a single number: **pooled (N=1+N=3) input −40.7%**, not the
  N=3-only −48.4%.
- **The losing case, volunteered rather than extracted:** on one of the six tasks (`routing-map`)
  retrieval *lost* at 3.17× — the source file was small enough that reading it directly was cheaper.
- "An unenriched wiki cost 14% more than no wiki" — the most interesting and most defensible line
  we have, because it is a negative result about our own category.
- Product facts, all verifiable: MIT, Node ≥ 18.18, **zero runtime dependencies and zero
  devDependencies**, 27 CLI commands, 17 read-only MCP tools, `verified` is human-only in every
  command, preview-first writes, append-only change log, sensitive-value redaction.
- Positioning: **governance for AI-written project docs**, OKF-compatible.

## Forbidden

- **Any headline number.** No "41% fewer tokens" as a slogan, no "cuts your context in half", no
  percentage in a title, tagline, badge, or opening line. The figure belongs inside a paragraph
  with its conditions — which is exactly where the README now puts it — never on its own.
- **Any generalisation from one repo/model.** Not "saves tokens", not "makes agents cheaper".
- **Any `chars/4` proxy figure** (the −81.5% and similar from `bench/run.js`). Those are a
  diagnostic proxy, not measured tokens, and must never appear in public copy.
- **Pairing tokens with accuracy as a general benefit.** The accuracy edge is +6.8pp on six tasks
  with an agent grader. Say it with the grader caveat or not at all.
- **"Self-evolving project memory", "semantic search", "the LLM-wiki standard".** The tool does
  keyword search (not vectors), checks reference *format and target existence* (not prose truth),
  and Google's OKF owns the standard framing — we are compatible with it, not it.
- **Any claim that review/verification is automated.** It is deliberately not.

## Caveats that must travel with the numbers

- The grader is an **agent from the same model family as the system under test**, blind to arm.
  On 2026-07-27 the maintainer **ratified the grading standard** after an adversarially-chosen
  7-answer sample (verdict (a); no scores changed). Say it as **"agent-graded, standard
  human-ratified on a sampled review"** — **never "human-graded"**, because it was not an
  independent re-grade of all 54 answers.
- The fixture wiki was in good health (22/22 verified, zero drift). Results on a stale wiki are
  different and worse — an earlier run produced a **confidently wrong security answer** from a
  stale doc. That failure mode belongs in the story, not hidden.
- An earlier real run on the same repo measured only **−10%**. The gap to −48.4% is explained
  directionally (driver path, token accounting, fixture state) but **not fully**. Disclose it.
- The stub in the control kept doc paths and titles, making it a generous control — **+14% is a
  lower bound** on the tooling-only penalty.

---

## Before anything goes public

1. ~~Human ratification of the grading worksheet.~~ **Done 2026-07-27** — the maintainer reviewed
   the adversarial 7-answer sample in `bench/results/…-ratification.md` and ratified the standard
   (verdict (a), no scores changed). **Both preconditions are now clear; publishing is unblocked.**
   Remaining honest limit: it ratified the *standard on a sample*, not an independent re-grade.
2. ~~Decide whether the README's evidence paragraph is updated.~~ **Done 2026-07-27** — both
   READMEs now carry the controlled result at the conservative pooled figure ("about 41%"), with
   the control arm, the losing task, and all four scope conditions. See `README-note.md`.

**Public copy must now match the README.** The README quotes ~41% (pooled); posts and registry
entries should not quote 48.4% alongside it, or the two surfaces will read as inconsistent.
Where a draft in this directory still says 48%, prefer the pooled figure or drop the number.
