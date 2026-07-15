// Domain detection and per-domain doc planning, extracted from commands.js on
// 2026-07-15 (behavior-preserving refactor, GATE_REVIEW stabilization). Self-
// contained: depends only on the Node stdlib and files.js; no back-dependency
// on commands.js.
import path from "node:path";
import { readdir } from "node:fs/promises";
import { toPosix } from "../files.js";

// Directories whose immediate SUBDIRECTORIES are domains (folder-per-domain).
const DIR_DOMAIN_PARENTS = new Set(["domains", "domain", "modules", "features"]);

// Directories whose immediate SOURCE FILES are domains (module-per-resource).
const FILE_DOMAIN_PARENTS = new Set(["endpoints", "routers", "routes", "resources", "controllers", "handlers"]);

// Technical directories that are not business domains (compared lowercase). Used
// both to reject domain candidates and to prune traversal.
const DOMAIN_EXCLUDE_NAMES = new Set([
  "common", "shared", "core", "config", "configs",
  "util", "utils", "middleware", "middlewares",
  "infrastructure", "test", "tests", "fixture", "fixtures"
]);

// Directories never descended into while searching for domain parents: vendored,
// generated, virtualenv, build, test, and docs trees. Hidden (`.`) and dunder
// (`__`) directories are also skipped. Keeps the scan bounded and FPs near zero.
const DOMAIN_TRAVERSAL_SKIP = new Set([
  "node_modules", "dist", "build", "out", "target", "bin", "obj",
  "venv", "env", "vendor", "coverage", "migrations",
  "spec", "docs", "doc", "examples", "example", "scripts"
]);

// Source-file extensions eligible to be a file-based domain.
const DOMAIN_FILE_EXTENSIONS = new Set([".py", ".js", ".ts", ".jsx", ".tsx", ".rb", ".go", ".java", ".kt", ".php", ".cs"]);

// File basenames (no extension, lowercased) that are aggregators/infrastructure
// rather than business resources — excluded from file-based domains.
const FILE_DOMAIN_EXCLUDE = new Set([
  "index", "main", "app", "application", "server",
  "base", "router", "route", "routes", "urls", "deps", "dependencies",
  "schemas", "schema", "models", "model", "types", "helpers", "constants", "settings"
]);

// How deep to search for domain-parent directories from the project root
// (reaches nested layouts like app/api/api_v2/endpoints and monorepo packages).
const DOMAIN_MAX_DEPTH = 8;

export function emptyDomainContext() {
  return { plans: [], relatedExtras: [] };
}

// Split camelCase/PascalCase/snake/kebab/space into tokens; keep non-latin
// letters (e.g. Hangul) intact. Pure.
function domainNameTokens(name) {
  return String(name)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

// Deterministic filename slug for a domain directory name. Pure.
export function normalizeDomainSlug(name) {
  const slug = domainNameTokens(name)
    .map((token) => token.toLowerCase())
    .join("_")
    .replace(/[^\p{L}\p{N}_]+/gu, "");
  return slug || "domain";
}

// Human-facing display name derived from a slug (Title Case for latin words;
// non-latin tokens kept as-is). Pure.
export function domainDisplayName(slug) {
  const tokens = domainNameTokens(slug);
  if (tokens.length === 0) return "Domain";
  return tokens
    .map((token) => (/[a-z]/i.test(token) ? token.charAt(0).toUpperCase() + token.slice(1).toLowerCase() : token))
    .join(" ");
}

// Best-effort: search the project tree for domain-parent directories and collect
// their domains (subdirectories or source files). A missing/unreadable directory
// is skipped, never fatal. Returns { rawName, sourceFile, kind } with posix
// sourceFile paths. Order is irrelevant — planDomainDocs sorts deterministically.
export async function detectDomainDirectories(cwd) {
  const found = [];
  await scanForDomainParents(cwd, cwd, 0, found);
  return found;
}

// Bounded DFS from the project root. When a directory's basename marks it a
// domain parent, collect its domains and PRUNE (do not descend further into that
// subtree, so a domain's internal folders never fragment into extra domains).
// Otherwise descend into non-skipped subdirectories.
async function scanForDomainParents(cwd, dir, depth, found) {
  if (depth > DOMAIN_MAX_DEPTH) return;
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  const base = path.basename(dir).toLowerCase();

  if (DIR_DOMAIN_PARENTS.has(base)) {
    for (const entry of entries) {
      if (entry.isDirectory() && !isExcludedDomainDir(entry.name)) {
        found.push({ rawName: entry.name, sourceFile: toPosix(path.relative(cwd, path.join(dir, entry.name))), kind: "dir" });
      }
    }
    return;
  }

  if (FILE_DOMAIN_PARENTS.has(base)) {
    for (const entry of entries) {
      if (entry.isFile() && isDomainSourceFile(entry.name)) {
        found.push({ rawName: stripSourceExtension(entry.name), sourceFile: toPosix(path.relative(cwd, path.join(dir, entry.name))), kind: "file" });
      }
    }
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || isSkippedTraversalDir(entry.name)) continue;
    await scanForDomainParents(cwd, path.join(dir, entry.name), depth + 1, found);
  }
}

