// The scan* family: the validation checks that audit/validate/status compose
// into findings, extracted from commands.js on 2026-07-16 (behavior-preserving
// refactor, GATE_REVIEW stabilization). Each scan reads wiki docs and returns a
// findings array (category.subrule shape); driftTargets is pure and exported for
// unit tests. Depends only on the Node stdlib, files.js, encoding.js,
// frontmatter.js, sensitive-info.js, git.js, and the sibling command modules
// (wiki-files, adapters, wiki-graph, references, governance-mode); no
// back-dependency on commands.js.
import path from "node:path";
import { listMarkdownFiles, pathExists, toPosix } from "../files.js";
import { findMojibakeIndicators, hasUtf8Bom, readTextAuto, readUtf8 } from "../encoding.js";
import { parseFrontmatter } from "../frontmatter.js";
import { scanSensitiveInfo } from "../sensitive-info.js";
import { commitAtEndOf, fileAtRef, fileAtRefFromCwd, fileChangedSince, lastCommitTouchingKey, lineRangeChangedBetween, lineRangeChangedSince, pathsChangedSince } from "../git.js";
import { isAppendOnlyLog, isTemplateDoc, listTargetMarkdown, listWikiContentDocs } from "./wiki-files.js";
import { ADAPTER_TARGETS } from "./adapters.js";
import { collectWikiGraph } from "./wiki-graph.js";
import { DECISION_DOC_TYPES } from "./governance-mode.js";
import {
  escapeRegex,
  extractMarkdownLinkTargets,
  extractMarkdownSection,
  getLineCount,
  isExternalSourceReference,
  isSkippedMarkdownLink,
  normalizeMarkdownLinkTarget,
  parseEvidenceReference,
  resolveMarkdownLinkTarget
} from "./references.js";

export async function scanEncoding(cwd) {
  const findings = [];
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const mojibake = findMojibakeIndicators(content);
    if (hasUtf8Bom(content)) {
      findings.push({ severity: "info", rule: "encoding.bom", path: rel, message: "UTF-8 BOM detected." });
    }
    if (mojibake.length) {
      findings.push({ severity: "blocked", rule: "encoding.mojibake", path: rel, message: "Mojibake indicators detected; automatic rewrite skipped." });
    }
  }
  return findings;
}

export async function scanSensitive(cwd) {
  const findings = [];
  const markdownFiles = await listTargetMarkdown(cwd);
  const adapterFiles = [];
  for (const target of Object.values(ADAPTER_TARGETS)) {
    const file = path.join(cwd, target.path);
    if (await pathExists(file)) adapterFiles.push(file);
  }

  for (const file of [...markdownFiles, ...adapterFiles]) {
    if (!(await pathExists(file))) continue;
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    for (const finding of scanSensitiveInfo(content)) {
      findings.push({
        severity: "blocked",
        rule: "sensitive.redacted",
        path: `${rel}:${finding.line}`,
        message: `${finding.type}: ${finding.message}`
      });
    }
  }
  return findings;
}

export async function scanSourceFiles(cwd) {
  const findings = [];
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const sourceFiles = parsed.frontmatter?.source_files;

    if (!Array.isArray(sourceFiles)) continue;

    for (const sourceFile of sourceFiles) {
      if (typeof sourceFile !== "string") continue;

      const source = sourceFile.trim();
      if (!source || isExternalSourceReference(source)) continue;

      if (!(await pathExists(path.join(cwd, source)))) {
        // A locator here is the common cause of this finding reading as nonsense:
        // the file exists, only the `#…` suffix does not. source_files is the
        // broad anchor by contract, so the fix is to move the locator to
        // `evidence` — say that instead of insisting a real file is missing.
        const hash = source.indexOf("#");
        const located = hash > 0 && await pathExists(path.join(cwd, source.slice(0, hash)));
        findings.push({
          severity: "warning",
          rule: "source_files.missing",
          path: rel,
          message: located
            ? `source_files entry carries a locator: ${source}. source_files takes bare paths (the whole file backs the document); move the locator to evidence, where a line range also narrows the freshness check.`
            : `source_files entry does not exist: ${source}.`,
          params: { source }
        });
      }
    }
  }
  return findings;
}

export async function scanRelatedReferences(cwd) {
  const findings = [];
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const related = parsed.frontmatter?.related;

    if (!Array.isArray(related)) continue;

    for (const relatedEntry of related) {
      if (typeof relatedEntry !== "string") continue;

      const target = relatedEntry.trim();
      if (!target || isExternalSourceReference(target)) continue;

      if (!(await pathExists(path.join(cwd, target)))) {
        findings.push({
          severity: "warning",
          rule: "related.missing",
          path: rel,
          message: `related entry does not exist: ${target}.`,
          params: { target }
        });
      }
    }
  }
  return findings;
}

export const ENRICHMENT_PLACEHOLDER_SENTINELS = [
  "Concise summary: describe",
  "Add file paths, symbols, routes, commands, or test names inspected",
  "Add source files and commands inspected while completing",
  "Add source files, tests, routes, and client modules inspected",
  "Track unclear ownership",
  "Keep uncertain claims here until source evidence",
  "List each domain, owner area",
  "이 프로젝트에서 해당 주제의 기준 정보를 정리합니다.",
  "이 문서는 `llm-wiki init --write`가 생성한 초안입니다."
];

export async function scanEnrichment(cwd) {
  const findings = [];
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    if (rel.includes("/templates/")) continue;

    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const body = parsed.frontmatter ? parsed.body : content;

    if (ENRICHMENT_PLACEHOLDER_SENTINELS.some((sentinel) => body.includes(sentinel))) {
      findings.push({
        severity: "warning",
        rule: "content.not_enriched",
        path: rel,
        message: "Document still contains generated placeholder guidance and has not been enriched with source-backed content yet.",
        // Additive per-doc checklist (P5): which sections still hold placeholder
        // text, so `next` can tell an agent WHAT to fill and WHERE.
        checklist: enrichmentChecklist(body)
      });
    }
  }
  return findings;
}

// The trimmed text of a `## ` line, or null when the line is not one: what
// /^##\s+(.+?)\s*$/.exec(line)?.[1].trim() returned, in one pass. That regex grew
// `.+?` one character at a time and re-ran `\s*$` over the following whitespace at
// every step, so "## x", 50,000 spaces and "y" took seconds — and a document reaches
// this through default validate as soon as it carries a placeholder sentence.
const LINE_TERMINATOR_CHARS = new Set(["\n", "\r", "\u2028", "\u2029"]);

