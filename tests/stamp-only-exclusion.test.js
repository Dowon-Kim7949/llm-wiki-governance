// N-9: `impact` does not flag a document that appears in the diff, on the reading
// "the document was updated in this change, so it is not an omission". A review
// stamp satisfies that test without anyone re-reading anything, so one unrelated
// `review --approve-all` inside a PR's range exempts every document it stamped for
// the whole PR. Measured harm (case C-1): a stale contract description passed the
// gate exactly that way.
//
// The fix here is a REPORT, not an enforcement change, and that is deliberate. The
// same self-exclusion is how the documented remediation clears a finding —
// `drift --downgrade`, then `review --approve-all` — so making a stamp stop
// exempting a document would leave real drift with no resolution path, which is
// defect N-11 pointing the other way. Closing both needs a decision about what
// re-affirmation is; until then the reader is told which documents this run did not
// really check, and no exit code moves.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { impactCommand } from "../src/commands.js";
import { normalizeOptions } from "../src/index.js";

function hasGit() {
  try {
    execFileSync("git", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const docText = (name, { status = "verified", reviewedAt = "2026-01-01", body = "Describes a.ts." } = {}) => [
  "---", `title: ${name}`, "tags:", "  - llm-wiki",
  status === "verified" ? "  - verified" : "  - needs-review",
  `status: ${status}`,
  "doc_type: public_api", "project: stamp-only", "last_updated: 2026-01-01",
  "author: cli-generated", "last_edited_by: t", "reviewed_by: t", `reviewed_at: ${reviewedAt}`,
  "wiki_block_version: v1", "source_files:", "  - a.ts", "evidence:", "  - a.ts",
  "related:", "  - docs/llm-wiki/index.md", "visibility: internal",
  "contains_sensitive_info: false", "---", "", `# ${name}`, "", body, ""
].join("\n");

async function repo() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-stamp-only-"));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ name: "stamp-only" }, null, 2)}\n`, { encoding: "utf8" });
  await writeFile(path.join(cwd, "a.ts"), "one\n", { encoding: "utf8" });
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "stamped.md"), docText("stamped"), { encoding: "utf8" });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "rewritten.md"), docText("rewritten"), { encoding: "utf8" });
  await writeFile(path.join(cwd, "docs", "llm-wiki", "untouched.md"), docText("untouched"), { encoding: "utf8" });

  const git = (args) => execFileSync("git", args, {
    cwd,
    stdio: "ignore",
    env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@e", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@e" }
  });
  git(["init"]);
  git(["add", "-A"]);
  git(["-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@e", "commit", "-m", "init"]);

  // The anchored source moves.
  await writeFile(path.join(cwd, "a.ts"), "one\ntwo\n", { encoding: "utf8" });
  return cwd;
}

test("a review-stamp-only document change is reported as such", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  const stamped = path.join(cwd, "docs", "llm-wiki", "stamped.md");

  // Exactly what `drift --downgrade` then `review --approve-all` produces: status,
  // the status tag, the two review fields, last_updated. No prose moves.
  const before = await readFile(stamped, "utf8");
  await writeFile(stamped, before
    .replace("reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01")
    .replace("last_updated: 2026-01-01", "last_updated: 2026-06-01")
    .replace("reviewed_by: t", "reviewed_by: an agent"), { encoding: "utf8" });

  const result = await impactCommand(normalizeOptions({ cwd }));
  const flagged = result.findings.filter((f) => f.rule === "impact.source_changed").map((f) => f.path);

  assert.deepEqual(
    result.stampOnlyExclusions,
    ["docs/llm-wiki/stamped.md"],
    "the stamped document must be named as not really checked by this run"
  );
  assert.ok(
    !flagged.includes("docs/llm-wiki/stamped.md"),
    "the exclusion itself is unchanged on purpose — enforcing it would break the documented remediation (N-11)"
  );
  assert.ok(flagged.includes("docs/llm-wiki/untouched.md"), "a document nobody touched is still flagged");
  assert.match(result.text, /stamp_only_exclusions: 1 \(docs\/llm-wiki\/stamped\.md\)/);
});

test("a document whose prose actually changed is not reported as stamp-only", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  const rewritten = path.join(cwd, "docs", "llm-wiki", "rewritten.md");
  const before = await readFile(rewritten, "utf8");
  await writeFile(rewritten, before
    .replace("Describes a.ts.", "Describes a.ts, which now has a second line.")
    .replace("reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01"), { encoding: "utf8" });

  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.deepEqual(
    result.stampOnlyExclusions,
    [],
    "a real update must not be counted as a stamp — the two must stay distinguishable"
  );
});

test("the report never changes the exit code", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  const stamped = path.join(cwd, "docs", "llm-wiki", "stamped.md");
  const before = await readFile(stamped, "utf8");
  await writeFile(stamped, before.replace("reviewed_at: 2026-01-01", "reviewed_at: 2026-06-01"), { encoding: "utf8" });

  const withStamp = await impactCommand(normalizeOptions({ cwd }));
  assert.equal(withStamp.stampOnlyExclusions.length, 1);
  // untouched.md is still flagged either way, so the result is driven by findings,
  // never by this count. Pinned because a "report only" that quietly failed builds
  // would be the exact dishonesty this repository treats as its top defect class.
  assert.equal(withStamp.result, "fail");
  assert.ok(!withStamp.findings.some((f) => f.path === "docs/llm-wiki/stamped.md"));
});

test("a newly added document is not mistaken for a stamp-only change", async (t) => {
  if (!hasGit()) { t.skip("git not available"); return; }
  const cwd = await repo();
  await writeFile(path.join(cwd, "docs", "llm-wiki", "brand-new.md"), docText("brand-new"), { encoding: "utf8" });
  const result = await impactCommand(normalizeOptions({ cwd }));
  assert.deepEqual(result.stampOnlyExclusions, [], "a file with no baseline has no stamp to compare");
});
