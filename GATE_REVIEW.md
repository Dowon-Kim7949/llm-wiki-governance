---
title: LLM-WIKI Governance Package Gate Review
tags:
  - llm-wiki
  - package
  - gate-review
  - stable
status: needs_review
doc_type: gate_review
project: llm-wiki-governance
last_updated: 2026-07-21
author: ai-generated
last_edited_by: Claude Code
wiki_block_version: v1
source_files:
  - package.json
  - src/cli.js
  - src/commands.js
  - src/detector.js
  - src/config.js
  - src/config-file.js
  - src/frontmatter-schema.js
  - src/release-notes.js
  - .github/workflows/publish.yml
  - .github/actions/validate/action.yml
  - tests/verification.test.js
related:
  - README.md
  - VERIFICATION.md
  - RELEASE_CHECKLIST.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Governance Package Gate Review

This document records the default decisions for the `0.1.0` stable release line and the `1.0.0` stability milestone.

## Review Status

| Gate | Status | Decision |
| --- | --- | --- |
| Gate 2 Standard Model Approval | `accepted_for_0.1.0` | Keep the current frontmatter/status model; CLI-created or CLI-edited docs remain `needs_review` until human review. |
| Gate 3 CLI and Adapter Approval | `accepted_for_0.1.0` | Keep `doctor`, `validate`, `validate-frontmatter`, `audit`, `init --dry-run`, `init --write`, and `migrate --dry-run`. Adapter checks remain opt-in with `--agent`. |
| Gate 4 Migration Policy Approval | `accepted_for_0.1.0` | Keep `migrate --apply` blocked for the stable release. Regeneration is available through explicit `init --write --existing overwrite`. |
| Gate 5 Implementation Approval | `accepted_for_0.1.0` | Ship `@dowonk-7949/llm-wiki-standard@0.1.0` as the first stable npmjs release candidate. |
| Gate 6 Autofix (`--fix`) Scope Approval | `accepted_for_0.1.8` | Ship a scoped `llm-wiki fix` command (default preview, `--write` applies) limited to the safe remediations in "Autofix (`--fix`) Scope Decision" below. Content-bearing fixes never touch `verified` documents, and nothing outside `docs/llm-wiki/` is written. |
| Gate 7 1.0.0 Stability Approval | `accepted_for_1.0.0` | Promote the `0.1.8` contract to a stable `1.0.0` with no functional command changes. Declare the CLI command/option surface, `--format json` output shape, and required frontmatter contract stable; breaking changes to these now require a major version bump. See "1.0.0 Stability Milestone" below. |
| Gate 8 Migration Apply Scope Approval | `accepted_for_1.2.0` | Unblock `migrate --apply` for the `1.2.0` line under a pre-decided, preview-first, `verified`-preserving scope that reuses the accepted `fix` engine (Gate 6) plus `wiki_block_version` stamping. Revisits Gate 4's block for the `1.x` line. Accepted by Dowon-Kim on 2026-07-14; the rename map ships empty (`v1` is the only block version). See "Migration Apply Scope Decision" below. |
| Gate 9 Drift Downgrade Scope Approval | `accepted_for_1.2.0` | Add an opt-in `llm-wiki drift` command: report-only by default, `--downgrade` flips drifted `verified` documents to `needs_review` and refreshes `last_updated`, nothing else. It never promotes to `verified` and never edits other content. Accepted by Dowon-Kim on 2026-07-14. See "Drift Downgrade Scope Decision" below. |
| Gate 10 Domain Detection Scope Approval | `accepted` | Expand backend/fullstack `init` domain detection to cover BOTH directory-per-domain (`domains/domain/modules/features`) and file-per-domain route/resource modules (`endpoints/routers/routes/resources/controllers/handlers`), via a bounded, exclusion-guarded project scan tuned for near-zero false positives. Accepted by Dowon-Kim on 2026-07-14. See "Domain Detection Scope Decision" below. |
| Gate 11 MCP Tool Surface Scope Approval | `accepted_for_1.6.0` | Add a `llm-wiki mcp` command that runs a Model Context Protocol server over stdio, exposing only the READ-ONLY commands as MCP tools. Hand-rolled JSON-RPC 2.0 on Node built-ins (no third-party SDK), preserving the zero-runtime-dependency invariant. No write/mutating command is exposed; results reuse the 1.5 result shape (`schemaVersion`) as `structuredContent`. See "MCP Tool Surface Scope Decision" below. |
| Gate 12 CI/CD Adoption (GitHub Action + Release) Scope Approval | `accepted_for_1.7.0` | Add a composite GitHub Action (`.github/actions/validate/action.yml`) that wraps the read-only `validate` via `npx`, and a GitHub Release generated on `v*` tag push by an isolated `contents: write` job using the runner's built-in `gh` CLI (no third-party action). The release body comes from a new additive `release-notes --body-only` mode and is run through the sensitive-info scan before publish. Marketplace listing and floating-tag (`@v1`) versioning are DEFERRED behind a later gate that first deconflicts the `v*` npm-publish tag namespace and the `publish.yml` version-match guard. See "CI/CD Adoption Scope Decision" below. |
| Gate 13 Config Schema Growth Scope Approval | `accepted_for_1.8.0` | Grow the pre-reserved `llm-wiki.config.json` seam (unknown keys already ignored) with (1) per-project **rule toggles** backed by a single severity registry consolidated from `FINDING_EXPLANATIONS`, (2) **custom document sets**, and (3) **template overrides** that can NEVER set `status: verified` (hard guardrail). Additive/opt-in; the `1.0.0` command/`--format json`/frontmatter contracts stay unchanged and the zero-runtime-dependency invariant is preserved. Enabling prep (unify config loading across CLI/programmatic-API/MCP; scaffold a starter config + `doctor` echo) shipped as `1.7.2`. Accepted by Dowon-Kim on 2026-07-15; `1.8.0` ships the pre-work (severity-registry consolidation — audited behavior-preserving, 0 mismatches — plus the template-override guardrail) and per-project **rule toggles**, with **custom document sets** and **template overrides** following in `1.8.x`. See "Config Schema Growth Scope Decision" below. |
| Gate 14 Visibility Governance Scope Approval | `accepted_for_1.9.0` | Add opt-in visibility-consistency lints that reuse the sensitive-info scan: a `visibility: public` document that matches the scan, and a `contains_sensitive_info: false` document that matches it, are flagged. OFF BY DEFAULT, warning-level, read-only — enabled per project via the 1.8 config `rules` toggle; the rule can NEVER default to `error`/`blocked` (that would break the additive `1.0.0` invariant). It checks value-vs-content consistency only, not access control. Depends on the `docs/llm-wiki/VISIBILITY.md` policy doc. Accepted by Dowon-Kim on 2026-07-15. See "Visibility Governance Scope Decision" below. |
| Gate 15 Monorepo Profile Scope Approval | `accepted_for_1.10.0` | Add opt-in per-package wiki support: detect workspace packages (npm/yarn `workspaces` first; pnpm/YAML deferred to keep zero-dep) and run the already cwd-parameterized read pipeline (`audit`/`collectWikiGraph`/`findMissingDocs`) per package, aggregating under a strictly additive `packages[]` JSON field. Single-repo output stays byte-identical when there are no workspaces or the mode is off. Each package honors its own `llm-wiki.config.json` via the same `resolveOptions` merge. Additive/opt-in; `1.0.0` contracts and the zero-runtime-dependency invariant preserved. Accepted by Dowon-Kim on 2026-07-15. See "Monorepo Profile Scope Decision" below. |
| Gate 17 Mobile Profile Scope Approval | `accepted_for_1.12.0` | Add an additive `mobile` project type. Detect Android (`build.gradle`/`build.gradle.kts`/`settings.gradle` with an Android Gradle Plugin or AndroidX signal, `AndroidManifest.xml`), Flutter (`pubspec.yaml` with a `flutter:` section), Apple/iOS (`*.xcodeproj`/`*.xcworkspace`, `Podfile`, `Package.swift` targeting an Apple platform), and React Native (`package.json` `react-native` dependency), plus a mobile document set. Fixes today's misclassification of an Android `build.gradle` as `jvm`+`library` (`src/detector.js`). Additive/opt-in: a new detected type and profile docs only; `--type` gains an accepted value, existing detection is unchanged where no mobile signal is present; zero-dep preserved (manifest signals + bounded file checks, no build tools invoked). Accepted by Dowon-Kim on 2026-07-16. See "Mobile Profile Scope Decision" below. |
| Gate 18 Infra/DevOps Profile Scope Approval | `accepted_for_1.13.0` | Add an additive `infra` project type. Detect `Dockerfile`, Docker Compose (`docker-compose.y*ml`/`compose.y*ml`), Kubernetes manifests, Helm charts (`Chart.yaml`), and Terraform (`*.tf`), plus an infra/DevOps document set. Reuses the same bounded, exclusion-guarded detector pattern as Gate 17. Additive/opt-in; zero-dep (signal-file presence + bounded content sniff, no cluster/registry access). Accepted by Dowon-Kim on 2026-07-16. See "Infra/DevOps Profile Scope Decision" below. |
| Gate 19 Stdlib-Server Detection Scope Approval | `accepted_for_1.14.0` | Refine role inference so Go `net/http` and Python stdlib HTTP servers classify as `backend` instead of `library`, via a bounded, false-positive-guarded source scan (import + server-start call, not framework deps). The smallest of the three; the only risk is over-classification, so the heuristic stays conservative and additive (promotes `library`→`backend` only on a strong signal; never demotes). Zero-dep. Accepted by Dowon-Kim on 2026-07-16. See "Stdlib-Server Detection Scope Decision" below. |
| Gate 16 Cross-Repository Links Scope Approval | `accepted_for_1.11.0` | Add a conservative, NON-fetching cross-repo reference scheme (a reserved `repo:<name>/<path>` form, plus the already-recognized `http(s)://` URLs) recognized in `[[wiki links]]` and in `source_files`/`evidence`/`related`. Recognized references are treated as external — resolved (not flagged `wiki_link.missing`/`related.missing`/`source_files.missing`/`evidence.missing`/`markdown_link.missing`) but NEVER verified (verification would need network/git and break zero-dependency). Additive: local resolution is unchanged; only the reserved scheme is newly recognized. Accepted by Dowon-Kim on 2026-07-15. See "Cross-Repository Links Scope Decision" below. |
| Gate 20 Review Workflow Scope Approval | `accepted` | Add a read-only `review` command that supports the human review→`verified` step (the weakest, most manual part of the loop, and the governance core): list `needs_review` content docs risk-ranked (thin / no-evidence / broken-link / never-enriched first) with a per-doc quality + evidence summary for fast spot-checking. Promotion to `verified` (stamping `reviewed_by`/`reviewed_at`) happens ONLY on an explicit, per-doc/confirmed `--approve <path>…` (or `--approve-all` with a confirmation) — NEVER automatically; the review DECISION stays human, only the MECHANICS get cheap. Additive/opt-in, read-only by default, zero-dep; `1.0.0` contracts unchanged. Motivated by the first external end-to-end run (a backend dev enriched a full wiki; the maintainer then had no ergonomic way to review + bless the `needs_review` backlog). Accepted by Dowon-Kim on 2026-07-24 (in-session) with the recommended open-question answers (standalone `review` command; approval names docs, `--approve-all` gated behind an explicit `--yes` confirmation; `reviewed_by` sourced from explicit `--reviewer` → config `reviewer`/`reviewedBy` → git `user.name`, required if none resolvable — never stamped blank/fabricated). Independently flagged as the top functional gap by the external deep-analysis (2026-07-24). See "Review Workflow Scope Decision" below. |
| Gate 21 Skill Generation Scope Approval | `accepted_for_1.15.0` | Generate invocable, wiki-grounded automation prompts for the feature/fix/docs-sync workflows already encoded in `src/task-prompts.js`, in each agent's native shape — Claude skill (`.claude/skills/llm-wiki-<task>/SKILL.md`), Cursor rule (`.cursor/rules/llm-wiki-<task>.mdc`), and an agent-neutral prompt doc (`docs/llm-wiki/prompts/llm-wiki-<task>.prompt.md`, for Codex/others) — so a user can invoke `/llm-wiki-feature "…"` to run "read the wiki → ground the change → update docs (needs_review) → log", closing the value loop (#8). Each body embeds a generation-time snapshot of the project's domain map so the agent knows which docs to read. Opt-in (per `--agent`/`--skills`), preview-first, existing files never overwritten, recognize-don't-run, needs_review discipline embedded. Additive, zero-dep; `1.0.0` contracts unchanged. Accepted by Dowon-Kim on 2026-07-20 with two additions over the draft (domain-map injection + multi-agent formats). MINOR (`1.15.0`). See "Skill Generation Scope Decision" below. |
| Gate 22 Impact Measurement Scope Approval | `accepted` | Pull impact measurement to the FRONT of the post-1.16 line (before the feature gates). A reproducible, opt-in, zero-dep benchmark harness (repo-internal, e.g. `bench/`) runs a representative task with vs. without the governed wiki and records input tokens, source files opened, task success/quality, and wall-clock, plus an honest methodology that counts wiki read + maintenance cost (not just repo-scan tokens) and a recorded baseline. Primarily a VALIDATION track — no `1.0.0` contract change; any shipped `bench` helper is a later minor; zero-dep preserved. Results reported honestly INCLUDING unfavorable ones (an "overhead > benefit" result reshapes the roadmap, it is not hidden); no token/speed/productivity claim ships in README/launch until a measured result supports it. Re-run at each later gate for its delta. Motivated by the product-identity audit (`outputs/audits/product-identity-audit.md`): the governance core is real but the value chain is unproven. Accepted by Dowon-Kim on 2026-07-21. See "Impact Measurement Scope Decision" below. |
| Gate 23 Reverse-Impact (Changed-Source → Wiki) Scope Approval | `accepted_for_1.17.0` | Add a read-only reverse-impact check that builds a git-diff reverse index from every `verified` doc's `source_files`/`evidence` and flags a `verified` doc when its referenced code is in the current change set (working tree, or a `--since <ref>` PR/CI baseline) while the doc itself is NOT changed — the pre-merge, diff-anchored complement to the existing date-anchored `evidence.stale`. Defaults to warning (NEVER default error/blocked, preserving the additive `1.0.0` invariant); an opt-in `--strict` (for CI) escalates it to a failing error so a PR that changes governed code without updating its doc fails. Read-only, additive/opt-in, zero-dep — reuses `changedFiles` (`src/git.js`), `driftTargets`, and the reference parsers. Motivated by the product-identity audit's biggest vision-vs-reality gap: today drift is date-based and misses code + its doc changing in separate PRs, and cannot answer the pre-merge CI question. Accepted by Dowon-Kim on 2026-07-21 with: a standalone `impact` command, rule `impact.source_changed` (new toggleable `impact` category), `--strict` escalating impact findings ONLY (`evidence.stale` stays escalatable via config `rules`), and an empty change set treated as a no-op. **The default-warning clause in this row was SUPERSEDED on 2026-08-03 by decision 21** (default `error`, `--strict` a no-op for this rule, config-only ways back), and the change set gained one content-aware carve-out on 2026-08-04 (a `package.json` whose diff moves nothing but `version`); the row is left as the record of what was accepted for 1.17.0. See "Reverse-Impact (Changed-Source → Wiki) Scope Decision", "Detection Defaults and Freshness Scope Decision", and "Version-Only Manifest Scope Decision" below. |
| Gate 26 Agent Update Runner + Completion Contract Scope Approval | `accepted` | Make the wiki-grounded skill workflow (Gate 21) auditable end-to-end. When an agent runs a `/llm-wiki-<task>` skill to change code, have it emit a small structured **run manifest** (task, changed source files, touched wiki docs, whether the log was appended, whether `validate` ran + its result), and add a read-only **check** that verifies the claimed pipeline actually happened — so CI can catch a code change whose wiki update was skipped. The agent still writes the prose; only the PIPELINE becomes checkable. Proposed: a plain-JSON manifest under `.llm-wiki/runs/` (never carries sensitive values), a `manifest`-emitting seam in the generated skill bodies, and `llm-wiki check-run` (read-only: manifest's changed source ⊆ touched docs' `source_files`/`evidence` + log appended + validate pass) — or fold the check into `impact`/`validate` (open question). Complements Gate 23 `impact` (diff-anchored reverse index) with an INTENT-anchored record of what a run claims it did. Additive/opt-in/zero-dep; `1.0.0` contracts unchanged; never default error/blocked (opt-in `--strict` fails CI). Out of scope v1: enforcing prose correctness, auto-writing docs, non-skill/manual edits, a hosted run store. Accepted by Dowon-Kim (delegated, overnight autonomous run) on 2026-07-21 with the recommended answers (standalone `check-run`, agent-authored manifest, git-ignored `.llm-wiki/runs/`, file-level match reusing the reference parsers, kept separate from `impact`); BUILT (`check-run` + `run.*` findings + skill-body manifest contract) — ships in the next minor. See "Agent Update Runner + Completion Contract Scope Decision" below. |
| Gate 25 Evidence Semantic Tiers Scope Approval | `accepted` | Deepen evidence verification from FORMAT-only to MEANING — the product-identity audit's #1 remaining vision-vs-reality gap. Today `scanEvidenceReferences` checks a reference's shape + that the source FILE exists + (for `#L` line locators) the line range, but a `#symbol:`/`#section:`/`#route:` locator's TARGET existence is NEVER checked, and the frontmatter schema lets a `verified` doc carry `source_files: []` with no `evidence` at all (grounding-free "verified"). Gate 25 adds, all additive/opt-in/zero-dep/read-only and NEVER default error/blocked: (1) a conservative, language-agnostic EXISTENCE check for `symbol`/`section` locators that flags ONLY when the target token/heading does not appear in the referenced file (no false "missing" for a real target) — new toggleable `evidence.symbol_unverified`/`evidence.section_unverified` (default warning, `--strict` escalates); (2) an opt-in `evidence.ungrounded` rule for a `verified` doc with empty `source_files` AND no `evidence`; (3) a COMPUTED evidence tier (`reference_checked` vs `human_verified`) surfaced as ADDITIVE JSON only — never a new required frontmatter field or `status` enum value (both frozen at `1.0.0`). `route` existence and true AST/language-server symbol resolution stay OUT of scope v1 (framework/parser-specific, would break zero-dep). Accepted by Dowon-Kim (delegated) on 2026-07-21 with the recommended open-question answers (ungrounded default warning; section check `.md`-only; tier computed-only; `--strict` escalates `*_unverified` only); BUILT — ships in the next minor. See "Evidence Semantic Tiers Scope Decision" below. |
| Gate 24 Read-Only Retrieval (Search/Get) Scope Approval | `accepted_for_1.18.0` | Add read-only retrieval over the programmatic API + MCP (and CLI) that returns document CONTENT, not just governance reports: `list_docs` (enumerate with status/visibility/type filters), `search_docs` (zero-dep keyword/substring over titles + bodies + frontmatter — NOT semantic/vector search), `get_doc` (a doc's frontmatter + body by path), and `get_related` (a doc's resolved graph neighbors). Reuses `listWikiContentDocs`, the frontmatter parser, and `collectWikiGraph`; today every MCP/API tool returns governance REPORTS only, so this is the "the agent queries the wiki instead of re-deriving from the code" story that was walked back at launch. **The Gate 22 harness is RE-MEASURED here** — this is where the rediscovery/token delta should show (the headline is the before/after-retrieval delta). Read-only, additive/opt-in, zero-dep; honors `visibility` + reuses the sensitive-info scan so raw sensitive values are NEVER returned. No write/mutating surface (mirrors the MCP read-only ethos). `1.0.0` command/`--format json`/frontmatter contracts unchanged (new commands + new MCP tools + additive JSON only); likely a MINOR (`1.18.0`). Accepted by Dowon-Kim on 2026-07-21 (resolutions in the scope decision below). See "Read-Only Retrieval (Search/Get) Scope Decision" below. |
| Gate 27 Findings Message Localization (KO i18n) Scope Approval | `accepted` | Add opt-in Korean localization of human-facing findings PROSE — the finding `message` strings (~24, currently inline English templates) and the `FINDING_EXPLANATIONS` registry (47 entries: what/why/actions) rendered by `explain` — behind a new `--lang ko\|en` flag (default `en`) + config `lang`, resolved through the shared `applyProjectConfig`/`resolveOptions` seam (CLI/API/MCP consistent). Zero-dep message catalog (`src/i18n.js`) with a tiny `{param}` interpolator and EN fallback (missing KO → English, never blank). STABLE/English-frozen: rule IDs, all JSON keys + `--format json` SHAPE, category names, config keys, command/option names, evidence-locator syntax, the CLI command strings in `commands`/`related`, and file paths — only human prose localizes. `--format json` `message` DOES localize under explicit `--lang ko` (shape + `rule` key unchanged; consumers must key on `rule`); default `en` output stays byte-identical in every format. Report chrome (section headers, severity words) stays English in v1. Additive/opt-in/zero-dep; `1.0.0` command/`--format json`-shape/frontmatter contracts unchanged (new flag + new config key + additive localized strings only); EN-first (1.16) default preserved. Out of scope v1: languages beyond KO/EN, report-chrome/severity-word localization, generated doc/adapter/skill body + MCP-text localization, OS-locale auto-detect, `LLM_WIKI_LANG` env. Accepted by Dowon-Kim on 2026-07-22 (scope = finding messages + explain; JSON `message` localizes under `--lang ko`). MINOR. See "Findings Message Localization (KO i18n) Scope Decision" below. |

## 1.0.0 Stability Milestone

`1.0.0` is a stability declaration, not a feature release. It ships the exact command surface accepted through Gates 2–6 with no functional command changes, and commits to the following stable contract:

- **Command/option surface** — the public commands and their accepted options (`src/cli.js`) are stable. Removing or renaming a command or option, or changing its accepted values, is a breaking change requiring a major bump.
- **JSON output shape** — `--format json` field names and structure (`result`, `findings`, `findingSummary`, `wikiGraph`, `documentStatus`) are stable enough for CI and wrappers to depend on.
- **Required frontmatter contract** — the Tier A / Tier B required fields, `status` enum, and validation rules (`src/frontmatter-schema.js`, `rules/frontmatter.schema.json`) are stable.

Conservative-write guarantees are unchanged: `init` / `quickstart` / `fix` write only under `--write`, `migrate --apply` stays blocked, `log.md` and existing adapter files are never overwritten, and CLI- or agent-authored docs remain `needs_review`. Post-1.0 semantics follow SemVer: breaking contract changes bump major, additive commands/options bump minor, and fixes plus new warning-level rules bump patch (see `docs/llm-wiki/VERSIONING.md`).

