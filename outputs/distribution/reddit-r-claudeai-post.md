# r/ClaudeAI post (v2, developer-voice) + megathread version + Go/No-Go

> Prepared for **you** to post. Not posted (I have no Reddit access). Pick the version by your karma (see checklist item 2).

---

## Which version to post

- **Total Reddit karma ≥ 50** → post **Version A** as a standalone post in r/ClaudeAI.
- **Total Reddit karma < 50** (or the sub restricts project posts) → post **Version B** as a comment in the **"Built with Claude — Project Showcase" megathread**.

---

## Version A — standalone post

**Title:** Do you keep project docs for Claude Code? How do you stop them going stale?

**Body:**

I've been letting Claude Code maintain a project wiki (`docs/llm-wiki`) so it doesn't have to re-read the whole codebase every session. Works great at first. The problem shows up a few weeks in: I refactor, the code moves, and the docs quietly keep describing the old shape — then the agent reads its own stale wiki and builds on wrong assumptions.

What I found missing in my own setup: CLAUDE.md and Cursor rules tell the agent how to behave, and a link linter tells me when a link is broken — but nothing told me whether a doc was still *true* about the current code, or who had actually checked it.

So I built a small zero-dependency CLI (plus an MCP server so the agent can query it) that does three things:

- **Evidence check** — every doc has to point at real files/symbols, and it verifies those still exist.
- **Stale detection** — if the code a doc points at changed after the doc was last touched, the doc gets flagged.
- **Human verified gate** — anything the AI wrote or edited stays `needs_review`; only I can mark it `verified`. The tool can't promote its own docs.

I actually used Claude Code to build most of it: it drafted the frontmatter schema, wrote the CLI and the MCP server, and added the test suite — and it now maintains the tool's own wiki through the same verify / needs_review loop, so it's dogfooding itself.

Try it in any Node repo:

```bash
npx llm-wiki-governance@latest quickstart --dry-run   # preview, writes nothing
npx llm-wiki-governance@latest quickstart --write     # scaffold + prints a prompt you paste into Claude Code
npx llm-wiki-governance@latest validate               # evidence exists? links resolve? anything stale?
```

Honest status: I've only dogfooded it on its own repo so far, which is why I'm here.

- npm: https://www.npmjs.com/package/llm-wiki-governance
- GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

Two things I'd genuinely like to know: do you keep AI-written project docs, or throw them out each session? And if you keep them, how do you currently notice when they've gone stale?

---

## Version B — megathread comment (karma < 50)

Built with Claude Code: **llm-wiki-governance**, a zero-dep CLI that keeps an AI-maintained project wiki from going stale.

I let Claude Code keep a `docs/llm-wiki` so it doesn't re-read the whole repo each session, but a few weeks in the docs drift from the code and the agent starts trusting its own stale notes. It checks three things: every doc has to point at real files/symbols (and it verifies they still exist), it flags a doc when the code it points at changed, and anything the AI wrote stays `needs_review` until I mark it `verified` (the tool can't self-promote).

Claude Code built most of it — the frontmatter schema, the CLI + MCP server, the tests — and it now maintains the tool's own wiki through the same loop. I've only dogfooded it on its own repo so far.

```bash
npx llm-wiki-governance@latest quickstart --dry-run
npx llm-wiki-governance@latest validate
```

npm: https://www.npmjs.com/package/llm-wiki-governance · GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

Do you keep AI-written project docs, or toss them each session? If you keep them, how do you notice when they've gone stale?

---

## Go / No-Go checklist (run before posting — all 10 should be GO)

1. **Subreddit rules read** — r/ClaudeAI rules confirmed: self-promotion policy, whether standalone project posts are allowed vs. the showcase megathread.
2. **Karma / version** — checked total karma: **≥ 50 → Version A** (standalone); **< 50 → Version B** (megathread comment).
3. **Self-promo ratio** — if the sub enforces ~9:1, you've genuinely participated elsewhere recently.
4. **Flair** — correct flair applied if the sub uses them (only relevant for Version A).
5. **Title** — Version A title is a real question, no hype words (revolutionary / standard / ultimate), not clickbait.
6. **Honesty** — no fabricated adoption; "only dogfooded on its own repo so far" is stated; the three checks described actually exist in the tool.
7. **Links** — npm + GitHub open correctly; npm shows "LLM-WIKI Governance" (v1.16.1). ✅ verified
8. **Repro** — `npx llm-wiki-governance@latest quickstart --dry-run` runs clean from a fresh dir and writes nothing. ✅ verified against v1.16.1
9. **Response plan** — you can be online to answer comments for ~2–4h after posting.
10. **Timing** — posted in a high-traffic weekday window, not right before you go offline; one channel only (r/ClaudeAI), iterate on feedback before the next.
