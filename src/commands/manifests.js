// Package-manifest rules shared by `impact` (N-13) and content digests. A leaf: it
// imports nothing, so commands.js and source-digests.js can both use it without a
// cycle.

export const MANIFEST_BASENAME = "package.json";

export function parseJsonObject(text) {
  if (typeof text !== "string") return null;
  try {
    // A BOM-prefixed manifest is valid on disk but not to JSON.parse; treating it
    // as unparseable would only mean "not excluded", but it would do so for the
    // wrong reason. Arrays and scalars are not manifests.
    const value = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}

// Directory prefixes a nested manifest must sit under to count as a package
// manifest of record: the literal head of each `workspaces` glob in the ROOT
// manifest. Without a declaration, a nested package.json is a fixture, a vendored
// copy, or a sample — and its `version` may be test input rather than a release
// number, which is exactly the case the exclusion below must not swallow.
export function workspacePrefixes(rootManifest) {
  const declared = Array.isArray(rootManifest?.workspaces)
    ? rootManifest.workspaces
    : Array.isArray(rootManifest?.workspaces?.packages)
      ? rootManifest.workspaces.packages
      : [];
  return declared
    .filter((entry) => typeof entry === "string" && entry.trim())
    .map((entry) => {
      const head = entry.includes("*") ? entry.slice(0, entry.indexOf("*")) : `${entry}/`;
      return head.endsWith("/") ? head : `${head.slice(0, head.lastIndexOf("/") + 1)}`;
    })
    .filter(Boolean);
}

// True for the root manifest and for a manifest under a declared workspace: the
// same set N-13 treats as a package manifest of record.
export function isManifestOfRecord(relPath, rootManifest) {
  if (relPath === MANIFEST_BASENAME) return true;
  if (!relPath.endsWith(`/${MANIFEST_BASENAME}`)) return false;
  return workspacePrefixes(rootManifest).some((prefix) => relPath.startsWith(prefix));
}

// The manifest as text with its `version` value left out, or null when that cannot
// be done honestly: unparseable, or no string `version` to leave out. Whether the
// field exists still counts, and the remaining keys keep their order (N-13: Node
// resolves conditional exports in key order, so a reorder is a real change).
export function versionNeutralManifest(text) {
  const manifest = parseJsonObject(text);
  if (!manifest || typeof manifest.version !== "string") return null;
  const { version: _version, ...rest } = manifest;
  return `${JSON.stringify(rest)}\u0000version`;
}
