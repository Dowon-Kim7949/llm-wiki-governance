# React + Node full-stack walkthrough

Language: **English** | [한국어](./README.ko.md)

A React client and an Express server live in npm workspaces (`client/`,
`server/`) and meet at one API contract (`shared/orders-contract.json`). This
walkthrough shows how the wiki follows a change across that boundary: one contract
change touches three documents, and a server-only change touches only the server
side.

## Run it

```console
node examples/react-node-fullstack/scripts/walkthrough.mjs
```

It works in a temporary git repository and ends with a PASS/FAIL table (15 checks).
`--keep` keeps the repository, `--quiet` prints only the table, and `--cli <path>`
selects another CLI. You need Node.js 18.18+ and git. Nothing is installed or
started: the CLI reads the files, it does not run them.

## What it shows

1. **Detection of a workspace repository.** The root `package.json` names no
   framework, so detection says `unknown`. `init --dry-run` adds a hint: the member
   manifests name React and Vite (`client`) and Express (`server`), so `--type
   fullstack` fits. The detected type is deliberately not changed: a repository
   initialized without a type detects it again on every `validate`, and changing
   it would make new documents required there.
2. **`init --write --type fullstack`** records the type in `llm-wiki.config.json`,
   and `validate --strict` stays clean. (Before 1.40.0 an explicit type over a
   detected `unknown` was a warning on every run.)
3. **Documents per side and one for the contract.** The client domain, the server
   domain, and `API_CONTRACTS.md` cite the code on each side and the contract file.
4. **One change, several documents.** Adding a field to the contract makes `impact`
   fail for all three documents. Moving both sides and the three documents in the
   same change passes.
5. **One side only.** Sorting orders in the server route flags the server document
   and the contract document, not the client one.

## What it does not show

- **That both sides agree.** The contract file is a document the code is typed
  against by hand. Nothing here generates types from it or checks that the server
  returns what the client expects; that is a contract test's job.
- **Running the app.** No `npm install`, no build, no server.
- **Per-workspace wikis.** One wiki covers the repository; `llm-wiki monorepo` (one
  wiki per package) is not used here.
