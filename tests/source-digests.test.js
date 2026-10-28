// Content-anchored freshness in shadow mode (P1-5, 2026-10-27). With config
// "sourceDigests": true, `review --approve` stamps one source_digests entry per
// local anchor, and `drift --anchor content` compares those digests with the
// sources now, next to the date verdict. The comparison adds no finding and never
// moves an exit code; these tests pin that boundary as hard as the comparison.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { driftCommand, impactCommand, reviewCommand } from "../src/commands.js";
import { upsertFrontmatterList } from "../src/commands/fix-migrate.js";
import { compareSourceDigests, currentSourceDigests, digestText, formatDigestEntry, parseDigestEntries } from "../src/commands/source-digests.js";
import { parseFrontmatter } from "../src/frontmatter.js";
import { normalizeOptions, resolveOptions } from "../src/index.js";

for (const [name, value] of [["driftCommand", driftCommand], ["reviewCommand", reviewCommand], ["upsertFrontmatterList", upsertFrontmatterList], ["compareSourceDigests", compareSourceDigests], ["resolveOptions", resolveOptions]]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

const GUIDE = ["# Guide", "", "## Install", "", "npm i x", "", "## Usage", "", "call x", ""].join("\n");

function doc({ status = "needs_review", extra = [] } = {}) {
  return [
    "---", "title: Api", "tags:", "  - llm-wiki", `status: ${status}`,
    "doc_type: public_api", "project: digests", "last_updated: 2026-10-01",
    "author: cli-generated", "last_edited_by: t", "wiki_block_version: v1",
    "source_files:", "  - src/app.js",
    "evidence:", "  - src/app.js#L1", "  - guide.md#section:Usage",
    ...extra,
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
    "contains_sensitive_info: false", "---", "", "# Api", "",
    "## Summary", "", "The app exports one function that the guide's Usage section calls.", "",
    "## Evidence", "", "- src/app.js#L1", "- guide.md#section:Usage", ""
  ].join("\n");
}

async function project({ digests }) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-digests-"));
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "src", "app.js"), "export const x = 1;\n", "utf8");
  await writeFile(path.join(cwd, "guide.md"), GUIDE, "utf8");
  await writeFile(path.join(cwd, "docs", "llm-wiki", "api.md"), doc(), "utf8");
  await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify({
    reviewer: "Fixture Reviewer",
    ...(digests === undefined ? {} : { sourceDigests: digests })
  }), "utf8");
  const git = (args) => execFileSync("git", args, { cwd, stdio: "ignore", env: GIT_ENV });
  git(["init", "-q"]);
  git(["config", "core.autocrlf", "false"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-q", "-m", "base"]);
  return { cwd, git, docPath: path.join(cwd, "docs", "llm-wiki", "api.md") };
}

async function approve(cwd) {
  const { options, errors } = await resolveOptions({ cwd, approve: ["docs/llm-wiki/api.md"] });
  assert.deepEqual(errors, []);
  const result = await reviewCommand(options);
  assert.deepEqual(result.approved, ["docs/llm-wiki/api.md"], `approval refused: ${JSON.stringify(result.refused)}`);
}

test("review --approve stamps source_digests only when the project opts in", { skip: !hasGit() }, async () => {
  const off = await project({});
  await approve(off.cwd);
  assert.ok(!(await readFile(off.docPath, "utf8")).includes("source_digests"), "default stamp is unchanged");

  const on = await project({ digests: true });
  await approve(on.cwd);
  const { frontmatter } = parseFrontmatter(await readFile(on.docPath, "utf8"));
  assert.equal(frontmatter.status, "verified");
  const stamped = parseDigestEntries(frontmatter.source_digests);
  assert.deepEqual([...stamped.keys()], ["src/app.js", "guide.md#section:Usage"],
    "a broad anchor is digested whole; a section-only anchor by its section");
});

test("drift --anchor content: a same-day edit is invisible to the date anchor and visible to the content anchor", { skip: !hasGit() }, async () => {
  const { cwd, git } = await project({ digests: true });
  await approve(cwd);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-q", "-m", "approve"]);
  await writeFile(path.join(cwd, "guide.md"), GUIDE.replace("call x", "call y"), "utf8");
  git(["-c", "commit.gpgsign=false", "commit", "-q", "-am", "same-day edit"]);

  const { options } = await resolveOptions({ cwd, anchor: "content" });
  const result = await driftCommand(options);
  assert.equal(result.result, "pass", "the shadow comparison adds no finding");
  assert.deepEqual(result.findings, []);
  const [entry] = result.contentAnchor.documents;
  assert.equal(entry.date, "fresh", "a commit on the review day is inside the date anchor's blind spot");
  assert.equal(entry.content, "changed");
  assert.equal(entry.agree, false);
  assert.deepEqual(entry.changed, [{ key: "guide.md#section:Usage", reason: "content differs" }]);
  assert.match(result.text, /## Content Anchor \(shadow\)/);
  assert.match(result.text, /\| `docs\/llm-wiki\/api\.md` \| fresh \| changed \|/);

  const plain = await driftCommand((await resolveOptions({ cwd })).options);
  assert.equal(plain.contentAnchor, undefined, "without --anchor content the JSON shape is unchanged");
});

test("compareSourceDigests: an edit outside the cited section is not a change; CRLF is not either", { skip: !hasGit() }, async () => {
  const { cwd, docPath } = await project({ digests: true });
  await approve(cwd);
  const stamped = parseFrontmatter(await readFile(docPath, "utf8")).frontmatter;
  await writeFile(path.join(cwd, "guide.md"), GUIDE.replace("npm i x", "pnpm add x").replace(/\n/g, "\r\n"), "utf8");
  assert.deepEqual(await compareSourceDigests(cwd, stamped), { verdict: "unchanged", changed: [] });

  await writeFile(path.join(cwd, "src", "app.js"), "export const x = 2;\n", "utf8");
  assert.deepEqual((await compareSourceDigests(cwd, stamped)).changed, [{ key: "src/app.js", reason: "content differs" }]);
});

test("compareSourceDigests: what cannot be compared is never reported unchanged", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-digests-unit-"));
  const unstamped = parseFrontmatter(doc({ status: "verified" })).frontmatter;
  assert.equal((await compareSourceDigests(cwd, unstamped)).verdict, "unstamped");

  const stamped = parseFrontmatter(doc({ status: "verified", extra: ["source_digests:", "  - src/app.js sha256:0123456789abcdef"] })).frontmatter;
  const result = await compareSourceDigests(cwd, stamped);
  assert.equal(result.verdict, "changed");
  assert.deepEqual(result.changed.map((entry) => entry.reason), ["cannot be read or located now", "not stamped"]);
  assert.deepEqual(await currentSourceDigests(cwd, {}), []);
});

test("a review stamp that adds source_digests is still a stamp-only change for impact", { skip: !hasGit() }, async () => {
  const { cwd } = await project({ digests: true });
  await approve(cwd);
  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.deepEqual(result.stampOnlyExclusions, ["docs/llm-wiki/api.md"]);
});

test("a cited wiki document's review stamp is not a content change", async () => {
  // Found on this repository: one approve-all stamped a document that cites another
  // wiki document, then stamped the cited one, and the first digest was stale
  // minutes later. A Markdown source is digested by its body.
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-digests-md-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  const cited = path.join(cwd, "docs", "llm-wiki", "cited.md");
  await writeFile(cited, "---\ntitle: Cited\nstatus: needs_review\n---\n\n# Cited\n\nBody.\n", "utf8");
  const citing = { status: "verified", source_files: ["docs/llm-wiki/cited.md"] };
  const [before] = await currentSourceDigests(cwd, citing);

  await writeFile(cited, "---\ntitle: Cited\nstatus: verified\nreviewed_at: 2026-10-27\n---\n\n# Cited\n\nBody.\n", "utf8");
  assert.equal((await currentSourceDigests(cwd, citing))[0].digest, before.digest, "a stamp leaves the digest alone");

  await writeFile(cited, "---\ntitle: Cited\nstatus: verified\n---\n\n# Cited\n\nNew body.\n", "utf8");
  assert.notEqual((await currentSourceDigests(cwd, citing))[0].digest, before.digest, "a body edit changes it");
});

test("upsertFrontmatterList replaces the whole block, or appends it", () => {
  const inner = ["title: A", "source_digests:", "  - a sha256:0000000000000000", "- b sha256:1111111111111111", "status: verified"].join("\r\n");
  assert.equal(
    upsertFrontmatterList(inner, "source_digests", ["c sha256:2222222222222222"], "\r\n"),
    ["title: A", "source_digests:", "  - c sha256:2222222222222222", "status: verified"].join("\r\n")
  );
  assert.equal(upsertFrontmatterList("title: A\n", "source_digests", ["x"]), "title: A\nsource_digests:\n  - x");
});

test("config: sourceDigests must be a boolean", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-digests-config-"));
  await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify({ sourceDigests: "yes" }), "utf8");
  const { errors } = await resolveOptions({ cwd });
  assert.ok(errors.some((error) => error.includes("sourceDigests")));
});

