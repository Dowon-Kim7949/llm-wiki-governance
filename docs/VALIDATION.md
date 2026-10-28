> Language: [English](./VALIDATION.md) | [한국어](./VALIDATION.ko.md)

# Validation: what has been shown, how to reproduce it, and what has not

This page lists what `llm-wiki-governance` has been checked against outside its own
wiki, the exact commands that reproduce each check, and the claims that are **not**
supported yet. It was written for 1.40.0 (2026-10-28) from runs on one machine; the
evidence labels below say which claims were run and which are only recorded.

## Evidence labels

| Label | Meaning |
| --- | --- |
| **Verified** | Run for this page, with the result shown. |
| **Recorded** | Found in earlier releases, CI runs or benchmarks, not re-run for this page. |
| **Inferred** | Follows from code or from verified results, not run directly. |
| **Proposed** | Not implemented or not measured. |
| **Unknown** | No evidence either way. |

Runs for this page: Windows 11, Node.js 22.14.0, git 2.39.2. The CI matrix (Ubuntu,
Windows, macOS × Node 18.18 / 20 / 22 / 24) runs the same tests on every pull request,
but it had not run on this branch when this page was written: **other platforms are
Recorded for earlier releases and Unknown for this one** until CI runs.

## Reproduce everything

Prerequisites: Node.js 18.18 or later, git. No `npm install`, no model, no API key.

```console
git clone https://github.com/Dowon-Kim7949/llm-wiki-governance.git
cd llm-wiki-governance
npm test                      # every check below, including the four walkthroughs
node examples/greenfield-vue-demo/scripts/demo.mjs walkthrough
node examples/vue3-typescript-demo/scripts/demo.mjs walkthrough
node examples/python-fastapi-brownfield/scripts/walkthrough.mjs
node examples/react-node-fullstack/scripts/walkthrough.mjs
```

Each walkthrough works in a temporary git repository, prints each command's real
output, ends with a PASS/FAIL table, and deletes the repository (`--keep` keeps it).
Expected: `All N checks passed.` and exit code 0.

## Stack matrix

| Stack | How it was checked | Status |
| --- | --- | --- |
| Vue 3 + TypeScript, new project (greenfield) | `examples/greenfield-vue-demo`, 23 checks: empty repository → plan → approval → implementation → linked evidence → code change flagged → requirement change listing its linked files → clean final state | **Verified** (end to end, scripted) |
| Vue 3 + TypeScript, existing code (brownfield) | `examples/vue3-typescript-demo` (`tests/vue-demo-walkthrough.test.js`) | **Verified** (end to end, scripted) |
| Python / FastAPI, existing code | `examples/python-fastapi-brownfield`, 21 checks: detection from `pyproject.toml`, agent adapters, an invented citation caught, retrieval, `impact`, `drift` both ways | **Verified** (end to end, scripted; Python itself never runs) |
| React + Node (Express), npm workspaces, shared API contract | `examples/react-node-fullstack`, 15 checks: workspace hint, `--type fullstack`, one contract change flagging three documents, a one-sided change flagging only its side | **Verified** with an explicit `--type fullstack`; detection alone says `unknown` |
| Go, Rust, JVM, PHP, Ruby, .NET | Detection unit tests (`tests/verification.test.js`) | **Partial**: detection only, no end-to-end run |
| Flutter, Android, iOS, React Native | Detection unit tests; one `init --write` test for Flutter | **Partial**: detection and init only |
| Terraform, Docker, Helm, Kubernetes | Detection unit tests (`infra`) | **Partial**: detection only |
| Svelte / SvelteKit | `svelte` is a frontend signal; nothing else | **Unknown** |
| pnpm workspaces | Not parsed (YAML would need a dependency); `monorepo` reports it as unsupported | **Not supported** |

Recognizing a manifest is not support for a framework. Every stack above shares one
mechanism: documents cite files, line ranges, Markdown sections, or names. `#symbol:`
only checks that the file mentions the name; no language is parsed, so a citation of a
Python function that the file merely mentions in a comment still resolves.

## What the checks show (Verified)

