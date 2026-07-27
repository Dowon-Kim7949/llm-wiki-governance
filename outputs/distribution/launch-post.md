# Launch copy — Show HN and X

Drafts only. **Nothing here has been posted.** Publishing is the maintainer's action.
All copy obeys `CLAIMS.md`: no headline number, conditions attached wherever a figure appears.

---

## Show HN

**Title** (80 char limit; no number in the title, by rule)

```
Show HN: Governance for AI-written project docs – verify, catch drift, zero deps
```

**Body**

```
I kept hitting the same problem with AI coding agents: they will happily write a docs/ folder
for your project, and six weeks later half of it is quietly wrong. Nothing tells you which half.

llm-wiki-governance is a CLI that treats those docs as something to be governed rather than
trusted. Every document carries frontmatter linking its claims to real files, symbols, or line
ranges. Documents an agent wrote stay `needs_review` — the tool cannot promote anything to
`verified`, only a human can, and the reviewer's name and date get stamped. When the source a
verified document cites changes in git, the document is flagged stale. `validate` runs in CI, so
an unreviewed or drifted wiki fails the build instead of rotting quietly.

It's Node, MIT, and has zero runtime dependencies and zero devDependencies — no linter, no test
framework, no coverage tool. That was a deliberate constraint and it survived 26 minor releases.
There's also a read-only MCP server so an agent can query the wiki as tools instead of shelling
out. No write command is exposed over MCP.

The part I found most interesting was measuring whether any of this pays for itself. I ran a
three-arm test on an external Vue/Quasar app — six code-comprehension questions, N=3, Claude
Opus 4.8, answers graded blind to arm:

- agent reads source, no wiki:                    baseline
- agent queries a current, verified wiki:         48% fewer input tokens, slightly better answers
- same tools over a wiki with the content removed: 14% MORE tokens than having no wiki at all

That third arm is the one that mattered. Without it I could not tell whether the saving came
from the wiki's content or just from handing the agent a search tool — and it turns out the
tooling on its own is a net cost. It also means an unenriched wiki, the kind you get if you
scaffold docs and never fill them in, is worse than no wiki.

Caveats, because one repo is one repo: single project, single model, six tasks, N=3, and the
grader was an agent (blind to arm, but same model family — not an independent human). On one of
the six tasks retrieval lost badly, 3.17x, because the source file was tiny and reading it
directly was cheaper. An earlier run on the same repo measured only -10% and I can't fully
explain the gap. I'm not putting a performance number in the README on the strength of this.
Method and full numbers, including the runs that went against me:
https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/BENCHMARK.md

npm: llm-wiki-governance   ·   npx llm-wiki quickstart --write
```

**Notes for posting**
- Post Tue–Thu, roughly 08:00–11:00 ET, and be present for the first two hours.
- The comment thread is the actual product. `reply-kit.md` has prepared answers.
- If the third-arm result is what draws attention, lean into it — a negative result about your own
  category is why people believe the rest.

---

## X / Twitter

**Single post**

```
AI agents will write your project docs. Nothing tells you when they go stale.

llm-wiki-governance: every doc claim links to real code, agent-written docs stay needs_review
until a human signs off, and CI fails when cited source moves.

Node, MIT, zero dependencies.
```

**Thread (5 posts)**

```
1/ Your coding agent writes docs/. Six weeks later half of it is wrong and nothing tells you
which half. I built a CLI that governs those docs instead of trusting them.

2/ Every document links its claims to real files, symbols, line ranges. Change the cited source
and the doc is flagged stale — in CI, on the PR, not six weeks later.

3/ The rule that matters: an agent can never mark its own work verified. Agent-written docs stay
needs_review; a human approves, and their name and date get stamped. The tool has no path around
this.

4/ I tested whether it pays for itself. Three arms, external Vue app, 6 tasks, N=3, Opus 4.8,
graded blind. Wiki: -48% input tokens. Same tools over an EMPTY wiki: +14% vs no wiki at all.
So it's the content, not the tooling.

5/ Which also means: a scaffolded wiki nobody filled in is worse than no wiki.
One repo, one model, N=3, agent-graded — full method incl. the task where it lost 3.17x:
github.com/Dowon-Kim7949/llm-wiki-governance
```
