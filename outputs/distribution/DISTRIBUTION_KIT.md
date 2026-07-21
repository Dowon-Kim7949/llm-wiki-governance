# Distribution Kit — `llm-wiki-governance`

Ready-to-paste listing copy for getting the package discovered (P2). **You** submit/post; this file is the source of truth for consistent copy across channels. Keep claims honest — no adoption numbers until they are real.

- **npm:** https://www.npmjs.com/package/llm-wiki-governance
- **GitHub:** https://github.com/Dowon-Kim7949/llm-wiki-governance
- **Install:** `npx llm-wiki-governance@latest quickstart --dry-run`

---

## 1. One-liners (reuse everywhere)

- **Short:** Governance for AI-written project docs — verify, catch drift, keep them code-grounded. Zero-dependency, OKF-compatible.
- **Medium:** A zero-dependency CLI + MCP server that keeps an AI coding agent's project docs trustworthy: every claim tied to real code, drift flagged when the code moves, AI-written content held behind human review, all enforceable in CI.
- **Tagline:** Your agent's wiki, kept honest.

## 2. npm

Already live. The npm page renders `README.md`. `keywords` were added to `package.json` (effective on the next publish) for search: `llm, ai, documentation, docs-as-code, knowledge-base, wiki, governance, drift-detection, mcp, claude, cursor, codex, okf, ci, cli, zero-dependency`.

## 3. MCP server registries

The package ships a read-only MCP server (`llm-wiki mcp`) exposing `validate/audit/next/status/doctor/stats/graph/explain/handoff/prompt`. Submit to MCP directories (e.g. modelcontextprotocol servers list, awesome-mcp-servers, glama.ai, mcp.so, PulseMCP).

**Listing entry:**
> **llm-wiki-governance** — Governance for AI-written project docs. Read-only tools to validate a code-grounded doc wiki, detect drift, and report health. Zero-dependency, stdio JSON-RPC.
>
> Install / config:
> ```json
> { "mcpServers": { "llm-wiki": { "command": "npx", "args": ["-y", "llm-wiki-governance", "mcp"] } } }
> ```

## 4. Claude skills / plugin catalogs

The repo ships `.claude/skills/llm-wiki-{feature,fix,docs-sync,bootstrap}` (dogfood). Submit to emerging "awesome-claude-skills" / Claude plugin catalogs.

**Listing entry:**
> **llm-wiki-governance** — Wiki-grounded automation skills (`/llm-wiki-feature`, `/llm-wiki-fix`, `/llm-wiki-docs-sync`) that make a coding agent read the project's governed wiki first, do the work, then keep the wiki in sync — all held at `needs_review` until a human approves.

## 5. "Awesome" lists & communities (submit as PRs / posts)

| Target | Category |
|---|---|
| awesome-mcp-servers | documentation / dev-tools |
| awesome-claude-code / awesome-claude-skills | skills |
| awesome-ai-tools, awesome-devtools | AI dev tooling |
| awesome-docs-as-code, awesome-technical-writing | docs governance |
| r/ClaudeAI, r/ChatGPTCoding, r/programming (Show-and-tell) | community |
| Hacker News (Show HN) | launch |
| dev.to / Hashnode | article |

## 6. Submission checklist

**Done (automated):**
- [x] npm page correct — 1.16.1 live, README H1 "LLM-WIKI Governance", keywords published (`npm view llm-wiki-governance`).
- [x] GitHub repo description = the one-liner; homepage → npm; **18 topics** set (`llm, ai, documentation, docs-as-code, knowledge-base, governance, drift-detection, mcp, model-context-protocol, claude, claude-code, cursor, codex, okf, ci, cli, zero-dependency, agents`).

**Your turn (outward-facing — needs your accounts / voice):**
- [ ] Submit MCP registry entry (section 3) — start with `github.com/punkpeye/awesome-mcp-servers` (PR) and a directory like glama.ai / mcp.so / pulsemcp.com (verify each site's current submit flow).
- [ ] Submit 1–2 awesome-list PRs (section 5) — confirm each list's CONTRIBUTING format before opening the PR.
- [ ] Post the launch post (`launch-post.md`) to ONE channel first (Show HN or r/ClaudeAI), gather feedback, then iterate.
- [ ] After posting: watch npm downloads (new name), GitHub stars, and JTBD replies. Record the numbers — that is the only real signal.

> I can draft the exact PR entry (or open the PR via `gh`) for a specific target once you pick it. Community posts (HN/Reddit) go out under your account — I'll refine copy, you post.
