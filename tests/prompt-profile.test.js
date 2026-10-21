// Prompt profiles (1.33.0) and the `issue` task preset.
//
// `full` is the shipped text and must not move: every assertion about it here is
// an equality, never a substring. `slim` is the opt-in short rendering, and the
// assertions about it are the CONTRACT it promises to keep — the strings below
// are the list of what slim may not drop:
//   (a) this tool's own commands and paths (locate with prepare --compact, read
//       with get-doc --section --strict-section, the wiki entrypoint);
//   (b) the enforced contracts (needs_review, verified is human-only, the
//       append-only log, no sensitive values, the doc language, the run manifest,
//       the governance mode's rule and its regeneration command);
//   (c) the stop conditions; (d) the exit criteria; (e) interpolated project facts.
// The delegation budget is the one block slim drops by design.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  DEFAULT_PROMPT_PROFILE,
  PROMPT_PROFILES,
  SUPPORTED_TASK_PROMPTS,
  buildTaskPrompt,
  contextBudget,
  evidenceFocus,
  initialEnrichmentWorkflow
} from "../src/task-prompts.js";
import { GOVERNANCE_MODES } from "../src/governance.js";
import { CONFIG_FILENAME, loadProjectConfig } from "../src/config-file.js";
import { main, parseArgs } from "../src/cli.js";
import { handoffCommand, initCommand, promptCommand } from "../src/commands.js";
import { SKILL_TASKS } from "../src/commands/skills.js";
import { TOOL_DEFS } from "../src/mcp/tools.js";
import { handleMessage } from "../src/mcp/dispatch.js";
import * as api from "../src/index.js";

const TASKS = [...SUPPORTED_TASK_PROMPTS];
const WRITE_TASKS = ["feature", "fix", "refactor", "docs-sync"];
const IMPLEMENTATION_TASKS = ["feature", "fix", "refactor"];
// The tasks whose slim rendering promises to be at most half of full.
const HALF_TARGET_TASKS = ["feature", "fix", "refactor", "docs-sync", "bootstrap", "backfill"];
const PROJECT_TYPES = ["unknown", "frontend", "backend", "fullstack", "library"];
const LANGS = ["en", "ko"];
const ISSUE_SECTIONS = [
  "Background / why",
  "Goal",
  "Out of scope / must not change",
  "Done when",
  "Related wiki docs and evidence",
  "Risks / invariants",
  "Open questions"
];

function build(task, overrides = {}) {
  return buildTaskPrompt({ task, cwd: ".", projectType: "backend", profiles: [], agents: [], ...overrides });
}

async function project(prefix, config = null) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), `llm-wiki-${prefix}`));
  await writeFile(path.join(cwd, "package.json"), `${JSON.stringify({ dependencies: { fastify: "^4.0.0" } }, null, 2)}\n`, "utf8");
  if (config) await writeFile(path.join(cwd, CONFIG_FILENAME), `${JSON.stringify(config, null, 2)}\n`, "utf8");
  return cwd;
}

async function runCli(argv) {
  const out = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  console.log = (...args) => out.push(args.join(" "));
  console.error = (...args) => out.push(args.join(" "));
  let code;
  try {
    code = await main(argv);
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode;
  }
  return { code, output: out.join("\n") };
}

// --- full stays the shipped text -------------------------------------------

test("full is the default, and naming it changes no byte of any prompt", () => {
  assert.equal(DEFAULT_PROMPT_PROFILE, "full");
  assert.deepEqual([...PROMPT_PROFILES], ["full", "slim"]);
  for (const task of TASKS) {
    for (const governanceMode of GOVERNANCE_MODES) {
      for (const docLang of LANGS) {
        const implicit = build(task, { governanceMode, docLang });
        assert.deepEqual(build(task, { governanceMode, docLang, promptProfile: "full" }), implicit, `${task}/${governanceMode}/${docLang}`);
        // An unknown value renders the default instead of throwing inside a builder
        // (the CLI and config loader already reject it with exit 3).
        assert.deepEqual(build(task, { governanceMode, docLang, promptProfile: "turbo" }), implicit, `${task}: unknown profile renders full`);
        // The result names no profile, so every JSON report embedding it is unchanged.
        assert.ok(!("promptProfile" in implicit), `${task}: a full result carries no promptProfile key`);
      }
    }
  }
  for (const governanceMode of GOVERNANCE_MODES) {
    assert.equal(
      initialEnrichmentWorkflow({ projectType: "backend", governanceMode, promptProfile: "full" }),
      initialEnrichmentWorkflow({ projectType: "backend", governanceMode }),
      `${governanceMode}: the shared enrichment workflow is unchanged under full`
    );
  }
});

