import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CORE_REQUIRED_DOCS, PROFILE_DOCS, VALID_STATUSES } from "./config.js";
import { detectProject } from "./detector.js";
import { findMojibakeIndicators, hasUtf8Bom, readUtf8 } from "./encoding.js";
import { listMarkdownFiles, pathExists, toPosix } from "./files.js";
import { parseFrontmatter, validateFrontmatter } from "./frontmatter.js";
import { renderTextReport } from "./report.js";
import { scanSensitiveInfo } from "./sensitive-info.js";
import { renderWikiDocumentTemplate } from "./template-renderer.js";

const TEMPLATE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates");

const ADAPTER_TARGETS = {
  codex: {
    path: "AGENTS.md",
    template: path.join(TEMPLATE_ROOT, "adapters", "codex", "AGENTS.md"),
    writable: true,
    missingSeverity: "warning",
    missingMessage: "Codex adapter file is missing; init --dry-run can suggest AGENTS.md and init --write can create it when absent."
  },
  claude: {
    path: "CLAUDE.md",
    template: path.join(TEMPLATE_ROOT, "adapters", "claude-code", "CLAUDE.md"),
    writable: true,
    missingSeverity: "warning",
    missingMessage: "Claude Code adapter file is missing; init --dry-run can suggest CLAUDE.md and init --write can create it when absent."
  },
  antigravity: {
    path: "ANTIGRAVITY.md",
    template: path.join(TEMPLATE_ROOT, "adapters", "antigravity", "ANTIGRAVITY.md"),
    writable: false,
    missingSeverity: "info",
    missingMessage: "Antigravity adapter filename is unconfirmed; keep ANTIGRAVITY.md as an info-level candidate only."
  }
};

export async function doctor(options) {
  const cwd = options.cwd;
  const detection = await detectProject(cwd, options.type, options.profiles);
  const wikiExists = await pathExists(path.join(cwd, "docs", "llm-wiki", "index.md"));
  const packageManager = await detectPackageManager(cwd);
  const packageReadiness = await inspectPackageReadiness(cwd);

  const checks = [
    `node: ${process.version}`,
    `platform: ${os.platform()} ${os.release()}`,
    `cwd: ${cwd}`,
    `package_manager: ${packageManager ?? "not detected"}`,
    `wiki_entry: ${wikiExists ? "present" : "missing"}`,
    `project_type: ${detection.projectType} (${detection.confidence})`,
    "utf8_policy: explicit read/write helpers enabled",
    "migration_apply: blocked by stable safety policy"
  ];

  const sections = [{ title: "Checks", body: checks }];
  if (packageReadiness.length > 0) {
    sections.push({ title: "Package Release Readiness", body: packageReadiness });
  }

  return withText({
    command: "doctor",
    checks,
    detection,
    packageReadiness
  }, "LLM-WIKI Doctor", sections);
}

