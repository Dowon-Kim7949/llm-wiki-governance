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
Windows, macOS × Node 18.18 / 20 / 22 / 24) then ran the same tests on pull request #8 at
commit `4c37b20` (2026-10-28). All 12 jobs passed, and so did the governance gate and the
consumer install on Ubuntu and Windows. Those are **Recorded** CI results, not runs made for
this page. The walkthroughs run inside `npm test`, so they ran on every platform in that
matrix.

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

## Clean-environment reproduction (Verified)

The runs above use the checkout's own `bin/llm-wiki.js`. A second run checked the
package a user would install: `npm pack` (69 files, 325,944 bytes), installed into a
new project outside the repository with an empty `HOME`, npm cache and npm config,
and no global or system git config. Against that installed copy:

- `--version` printed `1.40.0`, and the installed package declares no dependencies.
- The README Quick Start ran as written: `quickstart --write --type frontend --agent
  claude` on an existing project, and `quickstart --write --greenfield` in an empty
  repository, then `validate`, `review`, `status`, `next`, `stats` and `explain`.
  Every command exited 0.
- All four walkthroughs passed with `--cli` pointing at the installed package, run
  from a copy of `examples/` outside the repository.

Kept apart, because they test the example applications rather than this tool:
`python -I -m py_compile` on the FastAPI sources, `node --check` on the Express
server, the greenfield implementation's own tests (`node --experimental-strip-types
--test`, 4 passed), and `npm run build` (`vue-tsc` and `vite build`) for the Vue demo.
That build used dependencies already installed in the example, not a fresh install.
FastAPI, Express and React were never started.

Windows 11 / Node.js 22.14.0 only. This is an automated reproduction, not a person
following the README (see [Usability](#usability)).

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
- **The read-only MCP server and the programmatic API refuse a `since` that git would
  read as an option or a path** (1.40.0, `tests/git-revision-guard.test.js`). Five of
  its seven tests fail when the guard is removed, and none of them writes outside a
  temporary repository.

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
  of a branch reviewed before merging are over-reported; and a review branch squashed
  or rebased on the review day itself is taken as having seen what it landed on
  (`tests/drift-narrowing-baseline.test.js`). Git history cannot say what a reviewer
  looked at.
- **An agent-approved document is not human-reviewed.** `reviewed_by` records the
  name given to `review --approve`; this repository's own wiki is approved by an
  agent by a recorded maintainer decision (`AGENTS.md`), which is not a recommended
  policy for adopters.
- **A clean CLI result does not replace application tests**, and the walkthroughs
  never run the applications.

## Public claims and their evidence

What each claim in the README rests on. A claim is only as strong as the weakest
class listed for it.

| Claim | Evidence | Basis and limit |
| --- | --- | --- |
| No runtime dependencies | Executed | Packed tarball installed clean; `dependencies` is empty |
| Node.js ≥ 18.18; Windows, macOS, Linux | Recorded CI | 12 of 12 jobs on PR #8 (`4c37b20`): three OS × Node 18.18 / 20 / 22 / 24 |
| Detects Node, Python, Go, Rust, JVM, PHP, Ruby, .NET, mobile, infra | Executed tests; scripted walkthroughs for Vue, Python, React + Node | Detection is not framework support (stack matrix above) |
| Ships adapters for six agents | Executed tests | The files are written and point at the wiki |
| Agents follow those adapters and skills | **Not verified** | No model was run |
| Each citation is checked to resolve | Executed tests; scripted walkthroughs | Resolving does not make the sentence true |
| `drift` / `impact` flag documents whose cited sources changed | Executed tests; scripted walkthroughs | A flag means "re-read", not "wrong"; date checks have the limits above |
| An approved requirement is a plan, not an implementation | Executed tests; scripted walkthrough | `impact.plan_changed` lists files; it judges nothing |
| Every MCP tool is read-only | Executed tests (1.40.0) | Was not true before 1.40.0 ([GHSA-qwp4-w8vx-r72r](https://github.com/Dowon-Kim7949/llm-wiki-governance/security/advisories/GHSA-qwp4-w8vx-r72r)); `cwd` is not a sandbox ([SECURITY.md](../SECURITY.md#mcp-server-trust-model)) |
| Keyword retrieval, hit@5 85.0% | Executed on this repository's own wiki | Held-out queries on one corpus; not a general accuracy figure |
| A wiki that was never enriched measured worse than none | Real model runs, recorded | One external repository, one model, six tasks ([BENCHMARK_DISCLOSURE.md](./BENCHMARK_DISCLOSURE.md)) |
| It saves development time or reduces hallucinations | **Not verified** | Not measured |
| Someone new can adopt it from the README alone | **Not verified** | Automated reproduction only; no independent developer yet |

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
- **Proposed protocol** for a controlled comparison, if it is ever budgeted:
  - *Setup:* the same coding tasks on the same repository at a frozen commit; three
    arms (no wiki, a deliberately stale wiki, a maintained wiki); one agent
    configuration per arm with isolated tool access; tasks and their completion
    criteria written before any run.
  - *Grading:* the project's own tests decide completion where they can; the rest by
    a rubric written in advance, graded blind by a model from a different family and
    a human sample.
  - *Report:* completion, correct-file identification, regressions caught by the
    tests, wrong-claim rate in the agent's explanation, wall time, per-call token
    counts from the API (not a proxy), and the time spent keeping the wiki current —
    a wiki that costs more to maintain than it saves is a negative result.
  - *Accounting:* a subscription CLI does not give per-call usage or isolation
    between arms; only API runs can support cost claims. No run is made to produce a
    promotional number.

## Usability

- **Scripted only.** Every command above was run by a script or by the maintainer's
  agent. **No independent developer has followed the README for this page.** Whether
  someone new can install, understand and validate the tool without help is
  **Unknown**.
- **Protocol ready, not run:** [`USABILITY_PROTOCOL.md`](./USABILITY_PROTOCOL.md) is a
  one-hour session for a developer who has never seen the project, with a greenfield
  and a brownfield task, a checklist, and what to record. Results will be added here
  only from real sessions.