export function sectionHeadingText(line) {
  const isSpace = (ch) => /\s/.test(ch);
  if (!line.startsWith("##") || line.length < 3 || !isSpace(line[2])) return null;
  let start = 2;
  while (start < line.length && isSpace(line[start])) start += 1;
  let end = line.length;
  while (end > start && isSpace(line[end - 1])) end -= 1;
  if (start < end) {
    // `.` cannot cross a line terminator, and only the text between the leading and
    // trailing whitespace can be the captured part.
    for (let i = start; i < end; i++) if (LINE_TERMINATOR_CHARS.has(line[i])) return null;
    return line.slice(start, end);
  }
  // Whitespace only: `\s+` gives back one character so `.+?` can take one that is
  // not a line terminator; the captured text trims to "".
  for (let i = 3; i < line.length; i++) if (!LINE_TERMINATOR_CHARS.has(line[i])) return "";
  return null;
}

// P5: for a document body, list the `##` sections that still contain generated
// placeholder guidance, so `next`/`handoff` can point an agent at WHAT to fill
// and WHERE. Splits on level-2 headings; a section is "to fill" when it still
// contains one of the ENRICHMENT_PLACEHOLDER_SENTINELS. Returns deduped (one per
// section, in document order) { section, hint } items where hint is the trimmed
// placeholder line. Pure; frontmatter is expected to be stripped by the caller.
export function enrichmentChecklist(body) {
  const items = [];
  const seen = new Set();
  let currentSection = "(intro)";
  for (const line of String(body).split(/\r?\n/)) {
    const heading = sectionHeadingText(line);
    if (heading !== null) {
      currentSection = heading;
      continue;
    }
    if (seen.has(currentSection)) continue;
    if (!ENRICHMENT_PLACEHOLDER_SENTINELS.some((sentinel) => line.includes(sentinel))) continue;
    seen.add(currentSection);
    const hint = line.trim().replace(/^[-*]\s+/, "").slice(0, 100);
    items.push({ section: currentSection, hint });
  }
  return items;
}

export const THIN_BODY_MIN_WORDS = 25;

// Opt-in enrichment lint (content.thin_body): flags wiki content documents whose
// body has very little prose — stubs that were started but never developed. It is
// registered in FINDING_EXPLANATIONS but INERT by default; it only produces
// findings when a project enables it via config `rules` (e.g.
// "content.thin_body": "warning"). This is the canonical rule that dogfoods the
// rule-toggle machinery. Placeholder docs are left to content.not_enriched.
export async function scanThinBody(cwd, options) {
  const setting = options && options.rules && options.rules["content.thin_body"];
  if (!setting || setting === "off") return [];
  const findings = [];
  for (const file of await listWikiContentDocs(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    if (isAppendOnlyLog(rel)) continue;
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const body = parsed.frontmatter ? parsed.body : content;
    if (ENRICHMENT_PLACEHOLDER_SENTINELS.some((sentinel) => body.includes(sentinel))) continue;
    const words = bodyProseWordCount(body);
    if (words < THIN_BODY_MIN_WORDS) {
      findings.push({
        severity: "warning",
        rule: "content.thin_body",
        path: rel,
        message: `Document body has only ${words} word${words === 1 ? "" : "s"} of prose (min ${THIN_BODY_MIN_WORDS}); enrich it with source-backed content.`,
        params: { words, min: THIN_BODY_MIN_WORDS }
      });
    }
  }
  return findings;
}

// Rough "is this a real document yet" word count: body prose only, ignoring
// markdown headings, blank lines, and horizontal rules (frontmatter is already
// stripped by the caller).
export function bodyProseWordCount(body) {
  return String(body)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line !== "---")
    .join(" ")
    .split(/\s+/)
    .filter(Boolean).length;
}

// Opt-in visibility-consistency lints (1.9, GATE_REVIEW Gate 14) that reuse the
// sensitive-info scan. Both are registered in FINDING_EXPLANATIONS but INERT by
// default; each runs only when enabled via config `rules`:
//   visibility.public_sensitive  — a `visibility: public` doc with sensitive content.
//   visibility.declared_mismatch — a `contains_sensitive_info: false` doc with it.
// Read-only and warning-level; the sensitive value is NEVER included in the finding
// (only a redacted count). Access control is out of scope — value-vs-content only.
export async function scanVisibilityConsistency(cwd, options) {
  const rules = (options && options.rules) || {};
  const wantPublic = Boolean(rules["visibility.public_sensitive"]) && rules["visibility.public_sensitive"] !== "off";
  const wantDeclared = Boolean(rules["visibility.declared_mismatch"]) && rules["visibility.declared_mismatch"] !== "off";
  if (!wantPublic && !wantDeclared) return [];
  const findings = [];
  for (const file of await listWikiContentDocs(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    if (isAppendOnlyLog(rel)) continue;
    const content = await readUtf8(file);
    const sensitive = scanSensitiveInfo(content);
    if (sensitive.length === 0) continue;
    const frontmatter = parseFrontmatter(content).frontmatter || {};
    const at = `${rel}:${sensitive[0].line}`;
    if (wantPublic && frontmatter.visibility === "public") {
      findings.push({
        severity: "warning",
        rule: "visibility.public_sensitive",
        path: at,
        message: `Public document has ${sensitive.length} sensitive-looking value(s); values omitted. Redact them or lower visibility.`,
        params: { count: sensitive.length }
      });
    }
    if (wantDeclared && frontmatter.contains_sensitive_info === false) {
      findings.push({
        severity: "warning",
        rule: "visibility.declared_mismatch",
        path: at,
        message: `Document declares contains_sensitive_info: false but ${sensitive.length} sensitive-looking value(s) were found; values omitted.`,
        params: { count: sensitive.length }
      });
    }
  }
  return findings;
}

export async function scanEvidenceReferences(cwd, options = {}) {
  const findings = [];
  const lineCountByPath = new Map();
  const contentByPath = new Map();
  const strictSeverity = evidenceStrictSeverity(options);

  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const evidence = parsed.frontmatter?.evidence;

    if (!Array.isArray(evidence)) continue;

    for (const item of evidence) {
      if (typeof item !== "string") continue;

      const reference = item.trim();
      const evidenceReference = parseEvidenceReference(reference);
      if (!evidenceReference) {
        findings.push({
          severity: "error",
          rule: "evidence.shape",
          path: rel,
          message: `Invalid evidence reference: ${reference || "(empty)"}.`,
          params: { reference: reference || "(empty)" }
        });
        continue;
      }

      if (evidenceReference.external) continue;

      const absoluteSourcePath = path.join(cwd, evidenceReference.source);
      if (!(await pathExists(absoluteSourcePath))) {
        findings.push({
          severity: strictSeverity,
          rule: "evidence.missing",
          path: rel,
          message: `Evidence source does not exist: ${evidenceReference.source}.`,
          params: { source: evidenceReference.source }
        });
        continue;
      }

      if (evidenceReference.locator?.kind === "line") {
        const lineCount = await getLineCount(absoluteSourcePath, lineCountByPath);
        if (evidenceReference.locator.end > lineCount) {
          findings.push({
            severity: strictSeverity,
            rule: "evidence.line_range",
            path: rel,
            message: `Evidence line range is outside ${evidenceReference.source}: ${evidenceReference.locator.start}-${evidenceReference.locator.end} (file has ${lineCount} line${lineCount === 1 ? "" : "s"}).`,
            params: { source: evidenceReference.source, start: evidenceReference.locator.start, end: evidenceReference.locator.end, lineCount }
          });
        }
      } else if (evidenceReference.locator?.kind === "symbol") {
        // Gate 25: conservative target-existence check. Flag ONLY when the file
        // mentions NONE of the referenced symbol name(s) (a `·`/`,`/`/`-joined
        // value is a list) as a word-boundary token. If the file mentions any of
        // them we do not flag — a floor ("the file does not even mention this
        // symbol"), not an AST resolver, chosen to avoid false positives.
        const content = await readSourceCached(absoluteSourcePath, contentByPath);
        if (content !== null && !symbolPresent(content, evidenceReference.locator.value)) {
          findings.push({
            severity: strictSeverity,
            rule: "evidence.symbol_unverified",
            path: rel,
            message: `Evidence symbol is not mentioned in ${evidenceReference.source}: ${evidenceReference.locator.value}.`,
            params: { source: evidenceReference.source, value: evidenceReference.locator.value }
          });
        }
      } else if (evidenceReference.locator?.kind === "section" && evidenceReference.source.toLowerCase().endsWith(".md")) {
        // Gate 25: section existence for Markdown sources only (v1). Flag when no
        // heading contains the section name (headings may carry extra suffixes).
        const content = await readSourceCached(absoluteSourcePath, contentByPath);
        if (content !== null && !sectionPresent(content, evidenceReference.locator.value)) {
          findings.push({
            severity: strictSeverity,
            rule: "evidence.section_unverified",
            path: rel,
            message: `Evidence section heading is not found in ${evidenceReference.source}: ${evidenceReference.locator.value}.`,
            params: { source: evidenceReference.source, value: evidenceReference.locator.value }
          });
        }
      }
    }
  }

  return findings;
}

