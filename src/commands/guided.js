// Guided onboarding + task preparation (Gate: Guided Onboarding and Task
// Preparation, 1.24). Two READ-ONLY surfaces that deterministically assemble
// learning/scoping context from the EXISTING wiki + evidence + graph + retrieval
// ranking. The CLI never invents explanation — it collects and structures what the
// docs already record (the agent skills do the teaching). Reuses the retrieval
// primitives (loadContentDocs/applyFilters/rankDocsByQuery/redactSensitive) so the
// search/filter/redaction policy is identical across CLI/API/MCP; reuses the wiki
// graph for neighbors and the evidence parser for source/test candidates. Nothing
// is written; restricted/sensitive docs are excluded by default and returned text
// is redacted. Zero-dependency; a leaf module (no back-dependency on commands.js).
import { detectProject } from "../detector.js";
import { applyFilters, loadContentDocs, rankDocsByQuery, redactSensitive } from "./retrieval.js";
import { collectWikiGraph } from "./wiki-graph.js";
import { isExternalSourceReference, parseEvidenceReference } from "./references.js";
import { withText } from "./findings.js";

const MAX_DOCS = 14;
const MAX_SOURCES = 20;
const MAX_TESTS = 15;
const MAX_INVARIANTS = 12;
const TOP_MATCHES = 8;

// ko when --lang ko, else en (default). Only human-facing guidance prose is
// localized; structural labels/paths/rule-ish tokens stay English (project policy).
function pickLang(options) {
  return options && options.lang === "ko" ? "ko" : "en";
}
function bind(lang) {
  return (en, ko) => (lang === "ko" ? ko : en);
}

function title(doc) {
  return typeof doc.frontmatter.title === "string" && doc.frontmatter.title.trim() ? doc.frontmatter.title.trim() : null;
}
function status(doc) {
  return typeof doc.frontmatter.status === "string" ? doc.frontmatter.status : null;
}
function docType(doc) {
  if (typeof doc.frontmatter.doc_type === "string" && doc.frontmatter.doc_type.trim()) return doc.frontmatter.doc_type;
  if (typeof doc.frontmatter.type === "string" && doc.frontmatter.type.trim()) return doc.frontmatter.type;
  return null;
}
function docRef(doc) {
  return { path: doc.path, title: title(doc), status: status(doc), docType: docType(doc) };
}
function docLine(doc) {
  return `${doc.path} — ${title(doc) ?? "(no title)"} [${status(doc) ?? "?"}]`;
}

