> Language: [English](./CHANGELOG.md) | [한국어](./CHANGELOG.ko.md)

# Changelog

All notable changes to `llm-wiki-governance` (formerly `@dowonk-7949/llm-wiki-standard`)
are documented here. This project follows [Semantic Versioning](https://semver.org/).
Entries are newest-first.

## 1.29.2 — 2026-08-18

Adds the fourth lever to the token discipline the generated prompts carry: a **delegation budget**.
`contextBudget` (1.27.1) decides how much gets read; this decides **who** reads it — the sweep that
locates and scopes belongs in a cheap, disposable context that hands back a brief, while the judgment
and the prose stay with the agent holding the reasoning.

### Added

- **The recurring write workflows and `bootstrap` now carry a delegation budget.** `delegationPolicy()`
  in `src/task-prompts.js` is a pure, exported block joined immediately after `contextBudget()` in
  `feature` / `fix` / `refactor` / `docs-sync`, and inside `initialEnrichmentWorkflow()` (shared verbatim
  by `bootstrap` and `handoff`). It states four things: locating and scoping **is** dispatchable — take
  back a brief (findings, `file:line` evidence, what stayed unconfirmed), not the raw material; judgment
  is **not** — the design decision, the regression call, the edit, and the wiki/log prose stay put,
  because a cheaper agent can apply text you already wrote but cannot write the sentence that explains
  why; mechanical finishing **is** — the checks, the run manifest, applying edits already decided; and
  the economics — dispatch only when it pays, a delegate that hands back the raw material has bought
  nothing, and **delegation never buys an unverified claim** (either the delegate reads the actual source
  and reports the evidence, or you do).

- **The block is agent-neutral by contract, not by accident.** The generated artifact body is one shared
  text rendered into every skill format (Claude / Codex / Cursor / neutral, built with `agents: []`), and
  `initialEnrichmentWorkflow()` embeds it inside the chunk pinned as a verbatim substring of both
  `bootstrap` and `handoff`. A first draft gated a Claude-specific sentence on `agents` and leaked it into
  the neutral prompt and the Cursor rule, because `buildTaskPrompt` widens an empty `agents` list to
  `["codex", "claude"]`. Naming a specific harness belongs in that harness's adapter under
  `templates/adapters/`; `tests/agent-token-discipline.test.js` now pins that no argument changes the text.

- Read-only scoping (`onboard`, `prepare`) and the format conversion (`okf-extract`) deliberately do **not**
  carry it: there the delegated reading *is* the task, so the block would be noise.

### Changed

- The 16 managed skill artifacts for the four delegating tasks were refreshed
  (`init --write --refresh --skills`). The `onboard` / `prepare` artifacts came back byte-identical, which
  is the check that the block landed only where it was meant to.

**The cost, stated plainly:** each affected skill body grows about 30% (`fix` proxy 1077 → 1406,
`bootstrap` 1171 → 1501 — a `chars/4` proxy, not a measured token count). It is the same trade as 1.27.1:
a fixed instruction cost paid to bound what execution pulls in. For an adopter who never dispatches, it is
pure cost.

## 1.29.1 — 2026-08-06

Resolves the known issue 1.29.0 shipped with (**N-14**): the freshness gates flagged documents
`review` structurally cannot re-stamp. Two enumerators disagreed — `review` loads content docs
through a helper that excludes `docs/llm-wiki/templates/`, while `validate`, `drift`, and `impact`
walk all of `docs/llm-wiki` — so a verified template could be reported stale with **no way to clear
it**. Scope is recorded in `GATE_REVIEW.md` under *"Template Scope Decision (N-14, 2026-08-06)"*.

### Changed

- **`drift` and `impact` no longer flag documents under `docs/llm-wiki/templates/`.** Templates are
  skeletons an adopting repository copies, not documentation of the repository they sit in, so they
  are not review targets — and it follows that they must not be freshness targets either. This
  matters most for `impact.source_changed`, which is `error` by default: an adopter keeping
  documents under `docs/llm-wiki/templates/` could get a **failing build with no remedy**. The
  predicate is the one `review` already filtered on (`isTemplateDoc`), shared rather than
  duplicated, so the two answers cannot drift apart again.

- **`review` states the boundary instead of denying the file exists.** Naming a template explicitly
  used to answer `not found under docs/llm-wiki` — false, and it sent people hunting for a typo.
  It now refuses with the scope as the reason. The same applies to the append-only log, and there
  the behaviour changes: `--approve-all` always skipped it, but naming it explicitly **stamped it
  verified**. Both paths now refuse it.

Measured on this repository: `evidence.stale` goes **7 → 5**. The two that disappear are exactly the
templates with no resolution path; the rest is ordinary post-release drift that a re-baseline clears.
This does not reach zero and is not meant to.

**Why this is a PATCH.** No command, option, or report field is added or removed — the content is two
defect fixes plus the caveat and refusal text that states the boundary. That is the `patch` row of
`docs/llm-wiki/VERSIONING.md` verbatim; 1.29.0 was a MINOR because it *added* `anchoring_files` and
`versionOnlyExcluded[]` to `impact`'s output, and this release adds nothing of the kind. Behaviour
moves in the permissive direction only — a finding stops firing, so an exit 1 becomes an exit 0 — so
no consumer's build can newly break, which is exactly the asymmetry that made 1.28.0 an exception.
The cost is stated rather than smoothed over: `review --approve <path>` on the append-only log no
longer stamps it, and there is no flag to put templates back under the freshness gates.

## 1.29.0 — 2026-08-05

One change, and it exists because the gate 1.28.0 turned on fired on the commit that shipped it.
A release commit changes `package.json` by definition, and ten non-exempt `verified` documents in
this repository cite that file — so every release produced a fanout of findings nobody could act
on, from a rule that now fails a build with no flag. `llm-wiki impact` no longer anchors on a
manifest whose diff moves **nothing but the `version` value**. The file is still **reported as
changed**; it is simply not used to decide which documents are impacted.

Filed as N-13 in `docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md` chapter H, where the two rejected
alternatives are priced next to it; this is option (c), the maintainer's decision on 2026-08-04.
Scope is recorded in `GATE_REVIEW.md` under *"Version-Only Manifest Scope Decision"*.

### Changed

- **`impact` no longer anchors on a version-only `package.json`.** Nothing else about the rule
  moves: it is still `error` by default, `--strict` is still a no-op for it, and `release_notes`
  are still exempt. Only the change set the rule anchors against is narrower.

  **Conservative in every direction.** Anything the check cannot *prove* is a version bump stays in
  the change set and still counts: any other key moving, a `version` field added or removed rather
  than changed, a `version` that did not actually move (a reformat or a CRLF conversion is not a
  version bump and must not be reported as one), an unparseable manifest on either side, a manifest
  with no baseline blob to compare against (new, untracked, or a ref git cannot read), a deleted
  working-tree file, and a nested manifest in a repository that declares no workspaces.

  **The comparison is order-sensitive, and that is not pedantry.** Node resolves conditional
  `exports` / `imports` in **key order**, so `{node, default}` and `{default, node}` load different
  files. Everything but `version` is compared as a `JSON.stringify` string, which keeps order
  significant while still ignoring indentation, a BOM, and line endings — those genuinely carry no
  meaning here.

  **Scope: `package.json` only.** The root manifest always, and a nested one only when the root
  declares `workspaces` and the path sits under the literal prefix of one of its globs — matching
  on basename alone would swallow test fixtures, samples, and vendored copies, where the `version`
  value may be the thing under test. Never `pyproject.toml` or `Cargo.toml`: those need a parser,
  and the zero-dependency invariant is worth more than the symmetry.

  **`drift` is unchanged, deliberately.** `evidence.stale` is date-anchored — it asks *when* a file
  changed, not *what* changed in it — so a version-only bump still flags every document citing the
  manifest there. The exclusion is `impact`'s alone.

### Added

- **`anchoring_files` in every `impact` report**, printed next to `changed_files`, with the excluded
  paths named inline (`anchoring_files: 23 (version-only manifest excluded: package.json)`). A
  silent exclusion was ruled out at design time: this project has twice shipped text that ran ahead
  of behaviour, and an invisible carve-out is the same failure in the other direction.
- **`versionOnlyExcluded[]` in `impact --format json`** — additive, and a matching sentence in the
  command's Caveats block.
- **`fileAtRef(cwd, ref, relPath)` in `src/git.js`** — the stored content of a path at a ref
  (`git show <ref>:<path>`), because a decision about whether a change is *meaningful* needs the
  before side of the diff, which `changedFiles` (names only) cannot supply. A failure returns
  `null` meaning "unknown", never "the file was empty": a bad ref and a path absent at that ref both
  exit 128 and `runGit` discards stderr, so the two cannot be told apart, and callers fail closed on
  that distinction.

### Honesty note

**It does not go to zero, and the numbers are measured, not estimated.** A `package.json`-only diff
goes from **10 findings to 0**. Across the eight version-bearing files a release actually touches,
it goes from **11 to 4** — and this release commit measured exactly **4**, every one of them citing
`README.md` or `.github/actions/validate/action.yml`, whose contents genuinely changed. Those four
are closer to true positives than to noise, and they were resolved by re-reading the documents, not
by re-stamping them: three carried a claim that had gone stale and were edited. Resolving them then
raised **one second-order finding** — the review-notes archive cites the documents that were just
edited — so the honest count for this commit is five findings handled, not four. Fanout in a wiki is
not one hop from source to document.

**The first implementation was wrong in three ways, and one of them had already been written into
shipped documentation as a fact.** Adversarial verification before release caught: the order-blind
comparison above (justified in six wiki documents by "key order carries no meaning in JSON" — true
of JSON, false of `package.json`); an exclusion that fired when `version` had not changed at all;
and a basename match that reached manifests that were not manifests of record. All three are fixed
and fenced. The wiki sentences that asserted the false premise were corrected — except one, in the
N-13 entry itself, which survived that sweep and was found only when this release's gate flagged
the document again. Stale claims are found by the next gate firing, not by the batch that made them.

**The fence was weaker than the claim it was protecting.** Mutation testing found four holes in the
first test set — a `--since` test whose fixture made `sinceRef` and a hardcoded `HEAD`
indistinguishable, zero assertions pinning the decision that the filter lives in `impactCommand`
rather than in the shared `changedFiles` primitive, an output assertion matching a caveat that
always prints, and no negative case for "`package.json` only". **9 tests → 17.** Separately, a
prose census in `tests/impact-default-gate.test.js` commented that it covered the shipped surface
while reading three files under `src/`; widened to fourteen surfaces it immediately found two more
stale claims, in `docs/OPERATIONS.md` and `GATE_REVIEW.md`.

**Known issue, unfixed (N-14).** `review` enumerates documents through a helper that excludes a
`templates/` subdirectory of the wiki, while `validate` / `impact` / `drift` enumerate everything.
A document under `docs/llm-wiki/templates/` can therefore be flagged by a gate and has **no
promotion or re-stamp path** — downgrading one drops it out of the approval list and reports
`needs_review_remaining: 0`. Two documents in this repository sit in that state on purpose, left
there rather than papered over. Recorded as roadmap item 46; adopters with wiki documents under a
`templates/` directory hit the same trap.

## 1.28.0 — 2026-08-03

**Read the Breaking section before upgrading.** This release turns the omission gate on by
default: `llm-wiki impact --since <ref>` now fails a build with no flag at all. By SemVer that
is a MAJOR; it ships as a **MINOR by the maintainer's explicit decision**, which means a project
depending on `^1.27.2` **picks it up automatically**. There are two documented ways back, both
config-only — put one in place *before* upgrading if you are not ready for the gate.

Otherwise: the four channels this project ships (pre-commit hook, workflow template, composite
action, our own CI) finally run the gate they were selling, the v2 adapter shape reaches the seven
adapters it missed in 1.27.2, a new read-only `harness-health` inspects the agent harness itself,
and eight detectors that could see but could not report are connected. Scope decisions are recorded
in `GATE_REVIEW.md` ("Phase 0 Gate Wiring", "Phase 0 Defect Batch", "Monorepo CLI Contract Parity")
and in `docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md` chapter J.

### Breaking

- **`impact.source_changed` is now an `error` (was `warning`).** `llm-wiki impact --since <ref>`
  exits **1 with no flag**, and `--strict` is a **no-op** for this rule. In practice: after
  upgrading, the first commit that changes source without touching a document citing it turns the
  build red. It was turned on because it is the only rule that catches the omission this tool
  exists to catch, and the only detection rule a project had to opt into before it could block.

  **Two ways back**, per project, neither a code change:

  ```json
  { "rules": { "impact.source_changed": "warning" } }
  ```

  `"warning"` (or `"info"` / `"off"`) in the `rules` map of `llm-wiki.config.json` restores the
  advisory behaviour. Or:

  ```json
  { "rulesPreset": "relaxed" }
  ```

  which holds the rule at `info`. An explicit `rules` entry still beats the preset. The `strict`
  preset no longer lists the rule, since escalating an error is a no-op; the preset invariant was
  restated from "never touch an error-or-blocked default" to "never touch a safety rule or anything
  that blocks", with an explicit allow-list (`PRESET_DIALABLE_ERROR_RULES`) for error defaults a
  preset may dial.

  **On the record:** this rule's baseline false-positive rate was measured at **27% or 57%**
  depending on one policy call that is still unmade (whether a shifted line anchor counts as a true
  positive), and a hub file cited by many documents fans out to as many as **14 findings**. On the
  commit that enabled it, the gate produced **6 findings of which 1 was actionable**. The default
  was turned on with those numbers known.
- **`doc_type: release_notes` documents are exempt from `evidence.stale` and
  `impact.source_changed`** (OKF `type: release_notes` too). A release note is an immutable record
  of a release that already shipped, and it anchors `package.json`, which changes every release —
  so without this the new default would fail builds on documents nobody should edit. State the cost
  plainly: this **removes documents from a check they were previously inside** (33 of 52 here), and
  a release note will no longer be flagged when the source it cites moves. On the enabling commit
  it took the finding count from 23 to 9.
- **`monorepo` validates its options like every other command.** It was the only command missing
  from the option and help tables, so `monorepo --strict --write` exited 0 while silently ignoring
  the option, and `help monorepo` answered "Unknown help topic". Accepted set, derived from the code
  path rather than from documentation: `--cwd`, `--strict`, `--agent`, `--format`, `--out`.
  `--write`, `--apply`, `--type`, `--profile` and anything else now **exit 3**. No JSON shape,
  frozen `commands` entry, MCP tool, or programmatic export changed.
- **`validate-frontmatter` reports on the four-state ladder** every other command uses. A run whose
  worst finding was a warning printed `result: pass` and exited 1 on the same findings — which in a
  CI log reads as passed-but-failed.
- **`review --approve` refuses an unenriched scaffold** (`content.not_enriched`), matching on the
  rule id rather than on severity. That rule is a warning, so previously whether a placeholder
  document could be stamped `verified` depended on whether the operator happened to pass `--strict`.
  Stale evidence and broken links are still approvable — those are what a reviewer signs off on.
- **`check-run` selects the manifest by its own `timestamp` field**, not by the lexicographically
  last filename. Manifests are named `run-<task>-<timestamp>`, so the task name beat the timestamp:
  measured here, the newest was a 2026-07-30 feature run while `check-run` inspected a 2026-07-27
  fix run and reported pass — the worst failure mode for a completion gate.

### Added

- **`llm-wiki harness-health [--agent <agent>] [--preload-budget <n>] [--skill-token-cap <n>]
  [--strict]`** — the 30th command, and the first that inspects the **harness** (agent adapters,
  generated skill artifacts, the always-preloaded context surface) rather than the wiki. Read-only,
  deterministic, zero-dependency, writes nothing; CLI-only (not exposed over MCP, like `impact` /
  `check-run` / `drift` / `monorepo`). Four toggleable rules, all `warning` by default and `error`
  under `--strict`: `harness.marker_drift` (an artifact stamped below the version this package
  ships), `harness.user_modified` (a skill artifact that no longer hashes to its own marker, or
  carries none), `harness.preload_budget` and `harness.skill_too_long` (both **silent until you
  supply a number** via the flags or `"harnessHealth": { "preloadBudget": <n>, "skillTokenCap":
  <n> }` in config). It exists because of two defects confirmed in the shipped tool: `scanAdapters`
  never reads the adapter marker, so an adapter generated by an old version passes `audit` clean
  forever; and `init --refresh` compares artifact *bodies*, not stamped versions, so a v4-stamped
  artifact from a v5 generator reports "already up to date". Adapters report `userModified: null`
  on purpose — they carry a version marker but no content hash, and diffing against the shipped
  template would flag every deliberate customization.
- **`drift --watch-needs-review`** (off by default, accepted by `drift` only) widens the
  date-anchored freshness check to `needs_review` documents as well as `verified` ones. It
  deliberately does not widen `impact`.
- **`drift` accepts `--strict`**, and **`explain` accepts `--cwd`** (earned by a code path:
  `applyProjectConfig` runs for every command and config `lang` decides `explain`'s prose language).
- **`run.change_set_undeclared` (warning)** — cross-checks the manifest's self-reported
  `changedSource` against the working tree, because an agent that declares an empty or partial
  change set makes `run.doc_gap` structurally unable to fire. Compares against **tracked**
  modifications only (the first cut fired on `.obsidian/` config and a personal note) and is quiet
  when git reports no changes at all.
- **`run.manifest_untracked` (info)** — says when the selected manifest is not tracked by git, so a
  clean checkout would not see it. Informational on purpose: gitignoring manifests is a legitimate
  policy, and two of five measured repositories do it.
- **`doctor` reports `ci_governance`** — which workflow or hook actually *invokes* `llm-wiki`, and
  whether anything can **block**. A workflow whose only step was `doctor` (a report that always
  exits 0) used to read as governance. Omission commands count as blocking only with `--strict`;
  when no omission gate exists it says so in a sentence instead of printing a reassuring number.
  Detection matches an invocation, not a mention (an unrelated `llm-wiki-review:` job name used to
  count), and it learns the `node bin/llm-wiki.js` form.
- **The composite action takes a `command` input** instead of hardcoding `validate` as `args[0]`,
  which had made an omission gate physically unreachable through it. It accepts only the eleven
  read-only commands, refuses a write command with exit 3, and passes each flag only to commands
  that accept it.

### Changed

- **The four channels we ship now run the omission gate.** `templates/git-hooks/pre-commit` runs
  `impact --strict` after `validate --changed`; `templates/github-actions/llm-wiki-validate.yml`
  runs `impact --since origin/<base> --strict` with `fetch-depth: 0` (without it `--since` cannot
  resolve the base ref and the gate degrades quietly, which is the worst way for a gate to break);
  this repository grew a `governance` job so it passes the gate it sells.
- **The v2 prompt shape reaches all eight adapters.** 1.27.2 bumped only
  `templates/adapters/claude-code/CLAUDE.md`; the other seven were still `wiki-block v1`, untouched
  since the package's first commit — so the release's headline benefit only ever reached Claude Code
  users. Codex, Gemini, Copilot, Cursor, Windsurf, JetBrains and Antigravity now carry the same
  small-core-plus-on-demand-retrieval shape, each keeping its own idiom (the Cursor `.mdc`
  frontmatter, the JetBrains info-level caveat, Antigravity's marker and UTF-8 rule, the Codex
  `# Project Agent Guide` structure). Bodies are unified to English to match the reference
  implementation and the 1.16.0 English-first direction. Compatibility is unchanged: `scanAdapters`
  still only checks for a `docs/llm-wiki/index.md` reference, and existing adapter files are still
  never overwritten.
- **`check-run` prefers a git-tracked manifest**, so a local run predicts CI. Not tracked-only —
  repositories that gitignore manifests fall back to the untracked one and get the `info` finding
  above rather than a permanently red `--strict`.
- **The composite action's `version` input defaults to `1.28`** (it was left at `1.26` through the
  whole 1.27 line, so consumers pinned at `@v1.27.2` ran CLI 1.26.x). `RELEASE_CHECKLIST.md` now
  verifies this value so it stops going stale.
- **The write-scope caveats now name every field written.** `review --approve` printed "stamps ONLY
  status + reviewed_by + reviewed_at" and `drift --downgrade` printed "status + last_updated only";
  since both started writing the `tags:` status tag through a shared helper, the boundary they
  stated was false. Corrected in eight places across `commands.js`, `cli.js` and `fix-migrate.js`.
- **The tool stopped claiming to know who is at the keyboard.** Five shipped surfaces (two `review`
  caveats, the `--help` summary, the `help review` topic, the MCP `review` tool description)
  asserted that "verified is a human decision". What is actually guaranteed is narrower: nothing
  promotes on its own, only an explicit `--approve` stamps, and `reviewed_by` records whoever ran
  it. Each surface now also points at the mechanism — a project delegating the approval run should
  set config `reviewer` to name the real approver. The recommendations *to adopters* in the
  generated prompts are deliberately unchanged.
- **`prompt --task` help renders from `SUPPORTED_TASK_PROMPTS`** instead of a hand-copied list that
  had drifted to 6 of 8 values, and `help drift` / the usage summary now list `--strict` and
  `--watch-needs-review`.

### Fixed

- **`drift` reported `result: pass` and exit 0 on a wiki it had just proved stale** — it put stale
  evidence in a separate array while `exitCodeFor` reads `findings` — and it rejected `--strict`
  outright. It now reports through `findings`. The default exit code stays 0, so adding `drift` to
  an existing pipeline still cannot break it.
- **A document could sit at `status: verified` while still tagged `needs-review`.**
  `review --approve` and `drift --downgrade` each rewrote `status:` and left `tags:` alone, and
  which way it broke depended on which path ran. In one adopting repository that was 12 of 22
  documents. Both paths now go through one helper that rewrites a status tag already present and
  never invents one.
- **Polynomial backtracking in that same tag helper** (found by CodeQL, not by the local gates):
  the inline-list patterns allowed `[` in the prefix before the opening bracket, so document bodies
  — exactly the uncontrolled input this helper runs on — could backtrack quadratically. Measured
  before the fix: 25k brackets 350ms, 50k 1692ms; after: under a millisecond.
- **`impact --since` was blind to source created but not yet committed** — `changedFiles` added
  untracked files only on the no-ref path, which is the state of every PR working tree.
- **`fix --write` can no longer rewrite the append-only log** (latent: no plan qualifies today).

### Honesty note

The SemVer call is the maintainer's: a change that flips an exit-code contract is a MAJOR, and it
ships as `1.28.0`. That is recorded here rather than smoothed over, and it is why both escape
hatches appear in the CHANGELOG, both READMEs and the release notes.

`harness-health` was measured read-only across five real repositories — 91 artifacts inspected, 33
findings, **0 false positives**, and one repository genuinely clean. Two limits travel with that
number: "true" means the reported fact is correct, not that it is worth acting on; and the run used
this working tree's templates, so adopters on the released 1.27.2 will see fewer adapter findings.
All size figures anywhere in this release are the product's existing `chars/4` **proxy**, not
measured token counts, and they under-count non-English text — no token or speed headline ships.

`doctor`'s `ci_governance` counts are an **upper bound**: the check sees invocations, not the
directory they run in, so a packaging smoke test against a scratch directory still counts. Doing
better needs a YAML parser, which costs the zero-dependency stance. A repository that relocates
hooks via `core.hooksPath` reads as "none detected", which is the safe error.

One decision that was recommended was **measured and not shipped**: gating on approvals that skip
the `review` command fired 42 times across 129 verified documents with **zero live bypasses**, so
its precondition failed. Pilot-repo confirmation of the new CI templates was skipped by direction,
so whether the three unconfirmed adopting repositories stay green after adopting them is unmeasured.

## 1.27.2 — 2026-07-30

Prompt-shape discipline ("unhobbling"). Applies a simple triage to every generated instruction
line — steering / contract / safety — and removes only steering, on the grounds that the
verification machinery (`validate`, `check-run`, tests) already enforces the contract at the exit.
No new commands or options; the frozen programmatic `commands` map, the `--format json` shapes, the
frontmatter contract, and the zero-dependency invariant are unchanged. Scope decision recorded in
`GATE_REVIEW.md` as *"Prompt-Shape Discipline (Unhobbling) Scope Decision"*.

### Changed

- **The Claude Code adapter template stops preloading the whole wiki** (block marker v1→v2).
  `templates/adapters/claude-code/CLAUDE.md` now `@`-includes only `docs/llm-wiki/index.md` and
  `project-profile.md`, and lists the heavy documents (`README`, `ARCHITECTURE_CONVENTIONS`,
  `DOMAIN_FEATURES`) as load-on-demand with the retrieval commands (`search-docs`,
  `prepare --task ... --compact`, `get-doc --section --strict-section`). On this repository the
  per-session preload drops from ~30.3k to ~1.4k tokens (`chars/4` proxy — file-size arithmetic,
  not a measurement). Existing adapter files are never overwritten (unchanged contract), and
  `scanAdapters` still only checks the `index.md` entrypoint, so existing adapters keep validating.
  The other adapter templates already pointed only at `index.md` and are unchanged.
- **The recurring write workflows are now goal / hard-lines / exit-criteria prompts** (skill marker
  v4→v5). The generated `feature`/`fix`/`refactor` and `docs-sync` prompts and skills replace the
  numbered step list with three blocks — *Goal*, *Hard lines (never cross these)*, *Exit criteria
  (done means all of these)* — plus an explicit autonomy line ("how you work between those lines is
  your call"). Every load-bearing line survives: read the entrypoint, inspect actual source before
  claims, STOP on doc/code conflict or scope growth, `needs_review` / verified-is-human-only, no
  sensitive values, the context budget, the append-only log, and test/validation reporting. The
  one-shot procedural workflows (`bootstrap` — shared verbatim with `handoff` —, `onboard`,
  `prepare`, `okf-extract`) deliberately keep their checklists; that boundary is regression-tested.
  Managed, unmodified skill artifacts refresh via `init --write --skills --refresh` as usual.

### Honesty note

The effect of the prompt restructure on task outcomes is **unmeasured** (no bench arm was run;
maintainer's call to ship without one). The preload figures are `chars/4` proxy arithmetic. No
token or speed headline ships in the README.

## 1.27.1 — 2026-07-29

Three batches land together: the remaining findings of the 2026-07-27 quality audit, four
techniques adapted from an external agent harness (ECC, MIT — read as a source of technique, never
added as a dependency), and a context-discipline pass on the generated prompts. Everything is
additive: the frozen programmatic `commands` map, the `--format json` shapes, the frontmatter
contract, and the zero-dependency invariant are unchanged. Version note: `1.27.0` was never
published — upgrading from `1.26.3` to `1.27.1` picks up everything below.

### Added

- **`import-memory [<path>] [--apply]`** — converts an agent harness's portable `ecc.memory.v1`
  Markdown memories into `needs_review` wiki drafts under `docs/llm-wiki/imported/`
  (`doc_type: imported_memory`). Preview by default. Frontmatter is only ever produced through the
  template seam, so an import **cannot** create a `verified` document; memories whose text trips the
  sensitive-info scan are skipped with a redacted count and no values; existing files are never
  overwritten; inactive (rejected/superseded) memories are skipped. `source_files`/`evidence` are
  left empty on purpose — grounding belongs to the human review step, and provenance is recorded in
  the body. Not exposed over MCP (it writes). New findings: `import.source_missing` (error),
  `import.invalid_memory` · `import.unsupported_schema` · `import.sensitive_skipped` (warning).
- **`rulesPreset: "relaxed" | "standard" | "strict"`** in `llm-wiki.config.json` — a named severity
  bundle for projects that do not want to learn individual rule IDs. `relaxed` softens 11
  heuristic/alignment warnings, `standard` is a deliberate no-op baseline, `strict` enables the
  opt-in lints (`content.thin_body`, `visibility.*`) and raises four governance rules to `error`.
  Expansion happens at config-merge time, so CLI, programmatic API, MCP, and per-package monorepo
  merges all inherit it. An explicit `rules` entry always beats the preset, `sensitive.*` still
  cannot be switched off, and an unknown value is a config error (exit 3). `doctor` echoes the
  applied preset. Presets move finding severities only — they are independent of the `--strict` flag,
  which governs exit codes.
- **A `testEvidence { red, green }` field on run manifests**, verified by `check-run`: for a
  `feature`/`fix` run with a non-empty `changedSource`, a missing or incomplete trail raises
  `run.test_evidence_missing` (warning, toggleable). Documentation-only runs (`docs-sync`,
  `bootstrap`) and older manifests are exempt and stay warning-free. The finding names the missing
  keys only, never their values.
- **`estimated-tokens` on every generated skill artifact** so an agent can weigh a skill *before*
  loading its body — a frontmatter key for the Claude/Codex `SKILL.md` contracts and a leading HTML
  comment for the third-party Cursor `.mdc` and the neutral prompt. The figure is a `chars/4`
  **proxy** and always carries that disclaimer inline; this project publishes no measured token
  counts. Older managed artifacts are refreshed normally by `--refresh`.
- **`npm run test:quiet`** — the same suite under the `dot` reporter, so re-running tests during a
  long agent session does not pull ~380 result lines into context each time. `npm test`, `npm run
  verify`, and CI keep the verbose reporter for diagnosis.

### Changed

- **The generated skills and task prompts now carry a context budget.** Every workflow
  (`bootstrap`/`feature`/`fix`/`refactor`/`docs-sync`/`okf-extract`/`onboard`/`prepare`, plus the
  `handoff` prompt) tells the agent to locate before reading, to read a large file by line range or
  section rather than whole, to use the compact retrieval flags for wiki documents, and to report
  tests as failures plus the summary line. The budget narrows **how** source is read and never
  **whether** it is read: it states outright that evidence outranks brevity and that the answer to a
  claim you cannot verify narrowly is to read more. One shared source (`contextBudget`), so no
  workflow drifts. This adds roughly 30% to each skill artifact's fixed body (the `feature` skill's
  proxy figure goes from 775 to 1010) in exchange for bounding what a run pulls in — a designed
  trade-off, not a measured saving.
- **The run-manifest contract now bounds itself.** It states that the listed fields are the whole
  contract and that `check-run` reads no others, allows an optional summary of at most two
  sentences, and forbids pasting diffs, file contents, logs, or test output into the manifest. Agents
  had been writing multi-sentence summaries and extra fields that no check ever reads.
- Generated-artifact format version `3` → `4`. Refresh detection still uses the content hash, so
  `--refresh` updates unmodified managed artifacts and never touches user-edited or foreign files.

### Fixed

- **Duplicated YAML frontmatter keys are now surfaced instead of silently applying last-wins.**
  `parseFrontmatter` keeps its last-wins semantics (no document changes shape) but additionally
  reports `duplicateKeys`, and both consuming seams raise `frontmatter.duplicate_key` (warning,
  toggleable). A duplicate key could quietly discard grounding — an earlier `source_files`/`evidence`
  list — or flip `status`/`contains_sensitive_info` with no visible error. The finding names the key
  only, never its value.
- **The MCP server now enforces the `inputSchema` it advertises.** Violating calls — wrong type,
  out-of-enum value, missing required argument, below `minimum`, unknown argument, non-object
  arguments — are rejected before the command runs, with JSON-RPC `-32602 Invalid params` and
  `data: {tool, errors}`. Previously they were silently coerced or filtered and ran anyway
  (`validate {strict: "true"}` ran non-strict; `status {type: "banana"}` produced
  `active_profiles: core, banana`). Execution-level failures keep their distinct `isError: true`
  shape. The validator is a pure, zero-dependency module covering only the JSON-Schema subset the
  tool definitions actually use. The tool `type` enum is now derived from the single source
  (`KNOWN_TYPES`), fixing a stale hand-maintained list that had been missing `mobile` (1.12) and
  `infra` (1.13).
- **`--type` is now validated like `--format`/`--lang`.** An unsupported value is a usage error
  (exit 3) against the same `KNOWN_TYPES` single source. **Small behaviour change:** `--type banana`
  previously flowed into detection and exited 0 with `active_profiles: core, banana`.

### Tests

- 384 tests (up from 330), including negative-path unit tests for the frontmatter parser/validator
  seams. Each new behaviour was confirmed to fail against the pre-change source before being fixed.

## 1.26.3 — 2026-07-27

Two bug fixes reproduced by a repository quality audit. No new command or option; the `1.0.0`
command / `--format json` shape / frontmatter contracts and the zero-dependency invariant are
unchanged.

### Fixed

- **A UTF-8 BOM in `llm-wiki.config.json` no longer breaks every command.** Windows PowerShell's
  `Out-File -Encoding utf8` and older Notepad prepend a byte-order mark; `JSON.parse` then threw on
  otherwise-valid JSON, so **every** command exited 3 with `llm-wiki.config.json is not valid JSON`
  and the message named no cause. The config file is now read through the BOM-aware reader
  (`readTextAuto`) that detector manifests have used since 1.14.1, so UTF-8-BOM and UTF-16 (LE/BE)
  config files load. Genuinely malformed JSON still exits 3, and wiki documents keep the raw UTF-8
  read so the mojibake scan is unaffected.
- **`init --no-adapters` no longer depends on flag order, and config no longer refills the list it
  cleared.** The flag now records the intent declaratively and is applied once after argument
  parsing, so `--agent claude --no-adapters` and `--no-adapters --agent claude` agree. And because
  an emptied `agents` list read as "unspecified", the config's `agents` was merged back in — in this
  repository `init --agent claude --no-adapters` produced `agents=[codex, claude]`, so the flag that
  turns adapters *off* added an agent the user never named. Both merge paths (`src/cli.js`,
  `src/config-file.js`) now honour the opt-out. Only `init` accepts the flag, so nothing else moves.

### Changed (additive)

- `defaultOptions()` gains `noAdapters: false`. `normalizeOptions` spreads it, so the programmatic
  API's returned options object carries one additional key; no existing key or value changes.

### Documentation

- **The README's core-command table now lists the read-only retrieval commands**
  (`list-docs` · `search-docs` · `get-doc` · `get-related`), which had been missing from the table
  since they shipped in 1.18.0 — the npm page advertised the MCP surface but not the CLI one. `init`'s `--with-adapters`/`--no-adapters` are likewise now documented in `PUBLIC_API.md`.
- The composite-action example pin moved from `@v1.26.0` to `@v1.26.3` (EN + KO).

## 1.26.2 — 2026-07-27

Documentation only, again for the npm package page. No code, no CLI, no contract change.

### Documentation

- **The benchmark's grading is now human-ratified, and the README says so precisely.** The scope
  line read "agent-graded"; it now reads **"agent-graded with the grading standard ratified by the
  maintainer on a sampled review"**.
  - What that means: on 2026-07-27 the maintainer reviewed a deliberately adversarial 7-answer
    sample — matched per-arm triplets covering the task with the largest spread, the task where
    the *no-wiki* arm wins, the harshest grade given, and a leniency check — and confirmed the
    grading standard was applied consistently across arms. No scores changed.
  - What it does **not** mean: it is not an independent human re-grade of all 54 answers, and it
    is never described as "human-graded". The worksheet also records a sensitivity analysis
    showing the conclusion survives if the most contestable judgment is discarded.
  - Record: `bench/results/real-driver-external-vue-app-sdk-empty-control-2026-07-27-ratification.md`.
- **The performance-headline ban is unchanged.** Ratification raises confidence in the grading; it
  does not enlarge the sample. One repository, one model, six tasks, N=3.

## 1.26.1 — 2026-07-27

Documentation only. No code, no CLI, no contract change — published so the corrected README
reaches the npm package page, which otherwise keeps serving the text from 1.26.0.

### Documentation

- **The "Does it actually help?" section now states the controlled benchmark result** and drops a
  superseded figure. It previously cited a 2026-07-22 run ("~10% fewer tokens") measured with a
  single total-token count. It now reports the three-arm measurement: an agent querying a current,
  verified wiki used **about 41% fewer input tokens** (the conservative pooled figure) than one
  reading source, at slightly better rubric accuracy — and the control arm, which is the part that
  matters: the **same retrieval tools over a wiki with its content stripped out cost 14% *more*
  than having no wiki at all**. So the saving comes from the maintained content, not from giving
  the agent a search tool, and an unenriched wiki is worse than no wiki.
  - The scope conditions travel with the number — one repository, one model, six tasks, N=3,
    agent-graded — along with the one task where retrieval *lost* at 3.17×. Full method, including
    the runs that went against us: `docs/llm-wiki/BENCHMARK.md`.
  - No performance headline: the figure stays inside a paragraph, never in the title, the tagline,
    or a badge.
- **The CI example pins a current tag.** It suggested `actions/validate@v1.7.0`, nineteen releases
  old; now `@v1.26.0`.

Both changes applied to `README.md` and `README.ko.md` together.

## 1.26.0 — 2026-07-27

**Harden & Adopt: make human review cheap enough to actually do.** The headline is `review`,
a read-only command that turns the `needs_review` backlog into something a maintainer can work
through in minutes — the weakest, most manual part of the governance loop. Alongside it: CI and
supply-chain hygiene that preserves the zero-dependency identity (no runtime dependencies **and**
no devDependencies), and the adoption docs an outside reader asked for. Additive throughout; the
`1.0.0` command / `--format json` / frontmatter contracts are unchanged.

### Added

- **`review` — the human review → `verified` workflow (Gate 20).** Read-only by default: lists the
  `needs_review` backlog **risk-ranked** (never-enriched, thin body, no evidence, broken links
  first) with a per-doc quality and evidence summary, so a reviewer can spot-check the risky docs
  instead of reading the pile in file order. Promotion happens **only** on an explicit
  `review --approve <path>` (or `review --approve-all --yes`), and it stamps nothing but
  `status: verified` + `reviewed_by` + `reviewed_at` — body, `source_files`, `evidence`, and
  `last_updated` are never touched. It is the exact reverse of `drift --downgrade`.
  - **The CLI still cannot self-approve.** Docs carrying blocking or structural findings
    (`blocked`/`error`) are refused until fixed, and `reviewed_by` must resolve from
    `--reviewer` > config `reviewer` > git `user.name` — with no reviewer identity, the stamp is
    refused rather than left blank or invented.
  - Exposed on all three surfaces, asymmetrically: CLI and the frozen programmatic `commands` map
    get the full command; **MCP gets the LIST mode only**, so an agent can read the backlog but
    promotion stays a human CLI action.
- **`reviewer` config key** in `llm-wiki.config.json` (`--reviewer` takes precedence).
- **Engineering hygiene, zero-dep preserved.** Test coverage via the Node built-in
  (`node --test --experimental-test-coverage`, not nyc/c8); a `node --check` syntax gate
  (`npm run lint`, no linter dependency) plus `.editorconfig`; a GitHub-native CodeQL workflow;
  `npm sbom` and bench scripts; `CODEOWNERS` and `MAINTAINERS.md`.
- **Adoption documentation.** An MCP trust-model section in `SECURITY.md` (local stdio subprocess,
  stdout-as-protocol, no authentication, do not expose over a network); `docs/OPERATIONS.md`, a
  per-scale operator guide (small repo / medium repo / monorepo); an `examples/` end-to-end
  walk-through of `init → enrich → validate → review`; and a `## How it works` pipeline diagram
  plus sample audit output in the README. All EN/KO.

### Changed

- **The composite GitHub Action pins the CLI version it runs.** `.github/actions/validate/action.yml`
  defaulted its `version` input to `latest`, so pinning the action by tag still floated the CLI
  underneath it. The default is now a pinned minor (`1.26`); pass `version: latest` explicitly if
  you want the floating behavior.

### Documentation

- `BENCHMARK.md` now records the 2026-07-24 real SDK-path measurement (input **0.516×**, cost
  **0.581×**, pooled **−40.7%**, blind-to-arm rubric grade 0.910 vs 0.971 with zero hallucinations)
  **together with** what it does not establish: the one task where retrieval loses (3.17×), an
  unexplained gap against the earlier −10% run on the same repo, a missing empty-wiki control arm
  that leaves "wiki content" and "retrieval tooling" unseparated, and an agent — not human — grader.
- **The README performance headline remains forbidden.** A scoped, linked footnote is the most
  these numbers support until a multi-repo / multi-model measurement exists.

## 1.25.0 — 2026-07-23

**Token efficiency: pick the cheapest safe path.** Additive, opt-in, zero-dependency changes
that reduce the tokens spent reaching a correct, verified change — without trading away
accuracy, doc freshness, or human review. Default output is unchanged; `1.0.0` command /
`--format json` / frontmatter contracts are preserved. The `--doc-lang` help-usage gap is also
fixed. Diagnostic token figures are a `chars/4` proxy only — no measured performance claim ships.

### Added

- **`get-doc` token controls (opt-in):** `--strict-section` withholds the full body when no
  section matches (instead of falling back to a whole-document read), `--max-chars <n>` caps the
  returned body exactly (clamped after redaction), and `--compact` drops the frontmatter echo. With
  any of these the document carries a diagnostic `estimatedTokens` (a `chars/4` proxy). Also wired
  to the MCP `get_doc` tool.
- **`prepare --compact`:** one bounded context bundle in a single call — a chosen path
  (`source_direct` / `wiki_first` / `hybrid`) with a reason, at most three candidate docs with
  status-derived freshness, only the top doc's most-relevant section (never the full corpus, never a
  silent full-body dump), candidate source files, and next-lookup calls to expand. Also on MCP.
- **Deterministic task-path selection** (internal, reused by `prepare --compact`): from the task
  text, candidate count, and doc statuses only — never answer filenames or symbols. Risk-sensitive
  work (auth / permission / payment / crypto / privacy / data-deletion / migration / public-API),
  stale/`needs_review` candidates, and any code change force reading the real source and are never
  `source_direct`.
- **Section-heading-weighted retrieval ranking** and an exact-character clamp (`clampText`),
  clamped after redaction so a truncated tail can never expose a secret.
- **Safe skill `--refresh`** for `init`/`quickstart`: updates only package-generated skills you have
  not edited (verified by a content-hash marker embedded in each generated artifact); user-modified
  and custom skills are never overwritten (reported as conflicts), and a dry-run distinguishes
  create / refresh / conflict / up-to-date.

### Changed

- **Simpler `feature`/`fix`/`docs-sync` skills:** they now assemble the wiki map at run time (via
  `prepare --compact` / `onboard`) instead of baking in a generation-time domain-map snapshot, so
  the fixed prompt no longer grows with the domain count and never goes stale; the run-manifest
  contract is stated as a field list instead of a full JSON echo. Every safety rule is retained
  (`needs_review`, no self-`verified`, log append, tests, `check-run`). The `bootstrap` skill keeps
  its fuller first-time-enrichment guidance and domain-map snapshot.
- **MCP:** investigated the `content` vs `structuredContent` body duplication (`get_doc` mirrors the
  body into both); the default is unchanged, and only the opt-in `compact` path keeps the body in
  `structuredContent` with a pointer in the text content to avoid duplication.
- **`--help`:** `init`/`quickstart`/`handoff`/`prompt` usage now advertises `--doc-lang en|ko`; the
  generated-doc language was previously discoverable only from the README and from runtime output.

### Fixed

- A failed `get-doc --section` no longer silently balloons into a whole-document read when
  `--strict-section` is set.

### Benchmark (proxy only — not a shipped claim)

- New proxy arm `B3_retrieval_compact` (`bench/`) models compact/section-scoped reads: on this
  self-referential corpus it costs ~34% fewer tokens than `B2` but drops grounding from 100% to
  83.3% (evidence in an unselected section) — reported honestly, so `--strict-section`/compact is an
  opt-in trade-off. A whole-task `guided-compact` arm was added (dry). All figures are a `chars/4`
  proxy; real / paid measurement remains deferred.

## 1.24.0 — 2026-07-23

Two additive, zero-dependency changes ship together: **English-first documentation language
selection** (an urgent i18n fix) and **guided onboarding and task preparation**. `1.0.0`
command / `--format json` shape / frontmatter contracts are unchanged; default English output
is preserved.

### Fixed

- **Generated LLM-WIKI documents are now English by default.** `init`/`quickstart` previously
  hardcoded Korean prose in several generated bodies (`index.md`, the wiki `README.md`, the
  initial `log.md` entry, the domain overview's empty-domains note, and per-domain docs), so an
  overseas user running the English-first product received partly-Korean documentation. All
  generated document prose now defaults to English, with **no Korean** left in bodies, titles,
  placeholders, review notes, or the initial log entry.

### Added

- **`--doc-lang en|ko` (default `en`) and config `docLanguage`.** New global option and config key
  that select the language of *generated wiki document content* and the *agent doc-writing
  instructions* (handoff / bootstrap / feature / fix / docs-sync / okf-extract prompts and the
  generated skill bodies). This is independent of `--lang`, which continues to control
  findings/`explain`/CLI-message prose. CLI `--doc-lang` overrides config `docLanguage`; an invalid
  value is a usage error (exit code 3). `--doc-lang ko` reproduces (and completes) the Korean
  experience. Technical identifiers — paths, code symbols, JSON keys, frontmatter fields, status
  values, CLI commands, and evidence locators — are never translated in either language. A single
  language-selection layer (`src/commands/doc-content.js`) holds the localized prose; English output
  is byte-identical to before for docs that were already English. `init`/`quickstart` report the
  selected documentation language in text and `--format json` (`docLanguage`).
- **`onboard [--domain <name>] [--goal <text>]` (read-only).** Deterministically assembles a
  domain learning path for a newcomer from the existing wiki — documents to read, source and
  test entrypoints (from the docs' `source_files`/`evidence`), invariants/risks recorded in the
  docs, freshness/`needs_review` warnings, and evidence-anchored comprehension checks. An unknown
  `--domain` lists the available domains and how to generate them (never a silent empty result).
  The CLI invents no explanation — the `/llm-wiki-onboard` skill does the teaching.
- **`prepare --task <text>` (read-only).** Scopes a change before implementing: most-relevant
  wiki docs (reusing the `search-docs` ranking via a shared `rankDocsByQuery`), graph neighbors,
  candidate domains/source/test files, related API/state/screen/config docs, invariants, and a
  scope checklist. Phrases everything as candidates ("verify before editing"), never concludes a
  file is the cause or a change is safe.
- Both on CLI, the programmatic API (frozen `commands` map), and MCP (read-only `onboard`/`prepare`
  tools). New `llm-wiki-onboard`/`llm-wiki-prepare` skills (Claude/Codex/Cursor/neutral); the
  feature/fix skills gain prepare-awareness and stop-on-conflict without changing their contract.
- A separate whole-task experiment scaffold under `bench/whole-task/` (methodology, task format,
  rubric, dry-run runner, sample fixture, result template only — no model calls, no fabricated numbers).

### Unchanged (frozen contract)

- Read-only; restricted/sensitive docs excluded from results, returned text redacted. Zero
  dependency; frozen `commands` map grows additively; default output byte-identical when the new
  surfaces are not used. AI-edited wiki docs stay `needs_review`.

## 1.23.0 — 2026-07-23

Adds a first-time wiki-writing `bootstrap` skill/task and Codex-native skill generation.
Additive and zero-dependency: the frozen programmatic `commands` map, the `--format json`
shape, and the frontmatter contract are unchanged, and output is byte-identical when skills
are not requested.

### Added

- **`bootstrap` task — repeatable first-time enrichment of an `init --write` skeleton.**
  Available as a skill (`/llm-wiki-bootstrap`) and as `prompt --task bootstrap`. It turns the
  generated skeleton into code-grounded docs (read `docs/llm-wiki/index.md` first → inspect
  real source → replace placeholders → enrich domains → record `source_files`/`evidence` →
  keep `needs_review`, never auto-`verified` → append `log.md` → run validate/audit/stats).
  The initial-enrichment rules live in a single source (`initialEnrichmentWorkflow` in
  `src/task-prompts.js`) shared by both the `handoff` prompt and the `bootstrap` task, so the
  two can never drift apart.
- **Codex native skills — `.agents/skills/llm-wiki-<task>/SKILL.md`** with `name`/`description`
  frontmatter. Format selection is symmetric across agents: `--agent codex` emits the Codex
  format, `--agent claude`/`cursor` their formats, and `--skills` emits every native format
  (Claude + Codex + Cursor + agent-neutral prompt). Skill/task set is now bootstrap, feature,
  fix, docs-sync.

### Unchanged (frozen contract)

- Preview-first; writes only on `--write`; existing skill files are never overwritten
  (kept/skipped reported); no machine-absolute paths or usernames in artifacts;
  recognize-don't-run. Zero-dependency; frozen `commands` map, `--format json` shape, and
  frontmatter contract unchanged. `--agent codex` alone now emits Codex skills (previously no
  artifacts) — the only behavior change, and only when that agent is explicitly selected.

## 1.22.0 — 2026-07-22

Optional Korean localization of human-facing findings prose (the last external-feedback
item, P4). Additive and zero-dependency: rule IDs, the `--format json` shape, the
programmatic API, and the frontmatter contract are unchanged, and default English output
stays byte-identical in every format.

### Added

- **`--lang ko|en` (global, default `en`) + config `lang` — Korean localization of findings
  prose (Gate 27, P4).** Localizes only human-facing prose: a finding's `message` (via the
  shared `applyRuleConfig` seam, so both the text sections and the `--format json` `message`
  pick it up) and `explain`'s meaning / why / remediation. A new zero-dependency catalog
  (`src/i18n.js`) with `{param}` interpolation and a strict English fallback (a missing KO
  key keeps the English string, never blank). Resolved through the shared
  `applyProjectConfig`/`resolveOptions` seam, so CLI, programmatic API, and MCP all honor the
  same language.
- Localized all 47 `explain` entries plus the finding messages surfaced by
  `validate`/`audit`/`status`/`next` (the `scans` / `frontmatter` / `structure` families);
  operational/edge messages fall back to English until a follow-up.

### Unchanged (frozen contract)

- Rule IDs, all `--format json` keys and its shape, category names, config keys,
  command/option names, evidence-locator syntax, the CLI commands shown by `explain`, and
  file paths stay English — only prose localizes. `--format json` `message` localizes only
  under an explicit `--lang ko` (`rule` and shape unchanged; consumers must key on `rule`).
  Default `en` output is byte-identical in every format. Report chrome (section headers,
  severity words), languages beyond KO/EN, and OS-locale auto-detection stay out of scope.

## 1.21.0 — 2026-07-22

More external-usage developer-experience improvements, additive and zero-dependency: the
`llm-wiki` command surface, `--format json`, the programmatic API, and the frontmatter
contract are unchanged, and backend/fullstack domain detection stays byte-identical.

### Added

- **Domain docs are pre-wired into the two top-level entry points (external feedback P6).**
  When `init`/`quickstart` plans per-domain docs (auto-detected or via `--domains`), the
  generated `index.md` now links the domain overview (in the read order and `related`) and
  `DOMAIN_FEATURES.md` lists each per-domain doc under a `## Domains` section — complementing
  the existing overview↔per-domain wiring so the domain map is reachable from the entry point,
  and automating the linking a tester previously did by hand. Gated on domains being planned:
  a domain-less scaffold is byte-identical. Scope is scaffold-time (`init`/`quickstart`);
  `fix`-time re-wiring is a follow-up. Additive and zero-dependency.
- **Per-document enrichment checklist in `next` (external feedback P5).** `next` now surfaces
  an "Enrich placeholder documents" action and an **Enrichment Checklist** that lists, for each
  not-yet-enriched document, which `##` sections still hold generated placeholder text (with a
  hint). Backed by a pure `enrichmentChecklist` helper and an additive `checklist` field on the
  `content.not_enriched` audit finding; an additive `enrichmentChecklist` field is added to the
  `next` result, and `explain content.not_enriched` now points at it.
- **Detection & `not_enriched` heuristic transparency + regression tests (external feedback P7).**
  Documented the domain-detection and enrichment criteria (parent conventions, exclusion sets,
  placeholder sentinels) in the wiki, and added a deterministic `planDomainDocs` snapshot test
  plus broader `FILE_DOMAIN_EXCLUDE` coverage to lock the heuristics against regressions.

## 1.20.0 — 2026-07-22

Retrieval and frontend developer-experience improvements, most driven by external usage
feedback (building an LLM-WIKI on a Vue/Quasar SPA). Additive and zero-dependency: the
`llm-wiki` command surface, `--format json`, the programmatic API, and the frontmatter
contract are unchanged, and backend/fullstack domain detection is byte-identical.

### Added

- **Frontend/SPA domain detection.** `init` now detects per-domain docs for `frontend` and
  `mobile` projects, not only backend/fullstack: the 1-depth folders under
  `pages`/`views`/`features`/`modules`/`screens`, plus the top-level route groups parsed
  (regex, no parser dependency) from vue-router/react-router files. SPA UI-plumbing folders
  (`components`/`layouts`/`composables`/…) are excluded, and backend/fullstack detection is
  unchanged.
- **`--domains <a,b,c>` + an explicit no-domains notice.** `init`/`quickstart` can now name
  domains explicitly (for when auto-detection can't find them), and — instead of silently
  producing zero per-domain docs for a domain-capable project — print an explicit notice
  pointing to `--domains` or manual creation under `docs/llm-wiki/domains/`.
- **`llm-wiki get-doc --section <terms>` — focused read.** Returns only the most relevant
  `##` sections (plus the preamble) instead of the full document body, falling back to the
  full body when there is no `##` section or nothing matches. An additive `document.section`
  `{query, returned, total}` appears only when it filtered; default `get-doc` output is
  unchanged. Wired across the CLI, MCP (`get_doc.section`), and the programmatic API.

### Changed

- **`search-docs` deprioritizes the append-only change log.** `docs/llm-wiki/log.md`
  (a `change_log`) accumulated every keyword and previously dominated results; it now ranks
  after all other matches (still returned, not excluded) so reference docs surface first.
  Output shape unchanged.
- **`evidence.section_unlisted` matches by source path, not verbatim.** A body `## Evidence`
  entry satisfying a frontmatter `evidence` reference no longer needs a verbatim substring: a
  `path:60-70` body reference satisfies a `path#L60-L70` frontmatter entry (and locator-format
  differences generally), removing spurious warnings. External `http(s)`/`repo:` references
  still require a verbatim mention.

## 1.19.0 — 2026-07-21

Evidence semantic tiers (Gate 25) + agent update runner (Gate 26). Deepens the
"code-grounded, verified" promise from format-only checks to meaning, and makes the
wiki-grounded skill workflow auditable end-to-end. Additive and opt-in: the existing
`llm-wiki` command surface, `--format json`, the programmatic API, and the frontmatter
contract are unchanged, and no runtime dependency is added.

### Added

- **Evidence target-existence checks (Gate 25).** `evidence`/`source_files` references
  with a `#symbol:` or `#section:` locator are now checked for the *target's* existence,
  not just the file's: `evidence.symbol_unverified` fires when the referenced file mentions
  none of the symbol name(s) (a `·`/`,`/`/`-joined value is a list), and
  `evidence.section_unverified` when a Markdown source has no heading matching the section.
  Conservative textual-presence check (not an AST resolver — avoids false positives).
  Default warning; `--strict` escalates. `route` locators stay format-only in v1.
- **`evidence.ungrounded` (Gate 25).** Flags a `verified` document with no `source_files`
  and no `evidence` — "verified" with no code grounding. Default warning; not escalated by
  `--strict` (toggle/escalate via `llm-wiki.config.json` `rules`).
- **Computed evidence tiers (Gate 25).** `llm-wiki stats` now reports `evidenceTiers`
  (`reference_checked` = has grounding and every reference resolves; `human_verified` =
  verified with reviewer metadata) — computed and report-only, **not** a new frontmatter
  field or `status` value.
- **`llm-wiki check-run` — agent update runner (Gate 26, read-only).** Verifies a
  wiki-grounded skill run's manifest under `.llm-wiki/runs/` (the newest, or `--run <path>`):
  every `changedSource` file is referenced by some `touchedDocs` document, the change log was
  appended, and validation ran and passed. The intent-anchored complement to `impact`
  (diff-anchored). New toggleable `run.*` findings (`run.doc_gap`/`run.log_missing`/
  `run.unvalidated` warning, `run.manifest_missing` warning, `run.manifest_invalid` error).
  Default warning; `--strict` fails CI.
- **Skill completion contract (Gate 26).** The generated `/llm-wiki-<task>` skill bodies now
  embed a final step to write the run manifest, so the completion contract travels with the
  skill. Regenerate committed skill artifacts with `init --write --skills --existing overwrite`
  to pick it up.

### Safety

- **Read-only.** The evidence checks, tiers, and `check-run` never write. `check-run`'s only
  associated write is the manifest the agent authors during its own run (not by the tool).
- **Conservative by design.** The target-existence checks flag only unambiguous absences, so
  enabling them does not retroactively break correctly-grounded `verified` documents.
- **Zero-dependency.** Bounded text scans and the existing parsers only — no AST/language
  server, no network.

## 1.18.0 — 2026-07-21

Read-only retrieval (Gate 24). Adds four commands that return document **content**,
not governance reports — the "the agent queries the wiki instead of re-deriving from the
code" surface. Additive and opt-in: the existing `llm-wiki` command surface stays
backward-compatible, `--format json`, the programmatic API, and the frontmatter contract
are unchanged, and no runtime dependency is added.

### Added

- **`llm-wiki list-docs` — enumerate documents with metadata (read-only).** Lists content
  docs with their path, title, status, doc_type, visibility, last_updated, and tags (no
  bodies). Filter with `--status`, `--visibility`, `--doc-type`.
- **`llm-wiki search-docs <query>` — keyword search (read-only).** Deterministic
  keyword/substring match over titles, bodies, and frontmatter — **NOT semantic/vector
  search**. Every whitespace-separated term must appear (AND); results are ranked (title
  hits weighted highest) with a short snippet per match. `--limit` caps results (default 20).
- **`llm-wiki get-doc <path>` — read one document (read-only).** Returns a document's
  frontmatter and body. `<path>` may be repo-relative (`docs/llm-wiki/GLOSSARY.md`),
  wiki-relative (`GLOSSARY.md`), or a bare name (`GLOSSARY`).
- **`llm-wiki get-related <path>` — resolved graph neighbors (read-only).** Returns a
  document's outbound and inbound neighbors over wiki links, related frontmatter, and local
  markdown links.
- **MCP retrieval tools.** The four commands are exposed over MCP as `list_docs`,
  `search_docs`, `get_doc`, and `get_related` (read-only, like every other MCP tool), and
  over the programmatic API under their kebab-case command names.

### Safety

- **Read-only.** No command in this set writes, edits, or downgrades anything.
- **Visibility + sensitive-info honored.** Restricted/sensitive documents (visibility
  `restricted`, `contains_sensitive_info: true`, or a sensitive-info scan match) are
  **excluded** from `list-docs`/`search-docs` unless `--include-sensitive` is passed; every
  returned body/snippet **redacts** sensitive-looking lines, so a raw secret is never
  returned (`get-doc` still returns the document, with those lines redacted).
- **Zero-dependency.** Keyword/substring matching and the existing wiki graph only — no
  embeddings, index, or network.

## 1.17.0 — 2026-07-21

Reverse-impact gate (Gate 23). Adds a read-only `impact` command that catches the case
date-based drift misses — code and its `verified` doc changing in **separate** PRs. It is
additive and opt-in: the `llm-wiki` command surface stays backward-compatible, `--format
json`, the programmatic API, and the frontmatter contract are unchanged, and no runtime
dependency is added.

### Added

- **`llm-wiki impact` — diff-anchored reverse-impact check (read-only).** Builds a reverse
  index from every `verified` doc's local `source_files`/`evidence`, then flags a `verified`
  doc whose referenced source is in the current change set **but the doc itself is not
  changed in the same diff**. This is the pre-merge, diff-anchored complement to the
  date-anchored `evidence.stale` (drift): it answers "this PR touches governed code without
  updating its doc," which a date baseline cannot.
  - Baseline is the **working tree** by default, or `--since <ref>` for a PR/CI base
    (`git diff --name-only <ref>`), reusing the same `changedFiles` primitive as
    `validate --changed`.
  - New finding `impact.source_changed` (new **toggleable** `impact` category, default
    **warning**); `impact.unavailable` (error) when git is not available.
  - `--strict` escalates impact findings to a failing error so CI fails a PR that changes
    governed code without updating its `verified` doc; the severity is also adjustable via
    the config `rules` map. An **empty change set is a no-op** (result `pass`).
  - Read-only: remediation stays human (re-review, or `drift --downgrade`). v1 is
    file-level (line-level / per-doc `reviewed_sha` / write-back / MCP exposure are out of
    scope). External `http(s)://` and `repo:<name>/<path>` references are ignored.

### Internal

- `scans.js` factors a pure, shared anchor extractor `verifiedSourceAnchors` used by both
  the date-anchored drift (`driftTargets` now delegates to it — behavior-preserving) and
  the new diff-anchored `scanReverseImpact`. Reuses existing git primitives; mostly wiring,
  zero-dep.

## 1.16.1 — 2026-07-21

Follow-up polish for the 1.16.0 rename. No code behavior change: the `llm-wiki`
command, `--format json`, the programmatic API, and the frontmatter contract are
unchanged, and no runtime dependency is added.

### Changed

- **README title corrected** to "LLM-WIKI Governance" (was "LLM-WIKI Standard"),
  matching the governance positioning and the package name.
- **CONTRIBUTING** wording updated to the governance framing; the internal frontmatter
  schema `$id` (a local placeholder identifier, not used for validation) aligned to the
  new name.
- **Added `keywords`** to `package.json` for npm discoverability.

## 1.16.0 — 2026-07-21

Rename + reposition. The package is renamed `@dowonk-7949/llm-wiki-standard` →
**`llm-wiki-governance`** (unscoped) and repositioned as **governance for AI-written
project docs (OKF-compatible)**. CLI output is now English-first. Additive and
presentational: the `llm-wiki` command, `--format json`, the frozen programmatic API,
and the frontmatter contract are unchanged, and no runtime dependency is added. The old
scoped package is deprecated and points here.

### Changed

- **Package renamed to `llm-wiki-governance`** (was `@dowonk-7949/llm-wiki-standard`).
  The `llm-wiki` command name is unchanged; install / `npx` targets and the programmatic
  import specifier use the new name. The old package is deprecated with a pointer here.
- **Repositioned as a governance layer** — verify, catch drift, keep AI-written docs
  code-grounded, enforce in CI — positioned OKF-compatible. README (EN/KO) reframed.
- **English-first CLI output.** The handoff prompt you paste into a coding agent is now
  fully English; `help`, the quickstart `About` section, and the handoff `Next Step`
  guidance lead with English (a short Korean note is retained). No finding IDs, command
  names, or JSON fields changed.

## 1.15.1 — 2026-07-21

Skill-generation onboarding fix — dogfooded: this change was made by running the tool's
own `/llm-wiki-feature` skill on itself. No command, option, `--format json`, or
frontmatter contract change; no runtime dependency added.

### Changed

- **`init`/`quickstart --write` now prints a restart-required note when it generates
  skills.** Claude Code discovers skills at session start (not hot-reload), so a freshly
  generated skill's `/llm-wiki-*` command reads as "unknown" until the agent is
  restarted. The note (bilingual, one line) is shown only when a skill was actually
  created, so users are not left guessing why the new command is missing.

## 1.15.0 — 2026-07-20

Skill generation (Gate 21) — wiki-grounded automation prompts for feature/fix/docs-sync
work, so a generated wiki actually gets USED. Additive and opt-in; existing commands,
`--format json`, and the frontmatter contract are unchanged, and no runtime dependency
is added.

### Added

- **`init`/`quickstart` can generate invocable, wiki-grounded automation prompts** for
  the `feature`, `fix`, and `docs-sync` workflows, in each agent's native shape:
  - Claude Code skill — `.claude/skills/llm-wiki-<task>/SKILL.md` (invoke as `/llm-wiki-feature`),
  - Cursor rule — `.cursor/rules/llm-wiki-<task>.mdc`,
  - agent-neutral prompt — `.llm-wiki/prompts/llm-wiki-<task>.md` (for Codex and any other agent).
  Each body reuses the existing wiki-grounded workflow (read the wiki → ground the change
  → update docs `needs_review` → append `log.md` → never auto-`verified`) and embeds a
  generation-time snapshot of the project's **domain map** (from `docs/llm-wiki/domains/`),
  so the agent immediately knows which docs to read for a change.
- **A `--skills` flag** on `init`/`quickstart` requests the artifacts; they are also
  emitted when the `claude` or `cursor` agent is selected. Opt-in and preview-first
  (`--dry-run` lists what would be created); existing skill/rule/prompt files are never
  overwritten. The tool only WRITES the artifacts — the agent runs them
  (recognize-don't-run). A repository that does not request skills is byte-identical.

## 1.14.4 — 2026-07-20

Domain-detection fix, from a maintainer review of a tester's output. No command,
option, `--format json`, or frontmatter contract change; zero runtime dependency added.

### Fixed

- **Domain detection no longer scans into virtualenvs / installed dependencies.** On a
  Python project with a version-suffixed virtualenv (e.g. `venv3.10/`), the scan
  descended into `venv3.10/Lib/site-packages/` and generated dozens of empty domain
  docs for third-party libraries (passlib's `handlers/`, boto3's `resources/`, …),
  because the venv name was not in the skip list and `site-packages` was not excluded.
  Now: a directory containing `pyvenv.cfg` is treated as a virtualenv and skipped
  wholesale (name-agnostic, so `venv3.10`/`.venv-py39`/etc. are all caught),
  `site-packages`/`dist-packages` are excluded from traversal, and version-suffixed
  `venv*`/`env<N>` directory names are skipped. A repository without a virtualenv is
  unaffected (byte-identical); the project's own `handlers`/`routers`/… domains are
  still detected.

## 1.14.3 — 2026-07-20

Onboarding orientation, from a second exposure report. A first-time user could not tell
what the tool does from the bare command, and a Korean tester asked for Korean output.
No command, option, `--format json`, or frontmatter contract change; zero runtime
dependency added.

### Added

- **A bilingual (KO+EN) orientation header on `llm-wiki` / `--help`.** The bare command
  now leads with what LLM-WIKI is, why it helps (the agent grounds on a verified wiki
  instead of re-deriving from code), and the 3-step flow (scaffold → paste the handoff
  prompt into your coding agent → human review & verify) — instead of opening straight
  into the Usage list.
- **The package version and an `@latest` tip in `--help`.** Help now shows `llm-wiki
  vX.Y.Z` and recommends `npx …@latest`, so a stale npx cache (which silently reuses an
  old version) is noticeable.
- **A bilingual `About · 소개` line on `quickstart` output**, so a user who runs
  `quickstart` directly (without reading `--help`) still gets oriented.

## 1.14.2 — 2026-07-20

Usability polish following the first successful external end-to-end run (a backend
developer ran the handoff prompt and extracted a full wiki). Reduces the confusing
noise a reviewer sees and surfaces one silent failure. No command, option,
`--format json`, or frontmatter contract change; no runtime dependency added.

### Fixed

- **Colon-line evidence notation (`file:10`) is now accepted** alongside `file#L10`
  (and `file:10-20` alongside `file#L10-L20`). An enriching agent that writes evidence
  the way editors and grep emit it no longer trips a false `evidence.missing`; the
  reference resolves to the source with a validated line range.
- **Generated `templates/*.template.md` are no longer reported as orphans.** They are
  intentional, expected-unlinked scaffolds, so a freshly created wiki stops showing
  false-positive orphans in `graph`/`stats`. Genuinely unlinked docs are still flagged.

### Added

- **A warning when the wiki output path is gitignored.** If `docs/llm-wiki` is ignored
  by git, `init --write`/`quickstart` now emit a `structure.output_gitignored` warning
  (never a block) and `doctor` reports it — catching the silent case where generated
  docs are created but never tracked by git.
- **A reassurance summary on `init --write`.** A one-line `N created, N overwritten,
  N kept (existing files preserved)` summary makes it clear what was and was not touched.

## 1.14.1 — 2026-07-20

Bug-fix batch from the post-1.14 exposure test. On-ramp and brownfield-fit fixes; no
new commands, options, `--format json` fields, or frontmatter changes, and no runtime
dependency added.

### Fixed

- **Non-UTF-8 manifests no longer mis-type the project.** A manifest saved as UTF-16
  or UTF-8-with-BOM (common on Windows, e.g. a PowerShell-redirected `requirements.txt`)
  was read as UTF-8, turned into mojibake, and made detection miss the framework
  keyword — so a FastAPI backend was mis-typed as `library`. A BOM-aware reader now
  backs every detector manifest/source read (UTF-16LE, UTF-16BE, and UTF-8 BOM). Files
  without a BOM decode exactly as before; the wiki-doc encoding scan is unchanged.
- **Handoff prompt no longer points at adapter files that were never created.** Without
  an explicit `--agent`, `quickstart`/`init` create no adapter files, yet the handoff
  prompt still opened by telling the receiving agent to first read a non-existent
  `AGENTS.md`/`CLAUDE.md`. The prompt now names adapter files only for explicitly
  selected agents and otherwise points at `docs/llm-wiki/index.md`.

### Changed

- **`init`/`quickstart` with no mode flag now reads as guidance, not an error.** Running
  either with neither `--dry-run` nor `--write` previously printed a `Blocked` report
  (exit 2), which read as a failure. It now renders `Ready (needs --write)` with a
  `Next Step` and exits 0 (matching the `next` command's `ready` result). Requesting
  both `--dry-run` and `--write` at once is still rejected.
- **The handoff `Next Step` now explains the workflow.** It spells out that the
  `Handoff Prompt` is not run by the CLI but pasted into a coding agent (Claude Code /
  Codex) opened in the repo — which then reads the code and fills in the docs
  (including per-domain `domains/*.md`) for a human to review and mark `verified`.
- **`quickstart` output is brownfield-aware.** The skipped count is annotated with its
  reason (e.g. `skipped: 18 (18 already exist, kept)`), and when a wiki already exists
  so nothing new is created, a note points to enriching the existing docs via the
  handoff prompt (or re-scaffolding with `--existing overwrite`) instead of reading as
  "the tool did nothing".

## 1.14.0 — 2026-07-16

Stdlib-server detection (Gate 19) — the final minor of the "detect & adapt breadth"
line. Additive and opt-in; CLI, `--format json`, the programmatic API, and the
frontmatter contract are unchanged, and no runtime dependency is added.

### Changed

- Role inference now classifies a Go `net/http` server and a Python stdlib HTTP server
  (`http.server`/`socketserver`) as `backend` instead of `library`, via a bounded,
  exclusion-guarded source scan: a Go file that imports `net/http` **and** calls
  `ListenAndServe`/`http.Serve`, or a Python file that imports `http.server`/`socketserver`
  **and** starts a server (`serve_forever` / `HTTPServer(...)`).

### Notes

- One-directional and conservative: the signal only promotes `library`→`backend`, only on
  a strong import + server-start pair, and never demotes an existing `backend`. An
  `http.client`-only library stays `library`. Recognition only — a read-only source scan
  (maxDepth 4, file cap, skips vendored/test/example dirs); no framework dependency
  required; zero-dependency preserved. Scope: `GATE_REVIEW.md` (Gate 19). This completes
  the `1.12`–`1.14` detect & adapt breadth line.

## 1.13.0 — 2026-07-16

Infra/DevOps project profile (Gate 18) — the second minor of the "detect & adapt
breadth" line. Additive and opt-in; CLI, `--format json`, the programmatic API, and
the frontmatter contract are unchanged, and no runtime dependency is added.

### Added

- A new `infra` project type. `detectInfra` recognizes Docker (`Dockerfile`), Docker
  Compose (`docker-compose.y*ml`/`compose.y*ml`), Kubernetes (a top-level or
  conventional-directory `*.yaml`/`*.yml` carrying both `apiVersion:` and `kind:`),
  Helm (`Chart.yaml`), and Terraform (`*.tf`).
- An infra document set created by `init` (`profiles/infra.md`, `DEPLOYMENT.md`,
  `RUNBOOK.md`, `SERVICE_TOPOLOGY.md`).

### Notes

- `infra` is a **fallback** type: it is chosen only when no app signal
  (frontend/backend/library/mobile) is present, so a containerized app repo (a backend
  with a `Dockerfile`) keeps its app type and existing outputs are byte-identical — only
  genuine IaC-first repos (previously `unknown`) become `infra`.
- Recognition only: no cluster/registry access, no deploy, no dependency graph parsed
  (zero-dependency preserved); a bounded, exclusion-guarded scan. Scope: `GATE_REVIEW.md`
  (Gate 18).

## 1.12.0 — 2026-07-16

Mobile project profile (Gate 17) — the lead minor of the post-`1.11` "detect &
adapt breadth" line. Additive and opt-in; CLI, `--format json`, the programmatic
API, and the frontmatter contract are unchanged, and no runtime dependency is added.

### Added

- A new `mobile` project type. `detectMobile` recognizes Android
  (`build.gradle`(.kts)/`settings.gradle` with the Android Gradle plugin or AndroidX,
  or a nested `AndroidManifest.xml`), Flutter (`pubspec.yaml` with a `flutter:` section
  / `sdk: flutter`), Apple/iOS (a `Podfile`, an Apple-platform `Package.swift`, or an
  `*.xcodeproj`/`*.xcworkspace`), and React Native (a `react-native` dependency).
- A mobile document set created by `init` (`profiles/mobile.md`, `PLATFORM_MATRIX.md`,
  `SCREENS.md`, `BUILD_RELEASE.md`).

### Fixed

- An Android `build.gradle` project was misclassified as JVM `library`; mobile signals
  now take precedence in `decideType`, so it is detected as `mobile`.

### Notes

- Recognition only: no build tool (Gradle/Xcode/CocoaPods) is invoked and no dependency
  graph is parsed (zero-dependency preserved). Detection uses manifest signals plus a
  bounded, exclusion-guarded scan. Repos with no mobile signal are byte-identical
  (a plain JVM/Dart project is not reclassified). Scope: `GATE_REVIEW.md` (Gate 17).

## 1.11.1 — 2026-07-16

Behavior-preserving internal refactor: the monolithic `src/commands.js` was split
into focused sibling modules under `src/commands/`. No user-facing change — the
CLI, `--format json` output, the programmatic API (the frozen `commands` map and
individual exports), and the frontmatter contract are byte-identical, and no
runtime dependency is added.

### Changed

- Extracted reusable logic out of `src/commands.js` (~4,119 → ~1,612 lines) into
  `src/commands/{references,findings,scans,wiki-graph,adapters,wiki-files,fix-migrate,domains,doc-templates}.js`,
  wired back through a barrel re-export so every `from "./commands.js"` import and
  the public API surface stay identical. Dependencies are one-directional (leaf
  parsers → wiki-graph/adapters → scans → fix-migrate → `commands.js`);
  `migrateCommand` stays in `commands.js` because it calls the `audit` pipeline,
  which keeps the module graph acyclic (same pattern as `graphCommand`/`statsCommand`).

## 1.11.0 — 2026-07-15

Cross-repository knowledge links (Gate 15→16). Recognize a reserved, non-fetching
cross-repo reference scheme so cross-repo references stop tripping the missing-target
rules — the last planned `1.x` minor. Additive; CLI, JSON, programmatic-API, and
frontmatter contracts unchanged, and no runtime dependency is added.

### Added

- A reserved cross-repo reference scheme `repo:<name>/<path>` (alongside existing
  `http(s)://` URLs) recognized as external in `[[wiki links]]` and in
  `source_files` / `evidence` / `related`. Recognized references are treated as
  external — not flagged `wiki_link.missing` / `related.missing` /
  `source_files.missing` / `evidence.missing` / `markdown_link.missing` — but are
  NEVER fetched or verified (verification would need network/git). This also hardens
  the classifier so URL-form `[[..]]` wiki links stop emitting false
  `wiki_link.missing`. Source: `src/commands.js` (`isCrossRepoReference`,
  `isExternalSourceReference`).

### Notes

- Recognition only — no network, no git, no new dependency (zero-runtime-dependency
  preserved). Additive: local (in-repo) resolution is unchanged; a genuinely missing
  local link is still flagged. Scope: `GATE_REVIEW.md` (Gate 16, accepted). Actually
  following/resolving cross-repo references stays out of scope (a future major, if
  ever). This completes the split `1.7`–`1.11` roadmap line.

## 1.10.0 — 2026-07-15

Monorepo profile (Gate 15). An opt-in `monorepo` command validates each workspace
package's wiki and aggregates the results. Additive; the single-repo CLI, JSON,
programmatic-API, and frontmatter contracts are unchanged, and no runtime
dependency is added.

### Added

- `llm-wiki monorepo` — detects npm/yarn `workspaces` (an array or `{ packages }`),
  runs the existing cwd-parameterized validate over each package that has a
  `docs/llm-wiki/`, and aggregates. The result carries a strictly additive
  `packages[]` roll-up (path, per-package result, finding count) plus
  package-path-prefixed `findings` that drive the exit code. Each package honors its
  own `llm-wiki.config.json`. pnpm / `pnpm-workspace.yaml` are reported as
  unsupported (YAML is not parsed — zero dependency). Source: `src/detector.js`
  (`detectWorkspaces`), `src/commands.js` (`monorepoCommand`). Exposed on the CLI
  and the programmatic-API `commands` map.

### Notes

- Opt-in and additive: the new `packages[]` field and per-package findings appear
  only in the `monorepo` command, so single-repo command output is byte-identical.
  Read-only aggregation; the `1.0.0` contracts and zero-runtime-dependency policy are
  preserved. Scope: `GATE_REVIEW.md` (Gate 15, accepted). Deeper globs and
  pnpm/YAML workspaces are deferred; cross-repo links are the next minor (`1.11`).

## 1.9.0 — 2026-07-15

Visibility governance (Gate 14). Opt-in consistency lints for the already-required
`visibility` field, built on the 1.8 config `rules` toggle. Additive and opt-in;
CLI/JSON/programmatic-API/frontmatter contracts unchanged; no runtime dependency
added.

### Added

- Two opt-in, off-by-default, warning-level, read-only lints that reuse the
  sensitive-info scan:
  - `visibility.public_sensitive` — a `visibility: public` document whose content
    matches the sensitive-info scan (a public doc must not carry sensitive-looking
    values).
  - `visibility.declared_mismatch` — a `contains_sensitive_info: false` document
    whose content matches the scan (the declaration contradicts the content).
  Enable either per project via the `rules` map (e.g.
  `"visibility.public_sensitive": "warning"`). The raw sensitive value is never
  included in the finding — only a redacted count. Source: `src/commands.js`.
- Policy: `docs/llm-wiki/VISIBILITY.md` documents the `internal`/`restricted`/`public`
  levels and the value-vs-content consistency policy.

### Notes

- Additive/opt-in and read-only; the rules never default to `error`/`blocked`
  (preserving the additive `1.0.0` invariant), the `sensitive.*` category stays
  non-toggleable, and this checks value-vs-content consistency only — not access
  control. Scope: `GATE_REVIEW.md` (Gate 14, accepted). Next planned minor: `1.10`
  monorepo profile.

## 1.8.1 — 2026-07-15

Config schema growth, part 2 — custom document sets and template overrides. These
complete Gate 13's three config features (rule toggles shipped in 1.8.0). Additive
and opt-in; CLI/JSON/programmatic-API/frontmatter contracts unchanged; no runtime
dependency added.

### Added

- Custom document sets: a `requiredDocs` array in `llm-wiki.config.json` adds
  project-specific required documents to the core/profile set, checked by the same
  `structure.required_doc` machinery (validation only — `init` does not scaffold
  arbitrary custom docs). Source: `src/config-file.js`, `src/commands.js`.
- Template overrides: a `templates` map points a generated wiki doc at a
  project-local template. Only the override's body is used — the standard CLI
  frontmatter always wraps it, so an override can NEVER set `status: verified` (a
  hard, structural guardrail); a missing override file falls back to the built-in
  template. Source: `src/commands.js`.
- `doctor` echoes `requiredDocs` and `templates` counts in its config line.

### Notes

- Additive/opt-in; the `1.0.0` contracts and the zero-runtime-dependency policy are
  preserved. Scope: `GATE_REVIEW.md` (Gate 13, accepted). This completes the config
  schema growth line; visibility governance is the next planned minor (`1.9`).

## 1.8.0 — 2026-07-15

Config schema growth — per-project rule toggles (Gate 13). The first feature slice
of the config-schema-growth line, built on the 1.7.2 enabling prep. Additive and
opt-in; the CLI, JSON, programmatic-API, and frontmatter contracts are unchanged,
and no runtime dependency is added.

### Added

- Per-project **rule toggles**: a `rules` map in `llm-wiki.config.json` turns a
  finding rule off or overrides its severity —
  `{ "rule.id": "off" | "blocked" | "error" | "warning" | "info" }`. Applied
  centrally over `audit`/`status`/`validate-frontmatter` findings (so `validate`
  and `next` inherit it), across the CLI, programmatic API, and MCP via the 1.7.2
  unified `resolveOptions`. Only registry rules are toggleable, and the
  sensitive-info category is never toggleable — config can never disable secret
  detection. Source: `src/config-file.js`, `src/commands.js`.
- `content.thin_body` — an opt-in enrichment lint (off by default) that flags wiki
  content documents with very little body prose. Enable it per project by setting
  `"content.thin_body"` in the `rules` map. It dogfoods the toggle machinery.
  Source: `src/commands.js`.
- `doctor` echoes the active rule-toggle count in its `llm_wiki_config` line.

### Notes

- Additive/opt-in; explicit/CLI values still win and the zero-runtime-dependency
  policy is preserved. Scope: `GATE_REVIEW.md` (Gate 13, accepted). The
  severity-registry consolidation pre-work was audited as behavior-preserving (0
  push-site/registry mismatches). Custom document sets and template overrides —
  the rest of Gate 13 — follow in `1.8.x`.

## 1.7.2 — 2026-07-15

Enabling prep for config schema growth (Gate 13). Additive and backward-compatible
— no CLI, JSON, programmatic-API, or frontmatter contract change, and no runtime
dependency added. Config now resolves consistently across all three surfaces, and
init/quickstart/doctor make it observable.

### Added

- `resolveOptions(overrides)` — a config-aware async companion to `normalizeOptions`
  in the programmatic API: it merges the project's `llm-wiki.config.json` (from
  `cwd`) like the CLI does and returns `{ options, errors }`. The sync
  `normalizeOptions` and the frozen `commands` map are unchanged. Source:
  `src/index.js`, `src/cli.js`.
- `init` / `quickstart --write` scaffold a minimal `llm-wiki.config.json` at the
  project root (seeded with the detected type and selected agents), additive and
  preview-first, and never overwriting an existing config. Source: `src/commands.js`.
- `doctor` echoes the effective config (`llm_wiki_config: present (type=...,
  agents=...)`, or a `present (invalid: N errors)` note) instead of a bare
  present/absent.

### Changed

- Config loading moved below the command layer: the MCP server now merges the
  inspected project's `llm-wiki.config.json` on every `tools/call` (a malformed
  config surfaces as `isError`), so the CLI, programmatic API, and MCP resolve the
  same effective options. Source: `src/cli.js` (`applyProjectConfig`),
  `src/mcp/dispatch.js`. Previously only the CLI merged config (the Gate 11 honest
  limit).

### Notes

- Additive/opt-in: explicit/CLI values still win, config only fills unset fields and
  can additively turn `strict` on; the `1.0.0` contracts and the zero-runtime-
  dependency policy are preserved. Scope: `GATE_REVIEW.md` (Gate 13, proposed). This
  is the enabling prep that lets real config usage accrue before `1.8` grows the
  schema (custom document sets, rule toggles, template overrides).

## 1.7.1 — 2026-07-15

Patch. Repository hygiene only — no CLI, JSON, programmatic-API, or frontmatter
contract change, and no runtime behavior change.

### Fixed

- `src/commands.js` embedded a raw `U+0000` (NUL) control byte as the delimiter in
  the `wikiGraph` edge-dedup key (`collectWikiGraph` → `addEdge`). Git's
  `text=auto` classified the file as binary, so it was the one source file exempt
  from the repo's `.gitattributes` `eol=lf` normalization and was stored with CRLF.
  Replaced the raw byte with the `\u0000` escape and renormalized the file to LF, so
  it now conforms to the line-ending policy like every other source file.

### Notes

- No functional change: `\u0000` in the template literal produces the same NUL code
  point at runtime, so edge deduplication is byte-identical. The bulk of the commit
  diff is the one-time CRLF→LF renormalization of `src/commands.js`.

## 1.7.0 — 2026-07-15

CI/CD adoption. Make the wiki easy to wire into GitHub Actions and release
automation. This is the lead slice of the split "Team & org scale" line.
Backward-compatible — an additive command mode, a composite action, and a
release job only; the CLI, JSON, programmatic-API, and frontmatter contracts are
unchanged, and no runtime dependency is added.

### Added

- `release-notes --body-only` — emits only the change-section body (no
  frontmatter, no H1 title, no "review before publishing" scaffold line) for use
  as a GitHub Release body. Commit subjects flow into the body, so it is scanned
  for sensitive-looking values and BLOCKED (exit 2, body withheld) on a match.
  Source: `src/release-notes.js`, `src/commands.js`, `src/cli.js`.
- A composite GitHub Action at `.github/actions/validate/action.yml` that wraps
  the read-only `validate` via `npx`. It pulls in NO other actions (only bash +
  npx), preserving the zero-runtime-dependency ethos, and can only read. Pin it
  by an exact `vX.Y.Z` tag or commit SHA.
- GitHub Release automation on a `v*` tag push: an isolated `contents: write` job
  in `.github/workflows/publish.yml` (`needs: publish`), body sourced from
  `release-notes --body-only`, created with the runner's built-in `gh` CLI (no
  third-party release action).
- Per-command `--format json` examples in `help` for the ten read-only report
  commands (`doctor`, `validate`, `validate-frontmatter`, `audit`, `status`,
  `next`, `stats`, `graph`, `explain`, `release-notes`).

### Notes

- Additive and backward-compatible; the zero-runtime-dependency policy is
  preserved. Scope: `GATE_REVIEW.md` (Gate 12). The CI/CD line was split, so
  `1.7.0` ships only the lead slice — Marketplace listing, a floating `@v1` tag,
  the config-loading/init-scaffolding/doctor-echo enabling prep, and `1.8`–`1.11`
  are deferred.

## 1.6.0 — 2026-07-14

Agent-native (MCP). Let agents query and check the wiki as tools instead of
shelling out. Backward-compatible — a new command and module only; the CLI,
JSON, programmatic-API, and frontmatter contracts are unchanged.

### Added

- `llm-wiki mcp` — a Model Context Protocol server over stdio (newline-delimited
  JSON-RPC 2.0), implemented with Node built-ins only (no third-party MCP SDK),
  preserving the zero-runtime-dependency policy. Register it in an MCP client
  with `{ "command": "npx", "args": ["-y", "@dowonk-7949/llm-wiki-standard", "mcp"] }`.
- Read-only MCP tools: `validate`, `audit`, `next`, `status`, `doctor`, `stats`,
  `graph`, `explain`, `handoff`, `prompt`. No write/mutating command is exposed —
  no MCP tool writes files (`annotations.readOnlyHint`). Each `tools/call` returns
  the command's structured result (with `schemaVersion`) as `structuredContent`
  plus a human-readable text summary; a thrown command surfaces as `isError`.
- Programmatic MCP surface from the package entry point: `startMcpServer`,
  `MCP_TOOLS`, `handleMcpMessage`, `MCP_PROTOCOL_VERSION`. Scope: `GATE_REVIEW.md`
  (Gate 11).

### Notes

- Backward-compatible and additive. Batching is not supported (removed in the
  pinned MCP protocol `2025-06-18`); an array message is answered with a single
  `-32600`. `llm-wiki.config.json` defaults are not merged into MCP tool calls in
  this version (explicit arguments only).

## 1.5.2 — 2026-07-14

Community standards. Repository-facing docs so the project meets GitHub's
recommended community standards. No CLI/API changes.

### Added

- Community health files at the repository root, bilingual (EN/KO):
  `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md` (each with a `.ko.md`
  pair), listed in `package.json` `files` so they ship with the package.
- GitHub templates: `.github/ISSUE_TEMPLATE/` (bug report, feature request,
  config) and `.github/pull_request_template.md`.

### Notes

- Repository/GitHub-facing only; the CLI command surface, JSON output, and
  programmatic API are unchanged. `.github/` templates are not shipped to npm.

## 1.5.1 — 2026-07-14

Programmatic API and output fixes found while smoke-testing the new 1.5 API from
a consuming project. All additive/refinements — the stable CLI, JSON, and
frontmatter contracts are unchanged.

### Fixed

- Command result objects now carry a top-level `schemaVersion` (equal to the
  exported `SCHEMA_VERSION`), so a programmatic result self-describes its output
  contract without importing the constant separately. `.text` remains the
  rendered text report in every case — `--format` affects only CLI/`run()`
  stdout and `--out` files, not the returned object; this is now documented.
- `normalizeOptions` accepts a `parseArgs(argv)` result directly (it reads the
  nested `.options`), so `normalizeOptions(parseArgs(argv))` no longer silently
  falls back to defaults. Passing a plain partial still works unchanged.
- `run(argv)` now returns the numeric exit code (`0`/`1`/`2`/`3`) in addition to
  setting `process.exitCode`, so in-process callers can branch on success.
- The `--format html` dashboard's Document Index links are now computed relative
  to the `--out` file's directory, so a dashboard written to a subfolder no
  longer produces broken (404) document links.

## 1.5.0 — 2026-07-14

Programmatic API. Let CI wrappers, editors, and tests use LLM-WIKI in-process
instead of spawning the binary. Backward-compatible — a new import surface and
one additive JSON field only.

### Added

- Importable programmatic API via `package.json` `exports` (`.` → `src/index.js`).
  It exposes a frozen `commands` map keyed by CLI command name, the individual
  command functions, `parseArgs`, `run`, `normalizeOptions` (builds a complete
  options object from a partial override), and `SCHEMA_VERSION`. Return shapes
  are documented with JSDoc typedefs and in `docs/llm-wiki/PUBLIC_API.md`.
- `--format json` output now carries an additive top-level `schemaVersion`
  integer (equal to the exported `SCHEMA_VERSION`), so wrappers can pin the
  output contract. Single source: `src/config.js` `JSON_SCHEMA_VERSION`.

### Notes

- Additive and backward-compatible: existing JSON fields are unchanged, so
  current `--format json` consumers keep working; non-JSON output (text,
  markdown, html, and graph mermaid/dot) is unaffected. Deep external imports of
  internal modules are now encapsulated by the `exports` map; the `llm-wiki`
  binary is unaffected.

## 1.4.0 — 2026-07-14

Knowledge you can see. Make the wiki's knowledge navigable and measurable, and
broaden domain detection. Backward-compatible — new read-only commands and
additive detection only.

### Added

- `llm-wiki graph` — emit the knowledge graph (documents + doc→doc links resolved
  from wiki `[[links]]`, `related`, and markdown links) as text, JSON, Mermaid
  (fenced `graph TD`), or Graphviz DOT. `--format` for `graph` accepts
  `text|json|mermaid|dot`.
- `llm-wiki stats` — a read-only health snapshot: a health score (mean of
  verified %, enrichment %, and evidence coverage %) plus document status mix,
  stale-verified, and orphan counts.
- The `--format html` dashboard gains a navigable **Document Index** (every
  document with inbound-link count and orphan flags), and a "Publishing for
  Human Readers" guide (GitHub/GitLab, Obsidian, MkDocs) in the README.
- File-based domain detection for `init`: backend/fullstack domains defined as
  route/resource module files (FastAPI/Flask/Express/Rails/Go —
  `endpoints/routers/routes/resources/controllers/handlers/*.ext`) are now
  detected alongside directory-per-domain layouts, via a bounded, exclusion-
  guarded scan tuned for near-zero false positives (`GATE_REVIEW.md`, Gate 10).

## 1.3.0 — 2026-07-14

Detect & adapt breadth. Fit more projects and more tools out of the box.
Backward-compatible — new detection, adapters, and opt-in acceptance only.

### Added

- Backend/fullstack `init` now detects business-domain directories (immediate
  subdirectories of `src|app/{domains,domain,modules,features}` and
  `internal/{domain,domains,modules}`, excluding common technical dirs) and
  creates a per-domain document (`domains/NN_<name>.md`, `doc_type: domain`,
  `source_files` = detected dirs) linked from `domains/00_overview.md`.
  Deterministic ordering; duplicate domains across locations merge into one doc.
- Ecosystem detection for PHP (`composer.json`), Ruby (`Gemfile`/`gems.rb`), and
  .NET (`*.csproj`/`*.fsproj`), classified backend vs library by web-framework
  signals.
- Adapters for Windsurf (`.windsurf/rules/llm-wiki.md`) and Gemini CLI
  (`GEMINI.md`) as writable adapters; JetBrains AI (`.junie/guidelines.md`) as an
  info-level candidate. `--agent all` stays codex/claude/antigravity for
  backward compatibility.

### Changed

- `type` (OKF) is now accepted as an alias for the required `doc_type` field, so
  OKF-style documents validate without duplicating the field. Additive — nothing
  is removed or renamed.

## 1.2.0 — 2026-07-14

Safe upgrades & migration. Keep an existing wiki in step with the CLI's contract
instead of deleting and regenerating it. Backward-compatible — new opt-in
behavior only.

### Added

- `wiki_block_version`-aware upgrade report: `migrate` (and `doctor`) show the
  contract gap between each document's recorded block version and the installed
  CLI. `CURRENT_WIKI_BLOCK_VERSION` is now the single source for the stamped value.
- `migrate --apply` is unblocked under an accepted, preview-first scope
  (`GATE_REVIEW.md`, Gate 8). It reuses the `fix` engine plus a
  `wiki_block_version` upgrade: it brings a document to the current contract and
  stamps its block version once it conforms. It never edits `verified` documents'
  content or changes `status`, and never downgrades documents stamped by a newer
  CLI.
- `llm-wiki drift`: reports `evidence.stale` drift on `verified` documents, and
  with `--downgrade` moves drifted documents to `needs_review` (`status` +
  `last_updated` only, never a promotion to `verified`; `GATE_REVIEW.md`, Gate 9).

### Changed

- `evidence.stale` gains line-level granularity: when a source is cited only by
  exact `#Lx-Ly` evidence, drift is checked against those lines instead of the
  whole file, so unrelated edits no longer flag it. Any broad reference keeps the
  file-level check.
- `VERSIONING.md` and `project-profile.md` are now version-agnostic — they point
  at `package.json` as the single version source instead of hardcoding a number.

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
