> Language: [English](./CHANGELOG.md) | [한국어](./CHANGELOG.ko.md)

# Changelog

All notable changes to `@dowonk-7949/llm-wiki-standard` are documented here. This
project follows [Semantic Versioning](https://semver.org/). Entries are newest-first.

## 1.1.0 — 2026-07-14

The "inner-loop cleanup" line: faster, quieter day-to-day validation.
Backward-compatible — no breaking changes.

### Added

- `validate --changed` scopes reported findings to the wiki documents changed vs
  the working tree (or a `--since <ref>` base), for fast pre-commit and PR CI.
  Cross-document checks still run over the whole wiki.
- A `pre-commit` hook template (`templates/git-hooks/pre-commit`) that runs
  `validate --changed`, with install notes in `templates/git-hooks/README.md`.
- The CI consumer-install job now runs Quick Start commands (`doctor`,
  `init --dry-run`, `validate-frontmatter`) against the packed tarball.

### Fixed

- `evidence.stale` no longer flags a verified document reviewed on the same day
  its source files were committed. The drift baseline is anchored to end-of-day,
  so only later-day commits count.

### Changed

- Replanned `ROADMAP.md` as a forward-looking, dateless `1.x` line (implementation
  history now lives in this changelog and `docs/llm-wiki/log.md`).
- Added EN–KO pairs for the externally-visible root docs — `CHANGELOG.ko.md` and
  `ROADMAP.ko.md` — cross-linked with their English canonicals and shipped in the
  package; established the EN–KO pair convention (`docs/llm-wiki/README.md`).

## 1.0.0 — 2026-07-14

First stable release. `1.0.0` promotes the `0.1.8` contract to a stable 1.0
milestone with **no functional command changes**; it declares the public contract
stable and hardens release quality.

### Stability

- Declared the CLI command/option surface, `--format json` output shape, and the
  required frontmatter contract stable. Breaking changes to these now require a
  major version bump. See `GATE_REVIEW.md` ("1.0.0 Stability Milestone") and
  `docs/llm-wiki/VERSIONING.md`.

### Added

- Release-quality CI: a Node 18.18.0 / 20 / 22 / 24 × Windows / macOS / Linux
  verify matrix and a packed-tarball consumer install smoke test
  (`.github/workflows/ci.yml`).
- This accumulating root `CHANGELOG.md`, shipped in the npm package.

### Notes

- The conservative write policy is unchanged: `init` / `quickstart` / `fix` write
  only under `--write`, `migrate --apply` remains blocked, `log.md` and existing
  adapter files are never overwritten, and CLI- or agent-authored docs remain
  `needs_review`.

## Earlier (0.1.x)

Pre-1.0 history is recorded in `docs/llm-wiki/log.md` and the per-release notes
under `docs/llm-wiki/releases/`. Highlights:

- `0.1.8` — scoped `fix` autofix command and evidence drift detection (`evidence.stale`).
- `0.1.7` — multi-ecosystem detection (Python/Go/Rust/JVM), Cursor and Copilot
  adapters, `llm-wiki.config.json`, and the `release-notes` command.
- `0.1.6` — real generation dates, `related.missing` and `content.not_enriched`
  validation, wiki-graph orphan detection, and the `--format html` dashboard.
