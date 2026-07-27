# Registry and awesome-list submissions — prepared entries

Ready-to-paste material for each target. **Nothing here has been submitted.** Submitting is the
maintainer's action; each target below is a PR or a form that posts under your account.

Verified facts used throughout (checked 2026-07-27 against `package.json` and source):
`llm-wiki-governance` v1.26.0 · MIT · Node ≥ 18.18.0 · 0 dependencies, 0 devDependencies ·
27 CLI commands · **17 read-only MCP tools** · repo `Dowon-Kim7949/llm-wiki-governance`.

The MCP server is started with `npx llm-wiki mcp` (stdio transport).

---

## Standard blurbs

**One line (≤ 100 chars)**
```
Governance for AI-written project docs: verify, catch drift, keep them code-grounded, enforce in CI.
```

**Two lines**
```
Read-only MCP server over a governed project wiki. Query docs, check verification state, detect
drift against real source. Zero dependencies; no write tool is exposed.
```

**Tool list (exact, 17)**
```
validate, audit, next, status, doctor, stats, graph, explain, handoff, prompt,
list_docs, search_docs, get_doc, get_related, onboard, review, prepare
```
Note when describing: `review` is exposed in **list mode only** — promoting a document to
`verified` is deliberately not reachable over MCP.

---

## MCP registries

### 1. `punkpeye/awesome-mcp-servers` (GitHub PR)

Category: **Knowledge & Memory** (verify current heading before editing; the list is reorganised
periodically). Entries are alphabetical within a section.

```markdown
- [Dowon-Kim7949/llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance) 📇 🏠 - Governance layer over an AI-maintained project wiki: query docs, verification state, evidence links and drift, all read-only.
```

Check the legend at the top of that README before submitting — the emoji key encodes language and
scope (📇 = TypeScript/JavaScript, 🏠 = local service) and has changed before.

PR title: `Add llm-wiki-governance (knowledge & memory)`

### 2. `modelcontextprotocol/servers` — community list (GitHub PR)

```markdown
- **[llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance)** - Read-only access to a governed project wiki: search and read docs, inspect verification state and evidence, detect drift against source.
```

Read `CONTRIBUTING.md` in that repo first; it has specific requirements about the server being
published and documented.

### 3. Glama (https://glama.ai/mcp/servers) — automatic

Glama indexes public GitHub repositories that expose an MCP server. It scores repos on README
quality, license, and maintenance. No submission form in the usual case; the practical action is
making the repo legible:
- Ensure the README's MCP section names the transport (stdio) and lists the tools. **Already true.**
- Keep `LICENSE`, topics, and description set. **Already true.**

If it hasn't appeared after a couple of weeks, there is a "claim/submit server" flow on the site.

### 4. mcp.so and PulseMCP — submission forms

Both take a short form: repo URL, name, one-line description, category, install command.

```
Name:        llm-wiki-governance
Repo:        https://github.com/Dowon-Kim7949/llm-wiki-governance
Install:     npx llm-wiki mcp
Category:    Knowledge / Documentation
Description: Read-only MCP server over a governed project wiki — search and read documents,
             inspect verification state and evidence links, detect drift against real source.
             No write tool exposed; promotion to verified stays a human CLI action.
```

---

## Awesome lists (non-MCP)

### `sindresorhus/awesome-nodejs`

Bar is high and the maintainers reject most submissions; consider this low-probability. If
attempted, the entry must be one line under **Command-line utilities** and the project needs to
look widely useful rather than niche:

```markdown
- [llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance) - Verify AI-written project docs against real code and enforce it in CI.
```

### Claude Code / agent-tooling lists

Several community lists exist (`hesreallyhim/awesome-claude-code` and similar). These have a
much better acceptance rate than the large generic lists and are a better fit — the skills
(`.claude/skills/llm-wiki-*`) are the natural hook there, not just the CLI.

```markdown
- [llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance) - Keeps a project wiki that Claude Code writes honest: evidence links to real code, drift detection, and a human-only approval step. Ships `/llm-wiki-*` skills and a read-only MCP server.
```

---

## Sequencing

1. **MCP registries first.** Highest fit, lowest effort, and the audience already understands the
   problem. Registry listings also accumulate quietly without needing a launch moment.
2. **Claude Code lists second.** The skills are the differentiator there.
3. **Show HN last**, and only when there is appetite to sit in the thread for two hours. A Show HN
   with no author replies performs worse than no Show HN.
4. Generic awesome-lists are optional and low-yield; skip unless bored.

## Measuring whether any of it worked

Baseline at 2026-07-27, before this round: **3 GitHub stars, 0 forks, 0 issues, 0 watchers.** npm
downloads are not a usable signal — this project's own CI installs the tarball on every push
across an OS matrix, and mirrors scrape new packages, so the ~1,500 July downloads are mostly not
people. **Stars, forks, and issues are the honest counters.** Re-check two weeks after submitting.
