# Project Agent Guide

## Wiki <!-- wiki-block v2 -->

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

- Every wiki document carries YAML frontmatter.
- Set LLM-created or LLM-edited wiki docs to `needs_review` at edit time.
- **This repository then approves them itself** (2026-08-03, maintainer's decision):
  run `node bin/llm-wiki.js review --approve-all --yes`. The "Wiki discipline"
  section below is the full contract. This relaxation is **local to this repo** —
  the rule shipped to adopters in `templates/adapters/*` still requires human
  review, and nothing outside `docs/llm-wiki/` may seed `verified`.
- If code or docs change, update related wiki docs and append `docs/llm-wiki/log.md`
  in the same piece of work.
- Do not record sensitive information in wiki docs, logs, reports, or prompts.
- Read and write Markdown as UTF-8.

## Orca Parallel Agent Rules

These apply to every agent session launched into an Orca-managed worktree. The
full workflow — role definitions, worktree naming, hand-off format, permission
policy — is in [`docs/ORCA_PARALLEL_DEV.md`](./docs/ORCA_PARALLEL_DEV.md).

**Scope and isolation**

- One worktree, one goal. Stay inside the approved issue and plan.
- Never commit or push to `main`; work on the worktree's own branch.
- Do not bundle an unrequested refactor with the change you were asked to make.

**Before you edit**

- Read [`docs/llm-wiki/index.md`](./docs/llm-wiki/index.md) first.
- Scope the change from the wiki, not from guesswork:
  `node bin/llm-wiki.js prepare --task "<task>" --compact`.
- Prefer this repo's own skills — `/llm-wiki-prepare`, `/llm-wiki-feature`,
  `/llm-wiki-fix`, `/llm-wiki-docs-sync`. They carry the run-manifest contract
  that `check-run` verifies; an ad-hoc edit does not.
- Read the existing tests for the behavior you are about to change.

**Contracts that need explicit human approval to change**

- CLI command/flag surface, `--format json` shape and `schemaVersion`, exit codes.
- The frozen programmatic `commands` map in `src/index.js`, and MCP tool names.
- Node.js `>=18.18.0` support and the zero-runtime-dependency rule.

**Wiki discipline**

- Docs you create or edit go to `status: needs_review` at edit time. Never invent
  review metadata — the reviewer field must name whoever actually approved.
- **This repository approves its own docs (2026-08-03, maintainer's decision).**
  After the edit, run `node bin/llm-wiki.js review --approve-all --yes` (or
  `--approve <path>`). Do not ask for permission and do not leave the backlog for a
  human; that is the point of the decision.
  - `reviewed_by` comes from `llm-wiki.config.json`'s `reviewer`, which names the
    **agent**. So the stamp records that an agent approved it, not a human. A human
    signing their own review passes `--reviewer Dowon-Kim` explicitly, which wins
    over the config.
  - Why this repo is different: it was built end-to-end by vibe coding and exists as
    the product's dogfood, not as a codebase whose docs a human curates. The rule the
    product ships to adopters is unchanged and lives in `templates/adapters/*`.
  - The tool's own refusals stay, and they are the safety floor: documents with
    blocking or structural findings, and unenriched scaffolds
    (`review.not_enriched`), are still refused. Do not work around a refusal —
    fix the document.
  - **Never relax this outside `docs/llm-wiki/`.** Templates and shipped assets must
    keep seeding `needs_review`; `tests/shipped-assets.test.js` holds that line.
  - Precedence note: the generated skills (`/llm-wiki-feature`, `/llm-wiki-fix`,
    `/llm-wiki-docs-sync`) carry the shipped prompt line *"verified is
    human-approved only"*, which is the adopter default and stays. **In this
    repository this section overrides it.** Do not edit `src/task-prompts.js` to
    resolve the conflict — that text is what every adopter's agent reads.
- `evidence.stale` / `impact` drift is cleared by re-stamping `reviewed_at`, with no
  source cross-check (maintainer's decision, same day). Recorded consequence: these
  gates can no longer stay red in this repository, so they are **not an observation
  instrument here** — a measurement that needs one must use another repository.
- Append to `docs/llm-wiki/log.md` in the same change.
- Write a run manifest to `.llm-wiki/runs/` and verify with `check-run`.

**Verification before you report done**

- `npm test`, `npm run lint`, `npm run verify`, then
  `node bin/llm-wiki.js validate --strict` and `node bin/llm-wiki.js audit`.
- Never delete, skip, or weaken a test to make the suite pass. A failing test is
  a result — report it as one.

**Reporting**

- Use the Agent Result format in `docs/ORCA_PARALLEL_DEV.md`, and separate what
  you verified in the repository from what you assumed.

## Development Notes

Project-specific notes go here.
