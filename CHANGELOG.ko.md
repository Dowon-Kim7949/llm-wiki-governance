> Language: [English](./CHANGELOG.md) | [한국어](./CHANGELOG.ko.md)

# 변경 이력

`llm-wiki-governance`(옛 이름 `@dowonk-7949/llm-wiki-standard`)의 주요 변경 사항을 기록합니다. [유의적 버전](https://semver.org/)을 따르며, 항목은 최신 릴리스가 위로 옵니다.

## 1.30.1 — 2026-09-08

문서만 바꿨다. 런타임과 CLI, 공개 API는 그대로이고, 다시 쓴 README를 npm 패키지 페이지에 반영하려고
배포한다. 1.26.1부터 1.26.3까지가 나갔던 것과 같은 이유다.

- **README가 다시 사양서가 아니라 소개글이 됐다.** `README.md`와 `README.ko.md`가 각각 270줄에서
  104줄이 됐고 두 파일의 구조를 똑같이 맞췄다. 남긴 것은 소개와 빠른 시작, 거버넌스가 사 주는 다섯
  가지, 그룹당 한 줄인 명령 표, 거버넌스 모드 표, MCP, 지원 환경, CI 한 줄, 그리고 링크다. 걷어낸
  것은 RAG 대비 표, 권장 모델 표, 파이프라인 다이어그램과 샘플 출력, "거버넌스 실전" 불릿(면제 규칙을
  다룬 15줄짜리 문단을 포함한다), "업그레이드" 절 전체, 그리고 벤치마크 절이다. **저장소에서 사라진
  내용은 없다.** 여덟 항목 전부를 `GATE_REVIEW.md`와 이 변경 이력, `PUBLIC_API.md`, `BENCHMARK.md`,
  `docs/OPERATIONS.md`와 대조해 같거나 더 자세히 있다는 것을 확인하고 링크로 넘겼다.
- **짧아진 README에 일부러 남긴 것이 둘 있다.** 하나는 `impact`를 필수 체크에 넣기 전에 읽으라는
  경고와 완화 방법 세 가지다. `^1.27.2`에 의존하는 프로젝트는 그 게이트를 자동으로 받게 되는데, 그
  사실을 빨간 빌드로 알게 해서는 안 된다. 다른 하나는 도구를 쓰는 방식을 바꾸는 벤치 결론 한 줄이다.
  만들어만 두고 보강하지 않은 위키는 위키가 아예 없을 때보다 나쁘게 측정됐다. 수치 자체는
  `BENCHMARK.md`로 옮겼고, 그렇게 옮긴 것이 README에 성능 헤드라인을 싣지 않는다는 이 프로젝트의
  기존 규칙과도 맞는다.
- **한국어 문서가 번역문이 아니라 한국어로 읽히게 됐다.** `README.ko.md`와 `CHANGELOG.ko.md`,
  `ROADMAP.ko.md`, `CONTRIBUTING.ko.md`, `SECURITY.ko.md`, `docs/BENCHMARK_DISCLOSURE.ko.md`를
  다시 썼다. 영어 문장 구조가 그대로 비쳤고, 영어식 삽입구로 쓰인 em dash가 여섯 문서에서 491개였던
  것이 69개가 됐으며, 굵은 글씨가 조사에 붙어 있었고, 한 문서 안에서 문체가 바뀌기도 했다.
  `CHANGELOG.ko.md`의 절 제목은 `### Added`와 `### 추가`, `### 추가 (Added)` 세 갈래로 갈려
  있던 것을 하나로 맞췄다. 측정값과 판정, 기록해 둔 유보는 하나도 바꾸지 않았다.
  `CODE_OF_CONDUCT.ko.md`는 Contributor Covenant 2.1의 표준 번역이라 손대지 않았다.
- **`SECURITY.ko.md`에 원래 없던 절을 채웠다.** 영문판의 "민감정보 오탐 신고" 절, 그러니까 막혔을 때
  무엇을 해야 하는지와 신고에 무엇을 담을지, 문서별 예외를 두지 않은 이유, 오탐이 남아 있는 동안 치르는
  비용을 다룬 68줄이 국문판에는 통째로 없었다. 영어를 읽는 사람만 볼 수 있던 내용이다. 함께 고친 것으로,
  `CONTRIBUTING.ko.md`가 국문판이 있는 문서 3건을 영문판으로 가리키고 있었고, `ROADMAP.ko.md`에는
  음차한 오역("브레드스")과 순서가 뒤바뀐 릴리스 항목 2건이 있었다.
- **국문 README를 다시 쓰면서 빠져 있던 1.30.0 사실 3건을 채웠다.** 거버넌스 모드가
  `impact.source_changed`의 기본 severity를 정한다는 것, 우선순위 사슬에서 모드 바닥값이
  `rulesPreset`과 명시 `rules` 아래에 깔린다는 것, 그리고 `governance.mode`가 게이트를 완화하는
  세 번째 방법이라는 것이다.
- 이 저장소 자신의 게이트에 따른 위키 정리도 함께 했다. README를 줄이자 `impact.source_changed`가
  그것을 인용하는 `verified` 문서 3건(`EXAMPLES.md`·`index.md`·`docs/llm-wiki/README.md`)에서
  발화했다. 재스탬프로 덮지 않고 하나씩 다시 읽었으며, 세 문서 모두 본문이 그대로 유효했고 그중 둘에
  Review Note를 추가하면서 최고령 1건씩을 `REVIEW_HISTORY.md`로 돌렸다.

## 1.30.0 — 2026-09-07

**거버넌스 모드 `lite`·`standard`·`strict`를 넣었다.** 엔진은 그대로 두고 정책 레벨만 셋으로 나눴으며, 같은 저장소에서 언제든 옮길 수 있다. 이 모드가 푸는 문제는 상상해서 만든 게 아니라 실제 도입에서 관측한 것이다. 이 패키지가 강제하는 거버넌스가 정작 그것이 지키려는 작업보다 비쌀 수 있다. 세 줄짜리 수정 하나가 `impact.source_changed`(1.28.0부터 기본 error)를 발화시키고, 에이전트를 doc-sync 패스로 끌고 가고, `verified` 문서마다 `git log`를 한 번씩 부르는 드리프트 스캔을 다시 연다. 개인 프로젝트나 빠르게 움직이는 프론트엔드에서 그 값은 아무것도 사지 못한다. 반대로 인수인계나 감사, 오프보딩에서는 그게 전부다.

> **기존 프로젝트는 직접 켜기 전까지 아무 영향도 받지 않는다.** `llm-wiki.config.json`에 `governance` 블록이 없는 프로젝트는 `strict`로 해소되는데, strict의 rule floor는 비어 있다. finding 레지스트리의 기본 severity가 이미 strict 베이스라인이기 때문이다. 그래서 해소된 옵션과 리포트 출력이 1.29.5와 똑같다. 새 프로젝트 기본값을 `lite`로 잡은 것은 의도적으로 별개의 결정이다. 기존 프로젝트의 게이트를 조용히 완화하는 것은 기본값의 옷을 입은 breaking change이고, CI가 소리 없이 실패를 멈추는 것은 새 기능을 알게 되는 최악의 방법이다. 아래 마이그레이션 절을 보라.

- **`llm-wiki mode`는 읽기만 하고, 바꾸는 것은 `llm-wiki mode set <레벨> --write`다.** 읽기 경로는 유효 레벨과 그 출처(`--mode`가 먼저, 그다음 `llm-wiki.config.json`, 마지막이 레거시 기본값), 그 레벨이 기여하는 rule severity, 전체 capability matrix를 보고한다. `mode set`은 기본이 미리보기이고 `--write`를 줘야 쓴다. 건드리는 설정 키는 정확히 `governance.mode` 하나뿐이고, 이 버전이 모르는 키를 포함해 나머지는 전부 그대로 보존한다. 깨진 설정 파일은 다시 쓰지 않고 거부한다(`structure.config_invalid`).
- **모드를 바꿔도 감사는 절대 돌지 않는다.** `strict`로 올려도 키 하나를 쓸 뿐 스캔도, 드리프트 검사도, 문서 생성도 하지 않는다. 그래서 전환이 즉시 끝나고 비싼 재구성은 명시적이고 별개인 `backfill`로 남는다. 숨은 비싼 작업을 피해야 할 실패 양식으로 못박았고, 모드 변경이 finding을 하나도 내지 않는다는 것을 테스트로 고정했다.
- **`lite`는 억제해서가 아니라 구조적으로 가볍다.** 코어 문서 집합만 계획하므로 프로필 문서가 없어도 "누락"이 아니다. 애초에 기대한 적이 없기 때문이다. `evidence.stale`과 `impact.source_changed`, `content.not_enriched`, `evidence.missing`, `evidence.ungrounded`는 끄고 `structure.required_doc`은 `info`로 내린다. 그리고 산출이라고는 꺼진 규칙뿐인 스캔 두 종은 돌린 뒤 걸러내는 대신 아예 건너뛴다(`scanEvidenceDrift`는 verified 문서마다 git을 부르고, `scanReverseImpact`는 모든 문서의 앵커를 훑는다). 이 절감은 유효 rule map을 읽으므로, 모드를 도입하지 않고 규칙을 손으로 끈 프로젝트도 똑같이 얻는다.
- **`standard`는 탐지는 그대로 두고 차단만 뺀다.** `impact.source_changed`가 warning이 된다. 소스가 움직였는데 문서가 안 따라왔다는 사실은 계속 보고하되, 평범한 빌드가 문서 누락 때문에 막히지는 않는다. 나머지는 일부러 레지스트리 기본값 그대로 뒀다. 기본값을 일일이 나열하면 push 시점의 `--strict` 상향과 싸우게 되는데, `rulesPreset: "standard"`를 비워 둔 것과 같은 이유다.
- **`llm-wiki backfill`은 `lite`에서 `strict`로 올라가는 경로다.** 모드가 존재하는 이유가 되는 바로 그 시나리오를 위한 명령이다. 저장소가 몇 달을 `lite`로 지냈고, 위키를 일부러 완전하게 유지하지 않았고, 이제 누군가 떠난다. 이 명령은 저장소가 실제로 담고 있는 것을 조사하고(추적 중인 소스와 테스트, 매니페스트, 언어 구성, 도메인 경계, git 이력), 위키를 유효 모드가 계획한 문서 집합과 대조하고, 인수인계 준비도를 퍼센트가 아니라 이름이 붙은 체크리스트로 채점한다. `--write`는 빠진 문서를 `init`이 쓰는 것과 같은 생성기로 `needs_review` 스텁으로 만든다. 산문으로 뭔가를 주장하지 않고, `verified` 스탬프를 찍지 않으며, 기존 파일은 절대 덮지 않고, append-only 로그는 `--existing overwrite`에서도 지킨다. adapter 파일과 스킬은 쓰지 않는다. 문서를 재구성하는 명령이지 하네스를 다시 깔아 주는 명령이 아니기 때문이다. `--strict`를 주면 미완성 준비도 리포트가 빌드를 실패시킨다(`backfill.not_ready`). 인수인계 전 게이트로 쓰라는 뜻이다.
- **backfill은 이력을 지어내지 않는다.** 보고하는 모든 사실에 라벨 셋 중 하나가 붙는다. *verified*는 현재 소스나 테스트, 설정에서 읽은 것이고, *inferred*는 디렉터리 경계나 네이밍, git 이력에서 끌어낸 것이며 끌어냈다고 함께 밝힌다. 나머지가 *unknown*이다. `unknown` 목록은 이 명령의 산출물이지 부족함이 아니다. ADR도 없고 스스로 설명하는 커밋도 없다면 "왜 이걸 골랐나"는 `unknown`으로 남아 떠나는 유지보수자에게 물을 질문이 된다(`backfill.unknown_history`, 그리고 텍스트를 생성해서는 닫을 수 없다고 스스로 밝히는 `decision_history` 준비도 체크). CLI는 산문을 전혀 조립하지 않는다. 측정만 하고, 출력되는 프롬프트가 같은 세 라벨 아래에서 서술을 에이전트에게 넘긴다.
- **`backfill` 태스크 프롬프트와 `/llm-wiki-backfill` 스킬을 새로 넣었다.** 스텁을 채우기 위해 에이전트가 돌리는 재구성 워크플로다. 근거 사다리를 명시적으로 담는데 현재 소스가 가장 위이고 그다음이 테스트, 설정, 기존 문서, ADR, 커밋 메시지, diff와 이력, 로컬 이슈 메타데이터 순이다. 여기에 confidence 라벨 셋과, 파일 배치나 네이밍, 의존성 선택, 커밋 제목에서 근거를 재구성하지 말라는 상시 규칙이 들어간다. `SKILL_TASKS`가 6개에서 7개로 늘었다.
- **생성 프롬프트에 governance budget이 들어간다.** `contextBudget`(얼마나 읽을지, 1.27.1)과 `delegationPolicy`(누가 읽을지, 1.29.2)에 이어지는 세 번째 레버이고, 이번 것은 문서 작업을 아예 할 것인지를 정한다. `lite`에서는 코드와 테스트에서 끝내고 "no wiki change needed (lite)"를 완결된 결과로 보고하라고 하고, `standard`에서는 변경이 실제로 건드리는 문서만 보라고 하고, `strict`에서는 영향받은 문서를 전부 갱신하고 앵커를 새로 맞추라고 한다. 비용은 정직하게 적는다. 이 블록은 1130 토큰 남짓인 쓰기 프롬프트에 추정 173~234 토큰(`chars/4` 프록시이고 실측이 아니다)을 더하며, 프롬프트 본문이 15~21% 커진다. 그것이 doc-sync 패스를 없애서 값을 하는지는 측정하지 않았다. 이 릴리스는 절감을 주장하지 않는다.
- **`--mode <lite|standard|strict>`를 받는 명령을 늘렸다.** `mode`와 `backfill`, `init`, `quickstart`, `audit`, `validate`, `status`, `next`, `stats`, `drift`, `impact`, `handoff`, `prompt`에서 받는다. `--type`과 마찬가지로 파싱 시점에 검증하므로 오타는 usage error(exit 3)가 되고 다른 레벨로 조용히 넘어가지 않는다. 읽기 명령에서는 설정을 고치지 않고도 다른 레벨의 게이트를 미리 볼 수 있다.
- **MCP의 `mode`는 구조적으로 읽기 전용이다.** 툴 스키마가 `cwd`만 노출하고 `additionalProperties: false`가 dispatch 전에 강제되므로 `set` 하위 동작에 닿을 방법이 없다. 에이전트는 프로젝트가 어느 레벨인지 물어볼 수 있지만, 바꾸는 것은 CLI에서 사람이 하는 일로 남는다. MCP 툴은 17개에서 18개가 됐다.
- **`doctor`가 거버넌스 레벨을 보고한다.** 레벨과 그 출처, 그리고 게이트가 지금 무엇을 하는지를 함께 적는다(`impact gate on (error)`인지 `advisory (warning)`인지 `off`인지, 드리프트 스캔이 도는지). CI가 실패를 멈췄는데 아무도 이유를 모를 때 사람들이 들여다보는 곳이 doctor이기 때문이다. 같은 리포트의 `llm-wiki.config.json` 줄도 `governance.mode`를 이름으로 되짚어 준다.
- **`handoff`가 어느 모드로 만들어졌는지 밝힌다.** `governanceMode` 필드와 Next Step 줄이 추가되고, 실제 인수인계라면 `mode set strict --write`와 `backfill`을 먼저 하라고 가리킨다. 기존 handoff의 payload와 message, prompt 계약은 그 외에 바뀌지 않았다.
- **중앙 정책 레이어를 뒀다.** `src/governance.js`는 `config.js` 말고는 import하지 않고 I/O도 없는 leaf 모듈이며, 모드의 의미가 사는 유일한 장소다. 다른 모든 계층은 모드 이름으로 분기하는 대신 여기에 물어본다. 모드의 rule floor는 엔진이 이미 갖고 있던 어휘로 표현된다. `rules`가 받는 것과 같은 rule-id에서 severity로 가는 토글이고, 둘 아래에 키 단위로 깔린다. 즉 mode floor보다 `rulesPreset`이, 그보다 명시한 `rules`가 우선한다. `GOVERNANCE_MODES`와 `getGovernancePolicy`, `governanceCapabilityMatrix`, `effectiveGovernanceMode`를 프로그래매틱 API로 내보내고, `commands.mode`와 `commands.backfill`이 command map에 합류했다.
- **테스트를 43건 추가해 522건에서 565건이 됐다.** 전체 시나리오를 처음부터 끝까지 돌리는 수락 픽스처가 들어 있다. `lite`로 초기화하고, 두 도메인에 소스를 추가하고, 위키를 동기화하지 않은 채 동작과 아키텍처를 바꾸고, `strict`로 승격하고, `backfill`로 공백을 찾고, `--write`로 스텁을 만들고, source mapping과 `verified`로 승격된 것이 하나도 없다는 사실을 확인한 뒤 handoff를 뽑는다.

### 마이그레이션

- **할 일이 없다.** 이미 `llm-wiki.config.json`이 있거나 `docs/llm-wiki/index.md`가 있는 프로젝트는 업그레이드해도 게이트와 exit code, 문서 집합이 그대로다. 둘 다 `strict`로 해소되고 strict의 rule floor는 비어 있다.
- **완전히 새 저장소에서 `init`이나 `quickstart`를 돌리면 이제 `lite`가 깔린다.** 설정 파일도 없고 위키도 없으면 진짜 새 프로젝트이므로, 코어 문서 집합과 함께 만들어지는 설정에 `"governance": { "mode": "lite" }`가 들어간다. 새 프로젝트에서도 종전 동작을 원하면 `--mode strict`나 `--mode standard`를 넘기면 된다.
- **생성된 스킬은 만들 당시의 모드 워크플로를 담고 있다.** 모드를 바꿨다면 `llm-wiki init --write --skills --refresh`를 돌려서 에이전트가 새 워크플로를 읽게 하라. `--refresh`는 여전히 수정되지 않은 패키지 생성물만 갱신하고 사용자가 손댄 것은 보존한다. 갱신 대상에 새 `llm-wiki-backfill` 스킬이 포함된다.
- **기존 명령에서 finding이 늘지 않는다.** 새 규칙 셋은 새 명령에서만 발화한다. `backfill.unknown_history`와 `backfill.not_ready`는 `backfill`에서, `structure.config_invalid`는 `mode`에서 나온다. 이 릴리스 때문에 기존 CI 스텝이 빨간불이 될 일은 없다.
- **`--format json` 형태는 추가만 됐다.** `schemaVersion`은 1 그대로다. `handoff`에 `governanceMode`가 붙었고, `mode`와 `backfill`은 새 payload를 가진 새 명령이다.

## 1.29.5 — 2026-09-07

문서와 산출물을 정리하고, 릴리스 워크플로의 인증 문제 하나를 고쳤다. **런타임과 CLI, 공개 API는 바뀌지 않았다.**

> **1.29.3과 1.29.4는 태그만 있고 게시되지 않았다.** 두 publish 실행이 모두 레지스트리 인증에 실패했다. 1.29.3은 `actions/setup-node`가 넣은 플레이스홀더 `NODE_AUTH_TOKEN`을 자격증명으로 보냈고 레지스트리가 404로 답했다. 1.29.4는 그 입력을 없애서 npm이 OIDC Trusted Publishing으로 넘어가게 했지만, npm은 자격증명을 아예 찾지 못했다(`ENEEDAUTH`). 이 저장소에서 OIDC 토큰 교환이 끝까지 가지 않은 것이다. 1.29.5는 `npm-release` 환경 secret에 넣어 둔 패키지 한정 granular access token으로 인증한다. 이전 릴리스들이 실제로 쓰던 경로이며, provenance는 여전히 OIDC 신원에서 나온다. **npm 기준으로 1.29.3과 1.29.4는 결번이다.**

- **공개하는 벤치마크 산출물을 익명화했다.** `bench/` 아래 측정 기록은 외부의 비공개 애플리케이션을 대상으로 한 것이다. 대상에 특정된 식별자와 구현 세부사항을 역할명 기반의 안정적인 가명으로 바꿨고, 원시 모델 답변 프로즈는 공개하지 않고 보류했다.
- **기록된 측정값과 실험 메타데이터는 그대로 뒀다.** 토큰 수와 wall-clock 시간, 도구 호출 횟수, 점수, 표본 수, arm 정의, 모델 식별자, 실행 날짜, 그리고 기록해 둔 유보와 불리한 결과가 전부 원본 그대로다. 다시 계산한 값은 없다.
- **공개 고지 문서를 추가했다.** `docs/BENCHMARK_DISCLOSURE.md`와 그 한국어본이 무엇을 지웠고 무엇을 남겼는지, 그리고 이 저장소만으로 역사적 측정을 재현하려 할 때의 한계를 밝힌다.
- **릴리스 워크플로가 다시 패키지 한정 토큰으로 인증한다.** publish 잡이 `actions/setup-node`에 `registry-url`을 넘기고 `npm-release` 환경 secret에서 `NODE_AUTH_TOKEN`을 받는다. `--provenance`와 배포 대상은 그대로다.

## 1.29.2 — 2026-08-18

생성 프롬프트가 지고 있던 토큰 규율에 네 번째 레버를 더했다. 위임 예산이다. 1.27.1의 `contextBudget`이 얼마나 읽을지를 정했다면, 이번 레버는 누가 읽을지를 정한다. 문서와 파일 여럿을 훑는 탐색은 값싸고 버려도 되는 문맥에서 하고 브리프만 회수하며, 판단과 서술은 추론을 쥐고 있는 에이전트에 남긴다.

### 추가

- **반복 쓰기 워크플로와 `bootstrap`이 위임 예산을 함께 싣는다.** `src/task-prompts.js`의 `delegationPolicy()`는 순수하고 export되는 블록이며, `feature`·`fix`·`refactor`·`docs-sync`와 `initialEnrichmentWorkflow()`(`bootstrap`과 `handoff`가 이것을 그대로 공유한다)에서 `contextBudget()` 바로 뒤에 붙는다. 규정하는 것은 네 가지다. 첫째, 탐색과 스코핑은 위임할 수 있으며 원자료가 아니라 브리프만 회수한다. 브리프란 결론과 `file:line` 근거, 확인하지 못한 항목을 말한다. 둘째, 판단은 위임할 수 없다. 설계 결정과 회귀 판정, 편집, 위키와 로그 서술은 그대로 남는다. 값싼 에이전트는 이미 써 준 텍스트를 적용할 수는 있어도 왜 그렇게 바꿨는지를 쓰지는 못하기 때문이다. 셋째, 기계적인 마감은 다시 위임할 수 있다. 검사 실행, run manifest, 이미 정해진 편집의 적용이 여기 든다. 넷째는 경제성이다. 값이 맞을 때만 위임하고, 원자료를 돌려주는 위임은 아무것도 사지 못하며, 위임한다고 해서 검증되지 않은 주장까지 사 주지는 않는다. 위임받은 쪽이 실제 소스를 읽고 근거를 보고하든지, 아니면 직접 읽어야 한다.
- **에이전트 중립은 우연이 아니라 계약이다.** 생성되는 아티팩트 본문은 Claude·Codex·Cursor·중립 네 형식이 공유하는 단일 텍스트이고 `agents: []`로 만들어지며, `initialEnrichmentWorkflow()`가 이 블록을 `bootstrap`과 `handoff`가 그대로 공유하는 구간 안에 넣는다. 첫 초안은 `agents`에 `claude`가 있을 때만 Claude 전용 문장을 붙이게 돼 있었는데, `buildTaskPrompt`가 빈 배열을 `["codex", "claude"]`로 보정하는 바람에 중립 프롬프트와 Cursor 규칙에까지 그 문장이 새어 들어갔다. 특정 하네스 이름은 `templates/adapters/` 아래 그 어댑터가 맡을 몫이고, 이제 `tests/agent-token-discipline.test.js`가 어떤 인자를 넣어도 텍스트가 변하지 않는다는 것을 고정한다.
- 읽기 전용인 `onboard`·`prepare`와 형식 변환인 `okf-extract`에는 일부러 넣지 않았다. 거기서는 위임받아 읽는 일 자체가 그 작업이라 이 블록이 지침이 아니라 잡음이 된다.

### 변경

- 위임 예산을 받은 네 태스크의 관리 스킬 아티팩트 16개를 갱신했다(`init --write --refresh --skills`). `onboard`와 `prepare` 아티팩트는 바이트까지 동일하게 남았고, 그것이 이 블록이 의도한 곳에만 들어갔다는 확인이 됐다.

**대가는 정직하게 적는다.** 해당 스킬의 고정 본문이 30% 남짓 늘어난다(`fix` 프록시가 1077에서 1406으로, `bootstrap`이 1171에서 1501로 늘었고 `chars/4` 프록시이지 실측 토큰이 아니다). 1.27.1과 같은 성질의 거래다. 실행이 끌어오는 양을 제한하기 위해 고정 지시 비용을 지불한 것이다. 위임을 전혀 하지 않는 도입처에는 순수한 비용이다.

## 1.29.1 — 2026-08-06

1.29.0이 알려진 문제(N-14)로 함께 내보냈던 것을 해소한다. 최신성 게이트가 `review`로는 재스탬프할 수 없는 문서를 지목하는 문제였다. 원인은 문서 열거자가 둘로 갈라져 있었던 것이다. `review`는 `docs/llm-wiki/templates/`를 제외하는 헬퍼를 쓰는데 `validate`와 `drift`, `impact`는 `docs/llm-wiki/` 전체를 봤다. 그래서 `verified` 템플릿이 낡았다고 지목당하면 해소할 방법이 없었다. 범위 결정은 `GATE_REVIEW.md`의 "Template Scope Decision (N-14, 2026-08-06)"이다.

### 변경

- **`drift`와 `impact`가 `docs/llm-wiki/templates/` 아래 문서를 더 이상 지목하지 않는다.** 템플릿은 도입처가 복사해 쓰는 뼈대이지 그 저장소를 서술하는 문서가 아니다. 검토 대상이 아니라면 최신성 검사 대상도 아니어야 한다. 특히 `impact.source_changed`는 기본이 `error`라서, 위키 템플릿을 두는 도입처는 해소할 수단 없이 빌드가 실패할 수 있었다. 판정 술어는 `review`가 이미 쓰던 `isTemplateDoc`를 공유하므로 두 답이 다시 갈라질 수 없다.
- **`review`가 파일이 없다고 우기는 대신 경계를 말한다.** 템플릿을 명시적으로 지정하면 예전에는 `not found under docs/llm-wiki`라고 답했다. 거짓말이었고 사용자를 오타 찾기로 보냈다. 이제는 범위 밖이라는 사유를 밝히며 거부한다. append-only 로그도 마찬가지인데 이쪽은 동작 변경이다. `--approve-all`은 늘 건너뛰었지만 명시적으로 지정하면 `verified`로 스탬프됐기 때문이다. 이제 두 경로 모두 거부한다.

이 저장소에서 실측한 결과 `evidence.stale`이 7건에서 5건이 됐다. 사라진 2건이 정확히 해소 경로가 없던 템플릿이고, 남은 5건은 재기준선으로 풀리는 통상적인 릴리스 후 드리프트다. **0이 되지 않으며 그럴 의도도 없다.**

**PATCH로 판정한 이유는 이렇다.** 명령도 옵션도 리포트 필드도 늘거나 줄지 않았다. 내용은 결함 두 건을 고치고, 경계를 말하는 caveat와 거부 사유 문구를 넣은 것뿐이다. `docs/llm-wiki/VERSIONING.md`가 정의한 `patch` 그대로다. 1.29.0이 MINOR였던 이유는 `impact` 출력에 `anchoring_files`와 `versionOnlyExcluded[]`를 추가했기 때문인데, 이번 릴리스에는 그런 추가가 없다. 동작도 관대해지는 방향으로만 움직인다. finding이 사라지므로 exit 1이 exit 0이 되고, 그래서 도입처 빌드가 새로 깨질 수 없다. 1.28.0을 예외로 만들었던 비대칭이 바로 이 지점이다. 대가는 덮지 않고 적는다. 이제 `review --approve <경로>`로 append-only 로그를 스탬프하는 일은 불가능하고, 템플릿을 최신성 게이트로 되돌리는 플래그도 없다.

## 1.29.0 — 2026-08-05

바꾼 것은 하나이고, 그것이 필요했던 이유는 1.28.0이 켠 게이트가 하필 그것을 출하한 커밋에서 발화했기 때문이다. 릴리스 커밋은 정의상 `package.json`을 바꾸고, 이 저장소에서 면제되지 않은 `verified` 문서 10건이 그 파일을 인용한다. 그래서 릴리스마다 아무도 조치할 수 없는 finding이 쏟아졌고, 그것도 이제는 플래그 없이 빌드를 실패시키는 규칙에서 쏟아졌다. 이제 `llm-wiki impact`는 `version` 값만 움직인 매니페스트를 앵커 대조에 쓰지 않는다. 그 파일은 변경된 것으로 계속 보고되며, 다만 어떤 문서가 영향을 받았는지 판정하는 데 쓰이지 않을 뿐이다.

기각한 대안 두 개와 그 대가는 `docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md` H장의 N-13에 함께 적어 두었다. 이번 것은 그중 (c)이고 2026-08-04 유지보수자 결정이다. 범위 결정은 `GATE_REVIEW.md`의 "Version-Only Manifest Scope Decision"이다.

### 변경

- **`impact`가 `version`만 바뀐 `package.json`을 앵커로 쓰지 않는다.** 규칙의 나머지는 그대로다. 기본은 여전히 `error`이고, `--strict`는 여전히 이 규칙에 아무 일도 하지 않으며, `release_notes` 면제도 그대로다. 좁아진 것은 규칙이 대조하는 변경집합뿐이다.

  **모든 방향으로 보수적으로 잡았다.** 버전 범프임을 증명하지 못하면 변경집합에 그대로 남아 계수된다. 다른 키가 하나라도 움직인 경우, `version` 필드가 바뀐 게 아니라 새로 생기거나 사라진 경우, `version`이 실제로는 움직이지 않은 경우(재포맷이나 CRLF 변환은 버전 범프가 아니고 그렇게 보고해서도 안 된다), 어느 한쪽이 파싱되지 않는 경우, 비교할 기준 blob이 없는 경우(새로 생겼거나 추적되지 않거나, git이 읽을 수 없는 ref), 작업 트리에서 삭제된 경우, 그리고 `workspaces`를 선언하지 않은 저장소의 중첩 매니페스트가 그렇다.

  **비교는 키 순서까지 구분하는데, 이건 현학이 아니다.** Node는 조건부 `exports`와 `imports`를 키 순서로 해석하므로 `{node, default}`와 `{default, node}`는 서로 다른 파일을 로드한다. 그래서 `version`을 뺀 나머지를 `JSON.stringify` 문자열로 비교해 순서를 살리고, 들여쓰기와 BOM, 줄바꿈은 계속 무시한다. 그쪽은 실제로 의미가 없기 때문이다.

  **범위는 `package.json`으로 한정했다.** 루트 매니페스트는 항상 보고, 중첩 매니페스트는 루트가 `workspaces`를 선언하고 그 glob의 리터럴 접두사 아래 있을 때만 본다. basename만 보고 판단하면 테스트 픽스처나 샘플, vendored 사본까지 걸리는데 그런 곳에서는 `version` 값 자체가 시험 대상일 수 있다. `pyproject.toml`과 `Cargo.toml`은 절대 대상이 아니다. 파서가 필요하고, 무의존성 불변식이 그 대칭성보다 값어치가 크다.

  **`drift`는 일부러 그대로 뒀다.** `evidence.stale`은 날짜 앵커라서 파일이 언제 바뀌었는지를 묻지 무엇이 바뀌었는지는 보지 않는다. 그래서 버전만 올려도 그 매니페스트를 인용한 문서를 계속 지목한다. 이 제외는 `impact`에만 해당한다.

### 추가

- **모든 `impact` 리포트에 `anchoring_files`가 붙는다.** `changed_files` 옆에 찍히고 제외된 경로를 함께 적는다(`anchoring_files: 23 (version-only manifest excluded: package.json)`). **조용히 제외하는 안은 설계 단계에서 기각했다.** 이 프로젝트는 출하 텍스트가 동작을 앞지르는 실패를 이미 두 번 겪었고, 보이지 않는 예외는 같은 실패를 방향만 바꾼 것이다.
- **`impact --format json`에 `versionOnlyExcluded[]`를 추가했다.** 부가적인 필드이고, 명령의 Caveats 블록에도 같은 내용의 한 줄이 붙는다.
- **`src/git.js`에 `fileAtRef(cwd, ref, relPath)`를 넣었다.** 특정 ref 시점의 파일 내용을 가져온다(`git show <ref>:<path>`). 이 변경이 의미가 있는지를 판정하려면 diff의 이전 쪽이 필요한데, 이름만 주는 `changedFiles`로는 답할 수 없기 때문이다. 실패하면 `null`을 돌려주는데 그 뜻은 "모른다"이지 "빈 파일"이 아니다. 잘못된 ref와 그 ref에 없는 경로가 둘 다 exit 128이고 `runGit`이 stderr를 버려서 구분할 수 없으므로, 호출자는 그 구분 위에서 fail-closed로 동작한다.

### 정직성 노트

**0이 되지 않으며, 숫자는 추정이 아니라 실측이다.** `package.json`만 바뀐 diff에서는 10건에서 0건이 됐다. 릴리스가 실제로 건드리는, 버전을 담고 있는 파일 8종을 기준으로 하면 11건에서 4건이고, 이번 릴리스 커밋에서 실제로 측정된 값이 정확히 4건이었다. 4건 전부가 내용이 진짜로 바뀐 `README.md`나 `.github/actions/validate/action.yml`을 인용한다. 이 4건은 잡음보다 참 양성에 가까웠고, 재스탬프가 아니라 문서를 다시 읽어서 해소했다. 그중 3건은 낡은 주장을 담고 있어서 본문을 고쳤다. 그리고 그 4건을 해소하자 2차 발화가 1건 나왔다. 방금 고친 문서들을 인용하는 리뷰 노트 아카이브였다. 그러니 이 커밋의 정직한 숫자는 4건이 아니라 처리 5건이다. 위키의 팬아웃은 소스에서 문서로 1홉이 아니다.

**첫 구현은 세 가지가 틀렸고, 그중 하나는 이미 출하 문서에 사실처럼 적혀 있었다.** 배포 전 적대적 검증이 셋 다 찾아냈다. 위에 적은 순서 무시 비교가 그 하나인데, 위키 6개 문서가 "JSON에서 키 순서는 의미가 없다"고 이를 정당화하고 있었다. JSON 일반으로는 참이지만 `package.json`에는 거짓이다. 나머지 둘은 `version`이 전혀 바뀌지 않았는데도 발동한 제외, 그리고 매니페스트가 아닌 `package.json`까지 잡아 버린 basename 매치였다. 셋 다 고치고 테스트로 고정했다. 거짓 전제를 단언하던 위키 문장들도 정정했는데, 딱 하나 N-13 항목 자신에 있던 것만 그 정정 배치를 살아남았고 이번 릴리스의 게이트가 그 문서를 다시 지목했을 때 발견됐다. **낡은 주장은 그것을 만든 배치가 아니라 다음 게이트 발화가 찾아낸다.**

**울타리가 그것이 지키려는 주장보다 약했다.** mutation 테스트로 첫 테스트 집합의 구멍 네 개가 드러났다. `--since` 테스트의 픽스처가 `sinceRef`와 하드코딩된 `HEAD`를 구분할 수 없게 만들어져 있었고, 필터가 공유 프리미티브인 `changedFiles`가 아니라 `impactCommand`에 있다는 결정을 단언하는 테스트가 하나도 없었고, 출력 단언이 무조건 인쇄되는 caveat에 매치돼 아무것도 검사하지 않고 있었고, "`package.json` 한정"에 대한 부정 케이스가 없었다. 테스트는 9건에서 17건이 됐다. 별도로 `tests/impact-default-gate.test.js`의 prose census는 주석에 "출하 표면 전수"라고 적어 놓고 정작 `src/` 세 파일만 읽고 있었다. 14개 표면으로 넓히자 `docs/OPERATIONS.md`와 `GATE_REVIEW.md`에서 낡은 주장 2건이 즉시 더 나왔다.

**아직 남은 알려진 문제가 있다(N-14).** `review`는 위키의 `templates/` 아래를 제외하는 헬퍼로 문서를 열거하는데 `validate`와 `impact`, `drift`는 전부를 열거한다. 그래서 `docs/llm-wiki/templates/` 아래 문서는 게이트가 지목할 수는 있지만 승격하거나 재스탬프할 경로가 없다. 강등해 보면 승인 목록에서 사라지고 `needs_review_remaining: 0`으로 보고된다. 이 저장소의 문서 2건이 의도적으로 그 상태에 있으며 덮지 않고 그대로 뒀다. 로드맵 46번으로 기록했다. `templates/` 디렉터리에 위키 문서를 두는 도입처는 같은 함정을 만난다.

## 1.28.0 — 2026-08-03

**업그레이드하기 전에 호환성 깨짐 절을 먼저 읽으세요.** 이번 릴리스는 누락 게이트를 기본으로 켠다. `llm-wiki impact --since <ref>`가 아무 플래그 없이도 빌드를 실패시킨다. SemVer로 따지면 MAJOR에 해당하지만 유지보수자가 명시적으로 결정해 MINOR로 내보낸다. 즉 `^1.27.2`에 의존하는 프로젝트는 이 버전을 자동으로 받는다. 되돌리는 길은 두 가지이고 둘 다 설정만 바꾸면 되니, 아직 게이트를 받을 준비가 안 됐다면 업그레이드하기 전에 먼저 넣어 두라.

그 밖에도 여러 가지가 함께 나갔다. 이 프로젝트가 출하하는 네 채널(pre-commit 훅, 워크플로 템플릿, 컴포지트 액션, 우리 CI)이 드디어 자기가 팔던 게이트를 실제로 돌리게 됐다. 1.27.2에서 한 종만 받았던 v2 어댑터 형태가 나머지 7종에도 도달했고, 에이전트 하네스 자체를 검사하는 읽기 전용 `harness-health`가 추가됐으며, 감지는 했지만 보고하지 못하던 8건을 연결했다. 범위 결정은 `GATE_REVIEW.md`의 "Phase 0 Gate Wiring", "Phase 0 Defect Batch", "Monorepo CLI Contract Parity"와 `docs/llm-wiki/HARNESS_GOVERNANCE_ROADMAP.md` J장에 기록했다.

### 호환성 깨짐

- **`impact.source_changed`가 이제 `error`다.** 예전에는 `warning`이었다. `llm-wiki impact --since <ref>`가 플래그 없이 exit 1이고, 이 규칙에 대해 `--strict`는 아무 일도 하지 않는다. 실제로는 이렇게 나타난다. 업그레이드한 뒤, 어떤 문서가 인용하는 소스를 고치면서 그 문서는 건드리지 않은 첫 커밋에서 빌드가 빨간불이 된다. 켠 이유는 이렇다. 이 규칙은 이 도구가 존재하는 이유 그 자체, 즉 소스는 움직였는데 문서는 안 움직인 상황을 잡는 유일한 규칙이다. 그런데 빌드를 막을 수 있는 감지 규칙 가운데 프로젝트가 직접 켜야만 동작하는 것도 이것 하나뿐이었다.

  **되돌리는 길은 두 가지**이고, 프로젝트 설정만 바꾸면 되며 코드를 고칠 일은 없다.

  ```json
  { "rules": { "impact.source_changed": "warning" } }
  ```

  `llm-wiki.config.json`의 `rules` 맵에 `"warning"`(또는 `"info"`, `"off"`)을 주면 예전처럼 권고만 하는 동작으로 돌아간다. 아니면 이렇게 해도 된다.

  ```json
  { "rulesPreset": "relaxed" }
  ```

  이 프리셋은 규칙을 `info`로 유지한다. 명시한 `rules` 항목은 여전히 프리셋보다 우선한다. `strict` 프리셋은 이 규칙을 더 이상 나열하지 않는다. 이미 error인 것을 더 올려 봐야 달라지는 게 없기 때문이다. 프리셋 불변식도 다시 썼다. "error나 blocked인 기본값은 절대 건드리지 않는다"에서 "안전 규칙과 차단하는 것은 건드리지 않는다"로 바꿨고, 프리셋이 조절해도 되는 error 기본값은 명시적인 허용 목록(`PRESET_DIALABLE_ERROR_RULES`)으로 관리한다.

  **반론도 기록으로 남긴다.** 이 규칙의 기준선 오탐률은 27%나 57%로 측정됐다. 라인 앵커가 밀린 경우를 true positive로 볼 것인가 하는 정책 판단이 아직 안 끝나서 두 숫자가 갈린다. 여러 문서가 함께 인용하는 허브 파일 하나는 최대 14건의 finding으로 번진다. 이 기본값을 켠 커밋 자신에 대해서는 finding 6건 중 실제 조치 대상이 1건이었다. 유지보수자는 이 숫자를 다 알고서 켰다.
- **`doc_type: release_notes`인 문서는 `evidence.stale`과 `impact.source_changed`에서 면제된다.** OKF `type: release_notes`도 똑같이 처리한다. 릴리스 노트는 이미 나간 릴리스의 불변 기록이고 매 릴리스마다 바뀌는 `package.json`을 앵커로 삼는다. 면제가 없으면 새 기본값이 아무도 고쳐서는 안 되는 문서 때문에 빌드를 실패시킨다. 대가는 분명히 적는다. 이 면제는 문서를 지금 들어 있는 검사에서 빼내는 일이다(이 저장소 기준 52건 중 33건). 즉 릴리스 노트가 인용하는 소스가 움직여도 더는 표시되지 않는다. 기본값을 켠 커밋 기준으로 finding이 23건에서 9건이 됐다.
- **`monorepo`가 다른 모든 명령과 같은 옵션 계약을 갖는다.** 옵션 표와 도움말 표 양쪽에서 빠져 있던 유일한 명령이었다. 그래서 `monorepo --strict --write`가 옵션을 조용히 무시하면서 exit 0으로 끝났고, `help monorepo`는 "Unknown help topic"이라고 답했다. 허용 집합은 문서를 보고 추측한 게 아니라 코드 경로에서 도출했다. `--cwd`, `--strict`, `--agent`, `--format`, `--out`이다. `--write`와 `--apply`, `--type`, `--profile`을 비롯한 나머지 옵션은 이제 exit 3이다. JSON 형태와 동결된 `commands` 항목, MCP 툴, 프로그래매틱 export는 그대로다.
- **`validate-frontmatter`가 다른 명령과 같은 4단계 사다리로 보고한다.** 가장 심한 finding이 warning인 실행이 같은 finding을 두고 `result: pass`를 찍으면서 exit 1이었다. CI 로그에서는 "통과했는데 실패"로 읽힌다.
- **`review --approve`가 보강되지 않은 스캐폴드(`content.not_enriched`)를 거부한다.** severity가 아니라 rule id로 판정한다. 이 규칙은 warning이라서, 그전까지는 자리표시자 문서가 `verified`로 찍히는지가 운영자가 우연히 `--strict`를 줬는지에 달려 있었다. stale evidence와 깨진 링크는 계속 승인할 수 있다. 그건 리뷰어가 보고 판단할 몫이다.
- **`check-run`이 매니페스트를 파일명이 아니라 자기 `timestamp` 필드로 고른다.** 매니페스트 이름이 `run-<task>-<timestamp>` 형태라서 사전순으로는 task 이름이 timestamp를 이겼다. 여기서 실측해 보니 가장 최근이 2026-07-30 feature 실행인데 `check-run`은 2026-07-27 fix 실행을 검사하고 pass를 보고했다. 완료 게이트로서는 최악의 실패 양상이다.

### 추가

- **`llm-wiki harness-health [--agent <agent>] [--preload-budget <n>] [--skill-token-cap <n>] [--strict]`를 넣었다.** 30번째 명령이자, 위키가 아니라 하네스를 검사하는 첫 명령이다. 에이전트 어댑터와 생성된 스킬 아티팩트, 항상 선적재되는 문맥 표면을 본다. 읽기 전용이고 결정적이며 의존성이 없고 아무 파일도 쓰지 않는다. `impact`나 `check-run`, `drift`, `monorepo`와 마찬가지로 CLI 전용이라 MCP에는 노출하지 않는다. 토글 가능한 규칙이 넷이고 전부 기본 `warning`이며 `--strict`에서 `error`가 된다. `harness.marker_drift`는 이 패키지가 지금 배포하는 버전보다 낮게 스탬프된 아티팩트를 잡고, `harness.user_modified`는 스킬 아티팩트가 자기 마커의 해시와 어긋나거나 마커가 아예 없는 경우를 잡는다. `harness.preload_budget`과 `harness.skill_too_long`은 숫자를 주기 전까지 침묵한다(위 플래그를 주거나 config에 `"harnessHealth": { "preloadBudget": <n>, "skillTokenCap": <n> }`를 쓰면 된다). 이 명령을 만든 계기는 이미 배포된 도구에서 소스로 확인된 결함 두 건이다. `scanAdapters`는 어댑터 마커를 아예 읽지 않아서 구버전이 만든 어댑터가 `audit`에서 영원히 clean으로 통과했고, `init --refresh`는 스탬프된 버전이 아니라 아티팩트 본문을 비교하는 바람에 v5 생성기가 v4로 스탬프한 아티팩트를 "already up to date"라고 보고했다. 어댑터 행의 `userModified`가 `null`인 것은 의도한 것이다. 버전 마커는 있지만 콘텐츠 해시가 없고, 배포 템플릿과 diff하는 대안은 의도적인 커스터마이즈까지 전부 표시하게 된다.
- **`drift --watch-needs-review`를 넣었다.** 기본은 꺼짐이고 `drift`만 받는 옵션이며, 날짜 기준 신선도 검사를 `verified`뿐 아니라 `needs_review` 문서까지 넓힌다. `impact`는 일부러 넓히지 않았다.
- **`drift`가 `--strict`를, `explain`이 `--cwd`를 받는다.** 문서를 보고 추측한 게 아니라 코드 경로에서 도출했다. `applyProjectConfig`가 모든 명령에서 돌고 config의 `lang`이 `explain`의 서술 언어를 정하기 때문이다.
- **`run.change_set_undeclared`(warning)를 넣었다.** 매니페스트가 스스로 보고한 `changedSource`를 워킹 트리와 대조한다. 이 값을 비워 두거나 일부만 선언하는 에이전트는 `run.doc_gap`을 구조적으로 발화 불가능하게 만들기 때문이다. 추적 중인 수정만 비교하고(첫 구현은 `.obsidian/` 설정과 개인 메모에까지 발화했다), git이 변경 없음을 보고할 때는 조용하다.
- **`run.manifest_untracked`(info)를 넣었다.** 선택된 매니페스트가 git 추적 대상이 아니라서 clean checkout에서는 보이지 않는다는 사실을 알린다. 정보성으로 둔 것은 의도다. 매니페스트를 gitignore하는 것도 정당한 정책이고, 실측한 다섯 저장소 중 두 곳이 그렇게 한다.
- **`doctor`가 `ci_governance`를 보고한다.** 어떤 워크플로나 훅이 실제로 `llm-wiki`를 호출하는지, 그리고 그중 차단할 수 있는 것이 있는지를 말해 준다. `doctor` 스텝 하나만 있는 워크플로는 항상 exit 0인 리포트인데 그동안 거버넌스로 읽히곤 했다. 누락 계열 명령은 `--strict`가 있어야 차단으로 세고, 누락 게이트가 없으면 안심되는 숫자를 보여 주는 대신 없다고 문장으로 말한다. 탐지는 언급이 아니라 호출을 매칭하며(무관한 `llm-wiki-review:` job 이름이 거버넌스로 잡히던 문제를 고쳤다) `node bin/llm-wiki.js` 형태도 인식한다.
- **컴포지트 액션이 `command` 입력을 받는다.** `validate`를 `args[0]`에 박아 놓는 바람에 누락 게이트를 이 경로로는 물리적으로 실행할 수 없었다. 읽기 전용 명령 11개만 허용하고, 쓰기 명령은 exit 3으로 거부하며, 각 플래그를 그 옵션을 받는 명령에만 전달한다.

### 변경

- **우리가 출하하는 네 채널이 이제 누락 게이트를 돌린다.** `templates/git-hooks/pre-commit`은 `validate --changed` 다음에 `impact --strict`를 돌리고, `templates/github-actions/llm-wiki-validate.yml`은 `fetch-depth: 0`과 함께 `impact --since origin/<base> --strict`를 돌린다. `fetch-depth: 0`이 없으면 `--since`가 base ref를 해석하지 못해서 게이트가 조용히 무력화되는데, 게이트가 깨지는 방식 중 최악이다. 이 저장소에도 `governance` 잡을 만들어서, 우리가 파는 게이트를 우리가 먼저 통과한다.
- **v2 프롬프트 형태가 어댑터 8종 전부에 도달했다.** 1.27.2는 `templates/adapters/claude-code/CLAUDE.md` 한 종만 올렸고 나머지 7종은 패키지 최초 커밋 이후 손대지 않은 `wiki-block v1`이었다. 그 릴리스의 간판 이득이 Claude Code 사용자에게만 도달했다는 뜻이다. 이제 Codex와 Gemini, Copilot, Cursor, Windsurf, JetBrains, Antigravity가 같은 형태를 갖는다. 작은 상시 코어에 필요할 때 읽는 retrieval을 얹는 형태이고, 각자의 고유 형식은 그대로 보존한다(Cursor의 `.mdc` frontmatter, JetBrains의 info 수준 안내문, Antigravity의 마커와 UTF-8 규칙, Codex의 `# Project Agent Guide` 구조). 본문은 참조 구현과 1.16.0의 영어 우선 방향에 맞춰 영어로 통일했다. 호환성은 그대로다. `scanAdapters`는 여전히 `docs/llm-wiki/index.md`를 참조하는지만 검사하고, 기존 어댑터 파일은 여전히 절대 덮어쓰지 않는다.
- **`check-run`이 git 추적 매니페스트를 우선한다.** 로컬 실행이 CI를 예측할 수 있게 하기 위해서다. 추적 전용은 아니다. 매니페스트를 gitignore하는 저장소는 추적되지 않은 매니페스트로 폴백하고, `--strict`에서 영구히 빨간불이 되는 대신 위의 info finding을 받는다.
- **컴포지트 액션의 `version` 입력 기본값을 `1.28`로 올렸다.** 1.27 라인 내내 `1.26`에 머물러 있어서 `@v1.27.2`로 고정한 소비자도 CLI 1.26.x를 돌리고 있었다. 다시 낡지 않도록 `RELEASE_CHECKLIST.md`가 이 값을 검증한다.
- **쓰기 범위를 설명하는 caveat이 실제로 쓰는 필드를 전부 말한다.** `review --approve`는 status와 `reviewed_by`, `reviewed_at`만 쓴다고 했고 `drift --downgrade`는 status와 `last_updated`만 쓴다고 출력했는데, 두 명령이 공유 헬퍼를 쓰면서 `tags:` 상태 태그까지 쓰게 된 뒤로 그 경계 서술이 거짓이 됐다. `commands.js`와 `cli.js`, `fix-migrate.js` 8곳을 고쳤다.
- **도구가 "누가 키보드 앞에 있는지" 안다고 주장하기를 멈췄다.** 출하 표면 다섯 곳(`review` caveat 2건, `--help` 요약, `help review` 토픽, MCP `review` 툴 설명)이 verified는 사람의 결정이라고 단언하고 있었다. 실제로 보장되는 것은 그보다 좁다. 무엇도 스스로 승격하지 않고, 명시적인 `--approve`만 스탬프하며, `reviewed_by`는 실행한 주체를 기록한다. 각 표면은 이제 메커니즘도 함께 가리킨다. 승인 실행을 위임하는 프로젝트는 config의 `reviewer`로 실제 승인자를 지목해야 한다. 생성 프롬프트에 들어가는, 도입처를 향한 권고는 일부러 그대로 뒀다.
- **`prompt --task` 도움말을 `SUPPORTED_TASK_PROMPTS`에서 렌더한다.** 손으로 복사해 두었던 목록이 8개 중 6개로 밀려 있었다. `help drift`와 usage 요약도 이제 `--strict`와 `--watch-needs-review`를 나열한다.

### 수정

- **`drift`가 방금 stale이라고 증명한 위키에 대해 `result: pass`와 exit 0을 보고했다.** stale evidence를 별도 배열에 담는데 `exitCodeFor`는 `findings`를 읽고 있었기 때문이다. 게다가 `--strict`를 아예 거부했다. 이제 `findings`로 보고한다. 기본 exit code는 0 그대로라서 기존 파이프라인에 `drift`를 추가해도 여전히 깨지지 않는다.
- **문서가 `status: verified`인데 태그는 `needs-review`로 남을 수 있었다.** `review --approve`와 `drift --downgrade`가 각각 `status:`만 고치고 `tags:`는 그대로 뒀고, 어느 쪽으로 깨지는지는 어느 경로가 돌았는지에 달려 있었다. 한 도입 저장소에서는 22건 중 12건이 그 상태였다. 이제 두 경로가 헬퍼 하나를 지나며, 이미 있는 상태 태그만 고치고 없던 태그를 새로 만들지는 않는다.
- **같은 태그 헬퍼에 다항 백트래킹이 있었다.** 로컬 게이트가 아니라 CodeQL이 잡았다. 인라인 리스트 패턴이 여는 대괄호 앞 prefix에 `[`를 허용하는 바람에, 이 헬퍼가 실제로 다루는 입력인 문서 본문에서 2차식으로 백트래킹할 수 있었다. 고치기 전 실측으로 대괄호 25k에서 350ms, 50k에서 1692ms였고 고친 뒤에는 1ms 미만이다.
- **`impact --since`가 새로 만들어졌지만 아직 커밋되지 않은 소스를 보지 못했다.** `changedFiles`가 추적되지 않은 파일을 ref 없는 경로에서만 더하고 있었는데, 그게 바로 모든 PR 워킹 트리의 상태다.
- **`fix --write`가 append-only 로그를 다시 쓸 수 없게 막았다.** 잠재적 결함이고, 오늘 이 조건을 만족하는 plan은 없다.

### 정직성 노트

SemVer 판단은 유지보수자의 몫이다. exit code 계약을 뒤집는 변경은 MAJOR인데 그것이 `1.28.0`으로 나간다. 이 사실을 덮지 않고 여기 적어 두며, 그래서 되돌리는 길 두 가지를 CHANGELOG와 README 두 종, 릴리스 노트에 모두 실었다.

`harness-health`는 실제 저장소 다섯 곳에 읽기 전용으로 돌려서 실측했다. 아티팩트 91건을 검사해 finding 33건이 나왔고 오탐은 0이었으며, 그중 한 곳은 진짜로 0건이었다. 이 숫자와 반드시 함께 다녀야 하는 한계가 둘 있다. 여기서 "참"은 보고한 사실이 맞다는 뜻이지 조치할 가치가 있다는 뜻이 아니다. 그리고 이 실행은 이 워킹 트리의 아직 배포되지 않은 템플릿을 썼기 때문에, 배포된 1.27.2를 쓰는 도입처는 어댑터 finding을 더 적게 본다. 이 릴리스 어디에 나오든 크기 수치는 제품이 이미 쓰는 `chars/4` 프록시이지 실측 토큰 수가 아니고 비영어 텍스트를 과소 추정한다. 토큰이나 속도 헤드라인은 싣지 않는다.

`doctor`의 `ci_governance` 수치는 상한이다. 이 검사는 호출을 볼 뿐 그것이 어느 디렉터리에서 도는지는 모르므로, 스크래치 디렉터리를 대상으로 하는 패키징 스모크 테스트까지 세어진다. 더 정확히 하려면 YAML 파서가 필요하고 그건 무의존성 입장을 포기해야 하는 값이다. `core.hooksPath`로 훅을 옮긴 저장소는 "none detected"로 읽히는데, 이건 안전한 쪽으로 틀리는 것이다.

권고를 받았지만 측정한 뒤 출하하지 않기로 한 결정이 하나 있다. `review` 명령을 거치지 않은 승인을 게이트로 잡자는 안인데, verified 문서 129건에 대해 42번 발화했지만 실제 우회는 0건이었다. 권고 자신의 전제 조건이 실패한 것이다. 새 CI 템플릿을 파일럿 저장소에서 확인하는 일은 지시에 따라 건너뛰었으므로, 확인하지 않은 도입 저장소 세 곳이 이 템플릿을 채택한 뒤에도 초록으로 남는지는 측정하지 않았다.

## 1.27.2 — 2026-07-30

프롬프트 형태 규율을 다뤘다. 생성되는 모든 지시 줄을 steering과 계약, 안전으로 분류하고 steering만 지운다. 검증 기계(`validate`, `check-run`, 테스트)가 이미 종료 시점에 계약을 강제하기 때문이다. 새 명령이나 옵션은 없다. 동결된 프로그래매틱 `commands` 맵과 `--format json` 형태, frontmatter 계약, 무의존성 불변식은 그대로다. 범위 결정은 `GATE_REVIEW.md`의 "Prompt-Shape Discipline (Unhobbling) Scope Decision"에 기록했다.

### 변경

- **Claude Code 어댑터 템플릿이 위키를 통째로 선적재하지 않는다.** 블록 마커가 v1에서 v2로 올라갔다. `templates/adapters/claude-code/CLAUDE.md`가 `@`-include를 `docs/llm-wiki/index.md`와 `project-profile.md`로만 줄이고, 무거운 문서(`README`, `ARCHITECTURE_CONVENTIONS`, `DOMAIN_FEATURES`)는 필요할 때 읽는 목록으로 두면서 retrieval 명령(`search-docs`, `prepare --task ... --compact`, `get-doc --section --strict-section`) 안내를 함께 붙인다. 이 저장소 기준으로 세션당 선적재가 30.3k에서 1.4k 토큰 남짓으로 줄었다(`chars/4` 프록시이고 파일 크기 산술이지 실측이 아니다). 기존 어댑터 파일은 여전히 절대 덮어쓰지 않으며, `scanAdapters`가 `index.md` 진입점만 검사하므로 기존 어댑터는 계속 통과한다. 다른 어댑터 템플릿은 원래 `index.md`만 가리키고 있어서 바뀐 것이 없다.
- **반복 쓰기 워크플로가 목표와 금지선, 종료 기준으로 이뤄진 프롬프트가 됐다.** 스킬 마커가 v4에서 v5로 올라갔다. 생성되는 `feature`·`fix`·`refactor`·`docs-sync` 프롬프트와 스킬이 번호가 붙은 단계 목록 대신 세 블록으로 서술된다. Goal과 Hard lines(넘지 말 것), Exit criteria(전부 충족해야 완료)이고, 여기에 그 사이를 어떻게 일할지는 에이전트의 몫이라는 자율성 문구가 명시적으로 붙는다. 하중을 받는 줄은 전부 살아 있다. 진입점 읽기, 주장하기 전에 실제 소스 확인하기, 문서와 코드가 충돌하거나 범위가 커지면 멈추기, `needs_review`와 verified는 사람만, 민감정보 금지, 문맥 예산, append-only 로그, 테스트와 검증 보고가 그것이다. 절차형 원샷 워크플로인 `bootstrap`(`handoff`와 그대로 공유한다)과 `onboard`, `prepare`, `okf-extract`는 일부러 체크리스트를 유지했고 이 경계는 회귀 테스트로 고정된다. 관리 대상이면서 사용자가 손대지 않은 스킬 아티팩트는 평소처럼 `init --write --skills --refresh`로 갱신된다.

### 정직성 노트

프롬프트를 이렇게 재구성한 것이 과제 성과에 주는 효과는 측정하지 않았다. 벤치 arm을 돌리지 않았고, 그 상태로 배포하는 것은 유지보수자의 결정이다. 선적재 수치도 `chars/4` 프록시 산술이다. README에 토큰이나 속도 헤드라인은 싣지 않는다.

## 1.27.1 — 2026-07-29

세 배치를 함께 내보낸다. 2026-07-27 품질 감사에서 남은 항목들, 외부 에이전트 하네스(ECC, MIT)를 의존성이 아니라 기법의 출처로만 읽어 차용한 네 건, 그리고 생성 프롬프트의 문맥 규율 패스다. 전부 부가적이고, 동결된 프로그래매틱 `commands` 맵과 `--format json` 형태, frontmatter 계약, 무의존성 불변식은 그대로다. 버전에 관해 한 가지 적어 두면, `1.27.0`은 배포되지 않았으므로 `1.26.3`에서 `1.27.1`로 올리면 아래 내용을 모두 받는다.

### 추가

- **`import-memory [<path>] [--apply]`를 넣었다.** 에이전트 하네스의 portable `ecc.memory.v1` Markdown 메모리를 `docs/llm-wiki/imported/` 아래 `needs_review` 위키 초안으로 옮긴다(`doc_type: imported_memory`). 기본은 미리보기다. frontmatter는 템플릿 seam으로만 만들어지므로 이 임포트가 `verified` 문서를 만드는 것은 구조적으로 불가능하다. 민감정보 스캔에 걸린 메모리는 가려진 개수만 보고하고 값 없이 건너뛰며, 기존 파일은 절대 덮지 않고, rejected나 superseded 같은 비활성 메모리도 건너뛴다. `source_files`와 `evidence`는 일부러 비워 둔다. grounding은 사람이 리뷰하는 단계의 몫이고 출처는 본문에 기록한다. 쓰기 명령이라 MCP에는 노출하지 않는다. 새 finding으로 `import.source_missing`(error), `import.invalid_memory`, `import.unsupported_schema`, `import.sensitive_skipped`(warning)가 생겼다.
- **`llm-wiki.config.json`에 `rulesPreset: "relaxed" | "standard" | "strict"`를 넣었다.** 개별 rule ID를 일일이 익히고 싶지 않은 프로젝트를 위한, 이름 붙은 severity 묶음이다. `relaxed`는 휴리스틱과 정렬성에 관한 warning 11건을 완화하고, `standard`는 일부러 아무것도 하지 않는 베이스라인이며, `strict`는 직접 켜는 lint(`content.thin_body`, `visibility.*`)를 켜고 거버넌스 rule 4건을 `error`로 올린다. 확장이 config 병합 시점에 일어나므로 CLI와 프로그래매틱 API, MCP, monorepo의 패키지별 병합이 모두 이를 물려받는다. 명시한 `rules` 항목이 항상 프리셋보다 우선하고, `sensitive.*`는 여전히 끌 수 없으며, 알 수 없는 값은 config 오류(exit 3)다. `doctor`가 적용된 프리셋을 그대로 보여 준다. 프리셋은 finding severity만 건드리므로 exit code를 지배하는 `--strict` 플래그와는 별개다.
- **run manifest에 `testEvidence { red, green }` 필드를 넣고 `check-run`이 검증한다.** `changedSource`가 비어 있지 않은 `feature`나 `fix` 실행에서 트레일이 없거나 불완전하면 `run.test_evidence_missing`(warning, 토글 가능)을 낸다. 문서만 다루는 실행(`docs-sync`, `bootstrap`)과 구 매니페스트는 면제되어 경고가 없다. finding에는 빠진 키 이름만 담기고 값은 담기지 않는다.
- **생성되는 모든 스킬 아티팩트에 `estimated-tokens`를 붙였다.** 에이전트가 스킬 본문을 로드하기 전에 비용을 가늠할 수 있게 하려는 것이다. Claude와 Codex의 `SKILL.md` 계약에는 frontmatter 키로 넣고, 서드파티인 Cursor `.mdc`와 중립 프롬프트에는 맨 앞 HTML 주석으로 싣는다. 값은 `chars/4` 프록시이고 그 사실을 항상 인라인으로 함께 적는다. 이 프로젝트는 실측 토큰 수치를 공표하지 않는다. 구세대 관리 아티팩트는 `--refresh`가 평소처럼 갱신한다.
- **`npm run test:quiet`을 넣었다.** 같은 테스트 스위트를 `dot` 리포터로 돌린다. 긴 에이전트 세션 중에 테스트를 다시 돌릴 때 매번 380줄 남짓한 결과가 문맥으로 끌려오지 않게 하려는 것이다. `npm test`와 `npm run verify`, CI는 진단을 위해 기존 리포터를 그대로 쓴다.

### 변경

- **생성 스킬과 작업 프롬프트가 문맥 예산을 갖는다.** 모든 워크플로(`bootstrap`, `feature`, `fix`, `refactor`, `docs-sync`, `okf-extract`, `onboard`, `prepare`와 `handoff` 프롬프트)가 에이전트에게 읽기 전에 위치를 먼저 특정하고, 큰 파일은 통째로가 아니라 라인 범위나 섹션으로 읽고, 위키 문서에는 compact retrieval 플래그를 쓰고, 테스트는 실패 항목과 요약 줄로 보고하라고 지시한다. 이 예산은 소스를 어떻게 읽을지만 좁히고 읽을지 말지는 건드리지 않는다. 근거가 간결함보다 우선하며, 좁혀 읽어서는 확인할 수 없는 주장이 있으면 답은 "더 읽어라"라는 것을 명시한다. 소스가 `contextBudget` 한 곳이라 워크플로마다 갈라지지 않는다. 그 대가로 각 스킬의 고정 본문이 30% 남짓 늘어난다(`feature` 스킬의 프록시 수치가 775에서 1010으로). 실행이 끌어오는 양을 제한하기 위해 설계상 감수한 트레이드오프이지 실측된 절감이 아니다.
- **run manifest 계약이 스스로 상한을 갖는다.** 나열된 필드가 계약의 전부이고 `check-run`이 그 밖에는 아무것도 읽지 않는다는 점을 명시했다. 선택적인 summary는 두 문장 이하로 제한하고, diff나 파일 내용, 로그, 테스트 출력을 매니페스트에 붙여넣는 것을 금지한다. 그동안 에이전트들이 어떤 검사도 읽지 않는 여러 문장짜리 summary와 추가 필드를 써 왔다.
- 생성 아티팩트 형식 버전을 `3`에서 `4`로 올렸다. 갱신 판정은 여전히 content hash를 쓰므로 `--refresh`는 수정되지 않은 관리 아티팩트만 갱신하고 사용자가 편집한 파일이나 외부 파일은 건드리지 않는다.

### 수정

- **중복된 YAML frontmatter 키가 조용한 last-wins 대신 표면으로 드러난다.** `parseFrontmatter`는 last-wins 의미론을 그대로 유지해서 어떤 문서의 형태도 바뀌지 않지만, 추가로 `duplicateKeys`를 보고하고 두 소비 seam이 `frontmatter.duplicate_key`(warning, 토글 가능)를 낸다. 중복 키는 눈에 보이는 오류 없이 grounding(앞선 `source_files`나 `evidence` 목록)을 버리거나 `status`와 `contains_sensitive_info`를 뒤집을 수 있었다. finding에는 키 이름만 담기고 값은 담기지 않는다.
- **MCP 서버가 스스로 공표한 `inputSchema`를 실제로 강제한다.** 위반하는 호출은(잘못된 타입, enum 밖의 값, 필수 인자 누락, `minimum` 미만, 알 수 없는 인자, 객체가 아닌 arguments) 명령을 실행하기 전에 JSON-RPC `-32602 Invalid params`로 거부되고 `data: {tool, errors}`가 함께 간다. 그전에는 조용히 강제 변환하거나 걸러낸 뒤 그대로 실행했다. `validate {strict: "true"}`가 non-strict로 실행됐고, `status {type: "banana"}`가 `active_profiles: core, banana`를 만들어 냈다. 실행 수준의 실패는 기존 `isError: true` 형태를 유지한다. 검증기는 순수하고 의존성이 없는 모듈이며 툴 정의가 실제로 쓰는 JSON-Schema 부분집합만 다룬다. 툴의 `type` enum은 이제 `KNOWN_TYPES` 한 곳에서 파생되므로, `mobile`(1.12)과 `infra`(1.13)를 빠뜨린 채 손으로 관리되던 낡은 목록이 함께 고쳐졌다.
- **`--type`도 `--format`이나 `--lang`처럼 검증한다.** 지원하지 않는 값은 같은 `KNOWN_TYPES` 단일 소스에 대해 usage error(exit 3)가 된다. 작은 동작 변경이 하나 있다. 그전에는 `--type banana`가 그대로 detection으로 흘러가 `active_profiles: core, banana`를 만들고 exit 0으로 끝났다.

### 테스트

- 테스트가 330개에서 384개가 됐다. frontmatter 파서와 검증기 seam의 negative path 유닛 테스트가 들어 있다. 새로 넣은 동작은 하나하나 고치기 전 소스에서 실제로 실패하는 것을 확인한 뒤에 고쳤다.

## 1.26.3 — 2026-07-27

저장소 품질 감사에서 재현한 버그 두 건을 고쳤다. 새 명령이나 옵션은 없고, `1.0.0`의 명령과 `--format json` 형태, frontmatter 계약, 무의존성 불변식은 그대로다.

### 수정

- **`llm-wiki.config.json`에 붙은 UTF-8 BOM 하나가 더 이상 모든 명령을 죽이지 않는다.** Windows PowerShell의 `Out-File -Encoding utf8`과 구형 메모장이 BOM을 붙이는데, 그것 때문에 유효한 JSON인데도 `JSON.parse`가 예외를 던져 모든 명령이 `llm-wiki.config.json is not valid JSON`으로 exit 3이 됐다. 메시지는 원인을 전혀 알려 주지 않았다. 이제 config 파일도 1.14.1부터 detector 매니페스트가 쓰던 BOM 인식 리더(`readTextAuto`)로 읽으므로 UTF-8 BOM이나 UTF-16(LE·BE) config도 로드된다. 진짜로 망가진 JSON은 여전히 exit 3이고, 위키 문서는 mojibake 스캔을 지키기 위해 raw UTF-8 읽기를 유지한다.
- **`init --no-adapters`가 플래그 순서를 타지 않고, 비운 목록을 config가 되채우지 않는다.** 이제 플래그가 의도만 선언적으로 기록해 두고 인자 파싱이 끝난 뒤 한 번 적용되므로 `--agent claude --no-adapters`와 `--no-adapters --agent claude`가 같은 결과를 낸다. 또 하나, 비워진 `agents`가 "지정하지 않음"으로 읽히는 바람에 config의 `agents`가 다시 병합됐다. 이 저장소에서는 `init --agent claude --no-adapters`가 `agents=[codex, claude]`를 냈다. 어댑터를 끄는 플래그가 사용자가 지정하지도 않은 에이전트를 더한 셈이다. 이제 두 병합 경로(`src/cli.js`와 `src/config-file.js`)가 모두 이 opt-out을 존중한다. 이 플래그를 받는 명령은 `init`뿐이라 다른 동작은 그대로다.

### 변경 (부가적)

- `defaultOptions()`에 `noAdapters: false`가 추가됐다. `normalizeOptions`가 이를 spread하므로 프로그래매틱 API가 돌려주는 옵션 객체에 키가 하나 늘어난다. 기존 키와 값은 바뀌지 않았다.

### 문서

- **README의 핵심 명령 표에 읽기 전용 retrieval 명령을 넣었다.** `list-docs`, `search-docs`, `get-doc`, `get-related`인데 1.18.0에 도입된 뒤로 표에서 빠져 있었다. 그래서 npm 페이지가 MCP 표면만 알리고 같은 기능의 CLI 표면은 알리지 않았다. `init`의 `--with-adapters`와 `--no-adapters`도 `PUBLIC_API.md`에 넣었다.
- 컴포지트 액션 예시의 핀을 `@v1.26.0`에서 `@v1.26.3`으로 올렸다(영문판과 국문판 모두).

## 1.26.2 — 2026-07-27

문서만 바꿨고 이번에도 npm 패키지 페이지에 반영하기 위한 배포다. 코드와 CLI, 계약은 바뀌지 않았다.

### 문서

- **벤치 채점이 사람 비준을 받았고 README가 이를 정확히 표기한다.** 범위 문구를 "에이전트 채점"에서 "에이전트 채점(채점 기준은 유지보수자가 표본 검토로 비준)"으로 바꿨다.
  - 무슨 뜻이냐면, 2026-07-27에 유지보수자가 일부러 불리하게 고른 표본 7개를 arm 매칭 3중쌍으로 검토하고 채점 기준이 arm 사이에서 일관되게 적용됐음을 확인했다는 것이다. 격차가 가장 큰 태스크, 위키 없는 arm이 이긴 태스크, 최저점, 그리고 관대함 점검용을 골랐다. 점수는 바꾸지 않았다.
  - 무슨 뜻이 아니냐면, 54개 전량을 사람이 독립적으로 다시 채점한 것이 아니라는 뜻이다. 그래서 어디서도 "human-graded"라고 쓰지 않는다. 워크시트에는 가장 논쟁적인 판정을 빼도 결론이 유지된다는 민감도 분석도 함께 기록했다.
  - 기록은 `bench/results/real-driver-external-vue-app-sdk-empty-control-2026-07-27-ratification.md`에 있다.
- **성능 헤드라인 금지는 그대로다.** 비준은 채점 신뢰도를 올릴 뿐 표본을 늘리지 않는다. 여전히 저장소 하나, 모델 하나, 태스크 6개, N=3이다.

## 1.26.1 — 2026-07-27

문서만 바꿨고 코드와 CLI, 계약은 그대로다. 고친 README가 npm 패키지 페이지에 반영되도록 배포한다. 그러지 않으면 npm은 계속 1.26.0의 문구를 보여 준다.

### 문서

- **"실제로 도움이 되나?" 절을 통제 실험 결과로 갈아 끼우고 폐기된 수치를 뺐다.** 그전에는 2026-07-22 실행의 "토큰 10% 남짓 절감"을 인용했는데, 단일 total token 회계로 측정한 값이었다. 이제 3-arm 측정을 보고한다. 최신 상태의 `verified` 위키를 조회한 에이전트가 소스를 직접 읽은 쪽보다 입력 토큰을 약 41% 덜 썼고(보수적으로 묶은 수치다) 루브릭 정확도도 조금 높았다. 그리고 핵심인 통제 arm이 있다. 같은 조회 도구를 내용만 비운 위키에 붙이면 위키가 아예 없을 때보다 14% 더 든다. 절감이 검색 도구가 아니라 유지된 내용에서 나온다는 뜻이고, 뒤집으면 보강하지 않은 위키는 없느니만 못하다는 뜻이다.
  - 수치에는 범위 조건이 항상 따라붙는다. 저장소 하나, 모델 하나, 태스크 6개, N=3, 에이전트 채점이다. 그리고 조회 쪽이 3.17배로 진 태스크도 함께 적는다. 불리한 실행을 포함한 전체 방법과 수치는 `docs/llm-wiki/BENCHMARK.md`에 있다.
  - 성능 헤드라인은 넣지 않았다. 수치는 문단 안에만 있고 제목이나 태그라인, 배지에는 넣지 않는다.
- **CI 예시가 현재 태그를 고정한다.** 19개 릴리스 전인 `actions/validate@v1.7.0`에서 `@v1.26.0`으로 올렸다.

두 변경 모두 `README.md`와 `README.ko.md`에 함께 적용했다.

## 1.26.0 — 2026-07-27

**견고화와 도입, 그리고 사람 검토를 실제로 할 만한 비용으로 만드는 일.** 헤드라인은 `review`다. `needs_review` 백로그를 유지보수자가 몇 분 만에 훑을 수 있는 형태로 바꿔 주는 읽기 전용 명령이며, 거버넌스 루프에서 가장 약하고 가장 수동적이던 지점을 겨냥한다. 여기에 zero-dependency 정체성을 지키는 CI와 공급망 위생(런타임 의존성도 devDependency도 없다), 그리고 외부 독자가 요청한 도입 문서를 함께 넣었다. 전부 부가적이고 `1.0.0`의 명령과 `--format json`, frontmatter 계약은 그대로다.

### 추가

- **`review`, 사람 검토에서 `verified`까지 가는 워크플로다 (Gate 20).** 기본은 읽기 전용이다. `needs_review` 백로그를 위험도 순으로 나열하고(보강되지 않은 것, 본문이 얇은 것, 근거가 없는 것, 링크가 깨진 것 순) 문서별 품질과 근거 요약을 붙여서, 파일 순서대로 전부 읽는 대신 위험한 문서부터 짚어 볼 수 있게 한다. 승격은 명시적인 `review --approve <path>`나 `review --approve-all --yes`에서만 일어나고, `status: verified`와 `reviewed_by`, `reviewed_at` 외에는 아무것도 스탬프하지 않는다. 본문과 `source_files`, `evidence`, `last_updated`는 건드리지 않는다. `drift --downgrade`의 정확한 반대 방향이다.
  - **CLI는 여전히 스스로 승인할 수 없다.** 차단하거나 구조적인 finding(`blocked`이나 `error`)이 남은 문서는 고치기 전까지 거부하고, `reviewed_by`는 `--reviewer`가 먼저, 그다음 config의 `reviewer`, 마지막이 git의 `user.name` 순으로 해소돼야 한다. 검토자 신원이 없으면 공란으로 두거나 지어내는 대신 스탬프 자체를 거부한다.
  - 세 표면에 비대칭적으로 노출한다. CLI와 동결된 프로그래매틱 `commands` 맵은 전체 명령을 갖지만, MCP는 목록 모드만 노출한다. 그래서 에이전트는 백로그를 읽을 수 있어도 승격은 사람이 CLI에서 하는 일로 남는다.
- **`reviewer` config 키를 넣었다.** `llm-wiki.config.json`에 두며 `--reviewer`가 우선한다.
- **엔지니어링 위생을 zero-dependency를 지키면서 갖췄다.** 커버리지는 Node 내장(`node --test --experimental-test-coverage`)으로 하고 nyc나 c8를 쓰지 않는다. lint는 `node --check` 문법 게이트(`npm run lint`)와 `.editorconfig`로 하며 린터 의존성이 없다. GitHub 네이티브 CodeQL 워크플로와 `npm sbom`, bench 스크립트, `CODEOWNERS`, `MAINTAINERS.md`를 넣었다.
- **도입 문서를 갖췄다.** `SECURITY.md`에 MCP 신뢰 모델 절을 넣었고(로컬 stdio 서브프로세스, stdout이 프로토콜 채널, 인증 없음, 네트워크 노출 금지), 규모별 운영 가이드 `docs/OPERATIONS.md`를 썼으며(소규모, 중규모, 모노레포), `init → enrich → validate → review`를 처음부터 끝까지 따라가는 `examples/` 워크스루와 README의 파이프라인 다이어그램, 실제 audit 출력 샘플을 넣었다. 전부 영문과 국문 모두 있다.

### 변경

- **컴포지트 GitHub Action이 실행할 CLI 버전을 고정한다.** `.github/actions/validate/action.yml`의 `version` 입력 기본값이 `latest`라서 액션을 태그로 고정해도 그 아래 CLI는 떠 있었다. 이제 기본값이 마이너 핀(`1.26`)이고, 떠 있는 동작을 원하면 `version: latest`를 명시적으로 넘기면 된다.

### 문서

- `BENCHMARK.md`에 2026-07-24 실제 SDK 경로 실측을 기록했다(입력 0.516배, 비용 0.581배, 묶은 값 −40.7%, arm을 가린 루브릭 채점 0.910 대 0.971, 환각 0). 다만 입증하지 못한 것도 함께 적었다. retrieval이 지는 태스크가 있었고(3.17배), 같은 저장소의 이전 −10% 실행과의 격차를 설명하지 못했으며, "위키 내용"과 "retrieval 툴"을 분리해 줄 빈 위키 통제 arm이 없었고, 채점자가 사람이 아니라 에이전트였다.
- **README 성능 헤드라인은 계속 금지다.** 여러 저장소와 여러 모델에서 실측이 나오기 전까지, 이 수치들이 뒷받침할 수 있는 최대치는 범위를 명시한 링크된 각주다.

## 1.25.0 — 2026-07-23

**토큰 효율, 가장 싸면서 안전한 경로를 고른다.** 정확도와 문서 최신성, 사람 검토를 희생하지 않으면서 올바르고 검증된 변경까지 드는 토큰을 줄이는 변경이다. 부가적이고 직접 켜야 하며 의존성이 없다. 기본 출력은 그대로이고 `1.0.0`의 명령과 `--format json`, frontmatter 계약이 보존된다. `--doc-lang`이 help에 안 나오던 문제도 함께 고쳤다. 진단용으로 나오는 토큰 수치는 `chars/4` 프록시일 뿐 실측 성능 주장이 아니다.

### 추가

- **`get-doc`에 토큰 제어를 넣었다. 직접 켜야 한다.** `--strict-section`은 매칭이 없을 때 전체 본문으로 되돌아가는 대신 그냥 내주지 않고, `--max-chars <n>`은 돌려주는 본문을 정확히 그 길이로 자르며(가림 처리를 한 뒤에 자른다), `--compact`는 frontmatter 반향을 생략한다. 이 옵션을 쓰면 문서에 진단용 `estimatedTokens`(`chars/4` 프록시)가 붙는다. MCP의 `get_doc` 툴에도 연결했다.
- **`prepare --compact`를 넣었다.** 호출 한 번으로 최소 문맥 묶음을 돌려준다. 선택한 경로(`source_direct`, `wiki_first`, `hybrid`)와 그 이유, 후보 문서 최대 3개(status 기반 신선도), 최상위 문서의 관련 섹션 하나(전체 본문을 쏟지 않는다), 후보 소스, 그리고 더 펼칠 때 쓸 next-lookup이 들어 있다. MCP에도 노출했다.
- **결정적인 작업 경로 선택기를 넣었다.** 내부 기능이고 `prepare --compact`가 재사용한다. 작업 텍스트와 후보 수, 문서 status만 쓰고 정답 파일명이나 심볼은 쓰지 않는다. 위험한 작업(auth, permission, payment, crypto, privacy, data-deletion, migration, public API)이나 stale·`needs_review` 후보, 코드 변경이 있으면 실제 소스를 읽도록 강제하고 절대 `source_direct`를 고르지 않는다.
- **섹션 제목에 가중치를 준 검색 랭킹과 정확한 문자 클램프를 넣었다.** `clampText`는 가림 처리를 한 뒤에 자르므로 잘린 꼬리로도 비밀이 새지 않는다.
- **안전한 스킬 `--refresh`를 넣었다.** `init`과 `quickstart`에서 쓰며, 사용자가 수정하지 않은 패키지 생성 스킬만 갱신한다. 각 아티팩트에 박힌 content hash 마커로 확인한다. 사용자가 손댄 것과 직접 만든 스킬은 절대 덮어쓰지 않고 conflict로 보고하며, dry-run이 create·refresh·conflict·up-to-date를 구분해 준다.

### 변경

- **`feature`·`fix`·`docs-sync` 스킬을 더 간결하게 만들었다.** 생성 시점의 도메인 맵 스냅샷을 박아 넣는 대신 실행 시점에 `prepare --compact`나 `onboard`로 위키 맵을 조립한다. 그래서 고정 프롬프트가 도메인 수에 비례해 커지지 않고 낡지도 않는다. run manifest 계약은 JSON 전체를 반향하는 대신 필드 목록으로 줄였다. 안전 규칙은 전부 유지했다(`needs_review`, 스스로 `verified`로 올리기 금지, 로그 append, 테스트, `check-run`). `bootstrap` 스킬은 최초 보강용이라 더 자세한 안내와 도메인 맵 스냅샷을 그대로 뒀다.
- **MCP에서 `content`와 `structuredContent`에 본문이 중복되는 문제를 조사했다.** `get_doc`이 본문을 양쪽에 그대로 넣고 있었다. 기본 동작은 그대로 두고, 직접 켜는 `compact` 경로에서만 본문을 `structuredContent`에 두고 text에는 포인터만 둬서 중복을 피한다.
- **`--help`에 `--doc-lang en|ko`가 나온다.** `init`과 `quickstart`, `handoff`, `prompt`의 usage에 나오며, 그전에는 README와 실행 출력에서만 발견할 수 있었다.

### 수정

- `--strict-section`을 준 상태에서 `get-doc --section`이 실패해도 더 이상 조용히 문서 전체 읽기로 부풀지 않는다.

### 벤치마크 (프록시 전용이며 배포용 주장이 아니다)

- 프록시 arm `B3_retrieval_compact`를 `bench/`에 새로 넣어 compact하고 섹션 범위를 좁힌 읽기를 모델링했다. 이 자기 참조 코퍼스에서 B2 대비 토큰을 34%쯤 덜 썼지만 grounding이 100%에서 83.3%로 떨어졌다. evidence가 선택되지 않은 섹션에 있었기 때문이다. 정직하게 보고하는 만큼 `--strict-section`과 compact는 직접 켜야 하는 트레이드오프다. whole-task의 `guided-compact` arm도 dry로 추가했다. 모든 수치는 `chars/4` 프록시이며 실측과 유료 측정은 미뤘다.

## 1.24.0 — 2026-07-23

부가적이고 의존성이 없는 변경 두 가지를 함께 내보낸다. 영어를 우선하는 문서 언어 선택(급한 국제화 수정)과 안내형 온보딩·작업 준비다. `1.0.0`의 명령과 `--format json` 형태, frontmatter 계약은 그대로이고 기본 영어 출력이 보존된다.

### 수정

- **생성되는 LLM-WIKI 문서가 이제 기본으로 영어다.** 그전에는 `init`과 `quickstart`이 생성 본문 일부에 한국어를 하드코딩하고 있었다. `index.md`와 위키 `README.md`, 초기 `log.md` 항목, 도메인 overview의 빈 도메인 안내, 도메인별 문서가 그랬다. 그래서 영어 우선 제품을 실행한 해외 사용자가 한국어 문서를 일부 받았다. 이제 생성 문서 본문은 전부 기본이 영어이고, 본문과 제목, 자리표시자, review note, 초기 로그 항목에 한국어가 남지 않는다.

### 추가

- **`--doc-lang en|ko`(기본 `en`)와 config `docLanguage`를 넣었다.** 생성되는 위키 문서 본문과, 에이전트에게 주는 문서 작성 지시(handoff·bootstrap·feature·fix·docs-sync·okf-extract 프롬프트와 생성 스킬 본문)의 언어를 고르는 새 전역 옵션이자 config 키다. findings와 `explain`, CLI 메시지의 언어를 고르는 `--lang`과는 독립적이다. CLI의 `--doc-lang`이 config의 `docLanguage`보다 우선하고, 잘못된 값은 usage error(exit 3)다. `--doc-lang ko`를 주면 한국어 경험이 재현되며, 사실은 이번에 비로소 완성됐다. 경로와 코드 심볼, JSON 키, frontmatter 필드, status 값, CLI 명령, evidence locator 같은 기술 식별자는 두 언어 모두에서 번역하지 않는다. 언어 선택 계층을 `src/commands/doc-content.js` 한 곳에 모아 지역화 산문을 담았고, 이미 영어였던 문서의 영어 출력은 이전과 바이트까지 같다. `init`과 `quickstart`은 선택된 문서 언어를 텍스트와 `--format json`의 `docLanguage`에 표시한다.
- **`onboard [--domain <name>] [--goal <text>]`을 넣었다. 읽기 전용이다.** 신입을 위한 도메인 학습 경로를 기존 위키에서 결정적으로 조립한다. 읽을 문서와 소스·테스트 진입점(문서의 `source_files`와 `evidence`에서 온다), 문서에 기록된 불변조건과 위험, 최신성과 `needs_review` 경고, 근거에 앵커된 이해도 점검이 들어간다. 모르는 `--domain`을 주면 침묵하지 않고 쓸 수 있는 목록과 만드는 방법을 안내한다. CLI는 설명을 창작하지 않으며 그 몫은 `/llm-wiki-onboard` 스킬이 맡는다.
- **`prepare --task <text>`를 넣었다. 읽기 전용이다.** 구현 전에 작업 범위를 조사한다. 관련 문서(`search-docs` 랭킹을 공유 `rankDocsByQuery`로 재사용한다)와 그래프 이웃, 후보 도메인·소스·테스트, 관련 API·상태·화면·설정 문서, 불변조건, 범위 점검표를 모은다. 전부 후보로 표현해 "수정 전 확인"이라고 말하지, 원인이나 안전을 단정하지 않는다.
- CLI와 프로그래매틱 API(동결된 `commands` 맵), MCP(읽기 전용 `onboard`·`prepare` 툴) 세 표면에 연결했다. `llm-wiki-onboard`와 `llm-wiki-prepare` 스킬을 Claude·Codex·Cursor·중립 형식으로 새로 넣었고, feature와 fix 스킬은 계약을 바꾸지 않은 채 prepare 인지와 충돌 시 중단만 더했다.
- `bench/whole-task/`에 전체 작업 실험 뼈대를 따로 넣었다. 방법론과 태스크 형식, 루브릭, dry-run 러너, 샘플, 결과 템플릿만 있고 모델 호출도 수치 조작도 없다.

### 그대로인 것 (동결 계약)

- 읽기 전용이고, restricted 문서와 민감 문서는 제외하며, 돌려주는 텍스트는 가려서 낸다. 의존성이 없고, 동결된 `commands` 맵은 부가적으로만 넓어지며, 옵션을 쓰지 않으면 기본 출력이 바이트까지 같다. AI가 편집한 위키 문서는 `needs_review`로 남는다.

## 1.23.0 — 2026-07-23

최초 위키 작성 전용인 `bootstrap` 스킬과 태스크, 그리고 Codex 네이티브 스킬 생성을 넣었다. 부가적이고 의존성이 없다. 동결된 프로그래매틱 `commands` 맵과 `--format json` 형태, frontmatter 계약이 그대로이고, 스킬을 요청하지 않으면 출력이 바이트까지 같다.

### 추가

- **`bootstrap` 태스크로 `init --write` 뼈대를 반복 가능하게 처음 보강한다.** 스킬(`/llm-wiki-bootstrap`)과 `prompt --task bootstrap` 두 표면으로 제공한다. 생성된 뼈대를 실제 코드 근거가 붙은 문서로 만드는 워크플로이며, `docs/llm-wiki/index.md`를 먼저 읽고, 실제 소스를 조사하고, 자리표시자를 교체하고, 도메인 문서를 보강하고, `source_files`와 `evidence`를 기록하고, `needs_review`를 유지한 채 `verified` 자동 승격은 하지 않고, `log.md`에 덧붙이고, validate와 audit, stats를 돌리는 순서로 간다. 최초 보강 규칙은 `src/task-prompts.js`의 `initialEnrichmentWorkflow` 한 곳에서 `handoff` 프롬프트와 공유하므로 둘이 갈라지지 않는다.
- **Codex 네이티브 스킬을 `.agents/skills/llm-wiki-<task>/SKILL.md`로 낸다.** `name`과 `description` frontmatter가 붙는다. 형식 선택은 에이전트와 대칭이다. `--agent codex`는 Codex 형식을, `--agent claude`나 `cursor`는 각각의 형식을, `--skills`는 네이티브 형식 전부를 만든다(Claude와 Codex, Cursor, 에이전트 중립 프롬프트). 스킬과 태스크 집합은 이제 bootstrap과 feature, fix, docs-sync다.

### 그대로인 것 (동결 계약)

- 미리보기가 먼저이고 `--write`에서만 쓴다. 기존 스킬 파일은 덮어쓰지 않고 kept나 skipped로 표기하며, 절대경로와 username은 넣지 않고, 인식만 할 뿐 실행하지 않는다. 의존성이 없고 동결된 `commands` 맵과 `--format json` 형태, frontmatter 계약도 그대로다. 유일한 동작 변경은 `--agent codex`만 골랐을 때 이제 Codex 스킬이 생성된다는 것이고(그전에는 아티팩트가 0이었다) 그 에이전트를 명시적으로 골랐을 때만 그렇다.

## 1.22.0 — 2026-07-22

사람이 읽는 findings 프로즈를 선택적으로 한국어로 낼 수 있게 했다. 외부 피드백의 마지막 항목인 P4다. 부가적이고 의존성이 없다. rule ID와 `--format json` 형태, 프로그래매틱 API, frontmatter 계약이 그대로이고 기본 영어 출력은 모든 포맷에서 바이트까지 같다.

### 추가

- **전역 `--lang ko|en`(기본 `en`)과 config `lang`으로 findings 프로즈를 한국어로 낸다 (Gate 27, P4).** 사람이 읽는 프로즈만 지역화한다. finding의 `message`(공유 `applyRuleConfig` seam을 거치므로 text 섹션과 `--format json`의 `message` 양쪽에 반영된다)와 `explain`의 meaning·why·remediation이 대상이다. 의존성 없는 카탈로그(`src/i18n.js`)를 새로 넣고 `{param}` 보간과 엄격한 영어 fallback을 붙였다. 한국어 키가 없으면 영어를 그대로 쓰고 빈 값을 만들지 않는다. 공유 `applyProjectConfig`와 `resolveOptions` seam을 거치므로 CLI와 프로그래매틱 API, MCP가 같은 언어를 해석한다.
- `explain` 항목 47개 전부와, `validate`·`audit`·`status`·`next`가 노출하는 finding message(`scans`·`frontmatter`·`structure` 계열)를 지역화했다. 운영성 메시지와 엣지 케이스 메시지는 후속 작업 전까지 영어로 fallback한다.

### 그대로인 것 (동결 계약)

- rule ID와 모든 `--format json` 키·형태, category, config 키, 명령과 옵션 이름, evidence 문법, `explain`이 보여 주는 CLI 명령과 경로는 영어로 유지한다. 프로즈만 지역화한다. `--format json`의 `message`는 `--lang ko`를 명시했을 때만 지역화되고 `rule`과 형태는 그대로이므로, 소비자는 `rule`로 매칭하면 된다. 기본값 `en`은 모든 포맷에서 바이트까지 같다. 리포트 chrome(섹션 헤더와 severity 단어)과 한국어·영어 외 언어, OS 로케일 자동 감지는 범위 밖이다.

## 1.21.0 — 2026-07-22

외부 실사용에서 나온 개발자 경험 개선을 더했다. 부가적이고 의존성이 없다. 기존 `llm-wiki` 명령 표면과 `--format json`, 프로그래매틱 API, frontmatter 계약이 그대로이고 백엔드·풀스택 도메인 탐지는 바이트까지 같다.

### 추가

- **도메인 문서를 상위 진입점 두 곳에 미리 연결했다 (외부 피드백 P6).** `init`이나 `quickstart`이 도메인별 문서를 계획하면(자동 탐지든 `--domains`든) 생성된 `index.md`가 도메인 overview를 읽기 순서와 `related`로 링크하고, `DOMAIN_FEATURES.md`가 `## Domains` 절에서 도메인별 문서를 나열한다. 기존의 overview와 도메인별 문서 사이 연결을 보완해서 진입점에서 도메인 지도로 가는 경로를 만든 것이고, 테스터가 손으로 하던 배선을 자동화한 것이다. 도메인이 계획될 때만 배선하므로 도메인이 없는 스캐폴드는 바이트까지 같다. 범위는 스캐폴드(`init`과 `quickstart`)이고 `fix` 시점의 재배선은 후속이다. 부가적이고 의존성이 없다.
- **`next`에 문서별 보강 체크리스트를 넣었다 (외부 피드백 P5).** `next`가 "Enrich placeholder documents" 액션과 함께 보강 체크리스트를 낸다. 아직 보강되지 않은 문서마다 어느 `##` 절에 생성 시 자리표시자가 남았는지 힌트와 함께 나열한다. 순수 헬퍼인 `enrichmentChecklist`와 `content.not_enriched` audit finding의 부가 필드 `checklist`가 뒷받침하며, `next` 결과에 부가 필드 `enrichmentChecklist`가 붙고 `explain content.not_enriched`가 이를 가리킨다.
- **탐지와 `not_enriched` 휴리스틱을 투명하게 문서화하고 회귀 테스트를 붙였다 (외부 피드백 P7).** 도메인 탐지와 미완 판정 기준(부모 컨벤션, 제외 집합, 자리표시자 문구)을 위키에 문서화하고, 결정적인 `planDomainDocs` 스냅샷 테스트와 폭넓은 `FILE_DOMAIN_EXCLUDE` 커버리지를 더해 휴리스틱을 회귀로부터 잠갔다.

## 1.20.0 — 2026-07-22

retrieval과 프론트엔드 개발자 경험을 개선했다. 대부분 Vue/Quasar SPA에 LLM-WIKI를 구축하면서 받은 외부 실사용 피드백에서 나왔다. 부가적이고 의존성이 없다. 기존 `llm-wiki` 명령 표면과 `--format json`, 프로그래매틱 API, frontmatter 계약이 그대로이고 백엔드·풀스택 도메인 탐지는 바이트까지 같다.

### 추가

- **프론트엔드와 SPA 도메인 탐지를 넣었다.** `init`이 backend와 fullstack뿐 아니라 `frontend`와 `mobile` 프로젝트에서도 도메인별 문서를 감지한다. `pages`·`views`·`features`·`modules`·`screens` 아래 1단계 폴더와, vue-router나 react-router 라우트 파일의 최상위 라우트 그룹을 본다. 정규식으로 처리하므로 파서 의존성이 없다. `components`나 `layouts`, `composables` 같은 SPA UI 배관 폴더는 제외하며 백엔드와 풀스택 탐지는 그대로다.
- **`--domains <a,b,c>`와 도메인이 없을 때의 명시적 안내를 넣었다.** `init`과 `quickstart`에서 도메인을 직접 지정할 수 있어서 자동 탐지가 못 찾을 때 쓸모가 있다. 그리고 도메인을 가질 수 있는 유형인데 도메인별 문서를 하나도 만들지 않는 경우, 침묵하는 대신 `--domains`를 쓰거나 `docs/llm-wiki/domains/`를 직접 만들라고 안내한다.
- **`llm-wiki get-doc --section <terms>`으로 필요한 부분만 읽는다.** 문서 전문 대신 관련 `##` 절과 앞머리만 돌려주고, `##` 절이 없거나 매치가 없으면 전체 본문으로 돌아간다. 필터를 걸었을 때만 부가 필드 `document.section`(`{query, returned, total}`)이 붙으므로 기본 출력은 그대로다. CLI와 MCP(`get_doc.section`), 프로그래매틱 API 세 표면에 연결했다.

### 변경

- **`search-docs`가 append-only 변경 로그를 뒤로 미룬다.** `docs/llm-wiki/log.md`(`change_log`)가 모든 키워드를 누적하는 바람에 결과를 독식하던 문제를 고쳤다. 이제 다른 매치 전부의 뒤로 밀리며, 제외하는 것은 아니다. 그래서 참조 문서가 먼저 온다. 출력 형태는 그대로다.
- **`evidence.section_unlisted`가 소스 경로를 기준으로 매칭한다.** 본문의 `## Evidence`가 frontmatter의 `evidence` 항목을 만족시키는 데 더 이상 글자 그대로의 부분문자열이 필요하지 않다. 본문에 `path:60-70`이라고 써 있으면 frontmatter의 `path#L60-L70`을 만족하며, locator 형식 차이도 일반적으로 받아들인다. 외부 `http(s)`나 `repo:` 참조는 여전히 글자 그대로 매칭한다.

## 1.19.0 — 2026-07-21

근거의 의미를 단계로 나누고(Gate 25) 에이전트 업데이트 러너를 넣었다(Gate 26). "코드에 근거를 두고 verified한다"는 약속을 형식 검사에서 의미 검사로 넓히고, 위키에 근거를 둔 스킬 워크플로를 감사할 수 있게 만든다. 부가적이고 직접 켜야 하므로 기존 `llm-wiki` 명령 표면과 `--format json`, 프로그래매틱 API, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- **근거 타깃이 실제로 있는지 검사한다 (Gate 25).** `#symbol:`이나 `#section:` locator가 붙은 `evidence`·`source_files` 참조에 대해, 파일이 있는지뿐 아니라 그 타깃이 실제로 있는지도 확인한다. 참조한 파일이 심볼 이름을 아예 언급하지 않으면 `evidence.symbol_unverified`를 내고(`·`나 `,`, `/`로 이어진 것은 목록으로 처리한다), Markdown 소스에 해당 헤딩이 없으면 `evidence.section_unverified`를 낸다. AST가 아니라 보수적인 텍스트 존재 검사라서 오탐을 피한다. 기본은 warning이고 `--strict`에서 승격된다. `route`는 v1에서 형식만 본다.
- **`evidence.ungrounded`를 넣었다 (Gate 25).** `source_files`도 `evidence`도 없는 `verified` 문서를 표시한다. 근거 없는 "verified"라는 뜻이다. 기본은 warning이고 `--strict`에서 승격되지 않으며, config의 `rules`로 토글하거나 올릴 수 있다.
- **계산된 근거 등급을 낸다 (Gate 25).** `llm-wiki stats`가 `evidenceTiers`를 보고한다. `reference_checked`는 grounding이 있고 모든 참조가 해소된 경우이고, `human_verified`는 verified이면서 리뷰 메타데이터가 있는 경우다. 계산해서 보고만 할 뿐 새 frontmatter 필드나 `status` 값이 아니다.
- **`llm-wiki check-run`을 넣었다. 에이전트 업데이트 러너이고 읽기 전용이다 (Gate 26).** `.llm-wiki/runs/`에 있는 스킬 실행 매니페스트를(가장 최근 것이나 `--run <path>`로 지정한 것) 검증한다. `changedSource`에 든 파일마다 그것을 참조하는 `touchedDocs` 문서가 있는지, 로그가 append됐는지, validate가 통과했는지를 본다. diff에 앵커를 두는 `impact`를 의도에 앵커를 두는 쪽에서 보완하는 셈이다. 토글 가능한 `run.*` 규칙을 새로 넣었다(`run.doc_gap`과 `run.log_missing`, `run.unvalidated`가 warning, `run.manifest_missing`이 warning, `run.manifest_invalid`가 error다). 기본은 warning이고 `--strict`에서 CI를 실패시킨다.
- **스킬 완성 계약을 넣었다 (Gate 26).** 생성되는 `/llm-wiki-<task>` 스킬 본문에 run manifest 작성 단계가 들어가서, 완성 계약이 스킬과 함께 이동한다. 이미 커밋된 스킬 아티팩트는 `init --write --skills --existing overwrite`로 다시 만들어 반영한다.

### 안전

- **읽기 전용이다.** 근거 검사와 등급 계산, `check-run`은 아무것도 쓰지 않는다. `check-run`과 관련해 유일하게 일어나는 쓰기는 에이전트가 자기 실행 중에 매니페스트를 쓰는 것이고, 도구가 쓰는 게 아니다.
- **설계상 보수적이다.** 타깃 실재 검사는 명백히 없는 경우만 표시하므로, 이 검사를 켠다고 해서 제대로 grounding된 `verified` 문서가 소급해서 깨지지 않는다.
- **의존성이 없다.** 범위를 제한한 텍스트 스캔과 기존 파서만 쓴다. AST도 언어 서버도 네트워크도 쓰지 않는다.

## 1.18.0 — 2026-07-21

읽기 전용 retrieval을 넣었다(Gate 24). 거버넌스 리포트가 아니라 문서 본문을 돌려주는 명령 네 개를 추가한다. "에이전트가 매번 코드를 다시 읽는 대신 위키에 물어본다"는 이야기의 실제 표면이다. 부가적이고 직접 켜야 하므로 기존 `llm-wiki` 명령 표면은 하위호환이고 `--format json`과 프로그래매틱 API, frontmatter 계약도 그대로이며 런타임 의존성도 늘지 않았다.

### 추가

- **`llm-wiki list-docs`로 메타데이터를 보며 문서를 열거한다. 읽기 전용이다.** 내용 문서를 path와 title, status, doc_type, visibility, last_updated, tags와 함께 나열하고 본문은 주지 않는다. `--status`, `--visibility`, `--doc-type`으로 거를 수 있다.
- **`llm-wiki search-docs <query>`로 키워드를 찾는다. 읽기 전용이다.** 제목과 본문, frontmatter를 대상으로 결정적인 키워드·부분문자열 매칭을 한다. semantic 검색도 벡터 검색도 아니다. 모든 term이 있어야 매치되고(AND), 점수 순으로 랭크하며 제목에 걸린 것에 가중치를 준다. 매치마다 스니펫이 붙고 `--limit`으로 결과 수를 제한한다(기본 20).
- **`llm-wiki get-doc <path>`로 문서 하나를 읽는다. 읽기 전용이다.** frontmatter와 본문을 돌려준다. `<path>`는 저장소 기준 경로(`docs/llm-wiki/GLOSSARY.md`)도, 위키 기준 경로(`GLOSSARY.md`)도, 이름만(`GLOSSARY`) 줘도 된다.
- **`llm-wiki get-related <path>`로 해소된 그래프 이웃을 본다. 읽기 전용이다.** 위키 링크와 `related`, markdown 링크를 기준으로 나가는 이웃과 들어오는 이웃을 돌려준다.
- **MCP retrieval 툴을 넣었다.** 네 명령을 MCP에 `list_docs`, `search_docs`, `get_doc`, `get_related`로 노출하며 다른 MCP 툴과 마찬가지로 읽기 전용이다. 프로그래매틱 API에는 kebab-case 명령 이름으로 노출한다.

### 안전

- **읽기 전용이다.** 이 명령들은 아무것도 쓰거나 편집하거나 강등하지 않는다.
- **visibility와 민감정보를 존중한다.** visibility가 `restricted`이거나 `contains_sensitive_info: true`이거나 민감정보 스캔에 걸린 문서는 `--include-sensitive`가 없으면 `list-docs`와 `search-docs`에서 빠진다. 그리고 돌려주는 본문과 스니펫은 민감한 줄을 가려서 raw 값을 내보내지 않는다. `get-doc`은 문서를 돌려주되 해당 줄을 가린다.
- **의존성이 없다.** 키워드·부분문자열 매칭과 기존 위키 그래프만 쓴다. 임베딩도 인덱스도 네트워크도 없다.

## 1.17.0 — 2026-07-21

역방향 임팩트 게이트를 넣었다(Gate 23). 날짜 기반 drift가 놓치는 경우, 그러니까 코드와 그것을 설명하는 `verified` 문서가 서로 다른 PR에서 바뀌는 경우를 잡는 읽기 전용 `impact` 명령이다. 부가적이고 직접 켜야 하므로 `llm-wiki` 명령 표면은 하위호환이고 `--format json`과 프로그래매틱 API, frontmatter 계약도 그대로이며 런타임 의존성도 늘지 않았다.

### 추가

- **`llm-wiki impact`로 diff를 기준으로 역방향 영향을 본다. 읽기 전용이다.** 모든 `verified` 문서의 로컬 `source_files`와 `evidence`에서 역색인을 만들어, 참조한 소스가 현재 변경집합에 들어 있는데 문서 자신은 같은 diff에서 바뀌지 않은 `verified` 문서를 표시한다. 날짜 기준인 `evidence.stale`을 머지 전 시점에서, diff를 기준으로 보완하는 것이다. "이 PR이 관리 대상 코드를 바꾸면서 그 문서는 안 고쳤다"는 질문은 날짜 기준선으로는 답할 수 없다.
  - 기준은 기본이 working tree이고, PR이나 CI 기준선을 잡으려면 `--since <ref>`를 쓴다(`git diff --name-only <ref>`). `validate --changed`가 쓰는 `changedFiles` 프리미티브를 재사용한다.
  - finding `impact.source_changed`를 새로 넣었다. 토글 가능한 `impact` 카테고리가 새로 생겼고 기본은 warning이다. git이 없으면 `impact.unavailable`(error)이 나온다.
  - `--strict`는 impact findings를 실패시키는 error로 올려서, 관리 대상 코드를 바꾸면서 `verified` 문서를 안 고친 PR을 CI에서 잡는다. severity는 config의 `rules` 맵으로도 조정할 수 있다. 변경집합이 비어 있으면 아무 일도 하지 않고 `pass`로 끝난다.
  - 읽기 전용이라 고치는 것은 사람 몫이다. 다시 검토하거나 `drift --downgrade`를 쓰면 된다. v1은 파일 단위이고 라인 단위나 문서별 `reviewed_sha`, write-back, MCP 노출은 범위 밖이다. 외부 `http(s)://`와 `repo:<name>/<path>` 참조는 무시한다.

### 내부

- `scans.js`에서 순수하고 공유되는 앵커 추출기 `verifiedSourceAnchors`를 분리했다. 날짜 기준 drift(`driftTargets`가 이제 여기에 위임하며 동작은 보존된다)와 새로 만든 diff 기준 `scanReverseImpact`가 함께 쓴다. 기존 git 프리미티브를 재사용하므로 대부분 배선 작업이고 의존성도 없다.

## 1.16.1 — 2026-07-21

1.16.0 개명 이후를 정리했다. 코드 동작은 바뀌지 않았고 `llm-wiki` 명령과 `--format json`, 프로그래매틱 API, frontmatter 계약도 그대로이며 런타임 의존성도 늘지 않았다.

### 변경

- **README 제목을 고쳤다.** "LLM-WIKI Standard"에서 "LLM-WIKI Governance"로 바꿔 거버넌스 포지션과 패키지 이름에 맞췄다.
- **`CONTRIBUTING` 문구를 거버넌스 프레이밍으로 바꾸고**, 내부 frontmatter schema의 `$id`(검증에 쓰이지 않는 로컬 자리표시자 식별자다)를 새 이름에 맞췄다.
- **`package.json`에 `keywords`를 추가했다.** npm에서 검색되도록 하기 위해서다.

## 1.16.0 — 2026-07-21

개명하고 포지셔닝을 옮겼다. 패키지를 `@dowonk-7949/llm-wiki-standard`에서 `llm-wiki-governance`(unscoped)로 바꾸고, "AI가 쓴 프로젝트 문서를 위한 거버넌스(OKF 호환)"로 자리를 옮겼다. CLI 출력은 영어 우선으로 바꿨다. 부가적이고 표현에 관한 변경이라 `llm-wiki` 명령과 `--format json`, 동결된 프로그래매틱 API, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다. 옛 스코프드 패키지는 deprecate되어 새 이름을 가리킨다.

### 변경

- **패키지 이름을 `llm-wiki-governance`로 바꿨다.** 옛 이름은 `@dowonk-7949/llm-wiki-standard`다. `llm-wiki` 명령 이름은 그대로이고, 설치와 `npx` 대상, 프로그래매틱 import 지정자가 새 이름을 쓴다. 옛 패키지는 새 이름을 가리키며 deprecate했다.
- **거버넌스 레이어로 자리를 옮겼다.** 검증과 드리프트 감지, 코드 그라운딩, CI 강제를 묶은 OKF 호환 포지션이다. README를 영문과 국문 모두 여기에 맞춰 다시 구성했다.
- **CLI 출력을 영어 우선으로 바꿨다.** 코딩 에이전트에 붙여 넣는 handoff 프롬프트를 완전히 영어로 바꿨고, `help`와 quickstart의 `About`, handoff의 `Next Step` 안내를 영어를 앞세우도록 다시 배열하면서 짧은 한국어 병기는 남겼다. finding ID와 명령 이름, JSON 필드는 그대로다.

## 1.15.1 — 2026-07-21

스킬 생성 온보딩을 고쳤다. 이 변경 자체가 dogfood다. 도구 자신의 `/llm-wiki-feature` 스킬을 자기 자신에게 실행해서 만들었다. 명령과 옵션, `--format json`, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 변경

- **`init`이나 `quickstart --write`가 스킬을 만들면 재시작 안내를 출력한다.** Claude Code는 스킬을 세션이 시작될 때 로드하고 hot reload를 하지 않으므로, 방금 만든 스킬의 `/llm-wiki-*` 명령은 에이전트를 재시작하기 전까지 "unknown"으로 보인다. 이 안내는 두 언어로 한 줄이고 스킬을 실제로 만들었을 때만 나오므로, 사용자가 새 명령이 왜 안 보이는지 헤매지 않게 해 준다.

## 1.15.0 — 2026-07-20

스킬 생성을 넣었다(Gate 21). feature와 fix, docs-sync 작업을 위한, 위키에 근거를 둔 자동화 프롬프트다. 만들어 둔 위키가 실제로 쓰이게 하려는 것이다. 부가적이고 직접 켜야 하며 기존 명령과 `--format json`, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- **`init`과 `quickstart`이 위키에 근거를 둔 자동화 프롬프트를 만든다.** `feature`·`fix`·`docs-sync` 워크플로를 에이전트마다의 네이티브 형식으로 낸다.
  - Claude Code 스킬은 `.claude/skills/llm-wiki-<task>/SKILL.md`에 만들며 `/llm-wiki-feature`처럼 호출한다.
  - Cursor 룰은 `.cursor/rules/llm-wiki-<task>.mdc`에 만든다.
  - 에이전트 중립 프롬프트는 `.llm-wiki/prompts/llm-wiki-<task>.md`에 만들며 Codex를 비롯한 아무 에이전트에나 쓸 수 있다.

  각 본문은 기존의 위키 기반 워크플로를 재사용한다. 위키를 읽고, 근거를 갖고 변경하고, 문서를 `needs_review`로 갱신하고, `log.md`에 덧붙이고, 자동으로 `verified`로 올리지 않는 순서다. 여기에 프로젝트 도메인 맵(`docs/llm-wiki/domains/`) 스냅샷을 본문에 넣어서 에이전트가 어떤 문서를 읽어야 하는지 바로 알게 한다.
- **`--skills` 플래그를 `init`과 `quickstart`에 넣었다.** 이 아티팩트를 만들어 달라고 요청하는 플래그이고, `claude`나 `cursor`를 에이전트로 고를 때도 생성된다. 직접 켜야 하고 미리보기가 먼저이며(`--dry-run`이 만들 예정 목록을 보여 준다) 기존 skill·rule·prompt 파일은 절대 덮어쓰지 않는다. 도구는 아티팩트를 만들기만 하고 실행은 에이전트가 한다. 스킬을 요청하지 않은 저장소는 바이트까지 같다.

## 1.14.4 — 2026-07-20

테스터 산출물을 유지보수자가 검토하다 발견한 도메인 감지 문제를 고쳤다. 명령과 옵션, `--format json`, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 수정

- **도메인 감지가 가상환경과 설치된 의존성을 훑지 않는다.** 버전이 붙은 가상환경(예를 들어 `venv3.10/`)이 있는 Python 프로젝트에서 스캔이 `venv3.10/Lib/site-packages/`까지 파고들어, passlib의 `handlers/`나 boto3의 `resources/` 같은 서드파티 라이브러리에 대해 빈 도메인 문서를 수십 개씩 만들었다. venv 이름이 건너뛰기 목록에 없었고 `site-packages`도 제외되지 않아서였다. 이제는 `pyvenv.cfg`가 있는 디렉터리를 가상환경으로 보고 통째로 건너뛰므로 이름과 무관하게 `venv3.10`이든 `.venv-py39`든 잡힌다. `site-packages`와 `dist-packages`는 순회에서 제외하고, 버전이 붙은 `venv*`나 `env<N>` 이름도 건너뛴다. 가상환경이 없는 저장소는 영향이 없어 바이트까지 같고, 프로젝트 자신의 `handlers`나 `routers` 같은 도메인은 그대로 감지된다.

## 1.14.3 — 2026-07-20

두 번째 노출 보고서를 바탕으로 온보딩 안내를 붙였다. 처음 쓰는 사용자가 명령만 쳐서는 이 도구가 뭘 하는지 알 수 없었고, 한국 테스터는 한글 출력을 원했다. 명령과 옵션, `--format json`, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- **`llm-wiki`와 `--help`에 한국어·영어 안내 헤더를 붙였다.** 아무 인자 없이 실행하면 이제 Usage부터 나열하는 대신, LLM-WIKI가 무엇이고 왜 도움이 되는지(에이전트가 매번 코드를 다시 읽는 대신 검증된 위키를 근거로 삼는다), 그리고 세 단계 흐름(뼈대를 만들고, 프롬프트를 에이전트에 붙여 넣고, 사람이 검토해 verified로 올린다)을 먼저 보여 준다.
- **`--help`에 패키지 버전과 `@latest` 팁을 넣었다.** `llm-wiki vX.Y.Z`를 표시하고 `npx …@latest`를 권한다. npx가 옛 버전을 캐시에서 조용히 재사용하는 상황을 눈치챌 수 있게 하려는 것이다.
- **`quickstart` 출력에 두 언어로 된 `About · 소개` 줄을 넣었다.** `--help`를 보지 않고 바로 `quickstart`를 실행한 사용자도 방향을 잡을 수 있게 했다.

## 1.14.2 — 2026-07-20

첫 외부 end-to-end 성공 이후에 사용성을 다듬었다. 백엔드 개발자가 handoff 프롬프트를 실행해 위키 전체를 뽑아낸 실행이었다. 검토자가 보는 헛경고를 줄이고, 조용히 실패하던 경우 하나를 표면으로 드러낸다. 명령과 옵션, `--format json`, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 수정

- **콜론으로 라인을 적는 evidence 표기(`file:10`)를 받아들인다.** `file#L10`과 함께 쓸 수 있고, `file:10-20`도 `file#L10-L20`과 함께 쓸 수 있다. 보강하는 에이전트가 에디터나 grep 스타일로 evidence를 적어도 더 이상 헛된 `evidence.missing`이 뜨지 않고, 참조가 소스와 라인 범위로 제대로 해석된다.
- **생성된 `templates/*.template.md`를 orphan으로 보고하지 않는다.** 일부러 링크하지 않는 스캐폴드이므로, 갓 만든 위키가 `graph`나 `stats`에서 잘못된 orphan을 표시하던 문제를 없앴다. 진짜로 링크되지 않은 문서는 여전히 표시한다.

### 추가

- **위키 출력 경로가 gitignore되면 경고한다.** `docs/llm-wiki`가 git에서 무시되고 있으면 `init --write`와 `quickstart`이 `structure.output_gitignored` 경고를 내고(차단하지는 않는다) `doctor`도 이를 보고한다. 문서는 만들어졌는데 git에 추적되지 않던 조용한 경우를 잡는다.
- **`init --write`가 안심할 수 있는 요약을 낸다.** `N created, N overwritten, N kept (existing files preserved)` 한 줄로 무엇을 건드렸고 무엇을 건드리지 않았는지 분명히 보여 준다.

## 1.14.1 — 2026-07-20

1.14 이후 노출 테스트에서 나온 버그를 모아 고쳤다. 처음 도입하는 경로와 기존 코드베이스 적합성에 관한 수정이며, 새 명령이나 옵션, `--format json` 필드, frontmatter 변경은 없고 런타임 의존성도 늘지 않았다.

### 수정

- **UTF-8이 아닌 매니페스트가 더 이상 프로젝트 유형을 오분류하지 않는다.** UTF-16이나 UTF-8 BOM으로 저장된 매니페스트는 Windows에서 흔한데(예를 들어 PowerShell로 리다이렉트한 `requirements.txt`), 이것이 UTF-8로 읽히면서 mojibake가 되어 프레임워크 키워드를 놓쳤다. 그래서 FastAPI 백엔드가 `library`로 분류됐다. 이제 detector의 모든 매니페스트와 소스 읽기를 BOM 인식 리더가 맡는다(UTF-16LE, UTF-16BE, UTF-8 BOM). BOM이 없는 파일은 이전과 똑같이 디코드되고, 위키 문서 인코딩 스캔도 그대로다.
- **handoff 프롬프트가 만들어지지도 않은 어댑터 파일을 가리키지 않는다.** `--agent`를 명시하지 않으면 `quickstart`과 `init`은 어댑터 파일을 만들지 않는데, 정작 프롬프트는 받는 에이전트에게 존재하지도 않는 `AGENTS.md`나 `CLAUDE.md`를 먼저 읽으라고 시작했다. 이제는 명시적으로 고른 에이전트의 어댑터 파일만 진입점에 넣고, 그 밖에는 `docs/llm-wiki/index.md`를 가리킨다.

### 변경

- **모드 플래그 없이 `init`이나 `quickstart`을 실행하면 오류가 아니라 안내로 읽힌다.** `--dry-run`도 `--write`도 없이 실행하면 예전에는 `Blocked` 리포트를 출력하고 exit 2로 끝나서 실패처럼 보였다. 이제 `Ready (needs --write)`와 `Next Step`을 보여 주고 exit 0으로 끝난다. `next` 명령의 `ready` 결과와 같은 형태다. `--dry-run`과 `--write`를 동시에 주는 것은 여전히 거부한다.
- **handoff의 `Next Step`이 워크플로를 설명한다.** `Handoff Prompt`는 CLI가 실행하는 게 아니라 저장소에서 연 코딩 에이전트(Claude Code나 Codex)에 붙여 넣는 지시문이고, 에이전트가 코드를 읽어 문서를 채운 다음(도메인별 `domains/*.md`도 포함한다) 사람이 검토해 `verified`로 올린다는 세 단계를 명시한다.
- **`quickstart` 출력이 기존 저장소를 인식한다.** 건너뛴 개수에 사유를 주석으로 붙인다(예를 들어 `skipped: 18 (18 already exist, kept)`). 위키가 이미 있어서 새로 만들 문서가 없을 때 도구가 아무것도 안 한 것처럼 보이지 않도록, 기존 문서를 handoff 프롬프트로 보강하라는 안내를 덧붙인다(다시 만들고 싶으면 `--existing overwrite`를 쓰면 된다).

## 1.14.0 — 2026-07-16

stdlib 서버 감지를 넣었다(Gate 19). "감지와 적응 범위 확장" 라인의 마지막 마이너다. 부가적이고 직접 켜야 하며 CLI와 `--format json`, 프로그래매틱 API, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 변경

- role 추론이 Go의 `net/http` 서버와 Python stdlib HTTP 서버(`http.server`, `socketserver`)를 `library`가 아니라 `backend`로 분류한다. 범위를 제한하고 제외 규칙을 건 소스 스캔으로 판단한다. Go 파일이면 `net/http`를 import하면서 `ListenAndServe`나 `http.Serve`를 호출해야 하고, Python 파일이면 `http.server`나 `socketserver`를 import하면서 서버를 시작해야 한다(`serve_forever`나 `HTTPServer(...)`).

### 참고

- 한 방향으로만 가고 보수적이다. 이 신호는 `library`를 `backend`로 올리기만 하고, 강한 import와 서버 시작이 짝을 이룰 때만 반응하며, 이미 `backend`인 것을 내리지 않는다. `http.client`만 쓰는 라이브러리는 `library`로 남는다. 인식만 할 뿐이고 읽기 전용 소스 스캔이며(최대 깊이 4, 파일 수 상한, vendored·test·example 제외) 프레임워크 의존성이 필요 없고 의존성 0을 유지한다. 범위는 `GATE_REVIEW.md`의 Gate 19다. 이로써 `1.12`부터 `1.14`까지의 감지·적응 확장 라인이 끝났다.

## 1.13.0 — 2026-07-16

infra/DevOps 프로젝트 프로필을 넣었다(Gate 18). "감지와 적응 범위 확장" 라인의 두 번째 마이너다. 부가적이고 직접 켜야 하며 CLI와 `--format json`, 프로그래매틱 API, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- `infra` 프로젝트 유형을 새로 넣었다. `detectInfra`가 Docker(`Dockerfile`)와 Docker Compose(`docker-compose.y*ml`, `compose.y*ml`), Kubernetes(최상위나 관례적인 디렉터리에 있는 `apiVersion:`과 `kind:` YAML), Helm(`Chart.yaml`), Terraform(`*.tf`)을 감지한다.
- `init`이 만드는 infra 문서셋을 넣었다(`profiles/infra.md`, `DEPLOYMENT.md`, `RUNBOOK.md`, `SERVICE_TOPOLOGY.md`).

### 참고

- `infra`는 fallback 유형이다. frontend나 backend, library, mobile 같은 앱 신호가 없을 때만 선택되므로, `Dockerfile`이 있는 백엔드 저장소는 앱 유형을 유지하고 기존 출력이 바이트까지 같다. IaC 중심 저장소, 그러니까 예전에 `unknown`이던 것만 `infra`가 된다.
- 인식만 한다. 클러스터나 레지스트리에 접근하지 않고, 배포하지 않으며, 의존성 그래프를 파싱하지 않는다. 의존성 0을 유지하고 스캔은 범위를 제한하며 제외 규칙을 건다. 범위는 `GATE_REVIEW.md`의 Gate 18이다.

## 1.12.0 — 2026-07-16

모바일 프로젝트 프로필을 넣었다(Gate 17). `1.11` 이후 시작한 "감지와 적응 범위 확장" 라인의 첫 마이너다. 부가적이고 직접 켜야 하며 CLI와 `--format json`, 프로그래매틱 API, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- `mobile` 프로젝트 유형을 새로 넣었다. `detectMobile`이 Android(`build.gradle`이나 `build.gradle.kts`, `settings.gradle`에 있는 Android Gradle 플러그인이나 AndroidX 신호, 또는 중첩된 `AndroidManifest.xml`)와 Flutter(`pubspec.yaml`의 `flutter:` 절이나 `sdk: flutter`), Apple/iOS(`Podfile`, Apple 플랫폼용 `Package.swift`, `*.xcodeproj`나 `*.xcworkspace`), React Native(`react-native` 의존성)를 감지한다.
- `init`이 만드는 모바일 문서셋을 넣었다(`profiles/mobile.md`, `PLATFORM_MATRIX.md`, `SCREENS.md`, `BUILD_RELEASE.md`).

### 수정

- Android `build.gradle` 프로젝트가 JVM `library`로 잘못 분류되던 문제를 고쳤다. `decideType`에서 모바일 신호가 가장 앞서게 해서 `mobile`로 감지된다.

### 참고

- 인식만 한다. Gradle이나 Xcode, CocoaPods 같은 빌드 도구를 부르지 않고 의존성 그래프도 파싱하지 않아 의존성 0을 유지한다. 매니페스트 신호에 범위를 제한하고 제외 규칙을 건 스캔을 더한 방식이다. 모바일 신호가 없는 저장소는 바이트까지 같고 평범한 JVM이나 Dart 프로젝트를 다시 분류하지 않는다. 범위는 `GATE_REVIEW.md`의 Gate 17이다.

## 1.11.1 — 2026-07-16

동작을 그대로 둔 내부 리팩터다. 하나로 뭉쳐 있던 `src/commands.js`를 `src/commands/` 아래 목적별 모듈로 쪼갰다. 사용자가 보는 표면은 바뀌지 않았다. CLI와 `--format json` 출력, 프로그래매틱 API(동결된 `commands` 맵과 개별 export), frontmatter 계약이 바이트까지 같고 런타임 의존성도 늘지 않았다.

### 변경

- `src/commands.js`를 4,119줄 남짓에서 1,612줄 남짓으로 줄이면서, 재사용되는 로직을 `src/commands/` 아래 `references`, `findings`, `scans`, `wiki-graph`, `adapters`, `wiki-files`, `fix-migrate`, `domains`, `doc-templates`로 옮겼다. 배럴 re-export를 둬서 `from "./commands.js"`로 하던 모든 import와 공개 API 표면을 그대로 유지했다. 의존성은 한 방향으로만 흐른다(leaf 파서에서 wiki-graph·adapters로, 그다음 scans, fix-migrate, 마지막이 `commands.js`다). `migrateCommand`는 `audit` 파이프라인을 호출하므로 모듈 그래프를 비순환으로 유지하기 위해 `commands.js`에 남겼다. `graphCommand`와 `statsCommand`도 같은 패턴이다.

## 1.11.0 — 2026-07-15

크로스레포 지식 링크를 넣었다(Gate 16). fetch하지 않는 크로스레포 참조 스킴을 예약해 두고 인식해서, 크로스레포 참조가 missing-target 규칙에 걸리지 않게 한다. 계획했던 `1.x` 라인의 마지막 마이너다. 부가적이고 CLI와 JSON, 프로그래매틱 API, frontmatter 계약이 그대로이며 런타임 의존성도 늘지 않았다.

### 추가

- 크로스레포 참조 스킴 `repo:<name>/<path>`를 예약하고, 기존 `http(s)://` URL과 함께 위키 링크와 `source_files`·`evidence`·`related`에서 external로 인식한다. 인식된 참조는 external로 처리돼 `wiki_link.missing`과 `related.missing`, `source_files.missing`, `evidence.missing`, `markdown_link.missing`에서 빠지지만 절대 fetch하거나 verify하지 않는다. 그러려면 네트워크나 git이 필요하기 때문이다. URL 형태의 위키 링크가 잘못된 `wiki_link.missing`을 내지 않도록 분류기도 강화했다. 근거는 `src/commands.js`의 `isCrossRepoReference`와 `isExternalSourceReference`다.

### 참고

- 인식만 한다. 네트워크도 git도 의존성도 쓰지 않아 런타임 의존성 0을 지킨다. 부가적이라 저장소 안에서의 해석은 그대로이고 진짜로 해소되지 않는 로컬 링크는 여전히 표시된다. 범위는 `GATE_REVIEW.md`의 Gate 16(accepted)이다. 실제 fetch와 resolve는 범위 밖이고 앞으로 major 버전에서 볼 일이다. 이로써 쪼개 두었던 `1.7`부터 `1.11`까지의 로드맵 라인이 끝났다.

## 1.10.0 — 2026-07-15

모노레포 프로필을 넣었다(Gate 15). 직접 켜는 `monorepo` 명령이 워크스페이스 패키지마다 위키를 검증하고 결과를 모아 준다. 부가적이라 단일 저장소의 CLI와 JSON, 프로그래매틱 API, frontmatter 계약은 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- `llm-wiki monorepo`를 넣었다. npm과 yarn의 `workspaces`를(배열이든 `{ packages }`든) 감지해 `docs/llm-wiki/`가 있는 패키지마다 기존의 cwd 파라미터화된 validate를 돌리고 결과를 집계한다. 결과에는 엄격히 부가적인 `packages[]` roll-up(경로와 패키지별 result, finding 수)과 패키지 경로가 앞에 붙은 `findings`가 담기며 후자가 exit code를 정한다. 각 패키지는 자기 `llm-wiki.config.json`을 반영한다. pnpm의 `pnpm-workspace.yaml`은 지원하지 않는다고 보고한다. YAML을 파싱하지 않기 때문이고, 의존성 0을 지키기 위해서다. 근거는 `src/detector.js`의 `detectWorkspaces`와 `src/commands.js`의 `monorepoCommand`다. CLI와 프로그래매틱 API의 `commands` 맵에 노출했다.

### 참고

- 직접 켜야 하고 부가적이다. 새 `packages[]` 필드와 패키지별 findings는 `monorepo` 명령에서만 나오므로 단일 저장소 출력은 바이트까지 같다. 읽기 전용 집계이고 `1.0.0` 계약과 런타임 의존성 0 정책은 그대로다. 범위는 `GATE_REVIEW.md`의 Gate 15(accepted)다. 더 깊은 glob과 pnpm·YAML은 후속이고, 크로스레포 링크는 다음 마이너인 `1.11`이다.

## 1.9.0 — 2026-07-15

가시성 거버넌스를 넣었다(Gate 14). 이미 필수인 `visibility` 필드에 대해 직접 켜는 일관성 lint를 붙였고, 1.8의 config `rules` 토글 위에 세웠다. 부가적이고 직접 켜야 하며 CLI와 JSON, 프로그래매틱 API, frontmatter 계약이 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- 민감정보 스캔을 재사용하는 lint 두 개를 넣었다. 직접 켜야 하고 기본은 꺼짐이며 warning이고 읽기 전용이다.
  - `visibility.public_sensitive`는 `visibility: public`인 문서의 내용이 스캔에 걸릴 때 발화한다. 공개 문서에 민감해 보이는 값이 있으면 안 되기 때문이다.
  - `visibility.declared_mismatch`는 `contains_sensitive_info: false`라고 선언했는데 스캔에 걸릴 때 발화한다. 선언과 내용이 어긋난 경우다.

  각 프로젝트가 `rules` 맵으로 켠다(예를 들어 `"visibility.public_sensitive": "warning"`). 민감한 값은 finding에 절대 담지 않고 가려진 개수만 담는다. 근거는 `src/commands.js`다.
- 정책 문서로 `docs/llm-wiki/VISIBILITY.md`를 썼다. `internal`과 `restricted`, `public` 레벨을 정의하고 선언한 값과 실제 내용이 맞는지에 대한 정책을 담는다.

### 참고

- 부가적이고 직접 켜야 하며 읽기 전용이다. 이 규칙들은 절대 기본이 `error`나 `blocked`가 되지 않는다. `1.0.0`의 부가성 불변식 때문이다. `sensitive.*`는 여전히 토글할 수 없고, 이 lint는 선언과 내용이 맞는지만 볼 뿐 접근 통제를 하지는 않는다. 범위는 `GATE_REVIEW.md`의 Gate 14(accepted)다. 다음 예정 마이너는 `1.10` 모노레포 프로필이다.

## 1.8.1 — 2026-07-15

config 스키마 확장의 2부다. 커스텀 문서셋과 템플릿 오버라이드를 넣었고, 이로써 Gate 13의 config 기능 셋이 완성됐다(rule 토글은 1.8.0에 나갔다). 부가적이고 직접 켜야 하며 CLI와 JSON, 프로그래매틱 API, frontmatter 계약이 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- 커스텀 문서셋을 넣었다. `llm-wiki.config.json`의 `requiredDocs` 배열로 프로젝트 고유의 필수 문서를 core와 profile 목록에 더하면 같은 `structure.required_doc` 검사가 적용된다. 검증 전용이라 `init`이 임의의 커스텀 문서를 만들어 주지는 않는다. 근거는 `src/config-file.js`와 `src/commands.js`다.
- 템플릿 오버라이드를 넣었다. `templates` 맵으로 생성 문서를 프로젝트 로컬 템플릿에서 만들 수 있다. 오버라이드는 본문만 쓰고 frontmatter는 언제나 CLI가 생성해 감싸므로, 오버라이드가 `status: verified`를 만드는 것은 구조적으로 불가능하다. 오버라이드 파일이 없으면 내장 템플릿으로 폴백한다. 근거는 `src/commands.js`다.
- `doctor`가 config 줄에 `requiredDocs`와 `templates` 개수를 함께 보여 준다.

### 참고

- 부가적이고 직접 켜야 하며 `1.0.0` 계약과 런타임 의존성 0 정책은 그대로다. 범위는 `GATE_REVIEW.md`의 Gate 13(accepted)이다. 이로써 config 스키마 확장 라인이 끝났고, 다음 예정 마이너는 가시성 거버넌스(`1.9`)다.

## 1.8.0 — 2026-07-15

config 스키마를 확장해 프로젝트별 rule 토글을 넣었다(Gate 13). config 확장 라인의 첫 기능 슬라이스이고 1.7.2의 준비 작업 위에 세웠다. 부가적이고 직접 켜야 하며 CLI와 JSON, 프로그래매틱 API, frontmatter 계약이 그대로이고 런타임 의존성도 늘지 않았다.

### 추가

- 프로젝트별 rule 토글을 넣었다. `llm-wiki.config.json`의 `rules` 맵으로 개별 finding rule을 끄거나 severity를 다시 정한다(`{ "rule.id": "off" | "blocked" | "error" | "warning" | "info" }`). `audit`과 `status`, `validate-frontmatter`의 findings에 중앙에서 적용되므로 `validate`와 `next`도 이를 물려받고, 1.7.2에서 통합한 `resolveOptions`를 타므로 CLI와 프로그래매틱 API, MCP 전체에 똑같이 적용된다. 레지스트리에 있는 rule만 토글할 수 있고 민감정보 카테고리는 절대 토글할 수 없다. config로 비밀 탐지를 끌 수 없다는 뜻이다. 근거는 `src/config-file.js`와 `src/commands.js`다.
- `content.thin_body`를 넣었다. 기본이 꺼짐이고 직접 켜는 보강 lint이며, 본문 산문이 아주 얇은 위키 내용 문서를 표시한다. 프로젝트마다 `rules` 맵에 `"content.thin_body"`를 설정해 켠다. 토글 기계를 우리가 먼저 써 보는 용도이기도 하다. 근거는 `src/commands.js`다.
- `doctor`가 `llm_wiki_config` 줄에 켜져 있는 rule 토글 수를 보여 준다.

### 참고

- 부가적이고 직접 켜야 한다. 명시한 값과 CLI 값이 이기고 런타임 의존성 0 정책은 그대로다. 범위는 `GATE_REVIEW.md`의 Gate 13(accepted)이다. severity를 레지스트리로 모으는 선행 작업은 감사로 동작이 보존됐음을 확인했고 push 지점과 레지스트리 사이에 불일치가 0이었다. Gate 13의 나머지인 커스텀 문서셋과 템플릿 오버라이드는 `1.8.x`로 이어진다.

## 1.7.2 — 2026-07-15

config 스키마 확장(Gate 13)을 위한 준비 작업이다. 부가적이고 하위호환이라 CLI와 JSON, 프로그래매틱 API, frontmatter 계약이 바뀌지 않고 런타임 의존성도 늘지 않았다. 이제 config가 세 표면에서 일관되게 해석되고, `init`과 `quickstart`, `doctor`가 그것을 눈에 보이게 만든다.

### 추가

- `resolveOptions(overrides)`를 넣었다. 프로그래매틱 API에 `normalizeOptions`의 config 인식 async 짝을 더한 것이다. 프로젝트의 `llm-wiki.config.json`을 `cwd` 기준으로 CLI와 똑같이 병합해서 `{ options, errors }`를 돌려준다. 동기 함수인 `normalizeOptions`와 동결된 `commands` 맵은 그대로다. 근거는 `src/index.js`와 `src/cli.js`다.
- `init`과 `quickstart --write`가 프로젝트 루트에 최소한의 `llm-wiki.config.json`을 만들어 준다. 감지한 type과 선택한 agents로 씨앗을 채운다. 부가적이고 미리보기가 먼저이며 기존 config는 절대 덮어쓰지 않는다. 근거는 `src/commands.js`다.
- `doctor`가 단순히 있다·없다를 말하는 대신 유효 config를 보여 준다(`llm_wiki_config: present (type=..., agents=...)` 형태이고, 파일이 잘못됐으면 `present (invalid: N errors)`로 나온다).

### 변경

- config 로딩을 명령 계층 아래로 내렸다. 이제 MCP 서버도 `tools/call`마다 대상 프로젝트의 `llm-wiki.config.json`을 병합하고, 파일이 망가졌으면 `isError`로 드러낸다. 이로써 CLI와 프로그래매틱 API, MCP가 같은 유효 옵션을 해석한다. 근거는 `src/cli.js`의 `applyProjectConfig`와 `src/mcp/dispatch.js`다. 그전에는 CLI만 config를 병합했고, Gate 11에 정직한 한계로 적어 두었던 부분이다.

### 참고

- 부가적이고 직접 켜야 한다. 명시한 값과 CLI 값이 이기고, config는 설정하지 않은 항목만 채우며, `strict`는 부가적으로만 켠다. `1.0.0` 계약과 런타임 의존성 0 정책은 그대로다. 범위는 `GATE_REVIEW.md`의 Gate 13(proposed)이다. 이 작업은 `1.8`이 스키마를 확장하기 전에(커스텀 문서셋과 rule 토글, 템플릿 오버라이드) config 실사용을 쌓아 두기 위한 준비다.

## 1.7.1 — 2026-07-15

패치 릴리스이고 저장소 위생만 정리했다. CLI와 JSON, 프로그래매틱 API, frontmatter 계약이 바뀌지 않았고 런타임 동작도 그대로다.

### 수정

- `src/commands.js`가 `wikiGraph` 엣지 중복 제거 키(`collectWikiGraph`에서 `addEdge`로 간다)의 구분자로 날것의 `U+0000`(NUL) 제어 바이트를 소스에 박아 두고 있었다. git의 `text=auto`가 이 파일을 바이너리로 분류하는 바람에, 저장소 `.gitattributes`의 `eol=lf` 정규화에서 이 파일만 빠져 CRLF로 저장됐다. 날것 바이트를 `\\u0000` 이스케이프로 바꾸고 파일을 LF로 다시 정규화해서, 이제 다른 소스 파일과 똑같은 줄바꿈 정책을 따른다.

### 참고

- 기능은 바뀌지 않았다. 템플릿 리터럴 안의 `\\u0000`은 런타임에서 같은 NUL 코드포인트를 만들므로 엣지 중복 제거는 바이트 단위로 동일하다. 커밋 diff의 대부분은 `src/commands.js`를 한 번에 CRLF에서 LF로 다시 정규화한 것이다.

## 1.7.0 — 2026-07-15

CI/CD를 붙였다. 위키를 GitHub Actions와 릴리스 자동화에 쉽게 연결할 수 있게 한다. 쪼개 놓은 "팀 및 조직 확장" 라인에서 가장 먼저 떼어 낸 슬라이스다. 하위호환이라 부가 명령 모드와 컴포지트 액션, 릴리스 잡만 늘었고 CLI와 JSON, 프로그래매틱 API, frontmatter 계약은 그대로이며 런타임 의존성도 늘지 않았다.

### 추가

- `release-notes --body-only`를 넣었다. 변경 섹션 본문만 출력하고 frontmatter와 H1 제목, "게시 전 검토" 스캐폴드 줄은 뺀다. GitHub Release 본문으로 쓰라는 것이다. 커밋 제목이 본문에 들어가므로 민감정보 스캔을 돌려서 걸리면 차단한다(exit 2로 끝나고 본문을 내주지 않는다). 근거는 `src/release-notes.js`와 `src/commands.js`, `src/cli.js`다.
- `.github/actions/validate/action.yml`에 컴포지트 GitHub Action을 넣었다. 읽기 전용 `validate`를 `npx`로 감싼 것이다. 다른 액션을 전혀 끌어오지 않고 bash와 npx만 쓰므로 무의존성 원칙을 지키며 읽기만 한다. 정확한 `vX.Y.Z` 태그나 커밋 SHA로 고정해서 참조한다.
- `v*` 태그를 push하면 GitHub Release가 자동으로 만들어진다. `.github/workflows/publish.yml`의 격리된 `contents: write` 잡(`needs: publish`)이 `release-notes --body-only` 본문을 갖고 러너에 들어 있는 `gh` CLI로 릴리스를 만든다. 서드파티 릴리스 액션을 쓰지 않는다.
- 읽기 전용 리포트 명령 10개(`doctor`, `validate`, `validate-frontmatter`, `audit`, `status`, `next`, `stats`, `graph`, `explain`, `release-notes`)의 `help`에 명령별 `--format json` 예시를 붙였다.

### 참고

- 부가적이고 하위호환이며 무의존성 정책을 지킨다. 범위는 `GATE_REVIEW.md`의 Gate 12다. CI/CD 라인을 쪼개서 `1.7.0`은 앞선 슬라이스만 낸다. Marketplace 게시와 떠 있는 `@v1` 태그, config 로딩과 init 스캐폴딩, doctor echo 같은 준비 작업, 그리고 `1.8`부터 `1.11`까지는 미뤘다.

## 1.6.0 — 2026-07-14

에이전트 네이티브(MCP) 라인이다. 에이전트가 CLI를 spawn하지 않고 위키를 툴로 질의하고 점검할 수 있게 한다. 하위호환이라 새 명령과 모듈만 늘었고 CLI와 JSON, 프로그래매틱 API, frontmatter 계약은 그대로다.

### 추가

- `llm-wiki mcp`를 넣었다. stdio 위에서 도는 Model Context Protocol 서버이고 개행으로 구분하는 JSON-RPC 2.0을 쓴다. Node 내장 모듈만으로 구현해서 서드파티 MCP SDK를 쓰지 않고 무의존성 정책을 지킨다. MCP 클라이언트에는 `{ "command": "npx", "args": ["-y", "@dowonk-7949/llm-wiki-standard", "mcp"] }`로 등록한다.
- 읽기 전용 MCP 툴로 `validate`와 `audit`, `next`, `status`, `doctor`, `stats`, `graph`, `explain`, `handoff`, `prompt`를 노출한다. 쓰거나 바꾸는 명령은 노출하지 않고 어떤 MCP 툴도 파일을 쓰지 않는다(`annotations.readOnlyHint`가 붙는다). 각 `tools/call`은 명령의 구조화된 결과를 `schemaVersion`과 함께 `structuredContent`로 돌려주고, 사람이 읽을 요약은 텍스트로 준다. 명령에서 난 예외는 `isError`로 표시한다.
- 패키지 진입점에 프로그래매틱 MCP 표면을 노출했다. `startMcpServer`와 `MCP_TOOLS`, `handleMcpMessage`, `MCP_PROTOCOL_VERSION`이다. 범위는 `GATE_REVIEW.md`의 Gate 11이다.

### 참고

- 하위호환이고 부가적인 변경이다. 배칭은 지원하지 않는다. 고정한 프로토콜 `2025-06-18`에서 빠졌기 때문이고, 배열 메시지에는 단일 `-32600`으로 답한다. 이 버전은 MCP 툴 호출에 `llm-wiki.config.json` 기본값을 병합하지 않고 명시한 인자만 쓴다.

## 1.5.2 — 2026-07-14

커뮤니티 표준을 갖췄다. GitHub이 권장하는 커뮤니티 표준을 충족하도록 저장소 문서를 추가했다. CLI와 API는 바뀌지 않았다.

### 추가

- 저장소 루트에 커뮤니티 헬스 문서를 영문과 국문 쌍으로 넣었다. `CODE_OF_CONDUCT.md`와 `CONTRIBUTING.md`, `SECURITY.md`이고 각각 `.ko.md` 짝이 있다. `package.json`의 `files`에 등록해 패키지에 포함시켰다.
- GitHub 템플릿을 넣었다. `.github/ISSUE_TEMPLATE/` 아래 버그 리포트와 기능 요청, config가 있고 `.github/pull_request_template.md`도 있다.

### 참고

- 저장소와 GitHub을 대상으로 한 변경일 뿐이고 CLI 명령 표면과 JSON 출력, 프로그래매틱 API는 그대로다. `.github/` 템플릿은 npm에 실리지 않는다.

## 1.5.1 — 2026-07-14

1.5에서 새로 낸 API를 소비 프로젝트에서 스모크 테스트하다 발견한 API와 출력 결함을 고쳤다. 전부 부가적이거나 다듬는 수준이라 안정 계약인 CLI와 JSON, frontmatter는 그대로다.

### 수정

- 명령 결과 객체가 최상단에 `schemaVersion`을 항상 담는다. export된 `SCHEMA_VERSION`과 같은 값이다. 그래서 프로그래매틱 결과가 상수를 따로 import하지 않고도 자기 출력 계약을 밝힐 수 있다. `.text`는 어떤 경우에도 렌더된 텍스트 리포트다. `--format`은 CLI와 `run()`의 stdout, 그리고 `--out` 파일에만 영향을 주고 반환 객체는 바꾸지 않으며, 이 점을 문서에 명시했다.
- `normalizeOptions`가 `parseArgs(argv)`의 결과를 그대로 받는다. 중첩된 `.options`를 읽기 때문이다. 이제 `normalizeOptions(parseArgs(argv))`가 조용히 기본값으로 폴백되지 않는다. 평범한 부분 옵션을 넘기는 기존 방식도 그대로 동작한다.
- `run(argv)`가 `process.exitCode`를 설정하는 데 더해 숫자 exit code(`0`, `1`, `2`, `3`)를 반환한다. 그래서 in-process 호출자가 성공과 실패로 분기할 수 있다.
- `--format html` 대시보드의 Document Index 링크를 `--out` 파일이 있는 디렉터리 기준 상대 경로로 계산한다. 하위 폴더에 쓴 대시보드에서 문서 링크가 404로 깨지던 문제를 해결했다.

## 1.5.0 — 2026-07-14

프로그래매틱 API를 넣었다. CLI 바이너리를 spawn하지 않고도 CI 래퍼와 에디터, 테스트가 LLM-WIKI를 in-process로 쓸 수 있게 한다. 하위호환이고 새 import 표면과 부가적인 JSON 필드 하나만 늘었다.

### 추가

- `package.json`의 `exports`(`.`를 `src/index.js`로)로 import할 수 있는 프로그래매틱 API를 냈다. CLI 명령 이름을 키로 갖는 동결된 `commands` 맵과 개별 명령 함수, `parseArgs`, `run`, `normalizeOptions`(부분 옵션을 완전한 옵션 객체로 만들어 준다), `SCHEMA_VERSION`을 공개한다. 반환 형태는 JSDoc typedef와 `docs/llm-wiki/PUBLIC_API.md`로 문서화했다.
- `--format json` 출력에 최상단 `schemaVersion` 정수가 부가적으로 붙는다. export된 `SCHEMA_VERSION`과 같은 값이며 래퍼가 출력 계약을 고정할 수 있게 해 준다. 단일 소스는 `src/config.js`의 `JSON_SCHEMA_VERSION`이다.

### 참고

- 부가적이고 하위호환이다. 기존 JSON 필드가 그대로라서 현재 `--format json`을 쓰는 소비자는 그대로 동작하고, JSON이 아닌 출력(text·markdown·html과 graph의 mermaid·dot)도 영향을 받지 않는다. 내부 모듈을 밖에서 깊이 import하던 것은 `exports` 맵으로 막혔고 `llm-wiki` 바이너리는 영향이 없다.

## 1.4.0 — 2026-07-14

지식을 눈에 보이게 만들었다. 위키에 든 지식을 탐색하고 측정할 수 있게 하고 도메인 감지를 넓혔다. 하위호환이고 읽기 전용 명령과 부가 감지만 늘었다.

### 추가

- `llm-wiki graph`를 넣었다. 문서와, 위키 `[[links]]`·`related`·markdown 링크로 해소된 문서 사이 엣지로 이뤄진 지식 그래프를 낸다. text와 JSON, Mermaid(펜스로 감싼 `graph TD`), Graphviz DOT로 출력하며 `graph`의 `--format`은 `text|json|mermaid|dot`이다.
- `llm-wiki stats`를 넣었다. 읽기 전용 헬스 스냅샷이고, verified 비율과 보강 비율, 근거 커버리지 비율의 평균으로 낸 헬스 스코어에 status 분포와 stale·orphan 개수를 함께 보여 준다.
- `--format html` 대시보드에 탐색용 Document Index를 넣었다. 문서별 인바운드 수와 orphan 표시가 붙는다. README에는 사람 독자에게 공개하는 방법을 GitHub·GitLab, Obsidian, MkDocs로 나눠 안내했다.
- `init`에 파일 기반 도메인 감지를 넣었다. FastAPI나 Flask, Express, Rails, Go처럼 도메인이 디렉터리가 아니라 라우트·리소스 모듈 파일인 경우(`endpoints`, `routers`, `routes`, `resources`, `controllers`, `handlers` 아래 `*.ext`)도 디렉터리 도메인과 함께 감지한다. 범위를 제한하고 제외 가드를 걸어 오탐을 0에 가깝게 유지했다(`GATE_REVIEW.md`의 Gate 10).

## 1.3.0 — 2026-07-14

디텍터와 어댑터를 넓혔다. 더 많은 프로젝트와 도구를 기본으로 지원한다. 하위호환이고 새 감지와 어댑터, 직접 켜는 허용만 늘었다.

### 추가

- backend와 fullstack `init`이 업무 도메인 디렉터리를 감지한다. `src`나 `app` 아래 `domains`·`domain`·`modules`·`features`, 그리고 `internal` 아래 `domain`·`domains`·`modules`의 직속 하위를 보되 공통 기술 디렉터리는 뺀다. 감지한 도메인마다 문서를 만들고(`domains/NN_<name>.md`, `doc_type: domain`, `source_files`는 탐지한 디렉터리다) `domains/00_overview.md`에서 링크한다. 정렬은 결정적이고, 여러 위치에 흩어진 같은 도메인은 하나로 합친다.
- PHP(`composer.json`)와 Ruby(`Gemfile`, `gems.rb`), .NET(`*.csproj`, `*.fsproj`) 생태계를 감지한다. 웹 프레임워크 신호로 backend인지 library인지 판정한다.
- Windsurf(`.windsurf/rules/llm-wiki.md`)와 Gemini CLI(`GEMINI.md`)를 쓰기 가능한 어댑터로 넣었고, JetBrains AI(`.junie/guidelines.md`)는 info 수준 후보로 뒀다. `--agent all`은 하위호환을 위해 codex와 claude, antigravity를 유지한다.

### 변경

- OKF `type`을 필수 필드 `doc_type`의 alias로 받아들인다. 그래서 OKF 스타일 문서가 필드를 중복해서 적지 않고도 검증을 통과한다. 부가적이고 제거하거나 이름을 바꾼 것은 없다.

## 1.2.0 — 2026-07-14

안전한 업그레이드와 마이그레이션을 다뤘다. 기존 위키를 지우고 다시 만들지 않으면서 CLI 계약에 맞춰 유지한다. 하위호환이고 직접 켜는 동작만 늘었다.

### 추가

- `wiki_block_version`을 인식하는 업그레이드 리포트를 넣었다. `migrate`와 `doctor`가 문서마다 기록된 블록 버전과 설치된 CLI 사이의 계약 격차를 보여 준다. 스탬프되는 값의 단일 소스는 이제 `CURRENT_WIKI_BLOCK_VERSION`이다.
- `migrate --apply`를 승인된 미리보기 우선 범위 안에서 열었다(`GATE_REVIEW.md`의 Gate 8). `fix` 엔진과 `wiki_block_version` 업그레이드를 재사용해서 문서를 현재 계약으로 올리고, 계약에 부합하게 되면 블록 버전을 스탬프한다. `verified` 문서의 내용이나 `status`는 건드리지 않고, 더 최신 CLI가 스탬프한 문서를 내리지도 않는다.
- `llm-wiki drift`를 넣었다. `verified` 문서의 `evidence.stale` 드리프트를 보고하고, `--downgrade`를 줬을 때만 드리프트된 문서를 `needs_review`로 내린다. `status`와 `last_updated`만 건드리며 `verified`로 올리는 일은 절대 없다(`GATE_REVIEW.md`의 Gate 9).

### 변경

- `evidence.stale`에 라인 단위 정밀도를 넣었다. 소스가 정확한 `#Lx-Ly` evidence로만 인용된 경우에는 파일 전체가 아니라 그 라인 범위로 드리프트를 검사하므로, 무관한 편집은 더 이상 걸리지 않는다. 범위가 넓은 참조가 있으면 기존의 파일 단위 검사를 유지한다.
- `VERSIONING.md`와 `project-profile.md`를 버전에 매이지 않는 서술로 바꿨다. 버전 숫자를 고정하지 않고 `package.json`을 단일 소스로 참조한다.

## 1.1.0 — 2026-07-14

inner loop를 정리한 라인이다. 일상적인 검증을 더 빠르고 조용하게 만든다. 하위호환이고 깨는 변경은 없다.

### 추가

- `validate --changed`를 넣었다. 보고하는 findings를 작업 트리 기준(또는 `--since <ref>` 기준)으로 바뀐 위키 문서로 한정한다. pre-commit과 PR CI를 빠르게 해 준다. 문서 사이를 가로지르는 검사는 여전히 위키 전체에 대해 돈다.
- `pre-commit` 훅 템플릿(`templates/git-hooks/pre-commit`)을 넣었다. `validate --changed`를 실행하며 설치 방법은 `templates/git-hooks/README.md`에 있다.
- CI에 consumer install 잡을 넣어서, packed tarball을 대상으로 Quick Start 명령(`doctor`, `init --dry-run`, `validate-frontmatter`)을 돌린다.

### 수정

- `evidence.stale`이 소스 커밋일과 같은 날 검토된 verified 문서를 더 이상 오탐하지 않는다. 드리프트 기준일을 그날의 끝에 앵커링해서 다음 날 이후 커밋만 센다.

### 변경

- `ROADMAP.md`를 앞을 보는 날짜 없는 `1.x` 라인으로 다시 썼다. 구현 이력은 이 CHANGELOG와 `docs/llm-wiki/log.md`로 옮겼다.
- 외부에 공개하는 루트 문서의 국문 짝(`CHANGELOG.ko.md`, `ROADMAP.ko.md`)을 추가하고 영문 정본과 상호 링크했으며 패키지에도 포함시켰다. 영문·국문 쌍 규약도 이때 `docs/llm-wiki/README.md`에 확립했다.

## 1.0.0 — 2026-07-14

첫 안정 릴리스다. `1.0.0`은 `0.1.8`의 계약을 기능 명령 변경 없이 안정 1.0 마일스톤으로 올리면서, 공개 계약을 안정으로 선언하고 릴리스 품질을 강화한다.

### 안정성

- CLI 명령과 옵션 표면, `--format json` 출력 형태, 필수 frontmatter 계약을 안정 계약으로 확정했다. 앞으로 이것들을 깨는 변경에는 major 버전 상승이 필요하다. `GATE_REVIEW.md`의 "1.0.0 Stability Milestone"과 `docs/llm-wiki/VERSIONING.md`를 보라.

### 추가

- 릴리스 품질 CI를 넣었다. Node 18.18.0·20·22·24와 Windows·macOS·Linux를 조합한 verify 매트릭스, 그리고 packed tarball을 대상으로 한 consumer install 스모크 테스트다(`.github/workflows/ci.yml`).
- npm 패키지에 포함되며 계속 쌓아 갈 루트 `CHANGELOG.md`를 새로 만들었다.

### 참고

- 보수적인 쓰기 정책은 그대로다. `init`과 `quickstart`, `fix`는 `--write`에서만 쓰고, `migrate --apply`는 계속 막혀 있으며, `log.md`와 기존 adapter 파일은 절대 덮어쓰지 않고, CLI나 에이전트가 쓴 문서는 `needs_review`로 남는다.

## 그 이전 (0.1.x)

1.0 이전 이력은 `docs/llm-wiki/log.md`와 `docs/llm-wiki/releases/` 아래 릴리스별 노트에 있다. 주요 항목만 적으면 이렇다.

- `0.1.8` — 범위를 한정한 `fix` 자동수정 명령과 근거 드리프트 감지(`evidence.stale`).
- `0.1.7` — 다중 생태계 감지(Python, Go, Rust, JVM), Cursor와 Copilot 어댑터, `llm-wiki.config.json`, `release-notes` 명령.
- `0.1.6` — 실제 생성 일자 기록, `related.missing`과 `content.not_enriched` 검증, 위키 그래프 orphan 감지, `--format html` 대시보드.