// --- slim keeps the contract -----------------------------------------------

test("slim write workflows keep every tool-named instruction, contract, stop condition, and exit criterion", () => {
  for (const task of WRITE_TASKS) {
    for (const governanceMode of GOVERNANCE_MODES) {
      const built = build(task, { governanceMode, promptProfile: "slim" });
      assert.equal(built.result, "pass");
      assert.equal(built.promptProfile, "slim", `${task}: the result names the non-default profile`);
      const p = built.prompt;
      const label = `${task}/${governanceMode}`;

      // (a) the tool's own commands and paths
      assert.ok(p.includes("Read docs/llm-wiki/index.md first"), `${label}: wiki entrypoint`);
      assert.ok(p.includes("'llm-wiki prepare --task \"<the task>\" --compact'"), `${label}: locate with prepare --compact`);
      assert.ok(p.includes("'llm-wiki get-doc <path> --section \"<heading>\" --strict-section --max-chars <n>'"), `${label}: read by section`);
      assert.ok(p.includes("Never skip the source a claim depends on"), `${label}: narrowing never replaces the source`);
      assert.match(p, /inspect actual source files/i, `${label}: source inspection`);
      // (b) the enforced contracts
      assert.ok(p.includes("Documentation language:"), `${label}: doc language`);
      assert.ok(p.includes("status: needs_review"), `${label}: needs_review`);
      assert.ok(p.includes("verified is human-approved only"), `${label}: verified stays human-only`);
      assert.ok(p.includes("docs/llm-wiki/log.md") && p.includes("append-only"), `${label}: append-only log`);
      assert.ok(p.includes("Never write sensitive raw values"), `${label}: no sensitive values`);
      assert.ok(p.includes(`Governance budget (${governanceMode})`), `${label}: names the mode`);
      assert.ok(p.includes(`Generated for governance mode ${governanceMode}`), `${label}: stale-recognizable`);
      assert.ok(p.includes("'llm-wiki init --write --skills --refresh'"), `${label}: regeneration command`);
      assert.ok(p.includes("API Services inventory"), `${label}: API inventory pointer`);
      // (c) stop conditions
      if (IMPLEMENTATION_TASKS.includes(task)) {
        assert.ok(p.includes("If the docs conflict with the code, or the scope grows beyond what was asked, STOP and confirm with a human."), `${label}: STOP`);
        assert.ok(p.includes("smallest safe scope"), `${label}: smallest safe scope`);
      } else {
        assert.ok(p.includes("Update stale LLM-WIKI documents only; avoid unrelated code edits."), `${label}: docs-sync scope guard`);
        assert.ok(p.includes("report it instead of changing it"), `${label}: docs-sync stop`);
      }
      // (d) exit criteria
      assert.ok(p.includes("Exit criteria:"), `${label}: exit criteria`);
      assert.match(p, /Relevant (tests|validation)/, `${label}: verification step`);
      // (e) interpolated project facts
      assert.ok(p.includes("Workspace:\n.\n"), `${label}: workspace`);
      assert.ok(p.includes("Project type: backend."), `${label}: project type`);
      // Dropped by design.
      assert.doesNotMatch(p, /Delegation budget/, `${label}: slim drops the delegation budget`);
    }
  }
});

