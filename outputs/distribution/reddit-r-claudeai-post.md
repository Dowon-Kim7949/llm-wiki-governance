# r/ClaudeAI launch post (problem-centric) + Go/No-Go

> Prepared for posting by **you** to r/ClaudeAI. Not posted. Verify subreddit rules first.
> Tone: problem-first, honest, no hype. Banned words avoided: revolutionary / standard / ultimate.

---

## Title options (pick one — a real question beats a pitch)

1. AI agents write great project docs — then the code moves and the docs quietly go wrong. How do you catch that?
2. How do you keep AI-written project docs from drifting out of sync with the code?
3. Your agent trusts a wiki it wrote weeks ago. How do you know it's still true?

## Body

**1. The drift problem**

When you let Claude Code / Cursor / Codex maintain a project wiki (the "LLM-wiki" pattern), the docs look great on day one. The problem shows up in week three: you refactor, the code moves, and the docs quietly keep describing the old shape. The agent then reads its own stale wiki and confidently builds on wrong assumptions. A doc that's silently wrong is worse than no doc — because both the human and the agent trust it.

**2. Why the usual tools don't cover this**

- CLAUDE.md / Cursor Rules / AGENTS.md are *instructions to the agent* — they don't track whether your docs still match the code.
- A Markdown link linter checks that links resolve — not whether a doc's *claims* are still true.
- "Just review it in the PR" works until the docs and the code drift in separate PRs.

None of them answer the actual question: *is this doc still grounded in the current code, and who signed off on it?*

**3. What it actually checks**

`llm-wiki-governance` is a zero-dependency CLI (+ an MCP server) that treats AI-written docs as something to govern, not just generate:

- **Code-grounded** — each doc cites real files / symbols / lines (`evidence`, `source_files`); the tool verifies those references exist (`evidence.missing`).
- **Drift** — when cited code changes after a doc's `last_updated`, it's flagged (`evidence.stale`); `drift --downgrade` flips a `verified` doc back to `needs_review`.
- **Human gate** — anything an AI wrote or edited stays `status: needs_review`; only a human sets `verified`. The tool *structurally cannot* self-promote to verified.
- **Not-enriched** — placeholder-only scaffolds are flagged (`content.not_enriched`), so an empty wiki can't quietly "pass".
- **Connectivity** — `related`, wiki-links, and Markdown links must resolve.
- **CI** — `validate` runs read-only in CI (a composite GitHub Action is included); exit codes gate the build.
- No runtime dependencies (Node stdlib only); never writes raw secrets (redaction).

**4. 3-minute repro** (any repo, Node ≥18)

```bash
npx llm-wiki-governance@latest quickstart --dry-run   # preview, writes nothing
npx llm-wiki-governance@latest quickstart --write     # scaffold docs + print a handoff prompt
# paste that handoff prompt into Claude Code / Cursor — it fills the docs from your real code
npx llm-wiki-governance@latest validate               # evidence exists? links resolve? drift? not-enriched?
```

`--dry-run` detects your project type and writes nothing, so it's safe to try.

**5. Where it's early / what I want to test**

Honest state: I'm the maintainer, it's dogfooded on its own repo, and external adoption is ~0 — which is exactly why I'm posting. Hypotheses I'd like this community to poke at:

- (a) Do people actually *keep* AI-written project docs, or throw them away each session?
- (b) Is **drift detection** the part that earns its place, or is the **needs_review → verified** human gate the real value?
- (c) The CLI is Node-only right now — dealbreaker for non-JS projects? (It can *document* any stack, but you need Node to run it.)
- Brownfield fit on large existing doc sets isn't battle-tested yet.

**6. Links**

- npm: https://www.npmjs.com/package/llm-wiki-governance
- GitHub: https://github.com/Dowon-Kim7949/llm-wiki-governance
- OKF-compatible (Google's Open Knowledge Format): point it at an existing OKF / Markdown folder and it adds verify + drift + CI without changing the format.

**7. Feedback**

Would this be useful in your workflow? Specifically: how do you *currently* notice when your AI-written docs have gone stale — or do you just not keep them? And would a human `verified` gate help, or mostly get in the way?

---

## Go / No-Go checklist (run before posting — all 10 should be GO)

1. **Subreddit rules read** — r/ClaudeAI rules confirmed: self-promotion policy, whether standalone project/feedback posts are allowed (vs. a weekly megathread), and any required format.
2. **Account eligibility** — account meets karma/age minimums and has some prior non-promo participation, so it doesn't read as a drive-by ad.
3. **Self-promo ratio** — if the sub enforces ~9:1, you've genuinely contributed elsewhere recently.
4. **Flair** — correct flair applied if the sub uses them (e.g., "Feedback" / "Project" / "Showcase").
5. **Title** — problem-first, a real question, no banned words (revolutionary / standard / ultimate), not clickbait.
6. **Honesty** — no fabricated adoption or benchmarks; "external adoption ~0" + limits stated; every rule name in §3 actually exists in the tool.
7. **Links** — npm + GitHub open correctly; npm shows "LLM-WIKI Governance" (v1.16.1); repo topics/About set. ✅ verified
8. **Repro** — `npx llm-wiki-governance@latest quickstart --dry-run` runs clean from a fresh dir and writes nothing. ✅ verified against v1.16.1
9. **Response plan** — you can be online to answer comments for ~2–4h after posting (first-hour engagement drives visibility).
10. **Timing** — posted in a high-traffic window for the audience (weekday), not right before you go offline; one channel only for now (r/ClaudeAI), then iterate on feedback before the next channel.
