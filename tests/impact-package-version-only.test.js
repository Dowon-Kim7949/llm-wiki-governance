// N-13 / decision (c) (maintainer, 2026-08-04): a `package.json` diff that moves
// nothing but `version` is not a source change for reverse-impact.
//
// A release commit changes `package.json` by definition, and 10 of this
// repository's 18 non-exempt `verified` documents cite that file. Since decision
// 21 made `impact.source_changed` an error by default, every release therefore
// reddened CI for documents whose claims had not moved — measured here as 10 -> 0
// for a `package.json`-only diff, and 11 -> 4 for the eight version-bearing files
// a release touches (`package.json`, CHANGELOG x2, README x2, ROADMAP x2, the
// pinned action). The alternatives were rejected: re-reviewing the fanout every
// release writes "unchanged" notes into a 5-entry cap until the gate is a rubber
// stamp, and dialing the rule down per project would drop the block for ALL
// source changes, not just this one.
//
// The recorded limits stay on the record: this does NOT reach 0. The 4 documents
// that survive cite README.md / ROADMAP.md / the action, whose CONTENT really did
// change, so they are closer to true positives than to noise. And the exclusion
// is deliberately `package.json`-only — `pyproject.toml` and `Cargo.toml` would
// need a parser, which breaks the zero-dependency invariant; JSON is built in.
//
// Everything here is conservative-by-default: anything the predicate cannot prove
// is version-only stays in the change set and keeps failing the build.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { impactCommand } from "../src/commands.js";
import { normalizeOptions } from "../src/index.js";

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

const BASE_PKG = { name: "pkgv", version: "1.0.0", engines: { node: ">=18.18.0" }, bin: { "llm-wiki": "bin/llm-wiki.js" } };

function doc(cites) {
  return [
    "---", "title: Api", "tags:", "  - llm-wiki", "  - verified", "status: verified",
    "doc_type: public_api", "project: pkgv", "last_updated: 2026-07-11",
    "author: cli-generated", "reviewed_by: Someone", "reviewed_at: 2026-07-11",
    "wiki_block_version: v1", "source_files:", `  - ${cites}`, "evidence:", `  - ${cites}`,
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
    "contains_sensitive_info: false", "---", "", "# Api", "",
    `Describes ${cites}.`, "", "## Evidence", "", `- ${cites} — the file this document describes.`, ""
  ].join("\n");
}

// A repository whose one verified document cites `cites` (default: the manifest),
// committed once so HEAD is a usable baseline. `pkg` is the committed manifest;
// pass null to commit no manifest at all (the new-file case).
async function pkgRepo({ pkg = BASE_PKG, cites = "package.json", pkgText = null } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-pkg-version-"));
  if (pkgText !== null) {
    await writeFile(path.join(cwd, "package.json"), pkgText, { encoding: "utf8" });
  } else if (pkg) {
    await writeFile(path.join(cwd, "package.json"), `${JSON.stringify(pkg, null, 2)}\n`, { encoding: "utf8" });
  }
  await writeFile(path.join(cwd, "a.ts"), "one\n", { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "api.md"), doc(cites), { encoding: "utf8" });
  const git = (args) => execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, ...GIT_ENV } });
  git(["init"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "init"]);
  return { cwd, git };
}