// 1.41.0: drift's content verdict reads HEAD. The date verdict beside it reads
// committed history only, and an uncommitted edit made the two disagree for no
// reason (3 of the 6 disagreements measured on this repository, 2026-10-28).
test("drift --anchor content reads HEAD: an uncommitted edit is not a change until it is committed", { skip: !hasGit() }, async () => {
  const { cwd, git, docPath } = await project({ digests: true });
  await approve(cwd);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-q", "-m", "approve"]);
  const stamped = parseFrontmatter(await readFile(docPath, "utf8")).frontmatter;

  await writeFile(path.join(cwd, "src", "app.js"), "export const x = 2;\n", "utf8");
  assert.equal((await compareSourceDigests(cwd, stamped)).verdict, "changed", "the working tree has moved");
  assert.equal((await compareSourceDigests(cwd, stamped, { ref: "HEAD" })).verdict, "unchanged", "HEAD has not");
  const before = await driftCommand((await resolveOptions({ cwd, anchor: "content" })).options);
  assert.equal(before.contentAnchor.documents[0].content, "unchanged");

  git(["-c", "commit.gpgsign=false", "commit", "-q", "-am", "commit the edit"]);
  const after = await driftCommand((await resolveOptions({ cwd, anchor: "content" })).options);
  assert.deepEqual(after.contentAnchor.documents[0].changed, [{ key: "src/app.js", reason: "content differs" }]);
});

