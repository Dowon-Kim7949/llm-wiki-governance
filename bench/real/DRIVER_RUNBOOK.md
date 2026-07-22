# Real-LLM bench — manual-driver runbook (option B)

> **Status: PROTOCOL (not yet executed).** This is the *coding-agent-as-driver* path
> from [`../REAL_LLM_METHODOLOGY.md`](../REAL_LLM_METHODOLOGY.md) §5, option 2. It needs no
> API key: you drive a real coding agent (Claude Code, Codex, Cursor, …) by hand through the
> same six tasks the deterministic proxy uses, and record the model's real usage. Until a run
> lands, **no token / speed / productivity claim ships in the README or launch copy** (same
> rule as [`../METHODOLOGY.md`](../METHODOLOGY.md) §10).

## What this measures

For each task, the agent answers **twice**:

| Arm | Tools it may use | First step | Represents |
| --- | --- | --- | --- |
| **B — no-retrieval** | the agent's own `read` + `grep` | Read the SOURCE only; do NOT read `docs/llm-wiki`. | today's default agent |
| **B2 — retrieval** | `search_docs` / `get_doc` / `get_related` (from `llm-wiki mcp`) + `read` + `grep` | QUERY THE WIKI first; fall back to source only if the wiki does not answer it. | the wiki-as-memory agent |

The **B2-vs-B delta** — input tokens, wall-clock, tool calls, and graded answer quality — is
the real before/after-retrieval result. Both arms answer the *same* task on the *same* repo, so
the difference isolates the retrieval mechanism.

## Non-negotiable rules

1. **Both arms in the SAME agent/model.** Never run B in one agent and B2 in another — that
   confounds the model with the mechanism and the number is worthless. One run = one agent.
2. **Label the model/agent on every result.** Claude Code → the Claude model in use; Codex →
   the GPT-family model in use. The delta is model-specific; a bare "−N%" with no model is not
   publishable.
3. **Fresh session per (task, arm).** 6 tasks × 2 arms = 12 clean sessions (× N repeats). A
   prior answer left in context leaks the answer into the next run.
4. **Symmetric prompt.** Identical task text for both arms; only the *Approach* line and the
   *available tools* differ (below). A token delta must reflect the mechanism, not phrasing.
5. **Cold keywords only.** The task questions deliberately avoid internal symbol names
   (`detectMobile`, `applyRuleConfig`, `TOOL_DEFS`, …) — those are what the wiki hands you, so
   putting them in the question would rig B. Do not "help" either arm with symbol names.
6. **N ≥ 3 repeats per (task, arm).** Agents are stochastic even with tools. Report mean +
   spread, never a single lucky run. State N in the result.

## Setup

1. **Wiki must be built + enriched.** On this repo it already is (docs are `verified`). On any
   other repo: `llm-wiki init --write` → enrich each doc from code → human-verify.
2. **Wire the retrieval tools for B2** — the read-only `llm-wiki mcp` server exposes
   `search_docs` / `get_doc` / `get_related` (snake_case MCP names). Command:
   `npx llm-wiki-governance mcp` (or, in this repo, `node bin/llm-wiki.js mcp`).
   - **Claude Code:** add an MCP server entry (`.mcp.json` at the repo root, or `claude mcp add`)
     pointing at that command.
   - **Codex:** register the same command in Codex's MCP server config (Codex supports MCP;
     the exact config location/format is version-specific — see your Codex MCP docs). The
     server and its tool names are identical; only the registration syntax differs.
   - **Cursor:** add it to the project MCP config.
3. **B must NOT have the wiki tools.** Simplest: run B in a session with the `llm-wiki mcp`
   server **not attached**, so `search_docs`/`get_doc` don't exist, and the prompt says read
   source only. (The agent's own `read`/`grep` still work — that's the point of B.)

## The prompt

Slot each task's question into this exact template (do not paraphrase):

```
You are a senior engineer answering a code-comprehension question about this repository.

Question: <TASK QUESTION>

Approach: <ARM FIRST STEP>
Available tools: <ARM TOOLS>.

Give a precise answer that names the responsible file(s) and symbol(s) and explains the mechanism.
Keep the answer focused; do not read more than you need.
```

