// A wiki document carries its status twice: in `status:` and, for documents that
// have one, as a status tag inside `tags:`. Nothing checked that the two agree.
//
// This is not hypothetical. On 2026-08-03 a downgrade helper wrote the tag as
// `needs_review` (underscore) while this repository's vocabulary is
// `needs-review` (hyphen). `syncStatusTag` only rewrites a status tag it
// recognizes, so it silently left the unrecognized value in place, `review
// --approve` stamped `status: verified` over it, and 13 documents ended up
// claiming both things at once. Every gate stayed green: 467 tests, lint,
// `validate --strict`, `validate-frontmatter --strict`, `drift --strict` and
// `audit` all pass on a document whose two status fields contradict each other.
//
// Scope note: this is a repository guard, not a product rule. Turning it into a
// `content.*` finding would add to the frozen finding surface, which needs an
// explicit decision — the same boundary `tests/review-notes-cap.test.js` and
// `tests/shipped-assets.test.js` sit on.
import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKI = path.join(REPO_ROOT, "docs", "llm-wiki");

// Every spelling a status tag has ever taken here, including the wrong one, so
// the underscore form is caught rather than passing as an ordinary topic tag.
const STATUS_TAGS = new Set(["verified", "needs-review", "needs_review", "draft"]);
const TAG_FOR_STATUS = { verified: "verified", needs_review: "needs-review", draft: "draft" };

async function wikiDocs(dir = WIKI, out = []) {
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await wikiDocs(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function frontmatter(content) {
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---\n", 4);
  return end < 0 ? null : content.slice(4, end);
}

function statusTags(fm) {
  const block = /^tags:\n((?:[ \t]+- .*\n)+)/m.exec(fm);
  if (!block) return [];
  return block[1]
    .split("\n")
    .filter(Boolean)
    .map((line) => line.replace(/^[ \t]+- /, "").trim())
    .filter((tag) => STATUS_TAGS.has(tag));
}

test("no wiki document's status tag contradicts its status field", async () => {
  const offenders = [];
  let checked = 0;

  for (const file of await wikiDocs()) {
    const fm = frontmatter(await readFile(file, "utf8"));
    if (!fm) continue;
    const status = (/^status: (\S+)/m.exec(fm) ?? [])[1];
    if (!status) continue;

    const tags = statusTags(fm);
    if (tags.length === 0) continue; // a document may carry no status tag at all
    checked += 1;

    const expected = TAG_FOR_STATUS[status];
    const rel = path.relative(REPO_ROOT, file).replace(/\\/g, "/");
    if (!expected) offenders.push(`${rel}: unknown status "${status}"`);
    else if (tags.length > 1) offenders.push(`${rel}: ${tags.length} status tags ${JSON.stringify(tags)}`);
    else if (tags[0] !== expected) offenders.push(`${rel}: status "${status}" but tag "${tags[0]}" (expected "${expected}")`);
  }

  assert.ok(checked > 0, "found no wiki document carrying a status tag — the guard would pass vacuously");
  assert.deepEqual(offenders, [], `status tag contradicts status field:\n  ${offenders.join("\n  ")}`);
});

test("the underscore spelling of the status tag never reappears", async () => {
  // The specific mistake, pinned separately: `needs_review` as a TAG is always
  // wrong (the field takes the underscore, the tag takes the hyphen), and it is
  // invisible to syncStatusTag, so it survives an approve/downgrade round trip.
  const offenders = [];
  for (const file of await wikiDocs()) {
    const fm = frontmatter(await readFile(file, "utf8"));
    if (fm && statusTags(fm).includes("needs_review")) {
      offenders.push(path.relative(REPO_ROOT, file).replace(/\\/g, "/"));
    }
  }
  assert.deepEqual(offenders, [], `tags must use "needs-review", not "needs_review":\n  ${offenders.join("\n  ")}`);
});
