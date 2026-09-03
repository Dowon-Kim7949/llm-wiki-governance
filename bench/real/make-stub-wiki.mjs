#!/usr/bin/env node
// Build the STUB WIKI fixture for the `B2_empty` control arm.
//
// WHY THIS EXISTS
// The 2026-07-24 real run measured B (no retrieval) vs B2 (retrieval) and found
// B2 used ~48% fewer input tokens. That result cannot say WHY: the win might come
// from the wiki's *knowledge*, or merely from having *search tooling* at all.
// `B2_empty` is the control that separates them — the same tools, the same prompt,
// the same model, over a wiki that has been emptied of knowledge.
//
// WHAT "EMPTIED" MEANS (kept deliberately narrow so only one variable moves)
//   - Document set, paths, filenames, and titles: UNCHANGED.
//   - Frontmatter: UNCHANGED except `source_files` and `evidence`, which are
//     emptied — they name ground-truth files, so leaving them would hand the agent
//     the answer and defeat the control.
//   - Body: replaced by the generator's unenriched placeholder text, so the doc
//     reads exactly like a freshly scaffolded `init --write` doc that nobody has
//     enriched yet. That is a real user state, not an artificial one.
//   - `status` is left as-is on purpose: changing it would move a second variable
//     (status affects frontmatter echo and filtering).
//
// SAFETY: reads the source wiki, writes ONLY under --out. The repo under test is
// never modified. Zero dependencies (Node built-ins only).
//
//   node bench/real/make-stub-wiki.mjs --src <repo-with-docs/llm-wiki> --out <scratch-dir>

import { readdirSync, statSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, relative, resolve, dirname } from "node:path";

const PLACEHOLDER_BODY = [
  "## Summary",
  "",
  "Concise summary: describe this area in two or three sentences.",
  "",
  "## Details",
  "",
  "Add file paths, symbols, routes, commands, or test names inspected while completing this document.",
  "",
  "## Open Questions",
  "",
  "Keep uncertain claims here until source evidence confirms them.",
  ""
].join("\n");

function parseArgs(argv) {
  const args = argv.slice(2);
  const get = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : null;
  };
  return { src: get("--src"), out: get("--out"), force: args.includes("--force") };
}

function listMarkdown(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) listMarkdown(abs, acc);
    else if (entry.name.endsWith(".md")) acc.push(abs);
  }
  return acc;
}

// Split "---\n<frontmatter>\n---\n<body>". Returns null when there is no frontmatter.
function splitFrontmatter(text) {
  if (!text.startsWith("---")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  const afterMarker = text.indexOf("\n", end + 1);
  return {
    frontmatter: text.slice(text.indexOf("\n") + 1, end + 1),
    body: afterMarker >= 0 ? text.slice(afterMarker + 1) : ""
  };
}

// Empty a block list key ("source_files:" / "evidence:") without touching any
// other frontmatter line: drop its "  - item" children, keep the bare key.
function emptyListKey(frontmatter, key) {
  const lines = frontmatter.split("\n");
  const out = [];
  let inKey = false;
  for (const line of lines) {
    if (new RegExp(`^${key}:`).test(line)) {
      inKey = true;
      out.push(`${key}:`);
      continue;
    }
    if (inKey) {
      // children are indented; anything at column 0 ends the block
      if (/^\s+/.test(line) && line.trim().length > 0) continue;
      if (line.trim().length === 0) continue;
      inKey = false;
    }
    out.push(line);
  }
  return out.join("\n");
}

function firstHeading(body) {
  for (const line of body.split("\n")) {
    if (line.startsWith("# ")) return line;
  }
  return null;
}

function main() {
  const { src, out, force } = parseArgs(process.argv);
  if (!src || !out) {
    console.error("Usage: node bench/real/make-stub-wiki.mjs --src <repo-root> --out <scratch-dir> [--force]");
    process.exitCode = 3;
    return;
  }
  const srcWiki = resolve(src, "docs", "llm-wiki");
  const outRoot = resolve(out);
  const outWiki = join(outRoot, "docs", "llm-wiki");

  if (!existsSync(srcWiki)) {
    console.error(`No wiki at ${srcWiki}`);
    process.exitCode = 1;
    return;
  }
  if (resolve(src) === outRoot) {
    console.error("Refusing to write the stub into the source repo.");
    process.exitCode = 1;
    return;
  }
  if (existsSync(outWiki)) {
    if (!force) {
      console.error(`${outWiki} already exists. Pass --force to rebuild it.`);
      process.exitCode = 1;
      return;
    }
    rmSync(outWiki, { recursive: true, force: true });
  }

  const files = listMarkdown(srcWiki).sort();
  let srcBytes = 0;
  let outBytes = 0;
  for (const abs of files) {
    const rel = relative(srcWiki, abs);
    const text = readFileSync(abs, "utf8");
    srcBytes += Buffer.byteLength(text, "utf8");

    const parts = splitFrontmatter(text);
    let stub;
    if (!parts) {
      // No frontmatter (not expected in a valid wiki) — keep only the title line.
      stub = `${firstHeading(text) ?? "# Document"}\n\n${PLACEHOLDER_BODY}`;
    } else {
      let fm = emptyListKey(parts.frontmatter, "source_files");
      fm = emptyListKey(fm, "evidence");
      const heading = firstHeading(parts.body);
      stub = `---\n${fm}---\n\n${heading ? `${heading}\n\n` : ""}${PLACEHOLDER_BODY}`;
    }

    const dest = join(outWiki, rel);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, stub, "utf8");
    outBytes += Buffer.byteLength(stub, "utf8");
  }

  // A package.json so detectProject behaves the same way it does on the real target.
  const srcPkg = resolve(src, "package.json");
  if (existsSync(srcPkg)) {
    writeFileSync(join(outRoot, "package.json"), readFileSync(srcPkg, "utf8"), "utf8");
  }

  const pct = srcBytes ? ((outBytes / srcBytes) * 100).toFixed(1) : "0.0";
  console.log(`stub wiki written: ${outWiki}`);
  console.log(`docs: ${files.length}   knowledge bytes: ${srcBytes} -> ${outBytes} (${pct}% retained)`);
  console.log("frontmatter source_files/evidence emptied; bodies replaced with the unenriched placeholder.");
}

main();
