# Orca agent role prompts

Start prompts for the five agent roles used to develop this repository under
[Orca](https://github.com/stablyai/orca). Each file is a complete prompt: paste
it into an agent session, or pass it when creating the worktree.

```bash
# Windows PowerShell
orca worktree create --repo name:llm-wiki-governance `
  --name review/142-compact-retrieval --agent claude `
  --prompt (Get-Content .orca/agents/04-review.md -Raw)

# bash
orca worktree create --repo name:llm-wiki-governance \
  --name review/142-compact-retrieval --agent claude \
  --prompt "$(cat .orca/agents/04-review.md)"
```

| File | Role | Writes code? |
|---|---|---|
| [`agents/01-research.md`](agents/01-research.md) | Product researcher — find one high-value improvement | no |
| [`agents/02-plan.md`](agents/02-plan.md) | Architecture planner — turn an issue into a plan | no |
| [`agents/03-implement.md`](agents/03-implement.md) | Implementation — build the approved plan | yes, in its own worktree |
| [`agents/04-review.md`](agents/04-review.md) | Adversarial reviewer — try to break it | no |
| [`agents/05-release.md`](agents/05-release.md) | Test & release verification — PASS / FAIL a candidate | no |

Every prompt inherits [`../AGENTS.md`](../AGENTS.md) ("Orca Parallel Agent
Rules"); the prompts add role-specific instructions on top rather than
restating them. The surrounding process — worktree naming, what parallelizes,
the hand-off format, the permission policy — is in
[`../docs/ORCA_PARALLEL_DEV.md`](../docs/ORCA_PARALLEL_DEV.md).

These files are development tooling. They are not part of the published npm
package (`package.json` `files` is an allowlist and does not include `.orca/`).
