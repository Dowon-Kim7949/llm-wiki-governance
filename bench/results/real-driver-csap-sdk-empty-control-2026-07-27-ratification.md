# 채점 비준 워크시트 (사람 검토용) · Human ratification worksheet

**검토 대상:** 2026-07-27 3-arm 블라인드 채점 결과 — B 0.910 / B2 0.978 / **B2_empty 0.911**.
**비준되면 닫히는 것:** "채점을 에이전트가 했다"는 마지막 공격 지점. 벤치 라인에 남은 유일한 방법론 갭입니다.
**소요:** 1단계만 하면 약 5분, 전체 3단계 15분. **1단계만 해도 유효한 비준**입니다.

전체 채점표는 [`…-grading.md`](./real-driver-csap-sdk-empty-control-2026-07-27-grading.md),
원자료는 같은 폴더의 `real-B*.json`(`.tasks[].runs[].answer`)에 있습니다.

---

## 무엇을 확인하는 것인가

결론은 **"B2_empty(0.911) ≈ B(0.910), B2(0.978)만 앞선다"** 입니다. 이 결론이 깨지려면
제가 **arm에 따라 다른 잣대**를 적용했어야 합니다. 그래서 확인할 질문은 개별 점수의 정오가 아니라
이것 하나입니다:

> **같은 태스크·같은 루브릭에서, arm이 다른 답변에 같은 기준을 적용했는가?**

그래서 표본을 **태스크별 arm 3중쌍**으로 골랐습니다 — 나란히 놓고 보면 잣대 차이가 바로 보입니다.
표본은 제 결론에 **불리한 쪽으로** 선택했습니다: 결론을 좌우하는 태스크, B가 **이긴** 태스크,
제가 매긴 **최저점**, 그리고 제가 **봐줬을 수 있는** 지점.

## 제가 틀렸을 수 있는 지점 (먼저 밝힘)

1. **state-mgmt 4번 항목이 결과를 가장 크게 움직였습니다.** "클라이언트에 bearer 토큰 없음 —
   인증은 HTTP-only 쿠키"라는 항목인데, 9개 중 6개가 이를 언급하지 않아 감점했습니다.
   질문이 *"user/menu/group 정보가 **어디에 저장**되나"*였으므로, **이 항목을 범위 밖으로 보실 수
   있습니다.** 그렇게 보면 점수가 바뀝니다 — 아래 민감도 분석 참조.
2. **부분점수(0.5)는 제 재량**입니다. 루브릭은 이진인데 3곳에서 절반을 줬습니다.
3. **파일 경로 오류에 감점하지 않았습니다** (3단계 표본). 루브릭 항목이 경로를 묻지 않아서인데,
   달리 보실 수 있습니다.
4. **내용으로 arm이 드러날 수 있습니다.** "the wiki fully documents this" 같은 문장은 위키 arm임을
   시사합니다. 의식적으로 쓰지 않았지만, 영향을 받지 않았다는 것을 **증명할 수는 없습니다.**

### 민감도 — 위 1번이 결론을 바꾸는가

state-mgmt 4번 항목을 **범위 밖으로 빼고** 다시 계산하면:

| arm | 원래 | 4번 제외 시 |
| --- | --: | --: |
| B | 0.910 | 0.942 |
| **B2_empty** | **0.911** | **0.953** |
| B2 | 0.978 | 0.978 |

**결론은 유지됩니다.** B2_empty와 B의 격차는 0.1pp → 1.1pp로 벌어지지만 여전히 B2의 우위
(+2.5pp 이상)보다 훨씬 작고, "스텁 위키는 정확도를 사주지 못한다"는 판단은 그대로입니다.
즉 가장 논쟁적인 제 판단이 뒤집혀도 결론은 견딥니다.

---

# 1단계 (필수, ~5분) — state-mgmt 3중쌍

가장 격차가 큰 태스크이고, 유일한 환각 판정이 여기 있습니다.

**질문:** "로그인 후 user·menu·group 정보가 다른 페이지에서 쓰이도록 어디에 저장되는가?"

**루브릭 4항목:**
1. `csap_rk_*` 키로 sessionStorage 저장 (`csap_rk_userInfo`는 crypto-js AES 암호화)
2. 로그인 시 채워지는 인메모리 Pinia `UserStore` 미러
3. 새로고침 시 라우터 `beforeEach` 가드가 sessionStorage에서 스토어를 **재수화(rehydrate)**
4. 클라이언트 보유 bearer 토큰 없음 — 인증은 HTTP-only 쿠키

