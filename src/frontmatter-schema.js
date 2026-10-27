// The ONE definition of a well-formed `evidence` reference. The published schema
// below carries it, and parseEvidenceReference (commands/references.js) refuses
// anything it does not match before extracting a locator, so the schema an
// editor validates against and the runtime cannot disagree about shape. The
// runtime only adds what a pattern cannot say (a line range must not run
// backwards). Before 1.33 the two were written separately and had drifted: the
// schema rejected `#l10` and `#route:/` (an adopter's real root-route anchor)
// that the runtime accepted, and the runtime accepted a bare `#anchor` — which
// grounded a verified document while pointing at no source — that the schema
// rejected.
export const EVIDENCE_REFERENCE_PATTERN =
  "^(https?:\\/\\/[^\\s]+|[^#\\s][^#]*(#([Ll][1-9][0-9]*(-[Ll]?[1-9][0-9]*)?|(symbol|section):\\s*\\S.*|route:\\s*\\/.*))?)$";

export const FRONTMATTER_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://llm-wiki-governance.local/schemas/frontmatter.schema.json",
  title: "LLM-WIKI Frontmatter",
  type: "object",
  additionalProperties: true,
  required: [
    "title",
    "tags",
    "status",
    "doc_type",
    "project",
    "last_updated",
    "author",
    "last_edited_by",
    "wiki_block_version",
    "source_files",
    "related",
    "visibility",
    "contains_sensitive_info"
  ],
  properties: {
    title: { type: "string", minLength: 1 },
    tags: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["draft", "needs_review", "verified", "deprecated"] },
    doc_type: { type: "string", minLength: 1 },
    project: { type: "string", minLength: 1 },
    last_updated: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    author: { type: "string", minLength: 1 },
    last_edited_by: { type: "string", minLength: 1 },
    wiki_block_version: { type: "string", minLength: 1 },
    source_files: { type: "array", items: { type: "string" } },
    related: { type: "array", items: { type: "string" } },
    visibility: { type: "string", enum: ["internal", "public", "restricted"] },
    contains_sensitive_info: { type: "boolean" },
    reviewed_by: { type: "string", minLength: 1 },
    reviewed_at: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    source_digests: { type: "array", items: { type: "string", pattern: " sha256:[0-9a-f]{16}$" } },
    aliases: { type: "array", items: { type: "string" } },
    evidence: {
      type: "array",
      items: {
        type: "string",
        pattern: EVIDENCE_REFERENCE_PATTERN
      }
    }
  },
  allOf: [
    {
      if: {
        properties: { status: { const: "verified" } },
        required: ["status"]
      },
      then: {
        required: ["reviewed_by", "reviewed_at"]
      }
    }
  ]
};

export function schemaEnumValues(fieldName) {
  return FRONTMATTER_SCHEMA.properties[fieldName]?.enum ?? [];
}

export function schemaRequiredFields() {
  return FRONTMATTER_SCHEMA.required;
}
