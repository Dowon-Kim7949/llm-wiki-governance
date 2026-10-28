// impact.plan_changed (1.39.0): when an approved requirement or decision changes in
// a diff, impact names the local files it links and says whether each changed in
// the same diff. Info in every mode, never a verdict. One test per row of the
// behavior table in docs/llm-wiki/PUBLIC_API.md (impact), plus the contracts the
// existing rule must keep: impact.source_changed, the JSON keys, the text output of
// a run with no plan in it.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { impactCommand } from "../src/commands.js";
import { changedPlanSections, planSections } from "../src/commands/plan-changes.js";
import { FINDING_EXPLANATIONS } from "../src/commands/findings.js";
import { localizeFinding } from "../src/i18n.js";
import { normalizeOptions, resolveOptions } from "../src/index.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const frontmatter = ({ title, docType, status = "verified", evidence = [] }) => [
  "---", `title: ${title}`, "tags:", "  - llm-wiki", `  - ${status === "verified" ? "verified" : "needs-review"}`,
  `status: ${status}`, `doc_type: ${docType}`, "project: plans", "last_updated: 2026-02-01",
  "author: cli-generated", "last_edited_by: t", "reviewed_by: t", "reviewed_at: 2026-02-01",
  "wiki_block_version: v1", "source_files: []",
  ...(evidence.length ? ["evidence:", ...evidence.map((entry) => `  - ${entry}`)] : []),
  "related:", "  - docs/llm-wiki/index.md", "visibility: internal", "contains_sensitive_info: false", "---", ""
].join("\n");

const REQ = "docs/llm-wiki/requirements/REQ-001-login.md";
const ADR = "docs/llm-wiki/decisions/ADR-0001-sessions.md";
const REQ_LINKS = ["src/login.ts", "src/session.ts", "tests/login.test.ts"];

const requirement = (overrides = {}) => frontmatter({ title: "REQ-001: Login", docType: "requirement", evidence: REQ_LINKS, ...overrides }) + [
  "# REQ-001: Login", "",
  "## Requirement", "", "- A registered user can sign in with email and password.", "",
  "## Acceptance Criteria", "", "- AC-1: A correct password opens a session.", "- AC-2: A wrong password shows an error.", "",
  "## Constraints", "", "- Sign-in answers within 1 second.", "",
  "## Related Decisions", "", "- ADR-0001", "",
  "## Evidence", "", ...REQ_LINKS.map((link) => `- ${link}`), "",
  "## Open Questions", "", "- None.", "",
  "## Review Notes", "", "- Approved by the owner.", ""
].join("\n");

const decision = (overrides = {}) => frontmatter({ title: "ADR-0001: Server sessions", docType: "decision", evidence: ["src/session.ts"], ...overrides }) + [
  "# ADR-0001: Server sessions", "",
  "## Decision Status", "", "- Accepted", "",
  "## Context", "", "- Sign-in needs a session.", "",
  "## Decision", "", "- Sessions live on the server.", "",
  "## Alternatives Considered", "", "- JWT in local storage: rejected.", "",
  "## Consequences", "", "- Logout is immediate.", "",
  "## Evidence", "", "- src/session.ts", "",
  "## Review Notes", "", "- Approved.", ""
].join("\n");

// A committed base with one requirement, one ADR, the files they link, and an
// ordinary verified document citing src/login.ts (the impact.source_changed side).
async function planRepo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-plan-changed-"));
  const files = {
    "package.json": "{}\n",
    "src/login.ts": "export const login = () => true;\n",
    "src/session.ts": "export const session = {};\n",
    "tests/login.test.ts": "// login tests\n",
    [REQ]: requirement(),
    [ADR]: decision(),
    "docs/llm-wiki/api.md": frontmatter({ title: "API", docType: "public_api", evidence: ["src/login.ts"] }) + "# API\n\n## Evidence\n\n- src/login.ts\n"
  };
  for (const [rel, text] of Object.entries(files)) await put(cwd, rel, text);
  const git = (args) => execFileSync("git", ["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@e", "-c", "core.autocrlf=false", ...args], {
    cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"]
  });
  git(["init", "-q"]);
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "base"]);
  const base = git(["rev-parse", "HEAD"]).trim();
  const commit = () => {
    git(["add", "-A"]);
    git(["commit", "-q", "--allow-empty", "-m", "change"]);
  };
  return { cwd, git, base, commit };
}

async function put(cwd, rel, text) {
  const file = path.join(cwd, ...rel.split("/"));
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, { encoding: "utf8" });
}

async function replaceIn(cwd, rel, from, to) {
  const file = path.join(cwd, ...rel.split("/"));
  const text = await readFile(file, "utf8");
  assert.ok(text.includes(from), `fixture: ${rel} must contain ${JSON.stringify(from)}`);
  await writeFile(file, text.replace(from, to), { encoding: "utf8" });
}

