// Zero-dependency file collection for the impact-measurement harness (Gate 22).
// Node built-ins only (node:fs, node:path). UTF-8 throughout (project rule).

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { estimateTokens, estimateTokensWords } from "./tokens.js";

// Directories we never descend into when collecting source.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "out",
  "coverage",
  "bench",
  "docs",
  "tests",
  "outputs",
]);

function toPosix(p) {
  return p.split(sep).join("/");
}

// Recursively collect files under `rootDir` whose path passes `matchFn(relPath)`.
// Returns [{ relPath, absPath, content, chars, tokens, tokensWords }], sorted by relPath.
export function collectFiles(repoRoot, subDir, matchFn) {
  const start = join(repoRoot, subDir);
  const out = [];

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(abs);
      } else if (entry.isFile()) {
        const rel = toPosix(relative(repoRoot, abs));
        if (!matchFn(rel)) continue;
        const content = readFileSync(abs, "utf8");
        out.push({
          relPath: rel,
          absPath: abs,
          content,
          chars: content.length,
          tokens: estimateTokens(content),
          tokensWords: estimateTokensWords(content),
        });
      }
    }
  }

  walk(start);
  out.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return out;
}

// Read an explicit list of repo-relative files (used for the wiki orientation set).
// Missing files are skipped silently (the caller decides whether that matters).
export function readNamedFiles(repoRoot, relPaths) {
  const out = [];
  for (const rel of relPaths) {
    const abs = join(repoRoot, rel.split("/").join(sep));
    try {
      if (!statSync(abs).isFile()) continue;
    } catch {
      continue;
    }
    const content = readFileSync(abs, "utf8");
    out.push({
      relPath: toPosix(rel),
      absPath: abs,
      content,
      chars: content.length,
      tokens: estimateTokens(content),
      tokensWords: estimateTokensWords(content),
    });
  }
  return out;
}

export { toPosix };
