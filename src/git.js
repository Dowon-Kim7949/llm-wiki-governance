import { execFileSync } from "node:child_process";

// Every query runs with the repository's core.fsmonitor switched off: a diff against
// the working tree otherwise runs the command that setting names (measured 2026-10-28,
// git 2.39). An empty value means "no monitor" in every git that has the setting.
// Not switched off: a clean or process filter the repository configures, because that
// would report unchanged Git LFS files as changed; and git's own refresh of
// .git/index, which `git diff` writes even with GIT_OPTIONAL_LOCKS=0 and which changes
// no project file. SECURITY.md tells users not to point the tool at a repository they
// would not run `git status` in.
const READ_ONLY_CONFIG = ["-c", "core.fsmonitor="];

export function runGit(cwd, args) {
  return execFileSync("git", [...READ_ONLY_CONFIG, ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

// A revision that came from a caller (an MCP tool argument, a programmatic `since`)
// must not start with "-": git reads it as an option, and some git options write
// files. Found 2026-10-28 through the MCP validate tool, whose contract is
// read-only; the CLI was never exposed because its parser refuses a "-"-prefixed
// --since value. No ref name or revision expression git accepts starts with "-"
// (`@{-1}` starts with "@"), so nothing legitimate is refused. Callers also end the
// revision with "--" so it cannot be read as a path. Throws, and every caller
// already treats a git failure as "unknown".
export function assertRevision(ref) {
  if (typeof ref !== "string" || ref.length === 0 || ref.startsWith("-")) {
    throw new Error(`not a git revision: ${JSON.stringify(ref)}`);
  }
  return ref;
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

// Every path touched by a commit after the END of sinceDate, in one `git log`
// instead of one per anchor. It is a SUPERSET of what `fileChangedSince` can
// report: `-m` lists a merge's diff against each parent, so a commit the
// path-limited walk keeps (one that is not TREESAME to some parent) always has
// the path in this list. That makes it safe only as a negative filter — absent
// here means `fileChangedSince` would answer false; present means "ask it".
// Matching stays case-sensitive because pathspecs are, even under
// core.ignorecase on Windows. `prefix` is the cwd relative to the repo root, since git prints
// root-relative paths while anchors are cwd-relative.
// Each flag pins a user config that would otherwise shrink the list below the
// superset: diff.relative (`--no-relative`), rename detection hiding a path that
// moved out of an anchored directory (`--no-renames`), log.diffMerges
// (`--diff-merges=separate`), and log.showRoot (`--root`). A git too old for one
// of them fails the command, which callers treat as "use the per-file query".
// Best-effort: throws only if git itself fails; callers fall back to per-file.
export function pathsChangedSince(cwd, sinceDate) {
  const prefix = runGit(cwd, ["rev-parse", "--show-prefix"]).trim();
  const out = runGit(cwd, [
    "-c",
    "core.quotePath=false",
    "log",
    `--since=${sinceDate} 23:59:59`,
    "--diff-merges=separate",
    "--root",
    "--no-renames",
    "--no-relative",
    "--name-only",
    "--pretty=format:",
    "-z"
  ]);
  const paths = new Set();
  for (const part of out.split(/[\0\n]/)) {
    const trimmed = part.trim();
    if (trimmed) paths.add(trimmed);
  }
  return { prefix, paths };
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
    runGit(cwd, ["check-ignore", "-q", "--", relPath]);
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
  // The trailing "--" makes git take <sinceRef> as a revision or fail. Without it a
  // value naming a file and no ref was read as a pathspec, and the run compared
  // that one file against the index — a wrong change set, reported as a right one.
  const changed = sinceRef
    ? [...toLines(runGit(cwd, ["diff", "--name-only", assertRevision(sinceRef), "--"])), ...untracked]
    : [...toLines(runGit(cwd, ["diff", "--name-only", "HEAD"])), ...untracked];
  return [...new Set(changed)];
}

// Renames in the same comparison changedFiles makes (<sinceRef>, else HEAD, to the
// working tree), as a Map from the new repo-relative path to the old one.
// changedFiles lists only the new name of a renamed file, so a reader that needs
// the file's content before the change has to ask for the old path. `-M` forces
// rename detection on whatever diff.renames says; -z keeps non-ASCII paths
// unquoted. An untracked file is not in this diff, so a rename is seen once the
// new path is staged or committed. Best-effort: throws only if git fails.
export function renamedPaths(cwd, sinceRef) {
  const out = runGit(cwd, ["diff", "--name-status", "-M", "-z", assertRevision(sinceRef || "HEAD"), "--"]);
  const parts = out.split("\0");
  const renames = new Map();
  for (let index = 0; index < parts.length; index += 1) {
    const status = parts[index];
    if (/^[RC]\d*$/.test(status)) {
      if (status.startsWith("R")) renames.set(parts[index + 2], parts[index + 1]);
      index += 2;
    } else if (status) {
      index += 1;
    }
  }
  return renames;
}

// Stored content of <relPath> at <ref>, or null when it cannot be read. Callers
// need the BEFORE side of a diff to decide whether a change is meaningful, which
// `changedFiles` (names only) cannot answer. Best-effort: `git show <ref>:<path>`
// exits 128 both for a bad ref and for a path absent at that ref, and runGit
// discards stderr, so null means "unknown" — never "the file was empty". <relPath>
// must be posix and relative to the git root, which is what changedFiles yields.
export function fileAtRef(cwd, ref, relPath) {
  try {
    return runGit(cwd, ["show", `${assertRevision(ref)}:${relPath}`]);
  } catch {
    return null;
  }
}

// The newest commit in HEAD's history whose committer date is not after the END of
// sinceDate — the same clock and the same boundary fileChangedSince uses — or null
// when there is none or git fails. It is NOT necessarily the repository a review
// dated sinceDate saw: the walk is ordered by date, so a side-branch commit dated
// that day but merged later, or a commit made after the review with an older
// committer date, can be the one returned (reproduced 2026-10-28). The drift scan
// therefore never narrows on this snapshot alone; see scanEvidenceDriftDetailed.
export function commitAtEndOf(cwd, sinceDate) {
  try {
    const sha = runGit(cwd, ["rev-list", "-1", `--before=${sinceDate} 23:59:59`, "HEAD"]).trim();
    return sha || null;
  } catch {
    return null;
  }
}

// The commits in HEAD's history, newest first, whose diff of the CWD-relative <file>
// adds or removes a line starting with `<key>:`, or null when git fails. These are
// CANDIDATES for the commit that wrote a document's review stamp: `-G` matches any
// such line, so a fenced example in the body, or a commit that rewrote the stamp
// line without changing its value, is listed too. Callers must compare the value
// at each candidate and at its parent to find the one that wrote it.
export function commitsTouchingKey(cwd, file, key) {
  try {
    const out = runGit(cwd, ["log", "--format=%H", `-G^${key}:`, "HEAD", "--", file]).trim();
    return out ? out.split("\n").map((line) => line.trim()).filter(Boolean) : [];
  } catch {
    return null;
  }
}

// True when commit <sha> has a committer date no later than the END of sinceDate —
// the clock and boundary every other date check here uses, evaluated by git so the
// time zone is the same one. False when it is later, and when git fails.
export function committedBy(cwd, sha, sinceDate) {
  try {
    const out = runGit(cwd, ["rev-list", "-1", `--before=${sinceDate} 23:59:59`, assertRevision(sha), "--"]).trim();
    return out === sha;
  } catch {
    return false;
  }
}

// True when a commit reachable from HEAD but not from <fromRef> touched the given
// line range of <file>: `git log -L` over `<fromRef>..HEAD`, so it is decided by
// ancestry, not by commit dates, and a branch merged after <fromRef> counts even
// when its commits are dated before it. Throws when git rejects the query (e.g. an
// out-of-range line); callers treat that as "unknown".
export function lineRangeChangedBetween(cwd, file, start, end, fromRef) {
  const out = runGit(cwd, [
    "log",
    "--pretty=format:%h",
    "-s",
    `-L${start},${end}:${file}`,
    `${assertRevision(fromRef)}..HEAD`
  ]).trim();
  return out.length > 0;
}

// Stored content of a CWD-relative <file> at <ref>, or null like fileAtRef. The
// `./` prefix makes git resolve the path against cwd instead of the repository
// root, which is how wiki anchors are written.
export function fileAtRefFromCwd(cwd, ref, file) {
  return fileAtRef(cwd, ref, `./${file}`);
}

// Like fileAtRefFromCwd, but only for a file: `git cat-file blob` refuses a tree,
// where `git show` would print a directory listing. null when the path is not a
// file at <ref>, does not exist there, or git fails.
export function blobAtRefFromCwd(cwd, ref, file) {
  try {
    return runGit(cwd, ["cat-file", "blob", `${assertRevision(ref)}:./${file}`]);
  } catch {
    return null;
  }
}