// Read a source file once (BOM-aware), caching by path; null on any read error
// so the evidence existence checks stay best-effort (never throw on a bad file).
async function readSourceCached(absolutePath, cache) {
  if (cache.has(absolutePath)) return cache.get(absolutePath);
  let content = null;
  try {
    content = await readTextAuto(absolutePath);
  } catch {
    content = null;
  }
  cache.set(absolutePath, content);
  return content;
}

// Split a `#symbol:` value into candidate names. Evidence commonly joins related
// symbols with a middle dot (`A·B`) or comma/slash/plus; each part is a name.
function splitSymbolNames(value) {
  return value
    .split(/[·,/+&()\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

// True if the file mentions ANY of the referenced symbol names as a word-boundary
// token (conservative: presence, not definition). Empty name list → true (nothing
// to check, so never flagged).
function symbolPresent(content, value) {
  const names = splitSymbolNames(value);
  if (names.length === 0) return true;
  return names.some((name) => {
    try {
      return new RegExp(`\\b${escapeRegex(name)}\\b`).test(content);
    } catch {
      return content.includes(name);
    }
  });
}

// True if any Markdown heading's text contains the section name (case-insensitive),
// so a heading with a trailing suffix like "(accepted 2026-07-21)" still matches.
function sectionPresent(content, value) {
  const target = value.toLowerCase().trim();
  if (!target) return true;
  for (const line of content.split(/\r?\n/)) {
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading && heading[1].toLowerCase().includes(target)) return true;
  }
  return false;
}

// A frontmatter evidence entry counts as "mentioned" in the body ## Evidence
// section if the section contains it verbatim OR — for a local reference — names
// the same source PATH. This makes locator format irrelevant: an editor/grep
// style `path:60-70` in the body satisfies a `path#L60-L70` frontmatter entry
// (and vice versa), and a `#symbol:`/`#section:` locator matches a plain path
// mention. External refs (http/repo:) still require a verbatim mention.
function evidenceMentionedInSection(sectionText, reference) {
  if (sectionText.includes(reference)) return true;
  const parsed = parseEvidenceReference(reference);
  if (!parsed || parsed.external || !parsed.source) return false;
  return sectionMentionsPath(sectionText, parsed.source);
}

function sectionMentionsPath(sectionText, sourcePath) {
  for (let idx = sectionText.indexOf(sourcePath); idx !== -1; idx = sectionText.indexOf(sourcePath, idx + 1)) {
    const after = sectionText[idx + sourcePath.length] ?? "";
    // Require a boundary after the path so `src/cli.js` doesn't match `src/cli.js.map`
    // (an extension char like `.` is intentionally NOT a boundary).
    if (after === "" || "#: \t\r\n,)]`'\"".includes(after)) return true;
  }
  return false;
}

export async function scanEvidenceSections(cwd, options = {}) {
  const findings = [];
  const strictSeverity = evidenceStrictSeverity(options);

  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const section = extractMarkdownSection(parsed.body, "Evidence");
    const frontmatterEvidence = Array.isArray(parsed.frontmatter?.evidence)
      ? parsed.frontmatter.evidence.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
      : [];

    if (!section && frontmatterEvidence.length === 0) continue;

    if (!section) {
      findings.push({
        severity: strictSeverity,
        rule: "evidence.section_missing",
        path: rel,
        message: "Document has frontmatter evidence entries but no body ## Evidence section."
      });
      continue;
    }

    if (section.bullets.length === 0) {
      findings.push({
        severity: strictSeverity,
        rule: "evidence.section_empty",
        path: rel,
        message: "Body ## Evidence section should contain at least one bullet entry."
      });
    }

    for (const reference of frontmatterEvidence) {
      if (!evidenceMentionedInSection(section.text, reference)) {
        findings.push({
          severity: strictSeverity,
          rule: "evidence.section_unlisted",
          path: rel,
          message: `Frontmatter evidence entry is not mentioned in body ## Evidence: ${reference}.`,
          params: { reference }
        });
      }
    }
  }

  return findings;
}

export function evidenceStrictSeverity(options) {
  return options.strict ? "error" : "warning";
}

// Planned knowledge: documents that state INTENDED behavior — a requirement and
// its acceptance criteria, or an architecture decision — rather than describe code
// that exists. Expressed in the doc_type vocabulary the product already has, not a
// new field: the decision types are DECISION_DOC_TYPES (backfill's decision-record
// check and content.dated_heading already treat them as records), and `requirement`
// is the one type the greenfield scaffold adds. For these documents `verified`
// means the plan was approved; it never means the plan is implemented, so a
// verified one with nothing linked is a normal stage of the lifecycle rather than
// the defect evidence.ungrounded describes.
export const PLANNED_DOC_TYPES = new Set(["requirement", ...DECISION_DOC_TYPES]);

export function isPlannedDoc(frontmatter) {
  const docType = typeof frontmatter?.doc_type === "string" && frontmatter.doc_type.trim()
    ? frontmatter.doc_type.trim()
    : (typeof frontmatter?.type === "string" ? frontmatter.type.trim() : "");
  return PLANNED_DOC_TYPES.has(docType.toLowerCase());
}

// The local (non-external) references a document cites in source_files and
// evidence, as bare paths. For planned knowledge these are what "implementation
// evidence linked" counts: a URL to a product brief is where a requirement came
// from, not where this repository implements it. The CLI cannot tell an
// implementation file from any other local file — that stays the reviewer's call.
export function localReferencePaths(frontmatter) {
  const paths = [];
  const add = (base) => {
    if (base && !isExternalSourceReference(base) && !paths.includes(base)) paths.push(base);
  };
  for (const entry of Array.isArray(frontmatter?.source_files) ? frontmatter.source_files : []) {
    if (typeof entry === "string") add(entry.trim().split("#")[0].trim());
  }
  for (const entry of Array.isArray(frontmatter?.evidence) ? frontmatter.evidence : []) {
    if (typeof entry !== "string" || !entry.trim()) continue;
    // parseEvidenceReference also reads the `path:10-20` form; a reference it
    // rejects is still a local reference, and an unresolvable one.
    const parsed = parseEvidenceReference(entry.trim());
    if (parsed?.external) continue;
    add(parsed ? parsed.source : entry.trim().split("#")[0].trim());
  }
  return paths;
}

// Gate 25: a `verified` document that carries neither source_files nor evidence
// is "verified" with no code grounding — the hole where the schema requires the
// source_files KEY but allows an empty list and evidence is optional. Default
// warning and NOT escalated by --strict (config `rules` can escalate); it must
// never break existing validate on intentionally-ungrounded verified docs.
//
// Planned knowledge is reported apart, as evidence.planned_unlinked (info): an
// approved requirement or decision with no local reference yet. Same population
// question, different meaning — the warning would tell a project that approving a
// plan before writing its code is a defect, and under --strict it would fail the
// build for the one state a new project is in by definition. The fact is still
// reported, only at a severity that cannot fail a build.
export async function scanUngroundedVerified(cwd) {
  const findings = [];
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const parsed = parseFrontmatter(await readUtf8(file));
    const frontmatter = parsed.frontmatter ?? {};
    if (frontmatter.status !== "verified") continue;
    if (isPlannedDoc(frontmatter)) {
      if (localReferencePaths(frontmatter).length === 0) {
        findings.push({
          severity: "info",
          rule: "evidence.planned_unlinked",
          path: rel,
          message: "Approved planned document (requirement or decision) has no implementation evidence linked yet; verified here means the plan was approved, not that it is implemented."
        });
      }
      continue;
    }
    const sourceFiles = Array.isArray(frontmatter.source_files)
      ? frontmatter.source_files.filter((item) => typeof item === "string" && item.trim())
      : [];
    const evidence = Array.isArray(frontmatter.evidence)
      ? frontmatter.evidence.filter((item) => typeof item === "string" && item.trim())
      : [];
    if (sourceFiles.length === 0 && evidence.length === 0) {
      findings.push({
        severity: "warning",
        rule: "evidence.ungrounded",
        path: rel,
        message: "Verified document has no source_files and no evidence (grounding-free verified)."
      });
    }
  }
  return findings;
}