export async function validateFrontmatterCommand(options) {
  const markdownFiles = await listTargetMarkdown(options.cwd);
  const findings = [];

  for (const file of markdownFiles) {
    const rel = toPosix(path.relative(options.cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);

    for (const message of parsed.errors) {
      findings.push({ severity: "error", rule: "frontmatter.parse", path: rel, message });
    }
    for (const finding of validateFrontmatter(parsed.frontmatter, { strict: options.strict })) {
      findings.push({ ...finding, path: rel });
    }
  }

  const summary = [
    `files_checked: ${markdownFiles.length}`,
    `findings: ${findings.length}`,
    `result: ${findings.some((finding) => finding.severity === "error") ? "fail" : "pass"}`
  ];
  const findingSummary = summarizeFindings(findings);

  return withText({
    command: "validate-frontmatter",
    summary,
    findingSummary,
    findings
  }, "LLM-WIKI Frontmatter Validation", [
    { title: "Summary", body: summary },
    { title: "Finding Summary", body: formatFindingSummary(findingSummary) },
    { title: "Findings", body: findings.map(formatFinding) }
  ]);
}

export async function statusCommand(options) {
  const detection = await detectProject(options.cwd, options.type, options.profiles);
  const agents = selectedAgents(options);
  const wikiEntry = path.join(options.cwd, "docs", "llm-wiki", "index.md");
  const initialized = await pathExists(wikiEntry);
  const markdownFiles = initialized
    ? await listMarkdownFiles(path.join(options.cwd, "docs", "llm-wiki"))
    : [];
  const documentStatus = await summarizeDocumentStatuses(options.cwd, markdownFiles);
  const detectionFindings = detection.reviewItems.map((message) => ({
    severity: "warning",
    rule: "project.review_item",
    path: ".",
    message
  }));
  const structureFindings = await findMissingDocs(options.cwd, detection.projectType, options.profiles);
  const sourceFileFindings = await scanSourceFiles(options.cwd);
  const linkFindings = await scanMarkdownLinks(options.cwd);
  const adapterFindings = await scanAdapters(options.cwd, agents);
  const findings = [
    ...detectionFindings,
    ...documentStatus.findings,
    ...structureFindings,
    ...sourceFileFindings,
    ...linkFindings,
    ...adapterFindings
  ];
  const result = findings.some((finding) => finding.severity === "blocked")
    ? "blocked"
    : findings.some((finding) => finding.severity === "error")
      ? "fail"
      : findings.some((finding) => finding.severity === "warning")
        ? "warning"
        : "pass";
  const adapterStatus = await summarizeAdapterStatus(options.cwd, agents);
  const summary = [
    `result: ${result}`,
    `initialized: ${initialized ? "yes" : "no"}`,
    `project_type: ${detection.projectType}`,
    `confidence: ${detection.confidence}`,
    `active_profiles: ${detection.activeProfiles.join(", ")}`,
    `selected_agents: ${agents.length ? agents.join(", ") : "none"}`,
    `wiki_docs: ${markdownFiles.length}`,
    `missing_required_docs: ${structureFindings.filter((finding) => finding.rule === "structure.required_doc").length}`,
    `findings: ${findings.length}`
  ];
  const findingSummary = summarizeFindings(findings);

  return withText({
    command: "status",
    result,
    initialized,
    detection,
    documentStatus,
    adapterStatus,
    findingSummary,
    findings
  }, "LLM-WIKI Status", [
    { title: "Summary", body: summary },
    { title: "Document Statuses", body: formatStatusCounts(documentStatus.counts) },
    { title: "Adapters", body: adapterStatus.length ? adapterStatus : ["none selected"] },
    { title: "Finding Summary", body: formatFindingSummary(findingSummary) },
    { title: "Findings", body: findings.map(formatFinding) },
    { title: "Next Steps", body: statusNextSteps(initialized, documentStatus.counts, findings, agents) }
  ]);
}

export async function audit(options) {
  const detection = await detectProject(options.cwd, options.type, options.profiles);
  const agents = selectedAgents(options);
  const frontmatter = await validateFrontmatterCommand(options);
  const detectionFindings = detection.reviewItems.map((message) => ({
    severity: "warning",
    rule: "project.review_item",
    path: ".",
    message
  }));
  const structureFindings = await findMissingDocs(options.cwd, detection.projectType, options.profiles);
  const encodingFindings = await scanEncoding(options.cwd);
  const sensitiveFindings = await scanSensitive(options.cwd);
  const sourceFileFindings = await scanSourceFiles(options.cwd);
  const linkFindings = await scanMarkdownLinks(options.cwd);
  const adapterFindings = await scanAdapters(options.cwd, agents);

  const findings = [
    ...detectionFindings,
    ...structureFindings,
    ...frontmatter.findings,
    ...encodingFindings,
    ...sensitiveFindings,
    ...sourceFileFindings,
    ...linkFindings,
    ...adapterFindings
  ];

  const result = findings.some((finding) => finding.severity === "blocked")
    ? "blocked"
    : findings.some((finding) => finding.severity === "error")
      ? "fail"
      : findings.some((finding) => finding.severity === "warning")
        ? "warning"
        : "pass";

  const summary = [
    `result: ${result}`,
    `project_type: ${detection.projectType}`,
    `confidence: ${detection.confidence}`,
    `active_profiles: ${detection.activeProfiles.join(", ")}`,
    `selected_agents: ${agents.length ? agents.join(", ") : "none"}`,
    `findings: ${findings.length}`
  ];
  const findingSummary = summarizeFindings(findings);

  return withText({
    command: "audit",
    result,
    detection,
    findingSummary,
    findings
  }, "LLM-WIKI Audit", [
    { title: "Summary", body: summary },
    { title: "Finding Summary", body: formatFindingSummary(findingSummary) },
    { title: "Findings", body: findings.map(formatFinding) },
    { title: "Caveats", body: ["Stable validation is warning-friendly by default; use --strict when warnings should fail CI."] }
  ]);
}

export async function validateCommand(options) {
  const auditResult = await audit(options);
  const findings = auditResult.findings ?? [];
  const result = findings.some((finding) => finding.severity === "blocked")
    ? "blocked"
    : findings.some((finding) => finding.severity === "error")
      ? "fail"
      : findings.some((finding) => finding.severity === "warning")
        ? "warning"
        : "pass";
  const summary = [
    `result: ${result}`,
    `mode: ${options.strict ? "strict" : "standard"}`,
    `project_type: ${auditResult.detection.projectType}`,
    `confidence: ${auditResult.detection.confidence}`,
    `active_profiles: ${auditResult.detection.activeProfiles.join(", ")}`,
    `selected_agents: ${selectedAgents(options).join(", ") || "none"}`,
    `findings: ${findings.length}`
  ];
  const findingSummary = summarizeFindings(findings);

  return withText({
    command: "validate",
    result,
    detection: auditResult.detection,
    findingSummary,
    findings
  }, "LLM-WIKI Validation", [
    { title: "Summary", body: summary },
    { title: "Finding Summary", body: formatFindingSummary(findingSummary) },
    { title: "Findings", body: findings.map(formatFinding) },
    { title: "Caveats", body: ["Validation reuses audit coverage for core, profile, selected-agent adapter, encoding, and sensitive-information checks."] }
  ]);
}

export async function quickstartCommand(options) {
  if (options.dryRun && options.write) {
    return blockedApply("quickstart", "Choose either quickstart --dry-run or quickstart --write. The two modes cannot be used together.");
  }

  if (!options.dryRun && !options.write) {
    return blockedApply("quickstart", "Use quickstart --dry-run to preview setup or quickstart --write to create missing LLM-WIKI files and print the Codex/Claude Code handoff prompt.");
  }

  const doctorResult = await doctor(options);
  const initResult = await initCommand(options);
  const frontmatterResult = options.write
    ? await validateFrontmatterCommand(options)
    : null;
  const handoff = buildHandoff(options, doctorResult.detection);
  const findings = [
    ...(initResult.findings ?? []),
    ...(frontmatterResult?.findings ?? []),
    ...handoff.findings
  ];
  const result = findings.some((finding) => finding.severity === "blocked")
    ? "blocked"
    : findings.some((finding) => finding.severity === "error")
      ? "fail"
      : findings.some((finding) => finding.severity === "warning")
        ? "warning"
        : "pass";
  const completedSteps = [
    "doctor completed.",
    options.write ? "init --write completed." : "init --dry-run completed.",
    options.write ? "validate-frontmatter completed." : "validate-frontmatter skipped because no files were written.",
    "handoff prompt prepared."
  ];

  return withText({
    command: "quickstart",
    dryRun: options.dryRun,
    write: options.write,
    result,
    doctor: {
      checks: doctorResult.checks,
      detection: doctorResult.detection,
      packageReadiness: doctorResult.packageReadiness
    },
    init: initResult,
    frontmatter: frontmatterResult,
    handoff,
    findings
  }, "LLM-WIKI Quickstart", [
    { title: "Completed Steps", body: completedSteps },
    { title: "Init Summary", body: quickstartInitSummary(initResult) },
    { title: "Frontmatter Summary", body: frontmatterResult?.summary ?? ["not run"] },
    { title: "Next Step", body: [handoff.message] },
    { title: "Handoff Prompt", body: `\`\`\`text\n${handoff.prompt}\n\`\`\`` },
    { title: "Caveats", body: ["CLI-created or CLI-edited wiki documents remain needs_review until human review. Run llm-wiki validate separately for structure or CI validation."] }
  ]);
}

export async function handoffCommand(options) {
  const detection = await detectProject(options.cwd, options.type, options.profiles);
  const handoff = buildHandoff(options, detection);
  const result = handoff.findings.some((finding) => finding.severity === "blocked") ? "blocked" : "pass";

  return withText({
    command: "handoff",
    result,
    detection,
    handoff,
    findings: handoff.findings
  }, "LLM-WIKI Handoff", [
    { title: "Next Step", body: [handoff.message] },
    { title: "Handoff Prompt", body: `\`\`\`text\n${handoff.prompt}\n\`\`\`` },
    { title: "Caveats", body: ["Run this prompt in the selected agent after CLI setup. Keep generated or edited documents as needs_review until human review."] }
  ]);
}

export async function initCommand(options) {
  const detection = await detectProject(options.cwd, options.type, options.profiles);
  const agents = selectedAgents(options);
  const candidates = plannedDocs(detection.projectType, options.minimal, options.profiles);

  if (options.dryRun) {
    return initDryRun(options, detection, agents, candidates);
  }

  if (options.write) {
    return initWrite(options, detection, agents, candidates);
  }

  return blockedApply("init", "Use init --dry-run to preview changes or init --write to create missing LLM-WIKI files. Existing wiki docs default to --existing skip.");
}

async function initDryRun(options, detection, agents, candidates) {
  const planned = [];
  const skipped = [];

  for (const rel of candidates) {
    if (await pathExists(path.join(options.cwd, rel))) {
      skipped.push(`${rel} exists; would not overwrite.`);
    } else {
      planned.push(`${rel} would be created with status needs_review.`);
    }
  }

  const adapterPlan = await planAdapterSuggestions(options.cwd, agents);
  planned.push(...adapterPlan.planned);
  skipped.push(...adapterPlan.skipped);

  if (options.withAdapters && agents.length > 0) {
    skipped.push("--with-adapters is treated as legacy shorthand for --agent all.");
  }

  return withText({
    command: "init",
    dryRun: true,
    detection,
    agents,
    planned,
    skipped
  }, "LLM-WIKI Init Dry Run", [
    { title: "Detected Project", body: [`type: ${detection.projectType}`, `confidence: ${detection.confidence}`] },
    { title: "Selected Agents", body: [agents.length ? agents.join(", ") : "none"] },
    { title: "Planned Creates", body: planned },
    { title: "Skipped Existing", body: skipped },
    { title: "Caveats", body: ["No files were written. Existing adapter files are not overwritten."] }
  ]);
}

export async function migrateCommand(options) {
  if (options.apply) {
    return blockedApply("migrate", "migrate --apply is intentionally blocked until automatic migration scope is accepted. Use migrate --dry-run or migrate --dry-run --out <path> to prepare a reviewable migration plan.");
  }

  const auditResult = await audit({ ...options, dryRun: true });
  const safeAdds = auditResult.findings
    .filter((finding) => finding.rule === "structure.required_doc")
    .map((finding) => `${finding.path} could be added as needs_review template.`);
  const blockedItems = auditResult.findings
    .filter((finding) => finding.severity === "blocked")
    .map(formatFinding);
  const reviewItems = auditResult.findings
    .filter((finding) => finding.severity === "warning" || finding.severity === "error")
    .map(formatFinding);

  return withText({
    command: "migrate",
    dryRun: true,
    safeAdds,
    reviewItems,
    blockedItems
  }, "LLM-WIKI Migration Dry Run", [
    { title: "Safe Automatic Changes", body: safeAdds },
    { title: "Human Review Required", body: reviewItems },
    { title: "Blocked Items", body: blockedItems },
    { title: "Caveats", body: ["No files were written. Existing verified documents are not modified. Raw sensitive values are omitted."] }
  ]);
}

function blockedApply(command, message) {
  return withText({
    command,
    result: "blocked",
    findings: [{ severity: "blocked", rule: `${command}.apply_blocked`, path: ".", message }]
  }, `LLM-WIKI ${command} Blocked`, [{ title: "Blocked", body: [message] }]);
}

async function listTargetMarkdown(cwd) {
  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  if (await pathExists(wikiRoot)) {
    return listMarkdownFiles(wikiRoot);
  }
  const files = await listMarkdownFiles(cwd);
  return files.filter((file) => !toPosix(path.relative(cwd, file)).startsWith("templates/"));
}

async function findMissingDocs(cwd, projectType, profiles = []) {
  const findings = [];
  const wikiEntry = path.join(cwd, "docs", "llm-wiki", "index.md");
  if (!(await pathExists(wikiEntry))) {
    findings.push({
      severity: "warning",
      rule: "structure.wiki_missing",
      path: "docs/llm-wiki/index.md",
      message: "LLM-WIKI is not initialized; ask the user whether to proceed as-is or run init --write first."
    });
    return findings;
  }

  for (const rel of plannedDocs(projectType, false, profiles)) {
    if (!(await pathExists(path.join(cwd, rel)))) {
      findings.push({
        severity: "warning",
        rule: "structure.required_doc",
        path: rel,
        message: "Required or profile-recommended LLM-WIKI document is missing."
      });
    }
  }
  return findings;
}

async function initWrite(options, detection, agents, candidates) {
  const created = [];
  const overwritten = [];
  const skipped = [];
  const blocked = [];

  for (const rel of candidates) {
    const absolutePath = path.join(options.cwd, rel);
    const exists = await pathExists(absolutePath);
    if (exists && isAppendOnlyLog(rel)) {
      skipped.push(`${rel} exists; kept append-only log even with --existing overwrite.`);
      continue;
    }
    if (exists && options.existing !== "overwrite") {
      skipped.push(`${rel} exists; kept existing file because --existing skip is active.`);
      continue;
    }

    const content = renderGeneratedWikiDoc(rel, detection);
    const sensitiveFindings = scanSensitiveInfo(content);
    if (sensitiveFindings.length > 0) {
      blocked.push(`${rel} was not written because generated content matched sensitive-info rules.`);
      continue;
    }

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, content, { encoding: "utf8" });
    if (exists) {
      overwritten.push(`${rel} overwritten with status needs_review by explicit --existing overwrite.`);
    } else {
      created.push(`${rel} created with status needs_review.`);
    }
  }

  const adapterWrites = await writeAdapterFiles(options.cwd, agents);
  created.push(...adapterWrites.created);
  skipped.push(...adapterWrites.skipped);
  blocked.push(...adapterWrites.blocked);

  if (options.withAdapters && agents.length > 0) {
    skipped.push("--with-adapters is treated as legacy shorthand for --agent all.");
  }

  const findings = blocked.map((message) => ({
    severity: "blocked",
    rule: "init.write_blocked",
    path: ".",
    message
  }));
  const result = findings.length > 0 ? "blocked" : "pass";

  return withText({
    command: "init",
    dryRun: false,
    write: true,
    existing: options.existing,
    result,
    detection,
    agents,
    created,
    overwritten,
    skipped,
    findings
  }, "LLM-WIKI Init Write", [
    { title: "Detected Project", body: [`type: ${detection.projectType}`, `confidence: ${detection.confidence}`] },
    { title: "Selected Agents", body: [agents.length ? agents.join(", ") : "none"] },
    { title: "Created", body: created },
    { title: "Overwritten", body: overwritten },
    { title: "Skipped Existing", body: skipped },
    { title: "Blocked", body: blocked },
    { title: "Caveats", body: ["Existing wiki docs are kept unless --existing overwrite is explicit. docs/llm-wiki/log.md and existing adapter files are never overwritten. ANTIGRAVITY.md is not created until the tool contract is confirmed."] }
  ]);
}

