# Storefront readiness — two README changes (✅ BOTH APPLIED 2026-07-27)

> **Status: done.** The maintainer approved both on 2026-07-27 and chose the **conservative
> pooled −40.7%** ("about 41%") over the N=3-only −48.4%. Applied to `README.md` and
> `README.ko.md` together; the CI example now pins `@v1.26.0` (tag verified to exist on origin).
> The text below is retained as the record of what was proposed and why.

The README is the npm and GitHub storefront: it is the first thing anyone arriving from a
registry listing or a post will read. Two things in it are now out of step with the repository.
Both are drafted here rather than applied, because they change public-facing claims and that is
the maintainer's call.

---

## 1. The evidence paragraph cites a superseded measurement

`README.md:145` (and the matching paragraph in `README.ko.md`) still describes the **2026-07-22**
run: *"using ~10% fewer tokens"*. That figure came from the subagent driver with a single
total-token count. It has since been superseded by the SDK-path run with a real input/output
split, a blind grade, **and a control arm** — the strongest evidence this project has. Leaving the
weaker number is not dishonest, but it undersells the work and cites a run we can no longer fully
reconcile with the newer one.

### Proposed replacement for `README.md:145`

```markdown
Measured on an external Vue/Quasar app — 6 code-comprehension tasks, N=3, Claude Opus 4.8,
answers graded blind to which arm produced them. An agent querying a **current, verified** wiki
used **48% fewer input tokens** than one reading source directly, at slightly better rubric
accuracy. The control arm matters more than that number: the **same retrieval tools over a wiki
with its content stripped out** cost **14% *more* than having no wiki at all** — so the saving
comes from the maintained content, not from handing the agent a search tool. It also means an
unenriched wiki is worse than no wiki. Against a **stale** wiki, an earlier run produced a
confidently wrong security answer, which is the whole argument for `verified` review, drift /
`impact`, and `validate --changed`. Scope: one repository, one model, six tasks, N=3,
agent-graded — and on one of the six tasks retrieval *lost* at 3.17×. Method, full numbers, and
the runs that went against us: [BENCHMARK.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/BENCHMARK.md).
```

**This keeps the headline ban intact.** The number is inside a paragraph under an existing
question-form heading ("Does it actually help?"), never in the title, the tagline, or the opening
lines, and every condition travels with it. If you would rather it stay conservative, the same
paragraph works with the pooled **−40.7%** in place of 48%.

A Korean equivalent for `README.ko.md` will be written to match whichever version you approve —
the two files must not diverge.

## 2. The CI example pins a very old tag

`README.md:140` suggests:

```
uses: Dowon-Kim7949/llm-wiki-governance/.github/actions/validate@v1.7.0
```

`v1.7.0` is real and the advice to pin an exact tag is right, but an example pinning a tag from
nineteen releases ago reads as an unmaintained project to a first-time visitor. Suggest bumping
the example to `@v1.26.0`. Cosmetic, no behaviour change, both READMEs.

---

## Not proposed

- No change to the tagline, the H1, or the first screen. Those are already accurate and governance-first.
- No new badges. Download-count badges would be actively misleading here — the counter is
  dominated by this project's own CI and by registry mirrors (see `registries.md`).