test("slim keeps each governance mode's decision rule", () => {
  const lite = build("fix", { governanceMode: "lite", promptProfile: "slim" }).prompt;
  assert.ok(lite.includes("Do NOT touch the wiki for an ordinary change"));
  assert.ok(lite.includes("no wiki change needed (lite)"));
  assert.ok(lite.includes("knowledge an agent cannot re-derive from the code"));
  assert.ok(lite.includes("No repository-wide audit, drift scan, or document generation"));

  const standard = build("feature", { governanceMode: "standard", promptProfile: "slim" }).prompt;
  assert.ok(standard.includes("a domain concept, an architectural boundary, a public contract, or a recorded constraint"));
  assert.ok(standard.includes("'llm-wiki impact --since <ref>'"));
  assert.ok(!standard.includes("no wiki change needed (lite)"));

  const strict = build("fix", { governanceMode: "strict", promptProfile: "slim" }).prompt;
  assert.ok(strict.includes("update every affected document in the same task"));
  assert.ok(strict.includes("'llm-wiki validate'") && strict.includes("'llm-wiki impact --since <ref>'"));
});

test("slim bootstrap and handoff keep the enrichment contract and the project's evidence focus", async () => {
  for (const projectType of PROJECT_TYPES) {
    for (const governanceMode of GOVERNANCE_MODES) {
      const workflow = initialEnrichmentWorkflow({ projectType, governanceMode, promptProfile: "slim" });
      const bootstrap = build("bootstrap", { projectType, governanceMode, promptProfile: "slim" }).prompt;
      for (const p of [workflow, bootstrap]) {
        assert.ok(p.includes(evidenceFocus(projectType).join("\n")), `${projectType}: evidence focus verbatim`);
        assert.ok(p.includes("Keep every created or edited wiki document at status: needs_review"));
        assert.ok(p.includes("verified is human-approved only"));
        assert.ok(p.includes("Append docs/llm-wiki/log.md (append-only)"));
        assert.ok(p.includes("Never write sensitive raw values"));
        assert.ok(p.includes("docs/llm-wiki/domains/*.md"));
        assert.ok(p.includes("source_files") && p.includes("## Evidence"));
        assert.ok(p.includes("'llm-wiki validate'"));
        assert.ok(p.includes(`Governance budget (${governanceMode})`));
        assert.doesNotMatch(p, /Delegation budget/);
      }
      // Same single source as full: bootstrap embeds the shared workflow verbatim.
      assert.ok(bootstrap.includes(workflow), `${projectType}/${governanceMode}: bootstrap embeds the slim workflow`);
    }
  }

  const cwd = await project("slim-handoff-");
  const base = { cwd, type: "backend", profiles: [], agents: ["claude"], existing: "skip" };
  const full = await handoffCommand(base);
  const slim = await handoffCommand({ ...base, promptProfile: "slim" });
  assert.ok(!("promptProfile" in full.handoff), "a full handoff names no profile");
  assert.equal(slim.handoff.promptProfile, "slim");
  assert.ok(slim.handoff.prompt.length < full.handoff.prompt.length);
  assert.ok(slim.handoff.prompt.includes("Read CLAUDE.md and docs/llm-wiki/index.md first"), "the selected adapter stays the entrypoint");
  assert.ok(slim.handoff.prompt.includes("Backend evidence focus:"));
});

test("slim backfill keeps the safeguards that make reconstruction safe", () => {
  const p = build("backfill", { governanceMode: "lite", promptProfile: "slim" }).prompt;
  for (const needle of [
    "Evidence ladder",
    "ADRs / decision records (the only source for WHY)",
    "- verified:", "- inferred:", "- unknown:",
    "Decision reason: unknown",
    "do NOT reconstruct a rationale",
    "Absence of evidence is not evidence",
    "Unknown / needs human confirmation",
    "'llm-wiki backfill'",
    "'llm-wiki backfill --write'",
    "--strict",
    "status: needs_review",
    "verified is human-approved only",
    "Append docs/llm-wiki/log.md (append-only)",
    "Governance mode: lite."
  ]) {
    assert.ok(p.includes(needle), `slim backfill keeps: ${needle}`);
  }
  // Like full, backfill carries no governance budget: a lite budget telling the
  // reconstruction to skip the wiki would contradict the command that asked for it.
  assert.doesNotMatch(p, /Governance budget/);
  assert.doesNotMatch(p, /Delegation budget/);
});

