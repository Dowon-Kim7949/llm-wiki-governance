// One-way importer: portable ECC `ecc.memory.v1` Markdown memories become
// needs_review LLM-WIKI drafts under docs/llm-wiki/imported/.
//
// ECC (github.com/affaan-m/ECC) documents its Memory Vault as portable
// `ecc.memory.v1` Markdown documents — YAML frontmatter plus a bounded
// Markdown body (schemas/memory.schema.json, docs/design/ecc-memory-vault.md)
// — and states that memories are "unreviewed context, not executable policy":
// accepted knowledge is promoted BY A HUMAN into governed project
// documentation, the layer this package governs. This command is that
// promotion on-ramp on the LLM-WIKI side. Every produced draft goes through
// the shared wiki template, which hardcodes `status: needs_review`, so an
// import can never mint a `verified` document; humans promote drafts later
// with `llm-wiki review`.
//
// Conservative-write policy (house discipline, mirrors migrate --apply):
//   - Preview by default; files are written only with --apply.
//   - Existing targets are never overwritten (skip + report).
//   - log.md is never touched — append it when integrating the drafts.
//   - Memories with sensitive-looking values are skipped entirely and reported
//     as counts only (values are never shown); there is deliberately no force
//     flag in v1.
//
// Parser stance: frontmatter keys are matched against the published
// ecc.memory.v1 field set — snake_case as in ECC's Markdown records, with the
// camelCase spellings of schemas/memory.schema.json tolerated. Unknown keys
// are REPORTED (never silently dropped) and the memory body is preserved
// verbatim under `## Memory Body`. Reads are BOM-aware (readTextAuto) because
// memory files are foreign inputs that may arrive UTF-16/UTF-8-BOM encoded.
//
// Leaf module: imports shared seams only, never ../commands.js.
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { detectProject } from "../detector.js";
import { readTextAuto, writeUtf8 } from "../encoding.js";
import { listMarkdownFiles, pathExists, toPosix } from "../files.js";
import { parseFrontmatter } from "../frontmatter.js";
import { scanSensitiveInfo } from "../sensitive-info.js";
import { renderWikiDocumentTemplate } from "../template-renderer.js";
import { formatFinding, withText } from "./findings.js";

export const ECC_MEMORY_SCHEMA = "ecc.memory.v1";
export const IMPORTED_DOC_TYPE = "imported_memory";
const IMPORTED_DIR_SEGMENTS = ["docs", "llm-wiki", "imported"];
const IMPORTED_DIR_POSIX = IMPORTED_DIR_SEGMENTS.join("/");
const DEFAULT_VAULT_DIR = ".ecc/memory";
const REPORT_TITLE = "LLM-WIKI Import Memory";

// The published ecc.memory.v1 field set (schemas/memory.schema.json +
// docs/design/ecc-memory-vault.md). ECC's Markdown records use snake_case;
// the normalized JSON schema uses camelCase — both spellings are recognized.
const ECC_KNOWN_KEYS = new Set([
  "schema", "id", "title", "kind", "scope", "trust", "status", "tags", "links",
  "source_harness", "sourceHarness",
  "target_harnesses", "targetHarnesses",
  "created_at", "createdAt",
  "updated_at", "updatedAt"
]);

// Required per schemas/memory.schema.json; alias groups count as one field.
const ECC_REQUIRED_KEYS = [
  ["schema"], ["id"], ["title"], ["kind"], ["scope"], ["trust"], ["status"],
  ["source_harness", "sourceHarness"],
  ["target_harnesses", "targetHarnesses"],
  ["tags"], ["links"],
  ["created_at", "createdAt"],
  ["updated_at", "updatedAt"]
];

const MEMORY_ID_PATTERN = /^mem_[a-z0-9][a-z0-9_-]{2,127}$/;

// Parse one candidate file as an ecc.memory.v1 document. Pure over the raw
// text. Conservative: any frontmatter parse error rejects the file (a
// half-parsed memory must not be imported), a wrong/missing `schema` marker
// rejects it as a different format, unknown keys and missing required keys are
// reported but do not block, and the body is passed through verbatim.
export function parseEccMemory(raw) {
  const { frontmatter, body, errors } = parseFrontmatter(raw);
  if (!frontmatter || errors.length > 0) {
    return { ok: false, reason: "invalid" };
  }
  const schema = typeof frontmatter.schema === "string" ? frontmatter.schema.trim() : "";
  if (schema !== ECC_MEMORY_SCHEMA) {
    // The declared schema is echoed (truncated) for diagnosis; it is a format
    // marker, never a value-bearing field.
    return { ok: false, reason: "unsupported_schema", declaredSchema: schema.slice(0, 60) || "(none)" };
  }
  const unknownKeys = Object.keys(frontmatter).filter((key) => !ECC_KNOWN_KEYS.has(key)).sort();
  const missingKeys = ECC_REQUIRED_KEYS
    .filter((aliases) => !aliases.some((key) => key in frontmatter))
    .map((aliases) => aliases[0]);
  return { ok: true, fields: frontmatter, body, unknownKeys, missingKeys };
}