---

## 1-A · arm **B** (위키 없음) — 제 채점 **2/4**

| 항목 | 판정 | 근거 |
| --- | :-: | --- |
| 1 | ✓ | 키 3개 + AES 표로 정확히 기술 |
| 2 | ✓ | Pinia 스토어 미러 기술 |
| 3 | **✗** | **역으로 설명함** — "가드가 재로그인으로 리다이렉트한다". 실제로는 재수화한다 |
| 4 | ✗ | 언급 없음 |

> **이 판정이 유일한 "환각급" 오류 집계입니다.** 아래 마지막 문단이 근거입니다.

```
After a successful login, the user, menu, and group information is persisted in the browser's
sessionStorage (via helper functions), with a partial copy also mirrored into a Pinia store for
in-memory reactive access.

### Where it happens
The storing occurs in src/pages/LoginPage.vue, in the processLoginSuccess() function (lines ~251–256):

    saveLocalUserGroups(JSON.stringify(responseData.groups))  // group info
    saveLocalMenu(JSON.stringify(responseData.menu))          // menu info
    saveLocalUserInfo(JSON.stringify(userInfo))               // user info
    userStore.setUserNickname(userId.value)
    userStore.setUserName(userInfo.user_nm)
    userStore.setUserInfos(userInfo)

### The storage mechanism — src/utils/sessionstorage/index.ts
| User info | saveLocalUserInfo | csap_rk_userInfo | AES-encrypted (crypto-js) before storing |
| Menu      | saveLocalMenu     | csap_rk_menu     | stored as plain JSON string |
| Groups    | saveLocalUserGroups | csap_rk_userGroups | stored as plain JSON string |

Other pages read it back through the matching getters in the same file:
- getLocalUserInfo() — reads csap_rk_userInfo and AES-decrypts it
- getLocalMenu() — reads csap_rk_menu
- getLocalUserGroups() — reads csap_rk_userGroups and JSON.parses it
removeLocalUserInfo() clears all these keys (used on logout / re-login).

### The in-memory copy — src/stores/UserStore.ts
The Pinia store useUserStore (defineStore 'user') also holds the user info in reactive state via
setUserInfos / setUserName / setUserNickname (state fields userInfos, userName, userNickname, plus
getters getUserInfos, etc.). This is convenient reactive access during a page session.

### Why two places
Because Pinia state is lost on a page refresh, the sessionStorage copy is the durable source of
truth for the session. Indeed, the router guard in src/router/index.ts checks both — if
sessionStorage still has the user but the Pinia store is empty (e.g., after a hard refresh), it
forces a redirect to re-login (lines 41–46). So sessionStorage (csap_rk_userInfo / csap_rk_menu /
csap_rk_userGroups) is where the information lives so other pages can use it after login.
```

**확인해 주실 점:** 마지막 문단의 "forces a redirect to re-login"이 실제 동작(재수화)과 반대라는
판정에 동의하시는지. 동의하지 않으시면 B는 2/4가 아니라 3/4가 되고 B 평균이 올라갑니다.

---

## 1-B · arm **B2_empty** (도구 + 빈 위키) — 제 채점 **3/4**

| 항목 | 판정 | 근거 |
| --- | :-: | --- |
| 1 | ✓ | 키 3개 + AES + `SECRET_KEY` |
| 2 | ✓ | Pinia 스토어 + 액션/게터 |
| 3 | ✓ | "**rehydrates** the Pinia store from the encrypted sessionStorage values" — 정확 |
| 4 | ✗ | 언급 없음 (B와 **동일 사유로 감점**) |

```
After a successful login, user/menu/group data is persisted in two complementary layers: browser
sessionStorage (for durability across page reloads) and the Pinia user store (for in-memory
reactive access by other pages). The router restores the store from sessionStorage on refresh.

### Where it's written
The write happens in src/pages/LoginPage.vue, in the processLoginSuccess(responseData) function
(lines ~230–265), using the login response's groups, menu, and user_info fields: [same code block]

### The two storage locations
1. sessionStorage — via helpers in src/utils/sessionstorage/index.ts, under csap_rk_* keys:
   - saveLocalUserInfo → key csap_rk_userInfo (AES-encrypted with crypto-js using a hardcoded SECRET_KEY)
   - saveLocalMenu → key csap_rk_menu (plain JSON)
   - saveLocalUserGroups → key csap_rk_userGroups (plain JSON)
   Read back with getLocalUserInfo / getLocalMenu / getLocalUserGroups, and cleared by
   removeLocalUserInfo on logout. (Note: the "remember ID" credentials are stored separately in an
   AES-encrypted cookie csap_rk_savedInfo via saveSavedUserInfo.)
2. Pinia store useUserStore — defined in src/stores/UserStore.ts (defineStore('user', …)). Its state
   holds userName, userNickname, userInfos, userGroups, etc., populated via actions setUserName,
   setUserNickname, setUserInfos. Other pages read it through getters like getUserInfos, getUserName,
   getUserGroups, getIsRootGroupAdmin.

### How other pages get it back
Since Pinia state is in-memory and lost on a full page reload, the global router guard beforeEach in
src/router/index.ts (approx lines 41–48) detects when a local user exists in sessionStorage but the
store is empty and rehydrates the Pinia store from the encrypted sessionStorage values before
allowing navigation. So other pages simply consume the reactive useUserStore getters, and the
sessionStorage layer keeps that data alive across refreshes.
```

