> Language: [English](./README.md) | [한국어](./README.ko.md)

# LLM-WIKI Governance

A zero-dependency CLI that keeps an AI coding agent's project knowledge (`docs/llm-wiki/`) trustworthy and current. Every claim is tied to real code; when that code moves, the documents citing it get flagged; AI-written content stays behind human review; and you can enforce all of it in CI. Works on any stack, with any agent, and is OKF-compatible.

```text
Without:  task -> re-scan the codebase -> re-derive structure & rules -> work
With:     task -> read index.md -> read the relevant (verified) wiki docs -> inspect only the source you need -> work
```

## Quick start

```bash
npm install -D llm-wiki-governance
npx llm-wiki quickstart --write --type frontend --agent claude   # or --agent codex
```

`quickstart --write` detects the project, creates the wiki and adapter files, and prints a handoff prompt. Paste that prompt into your agent: it reads `docs/llm-wiki/index.md`, enriches the docs from real source files, and leaves everything `needs_review` for you to approve. Preview with `quickstart --dry-run`.

Add `--skills` (or `--agent claude|codex|cursor`) to also generate invocable, wiki-grounded automation prompts for `bootstrap`, `feature`, `fix`, and `docs-sync`. Already have an OKF or plain-Markdown knowledge folder? Point the CLI at it and `--profile okf-v0.1` adds verification, drift detection, and CI without changing your format.

The CLI itself needs no model. Only the enrichment step does, and that is where quality is decided — use your agent's strongest reasoning model for the first wiki build; routine `docs-sync` is fine on a cheaper one.

## What you get

- **Trust states.** AI-written docs stay `needs_review`; only a human promotes to `verified`. The CLI can never self-approve.
- **Evidence and drift.** Each claim links to a real file, line, or symbol. When that source moves, `evidence.stale` and `impact` flag the document for re-review.
- **CI enforcement.** `validate` runs in pre-commit or GitHub Actions, so an unreviewed or drifted wiki fails the build instead of rotting quietly.
- **Agent-queryable.** A read-only MCP server lets agents ask the wiki instead of re-scanning your code.
- **Safe by construction.** Preview-first writes, an append-only change log, sensitive-value redaction, and zero runtime dependencies.

## Commands

| Command | What it does |
| --- | --- |
| `quickstart` · `init` | Set up the wiki and adapter files, then print the agent handoff prompt. |
| `validate` · `audit` · `status` | Structure and safety validation for local checks and CI · full findings report · current wiki state. |
| `drift` · `impact` | Flag documents whose cited source has moved — by date, and by diff against a PR baseline. |
| `review` | Risk-ranked `needs_review` backlog; `--approve` is the only path to `verified`. |
| `mode` · `backfill` | Read or change the governance level · rebuild an incomplete wiki from what the repository can prove. |
| `onboard` · `prepare` | Learn a work area, or scope a change before implementing it. Read-only. |
| `list-docs` · `search-docs` · `get-doc` · `get-related` | Read-only retrieval that returns document content, with sensitive lines redacted. |
| `graph` · `stats` | Knowledge graph (text/JSON/Mermaid/DOT) · health snapshot. |
| `mcp` | Run the read-only MCP server. |
| `fix` · `migrate` · `handoff` · `prompt` · `check-run` · `harness-health` · `import-memory` | Scoped autofix, contract upgrade, agent prompts, and harness checks. |

Writes happen only on an explicit `--write`, `--apply`, or `--approve`; everything else is read-only. Add `--lang ko` for Korean findings messages, or `--doc-lang ko` to generate the wiki content in Korean. You can also import the package instead of shelling out (`import { commands, run } from "llm-wiki-governance"`).

Run `npx llm-wiki help <command>` for the full command, option, and exit-code reference offline, in English.

To run it in CI, copy [`templates/github-actions/llm-wiki-validate.yml`](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/templates/github-actions/llm-wiki-validate.yml), or reference the composite action in one step with an exact tag: `uses: Dowon-Kim7949/llm-wiki-governance/.github/actions/validate@v1.30.1`. Recipes sized to your repo are in [docs/OPERATIONS.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/OPERATIONS.md).

## Governance modes

How much documentation you maintain should match what the project needs now. One engine, three policy levels, switchable at any time in the same repository.