## Stable Decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Release level | Publish as stable `0.1.0`. | The package has a small, explicit command surface and conservative write policy. |
| Distribution path | Publish through the public npm registry. | npm, npx, and yarn consumers can install without GitHub Packages authentication. |
| Existing docs | Keep by default; rewrite only with `--existing overwrite`. | Existing project knowledge should not be erased accidentally. |
| Uninitialized wiki | Report one confirmation-oriented warning when `docs/llm-wiki/index.md` is missing. | Agents should ask whether to proceed or initialize LLM-WIKI instead of flooding the user with document-level warnings. |
| Append-only log | Never overwrite `docs/llm-wiki/log.md`. | The log is historical evidence. |
| Adapter files | Never overwrite existing adapter files. | Teams often keep local tool policy there. |
| Antigravity | Keep `ANTIGRAVITY.md` as an info-level candidate. | The loading contract is still tool-dependent. |
| Migration apply | Keep blocked. | Automatic migration writes need a separate accepted scope. |
| Autofix (`fix`) | Ship as a scoped `fix` command (default preview, `--write` applies) limited to the accepted scope below. | Autofix writes are safe only when the exact set of touched fields, files, and refusals is pre-decided, mirroring the caution used for the still-blocked `migrate --apply`. |
| CI default | Use `llm-wiki validate`; add `--strict` when teams want warnings to fail. | This lets existing repositories adopt the standard incrementally. |

## Current Implementation Scope

Implemented commands:

- `llm-wiki doctor`
- `llm-wiki validate`
- `llm-wiki validate-frontmatter`
- `llm-wiki audit`
- `llm-wiki init --dry-run`
- `llm-wiki init --write`
- `llm-wiki migrate --dry-run`

Implemented safety behavior:

- `init` writes only when `--write` is explicit.
- Existing wiki docs are skipped unless `--existing overwrite` is explicit.
- A missing `docs/llm-wiki/index.md` is reported as one `structure.wiki_missing` finding before document-level checks run.
- `docs/llm-wiki/log.md` and existing adapter files are never overwritten.
- `--agent` opts into Codex, Claude Code, or Antigravity adapter checks.
- `--agent all` expands to Codex, Claude Code, and Antigravity.
- Markdown and reports are written as UTF-8.
- Sensitive-looking raw values are redacted from findings and blocked before report writes.

## Autofix (`--fix`) Scope Decision

Accepted for the `0.1.8` line. `llm-wiki fix` applies only the safest, mechanically decidable remediations. It follows the same conservative model as the blocked `migrate --apply`: the exact set of touched fields, created files, and refusals is fixed in advance, and anything requiring real project knowledge is reported, never invented.

### Command surface

- `llm-wiki fix` — preview only (dry run). Lists planned fixes and skips; writes nothing.
- `llm-wiki fix --write` — applies the planned fixes.
- `--dry-run` is accepted as an explicit alias of the default preview. `--dry-run` and `--write` cannot be combined.

### May change (only under `docs/llm-wiki/`, only on non-`verified` documents)

| Finding | Autofix action |
| --- | --- |
| `frontmatter.required` (Tier A fields only) | Insert the missing required field with a safe mechanical default. |
| `evidence.section_missing` | Append a body `## Evidence` section whose bullets echo the existing frontmatter `evidence` entries. |
| `evidence.section_empty` | Add bullets to the empty `## Evidence` section (frontmatter `evidence` entries, or one placeholder bullet if none exist). |
| `evidence.section_unlisted` | Append the missing frontmatter `evidence` entries as bullets to the existing `## Evidence` section. |
| `related.missing` / `markdown_link.missing` | Create a `needs_review` stub at the broken target (see stub conditions). |
| `last_updated` freshness | Refresh `last_updated` to the current date, **only on documents this run actually modifies** (never a blanket touch). |

**Tier A required fields (auto-filled with mechanical defaults):** `status`=`needs_review`, `visibility`=`internal`, `contains_sensitive_info`=`false`, `wiki_block_version`=`v1`, `last_updated`=today, `last_edited_by`=`llm-wiki-cli`, and empty lists for `tags`, `source_files`, `related`.

**Broken-link stub conditions:** a stub is created only when the target is inside `docs/llm-wiki/`, ends in `.md`, does not already exist, and is neither `log.md` nor an adapter file. The stub carries valid `needs_review` frontmatter with an empty evidence set and a title derived from the filename. Creating a stub is a new-file write; it never edits the referencing document.

### Must not change (reported only, never auto-fixed)

- **Tier B meaning-bearing required fields** — `title`, `doc_type`, `project`, `author`. These cannot be filled truthfully by a tool, so a missing one is reported for a human.
- **`source_files` / `evidence` reference values** — `source_files.missing`, `evidence.missing`, `evidence.line_range`, `evidence.shape`. A wrong or missing path is a real problem a human must resolve; the tool never invents or rewrites paths.
- **`content.not_enriched`** — enrichment requires real source-backed knowledge.
- **`evidence.stale` and document `status`** — `fix` never promotes to `verified` and never auto-downgrades `verified` → `needs_review`; automatic downgrade is deferred to the separate line/symbol drift work (ROADMAP Post-0.1.7 item 2). `verified` documents are skipped entirely for content edits.
- **Anything outside `docs/llm-wiki/`**, plus `docs/llm-wiki/log.md` (append-only) and adapter files.
- **Encoding/sensitive risks** — files with mojibake indicators are never rewritten, and any fix whose resulting content matches sensitive-info rules is blocked, mirroring `init --write`.

### Guarantees

- Idempotent: a second `fix --write` with no intervening changes writes nothing.
- All created or edited documents remain `needs_review`.
- UTF-8 read/write throughout; edits are minimal targeted insertions rather than full-document rewrites, since the frontmatter layer parses but does not re-serialize.

## Migration Apply Scope Decision (accepted for 1.2.0)

Accepted for the `1.2.0` line (Dowon-Kim, 2026-07-14). Gate 8 revisits
Gate 4: `migrate --apply` has been blocked since `0.1.0` because automatic
migration writes needed a separately accepted scope. This decision grants that
scope by **reusing the accepted `fix` engine** (Gate 6) under a
`wiki_block_version` upgrade framing. `migrate --apply` is unblocked for `1.2.0`
with the scope below, and Gate 4's block no longer applies to the `1.x` line.

`migrate` is the version-aware sibling of `fix`: it reports the contract gap
between each document's `wiki_block_version` and the CLI's current block version,
applies the same mechanical remediations `fix` is trusted with, and stamps a
document's `wiki_block_version` to current only once that document has been
brought to the current contract. It never touches meaning-bearing values,
`verified` content, or document `status`.

### Command surface

- `llm-wiki migrate` / `migrate --dry-run` — preview only (unchanged). Shows the
  version-gap upgrade report and the planned mechanical changes; writes nothing.
- `llm-wiki migrate --apply` — applies the planned upgrade. Preview-first:
  `--dry-run` and `--apply` cannot be combined, mirroring `fix`.

### May change (only under `docs/llm-wiki/`, only on non-`verified` documents)

The write actions are exactly the accepted `fix` scope, plus one migrate-only
action (block-version stamping):

| Finding / gap | Migrate action |
| --- | --- |
| `frontmatter.required` (Tier A fields only) | Insert the missing required field with a safe mechanical default (same defaults as `fix`). |
| Renamed required field | Rename to the current contract name **only when a rename mapping is defined for the document's `wiki_block_version`**. The rename map is empty today (`v1` is the only block version), so no rename occurs yet; the mechanism is forward-looking. |
| `evidence.section_missing` / `section_empty` / `section_unlisted` | Reconcile the body `## Evidence` section from frontmatter `evidence` (same as `fix`). |
| `related.missing` / `markdown_link.missing` | Create a `needs_review` stub at the broken target (same stub conditions as `fix`). |
| `last_updated` freshness | Refresh `last_updated`, only on documents this run actually modifies. |
| `wiki_block_version` gap | Backfill when missing, and stamp to the current block version **as the final step, only once the document otherwise conforms to the current contract**. Stamping is what records "this document has been migrated." |

### Must not change (reported only, never auto-applied)

Identical to the `fix` refusals:

- Tier B meaning-bearing required fields (`title`, `doc_type`, `project`, `author`).
- `source_files` / `evidence` reference values — paths are never invented or rewritten.
- `content.not_enriched` — enrichment needs real source-backed knowledge.
- Document `status` — migrate never promotes to `verified` and never auto-downgrades
  `verified` → `needs_review`. `verified` documents are skipped entirely for content
  edits and are never stamped to a new block version. The opt-in drift downgrade is a
  separate, drift-triggered decision (ROADMAP 1.2 item 3), not part of migrate.
- Anything outside `docs/llm-wiki/`, plus `log.md` (append-only) and adapter files.
- Files with mojibake indicators, and any result matching sensitive-info rules (blocked),
  mirroring `fix` and `init --write`.

### Guarantees

- Idempotent: a second `migrate --apply` with no intervening changes writes nothing.
- All created or edited documents remain `needs_review`.
- A `verified` document is never stamped to a new `wiki_block_version`; its contract
  gap is reported for a human, because stamping would falsely assert the document
  matches the current contract without review.
- UTF-8 throughout; edits are minimal targeted insertions that reuse the `fix` engine's
  split/insert helpers (no frontmatter re-serialization).

## Drift Downgrade Scope Decision (accepted for 1.2.0)

Accepted for the `1.2.0` line (Dowon-Kim, 2026-07-14). `fix` (Gate 6) and
`migrate` (Gate 8) both refuse to change document `status`, so the opt-in
`verified → needs_review` auto-downgrade on drift gets its own isolated command.
Downgrading is safe in a way promotion is not: it moves a document toward
`needs_review` (more review, never less), so it never asserts verification a
human did not give. Promotion to `verified` stays human-only in every command.

### Command surface

- `llm-wiki drift` / `drift --dry-run` — report only. Lists the `evidence.stale`
  drift for `verified` documents (line/symbol aware) and what `--downgrade` would
  change. Writes nothing.
- `llm-wiki drift --downgrade` — opt-in write. For each `verified` document that
  has drifted, sets `status: verified` → `needs_review` and refreshes
  `last_updated`. Preview-first: `--dry-run` and `--downgrade` cannot be combined.

### May change (only under `docs/llm-wiki/`, only on drifted `verified` documents)

| Finding | Drift action |
| --- | --- |
| `evidence.stale` on a `verified` document | Set `status` to `needs_review` and refresh `last_updated` to today. |

### Must not change (reported only, never auto-applied)

- Documents without an `evidence.stale` finding — untouched.
- Non-`verified` documents — nothing to downgrade.
- Any content beyond the `status` line and `last_updated`: body, `reviewed_at`,
  `reviewed_by`, `source_files`, `evidence`, and every other field are left as-is.
- Promotion to `verified` — never, in any command.
- Anything outside `docs/llm-wiki/`, plus `log.md` and adapter files.
- Files with mojibake indicators, and any result matching sensitive-info rules
  (blocked), mirroring `fix`.

### Guarantees

- Idempotent: a second `drift --downgrade` finds nothing to downgrade, because the
  first run already moved the drifted documents to `needs_review`.
- Downgraded documents become `needs_review`, consistent with the rule that CLI- or
  agent-authored edits stay `needs_review` until a human re-verifies.
- UTF-8 throughout; edits are minimal targeted scalar replacements that reuse the
  `fix` engine's split/replace helpers (no frontmatter re-serialization).

## Domain Detection Scope Decision (accepted)

Accepted (Dowon-Kim, 2026-07-14). The `1.3` domain split created a per-domain
document only from directory-per-domain layouts. Real usage surfaced backends
(e.g. FastAPI `app/api/api_v2/endpoints/item.py`) whose domains are **module
files**, not folders — those produced only `00_overview`. This decision expands
detection to cover both, boundary-based only (no route parsing, no class/name
inference, no LLM, no invented business meaning), tuned so false positives stay
near zero even if the scan takes longer.

### What counts as a domain

- **Directory domain** — an immediate subdirectory of a directory whose basename
  is `domains`, `domain`, `modules`, or `features`.
- **File domain** — an immediate source file of a directory whose basename is
  `endpoints`, `routers`, `routes`, `resources`, `controllers`, or `handlers`.
  Source extensions: `.py .js .ts .jsx .tsx .rb .go .java .kt .php .cs`.

The two are merged by normalized slug (a `customer/` folder and a `customer.py`
file collapse to one doc listing both paths in `source_files`), sorted
deterministically, and ordinal-numbered (`NN_<slug>.md`).

### Near-zero false-positive safeguards

- Bounded DFS from the project root (max depth 8); a matched domain parent is
  collected and then PRUNED (its subtree is not re-scanned).
- Never descends into `node_modules`, `dist`, `build`, `out`, `target`, `bin`,
  `obj`, `venv`, `env`, `vendor`, `coverage`, `migrations`, `spec`, `docs`,
  `doc`, `examples`, `scripts`, the technical-name set (`common/shared/core/
  config/util/middleware/infrastructure/test/fixture`), or any hidden (`.`) /
  dunder (`__`) directory.
- File domains exclude aggregator/infra basenames (`index`, `main`, `app`,
  `server`, `base`, `router`, `route`, `routes`, `urls`, `deps`, `dependencies`,
  `schemas`, `models`, `types`, `helpers`, `constants`, `settings`, …), the
  technical-name set, `__init__`/dunder/hidden files, and `*.d.ts` / `*.test.*` /
  `*.spec.*`.

### Honest limits (reported only — fall back to `00_overview`, human/agent authors)

- Django per-app layouts, Java/Kotlin package trees, and domains defined only
  inside a single router file are not auto-detected.
- Only immediate children of a domain parent are taken (route modules nested
  deeper, e.g. `endpoints/item/routes.py`, are not split).
- For `fullstack`, a frontend `routes/` folder could be picked up as file
  domains; this is left to human review rather than adding route-framework
  heuristics.

### Unchanged guarantees

- Only for `backend`/`fullstack`, non-`--minimal` init. Preview under `--dry-run`,
  writes only under `--write`, `--existing skip` preserves existing docs, all
  generated docs stay `needs_review`, and `verified` is never auto-assigned.

## MCP Tool Surface Scope Decision (accepted for 1.6.0)

Accepted for the `1.6.0` line. `1.6` makes the wiki agent-native: `llm-wiki mcp`
runs a Model Context Protocol server over stdio so agents (Claude Code, Cursor,
other MCP clients) query and check the wiki as tools instead of shelling out.

### Decisions

- **Hand-rolled, zero-dependency.** MCP over stdio is newline-delimited JSON-RPC
  2.0; the implemented message set (`initialize`, `notifications/initialized`,
  `ping`, `tools/list`, `tools/call`) is small and stable. It is implemented with
  Node built-ins only — **no `@modelcontextprotocol/sdk`** — preserving the
  "no runtime third-party dependencies" invariant. Source: `src/mcp/`.
- **Read-only tool surface.** Exactly these commands are exposed as MCP tools:
  `validate`, `audit`, `next`, `status`, `doctor`, `stats`, `graph`, `explain`,
  `handoff`, `prompt`. **No write/mutating command** (`init`, `fix`, `migrate`,
  `drift`, `quickstart`) is exposed, and tools carry `annotations.readOnlyHint`.
  Agents can inspect the wiki over MCP but cannot change it.
- **Result shape reuse.** `tools/call` returns the command's result object as
  `structuredContent` (carrying the 1.5 `schemaVersion`, with `text` stripped)
  plus a human-readable text content block. A thrown command surfaces as
  `isError: true` (MCP convention), not a JSON-RPC protocol error.
- **Entry point.** A single new `llm-wiki mcp` command (no separate binary),
  special-cased as a long-running stdio server. `--cwd` sets the default project
  root for tool calls.

### Stable contract (new)

The MCP tool name set and the tool result shape (1.5 result + `schemaVersion`)
are stable for the `1.x` line; removing/renaming a tool or breaking the result
shape is a breaking change. Additive tools/fields follow the same SemVer policy
as the CLI.

### Honest limits (v1)

- `llm-wiki.config.json` defaults are NOT merged into MCP tool calls in v1
  (explicit arguments only); planned as a later enhancement.
- The pinned protocol version is `2025-06-18`; the server replies with the
  client's requested version only when supported, otherwise its pinned version.
- Batching is not supported (removed in the pinned protocol); an array message
  is answered with a single `-32600 Invalid Request`.

### Unchanged guarantees

- stdout is the protocol channel (JSON-RPC only); logs go to stderr. The server
  runs until stdin closes. No MCP tool writes files, and sensitive-info redaction
  in the result path is unchanged.

## CI/CD Adoption Scope Decision (accepted for 1.7.0)

Accepted for the `1.7.0` line (Dowon-Kim, 2026-07-15) as the lead of the split
"Team & org scale" plan (see `ROADMAP.md`, "Release Plan (1.7–1.11)"). `1.7` makes
the CLI cheap to adopt in CI/CD: a one-`uses:`-step GitHub Action wrapping the
read-only `validate`, and a GitHub Release generated on tag push. It is the only
feature from the original 1.7 bundle with no dependency on the other four and no
change to the invariant-bearing core scanner — it wraps existing commands and
extends packaging/CI only.

Drafted for human acceptance before any code (mirroring Gates 6/8/9/10) and accepted
as drafted; implementation follows under the scope below.

### Decisions

- **Composite action wraps read-only `validate`.** A new
  `.github/actions/validate/action.yml` with `runs.using: composite` maps inputs to
  a `npx @dowonk-7949/llm-wiki-standard@<version> validate` invocation using flags
  that already exist (`--strict`, `--profile`, `--changed`, `--cwd`, `--format`,
  `--out`). The action can only READ the repo; it exposes no write command and
  changes no `src/` behavior. `action.yml` is a repo artifact, NOT added to
  `package.json` `files` (it is not shipped on npm).
- **GitHub Release on `v*` tag push, `gh`-CLI-based, permission-isolated.** Extend
  `.github/workflows/publish.yml` with a SEPARATE job that declares job-level
  `permissions: { contents: write }` only (so it does not inherit the publish job's
  `id-token: write`). It creates the release with the runner's preinstalled `gh`
  CLI (`gh release create "$GITHUB_REF_NAME" …`). **No third-party release action**
  (e.g. `softprops/action-gh-release`) — the built-in `gh` CLI protects the
  zero-dependency ethos even for CI deps.
- **Release body source = new additive `release-notes --body-only`.** The body is
  generated deterministically from git commits + `package.json` version by a new
  additive mode on `release-notes` that emits ONLY the grouped change sections —
  stripping the LLM-WIKI frontmatter block, the H1 title, and the "review before
  publishing" scaffold line that `buildReleaseNotes` normally adds. The curated
  `docs/llm-wiki/releases/vX.Y.Z.md` docs stay human-facing wiki artifacts and are
  NOT the automated body (so the release never fails on a missing curated doc);
  maintainers may still edit the created release afterward.
- **Sensitive-info scan on the release body.** The commit-subject → release-body
  path runs `scanSensitiveInfo` (`src/sensitive-info.js`) before publish, mirroring
  the report-write path; a match blocks the release rather than leaking a secret in
  a commit subject to a public release. This closes a gap: `buildReleaseNotes` /
  `collectCommits` do not scan today.
- **Tag-namespace safety (v1).** The composite action is referenced by an exact
  `vX.Y.Z` tag or commit SHA in v1. No floating `@v1` major tag is created, because
  pushing a `v1` tag would fire `publish.yml`'s `on: push tags v*` and then FAIL its
  `tag === version` / `version !== p.version` guard (`publish.yml` line 34).

### May change (added — all additive)

| Area | Change |
| --- | --- |
| `.github/actions/validate/action.yml` | New composite action wrapping `npx … validate`. |
| `.github/workflows/publish.yml` | New isolated `contents: write` Release job (`gh release create`), gated on the same `v*` tag push, running after the existing publish job. |
| `src/release-notes.js` + `src/commands.js#releaseNotesCommand` | New additive `--body-only` (a.k.a. `--no-frontmatter`) mode emitting only the change sections. Default output is byte-identical. |
| `src/cli.js` | Register `--body-only` in `ALLOWED_OPTIONS["release-notes"]`, usage, and per-command help; add per-command `--format json` examples to `COMMAND_HELP`. |
| `README.md` / `README.ko.md` | A `uses:` snippet documenting the action. |
| `tests/*.test.js` | Cover `--body-only` (no frontmatter/scaffold, sections only) and the sensitive-info block on a planted secret. |

### Must not change (out of scope — deferred behind a later gate)

- **Marketplace listing and floating-tag (`@v1`) versioning.** Deferred; requires a
  dedicated gate that first deconflicts the `v*` npm-publish tag namespace and the
  `publish.yml` version-match guard, and decides the moving-major-tag convention.
- **The existing npm-publish job.** Its Trusted Publishing / OIDC path, its
  `id-token: write` + `contents: read` permissions, and its steps are unchanged; the
  Release job is additive and isolated.
- **The core scanner and command contracts.** `validate` semantics, the
  `--format json` shape, and the required frontmatter contract are untouched — the
  action only wraps existing `validate`; `--body-only` is additive.
- **No write command in the action.** The action runs read-only `validate` only;
  `init`/`fix`/`migrate`/`drift`/`quickstart` are never invoked by it.

### Guarantees

- The composite action can only READ (it wraps read-only `validate`); it cannot
  mutate the repository.
- The Release job holds `contents: write` only and cannot publish to npm; the
  npm-publish job holds `id-token: write` only and cannot create releases.
- The release body always passes the sensitive-info scan before publish; a match
  blocks the release (mirrors the report-write redaction guarantee).
- Zero runtime third-party dependencies preserved: `gh` is a runner built-in (not a
  package dep), and `release-notes --body-only` uses Node built-ins only.
- Additive/backward-compatible: `action.yml` + a new isolated job + one new
  `release-notes` option. Without `--body-only`, `release-notes` output is identical;
  the `1.0.0` command/option/JSON/frontmatter contract is unchanged.

### Honest limits (v1)

- The composite action pins the package via `npx …@<version>`; consumers pin the
  action by exact `vX.Y.Z` tag or SHA (no `@v1` convenience tag until the deferred
  Marketplace gate).
- `release-notes --body-only` is only as good as commit-subject hygiene (Conventional
  Commits grouping); curated release docs remain the place for hand-written prose.
- `action.yml` has no unit-test surface in `tests/*.test.js`; its verification is a
  self-invoking workflow run and/or an `actionlint` step (to be decided at build).

### Unchanged guarantees

- Preview-first, `--write`/`--apply`-gated writes; `log.md` and adapter files never
  overwritten; UTF-8 throughout; AI/CLI-authored docs stay `needs_review`. None of
  these are touched by an Action that only wraps read-only `validate`.

## Config Schema Growth Scope Decision (accepted for 1.8.0)