---

## 1-C · arm **B2** (도구 + 실제 위키) — 제 채점 **4/4**

| 항목 | 판정 | 근거 |
| --- | :-: | --- |
| 1 | ✓ | 키 3개 + AES + 연관 키까지 |
| 2 | ✓ | "runtime mirror of the persisted session data" |
| 3 | ✓ | "rehydrates the Pinia UserStore … on refresh" |
| 4 | ✓ | "**not token-in-store — it relies on an HTTP-only cookie**" — 명시 |

```
After login, the user, menu, and group information is saved into the browser's sessionStorage (as
csap_rk_* keys) via helper functions in src/utils/sessionstorage/index.ts. This survives page
navigation/refresh and is read back by other pages.

### Where it's written
In src/pages/LoginPage.vue, the processLoginSuccess function (≈lines 230–272) runs on a successful
login (after any MFA step) and persists the three pieces of data:
- User info → saveLocalUserInfo(userInfo) — JSON-stringified, then AES-encrypted (crypto-js,
  SECRET_KEY) and stored under key csap_rk_userInfo.
- Menu → saveLocalMenu(menus) — stored (plain JSON string) under key csap_rk_menu.
- Groups → saveLocalUserGroups(groups) — stored under key csap_rk_userGroups (with related
  csap_rk_customer, csap_rk_regionIds, csap_rk_workteamIds).

### How other pages read it
getLocalUserInfo() (AES-decrypts) · getLocalMenu() · getLocalUserGroups() / getLocalUserCustomer() /
getLocalRegionKey() / getLocalWorkteamKey().

### Relationship to the Pinia store
- src/router/index.ts beforeEach guard (≈lines 41–48) rehydrates the Pinia UserStore
  (src/stores/UserStore.ts, id user) from sessionStorage on refresh, so the store is a runtime
  mirror of the persisted session data.
- MainLayout.vue onMounted (≈637–679) parses csap_rk_menu to build/filter the menu and computes role
  flags (isRootGroupAdmin, isOpGroupManager, hasLowerGroup).

### Important nuance
Authentication itself is not token-in-store — it relies on an HTTP-only cookie
(axios.create({ withCredentials: true }) in src/utils/api/axiosInstance.ts). The sessionStorage
entries hold profile/menu/group data for the UI; the AES key in sessionstorage/index.ts is hardcoded
obfuscation, not a real secret.
```

**1단계 핵심 확인:** 세 답변에서 **4번 항목을 같은 잣대로** 판정했는지 (B ✗ / B2_empty ✗ / B2 ✓ —
실제로 B2만 그 문장을 썼습니다). 그리고 3번을 B에서만 ✗ 준 것이 **역설명 때문**이지
arm 때문이 아니라는 점.

---

# 2단계 (권장, ~7분) — auth-signin 3중쌍: **B가 이긴 태스크**

제가 위키 arm에 유리하게 채점하지 않았는지 보는 역방향 점검입니다.
여기서는 **B 1.000 / B2 0.867 / B2_empty 0.800**으로 **위키 arm이 졌습니다.**

**루브릭 5항목:** ① 비밀번호 클라이언트 RSA-OAEP 암호화 ② 2단계(`/auth/enc/session` → `/auth/login`)
③ 쿠키 세션(`withCredentials`, bearer 없음) ④ 선택적 TOTP MFA ⑤ **419+`201403` 토큰 갱신 인터셉터**

패턴: **⑤번을 잡으려면 `axiosInstance.ts`를 직접 열어야 합니다.** B는 매번 열었고 항상 맞혔습니다.
위키 우선 arm들은 자주 거기까지 가지 않았습니다.

