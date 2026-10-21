---
title: LLM-WIKI Change Log
tags:
  - llm-wiki
  - needs-review
status: needs_review
doc_type: change_log
project: llm-wiki-governance
last_updated: 2026-08-06
author: cli-generated
last_edited_by: Claude Code
wiki_block_version: v1
source_files:
  - package.json
evidence:

related:
  - docs/llm-wiki/index.md
visibility: internal
contains_sensitive_info: false
---

# LLM-WIKI Change Log

이 문서는 append-only 변경 로그입니다. 기존 항목은 수정하지 말고 새 변경 사항을 위에 추가합니다.

## 2026-10-21 - release: 1.34.0 — 받기도, 돌리기도, 읽기도 가볍게

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: code, test, release, docs
- changed: `src/git.js`(`pathsChangedSince` 신설) · `src/commands/scans.js`(`changeFilter`, `scanEvidenceDrift`의 음성 필터) · `src/task-prompts.js`(`delegationPolicy` 정의와 삽입 4곳 제거) · `package.json`(`files`를 실행 파일과 README·LICENSE로 축소, 1.33.0 → 1.34.0) · `tests/drift-batched-listing.test.js`(신규 4건) · `tests/agent-token-discipline.test.js`(위임 테스트 3건 → 재유입 가드 1건) · `tests/prompt-profile.test.js`(slim 비율 상한 50% → 70%, full/slim 구분 표지 교체) · `tests/verification.test.js` · `RELEASE_CHECKLIST.md` · `GATE_REVIEW.md`("Delegation Policy Scope Decision"에 제거 기록) · CHANGELOG 쌍 · ROADMAP 쌍 · README 2종·action.yml·템플릿 핀 · 위키 14종 + `REVIEW_HISTORY.md`
- summary: 유지보수자가 "패키지를 가볍게"를 요청해, 측정해서 무게가 아무것도 사지 못하는 곳 세 군데를 덜어냈다. ① 날짜 앵커 드리프트가 인용 파일마다 `git log`를 띄워 6개 명령 시간의 80–90%를 쓰고 있었다(이 저장소 72회). 기준일마다 변경 경로 목록을 한 번 받아 **음성 필터로만** 쓰고, 목록에 든 앵커는 기존 파일별 쿼리가 판정하게 해서 finding이 바이트 동일하다. 목록이 상위 집합이려면 사용자 config가 줄이지 못해야 해서 플래그 넷을 고정했다. 처음엔 소문자 정규화도 넣었지만, git pathspec은 Windows `core.ignorecase`에서도 대소문자를 구분해서(직접 확인) 뺐다. ② tarball의 46%가 런타임이 읽지 않는 프로젝트 문서였다(코드가 자기 위치에서 읽는 것은 `package.json`·`templates/`뿐임을 grep으로 확인). `files`를 줄이고 이를 요구하던 RELEASE_CHECKLIST 줄과 wiki README의 `.ko.md` 등록 규칙을 고쳤다. ③ `delegationPolicy`를 뺐다 — 유료 A/B와 블라인드 채점 모두 효과를 찾지 못했는데 쓰기 프롬프트의 약 25%였다. 결정과 한계는 GATE_REVIEW에 남겼고, `contextBudget`·`governanceBudget`은 측정한 적이 없어 다른 경우로 보고 남겼다. 같은 자리에서 이미 출시된 1.33.0을 "미출시"·"예정"이라 적던 현재형 서술 17곳(6종)과, 설정을 마친 `agentReviewers`를 "아직 안 바꿨다"고 적던 GLOSSARY 문장을 고쳤다.
- evidence: `validate --strict` 4.0–4.4초 → 0.7초, `drift` 3.7초 → 0.3초(이 저장소, 3회·2회 측정). 위키가 있는 로컬 저장소 11곳에서 개선 전(origin/main worktree)과 후의 `drift`·`validate --strict` JSON 22쌍이 **전부 동일**했다. 이 중 드리프트가 실제로 있는 곳이 두 곳이다(`evidence.stale` 8·28). 부하가 없던 첫 실행에서 가장 큰 위키 `drift`가 17.9초 → 0.7초였다. 두 번째 실행은 전체 테스트와 동시에 돌아 절대 시간이 흔들렸지만(개선 전 `validate` 최대 57초) 22쌍 모두 동일했다. 플래그 넷을 하나씩 뺀 변이는 모두 새 테스트가 잡았다. 테스트 671/671, lint OK. tarball은 packed 557,702 → 278,450 B, unpacked 1,704,003 → 941,286 B. `fix` 프롬프트는 5,200 → 3,881자, Claude 스킬 7종은 42,876 → 36,241 B.
- caveats: 드리프트가 **리뷰 뒤 머지로만 들어온 오래된 브랜치의 변경**을 잡지 못하는 기존 위음성을 찾았다(`git log -- <path>`의 히스토리 단순화). 이번 변경은 출력 보존이 원칙이라 고치지 않고 테스트로 "보존된 동작"이라고 고정했다. 기존 도입처 스킬은 `--refresh` 전까지 위임 블록을 유지한다. push·태그·배포는 하지 않았다.

## 2026-10-21 - docs: 1.33.0 배포 이후 정렬 — 발표 덱이 1.31에서 멈춰 있었고, 커밋이 드리프트 12건을 만들었다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs
- changed: `outputs/team-briefing/llm-wiki-briefing.html` · `SPEAKER_NOTES.md` · `README.md` · 위키 12종 재스탬프(`ARCHITECTURE_CONVENTIONS`·`BENCHMARK`·`DOMAIN_FEATURES`·`domains/00_overview`·`EXAMPLES`·`GLOSSARY`·`HARNESS_GOVERNANCE_ROADMAP`·`profiles/library`·`project-profile`·`PUBLIC_API`·`README`·`VISIBILITY`) · `REVIEW_HISTORY.md`
- summary: 1.33.0 배포(npm, 2026-10-21) 뒤 버전을 담은 산출물을 맞췄다. 덱은 표지가 `v1.32.0`인데 타임라인이 **1.31에서 멈춘 채 "가장 최근"**이라고 적고 있었다 — 1.32.0 정렬이 표기 5곳만 바꾸고 행을 넣지 않았다. 1.32·1.33 행을 넣고, 화면을 넘지 않게 1.28을 짧게 줄여 ①장으로 옮기고 1.29·1.29.1을 한 행으로 합쳤다. 덱의 사실 주장도 소스에 대조했다: 원칙 슬라이드의 "1.0 이후 **한 번도 어기지 않은** … 하위 호환"은 VERSIONING의 1.28.0 "규칙을 어긴 기록"과, 같은 덱의 1.31 행과도 모순이라 "지켜온"으로 고치고 1.28을 명시했다. 압축 해제 크기 1.6MB → 1.7MB(레지스트리 `unpackedSize` 1,704,003). MCP 18개는 맞았다. 스피커 노트의 21·22장 범위와 대본, 1.32·1.33 한 줄 설명을 맞췄다. 그리고 범프 커밋이 날짜 앵커 드리프트를 만들었다 — 10-20에 미커밋 diff에 대조해 고친 문서 12종이, 같은 소스가 10-21에 커밋되면서 `evidence.stale`(63건)이 됐다. 재스탬프로 해소했고, 그 재스탬프가 `REVIEW_HISTORY.md`를 2차로 지목해 1.30.1 선례대로 머리말에 기록 한 줄을 남겼다.
- evidence: 덱 렌더 실측(Chrome, UTF-8로 서빙): 1920×1080·1440×900·1366×768 모두 뷰포트를 넘는 슬라이드 0장. 21장 737 → 757px, 22장 728 → 747px(1366×768 뷰포트 764px). `validate --strict` 63 → 0, `drift --strict` exit 0, `impact --since HEAD` pass.
- caveats: 공유 Artifact 링크(조직 공유, 즉시 반영)는 이 시점에 아직 **`v1.31.0`**이다 — 1.32.0 때 재게시가 빠졌다. 재게시는 유지보수자 확인 뒤에 한다. `drift`가 릴리스 커밋마다 이렇게 뜨는 것(미커밋 상태에서 검토 → 커밋 날짜가 검토일 이후)은 이 저장소 작업 방식의 구조적 결과이고, 이번에도 재스탬프 말고 해소 경로는 없다.

## 2026-10-21 - release: 1.33.0 범프 — 이 저장소가 자기 로그를 보관하고, 승인 주체를 갈라 세고, 선적재 index를 줄였다

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: release, test, config, docs
- changed: `package.json`(1.32.0 → 1.33.0) · `tests/verification.test.js`(버전 단언) · `.github/actions/validate/action.yml`(기본 `1.33`) · `templates/github-actions/llm-wiki-validate.yml`(핀 `@1.33` 3곳) · README 2종(액션 핀 `@v1.33.0`) · CHANGELOG 쌍(1.33.0 — 2026-10-21) · ROADMAP 2종(1.33.0 출시 절) · `tests/mcp.test.js`(stdio 테스트 픽스처) · `llm-wiki.config.json`(`agentReviewers`) · 위키 `index.md`(Status 축소) · `VERSIONING.md`·`RELEASE_FLOW.md`·`EXAMPLES.md`(노트/핀) · `REVIEW_HISTORY.md`(Release Flow 절 신설) · `log.md` → `log-2026-07.md`·`log-2026-08.md`
- summary: 2026-10-21 유지보수자가 승인한 1.33.0 마무리 6단계를 집행했다. ① `tests/mcp.test.js`의 stdio 왕복 테스트 2건이 `--cwd repoRoot`로 이 저장소 전체에 `stats`를 돌려(14–21초) 20초 타임아웃과 경합하던 간헐 실패를, 문서 1개짜리 tmp 위키 픽스처로 바꿔 없앴다(단언은 그대로, 2건 합계 0.5초). ② `VERSIONING.md`의 `evidence.stale`은 2026-09-08 이후 `package.json` 변경 3건이 전부 `version` 한 줄이라 서술이 맞았다. 같은 자리에서 1.33.0의 MINOR 판정을 문서 정의에 대조했다 — bare `#anchor`의 `evidence.shape` error는 1.32.0 공개 스키마가 이미 거부하던 것이라 계약 변경이 아니라 결함 수정이다(HEAD 스키마로 직접 확인). ③ config에 `agentReviewers`를 넣어 `stats`가 사람 4 / 에이전트 47로 갈라 센다. ④ 항상 선적재되는 `index.md`의 Status에서 릴리스별 장문 bullet(1.29.0–1.32.0)을 걷어 내고 읽는 법만 남겼다. 지운 수치(N-13 11→4, N-14 7→5, 173–234 토큰, 196 KB, `harness-health` 9→0 등)는 모두 CHANGELOG나 다른 위키 문서에 있음을 grep으로 확인했고, Status에만 있던 사실 하나(이 저장소가 `governance.mode: strict`를 명시하는 이유)는 한 줄로 남겼다. ⑤ 이 저장소 자신에 `archive-log --write`를 실행했다. ⑥ 범프 뒤 `impact`가 `RELEASE_FLOW.md`를 지목해, 그 Checklist가 말하는 핀 대조 테스트(`split(".").slice(0, 2)`)를 소스에서 확인하고 노트를 남겼다. 노트가 6건이 되어 가장 오래된 1건을 `REVIEW_HISTORY.md`로 옮겼다.
- evidence: `index.md` 15,731 → 5,890 B(−9,841, 약 −63%). `CLAUDE.md`·`AGENTS.md`가 @-import하므로 세션마다 그만큼 덜 싣는다. `archive-log --write`: 213개 항목 → `log-2026-07.md`(192)·`log-2026-08.md`(21), 18개 잔류. `log.md` 515,047 → 68,478 B. 새 권 2개 모두 `status: needs_review`. 옮겨진 항목을 가리키는 `log.md#…` 앵커는 저장소 전체에서 0건이었다. `validate --strict` finding 0. orphan 34(변동 없음). `impact --since HEAD` pass(stamp_only 0). `stats` humanVerified 4 / agentVerified 47.
- caveats: push·태그·npm 배포는 하지 않았다(승인 밖). CHANGELOG의 날짜 2026-10-21은 범프 커밋 날짜이고, 배포일이 다르면 태그 시점에 맞춘다. 발표 덱(`outputs/team-briefing/`)의 `v1.32.0` 표기는 배포 후 정렬 대상이라 건드리지 않았다. `slim` 기본값 전환은 측정이 필요해 하지 않았다. N-9/N-11(GATE_REVIEW "Stamp-Only Exemption")은 여전히 미결이다.