const writePkg = (cwd, value, relPath = "package.json") => writeFile(
  path.join(cwd, ...relPath.split("/")),
  typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`,
  { encoding: "utf8" }
);

const impactFindings = (result) => result.findings.filter((f) => f.rule === "impact.source_changed");

test("a version-only manifest bump does not impact the documents that cite it", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await pkgRepo();
  await writePkg(cwd, { ...BASE_PKG, version: "1.1.0" });

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(impactFindings(result).length, 0, "nothing a document claims depends on the version field");
  assert.equal(result.result, "pass", "so a release commit no longer fails the build on its own manifest");
  assert.equal(result.changedFiles, 1, "the file is still REPORTED as changed — only its anchoring is dropped, or validate --changed and prepare would silently narrow too");
  assert.deepEqual(result.versionOnlyExcluded, ["package.json"], "and the exclusion is named in the payload rather than applied silently");
});

test("the same bump is excluded through --since, the shape CI runs", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd, git } = await pkgRepo();
  await writePkg(cwd, { ...BASE_PKG, version: "1.1.0" });
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "release"]);

  const result = await impactCommand(normalizeOptions({ cwd, since: "HEAD~1", strict: true }));
  assert.equal(impactFindings(result).length, 0, "CI runs impact --since <base> --strict; the committed case must match the working-tree case");
  assert.equal(result.result, "pass");
});

test("any other manifest key still counts as a source change", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  for (const [label, next] of [
    ["engines", { ...BASE_PKG, engines: { node: ">=20" } }],
    ["a new dependency", { ...BASE_PKG, dependencies: { chalk: "^5" } }],
    ["a removed key", { name: BASE_PKG.name, version: BASE_PKG.version, engines: BASE_PKG.engines }],
    ["version AND engines together", { ...BASE_PKG, version: "2.0.0", engines: { node: ">=20" } }]
  ]) {
    const { cwd } = await pkgRepo();
    await writePkg(cwd, next);
    const result = await impactCommand(normalizeOptions({ cwd }));
    assert.equal(impactFindings(result).length, 1, `${label} changed: the gate must still fire`);
    assert.equal(impactFindings(result)[0].severity, "error", `${label} changed: still an error by default`);
    assert.deepEqual(result.versionOnlyExcluded, [], `${label} changed: nothing was excluded`);
  }
});

test("adding or removing the version field is not a version-only change", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // Deleting `version` from both sides before comparing would call this
  // "version-only" and silently exclude it. A manifest gaining or losing the
  // field is a real event, and the predicate must require a string on BOTH sides.
  const removed = await pkgRepo();
  await writePkg(removed.cwd, { name: BASE_PKG.name, engines: BASE_PKG.engines, bin: BASE_PKG.bin });
  assert.equal(impactFindings(await impactCommand(normalizeOptions({ cwd: removed.cwd }))).length, 1, "version removed");

  const added = await pkgRepo({ pkg: { name: BASE_PKG.name, engines: BASE_PKG.engines, bin: BASE_PKG.bin } });
  await writePkg(added.cwd, BASE_PKG);
  assert.equal(impactFindings(await impactCommand(normalizeOptions({ cwd: added.cwd }))).length, 1, "version added");
});

test("unparseable JSON on either side is never excluded", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const broken = await pkgRepo();
  await writePkg(broken.cwd, "{ not json\n");
  assert.equal(impactFindings(await impactCommand(normalizeOptions({ cwd: broken.cwd }))).length, 1, "new side unparseable");

  const brokenBase = await pkgRepo({ pkgText: "{ not json\n" });
  await writePkg(brokenBase.cwd, BASE_PKG);
  assert.equal(impactFindings(await impactCommand(normalizeOptions({ cwd: brokenBase.cwd }))).length, 1, "baseline side unparseable");
});

test("a manifest with no baseline blob is never excluded", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // Untracked, so `git show HEAD:package.json` fails. A failed read must mean
  // "unknown", never "unchanged" — git failure has to fail closed.
  const { cwd } = await pkgRepo({ pkg: null });
  await writePkg(cwd, BASE_PKG);
  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(impactFindings(result).length, 1, "a file with nothing to compare against stays in the change set");
  assert.deepEqual(result.versionOnlyExcluded, []);
});

test("the exclusion does not swallow the unavailable branch", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await pkgRepo();
  const result = await impactCommand(normalizeOptions({ cwd, since: "no-such-ref" }));
  assert.equal(result.result, "fail", "a bad --since ref must still fail loudly");
  assert.equal(result.findings.filter((f) => f.rule === "impact.unavailable").length, 1);
});

test("a workspace manifest is excluded by the same rule", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // The predicate matches on basename, so a monorepo's package manifests behave
  // like the root one. Only `package.json` — a TOML manifest would need a parser.
  const { cwd, git } = await pkgRepo({ cites: "packages/a/package.json" });
  await mkdir(path.join(cwd, "packages", "a"), { recursive: true });
  await writePkg(cwd, BASE_PKG, "packages/a/package.json");
  // Commit the workspace manifest so it has a baseline, then bump only its version.
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "add workspace"]);
  await writePkg(cwd, { ...BASE_PKG, version: "1.2.0" }, "packages/a/package.json");

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(impactFindings(result).length, 0);
  assert.deepEqual(result.versionOnlyExcluded, ["packages/a/package.json"]);
});

test("the command tells the reader when it excluded something", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  // Shipped text in this repository has outlived the behaviour it described twice
  // (N-10, and the drift caveats before it). An exclusion nobody can see in the
  // output is the same failure mode: the count would drop with no stated reason.
  const { cwd } = await pkgRepo();
  await writePkg(cwd, { ...BASE_PKG, version: "1.1.0" });
  const printed = (await impactCommand(normalizeOptions({ cwd }))).text;
  assert.match(printed, /version-only/i, "the summary/caveats must name the exclusion");
  assert.match(printed, /package\.json/, "and name the file it applied to");
});
