# Launch kit — October 2026 (1.34.0)

Drafts only. **Nothing here has been posted, submitted, or changed in repository settings.**
Publishing is the maintainer's action, under the maintainer's accounts. Every line obeys
[`CLAIMS.md`](./CLAIMS.md); if a sentence here and that file disagree, that file wins.

Ground rules for everything below:

- No figure in a title, tagline, TL;DR, or first sentence.
- A figure, if used at all, travels with all four conditions (one repository, one model, six
  tasks, N=3, agent-graded) plus the task where retrieval lost, and a link to `BENCHMARK.md`.
- Volunteer the unfavourable facts before someone extracts them: the unenriched-wiki result, the
  file-level false positives, and the fact that this repository's own wiki is agent-approved.
- Never claim uniqueness. Claim a scoped combination and name the tools that cover parts of it.

---

## 1. Positioning

**Hypothesis evaluated:** "LLM-WIKI Governance maintains trustworthy, source-grounded project
knowledge for AI coding agents."

Not adopted as written. "Maintains" overclaims (the agent writes; the tool checks and records),
and "trustworthy" is a verdict the reader should reach, not one we assert.

**Adopted:**

> LLM-WIKI Governance puts the project knowledge your AI coding agents write and read under
> review: every doc carries a review state and checked source citations, and gets flagged when
> the code it cites changes.

> (KO) LLM-WIKI Governance는 AI 코딩 에이전트가 쓰고 읽는 프로젝트 지식을 검토 아래에 둡니다.
> 문서마다 검토 상태와 검사되는 소스 인용이 붙고, 인용한 코드가 바뀌면 그 문서가 표시됩니다.

## 2. Taglines

| Use | English | 한국어 |
| --- | --- | --- |
| Primary (matches `package.json`) | Governance for AI-written project docs. | AI가 쓴 프로젝트 문서를 위한 거버넌스. |
| Explanatory | Know which agent-written docs were reviewed, what code they cite, and when that code moved. | 에이전트가 쓴 문서를 누가 검토했는지, 어떤 코드를 근거로 했는지, 그 코드가 언제 바뀌었는지 압니다. |
| Developer-voice | Your agent writes the wiki. CI tells you when it went stale. | 위키는 에이전트가 쓰고, 낡은 문서는 CI가 알려 줍니다. |

## 3. The short versions

**30 seconds.** Coding agents write good project notes and never notice when those notes stop
being true. LLM-WIKI Governance is a small CLI that treats those notes like code: they start as
`needs_review`, they cite the files they describe, and when one of those files changes, the note
is flagged and CI can fail. It runs locally with no dependencies, and agents read the reviewed
notes through a read-only MCP server.

**One minute, technical.** The wiki is Markdown with YAML frontmatter in `docs/llm-wiki/`. Each
doc has a `status` (`needs_review` → `verified`), `reviewed_by`/`reviewed_at`, and citations in
`source_files` and `evidence` — files, line ranges, symbols, or Markdown sections. `validate`
checks the structure and that every citation resolves. `drift` compares a doc's review date with
git history for its citations; `impact --since <base>` takes a PR diff and names every `verified`
doc whose cited source changed while the doc did not, and it exits 1 under the strict mode. Only
an explicit `review --approve` promotes a doc. Retrieval is keyword-based, over the CLI or a
stdio MCP server that exposes 18 read-only tools. Zero runtime dependencies, Node ≥ 18.18, MIT.

**What it does not do** (say this early): it does not check that the prose is true, only that
citations resolve; it does not write docs; it cannot prove a human approved; it is not semantic
search; date-based drift has merge-strategy blind spots that the diff-based `impact` does not.

## 4. Differentiators, with the evidence for each

1. **Per-document review state, separate from "the file exists".** `needs_review` → `verified`
   only through `review --approve`; MCP cannot promote. Evidence: `src/commands.js` (`review`),
   `src/mcp/tools.js` (read-only tool list), `tests/mcp-tool-census.test.js`.
2. **A PR-time check that names the stale docs.** `impact --since <base>` is diff-based and fails
   the build under `strict`. Evidence: `src/commands/scans.js` (`scanReverseImpact`), this
   repository's own CI `governance` job.
3. **Citations that are checked to resolve**, including line ranges and Markdown sections.
   Evidence: the evidence scan in `src/commands/scans.js`.
4. **Policy levels instead of one rule set** (`lite` / `standard` / `strict`), switchable in place.
   Evidence: `src/commands/governance-mode.js`.
5. **It publishes what went against it.** An unenriched wiki measured worse than no wiki, a
   retrieval task lost, and known structural gaps are pinned as tests (`tests/known-gaps.test.js`).

Not differentiators (others do these too): drift detection on its own, an MCP server, a GitHub
Action, generating `AGENTS.md`/`CLAUDE.md`, MIT, zero dependencies.

## 5. GitHub repository presentation (suggestions; settings are the maintainer's)

- **About:** align with `package.json`: "Governance for AI-written project docs: verify, catch
  drift, keep them code-grounded, enforce in CI. OKF-compatible, zero-dependency."
