# Antigravity Project Instructions

## LLM-WIKI <!-- llm-wiki-adapter v2 -->

Read the project LLM-WIKI before making code or documentation changes.

Always read first (kept deliberately small):

- `docs/llm-wiki/index.md` — entrypoint, read order, document status
- `docs/llm-wiki/project-profile.md` — what this project is and where its boundaries are

Load the rest on demand — do not preload the whole wiki:

- `docs/llm-wiki/README.md` — wiki operating rules
- `docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md` — module layout and conventions
- `docs/llm-wiki/DOMAIN_FEATURES.md` — user-facing features and evidence
- Locate before reading: `llm-wiki search-docs "<query>"` or `llm-wiki prepare --task "<task>" --compact`, then read only the needed section with `llm-wiki get-doc <path> --section "<heading>" --strict-section`, or open the file directly when the task depends on all of it.

Required rules:

- Keep AI-created or AI-edited wiki documents as `needs_review`.
- Use `verified` only after human review.
- If code or docs change, update related wiki docs and append `docs/llm-wiki/log.md`.
- Do not record sensitive information in wiki docs, logs, reports, or prompts.
- Preserve UTF-8 for Markdown and Korean text.

<!-- /llm-wiki-adapter -->