test("slim read-only workflows stay read-only and keep their tool commands", () => {
  const onboard = build("onboard", { promptProfile: "slim" }).prompt;
  assert.ok(onboard.includes("'llm-wiki onboard'") && onboard.includes("--domain <name>"));
  const prepare = build("prepare", { promptProfile: "slim" }).prompt;
  assert.ok(prepare.includes("'llm-wiki prepare --task \"<the task>\"'"));
  assert.ok(prepare.includes("report the conflict and do NOT implement"));
  assert.ok(prepare.includes("/llm-wiki-feature or /llm-wiki-fix"));
  for (const p of [onboard, prepare]) {
    assert.ok(p.includes("Read-only: do not modify files."));
    assert.ok(p.includes("needs confirmation"));
    assert.ok(p.includes("needs_review or stale document is not trusted fact"));
    assert.doesNotMatch(p, /Governance budget|Delegation budget/);
  }
  const okf = build("okf-extract", { promptProfile: "slim" }).prompt;
  assert.ok(okf.includes("OKF v0.1") && okf.includes("status: needs_review") && okf.includes("verified is human-approved only"));
});

test("slim is shorter than full everywhere, and at most half for the write and reconstruction tasks", () => {
  for (const task of TASKS) {
    for (const projectType of PROJECT_TYPES) {
      for (const governanceMode of GOVERNANCE_MODES) {
        for (const docLang of LANGS) {
          const args = { projectType, governanceMode, docLang };
          const full = build(task, args).prompt.length;
          const slim = build(task, { ...args, promptProfile: "slim" }).prompt.length;
          const label = `${task}/${projectType}/${governanceMode}/${docLang}: ${slim}/${full}`;
          assert.ok(slim < full, `${label} — slim must be shorter`);
          if (HALF_TARGET_TASKS.includes(task)) assert.ok(slim <= full / 2, `${label} — slim must be at most 50% of full`);
        }
      }
    }
  }
});

// --- selection: CLI flag and config key ------------------------------------

test("--prompt-profile is validated at parse time and accepted only where a prompt is rendered", () => {
  assert.equal(parseArgs(["prompt", "--task", "fix", "--prompt-profile", "slim"]).options.promptProfile, "slim");
  assert.deepEqual(parseArgs(["prompt", "--task", "fix", "--prompt-profile", "slim"]).errors, []);
  assert.equal(parseArgs(["prompt", "--task", "fix"]).options.promptProfile, null, "unset means: resolve from config");

  const bad = parseArgs(["prompt", "--task", "fix", "--prompt-profile", "short"]);
  assert.ok(bad.errors.some((error) => error.includes("Unsupported prompt profile: short")), bad.errors.join("; "));

  for (const command of ["prompt", "handoff", "backfill", "init", "quickstart"]) {
    const argv = command === "prompt" ? ["prompt", "--task", "fix"] : [command];
    const { errors } = parseArgs([...argv, "--prompt-profile", "slim"]);
    assert.ok(!errors.some((error) => error.includes("--prompt-profile is not supported")), `${command} accepts --prompt-profile`);
  }
  const { errors } = parseArgs(["validate", "--prompt-profile", "slim"]);
  assert.ok(errors.some((error) => error.includes("Option --prompt-profile is not supported by validate")), "commands that render no prompt reject it");
});

test("an invalid promptProfile in the config is a config error (exit 3), never a silent fallback", async () => {
  for (const value of ["short", "", 1, null, ["slim"]]) {
    const cwd = await project("bad-profile-", { promptProfile: value });
    const { errors } = await loadProjectConfig(cwd);
    assert.ok(errors.some((error) => error.includes('"promptProfile" must be one of full, slim')), `${JSON.stringify(value)}: ${errors.join("; ")}`);
  }
  const cwd = await project("bad-profile-cli-", { promptProfile: "short" });
  const { code, output } = await runCli(["prompt", "--task", "fix", "--cwd", cwd]);
  assert.equal(code, 3);
  assert.match(output, /"promptProfile" must be one of full, slim/);
});

