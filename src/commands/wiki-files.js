// Shared wiki file-enumeration and path predicates, extracted from commands.js on
// 2026-07-16 (behavior-preserving refactor, GATE_REVIEW stabilization). These are
// the small utilities the scan family, adapters, and fix/migrate all share:
// listTargetMarkdown (audit/validate scope), listWikiContentDocs (content docs
// with templates excluded), and isAppendOnlyLog. Depends only on the Node stdlib
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

export function isAppendOnlyLog(rel) {
  return toPosix(rel) === "docs/llm-wiki/log.md";
}
