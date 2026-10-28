// Content-anchored freshness (P1-5, 2026-10-27). Date drift asks "did a commit
// touch this file after reviewed_at?", which misses a change that lands later
// through an old branch (N-15: the commit date predates the review) and cannot
// tell a same-day edit from no edit. A digest of what the reviewer actually read
// answers "is this the text that was reviewed?" independently of dates, SHAs, and
// merge strategy.
//
// `review --approve` stamps `source_digests` when the project sets
// "sourceDigests": true. `drift --anchor content` prints how the two anchors agree
// and decides nothing. Since 1.41.0 drift also uses a stamped region digest as a
// third condition before it narrows a citation away (see scanEvidenceDriftDetailed);
// that can only keep a finding, never remove one.
import { stat } from "node:fs/promises";
import path from "node:path";
import { readUtf8 } from "../encoding.js";
import { parseFrontmatter } from "../frontmatter.js";
import { blobAtRefFromCwd } from "../git.js";
import { citationDigestKey, locatedRegion, narrowingLocators, verifiedSourceAnchors } from "./scans.js";
import { digestRegions, digestText, normalizeDigestContent, parseDigestEntries } from "./digest-text.js";
import { MANIFEST_BASENAME, isManifestOfRecord, parseJsonObject, versionNeutralManifest } from "./manifests.js";

export { digestText, formatDigestEntry, parseDigestEntries } from "./digest-text.js";

// A reader for one side of the comparison: the working tree (what a reviewer sees
// when they approve) or a commit (what drift's date checks see: committed history
// only). Returns normalized text, or null when the path is not a readable file.
function sourceReader(cwd, ref) {
  if (ref) {
    return async (source) => {
      const text = blobAtRefFromCwd(cwd, ref, source);
      return text === null ? null : normalizeDigestContent(text);
    };
  }
  return async (source) => {
    try {
      const abs = path.join(cwd, ...source.split("/"));
      if (!(await stat(abs)).isFile()) return null;
      return normalizeDigestContent(await readUtf8(abs));
    } catch {
      return null;
    }
  };
}

// One entry per local anchor of a document, in anchor order. The key is the
// source path plus, when the file is cited only through line or section
// locators (the same rule impact uses to narrow), those locators — so the digest
// covers exactly what the document cites. `digest` is null when it cannot be
// computed: a missing file, a directory anchor, or a region that cannot be
// located. `legacy` is set for a manifest of record: the whole-file digest that
// versions before 1.41.0 stamped, still accepted by the comparison. Status is
// ignored: a needs_review document is being approved. With { ref }, sources are
// read from that commit instead of the working tree.
export async function currentSourceDigests(cwd, frontmatter, { ref = null } = {}) {
  const anchors = verifiedSourceAnchors({ ...frontmatter, status: "verified" });
  if (!anchors) return [];
  const read = sourceReader(cwd, ref);
  let rootManifest;
  const entries = [];
  for (const source of anchors.files) {
    const locators = narrowingLocators(anchors, source);
    const key = locators ? citationDigestKey(source, locators) : source;
    const content = await read(source);
    if (content === null) {
      entries.push({ key, source, digest: null });
      continue;
    }
    if (locators) {
      entries.push({ key, source, digest: digestRegions(locators.map((locator) => locatedRegion(content, locator))) });
      continue;
    }
    const whole = digestText(digestedText(source, content));
    if (rootManifest === undefined) {
      rootManifest = source === MANIFEST_BASENAME ? parseJsonObject(content) : parseJsonObject(await read(MANIFEST_BASENAME));
    }
    const neutral = isManifestOfRecord(source, rootManifest) ? versionNeutralManifest(content) : null;
    entries.push(neutral === null
      ? { key, source, digest: whole }
      : { key, source, digest: digestText(neutral), legacy: whole });
  }
  return entries;
}

// A Markdown source with frontmatter is digested by its body alone. Its frontmatter
// carries the review stamp, and one `review --approve-all` that stamps two
// documents where one cites the other changed the cited file after the citing one
// had been digested — a stale digest minutes old, measured on this repository.
// Locators already point into the body, so only whole-file digests change.
//
// A manifest of record (the root package.json, or one under a declared workspace)
// is digested without its `version` value, as `impact` already treats it (N-13): a
// release changes the version by definition, and no document's claims depend on it.
function digestedText(source, content) {
  if (!/\.mdx?$/i.test(source)) return content;
  const parsed = parseFrontmatter(content);
  return parsed.frontmatter ? parsed.body : content;
}

// Compares a document's stamped digests with its sources now. `unstamped` when the
// document carries none; otherwise `changed` lists every current anchor whose
// digest differs, is missing from the stamp, or cannot be computed now — an
// anchor the comparison cannot vouch for is never reported as unchanged. With
// { ref }, "now" is that commit rather than the working tree; drift passes HEAD so
// that both of its verdicts read committed history.
export async function compareSourceDigests(cwd, frontmatter, { ref = null } = {}) {
  const stamped = parseDigestEntries(frontmatter?.source_digests);
  if (stamped.size === 0) return { verdict: "unstamped", changed: [] };
  const changed = [];
  for (const entry of await currentSourceDigests(cwd, frontmatter, { ref })) {
    const before = stamped.get(entry.key);
    if (!before) changed.push({ key: entry.key, reason: "not stamped" });
    else if (entry.digest === null) changed.push({ key: entry.key, reason: "cannot be read or located now" });
    else if (entry.digest !== before && entry.legacy !== before) changed.push({ key: entry.key, reason: "content differs" });
  }
  return { verdict: changed.length > 0 ? "changed" : "unchanged", changed };
}
