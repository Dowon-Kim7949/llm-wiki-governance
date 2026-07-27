# Project Agent Guide

## Wiki <!-- wiki-block v1 -->

모든 개발 작업은 `docs/llm-wiki/index.md`에서 시작한다. 이 파일은 프로젝트 LLM-WIKI의 공식 진입점이며, 작업 전 참조 순서와 문서 상태를 안내한다.

### 필수 운영 규칙

- 모든 wiki 문서는 YAML frontmatter를 가진다.
- LLM이 새로 만들거나 수정한 문서의 `status`는 항상 `needs_review`로 둔다.
- `verified`는 사람 검토가 끝난 뒤에만 사용할 수 있다.
- 코드 또는 문서를 변경하면 관련 wiki와 `docs/llm-wiki/log.md`를 같은 작업 안에서 갱신한다.
- 민감정보는 wiki에 기록하지 않는다.
- Markdown 파일은 UTF-8로 읽고 쓴다.

## Orca Parallel Agent Rules

These apply to every agent session launched into an Orca-managed worktree. The
full workflow — role definitions, worktree naming, hand-off format, permission
policy — is in [`docs/ORCA_PARALLEL_DEV.md`](./docs/ORCA_PARALLEL_DEV.md).

**Scope and isolation**

- One worktree, one goal. Stay inside the approved issue and plan.
- Never commit or push to `main`; work on the worktree's own branch.
- Do not bundle an unrequested refactor with the change you were asked to make.

**Before you edit**

- Read [`docs/llm-wiki/index.md`](./docs/llm-wiki/index.md) first.
- Scope the change from the wiki, not from guesswork:
  `node bin/llm-wiki.js prepare --task "<task>" --compact`.
- Prefer this repo's own skills — `/llm-wiki-prepare`, `/llm-wiki-feature`,
  `/llm-wiki-fix`, `/llm-wiki-docs-sync`. They carry the run-manifest contract
  that `check-run` verifies; an ad-hoc edit does not.
- Read the existing tests for the behavior you are about to change.

**Contracts that need explicit human approval to change**

- CLI command/flag surface, `--format json` shape and `schemaVersion`, exit codes.
- The frozen programmatic `commands` map in `src/index.js`, and MCP tool names.
- Node.js `>=18.18.0` support and the zero-runtime-dependency rule.

**Wiki discipline**

- Docs you create or edit stay `status: needs_review`. Never invent review metadata.
- **Never run `llm-wiki review --approve`** (or `--approve-all`). Promotion to
  `verified` is the human's decision — it is the one thing this project exists to protect.
- Append to `docs/llm-wiki/log.md` in the same change.
- Write a run manifest to `.llm-wiki/runs/` and verify with `check-run`.

**Verification before you report done**

- `npm test`, `npm run lint`, `npm run verify`, then
  `node bin/llm-wiki.js validate --strict` and `node bin/llm-wiki.js audit`.
- Never delete, skip, or weaken a test to make the suite pass. A failing test is
  a result — report it as one.

**Reporting**

- Use the Agent Result format in `docs/ORCA_PARALLEL_DEV.md`, and separate what
  you verified in the repository from what you assumed.

## Development Notes

Project-specific notes go here.
