// MCP tool-argument validation (2026-07-27 audit).
//
// Every tool in TOOL_DEFS publishes a JSON-Schema `inputSchema` (with
// `additionalProperties: false`), but until now nothing enforced it: a violating
// call was silently coerced or field-filtered by buildToolOptions and ran anyway.
// Reproduced examples: `validate {strict:"true"}` ran WITHOUT strict, `get_doc {}`
// ran despite the schema requiring `path`, `status {type:"banana"}` produced
// `active_profiles: core, banana`, and `maxChars:-5` ignored `minimum: 1`.
//
// This module is a pure, zero-dependency validator over EXACTLY the JSON-Schema
// subset TOOL_DEFS uses — deliberately NOT a general-purpose JSON-Schema engine,
// which would invite a dependency (zero-runtime-dependency invariant):
//   - type: object | string | boolean | integer | array
//   - enum (scalar values)
//   - items (type + enum, one level)
//   - minimum (numbers)
//   - required
//   - additionalProperties: false (unknown arguments are rejected)
//
// The dispatcher calls validateToolArguments() before buildToolOptions() and maps
// a non-empty result to a JSON-RPC -32602 "Invalid params" protocol error. That is
// deliberately distinct from the isError:true result path, which stays reserved
// for execution-level failures (malformed project config, thrown commands).

// Returns a list of human-readable violation strings; empty means valid.
export function validateToolArguments(schema, args) {
  if (!schema || schema.type !== "object") return [];
  if (args === null || typeof args !== "object" || Array.isArray(args)) {
    return ["arguments must be an object."];
  }

  const errors = [];
  const properties = schema.properties ?? {};

  for (const field of schema.required ?? []) {
    if (!(field in args)) errors.push(`missing required argument: ${field}.`);
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(args)) {
      if (!Object.prototype.hasOwnProperty.call(properties, key)) {
        errors.push(`unknown argument: ${key}.`);
      }
    }
  }

  for (const [key, value] of Object.entries(args)) {
    const propSchema = properties[key];
    if (!propSchema) continue; // unknown keys are handled above
    errors.push(...validateValue(key, value, propSchema));
  }

  return errors;
}

function validateValue(name, value, propSchema) {
  if (!matchesType(value, propSchema.type)) {
    // Do not cascade enum/minimum checks onto a wrong-typed value.
    return [`argument "${name}" must be of type ${propSchema.type}, got ${typeName(value)}.`];
  }

  const errors = [];
  if (Array.isArray(propSchema.enum) && !propSchema.enum.includes(value)) {
    errors.push(`argument "${name}" must be one of: ${propSchema.enum.join(", ")}.`);
  }
  if (typeof propSchema.minimum === "number" && typeof value === "number" && value < propSchema.minimum) {
    errors.push(`argument "${name}" must be >= ${propSchema.minimum}.`);
  }
  if (propSchema.type === "array" && propSchema.items) {
    for (const item of value) {
      if (!matchesType(item, propSchema.items.type)) {
        errors.push(`argument "${name}" items must be of type ${propSchema.items.type}, got ${typeName(item)}.`);
      } else if (Array.isArray(propSchema.items.enum) && !propSchema.items.enum.includes(item)) {
        errors.push(`argument "${name}" items must be one of: ${propSchema.items.enum.join(", ")}.`);
      }
    }
  }
  return errors;
}

function matchesType(value, type) {
  switch (type) {
    case "string":
      return typeof value === "string";
    case "boolean":
      return typeof value === "boolean";
    case "integer":
      return Number.isInteger(value);
    case "array":
      return Array.isArray(value);
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    default:
      // No/unknown type constraint: accept. TOOL_DEFS only uses the types above;
      // this keeps a future schema-authoring slip from rejecting valid calls.
      return true;
  }
}

function typeName(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}
