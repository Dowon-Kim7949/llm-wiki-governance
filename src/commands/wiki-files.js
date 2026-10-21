// Shared wiki file-enumeration and path predicates, extracted from commands.js on
// 2026-07-16 (behavior-preserving refactor, GATE_REVIEW stabilization). These are
// the small utilities the scan family, adapters, and fix/migrate all share:
// listTargetMarkdown (audit/validate scope), listWikiContentDocs (content docs
// with templates excluded), isAppendOnlyLog, and isLogVolume. Depends only on the Node stdlib
// and files.js; no back-dependency on commands.js.
import path from "node:path";
import { listMarkdownFiles, pathExists, toPosix } from "../files.js";

export async function listTargetMarkdown(cwd) {
  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  if (await pathExists(wikiRoot)) {
    return listMarkdownFiles(wikiRoot);
  }
  const files = await listMarkdownFiles(cwd);
  return files.filter((file) => !toPosix(path.relative(cwd, file)).startsWith("templates/"));
}

export async function listWikiContentDocs(cwd) {
  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  if (!(await pathExists(wikiRoot))) return [];
  return (await listMarkdownFiles(wikiRoot))
    .filter((file) => !toPosix(path.relative(cwd, file)).includes("/templates/"));
}

// The change-log record: log.md plus the monthly volumes `archive-log` moves older
// entries into (docs/llm-wiki/log-YYYY-MM.md, 1.33.0). Every caller treats both the
// same way — never rewritten by fix/migrate/init, outside review/drift/impact, and
// deprioritized in retrieval — so one predicate keeps the enumerators agreeing
// (the N-14 lesson). Sensitive-info and link scans do not consult it and still
// read every record. Only the exact lowercase name with a real month (01-12)
// matches — the only names archive-log writes — so LOG-2026-08.md or log-2026-13.md
// stays an ordinary document on every platform.
const LOG_VOLUME_PATH_RE = /^docs\/llm-wiki\/log-\d{4}-(?:0[1-9]|1[0-2])\.md$/;

export function isAppendOnlyLog(rel) {
  const posix = toPosix(rel);
  return posix === "docs/llm-wiki/log.md" || LOG_VOLUME_PATH_RE.test(posix);
}

// A monthly volume only (not log.md). Aggregate metrics count the change-log
// record ONCE, as log.md: a volume is log.md's older entries moved next to it, so
// archiving must not change stats' document count, health score, or evidence
// coverage, nor turn every volume into an orphan in graph/next. log.md itself
// keeps being counted exactly as before 1.33.0.
export function isLogVolume(rel) {
  return LOG_VOLUME_PATH_RE.test(toPosix(rel));
}

// True for template skeletons — the blanks an adopting repo copies, not
// documentation of the repo they sit in. Same predicate listWikiContentDocs
// filters on, exported so the freshness scans can agree with it (N-14,
// 2026-08-06). Until then the two enumerators disagreed: drift/impact used
// listTargetMarkdown and could report a template as stale, while review used
// listWikiContentDocs and had no way to re-stamp it — a finding with no
// resolution path, in this repo and in every adopter that keeps documents
// under docs/llm-wiki/templates/.
export function isTemplateDoc(rel) {
  const posix = toPosix(rel);
  return posix.includes("/templates/") || posix.startsWith("templates/");
}
