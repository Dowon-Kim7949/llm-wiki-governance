import path from "node:path";
import { mkdir } from "node:fs/promises";
import { writeUtf8 } from "./encoding.js";
import { scanSensitiveInfo } from "./sensitive-info.js";
import { JSON_SCHEMA_VERSION } from "./config.js";

// Guarantee a top-level `schemaVersion` on the JSON output. Command results
// built via withText already carry it, so this is an idempotent safety net for
// any result assembled another way. Additive: `schemaVersion` leads the object,
// existing fields follow unchanged. Only applied on the `--format json` path.
function withSchemaVersion(result) {
  return { schemaVersion: JSON_SCHEMA_VERSION, ...result };
}

// Compute the href for a wiki document in the HTML dashboard. Document paths are
// repo-root-relative (e.g. "docs/llm-wiki/x.md"). When the dashboard is written
// with --out, links must resolve from the OUTPUT file's directory, not the repo
// root, or opening the file from a subfolder 404s every link. When there is no
// output path (stdout dashboard) the repo-root-relative path is kept unchanged.
function dashboardDocHref(docPath, options) {
  if (!options || !options.out || !options.cwd) return docPath;
  const target = path.resolve(options.cwd, docPath);
  const rel = path.relative(path.dirname(options.out), target);
  return rel.split(path.sep).join("/");
}