// Deterministic target basename: the memory id when it matches ECC's published
// id grammar (already filesystem-safe), else a conservatively sanitized source
// filename stem.
export function importedDocName(fields, sourceFile) {
  const id = typeof fields.id === "string" ? fields.id.trim() : "";
  if (MEMORY_ID_PATTERN.test(id)) return `${id}.md`;
  const stem = path.basename(sourceFile)
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return `${stem || "memory"}.md`;
}

export async function importMemoryCommand(options) {
  const apply = options.apply === true;
  const cwd = options.cwd;
  const explicitSource = typeof options.memoryPath === "string" && options.memoryPath.trim() !== "";
  const sourceAbs = path.resolve(cwd, explicitSource ? options.memoryPath : DEFAULT_VAULT_DIR);
  const sourceRel = toPosix(path.relative(cwd, sourceAbs)) || ".";

  const findings = [];
  const planned = [];
  const imported = [];
  const skipped = [];

  if (!(await pathExists(sourceAbs))) {
    if (explicitSource) {
      findings.push({
        severity: "error",
        rule: "import.source_missing",
        path: sourceRel,
        message: `Memory source not found: ${sourceRel}.`
      });
      return report({ apply, result: "fail", sourceRel, imported, planned, skipped, findings, scanned: 0 });
    }
    // The default vault is simply absent: a friendly no-op with guidance, not a failure.
    return withText({
      command: "import-memory",
      apply,
      dryRun: !apply,
      result: "pass",
      source: sourceRel,
      imported,
      planned,
      skipped,
      findings
    }, REPORT_TITLE, [
      { title: "Summary", body: [`mode: ${apply ? "apply" : "preview"}`, `source: ${sourceRel} (not found)`] },
      { title: "Caveats", body: [
        `No ${DEFAULT_VAULT_DIR} directory was found here. Pass a source explicitly: llm-wiki import-memory <memory-file-or-directory>.`
      ] }
    ]);
  }

  const sourceStats = await stat(sourceAbs);
  const files = sourceStats.isDirectory()
    ? (await listMarkdownFiles(sourceAbs)).map((file) => ({ file, rel: toPosix(path.relative(cwd, file)) })).sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0))
    : [{ file: sourceAbs, rel: sourceRel }];

  const detection = await detectProject(cwd, options.type ?? null, options.profiles ?? []);
  const project = detection.projectName ?? "project";
  const claimedTargets = new Set();

  for (const { file, rel } of files) {
    let raw;
    try {
      raw = await readTextAuto(file);
    } catch {
      findings.push({ severity: "warning", rule: "import.invalid_memory", path: rel, message: "Memory file could not be read." });
      skipped.push(`${rel} skipped (unreadable)`);
      continue;
    }

    const memory = parseEccMemory(raw);
    if (!memory.ok) {
      if (memory.reason === "unsupported_schema") {
        findings.push({
          severity: "warning",
          rule: "import.unsupported_schema",
          path: rel,
          message: `Not an ${ECC_MEMORY_SCHEMA} document (declared schema: ${memory.declaredSchema}).`
        });
        skipped.push(`${rel} skipped (schema is not ${ECC_MEMORY_SCHEMA})`);
      } else {
        // Deliberately generic: parse errors can quote raw lines, and a raw
        // line from a foreign memory must never leak into a report.
        findings.push({
          severity: "warning",
          rule: "import.invalid_memory",
          path: rel,
          message: "Not a parseable ecc.memory.v1 Markdown memory (YAML frontmatter missing or malformed)."
        });
        skipped.push(`${rel} skipped (no parseable YAML frontmatter)`);
      }
      continue;
    }

    // Safety gate: a memory carrying sensitive-looking values is skipped as a
    // whole — imported drafts land in docs/llm-wiki, which must never receive
    // secrets. Counts only; the matched values are never echoed.
    const sensitiveHits = scanSensitiveInfo(raw);
    if (sensitiveHits.length > 0) {
      findings.push({
        severity: "warning",
        rule: "import.sensitive_skipped",
        path: rel,
        message: `Skipped: ${sensitiveHits.length} sensitive-looking value(s) detected (values are never shown). Clean the memory and re-run.`
      });
      skipped.push(`${rel} skipped (${sensitiveHits.length} sensitive-looking value(s); values not shown)`);
      continue;
    }

    // ECC lifecycle: rejected/superseded memories are no longer active
    // knowledge, so they are not promoted into drafts.
    const eccStatus = typeof memory.fields.status === "string" ? memory.fields.status.trim() : "";
    if (eccStatus && eccStatus !== "active") {
      skipped.push(`${rel} skipped (ECC status: ${eccStatus} — only active memories are imported)`);
      continue;
    }

    const name = importedDocName(memory.fields, file);
    const relTarget = `${IMPORTED_DIR_POSIX}/${name}`;
    if (claimedTargets.has(relTarget)) {
      skipped.push(`${rel} skipped (duplicate target ${relTarget} in this batch)`);
      continue;
    }
    claimedTargets.add(relTarget);

    const targetAbs = path.join(cwd, ...IMPORTED_DIR_SEGMENTS, name);
    if (await pathExists(targetAbs)) {
      skipped.push(`${relTarget} already exists — kept (existing files are never overwritten); source: ${rel}`);
      continue;
    }

    const unknownNote = memory.unknownKeys.length > 0 ? ` (unrecognized keys: ${memory.unknownKeys.join(", ")})` : "";
    if (!apply) {
      planned.push(`${relTarget} would be created from ${rel}${unknownNote}`);
      continue;
    }

    const title = importedDocTitle(memory.fields, file);
    const content = renderWikiDocumentTemplate({
      title,
      docType: IMPORTED_DOC_TYPE,
      project,
      body: importedDocBody({ title, relSource: rel, memory }),
      sourceFiles: [],
      evidence: [],
      related: []
    });
    await mkdir(path.dirname(targetAbs), { recursive: true });
    await writeUtf8(targetAbs, content);
    imported.push(`${relTarget} imported from ${rel}${unknownNote}`);
  }

  return report({ apply, result: "pass", sourceRel, imported, planned, skipped, findings, scanned: files.length });
}