**Arm B** — `Approach:` = `Answer by reading the SOURCE CODE only (grep for the terms, then read the matching files). Do NOT read docs/llm-wiki.` · `Available tools:` = `read, grep`

**Arm B2** — `Approach:` = `Answer by QUERYING THE WIKI first: search_docs for the terms, then get_doc the most relevant matches. Only fall back to reading source if the wiki does not answer it.` · `Available tools:` = `search_docs, get_doc, get_related, read, grep`

(These are byte-identical to `runner.js` `buildPrompt` / `ARMS`. `node bench/real/runner.js --dry`
prints the task list and confirms each prompt builds.)

## The six tasks

| # | id | Question | Ground-truth files (answer must rest on these) |
| --- | --- | --- | --- |
| 1 | `type-detection-mobile` | How does project-type detection decide a project is `mobile`, and where is the Android build.gradle → library misclassification corrected? | `src/detector.js` |
| 2 | `audit-pipeline` | How does the `audit` command compose the scan family into findings, and how is severity graded? | `src/commands.js`, `src/commands/scans.js` |
| 3 | `config-merge` | How is llm-wiki.config.json merged consistently across the CLI, the programmatic API, and MCP? | `src/cli.js`, `src/index.js`, `src/config-file.js` |
| 4 | `rule-toggle` | How do config rule toggles turn a finding off or override its severity, and why can't sensitive.* be toggled? | `src/commands/findings.js` |
| 5 | `skill-generation` | Where are the wiki-grounded skill artifacts (Claude skill / Cursor rule / neutral prompt) generated, and what is the never-overwrite guarantee? | `src/commands/skills.js` |
| 6 | `mcp-tools` | Which commands are exposed as MCP tools, and how is the read-only (no write command) guarantee enforced? | `src/mcp/tools.js`, `src/mcp/dispatch.js` |

Per-task answer-quality rubrics (the key claims a correct answer must state) live in
`runner.js` `RUBRICS` — grade against them (below).

## Procedure

For each task (1–6), each arm (B, then B2), each repeat (1..N):

1. Open a **fresh** agent session (no carried-over context).
2. For B2, confirm `search_docs` is available; for B, confirm it is not.
3. Paste the composed prompt. Let the agent work to a final answer.
4. **Record** (table below): input tokens, output tokens, wall-clock, tool-call count, which
   files/docs it opened, and the final answer text.
   - Claude Code: read usage from `/cost` (or the session-end usage line).
   - Codex: read the session's token-usage display (verify your version surfaces it — if it
     doesn't, you cannot get the token metric from this driver; use the SDK path instead).
5. After all runs, **grade** each answer against the task rubric (see Grading).

## Record (one row per run)

```
agent,model,task_id,arm,repeat,input_tokens,output_tokens,wall_ms,tool_calls,opened_ground_truth(y/n),rubric_score(0-1),hallucinated(y/n)
```

Keep the raw answer text alongside (a folder of `.md` files, or a column) so grading is auditable.

## Grading

- **Located?** Did the answer rest on the task's ground-truth files (opened them, or cited them
  correctly)? Necessary but not sufficient.
- **Correct?** Fraction of the task's `RUBRICS` key-claims the answer actually states, plus a
  hallucination flag (did it assert something false?).
- **Blind if possible.** The grader (a human, or a separate LLM-judge instance) should not know
  which arm produced an answer. The harness never self-grades.

## Aggregating the result

Per task and overall, compute **B2 relative to B** for each metric (e.g. `mean(B2.input_tokens) /
mean(B.input_tokens)`). The headline is the input-token ratio and the answer-quality comparison.

**Read the ratio, not the totals.** Absolute token totals include the agent's own system prompt
and tool scaffolding, which differ by agent — so totals are **not** comparable across agents.
The within-agent B2/B ratio cancels that shared overhead, so it *is* the portable quantity.

## Honesty caveats (read before quoting any number)

- **Model-labeled.** State the agent + model + N. A Codex number and a Claude Code number are
  different results — never merge them or compare arms across agents.
