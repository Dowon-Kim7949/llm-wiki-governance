// Public programmatic API for @dowonk-7949/llm-wiki-standard.
//
// This module is the package's importable entry point (package.json "exports").
// It lets CI wrappers, editors, and tests run LLM-WIKI in-process instead of
// spawning the `llm-wiki` binary. The command surface here mirrors the CLI
// (src/cli.js COMMANDS) one-to-one; each command is an async function that takes
// a normalized options object and resolves to a plain result object.
//
// Stability (see docs/llm-wiki/PUBLIC_API.md, "Programmatic API"):
//   - `commands` keys, the individual function exports, `SCHEMA_VERSION`, and the
//     shared result fields (`command`, `result`, `findings`, `text`) are the
//     stable contract. Per-command payload fields follow the same additive
//     SemVer policy as the CLI `--format json` output.
//   - `SCHEMA_VERSION` matches the `schemaVersion` field stamped into every
//     `--format json` report, so a wrapper can pin the same contract whether it
//     shells out or imports.

import path from "node:path";
import {
  audit,
  doctor,
  driftCommand,
  explainCommand,
  fixCommand,
  graphCommand,
  handoffCommand,
  initCommand,
  migrateCommand,
  nextCommand,
  promptCommand,
  quickstartCommand,
  releaseNotesCommand,
  statsCommand,
  statusCommand,
  validateCommand,
  validateFrontmatterCommand
} from "./commands.js";
import { defaultOptions, main, parseArgs } from "./cli.js";
import { JSON_SCHEMA_VERSION } from "./config.js";

/**
 * A single finding produced by a scan/validation.
 * @typedef {Object} Finding
 * @property {"blocked"|"error"|"warning"|"info"} severity
 * @property {string} rule    Dotted rule id, e.g. "related.missing".
 * @property {string} path    Repo-relative path the finding is anchored to (or ".").
 * @property {string} message Human-readable explanation.
 */

/**
 * The options object every command handler reads. Produce one with
 * {@link normalizeOptions} (or {@link parseArgs}); all fields are always present.
 * @typedef {Object} Options
 * @property {string} cwd            Project root (absolute).
 * @property {string} format         "text"|"json"|"markdown"|"html" ("text"|"json"|"mermaid"|"dot" for graph).
 * @property {string|null} type      Forced project type, or null to auto-detect.
 * @property {string[]} profiles     Extra profiles to activate.
 * @property {string[]} agents       Selected adapter agents.
 * @property {boolean} strict        Treat warnings as failures.
 * @property {boolean} write         init/quickstart/fix write toggle.
 * @property {boolean} apply         migrate apply toggle.
 * @property {boolean} downgrade     drift downgrade toggle.
 * @property {boolean} dryRun        Explicit preview toggle.
 * @property {boolean} minimal       Minimal doc set for init/quickstart.
 * @property {boolean} changed       validate --changed scope.
 * @property {string|null} since     Git ref baseline (validate/release-notes).
 * @property {string|null} version   release-notes version override.
 * @property {string|null} task      prompt task name.
 * @property {string|null} findingRule explain target rule.
 * @property {string} existing       "skip"|"overwrite".
 * @property {string|null} out       Report output path, or null.
 */

/**
 * A command result. Every command returns at least these fields; individual
 * commands add their own payload (e.g. `detection`, `wikiGraph`, `stats`,
 * `upgradeReport`, `applied`/`planned`/`skipped`). `text` is the rendered
 * text report and is omitted from JSON files written with `--out`.
 * @typedef {Object} CommandResult
 * @property {string} command                 The command name (discriminator).
 * @property {string} [result]                Overall grade, e.g. "pass"|"warning"|"fail"|"blocked".
 * @property {Finding[]} findings             Findings (may be empty).
 * @property {string} [text]                  Rendered text report.
 * @property {number} [schemaVersion]         Present only on `--format json` output; equals {@link SCHEMA_VERSION}.
 */

/**
 * The `--format json` output contract version. Equal to the `schemaVersion`
 * field stamped into JSON reports. Additive changes keep this number; a breaking
 * shape change bumps it.
 * @type {number}
 */
export const SCHEMA_VERSION = JSON_SCHEMA_VERSION;

/**
 * Command handlers keyed by their CLI command name. Frozen: the key set is part
 * of the stable contract.
 * @type {Readonly<Record<string, (options: Options) => Promise<CommandResult>>>}
 */
export const commands = Object.freeze({
  doctor,
  validate: validateCommand,
  "validate-frontmatter": validateFrontmatterCommand,
  status: statusCommand,
  next: nextCommand,
  explain: explainCommand,
  audit,
  quickstart: quickstartCommand,
  handoff: handoffCommand,
  prompt: promptCommand,
  init: initCommand,
  migrate: migrateCommand,
  fix: fixCommand,
  drift: driftCommand,
  graph: graphCommand,
  stats: statsCommand,
  "release-notes": releaseNotesCommand
});

/**
 * Build a complete {@link Options} object from a partial override. Fills every
 * default so a command can be called directly, and resolves `cwd` to an absolute
 * path. Does not parse CLI flags — use {@link parseArgs} for argv.
 * @param {Partial<Options>} [overrides]
 * @returns {Options}
 */
export function normalizeOptions(overrides = {}) {
  const options = { ...defaultOptions(), ...overrides };
  if (typeof options.cwd === "string") options.cwd = path.resolve(options.cwd);
  return options;
}

// Individual command functions, exported under their source names for direct
// import (e.g. `import { audit } from "@dowonk-7949/llm-wiki-standard"`).
export {
  audit,
  doctor,
  driftCommand,
  explainCommand,
  fixCommand,
  graphCommand,
  handoffCommand,
  initCommand,
  migrateCommand,
  nextCommand,
  promptCommand,
  quickstartCommand,
  releaseNotesCommand,
  statsCommand,
  statusCommand,
  validateCommand,
  validateFrontmatterCommand
};

// CLI helpers: `parseArgs` for argv, `run` as the full CLI entry (argv -> print
// -> exit code), matching bin/llm-wiki.js.
export { parseArgs };
export { main as run };
