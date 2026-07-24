# Operations Guide — running LLM-WIKI at your scale

A short, practical guide to adopting `llm-wiki-governance` on a small repo, a
medium repo, and a monorepo: which commands to lean on, what it costs in CI, and
how to keep the document set at a sane size. Everything here is read-only unless a
command is run with an explicit `--write` / `--apply`.

This lives outside `docs/llm-wiki/` on purpose: it is an operator guide, not a
governed wiki document, so it is not part of the validated corpus.

## The loop, at any scale

The same lifecycle applies everywhere; only the dial settings change:

1. **Scaffold** — `quickstart --write` (or `init --write`) creates the doc skeleton and the agent adapter.
2. **Enrich** — an agent fills the docs from real code (the `bootstrap` skill / `handoff` prompt). Generated docs stay `needs_review`.
3. **Review** — a human reads and promotes: `review` lists the `needs_review` backlog risk-ranked; `review --approve <path> --reviewer "<name>"` stamps `verified`. The tool never auto-verifies.
4. **Keep current** — as code changes, update the wiki in the same change (`prepare --task …` → `feature`/`fix`/`docs-sync` skills) and let `validate --changed`, `drift`, and `impact` catch what slips.
5. **Gate CI** — run `validate` on every PR; add `--strict` when you want warnings to fail the build.

## Small repo (one package, a handful of docs)

- **Setup:** `npx llm-wiki-governance@latest quickstart --write`.
- **Everyday:** `validate` (non-strict) locally; `audit` when you want the full findings picture; `stats` for a health snapshot.
- **CI:** one `validate` step per PR. Cheap — a single read-only pass over a small corpus. Start **without** `--strict` so warnings don't block early adoption; turn on `--strict` once the corpus is `verified` and stable.
- **Doc-count strategy:** the core set plus a profile is plenty. Don't create domain docs you can't enrich — an empty scaffold is flagged `content.not_enriched` and is worse than not existing. Add docs when a real subsystem needs one, not preemptively.

## Medium repo (backend/fullstack with real domains)

- **Setup:** `init --write` detects domains and scaffolds `domains/NN_<name>.md`. If detection is quiet, name them explicitly: `init --write --domains billing,auth,search`.
- **Everyday:** `prepare --task "<change>"` before implementing (scopes the relevant docs, source, and risks from the wiki); the `feature`/`fix` skills to keep docs in sync; `onboard --domain <name>` for newcomers.
- **Freshness:** wire `impact --strict` (or `validate --changed --since <base>`) into PR CI so a change to governed code that doesn't update its `verified` doc fails the build. Run `drift` periodically; `drift --downgrade` flips stale `verified` docs back to `needs_review`.
- **CI cost:** still one read-only pass; it scales with document count, not repo size (the scan reads the wiki, not your whole source tree). Scope with `--changed` on large PRs to report only findings on changed docs.
- **Doc-count strategy:** one doc per meaningful domain/subsystem. Split a doc when it stops fitting in a reviewer's head; merge two when they always change together. Keep `source_files`/`evidence` precise so drift detection stays meaningful.

## Monorepo (multiple packages)

- **Per-package wiki:** each package that wants governance gets its own `docs/llm-wiki/`. Run `monorepo` from the root — it detects npm/yarn `workspaces` and validates each package that has a wiki, aggregating results under a `packages[]` roll-up. (pnpm/YAML workspaces are not parsed, to preserve zero dependencies — treat those packages individually.)
- **Per-package config:** each package honors its own `llm-wiki.config.json` (rule toggles, required docs, reviewer, language). A single repo's output is byte-identical whether or not the monorepo command is used.
- **CI cost:** proportional to the number of wiki-bearing packages. Validate changed packages only where your CI can scope by path; otherwise the full `monorepo` pass is still just N read-only passes.
- **Doc-count strategy:** keep each package's wiki small and local. Cross-package references use the reserved `repo:<name>/<path>` scheme (recognized as external, never fetched) so a link between packages doesn't read as a broken local link.

## Cost & safety notes

- **CI cost** is dominated by document count and the `npx` cold-start, not by repo size — the tool reads the wiki, not the whole codebase. `--changed` narrows reporting further.
- **Reproducibility:** pin the CLI version in CI. The composite action defaults its `version` input to a pinned minor; override it deliberately when you upgrade.
- **Zero third-party dependencies** (runtime and dev): coverage uses Node's built-in `--experimental-test-coverage`, and the lint gate is a `node --check` syntax pass — nothing to audit in a lockfile.
- **Everything is preview-first.** `init`/`quickstart`/`fix` write only under `--write`; `migrate` only under `--apply`; `review` promotes only under an explicit `--approve`/`--approve-all --yes`. `verified` is human-only in every command, and `docs/llm-wiki/log.md` and existing adapter files are never overwritten.

## See also

- `npx llm-wiki-governance help <command>` — offline, per-command reference.
- [PUBLIC_API.md](llm-wiki/PUBLIC_API.md) — full command / option / config / programmatic-API / MCP reference.
- [GATE_REVIEW.md](../GATE_REVIEW.md) — accepted safety scopes and release gates.
- [SECURITY.md](../SECURITY.md) — threat model and the MCP server trust model.
