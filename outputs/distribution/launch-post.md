# Launch post drafts — other channels

> **r/ClaudeAI → use `reddit-r-claudeai-post.md`** (dedicated, audit-corrected: Version A standalone / Version B megathread). Do NOT post a Reddit version from this file.
> This file covers **Show HN** and **X**. All copy here has the same accuracy fixes as v3: reference-check ≠ symbol/prose verification; MCP = governance checks, not doc retrieval; no token-savings claim. Post to ONE channel first, collect feedback, then adapt. Honest tone — it's early, no adoption numbers.

Links: npm https://www.npmjs.com/package/llm-wiki-governance · GitHub https://github.com/Dowon-Kim7949/llm-wiki-governance

---

## A. Hacker News — "Show HN"

**Title (≤80 chars):**
Show HN: llm-wiki-governance – keep AI-maintained project docs from going stale

**Body:**

AI coding agents now write a lot of a project's docs — the "LLM-wiki" pattern and Google's Open Knowledge Format made that mainstream. In my experience the hard part isn't *writing* the docs; it's keeping them true as the code moves on. A wiki that quietly goes stale is worse than no wiki, because the agent (and the team) trusts it.

`llm-wiki-governance` is a small, zero-dependency CLI that treats AI-written docs as something to be *governed*, not just generated:

- **Reference-checked** — a doc can cite the files/lines it's based on (`evidence`), and the tool flags a reference when its file is missing or the line range no longer exists. (It checks the reference resolves to a real file/line — not that the prose itself is correct.)
- **Drift detection** — when the git-tracked code a doc cites changes after the doc was last reviewed, the doc is flagged (and can be auto-downgraded from `verified` to `needs_review`).
- **Human sign-off** — anything an AI wrote or edited stays `needs_review` until a person marks it `verified`. The tool structurally cannot self-promote to `verified`.
- **CI-enforceable** — `validate` runs read-only in CI (a composite GitHub Action is included; use the strict setting to fail the build on warnings).
- **OKF-compatible** — point it at an existing Open Knowledge Format / Markdown folder and it adds review-state/drift/CI *without changing the format*.

How it works: `npx llm-wiki-governance quickstart` scaffolds the doc skeleton and prints a handoff prompt you paste into your coding agent (Claude Code / Codex / Cursor). The agent fills the docs from the real code; you review and mark them verified. From then on the tool flags reference drift — you (or the agent) still update the prose.

It also exposes read-only *governance* tools over MCP (validate / status / drift / graph) — reports and metadata, not document search. It dogfoods itself: this repo's own wiki is maintained this way, and the tool generates its own automation skills (`/llm-wiki-feature`, `/llm-wiki-docs-sync`).

Honest scope: it manages references, staleness, and review state — it does not verify that the prose is semantically true, and I make no token/speed claims yet (those are hypotheses I want to test). I've only dogfooded it on its own repo so far.

I'd genuinely like feedback on the governance model — does the reference/drift/needs_review workflow fit how you (or your agents) work, and what would you need before putting it in CI?

npm: https://www.npmjs.com/package/llm-wiki-governance
GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance

---

## B. Reddit

→ Use **`reddit-r-claudeai-post.md`** (Version A for a standalone post, Version B for the Showcase megathread comment). Kept separate so there's a single, audit-corrected Reddit source of truth.

---

## C. X / short

Agents write your project wiki fine — the hard part is keeping it *true* as the code changes.

`llm-wiki-governance`: zero-dep CLI that checks doc→code references, flags git-drift on the referenced code, and keeps AI-written docs behind human review (`needs_review` → `verified`). It doesn't claim to verify the prose itself.

`npx llm-wiki-governance quickstart`
