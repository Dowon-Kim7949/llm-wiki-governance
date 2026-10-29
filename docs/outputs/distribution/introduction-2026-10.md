# Technical introduction (draft, not posted)

Two short introductions, English and Korean, for the maintainer to use or discard. Nothing has
been posted anywhere. Checked against [`CLAIMS.md`](./CLAIMS.md): no performance figure, no
uniqueness claim, no "keeps your docs true", no "only a human can verify", no "any stack". Where a
claim needs its evidence, the evidence is [`docs/VALIDATION.md`](../../VALIDATION.md).

---

## English

**llm-wiki-governance: review states and change checks for docs an AI agent writes**

Coding agents now write a lot of project documentation: architecture notes, feature
descriptions, requirements. The problem is not writing it but knowing which of it to trust
after the code moves. `llm-wiki-governance` is an MIT-licensed, zero-dependency Node.js CLI that
treats those documents as governed records.

Each document has a review state (`needs_review` or `verified`) and cites the files, line
ranges, Markdown sections or names it is based on. The CLI checks that every citation still
resolves, and in a pull request `impact` names the verified documents whose cited code changed
while the document did not. Since 1.39.0 it also works the other way: when an approved
requirement changes, it lists the files that requirement links. A document becomes `verified`
only through an explicit `review --approve`; the tool records the name given and cannot prove
who it was.

It works before code exists (requirements and decisions are recorded as planned knowledge and
linked to code later) and on existing projects. Runnable walkthroughs cover a Vue 3 +
TypeScript app from an empty repository, the same app with existing code, a Python FastAPI
service, and a React + Express workspace. Claude Code and Codex get adapter files and skills;
other agents read the same Markdown. The CLI itself needs no model and no API key.

What it does not do: it does not check that a sentence is true, run your tests, or decide that
a requirement is implemented. Date-based drift detection has documented blind spots. The
validation page lists what has been shown and what has not.

---

## 한국어

**llm-wiki-governance: AI 에이전트가 쓴 문서에 검토 상태와 변경 검사를 붙입니다**

이제 코딩 에이전트가 아키텍처 노트, 기능 설명, 요구사항 같은 프로젝트 문서를 많이 씁니다. 어려운 것은 쓰는 일이 아니라, 코드가 바뀐 뒤 그중 무엇을 믿을지 아는 일입니다. `llm-wiki-governance`는 그 문서를 관리 대상 기록으로 다루는 MIT 라이선스의 무의존성 Node.js CLI입니다.

문서마다 검토 상태(`needs_review` 또는 `verified`)가 있고, 근거로 삼은 파일, 줄 범위, 마크다운 섹션, 이름을 인용합니다. CLI는 인용이 모두 여전히 해석되는지 확인하고, PR에서는 `impact`가 인용한 코드는 바뀌었는데 문서는 그대로인 verified 문서를 알려 줍니다. 1.39.0부터는 반대 방향도 있습니다. 승인된 요구사항이 바뀌면 그 요구사항이 연결한 파일을 나열합니다. 문서는 명시적인 `review --approve`로만 `verified`가 됩니다. 도구는 그때 준 이름을 기록할 뿐, 누가 승인했는지 증명하지는 못합니다.

코드가 생기기 전에도(요구사항과 결정을 계획된 지식으로 기록하고 나중에 코드에 연결), 기존 프로젝트에서도 쓸 수 있습니다. 실행 가능한 워크스루가 빈 저장소에서 시작하는 Vue 3 + TypeScript 앱, 코드가 이미 있는 같은 앱, Python FastAPI 서비스, React + Express workspace를 다룹니다. Claude Code와 Codex에는 어댑터 파일과 스킬이 생기고, 다른 에이전트도 같은 마크다운을 읽습니다. CLI 자체는 모델도 API 키도 필요 없습니다.

하지 않는 일도 있습니다. 문장이 참인지 확인하지 않고, 프로젝트 테스트를 돌리지 않고, 요구사항이 구현됐다고 판정하지 않습니다. 날짜 기준 drift 감지에는 문서화된 사각지대가 있습니다. 무엇을 보였고 무엇을 못 보였는지는 검증 문서에 정리해 두었습니다.
