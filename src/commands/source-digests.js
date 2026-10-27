// Content-anchored freshness, shadow mode (P1-5, 2026-10-27). Date drift asks
// "did a commit touch this file after reviewed_at?", which misses a change that
// lands later through an old branch (N-15: the commit date predates the review)
// and cannot tell a same-day edit from no edit. A digest of what the reviewer
// actually read answers "is this the text that was reviewed?" independently of
// dates, SHAs, and merge strategy.
//
// Shadow only: `review --approve` stamps `source_digests` when the project sets
// "sourceDigests": true, and `drift --anchor content` prints how the two anchors
// agree. Neither produces a finding or moves an exit code; nothing replaces the
// date check until the comparison has been measured on real repositories.
import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import path from "node:path";
import { readUtf8 } from "../encoding.js";
import { locatedRegion, locatorLabel, narrowingLocators, verifiedSourceAnchors } from "./scans.js";

const DIGEST_MARKER = " sha256:";

// Line endings and a byte-order mark are how a checkout differs from the stored
// blob (core.autocrlf), not what a reviewer read, so neither may change a digest.
function normalizeContent(text) {
  return String(text).replace(/^﻿/, "").replace(/\r\n/g, "\n");
}

// 64 bits of SHA-256: enough to tell "same text" from "different text" for one
// file, and short enough that a stamp costs one readable line per anchor.
export function digestText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

// One entry per local anchor of a document, in anchor order. The key is the
// source path plus, when the file is cited only through line or section
// locators (the same rule impact uses to narrow), those locators — so the digest
// covers exactly what the document cites. `digest` is null when it cannot be
// computed: a missing file, a directory anchor, or a region that cannot be
// located. Status is ignored: a needs_review document is being approved.
export async function currentSourceDigests(cwd, frontmatter) {
  const anchors = verifiedSourceAnchors({ ...frontmatter, status: "verified" });
  if (!anchors) return [];
  const entries = [];
  for (const source of anchors.files) {
    const locators = narrowingLocators(anchors, source);
    const key = locators ? `${source}${locators.map(locatorLabel).join("")}` : source;
    entries.push({ key, source, digest: await digestFor(cwd, source, locators) });
  }
  return entries;
}

async function digestFor(cwd, source, locators) {
  let content;
  try {
    const abs = path.join(cwd, ...source.split("/"));
    if (!(await stat(abs)).isFile()) return null;
    content = normalizeContent(await readUtf8(abs));
  } catch {
    return null;
  }
  if (!locators) return digestText(content);
  const regions = locators.map((locator) => locatedRegion(content, locator));
  if (regions.some((region) => region === null)) return null;
  return digestText(regions.join("\u0000"));
}

export function formatDigestEntry({ key, digest }) {
  return `${key}${DIGEST_MARKER}${digest}`;
}

// The stamped list as key -> digest. Entries that do not end in a 16-hex digest
// are skipped rather than guessed at; a key may itself contain spaces (a section
// heading), so the marker is searched from the end.
export function parseDigestEntries(list) {
  const stamped = new Map();
  for (const entry of Array.isArray(list) ? list : []) {
    if (typeof entry !== "string") continue;
    const at = entry.lastIndexOf(DIGEST_MARKER);
    if (at <= 0) continue;
    const digest = entry.slice(at + DIGEST_MARKER.length).trim();
    if (!/^[0-9a-f]{16}$/.test(digest)) continue;
    stamped.set(entry.slice(0, at).trim(), digest);
  }
  return stamped;
}

// Compares a document's stamped digests with its sources now. `unstamped` when the
// document carries none; otherwise `changed` lists every current anchor whose
// digest differs, is missing from the stamp, or cannot be computed now — an
// anchor the comparison cannot vouch for is never reported as unchanged.
export async function compareSourceDigests(cwd, frontmatter) {
  const stamped = parseDigestEntries(frontmatter?.source_digests);
  if (stamped.size === 0) return { verdict: "unstamped", changed: [] };
  const changed = [];
  for (const entry of await currentSourceDigests(cwd, frontmatter)) {
    const before = stamped.get(entry.key);
    if (!before) changed.push({ key: entry.key, reason: "not stamped" });
    else if (entry.digest === null) changed.push({ key: entry.key, reason: "cannot be read or located now" });
    else if (entry.digest !== before) changed.push({ key: entry.key, reason: "content differs" });
  }
  return { verdict: changed.length > 0 ? "changed" : "unchanged", changed };
}
