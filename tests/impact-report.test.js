// impact as a pull-request report (1.35.0): the JSON gains the changed paths and,
// per impacted document, the changed sources it cites; the text (already Markdown)
// gains a "Documents to re-review" table; the composite action can hand that text
// to the job summary. All additive: changedFiles stays a count, findings and the
// exit code are unchanged.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { impactCommand } from "../src/commands.js";
import { normalizeOptions } from "../src/index.js";

// Same guard as impact-package-version-only.test.js: a missing import must not turn
// this file into silently skipped tests.
for (const [name, value] of [["execFileSync", execFileSync], ["impactCommand", impactCommand], ["normalizeOptions", normalizeOptions]]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

function hasGit() {
  try { execFileSync("git", ["--version"], { stdio: "ignore" }); return true; } catch { return false; }
}

const GIT_ENV = { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" };

function verifiedDoc(cites) {
  return [
    "---", "title: Api", "tags:", "  - llm-wiki", "  - verified", "status: verified",
    "doc_type: public_api", "project: report", "last_updated: 2026-07-11",
    "author: cli-generated", "reviewed_by: Someone", "reviewed_at: 2026-07-11",
    "wiki_block_version: v1", "source_files:", ...cites.map((c) => `  - ${c}`),
    "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
    "contains_sensitive_info: false", "---", "", "# Api", "", "Describes the sources.", ""
  ].join("\n");
}

async function repo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-impact-report-"));
  await writeFile(path.join(cwd, "a.ts"), "one\n", { encoding: "utf8" });
  await writeFile(path.join(cwd, "b.ts"), "one\n", { encoding: "utf8" });
  await writeFile(path.join(cwd, "unrelated.ts"), "one\n", { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "api.md"), verifiedDoc(["a.ts", "b.ts"]), { encoding: "utf8" });
  const git = (args) => execFileSync("git", args, { cwd, stdio: "ignore", env: { ...process.env, ...GIT_ENV } });
  git(["init", "-q"]);
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "base"]);
  return cwd;
}

test("impact report: JSON names the changed paths and each impacted document's changed sources", { skip: !hasGit() }, async () => {
  const cwd = await repo();
  await writeFile(path.join(cwd, "a.ts"), "two\n", { encoding: "utf8" });
  await writeFile(path.join(cwd, "b.ts"), "two\n", { encoding: "utf8" });

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(result.result, "fail", "the gate still fails as before");
  assert.equal(result.changedFiles, 2, "changedFiles stays a count");
  assert.deepEqual(result.changedPaths, ["a.ts", "b.ts"]);
  assert.deepEqual(result.impactedDocuments, [{ path: "docs/llm-wiki/api.md", sources: ["a.ts", "b.ts"] }]);
  assert.ok(result.findings.some((finding) => finding.rule === "impact.source_changed"), "findings are unchanged");

  assert.match(result.text, /## Documents to re-review/);
  assert.ok(result.text.includes("| `docs/llm-wiki/api.md` | `a.ts`, `b.ts` |"), "one table row per impacted document");
  assert.ok(result.text.indexOf("## Documents to re-review") < result.text.indexOf("## Finding Summary"), "the table comes before the finding list");
});

test("impact report: nothing impacted means an empty list and a 'none' section", { skip: !hasGit() }, async () => {
  const cwd = await repo();
  await writeFile(path.join(cwd, "unrelated.ts"), "two\n", { encoding: "utf8" });

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(result.result, "pass");
  assert.deepEqual(result.changedPaths, ["unrelated.ts"]);
  assert.deepEqual(result.impactedDocuments, []);
  assert.match(result.text, /## Documents to re-review\n- none/);
});

test("impact report: the unavailable path carries the same keys, empty", async () => {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-impact-nogit-"));
  const result = await impactCommand(normalizeOptions({ cwd, since: "no-such-ref-for-this-test" }));
  assert.equal(result.result, "fail");
  assert.deepEqual(result.changedPaths, []);
  assert.deepEqual(result.impactedDocuments, []);
});

test("composite action: the job summary is opt-out and never changes the exit code", async () => {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  const action = await readFile(path.join(root, ".github", "actions", "validate", "action.yml"), "utf8");
  const lines = action.split(String.fromCharCode(10));
  const declared = lines.findIndex((line) => line.trimEnd() === "  summary:");
  assert.ok(declared >= 0, "action.yml must declare a `summary` input");
  const defaultLine = lines.slice(declared + 1, declared + 6).find((line) => /^\s*default:/.test(line));
  assert.equal((defaultLine ?? "").trim(), 'default: "true"');
  assert.match(action, /-n "\$\{GITHUB_STEP_SUMMARY:-\}"/, "only where a job summary exists");
  assert.match(action, /\|\| status=\$\?/, "the command's status is captured, not swallowed");
  assert.match(action, /exit "\$status"/, "and the step exits with it");
});
