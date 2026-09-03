---
name: Sensitive-info false positive
about: A sensitive.* finding fired on something that is not a secret / 민감정보 규칙 오탐 신고
title: "[Sensitive FP] "
labels: [bug, sensitive-false-positive]
---

<!-- Please write in English or Korean. / 영어 또는 한국어로 작성해 주세요. -->

> **Never paste the matched value.** The finding does not print it, and neither
> should this issue — describe its shape instead.
> **매치된 값은 절대 붙여넣지 마세요.** finding도 값을 출력하지 않습니다. 값 대신 형태만 설명해 주세요.
>
> If you cannot describe it without the value, do not open a public issue — use the
> [security policy](https://github.com/Dowon-Kim7949/llm-wiki-governance/security/policy).
> 값 없이 설명할 수 없다면 공개 이슈 대신 보안 정책의 비공개 채널을 이용해 주세요.

## Rule id / 규칙 id
<!-- Usually sensitive.redacted. / 보통 sensitive.redacted 입니다. -->

## Document path / 문서 경로
<!-- The path:line the finding named. / finding이 지목한 path:line. -->

## Redacted description of what tripped it / 무엇이 걸렸는지(값 제외 설명)
<!-- Describe the SHAPE only: "a 40-character hex commit SHA inside a prose
     sentence", "a base64 placeholder in a fenced example". No values.
     형태만 적어 주세요: "산문 안의 40자 hex 커밋 SHA", "예제 코드블록의 base64 자리표시자" 등.
     값은 절대 넣지 마세요. -->

## Command & output / 실행 명령과 출력
<!-- Redact the finding line if you need to. / 필요하면 finding 줄을 가려서 붙여넣으세요. -->
```text
llm-wiki validate
```

## What it blocked / 무엇이 막혔는지
- [ ] `validate` / `audit` exited 2 / `validate`·`audit`가 exit 2로 종료
- [ ] `review --approve` / `--approve-all` refused the document / `review` 승격이 거부됨
- [ ] Other / 기타:

## Environment / 환경
- Package version / 패키지 버전:
- Node.js version / Node 버전:
- OS / 운영체제:

## Confirmation / 확인
- [ ] The value is **not** included anywhere in this issue. / 이 이슈 어디에도 값을 넣지 않았습니다.
- [ ] I inspected the line locally and it is not a real secret. / 로컬에서 확인했고 실제 비밀정보가 아닙니다.

<!-- Context: `sensitive.*` rules are in NON_TOGGLEABLE_CATEGORIES, so they cannot be
     turned off by llm-wiki.config.json `rules` or a `rulesPreset` — by design. There is
     deliberately no per-document exception mechanism yet; the condition for revisiting
     that is the first real reported false positive. See SECURITY.md → "Reporting a
     sensitive-info false positive".
     참고: `sensitive.*`는 NON_TOGGLEABLE_CATEGORIES에 속해 설계상 config `rules`/`rulesPreset`으로
     끌 수 없습니다. 문서별 예외 장치도 의도적으로 아직 없으며, 재검토 조건은 실제 오탐 신고 1건입니다.
     자세한 내용은 SECURITY.md의 "Reporting a sensitive-info false positive" 절을 보세요. -->
