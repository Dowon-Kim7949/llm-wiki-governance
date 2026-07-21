# Launch post drafts — `llm-wiki-governance`

Post to **one** channel first (Show HN or r/ClaudeAI), collect feedback, then adapt. Keep it honest: it is early, there are no adoption numbers yet — ask for feedback, don't claim traction.

Links to include:
- npm: https://www.npmjs.com/package/llm-wiki-governance
- GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

---

## A. Hacker News — "Show HN"

**Title (≤80 chars):**
Show HN: Governance for AI-written project docs – verify, catch drift (zero-dep)

**Body:**

AI coding agents now write a lot of a project's docs — the "LLM-wiki" pattern (Karpathy) and Google's Open Knowledge Format made that mainstream. In my experience the hard part isn't *writing* the docs; it's keeping them true as the code moves on. A wiki that quietly goes stale is worse than no wiki, because the agent (and the team) trusts it.

`llm-wiki-governance` is a small, zero-dependency CLI (+ an MCP server) that treats AI-written docs as something to be *governed*, not just generated:

- **Code-grounded** — every doc ties its claims to real files/symbols (`evidence`), and the tool checks those references exist.
- **Drift detection** — when the cited code changes, the doc is flagged (and can be auto-downgraded from `verified` to `needs_review`).
- **Human sign-off** — anything an AI wrote or edited stays `needs_review` until a person marks it `verified`. The tool structurally cannot self-promote to `verified`.
- **CI-enforceable** — `validate` runs read-only in CI; a composite GitHub Action is included.
- **OKF-compatible** — point it at an existing Open Knowledge Format / Markdown folder and it adds verify/drift/CI *without changing the format*.

How it works: `npx llm-wiki-governance quickstart` scaffolds the doc skeleton and prints a handoff prompt you paste into your coding agent (Claude Code / Codex / Cursor). The agent fills the docs from the real code; you review and mark them verified. From then on the tool keeps them honest.

It's zero runtime dependencies (Node stdlib only), works with any stack, and exposes read-only tools over MCP so an agent can query the wiki instead of re-reading the whole codebase every task.

It dogfoods itself: this repo's own wiki is maintained this way, and the tool even generates its own automation skills (`/llm-wiki-feature`, `/llm-wiki-docs-sync`).

It's early and I'd genuinely like feedback on the governance model — does the verify/drift/needs_review workflow fit how you (or your agents) actually work? What's missing before you'd put it in CI?

npm: https://www.npmjs.com/package/llm-wiki-governance
GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

---

## B. Reddit (r/ClaudeAI, r/ChatGPTCoding) — shorter

**Title:** I built a zero-dep CLI that keeps AI-written project docs from rotting (governance + drift detection, works with Claude Code / Cursor / Codex)

**Body:**

Agents are great at *writing* a project wiki; the problem is keeping it true as the code changes. `llm-wiki-governance` governs AI-written docs instead of just generating them:

- every claim tied to real code (evidence), checked automatically
- drift flagged when the cited code moves
- AI-written content stays `needs_review` until a human marks it `verified` (the tool can't self-approve)
- enforceable in CI; exposes read-only MCP tools so your agent queries the wiki instead of re-reading the repo each task
- zero dependencies, OKF-compatible (works on an existing Markdown/OKF folder)

`npx llm-wiki-governance quickstart` scaffolds docs + prints a handoff prompt you paste into your agent to fill them from real code, then you review.

It's early — looking for honest feedback on the workflow. npm: `llm-wiki-governance` · GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

---

## C. X / short

Agents write your project wiki fine — the hard part is keeping it *true* as code changes.

`llm-wiki-governance`: zero-dep CLI that ties every doc to real code, flags drift, keeps AI-written content behind human review, enforces it in CI. OKF-compatible.

`npx llm-wiki-governance quickstart`