## 2026-10-20 - docs(wiki): 1.33.0 미커밋분이 지목한 verified 문서 7종 해소 — 그중 2건은 원래 낡아 있던 서술 (미출시)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: docs
- changed: `EXAMPLES.md` · `profiles/library.md` · `project-profile.md` · `index.md` · `README.md`(위키) · `BENCHMARK.md` · `VISIBILITY.md`
- summary: `impact --since HEAD`가 지목한 7건마다 인용 소스(`src/cli.js`·루트 `README.md`·`GATE_REVIEW.md`·`src/frontmatter-schema.js`)의 실제 diff를 대조했다. 거짓이 된 서술은 없었다. 대신 문서마다 이번 변경 때문에 생긴 공백이나 원래 낡아 있던 문장을 고쳐서 diff에 넣었다. 재스탬프만으로 지나가지 않았다. ① `EXAMPLES.md`: "Codex 스킬 4개"는 **원래 낡은 서술**이었다(실제 `init --agent codex`로 7개 생성 확인). `archive-log`·`--prompt-profile slim`·`prompt --task issue` 예제 절도 새로 썼다. ② `profiles/library.md`: Open Question("프로그래매틱 API를 공개 계약으로 문서화할지")은 `PUBLIC_API.md`가 이미 해소한 **낡은 질문**이었다. 이를 해소로 바꾸고, 동결 `commands` 맵에 `archive-log` 키가 더해진 것이 승인된 계약 변경이라는 점을 Summary에 적었다. ③ `project-profile.md`·`index.md`·위키 `README.md`: 명시적 쓰기 예시와 log 운영 규칙에 1.33.0의 재정의를 반영했다("항목은 고치지 않되 통째로 월별 권에 옮길 수 있다", 이 저장소는 미실행). ④ `BENCHMARK.md`: slim의 "약 44–50%"는 문자 수이지 측정이 아니라는 점과 헤드라인 금지를 규율 절에 더했다. ⑤ `VISIBILITY.md`: visibility enum은 무변경이고, 이 문서의 evidence가 새 단일 정규식을 통과하는 것을 Review Note로 남겼다.
- evidence: `impact --since HEAD` result pass(7 → 0, `stamp_only_exclusions` 0). `npm test` 669/669. `validate-frontmatter` pass. `archive-log` 미리보기 213개 항목 → 2개 권, 17개 잔류. `prompt --task fix` 문자 수 slim 2,700 / full 5,641(48%).
- caveats: `validate --strict`가 `VERSIONING.md`의 `evidence.stale`(package.json, 2026-09-14 1.32.0 커밋) warning 1건을 낸다. 이번 작업 전부터 있던 것이고 손대지 않았다. index.md는 항상 선적재되는 문서라 한 줄만 늘렸다. Status 축소는 여전히 별도 결정이다. 버전 범프·커밋은 하지 않았다.

## 2026-10-20 - feat+fix: 1.33.0 범위 확장(slim 프롬프트·issue 프리셋·승인 주체·evidence 형식 단일화)과 archive-log 출하 전 결함 14건 (미출시)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: code, test, docs
- changed: `src/task-prompts.js`(`PROMPT_PROFILES`·slim 렌더러·`issue`) · `src/commands/skills.js` · `src/commands.js`(`promptCommand` 모드 전달·`impact.stamp_only`·`stats` 승인 주체·월별 권 제외) · `src/commands/scans.js`(`changedAnchorMatcher`·`agentReviewerSet`) · `src/frontmatter-schema.js`(`EVIDENCE_REFERENCE_PATTERN`) · `src/commands/references.js` · `src/commands/archive-log.js`·`wiki-hygiene.js`·`wiki-files.js`(`isLogVolume`)·`wiki-graph.js`·`governance-mode.js` · `src/commands/findings.js`·`src/i18n.js`·`src/config-file.js`·`src/cli.js`·`src/index.js`·`src/mcp/tools.js` · `rules/frontmatter.schema.json`·`rules/README.md` · `templates/adapters/*`(규칙 1줄) · 테스트 신규 5·수정 4 · CHANGELOG 쌍 · GATE_REVIEW · 위키 PUBLIC_API·ARCHITECTURE_CONVENTIONS·GLOSSARY·DOMAIN_FEATURES·domains/00_overview·HARNESS_GOVERNANCE_ROADMAP
- summary: 외부 실무자 글(AI Native FE 150일 회고) 분석에서 나온 권고를 1.33.0 미출시 범위에 넣었다. 새 기능은 모두 opt-in이고, 기본 동작이 바뀌는 곳 4가지는 CHANGELOG에 이름을 붙였다(`prompt`가 거버넌스 모드를 따름 — 기존 결함, 파일 없는 `#anchor` evidence 거부, `stats` 텍스트 꼬리, `log-YYYY-MM.md` 이름 문서). 출하 전 검토가 archive-log에서 재현되는 결함 14건(미래 날짜 오타 하나로 보존 기간 전체 이동, 기존 권 인코딩 미검사, 재실행 시 중복, 비원자적 쓰기, CommonMark와 다른 펜스 판정 등)을 찾아 고쳤다. N-9/N-11은 결정하지 않았다 — opt-in 가시화만 더했고 근거는 GATE_REVIEW에 적었다.
- evidence: `npm test` 669/669(596 + 73), `npm run lint` OK. slim의 기본값 `full`은 프롬프트·스킬·CLI 출력 8,520건을 변경 전후로 비교해 바이트 동일. evidence 형식 단일화는 로컬 도입 위키 11곳의 evidence 1,292항목에서 판정 변화 0. `agentReviewers` 실측(이 저장소 reviewer 1개): human_verified 51 → 사람 4 / 에이전트 47.
- caveats: 버전 범프·배포·커밋은 하지 않았고, 이 저장소 자신의 log 보관·새 규칙 활성화·`agentReviewers` 설정·index.md Status 축소도 하지 않았다(별도 결정). `impact --since HEAD`가 verified 문서를 지목하므로 커밋 전에 해소해야 한다. 바로 아래 2026-10-01 항목의 도입처 프로젝트명 2개를 가명으로 바꿨다 — 미커밋 상태라 공개 HEAD에는 없었지만, 실측 대상 익명화 계약(`docs/BENCHMARK_DISCLOSURE.md`)과 어긋났다. slim을 기본값으로 바꾸는 것은 측정 뒤에만 한다. 테스트는 로컬 Windows·Node 22 한 조합에서만 돌렸다.

## 2026-10-01 - feat(archive-log): 변경 로그 월별 보관 + 기본 off 위키 위생 규칙 4종 (1.33.0 준비, 미출시)

- status: needs_review (편집 시점, 이후 `review --approve-all --yes`)
- actor: Claude Code (delegated by Dowon-Kim)
- scope: code, test, docs
- changed: `src/commands/archive-log.js`(신규) · `src/commands/wiki-hygiene.js`(신규) · `src/commands/wiki-files.js`(`isAppendOnlyLog`가 월별 권 포함) · `src/commands/findings.js`(규칙 5종) · `src/config-file.js`(`wikiBudget`) · `src/commands.js`·`src/cli.js`·`src/index.js`(배선) · `tests/archive-log.test.js`·`tests/wiki-hygiene.test.js`(신규) · `tests/verification.test.js`(고정 맵 기대값) · README·CHANGELOG·SECURITY 쌍 · GATE_REVIEW · 위키 PUBLIC_API·DOMAIN_FEATURES·GLOSSARY·ARCHITECTURE_CONVENTIONS
- summary: 도입 프로젝트 두 곳이 손으로 줄인 위키 읽기 비용을 지원 경로로 만들었다. 표면(새 명령·옵션·JSON·고정 맵 키)은 유지보수자 승인. append-only는 "항목은 고치지 않는다, 항목 전체를 원문 그대로 월별 권으로 옮기는 것만 허용"으로 재정의(GATE_REVIEW "Change-Log Volume Scope Decision").
- evidence: `npm test` 596/596(580 + 16), 변이 2종(권 합치는 순서 역전·술어 원복)을 새 테스트가 각각 잡음. 실제 log 사본 2종(도입처 A 120항목, 도입처 B 263항목)에 `--write` 후 별도 재파싱으로 원본 항목이 모두 정확히 한 번·바이트 그대로 있음을 확인.
- caveats: 이 저장소 자신의 log(508KB, 미리보기상 192/228 이동)와 새 규칙 활성화(측정: 날짜 제목 24·log 예산 1·문서 예산 2·앵커 0)는 적용하지 않았다 — 별도 결정. 버전 범프·배포는 하지 않았다.

## 2026-09-14 - release: 1.32.0 — 게이트를 가장 값싼 형태로 깎고 배포한다

- status: verified (재스탬프로 해소, review --approve-all --yes)
- actor: Claude Code (유지보수자 지시)
- scope: templates, docs, release
- changed:
  - templates/github-actions/llm-wiki-validate.yml
  - docs/OPERATIONS.md
  - package.json · .github/actions/validate/action.yml · tests/verification.test.js · README.md · README.ko.md (버전 1.31.0 → 1.32.0)
  - CHANGELOG.md · CHANGELOG.ko.md · ROADMAP.md · ROADMAP.ko.md (1.32.0 절 신설)
  - outputs/team-briefing/ (대상 버전 라벨만)
- summary:
  - 같은 날 앞 항목이 러너 선택과 `npm test` 스텝을 다뤘다면, 이번은 **템플릿에 남아 있던 나머지 비용을 마저 깎고 실제로 배포**한다. 앞 항목의 변경은 커밋만 돼 있어서 **npm 경로로 도입하는 곳에는 닿지 않았다** — `templates/`는 npm tarball에 실려 나가므로 배포해야 전달된다.
  - **의존성 설치를 없앴다.** 게이트에 필요한 패키지는 런타임 의존성이 없는 이 패키지 하나뿐인데 도입처의 트리 전체를 설치하고 있었다. `npm ci` + `npx --no-install llm-wiki`가 `npx -y llm-wiki-governance@1.32`가 됐다. 부수 효과로 **이 패키지를 devDependency로 둘 필요가 없어졌다.** 패키지 이름을 전체로 적는 것이 중요하다 — 짧은 `npx llm-wiki`는 이 패키지의 bin 이름과 같은 **무관한 npm 패키지**를 받아 실행한다.
  - **`timeout-minutes: 10`과 `concurrency`의 `cancel-in-progress`를 넣었다.** 둘 다 템플릿에 아예 없었다. 상한이 없으면 멈춘 스텝이 GitHub 기본값 6시간까지 돌고, 더 새 커밋이 올라와 판정이 무의미해진 run도 끝까지 돌며 계속 과금됐다.
  - **MINOR로 판정했다. `src/`는 한 줄도 바뀌지 않았다.** PATCH보다 큰 이유는 템플릿을 새로 복사하면 동작이 다르기 때문이고(의존성 설치 없음, 테스트 없음), MAJOR보다 작은 이유는 이미 복사해 간 템플릿은 그쪽 저장소의 파일이라 버전을 올려도 움직이지 않기 때문이다.