- **Tooling vs knowledge (threat #3).** B2's win could come from *better tools*, not the *wiki
  content*. If the headline hinges on B2, add a third arm — B2 with the retrieval tools over an
  **empty/stub wiki** — to separate tooling from knowledge.
- **Benchmark ≠ real work (threat #6).** The honest ceiling of even a good result is "on these
  six tasks, on this repo, with this agent."
- **Still forbidden until measured.** The proxy's −80% is `chars/4`, not a real run. Only a
  completed run of this protocol (or the SDK path) with real, model-labeled token counts can
  support a README/launch claim.

## Which driver, and cross-agent runs

- **SDK path** (`runner.js` + `agent.js`, REAL_LLM_METHODOLOGY §5 option 1) gives the cleanest
  per-call token usage but needs API access + budget.
- **This manual path** (option 2) needs only a coding-agent subscription (e.g. Claude Code /
  Codex / Cursor) — no API key — at the cost of hand-recording usage.
- **Running it in more than one agent is a feature, not a duplication.** A result that holds for
  both a Claude agent and a GPT agent is far more defensible than a single-agent one — it
  answers "is this Claude-specific?". Just keep each run's two arms within the same agent and
  label the model.

## SDK path (option 1) — wired driver `agent.js`

The manual-driver path above captures a single **total** token count per run. The SDK driver
`bench/real/agent.js` instead reports a real **input/output token split** (from the model's own
`usage`), which the subagent path can't. It plugs into `runner.js` via the `agentRunner` seam and
reuses the same `ARMS` / `buildPrompt` / tasks — so the protocol (symmetric prompts, cold
keywords, N≥3, model-labeled) is identical; only the token accounting is finer.

**READ-ONLY & safe on external repos.** The driver's tools only read/grep files under
`BENCH_TARGET_REPO` and shell out to the read-only `llm-wiki` retrieval CLI
(`search-docs`/`get-doc`/`get-related`) against `BENCH_WIKI_CWD`. No writes, no git, no network
beyond the model call — pointing it at `csap-roadkeeper-frontend@aws-global` never mutates that
repo (arm B additionally refuses to read `docs/llm-wiki`, and B2 reaches the wiki only via the CLI).

**Prerequisites (a real run spends API budget — confirm before running):**
1. `cd bench/real && npm install` — installs `@anthropic-ai/sdk` **here only** (bench is outside
   the npm `files` allowlist, so the published package stays zero-dependency).
2. Credentials: `export ANTHROPIC_API_KEY=...` (or `ant auth login`).
3. Point at the target + wiki + tasks (env, all absolute):
   - `BENCH_TARGET_REPO` — repo under test (its source is what arm B reads / arm B2 falls back to).
   - `BENCH_WIKI_CWD` — dir holding `docs/llm-wiki` the B2 tools query (defaults to `BENCH_TARGET_REPO`;
     for the fresh-wiki condition, point at a de-drifted copy).
   - `BENCH_TASKS` — e.g. `bench/tasks-csap.json` for the external csap protocol (else this repo's tasks).
   - `BENCH_MODEL` — default `claude-opus-4-8`; label it on every reported result.
4. Run each arm at N≥3:
   ```
   node bench/real/runner.js --arm B  --repeats 3
   node bench/real/runner.js --arm B2 --repeats 3
   ```
   Results (with per-run `inputTokens`/`outputTokens`/`wallMs`/`toolCalls`/`openedPaths`/`wikiDocs`)
   land in `bench/results/real-<arm>-<stamp>.json`. Validate the wiring first with no model call:
   `BENCH_TASKS=bench/tasks-csap.json node bench/real/runner.js --dry`.

Grade the answers against each task's `rubric` (in `tasks-csap.json`) the same way as the manual
path — blind if possible; the harness never self-grades.

## Cross-agent track (GPT-family) — next step

To answer "is the result Claude-specific?", run the **same** protocol through a GPT-family agent.
That needs a sibling driver (e.g. `bench/real/agent-openai.js`) using the OpenAI SDK — a separate
file with its own `OPENAI_API_KEY`, exposing the same `agentRunner` shape so `runner.js` is
unchanged. Keep both arms within one agent and label the model on the result; never compare an arm
across agents. (Not built yet — the Anthropic `agent.js` is the reference; mirror its tool set and
usage accounting.)
