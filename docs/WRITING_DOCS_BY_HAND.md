> Language: [English](./WRITING_DOCS_BY_HAND.md) | [한국어](./WRITING_DOCS_BY_HAND.ko.md)

# Writing docs by hand

You do not need a coding agent to use LLM-WIKI Governance. The checks look at what a document says and cites, not at who wrote it. This page walks one document from the scaffold `quickstart` creates to `verified`, then shows a change check catching a code change.

Commands are written as `npx llm-wiki …`, which works after `npm install -D llm-wiki-governance`. Without a local install, use `npx llm-wiki-governance …` instead.

## 1. Scaffold

```bash
npm install -D llm-wiki-governance
npx llm-wiki-governance quickstart --write
```

This creates `docs/llm-wiki/` and `llm-wiki.config.json`. Without `--agent`, no agent adapter files are created. The printed handoff prompt is for agents; you can ignore it.

## 2. Pick a document and replace the placeholders

Start with `docs/llm-wiki/project-profile.md`. Its body contains placeholder bullets such as "Concise summary: describe the project purpose…". Replace them with what is true of your project.

A document counts as not filled in (`content.not_enriched`) while its body still contains any of these generated phrases, and `review --approve` refuses it until they are gone:

- `Concise summary: describe`
- `Add file paths, symbols, routes, commands, or test names inspected`
- `Add source files and commands inspected while completing`
- `Add source files, tests, routes, and client modules inspected`
- `Track unclear ownership`
- `Keep uncertain claims here until source evidence`
- `List each domain, owner area`
- `이 프로젝트에서 해당 주제의 기준 정보를 정리합니다.` (Korean scaffold, `--doc-lang ko`)
- ``이 문서는 `llm-wiki init --write`가 생성한 초안입니다.`` (Korean scaffold)

`npx llm-wiki next` lists, per document, which sections still hold placeholders.

## 3. Cite what the document describes

In the frontmatter, list the files the document is about:

```yaml
source_files:
  - package.json
  - src/index.js
evidence:
  - src/index.js#symbol:addTodo
```

- `source_files` is file-level: any change to the file makes the document a candidate for re-review.
- `evidence` can be narrower: `path#L10-L20` (a line range), `path#symbol:name` (a symbol that must be mentioned in the file), `path#section:Heading` (a Markdown section), or `path#route:/api/x`. Line ranges and Markdown sections let `impact` ignore edits elsewhere in the file.
- Mention each `evidence` entry in the body's `## Evidence` section as well. `validate --strict` reports an entry the body does not mention.

Leave `status: needs_review`. The `author` and `last_edited_by` fields can stay as generated or name you; neither affects validation or approval.

## 4. Check and approve

```bash
npx llm-wiki validate          # structure and citations
npx llm-wiki review            # what is approvable, riskiest first
npx llm-wiki review --approve docs/llm-wiki/project-profile.md
```

`review --approve` writes `status: verified`, `reviewed_by`, and `reviewed_at`, and changes nothing else. `reviewed_by` comes from `--reviewer <name>`, then the `reviewer` key in `llm-wiki.config.json`, then your git `user.name`. The tool records that name; it cannot prove who ran the command. Who may approve is your project's decision.

Approving does not check that the prose is true. It records that someone decided it was.

## 5. Turn the change checks on and watch one fire

`quickstart` starts a new project in `lite`, where change checks are off. Turn them on and commit:

```bash
npx llm-wiki mode set standard --write
git add -A && git commit -m "wiki: project profile"
```

Now change a cited file and commit it:

```bash
# edit src/index.js
git commit -am "change addTodo"
npx llm-wiki impact --since HEAD~1
```

`impact` lists `docs/llm-wiki/project-profile.md` under "Documents to re-review" with the source that changed. Re-read the document, update what is no longer true, and approve it again. A flag means "check this", not "this is wrong": if the document is still accurate, approving it again is the whole fix.

Under `standard` the finding is a warning; under `strict` it fails the build. Use `drift` for the date-based view across history. On the day you approve, `drift` cannot see a change committed the same day, so test with `impact` first.

## Where to go next

- Governance modes and what each one checks: [README, Governance modes](../README.md#governance-modes)
- Running the checks in CI: [README, Run it in CI](../README.md#run-it-in-ci) and [OPERATIONS.md](./OPERATIONS.md)
- A rule you do not recognize: `npx llm-wiki explain <rule>`
- Something here did not work as written: [open a first-run report](https://github.com/Dowon-Kim7949/llm-wiki-governance/issues/new?template=first_run.yml)
