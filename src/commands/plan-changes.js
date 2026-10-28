// impact.plan_changed (1.39.0): the reverse of impact.source_changed. That rule
// names the documents to re-read when code they cite changes; this one names the
// code to re-read when an approved plan — a requirement or an architecture decision
// (PLANNED_DOC_TYPES) — changes in the same diff. The link between the two is the
// one the project already writes down: the plan's local source_files and evidence.
//
// What it is not, stated because the output sits next to a pass/fail gate: a
// changed requirement does not show that any linked file is now wrong, and a linked
// file that also changed in this diff does not show that it implements the new
// text. Every entry is a candidate for review, never a verdict, so the rule is info
// by default in every mode (lite included) and never fails a build unless a project
// raises it by name. Read-only; depends on the stdlib, files.js, encoding.js,
// frontmatter.js, git.js and sibling command modules, never on commands.js.
import path from "node:path";
import { pathExists } from "../files.js";
import { readUtf8 } from "../encoding.js";
import { parseFrontmatter } from "../frontmatter.js";
import { fileAtRef, renamedPaths } from "../git.js";
import { isAppendOnlyLog, isTemplateDoc } from "./wiki-files.js";
import { changedAnchorMatcher, isPlannedDoc, localReferencePaths } from "./scans.js";

export const PLAN_CHANGED_RULE = "impact.plan_changed";

// Level-2 sections whose edits do not change what a plan asks for: the review
// record, the evidence list (the links themselves are read from frontmatter), the
// options an ADR rejected, and open questions. Matched on the heading text, case-
// insensitively, and only in the English the generated templates use (the Korean
// templates keep the same headings). Any other heading — a custom one, a translated
// one — counts as meaningful, so an unknown document errs toward being reported.
export const NON_SEMANTIC_PLAN_SECTIONS = new Set([
  "review notes",
  "evidence",
  "alternatives considered",
  "open questions"
]);

const TITLE_KEY = "(title)";
const PREAMBLE_KEY = "(preamble)";

// A plan's comparable parts: the frontmatter title, the text before the first
// level-2 heading (the H1 and any introduction), and each level-2 section with its
// subsections. Whitespace is collapsed, so re-wrapping or re-indenting a paragraph
// is not a change; every other frontmatter field is left out — a review stamp, a
// status, tags, and the evidence list do not change what the plan says. A repeated
// heading is keyed by its occurrence ("evidence #2").
export function planSections(text) {
  const parsed = parseFrontmatter(String(text));
  const body = parsed.frontmatter ? parsed.body : String(text);
  const sections = new Map();
  const title = typeof parsed.frontmatter?.title === "string" ? parsed.frontmatter.title : "";
  sections.set(TITLE_KEY, normalizeText(title));
  let key = PREAMBLE_KEY;
  let lines = [];
  const seen = new Map();
  let fence = null;
  const flush = () => sections.set(key, normalizeText(lines.join("\n")));
  for (const line of body.split(/\r?\n/)) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
    }
    const heading = !fence && !marker ? line.match(/^##\s+(.*?)\s*#*\s*$/) : null;
    if (heading) {
      flush();
      const name = heading[1].trim().toLowerCase();
      const count = (seen.get(name) ?? 0) + 1;
      seen.set(name, count);
      key = count === 1 ? name : `${name} #${count}`;
      lines = [line];
    } else {
      lines.push(line);
    }
  }
  flush();
  return sections;
}

function normalizeText(text) {
  return String(text).replace(/\s+/g, " ").trim();
}

