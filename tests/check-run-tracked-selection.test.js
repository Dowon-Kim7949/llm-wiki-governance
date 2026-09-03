// Defect N-6 / decision 22 (maintainer, 2026-08-03): make a local check-run
// predict what CI will say.
//
// check-run read the working tree to pick "the newest manifest". In a repository
// that commits its manifests, the newest file on disk right after a run is the
// one the agent just wrote and has not committed — so local went green on a file
// CI's clean checkout cannot see, while CI picked the newest COMMITTED manifest
// and disagreed. The divergence was silent, which is what made it a defect rather
// than a policy difference.
//
// The fix prefers tracked manifests when git tracks any. It deliberately does NOT
// go tracked-only: two of the five repositories measured (this one and one
// adopter) gitignore their manifests entirely, and a tracked-only rule would make
// them permanently report run.manifest_missing — red under --strict, and it would
// break this repository's own documented workflow in AGENTS.md line 75. Those
// repositories fall back to the on-disk set and get an INFO finding saying CI
// will not see the file.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, utimes } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkRunCommand } from "../src/commands.js";
import { normalizeOptions } from "../src/index.js";

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

async function manifestRepo({ gitignoreRuns = false } = {}) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-n6-"));
  const git = (args) => execFileSync("git", args, { cwd, stdio: "ignore", env: GIT_ENV });
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "n6" }, null, 2)}\n`, { encoding: "utf8" });
  await mkdir(path.join(cwd, ".llm-wiki", "runs"), { recursive: true });
  if (gitignoreRuns) await writeFile(path.join(cwd, ".gitignore"), ".llm-wiki/runs/\n", { encoding: "utf8" });
  git(["init"]);
  return { cwd, git };
}

async function writeManifest(cwd, name, timestamp) {
  const file = path.join(cwd, ".llm-wiki", "runs", name);
  await writeFile(file, `${JSON.stringify({ task: "docs-sync", timestamp, changedSource: [], touchedDocs: [], logAppended: true, validated: { ran: true, result: "pass" } }, null, 2)}\n`, { encoding: "utf8" });
  return file;
}

const untrackedNote = (result) => result.findings.filter((f) => f.rule === "run.manifest_untracked");

test("check-run picks the COMMITTED manifest even when a newer one sits uncommitted", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd, git } = await manifestRepo();

  await writeManifest(cwd, "run-a-committed.json", "2026-08-01T10:00:00Z");
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "commit the manifest"]);

  // The agent finishes a run and writes a newer manifest it has not committed yet.
  await writeManifest(cwd, "run-b-uncommitted.json", "2026-08-02T10:00:00Z");

  const result = await checkRunCommand(normalizeOptions({ cwd }));
  assert.match(result.manifest, /run-a-committed\.json$/, "selection must match what a clean checkout would see");
  assert.equal(untrackedNote(result).length, 0, "nothing to warn about — local and CI agree");
});

test("with no tracked manifest at all, check-run still works and says CI will not see it", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await manifestRepo({ gitignoreRuns: true });
  await writeManifest(cwd, "run-only.json", "2026-08-02T10:00:00Z");

  const result = await checkRunCommand(normalizeOptions({ cwd }));
  assert.match(result.manifest, /run-only\.json$/, "a gitignore policy must stay locally usable");
  const note = untrackedNote(result);
  assert.equal(note.length, 1);
  assert.equal(note[0].severity, "info", "info, not warning: --strict must not punish a legitimate policy");
  assert.match(note[0].message, /clean checkout/);
  assert.equal(result.result, "pass");
});

test("the untracked note never turns a passing run into a failing one, even under --strict", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd } = await manifestRepo({ gitignoreRuns: true });
  await writeManifest(cwd, "run-only.json", "2026-08-02T10:00:00Z");
  const strict = await checkRunCommand(normalizeOptions({ cwd, strict: true }));
  assert.equal(strict.result, "pass");
});

test("--run still overrides selection outright", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd, git } = await manifestRepo();
  await writeManifest(cwd, "run-a-committed.json", "2026-08-01T10:00:00Z");
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "commit"]);
  await writeManifest(cwd, "run-b-uncommitted.json", "2026-08-02T10:00:00Z");

  const result = await checkRunCommand(normalizeOptions({ cwd, run: ".llm-wiki/runs/run-b-uncommitted.json" }));
  assert.match(result.manifest, /run-b-uncommitted\.json$/, "an explicit --run is the operator's choice, not a guess");
});

test("outside a git repository nothing changes and no note is emitted", async (t) => {
  // trackedPaths returns null (unknown) rather than an empty set, so a
  // non-repository is not mistaken for "a repository that tracks nothing".
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-n6-nogit-"));
  await mkdir(path.join(cwd, ".llm-wiki", "runs"), { recursive: true });
  await writeManifest(cwd, "run-only.json", "2026-08-02T10:00:00Z");

  const result = await checkRunCommand(normalizeOptions({ cwd }));
  assert.match(result.manifest, /run-only\.json$/);
  assert.equal(untrackedNote(result).length, 0);
});

test("selection stays deterministic among tracked manifests", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const { cwd, git } = await manifestRepo();
  await writeManifest(cwd, "run-old.json", "2026-08-01T10:00:00Z");
  await writeManifest(cwd, "run-new.json", "2026-08-05T10:00:00Z");
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "commit", "-m", "commit both"]);

  // mtime deliberately contradicts the manifest timestamps; the field wins.
  const old = new Date("2026-08-09T00:00:00Z");
  await utimes(path.join(cwd, ".llm-wiki", "runs", "run-old.json"), old, old);

  const first = await checkRunCommand(normalizeOptions({ cwd }));
  const second = await checkRunCommand(normalizeOptions({ cwd }));
  assert.match(first.manifest, /run-new\.json$/);
  assert.equal(first.manifest, second.manifest);
});
