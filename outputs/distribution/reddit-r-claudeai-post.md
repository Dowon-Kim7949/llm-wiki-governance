# r/ClaudeAI post (v3 — accuracy-corrected) + megathread version + Go/No-Go

> Prepared for **you** to post. Not posted (I have no Reddit access). Pick the version by karma (item 2).
> v3 applies the product-identity audit's fixes: reference check ≠ symbol/prose verification; MCP = governance checks, not doc retrieval; no token-savings claim.

---

## Which version to post

- **Total Reddit karma ≥ 50** → **Version A** as a standalone post in r/ClaudeAI.
- **Total karma < 50** (or sub restricts project posts) → **Version B** as a comment in the **"Built with Claude — Project Showcase" megathread**.

---

## Version A — standalone post

**Title:** Do you keep project docs for Claude Code? How do you stop them going stale?

**Body:**

I've been letting Claude Code maintain a project wiki (`docs/llm-wiki`) so it doesn't have to re-read the whole codebase every session. Works great at first. The problem shows up a few weeks in: I refactor, the code moves, and the docs quietly keep describing the old shape — then the agent reads its own stale wiki and builds on wrong assumptions.

What I found missing in my own setup: CLAUDE.md and Cursor rules tell the agent how to behave, and a link linter tells me when a link is broken — but nothing told me whether a doc was still tied to the current code, or who had actually checked it.

So I built a small zero-dependency CLI that does three things:

- **Reference check** — a doc can point at the files/lines it's based on, and the CLI flags a reference when the file is missing or the line range no longer exists. (It checks the reference resolves to a real file/line — not that the prose itself is correct.)
- **Stale detection** — if a git-tracked file a doc points at changed after the doc was last reviewed, the doc gets flagged, and you can auto-downgrade it from `verified` back to `needs_review`.
- **Human verified gate** — anything the AI wrote or edited stays `needs_review`; only I can mark it `verified`. The tool can't promote its own docs.

I used Claude Code to build most of it — it drafted the frontmatter schema, wrote the CLI and an MCP server, and added the test suite — and it now maintains the tool's own wiki through the same verify / needs_review loop, so it's dogfooding itself. (The MCP server exposes those governance checks, not doc search — I'm not pretending it retrieves your docs for you.)

Try it in any Node repo:

```bash
npx llm-wiki-governance@latest quickstart --dry-run   # preview, writes nothing
npx llm-wiki-governance@latest quickstart --write     # scaffold + prints a prompt you paste into Claude Code
npx llm-wiki-governance@latest validate               # references resolve? anything stale? anything unreviewed?
```

Honest status: I've only dogfooded it on its own repo so far, and it deliberately doesn't try to verify that the prose is *true* or promise token savings — it manages references, staleness, and review state. That's why I'm here for feedback.

- npm: https://www.npmjs.com/package/llm-wiki-governance
- GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

Two things I'd genuinely like to know: do you keep AI-written project docs, or throw them out each session? And if you keep them, how do you currently notice when they've gone stale?

---

## Version B — megathread comment (karma < 50)

Built with Claude Code: **llm-wiki-governance**, a zero-dep CLI that keeps an AI-maintained project wiki from going stale.

I let Claude Code keep a `docs/llm-wiki` so it doesn't re-read the whole repo each session, but a few weeks in the docs drift from the code and the agent trusts its own stale notes. It does three things: a doc can point at the files/lines it's based on and the CLI flags a reference when the file is missing or the line range is gone (it checks the reference resolves, not that the prose is true); it flags a `verified` doc when the git-tracked code it points at changed after review; and anything the AI wrote stays `needs_review` until I mark it `verified` (the tool can't self-promote).

Claude Code built most of it — schema, CLI + MCP server, tests — and it maintains the tool's own wiki the same way. I've only dogfooded it on its own repo so far. (The MCP server exposes governance checks, not doc search, and I make no token-savings claims yet.)

```bash
npx llm-wiki-governance@latest quickstart --dry-run
npx llm-wiki-governance@latest validate
```

npm: https://www.npmjs.com/package/llm-wiki-governance · GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

Do you keep AI-written project docs, or toss them each session? If you keep them, how do you notice when they've gone stale?

---

## Go / No-Go checklist (run before posting — all 10 should be GO)

1. **Subreddit rules read** — r/ClaudeAI self-promo policy + whether standalone project posts are allowed vs. the showcase megathread.
2. **Karma / version** — **≥ 50 → Version A**; **< 50 → Version B**.
3. **Self-promo ratio** — if the sub enforces ~9:1, you've genuinely participated elsewhere recently.
4. **Flair** — correct flair applied (Version A only).
5. **Title** — a real question, no hype words (revolutionary / standard / ultimate), not clickbait.
6. **Honesty (audit-checked)** — no fabricated adoption; "only dogfooded on its own repo"; reference check described as file/line resolution NOT symbol/prose verification; MCP described as governance checks NOT doc retrieval; no token-savings claim. All three checks exist in the tool.
7. **Links** — npm + GitHub open; npm shows "LLM-WIKI Governance" (v1.16.1). ✅ verified
8. **Repro** — `npx llm-wiki-governance@latest quickstart --dry-run` runs clean from a fresh dir, writes nothing. ✅ verified against v1.16.1
9. **Response plan** — online to answer comments ~2–4h after posting (expect "how is this different from a link linter / just a prompt?" — answer: stale-drift on referenced code + human verified gate + downgrade, which those don't do).
10. **Timing** — high-traffic weekday window; one channel only (r/ClaudeAI), iterate on feedback before the next.
