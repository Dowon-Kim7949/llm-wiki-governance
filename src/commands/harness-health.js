// `harness-health` (Phase 1, R0 — read-only): the first command that inspects the
// HARNESS instead of the wiki. Adapters, generated skill artifacts, and the
// always-preloaded surface are the files that tell an agent how to work here, and
// until now nothing reported when they went stale: scanAdapters only checks that
// an adapter exists and mentions docs/llm-wiki/index.md, so a v1 adapter passed
// `audit` as clean forever, and `--refresh` compares artifact BODIES, so an
// artifact stamped by an older generator is reported "already up to date" and
// never re-stamped.
//
// Four checks, every one warning-or-below by default (--strict escalates, as
// elsewhere):
//   harness.marker_drift    stamped version is behind the version we ship now
//   harness.user_modified   a managed skill artifact no longer hashes to its marker
//   harness.preload_budget  the always-loaded surface exceeds a CONFIGURED budget
//   harness.skill_too_long  a skill body exceeds a CONFIGURED cap
//
// The two budget rules are inert until a number is supplied. That is deliberate:
// the size figures here are the product's own chars/4 PROXY, and this repo does
// not publish invented token thresholds. Reporting the measurement is the R0
// value; enforcing a limit is the project's choice.
//
// Read-only and deterministic: it opens files, sorts every enumeration, and
// writes nothing. Depends only on the Node stdlib and leaf modules; no
// back-dependency on commands.js.
import path from "node:path";
import { pathExists, toPosix } from "../files.js";
import { readUtf8 } from "../encoding.js";
import { ADAPTER_TARGETS, adapterMarkerVersion, selectedAgents } from "./adapters.js";
import { SKILL_TASKS, inspectSkillArtifact, skillArtifactPaths } from "./skills.js";
import { estimateTokens } from "./retrieval.js";
import { applyRuleConfig, formatFinding, formatFindingSummary, summarizeFindings, withText } from "./findings.js";

// Same posture as evidence.* in scans.js: warning by default so adding this to a
// pipeline cannot break it, error under --strict so a project can gate on it.
function driftSeverity(options) {
  return options.strict ? "error" : "warning";
}

// Claude Code's adapter pulls extra files into EVERY session with `@path` lines.
// Those files are part of the always-loaded surface even though nothing in the
// adapter's own byte count reflects them, which is exactly why the preload figure
// cannot be read off the adapter file alone.
const INCLUDE_RE = /^@(\S+)\s*$/;

function declaredIncludes(content) {
  const includes = [];
  for (const line of String(content ?? "").split("\n")) {
    const match = line.match(INCLUDE_RE);
    if (match) includes.push(match[1]);
  }
  return [...new Set(includes)].sort();
}

async function readIfPresent(file) {
  if (!(await pathExists(file))) return null;
  return readUtf8(file);
}

// Marker versions are numeric strings today ("1".."5"). Compare numerically when
// both sides parse, and fall back to string inequality otherwise, so a future
// non-numeric version still reports drift instead of silently comparing equal.
function isBehind(stamped, current) {
  if (stamped == null || current == null) return false;
  const a = Number.parseInt(stamped, 10);
  const b = Number.parseInt(current, 10);
  if (Number.isInteger(a) && Number.isInteger(b)) return a < b;
  return stamped !== current;
}

async function inspectAdapters(cwd, agents, findings, severity) {
  const rows = [];
  for (const agent of [...agents].sort()) {
    const target = ADAPTER_TARGETS[agent];
    if (!target) continue;
    const absolute = path.join(cwd, target.path);
    const content = await readIfPresent(absolute);
    const shippedContent = await readIfPresent(target.template);
    const shippedVersion = shippedContent === null ? null : adapterMarkerVersion(shippedContent);

    if (content === null) {
      // A missing adapter is `audit`'s adapter.missing, not ours. Reporting it
      // here too would double-count the one finding this repo already emits.
      rows.push({
        path: toPosix(target.path), agent, present: false, markerVersion: null,
        shippedVersion, drifted: false, userModified: null, estimatedTokens: 0
      });
      continue;
    }

    const markerVersion = adapterMarkerVersion(content);
    const drifted = isBehind(markerVersion, shippedVersion);
    rows.push({
      path: toPosix(target.path),
      agent,
      present: true,
      markerVersion,
      shippedVersion,
      drifted,
      // Adapters carry a version marker but NO content hash, so "was this
      // hand-edited" is not decidable for them. null says so. Diffing the block
      // against the shipped template instead would fire on every intentionally
      // customized adapter — this repository has two — and the roadmap's own
      // rule is that a check nobody can act on becomes noise everyone ignores.
      userModified: null,
      estimatedTokens: estimateTokens(content)
    });

    if (drifted) {
      findings.push({
        severity,
        rule: "harness.marker_drift",
        path: toPosix(target.path),
        message: `Adapter block is stamped v${markerVersion} but this package ships v${shippedVersion}; the adapter was generated by an older version and nothing re-generates it.`,
        params: { path: toPosix(target.path), stamped: markerVersion, current: shippedVersion }
      });
    }
  }
  return rows;
}

