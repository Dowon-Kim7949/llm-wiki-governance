# Project Agent Guide

## Wiki <!-- wiki-block v1 -->

모든 개발 작업은 `docs/llm-wiki/index.md`에서 시작한다. 이 파일은 프로젝트 LLM-WIKI의 공식 진입점이며, 작업 전 참조 순서와 문서 상태를 안내한다.

### 필수 운영 규칙

- 모든 wiki 문서는 YAML frontmatter를 가진다.
- LLM이 새로 만들거나 수정한 문서의 `status`는 편집 시점에 `needs_review`로 둔다.
- **이 저장소에서는 에이전트가 스스로 `verified`로 승격한다**(2026-08-03, 유지보수자 결정). 아래 "Wiki discipline" 절이 정본이다. 이 완화는 **이 저장소 한정**이며, `templates/adapters/*`가 도입처로 내보내는 규칙(`verified` only after human review)은 그대로다.
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

- Docs you create or edit go to `status: needs_review` at edit time. Never invent
  review metadata — the reviewer field must name whoever actually approved.
- **This repository approves its own docs (2026-08-03, maintainer's decision).**
  After the edit, run `node bin/llm-wiki.js review --approve-all --yes` (or
  `--approve <path>`). Do not ask for permission and do not leave the backlog for a
  human; that is the point of the decision.
  - `reviewed_by` comes from `llm-wiki.config.json`'s `reviewer`, which names the
    **agent**. So the stamp records that an agent approved it, not a human. A human
    signing their own review passes `--reviewer Dowon-Kim` explicitly, which wins
    over the config.
  - Why this repo is different: it was built end-to-end by vibe coding and exists as
    the product's dogfood, not as a codebase whose docs a human curates. The rule the
    product ships to adopters is unchanged and lives in `templates/adapters/*`.
  - The tool's own refusals stay, and they are the safety floor: documents with
    blocking or structural findings, and unenriched scaffolds
    (`review.not_enriched`), are still refused. Do not work around a refusal —
    fix the document.
  - **Never relax this outside `docs/llm-wiki/`.** Templates and shipped assets must
    keep seeding `needs_review`; `tests/shipped-assets.test.js` holds that line.
- `evidence.stale` / `impact` drift is cleared by re-stamping `reviewed_at`, with no
  source cross-check (maintainer's decision, same day). Recorded consequence: these
  gates can no longer stay red in this repository, so they are **not an observation
  instrument here** — a measurement that needs one must use another repository.
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