async function scanEncoding(cwd) {
  const findings = [];
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const mojibake = findMojibakeIndicators(content);
    if (hasUtf8Bom(content)) {
      findings.push({ severity: "info", rule: "encoding.bom", path: rel, message: "UTF-8 BOM detected." });
    }
    if (mojibake.length) {
      findings.push({ severity: "blocked", rule: "encoding.mojibake", path: rel, message: "Mojibake indicators detected; automatic rewrite skipped." });
    }
  }
  return findings;
}

async function scanSensitive(cwd) {
  const findings = [];
  const markdownFiles = await listTargetMarkdown(cwd);
  const adapterFiles = [];
  for (const rel of ["AGENTS.md", "CLAUDE.md", "ANTIGRAVITY.md"]) {
    const file = path.join(cwd, rel);
    if (await pathExists(file)) adapterFiles.push(file);
  }

  for (const file of [...markdownFiles, ...adapterFiles]) {
    if (!(await pathExists(file))) continue;
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    for (const finding of scanSensitiveInfo(content)) {
      findings.push({
        severity: "blocked",
        rule: "sensitive.redacted",
        path: `${rel}:${finding.line}`,
        message: `${finding.type}: ${finding.message}`
      });
    }
  }
  return findings;
}

async function scanSourceFiles(cwd) {
  const findings = [];
  for (const file of await listTargetMarkdown(cwd)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);
    const sourceFiles = parsed.frontmatter?.source_files;

    if (!Array.isArray(sourceFiles)) continue;

    for (const sourceFile of sourceFiles) {
      if (typeof sourceFile !== "string") continue;

      const source = sourceFile.trim();
      if (!source || isExternalSourceReference(source)) continue;

      if (!(await pathExists(path.join(cwd, source)))) {
        findings.push({
          severity: "warning",
          rule: "source_files.missing",
          path: rel,
          message: `source_files entry does not exist: ${source}.`
        });
      }
    }
  }
  return findings;
}

