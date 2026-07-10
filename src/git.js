import { execFileSync } from "node:child_process";

export function runGit(cwd, args) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
}

// True when <file> has commits strictly after (or on) the given YYYY-MM-DD date.
// Best-effort: throws only if git itself fails; callers treat that as "unknown".
export function fileChangedSince(cwd, file, sinceDate) {
  const out = runGit(cwd, ["log", `--since=${sinceDate}`, "--pretty=format:%h", "--", file]).trim();
  return out.length > 0;
}
