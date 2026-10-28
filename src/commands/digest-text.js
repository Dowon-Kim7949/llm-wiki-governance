// The arithmetic of content digests, shared by source-digests.js (stamping and the
// shadow comparison) and scans.js (the drift narrowing check). A leaf: it imports
// only node:crypto, so neither caller creates an import cycle.
import { createHash } from "node:crypto";

export const DIGEST_MARKER = " sha256:";

// Line endings and a byte-order mark are how a checkout differs from the stored
// blob (core.autocrlf), not what a reviewer read, so neither may change a digest.
export function normalizeDigestContent(text) {
  return String(text).replace(/^﻿/, "").replace(/\r\n/g, "\n");
}

// 64 bits of SHA-256: enough to tell "same text" from "different text" for one
// file, and short enough that a stamp costs one readable line per anchor.
export function digestText(text) {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

// The digest of the cited regions of one file, in locator order, or null when any
// region cannot be located.
export function digestRegions(regions) {
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