// Gate 25: finding rules that mean an evidence/source reference did NOT resolve.
// Used to compute the reference_checked tier.
export const EVIDENCE_REFERENCE_RULES = new Set([
  "evidence.shape",
  "evidence.missing",
  "evidence.line_range",
  "evidence.symbol_unverified",
  "evidence.section_unverified",
  "source_files.missing"
]);

// Gate 25: the computed evidence tier of a document (additive, report-only — NOT
// a stored frontmatter field or status value). The two axes are orthogonal:
// - referenceChecked: the doc has grounding refs AND all of them resolve
//   (no EVIDENCE_REFERENCE_RULES finding on its path).
// - humanVerified: status verified with reviewer metadata present.
export function evidenceTier({ status, reviewedBy, reviewedAt, hasGrounding, hasUnresolvedRefs }) {
  return {
    referenceChecked: Boolean(hasGrounding) && !hasUnresolvedRefs,
    humanVerified: status === "verified" && Boolean(reviewedBy) && Boolean(reviewedAt)
  };
}

// The configured agent reviewer names (config `agentReviewers`), normalized for
// matching, or null when the project has not named any. null is load-bearing: it
// means "who approved is not distinguishable here", which is a different fact from
// "no agent approved anything" — stats reports agent_verified as null, never 0, in
// that case.
export function agentReviewerSet(agentReviewers) {
  if (!Array.isArray(agentReviewers)) return null;
  const names = agentReviewers
    .filter((name) => typeof name === "string" && name.trim() !== "")
    .map(normalizeReviewerName);
  return names.length > 0 ? new Set(names) : null;
}

// True when a document's reviewed_by names one of the configured agent reviewers.
// Leading/trailing whitespace is ignored and the match is case-insensitive, so
// "Claude Code" in the config matches "claude code " in a stamp; nothing else is
// fuzzy (no substring or prefix matching — "Claude" does not match "Claude Code").
export function isAgentReviewer(reviewedBy, agentSet) {
  if (!agentSet || typeof reviewedBy !== "string") return false;
  return agentSet.has(normalizeReviewerName(reviewedBy));
}

function normalizeReviewerName(name) {
  return name.trim().toLowerCase();
}