// Section keys whose text differs between two versions, split into the ones that
// change what the plan asks for and the ones that do not. A section present on one
// side only counts as changed, so a renamed heading shows up under both names.
export function changedPlanSections(beforeText, afterText) {
  const before = planSections(beforeText);
  const after = planSections(afterText);
  const meaningful = [];
  const ignored = [];
  for (const key of new Set([...before.keys(), ...after.keys()])) {
    if ((before.get(key) ?? null) === (after.get(key) ?? null)) continue;
    const base = key.replace(/ #\d+$/, "");
    (NON_SEMANTIC_PLAN_SECTIONS.has(base) ? ignored : meaningful).push(key);
  }
  return { meaningful, ignored };
}

// Every approved plan the diff touches: { changedPlans, findings }. `changed` and
// `changedSet` are impactCommand's (repo-relative paths; the anchoring set leaves a
// version-only package.json out, the way impact.source_changed does).
//
// A plan is in scope when it is a planned document and verified on either side of
// the diff, so the usual edit — downgrade, change, approve again — is seen, and a
// draft that was never approved is not. Content comes from <since> (else HEAD) and
// the working tree; a rename is followed to its old path. Entries whose only
// changes are in NON_SEMANTIC_PLAN_SECTIONS stay in changedPlans with
// meaningful: false and produce no finding; so does a plan with no local link,
// which evidence.planned_unlinked already reports.
export async function scanPlanChanges(cwd, { since, changed, changedSet }) {
  let renames = new Map();
  try {
    renames = renamedPaths(cwd, since);
  } catch {
    renames = new Map();
  }
  // The old side of a rename is read through its new path; with diff.renames off,
  // changedFiles lists it as well, and it must not be reported again as deleted.
  const renamedAway = new Set(renames.values());
  const anchorMatches = changedAnchorMatcher(changedSet);
  const changedPlans = [];
  const findings = [];
  for (const relPath of [...changed].sort()) {
    if (!relPath.startsWith("docs/llm-wiki/") || !relPath.endsWith(".md")) continue;
    if (isTemplateDoc(relPath) || isAppendOnlyLog(relPath)) continue;
    if (renamedAway.has(relPath)) continue;
    const renamedFrom = renames.get(relPath) ?? null;
    const beforeText = fileAtRef(cwd, since || "HEAD", renamedFrom ?? relPath);
    let afterText = null;
    try {
      afterText = await readUtf8(path.join(cwd, ...relPath.split("/")));
    } catch {
      afterText = null;
    }
    if (beforeText === null && afterText === null) continue;
    const before = beforeText === null ? null : parseFrontmatter(beforeText).frontmatter;
    const after = afterText === null ? null : parseFrontmatter(afterText).frontmatter;
    if (!isPlannedDoc(before) && !isPlannedDoc(after)) continue;
    if (before?.status !== "verified" && after?.status !== "verified") continue;

    const kind = beforeText === null ? "added" : afterText === null ? "deleted" : renamedFrom ? "renamed" : "modified";
    const sections = kind === "modified" || kind === "renamed"
      ? changedPlanSections(beforeText, afterText)
      : { meaningful: [kind === "added" ? "(new document)" : "(deleted document)"], ignored: [] };
    if (sections.meaningful.length === 0 && sections.ignored.length === 0) continue;

    const references = [...new Set([
      ...(before ? localReferencePaths(before) : []),
      ...(after ? localReferencePaths(after) : [])
    ])];
    const linked = [];
    for (const reference of references) linked.push({ path: reference, change: await linkedChange(cwd, reference, anchorMatches) });

    const entry = {
      path: relPath,
      kind,
      ...(renamedFrom ? { renamedFrom } : {}),
      status: { before: before ? String(before.status ?? "unset") : null, after: after ? String(after.status ?? "unset") : null },
      meaningful: sections.meaningful.length > 0,
      changedSections: sections.meaningful,
      ignoredSections: sections.ignored,
      linked
    };
    changedPlans.push(entry);
    if (entry.meaningful && linked.length > 0) findings.push(planChangedFinding(entry));
  }
  return { changedPlans, findings };
}

// changed / unchanged in this diff, missing (absent from the working tree, whether
// this diff deleted it or it never existed), or uncertain (a pattern or a path
// outside the repository, which cannot be matched against the change set).
async function linkedChange(cwd, reference, anchorMatches) {
  const normalized = path.posix.normalize(reference);
  if (/[*?[\]]/.test(reference) || normalized === ".." || normalized.startsWith("../") || path.isAbsolute(reference)) {
    return "uncertain";
  }
  if (!(await pathExists(path.join(cwd, ...normalized.split("/"))))) return "missing";
  return anchorMatches(normalized) || anchorMatches(reference) ? "changed" : "unchanged";
}

function planChangedFinding(entry) {
  const list = (change) => {
    const paths = entry.linked.filter((link) => link.change === change).map((link) => link.path);
    return paths.length ? paths.join(", ") : "none";
  };
  const params = {
    sections: entry.changedSections.join(", "),
    unchanged: list("unchanged"),
    changed: list("changed"),
    missing: [list("missing"), list("uncertain")].filter((value) => value !== "none").join(", ") || "none"
  };
  return {
    severity: "info",
    rule: PLAN_CHANGED_RULE,
    path: entry.path,
    message: `Approved plan changed in this diff (${params.sections}). Re-check the files it links — unchanged in this diff: ${params.unchanged}; changed in this diff: ${params.changed}; missing or unresolvable: ${params.missing}. This names candidates for review; it does not show that any file satisfies or violates the plan.`,
    params
  };
}