- **A project can start before its code exists.** `init --greenfield` writes no
  fabricated source; an approved requirement with nothing linked is `info`
  (`evidence.planned_unlinked`), never "implemented".
- **Planned knowledge becomes source-backed knowledge** once the requirement cites
  the implementing files and tests; from then on the same `validate`, `impact` and
  `drift` watch it.
- **Invalid evidence is caught**: a citation of a function that does not exist fails
  `validate --strict` (Python walkthrough, step 4).
- **Source changes find their documents**, and only those: `impact` flags the
  documents whose cited files changed (all four walkthroughs).
- **Requirement changes find their linked files** (1.39.0, `impact.plan_changed`):
  both when code moved with the requirement and when it did not (greenfield, steps
  7-8).
- **One change can concern several documents**, and a one-sided change concerns one
  side (full-stack, steps 4-6).
- **CI behavior follows the governance mode**: `impact.source_changed` is off in
  lite, a warning in standard, an error in strict (`tests/governance-modes.test.js`,
  Recorded since 1.30.0 and re-run in `npm test`).
- **Every finding has a documented resolution**: re-read and re-approve, or
  `drift --downgrade` (each walkthrough resolves what it triggers).

## What the checks do not show (also Verified, as limits)

- **A resolving citation does not make a sentence true.** The Python walkthrough
  changes "20%" to "25%" in a document while the code says 20; `validate --strict`
  passes (step 10).
- **An approved requirement is not an implemented one**, and a linked file is not
  proof that an acceptance criterion holds. No command runs your tests.
- **A file that changed in the same diff as its requirement is not proof it
  implements the change** (greenfield step 7 marks such files `changed`, nothing
  more).
- **Date-anchored drift has edge cases**: a change committed on the review day is not
  reported (Python step 8); a late merge with no later commit to the file is not
  reported at all (N-15, `tests/known-gaps.test.js` GAP 5); squash and rebase merges
  of a branch reviewed before merging are over-reported.
- **An agent-approved document is not human-reviewed.** `reviewed_by` records the
  name given to `review --approve`; this repository's own wiki is approved by an
  agent by a recorded maintainer decision (`AGENTS.md`), which is not a recommended
  policy for adopters.
- **A clean CLI result does not replace application tests**, and the walkthroughs
  never run the applications.

## AI agent integration

- **Verified (deterministic):** `init --agent claude --agent codex` writes `CLAUDE.md`,
  `AGENTS.md`, `.claude/skills/…` and `.agents/skills/…`, all pointing at
  `docs/llm-wiki/index.md` (Python walkthrough, step 2). Prompt generation and skill
  contents are covered by `tests/prompt-*.test.js`, `tests/skill-token-budget.test.js`
  and `tests/shipped-assets.test.js`.
- **Not verified:** whether an agent follows those instructions. No model was run for
  this page, by decision: it would spend a subscription for an anecdote of one run.

## Efficacy

- **Recorded, not re-run:** earlier paid benchmark runs in `bench/` measured token
  use and answer quality with and without a wiki. Their limits are in
  [`BENCHMARK_DISCLOSURE.md`](./BENCHMARK_DISCLOSURE.md) and in the results
  themselves (one target, agent-graded with sampled human checks, a proxy token
  count). They do not show that this tool reduces defects or saves developer time.
- **Not measured:** task completion, regressions, review effort, documentation repair
  effort, or time saved in a real team.
- **Proposed protocol** for a controlled comparison, if it is ever budgeted: the same
  set of coding tasks on the same repository at the same commit; arms with no wiki,
  a stale wiki, and a maintained wiki; one agent configuration per arm, isolated
  tool access per arm; a rubric written before the runs and graded by a model from a
  different family plus a human sample; report completion, correct-file
  identification, regressions caught by the project's own tests, wall time, and
  per-call token counts from the API, not a proxy.

## Usability

- **Scripted only.** Every command above was run by a script or by the maintainer's
  agent. **No independent developer has followed the README for this page.** Whether
  someone new can install, understand and validate the tool without help is
  **Unknown**.
