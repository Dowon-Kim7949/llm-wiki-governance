# Git hook templates

`pre-commit` runs **two** checks, in the order that fails fastest:

1. `llm-wiki validate --changed` — structure of the wiki documents changed in
   this commit. Fast enough for an every-commit hook.
2. `llm-wiki impact --strict` — the omission gate: you changed a source file a
   `verified` document is grounded in and did not touch the document. With no
   `--since`, `impact` compares the working tree against `HEAD`, which is exactly
   the set about to be committed. This is the check the project exists for;
   `validate` cannot see it, because it checks the documents that exist, not the
   one that should have been touched.

Install one of:

- Copy it:
  `cp templates/git-hooks/pre-commit .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit`
- Point git at this directory:
  `git config core.hooksPath templates/git-hooks`

The hook uses `npx --no-install`, so add `llm-wiki-governance` as a
devDependency in the consuming project. Keep `--no-install`: this package's bin
is named `llm-wiki`, but npm also hosts an unrelated package under that name, so
a bare `npx llm-wiki` would download and run a stranger's code instead of
failing.

Errors block the commit; warnings do not. Add `--strict` to step 1 to block on
its warnings too — step 2 already passes it.

Two things decide whether step 2 can actually block:

- **Governance mode (1.30.0).** Under `lite` `impact.source_changed` is `off`
  and under `standard` it is a warning, so the step passes while catching
  nothing. Run `llm-wiki mode` to see where the project stands. Under `strict`
  (the level every pre-modes repository resolves to) it is an error and blocks
  with no flag.
- **Per-project config.** `"impact.source_changed": "warning" | "info" | "off"`
  in `llm-wiki.config.json`, or `rulesPreset: "relaxed"`, softens it deliberately.
  Do that rather than deleting the line — a hook that cannot block cannot govern.

Run the hook from the repository root (the `--changed` diff paths are resolved
relative to the git root).