// Which local files a verified document's freshness depends on, and the
// review baseline to compare against. Pure so it can be tested without git.
// Pure: the local source-file anchors a verified document depends on, or null
// when the document is not verified. Shared by date-anchored drift
// (driftTargets, which adds a review-date baseline) and diff-anchored
// reverse-impact (scanReverseImpact, Gate 23), so both consume ONE anchor
// extractor. External (http(s)/repo:) references are excluded.
// Document types exempt from freshness and reverse-impact watching (decision 28,
// 2026-08-03). A release note is an immutable record of a release that already
// happened: it anchors `package.json`, which changes on EVERY release, so it goes
// stale permanently and can only be cleared by re-stamping a document whose text
// nobody should be editing. Measured here: 33 of 52 wiki documents are release
// notes, 33 of 33 anchor package.json, and at a one-week-old baseline they
// produce 67 of 185 findings.
//
// This is not only a cost cap. Since decision 21 made impact.source_changed an
// ERROR, an unexempted release note can FAIL A BUILD because unrelated source
// moved — 16 of the 23 impact findings on this repo's own decision-21 commit were
// exactly that. The exemption is hardcoded rather than configurable, matching the
// only other per-path skip in the product (isAppendOnlyLog for the change log).
// Recorded cost: it removes those 33 documents from a check they are currently
// inside, which is the right trade only because re-reviewing a shipped release
// note is definitionally noise.
export const FRESHNESS_EXEMPT_DOC_TYPES = new Set(["release_notes"]);

function freshnessExempt(frontmatter) {
  const docType = typeof frontmatter?.doc_type === "string" && frontmatter.doc_type.trim()
    ? frontmatter.doc_type.trim()
    : (typeof frontmatter?.type === "string" ? frontmatter.type.trim() : "");
  return FRESHNESS_EXEMPT_DOC_TYPES.has(docType);
}

export function verifiedSourceAnchors(frontmatter) {
  if (frontmatter?.status !== "verified") return null;
  if (freshnessExempt(frontmatter)) return null;

  // source_files are BROAD anchors: the whole file backs the document. That is
  // the published contract (GLOSSARY.md: source_files = 넓은 범위 근거, evidence =
  // 정밀 근거 참조), and it is deliberately NOT relaxed here.
  //
  // Defect N-7 measured 58 of 58 line-range anchors never narrowing anything,
  // because a document that cites `file#L10-L20` in evidence usually also lists
  // `file` in source_files, and a broad anchor for a file outranks a precise one.
  // Re-examined 2026-09-08: that is the contract working, not failing, and the way
  // to ask for narrowing already exists — cite the file ONLY in `evidence` with a
  // line range and leave it out of `source_files`. Verified on a fixture: that
  // shape narrows drift and produces no evidence.ungrounded or
  // source_files.missing finding. Reading a locator in source_files as precise was
  // implemented and reverted: no document in this repository writes one, so it
  // would have had no local consumer, while for an adopter it would silently
  // narrow anchors they wrote as broad — a false negative in a freshness gate,
  // which is the one direction a fix here must never move. What N-7 leaves behind
  // is a discoverability gap, fixed in the docs and in `explain evidence.stale`.
  const sources = [];
  for (const entry of Array.isArray(frontmatter.source_files) ? frontmatter.source_files : []) {
    if (typeof entry !== "string") continue;
    const base = entry.split("#")[0].trim();
    if (!base || isExternalSourceReference(base)) continue;
    if (!sources.includes(base)) sources.push(base);
  }

  // evidence entries carry a locator (line/symbol/section/route) that can refine
  // the drift and impact checks to a region: a line range, or a section of a
  // Markdown file (see narrowingLocators).
  const evidenceRefs = [];
  for (const entry of Array.isArray(frontmatter.evidence) ? frontmatter.evidence : []) {
    if (typeof entry !== "string") continue;
    const parsedRef = parseEvidenceReference(entry.trim());
    if (!parsedRef || parsedRef.external) continue;
    const base = parsedRef.source;
    if (!base || isExternalSourceReference(base)) continue;
    evidenceRefs.push({ base, locator: parsedRef.locator });
  }

  const files = [];
  for (const base of [...sources, ...evidenceRefs.map((ref) => ref.base)]) {
    if (!files.includes(base)) files.push(base);
  }

  return { files, sources, evidenceRefs };
}

// `options.watchNeedsReview` (decision 28) widens DATE-anchored freshness to
// needs_review documents. It stays off by default and it deliberately does NOT
// widen reverse-impact: that rule is an error since decision 21, so widening it
// would let an unreviewed document fail a build — the opposite of what an
// advisory opt-in should buy.
export function driftTargets(frontmatter, options = {}) {
  const widened = options.watchNeedsReview === true
    && frontmatter?.status === "needs_review"
    && !freshnessExempt(frontmatter);
  const anchors = widened
    ? verifiedSourceAnchors({ ...frontmatter, status: "verified" })
    : verifiedSourceAnchors(frontmatter);
  if (!anchors) return null;

  const reviewedAt = typeof frontmatter.reviewed_at === "string" && /^\d{4}-\d{2}-\d{2}$/.test(frontmatter.reviewed_at)
    ? frontmatter.reviewed_at
    : null;
  const lastUpdated = typeof frontmatter.last_updated === "string" && /^\d{4}-\d{2}-\d{2}$/.test(frontmatter.last_updated)
    ? frontmatter.last_updated
    : null;
  const baseline = reviewedAt ?? lastUpdated;
  if (!baseline) return null;

  // baselineKey names the frontmatter field the baseline came from, so the drift
  // scan can find the commit that wrote it (reviewStamp in scanEvidenceDriftDetailed).
  return { baseline, baselineKey: reviewedAt ? "reviewed_at" : "last_updated", ...anchors };
}

// Flags verified documents whose referenced files changed in git after the
// review baseline. When a file is cited ONLY through narrowing locators in
// evidence (see narrowingLocators: line ranges, or sections of a Markdown file,
// and no source_files entry), the check narrows to those regions so unrelated
// edits elsewhere in the file are not drift. A line range asks `git log -L`; a
// section (2026-10-27) is compared between the repository as of the end of the
// review day (commitAtEndOf) and HEAD — committed history only, like every other
// date check here.
//
// Neither date question names the repository the reviewer saw, and both were
// shown (2026-10-28) to hide a cited region that DID change: a side-branch commit
// dated the review day but merged after it, a commit made later the same day, and
// a commit made after the review with an older committer date each read as
// "unchanged", while the file-level check, triggered by an unrelated later edit,
// would have reported the document. So a citation is only ever narrowed away when
// the commit that wrote the document's current review stamp (reviewStamp) agrees
// as well: no commit between it and HEAD touched a cited line range, and every
// cited section reads the same there as at HEAD. Requiring a second baseline can
// only keep findings, never remove one.
//
// Anything that cannot be compared exactly — a line query git rejects (e.g. an
// out-of-range line), no review-day snapshot, no stamp commit (the stamp is not
// committed, or does not match what is committed), a file absent on either side, a
// heading that matches zero or several headings — falls back to the file-level
// check. Known limits that remain: a cited region changed only by commits the
// date check cannot see (the late merge with no later edit, N-15) is not reported
// at all, and a review written on one day but committed later is compared against
// that later commit. Best-effort: silently skips when git is unavailable.
// Template skeletons are out of scope (N-14, 2026-08-06): review cannot
// re-stamp them, so flagging them produced findings with no way to clear them.
export async function scanEvidenceDrift(cwd, options = {}) {
  return (await scanEvidenceDriftDetailed(cwd, options)).findings;
}

