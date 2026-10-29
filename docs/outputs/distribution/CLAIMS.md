# Claims sheet — what may and may not be said in public

**Read this before writing or editing any public copy.** Every other file in this directory is
written against these rules. The evidence is strong enough now to say something real; it is not
strong enough to say what marketing copy usually wants to say. The gap between those two is where
credibility is lost, so the boundary is written down rather than remembered.

Nothing in this directory has been posted. Publishing is the maintainer's action.

---

## The evidence we actually have

A controlled three-arm measurement on **one external repository**
(`external-vue-quasar-app`, a Vue 3 / Quasar SPA — not this project), 6 cold-keyword
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
- Product facts, all verifiable (recounted from source on 2026-10-26, 1.34.0): MIT, Node ≥ 18.18,
  **zero runtime dependencies and zero devDependencies** (`package.json` has neither key), 32 CLI
  commands (plus `mcp` and `help`), 18 read-only MCP tools, promotion to `verified` only through
  an explicit `review --approve` (no other command and no MCP tool can do it), preview-first
  writes, append-only change log, sensitive-looking lines redacted in retrieval output.
- Positioning: **governance for AI-written project docs**, OKF-compatible.
- Differentiation, **as a scoped combination, never as uniqueness**: per-document review states,
  source citations checked to resolve, and a diff-based `impact` check that names the `verified`
  docs a PR made stale — in one zero-dependency CLI with a read-only MCP server. Say "we have not
  found another open-source tool that combines these for a whole project wiki (survey of
  2026-10-26)" and name that several tools cover parts of it (see Forbidden).

## Forbidden

- **Any headline number.** No "41% fewer tokens" as a slogan, no "cuts your context in half", no
  percentage in a title, tagline, badge, or opening line. The figure belongs inside a paragraph
  with its conditions, never on its own. (Since 1.30.1 the README carries no figure at all — only
  the qualitative negative result and a link to `BENCHMARK.md`.)
- **Any generalisation from one repo/model.** Not "saves tokens", not "makes agents cheaper".
- **Any `chars/4` proxy figure** (the −81.5% and similar from `bench/run.js`). Those are a
  diagnostic proxy, not measured tokens, and must never appear in public copy.
- **Pairing tokens with accuracy as a general benefit.** The accuracy edge is +6.8pp on six tasks
  with an agent grader. Say it with the grader caveat or not at all.
- **"Self-evolving project memory", "semantic search", "the LLM-wiki standard".** The tool does
  keyword search (not vectors), checks reference *format and target existence* (not prose truth),
  and Google's OKF owns the standard framing — we are compatible with it, not it.
- **Any claim that review/verification is automated.** It is deliberately not.
- **"Only a human can mark a doc verified."** The tool cannot tell who ran `review --approve`:
  `reviewed_by` records whatever name was given, and this repository's own wiki has been
  agent-approved since 2026-08-03. Say "only an explicit `review --approve` promotes a doc; the
  tool records who, it cannot prove it."
- **"Every claim is tied to real code" / "keeps your docs true".** Citations are checked to
  resolve (file, line range, symbol mention, section heading); the prose is not checked.
- **"Works on any stack, with any agent."** Name the detected stacks and the agents that get
  adapter files instead.
- **"The only / first tool that detects doc drift or gates PRs on it."** Small MIT tools such as
  ctxlint and driftlint already lint agent instruction files against the code, with git-based
  staleness, CI exit codes, and MCP servers; driftlint also has a merge-base diff mode and a beta
  human-approval flow. Mintlify Autopilot and Dosu open doc-update PRs from merged code. A
  uniqueness claim loses on the first reply.
- **"Never returns a secret."** Detection is pattern-based and line-level. From 1.35.0 it covers
  the original six patterns, keys whose last segment names a credential (`access_token`,
  `client_secret`, `accessToken` …) when the value is credential-shaped, and common
  vendor-prefixed tokens; retrieval redacts a detected PEM block through its END line. A secret
  that matches none of those passes. Say "sensitive-looking lines are redacted, and they block
  the check".