- evidence:
  - templates/github-actions/llm-wiki-validate.yml — 실행부가 스텝 5개로 줄었다(checkout · setup-node · 게이트 3). `npm ci`도 `npm test`도 없다.
  - docs/OPERATIONS.md#section:Running the gates without spending Actions minutes — 깎은 항목 4종과 `fetch-depth: 0`이 남는 이유.
  - .github/actions/validate/action.yml — `version` 입력 기본값 `1.32`(X.Y 형식). RELEASE_CHECKLIST가 1.27.0–1.27.2에 이것이 낡았던 사고를 근거로 명시 지목하는 항목이다.
- caveats:
  - **절감은 측정하지 않았다.** 테스트 스텝 제거분은 도입처 스위트 길이에, 나머지는 도입처가 self-hosted로 옮기는지에 달려 있다. CHANGELOG·ROADMAP의 어떤 문장도 숫자를 주장하지 않는다.
  - **이미 템플릿을 복사해 간 도입처는 이 릴리스로 아무것도 얻지 못한다.** 그들의 워크플로는 그들의 파일이다 — 다시 복사하거나 네 가지를 직접 반영해야 한다. 이 사실을 CHANGELOG 2종에 명시했다.
  - 팀 브리핑 덱은 **라벨만** 1.32.0으로 맞추고 본문은 건드리지 않았다. RELEASE_CHECKLIST의 조건은 "사용자 노출 동작(명령·옵션·usage·MCP 표면) 변경 시"인데 이번 릴리스는 CLI를 바꾸지 않았기 때문이다.
  - `impact`가 지목한 문서는 이번에도 본문 대조 후 재스탬프로 해소했고, `stamp_only_exclusions`가 그만큼 남는다 — 제품 자신이 "이 문서들은 이번 실행에서 실제로 검사되지 않았다"고 말하는 상태다(N-9).

## 2026-09-14 - ci(templates): 도입처가 러너 분을 쓰지 않고도 게이트를 돌릴 수 있게 한다

- status: verified (재스탬프로 해소, review --approve-all --yes)
- actor: Claude Code (유지보수자 지시)
- scope: templates, docs
- changed:
  - templates/github-actions/llm-wiki-validate.yml
  - docs/OPERATIONS.md
  - README.md
  - README.ko.md
- summary:
  - **이 프로젝트가 도입처에 권하는 CI 채널은 GitHub-hosted 러너를 기본으로 쓰고, 그 비용을 어디에도 적지 않았다.** 공개 저장소에서는 무료라 보이지 않던 문제인데, 비공개 저장소에서는 매 분이 과금되고 조직 계정에서는 그 한도를 **조직의 모든 저장소가 공유**한다 — 즉 이 도구를 도입하는 비용이 다른 팀이 쓰던 예산에서 나간다.
  - 워크플로 템플릿의 `runs-on`을 `${{ vars.LLM_WIKI_RUNNER || 'ubuntu-latest' }}`로 바꿨다. 도입처가 **파일을 포크하지 않고 변수 하나로** self-hosted 러너에 붙일 수 있고, 변수를 안 두면 기존 동작 그대로다. self-hosted 러너의 분은 과금되지 않으면서 required status check의 강제력은 유지된다.
  - 같은 템플릿에서 `npm test` 스텝을 **삭제**했다. 어떤 게이트도 그 결과에 의존하지 않는데 비공개 저장소에서는 보통 이 파일에서 가장 비싼 스텝이고, 도입처 자신의 CI가 이미 테스트를 돌린다면 같은 값을 두 번 낸다. 되살리는 방법을 주석으로 남겼다 — 이 워크플로가 그 저장소의 유일한 CI인 경우다.
  - 파일 상단과 `docs/OPERATIONS.md`에 비용 구조와 **요금 0인 두 채널**을 적었다: 러너가 아예 필요 없는 `templates/git-hooks/pre-commit`, 그리고 self-hosted 러너. 둘은 등가가 아니다 — 훅은 각 클론에 살고 `--no-verify`로 우회되며 required check가 될 수 없다. 협조하는 팀에는 충분하지만 위키 상태를 브랜치에서 증명해야 하면 부족하다는 것을 그대로 적었다.
  - self-hosted 전환의 함정 셋을 문서에 못박았다: 레이블에 맞는 러너가 **온라인이기 전에** 변수를 두면 잡이 실패하지 않고 24시간 큐에 머물러 required check가 조용히 PR을 막는다 · 러너에 Node가 필요하다 · **공개 저장소에는 self-hosted 러너를 붙이면 안 된다**(포크 PR이 그 머신에서 임의 코드를 실행한다).
- evidence:
  - templates/github-actions/llm-wiki-validate.yml — `runs-on`의 변수 폴백, 삭제된 테스트 스텝 자리의 주석, 상단 러너 분 설명.
  - docs/OPERATIONS.md#section:Running the gates without spending Actions minutes — 두 채널의 비등가성과 `gh variable set` 절차.
  - templates/git-hooks/pre-commit — 러너 없이 같은 두 검사를 working tree에 돌리는 기존 채널(이번에 신설한 것이 아니라 요금 0 경로로 승격해 문서화한 것).
- caveats:
  - **`impact`가 지목한 `verified` 5종(EXAMPLES · index · README · HARNESS_GOVERNANCE_ROADMAP · RELEASE_FLOW)은 본문을 고치지 않고 재스탬프로 해소했다.** 대조 결과 서술이 틀린 곳이 없었다: 템플릿을 인용하는 두 문서는 `npm test`도 `runs-on`도 서술하지 않고(로드맵 190~197줄 표가 적는 "실제 실행 명령"은 `validate-frontmatter`·`validate --strict`로 불변), README를 인용하는 세 문서는 CI 문단의 내용을 재서술하지 않는다.
  - Review Note를 추가하지 않았다. 다섯 중 넷이 이미 5건 상한이라 문서마다 아카이브 회전(항목 이동 + 포인터와 헤더 숫자 갱신)이 필요한데, 그렇게 얻는 것은 이 항목과 중복되는 기록이다. 이 결정으로 **해당 문서들의 Review Notes만 읽어서는 이번 변경을 알 수 없다** — 경위는 이 로그가 정본이다.
  - 도입처의 Actions 분을 실제로 얼마나 줄이는지는 **측정하지 않았다.** `npm test` 제거분은 도입처 테스트 스위트 길이에 달렸고, 나머지는 도입처가 self-hosted로 옮기는지에 달렸다. 이 항목의 어떤 숫자도 절감 주장으로 읽으면 안 된다.

## 2026-09-08 - docs(wiki): 1.31.0이 지목한 문서 11종 해소 — 9곳은 서술이 실제로 틀려 있었다

- status: verified (Review Note 후 review --approve-all --yes)
- actor: Claude Code (같은 지시의 2차 팬아웃)
- scope: docs (위키 11문서 + 아카이브 회전 6건 + 발표 덱 재조정)
- 계기:
  1.31.0 커밋 직후 `impact --since HEAD~1 --strict`가 11건, `drift --strict`가 18건을 냈다.
  릴리스 커밋의 정상적인 2차 팬아웃이지만, 이번에는 **재스탬프로 넘길 수 없는 것이 9곳**이었다.
- 실제로 틀려 있던 서술 9곳(재확인이 아니라 내용 수정):
  `ARCHITECTURE_CONVENTIONS` 5곳 — `src/config.js` 줄이 소유물 목록에서 새로 옮겨 온 에이전트
  어휘를 빼고 있었고, `scans.js` 줄에 N-8 경로 prefix 매칭이 없었고, `config-file.js` 줄에 값
  어휘 검증이 없었고, `skills.js` 줄의 "refresh 감지는 여전히 content hash"가 거짓이 됐고,
  `fix-migrate.js` 줄에 `driftCommand`의 rule-map 게이트가 없었다.
  `DOMAIN_FEATURES` 3곳 — 모드 절이 `lite`가 건너뛰는 스캔을 열거하면서 `drift` 명령 자체는
  게이트 밖이라는 사실을 적지 않았고(그 공백이 곧 이번 결함이다), reverse-impact 절이 규칙
  severity는 적고 **앵커 매칭 방식**은 적지 않았으며(N-8이 정확히 거기 있었다), 스킬 예산 줄이
  refresh 판정을 content hash로만 적었다.
  `GLOSSARY` 1곳 — `llm-wiki.config.json` 항목이 인식 키만 적고 **값 검증**을 적지 않았다.
  ⚠️ **공통 패턴**: 이번에 고친 9곳 중 5곳은 "무엇을 하는가"는 맞고 "무엇을 하지 않는가"가
  빠진 문장이었다. 게이트가 없다는 사실은 게이트가 생길 때까지 아무 finding도 내지 않는다.
- 본문 불변 + Review Note로 넘긴 것:
  `profiles/library.md`·`project-profile.md`(둘 다 `src/cli.js` 인용, `main()` 무변경) ·
  `docs/llm-wiki/README.md`(루트 README 변경은 내용이고 이 문서는 구조 규약만 소유 — 쌍 유지가
  실제로 지켜졌는지 EN/KO 양쪽에서 확인했다) · `VISIBILITY.md`(`config.js`는 바뀌었지만 인용
  심볼 `VALID_VISIBILITIES`는 무변경) · `BENCHMARK.md`(인용 섹션 앵커가 가리키는
  `Impact Measurement Scope Decision` 절은 글자 하나 안 바뀜 — **섹션 로케이터를 존중하지 않는
  알려진 노이즈이고 1.31.0도 그것은 고치지 않았다**).
  `index.md`는 Status에 1.31.0 항목 2개를 더했다(이 문서는 Review Notes 절이 없다).
- 아카이브 회전 6건:
  상한 5건에 걸린 문서(`ARCHITECTURE_CONVENTIONS`·`DOMAIN_FEATURES`·`GLOSSARY`·`00_overview`·
  `project-profile`·`README`)에서 최고령 노트 1건씩을 `REVIEW_HISTORY.md`로 옮기고, 손으로
  유지되는 세 숫자(아카이브 헤더 `N건`·원문서 포인터 `N entries`·실제 불릿 수)를 함께 갱신했다.
  `tests/review-notes-cap.test.js` 3건이 그 등식을 고정하며 통과한다.
- 발표 덱:
  1.31 항목을 넣자 슬라이드 22가 화면을 넘겨 마지막 항목이 잘렸다 — **두 장으로 나눈 이유가
  바로 그것이었으므로** 세 번째 장을 만드는 대신 경계를 한 칸 옮겼다(① 1.0→1.27, ② 1.28→1.31).
  브라우저에서 698px 높이로 두 장 모두 한 화면에 들어가는 것을 눈으로 확인했다. 노트의 장 제목·
  대본·시간 배분도 함께 맞췄다. ⚠️ 첫 시도에서 "1년 가까이 고칠 방법이 없던 경고"라고 썼는데
  `harness-health`는 1.28.0(2026-08-03) 출하라 5주다 — 이 릴리스가 고치고 있는 바로 그 유형의
  과장이라 발견 즉시 고쳤다.