function isSkippedTraversalDir(name) {
  if (name.startsWith(".") || name.startsWith("__")) return true;
  const lower = name.toLowerCase();
  return DOMAIN_TRAVERSAL_SKIP.has(lower) || DOMAIN_EXCLUDE_NAMES.has(lower);
}

function isExcludedDomainDir(name) {
  if (name.startsWith(".") || name.startsWith("__")) return true;
  return DOMAIN_EXCLUDE_NAMES.has(name.toLowerCase());
}

function isDomainSourceFile(name) {
  if (name.startsWith(".") || name.startsWith("__")) return false;
  if (/\.d\.ts$/i.test(name) || /\.(test|spec)\.[jt]sx?$/i.test(name)) return false;
  if (!DOMAIN_FILE_EXTENSIONS.has(path.extname(name).toLowerCase())) return false;
  const base = stripSourceExtension(name).toLowerCase();
  return Boolean(base) && !FILE_DOMAIN_EXCLUDE.has(base) && !DOMAIN_EXCLUDE_NAMES.has(base);
}

function stripSourceExtension(name) {
  return name.replace(/\.[^.]+$/, "");
}

// Merge detected directories by normalized slug, sort deterministically by slug,
// and assign ordinal-numbered doc paths (01_, 02_, ...). Same domain found in
// several locations collapses to one doc whose source_files lists every path.
// Pure.
export function planDomainDocs(detected) {
  const bySlug = new Map();
  for (const item of detected) {
    const slug = normalizeDomainSlug(item.rawName);
    if (!bySlug.has(slug)) bySlug.set(slug, new Set());
    bySlug.get(slug).add(toPosix(item.sourceFile));
  }
  return [...bySlug.keys()]
    .sort((left, right) => left.localeCompare(right))
    .map((slug, index) => ({
      rel: `docs/llm-wiki/domains/${String(index + 1).padStart(2, "0")}_${slug}.md`,
      slug,
      domainName: domainDisplayName(slug),
      sourceFiles: [...bySlug.get(slug)].sort()
    }));
}

// Domain docs are generated only for backend/fullstack, non-minimal init.
// relatedExtras links the backend contract docs only when they are themselves
// part of this init's candidate set, so no broken links are introduced.
export async function buildDomainContext(cwd, projectType, minimal, candidateSet) {
  if (minimal || (projectType !== "backend" && projectType !== "fullstack")) {
    return emptyDomainContext();
  }
  const plans = planDomainDocs(await detectDomainDirectories(cwd));
  const relatedExtras = ["docs/llm-wiki/API_CONTRACTS.md", "docs/llm-wiki/DATA_MODEL.md"]
    .filter((doc) => candidateSet.has(doc));
  return { plans, relatedExtras };
}
