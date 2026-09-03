// The status field of assets we SHIP, which no other gate can see (2026-08-03).
//
// `validate` and `validate-frontmatter` scan `docs/llm-wiki`. Everything under
// `templates/`, `adapters/`, `rules/`, and `profiles/` ships to npm via
// package.json `files[]` and is outside that scan, so the frontmatter contract
// this product enforces on its users does not apply to its own shipped assets.
//
// That blind spot was demonstrated, not imagined: a sweep flipped
// `templates/core/wiki-document.md`, `adapters/README.md`, and `rules/README.md`
// from `needs_review` to `verified` with no `reviewed_by`/`reviewed_at` at all,
// and the full suite (442 tests), `lint`, `validate --strict`, and
// `validate-frontmatter --strict` all stayed green. The document template — the
// one that shows an adopter what a new wiki document looks like — shipped saying
// `status: verified`, which is the exact opposite of this product's central rule.
//
// Two invariants, both RED against that state:
//   1. A template must never seed `verified`. It seeds new documents, and
//      "verified is a human decision" has to hold at the moment of creation.
//   2. A shipped asset that claims `verified` must carry the review metadata the
//      wiki contract requires. Otherwise it asserts a human review that never
//      happened, in a file no validator will ever read.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The ship surface comes from package.json rather than a hand-copied list, so a
// newly shipped directory is reported as shipped the day it is added.
async function shippedDirs() {
  const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  return new Set(pkg.files);
}

const SKIP_DIRS = new Set([
  "node_modules", ".git", ".github", "outputs", "tmp", ".obsidian", ".llm-wiki"
]);

async function markdownFilesUnder(dir, { skip = [] } = {}) {
  const skipPaths = new Set(skip.map((entry) => path.join(repoRoot, entry)));
  const out = [];
  async function walk(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || skipPaths.has(full)) continue;
        await walk(full);
      } else if (entry.name.endsWith(".md")) out.push(full);
    }
  }
  await walk(path.join(repoRoot, dir));
  return out;
}

// Deliberately a plain line scan rather than the project's frontmatter parser:
// these files include template placeholders (`{{ title }}`), and the point is to
// read the shipped bytes the way a person opening the file would.
function frontmatterField(text, key) {
  const match = text.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

function rel(file) {
  return path.relative(repoRoot, file).split(path.sep).join("/");
}

test("no shipped template seeds a verified document", async () => {
  const files = await markdownFilesUnder("templates");
  assert.ok(files.length > 0, "guard: templates/ must ship markdown, or this test checks nothing");

  const offenders = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const status = frontmatterField(text, "status");
    if (status === null) continue;
    if (status !== "needs_review") offenders.push(`${rel(file)}: status: ${status}`);
  }

  assert.deepEqual(
    offenders,
    [],
    `a template that seeds documents must seed needs_review; verified is a human decision:\n${offenders.join("\n")}`
  );
});

// Scope is every markdown outside `docs/llm-wiki`, not just the shipped dirs: the
// blind spot is the scan boundary, and `tests/fixtures/README.md` was flipped too.
// Shipped offenders are labelled because they are the ones that reach adopters.
test("markdown outside the wiki scan does not claim verified without review metadata", async () => {
  const shipped = await shippedDirs();
  const files = await markdownFilesUnder(".", { skip: ["docs/llm-wiki"] });
  assert.ok(files.length > 0, "guard: the walk found no markdown at all");

  const offenders = [];
  let declaresStatus = 0;
  for (const file of files) {
    const text = await readFile(file, "utf8");
    const status = frontmatterField(text, "status");
    if (status === null) continue;
    declaresStatus++;
    if (status !== "verified") continue;
    const missing = ["reviewed_by", "reviewed_at"].filter((key) => !frontmatterField(text, key));
    if (!missing.length) continue;
    const relPath = rel(file);
    const ships = shipped.has(relPath.split("/")[0]) ? " [SHIPS to npm]" : "";
    offenders.push(`${relPath}: verified without ${missing.join(", ")}${ships}`);
  }

  assert.ok(declaresStatus > 0, "guard: no file outside the wiki declares a status field; the scan checked nothing");
  assert.deepEqual(
    offenders,
    [],
    `these sit outside the wiki scan, so no validator can report them:\n${offenders.join("\n")}`
  );
});