async function inspectSkills(cwd, findings, severity, skillTokenCap) {
  const rows = [];
  const targets = [];
  for (const entry of SKILL_TASKS) {
    for (const artifact of skillArtifactPaths(entry.slug)) {
      targets.push({ ...artifact, task: entry.task, slug: entry.slug });
    }
  }
  targets.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  for (const target of targets) {
    const content = await readIfPresent(path.join(cwd, target.path));
    if (content === null) continue; // not every project generates every format

    const inspection = inspectSkillArtifact(content);
    const estimated = estimateTokens(inspection.body);
    const drifted = inspection.managed && isBehind(inspection.markerVersion, inspection.currentVersion);

    rows.push({
      path: toPosix(target.path),
      format: target.format,
      task: target.task,
      managed: inspection.managed,
      markerVersion: inspection.markerVersion,
      currentVersion: inspection.currentVersion,
      drifted,
      // Unmarked and hash-mismatched are ONE condition to the generator: both
      // make isManagedUnmodified false, and --refresh keeps both. So both are
      // reported as "no longer tracks upstream" — the field is never null here,
      // unlike the adapter rows, because a file at a generator-owned path either
      // carries a valid marker or it does not.
      userModified: !inspection.managed || inspection.modified,
      estimatedTokens: estimated,
      overCap: skillTokenCap != null && estimated > skillTokenCap
    });

    if (drifted) {
      findings.push({
        severity,
        rule: "harness.marker_drift",
        path: toPosix(target.path),
        message: `Skill artifact is stamped v${inspection.markerVersion} but the generator is at v${inspection.currentVersion}; --refresh compares bodies, so it reports this file as already up to date.`,
        params: { path: toPosix(target.path), stamped: inspection.markerVersion, current: inspection.currentVersion }
      });
    }
    if (!inspection.managed) {
      findings.push({
        severity,
        rule: "harness.user_modified",
        path: toPosix(target.path),
        message: "Skill artifact carries no generation marker, so it predates markers or was replaced; --refresh treats it as a conflict, keeps it, and will never update it again.",
        params: { path: toPosix(target.path) }
      });
    } else if (inspection.modified) {
      findings.push({
        severity,
        rule: "harness.user_modified",
        path: toPosix(target.path),
        message: "Skill artifact carries a generation marker but its body no longer hashes to it, so it was edited after generation; --refresh will keep it and never regenerate it.",
        params: { path: toPosix(target.path) }
      });
    }
    if (skillTokenCap != null && estimated > skillTokenCap) {
      findings.push({
        severity,
        rule: "harness.skill_too_long",
        path: toPosix(target.path),
        message: `Skill body is an estimated ${estimated} tokens (chars/4 proxy, not a measured token count), over the configured cap of ${skillTokenCap}.`,
        params: { path: toPosix(target.path), estimated: String(estimated), cap: String(skillTokenCap) }
      });
    }
  }
  return rows;
}

