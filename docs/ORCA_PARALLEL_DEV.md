# Parallel agent development with Orca

How this repository is developed using several AI coding agents at once, each in
its own [Orca](https://github.com/stablyai/orca)-managed git worktree, with a
human as the only approver.

This lives outside `docs/llm-wiki/` on purpose — like
[OPERATIONS.md](OPERATIONS.md), it is a working guide, not a governed wiki
document, so it is not part of the validated corpus.

The governing principle is the same one the product enforces: **agents write,
only a human verifies.** If the development process quietly promoted its own
work, the tool would not mean anything.

## The loop

```text
GitHub issue or improvement idea
        ↓  research agent      (read-only)
        ↓  planner agent       (read-only)
        ↓  implementation      (one worktree, one goal)
        ↓  adversarial review  (read-only)
        ↓  test & release      (read-only)
        ↓  human reads the diff, merges, and — separately — approves docs
```

Roles and their start prompts are in [`.orca/agents/`](../.orca/agents/); the
rules every role inherits are in [`AGENTS.md`](../AGENTS.md).

## Setup

The repository is registered with Orca once:

```bash
orca repo add --path .
orca repo list                 # confirm; note the repo name
```

Prerequisites: Node.js `>=18.18.0` (22 LTS recommended), git, `gh` authenticated,
Orca running (`orca status` → `runtimeReachable: true`), and whichever agent CLI
you use already logged in.

Capture a baseline **outside the repo** before the first parallel run, so you can
tell an agent's regression from a pre-existing condition:

```bash
npm test > ../baseline-test.txt
node bin/llm-wiki.js audit > ../baseline-audit.txt
node bin/llm-wiki.js doctor > ../baseline-doctor.txt
```

## Worktrees

One task, one worktree. Orca gives each its own checkout, so parallel agents do
not fight over the working tree.

```text
research/<topic>
plan/<issue>-<topic>
feat/<issue>-<topic>
fix/<issue>-<topic>
review/<issue>-<topic>
```

```bash
orca worktree create --repo name:llm-wiki-governance \
  --name feat/142-compact-retrieval --issue 142 --agent claude \
  --prompt "$(cat .orca/agents/03-implement.md)"

orca worktree ps                       # what every agent is doing
orca terminal read --terminal <handle> # bounded output from one of them
orca worktree rm --worktree branch:feat/142-compact-retrieval
```

Create the implementation worktree only **after** a plan is approved. Research
and planning do not need one each if they are only reading.

## What to parallelize

Parallel work pays when the agents read the same code but write **different
files** — typically when each produces its own report:

```text
A: public API / CLI contract audit
B: test coverage gaps
C: MCP trust boundary and input validation
D: docs vs. implementation drift
```

It does not pay when they write the **same** file. Three agents independently
editing `src/cli.js` produces three plausible diffs, and reconciling them costs
more than doing the work once. For that shape, run the pipeline serially:
plan → implement → review → fix → release.

Rule of thumb: **parallelize reading, serialize writing.**

## Workflows

**A — issue investigation.** Input: an issue or idea.
Research agent establishes current behavior → planner writes the implementation
plan → reviewer attacks the plan (not the code) → **human approves the plan**.

**B — approved implementation.** Input: an approved issue and plan.
Implementation worktree → code + tests + wiki updates + `log.md` + run manifest
→ reviewer diffs against `main` → fix agent clears blockers → release agent
validates the artifact → draft PR → **human reads the diff and merges**.

**C — documentation drift.** Input: recent code changes.
`impact --since <ref>` and `validate --changed` find the affected `verified`
docs → a docs-sync agent updates them to `needs_review` → `validate` → **human
runs `review --approve`**. That last step is never delegated.

## Definition of done

An agent saying "done" is not done. All of these must hold:

```text
[ ] the approved issue scope is met, and nothing beyond it was changed
[ ] tests were added, or there is a stated reason the existing ones suffice
[ ] npm test passes
[ ] npm run lint passes
[ ] npm run verify passes
[ ] node bin/llm-wiki.js validate --strict is clean
[ ] node bin/llm-wiki.js audit was reviewed
[ ] node bin/llm-wiki.js check-run is clean
[ ] public API / CLI / JSON-shape / exit-code impact is stated
[ ] Node.js 18.18 compatibility confirmed
[ ] no runtime dependency was added
[ ] related wiki docs updated and left needs_review
[ ] docs/llm-wiki/log.md appended
[ ] review --approve was NOT run by an agent
[ ] npm pack --dry-run reviewed (release candidates)
[ ] a human read the diff
```

## Hand-off format

Every agent ends with this, so one agent's output is the next one's input:

```markdown
# Agent Result

## Task
## Status            completed | blocked | needs_human_decision
## Facts             verified directly in the repository
## Assumptions       not yet verified
## Changes           files touched, behavior changed
## Validation        commands run, and their actual results
## Findings          blocker / major / minor / suggestion
## Risks             compatibility, security, operational
## Human Decisions   what only the maintainer can decide
## Recommended Next  planner | implementation | reviewer | release
```

Keep **Facts** and **Assumptions** apart. Most bad agent hand-offs are a
confident assumption wearing a fact's clothes.

## Permissions

| Role | read | edit | commit | push | PR | merge | approve docs |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Research | ✓ | | | | | | |
| Planner | ✓ | | | | | | |
| Implementation | ✓ | ✓ | ✓ | branch only | draft | | |
| Reviewer | ✓ | | | | comment | | |
| Release | ✓ | | | | report | | |
| Human | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Agents must not run:

```bash
npm publish
git push origin main
git push --force
git reset --hard
git clean -fdx
gh pr merge
llm-wiki review --approve
```

**A table in a document is a convention, not a control.** Orca does not enforce
per-role permissions. Two places actually enforce:

- [`.claude/settings.json`](../.claude/settings.json) — `deny` blocks a command
  outright; `ask` forces a confirmation prompt so it can never happen silently.
  Rules are declared for both the `Bash` and `PowerShell` tools, since this repo
  is developed on Windows.
- **GitHub branch protection** on `main` — the only thing that actually stops a
  push.

`review --approve` sits in `ask`, not `deny`, on purpose: the maintainer does run
it through an agent session, and a confirmation prompt keeps the human in the
loop without breaking that. Move it to `deny` if you would rather it be
impossible.

## MCP during development

The published server (`npx llm-wiki-governance mcp`) runs the *released*
version. When developing the package itself, point at the working tree instead —
that is what [`.mcp.json`](../.mcp.json) does:

```json
{ "mcpServers": { "llm-wiki-local": { "command": "node", "args": ["./bin/llm-wiki.js", "mcp"] } } }
```

The relative path resolves against the agent's working directory, so each
worktree gets its own copy — which is what you want, since the point is to test
the code in *that* worktree. Confirm with `node ./bin/llm-wiki.js status` before
relying on it.

The server is stdio-only and unauthenticated by design. Never expose it on a
network port. It exposes read-only commands only — document approval is not
among them. See [SECURITY.md](../SECURITY.md) for the trust model.

## Orca skills

The Orca CLI ships version-matched skill guides — check what you already have
before installing anything:

```bash
orca skills list
```

Install into the project workspace (not globally) only if something is missing:

```bash
npx skills add https://github.com/stablyai/orca --skill orchestration -y
```

`computer-use` is not needed here — this project has no browser UI to drive.

## What Orca does and does not give you

It gives you parallel execution, worktree isolation, status across agents, diffs,
and a place to read the results.

It does not give you roles, input material, permissions, pass criteria, a
hand-off format, or human approval gates. Those are the contents of this
document, and they are what makes the difference between five agents and five
plausible-looking diffs nobody can merge.