- 게이트:
  validate --strict 0 · validate-frontmatter 0 · audit --strict 0 · drift --strict 0 ·
  harness-health --strict 0 · **impact --since HEAD~1 0** · review 0 · tests 579/579.

## 2026-09-08 - feat(governance): 게이트와 리포트와 출하 문서가 서로 다른 말을 하고 있었다 (1.31.0)

- status: needs_review (에이전트 편집 — 배치 끝에 review --approve-all --yes)
- actor: Claude Code (유지보수자 지시: "전부 해결작업을 진행하고, 오케스트레이션이 가능하면 그렇게 진행해")
- scope: src (5파일) · tests (신규 2파일 + 수정 3) · docs (위키 4 + 루트 8 + 템플릿 3 + outputs 6)
- 계기:
  1.30.0이 정책 레벨 셋을 출하했는데 제품에게 그 레벨을 다 가르치지 못했다. 출하 지면을 훑어
  보니 같은 공백이 세 형태로 나왔다 — 레벨을 무시하는 게이트(`drift`), `mode`를 다른 뜻으로 쓰는
  리포트 4곳, 모드 이전 동작을 설명하는 문서. 여기에 하네스 거버넌스 실행에서 측정된 결함 4건이
  아직 열려 있었고, 그중 `harness-health` finding 9건은 해소 경로가 없어 풍경처럼 취급되고 있었다.
- 동작 변경(빌드를 새로 실패시킬 수 있는 것 2건):
  `impact`가 디렉터리 앵커를 지목한다(N-8). 정확 문자열 비교였는데 git은 파일만 열거하므로
  `src/commands/`를 인용한 문서가 한 번도 안 잡혔다 — 이 제품이 존재하는 이유인 게이트의 위음성.
  `llm-wiki.config.json`의 `type`·`agents`가 CLI와 같은 목록으로 검증된다. `{"type":"frontendd"}`가
  통과한 뒤 알 수 없는 유형으로 동작했고 `{"agents":["all"]}`은 문자열 그대로 넘어갔다(CLI 경로는
  이미 펼친 뒤였다) — 설정 하나에 답이 둘.
  반대 방향 1건: `drift`가 모드와 설정 severity를 따르므로 `lite`에서 exit 1 → 0이 된다.
- 리포트:
  `mode:`를 `strict:` + `governance_mode:`로 쪼갰다(validate·impact·check-run·harness-health).
  레벨의 **출처**는 이 넷에 찍지 않았다 — governance-modes 테스트가 "strict를 명시하는 것과 아무
  것도 안 쓰는 것이 byte-identical"을 마이그레이션 보증으로 단언하고, `(config)` 대 `(default)`가
  그걸 깬다. `impact`의 caveat에는 출처를 남겼다(그 문장의 목적이 "초록이 뜻하는 바"를 말하는 것).
  `drift` 요약은 `mode:` → `run:`, 신규 `evidence.stale: on|off`.
  `impact`에 `stamp_only_exclusions` 추가(N-9) — 검토 스탬프만 바뀐 문서를 이름으로 보고하되
  **exit code는 움직이지 않는다.** 강제하면 N-11과 부딪친다(같은 자기제외가 해소 경로다).
- 되돌린 구현 1건:
  N-7을 "좁히기 조건이 깨졌다"로 읽고 `source_files`의 로케이터를 정밀 앵커로 처리했다가
  **되돌렸다.** GLOSSARY가 `source_files`를 넓은 앵커로 정의하고, 좁히기 경로는 이미 있다 —
  파일을 `evidence`에만 라인 범위로 인용하면 된다(픽스처로 확인). 이 저장소엔 로케이터를
  `source_files`에 쓴 문서가 0건이라 지역 소비자가 없고, 도입처에서는 넓게 쓴 앵커를 조용히
  좁혀 위음성을 만든다. 로드맵의 N-7 결론을 정정했다.
- 해소 경로가 없던 finding 9 → 0:
  `init --refresh`가 본문만 비교해서(양쪽에 `stripMarker()`), 본문이 최신인 산출물은 낡은 마커를
  영원히 갖고 `harness-health`는 영원히 보고했다. 이제 그 경우를 다시 스탬프하고 "refreshed"가
  아니라 "re-stamped"로 보고한다. 이 막힌 길을 고정하던 테스트도 틀려 있었다 — 부분 문자열로
  단언해서 손대지 않은 형제 산출물이 조건을 만족시켰고, 결함이 있든 없든 통과했다.
  남은 1건은 실재 피해였다: 이 저장소 `AGENTS.md`가 adapter v1인데 `CLAUDE.md`는 v2여서,
  1.27.2의 locate-before-reading 규율이 없는 이전 지침을 그 규율을 출하한 저장소가 Codex에게
  건네고 있었다. 손으로 v2로 올렸다(기존 adapter는 절대 덮어쓰지 않으므로 그것이 유일한 경로다).
- 출하 문서가 코드와 어긋난 자리(개수로 줄이지 않고 하나씩):
  CI 템플릿이 `npm ci` 뒤에 맨 `npx llm-wiki`를 세 번 돌리면서 devDependency 전제를 적지 않았다 —
  npm에 무관한 `llm-wiki` 패키지가 있으므로 러너에서 **남의 코드를 내려받아 실행**했다.
  `--no-install`로 바꿨고(이 저장소 CI·pre-commit 훅과 동일), 템플릿의 어떤 `npx`도 그 플래그
  없이는 안 된다는 단언을 테스트에 넣었다.
  README가 `help`에 없는 exit code 레퍼런스를 약속했다 → help에 `Exit codes` 블록 추가.
  `help`가 13개 명령이 받는 `--mode`를 언급하지 않았다. `help mode`가 init 기본값을 틀리게 적었다.
  릴리스 준비도가 `migrate_apply: keep blocked`(1.2에 해금됨)를 찍었다.
  README 2종이 생성 스킬 7종 중 4종만 적었다. SECURITY 2종이 쓰기 표면(`mode set --write`가
  비위키 파일을 쓴다)과 MCP 툴 18종을 축소해 적었다. OPERATIONS가 거버넌스 모드를 언급하지 않아,
  `lite`에서 아무것도 잡지 않는 초록 `impact` 스텝을 게이트로 오해할 수 있었다.
  PUBLIC_API가 명령을 30개로 세고(실제 32) 1.30.0 export 4종을 빠뜨렸다.
  git-hooks README가 검사 하나인 훅을 설명했다(실제 둘, 두 번째가 핵심).
  GATE_REVIEW와 PUBLIC_API가 "다음 릴리스는 SemVer MAJOR"라고 5주간 적고 있었다(1.28.0 MINOR로 출하).
  RELEASE_FLOW가 배포 인증을 토큰이라고 적었다 — 레지스트리 `_npmUser`는 1.29.5·1.30.0·1.30.1
  전부 OIDC라고 말한다. 거짓 문장 4건을 Review Note에 이름으로 적고 모르는 것도 적었다.
  결정 4건이 기록 없이 출하돼 있었다(1.29.2 `delegationPolicy`의 **음성** 측정 포함).
- EN/KO 짝:
  `SECURITY.ko.md`에 68줄 절 하나가 통째로 없었다. `ROADMAP.md`가 7월 날짜와 "(this release)"를
  달고 있었다. 프로즈의 `\u0000` 이스케이프가 겹쳐 적혀 있었다(로그의 것은 append-only라 그대로
  두고 여기 정정을 적는다 — 2026-07-15 v1.7.1 항목의 `\\u0000`는 소스가 `\u0000` 하나이므로
  잘못이다). 이 로그의 1.30.1 대응 CHANGELOG 항목이 "사실 3건"이라고 과장했다(둘).
- 게이트/테스트:
  tests 568 → 579 (신규 `anchor-semantics` 7 · `stamp-only-exclusion` 4). RED는 파일 단위가 아니라
  테스트별로 확인했다 — 수정 3건을 되돌리면 앵커 7건 중 3건 실패·4건 통과이고, 통과하는 4건은
  일부러 바꾸지 않은 계약을 고정한다. `harness-health` 9 → 0 · validate --strict 0.
  ⚠️ **N-8과 config 검증은 이 저장소에서 findings를 늘리지 않았다** — 디렉터리 앵커를 쓰는 문서가
  0건이고 config도 유효하기 때문이다. 즉 두 변경의 도입처 영향은 이 저장소로는 관측되지 않으며,
  근거는 외부 저장소 5곳 실측(디렉터리 앵커 19건)과 픽스처 테스트뿐이다.

## 2026-09-08 - fix(roadmap): 국문만 고쳐 둔 항목 순서를 영문에도 반영했다

- status: verified (Review Note 후 review --approve-all --yes)
- actor: Claude Code (유지보수자 확인 요청에서 발견)
- scope: docs (영문 ROADMAP 순서 정렬 + 위키 Review Note 1건·아카이브 회전 1건)
  "이제 문제 없나"는 확인 요청을 받고 EN/KO 쌍을 실제로 대조하다 찾았다. 2026-09-08 국문 재작성
  때 ROADMAP.ko.md의 post-1.19 목록에서 1.25가 1.24보다 앞에 있던 순서를 바로잡았는데, 영문
  ROADMAP.md는 그대로 뒀다. CONTRIBUTING이 "한쪽을 고치면 짝도 함께 고쳐 주세요"를 요구하므로
  그 규칙을 어긴 상태였다.
  영문도 1.24(released) → 1.24(bundled) → 1.25 순으로 맞췄다. 항목 본문은 글자 하나 건드리지
  않은 순수 이동이라, 스크립트가 재배열 후 파일 바이트 수가 같은지를 단언한다.
  같은 자리에서 나머지 쌍도 대조했다. README는 EN/KO 모두 절 7개가 같은 순서로 대응하고 104줄로
  동일하며, ROADMAP도 절 38개로 일치한다. SECURITY.ko의 누락 절은 이번 라인에서 이미 복원했다.
  CHANGELOG의 절 제목이 언어별로 다른 것(Added/추가)은 의도된 지역화이지 불일치가 아니다.
  impact가 HARNESS_GOVERNANCE_ROADMAP.md를 지목해서, 그 문서가 ROADMAP.md에 대해 하는 말을
  확인했다 — 소유 경계(릴리스별 계획은 ROADMAP이 소유)와 스캔 범위(루트 문서는 listTargetMarkdown
  밖)뿐이라 목록 순서와 무관하다. 본문 불변으로 두고 Review Note를 남겼으며, 상한 5건을 지키려
  최고령 1건을 REVIEW_HISTORY.md로 돌렸다(12 → 13건).
  tests 568/568 · validate --strict 0 · impact 0 · drift 0 · review 0

## 2026-09-08 - docs(deck): 타임라인이 화면을 넘겨서, 두 장으로 나눠 마무리 앞으로 옮겼다

