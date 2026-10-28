# Python (FastAPI) brownfield walkthrough

Language: **English** | [한국어](./README.ko.md)

A small order-pricing service written in Python already exists. This walkthrough
adds an LLM-WIKI to it from the code, and shows what the checks catch and what they
do not. It is the non-JavaScript counterpart of the
[Vue 3 demo](../vue3-typescript-demo/README.md).

## Run it

```console
node examples/python-fastapi-brownfield/scripts/walkthrough.mjs
```

It works in a temporary git repository and ends with a PASS/FAIL table (21 checks).
`--keep` keeps the repository, `--quiet` prints only the table, and `--cli <path>`
selects another CLI. You need Node.js 18.18+ and git. **Python is not needed**: the
CLI reads the files and never runs them. No model and no API key are involved.

## What is real and what is prebuilt

| Part | Real or prebuilt |
| --- | --- |
| The service (`app-src/`: FastAPI app, pricing rules, pytest tests, `pyproject.toml`) | prebuilt fixture, never executed |
| Every `llm-wiki` command and its exit code | real CLI |
| The two wiki documents an agent would write (`enrichment/`) | **prebuilt**. In a real project your agent writes them with the prompt `handoff` prints |
| The code changes and document edits | scripted edits |

## What it shows

1. **Detection without `package.json`.** `init` detects a Python backend from
   `pyproject.toml`, records `type: backend`, cites `pyproject.toml` in the
   generated documents, and names the project from `[project] name`.
2. **Agent wiring.** `--agent claude --agent codex` writes `CLAUDE.md`, `AGENTS.md`
   and both agents' skills, all pointing at `docs/llm-wiki/index.md`. Whether an
   agent then follows them is not tested here.
3. **Invalid evidence is caught.** A document that cites `#symbol:apply_coupon`,
   which does not exist, fails `validate --strict` with `evidence.symbol_unverified`.
4. **Retrieval.** `search-docs`, `get-doc --section` and `get-related` find the
   pricing rules.
5. **Code-to-document impact.** A new coupon in `app/services/pricing.py` makes
   `impact` fail for the document that cites it, and only that one.
6. **Drift, both ways.** A change committed on the review day is not reported by
   the date-anchored `drift` (a documented limit); `impact` on the commit is what
   catches it. A change committed on a later day is reported.

## What it does not show

- **That a sentence is true.** Step 10 changes "VIP20 takes 20%" to 25% in the
  document while the code still says 20; `validate --strict` passes, because the
  citation still resolves.
- **That a cited Python function exists as a definition.** `#symbol:` checks that
  the file mentions the name, not that it defines it; no language is parsed.
- **Python tests running.** pytest is never run here.
- **Lite defaults.** The walkthrough turns `impact.source_changed` and
  `evidence.missing` on by hand; a new project starts in lite, where both are off.