function importedDocTitle(fields, sourceFile) {
  const title = typeof fields.title === "string" ? fields.title.replace(/[\r\n]+/g, " ").trim() : "";
  return title || path.basename(sourceFile).replace(/\.md$/i, "");
}

// Draft body: the memory body verbatim, preceded by a provenance section that
// records where the draft came from — including unrecognized/missing ECC keys
// so nothing about the source contract is silently dropped. Grounding
// (source_files/evidence) is intentionally left empty: memory provenance is
// not code evidence; enrichment against real sources happens during review.
function importedDocBody({ title, relSource, memory }) {
  const lines = [
    `# ${title}`,
    "",
    "## Import Provenance",
    "",
    `- imported_from: \`${relSource}\``,
    `- ecc_schema: \`${ECC_MEMORY_SCHEMA}\``
  ];
  const provenanceFields = [
    ["ecc_id", ["id"]],
    ["ecc_kind", ["kind"]],
    ["ecc_scope", ["scope"]],
    ["ecc_trust", ["trust"]],
    ["ecc_status", ["status"]],
    ["ecc_source_harness", ["source_harness", "sourceHarness"]],
    ["ecc_target_harnesses", ["target_harnesses", "targetHarnesses"]],
    ["ecc_tags", ["tags"]],
    ["ecc_links", ["links"]],
    ["ecc_created_at", ["created_at", "createdAt"]],
    ["ecc_updated_at", ["updated_at", "updatedAt"]]
  ];
  for (const [label, aliases] of provenanceFields) {
    const value = displayValue(memory.fields, aliases);
    if (value !== null) lines.push(`- ${label}: \`${value}\``);
  }
  if (memory.unknownKeys.length > 0) lines.push(`- unrecognized_keys: \`${memory.unknownKeys.join(", ")}\``);
  if (memory.missingKeys.length > 0) lines.push(`- missing_required_keys: \`${memory.missingKeys.join(", ")}\``);
  lines.push("", "## Memory Body", "", memory.body.trim(), "");
  return lines.join("\n");
}

function displayValue(fields, aliases) {
  for (const key of aliases) {
    if (!(key in fields)) continue;
    const value = fields[key];
    const text = Array.isArray(value) ? value.join(", ") : String(value);
    // Keep the provenance code span intact regardless of the foreign value.
    const clean = text.replace(/[`\r\n]+/g, " ").trim();
    return clean === "" ? "(empty)" : clean;
  }
  return null;
}

function report({ apply, result, sourceRel, imported, planned, skipped, findings, scanned }) {
  const summary = [
    `mode: ${apply ? "apply" : "preview"}`,
    `source: ${sourceRel}`,
    `memories scanned: ${scanned}`,
    `${apply ? "imported" : "planned"}: ${apply ? imported.length : planned.length}`,
    `skipped: ${skipped.length}`
  ];
  return withText({
    command: "import-memory",
    apply,
    dryRun: !apply,
    result,
    source: sourceRel,
    imported,
    planned,
    skipped,
    findings
  }, REPORT_TITLE, [
    { title: "Summary", body: summary },
    { title: apply ? "Imported Documents" : "Planned Imports", body: apply ? imported : planned },
    { title: "Skipped", body: skipped },
    { title: "Findings", body: findings.map(formatFinding) },
    { title: "Caveats", body: [
      apply
        ? `All imported documents are needs_review drafts (doc_type: ${IMPORTED_DOC_TYPE}) under ${IMPORTED_DIR_POSIX}/. Verify their claims against the code, add real source_files/evidence, then approve with llm-wiki review. log.md was not modified — append it when you integrate the drafts.`
        : "Preview only; no files were written. Run import-memory --apply to write."
    ] }
  ]);
}