- status: needs_review (에이전트 편집 — `outputs/`는 위키 내용 문서가 아니라 승격 대상 없음)
- actor: Claude Code (유지보수자 지시·설계 제안 채택)
- scope: docs (발표 덱 구조 변경; 22장 → 23장)
- 문제:
  - 발전 타임라인이 11번 슬라이드에 항목 19개로 있었고 **화면보다 훨씬 길었다.** 1440x900에서
    한 화면에 1.16까지만 보였고, 그 상태로 방향키를 누르면 스크롤 스냅이 **다음 장으로 건너뛰었다.**
    발표 중 이 장만 스크롤로 넘겨야 했다.
- 바꾼 것:
  - **두 장으로 나눠 마무리 바로 앞으로 옮겼다.** 21 = 발전 스토리 ①(1.0 → 1.26), 22 = 발전
    스토리 ②(1.27 → 1.30), 23 = 마무리. 이력은 본문 흐름보다 부록에 가깝다는 판단이고,
    유지보수자 제안(마지막 인사 전으로 이동 + 분할) 그대로다.
  - **나누는 지점은 개수가 아니라 내용 밀도로 잡았다.** 1.0~1.26은 설명이 한 줄이라 **2단**으로
    13개(7+6)를 넣고, 1.27~1.30은 설명이 2~3줄에 정직 포인트까지 있어 **1단**으로 6개를 뒀다.
    2단을 전면 적용하지 않은 이유는 좁은 단에서 긴 설명이 더 접혀 높이 이득이 사라지기 때문이다.
  - **`.tl--compact` 변형과 `.histhead`를 추가했다.** 이 두 장에만 적용되며 항목 간격·글자
    크기만 줄이고 **본문은 한 글자도 지우지 않았다**. 제목도 한 줄로 들어가게 폭을 넓혔다.
  - 발표자 노트를 따라 재구성했다. 옛 11절을 21·22절로 나누고 릴리스별 "한 줄 설명" 7건을
    **원문 그대로** 옮겼으며(1.26은 21절, 1.27~1.30은 22절), 12~21절을 11~20절로, 마무리를
    23절로 당겼다. 벤치 슬라이드 상호참조(21장 → 20장)와 표지의 장수(22장 → 23장)도 고쳤다.
  - 폴더 `README.md`의 "무엇이 바뀌면 어디를 고치나" 대응표를 새 번호로 전부 갱신했다.
- evidence:
  - 게시본을 브라우저로 확인: 21·22 두 장 모두 **스크롤 없이 한 화면에** 들어간다(21은 1.0~1.26
    13개 전부, 22는 1.27~1.30 6개 전부에 1.30의 "가장 최근" 주황 마커까지). 23/23 마무리 정상.
  - 슬라이드 23개 = 노트 23절, `class="now"` 1개, 낡은 "다음 두 장에서" 전방참조 0.
- caveats:
  - 덱 하단 카운터는 스무스 스크롤 중 requestAnimationFrame으로 갱신돼서, 자동화로 키를 연속
    입력하며 찍은 스크린샷과는 한 박자 어긋나 보인다. 덱의 기존 동작이고 사람이 넘기는 속도에서는
    문제가 되지 않는다 — 이번 변경으로 생긴 것이 아니다.
  - 장수가 22 → 23으로 늘어 발표 시간이 40~50초쯤 늘어난다. 노트의 장별 배분(21은 40초,
    22는 50초)으로 반영했지만 실제 리허설은 하지 않았다.

## 2026-09-08 - fix(deck): 덱이 MCP 툴 개수를 1.30.0 이전 숫자로 말하고 있었다

- status: needs_review (에이전트 편집 — `outputs/`는 위키 내용 문서가 아니라 승격 대상 없음)
- actor: Claude Code (유지보수자 지시로 브라우저 눈 확인 수행)
- scope: docs (발표 덱 1줄 교정)
- changed:
  - `outputs/team-briefing/llm-wiki-briefing.html` 슬라이드 8 — "열려 있는 건 읽기/확인 **17개**뿐"을
    **18개**로 고쳤다. 1.30.0이 MCP에 읽기 전용 `mode` 툴을 더해 17 → 18이 됐는데, 덱 정렬 배치가
    타임라인과 버전 표기만 보고 이 문장을 놓쳤다. 소스로 확인했다: `MCP_TOOLS.length === 18`
    (validate·audit·next·status·doctor·stats·graph·explain·**mode**·handoff·prompt·list_docs·
    search_docs·get_doc·get_related·onboard·review·prepare).
  - Artifact 재게시(같은 URL) 후 브라우저에서 반영 확인.
- evidence:
  - 브라우저로 22장 전부 넘겨 확인(게시본 기준, 1440x900). 레이아웃 깨짐·줄바꿈 깨짐·오탈자 없음,
    콘솔 에러 0. 버전 표기 4곳(탭 제목·표지 필·타임라인 eyebrow·마무리 필) 모두 v1.30.1.
  - 1.30 타임라인 항목이 전문 렌더되고 "가장 최근" 주황 마커가 1.29.2에서 1.30으로 이동한 것 확인.
  - 숫자 주장 일괄 점검: 노트의 "21장" 2건은 21번 슬라이드 상호참조로 정상, 노트 절 22개 = 슬라이드
    22장 일치.
- caveats:
  - **슬라이드 11(타임라인)이 화면보다 훨씬 길다.** 1440x900에서 한 화면에 1.16까지만 보이고 1.30까지
    보려면 스크롤이 필요하며, 이 상태에서 방향키를 누르면 다음 장으로 건너뛴다(실제로 확인 중
    11 → 12로 건너뛰었다). 발표 시 이 장은 스크롤로 넘겨야 한다. 항목이 20개라 구조적인 문제이고,
    이번 배치에서 고치지 않았다 — 장을 쪼개면 노트 12~22장 번호를 전부 밀어야 한다.
  - 확인은 게시본(Artifact) 기준이다. 저장소의 HTML은 doctype·head가 없어 로컬 파일로 직접 열면
    quirks mode로 렌더된다(게시 시 래퍼가 붙는다). 브라우저 확장이 `file://`을 막아 로컬 렌더는
    확인하지 못했다.

## 2026-09-08 - chore(wiki): 1.30.1 릴리스 후 재기준선

- status: verified (재스탬프 후 `review --approve-all --yes`)
- actor: Claude Code (유지보수자 지시)
- scope: wiki (재스탬프 6건 + 아카이브 머리말 1줄; 서술 내용 변경 없음)
- changed:
  - `drift --downgrade` → `review --approve-all --yes`로 `evidence.stale` 6건을 해소했다
    (`HARNESS_GOVERNANCE_ROADMAP`·`PUBLIC_API`·`project-profile`·`RELEASE_FLOW`·`VERSIONING`·
    `profiles/library`). 릴리스 커밋이 `package.json`의 커밋 날짜를 옮겨서 생긴 통상적 드리프트다.
    `impact`의 version-only 매니페스트 면제(N-13)는 `drift`에 적용되지 않는다 — 날짜 앵커라
    **무엇이** 바뀌었는지가 아니라 **언제** 바뀌었는지만 보기 때문이고, 1.29.0에서 의도적으로 그렇게 정했다.
  - `REVIEW_HISTORY.md` 머리말에 재기준선 한 줄을 추가했다. 위 재스탬프가 2차 팬아웃을 만들어
    `impact.source_changed`가 이 문서를 지목했는데, 여기서는 재스탬프가 **no-op**이었다
    (`reviewed_at`이 이미 같은 날짜 — N-11). 파일이 안 바뀌니 게이트가 계속 울고, 커밋해도 CI가
    `--since HEAD~1`로 같은 것을 다시 잡는다. 그래서 손댄 이유를 기록으로 남겼고, 그 내용은
    **아카이브로 옮긴 항목이 없다**는 사실이다(세 문서의 Review Notes는 상한 아래이고 내용도 그대로).
- evidence: tests 568/568 · validate --strict 0 · impact 0 · drift 0 · review 0
- caveats:
  - 이 항목의 첫 작성분은 셸이 백틱을 명령 치환으로 먹어 코드 식별자가 전부 빈칸이 됐다.
    커밋 전에 스크립트 파일로 다시 썼다.

## 2026-09-08 - docs(deck): 팀 발표 덱이 1.29.2에 멈춰 있어 거버넌스 모드를 한 글자도 담고 있지 않았다

- status: needs_review (에이전트 편집 — `outputs/`는 위키 내용 문서가 아니라 승격 대상 없음)
- actor: Claude Code (유지보수자 지시)
- scope: docs (사내 발표 자료; `package.json` `files` 밖이라 npm 배포물 무관 → 버전 bump 없음)
- changed:
  - `outputs/team-briefing/llm-wiki-briefing.html` — 표지·타임라인 eyebrow·마무리의 버전 표기를
    `v1.29.2` → `v1.30.1`. 슬라이드 11(발전 타임라인)에 **1.30 항목 신설**하고 "가장 최근" 표시
    (`class="now"`)를 1.29.2에서 1.30으로 넘겼다. 내용은 lite/standard/strict 세 단계, 엔진은 하나,
    같은 저장소에서 오간다, 인수인계 앞두면 strict + `backfill`, 기존 프로젝트는 무영향, 그리고
    이 덱의 관례인 **정직 포인트**(지시문 15~21% 증가는 확실, 절감은 미측정).
  - `outputs/team-briefing/SPEAKER_NOTES.md` — 대상 버전, 11장 제목, 타임라인 나레이션 갱신 +
    **"1.30 한 줄 설명(질문 나오면)"** 블록 신설(최근 릴리스마다 두는 관례를 따랐다).
  - `outputs/team-briefing/README.md` — 대상 버전 `v1.30.1`.
  - Artifact 재게시 — 같은 URL(`13dfc476-…`)에 갱신본을 올려 공유 링크를 유지했다.
- 판단:
  - **슬라이드는 22장 그대로 두고 타임라인 항목만 늘렸다.** 이 덱의 실제 관례가 그렇다 —
    슬라이드 15(최근 능력)는 1.15·1.18·1.19에 고정돼 1.20~1.29 어느 릴리스에서도 손대지 않았고,
    1.28의 breaking 변경조차 타임라인 한 줄로 처리됐다. 슬라이드를 늘리면 노트 12~22장 번호를
    전부 밀어야 하는데 그만한 근거가 없다.
  - **1.30.1은 타임라인에 넣지 않았다.** 문서 전용 패치는 타임라인에 올리지 않는 것이
    1.26.1~1.26.3의 선례다(그때도 표지 버전만 올라갔다). 버전 표기만 1.30.1이고 타임라인 마지막
    항목은 1.30이다.
- evidence:
  - 슬라이드 수 22 유지, `class="now"` 정확히 1개, 잔여 `v1.29.2` 표기 0
  - 덱 하단 카운터는 `slides.length`로 계산하므로 별도 수정 불필요
- caveats:
  - 브라우저로 처음부터 끝까지 넘겨 보는 눈 확인은 하지 않았다(README "갱신 후 확인" 항목).
    타임라인 항목이 길어 슬라이드 11이 화면보다 길어질 수 있는데, 그 경우를 위한 낮은 임계값
    IntersectionObserver가 이미 덱에 들어 있다.

## 2026-09-08 - chore(release): 1.30.1 배포 준비 (문서 전용)