- **Topics:** the current 18 are fine. `wiki` and `frontmatter` are in the npm keywords but not
  the topics; there is room for two more (limit 20).
- **Social preview:** none is set, so GitHub generates one. A plain image with the primary tagline
  is enough; no numbers on it.
- **Discussions** are on. A pinned "Show us your wiki / tell us where it broke" thread gives early
  users somewhere lower-stakes than an issue.

## 6. Show HN

**Title:** Show HN: LLM-WIKI Governance – review states and drift checks for AI-written docs

**Body** (the first-person framing in §6–§9 is a placeholder; rewrite it as your own story, and
add no number that is not in `CLAIMS.md`):

> I kept letting Claude Code write project notes for itself, and kept finding notes that
> described code that had since moved. Nothing in an `AGENTS.md` or `CLAUDE.md` says whether a
> sentence was reviewed or what it was based on.
>
> LLM-WIKI Governance is a zero-dependency Node CLI for that. The agent writes a Markdown wiki
> with frontmatter; every doc starts as `needs_review`, cites the files it describes, and only an
> explicit `review --approve` marks it `verified`. In CI, `impact --since <base>` takes the PR
> diff and fails when a source changed but a `verified` doc that cites it did not. Agents read the
> wiki through a read-only MCP server.
>
> What it doesn't do: it checks that citations resolve, not that the prose is true; it can't
> prove who approved (it records a name); search is keyword-only; and the gate is file-level, so
> touching a widely cited file flags a lot of docs.
>
> The result I'd most like pushback on: in a controlled run on one external repo (one model, six
> tasks, N=3, agent-graded), a wiki that existed but was never filled in cost more input tokens
> than no wiki at all. So the value is in maintained content, which is exactly what the tool is
> trying to keep honest. Details and the runs that went against it: [BENCHMARK.md link]
>
> Disclosure: this repo runs the tool on itself, and its own wiki is approved by the agent, not by
> me. That's recorded in the docs and counted separately by `stats`.
>
> npm: llm-wiki-governance · MIT · [repo link]

Rules for the thread: be there for the first two hours; concede first, then correct (see §10).

## 7. Reddit (r/ClaudeAI)

Feed posts need karma ≥ 50 there. If that still applies, use the pinned showcase megathread as a
comment, not a feed post.

> **LLM-WIKI Governance — keep the docs Claude Code writes for itself reviewed and current**
>
> If you let Claude Code keep project notes, you've probably hit notes that describe code that
> moved. This is a small CLI (no dependencies) that gives each note a review state
> (`needs_review` → `verified`), makes it cite the files it describes, and flags it in CI when one
> of those files changes. `quickstart --write --agent claude` sets it up and prints a prompt to
> paste into Claude Code; Claude fills the wiki and you approve it.
>
> Honest limits: it checks citations resolve, not that the prose is right; keyword search, not
> semantic; and an unfilled wiki measured *worse* than none in our benchmark (one repo, one model,
> six tasks). Repo + benchmark write-up: [links]. Feedback on where it breaks is the most useful
> thing you could give me.

## 8. dev.to / technical blog

**Title options:**
- "An unfilled wiki was worse than no wiki: lessons from governing agent-written docs"
- "Date-based drift detection lies around merges: what we learned building doc governance"

**Outline:**
1. The problem: agent-written project notes go stale silently; instruction files have no review
   state.
2. The model: review states, citations, and two drift checks (date-anchored and diff-anchored).
3. Failure cases we documented instead of hiding:
   - a late merge that date-based drift cannot see, and the squash-merge false positive with the
     same cause (pinned as a test; why `--first-parent` was rejected);
   - a hand-edited `verified` passes validation (pinned as a test);
   - file-level `impact` over-flagging docs that cite a hub file.
4. Design trade-offs: why zero dependencies, why keyword search, why the strict/lite modes exist.
5. The measurement: the unenriched-wiki control arm, with every condition and the losing task.
6. A reproducible demo: `quickstart --dry-run` on a small public repo, then one `impact` run on a
   PR that moves a cited file.

**Opening paragraph:**

> Every coding agent I've used will happily write documentation about the codebase it's working
> in. None of them will tell you, three weeks later, that the documentation is now wrong. This
> post is about building a small tool for that gap — and about the measurement that surprised me
> most: a knowledge base that exists but was never filled in made the agent *more* expensive
> than having none.

## 9. LinkedIn

> Teams adopting AI coding agents are quietly accumulating a new kind of documentation debt: notes
> the agent wrote for itself, read by the next session, and checked by nobody.
>
> I've been building LLM-WIKI Governance, an open-source CLI that gives that knowledge the same
> discipline as code — a review state per document, citations to the files it describes, and a CI
> check that names the documents a pull request made stale. It runs locally, has no dependencies,
> and works alongside Claude Code, Codex, and Cursor.
>
> The most useful finding so far was a negative one: in a controlled run on one repository, a
> knowledge base that existed but was never maintained cost more than having none. Maintaining it
> is the point. Write-up and repository: [links]

## 10. 국내 커뮤니티

### GeekNews (Show GN)