// 1.41.0: a manifest of record is digested without its version value, the way
// impact treats it (N-13). Measured on this repository, 2026-10-28: every content
// disagreement after the 1.40.1 release was a package.json whose only change was
// `version`.
test("a version-only change to a manifest of record is not a content change", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-digests-manifest-"));
  const manifest = (fields) => `${JSON.stringify(fields, null, 2)}\n`;
  const base = { name: "x", version: "1.0.0", main: "x.js", workspaces: ["packages/*"] };
  await mkdir(path.join(cwd, "packages", "a"), { recursive: true });
  await mkdir(path.join(cwd, "fixtures", "b"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), manifest(base), "utf8");
  await writeFile(path.join(cwd, "packages", "a", "package.json"), manifest({ name: "a", version: "1.0.0" }), "utf8");
  await writeFile(path.join(cwd, "fixtures", "b", "package.json"), manifest({ name: "b", version: "1.0.0" }), "utf8");
  const frontmatter = { status: "verified", source_files: ["package.json", "packages/a/package.json", "fixtures/b/package.json"], evidence: [] };
  const stamped = { ...frontmatter, source_digests: (await currentSourceDigests(cwd, frontmatter)).map(formatDigestEntry) };
  const changedKeys = async () => (await compareSourceDigests(cwd, stamped)).changed.map((entry) => entry.key);

  await writeFile(path.join(cwd, "package.json"), manifest({ ...base, version: "1.0.1" }), "utf8");
  await writeFile(path.join(cwd, "packages", "a", "package.json"), manifest({ name: "a", version: "2.0.0" }), "utf8");
  await writeFile(path.join(cwd, "fixtures", "b", "package.json"), manifest({ name: "b", version: "2.0.0" }), "utf8");
  assert.deepEqual(await changedKeys(), ["fixtures/b/package.json"],
    "root and workspace manifests ignore the version; a nested manifest no workspace declares does not");

  await writeFile(path.join(cwd, "package.json"), manifest({ ...base, main: "y.js" }), "utf8");
  assert.ok((await changedKeys()).includes("package.json"), "any other field is a change");
  const { version: _v, ...withoutVersion } = base;
  await writeFile(path.join(cwd, "package.json"), manifest(withoutVersion), "utf8");
  assert.ok((await changedKeys()).includes("package.json"), "removing the version field is a change");

  // A digest stamped before 1.41.0 covered the whole file. It is still accepted while
  // the file is unchanged, and reads as changed after the next version bump until
  // the document is approved again.
  await writeFile(path.join(cwd, "package.json"), manifest(base), "utf8");
  const legacy = { ...frontmatter, source_digests: [`package.json sha256:${digestText(manifest(base))}`] };
  const legacyVerdict = async () => (await compareSourceDigests(cwd, { ...legacy, source_files: ["package.json"] })).verdict;
  assert.equal(await legacyVerdict(), "unchanged");
  await writeFile(path.join(cwd, "package.json"), manifest({ ...base, version: "1.0.1" }), "utf8");
  assert.equal(await legacyVerdict(), "changed");
});