- status: needs_review (에이전트 편집 — 위키 내용 문서는 건드리지 않아 승격 대상 없음)
- actor: Claude Code (유지보수자 지시로 배포 진행)
- scope: release (버전·CHANGELOG 2종·README 2종의 액션 핀·버전 단언 테스트)
- changed:
  - `package.json` — `1.30.0` → `1.30.1`. 런타임·CLI·공개 API 무변경이므로 PATCH이며,
    npm 패키지 페이지에 다시 쓴 README를 올리기 위한 배포다(1.26.1~1.26.3과 같은 이유).
  - `CHANGELOG.md`·`CHANGELOG.ko.md` — 1.30.1 항목 신설.
  - `README.md`·`README.ko.md` — 축약하면서 빠졌던 CI 안내를 한 문단으로 되살리고 컴포지트 액션을
    `@v1.30.1`로 고정했다. `RELEASE_CHECKLIST.md`가 "README 2종이 현재 태그의 컴포지트 액션을
    참조할 것"을 요구하는데, 축약이 그 줄을 지워서 체크리스트를 통과할 수 없는 상태였다. 축약 자체보다
    체크리스트가 옳다고 판단했다 — 그 항목은 1.27.0~1.27.2에서 핀이 실제로 낡았던 사고 때문에 생겼다.
  - `tests/verification.test.js` — 패키지 버전을 못박는 단언을 `1.30.1`로 갱신(릴리스 절차의 일부).
- evidence:
  - `npm test` — 568/568 pass, fail 0, skipped 0
  - `validate --strict`·`impact`·`drift`·`review`·`validate-frontmatter` — 전부 pass, finding 0
  - `npm pack --dry-run` — `llm-wiki-governance-1.30.1.tgz`, 78 파일, `rules/frontmatter.schema.json`·
    `README.ko.md`·`CHANGELOG.ko.md` 포함 확인
  - `doctor` — `governance_mode: strict`, `ci_governance: 4 blocking`, omission gate 있음
- caveats:
  - `.github/actions/validate/action.yml`의 `version` 기본값은 `"1.30"` 그대로다. PATCH라 `X.Y`가
    바뀌지 않아 갱신 대상이 아니다.
  - ROADMAP 2종에는 항목을 추가하지 않았다. 문서 전용 PATCH는 로드맵 라인을 만들지 않는 것이
    1.26.1~1.26.3의 선례다.
  - 팀 브리핑 덱은 갱신하지 않았다. `RELEASE_CHECKLIST.md`의 조건은 "사용자 대상 동작(명령·옵션·
    사용법·MCP 툴 표면)이 바뀐 경우"인데 이번 릴리스는 해당하지 않는다.
  - 배포 인증은 OIDC 단독이 아니라 `npm-release` 환경 secret의 패키지 한정 토큰 경로다
    (v1.29.3·v1.29.4에서 OIDC 토큰 교환이 완료되지 않은 것이 기록돼 있다). provenance는 계속 OIDC.

## 2026-09-08 - docs(readme): README가 제품 사양서로 자라서 처음 온 사람에게 너무 무거웠다

- status: verified (에이전트 편집 후 `review --approve-all --yes`로 승격; 이 저장소 정책)
- actor: Claude Code (유지보수자 지시)
- scope: docs (루트 README 2종 축약 + 게이트가 지목한 위키 3종 + 아카이브 1종; 코드·CLI·계약 무변경)
- changed:
  - `README.md`·`README.ko.md` — 각각 **270 → 102줄**. 남긴 것은 소개, 빠른 시작, 핵심 기능 5가지,
    명령 표(그룹당 한 줄), 거버넌스 모드(표 + 3문단), MCP, 지원 환경, 링크. 걷어낸 것은 RAG 대비 표,
    권장 모델 표, "작동 방식"(mermaid + 샘플 출력), "거버넌스 실전"(15줄짜리 면제 규칙 문단 포함),
    "업그레이드: impact가 이제 빌드를 실패시킵니다" 절 전체, "실제로 도움이 되나?" 절. 두 파일을
    같은 구조·같은 줄 수로 맞췄다.
  - 잘라낸 내용은 **버리지 않고 이미 있는 문서로 넘겼다.** 8개 항목(impact error 기본값과 탈출구 2종,
    오탐률 27%/57%, 릴리스 노트 면제, version-only 매니페스트 면제, templates/ 제외, 모드 상세,
    벤치 수치, 명령별 상세)이 `GATE_REVIEW.md`·`CHANGELOG`·`PUBLIC_API.md`·`BENCHMARK.md`·
    `docs/OPERATIONS.md`에 동등하거나 더 자세히 있음을 대조로 확인했다.
  - **안전 고지는 남겼다.** `impact`를 필수 체크에 넣기 전 읽으라는 경고와 완화 3경로
    (`governance.mode` `standard`/`lite`, `rules`의 `warning`)를 거버넌스 모드 절에 한 문단으로
    유지하고 상세는 CHANGELOG 1.28.0으로 링크했다. 벤치 수치는 README에서 뺐고, 대신 사용 판단에
    필요한 결론 하나(보강하지 않은 위키는 없느니만 못하다)만 링크와 함께 남겼다 — README 성능
    헤드라인 금지 규칙과도 맞는 방향이다.
  - `docs/llm-wiki/README.md`·`EXAMPLES.md` — `impact.source_changed`가 지목해 인용 소스
    `README.md`를 재확인하고 Review Note를 각 1건 추가(본문 불변). 상한 5건을 지키려고 각각
    최고령 1건을 `REVIEW_HISTORY.md`로 원문 그대로 이동.
  - `docs/llm-wiki/index.md` — 같은 게이트가 지목했고 본문 주장(1.29.0 실측 서술)이 축약과 무관해
    재스탬프만 했다. Review Notes 절이 없는 문서다.
  - `docs/llm-wiki/REVIEW_HISTORY.md` — 이동분 2건 수용, `Wiki README` 1→2건·`Examples` 8→9건.
- evidence:
  - `npm test` — 568/568 pass, fail 0, skipped 0
  - `validate --strict` / `impact` / `drift` / `review` / `validate-frontmatter` — 전부 pass, finding 0
  - 축약 직후 `impact`가 **error 3건**을 냈다(`EXAMPLES.md`·`index.md`·`README.md`가 루트
    `README.md`를 인용). 게이트가 의도대로 동작한 것이고, 세 문서의 주장이 실제로 깨졌는지 대조한
    뒤 해소했다.
- caveats:
  - **도그푸딩이 내 실수를 잡았다.** `EXAMPLES.md`의 아카이브 포인터를 8건 그대로 두고
    `REVIEW_HISTORY`만 9건으로 고쳤는데, `tests/review-notes-cap.test.js`의 정합성 검사가
    "pointer says 8 entries, archive section holds 9"로 실패시켰다. 사람 눈으로는 넘어갈 불일치다.
  - 영문 README가 `PUBLIC_API.md`를 상세 레퍼런스로 가리키는데 **그 문서 본문은 한국어다**(한글 30.5%).
    축약으로 이 의존이 더 커져서, 영문 README에는 `npx llm-wiki help <command>`가 영어 경로임을
    명시하고 PUBLIC_API 링크에 한국어임을 적었다. 영문 레퍼런스 부재 자체는 미해결이다.
  - 국문 README에서 `docs/OPERATIONS.md`와 `GATE_REVIEW.md`가 영문임을 링크에 표시했다.

## 2026-09-08 - docs(ko): 한국어 문서가 영어 원문의 문장 구조를 그대로 옮겨 사람이 쓴 글로 읽히지 않았다

- status: needs_review (에이전트 편집 — 이 배치는 `docs/llm-wiki/` 내용 문서를 건드리지 않아
  `review --approve-all`이 승격할 대상이 없다. 로그는 1.29.1부터 승격 대상에서 제외된다)
