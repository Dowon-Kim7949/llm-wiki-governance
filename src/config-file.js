import path from "node:path";
import { pathExists } from "./files.js";
import { readUtf8 } from "./encoding.js";

export const CONFIG_FILENAME = "llm-wiki.config.json";

// Conservative v1 schema: persistent defaults that mirror existing CLI options.
// Unknown keys are ignored so the contract can grow without breaking old files.
export async function loadProjectConfig(cwd) {
  const file = path.join(cwd, CONFIG_FILENAME);
  if (!(await pathExists(file))) {
    return { found: false, config: null, errors: [] };
  }

  let parsed;
  try {
    parsed = JSON.parse(await readUtf8(file));
  } catch {
    return { found: true, config: null, errors: [`${CONFIG_FILENAME} is not valid JSON.`] };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { found: true, config: null, errors: [`${CONFIG_FILENAME} must be a JSON object.`] };
  }

  const errors = [];
  const config = {};

  if ("type" in parsed) {
    if (typeof parsed.type !== "string") errors.push(`${CONFIG_FILENAME}: "type" must be a string.`);
    else config.type = parsed.type;
  }

  for (const field of ["profiles", "agents"]) {
    if (field in parsed) {
      if (!Array.isArray(parsed[field]) || parsed[field].some((value) => typeof value !== "string")) {
        errors.push(`${CONFIG_FILENAME}: "${field}" must be an array of strings.`);
      } else {
        config[field] = parsed[field];
      }
    }
  }

  if ("strict" in parsed) {
    if (typeof parsed.strict !== "boolean") errors.push(`${CONFIG_FILENAME}: "strict" must be a boolean.`);
    else config.strict = parsed.strict;
  }

  return { found: true, config, errors };
}

// Explicit CLI flags win; config fills only what the CLI left unset.
// strict is additive (config can turn it on; the CLI has no way to turn it off).
export function mergeConfigIntoOptions(options, config) {
  if (!config) return options;

  if (options.type == null && config.type != null) {
    options.type = config.type;
  }
  if ((!options.profiles || options.profiles.length === 0) && Array.isArray(config.profiles)) {
    options.profiles = [...config.profiles];
  }
  if ((!options.agents || options.agents.length === 0) && Array.isArray(config.agents)) {
    options.agents = [...config.agents];
  }
  if (config.strict) {
    options.strict = true;
  }

  return options;
}