function isExternalSourceReference(source) {
  return /^https?:\/\//i.test(source) || source.startsWith("#");
}

async function scanMarkdownLinks(cwd) {
  const wikiRoot = path.join(cwd, "docs", "llm-wiki");
  if (!(await pathExists(wikiRoot))) return [];

  const findings = [];
  for (const file of await listMarkdownFiles(wikiRoot)) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);

    for (const target of extractMarkdownLinkTargets(content)) {
      const link = normalizeMarkdownLinkTarget(target);
      if (!link || isSkippedMarkdownLink(link)) continue;

      const absoluteTarget = resolveMarkdownLinkTarget(cwd, file, link);
      if (!(await pathExists(absoluteTarget))) {
        findings.push({
          severity: "warning",
          rule: "markdown_link.missing",
          path: rel,
          message: `Markdown link target does not exist: ${link}.`
        });
      }
    }
  }
  return findings;
}

function extractMarkdownLinkTargets(markdown) {
  const targets = [];
  const inlineLinkPattern = /(^|[^!])\[[^\]\n]+\]\(([^)\n]+)\)/g;
  const referenceDefinitionPattern = /^\s*\[[^\]\n]+\]:\s*(\S+)(?:\s+.*)?$/gm;

  for (const match of markdown.matchAll(inlineLinkPattern)) {
    targets.push(match[2]);
  }
  for (const match of markdown.matchAll(referenceDefinitionPattern)) {
    targets.push(match[1]);
  }
  return targets;
}