// The always-loaded surface, per agent: the adapter file itself plus every file
// it pulls in with an `@` include. The headline figure is the MAX across the
// selected agents, not the sum — no single session loads two agents' adapters,
// so summing would overstate what any one agent actually pays.
async function inspectPreload(cwd, adapters, findings, severity, budget) {
  const byAgent = [];
  for (const adapter of adapters) {
    if (!adapter.present) continue;
    const absolute = path.join(cwd, adapter.path);
    const content = await readIfPresent(absolute);
    if (content === null) continue;

    const files = [{ path: adapter.path, estimatedTokens: estimateTokens(content) }];
    for (const include of declaredIncludes(content)) {
      const included = await readIfPresent(path.join(cwd, include));
      if (included === null) continue;
      files.push({ path: toPosix(include), estimatedTokens: estimateTokens(included) });
    }
    const estimatedTokens = files.reduce((sum, file) => sum + file.estimatedTokens, 0);
    byAgent.push({ agent: adapter.agent, adapter: adapter.path, files, estimatedTokens });

    if (budget != null && estimatedTokens > budget) {
      findings.push({
        severity,
        rule: "harness.preload_budget",
        path: adapter.path,
        message: `Always-loaded context for ${adapter.agent} is an estimated ${estimatedTokens} tokens (chars/4 proxy, not a measured token count) across ${files.length} file(s), over the configured budget of ${budget}.`,
        params: { agent: adapter.agent, estimated: String(estimatedTokens), budget: String(budget), files: String(files.length) }
      });
    }
  }
  byAgent.sort((a, b) => (a.agent < b.agent ? -1 : a.agent > b.agent ? 1 : 0));
  return {
    byAgent,
    files: byAgent.flatMap((entry) => entry.files.map((file) => file.path)),
    estimatedTokens: byAgent.reduce((max, entry) => Math.max(max, entry.estimatedTokens), 0),
    budget: budget ?? null,
    exceeded: budget != null && byAgent.some((entry) => entry.estimatedTokens > budget)
  };
}

export async function harnessHealthCommand(options = {}) {
  const cwd = options.cwd ?? process.cwd();
  const agents = selectedAgents(options);
  const severity = driftSeverity(options);
  const preloadBudget = Number.isInteger(options.preloadBudget) ? options.preloadBudget : null;
  const skillTokenCap = Number.isInteger(options.skillTokenCap) ? options.skillTokenCap : null;

  const raw = [];
  const adapters = await inspectAdapters(cwd, agents, raw, severity);
  const skills = await inspectSkills(cwd, raw, severity, skillTokenCap);
  const preload = await inspectPreload(cwd, adapters, raw, severity, preloadBudget);

  const findings = applyRuleConfig(raw, options);
  const findingSummary = summarizeFindings(findings);
  const result = findings.some((f) => f.severity === "blocked")
    ? "blocked"
    : findings.some((f) => f.severity === "error")
      ? "fail"
      : findings.some((f) => f.severity === "warning")
        ? "warning"
        : "pass";

  const driftCount = findings.filter((f) => f.rule === "harness.marker_drift").length;
  const modifiedCount = findings.filter((f) => f.rule === "harness.user_modified").length;

  return withText(
    {
      command: "harness-health",
      result,
      adapters,
      skills,
      preload,
      skillTokenCap,
      findingSummary,
      findings
    },
    "LLM-WIKI Harness Health",
    [
      {
        title: "Summary",
        body: [
          `result: ${result}`,
          `mode: ${options.strict ? "strict" : "standard"}`,
          `agents: ${agents.length ? [...agents].sort().join(", ") : "none selected"}`,
          `adapters: ${adapters.filter((a) => a.present).length} present of ${adapters.length} selected`,
          `skill artifacts: ${skills.length} present`,
          `marker drift: ${driftCount}`,
          `edited after generation: ${modifiedCount}`,
          `always-loaded (worst agent): ~${preload.estimatedTokens} estimated tokens${preload.budget == null ? " (no budget configured)" : ` / budget ${preload.budget}`}`,
          `skill body cap: ${skillTokenCap == null ? "not configured" : skillTokenCap}`,
          `findings: ${findings.length}`
        ]
      },
      { title: "Finding Summary", body: formatFindingSummary(findingSummary) },
      { title: "Findings", body: findings.length ? findings.map(formatFinding) : [] },
      {
        title: "Caveats",
        body: [
          "Read-only: this command opens files and writes nothing.",
          "Every size figure is a chars/4 proxy, not a measured token count, and it under-estimates non-English text.",
          "harness.preload_budget and harness.skill_too_long stay silent until --preload-budget / --skill-token-cap (or the harnessHealth config block) supply a number; this tool ships no default threshold.",
          "Adapters carry a version marker but no content hash, so userModified is reported as null for them — whether an adapter was hand-edited is not decidable, and comparing it against the shipped template would flag every intentional customization.",
          "A missing adapter is reported by audit as adapter.missing, not here.",
          "Findings are warnings by default; use --strict to fail CI, or set \"harness.*\" in llm-wiki.config.json rules.",
          "The adapter marker (llm-wiki-adapter / wiki-block vN) is a different namespace from the per-document wiki_block_version field that doctor reports; the two carry different numbers on purpose."
        ]
      }
    ]
  );
}