- **"Fewer tokens, fewer errors" as a general benefit.** The CLI's `help` text said this until
  1.35.0, which replaced it with the measured, conditional statement ("an unenriched wiki measured
  worse than none"). Copy must not bring the old phrase back.

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

**Public copy must not outrun the README.** The README has carried no figure since 1.30.1. A post
may quote the pooled figure (~41%) only inside a paragraph that carries all four conditions and the
losing task, with a link to `BENCHMARK.md`. Never quote 48.4% alongside it, or the surfaces will
read as inconsistent. Where a draft in this directory still says 48%, prefer the pooled figure or
drop the number.

---

## 2026-10-26 claims audit

Every public surface was re-read against the source on 2026-10-26 (1.34.0). Verdicts:
**verified** — matches the code; **conditional** — true only with a stated condition;
**misleading** — true in a narrower sense than a reader will take; **outdated** — was true.

| Claim | Where | Verdict | Action |
| --- | --- | --- | --- |
| "Every claim is tied to real code" | README (through 1.34.0) | misleading: citations are checked to resolve, prose is not | rewritten |
| "Only a human promotes to `verified`; the CLI can never self-approve" | README, README.ko | misleading: unenforced; this repo's wiki is agent-approved | rewritten as "only an explicit `review --approve` … cannot prove who" |
| "Works on any stack, with any agent" | README | overstated | replaced with detected stacks and adapter list |
| "An unreviewed or drifted wiki fails the build" | README | conditional: new projects start in `lite`, where the drift gate is off | qualified with the mode |
| "`verified` is human-only in every command" | this file | misleading, same reason as above | corrected above |
| "27 CLI commands / 17 MCP tools" | this file, `registries.md`, `reply-kit.md`, index `README.md` | outdated: 32 (+`mcp`, `help`) / 18 | corrected here; older drafts bannered |
| "No real numbers exist yet" | `bench/REAL_LLM_METHODOLOGY.md` | outdated | status note added above the original |
| "dogfoods its own standard" | `CONTRIBUTING.md`, `.ko.md` | wording conflicts with "not a standard" | reworded |
| "agents write, only a human verifies" | `docs/ORCA_PARALLEL_DEV.md` | contradicted by this repo's own approval policy | exception stated in the doc; the policy itself is the maintainer's call |
| "Why: … fewer tokens, fewer errors." | `llm-wiki help` (`src/cli.js`) | unqualified generalization from one benchmark | changed in 1.35.0 to the conditional, measured wording (the gain comes from keeping the wiki current; an unenriched wiki measured worse than none) |
| "~41% fewer input tokens" in a TL;DR | `launch-post.md`, `reddit-post.md` | conditional; the placement breaks "no figure in an opening line" | drafts superseded; new kit keeps the figure out of openings |
| Zero-dependency; read-only MCP; OKF `type`/`aliases`/`tags` | README, `package.json` | verified | kept |
| "An unenriched wiki measured worse than no wiki" | README | conditional: one repo, one model, six tasks; +14% is a lower bound; two of six tasks went the other way | kept, conditions now inline |
| Description wording | `package.json` vs GitHub "About" | minor mismatch in word order | maintainer's call (repo settings) |

## 2026-10-28 re-check (1.40.0 candidate)

| Claim | Where | Verdict | Action |
| --- | --- | --- | --- |
| "Read-only MCP" (row above: verified) | README, SECURITY, this file | **was false through 1.38.0**: `validate` with a crafted `since` made git write a file (N-25) | true from 1.40.0, tested; README and SECURITY now say so. Do not call it "always read-only". |
| "`cwd` selects the project" | MCP docs | conditional: `cwd` is not a sandbox; any directory the server can read | stated in SECURITY and README |
| "Every citation is checked" | README | verified, with the existing limit (resolving ≠ true) | kept |
| "Report a vulnerability through GitHub (preferred)" | SECURITY | **broken on 2026-10-28**: private vulnerability reporting is disabled on the repository | maintainer action: enable it in repository settings |
| "Tested on Windows, macOS, Linux" | README | verified by CI for the 1.40.0 candidate: PR #8 at `4c37b20`, 12 of 12 jobs (three OS × Node 18.18 / 20 / 22 / 24) | may be said for 1.40.0; it describes CI tests, not production use on those platforms |
| Security fix "shipped" | any post | true since 2026-10-28: 1.40.0 on npm (provenance attested) and GHSA-qwp4-w8vx-r72r published | may be said, with the advisory link; never how it is triggered |
| "Report a vulnerability through GitHub (preferred)" (row above) | SECURITY | fixed 2026-10-28: private vulnerability reporting is enabled | kept |

**Added to Forbidden:** describing how the N-25 issue is triggered in any promotional text, and
calling a release "fixed" or "secure" before the fixed package resolves from the registry.