function normalizeMarkdownLinkTarget(target) {
  const trimmed = target.trim();
  const withoutTitle = trimmed.startsWith("<")
    ? trimmed.match(/^<([^>]+)>/)?.[1] ?? trimmed
    : trimmed.split(/\s+/)[0];
  const withoutQuery = withoutTitle.split("?")[0];
  const withoutAnchor = withoutQuery.split("#")[0];

  try {
    return decodeURIComponent(withoutAnchor).replaceAll("\\", "/");
  } catch {
    return withoutAnchor.replaceAll("\\", "/");
  }
}

function isSkippedMarkdownLink(link) {
  return link === "" || link.startsWith("#") || /^[a-z][a-z0-9+.-]*:/i.test(link);
}

function resolveMarkdownLinkTarget(cwd, fromFile, link) {
  if (link.startsWith("/")) {
    return path.join(cwd, link.slice(1));
  }
  if (link.startsWith("docs/")) {
    return path.join(cwd, link);
  }
  return path.resolve(path.dirname(fromFile), link);
}

async function scanAdapters(cwd, agents) {
  const findings = [];
  for (const agent of agents) {
    const target = ADAPTER_TARGETS[agent];
    if (!target) continue;
    const rel = target.path;
    const file = path.join(cwd, rel);
    if (!(await pathExists(file))) {
      findings.push({ severity: target.missingSeverity, rule: "adapter.missing", path: rel, message: target.missingMessage });
      continue;
    }

    const content = await readUtf8(file);
    if (!content.includes("docs/llm-wiki/index.md")) {
      findings.push({ severity: "warning", rule: "adapter.entrypoint", path: rel, message: "Adapter should point to docs/llm-wiki/index.md." });
    }
  }
  return findings;
}

async function planAdapterSuggestions(cwd, agents) {
  const planned = [];
  const skipped = [];

  for (const agent of agents) {
    const target = ADAPTER_TARGETS[agent];
    if (!target) continue;

    const fileExists = await pathExists(path.join(cwd, target.path));
    if (fileExists) {
      skipped.push(`${target.path} exists; would not overwrite. Adapter entrypoint would be checked for ${agent}.`);
      continue;
    }

    if (agent === "antigravity") {
      planned.push(`${target.path} remains an info-level adapter candidate; no file would be created until the tool contract is confirmed.`);
      continue;
    }

    planned.push(`${target.path} adapter would be suggested from templates/adapters for ${agent}; no file would be written in dry-run.`);
  }

  return { planned, skipped };
}

async function writeAdapterFiles(cwd, agents) {
  const created = [];
  const skipped = [];
  const blocked = [];

  for (const agent of agents) {
    const target = ADAPTER_TARGETS[agent];
    if (!target) continue;

    if (!target.writable) {
      skipped.push(`${target.path} remains an info-level adapter candidate; no file was created because the ${agent} tool contract is unconfirmed.`);
      continue;
    }

    const absolutePath = path.join(cwd, target.path);
    if (await pathExists(absolutePath)) {
      skipped.push(`${target.path} exists; kept existing adapter file and did not overwrite it.`);
      continue;
    }

    const content = await readUtf8(target.template);
    const sensitiveFindings = scanSensitiveInfo(content);
    if (sensitiveFindings.length > 0) {
      blocked.push(`${target.path} was not written because generated content matched sensitive-info rules.`);
      continue;
    }

    await writeFile(absolutePath, content, { encoding: "utf8" });
    created.push(`${target.path} created for ${agent}.`);
  }

  return { created, skipped, blocked };
}