**제목:** Show GN: LLM-WIKI Governance – AI 에이전트가 쓴 프로젝트 문서에 검토 상태와 드리프트 검사 붙이기

> Claude Code나 Codex에게 프로젝트 문서를 맡기면 처음에는 잘 씁니다. 문제는 몇 주 뒤입니다.
> 코드가 바뀌어도 문서는 그대로 남고, 다음 세션의 에이전트는 그 낡은 문서를 믿고 일합니다.
> `AGENTS.md`나 `CLAUDE.md`에는 이 문장이 검토를 거쳤는지, 어떤 코드를 근거로 했는지 남지 않습니다.
>
> LLM-WIKI Governance는 그 지식을 코드처럼 다루는 의존성 없는 Node CLI입니다.
> - 문서는 `needs_review`로 시작하고, `review --approve`를 명시적으로 실행해야만 `verified`가 됩니다.
> - 문서마다 설명하는 파일·라인 범위·심볼·섹션을 인용하고, CLI가 그 인용이 실제로 가리키는 대상이 있는지 검사합니다.
> - PR에서 `impact --since <base>`를 돌리면, 소스는 바뀌었는데 그 소스를 인용한 `verified` 문서는 그대로인 경우를 찾아 빌드를 실패시킵니다.
> - 에이전트는 읽기 전용 MCP 서버로 검증된 문서를 조회합니다.
>
> 하지 않는 일도 분명합니다. 문장이 참인지는 검사하지 않고, 누가 승인했는지 증명하지 못하며, 검색은 키워드 기반입니다.
> 가장 의외였던 측정 결과는, 만들어만 두고 채우지 않은 위키가 위키가 없을 때보다 오히려 비쌌다는 것입니다
> (외부 저장소 1개, 모델 1개, 과제 6개, 에이전트 채점 조건). 상세와 불리한 결과까지 저장소에 공개해 두었습니다.
>
> 참고로 이 저장소의 위키는 에이전트가 승인합니다. 사람 검토가 아니라는 점을 문서에 적어 두었고, `stats`도 따로 셉니다.

### 개발 블로그(velog 등) 글감

- "에이전트가 쓴 문서는 언제 거짓말이 되는가 — 날짜 기준 드리프트 감지가 머지에서 놓치는 것"
- "채우지 않은 위키는 없느니만 못했다 — 통제군을 둔 실측에서 배운 것"

### 커뮤니티 규칙

- GeekNews의 Show GN은 직접 만든 프로젝트 소개용입니다. 같은 글을 여러 곳에 반복해서 올리지 않습니다.
- OKKY 같은 Q&A 성격의 커뮤니티에는 홍보 글보다 "에이전트 문서가 낡는 문제를 어떻게 다루시나요" 같은 질문이 규칙에도, 반응에도 맞습니다.

## 11. Reply notes (read before any thread)

| Likely question | Answer, concede first |
| --- | --- |
| "Why not just AGENTS.md?" | Keep it — this generates it. The difference is the record: who approved a statement, what it cites, and whether that changed. |
| "ctxlint / driftlint already do this." | They lint instruction files against the code, and driftlint has a diff mode and a beta approval flow. This governs a whole wiki with per-document review states and names the `verified` docs a PR made stale. Use whichever fits; they can coexist. |
| "Mintlify Autopilot / Dosu update docs automatically." | They write doc PRs; this decides what counts as reviewed and fails CI when it isn't. Different layer — an auto-written update still lands as `needs_review` here. |
| "Who verifies? Your own repo is agent-approved." | True, and recorded. The tool records a name; it can't prove a human. Use `agentReviewers` so `stats` counts agent approvals apart, and branch protection for who merges. |
| "So it saves tokens?" | Only one controlled measurement, on one repo with one model, and an unfilled wiki was worse than none. Don't adopt it for tokens; adopt it if stale agent docs are hurting you. |
| "File-level gating is noisy." | Yes. A doc citing a hub file gets flagged on every change to it. Cite narrower ranges or symbols, or lower `impact.source_changed` to a warning under `standard`. |
| "Node-only?" | The CLI needs Node ≥ 18.18; the repository it checks can be Python, Go, JVM, .NET and others. |

## 12. Sequencing and what to measure

1. MCP registries and awesome lists (see `registries.md`, after updating its counts).
2. One technical article (§8) — it gives every later post something to link to.
3. GeekNews (§10) and r/ClaudeAI (§7).
4. Show HN last, only with two free hours to stay in the thread.

**Measure, two weeks after each round** (the only honest counters available, because the CLI
has no telemetry by design):

| Signal | Why it counts | Hypothesis to test, not a target |
| --- | --- | --- |
| Issues or discussions from people outside the project | someone tried it on a real repo | at least a few per round would show real trials |
| Stars and forks | interest, weakly | movement beyond single digits would show reach |
| Public repositories containing `docs/llm-wiki/` with this frontmatter | actual adoption | any outside example is a first |
| Inbound links (articles, lists) | discoverability | — |

Do not report npm downloads as adoption: this project's own CI and registry mirrors account for
most of them.