test("the config key selects the profile, and the CLI flag wins over it", async () => {
  const cwd = await project("cfg-profile-", { promptProfile: "slim" });
  const resolved = (await api.resolveOptions({ cwd, task: "fix", type: "backend", profiles: [], agents: ["claude"] })).options;
  assert.equal(resolved.promptProfile, "slim");
  const fromConfig = await promptCommand(resolved);
  assert.equal(fromConfig.taskPrompt.promptProfile, "slim");
  assert.match(fromConfig.text, /prompt_profile: slim/);
  assert.doesNotMatch(fromConfig.taskPrompt.prompt, /Delegation budget/);

  const overridden = (await api.resolveOptions({ cwd, task: "fix", type: "backend", profiles: [], agents: ["claude"], promptProfile: "full" })).options;
  const fromFlag = await promptCommand(overridden);
  assert.ok(!("promptProfile" in fromFlag.taskPrompt));
  assert.doesNotMatch(fromFlag.text, /prompt_profile:/, "the full report is unchanged");
  assert.match(fromFlag.taskPrompt.prompt, /Delegation budget/);

  // A config that names `full` renders exactly what a config without the key renders.
  const plain = await project("cfg-profile-none-");
  const named = await project("cfg-profile-full-", { promptProfile: "full" });
  const a = await promptCommand((await api.resolveOptions({ cwd: plain, task: "feature", type: "backend", profiles: [], agents: [] })).options);
  const b = await promptCommand((await api.resolveOptions({ cwd: named, task: "feature", type: "backend", profiles: [], agents: [] })).options);
  assert.equal(b.taskPrompt.prompt.replace(named, "<cwd>"), a.taskPrompt.prompt.replace(plain, "<cwd>"));
});

test("MCP prompt/handoff follow the config profile without a new tool or argument", async () => {
  const cwd = await project("mcp-profile-", { promptProfile: "slim" });
  const prompt = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "prompt", arguments: { cwd, task: "fix" } } }, {});
  assert.equal(prompt.result.isError, false);
  assert.equal(prompt.result.structuredContent.taskPrompt.promptProfile, "slim");
  assert.doesNotMatch(prompt.result.structuredContent.taskPrompt.prompt, /Delegation budget/);

  const handoff = await handleMessage({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "handoff", arguments: { cwd } } }, {});
  assert.equal(handoff.result.isError, false);
  assert.equal(handoff.result.structuredContent.handoff.promptProfile, "slim");

  // No schema grew: the profile is a project setting, not a per-call argument.
  for (const name of ["prompt", "handoff"]) {
    const tool = TOOL_DEFS.find((def) => def.name === name);
    assert.ok(!("promptProfile" in tool.inputSchema.properties), `${name}: no promptProfile argument`);
  }
});

