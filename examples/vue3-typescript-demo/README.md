> Language: [English](./README.md) | [한국어](./README.ko.md)

# Vue 3 + TypeScript demo

A small Vue 3 task list, a project wiki written from its source, and the one gate that
makes the wiki worth keeping: when a pull request changes code that a reviewed document
describes, `llm-wiki impact` fails until the document is updated and reviewed again.

Everything runs locally. No API key, AI service, server, or database is involved, and the
app's data is mock data in memory.

## What you will see

| Step | Command | Expected result |
| --- | --- | --- |
| 1. Initialize | `llm-wiki init --write` | 10 scaffold documents and `llm-wiki.config.json`; `validate` passes |
| 2. Create project knowledge | `npm run demo:enrich` | Two documents written from the Vue source replace their scaffolds |
| 3. Validate and review | `llm-wiki validate --strict`, `llm-wiki review --approve …` | 0 findings; both documents become `verified`; baseline commit |
| 4. Change source code | `npm run demo:change-source` | The task title limit goes from 80 to 120 characters |
| 5. Detect documentation impact | `llm-wiki impact --since HEAD` | **exit 1**: `DOMAIN_FEATURES.md` cites the changed file and was not updated |
| 6. Update and review | `npm run demo:update-doc`, `llm-wiki review --approve …` | The document says 120 and is `verified` again |
| 7. Confirm recovery | `llm-wiki impact --since HEAD` | exit 0 |

## Prerequisites

- Node.js 20.19+ or 22.12+ (required by Vite 8; the `llm-wiki` CLI alone runs on 18.18+)
- npm and git

## Run the whole scenario

```bash
cd examples/vue3-typescript-demo
npm install
npm run demo
```

`npm run demo` copies the app into a new git repository under your temporary directory,
runs every step there with the `llm-wiki` CLI installed by `npm install`, checks each exit
code, and deletes the copy. Your clone of this repository is not touched. It ends with:

```text
## Result
PASS  init --write                                         expected exit 0, got exit 0
...
PASS  impact detects the stale document                    expected exit 1, got exit 1
...
PASS  impact for that commit, as CI on a push sees it      expected exit 0, got exit 0

All 11 checks passed.
```

Each command's real output is printed in excerpt (summary, approvals, findings). Add
`-- --full` for the complete output or `-- --keep` to keep the repository it created.

## Run the app

```bash
npm run dev      # http://localhost:5173
npm run build    # vue-tsc type check, then vite build
```

The page lists three mock tasks. Adding a task trims the title and rejects an empty one or
one longer than 80 characters; open tasks are listed before done ones; the counter counts
open tasks whatever the filter. Those are the rules the wiki documents.

## Follow the steps by hand

`impact` compares git history and runs from the repository root, so work in a copy of the
demo that is its own repository, outside this one:

```bash
npm run demo:workspace -- ~/vue3-wiki-demo   # copies the demo and makes a first commit
cd ~/vue3-wiki-demo
npm install
```

The first commit uses your git identity. If git asks who you are, set `user.name` and
`user.email` first.

### Step 1 — Initialize

```bash
npx llm-wiki init --write
npx llm-wiki validate
npm run demo:enable-gate
```

`init` detects a `frontend` project and writes 10 documents under `docs/llm-wiki/`, all
`needs_review`, plus `llm-wiki.config.json` with `governance.mode: lite`. `lite` keeps the
document set small and does not ask for every scaffold to be filled in, so `validate`
passes. It also turns `impact.source_changed` off. `demo:enable-gate` turns that one rule
back on; explicit rules take precedence over the mode:

```json
{
  "type": "frontend",
  "governance": {
    "mode": "lite"
  },
  "rules": {
    "impact.source_changed": "error"
  }
}
```

### Step 2 — Create project knowledge

```bash
npm run demo:enrich
```

This copies the two documents in `enrichment/` over their scaffolds. In a real project you,
or your coding agent, write them from the code. The CLI generates the scaffold and a
prompt for that work (`/llm-wiki-bootstrap`); it does not write the knowledge itself.

- `ARCHITECTURE_CONVENTIONS.md` cites `src/main.ts`, `src/App.vue`, the two components,
  `src/types.ts` and the `build` script, and states the conventions they follow.
- `DOMAIN_FEATURES.md` cites `src/stores/tasks.ts`, with symbol-level evidence such as
  `src/stores/tasks.ts#symbol:MAX_TITLE_LENGTH`, and states the task rules, including the
  80-character title limit.

### Step 3 — Validate, review, and record a baseline

```bash
npx llm-wiki validate --strict
npx llm-wiki review
npx llm-wiki review --approve docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md --approve docs/llm-wiki/DOMAIN_FEATURES.md --reviewer "Your Name"
git add -A
git commit -m "docs: LLM-WIKI baseline"
```

`review` alone lists the `needs_review` backlog and changes nothing. `--approve` is the
only way a document becomes `verified`; it stamps `reviewed_by` and `reviewed_at` and
refuses a document with blocking findings. Only `verified` documents are guarded by
`impact`. The other five scaffolds stay `needs_review`, which `lite` allows.