| | `lite` | `standard` | `strict` |
| --- | --- | --- | --- |
| Intent | development speed | speed and knowledge | completeness, verification, handoff |
| Docs after a code change | only what the code cannot show | when a domain, architecture, or contract moves | every affected document |
| Drift and missing-doc gate | off | reports (warning) | fails the build (error) |
| `audit` · `backfill` | on demand | on demand | core workflow |

```json
{ "governance": { "mode": "lite" } }
```

`init` and `quickstart` scaffold `lite` for a brand-new project. A project with no `governance` block resolves to `strict` — exactly the rule set this CLI enforced before modes existed — so upgrading changes nothing until you opt in. Structural and safety checks run in every mode: malformed frontmatter, a dangling `source_files` path, a broken link, and sensitive-info detection are never dialed down.

The intended path is months in `lite`, then `strict` before a handoff. `llm-wiki mode set strict --write` writes one config key and runs no scan, and `llm-wiki backfill` does the expensive reconstruction when you ask for it. Backfill labels every fact `verified`, `inferred`, or `unknown`, and never invents a rationale nobody recorded.

**Before you add `impact` to a required check:** under `strict`, `impact.source_changed` defaults to `error`, so `llm-wiki impact --since <ref>` fails a build without any flag. Set `governance.mode` to `standard` (advisory) or `lite` (off), or pin `"impact.source_changed": "warning"` in the `rules` map of `llm-wiki.config.json`. Background, the measured false-positive rates, and every escape hatch: [CHANGELOG.md](./CHANGELOG.md) (1.28.0).

## Agent-native (MCP)

`llm-wiki mcp` runs a [Model Context Protocol](https://modelcontextprotocol.io) server over stdio, using Node built-ins only. Register it in an MCP client:

```json
{ "mcpServers": { "llm-wiki": { "command": "npx", "args": ["-y", "llm-wiki-governance", "mcp"] } } }
```

Only read-only tools are exposed, so an agent can query the wiki but never write it, and promotion to `verified` stays a human CLI action. The server assumes a local stdio subprocess and has no authentication, so do not put it on a network without your own auth proxy — trust model in [SECURITY.md](./SECURITY.md#mcp-server-trust-model).

## Supported environments

| | |
| --- | --- |
| **Runtime** | Node.js ≥ 18.18.0 · Windows, macOS, Linux |
| **Dependencies** | none — no runtime third-party dependencies |
| **Detects** | Node · Python · Go · Rust · JVM · PHP · Ruby · .NET · mobile (Android / Flutter / iOS / React Native) · infra (Docker / Compose / Kubernetes / Helm / Terraform) |
| **Standards** | OKF-compatible — `--profile okf-v0.1` validates Open Knowledge Format `type`/`aliases`/`tags` |
| **Agents / editors** | Codex (`AGENTS.md`), Claude Code (`CLAUDE.md`), Cursor, GitHub Copilot, Windsurf, Gemini CLI — plus any MCP client |
| **Standalone** | the CLI works fully without any agent |

## Learn more

- [docs/OPERATIONS.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/OPERATIONS.md) — running LLM-WIKI on a small repo, a medium repo, or a monorepo: flags, CI cost, doc-count strategy.
- [BENCHMARK.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/BENCHMARK.md) — what was measured and what was not, including the runs that went against us. One result worth knowing up front: a wiki that exists but was never enriched measured *worse* than no wiki at all, so the value is in the maintained content, not in the retrieval tooling.
- [CHANGELOG.md](./CHANGELOG.md) · [ROADMAP.md](./ROADMAP.md) — shipped history and direction.
- [GATE_REVIEW.md](./GATE_REVIEW.md) — accepted safety scopes (fix / migrate / drift / MCP / skills) and release gates.
- [PUBLIC_API.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/PUBLIC_API.md) — the written command / configuration / programmatic-API / MCP reference. Its prose is Korean; `npx llm-wiki help <command>` is the English equivalent.
- [EXAMPLES.md](https://github.com/Dowon-Kim7949/llm-wiki-governance/blob/main/docs/llm-wiki/EXAMPLES.md) — worked examples.
- Community: [CONTRIBUTING.md](./CONTRIBUTING.md) · [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) · [SECURITY.md](./SECURITY.md).