function isDomainDoc(doc) {
  return /(^|\/)docs\/llm-wiki\/domains\/[^/]+\.md$/.test(doc.path) && !/00_overview\.md$/.test(doc.path);
}
function domainName(doc) {
  return title(doc) ?? doc.path.replace(/^.*\/domains\//, "").replace(/^\d+[_-]/, "").replace(/\.md$/, "");
}
function domainKey(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

// Local source paths a doc grounds itself on: source_files (broad) + evidence
// (precise, locator stripped), external (http/repo:) refs skipped, deduped.
function localSources(doc) {
  const out = new Set();
  const add = (raw) => {
    if (typeof raw !== "string" || !raw.trim()) return;
    if (isExternalSourceReference(raw)) return;
    const parsed = parseEvidenceReference(raw);
    const source = parsed && !parsed.external && parsed.source ? parsed.source : raw.split("#")[0].trim();
    if (source && !isExternalSourceReference(source)) out.add(source);
  };
  if (Array.isArray(doc.frontmatter.source_files)) doc.frontmatter.source_files.forEach(add);
  if (Array.isArray(doc.frontmatter.evidence)) doc.frontmatter.evidence.forEach(add);
  return [...out];
}
function isTestPath(p) {
  return /(^|\/)(tests?|__tests__|spec)\//i.test(p)
    || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(p)
    || /(^|\/)test_[^/]+\.py$/i.test(p)
    || /_test\.(py|go)$/i.test(p);
}

// Invariants/risks AS RECORDED IN THE DOCS — never invented. Pulls "## Open
// Questions" bullets and body lines that flag a constraint/risk, each tagged with
// its source doc. Redacted and capped.
const RISK_RE = /\b(invariant|must not|never|do not|non-negotiable|constraint|risk|guardrail|breaking)\b|불변|반드시|절대|금지|주의|위험|제약|하지 않는다|하면 안/i;
function collectInvariants(docs) {
  const out = [];
  for (const doc of docs) {
    const body = redactSensitive(doc.body || "");
    const lines = body.split(/\r?\n/);
    let inOpenQ = false;
    for (const line of lines) {
      const heading = /^##\s+(.*)$/.exec(line);
      if (heading) {
        inOpenQ = /open questions|미결|미확정|열린 질문/i.test(heading[1]);
        continue;
      }
      const bullet = /^\s*[-*]\s+(.*\S)/.exec(line);
      const text = bullet ? bullet[1].trim() : "";
      if (!text) continue;
      if (inOpenQ || RISK_RE.test(text)) {
        out.push({ path: doc.path, text: text.length > 200 ? `${text.slice(0, 200)} …` : text });
        if (out.length >= MAX_INVARIANTS) return out;
      }
    }
  }
  return out;
}

function neighborsOf(graph, seedPaths) {
  const seeds = new Set(seedPaths);
  const found = new Set();
  for (const edge of graph.edges) {
    if (seeds.has(edge.source) && !seeds.has(edge.target)) found.add(edge.target);
    if (seeds.has(edge.target) && !seeds.has(edge.source)) found.add(edge.source);
  }
  return [...found];
}

// Ordered, deduped merge of doc paths → resolved doc objects (only those present).
function resolveDocs(byPath, paths) {
  const seen = new Set();
  const out = [];
  for (const p of paths) {
    if (seen.has(p)) continue;
    seen.add(p);
    const doc = byPath.get(p);
    if (doc) out.push(doc);
  }
  return out;
}

function notInitialized(command, heading, lang) {
  const t = bind(lang);
  const next = t(
    "No LLM-WIKI found. Run `llm-wiki quickstart --write` (or `init --write`) to scaffold it, then enrich it (see the /llm-wiki-bootstrap skill) before onboarding.",
    "LLM-WIKI가 없습니다. `llm-wiki quickstart --write`(또는 `init --write`)로 뼈대를 만든 뒤 보강(/llm-wiki-bootstrap 스킬)하고 나서 온보딩하세요."
  );
  return withText({
    command,
    result: "pass",
    initialized: false,
    findings: []
  }, heading, [
    { title: "Summary", body: [t("wiki: not initialized", "위키: 미초기화")] },
    { title: "Next step", body: [next] },
    { title: "Caveats", body: [t("Read-only. No documents to assemble yet.", "읽기 전용. 아직 조립할 문서가 없습니다.")] }
  ]);
}

// ---- onboard -----------------------------------------------------------

const ONBOARD_ENTRY_ORDER = [
  "docs/llm-wiki/index.md",
  "docs/llm-wiki/project-profile.md",
  "docs/llm-wiki/ARCHITECTURE_CONVENTIONS.md",
  "docs/llm-wiki/DOMAIN_FEATURES.md",
  "docs/llm-wiki/GLOSSARY.md"
];

export async function onboardCommand(options) {
  const lang = pickLang(options);
  const t = bind(lang);
  const detection = await detectProject(options.cwd, options.type, options.profiles);
  const allDocs = await loadContentDocs(options.cwd);
  if (allDocs.length === 0) return notInitialized("onboard", "LLM-WIKI Onboard", lang);

  const { kept } = applyFilters(allDocs, { includeSensitive: false });
  const byPath = new Map(kept.map((doc) => [doc.path, doc]));
  const graph = await collectWikiGraph(options.cwd);

  const domainDocs = kept.filter(isDomainDoc);
  const availableDomains = domainDocs.map((doc) => ({ name: domainName(doc), path: doc.path }));

  // Domain selection. Missing/unmatched domain → explicit guidance, never silent.
  let selectedDomain = null;
  let domainNotice = null;
  if (options.domain) {
    const wanted = domainKey(options.domain);
    selectedDomain = domainDocs.find((doc) => domainKey(domainName(doc)) === wanted)
      ?? domainDocs.find((doc) => domainKey(domainName(doc)).includes(wanted) || domainKey(doc.path).includes(wanted))
      ?? null;
    if (!selectedDomain) {
      domainNotice = [
        t(`Domain "${options.domain}" was not found in the wiki.`, `업무 영역 "${options.domain}"을(를) 위키에서 찾지 못했습니다.`),
        availableDomains.length
          ? t(`Available domains: ${availableDomains.map((d) => d.name).join(", ")}.`, `사용 가능한 업무 영역: ${availableDomains.map((d) => d.name).join(", ")}.`)
          : t("No domain documents exist yet (docs/llm-wiki/domains/). Backend/fullstack/frontend projects can generate them with `init --write` (auto-detected) or `--domains a,b,c` (manual).",
              "아직 도메인 문서가 없습니다(docs/llm-wiki/domains/). backend/fullstack/frontend 프로젝트는 `init --write`(자동 감지) 또는 `--domains a,b,c`(수동)로 생성할 수 있습니다."),
        t("Or run `llm-wiki onboard` without --domain for a project-wide orientation, and read docs/llm-wiki/index.md manually.",
          "또는 --domain 없이 `llm-wiki onboard`로 프로젝트 전체 오리엔테이션을 받고, docs/llm-wiki/index.md를 직접 읽으세요.")
      ];
    }
  }

  // Learning path = entry docs (present) → selected domain + its neighbors → glossary.
  const readOrder = [...ONBOARD_ENTRY_ORDER];
  if (selectedDomain) {
    readOrder.push(selectedDomain.path, ...neighborsOf(graph, [selectedDomain.path]));
  } else {
    readOrder.push("docs/llm-wiki/domains/00_overview.md", ...domainDocs.map((doc) => doc.path));
  }
  const docsToRead = resolveDocs(byPath, readOrder).slice(0, MAX_DOCS);

  // Source + test entrypoints from the read set's grounding.
  const sourceSet = new Set();
  const testSet = new Set();
  for (const doc of docsToRead) {
    for (const src of localSources(doc)) {
      if (isTestPath(src)) testSet.add(src);
      else sourceSet.add(src);
    }
  }
  const sources = [...sourceSet].sort().slice(0, MAX_SOURCES);
  const tests = [...testSet].sort().slice(0, MAX_TESTS);

  const invariants = collectInvariants(docsToRead);
  const needsReview = docsToRead.filter((doc) => status(doc) && status(doc) !== "verified").map((doc) => doc.path);

  const comprehensionChecks = [
    t("Can you explain where the selected workflow starts and ends, with source evidence?", "선택한 업무 흐름의 시작점과 종료점을 소스 근거와 함께 설명할 수 있는가?"),
    t("Can you explain the relevant API request/response from the source, not just the doc?", "관련 API 요청과 응답을 문서가 아닌 소스 근거로 설명할 수 있는가?"),
    t("Can you explain where state is stored and how it changes?", "상태가 어디에 저장되고 어떻게 바뀌는지 설명할 수 있는가?"),
    t("Have you found the tests that cover this area (to run before/after a change)?", "이 영역을 덮는 테스트(변경 전후 실행)를 찾았는가?"),
    t("Did you notice which related docs are needs_review or may be stale?", "관련 문서 중 needs_review이거나 오래됐을 수 있는 것을 확인했는가?")
  ];

  const nextStep = [
    t("Read the documents above in order, then open the source entrypoints to confirm the real behavior (the code is the source of truth; the wiki is a map to it).",
      "위 문서를 순서대로 읽은 뒤 소스 진입점을 열어 실제 동작을 확인하세요(코드가 최종 사실, 위키는 그 지도입니다)."),
    t("Before changing code, run `llm-wiki prepare --task \"<what you will do>\"` to scope the work.",
      "코드를 바꾸기 전에 `llm-wiki prepare --task \"<하려는 작업>\"`으로 범위를 조사하세요."),
    t("For a guided walkthrough, run the /llm-wiki-onboard skill in your coding agent.",
      "가이드 학습이 필요하면 코딩 에이전트에서 /llm-wiki-onboard 스킬을 실행하세요.")
  ];

  const summary = [
    `project_type: ${detection.projectType}`,
    `domain: ${selectedDomain ? domainName(selectedDomain) : (options.domain ? `${options.domain} (not found)` : "(project-wide)")}`,
    `goal: ${options.goal ? options.goal : "(none)"}`,
    `documents: ${docsToRead.length}`,
    `source_entrypoints: ${sources.length}`,
    `tests: ${tests.length}`,
    `needs_review_in_path: ${needsReview.length}`
  ];

  const sections = [{ title: "Summary", body: summary }];
  if (domainNotice) sections.push({ title: t("Domain not found", "업무 영역 없음"), body: domainNotice });
  sections.push(
    { title: t("Documents to read", "읽을 문서"), body: docsToRead.map(docLine) },
    { title: t("Source entrypoints", "소스 진입점"), body: sources.length ? sources : [t("(none referenced by the docs in this path)", "(이 경로의 문서가 참조하는 소스 없음)")] },
    { title: t("Tests to inspect", "확인할 테스트"), body: tests.length ? tests : [t("(no test files referenced by the docs in this path — search the repo's test dir manually)", "(이 경로의 문서가 참조하는 테스트 없음 — 저장소 테스트 디렉터리를 직접 확인)")] },
    { title: t("Invariants and risks (as recorded in the docs)", "불변 조건·위험 (문서에 기록된 대로)"), body: invariants.length ? invariants.map((i) => `${i.text}  (${i.path})`) : [t("(none recorded in the docs in this path)", "(이 경로의 문서에 기록된 항목 없음)")] },
    { title: t("Freshness / review warnings", "최신성·검토 경고"), body: needsReview.length ? needsReview.map((p) => t(`${p} — needs_review (treat as unconfirmed until a human verifies)`, `${p} — needs_review (사람 검토 전까지 미확정으로 취급)`)) : [t("(all documents in this path are verified — still confirm against the code)", "(이 경로의 문서는 모두 verified — 그래도 코드로 확인)")] },
    { title: t("Suggested comprehension checks", "이해도 확인 질문"), body: comprehensionChecks },
    { title: t("Next step", "다음 단계"), body: nextStep },
    { title: "Caveats", body: [t("Read-only. Assembled from the existing wiki — the CLI does not invent explanation; the code remains the source of truth. Restricted/sensitive docs are excluded; returned text is redacted.", "읽기 전용. 기존 위키에서 조립하며 CLI는 설명을 창작하지 않습니다(코드가 최종 사실). 제한·민감 문서는 제외되고 반환 텍스트는 가려집니다.")] }
  );

  return withText({
    command: "onboard",
    result: "pass",
    initialized: true,
    projectType: detection.projectType,
    domain: selectedDomain ? domainName(selectedDomain) : null,
    domainRequested: typeof options.domain === "string" ? options.domain : null,
    domainFound: Boolean(selectedDomain) || !options.domain,
    goal: typeof options.goal === "string" ? options.goal : null,
    availableDomains,
    documents: docsToRead.map(docRef),
    sourceEntrypoints: sources,
    tests,
    invariants,
    freshnessWarnings: needsReview,
    comprehensionChecks,
    findings: []
  }, "LLM-WIKI Onboard", sections);
}

// ---- prepare -----------------------------------------------------------

const CONTEXT_DOC_RE = /\b(api|endpoint|route|state|store|screen|page|view|config|configuration|deploy|deployment|workflow|auth)\b/i;

export async function prepareCommand(options) {
  const lang = pickLang(options);
  const t = bind(lang);
  const task = typeof options.task === "string" ? options.task.trim() : "";
  const detection = await detectProject(options.cwd, options.type, options.profiles);
  const allDocs = await loadContentDocs(options.cwd);
  if (allDocs.length === 0) return notInitialized("prepare", "LLM-WIKI Prepare", lang);

  const { kept } = applyFilters(allDocs, { includeSensitive: false });
  const byPath = new Map(kept.map((doc) => [doc.path, doc]));
  const graph = await collectWikiGraph(options.cwd);

  // OR-ish recall: a free-text task sentence rarely has every word in one doc, so
  // rank by any-term relevance (search-docs keeps its default AND semantics).
  const ranked = rankDocsByQuery(kept, task, { requireAll: false }).slice(0, TOP_MATCHES);
  const topPaths = ranked.map((match) => match.path);
  const topDocs = resolveDocs(byPath, topPaths);
  const neighborPaths = neighborsOf(graph, topPaths);
  const neighborDocs = resolveDocs(byPath, neighborPaths);
  const contextDocs = [...topDocs, ...neighborDocs];

  const candidateDomains = contextDocs.filter(isDomainDoc).map((doc) => ({ name: domainName(doc), path: doc.path }));

  const sourceSet = new Set();
  const testSet = new Set();
  for (const doc of topDocs) {
    for (const src of localSources(doc)) {
      if (isTestPath(src)) testSet.add(src);
      else sourceSet.add(src);
    }
  }
  const sources = [...sourceSet].sort().slice(0, MAX_SOURCES);
  const tests = [...testSet].sort().slice(0, MAX_TESTS);

  const contextRefs = contextDocs
    .filter((doc) => CONTEXT_DOC_RE.test(`${title(doc) ?? ""} ${docType(doc) ?? ""}`))
    .map(docRef);

  const invariants = collectInvariants(topDocs);
  const needsReview = topDocs.filter((doc) => status(doc) && status(doc) !== "verified").map((doc) => doc.path);

  // Optional, best-effort working-change overlap — a hint only, never a conclusion.
  let workingOverlap = [];
  try {
    const { changedFiles } = await import("../git.js");
    const changed = new Set(await changedFiles(options.cwd));
    workingOverlap = sources.filter((src) => changed.has(src));
  } catch {
    workingOverlap = [];
  }

  const unknowns = [];
  if (ranked.length === 0) {
    unknowns.push(t("No wiki document strongly matches this task — the area may be undocumented. Explore from docs/llm-wiki/index.md and the source directly.",
      "이 작업과 강하게 매칭되는 위키 문서가 없습니다 — 문서화 안 된 영역일 수 있습니다. docs/llm-wiki/index.md와 소스를 직접 탐색하세요."));
  }
  if (needsReview.length) {
    unknowns.push(t("Some matched docs are needs_review — do not treat them as confirmed fact; verify against the code.",
      "매칭된 문서 일부가 needs_review입니다 — 확정 사실로 보지 말고 코드로 확인하세요."));
  }

  const scopeChecklist = [
    t("Open the candidate source files and confirm the CURRENT behavior before editing (the docs are a map; the code is the source of truth).",
      "수정 전에 후보 소스를 열어 현재 동작을 확인하세요(문서는 지도, 코드가 최종 사실)."),
    t("Find the tests that cover this area — to run before and after the change.", "이 영역을 덮는 테스트를 찾으세요 — 변경 전후 실행용."),
    t("Identify which related wiki docs must be updated in the same change.", "같은 변경에서 갱신해야 할 관련 위키 문서를 파악하세요."),
    t("Confirm the change does not break the invariants the docs record.", "문서가 기록한 불변 조건을 깨지 않는지 확인하세요."),
    t("If the docs conflict with the code, or the scope is larger than expected, stop and confirm with a human before implementing.",
      "문서와 코드가 충돌하거나 범위가 예상보다 크면, 구현 전에 멈추고 사람에게 확인하세요.")
  ];

  const nextStep = [
    t("These are candidates from the wiki + search, not conclusions — verify against the source before changing anything.",
      "위 항목은 위키+검색에서 나온 후보이지 결론이 아닙니다 — 무엇이든 바꾸기 전에 소스로 확인하세요."),
    t("When ready to implement, use the /llm-wiki-feature or /llm-wiki-fix skill (it will read the wiki, make the change, and keep the docs in sync).",
      "구현 준비가 되면 /llm-wiki-feature 또는 /llm-wiki-fix 스킬을 사용하세요(위키를 읽고 변경하고 문서를 동기화합니다).")
  ];

  const summary = [
    `task: ${task || "(empty)"}`,
    `project_type: ${detection.projectType}`,
    `relevant_docs: ${topDocs.length}`,
    `related_docs: ${neighborDocs.length}`,
    `candidate_sources: ${sources.length}`,
    `candidate_tests: ${tests.length}`,
    `needs_review_in_matches: ${needsReview.length}`,
    ...(workingOverlap.length ? [`working_changes_overlap: ${workingOverlap.length}`] : [])
  ];

  const sections = [
    { title: "Summary", body: summary },
    { title: t("Relevant docs (the docs reference these — read them first)", "관련 문서 (문서가 이들을 참조 — 먼저 읽기)"), body: topDocs.length ? topDocs.map(docLine) : [t("(no strong match — see unknowns)", "(강한 매칭 없음 — 미확정 항목 참고)")] },
    { title: t("Related docs (graph neighbors)", "연결 문서 (그래프 이웃)"), body: neighborDocs.length ? neighborDocs.map(docLine) : [t("(none)", "(없음)")] },
    { title: t("Candidate domains", "후보 업무 영역"), body: candidateDomains.length ? candidateDomains.map((d) => `${d.name} — ${d.path}`) : [t("(none matched)", "(매칭 없음)")] },
    { title: t("Candidate source files (referenced by the related docs — verify before editing)", "후보 소스 파일 (관련 문서가 참조 — 수정 전 확인)"), body: sources.length ? sources : [t("(none referenced by the matched docs)", "(매칭 문서가 참조하는 소스 없음)")] },
    { title: t("Candidate test files", "후보 테스트 파일"), body: tests.length ? tests : [t("(none referenced — search the repo's test dir manually)", "(참조된 테스트 없음 — 저장소 테스트 디렉터리를 직접 확인)")] },
    { title: t("Related API / state / screen / config docs", "관련 API·상태·화면·설정 문서"), body: contextRefs.length ? contextRefs.map((r) => `${r.path} — ${r.title ?? "(no title)"}`) : [t("(none obvious among the matches)", "(매칭 중 뚜렷한 항목 없음)")] },
    { title: t("Invariants and risks (as recorded in the docs)", "불변 조건·위험 (문서에 기록된 대로)"), body: invariants.length ? invariants.map((i) => `${i.text}  (${i.path})`) : [t("(none recorded in the matched docs)", "(매칭 문서에 기록된 항목 없음)")] },
    { title: t("Freshness / review warnings", "최신성·검토 경고"), body: needsReview.length ? needsReview.map((p) => t(`${p} — needs_review`, `${p} — needs_review`)) : [t("(matched docs are verified — still confirm against the code)", "(매칭 문서는 verified — 그래도 코드로 확인)")] }
  ];
  if (workingOverlap.length) {
    sections.push({ title: t("In your current working changes (candidate ∩ git changes)", "현재 작업 변경과 겹침 (후보 ∩ git 변경)"), body: workingOverlap });
  }
  sections.push(
    { title: t("Unknowns / to confirm", "미확정·확인 필요"), body: unknowns.length ? unknowns : [t("(nothing flagged — still verify against the source)", "(표시된 항목 없음 — 그래도 소스로 확인)")] },
    { title: t("Scope checklist", "범위 점검표"), body: scopeChecklist },
    { title: t("Next step", "다음 단계"), body: nextStep },
    { title: "Caveats", body: [t("Read-only. Candidates come from the existing wiki + keyword search — the CLI does not conclude that a file is the cause or that a change is safe. Restricted/sensitive docs are excluded; text is redacted.", "읽기 전용. 후보는 기존 위키+키워드 검색에서 나오며 CLI는 특정 파일이 원인이라거나 변경이 안전하다고 단정하지 않습니다. 제한·민감 문서 제외, 텍스트 가림.")] }
  );

  return withText({
    command: "prepare",
    result: "pass",
    initialized: true,
    task,
    projectType: detection.projectType,
    relevantDocs: topDocs.map(docRef),
    relatedDocs: neighborDocs.map(docRef),
    candidateDomains,
    candidateSources: sources,
    candidateTests: tests,
    contextDocs: contextRefs,
    invariants,
    freshnessWarnings: needsReview,
    workingOverlap,
    unknowns,
    scopeChecklist,
    findings: []
  }, "LLM-WIKI Prepare", sections);
}
