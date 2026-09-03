import { execFileSync } from "node:child_process";

export function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

// True when <file> has commits after the END of the given YYYY-MM-DD date.
// Anchoring to end-of-day means a document reviewed on date D "covers" every
// commit made on day D, so a same-day review reports no drift; only commits on a
// later day count. reviewed_at/last_updated are date-only, so this is the most
// precise boundary available without a review timestamp.
// Best-effort: throws only if git itself fails; callers treat that as "unknown".
export function fileChangedSince(cwd, file, sinceDate) {
  const out = runGit(cwd, ["log", `--since=${sinceDate} 23:59:59`, "--pretty=format:%h", "--", file]).trim();
  return out.length > 0;
}

// True when the given line range of <file> has commits after the END of
// sinceDate. Uses `git log -L<start>,<end>:<file> -s` so only edits touching
// those specific lines count — a narrower signal than fileChangedSince for
// evidence that cites exact line ranges. `-s` suppresses the patch, leaving just
// commit hashes to test for presence.
// Best-effort: throws only if git itself fails (e.g. an out-of-range line);
// callers treat that as "unknown" and fall back to the file-level check.
export function lineRangeChangedSince(cwd, file, start, end, sinceDate) {
  const out = runGit(cwd, [
    "log",
    `--since=${sinceDate} 23:59:59`,
    "--pretty=format:%h",
    "-s",
    `-L${start},${end}:${file}`
  ]).trim();
  return out.length > 0;
}

// True when <relPath> is ignored by git (via `git check-ignore`). Catches the
// silent failure where the wiki output path is gitignored, so generated docs are
// created but never tracked. Best-effort: returns false when the path is not
// ignored, git is unavailable, or cwd is not a repository (check-ignore exits
// non-zero in every one of those cases, which execFileSync surfaces as a throw).
// The set of paths git TRACKS under `relDir`, as repo-relative posix strings.
// Returns null — meaning "unknown", never "none" — when git is unavailable or the
// command fails, so a caller can tell "there is no repository here" apart from
// "this repository tracks nothing". Added for N-6: check-run picked the newest
// file on disk, which in a repo that commits its manifests may be an untracked
// one that CI's clean checkout cannot see, so local silently stopped predicting CI.
export function trackedPaths(cwd, relDir) {
  try {
    const out = runGit(cwd, ["ls-files", "-z", "--", relDir]);
    return new Set(out.split("\0").map((line) => line.trim()).filter(Boolean));
  } catch {
    return null;
  }
}

// Tracked files modified relative to HEAD — NOT the untracked set. Used by the
// check-run change-set cross-check (decision 23), where the untracked half of
// `changedFiles` is actively harmful: a real working tree carries editor config,
// scratch notes and local experiments that have nothing to do with the run, and
// flagging those is how a new rule becomes noise everyone learns to ignore. A
// genuinely new source file enters this set as soon as it is staged, which
// happens before the run is committed anyway.
export function modifiedTrackedFiles(cwd) {
  try {
    const out = runGit(cwd, ["diff", "--name-only", "HEAD"]);
    return out.split("\n").map((line) => line.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

export function isPathIgnored(cwd, relPath) {
  try {
    runGit(cwd, ["check-ignore", "-q", relPath]);
    return true;
  } catch {
    return false;
  }
}

// Best-effort git identity of the person running the command: `git config
// user.name`. Used by `review --approve` (Gate 20) to source reviewed_by when no
// explicit --reviewer / config reviewer is given. Returns the trimmed name, or
// null when git is unavailable or user.name is unset (callers then refuse to
// stamp a blank/fabricated reviewer rather than guessing).
export function gitUserName(cwd) {
  try {
    const name = runGit(cwd, ["config", "user.name"]).trim();
    return name || null;
  } catch {
    return null;
  }
}

// Repo-relative paths (posix, relative to the git root) that differ from the
// baseline. With <sinceRef>, every change from that ref to the working tree;
// without it, uncommitted tracked changes plus untracked files (the pre-commit
// view). Paths align with finding paths when the CLI runs from the repo root.
// Best-effort: throws only if git itself fails; callers treat that as "unknown".
export function changedFiles(cwd, sinceRef) {
  const toLines = (out) => out.split("\n").map((line) => line.trim()).filter(Boolean);
  // Untracked files belong in BOTH views. They were previously added only to the
  // no-ref branch, so `impact --since <ref>` went blind to a source file that had
  // been created but not yet committed — exactly the state a PR working tree is
  // in — and the one command that can fail a build on a missing doc update
  // reported nothing to update. `--exclude-standard` keeps gitignored build
  // output and local scratch files out of the comparison.
  const untracked = toLines(runGit(cwd, ["ls-files", "--others", "--exclude-standard"]));
  const changed = sinceRef
    ? [...toLines(runGit(cwd, ["diff", "--name-only", sinceRef])), ...untracked]
    : [...toLines(runGit(cwd, ["diff", "--name-only", "HEAD"])), ...untracked];
  return [...new Set(changed)];
}

// Stored content of <relPath> at <ref>, or null when it cannot be read. Callers
// need the BEFORE side of a diff to decide whether a change is meaningful, which
// `changedFiles` (names only) cannot answer. Best-effort: `git show <ref>:<path>`
// exits 128 both for a bad ref and for a path absent at that ref, and runGit
// discards stderr, so null means "unknown" — never "the file was empty". <relPath>
// must be posix and relative to the git root, which is what changedFiles yields.
export function fileAtRef(cwd, ref, relPath) {
  try {
    return runGit(cwd, ["show", `${ref}:${relPath}`]);
  } catch {
    return null;
  }
}