| 표본 | arm | 점수 | ① | ② | ③ | ④ | ⑤ |
| --- | --- | --: | :-: | :-: | :-: | :-: | :-: |
| 2-A | **B** | **5/5** | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2-B | **B2** | **4/5** | ✓ | ✓ | ✓ | ✓ | ✗ |
| 2-C | **B2_empty** | **3.5/5** | ✓ | ✓ | **½** | ✓ | ✗ |

**2-A (B, 5/5)** — ⑤ 근거:
> "Token expiry is handled by an interceptor that, on `419 / code 201403`, silently calls
> `/api/v2/auth/token/refresh` and retries the original request; on refresh failure or 401/403 it
> clears state and redirects to `/`."

③ 근거: "created with **withCredentials: true** … there's no bearer token stored in JS."

**2-B (B2, 4/5)** — ③은 명확히 맞혔습니다:
> "created with `withCredentials: true`, so the server sets an **HTTP-only session cookie** — that
> cookie *is* the auth state. No Authorization/token header is attached by the client."

⑤는 답변 전체에 refresh 인터셉터 언급이 **없습니다** → ✗.

**2-C (B2_empty, 3.5/5)** — **제가 매긴 최저점입니다. 가장 논쟁적입니다.**
③에 절반만 준 이유: 쿠키를 스치듯 언급하지만("(and sets a session cookie)"), "인증 상태"를 다루는
전용 섹션에서는 오히려 이렇게 씁니다:
> "The auth state is the presence of user info in sessionStorage + Pinia."

이는 프런트의 게이팅 방식으로는 맞지만, 루브릭 ③이 요구하는 "전송 인증은 쿠키이고 bearer 토큰이
없다"는 진술은 아닙니다. **온전히 ✓를 주거나 온전히 ✗를 주는 것이 옳다고 보시면 말씀해 주세요** —
0.5는 제 재량이었습니다.

---

# 3단계 (선택, ~3분) — 관대함 점검: session-timeout arm **B2**

제가 **위키 arm의 오류를 봐줬는지** 보는 점검입니다. 이 답변은 **3/3 만점**을 줬지만
파일 경로가 틀렸습니다 — `src/utils/api/useSessionTimeout.ts`라 했으나 실제는
`src/composables/useSessionTimeout.ts`입니다.

```
## 1. Client-side idle timeout — src/utils/api/useSessionTimeout.ts     ← 경로 오류
- 59-minute warning / 60-minute forced logout (lines :14-15).
- The timer is reset on every request via the axios request interceptor in
  src/utils/api/axiosInstance.ts (:49-58) …

## 2. Server-driven session/token expiry — src/utils/api/axiosInstance.ts response interceptor
- 419 + code 201403 (token expired): a single-flight token refresh is attempted (refreshToken →
  POST /api/v2/auth/token/refresh). The original request plus any queued requests are replayed …
- 403 and 401: treated as an invalid/expired session — the interceptor clears session state and
  redirects to / (the login flow).
```

**제 판단:** 루브릭 3항목(①59/60 타이머+요청마다 리셋 ②419+201403 단일 refresh+큐 재생
③401/403 정리 후 `/`)이 **모두 정확히** 진술됐고, 경로를 묻는 항목은 없으므로 3/3 + "MINOR" 주석.

**확인해 주실 점:** 틀린 파일 경로에 감점하지 않은 것이 타당한지. 감점이 맞다고 보시면 B2 점수가
내려가고 — 즉 **제 결론에 불리해집니다**. (그래도 결론 방향은 바뀌지 않습니다.)

---

# 비준 결과 기록

아래 중 하나를 말씀해 주시면 제가 채점 기록과 `BENCHMARK.md`에 반영하겠습니다.

- **(a) 승인** — "표본을 확인했고 채점 기준이 arm 간 일관적이다." → 기록이
  *agent-graded* 에서 **agent-graded, human-ratified (Dowon-Kim, 날짜)** 로 바뀌고, 벤치 라인의
  마지막 방법론 갭이 닫힙니다.
- **(b) 조건부 승인** — 특정 판정에 이견. 어느 항목인지 알려주시면 재채점하고 영향 범위를
  다시 계산해 보고합니다.
- **(c) 불승인** — 독립적 재채점이 필요. 그 경우 벤치 수치는 계속 *agent-graded* 로 남고
  공개 문구도 그대로 유지합니다.

어느 쪽이든 **수치를 사후에 조정하지 않습니다.** 이견이 나오면 재계산 결과를 그대로 기록합니다.