function renderGeneratedWikiDoc(rel, detection) {
  const meta = docMetadata(rel, detection);
  const project = path.basename(detection.signals.find((signal) => signal.path === "package.json")?.path ?? "project") === "package.json"
    ? "project"
    : "project";

  return renderWikiDocumentTemplate({
    title: meta.title,
    docType: meta.docType,
    project,
    sourceFiles: meta.sourceFiles,
    related: meta.related,
    body: meta.body
  });
}

async function summarizeAdapterStatus(cwd, agents) {
  const statuses = [];
  for (const agent of agents) {
    const target = ADAPTER_TARGETS[agent];
    if (!target) continue;

    const exists = await pathExists(path.join(cwd, target.path));
    if (exists) {
      statuses.push(`${agent}: ${target.path} present`);
    } else if (!target.writable) {
      statuses.push(`${agent}: ${target.path} candidate only; tool contract unconfirmed`);
    } else {
      statuses.push(`${agent}: ${target.path} missing`);
    }
  }
  return statuses;
}

function docMetadata(rel, detection) {
  const fallbackTitle = titleFromPath(rel);
  const commonRelated = ["docs/llm-wiki/index.md", "docs/llm-wiki/log.md"].filter((item) => item !== rel);
  const map = {
    "docs/llm-wiki/index.md": {
      title: "LLM-WIKI Index",
      docType: "wiki_index",
      related: ["docs/llm-wiki/README.md", "docs/llm-wiki/log.md"],
      body: `# LLM-WIKI Index

이 문서는 프로젝트 LLM-WIKI의 공식 진입점입니다.

## Status

- 현재 문서는 CLI가 생성한 초안이므로 \`needs_review\` 상태입니다.
- 사람 검토가 끝난 뒤에만 \`verified\`로 승격할 수 있습니다.

## Recommended Read Order

1. \`docs/llm-wiki/index.md\`
2. \`docs/llm-wiki/README.md\`
3. \`docs/llm-wiki/project-profile.md\`
4. 작업 대상 도메인 문서와 관련 source files
`
    },
    "docs/llm-wiki/README.md": {
      title: "LLM-WIKI README",
      docType: "wiki_readme",
      related: ["docs/llm-wiki/index.md", "docs/llm-wiki/project-profile.md"],
      body: `# LLM-WIKI README

이 디렉터리는 프로젝트 지식, 의사결정, 작업 규칙을 LLM과 개발자가 함께 참조하기 위한 문서 공간입니다.

## Operating Rules

- 모든 wiki 문서는 YAML frontmatter를 가집니다.
- CLI 또는 LLM이 생성/수정한 문서는 \`needs_review\` 상태를 유지합니다.
- 민감정보 raw value는 기록하지 않습니다.
- 변경 기록은 \`docs/llm-wiki/log.md\`에 append-only로 남깁니다.
`
    },
    "docs/llm-wiki/log.md": {
      title: "LLM-WIKI Change Log",
      docType: "change_log",
      related: ["docs/llm-wiki/index.md"],
      body: `# LLM-WIKI Change Log

이 문서는 append-only 변경 로그입니다. 기존 항목은 수정하지 말고 새 변경 사항을 위에 추가합니다.

## 2026-07-02 - LLM-WIKI 초기 문서 생성

- status: needs_review
- actor: llm-wiki-cli
- scope: docs
- changed:
  - docs/llm-wiki/
- summary:
  - \`llm-wiki init --write\` 명령으로 초기 LLM-WIKI 문서 구조를 생성했다.
- evidence:
  - package.json
- caveats:
  - CLI 생성 초안이므로 사람 검토가 필요하다.
`
    },
    "docs/llm-wiki/project-profile.md": {
      title: "Project Profile",
      docType: "project_profile",
      body: `# Project Profile

## Detected Project

- type: \`${detectionProjectTypePlaceholder}\`
- confidence: generated during init

## Review Notes

- 프로젝트명, 주요 런타임, 배포 환경, 소유 팀을 사람 검토 후 보강합니다.
`
    }
  };

  const meta = map[rel] ?? {
    title: fallbackTitle,
    docType: docTypeFromPath(rel),
    body: `# ${fallbackTitle}

이 문서는 \`llm-wiki init --write\`가 생성한 초안입니다.

## Purpose

- 이 프로젝트에서 해당 주제의 기준 정보를 정리합니다.
- 실제 구현 파일을 확인한 뒤 source evidence를 보강합니다.

## Review Notes

- 사람 검토 전까지 \`needs_review\` 상태를 유지합니다.
`
  };

  return {
    title: meta.title,
    docType: meta.docType,
    sourceFiles: meta.sourceFiles ?? ["package.json"],
    related: meta.related ?? commonRelated,
    body: meta.body.replaceAll(detectionProjectTypePlaceholder, detection.projectType)
  };
}

const detectionProjectTypePlaceholder = "__PROJECT_TYPE__";

