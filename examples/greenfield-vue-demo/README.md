# Greenfield demo: the wiki starts before the code

Language: **English** | [한국어](./README.ko.md)

A runnable scenario for a project that has **no code yet**. It starts from an
empty repository, records the plan (requirements, acceptance criteria, one
architecture decision), approves it, implements one requirement in a small
Vue 3 + TypeScript app, links the code and tests to that requirement, changes
the code, and shows `impact` naming the requirement that has to be reviewed
again. Since 1.39.0 it also runs the other direction: the owners change a
requirement before its code, and `impact` names the files that requirement links.

The [Vue 3 demo](../vue3-typescript-demo/README.md) is the brownfield
counterpart: there the app exists first and the wiki is written from it. The two
meet at step 5 below: from then on both are the same evidence-backed wiki.

> `--greenfield` ships in 1.38.0. The walkthrough runs the CLI of this checkout,
> which it finds next to `examples/` on its own; `--cli <path>` selects another.

## Run it

```console
node examples/greenfield-vue-demo/scripts/demo.mjs walkthrough
```

It works in a temporary git repository, prints each command's real output, and
ends with a PASS/FAIL table (23 checks; 21 on Node older than 22.6, where the
app's TypeScript tests cannot run without dependencies and are reported as
skipped, not passed). `--full` prints whole outputs, `--keep` keeps the
repository, and `--cli <path>` selects another CLI. You need Node.js 18.18+ and
git. No model and no API key are involved.

## What is real and what is prebuilt

| Step | What happens | Real or prebuilt |
| --- | --- | --- |
| 1 | An empty repository: a README and nothing else | real |
| 2 | `init --write --greenfield`, `handoff --greenfield`, `validate --strict` | real CLI |
| 3 | The plan: project profile, REQ-001, REQ-002 (deferred), ADR-0001 | **prebuilt** in [`planning/`](./planning/). In a real project your agent drafts these from what you tell it, with the prompt `handoff --greenfield` prints |
| 3 | `review --approve`. `--reviewer "Demo Reviewer"` stands in for the owners | real CLI |
| 4 | The implementation of REQ-001 | **prebuilt** in [`implementation/`](./implementation/); its tests are run for real on Node 22.6+ |
| 5 | Linking the code and tests to REQ-001 and ADR-0001 | **prebuilt** in [`linking/`](./linking/) |
| 5-9 | `validate`, `review`, `stats`, `search-docs`, `impact` | real CLI |
| 6-8 | The code change and the two requirement edits | scripted edits (`scripts/demo.mjs`) |

## The steps

1. **Start empty.** No manifest, no code, nothing to cite.
2. **Initialize for a new project.** `init --write --greenfield` adds
   `requirements/00_overview.md`, a requirement template, and an ADR-shaped
   decision template. No generated document cites a source, because none exists
   (`init` used to cite a `package.json` that was not there). `validate --strict`
   passes.
3. **Record and approve the plan.** Approving a requirement approves the plan.
   `validate` reports each approved plan with nothing linked as
   `evidence.planned_unlinked`, an **info** finding: true, never a build
   failure, and never "implemented". `stats` shows
   `planned_knowledge: 3 (approved 3); implementation evidence linked 0, unresolved 0, none 3`.
4. **Implement REQ-001.** `src/domain/approval.ts` holds the rule and
   `tests/approval.test.ts` has one test per acceptance criterion.
5. **Link the implementation.** REQ-001 cites the functions and the test file in
   its frontmatter `evidence`, and ADR-0001 cites the module header as a line
   range. `validate` checks that each reference exists, and the owners approve
   again. `stats` now shows `linked 2 ... none 1`. REQ-002 is deferred, so it
   stays an approved plan with nothing linked. The config then turns on
   `impact.source_changed` (`mode set standard --write` turns it on as a
   warning instead).
6. **Change the code.** A new rule: whoever requested a task cannot approve it.
   `impact --since HEAD` exits 1 and names REQ-001 only. ADR-0001 is narrowed out
   because the header lines it cites did not change, and REQ-002 cites no code.
7. **Update the requirement and review it again.** Add AC-5, approve, and
   `impact` passes, both on the working tree and on the commit. Because the
   requirement changed in the same diff, `impact` also lists what it links
   (`impact.plan_changed`, info): both files show as `changed`. That says they
   were edited, not that they implement AC-5; the test run checks that.
8. **Change a requirement before its code.** The owners decide that approvals
   expire (AC-6). No code changes. `impact` exits 0 and names
   `src/domain/approval.ts` and `tests/approval.test.ts` as `unchanged`: the
   files that will have to move. The JSON (`changedPlans`) shows the Acceptance
   Criteria section counted and the reworded Open Questions not counted. The
   owners approve the changed plan; AC-6 is planned, not implemented.
9. **Final state.** `validate --strict` passes. The one remaining finding is the
   info line for the deferred REQ-002.

To run the steps by hand, create the empty repository outside this checkout and
apply each edit with the same script:

```console
node examples/greenfield-vue-demo/scripts/demo.mjs workspace ~/greenfield-wiki-demo
cd ~/greenfield-wiki-demo
node <checkout>/bin/llm-wiki.js init --write --greenfield
node <checkout>/examples/greenfield-vue-demo/scripts/demo.mjs plan   # then: implement, link, enable-gate, change-source, update-requirement, change-requirement
```

## What this does not show

- **That the code meets the requirement.** A linked reference shows where
  REQ-001 is implemented. The tests passing checks it, and a person decides
  whether that is enough. No `llm-wiki` command runs your tests or judges a
  requirement.
- **Which code a requirement edit breaks.** Since 1.39.0 `impact` lists the files
  a changed requirement links, but only those it links, per file, and it judges
  none of them. Re-checking them against the new text is still a person's job.
- **Per-criterion tracing.** Evidence is tracked per document, so one
  requirement per document is the unit. Acceptance criteria inside a document
  are not tracked one by one.
- **Lite mode's defaults.** The demo turns on `impact.source_changed` by hand.
  A new project starts in lite, where `impact` and `drift` are off.