Accepted by Dowon-Kim on 2026-07-15 as the scope for the `1.8.0` line — the
config-schema-growth minor split out of the former monolithic "team & org scale" line (see
ROADMAP `1.8`). It is the hard dependency gate: both the monorepo profile (`1.10`,
per-package config) and visibility governance (`1.9`, a rule toggle) consume it, so its
shape is decided before either depends on it.

**Delivery (accepted incremental).** The enabling prep shipped as `1.7.2`. `1.8.0` ships the
pre-work (below) and per-project **rule toggles**; **custom document sets** and **template
overrides** follow in `1.8.x`. The severity-registry consolidation was audited on 2026-07-15:
every push-site severity already matches `FINDING_EXPLANATIONS.defaultSeverity` (0 mismatches),
so the consolidation is behavior-preserving; three `blocked` control findings
(`explain.unknown_rule`, `init.write_blocked`, `sensitive.release_body`) sit outside the
registry and stay non-toggleable.

### Enabling prep (shipped as 1.7.2)

`1.8` schema growth is deliberately pulled only AFTER a scaffolded config has produced
real-world usage to design against. Two additive patches land first:

1. **Unify config loading below the command layer.** Today `loadProjectConfig` /
   `mergeConfigIntoOptions` (`src/config-file.js`) run only on the CLI path
   (`src/cli.js#main`); the `1.5` programmatic API (`src/index.js`) and the `1.6` MCP
   surface never merge `llm-wiki.config.json`. Move the merge into the shared option
   resolution so all three surfaces compute the same effective options. Additive — it
   only starts honoring an already-documented file on two surfaces that ignored it; the
   `1.0.0` command/JSON/frontmatter contracts are unchanged.
2. **Scaffold a starter config + echo it.** `init` / `quickstart` write a minimal
   `llm-wiki.config.json` (additive, preview-first, `--write` only, never overwriting an
   existing file), and `doctor` echoes the effective merged config. This makes the gate's
   "real usage of the minimal config" precondition observable.

### In scope for 1.8.0

- **Per-project rule toggles.** A config key lets a project turn a finding rule off or
  change its severity. Backed by consolidating the currently per-`scan*`-inlined
  severities into `FINDING_EXPLANATIONS` as the single source of truth (each rule already
  carries a `defaultSeverity`), so a toggle resolves coherently everywhere. Toggles are
  opt-in and cannot silently relax CI without an explicit config entry.
- **Custom document sets.** A config key extends the core/profile required-doc lists
  (`src/config.js`) with project-specific required documents, checked by the same
  `structure.required_doc` machinery.
- **Template overrides.** A config key points at project-local templates for generated
  documents, with a hard guardrail: an override can NEVER set `status: verified` (only the
  human-review path may). Generated docs stay `needs_review`.
- Folds in a richer enrichment lint `content.thin_body` (warning-level) shipped as a
  toggleable rule, to dogfood the toggle machinery on a real rule.

### Pre-work (before the config keys)

- Consolidate inlined severities into the `FINDING_EXPLANATIONS` registry (single source
  of truth for rule → severity), so rule toggles are coherent. Behavior-preserving.
- Add the "template override can never produce `verified`" guardrail at the template layer
  before override support is exposed.

### Out of scope (deferred to later gates)

- Per-package config resolution (belongs to `1.10` monorepo profile).
- The actual visibility-enforcement rule behavior (`1.9`; `1.8` only provides the toggle
  mechanism it will use).
- Cross-repo reference config (`1.11`).

### Invariants

Additive and opt-in; the `1.0.0` command/option, `--format json`, and frontmatter
contracts are unchanged; zero runtime dependencies preserved; preview-first writes;
`verified` content is never produced by config. Unknown config keys stay ignored so older
files keep working.

## Visibility Governance Scope Decision (accepted for 1.9.0)

Accepted by Dowon-Kim on 2026-07-15 as the scope for `1.9` — visibility governance, the next
minor after the completed Gate 13 config-schema-growth line. It proves the 1.8 config
design on a real feature before the larger monorepo consumer (`1.10`) depends on it.
Blocked on (and shaped by) the `docs/llm-wiki/VISIBILITY.md` policy doc.

### In scope for 1.9.0

- Two opt-in consistency rules, both reusing the existing sensitive-info scan
  (`src/sensitive-info.js`):
  - `visibility.public_sensitive` — a `visibility: public` document whose content
    matches the sensitive-info scan (a public doc must not carry sensitive-looking
    values).
  - `visibility.declared_mismatch` — a `contains_sensitive_info: false` document
    whose content matches the scan (the declaration contradicts the content).
- Both are registered in `FINDING_EXPLANATIONS` (default warning) but INERT by
  default — like `content.thin_body`, they run only when enabled via config `rules`
  (e.g. `"visibility.public_sensitive": "warning"`). This dogfoods the 1.8 toggle
  machinery again.

### Invariants

- OFF by default; opt-in only via config `rules`. Read-only — no file is modified.
- The rules must NEVER default to `error`/`blocked`, preserving the additive `1.0.0`
  invariant; a project may escalate them via the toggle, but the shipped default is
  warning.
- Value-vs-content consistency only. Actual access control (who may read what) stays
  the responsibility of the repository/organization layer; the CLI never enforces it.
- The `sensitive.*` category itself stays non-toggleable (the 1.8 safety guard); the
  new `visibility.*` rules report the consistency issue without ever disabling secret
  detection.

### Out of scope (later gates)

- Access-control enforcement or per-role `restricted` boundaries (declaration-only
  today; revisit after real usage).
- Forcing a `doc_type` to a minimum visibility — only as an opt-in rule if pulled by
  real demand, never default-blocking.

### Evidence

- `docs/llm-wiki/VISIBILITY.md` — the policy this gate implements.
- `src/sensitive-info.js#symbol:scanSensitiveInfo` — the scan the new rules reuse.
- `src/config.js#symbol:VALID_VISIBILITIES` — the visibility value set.

## Monorepo Profile Scope Decision (accepted for 1.10.0)

Accepted by Dowon-Kim on 2026-07-15 as the scope for `1.10` — the monorepo profile, the next
minor after visibility governance (`1.9`). It reuses the config growth (`1.8`) and the
already cwd-parameterized read pipeline; it is the first feature that needs real
multi-package usage, so it lands opt-in and conservative.

### In scope for 1.10.0

- **Workspace detection** in `src/detector.js`: recognize npm/yarn `workspaces` (an
  array or `{ packages: [] }`) in the root `package.json` and expand them to a
  deterministic, deduped package list. pnpm / `pnpm-workspace.yaml` and other
  YAML-based workspaces are deferred (a YAML parser would break the zero-dependency
  invariant) — detection reports them as unsupported rather than guessing.
- **Per-package run**: an opt-in monorepo mode maps the existing cwd-parameterized
  commands (`audit`, `collectWikiGraph`, `findMissingDocs`, and the read commands
  that reuse them) over each detected package that has a `docs/llm-wiki/`, and
  aggregates the results.