// scanEvidenceDrift plus `locatorNarrowed`: one { path, source, locators } entry
// per citation whose file changed after the baseline while none of its cited
// regions did, so the drift command reports a skip instead of making it silently
// (the impact command's rule since 1.36.0).
export async function scanEvidenceDriftDetailed(cwd, options = {}) {
  const findings = [];
  const locatorNarrowed = [];
  // One `git log` per (file, baseline) pair instead of per (document, file,
  // baseline): documents share both anchors and review dates, so the same query
  // was re-spawned many times per run. Pure memoization of a read-only query
  // inside a single scan — no behavior change.
  const fileChangedCache = new Map();
  // Even memoized, that was one spawn per distinct (file, baseline) — 72 on this
  // repository, ~90% of a 4 s validate. One `git log` per baseline now answers
  // every anchor git did not touch; only anchors it did touch still get their own
  // query, so the answers and the findings are unchanged.
  const mayHaveChanged = changeFilter(cwd);
  const fileChangedMemo = (base, baseline) => {
    const key = `${base}\u0000${baseline}`;
    if (fileChangedCache.has(key)) return fileChangedCache.get(key);
    const answer = mayHaveChanged(base, baseline) ? fileChangedSinceSafe(cwd, base, baseline) : false;
    fileChangedCache.set(key, answer);
    return answer;
  };
  // Documents share review dates, so the review-day snapshot is resolved once per
  // baseline, and a file's content once per (snapshot, file).
  const snapshotCache = new Map();
  const snapshotAt = (baseline) => {
    if (!snapshotCache.has(baseline)) snapshotCache.set(baseline, commitAtEndOf(cwd, baseline));
    return snapshotCache.get(baseline);
  };
  const contentCache = new Map();
  const contentAt = (ref, base) => {
    if (!ref) return null;
    const key = `${ref}\u0000${base}`;
    if (!contentCache.has(key)) contentCache.set(key, fileAtRefFromCwd(cwd, ref, base));
    return contentCache.get(key);
  };
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    if (isTemplateDoc(rel)) continue;
    if (isAppendOnlyLog(rel)) continue; // see scanReverseImpact (N-14 class)
    const parsed = parseFrontmatter(await readUtf8(file));
    const targets = driftTargets(parsed.frontmatter, options);
    if (!targets) continue;
    // The commit that wrote this document's review stamp, resolved at most once per
    // document and only when a citation is about to be narrowed away.
    let stampResolved = false;
    let stamp = null;
    const stampCommit = () => {
      if (!stampResolved) {
        stampResolved = true;
        stamp = reviewStamp(cwd, rel, targets.baselineKey, targets.baseline);
      }
      return stamp;
    };

    for (const base of targets.files) {
      if (!(await pathExists(path.join(cwd, base)))) continue;

      // No commit touched the file, so no cited region of it changed either, and
      // the file-level fallback below would answer false too.
      if (!mayHaveChanged(base, targets.baseline)) continue;

      // Broad (whole-file) unless every citation of the file narrows: a
      // source_files entry, a bare path, a symbol or route, or a section of a
      // non-Markdown file keeps the whole file watched (the N-7 contract).
      const locators = narrowingLocators(targets, base);
      if (!locators) {
        if (fileChangedMemo(base, targets.baseline)) {
          findings.push(driftFinding(rel, `${base}`, targets.baseline));
        }
        continue;
      }

      let staleReference = null;
      let fallbackFileLevel = false;
      for (const range of locators.filter((locator) => locator.kind === "line")) {
        try {
          if (lineRangeChangedSince(cwd, base, range.start, range.end, targets.baseline)) {
            staleReference = `${base}#L${range.start}-L${range.end}`;
            break;
          }
        } catch {
          fallbackFileLevel = true;
          break;
        }
      }
      const sections = locators.filter((locator) => locator.kind === "section");
      if (!staleReference && !fallbackFileLevel && sections.length > 0 && fileChangedMemo(base, targets.baseline)) {
        const before = contentAt(snapshotAt(targets.baseline), base);
        const after = contentAt("HEAD", base);
        if (before === null || after === null) {
          fallbackFileLevel = true;
        } else {
          for (const section of sections) {
            const was = locatedRegion(before, section);
            const now = locatedRegion(after, section);
            if (was === null || now === null) {
              fallbackFileLevel = true;
              break;
            }
            if (was !== now) {
              staleReference = `${base}${locatorLabel(section)}`;
              break;
            }
          }
        }
      }

      // About to narrow the citation away: the review's own commit must agree.
      if (!staleReference && !fallbackFileLevel && fileChangedMemo(base, targets.baseline)) {
        const verdict = citedRegionsSinceStamp(cwd, base, locators, stampCommit(), contentAt);
        if (verdict.fallback) fallbackFileLevel = true;
        else if (verdict.staleReference) staleReference = verdict.staleReference;
      }

      if (fallbackFileLevel) {
        if (fileChangedMemo(base, targets.baseline)) {
          findings.push(driftFinding(rel, `${base}`, targets.baseline));
        }
      } else if (staleReference) {
        findings.push(driftFinding(rel, staleReference, targets.baseline));
      } else if (fileChangedMemo(base, targets.baseline)) {
        locatorNarrowed.push({ path: rel, source: base, locators: locators.map(locatorLabel) });
      }
    }
  }
  return { findings, locatorNarrowed };
}

// The commit that wrote <rel>'s current review stamp: the newest commit in HEAD's
// history whose diff touches its `<key>:` line, accepted only if the document as
// committed there carries the same <key> value as the working tree. null when that
// cannot be established — the stamp was never committed, the committed one differs
// (an uncommitted re-stamp), or git fails — and the caller then refuses to narrow.
// A later same-value re-stamp does not move it, so it can only be older than the
// last review, which keeps more findings, not fewer.
export function reviewStamp(cwd, rel, key, value) {
  const sha = lastCommitTouchingKey(cwd, rel, key);
  if (!sha) return null;
  const committed = fileAtRefFromCwd(cwd, sha, rel);
  if (committed === null) return null;
  const frontmatter = parseFrontmatter(committed).frontmatter;
  return frontmatter && frontmatter[key] === value ? sha : null;
}