function titleFromPath(rel) {
  const base = path.basename(rel, ".md");
  return base
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function docTypeFromPath(rel) {
  if (rel.includes("/profiles/")) return "profile";
  if (rel.includes("/domains/")) return "domain_overview";
  if (rel.includes("/templates/")) return "template";
  return path.basename(rel, ".md").toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function isAppendOnlyLog(rel) {
  return toPosix(rel) === "docs/llm-wiki/log.md";
}

function selectedAgents(options) {
  if (options.agents?.length) return options.agents;
  if (options.withAdapters) return Object.keys(ADAPTER_TARGETS);
  return [];
}

function plannedDocs(projectType, minimal, profiles = []) {
  if (minimal) return CORE_REQUIRED_DOCS;
  const profileDocs = profiles.flatMap((profile) => PROFILE_DOCS[profile] ?? []);
  return [...new Set([...CORE_REQUIRED_DOCS, ...(PROFILE_DOCS[projectType] ?? PROFILE_DOCS.unknown), ...profileDocs])];
}

async function detectPackageManager(cwd) {
  if (await pathExists(path.join(cwd, "yarn.lock"))) return "yarn";
  if (await pathExists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await pathExists(path.join(cwd, "package-lock.json"))) return "npm";
  return null;
}

async function inspectPackageReadiness(cwd) {
  const packagePath = path.join(cwd, "package.json");
  if (!(await pathExists(packagePath))) return [];

  let packageJson = null;
  try {
    packageJson = JSON.parse(await readUtf8(packagePath));
  } catch {
    return ["package_json: unreadable"];
  }

  if (!packageJson?.bin?.["llm-wiki"]) return [];

  const checklistExists = await pathExists(path.join(cwd, "RELEASE_CHECKLIST.md"));
  return [
    `package_name: ${packageJson.name ?? "missing"}`,
    `version: ${packageJson.version ?? "missing"}`,
    `private: ${packageJson.private === true ? "true" : "false"}`,
    `bin.llm-wiki: ${packageJson.bin["llm-wiki"]}`,
    `release_checklist: ${checklistExists ? "present" : "missing"}`,
    "recommended_release_level: stable",
    "migrate_apply: keep blocked",
    "external_shells: verify in release CI before publish"
  ];
}

function formatFinding(finding) {
  return `[${finding.severity}] ${finding.rule} ${finding.path}: ${finding.message}`;
}

function summarizeFindings(findings) {
  const summary = {
    total: findings.length,
    bySeverity: {},
    byCategory: {}
  };

  for (const finding of findings) {
    const severity = finding.severity ?? "unknown";
    const category = findingCategory(finding.rule);
    summary.bySeverity[severity] = (summary.bySeverity[severity] ?? 0) + 1;
    summary.byCategory[category] = (summary.byCategory[category] ?? 0) + 1;
  }

  return summary;
}

function findingCategory(rule) {
  if (!rule) return "unknown";
  return String(rule).split(".")[0] || "unknown";
}

function formatFindingSummary(summary) {
  if (summary.total === 0) return [];

  return [
    `total: ${summary.total}`,
    `by_severity: ${formatCountMap(summary.bySeverity)}`,
    `by_category: ${formatCountMap(summary.byCategory)}`
  ];
}

function formatCountMap(counts) {
  const entries = Object.entries(counts).sort(([left], [right]) => left.localeCompare(right));
  return entries.length
    ? entries.map(([key, count]) => `${key}=${count}`).join(", ")
    : "none";
}

async function summarizeDocumentStatuses(cwd, markdownFiles) {
  const counts = Object.fromEntries([...VALID_STATUSES].map((status) => [status, 0]));
  counts.unknown = 0;
  const findings = [];

  for (const file of markdownFiles) {
    const rel = toPosix(path.relative(cwd, file));
    const content = await readUtf8(file);
    const parsed = parseFrontmatter(content);

    for (const message of parsed.errors) {
      findings.push({ severity: "error", rule: "frontmatter.parse", path: rel, message });
    }
    for (const finding of validateFrontmatter(parsed.frontmatter)) {
      findings.push({ ...finding, path: rel });
    }

    const status = parsed.frontmatter?.status;
    if (status && VALID_STATUSES.has(status)) {
      counts[status] += 1;
    } else {
      counts.unknown += 1;
    }
  }

  return {
    filesChecked: markdownFiles.length,
    counts,
    findings
  };
}

function formatStatusCounts(counts) {
  return Object.entries(counts).map(([status, count]) => `${status}: ${count}`);
}

function statusNextSteps(initialized, counts, findings, agents) {
  const steps = [];
  if (!initialized) {
    steps.push("Run llm-wiki quickstart --write with the appropriate --type and --agent.");
  }
  if ((counts.needs_review ?? 0) > 0) {
    steps.push("Run llm-wiki handoff --agent codex or --agent claude, then ask the agent to enrich needs_review docs from source evidence.");
  }
  if (findings.some((finding) => finding.rule === "structure.required_doc")) {
    steps.push("Run llm-wiki init --write to create missing recommended docs, or review whether the selected profile is correct.");
  }
  if (agents.length === 0) {
    steps.push("Pass --agent codex or --agent claude when you want adapter status and handoff guidance.");
  }
  if (steps.length === 0) {
    steps.push("Run llm-wiki validate before CI or release.");
  }
  return steps;
}

function quickstartInitSummary(initResult) {
  const lines = [];
  if (initResult.result) lines.push(`result: ${initResult.result}`);
  if (initResult.detection) {
    lines.push(`project_type: ${initResult.detection.projectType}`);
    lines.push(`confidence: ${initResult.detection.confidence}`);
  }
  if (initResult.created?.length) lines.push(`created: ${initResult.created.length}`);
  if (initResult.overwritten?.length) lines.push(`overwritten: ${initResult.overwritten.length}`);
  if (initResult.planned?.length) lines.push(`planned: ${initResult.planned.length}`);
  if (initResult.skipped?.length) lines.push(`skipped: ${initResult.skipped.length}`);
  if (initResult.blocked?.length) lines.push(`blocked: ${initResult.blocked.length}`);
  return lines;
}

function buildHandoff(options, detection = null) {
  const agents = selectedAgents(options);
  const supportedAgents = agents.length === 0 ? ["codex", "claude"] : agents.filter((agent) => agent === "codex" || agent === "claude");
  const unsupportedAgents = agents.filter((agent) => agent === "antigravity");
  const projectType = detection?.projectType ?? options.type ?? "unknown";
  const evidenceGuidance = handoffEvidenceGuidance(projectType);
  const completionPrefix = options.dryRun && !options.write
    ? "CLI 미리보기가 완료되었습니다. 실제 파일 생성 후"
    : "CLI 작업이 완료되었습니다.";
  const findings = unsupportedAgents.map((agent) => ({
    severity: supportedAgents.length > 0 ? "warning" : "blocked",
    rule: "handoff.unsupported_agent",
    path: ".",
    message: `${agent} handoff is not available because the adapter contract is unconfirmed.`
  }));
  const label = handoffLabel(supportedAgents);
  const entrypoints = handoffEntrypoints(supportedAgents);
  const unsupportedNote = unsupportedAgents.length > 0
    ? ` ${unsupportedAgents.join(", ")} handoff는 adapter contract가 확정되지 않아 아직 지원하지 않습니다.`
    : "";

  if (supportedAgents.length === 0) {
    return {
      agents,
      supportedAgents,
      unsupportedAgents,
      projectType,
      evidenceGuidance,
      label: unsupportedAgents.join(", "),
      entrypoints: "docs/llm-wiki/index.md",
      message: `${completionPrefix} ${unsupportedNote.trim()}`,
      prompt: "No Codex or Claude Code handoff prompt is available for the selected agent. Select --agent codex or --agent claude, or run the next documentation work manually after reviewing docs/llm-wiki/index.md.",
      findings
    };
  }

  const message = `${completionPrefix} ${label}에게 넘어가서 아래 프롬프트를 실행하세요.`;
  const prompt = `${entrypoints} 먼저 읽어주세요.
그 다음 실제 코드, 설정 파일, 라우팅, API, 데이터 모델, 주요 워크플로우를 근거로 docs/llm-wiki 문서를 보강해주세요.
${evidenceGuidance.join("\n")}
CLI가 생성한 초안과 에이전트가 수정한 문서는 needs_review 상태로 유지해주세요.
verified 승인은 하지 말고, 사람이 검토해야 할 항목과 근거 부족 항목을 docs/llm-wiki/log.md에 append-only로 남겨주세요.
민감정보 raw value는 문서나 리포트에 기록하지 말고, 필요한 경우 redacted 형태로만 설명해주세요.
작업이 끝나면 변경한 파일 목록, 확인한 source file, 남은 review item을 요약해주세요.`;

  return {
    agents,
    supportedAgents,
    unsupportedAgents,
    projectType,
    evidenceGuidance,
    label,
    entrypoints,
    message: `${message}${unsupportedNote}`,
    prompt,
    findings
  };
}

function handoffLabel(agents) {
  if (agents.includes("codex") && agents.includes("claude")) return "Codex 또는 Claude Code";
  if (agents.includes("codex")) return "Codex";
  if (agents.includes("claude")) return "Claude Code";
  return "Codex 또는 Claude Code";
}

function handoffEvidenceGuidance(projectType) {
  const guidance = {
    frontend: [
      "Frontend evidence focus:",
      "- Inspect routes, pages, components, state management, API clients, accessibility behavior, and end-to-end user workflows."
    ],
    backend: [
      "Backend evidence focus:",
      "- Inspect API routes, controllers, services, data models, persistence, auth/security boundaries, jobs, and operational configuration."
    ],
    fullstack: [
      "Fullstack evidence focus:",
      "- Inspect UI flows, API contracts, client/server boundaries, shared schemas, environment configuration, data model changes, and release flow."
    ],
    library: [
      "Library evidence focus:",
      "- Inspect public exports, package entrypoints, type declarations, examples, versioning policy, compatibility guarantees, and release flow."
    ]
  };

  return guidance[projectType] ?? [
    "General evidence focus:",
    "- Inspect the files referenced by source_files first, then map architecture, workflows, configuration, tests, and open review questions from real code evidence."
  ];
}

function handoffEntrypoints(agents) {
  const files = ["docs/llm-wiki/index.md"];
  if (agents.length === 0 || agents.includes("codex")) files.unshift("AGENTS.md");
  if (agents.length === 0 || agents.includes("claude")) files.unshift("CLAUDE.md");
  return `${files.join("와 ")}를`;
}

function withText(payload, title, sections) {
  return {
    ...payload,
    text: renderTextReport(title, sections)
  };
}
