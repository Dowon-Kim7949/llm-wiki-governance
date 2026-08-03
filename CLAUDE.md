# Project Instructions

## LLM-WIKI <!-- llm-wiki-adapter v2 -->

Read the project LLM-WIKI before making code or documentation changes.

Always loaded (kept deliberately small):

@docs/llm-wiki/index.md
@docs/llm-wiki/project-profile.md

Load the rest on demand — do not preload the whole wiki:

- docs/llm-wiki/README.md — wiki operating rules
- docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md — module layout and conventions
- docs/llm-wiki/DOMAIN_FEATURES.md — user-facing features and evidence
- Locate before reading: `llm-wiki search-docs "<query>"` or `llm-wiki prepare --task "<task>" --compact`, then read only the needed section with `llm-wiki get-doc <path> --section "<heading>" --strict-section`, or open the file directly when the task depends on all of it.

Required rules:

- Set LLM-created or LLM-edited wiki docs to `needs_review` at edit time.
- **This repository then approves them itself** (2026-08-03, maintainer's decision):
  run `node bin/llm-wiki.js review --approve-all --yes`. `reviewed_by` comes from
  `llm-wiki.config.json`'s `reviewer` and names the agent, so the stamp does not
  claim a human review. Drift (`evidence.stale` / `impact`) is cleared the same way,
  without a source cross-check. `AGENTS.md` "Wiki discipline" is the full contract.
  This relaxation is **local to this repo** — the rule shipped to adopters in
  `templates/adapters/*` still requires human review, and nothing outside
  `docs/llm-wiki/` may seed `verified`.
- If code or docs change, update related wiki docs and append `docs/llm-wiki/log.md`.
- Do not record sensitive information in wiki docs, logs, reports, or prompts.
- Read and write Markdown as UTF-8.

<!-- /llm-wiki-adapter -->