### Step 4 — Change source code

```bash
npm run demo:change-source
```

`src/stores/tasks.ts`: `MAX_TITLE_LENGTH` goes from 80 to 120. The document still says 80.

### Step 5 — Detect documentation impact

```bash
npx llm-wiki impact --since HEAD
```

```text
## Summary
- result: fail
...
## Documents to re-review
| Document | Changed source it cites |
| --- | --- |
| `docs/llm-wiki/DOMAIN_FEATURES.md` | `src/stores/tasks.ts` |
...
## Findings
- [error] impact.source_changed docs/llm-wiki/DOMAIN_FEATURES.md: Verified document depends on src/stores/tasks.ts, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.
```

The exit code is 1, which is what fails a CI job. `ARCHITECTURE_CONVENTIONS.md` is not
listed because it does not cite the store.

### Step 6 — Update the document and review it again

```bash
npm run demo:update-doc
npx llm-wiki validate --strict
npx llm-wiki review --approve docs/llm-wiki/DOMAIN_FEATURES.md --reviewer "Your Name"
```

`demo:update-doc` makes the edit a person would: the rule text and the evidence line now say
120, `status` goes back to `needs_review` (an edited document is not reviewed yet), and a
review note records why. Approving it again stamps a new review.

### Step 7 — Confirm recovery

```bash
npx llm-wiki impact --since HEAD
git add -A
git commit -m "feat: allow 120-character task titles"
```

`impact` exits 0: the document changed together with the code. In CI, compare against the
pull request's base instead of `HEAD`; the workflow template this package ships,
[`templates/github-actions/llm-wiki-validate.yml`](../../templates/github-actions/llm-wiki-validate.yml),
runs `impact --since "origin/<base branch>" --strict` with `fetch-depth: 0`.

## Files the scenario changes

| File | Changed by | Change |
| --- | --- | --- |
| `docs/llm-wiki/**` | `init --write` | 10 documents created, all `needs_review` |
| `llm-wiki.config.json` | `init --write`, `demo:enable-gate` | Created with `mode: lite`; one rule added |
| `docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md`, `docs/llm-wiki/DOMAIN_FEATURES.md` | `demo:enrich`, then `review --approve` | Replaced with source-backed content, then stamped `verified` |
| `src/stores/tasks.ts` | `demo:change-source` | `MAX_TITLE_LENGTH` 80 → 120 |
| `docs/llm-wiki/DOMAIN_FEATURES.md` | `demo:update-doc`, then `review --approve` | Rule text 80 → 120, review note, re-stamped |

`demo:*` scripts only edit files; every `llm-wiki` command is the real CLI.

## What the checks prove, and what they do not

- **`validate`** checks structure: frontmatter, links, that cited files exist, that a cited
  symbol's name appears in its file, and sensitive-looking values.
- **`impact`** is file-level and diff-based: a `verified` document cites a file that changed
  and the document did not. It does not read the change. With Step 6 writing "100" instead
  of "120", `validate --strict`, `review --approve` and `impact` all still exit 0 (tried on
  this scenario). **The CLI does not check that a document is true**; the reviewer does, and
  `review --approve` records who that was.
- **`drift`** is date-based: it flags a `verified` document whose cited source was committed
  after the document's review date. `lite` turns it off. With it turned on in this scenario,
  a source change committed on the same day as the review was not reported, while `impact`
  reported it. Use `impact` to gate pull requests; `drift` is for documents that went stale
  over time.
- **CI** enforcement is the exit code. Nothing above runs unless your pipeline runs it.

## Restore a clean state

- `npm run demo` leaves nothing behind (the path is printed if you pass `-- --keep`).
- For the by-hand workspace, delete the folder and run `npm run demo:workspace` again.
- In this folder, `node_modules/` and `dist/` are git-ignored.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `llm-wiki-governance is not installed here` | Run `npm install` in this folder first. |
| `git is not available` | Install git and make sure it is on `PATH`. |
| `Please tell me who you are` from `demo:workspace` | Set `git config --global user.name` and `user.email`. |
| `npm run dev` fails on Node 18 | Vite 8 needs Node 20.19+ or 22.12+. |
| `impact` reports nothing | Run it from the repository root; approve the document first (`impact` ignores `needs_review`); check the rule in `llm-wiki.config.json` (`lite` turns it off). |
| `is inside an existing git repository` from `demo:workspace` | Pick a folder outside any repository, including this one. |
| PowerShell or cmd path | `npm run demo:workspace -- $HOME\vue3-wiki-demo` (PowerShell), `%USERPROFILE%\vue3-wiki-demo` (cmd) |

This scenario runs in this repository's test suite
([`tests/vue-demo-walkthrough.test.js`](../../tests/vue-demo-walkthrough.test.js)) against
the current CLI on every CI run, so the commands and exit codes above stay true. The
example is not part of the npm package.