// Whether a citation's regions moved between the review stamp commit and HEAD:
// { staleReference } when one did, { fallback: true } when that cannot be decided
// (no stamp commit, a line query git rejects, a file or region missing on either
// side), and {} when every region is provably the same. Line ranges ask `git log
// -L <stamp>..HEAD`, which follows the lines through edits above them and decides
// by ancestry rather than dates; sections compare text, as the date path does.
function citedRegionsSinceStamp(cwd, base, locators, stamp, contentAt) {
  if (!stamp) return { fallback: true };
  for (const range of locators.filter((locator) => locator.kind === "line")) {
    try {
      if (lineRangeChangedBetween(cwd, base, range.start, range.end, stamp)) {
        return { staleReference: `${base}#L${range.start}-L${range.end}` };
      }
    } catch {
      return { fallback: true };
    }
  }
  const sections = locators.filter((locator) => locator.kind === "section");
  if (sections.length === 0) return {};
  const before = contentAt(stamp, base);
  const after = contentAt("HEAD", base);
  if (before === null || after === null) return { fallback: true };
  for (const section of sections) {
    const was = locatedRegion(before, section);
    const now = locatedRegion(after, section);
    if (was === null || now === null) return { fallback: true };
    if (was !== now) return { staleReference: `${base}${locatorLabel(section)}` };
  }
  return {};
}

// A negative filter over pathsChangedSince: false only when no commit after the
// baseline can have touched <base>, true when the per-file query must decide.
// Anything the filter cannot judge exactly answers true — git pathspec magic or
// glob characters (git would expand them, a string match would not), a path that
// cannot survive the newline-split listing, one that climbs out of the repository,
// or a failed listing — so the worst case is the old cost, never a new answer.
function changeFilter(cwd) {
  const listings = new Map();
  const listingFor = (baseline) => {
    if (!listings.has(baseline)) {
      let listing = null;
      try {
        listing = pathsChangedSince(cwd, baseline);
      } catch {
        listing = null;
      }
      listings.set(baseline, listing);
    }
    return listings.get(baseline);
  };
  return (base, baseline) => {
    if (/[*?[\]:\\\n]/.test(base)) return true;
    const listing = listingFor(baseline);
    if (!listing) return true;
    const anchor = path.posix.normalize(`${listing.prefix}${base}`).replace(/\/+$/, "");
    if (anchor === "." || anchor === "") return listing.paths.size > 0;
    if (anchor === ".." || anchor.startsWith("../")) return true;
    if (listing.paths.has(anchor)) return true;
    const dir = `${anchor}/`;
    for (const changed of listing.paths) {
      if (changed.startsWith(dir)) return true;
    }
    return false;
  };
}

export function fileChangedSinceSafe(cwd, base, baseline) {
  try {
    return fileChangedSince(cwd, base, baseline);
  } catch {
    return false;
  }
}

export function driftFinding(rel, reference, baseline) {
  return {
    severity: "warning",
    rule: "evidence.stale",
    path: rel,
    message: `Verified document references ${reference}, which changed after ${baseline}; re-review and update it or downgrade to needs_review.`,
    params: { reference, baseline }
  };
}

// Whether a document anchor (a file or a directory) is touched by the change set.
// A directory anchor matched NOTHING when this compared exact strings, because git
// only ever lists files (defect N-8): a verified document anchored to
// `src/commands/` was never flagged when a file under it changed, even though the
// date-anchored drift scan fires on the same edit via `git log -- <dir>`. That is
// a false negative in the one gate that catches what this product exists for, so
// the two scans now agree. A file anchor cannot gain a false positive from this:
// no path can start with "<a file>/". Exported so impactCommand's opt-in
// impact.stamp_only names the same changed anchors this scan would have named —
// two matchers would be two answers to one question (the N-14 lesson).
export function changedAnchorMatcher(changedSet) {
  const changedPaths = [...changedSet];
  return (base) => changedSet.has(base)
    || changedPaths.some((changed) => changed.startsWith(`${base.replace(/\/+$/, "")}/`));
}

// The locators that narrow a document's anchor on <base>, or null when the anchor
// is broad. Narrowing applies only when EVERY citation of the file is a line range,
// or a section of a Markdown file, and the file is not also in source_files: one
// broad citation keeps the whole file watched (the N-7 contract above). A symbol
// or route locator stays file-level because its extent cannot be computed without
// parsing the language, and a guess that is too small would be a false negative.
export function narrowingLocators(anchors, base) {
  if (anchors.sources.includes(base)) return null;
  const refs = anchors.evidenceRefs.filter((ref) => ref.base === base);
  if (refs.length === 0) return null;
  const locators = [];
  for (const ref of refs) {
    const kind = ref.locator?.kind;
    if (kind === "line" || (kind === "section" && /\.mdx?$/i.test(base))) {
      locators.push(ref.locator);
    } else {
      return null;
    }
  }
  return locators;
}

export function locatorLabel(locator) {
  return locator.kind === "line"
    ? `#L${locator.start}${locator.end !== locator.start ? `-L${locator.end}` : ""}`
    : `#${locator.kind}:${locator.value}`;
}

// The text a line or section locator points at, or null when it cannot be pinned
// down: a range past the end of the file, or a section heading that matches zero
// or several headings. Matching follows sectionPresent (case-insensitive substring
// of the heading text) but skips fenced code, where a `#` line is a comment, not a
// heading. A section runs to the next heading of the same or a higher level, so it
// includes its subsections.
export function locatedRegion(content, locator) {
  const lines = String(content).split(/\r?\n/);
  if (locator.kind === "line") {
    if (locator.start < 1 || locator.end < locator.start || locator.end > lines.length) return null;
    return lines.slice(locator.start - 1, locator.end).join("\n");
  }
  if (locator.kind !== "section") return null;
  const target = String(locator.value).toLowerCase().trim();
  if (!target) return null;
  const headings = [];
  let fence = null;
  lines.forEach((line, index) => {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (marker[1][0] === fence) fence = null;
      return;
    }
    if (fence) return;
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) headings.push({ index, level: heading[1].length, text: heading[2].toLowerCase() });
  });
  const matches = headings.filter((heading) => heading.text.includes(target));
  if (matches.length !== 1) return null;
  const [start] = matches;
  const next = headings.find((heading) => heading.index > start.index && heading.level <= start.level);
  return lines.slice(start.index, next ? next.index : lines.length).join("\n");
}