async function impact(repo, extra = {}) {
  repo.commit();
  return impactCommand(normalizeOptions({ cwd: repo.cwd, since: repo.base, ...extra }));
}

const planFindings = (result) => result.findings.filter((finding) => finding.rule === "impact.plan_changed");
const linkMap = (plan) => Object.fromEntries(plan.linked.map((link) => [link.path, link.change]));

test("a changed acceptance criterion names every linked file and whether it changed in this diff", { skip: !hasGit() && "git not available" }, async () => {
  const repo = await planRepo();
  await replaceIn(repo.cwd, REQ, "AC-2: A wrong password shows an error.", "AC-2: Three wrong passwords lock the account.");
  await replaceIn(repo.cwd, "src/login.ts", "true", "false");
  const result = await impact(repo);

  assert.equal(result.result, "fail", "guard: impact.source_changed still fails the build for api.md");
  assert.deepEqual(result.impactedDocuments, [{ path: "docs/llm-wiki/api.md", sources: ["src/login.ts"] }], "impact.source_changed is unchanged");
  assert.deepEqual(result.changedPlans, [{
    path: REQ,
    kind: "modified",
    status: { before: "verified", after: "verified" },
    meaningful: true,
    changedSections: ["acceptance criteria"],
    ignoredSections: [],
    linked: [
      { path: "src/login.ts", change: "changed" },
      { path: "src/session.ts", change: "unchanged" },
      { path: "tests/login.test.ts", change: "unchanged" }
    ]
  }]);
  const [finding] = planFindings(result);
  assert.equal(finding.severity, "info");
  assert.equal(finding.path, REQ);
  assert.match(finding.message, /unchanged in this diff: src\/session\.ts, tests\/login\.test\.ts; changed in this diff: src\/login\.ts/);
  assert.match(finding.message, /does not show that any file satisfies or violates the plan/);
  assert.match(result.text, /changed_plans: 1 \(docs\/llm-wiki\/requirements\/REQ-001-login\.md\)/);
  assert.match(result.text, /## Plans changed — linked files to re-check/);
});

test("every linked file changing in the same diff is still reported, and not as done", { skip: !hasGit() && "git not available" }, async () => {
  const repo = await planRepo();
  await replaceIn(repo.cwd, REQ, "within 1 second", "within 300 ms");
  for (const rel of REQ_LINKS) await put(repo.cwd, rel, `// rewritten ${rel}\n`);
  const result = await impact(repo);
  const [plan] = result.changedPlans;
  assert.deepEqual(Object.values(linkMap(plan)), ["changed", "changed", "changed"]);
  const [finding] = planFindings(result);
  assert.match(finding.message, /unchanged in this diff: none; changed in this diff: src\/login\.ts, src\/session\.ts, tests\/login\.test\.ts/);
  assert.match(result.text, /does not show it implements the change/);
});

test("non-semantic sections, frontmatter, stamps and whitespace do not count", { skip: !hasGit() && "git not available" }, async () => {
  // Review Notes and Open Questions of the requirement, Alternatives Considered of
  // the ADR: listed as not counted, no finding.
  const notes = await planRepo();
  await replaceIn(notes.cwd, REQ, "- Approved by the owner.", "- Approved by the owner after a second read.");
  await replaceIn(notes.cwd, REQ, "## Open Questions\n\n- None.", "## Open Questions\n\n- Do we need SSO later?");
  await replaceIn(notes.cwd, ADR, "JWT in local storage: rejected.", "JWT in local storage: rejected for XSS exposure.");
  const listed = await impact(notes);
  assert.deepEqual(planFindings(listed), []);
  assert.deepEqual(listed.changedPlans.map((plan) => [plan.path, plan.meaningful, plan.ignoredSections]), [
    [ADR, false, ["alternatives considered"]],
    [REQ, false, ["open questions", "review notes"]]
  ]);
  assert.match(listed.text, /changed_plans: 0; not counted: 2/);

  // Only the frontmatter evidence list, only the review stamp, only whitespace.
  const quiet = await planRepo();
  await replaceIn(quiet.cwd, REQ, "  - tests/login.test.ts\n", "  - tests/login.test.ts\n  - tests/login.e2e.ts\n");
  await replaceIn(quiet.cwd, ADR, "reviewed_at: 2026-02-01", "reviewed_at: 2026-03-01");
  await replaceIn(quiet.cwd, ADR, "- Sessions live on the server.", "-   Sessions live\n    on the server.");
  const silent = await impact(quiet);
  assert.deepEqual(silent.changedPlans, []);
  assert.doesNotMatch(silent.text, /changed_plans|Plans changed/, "a run with no plan change prints what it printed before");
});

test("ADR status, Related Decisions and a custom heading are meaningful", { skip: !hasGit() && "git not available" }, async () => {
  const repo = await planRepo();
  await replaceIn(repo.cwd, ADR, "## Decision Status\n\n- Accepted", "## Decision Status\n\n- Superseded by ADR-0002");
  await replaceIn(repo.cwd, REQ, "- ADR-0001", "- ADR-0001\n- ADR-0002");
  await replaceIn(repo.cwd, REQ, "## Evidence", "## 보안 고려사항\n\n- 비밀번호는 로그에 남기지 않는다.\n\n## Evidence");
  const result = await impact(repo);
  assert.deepEqual(result.changedPlans.map((plan) => [plan.path, plan.changedSections]), [
    [ADR, ["decision status"]],
    [REQ, ["related decisions", "보안 고려사항"]]
  ]);
  assert.equal(planFindings(result).length, 2);
});

test("added, deleted and renamed plans", { skip: !hasGit() && "git not available" }, async () => {
  const added = await planRepo();
  await put(added.cwd, "docs/llm-wiki/requirements/REQ-002-logout.md", requirement({ title: "REQ-002: Logout" }).replace("REQ-001: Login", "REQ-002: Logout"));
  await put(added.cwd, "docs/llm-wiki/requirements/REQ-003-draft.md", requirement({ title: "REQ-003: Draft", status: "needs_review" }));
  const addedResult = await impact(added);
  assert.deepEqual(addedResult.changedPlans.map((plan) => [plan.path, plan.kind, plan.changedSections]), [
    ["docs/llm-wiki/requirements/REQ-002-logout.md", "added", ["(new document)"]]
  ], "an approved new plan is listed; a new draft is not");

  const deleted = await planRepo();
  await rm(path.join(deleted.cwd, ...REQ.split("/")));
  await rm(path.join(deleted.cwd, "src", "session.ts"));
  const deletedResult = await impact(deleted);
  const [gone] = deletedResult.changedPlans;
  assert.equal(gone.kind, "deleted");
  assert.deepEqual(gone.status, { before: "verified", after: null });
  assert.deepEqual(linkMap(gone), { "src/login.ts": "unchanged", "src/session.ts": "missing", "tests/login.test.ts": "unchanged" });

  const moved = await planRepo();
  moved.git(["mv", REQ, "docs/llm-wiki/requirements/REQ-001-sign-in.md"]);
  assert.deepEqual((await impact(moved)).changedPlans, [], "a rename alone changes nothing the plan says");

  const movedAndEdited = await planRepo();
  movedAndEdited.git(["mv", REQ, "docs/llm-wiki/requirements/REQ-001-sign-in.md"]);
  await replaceIn(movedAndEdited.cwd, "docs/llm-wiki/requirements/REQ-001-sign-in.md", "AC-1: A correct password opens a session.", "AC-1: A correct password opens a session and records the time.");
  const [renamed] = (await impact(movedAndEdited)).changedPlans;
  assert.equal(renamed.kind, "renamed");
  assert.equal(renamed.renamedFrom, REQ);
  assert.deepEqual(renamed.changedSections, ["acceptance criteria"]);
});

test("drafts, plans without links, and references that cannot be matched", { skip: !hasGit() && "git not available" }, async () => {
  // A plan downgraded for editing is still an approved plan being changed; one that
  // was never approved is not reported.
  const downgraded = await planRepo();
  await replaceIn(downgraded.cwd, REQ, "status: verified", "status: needs_review");
  await replaceIn(downgraded.cwd, REQ, "AC-1: A correct password", "AC-1: A correct password or passkey");
  const [plan] = (await impact(downgraded)).changedPlans;
  assert.deepEqual(plan.status, { before: "verified", after: "needs_review" });

  const draft = await planRepo();
  await put(draft.cwd, "docs/llm-wiki/requirements/REQ-009-draft.md", requirement({ title: "REQ-009", status: "needs_review" }));
  draft.commit();
  const draftBase = draft.git(["rev-parse", "HEAD"]).trim();
  await replaceIn(draft.cwd, "docs/llm-wiki/requirements/REQ-009-draft.md", "AC-1", "AC-1 (draft)");
  draft.commit();
  const draftResult = await impactCommand(normalizeOptions({ cwd: draft.cwd, since: draftBase }));
  assert.deepEqual(draftResult.changedPlans, []);

  // No local link: listed, no finding (evidence.planned_unlinked covers it).
  const unlinked = await planRepo();
  await put(unlinked.cwd, "docs/llm-wiki/decisions/ADR-0002-db.md", decision({ title: "ADR-0002", evidence: [] }));
  unlinked.commit();
  const unlinkedBase = unlinked.git(["rev-parse", "HEAD"]).trim();
  await replaceIn(unlinked.cwd, "docs/llm-wiki/decisions/ADR-0002-db.md", "Sessions live on the server.", "Sessions live in the database.");
  unlinked.commit();
  const unlinkedResult = await impactCommand(normalizeOptions({ cwd: unlinked.cwd, since: unlinkedBase }));
  assert.deepEqual(unlinkedResult.changedPlans.map((entry) => [entry.path, entry.meaningful, entry.linked]), [["docs/llm-wiki/decisions/ADR-0002-db.md", true, []]]);
  assert.deepEqual(planFindings(unlinkedResult), []);

  // A glob and a path outside the repository cannot be matched to the change set.
  const odd = await planRepo();
  await replaceIn(odd.cwd, ADR, "  - src/session.ts\n", "  - src/session.ts\n  - src/*.ts\n  - ../outside.ts\n");
  await replaceIn(odd.cwd, ADR, "- Sessions live on the server.", "- Sessions live on the server, in memory.");
  const [oddPlan] = (await impact(odd)).changedPlans;
  assert.deepEqual(linkMap(oddPlan), { "src/session.ts": "unchanged", "src/*.ts": "uncertain", "../outside.ts": "uncertain" });
});

test("lite runs it, off silences it, and a project can raise it", { skip: !hasGit() && "git not available" }, async () => {
  const configured = async (config) => {
    const repo = await planRepo();
    await put(repo.cwd, "llm-wiki.config.json", `${JSON.stringify(config)}\n`);
    repo.commit();
    const base = repo.git(["rev-parse", "HEAD"]).trim();
    await replaceIn(repo.cwd, REQ, "AC-1: A correct password", "AC-1: A correct password or passkey");
    await replaceIn(repo.cwd, "src/login.ts", "true", "false");
    repo.commit();
    const { options, errors } = await resolveOptions({ cwd: repo.cwd, since: base, agents: [], profiles: [] });
    assert.deepEqual(errors, []);
    return impactCommand(options);
  };

  const lite = await configured({ governance: { mode: "lite" } });
  assert.equal(lite.result, "pass", "info never fails a build, and lite switches impact.source_changed off");
  assert.deepEqual(lite.impactedDocuments, []);
  assert.equal(planFindings(lite).length, 1);
  assert.equal(planFindings(lite)[0].severity, "info");

  const strictInfo = await configured({ governance: { mode: "strict" }, strict: true, rules: { "impact.source_changed": "off" } });
  assert.equal(strictInfo.result, "pass", "still info under strict with --strict");

  const off = await configured({ governance: { mode: "lite" }, rules: { "impact.plan_changed": "off" } });
  assert.deepEqual(off.changedPlans, []);
  assert.deepEqual(planFindings(off), []);

  const raised = await configured({ governance: { mode: "lite" }, rules: { "impact.plan_changed": "error" } });
  assert.equal(raised.result, "fail", "an explicit rule entry can make it blocking");
});

test("an invalid baseline reports impact.unavailable and an empty changedPlans", { skip: !hasGit() && "git not available" }, async () => {
  const repo = await planRepo();
  const result = await impactCommand(normalizeOptions({ cwd: repo.cwd, since: "no-such-ref" }));
  assert.equal(result.findings[0].rule, "impact.unavailable");
  assert.deepEqual(result.changedPlans, []);
});

test("section parsing: preamble, title, repeated headings, fenced code", () => {
  const text = frontmatter({ title: "T", docType: "requirement" }) + [
    "# T", "", "Intro.", "",
    "## Acceptance Criteria", "", "- AC-1", "",
    "```md", "## Not a heading", "```", "",
    "## Evidence", "", "- a", "",
    "## Evidence", "", "- b", ""
  ].join("\n");
  assert.deepEqual([...planSections(text).keys()], ["(title)", "(preamble)", "acceptance criteria", "evidence", "evidence #2"]);
  assert.deepEqual(changedPlanSections(text, text.replace("title: T", "title: T2")), { meaningful: ["(title)"], ignored: [] });
  assert.deepEqual(changedPlanSections(text, text.replace("## Not a heading", "## Still not")), { meaningful: ["acceptance criteria"], ignored: [] });
});

test("the rule is registered, info by default, and localized", () => {
  assert.equal(FINDING_EXPLANATIONS["impact.plan_changed"].defaultSeverity, "info");
  const ko = localizeFinding({
    severity: "info", rule: "impact.plan_changed", path: REQ, message: "x",
    params: { sections: "acceptance criteria", unchanged: "src/a.ts", changed: "none", missing: "none" }
  }, "ko");
  assert.match(ko.message, /승인된 계획이 이번 diff에서 바뀌었습니다\(acceptance criteria\)/);
  assert.match(ko.message, /이번 diff에서 안 바뀜: src\/a\.ts/);
});
