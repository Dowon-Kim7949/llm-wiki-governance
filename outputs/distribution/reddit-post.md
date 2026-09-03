# Reddit draft — r/ClaudeAI

Draft only. **Nothing here has been posted.** Publishing is the maintainer's action.

**Context from the July attempt:** the previous launch went into the *Built with Claude Project
Showcase* megathread as a comment, because r/ClaudeAI Rule 7 requires ~50 karma for a feed post
and the account had 1. Check current karma before choosing a variant — a feed post reaches far
more people, and the megathread comment demonstrably reached almost nobody (3 stars, 0 issues in
the six days after).

Subreddit self-promotion rules change; re-read the sidebar before posting either variant.

---

## Variant A — feed post (needs karma ≥ 50)

**Title**
```
I built a CLI that stops Claude's project docs from quietly going stale
```

**Body**
```
Claude Code will happily write a whole docs/ folder for your project. Six weeks and a few
refactors later, some of it is wrong — and nothing tells you which parts.

I've been building a tool for that. The idea is to treat agent-written docs as something to be
governed rather than trusted:

- Every document links its claims to real files, symbols, or line ranges.
- Documents Claude writes stay `needs_review`. The tool physically cannot mark anything
  `verified` — only a human can, and their name and date get stamped into the frontmatter.
- When the source a verified document cites changes in git, the document gets flagged stale.
- `validate` runs in CI, so a drifted or unreviewed wiki fails the build.
- It generates `/llm-wiki-*` skills so Claude runs the same workflow every time, plus a
  read-only MCP server so it can query the wiki as tools instead of re-reading your code.

Node, MIT, and zero dependencies — no runtime deps and no devDependencies either.

The thing I actually wanted to know was whether keeping a wiki pays for itself. I ran three arms
on an external Vue/Quasar app, six comprehension questions, N=3, Opus 4.8, answers graded blind
to which arm produced them:

- reading source, no wiki:                          baseline
- querying a current, verified wiki:                ~41% fewer input tokens, slightly better answers
- same tools over a wiki with the content removed:  14% MORE tokens than no wiki at all

That last arm is the point. Without it I couldn't tell whether the win came from the wiki's
content or just from giving the agent a search tool — and it turns out the tooling alone costs
you. Which also means a scaffolded wiki you never filled in is worse than not having one.

Honest limits: one repo, one model, six tasks, N=3, and the grader was an agent (blind to arm,
but same model family; I ratified the grading standard against an adversarial sample, which is not
an independent re-grade). On one of the six tasks retrieval lost badly
because the file was small enough to just read. The README states this with its conditions
attached rather than as a headline — one repo doesn't earn a headline.

npx llm-wiki quickstart --write
https://github.com/Dowon-Kim7949/llm-wiki-governance

Happy to answer anything, including why you might not want this.
```

---

## Variant B — Showcase megathread comment (shorter)

```
**llm-wiki-governance** — keeps the docs Claude writes for your project from quietly going stale.

Every document links its claims to real files and symbols; anything Claude writes stays
`needs_review` until a human approves it (the CLI can't self-approve); and when the cited source
changes in git, the doc is flagged and CI fails. Ships `/llm-wiki-*` skills and a read-only MCP
server so Claude can query the wiki instead of re-reading your codebase.

Node, MIT, zero dependencies.

I measured it three ways on an external Vue app (6 tasks, N=3, Opus 4.8, blind-graded): querying
a current wiki used ~41% fewer input tokens than reading source; the same tools over an *emptied*
wiki cost 14% more than having no wiki at all. So it's the content that pays, not the tooling —
and an unenriched wiki is worse than none. One repo, one model, agent-graded, and it lost on one
of the six tasks; full method in the repo.

npx llm-wiki quickstart --write · https://github.com/Dowon-Kim7949/llm-wiki-governance
```

---

## If replies come

Use `reply-kit.md`. The two questions most likely here: "how is this different from a CLAUDE.md"
and "who maintains all these docs". Both have prepared answers that concede the real cost first.