export function renderTextReport(title, sections) {
  const lines = [`# ${title}`, ""];
  for (const section of sections) {
    lines.push(`## ${section.title}`);
    if (Array.isArray(section.body)) {
      if (section.body.length === 0) {
        lines.push("- none");
      } else {
        for (const item of section.body) lines.push(`- ${item}`);
      }
    } else {
      lines.push(String(section.body));
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export async function printResult(result, options) {
  if (options.format === "json") {
    console.log(JSON.stringify(withSchemaVersion(result), null, 2));
  } else if (options.format === "markdown") {
    console.log(renderOutputFile(result, options).trimEnd());
  } else if (options.format === "html") {
    console.log(renderHtmlDashboard(result, options));
  } else {
    console.log(result.text);
  }

  if (options.out) {
    await writeReport(options.out, result, options);
  }
}

export async function writeReport(outPath, result, options) {
  const content = renderOutputFile(result, options);
  const sensitiveFindings = scanSensitiveInfo(content);
  if (sensitiveFindings.length > 0) {
    throw new Error(`Refusing to write report with sensitive-looking content: ${outPath}`);
  }

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeUtf8(outPath, content);
}

export function renderOutputFile(result, options) {
  if (options.format === "json" || options.out?.endsWith(".json")) {
    return `${JSON.stringify(withSchemaVersion(redactRuntimeText(result)), null, 2)}\n`;
  }

  if (result.command === "release-notes" && typeof result.document === "string") {
    return result.document;
  }

  if (result.command === "graph" && (options.format === "mermaid" || options.format === "dot")) {
    return result.text.endsWith("\n") ? result.text : `${result.text}\n`;
  }

  if (options.format === "html" || options.out?.endsWith(".html")) {
    return renderHtmlDashboard(result, options);
  }

  const today = new Date().toISOString().slice(0, 10);
  const title = outputTitle(result.command);
  return `---
title: ${title}
tags:
  - llm-wiki
  - report
  - needs-review
status: needs_review
doc_type: cli_report
project: cli-generated
last_updated: ${today}
author: cli-generated
last_edited_by: llm-wiki-cli
wiki_block_version: v1
source_files:
  - docs/llm-wiki/index.md
related:
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

${result.text}
`;
}

function outputTitle(command) {
  const name = command ? command.replace(/-/g, " ") : "CLI";
  return `LLM-WIKI ${name} report`;
}

function redactRuntimeText(result) {
  const clone = { ...result };
  delete clone.text;
  return clone;
}

export function renderHtmlDashboard(result, options = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const command = result.command ?? "cli";
  const title = outputTitle(command);
  const overall = result.result ?? "n/a";
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const summary = result.findingSummary ?? { total: findings.length, bySeverity: {}, byCategory: {} };
  const graph = result.wikiGraph?.summary;
  const detection = result.detection;

  const tiles = [
    tile("Result", overall, `status-${overall}`),
    tile("Findings", summary.total ?? findings.length),
    tile("Documents", graph ? graph.documents : "—"),
    tile("Orphans", graph ? graph.orphanDocuments : "—"),
    tile("Unresolved links", graph ? graph.unresolvedWikiLinks : "—")
  ].join("\n");

  const sections = [];

  if (detection) {
    sections.push(htmlSection("Project", `
      <dl class="meta">
        <div><dt>Type</dt><dd>${escapeHtml(detection.projectType)}</dd></div>
        <div><dt>Confidence</dt><dd>${escapeHtml(detection.confidence)}</dd></div>
        <div><dt>Profiles</dt><dd>${escapeHtml((detection.activeProfiles ?? []).join(", ") || "—")}</dd></div>
      </dl>`));
  }

  if (result.documentStatus?.counts) {
    const rows = Object.entries(result.documentStatus.counts)
      .map(([status, count]) => `<tr><td><span class="badge status-${escapeHtml(status)}">${escapeHtml(status)}</span></td><td class="num">${escapeHtml(count)}</td></tr>`)
      .join("\n");
    sections.push(htmlSection("Document Status", `<table><thead><tr><th>Status</th><th class="num">Count</th></tr></thead><tbody>${rows}</tbody></table>`));
  }

  const byCategory = Object.entries(summary.byCategory ?? {}).sort(([a], [b]) => a.localeCompare(b));
  if (byCategory.length) {
    const rows = byCategory
      .map(([category, count]) => `<tr><td>${escapeHtml(category)}</td><td class="num">${escapeHtml(count)}</td></tr>`)
      .join("\n");
    sections.push(htmlSection("Findings by Category", `<table><thead><tr><th>Category</th><th class="num">Count</th></tr></thead><tbody>${rows}</tbody></table>`));
  }

  if (findings.length) {
    const rows = findings
      .map((finding) => `<tr>
        <td><span class="badge sev-${escapeHtml(finding.severity)}">${escapeHtml(finding.severity)}</span></td>
        <td><code>${escapeHtml(finding.rule)}</code></td>
        <td><code>${escapeHtml(finding.path)}</code></td>
        <td>${escapeHtml(finding.message)}</td>
      </tr>`)
      .join("\n");
    sections.push(htmlSection("Findings", `<table class="findings"><thead><tr><th>Severity</th><th>Rule</th><th>Path</th><th>Message</th></tr></thead><tbody>${rows}</tbody></table>`));
  } else {
    sections.push(htmlSection("Findings", `<p class="empty">No findings.</p>`));
  }

  if (result.wikiGraph) {
    const unresolved = (result.wikiGraph.unresolvedConcepts ?? [])
      .map((item) => `<li><code>${escapeHtml(item.target)}</code> <span class="muted">(${escapeHtml((item.sources ?? []).join(", "))})</span></li>`)
      .join("\n");
    const orphans = (result.wikiGraph.orphanDocuments ?? [])
      .map((docPath) => `<li><code>${escapeHtml(docPath)}</code></li>`)
      .join("\n");
    sections.push(htmlSection("Wiki Graph", `
      <dl class="meta">
        <div><dt>Documents</dt><dd>${escapeHtml(graph?.documents ?? 0)}</dd></div>
        <div><dt>Wiki links</dt><dd>${escapeHtml(graph?.wikiLinks ?? 0)}</dd></div>
        <div><dt>Resolved</dt><dd>${escapeHtml(graph?.resolvedWikiLinks ?? 0)}</dd></div>
        <div><dt>Aliases</dt><dd>${escapeHtml(graph?.aliases ?? 0)}</dd></div>
      </dl>
      ${unresolved ? `<h3>Unresolved concepts</h3><ul>${unresolved}</ul>` : ""}
      ${orphans ? `<h3>Orphan documents</h3><ul>${orphans}</ul>` : ""}`));
  }

  if (result.wikiGraph?.documents?.length) {
    const orphanSet = new Set(result.wikiGraph.orphanDocuments ?? []);
    const rows = [...result.wikiGraph.documents]
      .sort((left, right) => left.path.localeCompare(right.path))
      .map((doc) => {
        const label = escapeHtml(doc.title || doc.path.split("/").pop());
        const orphanBadge = orphanSet.has(doc.path) ? ` <span class="badge sev-warning">orphan</span>` : "";
        const href = escapeHtml(dashboardDocHref(doc.path, options));
        return `<tr><td><a href="${href}">${label}</a>${orphanBadge}</td><td><code>${escapeHtml(doc.path)}</code></td><td class="num">${escapeHtml(doc.inboundCount ?? 0)}</td></tr>`;
      })
      .join("\n");
    sections.push(htmlSection("Document Index", `<table><thead><tr><th>Document</th><th>Path</th><th class="num">Inbound</th></tr></thead><tbody>${rows}</tbody></table>`));
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
:root { color-scheme: light dark; --bg:#f6f7f9; --card:#fff; --fg:#1b1f24; --muted:#5b6472; --border:#e2e6ea; --accent:#2f6feb; }
@media (prefers-color-scheme: dark) { :root { --bg:#0f1216; --card:#171b21; --fg:#e6e9ee; --muted:#9aa4b2; --border:#2a313a; --accent:#5b8cff; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--fg); font:15px/1.5 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; }
main { max-width: 960px; margin:0 auto; padding: 32px 20px 64px; }
header { display:flex; flex-wrap:wrap; align-items:baseline; gap:12px; margin-bottom:24px; }
h1 { font-size:22px; margin:0; }
h2 { font-size:15px; text-transform:uppercase; letter-spacing:.04em; color:var(--muted); margin:32px 0 12px; }
h3 { font-size:14px; margin:18px 0 8px; }
.tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
.tile { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:14px 16px; }
.tile .label { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
.tile .value { font-size:24px; font-weight:600; margin-top:4px; }
.card { background:var(--card); border:1px solid var(--border); border-radius:10px; padding:4px 16px 16px; }
table { width:100%; border-collapse:collapse; font-size:14px; }
th,td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--border); vertical-align:top; }
th { color:var(--muted); font-weight:600; }
td.num,th.num { text-align:right; }
code { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:12.5px; }
.badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; }
.muted { color:var(--muted); }
.empty { color:var(--muted); }
.meta { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin:12px 0; }
.meta dt { font-size:12px; color:var(--muted); text-transform:uppercase; letter-spacing:.04em; }
.meta dd { margin:2px 0 0; font-size:16px; font-weight:600; }
.sev-blocked,.sev-error { background:#fdecec; color:#b42318; }
.sev-warning { background:#fef6e7; color:#a15c07; }
.sev-info { background:#eaf1fe; color:#1f5fc4; }
.status-pass,.status-verified { background:#e7f6ec; color:#1a7f37; }
.status-warning { background:#fef6e7; color:#a15c07; }
.status-fail,.status-blocked { background:#fdecec; color:#b42318; }
.status-needs_review { background:#eaf1fe; color:#1f5fc4; }
@media (prefers-color-scheme: dark) {
  .sev-blocked,.sev-error,.status-fail,.status-blocked { background:#3a1a1a; color:#ff9a8f; }
  .sev-warning,.status-warning { background:#3a2f16; color:#ffcf7a; }
  .sev-info,.status-needs_review { background:#182a44; color:#8fb6ff; }
  .status-pass,.status-verified { background:#16311f; color:#84e0a3; }
}
.overflow { overflow-x:auto; }
footer { margin-top:40px; color:var(--muted); font-size:12px; }
</style>
</head>
<body>
<main>
<header>
  <h1>${escapeHtml(title)}</h1>
  <span class="badge status-${escapeHtml(overall)}">${escapeHtml(overall)}</span>
</header>
<section class="tiles">
${tiles}
</section>
${sections.join("\n")}
<footer>Generated by llm-wiki on ${escapeHtml(today)}. Documents are needs_review until human review.</footer>
</main>
</body>
</html>
`;
}

function tile(label, value, statusClass = "") {
  const inner = statusClass
    ? `<span class="badge ${escapeHtml(statusClass)}">${escapeHtml(value)}</span>`
    : escapeHtml(value);
  return `<div class="tile"><div class="label">${escapeHtml(label)}</div><div class="value">${inner}</div></div>`;
}

function htmlSection(heading, inner) {
  return `<h2>${escapeHtml(heading)}</h2>\n<section class="card overflow">${inner}</section>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
