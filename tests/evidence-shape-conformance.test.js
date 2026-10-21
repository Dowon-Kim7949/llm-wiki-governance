import test from "node:test";
import assert from "node:assert/strict";
import { EVIDENCE_REFERENCE_PATTERN, FRONTMATTER_SCHEMA } from "../src/frontmatter-schema.js";
import { parseEvidenceReference } from "../src/commands/references.js";

// The published schema pattern is the one definition of evidence shape; the
// runtime parser must agree with it on every reference, except where it checks
// something a pattern cannot express. Before 1.33 the two were hand-written
// separately and disagreed in both directions.
const schemaAccepts = (reference) => new RegExp(EVIDENCE_REFERENCE_PATTERN).test(reference);
const runtimeAccepts = (reference) => parseEvidenceReference(reference) !== null;

const AGREED = [
  ["src/app.py", true],
  ["src/app.py#L10", true],
  ["src/app.py#L10-L20", true],
  ["src/app.py#L10-20", true],
  ["src/app.py#l10", true], // lowercase was runtime-only before 1.33
  ["src/app.py:10", true],
  ["src/app.py:10-20", true],
  ["src/app.py#symbol:main", true],
  ["docs/a.md#section:Overview", true],
  ["src/app/router.tsx#route:/", true], // an adopter's real root route; schema-rejected before 1.33
  ["src/app/router.tsx#route:/sales/input", true],
  ["https://github.com/o/r/pull/12", true],
  ["repo:other-service/src/api.ts", true],
  ["repo:other-service/src/api.ts#symbol:handler", true],
  ["#overview", false], // bare in-page anchor grounded nothing; runtime-accepted before 1.33
  ["src/app.py#", false],
  ["src/app.py#L0", false],
  ["src/app.py#L10-L", false],
  ["src/app.py#symbol:", false],
  ["src/app.py#route:sales", false],
  ["src/app.py#unknown:x", false]
];

for (const [reference, expected] of AGREED) {
  test(`evidence shape: schema and runtime agree on ${JSON.stringify(reference)} (${expected ? "valid" : "invalid"})`, () => {
    assert.equal(schemaAccepts(reference), expected, "schema pattern");
    assert.equal(runtimeAccepts(reference), expected, "runtime parser");
  });
}

test("evidence shape: the only schema/runtime disagreement is a backwards line range", () => {
  // A pattern cannot compare two numbers, so the schema accepts this and the
  // runtime rejects it. Any other entry here means the definitions drifted again.
  for (const reference of ["src/app.py#L20-L10", "src/app.py#L20-10"]) {
    assert.equal(schemaAccepts(reference), true);
    assert.equal(runtimeAccepts(reference), false);
  }
});

test("evidence shape: the published schema carries the shared pattern, not a copy", () => {
  assert.equal(FRONTMATTER_SCHEMA.properties.evidence.items.pattern, EVIDENCE_REFERENCE_PATTERN);
});