- **Additive `packages[]` JSON**: the result carries a new top-level `packages[]`
  array (one entry per package: path plus that package's result/findings summary)
  and an aggregate roll-up. Existing single-repo fields are untouched.
- A monorepo test fixture under `tests/fixtures/` exercising an npm/yarn workspaces
  layout.

### Invariants

- Opt-in and additive: single-repo behavior and JSON shape stay byte-identical; the
  `packages[]` field appears only in monorepo mode / when workspaces are present.
- Zero runtime dependencies preserved — npm/yarn `workspaces` are already JSON; no
  YAML or glob library is added (only a small built-in glob-to-path expansion over
  `node:fs`).
- Read-only aggregation reuses the existing pipeline; no new write surface across
  packages (single-package writes only).
- Each package honors its own `llm-wiki.config.json` (`rules`/`requiredDocs`/
  `templates`) through the same `resolveOptions` merge.

### Out of scope (later gates)

- pnpm / YAML workspace parsing (deferred until a zero-dep approach is decided).
- Cross-package / cross-repo knowledge links — that is `1.11`.
- Any multi-package write/init in one shot.

### Evidence

- `src/detector.js#symbol:detectProject` — where workspace detection lands.
- `src/commands.js#symbol:audit` — the cwd-parameterized pipeline mapped per package.
- `src/commands.js#symbol:collectWikiGraph` — per-package graph, aggregated.

## Cross-Repository Links Scope Decision (accepted for 1.11.0)

Accepted by Dowon-Kim on 2026-07-15 as the scope for `1.11` — cross-repository knowledge
links, the last planned minor. It is the most design- and feedback-heavy feature, so
it lands conservative and non-fetching, after monorepo (`1.10`) put the CLI in front
of multi-package usage.

### In scope for 1.11.0

- **A reserved cross-repo reference scheme** — a `repo:<name>/<path>` form (and the
  already-recognized `http(s)://` URLs) usable in `[[wiki links]]` and in the
  `source_files` / `evidence` / `related` frontmatter.
- **Recognize-don't-verify**: the external-reference classifier
  (`isExternalSourceReference`) and the `[[..]]` resolver recognize the scheme and
  SKIP the missing-target rules for it (`wiki_link.missing`, `related.missing`,
  `source_files.missing`, `evidence.missing`, `markdown_link.missing`), so cross-repo
  references stop emitting false positives. The reference is never fetched, resolved
  over the network, or git-checked — recognition only.
- **Ready-now slice**: harden the classifier so URL-like and scheme-prefixed `[[..]]`
  links stop emitting false `wiki_link.missing` even before the full scheme is adopted.

### Invariants

- Additive: local (in-repo) resolution stays byte-identical; only the reserved scheme
  is newly recognized as external. Existing `http(s)`/anchor handling is unchanged.
- NEVER fetch or verify — no network, no git, no new dependency (zero-dep preserved).
  A cross-repo reference is recognized as intentional, not validated.
- Read-only; no new write surface.

### Out of scope (beyond 1.x)

- Actually following/resolving cross-repo references (would need network/git — a
  future major, if ever).
- A cross-repo aggregated graph spanning separate repositories.

### Evidence

- `src/commands.js#symbol:isExternalSourceReference` — the classifier extended for the
  reserved scheme.
- `src/commands.js` — the `[[..]]` wiki-link resolver (`wiki_link.missing`) that
  recognizes the scheme so cross-repo links are not flagged.

## Mobile Profile Scope Decision (accepted for 1.12.0)

**Shipped in 1.12.0.** Accepted by Dowon-Kim on 2026-07-16 as the scope for `1.12` — a mobile project profile,
first of the post-`1.11` "detect & adapt breadth" line (the successor theme to `1.3`'s
PHP/Ruby/.NET breadth). It leads because it also fixes a concrete misclassification: an
Android `build.gradle` project is detected today as `jvm` with role `library`
(`src/detector.js`), and Flutter / iOS / React Native are not detected as mobile at all.

### In scope for 1.12.0

- **A new additive `mobile` project type**, detected from manifest signals:
  - **Android** — `build.gradle`/`build.gradle.kts`/`settings.gradle` carrying an Android
    Gradle Plugin (`com.android.application`/`com.android.library`) or AndroidX signal, or
    an `AndroidManifest.xml`.
  - **Flutter** — `pubspec.yaml` with a `flutter:` section (Dart-only `pubspec.yaml` stays
    `library`).
  - **Apple/iOS** — `*.xcodeproj`/`*.xcworkspace`, a `Podfile`, or a `Package.swift`
    targeting an Apple platform.
  - **React Native** — a `package.json` with a `react-native` dependency (recognized
    alongside the existing Node signal).
- **A mobile document set** (profile docs under the same `PROFILE_DOCS` mechanism as
  backend/fullstack/library), created by `init --write` and validated like any other
  profile.
- **Ordered first** of the three profile/detection minors (`1.12` → `1.13` infra →
  `1.14` stdlib-server), one minor at a time per the roadmap's own rule.

### Invariants

- Additive/opt-in: `--type` gains `mobile` as an accepted value (existing values keep
  working); auto-detection output changes only for inputs that carry a mobile signal.
  Repos with no mobile signal are byte-identical.
- Detection uses manifest/file signals and a bounded, exclusion-guarded scan (same
  discipline as Gate 10 domain detection); no build tool (Gradle/Xcode/CocoaPods) is ever
  invoked. Zero-runtime-dependency preserved.
- The `1.0.0` command/`--format json`/frontmatter contracts are unchanged; this is an
  additive detector + profile doc set (the pattern `1.3` established).
- CLI-created docs stay `needs_review`; conservative-write (`--write` only) unchanged.

### Out of scope

- Parsing app build graphs, variants/flavors, or dependency trees.
- Platform-specific lint beyond project-type detection and the profile doc set.

### Evidence

- `src/detector.js#symbol:detectEcosystems` — where `build.gradle` is currently mapped to
  `jvm`+`library` (the misclassification this gate corrects) and where mobile signals are
  added.
- `src/config.js#symbol:PROFILE_DOCS` — the profile document-set mechanism the mobile doc
  set plugs into.

## Infra/DevOps Profile Scope Decision (accepted for 1.13.0)

**Shipped in 1.13.0.** Accepted by Dowon-Kim on 2026-07-16 as the scope for `1.13` — an infrastructure/DevOps
project profile, the second of the breadth line. It reuses the exact bounded-detector
pattern accepted for Gate 17, so it lands after mobile. An important precedence rule keeps
it additive: `infra` is a **fallback** type, chosen only when no app signal (frontend/
backend/library/mobile) is present, so a containerized app repo (a backend with a
`Dockerfile`) stays its app type and existing outputs are byte-identical.

### In scope for 1.13.0

- **A new additive `infra` project type**, detected from signal files: `Dockerfile`,
  Docker Compose (`docker-compose.y*ml`/`compose.y*ml`), Kubernetes manifests, Helm charts
  (`Chart.yaml` with a Helm shape), and Terraform (`*.tf`).
- **An infra/DevOps document set** (runbook/architecture/ownership-oriented docs) via the
  same `PROFILE_DOCS` mechanism.

### Invariants

- Additive/opt-in: `--type` gains `infra`; repos with no infra signal are byte-identical.
- Zero-dep: detection is signal-file presence plus a bounded content sniff; no cluster,
  registry, or `terraform`/`kubectl`/`helm` invocation.
- `1.0.0` contracts unchanged; CLI-created docs stay `needs_review`.

### Out of scope

- Parsing/validating manifests semantically, or any live infrastructure access.

### Evidence

- `src/detector.js#symbol:detectEcosystems` — where infra signal files are recognized.
- `src/config.js#symbol:PROFILE_DOCS` — the infra doc set.

## Stdlib-Server Detection Scope Decision (accepted for 1.14.0)

**Shipped in 1.14.0 — completes the 1.12–1.14 detect & adapt breadth line.** Accepted by Dowon-Kim on 2026-07-16 as the scope for `1.14` — promoting the long-standing
"stdlib-server detection" backlog item (deferred from `1.3`) into a shipped minor. It is
the smallest of the three and lands last; its only real risk is over-classification, so the
heuristic stays strictly conservative.

### In scope for 1.14.0

- **Refined role inference**: classify Go `net/http` and Python stdlib HTTP servers as
  `backend` instead of `library`, via a bounded, false-positive-guarded source scan
  (an HTTP import **plus** a server-start call such as `http.ListenAndServe` /
  `http.server`/`socketserver` usage), not a framework dependency.

### Invariants

- Additive and one-directional: the signal only promotes `library`→`backend`; it never
  demotes an existing `backend` classification and never fires without a strong
  import+start-call pair.
- Bounded, exclusion-guarded scan (Gate 10 discipline); zero-dep.
- `1.0.0` contracts unchanged.

### Out of scope

- Framework-grade routing analysis or classifying arbitrary custom servers.

### Evidence

- `src/detector.js#symbol:detectEcosystems` — the Go/Python role heuristic extended with a
  guarded stdlib-server source signal.

## Review Workflow Scope Decision (accepted — shipped in 1.26.0)

**DRAFTED 2026-07-20; ACCEPTED by Dowon-Kim on 2026-07-24 (in-session), with the
recommended open-question answers resolved below; SHIPPED in 1.26.0 on 2026-07-27
(CLI + frozen programmatic `commands` map full command, MCP LIST mode only).** The external third-party deep-analysis
of the public repo (2026-07-24) independently flagged the review/approval workflow as the
top functional gap, reinforcing the internal motivation. Motivated by the first successful
external end-to-end run: a backend developer ran the handoff prompt, enriched a full
wiki, and sent it back — at which point the maintainer had no ergonomic way to review
the `needs_review` backlog and promote the good docs to `verified`. Generation is now
proven; the review→verify step is the weakest, most manual part of the loop, and it is
the governance core of the tool ("make human verification cheap enough that people
actually do it"). This gate proposes a command that supports that step WITHOUT
weakening the human sign-off invariant.

### Proposed scope

- A new **read-only-by-default** `review` command that lists `needs_review` content
  documents **risk-ranked** — never-enriched (`content.not_enriched`) / thin body /
  missing `## Evidence` / broken related-or-markdown links first — each with a compact
  per-doc summary (title, `doc_type`, evidence coverage, drift/staleness, top findings)
  so a human can spot-check quickly instead of opening every file.
- An explicit promotion path: `review --approve <path>…` (and optionally
  `--approve-all` behind a confirmation) stamps ONLY `status: verified` +
  `reviewed_by` (from git `user.name` / config) + `reviewed_at` (today) on the named
  docs. It reuses the existing frontmatter-editing seam and touches nothing else.

### Invariants (non-negotiable)

- **NEVER auto-verify.** Promotion requires an explicit human action naming (or
  confirming) the docs; the tool never blesses a doc on its own. This preserves the
  Gate 2 model ("CLI-created/edited docs stay `needs_review` until human review").
- Refuses to promote a doc that still has blocking/structural problems (e.g.
  `frontmatter.required`, sensitive-info) — approval covers content judgment, not a
  bypass of hard failures.
- Never edits body content, `source_files`, `evidence`, or Tier B fields; only the
  status/review-metadata stamp, mirroring the `drift --downgrade` discipline in reverse.
- Additive/opt-in, read-only by default, zero-dep; `1.0.0` command/`--format json`/
  frontmatter contracts unchanged (new command + additive JSON only).

### Out of scope

- Any automated quality judgment that would substitute for human review.
- Multi-reviewer sign-off, approval history, or per-doc reviewer assignment (a possible
  later governance gate).

### Resolved at acceptance (2026-07-24)

- **Command name/shape:** a **standalone `review` command** (consistent with the other
  read-only governance commands `impact` / `check-run` / `drift`), not a `--approve` mode
  bolted onto an existing command.
- **`--approve-all`:** it exists but is gated behind an explicit **`--yes` confirmation**;
  without `--yes` it refuses and prints how many docs it WOULD promote. Default approval
  always names the docs (`review --approve <path>…`). No one-keystroke blanket bless.
- **`reviewed_by` sourcing (explicit wins):** an explicit `--reviewer <name>` flag →
  config (`llm-wiki.config.json` `reviewer`/`reviewedBy`) → git `user.name`. If none
  resolves the command **refuses to stamp** (a clear `review.reviewer_unresolved` error)
  rather than writing a blank or fabricated reviewer — honesty over convenience.
  `reviewed_at` = today (ISO date); `last_updated` (the content date) is left untouched.

### Evidence (planned, not yet implemented)

- Would reuse `src/commands/scans.js` (enrichment/thin-body/evidence findings),
  `src/commands/wiki-graph.js` (link health), and the frontmatter-stamping helpers in
  `src/commands/fix-migrate.js`; register a `review` entry in the CLI `COMMANDS` map and
  the frozen programmatic-API `commands` map.

## Skill Generation Scope Decision (accepted for 1.15.0)

**ACCEPTED_for_1.15.0 by Dowon-Kim on 2026-07-20**, with two scope additions over the
original draft (chosen at acceptance): **(1) inject the project's domain map from the
generated wiki into the artifact body**, and **(2) emit multi-agent formats (Claude
skill + Cursor rule + an agent-neutral prompt file for Codex/others), not just Claude.**
Motivated by the exposure tests: generation is proven, but a tester could not judge the
tool's value (#8) because they never actually USED the generated wiki for real work. The
tool already encodes the wiki-grounded feature/fix/docs-sync workflow
(`src/task-prompts.js`, surfaced by `prompt --task`); this gate packages that workflow as
an invocable, project-specific automation prompt so "use the wiki when you add or change
a feature" becomes a single `/llm-wiki-feature` invocation — closing the value loop.
Aligns with the prior "Layer 1 (thinnest wiki-grounded prompt tool)" and "distribute as a
Claude Code skill/plugin" direction notes. MINOR = `1.15.0` (a new artifact/opt-in
surface, not a patch).

### Accepted scope

- **Tasks (one artifact per task):** `feature`, `fix`, `docs-sync` — bodies reuse the
  existing `src/task-prompts.js` workflow text (read `docs/llm-wiki/index.md` → locate the
  relevant domain/API/architecture/workflow docs → inspect real source → plan → smallest
  safe change → update every affected wiki doc kept `needs_review` → append `log.md` → run
  tests → never promote to `verified`). The user supplies the concrete change description
  when they invoke it in their agent (not to the CLI).
- **Multi-agent formats (addition 1):** emit the workflow in each agent's native shape —
  - Claude Code: `.claude/skills/llm-wiki-<task>/SKILL.md` (skill; `name`/`description` frontmatter).
  - Cursor: `.cursor/rules/llm-wiki-<task>.mdc` (rule).
  - Agent-neutral (covers Codex and any other agent, which lack a per-command skill
    mechanism): `docs/llm-wiki/prompts/llm-wiki-<task>.prompt.md` (a copy-paste prompt doc,
    LLM-WIKI frontmatter, `needs_review`).
  Emitted per selected agent: `--agent claude` → skills, `--agent cursor` → rules; the
  agent-neutral prompt docs are always written (usable by Codex/others). A `--skills`
  flag (or `--agent all`) requests the set. Opt-in, preview-first.
- **Domain-map injection (addition 2):** each artifact body embeds a snapshot of the
  project's domain map built from the generated wiki (the `domains/*.md` titles + paths,
  via the existing domain/graph helpers), so the agent immediately knows which domain
  docs to read for a given change — project-specific, not a generic "go read the wiki".
  It is a SNAPSHOT at generation time (recognize-don't-run, not live); regenerate to
  refresh. When no domain docs exist yet, the body falls back to the generic pointer.

### Invariants (non-negotiable)

- **Recognize-don't-run**: the tool only WRITES the artifact; it never executes the
  workflow, calls an agent, or fetches anything. Execution is the agent's job.
- Additive/opt-in: nothing is created unless requested; **existing skill/rule/prompt files
  are never overwritten** (same guardrail as adapter files).
- The `needs_review` / never-auto-`verified` discipline (Gate 2) is embedded verbatim in
  every artifact body.
- Zero-dependency; `1.0.0` command/`--format json`/frontmatter contracts unchanged, and
  output is byte-identical when skills are not requested.

### Out of scope

- Executing the skill, calling agents, or any "change-request form → auto-implement →
  auto-deploy" platform behavior (that is a separate, larger product, not this CLI).
- Live/dynamic wiki-content injection beyond the generation-time domain-map snapshot.

### Resolved at acceptance

- Tasks = `feature` + `fix` + `docs-sync`; **one artifact per task** (not a single
  combined skill). Delivery = per selected agent (`--agent claude`/`cursor`) plus a
  `--skills` opt-in; agent-neutral prompt docs always emitted.

### Evidence (planned, not yet implemented)

- Reuse `src/task-prompts.js` (workflow bodies) + the adapter-generation pattern
  (`src/commands/adapters.js` `ADAPTER_TARGETS`/`writeAdapterFiles` + `templates/`) for
  emission, and the domain/graph helpers (`src/commands/domains.js` /
  `src/commands/wiki-graph.js`) for the injected domain-map snapshot.

### Extension (2026-07-23): bootstrap task + Codex native skills

Additive extension of Gate 21, same invariants (recognize-don't-run, never-overwrite,
opt-in, `needs_review`, zero-dep, byte-identical when not requested):

- **New task `bootstrap`** — a fourth skill/`prompt --task` covering the FIRST-time
  enrichment of an `init --write` skeleton (skeleton → code-grounded docs). Until now this
  was only the one-shot `handoff` prompt; `bootstrap` makes it a repeatable, consistent
  artifact. The initial-enrichment rules now live in a single source
  (`src/task-prompts.js#symbol:initialEnrichmentWorkflow`, `evidenceFocus`) that BOTH
  `handoff` and the `bootstrap` task reuse, so they cannot drift apart.
- **Codex native skill format** — emit `.agents/skills/llm-wiki-<task>/SKILL.md` (valid
  `name`/`description` frontmatter), Codex's native skill location. Selection is symmetric
  with the other agents: `--agent codex` emits the Codex format, `--skills` emits every
  native format (Claude + Codex + Cursor + neutral). Reuses the existing `.agents/skills/`
  path — no new `.codex/skills` location. The agent-neutral prompt still accompanies any
  emission.
- Surfaces kept in lockstep: `prompt --task` (CLI help + MCP `prompt` tool enum),
  `SKILL_TASKS`, README/PUBLIC_API/ARCHITECTURE/DOMAIN_FEATURES/EXAMPLES. 284 tests,
  `validate --strict` 0.

## Impact Measurement Scope Decision (accepted 2026-07-21)

**Motivation.** The product-identity audit (`outputs/audits/product-identity-audit.md`, Conditional Go) rates the governance core real and honestly named, but the value chain — durable memory → less rediscovery → fewer tokens / faster, safer work — is **unproven**; it lists benchmarking as the precondition for any efficiency/productivity claim. The launch copy already had to drop token-savings language for lack of evidence. So measurement is pulled to the FRONT of the post-1.16 line: build the harness and a baseline *before* the feature gates, so the roadmap is steered by numbers and every later gate is re-measured for its delta.

**Scope (in).**
- A reproducible, opt-in benchmark harness (zero-dep, repo-internal under e.g. `bench/`) that runs a representative task two ways — **without** the wiki and **with** the governed wiki — and records: input tokens, source files opened, task success/quality, and wall-clock.
- A documented methodology: task selection, what counts as "with wiki", token accounting that INCLUDES wiki read + maintenance cost (not just repo-scan tokens), and variance handling — so results are honest and re-runnable by a third party.
- A recorded baseline (under `bench/results/` and/or a `needs_review` doc under `docs/llm-wiki/`).
- Re-run hooks so each later gate (23 reverse-impact, 24 retrieval, …) reports its delta against the baseline.

**Scope (out) / invariants.**
- No shipped CLI/`--format json`/frontmatter contract change is required — this is primarily a validation track. Any shipped helper (e.g. a `bench` command) is DEFERRED to its own minor. The zero-runtime-dependency invariant is preserved.
- Results are reported honestly, **including unfavorable ones** — an "overhead > benefit" result is a finding that reshapes the roadmap, not something to hide. This is the governance/honesty brand applied to the product itself.
- No token/speed/productivity claim ships in README/launch until a measured result supports it.

**Caveat (sequencing).** The "reduced rediscovery" mechanism is only completed by retrieval (Gate 24); a baseline measured before it may be modest or even negative. That is expected and informative — the headline number is the **before/after-retrieval delta**, not the raw baseline.

**Acceptance criteria (proposed).**
- The harness runs green, is documented, and is reproducible by a third party.
- A baseline result exists and is linked from `ROADMAP.md`.
- The methodology explicitly accounts for wiki maintenance/read cost, not just repo-scan tokens.

Accepted by Dowon-Kim on 2026-07-21. Delivery: build the harness + baseline first (validation track); any shipped `bench` helper is a later minor.

## Reverse-Impact (Changed-Source → Wiki) Scope Decision (accepted for 1.17.0)

**Accepted by Dowon-Kim on 2026-07-21** (resolutions in "Resolved at acceptance" below). The product-identity audit
(`outputs/audits/product-identity-audit.md`) named this the biggest vision-vs-reality
gap: the tool promises docs that keep up with the code, but the only drift signal today
is DATE-anchored. `scanEvidenceDrift` (`src/commands/scans.js`) fires `evidence.stale`
when a referenced file has git history AFTER a doc's `reviewed_at`/`last_updated` date.
That misses the case that matters most in real workflows — code and its doc changing in
SEPARATE places/PRs — and it cannot answer the pre-merge question a CI check needs: "does
THIS diff touch code that a `verified` doc depends on, without touching that doc?" This
gate adds that diff-anchored, CI-native check as the complement to date-anchored
staleness. It is also where the Gate 22 harness is re-run for its delta.

### The distinction (why this is not the existing drift)

- **Date-anchored `evidence.stale` (exists, Gate 9):** "the referenced code has commit
  history newer than the doc's review date." History-anchored, always-on, reported by
  `audit`/`drift`.
- **Diff-anchored reverse-impact (this gate, new):** "the referenced code is IN THIS
  CHANGE SET (working tree, or `<ref>..HEAD` for a PR) while the doc is NOT." Anchored to
  a diff / commit range, not a calendar date — the pre-merge signal a CI gate enforces.

They are complementary; neither subsumes the other.

### Proposed scope

- A new **read-only** check that:
  1. Builds the change set with the existing `changedFiles(cwd, since)` (`src/git.js`):
     no `--since` = the working tree (uncommitted tracked + untracked — the pre-commit
     view); `--since <ref>` = `git diff --name-only <ref>` (a branch/SHA/merge-base — the
     PR/CI baseline). This reuses the exact semantics `validate --changed [--since]`
     already ships.
  2. Builds a reverse index from every `verified` doc's `source_files` + `evidence` to the
     source files they anchor (reusing the reference parsing in `driftTargets` /
     `src/commands/references.js`; external `http(s)`/`repo:` refs excluded, as today).
  3. Emits a finding (proposed rule `impact.source_changed`, a new toggleable `impact`
     category) for each `verified` doc whose anchored source ∈ the change set while the
     doc's OWN path ∉ the change set — if you edited the doc in the same diff, no finding.
- **Command shape (decided at acceptance):** a standalone `llm-wiki impact [--since <ref>]
  [--strict]`, OR a diff mode on the existing `drift` (`drift --since <ref>`). Both are
  read-only in this scope; the recommendation is the standalone `impact` command
  (single-responsibility, discoverable, and `drift`'s `--downgrade` write path stays out
  of the diff signal).
- **Strict-governance / CI enforcement:** the finding defaults to **warning** (never
  default error/blocked — preserves the additive `1.0.0` invariant). An opt-in `--strict`
  (mirroring `validate --strict`) escalates it to a failing error, so a PR that changes
  governed code without updating its doc fails CI.
  **SUPERSEDED 2026-08-03 by decision 21** ("Detection Defaults and Freshness Scope
  Decision", below): the default is now `error`, `--strict` is a no-op for this rule, and
  the ways back are config-only. The paragraph above is kept as the record of what Gate 23
  accepted in 1.17, not as a description of current behaviour. Whether a shared `strict-governance`
  posture should ALSO escalate the existing date-anchored `evidence.stale` is an open
  question below (the audit flagged that `evidence.stale` warning + composite-action
  `strict:false` lets drift pass CI today).

### Invariants (non-negotiable)

- **Read-only.** The check never writes; remediation stays human (re-review) or the
  existing `drift --downgrade`. No new write surface.
- **Additive/opt-in, default warning.** The `impact` rule can NEVER default to
  error/blocked; strictness is opt-in per run/CI. No new required frontmatter field.
  **SUPERSEDED 2026-08-03 by decision 21**, which deliberately broke this invariant and
  shipped the exit-code change as a documented breaking change with two config-only ways
  back. Recorded rather than rewritten: the invariant was real when Gate 23 was accepted,
  and the decision to drop it is the thing worth being able to find later.
- **Zero-dependency, best-effort git.** Reuses `changedFiles`/`driftTargets`; no repo (or
  git unavailable) degrades to a single `impact.unavailable` finding, mirroring
  `changed.unavailable` — never a crash.
- `1.0.0` command / `--format json` / frontmatter contracts unchanged (a new command +
  additive finding category + additive JSON only); zero-dep preserved.

### Out of scope (v1)

- **Line-level precision.** v1 is file-level (does the changed file back the doc). The
  change set from `git diff --name-only` is file-granular; mapping a diff to the exact
  cited line ranges (so an edit far from the cited lines is not impact) needs hunk parsing
  and is deferred (honest limit — date-anchored drift already narrows to line ranges via
  `git log -L`).
- **A per-doc `reviewed_sha` anchor.** Pinning each doc to the commit it was verified
  against (diffing `reviewed_sha..HEAD` per doc — more precise than a global `--since`)
  needs an OPTIONAL new frontmatter field plus a verify/approve step to stamp it, which
  does not exist yet (Gate 20 `review` is unaccepted). Deferred; if added later it is an
  OPTIONAL additive field, never required.
- **Any write / auto-downgrade in this command** (kept in `drift`), and **MCP exposure**
  (optional later, matching `drift`'s current non-exposure).

### Resolved at acceptance (Dowon-Kim, 2026-07-21)

- **Command shape:** a standalone `llm-wiki impact [--since <ref>] [--strict]` command
  (single-responsibility, discoverable; `drift`'s `--downgrade` write path stays out of
  the diff signal), NOT a `drift --since` mode.
- **Finding rule:** `impact.source_changed` under a new toggleable `impact` category
  (default warning), plus `impact.unavailable` (error) when git is unavailable — mirroring
  `changed.unavailable`.
- **Strict scope:** `--strict` escalates the `impact.*` findings ONLY. The existing
  date-anchored `evidence.stale` is deliberately NOT bundled here; it is already
  escalatable per project via the 1.8 config `rules` toggle
  (`"evidence.stale": "error"` + `validate --strict`), so no separate strict-governance
  preset is introduced in this gate (keeps the surface minimal and additive).
- **Empty change set:** when neither `--since` nor a dirty working tree yields changed
  files, the result is a no-op (no findings, `pass`).

### Evidence (planned, not yet implemented)

- `src/git.js#symbol:changedFiles` — the change-set primitive (working-tree / `--since <ref>`), already used by `validate --changed`.
- `src/commands/scans.js#symbol:driftTargets` — the `verified`-doc → source/evidence anchor extractor to reuse for the reverse index (generalized to not require a date baseline).
- `src/commands/scans.js#symbol:scanEvidenceDrift` — the date-anchored sibling this gate complements.
- `src/commands/references.js#symbol:parseEvidenceReference` — evidence locator parsing; `isExternalSourceReference` to exclude external/cross-repo refs.
- `src/commands/findings.js#symbol:applyRuleConfig` — where the new `impact` category plugs into rule toggles/severity.

## Read-Only Retrieval (Search/Get) Scope Decision (accepted for 1.18.0)

**Accepted by Dowon-Kim on 2026-07-21** (resolutions in "Resolved at acceptance" below).
This is the post-1.16 measure-first line's Gate 24 (ROADMAP: measurement → reverse-impact → retrieval). The
product-identity audit (`outputs/audits/product-identity-audit.md`) required walking back
a launch claim: the "the agent QUERIES the wiki" / "project memory" story is not true
today, because every command and every MCP tool returns a governance REPORT
(validate/audit/stats/graph/next/status/doctor/explain/handoff/prompt — see
`src/mcp/tools.js`), never a document's actual content. An agent still cannot ask the wiki
"what do we already know about X?" and get the relevant doc bodies back. This gate adds
that read-only retrieval surface — and it is where the Gate 22 harness is re-run for the
headline **before/after-retrieval delta** (the mechanism that is supposed to reduce
rediscovery / tokens).

### The distinction (why this is not the existing tools)

- **Governance reports (exist, 1.5/1.6):** validate/audit/stats/graph/… answer "is the
  wiki healthy / contract-valid?" and return findings + summaries. They never return doc
  bodies.
- **Retrieval (this gate, new):** answer "what does the wiki SAY about X, and where?" and
  return document content (frontmatter + body) and resolved relations, with
  status/visibility filters. Reading, not governing.

### Proposed scope — four read-only operations

- **`list_docs`** — enumerate content docs (reuse `listWikiContentDocs`) with optional
  `status` (needs_review/verified), `visibility`, `doc_type`, and path-prefix filters;
  returns a lightweight index (path + key frontmatter), not bodies.
- **`search_docs`** — **zero-dep keyword/substring** match over titles, bodies, and
  frontmatter, ranked by a simple deterministic score (title/heading hits weighted). This
  is explicitly NOT semantic/vector search (that would need an embedding model / index and
  break zero-dep) — honestly named to avoid repeating the walked-back "semantic" claim.
  Returns matches with a short surrounding snippet per hit.
- **`get_doc`** — return one doc's parsed frontmatter + body by path.
- **`get_related`** — return a doc's resolved graph neighbors (wiki-link / `related` /
  markdown-link edges) by reusing `collectWikiGraph`; the "follow the memory graph" step
  after a search hit.

Surfaces: the programmatic API (`src/index.js` `commands`, extending the frozen 1:1 map
additively), new **read-only MCP tools** (`src/mcp/tools.js` `TOOL_DEFS`), and CLI
equivalents. Results reuse the 1.5 result shape (`schemaVersion`) as MCP
`structuredContent`.

### Invariants (non-negotiable)

- **Read-only.** No write/mutating surface; nothing is created, edited, or downgraded. The
  MCP server continues to expose read-only tools only.
- **Honors visibility + sensitive-info.** Reuses the existing sensitive-info scan so raw
  sensitive values are NEVER returned in bodies/snippets (redacted, mirroring the report
  surfaces); `visibility` is a first-class filter, and restricted/sensitive content is
  gated by default rather than leaked through search.
- **Zero-dependency.** Keyword/substring + the existing graph only — no embeddings, no
  external index, no network. Best-effort on a missing/empty wiki (returns empty results,
  never a crash).
- **Additive.** `1.0.0` command / `--format json` / frontmatter contracts unchanged (new
  commands + new MCP tools + additive JSON only); no new required frontmatter field.

### Out of scope (v1)

- **Semantic / vector / embedding search** (needs a model or index; breaks zero-dep). Only
  deterministic keyword/substring ranking ships. The name stays "keyword search," never
  "semantic."
- **Any write-back, ranking-by-freshness beyond a simple deterministic score, cross-repo
  fetch** (`repo:` refs stay recognize-don't-verify), and **fuzzy/typo-tolerant matching**.
- **Caching / a persistent index** — each call reads the wiki fresh (bounded; the wiki is
  small). An index is a later optimization if measurement shows it matters.

### Resolved at acceptance (Dowon-Kim, 2026-07-21)

- **Names & surfaces:** ship `list_docs` / `search_docs` / `get_doc` / `get_related` as
  named, on all three surfaces (programmatic API + MCP tools + CLI), mirroring how existing
  commands span CLI/API/MCP. No shorter aliases.
- **Restricted/sensitive docs:** EXCLUDED by default from `list_docs`/`search_docs`, with an
  opt-in include flag; `get_doc` on such a path still redacts raw sensitive values via the
  sensitive-info scan. Safest default, matches the conservative ethos.
- **Result bodies:** `search_docs` returns ranked matches + a short snippet per hit by
  default (full bodies via an opt-in flag or a follow-up `get_doc`); `get_doc` returns the
  full frontmatter + body. The snippet-vs-body default is revisited with the Gate 22
  re-measurement.
- **Keyword only:** deterministic keyword/substring ranking; NO semantic/vector search
  (would break zero-dep). The surface is named "keyword search," never "semantic."

### Shipped in 1.18.0

Delivered in `src/commands/retrieval.js` (four handlers `listDocsCommand`/`searchDocsCommand`/`getDocCommand`/`getRelatedCommand`), wired to the programmatic API (`src/index.js` frozen `commands` map, kebab keys `list-docs`/`search-docs`/`get-doc`/`get-related`), the CLI (`src/cli.js` COMMANDS + `--status`/`--visibility`/`--doc-type`/`--include-sensitive`/`--limit` options + `<query>`/`<path>` positionals), and MCP (`src/mcp/tools.js` TOOL_DEFS `list_docs`/`search_docs`/`get_doc`/`get_related`). All resolutions above shipped as decided: keyword-only (no semantic), restricted/sensitive excluded from list/search by default with opt-in `--include-sensitive`, `get-doc` redacts raw sensitive values, snippets by default. New `retrieval.not_found` (error) finding for a missing `get-doc`/`get-related` path. Read-only; additive; zero-dep. Re-measure Gate 22 here for the headline before/after-retrieval delta.

### Evidence (shipped)

- `src/commands/retrieval.js#symbol:searchDocsCommand` — keyword/substring search (AND, deterministic ranking, redacted snippets; excludes restricted/sensitive unless opted in).
- `src/commands/retrieval.js#symbol:getDocCommand` — frontmatter + body by path (flexible path resolution; sensitive lines redacted; `retrieval.not_found` when missing).
- `src/commands/wiki-files.js#symbol:listWikiContentDocs` — content-doc enumeration backing `list-docs`/`search-docs`.
- `src/commands/wiki-graph.js#symbol:collectWikiGraph` — resolved doc→doc edges backing `get-related`.
- `src/frontmatter.js#symbol:parseFrontmatter` — frontmatter parsing for filters (status/visibility/doc_type) and `get-doc`.
- `src/sensitive-info.js#symbol:scanSensitiveInfo` — reused so retrieved bodies/snippets never leak raw sensitive values, and to gate restricted/sensitive docs.
- `src/mcp/tools.js#symbol:TOOL_DEFS` — the read-only retrieval tools plug in here (snake_case names).
- `src/index.js#symbol:commands` — the frozen programmatic API map the new commands extend additively.

## Evidence Semantic Tiers Scope Decision (accepted 2026-07-21 — built)

### Why (the gap, confirmed in current code)

The product-identity audit's sharpest finding is that the tool's "code-grounded, verified"
promise is enforced only at the FORMAT level:

- `src/commands/scans.js#symbol:scanEvidenceReferences` parses each `evidence` string, then
  checks (a) the reference SHAPE (`evidence.shape`), (b) that the source FILE exists
  (`evidence.missing`), and (c) for a `#L`/`:line` **line** locator, that the range fits the
  file (`evidence.line_range`). A `#symbol:`/`#section:`/`#route:` locator is validated for
  SHAPE by `parseEvidenceReference` (`src/commands/references.js`) but its TARGET is **never
  checked to exist** — `foo.js#symbol:DefinitelyMissing` passes as long as `foo.js` exists.
- The frontmatter schema (`src/frontmatter-schema.js`) requires the `source_files` KEY but
  allows `source_files: []`, and `evidence` is not required at all. Combined with the
  `verified`→`reviewed_by`/`reviewed_at` conditional, a document can be **`verified` with
  zero grounding** (empty `source_files`, no `evidence`).

So "verified" today can mean "a human set the status and the referenced files exist," not
"the cited symbols/sections actually exist and the doc is grounded." Gate 25 closes the
distance between the promise and the check — **the highest-leverage governance completion
after retrieval** (Gate 24), and the natural next step in the measure-first line.

### Proposed shape (all additive, opt-in, read-only, zero-dep; never default error/blocked)

1. **Target-existence check for `symbol` and `section` locators.** Extend
   `scanEvidenceReferences`: when a non-external evidence (or `source_files`) reference
   carries a `#symbol:<name>` or `#section:<name>` locator and the source file exists, do a
   **bounded textual-presence** check on the file:
   - `symbol`: flag `evidence.symbol_unverified` ONLY when `<name>` does not appear anywhere
     in the file as a word-boundary token. If the file mentions the name at all (even in a
     comment), do NOT flag — this is a deliberately conservative "the file does not even
     mention this symbol" floor, chosen to avoid false positives on real symbols.
   - `section`: flag `evidence.section_unverified` ONLY when no Markdown heading / obvious
     anchor matching `<name>` is found (v1 restricts this to `.md` sources, where "section"
     is well-defined).
   - Both are new toggleable rules under the existing `evidence` category, **default
     warning**, escalated to error by `--strict` (same mechanism as `evidence.missing`).
2. **Ungrounded-verified rule.** New opt-in `evidence.ungrounded`: a `status: verified`
   document whose `source_files` is empty/absent AND whose `evidence` is empty/absent is
   flagged (the "verified with no grounding" hole). Default OFF or warning (open question),
   never default error — this repo and others have `verified` docs (e.g. release notes/log)
   that may be intentionally ungrounded, so it must not break existing `validate`.
3. **Computed evidence tier.** Surface, as ADDITIVE JSON/report output only, a per-doc tier:
   - `reference_checked` — every evidence/source reference resolves (file exists, line range
     fits, symbol/section token present).
   - `human_verified` — `status: verified` with `reviewed_by`/`reviewed_at` present.
   These are orthogonal (a doc can be human-verified but reference-stale, or reference-checked
   but not yet human-reviewed). The tier is **computed and reported**, NOT stored as a new
   required frontmatter field or a new `status` enum value (both are frozen at `1.0.0`).

### Out of scope (v1)

- **True symbol resolution** (AST / language server / scope-aware): distinguishing a
  definition from a mention, overloads, renames, or a symbol defined in another file. The
  textual-presence check is an honest FLOOR, not a resolver — full resolution is
  language/parser-specific and would break zero-dependency.
- **`route` existence.** Route locators (`#route:/x`) stay format-only in v1 — resolving a
  route needs framework-specific knowledge (Express/FastAPI/etc.).
- **Auto-downgrade / auto-fix.** Gate 25 only REPORTS; flipping a drifted/ungrounded doc to
  `needs_review` stays with the human or the existing `drift --downgrade` (Gate 9).
- **A new required frontmatter field or status value** — would break the `1.0.0` frozen
  contract; tiers are computed only.

### Open questions for acceptance

- **Default severity of `evidence.ungrounded`:** OFF-by-default (config `rules` opt-in, like
  `content.thin_body`) vs default warning. Recommendation: **default warning** (visible but
  non-breaking), since an ungrounded `verified` doc is a genuine governance smell.
- **`section` check breadth:** `.md`-only in v1 (recommended) vs also matching a symbol-ish
  heading in source comments.
- **Tier exposure:** computed JSON/report field only (recommended) vs also an OPTIONAL,
  never-required `evidence_tier` frontmatter field a project may write.
- **Where the tier shows:** `audit`/`validate` JSON + `stats` health only, vs also a column
  in a future `review` surface (Gate 20, still drafted).
- **`--strict` interaction:** should `--strict` escalate the new `evidence.*_unverified`
  rules only (recommended, mirroring Gate 23's `impact` decision), leaving `evidence.stale`
  and `evidence.ungrounded` escalatable via config `rules`.

### Invariants (unchanged)

- Additive/opt-in; the `1.0.0` command surface, `--format json` shape (new fields only), and
  required frontmatter contract stay unchanged; zero-runtime-dependency preserved (bounded
  text scans on Node built-ins, no parser/AST library, no network).
- Read-only: Gate 25 reports; it never writes, promotes, or downgrades.
- Conservative-by-design: the existence checks flag only unambiguous absences, so turning
  them on does not retroactively break correctly-grounded `verified` docs.
- Honest framing: "reference_checked" is a textual/structural resolution, never a claim that
  the prose is correct — that remains `human_verified`.

### Evidence (current code the gate extends)

- `src/commands/scans.js#symbol:scanEvidenceReferences` — today's format + file + line-range
  check; Gate 25 adds the symbol/section target-existence branch here.
- `src/commands/references.js#symbol:parseEvidenceReference` — already yields
  `locator.kind` ∈ `line|symbol|section|route`; Gate 25 consumes the `symbol`/`section` kinds
  it currently only shape-validates.
- `src/frontmatter-schema.js` — `source_files` key required but `[]` allowed and `evidence`
  optional → the ungrounded-`verified` hole `evidence.ungrounded` targets.
- `src/commands/findings.js#symbol:FINDING_EXPLANATIONS` — where the new `evidence.*` rules
  register (so `explain` documents them and config `rules` can toggle them).

### Resolved at acceptance (Dowon-Kim, delegated, 2026-07-21)

- **`evidence.ungrounded` default = warning** (visible but non-breaking; config `rules` can
  turn it off or escalate). Confirmed safe: this repo has 0 ungrounded `verified` docs.
- **`section` existence checked for `.md` sources only** in v1.
- **Tier is computed/report-only** (`stats` JSON `evidenceTiers`) — no new frontmatter field
  or `status` value.
- **`--strict` escalates the `evidence.*_unverified` rules only** (via the shared
  `evidenceStrictSeverity`); `evidence.ungrounded` and `evidence.stale` escalate via config
  `rules` only.

### Built (2026-07-21; ships in the next minor)

Delivered, additive/read-only/zero-dep, `1.0.0` contracts unchanged:
- `src/commands/scans.js#symbol:scanEvidenceReferences` — added the conservative
  `symbol`/`section` target-existence branches (`evidence.symbol_unverified`,
  `evidence.section_unverified`; word-boundary presence, `·`/`,`/`/`-split symbol lists,
  `.md`-only sections, BOM-aware source reads via `readTextAuto`).
- `src/commands/scans.js#symbol:scanUngroundedVerified` — the `evidence.ungrounded` rule
  (warning; not `--strict`-escalated), wired into `audit` and `validate`.
- `src/commands/scans.js#symbol:evidenceTier` (+ `EVIDENCE_REFERENCE_RULES`) — the computed
  tier surfaced additively in `stats` JSON (`evidenceTiers.referenceChecked/humanVerified/both`).
- `src/commands/findings.js#symbol:FINDING_EXPLANATIONS` — registered the three new rules
  (so `explain` and config `rules` cover them).
- Tests: symbol/section flag-vs-not + `--strict` escalation, `evidence.ungrounded`
  (warning / not `--strict`-escalated / config off+escalate), `evidenceTier` axes, and the
  `stats` tier surface. 251 tests pass; `validate --strict` 0 findings (clean dogfood).
  Dogfood tier read: 50/50 `reference_checked`, 14/50 `human_verified`.

## Agent Update Runner + Completion Contract Scope Decision (accepted 2026-07-21 — built)

### Why

Gate 21 ships invocable, wiki-grounded skills (`/llm-wiki-feature`, `-fix`, `-docs-sync`)
that instruct an agent to "read the wiki → ground the change → update docs (`needs_review`)
→ append the log." But nothing checks that the agent actually DID the doc/log step: the
skill is *recognize-don't-run*, and a hurried run can change code and skip the wiki update.
Gate 23 `impact` catches this from the DIFF side (a `verified` doc whose cited source moved),
but only for already-`verified` docs and only against a git diff. Gate 26 adds the missing
INTENT side: a run records what it claims it did, and a read-only check verifies the claim —
closing the "self-evolving workflow" loop the product story promises, without ever letting
the tool write the prose itself.

### Proposed shape (minimal v1; additive, opt-in, read-only, zero-dep)

1. **Run manifest.** A skill run writes a small JSON artifact under `.llm-wiki/runs/`
   (e.g. `run-<task>-<stamp>.json`) recording: `task`, `changedSource` (files the run
   edited), `touchedDocs` (wiki docs it updated), `logAppended` (bool), `validated`
   (bool + result). Plain data, no sensitive values (reuse the sensitive-info scan as a
   safety net on any free-text field). The stamp is passed in (no `Date.now()` in library
   code); the agent or CI supplies it.
2. **Manifest-emitting seam in the generated skills.** The Gate 21 skill/rule/prompt bodies
   gain a final step instructing the agent to write the manifest (a documented shape), so the
   contract travels with the skill. Existing skills are regenerated only on the next
   `init`/`quickstart --skills` (never silently overwritten).
3. **Read-only check.** `llm-wiki check-run [--strict]`: given the newest (or a named)
   manifest, verify the claimed pipeline — every `changedSource` entry is referenced by some
   `touchedDocs` doc's `source_files`/`evidence` (reusing the existing reference parsers +
   `verifiedSourceAnchors`), `logAppended` is true, and `validated` passed. Default warning;
   `--strict` fails CI. Emits new toggleable `run.*` findings (e.g. `run.doc_gap`,
   `run.log_missing`, `run.unvalidated`, `run.manifest_missing`).

### Open questions for acceptance

- **Command shape:** a standalone `check-run` (recommended) vs a `--run` mode on
  `validate`/`impact`. A standalone command keeps the manifest concern isolated.
- **Who writes the manifest:** the agent (guided by the skill body) vs an `llm-wiki
  manifest --emit` helper the agent calls. Recommendation: document the shape and let the
  agent write it (zero new write surface); optionally add a validator-only helper later.
- **Manifest location & git:** `.llm-wiki/runs/` committed vs git-ignored. Recommendation:
  git-ignored by default (ephemeral run records), with the check reading the working tree —
  CI produces + checks the manifest within one job.
- **Match strictness:** exact `changedSource ⊆ union(touchedDocs.source_files/evidence)` vs a
  looser "each changed source is mentioned somewhere in a touched doc." Recommendation: reuse
  the anchor extractor (file-level), matching Gate 23's granularity.
- **Relation to `impact`:** keep them separate (intent-anchored vs diff-anchored) — confirmed
  useful as complements, not a merge.

### Out of scope (v1)

- Enforcing that the prose is CORRECT (that stays human review → `verified`).
- Auto-writing docs or the manifest for the agent (no new mutating surface beyond the run
  artifact the agent itself writes).
- Non-skill / manual edits (v1 covers skill-driven runs; manual work still relies on
  `impact`/`drift`).
- A hosted/shared run store, run history, or metrics — a plain local artifact only.

### Invariants

- Additive/opt-in; `1.0.0` command / `--format json` / frontmatter contracts unchanged;
  zero-runtime-dependency preserved (JSON + existing parsers, no network).
- Read-only check; the only new write is the manifest the agent authors during its own run.
- Never default error/blocked; CI failure is opt-in via `--strict` (mirrors Gate 23).
- Honest scope: the contract proves the PIPELINE ran, not that the knowledge is right.

### Evidence (current code the gate builds on)

- `src/commands/skills.js#symbol:writeSkillArtifacts` — where the manifest-emitting step is
  added to the generated skill/rule/prompt bodies.
- `src/task-prompts.js` — the workflow text the skills reuse; the manifest step is appended
  to the same workflow.
- `src/commands/scans.js#symbol:verifiedSourceAnchors` + `src/commands/references.js#symbol:parseEvidenceReference`
  — reused to match a manifest's `changedSource` against `touchedDocs` anchors.
- `src/git.js#symbol:changedFiles` — optional cross-check of the manifest's `changedSource`
  against the actual diff.

### Resolved at acceptance (Dowon-Kim, delegated overnight, 2026-07-21)

- **Standalone `check-run`** (not a `validate`/`impact` mode) — keeps the manifest concern
  isolated; kept separate from `impact` (intent-anchored vs diff-anchored complements).
- **Agent authors the manifest** (guided by the skill body) — zero new mutating surface in
  the tool; `check-run` only reads.
- **`.llm-wiki/runs/` git-ignored by default** — ephemeral run records; the check reads the
  working tree (CI emits + checks within one job).
- **File-level match** reusing the reference parsers (`changedSource` ⊆ union of touched
  docs' `source_files`/`evidence` bases), matching Gate 23's granularity.
- **`--strict` fails CI**; default warning; `run.*` toggle/override via config `rules`.

### Built (2026-07-21; ships in the next minor)

Delivered, additive/read-only/zero-dep, `1.0.0` contracts unchanged:
- `src/commands.js#symbol:checkRunCommand` — reads the newest (or `--run <path>`) manifest
  under `.llm-wiki/runs/`, verifies `changedSource` coverage + `logAppended` + `validated`.
- `src/commands/findings.js#symbol:FINDING_EXPLANATIONS` — five toggleable `run.*` rules
  (`run.doc_gap`/`run.log_missing`/`run.unvalidated` warning, `run.manifest_missing` warning,
  `run.manifest_invalid` error).
- `src/cli.js` / `src/index.js` — `check-run` command + `--run` option + help + frozen API
  map entry (command-set assertion updated).
- `src/commands/skills.js#symbol:artifactBody` — the generated skill bodies now embed the
  Gate 26 completion contract (write a run manifest → run `check-run`), backtick-free plain
  Markdown. NOTE: the repo's own committed dogfood skill artifacts (`.claude`/`.cursor`/
  `.llm-wiki`) are NOT auto-overwritten (never-silently-overwrite invariant) — regenerate
  them with `init --write --skills --existing overwrite` (or delete + recreate) to pick up
  the contract.
- Tests: no-manifest warning, pipeline verify (doc gap / log / validation + `--run` targeting
  + config escalation), malformed-manifest error, skill-body contract embedded. 254 tests
  pass, `validate --strict` 0 findings. (v1 covers skill-driven runs; the manifest is
  authored by the agent, not the tool.)

## Findings Message Localization (KO i18n) Scope Decision (accepted 2026-07-22)

**Motivation.** The last remaining external-feedback item (P4). The tool's user-facing prose is English-first (Gate/1.16), but the primary maintainer/user base is Korean, and `explain`/report output is the daily-driver surface. Localizing findings prose lowers the read cost for KO users without touching any machine contract.

**Scope (accepted).** Localize only human-facing PROSE, in two places:
1. **Finding `message` strings** — the ~24 inline English templates in `src/commands/scans.js` (+ a few in `adapters.js`/`fix-migrate.js`/`retrieval.js`/`wiki-graph.js`/`commands.js`). Each gets a stable `messageId` + `params`; the existing English string stays as the guaranteed fallback.
2. **`FINDING_EXPLANATIONS`** — the 47-entry registry's `what`/`why`/`actions` prose rendered by `explain`. `commands` (CLI examples) and `related` (rule IDs) stay English.

**Mechanism.** New `--lang ko|en` flag (default `en`) + config `lang`, merged through the shared `applyProjectConfig`/`resolveOptions` seam so CLI, programmatic API, and MCP all resolve the same effective language. Zero-dep catalog `src/i18n.js`: `t(lang, id, params)` with `{param}` interpolation and a strict EN fallback (missing KO key → English, never blank/undefined).

**Frozen / English-only (never localized).** rule IDs, category names, all `--format json` keys and its SHAPE, config keys, command/option names, evidence-locator syntax (`file#L10`, `#symbol:`, …), the CLI command strings inside `commands`/`related`, and file paths. Only prose localizes.

**Resolved decisions (Dowon-Kim, 2026-07-22).**
- **Scope** = finding messages + `explain` (report chrome — section headers, severity words — stays English in v1).
- **JSON** = `--format json` `message` DOES localize under explicit `--lang ko`; `rule`/keys/shape unchanged; consumers must key on `rule`. Default `en` keeps output byte-identical in every format (the English path never routes through the catalog — it uses the existing inline strings, guaranteeing byte-identity).

**Out of scope v1.** Languages beyond KO/EN (the mechanism is general, only KO+EN ships); report-chrome/severity-word localization; localizing generated doc/adapter/skill bodies and MCP text content; OS-locale auto-detection; an `LLM_WIKI_LANG` env var.

**Invariants.** Additive/opt-in/zero-dep; `1.0.0` command/`--format json`-shape/frontmatter contracts unchanged (new flag + new config key + additive localized strings only); EN-first default preserved; deterministic (no locale sniffing).

## Documentation Language Selection Scope Decision (accepted for 1.24.0 — urgent i18n)

**Status.** ACCEPTED by the maintainer (Dowon-Kim) on 2026-07-23 as an urgent
internationalization fix, and directed to ship bundled with the Guided Onboarding work
below as `1.24.0`. AI-authored/edited wiki docs stay `needs_review`; no `verified`/
`reviewed_by`/`reviewed_at` is fabricated by this work.

**Motivation.** The product is English-first (CLI help, findings, handoff prompt, and
skills all flipped to English in 1.16.0), but `init`/`quickstart` still hardcoded Korean
prose in several generated document bodies — `index.md`, the wiki `README.md`, the initial
`log.md` entry, the domain overview's empty-domains note, and per-domain docs. An overseas
user running the default therefore received partly-Korean documentation. This is a
correctness bug in an English-first product.

**Accepted scope (in).**

- New global option `--doc-lang <en|ko>` (default `en`) and config key `docLanguage`,
  selecting the language of GENERATED wiki document content and the agent doc-writing
  instructions (handoff / bootstrap / feature / fix / docs-sync / okf-extract prompts and
  generated skill bodies). Independent of `--lang` (findings/CLI-message prose). CLI wins
  over config; an invalid value is a usage error (exit 3).
- English is the default; a default run leaves **no Korean** in bodies, titles,
  placeholders, review notes, or the initial log entry. `--doc-lang ko` reproduces (and
  completes) the Korean experience.
- A single language-selection layer (`src/commands/doc-content.js`) holds the localized
  prose; the same `normalizeLang` decision function is reused across CLI/API/config. English
  output is byte-identical to before for docs that were already English.
- Only prose is localized; technical identifiers (paths, code symbols, JSON keys,
  frontmatter fields, status values, CLI commands, evidence locators) and titles/headings
  stay verbatim in both languages — this also protects the `## Evidence` alignment check,
  `enrichmentChecklist` section splitting, and title-based link resolution.

**Explicitly out (this release).** No automatic translation of existing docs; `migrate`/
`docs-sync` never change an existing doc's language; no standalone language-conversion
command. OKF v0.1 profile docs/templates/conversion guide stay English in both languages
(format-standard artifacts, off the default path via opt-in `--profile okf-v0.1`) — a noted
follow-up if Korean OKF output is later wanted.

**Version.** New public option + config key = MINOR per `VERSIONING.md` (`--doc-lang` is a
backward-compatible addition; `1.23.1` would violate policy). Smallest correct minor after
`1.23.0` is `1.24.0`; shipped bundled with Guided Onboarding (they were entangled in the
working tree and could not be split without damaging in-progress work).

**Invariants.** Additive/opt-in/zero-dep; `1.0.0` command/`--format json`-shape/frontmatter
contracts unchanged (new flag + new config key + additive localized prose only); EN-first
default preserved and byte-identical for already-English docs; deterministic (no locale
sniffing).

## Guided Onboarding and Task Preparation Scope Decision (accepted for 1.24.0 — user-directed)

**Status.** Direction ACCEPTED by the maintainer (Dowon-Kim) on 2026-07-23 as an
implementation directive (a task prompt authored via Codex, pasted by the maintainer).
This records that the *direction* is approved; it does NOT assert that any document has
completed human review — AI-authored/edited wiki docs stay `needs_review`, and no
`verified`/`reviewed_by`/`reviewed_at` is fabricated by this work.

**Motivation.** The measure-first line proved the retrieval mechanism and the governance
core; the open gap is the *human/agent workflow* on top of them. A newcomer still has no
guided way to (a) understand a work domain from real code evidence before touching it, and
(b) scope a first change (relevant docs/source/risks/tests) before implementing. This gate
adds two read-only "guided" surfaces that assemble that context deterministically from the
existing wiki + evidence + graph + retrieval — the CLI never invents explanation; the agent
skills do the teaching. It closes the loop: newcomer → `onboard` (learn a domain) →
`prepare` (scope a task) → `feature`/`fix` skills → tests/docs/log/manifest → human review.
MINOR = `1.24.0` (additive/opt-in command + skill surface).

### Accepted scope (in)

- **Read-only `onboard`** — deterministically assemble a domain learning path from the
  wiki: orientation, recommended read order, selected domain doc(s), related terms,
  architecture/API/workflow docs, source & test entrypoints (from docs' `source_files`/
  `evidence`), doc-recorded invariants/risks/open-questions, freshness/`needs_review`
  warnings, evidence-anchored comprehension checks (generic checks, NOT invented meaning),
  and a next step. `--domain`/`--goal`. Domain-missing → explicit guidance (available
  domains, why none, `--domains`/init, manual entrypoints), never a silent empty result.
- **Read-only `prepare --task <text>`** — scope a change before implementing: most-relevant
  wiki docs (reusing the `search-docs` ranking — no duplicate search engine), resolved graph
  neighbors, candidate domains/source/test files, related API/state/screen/config docs,
  doc-recorded invariants/risks, freshness/review warnings, unknowns, a scope checklist, and
  a next step. **Non-asserting phrasing** ("docs reference this file" / "search candidate" /
  "verify the source before editing"), never "you must edit X" / "this is the cause" / "safe".
- **Agent skills `llm-wiki-onboard` + `llm-wiki-prepare`** in the four native formats
  (Claude `.claude/skills/`, Codex `.agents/skills/`, Cursor `.cursor/rules/`, agent-neutral
  `.llm-wiki/prompts/`), sharing rules single-sourced in `task-prompts.js` (no duplication,
  no `commands.js` cycle). Same format-selection as existing skills.
- **Three-surface consistency** (CLI/API/MCP) via a shared core function so search/filter/
  redaction policy is identical; MCP exposes read-only `onboard`/`prepare` tools with the
  existing `readOnlyHint` convention.
- **feature/fix connection** — the feature/fix skills become aware of `prepare` and, for a
  guided/newcomer request, show the prepare result + current-behavior understanding first,
  and stop before implementing on a doc/code conflict or a larger-than-expected scope. No
  change to their default output/contract; the `--guided` public option is deferred (a
  skill-internal optional step first).
- **EN + KO** user-facing guidance messages; sensitive-info redaction, `visibility`, and
  stale/`needs_review` status respected (never hidden).
- **A reproducible whole-task experiment scaffold** — methodology, task format, rubric,
  dry-run, sample fixture, and result format ONLY, kept clearly separate (name + docs) from
  the retrieval bench. Measures (1) onboarding comprehension and (2) tech-add/fix
  error/rework reduction, with arms source-only / wiki-retrieval-only / onboard+prepare+
  feature|fix. No paid model calls, no fabricated numbers.

### Out of scope (excluded)

- Code auto-fix; automatic `verified` approval; vector search / embeddings; external LLM API
  calls; a hosted docs portal; a bespoke static-analysis / AST engine; automatic human
  evaluation; incompatible changes to existing feature/fix behavior; paid bench runs;
  release/deploy/npm publish; a separate guided feature/fix CLI mode, a human-approval
  `review` command, and language-server/AST optional analyzers (ROADMAP/Gate drafts only).

### Invariants (non-negotiable)

- Both commands are **read-only** (nothing written). Restricted/sensitive docs excluded from
  default results (opt-in include), every returned body/snippet redacts sensitive lines.
- Recognize-don't-run for skills; existing skill files never overwritten; no machine-absolute
  paths/usernames in artifacts; preview-first.
- Zero runtime dependency; frozen `commands` map key set grows additively; `--format json`
  shape additive; default output byte-identical when the new surfaces are not used.
- AI-authored/edited wiki docs stay `needs_review`; no fabricated review metadata.

### Evidence (to be implemented)

- Reuse `src/commands/retrieval.js` (ranking/filter/redaction primitives) + `wiki-graph.js`
  (neighbors) + `domains.js` (domain detection) + `task-prompts.js` (shared skill bodies) +
  `git.js`/`impact` (optional working-change hints). New module `src/commands/guided.js`
  (`onboardCommand`/`prepareCommand`), CLI/API/MCP wiring, `SKILL_TASKS` entries.

## Token-Efficiency: Cheapest-Safe-Path Selection + Compact Retrieval Scope Decision (accepted for 1.25.0 — built)

**Goal.** Reduce the TOTAL tokens spent to reach a correct, verified code change — not
merely to shorten skill prose. Never trade away accuracy, doc freshness, or human review.
The core is "pick the cheapest SAFE path", not "use the wiki more". Measured direction from
the (proxy + N=3 real) bench, re-verified against HEAD before coding: retrieval helps when
info is spread across files (auth/item-style); it costs ~1.17× on tiny 1–2-source tasks
(routing-style); stale docs cause security-relevant wrong answers and source re-reads.

Accepted for 1.25.0 by the maintainer (Dowon-Kim) directing the release. All items below are
built and shipping in 1.25.0 EXCEPT the explicitly-deferred paid bench (see Status).

### Accepted scope (in) — additive, opt-in, backward-compatible

- **(A) Task-path selector** (`src/commands/task-path.js`, pure/deterministic, BUILT):
  `classifyTaskRisk(task)` + `selectTaskPath({task, candidateCount, docStatuses, isCodeChange})`
  → `{path: source_direct|wiki_first|hybrid, reasonCode, reason, risk[], mustReadSource,
  unverifiedDocs}`. Inputs are ONLY the task text, the candidate count, and candidate
  statuses — never answer filenames or internal symbols (bench-leak guard). Safety override:
  risk work (auth/permission/payment/crypto/privacy/data-deletion/migration/public-API) OR any
  stale/unknown/`needs_review` candidate OR any code change ⇒ `mustReadSource=true` and never
  `source_direct`. A verified doc never excuses skipping the real source on a change.
- **(C) Retrieval token controls** (`src/commands/retrieval.js`, BUILT, all opt-in):
  `estimateTokens` (chars/4 PROXY, surfaced only as `estimatedTokens` — never a real count) +
  `clampText` (exact `--max-chars`, clamped AFTER redaction). `selectSections` gains a strict
  mode (no full-body fallback → `noSectionMatch`, the guard against a failed `--section`
  ballooning into a whole-doc read) and section-HEADING weighting (a heading hit outranks
  body frequency). `get-doc` gains `--strict-section`/`--compact`/`--max-chars`; diagnostic
  size fields appear ONLY when a new option is used, so default output is byte-identical.
- **(B) Compact context bundle** (`prepare --compact`, `src/commands/guided.js`, BUILT):
  ONE bounded single-call payload reusing (A)+(C): chosen path + reason, ≤3 candidate docs
  with status-derived freshness + reason (reuses the doc's own status — no new freshness
  criterion), ONLY the top doc's most-relevant section (never the corpus, never a silent
  full-body dump), candidate `source_files`, next-lookup calls to expand, `chars`+
  `estimatedTokens`, and why-selected. Conservative: top doc's section first, expand on
  demand. Default (full) `prepare` output unchanged.
- **(D) Skill simplification + safe refresh** (BUILT in 1.25.0): shrink
  feature/fix/docs-sync fixed prompt cost — resolve the domain map at RUN time (index/search/
  prepare) instead of injecting a generation-time snapshot; shorten the governance preamble;
  gate the API-services checklist to API work (or a one-line contract); state the run-manifest
  as a field contract, not a full JSON echo. KEEP every safety rule (needs_review, no verified,
  log append, tests, check-run). Report before/after chars + `estimatedTokens` and TEST that
  the essential contracts survive. Bootstrap keeps its fuller guidance. A safe `--refresh`:
  update only package-generated, user-unmodified artifacts (marker: generator version/hash),
  never touch user-modified files, dry-run distinguishes create/update/conflict, preserve
  custom skills. Held back because it changes what ships to existing users and touches the
  never-overwrite contract — deserves its own pass + human review.
- **(E) Bench split + extension** (DESIGNED; one proxy arm built, all dry / `executed:false`):
  keep the three existing harnesses and their arm vocabularies SEPARATE (proxy A0/A1/A2/B/B2;
  real B/B2; whole-task source-only/wiki-retrieval/guided). Add proxy `B3_retrieval_compact`
  (models §C section-scoped/compact reads; mirrors shipped retrieval like B2 does) and an
  optional empty-wiki control. Extend the whole-task methodology with a compact-skill arm.
  No paid runs; results are `chars/4` proxy or human-graded — README headline numbers stay
  FORBIDDEN until a real multi-project/multi-model run.

### Out of scope (excluded)

- Vector search / embeddings / any network or index dependency; automatic `verified`
  promotion; forcing every task through the wiki; silent changes to existing CLI default
  output or to user skills; treating stale docs as verified; a single blended
  skill+retrieval headline number; fabricated or `chars/4`-as-real performance claims;
  version bump / npm publish / commit / push / paid bench runs (this pass).

### Invariants (non-negotiable)

- Accuracy and test pass-rate must not drop; security-relevant wrong answers stay at zero.
- Never rely on a stale/`needs_review` doc for a risky change; risk work and code changes
  always read the real source and tests. The code is the source of truth; the wiki is a map.
- Zero runtime dependency; Windows/UTF-8 safe; sensitive-info redaction preserved on every
  new path (clamp after redaction); frozen `commands` map + `--format json` shapes grow only
  additively; default output byte-identical when a new option is not used.
- `estimatedTokens` is always labeled a chars/4 proxy; exact limits use `maxChars`.
- AI-authored/edited wiki docs stay `needs_review`; no fabricated review or bench metadata.

### Status

- Built pass 1 (staged on `main`, unreleased): (A) full, (C) full, (B) full, +tests, +the
  `--doc-lang` help-usage gap fix that prompted this work. `validate --strict` = 0.
- Built pass 2 — "clear the runway, defer paid" (staged on `main`, unreleased):
  - (E, non-paid) proxy `B3_retrieval_compact` arm BUILT + run (`bench/lib/strategies.js`,
    surfaced in `bench/run.js` + `bench/results/current.*`): honest chars/4 result B3 vs B2
    = 0.65× (−34.5%) tokens but grounding 100%→83.3% (evidence in an unselected section on 1/6
    tasks) — reported, not hidden. Whole-task `guided-compact` arm added (dry). Real-harness B3,
    the empty-wiki control, and ALL paid runs stay deferred (human budget decision).
  - MCP completeness BUILT: `get_doc` gains `strictSection`/`compact`/`maxChars`, `prepare`
    gains `compact`/`maxChars` (`src/mcp/tools.js`). Investigated the content-vs-structuredContent
    body duplication: get_doc mirrors the body into BOTH `content[0].text` and `structuredContent`
    (whether a client feeds both to the model is client-dependent and UNMEASURED — not asserted),
    so the DEFAULT is unchanged and only the opt-in `compact` path keeps the body in
    structuredContent while the text shows a pointer (no duplication). 317 tests, `validate --strict` = 0.
- Built pass 3 — (D) skill simplification + safe `--refresh` (staged for 1.25.0): feature/fix/
  docs-sync assemble the wiki map at RUN TIME (via `prepare --compact`/`onboard`) instead of a
  generation-time snapshot (fixed body no longer scales with domain count, never stale) and state
  the run-manifest as a field contract, keeping every safety rule; bootstrap keeps its fuller
  guidance + snapshot. `--refresh` (init/quickstart) updates only package-generated,
  content-hash-marked, user-unmodified skills; user/custom skills are never overwritten (conflicts);
  dry-run distinguishes create/refresh/conflict/up-to-date. Measured skill size: feature/fix/
  docs-sync are now flat (~3.18k chars, decoupled from domain count; ~−42 at N=0, larger savings as
  domains grow); bootstrap −124 (manifest compaction). Repo dogfood skills regenerated (now marked).
- Shipping as 1.25.0 (this release): (A), (B), (C), (D), the non-paid (E) proxy `B3` + whole-task
  `guided-compact` arm, MCP token controls + compact dedup, and the `--doc-lang` help fix.
- Still deferred (human decision): real / paid multi-project/multi-model bench (E), the real-harness
  B3 arm, and the empty-wiki control. "≥20% total-token reduction" stays an internal stretch target
  only — NOT a product claim until real measurement exists.

## ECC Technique Extraction Scope Decision (maintainer-instructed 2026-07-28 — built, unreleased)

Context: the maintainer asked whether ECC (github.com/affaan-m/ECC — MIT agent-harness toolkit,
234k stars) could make this package better. Decision: use it as a **technique source**, never as a
dependency or as this repo's development harness (both were evaluated and declined earlier the same
day: dependency breaks zero-dep/tool-neutrality/layering; harness adoption breaks bench attribution
and the dogfood pain-signal loop). Four techniques were re-implemented house-style (zero-dep,
additive, preview-first), built in four parallel isolated worktrees and serially squash-merged.

### Accepted scope (in) — all additive, unreleased (main only)

1. **Per-gate evidence trail** (from ECC's plan→test→implement→review trail): run manifests gain
   optional `testEvidence { red, green }`; `check-run` emits `run.test_evidence_missing` (warning,
   toggleable) only for feature/fix manifests with non-empty `changedSource`; legacy manifests and
   docs-sync/bootstrap stay warning-free. Feature/fix skill completion contracts name the field.
2. **Skill token budgets** (from ECC's SKILL.md estimated-tokens frontmatter): generated artifacts
   carry `estimated-tokens` (chars/4 PROXY, disclaimer inline; Claude/Codex frontmatter, Cursor/
   neutral HTML comment; marker v2→v3; pre-budget artifacts refresh cleanly via `--refresh`).
3. **Named rule presets** (from ECC's hook profiles minimal/standard/strict): config
   `rulesPreset: "relaxed"|"standard"|"strict"`, single source `findings.js#RULE_PRESETS` (frozen),
   expanded at config-merge time so CLI/API/MCP + monorepo inherit; explicit `rules` always wins;
   `sensitive.*` remains non-toggleable; unknown preset = config error (exit 3); doctor echoes it.
4. **`import-memory`** (ECC documents "promote accepted memories into governed project
   documentation" but provides no governed layer — this command is that hand-off): one-way importer
   from portable `ecc.memory.v1` Markdown (default vault `.ecc/memory`) to needs_review wiki drafts
   under `docs/llm-wiki/imported/`. Preview-first (`--apply`), frontmatter only via
   `renderWikiDocumentTemplate` (verified structurally impossible), sensitive-hit memories skipped
   by default (no force flag), never overwrites, NOT exposed via MCP. New `import.*` findings.

### Rejected scope (out) — recorded so it is not re-litigated

- **Confidence scoring (0–1) / risk grades**: collides with the deliberate two-orthogonal-axis
  design (`reference_checked` machine axis vs `human_verified` human axis) and duplicates the
  stats health score. Fuzzy scores would blur what "verified" means here.
- **Instincts / session-learning injection**: a competing answer to context persistence; adopting
  it contaminates bench attribution (the measured value of the wiki's content) and adds
  non-deterministic prompt state this governance layer exists to avoid.
- **Deferred, not rejected**: ECC's eval-harness methodology (checkpoint vs continuous, pass@k)
  as measurement design for the real/paid bench — waiting on the existing paid-bench
  authorization; unchanged headline ban until then.

### Invariants (non-negotiable) — all held

Zero-dep (Node builtins only) · additive-only (frozen CLI/API maps, `--format json` shape) ·
preview-first writes · verified stays human-only · sensitive values never in findings/output ·
MCP read-only · default outputs byte-identical when new options are unused.

### Status

Built 2026-07-28 under maintainer instruction; 380 tests (347→380, +33; each task RED-verified
pre-implementation) · lint OK (55 files) · validate --strict 0 · dogfood skills regenerated via
`--refresh`. Unreleased; wiki docs updated and demoted to needs_review pending human re-approval.

## Prompt-Shape Discipline (Unhobbling) Scope Decision (maintainer-instructed 2026-07-30 — built for 1.27.2)

Context: the maintainer reviewed Boris Cherny's (Claude Code creator) three-point guidance —
(1) delete unnecessary configuration, (2) give the model the goal / hard lines / exit criteria
instead of step-by-step orders, (3) no magic tricks: observe where the model fails and patch only
that — and instructed applying it to this project. Measurement first: this repo's own Claude Code
adapter preloaded ~121k chars (~30k tokens, chars/4 proxy) of wiki every session via `@`-includes,
of which ~44k chars were `## Review Notes` audit history (not instructions); and the shipped
adapter template taught every adopter the same preload-everything pattern. The triage rule applied
throughout: classify every instruction line as steering / contract / safety, and only steering is
deletable — unhobbling removes narration because verification (validate / check-run / tests)
enforces the contract at the exit, never by removing the verification itself.

### Accepted scope (in)

1. **Adapter preload cut** (template + this repo): `templates/adapters/claude-code/CLAUDE.md`
   (marker v1→v2) now `@`-includes only `index.md` + `project-profile.md` and lists the heavy docs
   as load-on-demand with the retrieval commands (`search-docs`, `prepare --compact`,
   `get-doc --section --strict-section`). This repo's `CLAUDE.md` matches the template
   byte-for-byte. Preload here: ~30.3k → ~1.4k tokens (chars/4 proxy). Other adapter templates
   already pointed only at `index.md` and are unchanged. `scanAdapters` checks only the
   `docs/llm-wiki/index.md` entrypoint, so existing user adapters keep validating; existing files
   are never overwritten (unchanged contract).
2. **Review-notes archive**: `ARCHITECTURE_CONVENTIONS.md` / `DOMAIN_FEATURES.md` keep the most
   recent 5 `## Review Notes` entries; the older 83 entries moved verbatim to the new
   `docs/llm-wiki/REVIEW_HISTORY.md` (needs_review, archive-only) with pointer lines both ways.
   Frontmatter `reviewed_by`/`reviewed_at` stays the authority for approval state; `log.md` stays
   the append-only change log. The heading is preserved (the `fix` engine anchors on it).
3. **Goal / hard-lines / exit-criteria prompts**: the recurring write workflows
   (`feature`/`fix`/`refactor` via `implementationPrompt`, `docs-sync`) drop the numbered
   step list and state three blocks — Goal, Hard lines (never cross), Exit criteria — plus an
   explicit autonomy line ("how you work between those lines is your call"). Every load-bearing
   line survived: entrypoint read, real-source inspection, STOP on doc/code conflict or scope
   growth, needs_review / verified-is-human-only, sensitive-info ban, context budget, log append,
   test/validation reporting. Deleted lines were pure steering ("produce a short implementation
   plan", "locate related documents before editing"). Marker v4→v5; dogfood skills refreshed;
   regression-tested in `tests/agent-token-discipline.test.js` (RED-verified pre-implementation).
4. **Instrumented deletion criteria** (the standing rule replacing calendar-based cleanup):
   *a steering line is a deletion candidate when no observable signal fires in its absence* —
   the instruments are `check-run`'s `run.*` findings, `validate`/`audit` findings, and test
   failures. Review the generated-prompt surface on model upgrades or every few releases (this
   repo ships too fast for a 6-month calendar). Contract and safety lines are exempt from this
   rule by definition.

### Rejected / deliberately unchanged scope

- **Verification machinery is not "configuration"**: validate/check-run/impact/evidence scans,
  `mustReadSource`, sensitive redaction, needs_review⇄verified human gate — untouched. Deleting
  these would make the product lie, not the model smarter.
- **One-shot procedural workflows keep their checklists**: bootstrap (shared verbatim with
  `handoff` via `initialEnrichmentWorkflow`), onboard/prepare (read-only guided), okf-extract
  (format conversion) — there the numbered sequence IS the content, not micromanagement. Guarded
  by a dedicated test so the boundary is explicit.
- **No measured-savings claims**: the preload cut is arithmetic on file sizes (chars/4 proxy);
  the prompt restructure's effect on task outcomes is UNMEASURED (no bench arm was run — the
  maintainer chose to ship without one). The README headline ban stays in force.

### Invariants (non-negotiable) — all held

Zero-dep · additive-only (frozen CLI/API maps, `--format json` shape, no new commands/options) ·
existing adapter/skill files never overwritten (refresh only touches managed-unmodified artifacts) ·
verified stays human-only · sensitive values never in findings/output.

### Status

Built 2026-07-30 under maintainer instruction; 386 tests (384→386, +2; prompt-shape test
RED-verified pre-implementation) · lint OK (56 files). Wiki docs updated and kept needs_review
pending human re-approval. Ships as 1.27.2.

## Monorepo CLI Contract Parity Scope Decision (maintainer-approved 2026-07-31 — built)

### Why

A documentation review found that `monorepo` was the only command missing from BOTH
`COMMAND_OPTION_RULES` and `COMMAND_HELP` in `src/cli.js`. Because
`validateCommandOptions` returns early for a command that has no entry, `monorepo`
accepted **any** option without validation — `monorepo --strict --write` exited 0 while
every other command rejects an unsupported option with exit 3 — and `help monorepo`
answered `Unknown help topic` (exit 3), the only gap among the help topics.

This is a **behavior change to exit codes**, which this project requires explicit human
approval to make. The maintainer approved it on 2026-07-31 after the deviation was
reported with reproduced exit codes.

### Decisions

- **The whitelist is derived from the code path, not from the documentation's guess.**
  `monorepoCommand` spreads `{ ...options }` into each package's `validateCommand`, so
  `strict` and `agent` genuinely apply per package (`--strict` escalates per-package
  evidence severities from warning to error). The same function overrides `type: null`
  and `profiles: []` per package, so `--type`/`--profile` would silently do nothing and
  are therefore rejected. Accepted set: `cwd`, `strict`, `agent`, `format`, `out`.
- **`COMMAND_HELP.monorepo` is added** in the same shape as the other 28 topics
  (Usage / Purpose / Notes / JSON), including the JSON top-level keys and the honest
  limit that a repository without workspaces reports `workspaces_detected: 0` and
  `result: pass`.
- **A convention is recorded** in `ARCHITECTURE_CONVENTIONS.md`: a command's allowed-option
  set must match what the command actually applies, and a new command must be registered in
  both maps — a missing `COMMAND_HELP` entry turns `help <command>` into exit 3.

### What changes for a caller

An invocation that previously exited 0 while silently ignoring the option now exits 3.
Known cases: `monorepo --write`, `monorepo --apply`, `monorepo --type <t>`,
`monorepo --profile <p>`, and any other option outside the accepted set. No JSON shape,
frozen `commands` map entry, MCP tool, or programmatic export changes.

### Invariants (all held)

- Zero runtime dependencies; Node `>=18.18.0` floor unchanged.
- `--format json` shape, `schemaVersion`, the frozen `commands` map, and the MCP tool set
  are unchanged.
- `monorepo` stays read-only; no write path was added.
- Wiki documents edited for this change stay `needs_review`; no document was promoted.

### Status

Built 2026-07-31 under maintainer approval. 399 tests (393→399, +6 in the new
`tests/cli-monorepo-contract.test.js`; 3 of them RED-verified against the pre-fix source,
and the `--strict`-is-honored test passes both before and after as a regression guard) ·
lint OK (58 files). Wiki docs updated in the same task and kept `needs_review` pending
human re-approval. Unreleased — `main` only.

## Phase 0 Defect Batch Scope Decision (maintainer-approved 2026-07-31 — built)

### Why

`HARNESS_GOVERNANCE_ROADMAP.md` (needs_review, 2026-07-31) concluded that this
project's problem is not missing detection but **missing connection**: the tool can
see more than it can say. The maintainer approved the "fix the defects first" slice
of Phase 0 — the half that stays inside this repository and cannot turn an adopting
project's CI red — and deferred the gate-wiring half (deployment artifacts,
`ci_governance` redefinition) until the three unconfirmed pilot repos are checked.

Every defect below was reproduced against shipped code before the fix, and each is
pinned by a test in `tests/phase0-defects.test.js` (16 cases, RED before / GREEN
after).

### Decisions

- **Severity is a reporting concern; approvability is a fact about the document.**
  `review --approve` refused only `blocked`/`error` findings, but
  `content.not_enriched` is a *warning* — so an untouched generated scaffold could be
  stamped `verified`, and whether that happened depended on whether the operator
  passed `--strict`. The new gate matches on the **rule id** (`NEVER_APPROVE_RULES`),
  not the severity, and emits `review.not_enriched` (error) to say why. Kept
  deliberately narrow to one rule: most warnings (stale evidence, a broken link) are
  exactly what a human reviewer should look at and may legitimately sign off on, and
  blocking those would make `review` useless. This also gates `--approve-all`
  selection, so a bulk approval cannot sweep up scaffolds.
- **A command that cannot fail is not a gate.** `drift` put stale evidence in a
  separate `driftFindings` array and always reported `result: pass`, while
  `exitCodeFor` reads `findings` — so it reported exit 0 on a wiki it had just proved
  stale, and it rejected `--strict` outright. Stale findings now also go into
  `findings`, `result` reflects them, and `--strict` is accepted. **The default exit
  code stays 0**, so adding `drift` to an existing pipeline cannot break it; only
  `--strict` makes it fail. `driftFindings` is retained so the JSON shape stays
  additive.
- **"Latest" must mean latest.** `check-run` selected the lexicographically last
  manifest filename, and manifests are named `run-<task>-<timestamp>.json`, so the
  **task name dominated the timestamp** (`fix` > `feature` > `docs-sync`). Measured in
  this repo: the newest manifest was a 2026-07-30 `feature` run and `check-run`
  inspected a 2026-07-27 `fix` run — verifying the wrong run while still reporting
  pass, the worst failure mode for a completion gate. Selection now keys on the
  manifest's own `timestamp` field (survives a fresh clone, unlike mtime, and does not
  depend on a filename convention that is **not** uniform in practice), falling back
  to mtime and then the filename.
- **The `--since` baseline must include untracked files.** `changedFiles` added them
  only on the no-ref path, so `impact --since <ref>` — the one command that can fail a
  build on a missing doc update — went blind to a source file created but not yet
  committed, which is exactly the state of a PR working tree. `--exclude-standard`
  still keeps gitignored build output out.
- **A preset named `strict` must escalate the rule that catches the omission.**
  `RULE_PRESETS.strict` escalated seven presentational/metadata rules while
  `impact.source_changed` — the only rule that detects "source moved, docs did not" —
  stayed at warning. Now `error`. `relaxed` still lowers it to `info`.
- **The append-only log is append-only for the tool too.** `runMechanicalRemediation`
  had no guard, so `fix --write` was one qualifying plan away from rewriting
  `log.md`'s frontmatter, and stubs conjured from links in historical entries would
  resurrect deleted documents. `scans.js` already skipped it; this loop now does too.
  Latent, not observed — no plan qualifies today.
- **A whitelist entry must be earned by a code path.** `explain` now accepts `--cwd`
  because `main()` runs `applyProjectConfig` for every command, so `--cwd` selects the
  `llm-wiki.config.json` whose `lang` key decides the prose language — a real effect,
  verified by test, not a documentation guess. This is the same lesson the Monorepo
  gate above recorded.
- **Derive help text from the source of truth.** `prompt --task` help listed 6 of the
  8 supported presets (omitting `onboard`/`prepare`) and the
  `prompt.unsupported_task` remediation listed 5. Both now render from
  `SUPPORTED_TASK_PROMPTS`, so adding a preset updates them in the same edit.

### Scope boundary

Out of scope for this slice and still open: gate wiring into the four deployment
artifacts, redefining `ci_governance` by blocking power, the run-manifest commit
policy (reverses Gate 26 — human decision), `check-run` × `git diff` cross-checking
(behavior change — human decision), and the bench-harness regression tests.

### Verification

415 tests pass (399 + 16 new). `lint` OK (59 files). `validate --strict` reports 5
findings, all of them the pre-existing `evidence.stale` set awaiting a human
re-baseline — unrelated to this batch. `validate-frontmatter` 0. `drift --strict` now
exits 1 on this repo's 5 stale documents, and plain `drift` still exits 0. Wiki docs
updated in the same task and kept `needs_review` pending human re-approval.
Unreleased — branch only.

## Phase 0 Gate Wiring Scope Decision (maintainer-approved 2026-07-31 — built)

### Why

The roadmap's headline finding: **the alarm was wired to nothing.** The only
command that fails a build on an omission is `impact --since --strict`, and none
of the four channels this project ships ran it.

| Channel | Ran | Could block an omission |
| --- | --- | --- |
| `templates/git-hooks/pre-commit` | `validate --changed` | no |
| `.github/actions/validate/action.yml` | `validate`, hardcoded as `args[0]` | no — no other command was reachable |
| `templates/github-actions/llm-wiki-validate.yml` | `validate-frontmatter`, `validate --strict` | no |
| `.github/workflows/ci.yml` | `validate-frontmatter`, `doctor` | no |

The validate family checks the documents that **exist**. Only the impact/drift/
check-run family can see the document that **should have been touched**. So this
project sold governance while shipping four channels that could not enforce it,
and its own CI had no gate either.

The maintainer approved the wiring and directed that the three unconfirmed pilot
repositories be skipped for this slice.

### Decisions

- **An invocation is not a gate.** `ci_governance` counted any `llm-wiki`
  invocation, so a workflow whose only step was `doctor` — a report that always
  exits 0 — read as governance. It now classifies each invocation as blocking or
  advisory, and when no omission gate exists it says so in a sentence rather than
  leaving a reassuring number. Omission commands (`impact`, `check-run`, `drift`)
  count as blocking **only with `--strict`**, because their findings are warnings;
  structure commands (`validate`, `validate-frontmatter`, `audit`, `monorepo`)
  block on error findings without it.
- **The detector must see the invocation form this repo actually uses.**
  `node bin/llm-wiki.js <command>` did not match, so this project's own gate was
  invisible to its own check. Fixed; the shape is now covered by a test.
- **Stated limitation instead of a silent one.** The check reads invocations, not
  the working directory they run in, so a packaging smoke test against a scratch
  directory still counts. A YAML parse would be needed to do better, and that
  costs the zero-dependency stance. It reports the matched file paths so a human
  can judge, and both `doctor` and `docs/OPERATIONS.md` say the counts are an
  upper bound. Over-reporting remains the dangerous direction; this narrows it
  substantially without pretending it is gone.
- **The action's command is an input, not a constant.** `args=(validate ...)`
  made an omission gate physically unreachable through the action. `command` now
  defaults to `validate` (existing users unaffected), accepts only the eleven
  read-only commands, and refuses a write command with exit 3 rather than
  delegating that judgment to the CLI. Each optional flag is passed only to
  commands that accept it — newly required, since every command now rejects an
  unsupported option with exit 3.
- **`--strict` is load-bearing everywhere.** Each wired gate carries it
  explicitly, because `impact.source_changed` is a warning (**SUPERSEDED**, see below)
  and the step would otherwise print the omission and pass.
  **SUPERSEDED 2026-08-03 by decision 21** for `impact` only: that rule now defaults to
  `error`, so its step blocks without the flag and `--strict` is a no-op for it. The flag
  stays on the wired gates because it is still load-bearing for `drift` and `check-run`,
  and because it still escalates `impact`'s other findings.
- **`fetch-depth: 0` is part of the gate.** Without it `--since` cannot resolve
  the base ref and the check degrades quietly — a gate that breaks silently is
  worse than no gate.
- **We dogfood it in a separate job.** The `governance` job sits outside the
  `verify` matrix: gate coverage is a property of the repository, not of a Node
  version or an OS, so twelve runs would be twelve identical answers.

### Known state at acceptance

The gate **fails on this branch**, correctly: five `verified` documents are
grounded in `src/cli.js`, which this line changed, and they are awaiting the
human `reviewed_at` re-baseline that has been outstanding since 2026-07-30. This
is a true positive on day one — the re-baseline moves from a background chore to
a merge blocker, which is what a gate is for. Recorded here rather than softened,
because weakening a gate to make its first real finding go away is precisely the
failure this project exists to prevent.

### Scope boundary

Still open from Phase 0: the baseline measurement and the R3 no-automation list
(backlog 8), plus the human decisions (`impact --strict` as a default, run
manifest commit policy, adapter body language). Pilot-repo confirmation was
skipped by direction, so whether the three unconfirmed repos stay green when they
adopt these templates is **unmeasured**.

### Verification

424 tests pass (415 + 9 new, RED first). `lint` OK (59 files). The action's
argument builder was exercised directly for flag/command combinations, and each
resulting argument list was run against the real CLI to confirm none produces a
usage error (exit 3). `doctor` on this repo now reports `omission gate present`,
where it previously reported `1 found` for two invocations that only ever
inspected an empty scratch directory. Wiki docs updated in the same task and kept
`needs_review`. Unreleased — branch only.

## Measured Defect Batch Scope Decision (maintainer-approved 2026-07-31 — built)

### Why

The Gate Wiring decision above closed with an admission: pilot-repo confirmation was
skipped, so nobody knew whether the newly wired gate turns an adopting project's CI
red. It has now been run read-only against all four adopting repositories, and the
result is recorded in `HARNESS_GOVERNANCE_ROADMAP.md`. Two of the six defects that
measurement surfaced are small and unambiguous, and the maintainer approved fixing
them in this slice. Both were invisible from inside this repository: one needs a wiki
with a warning-level frontmatter finding, the other needs a document that has been
through an approval or a downgrade.

Each is pinned by `tests/measured-defects.test.js` (8 cases, RED before / GREEN after).

### Decisions

- **A report that says `pass` must not exit 1.** `validate-frontmatter` was the only
  command reporting a two-state ladder (`fail`/`pass`); every other command reports
  four (`blocked`/`fail`/`warning`/`pass`). So a run whose worst finding was a warning
  printed `result: pass` while `--strict` exited 1 on the very same findings, and the
  CI log read as "passed but failed" (measured in an adopting repo, on
  `frontmatter.duplicate_key`). It now uses the same ladder as everything else, and
  the JSON payload carries `result` the way the other commands do. **This is a change
  to a reported value**, not just a bug fix — two assertions in
  `tests/verification.test.js` pinned the old behavior and were updated with the
  reason written next to them. Exit-code semantics are unchanged: the report says what
  was found, `--strict` decides whether a warning gates the build.
- **The status tag and the status field are one fact, so one write must set both.**
  `review --approve` and `drift --downgrade` each rewrote `status:` and left `tags:`
  alone, so a document could sit at `status: verified` while still tagged
  `needs-review` — and which way it broke depended on which path did the downgrade.
  Measured in an adopting repo: **12 of 22 documents** carry the mismatch. Both paths
  now call one helper, `syncStatusTag`, deliberately conservative in two ways — it
  rewrites a status tag that is **already present** and never adds one, so documents
  whose tags do not track status keep their own convention; and it collapses the
  duplicate a rewrite can create (`[verified, needs-review]` must not become
  `[verified, verified]`). This does **not** widen what `review --approve` can promote:
  the approval gates are untouched, and an agent still must not run it at all.

### Scope boundary

Four measured defects stay open and are recorded as N-1, N-2, N-5 and N-6 in the
roadmap. **N-1 (hub-file fanout)** is the important one: `impact.source_changed`
matches per file, so one barrel file lights up nine or ten documents at once, seen
independently in two repositories. That is the practical cost of making
`impact --strict` the default (human decision 21), every mitigation is undesigned, and
guessing at one here would be worse than leaving it open. **N-2** (adapter marker
versions are never checked, so a v1 adapter passes audit forever) is the same item as
backlog 13 and belongs with the Phase 5 prerequisite. **N-5** (`reviewed_by` accepts
three spellings of one person) and **N-6** (`check-run` picks its manifest from the
working tree, so a local dry run does not predict CI) are queued behind them.

### The fix needed a fix: CodeQL caught a ReDoS in the new helper

`syncStatusTag`'s two inline-list patterns wrote `[^\r\n]*` before `\[`, which makes
the prefix and the opening bracket ambiguous — quadratic backtracking on input like
`tags:[[[[…`, and document bodies are exactly the uncontrolled input this helper runs
on. CodeQL flagged it as `js/polynomial-redos` (high) on PR #1; the local gates could
not have. Excluding `[` from the prefix class gives the bracket one possible position
and makes the match linear. Measured against the pre-fix pattern: 25k brackets 350ms,
50k 1692ms, versus under a millisecond after.

The regression test for it was **wrong on the first try and the measurement caught
that too**: the first hostile input carried no status tag, so the rewrite was a no-op
and the dedupe pass — where the vulnerable pattern actually lives — was never reached.
It passed against the unfixed source, which is the definition of a vacuous guard. The
committed version is confirmed RED against the unfixed source and GREEN with the fix.

### Verification

438 tests pass (429 + 9 new, RED first). `lint` OK (61 files). `validate --strict` 0,
`validate-frontmatter` 0, `drift` 0, and `impact --since origin/main --strict` 0 — run
against `origin/main` rather than local `main`, which is the trap PR #1 taught. Wiki
docs updated in the same task and kept `needs_review` pending human re-approval.
Unreleased — branch only.

## Shipped-Text Honesty Batch Scope Decision (maintainer-instructed 2026-08-03 — built)

### Why

The N-4 fix taught `review --approve` and `drift --downgrade` to sync the `tags:` status
tag. It did not teach either command to say so. Both kept printing, in the caveat block
of the very run that had just written the tag, that they touch ONLY the old field list —
`review --approve` claimed "ONLY status + reviewed_by + reviewed_at", `drift --downgrade`
claimed "status + last_updated only".

For a governance tool this is not a typo. The caveat block is where this product states
the boundary of its own write, and the boundary it stated was false. Nothing shipped
could see it: strings are not in `validate`'s scan surface, a post-merge working tree
gives `impact` no diff to read, and a same-day `reviewed_at` covers the date anchor
`evidence.stale` uses (N-9). **The maintainer's own approval run is what exposed it** —
the report claimed two or three writes and the diff carried three lines per document.

### Decisions

- **A command that writes must describe the write it performs.** All eight places were
  corrected together, not just the two the hand-off had catalogued: the `review` LIST
  caveat (also the MCP-exposed read-only surface), the `review` APPROVE caveat, the
  `drift --downgrade` caveat, both `helpText` lines, `COMMAND_HELP.review`,
  `COMMAND_HELP.drift`, and two code comments. The hand-off had missed the entire
  `drift` side — N-4 joined the two commands through one shared helper, so the
  aftershock landed on both.
- **The wording names the conditional, because the write is conditional.** `syncStatusTag`
  rewrites a status tag that is already present and never adds one, so every corrected
  string says "plus the `tags:` status tag when the document already carries one". A
  flat "and tags" would have been a second false statement in the opposite direction.
- **String assertions get a guard.** A test that greps for a sentence silently stops
  checking anything once that sentence moves. Each of the four new cases first asserts
  that the located statement really is the field enumeration, then asserts it names
  `tags`. All four are confirmed RED against the unfixed source.

### The same contract was restated fifteen times, and two rounds of fixing reached parts of it

This is the third pass over one fact. N-4 (2026-07-31) updated the `PUBLIC_API.md`
command table. The backlog-16 prototype then caught the prose in `domains/00_overview.md`
and `DOMAIN_FEATURES.md`. Neither pass reached the `## Evidence` restatement **inside
those same documents**, nor the shipped text. `DOMAIN_FEATURES.md` carried a Review Note
saying the stamp field list had been corrected while its own Evidence line was still
false. Final count: **8 places in source, 7 places across 5 wiki documents.** Backlog 16
(duplicate/conflict candidate detection) now has its strongest evidence, and this time a
human found it rather than a prototype.

### A second data point for the baseline false-positive rate

This batch's full diff fired `impact` on **11 verified documents**. Labelled by reading
each one: **5 true positives / 6 noise (TP 45%)**. The five (ARCHITECTURE_CONVENTIONS,
DOMAIN_FEATURES, PUBLIC_API, HARNESS_GOVERNANCE_ROADMAP, domains/00_overview) each held a
false or incomplete contract sentence; five of the six cite `src/cli.js` or
`src/commands.js` broadly and assert nothing that changed.

**The labeller was wrong once, in the direction of undercounting true positives.**
`domains/00_overview.md` was first called noise because its `review --approve` sentence was
already correct — but its `drift [--downgrade]` sentence omitted the same tag sync. N-4
joined the two commands through one helper, so the contract had to appear in both places.
Scanning a document for "the sentence this change is about" misses that; the random-30
labelling needs a rule that walks **every** contract sentence in the document. Recorded
next to the number, because a measurement whose labels can be wrong should say so.

The sixth noise case is the mechanically interesting one. `BENCHMARK.md` cites
`GATE_REVIEW.md#section:Impact Measurement Scope Decision` — a **section** anchor — and
what changed is a different section of that file (this one). `scanReverseImpact` drops the
locator and compares base paths, so the section never enters the decision. N-7 (line
ranges) and N-8 (directories) reported that root cause; this is the first evidence it holds
for **section** anchors too. Concretely: **one of this commit's seven noise findings
disappears if the locator is respected, and six do not** — they are pure path anchors,
unavoidable at file granularity. Note also that this finding exists because the batch
documented itself here: writing down the evidence enlarged the gate's blast radius.

This is the census of one commit rather than a random sample of the 332-finding baseline,
and the commit's nature (editing contract sentences) plausibly pushes TP upward — both
caveats are recorded next to the number in `HARNESS_GOVERNANCE_ROADMAP.md`. Decision 21
still needs the random-30 labelling.

### Verification

442 tests pass (438 + 4 new, RED first). `lint` OK (61 files). `validate-frontmatter` 0.

Measured **after** committing, which is the only honest place to measure it: `evidence.stale`
reads `git log`, so an uncommitted source change is invisible to it and both gates read 0
before the commit. After: **`impact --since origin/main --strict` 7 findings / exit 1** and
**`validate --strict` 6** — the documents labelled noise at that point, one of which
(`domains/00_overview.md`) later turned out to be a true positive; see the follow-up below.
(`00_overview` appeared in `impact` but not in `validate`: its `reviewed_at` is 2026-08-03,
so the date anchor covered it while the diff anchor did not. Another live instance of the
drift/impact complementarity.)

For the six genuine noise cases the content needs no change, so what remains is a
`reviewed_at` re-baseline, which is a human review act (precedent `52aa90b`);
`review --approve` refuses an already-verified document, so no tool path exists (a recorded
open defect).

### Follow-up the same day: the approval sweep reached outside the wiki, and nothing could see it

The maintainer restored the five downgraded documents to `verified`. The same edit also
flipped four files **outside** `docs/llm-wiki` — `adapters/README.md`, `rules/README.md`,
`templates/core/wiki-document.md`, `tests/fixtures/README.md` — each to `status: verified`
with **no `reviewed_by`/`reviewed_at` at all**. That violates the frontmatter contract this
product enforces on its users (`frontmatter.js:134`), and the full suite, `lint`,
`validate --strict`, and `validate-frontmatter --strict` all stayed green, because the scan
boundary is `docs/llm-wiki`.

The heaviest one is `templates/core/wiki-document.md`: the template that shows an adopter
what a new wiki document looks like, shipping (via `package.json` `files[]`) with
`status: verified` — the opposite of this product's central rule. Not a functional
regression: generation runs off `src/commands/doc-templates.js`, no source reads that
template file, and the generator still emits `needs_review`. It is the same failure mode as
N-10 itself — **shipped text saying something the product does not do.**

New guard `tests/shipped-assets.test.js` (2 cases, confirmed RED against the flipped state
before reverting): a template may never seed `verified`, and markdown outside the wiki scan
that claims `verified` must carry the review metadata. Scope is the **scan boundary**, not
the ship surface — so the unshipped `tests/fixtures/README.md` is covered too, while shipped
offenders are labelled `[SHIPS to npm]`. The shipped directory list is read from
`package.json` rather than hand-copied.

Reverting the four exposed that the remaining problem was `reviewed_at`: the flip wrote
`status` and `tags` only, so ARCHITECTURE_CONVENTIONS and PUBLIC_API became `verified` with
`reviewed_at: 2026-07-31` — earlier than the day's source change, which manufactured two
`evidence.stale` findings that did not exist while they were `needs_review` (gap 2:
freshness applies to `verified` only). `validate --strict` went 6 → 8. With the maintainer's
confirmation, `reviewed_at` was re-baselined to 2026-08-03 on the eight stale documents —
that line and nothing else.

### Verification (final)

444 tests (442 + 2), `lint` OK (62 files), and for the first time in this line **all four
gates green**: `validate --strict` 0, `validate-frontmatter` 0, `drift` 0,
`impact --since origin/main --strict` **0 / exit 0**. `verified` 19/52 (37%), health 79,
`stale_verified` 0. One document (`domains/00_overview.md`) is `needs_review` pending human
re-approval. The agent did not run `review --approve`. Unreleased.

## Harness Health Scope Decision (maintainer-approved 2026-08-03 — built)

### Why

The scan boundary is `docs/llm-wiki`, so the harness that produces those documents —
agent adapters, generated skill artifacts, the always-loaded context surface — is the
one thing this product governs nothing about. Two defects in the shipped tool make that
concrete, and both were reproduced before the command was written:

- `scanAdapters` (`src/commands/adapters.js`) checks only that an adapter file exists
  and that it mentions `docs/llm-wiki/index.md`. It never reads the adapter marker, so
  an adapter generated by an older version of this package passes `audit` as clean
  forever. Recorded as **N-2** in the roadmap.
- `init --refresh` compares artifact BODIES (`stripMarker(current) === stripMarker(next)`),
  not stamped versions. An artifact stamped v4 by a v5 generator is reported "already up
  to date" and is never re-stamped. Reproducible on this repository's own artifacts, and
  pinned by a test — so the day `--refresh` learns to compare versions, that test fails
  and the change is noticed instead of silently absorbed.

### Decisions

- **Ship `harness-health` alone; `fleet` waits for a reason to exist.** Decision brief
  J-27 in `HARNESS_GOVERNANCE_ROADMAP.md` put four options to the maintainer and
  recommended (b): the value of a multi-repository roll-up is entirely the value of the
  signal it rolls up, so the signal ships first and the roll-up gets approved later, on
  evidence, if the signal proves useful. `fleet` was **not** built. The rejected (c) —
  folding this into `audit --harness` — would have pushed a foreign category into a
  `--format json` shape and a `schemaVersion` that cannot change without approval, which
  is the more expensive decision, not the cheaper one.
- **Read-only (R0), deterministic, zero-dependency.** The command inspects harness files
  and reports. It never writes, never re-stamps, never promotes, and never invokes the
  generator; the same tree inspected twice gives the same answer. It observes the defects
  above rather than fixing them — fixing `--refresh` is a behavior change and belongs to
  its own decision.
- **Four rules, all warning by default, all toggleable.** `harness.marker_drift` (an
  adapter or skill stamped below the version this package ships), `harness.user_modified`
  (a skill artifact that no longer tracks the generator: no generation marker at all, or
  a marker its body no longer hashes to — `--refresh` keeps both and never updates them),
  `harness.preload_budget`, and `harness.skill_too_long`. `--strict` escalates them to
  error, and each is toggleable through `llm-wiki.config.json` `rules`: they are
  deliberately **not** in `NON_TOGGLEABLE_CATEGORIES`, which stays earned by `sensitive.*`
  alone. Warning-by-default keeps the additive `1.0.0` invariant — adding this command to
  an existing pipeline cannot turn it red.
- **The two size rules are inert until a human supplies the number.** They produce nothing
  until `--preload-budget <n>` / `--skill-token-cap <n>` or
  `"harnessHealth": { "preloadBudget": <n>, "skillTokenCap": <n> }` gives them one. This is
  deliberate: every size figure the command reports is the product's existing `chars/4`
  proxy (`estimateTokens`, `src/commands/retrieval.js`), never a measured token count, and
  it under-estimates non-English text. Shipping a default threshold would be this project
  publishing a number derived from the very proxy it forbids itself to make claims from.
- **"Hand-edited" is not decidable for an adapter, so the command does not decide it.**
  Adapters carry a version marker but no content hash. Diffing an adapter block against the
  shipped template would flag every intentional customization — this repository has two — so
  adapter rows report `userModified: null` rather than guessing. A missing adapter stays
  `audit`'s `adapter.missing` and is not re-reported here.
- **Additive surface only.** One command, two options, one config block, four finding rules;
  `schemaVersion` unchanged at `1`. Surface:
  `harness-health [--agent <agent>] [--preload-budget <n>] [--skill-token-cap <n>] [--strict] [--cwd <path>] [--format text|json|markdown|html] [--out <path>]`,
  JSON top level `schemaVersion`, `command`, `result`, `adapters[]`, `skills[]`, `preload`,
  `skillTokenCap`, `findingSummary`, `findings[]`. New leaf module
  `src/commands/harness-health.js` re-exported from the `src/commands.js` barrel, over three
  new read-only seams — `adapterMarkerVersion` (`src/commands/adapters.js`),
  `inspectSkillArtifact` and `skillArtifactPaths` (`src/commands/skills.js`). Registered in
  `src/cli.js` (COMMANDS, COMMAND_OPTION_RULES, COMMAND_HELP, usage list) and in the frozen
  `commands` map of `src/index.js`.
- **Not exposed over MCP**, consistent with `monorepo`, `impact`, `check-run` and `drift` —
  read-only commands that are nonetheless CLI-only.

### The measured false-positive baseline

Phase 1's completion condition is "a number or it is not done". Run read-only across five
real repositories: 91 artifacts inspected, 33 findings.

| Repository | Inspected | Findings | Rules |
| --- | --- | --- | --- |
| `llm-wiki-standard` | 26 | 13 | `marker_drift` 13 |
| `external-frontend-a` | 13 | 8 | `user_modified` 8 |
| `external-frontend-b` | 25 | 0 | — |
| `external-vue-quasar-app` | 20 | 5 | `marker_drift` 1, `user_modified` 4 |
| `external-project-c` | 7 | 7 | `marker_drift` 1, `user_modified` 6 |

All 33 were checked by hand: 3 adapters really are stamped v1 against a v2 template, 12 skill
artifacts really are stamped v4 against a v5 generator (and `--refresh` really does call them
up to date), and 18 artifacts really carry no marker anywhere in the file — grep returns zero
occurrences. **False positives: 0 of 33.** One repository returned a genuine zero, which is the
part worth keeping: a rule that never returns zero is not measuring anything.

Two limits ride with the number wherever it is quoted. **"True" means the reported fact is
correct, not that it is worth acting on** — whether a v4-stamped skill is worth re-stamping is a
judgment this command does not make. And **the run used this working tree's templates** (codex
adapter v2), which are not yet published; an adopter running the released `1.27.2` would see
fewer adapter findings.

### Scope boundary

`fleet` is out, per the decision above. Three further Phase 1 items are out as well and each
still awaits its own decision: promotion-bypass detection, the `needs_review` drift opt-in, and
bringing the root governance documents into scan scope. All three change what the product
**enforces** rather than what it observes, so none of them is decided by this gate.

### Verification

467 tests pass (451 + 16 new in `tests/harness-health.test.js`). `lint` OK (66 files). The CLI
command count goes 29 → 30. Unreleased — and the adapter template the baseline ran against is
itself unpublished, which is the second honesty limit above.

## Detection Defaults and Freshness Scope Decision (maintainer-approved 2026-08-03 — built, BREAKING)

### Why

Phase 0 ended with the omission gate wired into all four shipped channels and the rule
behind it still unable to fire on its own. `impact.source_changed` was a warning, so every
channel had to carry `--strict` before an omission could fail anything. It is the one rule
that catches what this tool exists for — **source moved, its documentation did not** — and
it was the **only detection rule a project had to opt into before it could fail a build**.
Every other category already blocked on its own errors without a flag.

The same measurement pass produced three items that belong in the same slice: a `check-run`
selection bug that makes a green local run stop predicting CI, a hole in the manifest
self-report that lets a run silence `run.doc_gap` by declaring nothing, and a freshness
scope that holds immutable release notes inside two checks they can never satisfy. A fourth
candidate was measured here and **declined**; it has its own section below, because a rule
that was recommended and then rejected on its own evidence is the more useful record.

### Decisions

- **`impact.source_changed` now defaults to `error`. This is a BREAKING change to the
  exit-code contract.** Before: warning, exit 0 unless `--strict`. After: error, **exit 1
  with no flag at all**. `--strict` is now a no-op for this rule, and the `strict` preset no
  longer lists it — an entry there would be a no-op too. **The ways back, which must appear
  wherever this change is documented:** set `"impact.source_changed": "warning"` (or
  `"info"`, or `"off"`) in `llm-wiki.config.json` `rules`, or use `rulesPreset: "relaxed"`,
  which keeps the rule at `info`. `relaxed` is now the only direction a preset can move it,
  and the only way an adopter recovers the previous behaviour without naming the rule.
  Stated plainly rather than softened: **an adopter who upgrades gets a red build on the
  first commit that changes source without touching a document that cites it.** That makes
  the next release a **SemVer MAJOR**. The version in `package.json` is **not** bumped in
  this change and **no tag is being cut**.
- **A bare `impact --since` step now counts as a gate in `doctor`.** The CI-governance line
  classified it as "NO omission gate" because it demanded `--strict`, which is exactly the
  flag decision 21 made unnecessary. `drift` and `check-run` still require `--strict`,
  because their rules are still warnings. **That asymmetry is deliberate and is pinned by
  tests** — it tracks blocking power, not command name, so it stays correct the day another
  rule's default moves.
- **`check-run` prefers git-TRACKED run manifests (defect N-6).** It used to pick the newest
  file on disk. In a repository that commits manifests, that is the one the agent has just
  written and not committed, while CI clones and picks the newest *committed* manifest — so
  a green local run stopped predicting CI, and **the divergence was silent**. Now, when git
  tracks at least one manifest, only tracked manifests are ranked. It is deliberately **not**
  tracked-only: a repository that gitignores manifests (this one, and one of the four
  adopters) tracks none, so it falls back to the on-disk set and gets a new INFO finding
  `run.manifest_untracked` saying a clean checkout would not see the selected file. Info and
  not warning **on purpose** — gitignoring manifests is a legitimate policy and `--strict`
  must not punish it; a tracked-only rule would also have broken this repository's own
  documented workflow (`AGENTS.md` line 75). The new helper `trackedPaths` (`src/git.js`)
  returns `null` (unknown) rather than an empty set outside a git repository, so **"no
  repository" is never mistaken for "tracks nothing"**.
- **New rule `run.change_set_undeclared` (warning) cross-checks the manifest's self-reported
  `changedSource` against git.** This closes half of gap 4 — the proposer and the verifier
  are the same party. A run that declared an empty `changedSource` made `run.doc_gap`
  **structurally unable to fire**, and nothing noticed. The comparison uses **tracked
  modifications only** (`git diff --name-only HEAD`), never the untracked set: the first cut
  included untracked files and immediately fired on `.obsidian/` editor config and a personal
  scratch note — measured on this repository, and corrected before shipping (new helper
  `modifiedTrackedFiles`, `src/git.js`). It is silent when git reports no changes at all,
  because that is indistinguishable from a run that was already committed, and it excludes
  `docs/llm-wiki/**` and `.llm-wiki/**` (those are the run's `touchedDocs` and its own
  bookkeeping). The remaining half stays open and is recorded as a known gap: **once a run
  is committed there is nothing left to compare against.**
- **Release notes are exempt from both freshness checks (decision 28).**
  `FRESHNESS_EXEMPT_DOC_TYPES` = `release_notes`, hardcoded rather than configurable,
  matching the only other per-path skip in the product (the append-only change log). It
  exempts **both** `evidence.stale` and `impact.source_changed`, and the OKF `type` spelling
  exempts too. **The brief's cost model is obsolete and this has to be said:** it assumed
  release notes were `needs_review`, so the exemption would only cap a new opt-in's cost.
  All 33 are `verified` now, so **the exemption REMOVES 33 of this repository's 52 documents
  from a check they are currently inside.** That is the right trade for two measured reasons.
  A release note is an immutable record of a release that already shipped and it anchors
  `package.json`, which changes on every release — so it goes stale permanently and can only
  be cleared by re-stamping a document nobody should be editing. And since decision 21 an
  unexempted release note **can fail a build** because unrelated source moved: **16 of the 23
  impact findings on this repository's own decision-21 commit were exactly that.** After the
  exemption this repository's impact count went **23 → 9, with zero release notes remaining**.
- **`--watch-needs-review` is opt-in, `drift`-only, and off by default (decision 28).** It
  widens date-anchored freshness to `needs_review` documents. It deliberately does **not**
  widen `impact`: that rule is an error now, and an advisory opt-in must never let an
  unreviewed document fail a build. The exemption outranks the opt-in — an exempt document
  stays exempt with the flag on.

### The counter-argument, kept on the record

Decision 21 was taken with an unfavourable measurement in hand, and it is recorded next to
the decision rather than in a footnote. The **baseline false-positive rate for
`impact.source_changed` was measured at 27% or 57%**, depending on a single policy call that
is **still unmade**: whether a shifted line anchor counts as a true positive. And **a single
hub file fans out to as many as 14 findings** (N-1), because the rule matches per file and
every document citing that file lights up at once. The maintainer defaulted the rule to
error **with those numbers known**. The reasoning on the record is that the alternative is a
detection rule nobody turns on, and the documented ways back above are the mitigation — not
a claim that the noise is gone.

### Decision 24: measured, and declined

The recommendation was "adopt at warning, **CONDITIONAL** on measuring the retroactive firing
volume first". The measurement was run and **the condition failed**, so the rule is **NOT
SHIPPED**.

The rule as specified: a `verified` document whose promotion commit did not also change
`reviewed_at`. Run across **5 repositories, 129 verified documents: 42 fire (32.6%), and 0 of
the 42 are a live promotion bypass.** They decompose entirely into two benign shapes — **33**
where the review stamp arrived in the very next commit, and **9** where `reviewed_at` is
date-granular, so a same-day demote-and-re-approve is indistinguishable from an untouched
stamp. **38 of the 42 come from just 5 bulk commits**, and **19 of the 42 predate the
existence of the `review` command entirely** — there was no tool path to bypass.

An existing rule already covers the state that would survive: `frontmatter.verified_review`
fires when a verified document carries no review metadata, and it is **green on all 129**. So
the new rule would have added 42 findings on top of a check that already reports clean — a
governance rule whose entire first-day output is history is a rule that teaches people to
ignore findings.

The measurement does point somewhere: a narrower rule that fires when `reviewed_at`
**predates** the promotion commit isolates the single genuine candidate found in the whole
corpus. That is left as its own future decision, on this evidence, rather than folded in
here.

### Scope boundary

Not in this slice and each still awaiting its own decision: the narrower promotion-bypass
rule the decision-24 measurement points at; the remaining half of gap 4 (a committed run has
nothing left to compare against); a mitigation for N-1 hub-file fanout, which decision 21
makes more expensive, not less; and the line-anchor policy call the 27%/57% spread hangs on.
The doc-only decisions of the same day are recorded in the next section.

### Verification

**491 tests pass (was 477)**, `lint` OK (70 files). The `doctor` asymmetry (`impact` counts
without `--strict`, `drift` and `check-run` do not), the tracked-manifest preference, the
untracked-file exclusion in `run.change_set_undeclared`, and the release-notes exemption are
each pinned by tests rather than left to the next reader's judgment.

**Unreleased. No version bump and no tag are part of this change** — decision 21 makes the
next release a SemVer MAJOR, and that release is a separate decision.

## Doc-Only Decisions (maintainer-decided 2026-08-03 — recorded, no code change)

Five decisions of the same day that resolve to a recorded sentence rather than a code change.
They are written down here so they stop being carried as open questions.

- **20 — the agent-layer package split stays DEFERRED until Phase 2 starts.** Recorded as
  **decided-deferred, not open**: nothing is waiting on an answer, and the trigger is the
  start of Phase 2 rather than a date.
- **25 — create a false-positive REPORTING path for the sensitive-info rules, and do NOT add
  an exception mechanism.** The safety line stays whole: `sensitive.*` remains non-toggleable
  and gains no suppression. What is approved is a way to *report* a false positive, not a way
  to wave one through. Also recorded: **who may declare an exception, if one is ever added** —
  in this repository governance actions are performed by an agent, so an unqualified "declare
  an exception" would inherit the self-approval problem the wiki exception is carefully scoped
  around. Newly relevant fact behind the urgency: **a sensitive false positive now blocks
  twice.** `validate` exits 2, and it also blocks the self-approval step that `AGENTS.md`
  makes mandatory — so a batch cannot be closed at all.
- **26 — adapter bodies are English regardless of `--doc-lang` / `docLanguage`.** Stated in
  one explicit line rather than left implied by the option's documented scope.
- **29 — this line's automation ceiling is R0.** The wiki self-approval is a **declared
  exception**, scoped to `docs/llm-wiki/` and to the tool path (`review --approve*`) — it is
  **not** a relaxation of the ceiling and must not be cited as precedent for one.
- **30 — the roadmap joins the Recommended Read Order in `docs/llm-wiki/index.md`.**

## Version-Only Manifest Scope Decision (maintainer-approved 2026-08-04 — built)

### Why

Decision 21 (2026-08-03) made `impact.source_changed` an error by default. The first release
commit after it exposed a cost that repeats forever: a release commit changes `package.json` by
definition, and **10 of this repository's 18 non-exempt `verified` documents cite that file**, so
the gate fires on documents whose claims did not move. The 1.28.0 release commit paid it in
advance by carrying all of them in the same commit — the cost did not disappear, it moved earlier.
Roadmap item 45 (N-13) held three options; the maintainer chose (c).

### Decisions

- **A `package.json` whose diff moves nothing but `version` is not a source change for
  reverse-impact.** It is still counted in `changed_files`; it is withheld from the set used for
  anchoring. Summary prints `anchoring_files` and the excluded paths; `--format json` gains an
  additive `versionOnlyExcluded[]`. A silent exclusion was rejected outright — a count that drops
  for an unstated reason is the same failure this repository has already shipped twice.
- **The filter lives in `impactCommand`, not in `changedFiles`.** Narrowing the shared primitive
  would silently narrow `validate --changed`'s scope and `prepare`'s working-tree hint, whose
  contract is "files that differ from the baseline". `scanReverseImpact` cannot host it either: it
  receives `(cwd, changedSet)` and never sees `--since`, so it cannot read the before side.
- **Conservative in every direction.** Anything the predicate cannot prove is version-only stays
  in the change set: an unparseable side, a `version` field added or removed rather than changed, a
  manifest with no baseline blob (new/untracked, or git unable to read the ref), a deleted
  working-tree file, or a version that did not actually move (a reformat or a line-ending
  conversion is not a version bump and must not be reported as one).
- **The comparison is order-sensitive.** The first implementation compared parsed objects with
  `isDeepStrictEqual`, on the stated ground that "key order is not semantic in JSON". True of
  JSON, **false of `package.json`**: Node matches conditional `exports`/`imports` in key order,
  so `{node, default}` and `{default, node}` resolve to different files. An adversarial review
  demonstrated a version bump plus an `exports` reorder being silently withheld from anchoring —
  the one change that decides what every consumer imports. Fixed before this decision shipped in
  its corrected form: the rest is compared as `JSON.stringify` output, which keeps order
  significant while still ignoring indentation, a BOM, and line endings.
- **Nested manifests need a declared workspace.** Basename matching alone also captured test
  fixtures, samples and vendored copies, where a `version` value can BE the content under test
  (demonstrated on a fixture going `0.9.0` → `2.0.0`). A nested `package.json` is now eligible
  only when the root manifest declares `workspaces` and the path sits under one of the declared
  globs' literal prefixes. The root manifest is always eligible.
- **`package.json` only**, matched on basename so monorepo workspace manifests behave the same.
  `pyproject.toml` and `Cargo.toml` would need a parser; the zero-dependency invariant is worth
  more than the symmetry.
- **(a) and (b) rejected, and why.** (b) dialing the rule down per project would drop the block for
  ALL source changes — the one true positive the gate caught in 1.28.0 (`VERSIONING.md`) would have
  been buried with the noise, and a repository that sells this gate turning it off only for itself
  is not a defensible shape. (a) re-reviewing the fanout every release writes "unchanged" notes
  into a per-document 5-entry cap, forcing an archive rotation every release and making the gate a
  rubber stamp — which the roadmap's own rule ("a check nobody can act on becomes noise") forbids.

### The numbers, corrected

Roadmap item 45 recorded "11 documents"; a re-measurement against the tree corrected it. That
figure holds only for one definition of a release commit — the eight version-bearing files
(`package.json`, CHANGELOG ×2, README ×2, ROADMAP ×2, the pinned action). The actual `88bf8cc`
commit impacted **0** (16 wiki documents were in the same change set, so self-exclusion covered
them); the counterfactual without those wiki updates is **14**; a `package.json`-only diff is
**10**. Effect of this change: 10 → **0** for a manifest-only diff, 11 → **4** for the
version-bearing set, 14 → **10** for a release commit that also touches `src/cli.js`.

**This does not reach zero, and the claim is not made.** The documents that survive cite
`README.md` / `ROADMAP.md` / the action — files whose CONTENT really changed — so they are closer
to true positives than to noise. The remaining problem is anchor BREADTH (a document citing a file
it only loosely depends on), and the answer to that is per-document judgment, never deleting
citations to quiet a gate, which the rule's own remediation text warns against.

**N-7 is not a cheap follow-up** (verified 2026-08-04, correcting an earlier claim in this
repository's own notes): `#symbol:` is a presence floor, not an AST resolver, and `#section:` only
checks that a heading exists, so neither knows the line range a symbol occupies and neither can
answer "did this symbol change in this diff". Every precise anchor on the affected documents is
`#symbol:` or `#section:` — there is not one line locator among them — so implementing N-7 in that
shape would resolve **zero** of them.

### Scope boundary

`evidence.stale` (drift) is date-anchored: it asks when a file changed, not what changed in it, so
it does not share this path and was not touched. `validate --changed`, `prepare`'s working-tree
hint, `check-run`'s `run.change_set_undeclared` (which uses `modifiedTrackedFiles`) and `run.doc_gap`
(which uses the manifest's own declaration) are all unchanged. The exclusion is hardcoded, not a
config key — like the release-notes exemption of decision 28.

### Verification

`lint` OK (71 files). `tests/impact-package-version-only.test.js` holds **17 tests**; the first
nine shipped with the implementation (RED confirmed: 6 failed, the 3 that already passed are the
conservative-fallback fence), and eight more closed holes an adversarial review found in the fence
itself. Live proof on this repository rather than a fixture: a working-tree version-only bump gives
`anchoring_files: 0 (version-only manifest excluded: package.json)` and `impacted_verified_docs: 0`;
adding one non-version key to the same manifest gives **10 findings** and a failing result.

**The first fence was weaker than the commit that shipped it claimed**, and the corrections are the
substance of this entry. Mutation testing showed four holes: the `--since` test could not tell
`sinceRef` from a hardcoded `HEAD` (its fixture made the two identical, so a real `engines` change
went unreported against a base several commits back); the "filter lives in `impactCommand`" decision
had no assertion at all, and moving the predicate into `changedFiles` passed all 501 tests while
silently narrowing `validate --changed`; the output test matched unconditional caveat boilerplate,
so deleting the summary line still passed; and the `package.json`-only promise had no negative case.
All four are now pinned, plus the order-sensitivity and workspace-scoping fixes above, a deleted
manifest, and the payload shape of the git-unavailable branch. The file also guards its own imports
at load time: `hasGit()` swallows every throw, so a missing import turned all nine tests into
`# skipped 9` with exit code 0 — green locally and green in CI while testing nothing.

`tests/impact-default-gate.test.js`'s prose census called itself "a census over the shipped
surfaces" while reading three files under `src/`. It now reads fourteen surfaces including both
READMEs, `docs/OPERATIONS.md`, `GATE_REVIEW.md`, the two shipped templates, the composite action and
the CI workflow, with a pattern that catches "`--strict` is what makes it block" as well as
"`--strict` makes it fail". Extending it immediately found two more stale claims that the first pass
had missed — `docs/OPERATIONS.md` telling the reader `--strict` is load-bearing four lines above the
section rewritten to say it is not, and the same claim in this file's CI-wiring decision — and the
composite action's input description implying `strict: true` was required for the gate. The census is
sentence-scoped, because a Markdown bullet routinely covers `impact` in one sentence and
`drift`/`check-run` — which DO still need `--strict` — in the next; a sentence naming both is skipped,
which is a known hole and the reason the line-scoped version produced a false positive on the very
sentence stating the deliberate asymmetry.

Also corrected: the Gate 23 approval row and its two "never default error/blocked" invariants now
carry SUPERSEDED markers pointing at decision 21, because `help impact` sends readers into that
section and it asserted the opposite of shipped behaviour.

**Unreleased. No version bump and no tag are part of this change.** `audit` and `validate --strict`
are NOT at zero and this entry does not claim they are: two errors come from another agent's
untracked document under `docs/llm-wiki/` (absent in CI, which clones) and two `evidence.stale`
warnings sit on documents that `review` structurally cannot re-stamp (defect N-14, roadmap item 46).
`impact --since HEAD~1 --strict` is at zero.

## Template Scope Decision (N-14, 2026-08-06)

`review` and the freshness gates disagreed about which documents exist. `review` loads content docs
through `listWikiContentDocs`, which excludes `/templates/`; `validate`, `drift`, and `impact` walk
`listTargetMarkdown`, which is all of `docs/llm-wiki`. A verified template could therefore be
reported as stale with **no way to clear the finding**: downgrading it returned nothing,
`--approve-all` skipped it while reporting `needs_review_remaining: 0`, and naming it explicitly
answered `not found under docs/llm-wiki` about a file that is plainly inside `docs/llm-wiki`. The
entry above recorded exactly this on the 1.29.0 line, and the adopter-facing CHANGELOGs shipped it
as a known issue rather than covering it up.

**Decision: options (c) + (b) from roadmap item 46, the recorded recommendation.** Templates are
skeletons an adopting repository copies, not documentation of the repository they sit in, so they
are not review targets — and it follows that they must not be freshness targets either.
`isTemplateDoc` is now exported from `wiki-files.js` and `scanEvidenceDrift` / `scanReverseImpact`
skip on it at the top of their loops, using the **same predicate** `review` already filtered on.

**Not merged into one enumerator, deliberately.** Unifying them would make templates promotable,
which breaks the boundary in the opposite direction. Two enumerators with a shared predicate keeps
the boundary while making it impossible for the two answers to drift apart again.

**One adjacent defect fixed in the same batch.** The append-only log was skipped by `--approve-all`
but *stamped verified* when named explicitly — the same boundary with two answers. Both paths now
refuse it.

**Measured, and not overstated.** This repository's `evidence.stale` count goes **7 → 5**. The two
that disappear are precisely the templates with no resolution path; the remaining five are ordinary
post-release drift that a re-baseline clears. It is not a change that reaches zero and it is not
meant to be. `tests/template-scope.test.js` pins the behaviour in six tests whose fixture contains a
non-template sibling with byte-identical frontmatter as a control, so the tests fail rather than pass
vacuously if the gates stop firing for any reason other than the path. RED was confirmed per test,
not as a file-level crash: with the predicate present and the two call sites reverted, four fail and
two pass (the not-found control and the predicate unit test are expected to pass either way).

**Shipped as 1.29.1 (2026-08-06) — a PATCH.** The earlier note in this section read "MINOR rather
than PATCH is the conservative read"; the decision went the other way, and the reasoning is recorded
here rather than left as a version number nobody can account for. `VERSIONING.md` puts "버그 수정,
메시지/출력 다듬기" under `patch` and reserves `minor` for a backward-compatible new command, option,
or feature expansion. This release adds none: no command, no option, and — checked against the diff,
not the intent — no field in any report or `--format json` payload. The 1.29.0 precedent points the
same way instead of the opposite way, because that release was sized MINOR *for* the two fields it
added to `impact`'s output (`anchoring_files`, `versionOnlyExcluded[]`), which this one has no
counterpart to. And the observable behaviour moves in the permissive direction only: a finding stops
firing, so an exit 1 becomes an exit 0. Nobody's build newly breaks, which is precisely the asymmetry
that forced 1.28.0 to be recorded as an exception to this policy.

**What PATCH costs, stated.** Two capabilities are gone with no flag to restore them: naming the
append-only log to `review --approve <path>` no longer stamps it (it never should have), and a
project that wants documents under `docs/llm-wiki/templates/` freshness-checked cannot ask for it.
Both are intended, and neither is a contract this repository published.

## Release Caveats

- `migrate --apply` was blocked in shipped releases through `1.1.0`. Gate 8 (above)
  unblocks it for `1.2.0` under the accepted `fix`-engine scope; broader migration
  (Tier B fields, path repair, `verified` edits, status changes) stays out of scope.
- `fix` writes only the accepted scope above; broader autofix (Tier B fields, path repair, enrichment, status downgrade) stays out of scope until separately accepted.
- `validate` reuses audit coverage rather than separate layered validators.
- YAML parsing covers the standard frontmatter subset only.
- Antigravity adapter handling remains suggested/info-only until the tool contract is confirmed.