- actor: Claude Code (유지보수자 지시)
- scope: docs (사람이 읽는 한국어 문서 6종; 코드·CLI·계약 무변경)
- changed:
  - `README.ko.md` — 전면 재작성. 삽입구용 em dash 62 → 13(정의 목록 자리만 남김), 조사에 붙은
    굵은 글씨 제거, `harness-health`·retrieval 행과 "실제로 도움이 되나?" 절만 한다체였던 것을
    합니다체로 통일. 1.30.0 사실 보강 3건: `impact` 행에 모드별 기본 severity, `rules`/
    `rulesPreset` 우선순위에 모드 바닥값, 업그레이드 절에 `governance.mode` 경로.
    "더 알아보기"의 ROADMAP 링크를 국문판으로 교정.
  - `CHANGELOG.ko.md` — 전면 재작성(과거 릴리스 기록 포함, 유지보수자 결정). em dash 235 → 53.
    `### Added`/`Changed`/`Fixed`/`Notes`/`Breaking`/`Tests`/`Internal`/`Safety`/
    `Documentation`로 갈려 있던 하위 절 제목을 한국어로 통일. 버전 항목 51개와 모든 수치·판정·
    유보 문구는 원문 그대로.
  - `ROADMAP.ko.md` — 전면 재작성. em dash 162 → 9. 오역 1건 교정("프로젝트 *브레드스*를
    확장한다" → "다룰 수 있는 프로젝트의 폭을 넓힌다"), "하니스"/"하네스" 표기 혼용 통일,
    post-1.19 목록에서 1.25가 1.24보다 앞서 있던 순서 교정. `last_updated` 재스탬프.
  - `CONTRIBUTING.ko.md` — 재작성. "런타임 AND 개발 의존성" 같은 직역 정리. 국문 문서인데
    영문판을 가리키던 내부 링크 3건을 국문판으로 교정(CODE_OF_CONDUCT·SECURITY·ROADMAP).
  - `SECURITY.ko.md` — 재작성 + **누락 절 복원**. 영문판의 "Reporting a sensitive-info false
    positive"(68줄, 하위 절 4개)가 국문판에 통째로 빠져 있었다. `#mcp-서버-신뢰-모델` 앵커는
    README가 참조하므로 제목 문자열을 보존했다.
  - `docs/BENCHMARK_DISCLOSURE.ko.md` — 재작성. 측정값·가명 규칙·잔여 노출 서술은 원문 그대로.
- unchanged:
  - `CODE_OF_CONDUCT.ko.md` — Contributor Covenant 2.1의 표준 번역이라 손대지 않았다. 임의로
    고치면 원문과 어긋난다.
  - `docs/llm-wiki/` 하위 위키 52종 — 에이전트가 읽는 문서라 이번 범위 밖(유지보수자 결정).
- evidence:
  - `npm test` — 568/568 pass, fail 0, skipped 0 (출하 문구를 읽는 prose census 테스트 포함)
  - `validate --strict` — result pass, findings 0
  - `impact` — result pass, impacted_verified_docs 0
  - `validate-frontmatter` — result pass, findings 0
- caveats:
  - 영문 정본과의 쌍이 세 곳에서 의도적으로 갈렸다: README.ko의 1.30.0 사실 보강 3건, ROADMAP.ko의
    항목 순서 교정, CONTRIBUTING.ko의 국문 링크. 영문판에 같은 내용을 반영할지는 미결이다.
  - 문장 재작성이므로 수치·판정·유보는 하나도 바꾸지 않았으나, 문구 대조는 사람 검토가 필요하다.

## 2026-09-07 - fix(governance): 도그푸딩에서 새 명령이 자기 증거보다 넓은 부정을 단언하고, 통과 불가한 준비도 체크를 요구했다

- status: needs_review (에이전트 편집 — 배치 끝에 `review --approve-all --yes`로 승격)
- actor: Claude Code (유지보수자 지시 — `feat/governance-modes` 브랜치에서 도그푸딩 후 merge)
- scope: src + tests + wiki (1.30.0 같은 라인)
- changed:
  - `src/commands/governance-mode.js` — 의사결정 기록 탐색을 위키 밖 관례 위치까지 확장
    (`repositoryDecisionRecords`·`DECISION_PATH_RE`), 탐색 범위 문구를 `DECISION_RECORD_SCOPE`
    상수로 단일화, 커버리지 집계에서 append-only 로그 제외
  - `src/commands.js` — `backfill.unknown_history` 메시지가 자기 탐색 범위를 밝히도록 교체
  - `llm-wiki.config.json` — 이 저장소가 자기 레벨을 명시(`governance.mode: strict`)
  - `tests/governance-modes.test.js` — 회귀 3건(범위 문구·위키 밖 ADR 탐지·로그 제외)
  - `docs/llm-wiki/PUBLIC_API.md`·`DOMAIN_FEATURES.md`·`ARCHITECTURE_CONVENTIONS.md` — 계약·기능·모듈
    서술 갱신 + Review Note(각각 아카이브로 1건 회전)
  - `docs/llm-wiki/GLOSSARY.md`·`domains/00_overview.md`·`HARNESS_GOVERNANCE_ROADMAP.md` — 같은
    리뷰 이벤트이므로 기존 1.30.0 노트를 **연장**(새 항목 추가 아님)
  - `docs/llm-wiki/index.md`·`REVIEW_HISTORY.md`
  - `log`(이 항목)
- summary:
  - **발견 경로가 이 배치의 요점이다.** 코드 리뷰가 아니라 **이 저장소에 `backfill`을 실행해서**
    나왔다. 기능이 통과한 테스트 43건 중 어느 것도 이 두 결함을 보지 못했다 — 픽스처는 전부 갓
    init된 임시 저장소였고, 두 결함은 **성숙한 저장소에서만** 드러나는 종류다.
  - ① **증거보다 넓은 부정.** `backfill`이 `docs/llm-wiki/` 안만 뒤지고 "why the current design was
    chosen is **not recoverable from this repository**"라고 단언했다. 이 저장소 루트에는 자기
    `project-profile.md`가 "릴리스 게이트/의사결정 기록"으로 지목하는 **196 KB `GATE_REVIEW.md`**가
    있다. 이것은 이 기능이 방어하려고 만들어진 실패 유형 그 자체다 — 검증한 범위보다 넓은 주장.
    고친 방향 둘: git이 추적하는 관례 위치(`docs/adr/`·`docs/decisions/`·`adr/`·`decisions/`·
    `DECISIONS.md`·`ADR-*.md`)까지 찾고, **못 찾았을 때 자기가 뒤진 범위를 문장 안에 적는다.**
    `GATE_REVIEW.md`용 패턴을 넣지 **않은** 것은 의도다 — 시험한 단 하나의 저장소 파일명에 맞추는
    것은 overfitting이고, 그래서 대신 "다른 데 있으면 인수인계에서 그 파일을 지목하라"고 말한다.
  - ② **통과 불가한 준비도 체크.** `review_backlog`가 append-only 로그를 `needs_review` 백로그로
    셌다. 로그는 관례상 영구 `needs_review`이고 `review`가 의도적으로 스탬프하지 않으므로(N-14),
    **로그를 쓰는 모든 저장소에서 `backfill --strict`가 영원히 실패**했을 것이다. 이 제품이 이미 두
    번 고친 "해소 경로가 없는 finding" 계열의 세 번째이고, 하마터면 세 번째를 출하할 뻔했다.
    실측: 이 저장소 준비도 7/9 → **8/9**(남은 1건은 `decision_history`이고 그것은 **사실**이다).
  - **도그푸딩의 세 번째 결과**는 결함이 아니라 결정이다: 이 저장소가 `llm-wiki.config.json`에
    `governance.mode: strict`를 명시하게 했다. 블록이 없어도 `strict`로 해소되지만, CI를 게이트하는
    레벨을 기본값에 맡기는 것은 `doctor`의 `source:` 필드가 드러내라고 존재하는 애매함이다.
    이제 `doctor`가 `source: config`로 보고한다.
- evidence:
  - `src/commands/governance-mode.js#symbol:DECISION_RECORD_SCOPE` ·
    `src/commands/governance-mode.js#symbol:collectWikiCoverage` · `src/commands.js#symbol:backfillCommand`
  - 실행 확인: `backfill` 준비도 7/9 → 8/9, `review_backlog` incomplete → ok,
    `decision_history` 문구가 탐색 범위를 명시. `mode`·`doctor`가 `source: config` 보고.
  - 테스트 565 → **568**(신규 3), `skipped 0`. `validate --strict` 0 · `audit` 0 · `impact` 0 ·
    `drift` 0 · `validate-frontmatter` 0 · `lint` OK.
- caveats:
  - **관례 밖 이름은 여전히 못 잡는다.** 이 저장소의 `GATE_REVIEW.md`가 그 예이고, 그래서
    `decision_history` 체크는 이 저장소에서 계속 incomplete다. 그것을 통과시키려면 파일명 패턴을
    늘리는 대신 사람이 인수인계에서 그 파일을 지목해야 한다 — 체크의 문구가 그렇게 말한다.
  - 앞 항목에 적은 하네스 공백(**모드 변경 후 낡은 스킬을 제품이 finding으로 잡지 못한다**)은
    이 배치에서도 **미해결**이다.
  - 테스트 픽스처가 전부 신규 저장소라 이런 결함을 못 봤다는 사실 자체가 남은 위험이다. 성숙한
    저장소를 흉내내는 픽스처(문서 50건·verified 49건·긴 이력)는 이 배치에서 만들지 않았다.

## 2026-09-07 - feat(governance): 거버넌스가 자기가 보호하는 작업보다 비쌀 수 있었고, 그것을 고를 수 있는 레벨이 없었다

- status: needs_review (에이전트 편집 — 작업 끝에 `review --approve-all --yes`로 승격)
- actor: Claude Code (유지보수자 요청 — lite/standard/strict 거버넌스 모드 구현)
- scope: src + tests + docs + wiki (1.30.0)
- changed:
  - `src/governance.js` (신규) — 중앙 정책 레이어(leaf, I/O 없음)
  - `src/commands/governance-mode.js` (신규) — `mode` 명령 + `backfill`의 분석 절반
  - `src/config-file.js` — `governance.mode` 파싱·검증, mode floor를 `rulesPreset` 아래에 병합
  - `src/cli.js` — `mode`/`backfill` 명령 등록, `--mode` 옵션, `mode set <레벨>` 위치 인자, help 3곳
  - `src/commands.js` — `backfillCommand`, 모드별 계획 문서 집합, 비싼 스캔 2종의 비용 게이트,
    `doctor`의 `governance_mode` 줄, `handoff`의 `governanceMode`, config scaffold에 모드 씨앗
  - `src/task-prompts.js` — `governanceBudget()` 블록 + `backfill` 태스크 프롬프트
  - `src/commands/skills.js` — `llm-wiki-backfill` 스킬 추가, 생성 시점 모드 전달
  - `src/commands/findings.js` — `backfill.unknown_history`·`backfill.not_ready`·`structure.config_invalid`
  - `src/mcp/tools.js`·`src/mcp/dispatch.js` — 읽기 전용 `mode` 툴(17 → 18종)
  - `src/index.js` — `commands.mode`·`commands.backfill` + 정책 레이어 export
  - `tests/governance-modes.test.js` (신규, 43건) + 기존 테스트 3파일의 의도적 갱신
  - `README.md`·`README.ko.md`·`CHANGELOG.md`·`CHANGELOG.ko.md`·`ROADMAP.md`·`ROADMAP.ko.md`
  - `docs/llm-wiki/PUBLIC_API.md`·`DOMAIN_FEATURES.md`·`ARCHITECTURE_CONVENTIONS.md`·`index.md`
  - `package.json`(1.29.5 → 1.30.0)·`.github/actions/validate/action.yml`
  - `log`(이 항목)
- summary:
  - **문제는 관측된 것이다.** 이 패키지가 강제하는 거버넌스가 그것이 보호하는 작업보다 비쌀 수
    있다. 세 줄 수정이 `impact.source_changed`(결정 21부터 기본 error)를 발화시키고, 에이전트를
    doc-sync 패스로 끌고 가고, `verified` 문서마다 `git log`를 부르는 드리프트 스캔을 다시 연다.
    이전의 모든 레버는 거버넌스를 *돌리는* 비용을 낮췄고(1.27.1·1.29.0·1.29.1·1.29.2), 아무것도
    "지금 이 작업을 아예 해야 하는가"에는 답하지 못했다.
  - **모드는 엔진이 이미 갖고 있던 어휘로 표현했다.** 레벨은 rule-id → severity floor를 기여하고
    `rulesPreset`·명시 `rules` 아래에 키 단위로 깔린다. 새 게이트 기계를 만들지 않았기 때문에
    `src/governance.js`가 프레임워크가 아니라 leaf 모듈이다.
  - **`strict`의 floor는 비어 있고 그것이 마이그레이션 보증이다.** `governance` 블록이 없는
    프로젝트는 `strict`로 해소되고 1.29.5와 바이트 단위로 같게 동작한다(테스트로 고정: 같은 저장소에
    대해 `governance.mode: "strict"`를 명시한 config와 블록이 없는 config의 `validate` 출력이
    동일해야 한다). 새 프로젝트 기본값 `lite`는 의도적으로 별개의 질문이며 `init`이 근거로
    해소한다 — 명시 `--mode` > 기록된 모드 > *이 저장소에 이미 config나 위키가 있는가*.
  - **비용 게이트는 동작 변경이 아니다.** `evidence.stale`이 꺼져 있으면 `applyRuleConfig`가
    어차피 그 finding을 전부 버리므로, 스캔을 건너뛰는 것은 동일 출력에 대한 절감이다. 유효 rule
    map을 읽으므로 모드를 도입하지 않고 규칙을 손으로 끈 프로젝트도 같은 절감을 얻는다.
  - **`backfill`은 이력을 발명하지 않는다.** CLI는 산문을 전혀 조립하지 않고 측정만 하며, 모든
    사실에 *verified*/*inferred*/*unknown* 라벨을 단다. `unknown` 목록은 산출물이다.
- evidence:
  - `src/governance.js` · `src/commands/governance-mode.js` · `src/config-file.js` ·
    `src/task-prompts.js#symbol:governanceBudget` · `src/commands.js#symbol:backfillCommand`
  - 실행 확인(임시 저장소, 실제 CLI): `init --write`(새 프로젝트 → lite, 코어 10문서, config에
    `governance.mode: lite` 씨앗) → `mode`(레벨·출처·rule floor·capability matrix) →
    `mode set strict --write`(전환 16줄, 스캔 0, 문서 0) → `backfill`(준비도 5/9, unknown 3건,
    누락 5문서) → `backfill --write`(준비도 6/9, 누락 0) → `doctor`(`governance_mode: strict
    (source: config, ...)`) → `mode set turbo --write`(exit 3)
  - 테스트 522 → 565(`node --test`, `skipped 0`), `lint-syntax: OK (77 files)`
- caveats:
  - **`governanceBudget` 블록의 비용은 측정했고 절감은 측정하지 않았다.** ~1130 토큰짜리 쓰기
    프롬프트에 추정 173–234 토큰(chars/4 프록시)을 더한다 — 15–21% 증가다. 그것이 doc-sync 패스를
    없애서 값을 하는지는 미측정이며, 이 저장소는 미측정 절감을 주장하지 않는다(1.27.1의
    `contextBudget`과 같은 자세).
  - **기존 init 테스트 21건이 실패했고, 그것은 기능이 아니라 기본값이 바뀐 결과다.** 그 테스트들은
    감지 → 프로필/도메인 문서 매핑을 고정하는데, 새 픽스처는 config도 위키도 없어서 정의상 "새
    프로젝트"이므로 이제 `lite`로 해소된다. 문서 계획 엔진을 시험하는 호출에 `mode: "strict"`를
    명시하는 방식으로 갱신했다(우회가 아니라 "어느 레벨을 시험하는지 말하라"는 요구다). 새
    `lite` 기본값 자체는 신규 테스트가 별도로 고정한다.
  - **생성된 스킬은 작성 시점 모드의 워크플로를 담는다.** 모드를 바꾼 뒤
    `init --write --skills --refresh`를 돌리지 않으면 에이전트는 옛 워크플로를 읽는다. 블록이 자기
    안에 그 사실과 갱신 명령을 적어 두지만, 제품이 이 불일치를 **finding으로 잡지는 않는다** —
    남은 결함으로 기록한다.
  - `mcp.test.js`의 stdio 왕복 테스트가 전체 스위트 부하에서 25초 타임아웃으로 간헐 실패한다.
    단독 실행에서는 이 브랜치와 손대지 않은 기준선 양쪽 모두 통과하므로 이 변경과 무관한 기존
    flake로 판단했다.
  - 이 저장소 자신은 `governance` 블록을 두지 않으므로 계속 `strict`다(자기 게이트를 낮추지 않았다).

## 2026-09-03 - chore(docs): sanitized public mirror의 새 root commit을 기준으로 evidence 재검증

- status: verified → needs_review → verified (에이전트 승격)
- actor: Claude Code (유지보수자 지시 — 공개 미러 정리)
- scope: wiki (프론트매터 스탬프만)
- changed:
  - `docs/llm-wiki/project-profile.md` · `RELEASE_FLOW.md` · `VERSIONING.md` · `VISIBILITY.md` ·
    `profiles/library.md` — `reviewed_at`·`last_updated` 재스탬프(`VISIBILITY.md`는 `reviewed_by`도)
  - `log`(이 항목)
- summary:
  - 이 저장소는 익명화된 트리를 **단일 root commit**으로 새로 만든 sanitized public mirror다.
    그 결과 모든 파일의 git 최종 변경 날짜가 root commit 날짜가 되었고, `reviewed_at`이 그보다
    이른 `verified` 문서 5종에 대해 날짜 앵커 신선도 규칙(`evidence.stale`)이 **정상적으로**
    발화했다(경고 14건, `drift` 5건).
  - **파일 내용은 원본 익명화 커밋과 바이트 동일하다** — 같은 내용으로 원본 저장소에서는 이 게이트가
    0건이다. 즉 이것은 문서가 낡았다는 신호가 아니라 **이력을 압축한 구조의 부작용**이다.
  - 제품이 제공하는 공식 경로로만 해소했다: `drift --downgrade`로 5종을 `needs_review`로 내리고
    `review --approve-all --yes`로 재스탬프했다. `review --approve`는 설계상 스탬프만 쓰고
    본문·`source_files`·`evidence`를 건드리지 않는다.
  - `reviewed_by`는 `llm-wiki.config.json`의 `reviewer`에서 오며 **에이전트를 이름으로 지목한다** —
    스탬프가 사람 검토를 주장하지 않는다. 이 저장소의 자기승격 정책(`AGENTS.md` "Wiki discipline")
    그대로이며, 사람이 검토했다고 기록하지 않았다.
  - **측정값·실험 정의·redaction metadata는 건드리지 않았다.** 벤치 원시 JSON, 태스크 정의,
    제품 소스(`src/`·`bin/`), 테스트, `package.json`, workflow는 이번 변경에 포함되지 않는다.
    역사적 벤치 실행 날짜(2026-07-22/24/27)도 그대로다.
- evidence:
  - src/commands/scans.js
  - llm-wiki.config.json
- caveats:
  - ⚠️ **`VISIBILITY.md`의 `reviewed_by`가 사람 이름(2026-07-21 실제 사람 검토)에서 에이전트로
    바뀌었다.** 승격 스탬프가 이전 값을 덮기 때문이며, 그 결과 이 위키에서 실제 사람 검토 기록을
    가진 비아카이브 문서가 하나 줄었다. 사람 검토 이력을 보존하려면 그 문서는 재스탬프 대상에서
    빼야 하지만, 그러면 squash 미러에서는 `evidence.stale`이 계속 남는다 — **두 가지를 동시에
    만족시킬 수 없다.** 어느 쪽을 택할지는 유지보수자 결정 사항으로 남긴다.
  - 이 재검증은 소스 대조를 전제하지 않는다(이 저장소 정책 그대로). 따라서 이 미러에서도
    `drift`·`impact`는 관측 도구가 아니다.

- status: verified → needs_review → verified (에이전트 승격)
- actor: Claude Code (유지보수자 지시 — 공개 저장소 익명화 검토)
- scope: bench, docs, wiki, src(주석), tests(픽스처)
- changed:
  - 대상의 프로젝트명이 파일명에 들어 있던 태스크 파일과 보고서 6종을 가명으로 rename(git mv, 이력 보존) → **`bench/tasks-external-vue-app.json`**, `bench/results/real-driver-external-vue-app-*`. 저장소 안의 모든 참조·frontmatter `source_files`/`evidence`를 함께 갱신
  - `bench/results/real-B*.json` 5종 — `tasks[].runs[].answer` 프로즈 66건 보류(`answerRedacted: true` + `answerOriginalChars`), 최상위 `redaction` 메타 추가. **측정 필드는 무수정**
  - `bench/results/*.md` 6종·`bench/tasks-external-vue-app.json`·`bench/real/DRIVER_RUNBOOK.md`·`bench/real/runner.js`·`bench/README.md` — 식별자 가명화, 채점 워크시트의 답변 전문 인용 4건을 공개용 요약으로 축약
  - `docs/BENCHMARK_DISCLOSURE.md` + `.ko.md` — **신규**. 무엇을 측정했고 무엇을 지웠는지, 그리고 원본 corpus 없이는 재실행이 불가능하다는 사실
  - `README.md`·`README.ko.md` — 벤치 문단에 익명화 고지 링크(패키지에 포함되는 문서)
  - `docs/llm-wiki/BENCHMARK.md`·`DOMAIN_FEATURES.md`·`HARNESS_GOVERNANCE_ROADMAP.md`·`REVIEW_HISTORY.md`·`GATE_REVIEW.md`·`ROADMAP*.md`·`CHANGELOG*.md`·`outputs/distribution/CLAIMS.md`
  - `src/commands.js`·`src/commands/domains.js` — 도메인 탐지 **예시 주석**의 업무 도메인 단어 교체(동작 무변경), `tests/verification.test.js` — 같은 픽스처 이름 교체
  - `log`(이 항목)
- summary:
  - 공개 저장소가 담고 있던 것은 프로젝트·저장소·브랜치명뿐이 아니었다. **실제 dev 백엔드의 IP:포트와 사내 호스트명**, 로그인 2단계 흐름과 상태 코드 조합, 세션 스토리지 키와 그 암호화 취급, 유휴 타이머 임계값, 업무 필드명, 그리고 **비공개 앱의 소스 코드 스니펫**까지 있었다. 지시받은 패턴 목록에 없던 인프라 노출이 가장 민감했다.
  - **원시 결과의 답변 프로즈는 가명 치환만으로 안전해지지 않는다.** 66건이 함수 단위 흐름에 라인 번호까지 붙은 정독 결과였다. 그래서 프로즈는 보류하고 측정값(`inputTokens`·`outputTokens`·`wallMs`·`toolCalls`·`model`·`arm`·`repeats`·날짜)은 한 자도 건드리지 않았다. 대응표는 저장소에 두지 않았다.
  - **점수·표본 수·결론·기록된 한계는 보존했다.** retrieval이 진 태스크, 낡은 위키가 낸 보안 오답, 3.17배 손실, "agent-graded" 표기 규율까지 그대로다. 익명화는 성과를 다시 쓰는 작업이 아니다.
  - **블랭킷 치환이 제품을 깨뜨렸다 — 게이트가 아니라 테스트가 잡았다.** `ApiService` 규칙이 제품 심볼 `domainApiServicesSection`에, 바레 `routes.ts` 규칙이 제품 자신의 앵커 예시 `src/routes.ts#route:/users`에 걸렸고, 업무 도메인 라우트 규칙이 같은 이름의 픽스처 **디렉터리** 경로에도 걸려 `src/pages<item-route>`라는 존재할 수 없는 경로를 만들어 테스트 4건이 실패했다. 세 규칙을 경계 인식 정규식으로 바꾸고 픽스처를 복구해 522/522로 되돌렸다. 규약: **식별자 치환은 대상 문자열이 제품 소스의 부분 문자열인지 먼저 확인한다.**
  - **치환은 뜻도 깨뜨린다.** 축약형을 전칭으로 풀어 쓴 사실을 서술한 문장이 양변 동일("`X` → `X`")이 되고, 서로 다른 두 경로가 같은 가명으로 합쳐져 "A라 했으나 실제는 B" 문장이 무의미해졌다. 기계 치환 후 **문장 단위 손검수**가 필요하다는 뜻이고, 3곳을 손으로 고쳤다.
  - 버전 접두어가 붙은 전체 경로만 규칙에 있어서, 문서 한 곳이 **접두어 없이 인용한 엔드포인트 조각 1건**이 규칙을 그대로 빠져나갔다. 전수 검색을 지시받은 패턴 목록이 아니라 **경로 형태**(`/auth/…`·`/api/…`)로 다시 돌려서 찾았다 — 목록 기반 검색만으로는 닫히지 않는다.
  - 공개 재현용 합성 fixture는 **만들지 않았다.** `bench/tasks.json`(대상 = 이 저장소 자신) + `make-stub-wiki.mjs`가 이미 완전 공개 fixture이고 `runner.js --dry`가 이를 검증한다. 두 번째를 발명하면 근거는 안 늘고 패키지 범위만 넓어진다.
- evidence:
  - bench/tasks-external-vue-app.json
  - bench/real/runner.js
  - docs/BENCHMARK_DISCLOSURE.md
- caveats:
  - **이력 재작성은 하지 않았다.** 과거 커밋에는 원본 식별자가 그대로 남아 있다. 현재 트리 정리만으로 닫히지 않는 위험이며 유지보수자 결정 사항이다.
  - 비공개 저장소의 **커밋 해시**는 거버넌스 측정 표에 남겼다. 그 측정의 재현 근거이고 해당 저장소 접근 없이는 무의미하다.
  - 익명화된 대상의 **아키텍처 형상 서술**(예: 단일 대형 파사드)은 남겼다 — 앵커 축소 규칙이 그 저장소에서 무효로 측정된 이유 자체이기 때문이다.
  - **이미 npm에 배포된 버전**은 이 변경의 영향을 받지 않는다.
  - 미추적 상태인 2026-08-19 delegation-bench 산출물 5건에도 같은 식별자가 있으나, 유지보수자의 대기 중 작업이고 공개 경로에 없어 **건드리지 않았다**. 추적하려면 먼저 익명화가 필요하다.