// Which of a document's anchors the change set touches, honoring line and section
// locators. A file in the change set whose every citation is a narrowing locator
// (see narrowingLocators) is compared region by region between the baseline (the
// --since ref, else HEAD) and the working tree; when every cited region reads the
// same on both sides, the file is reported under `narrowed` instead of `changed`.
// Anything that cannot be compared exactly — no baseline copy (a new or untracked
// file), an unreadable working copy, a region that cannot be located on either
// side — keeps the file-level answer, so this can only remove a finding whose
// cited text provably did not move. Directory anchors never narrow. Shared by
// scanReverseImpact and impact.stamp_only so the two name the same sources.
export async function changedCitedSources(cwd, anchors, changedSet, since) {
  const anchorMatches = changedAnchorMatcher(changedSet);
  const changed = [];
  const narrowed = [];
  for (const base of anchors.files.filter(anchorMatches)) {
    const locators = changedSet.has(base) ? narrowingLocators(anchors, base) : null;
    if (locators && await citedRegionsUnchanged(cwd, base, locators, since)) {
      narrowed.push({ source: base, locators: locators.map(locatorLabel) });
    } else {
      changed.push(base);
    }
  }
  return { changed, narrowed };
}

async function citedRegionsUnchanged(cwd, base, locators, since) {
  const before = fileAtRef(cwd, since || "HEAD", base);
  if (before === null) return false;
  let after;
  try {
    after = await readUtf8(path.join(cwd, ...base.split("/")));
  } catch {
    return false;
  }
  return locators.every((locator) => {
    const was = locatedRegion(before, locator);
    const now = locatedRegion(after, locator);
    return was !== null && now !== null && was === now;
  });
}

// Gate 23 reverse-impact (diff-anchored). Given a set of repo-relative changed
// paths (from git.js#changedFiles: the working tree, or a `--since <ref>` PR/CI
// diff), flag each verified document whose referenced source files are IN the
// change set while the document itself is NOT — the pre-merge complement to the
// date-anchored scanEvidenceDrift. Paths align when the CLI runs from the repo
// root (same assumption as validate --changed). File-level, except that a file
// cited ONLY through line or Markdown-section locators is compared region by
// region against the baseline (changedCitedSources, 2026-10-27); every narrowed
// citation is returned in `locatorNarrowed` so the skip is reported, never silent.
// One more content-aware carve-out is the CALLER's: impactCommand withholds a
// package.json whose diff moves nothing but `version` (N-13, 2026-08-04). A
// document edited in the same change set is intentionally not flagged. Template
// skeletons are out of scope for the same reason scanEvidenceDrift skips them
// (N-14, 2026-08-06): review cannot re-stamp what it cannot enumerate.
// Read-only.
export async function scanReverseImpact(cwd, changedSet, { since } = {}) {
  const findings = [];
  const locatorNarrowed = [];
  if (!changedSet || changedSet.size === 0) return { findings, locatorNarrowed };
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    if (isTemplateDoc(rel)) continue;
    // Same reason templates are out of scope (N-14): the append-only change log
    // is a document `review` refuses to stamp, so flagging it would produce a
    // finding with no way to clear it. Today it is unreachable only because the
    // log happens to sit at needs_review; making the skip explicit means the two
    // enumerators cannot drift apart if that ever changes.
    if (isAppendOnlyLog(rel)) continue;
    if (changedSet.has(rel)) continue; // doc changed in the same diff → not drift
    const anchors = verifiedSourceAnchors(parseFrontmatter(await readUtf8(file)).frontmatter);
    if (!anchors) continue;
    const { changed: changedSources, narrowed } = await changedCitedSources(cwd, anchors, changedSet, since);
    for (const entry of narrowed) locatorNarrowed.push({ path: rel, ...entry });
    if (changedSources.length === 0) continue;
    findings.push({
      // Error, not warning: decision 21 (maintainer, 2026-08-03) made this gate
      // fail by default. It is the one rule that catches what this tool exists
      // for — source moved, its documentation did not — and leaving it advisory
      // meant a project had to opt in to the only detection that can fail a
      // build. The way back is per-project config (`"impact.source_changed":
      // "warning"|"info"|"off"`) or `rulesPreset: "relaxed"`, never a code edit.
      severity: "error",
      rule: "impact.source_changed",
      path: rel,
      message: `Verified document depends on ${changedSources.join(", ")}, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.`,
      params: { sources: changedSources.join(", ") }
    });
  }
  return { findings, locatorNarrowed };
}

export async function scanOkfProfile(cwd, activeProfiles = []) {
  if (!activeProfiles.includes("okf-v0.1")) return [];

  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  const markdownFiles = await listTargetMarkdown(cwd);
  const targetFiles = (await pathExists(wikiRoot))
    ? markdownFiles.filter((file) => toPosix(path.relative(cwd, file)).startsWith("docs/llm-wiki/"))
    : markdownFiles;
  const findings = [];

  for (const file of targetFiles) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    if (!parsed.frontmatter) continue;

    if (!parsed.frontmatter.type) {
      findings.push({
        severity: "error",
        rule: "okf.type_required",
        path: rel,
        message: "OKF v0.1 profile requires frontmatter field: type."
      });
    } else if (typeof parsed.frontmatter.type !== "string") {
      findings.push({
        severity: "error",
        rule: "okf.type_shape",
        path: rel,
        message: "OKF v0.1 frontmatter field type must be a string."
      });
    }

    for (const arrayField of ["aliases", "tags"]) {
      if (arrayField in parsed.frontmatter && !Array.isArray(parsed.frontmatter[arrayField])) {
        findings.push({
          severity: "error",
          rule: "okf.array_shape",
          path: rel,
          message: `OKF v0.1 frontmatter field ${arrayField} must be an array when present.`,
          params: { field: arrayField }
        });
      }
    }
  }

  return findings;
}

export async function scanMarkdownLinks(cwd) {
  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  if (!(await pathExists(wikiRoot))) return [];

  const findings = [];
  for (const file of await listMarkdownFiles(wikiRoot)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);

    for (const target of extractMarkdownLinkTargets(content)) {
      const link = normalizeMarkdownLinkTarget(target);
      if (!link || isSkippedMarkdownLink(link)) continue;

      const absoluteTarget = resolveMarkdownLinkTarget(cwd, file, link);
      if (!(await pathExists(absoluteTarget))) {
        findings.push({
          severity: "warning",
          rule: "markdown_link.missing",
          path: rel,
          message: `Markdown link target does not exist: ${link}.`,
          params: { link }
        });
      }
    }
  }
  return findings;
}

export async function scanWikiLinks(cwd) {
  return (await collectWikiGraph(cwd)).findings;
}