test("init --skills writes slim skill bodies that keep the run-manifest contract", async () => {
  const cwd = await project("slim-skills-");
  const result = await initCommand({ cwd, minimal: true, withAdapters: false, skills: true, type: "backend", profiles: [], agents: [], existing: "skip", write: true, promptProfile: "slim" });
  assert.equal(result.result, "pass");
  const fullCwd = await project("full-skills-");
  await initCommand({ cwd: fullCwd, minimal: true, withAdapters: false, skills: true, type: "backend", profiles: [], agents: [], existing: "skip", write: true });

  for (const { slug, task } of SKILL_TASKS) {
    const rel = path.join(".claude", "skills", slug, "SKILL.md");
    const body = await readFile(path.join(cwd, rel), "utf8");
    const fullBody = await readFile(path.join(fullCwd, rel), "utf8");
    assert.ok(body.length < fullBody.length, `${slug}: slim skill is shorter`);
    assert.doesNotMatch(body, /Delegation budget/, `${slug}: no delegation budget`);
    assert.doesNotMatch(body, /Workspace:/, `${slug}: the artifact strips the workspace block`);
    assert.doesNotMatch(body, /[A-Za-z]:\\|\/home\/|\/Users\//, `${slug}: no absolute path`);
    if (task === "onboard" || task === "prepare") {
      assert.doesNotMatch(body, /Completion contract/, `${slug}: read-only skill has no manifest`);
      assert.match(body, /Read-only/);
      continue;
    }
    assert.match(body, /Completion contract/, `${slug}: manifest contract kept`);
    assert.ok(body.includes(`.llm-wiki/runs/run-${task}-<timestamp>.json`), `${slug}: manifest path`);
    for (const field of ["changedSource[]", "touchedDocs[]", "logAppended", "validated {ran, result}"]) {
      assert.ok(body.includes(field), `${slug}: manifest field ${field}`);
    }
    assert.match(body, /reads no other/i, `${slug}: field set is the whole contract`);
    assert.match(body, /two sentences/i, `${slug}: summary cap`);
    assert.match(body, /never paste diffs, file contents, logs, or test output/i, `${slug}: no payload dumps`);
    assert.ok(body.includes("'llm-wiki check-run'"), `${slug}: check-run`);
    if (task === "feature" || task === "fix") assert.ok(body.includes("testEvidence {red, green}"), `${slug}: test evidence`);
  }
});

// --- the issue preset --------------------------------------------------------

test("issue is a supported task everywhere tasks are enumerated, and is not a generated skill", async () => {
  assert.ok(SUPPORTED_TASK_PROMPTS.has("issue"));
  const promptTool = TOOL_DEFS.find((def) => def.name === "prompt");
  assert.ok(promptTool.inputSchema.properties.task.enum.includes("issue"), "MCP prompt schema enum");
  assert.ok(parseArgs(["prompt", "--task", "issue"]).errors.length === 0);

  // Skills are an always-loaded surface; an on-demand preset must not grow it.
  assert.ok(!SKILL_TASKS.some((entry) => entry.task === "issue"));
  const cwd = await project("issue-no-skill-");
  await initCommand({ cwd, minimal: true, withAdapters: false, skills: true, type: "backend", profiles: [], agents: [], existing: "skip", write: true });
  const skills = await readdir(path.join(cwd, ".claude", "skills"));
  assert.ok(!skills.includes("llm-wiki-issue"), skills.join(", "));
});

test("issue drafts a GitHub issue body, read-only, in both profiles", async () => {
  for (const promptProfile of PROMPT_PROFILES) {
    const built = build("issue", { promptProfile });
    assert.equal(built.result, "pass");
    const p = built.prompt;
    const label = `issue/${promptProfile}`;
    for (const section of ISSUE_SECTIONS) assert.ok(p.includes(section), `${label}: section ${section}`);
    assert.ok(p.includes("GitHub issue"), `${label}: says what it produces`);
    assert.ok(p.includes("'llm-wiki prepare --task \"<the task>\" --compact'"), `${label}: finds the docs with prepare --compact`);
    assert.match(p, /do not restate/i, `${label}: links instead of restating`);
    assert.match(p, /read-only/i, `${label}: read-only`);
    assert.match(p, /not in this conversation/, `${label}: written for an agent outside the conversation`);
    assert.match(p, /more than one way/, `${label}: no ambiguous wording`);
    assert.match(p, /(history of this unit of work|Work-unit history)[^\n]*belongs in the issue/, `${label}: work history stays in the issue`);
    assert.match(p, /observable end state/, `${label}: goal as an end state`);
    assert.match(p, /sensitive raw values/, `${label}: no sensitive values`);
    // It must never instruct a wiki or code change.
    assert.doesNotMatch(p, /Append docs\/llm-wiki\/log\.md/, `${label}: no log append`);
    assert.doesNotMatch(p, /status: needs_review/, `${label}: writes no wiki document`);
    assert.doesNotMatch(p, /Governance budget|Delegation budget/, `${label}: read-only work carries neither budget`);
  }
  // The full preset carries the shared context budget like every other full preset.
  assert.ok(build("issue").prompt.includes(contextBudget().join("\n")));
  assert.ok(build("issue", { promptProfile: "slim" }).prompt.length < build("issue").prompt.length);

  const cwd = await project("issue-cmd-");
  const result = await promptCommand({ cwd, task: "issue", type: "backend", profiles: [], agents: ["claude"] });
  assert.equal(result.result, "pass");
  assert.equal(result.taskPrompt.task, "issue");
  assert.ok(result.taskPrompt.prompt.includes("Out of scope / must not change"));
});
