import test from "node:test";
import assert from "node:assert/strict";
import { scanSensitiveInfo } from "../src/sensitive-info.js";
import { parseFrontmatter, validateFrontmatter } from "../src/frontmatter.js";
import { renderWikiDocumentTemplate } from "../src/template-renderer.js";

test("validates standard frontmatter subset", () => {
  const markdown = `---
title: Sample
tags:
  - llm-wiki
status: needs_review
doc_type: test
project: sample
last_updated: 2026-07-02
author: ai-generated
last_edited_by: Codex
wiki_block_version: v1
source_files:
  - package.json
related:
  - docs/llm-wiki/log.md
visibility: internal
contains_sensitive_info: false
---

# Sample
`;

  const parsed = parseFrontmatter(markdown);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.frontmatter.status, "needs_review");
  assert.deepEqual(validateFrontmatter(parsed.frontmatter), []);
});

test("does not expose raw sensitive values", () => {
  const findings = scanSensitiveInfo("API_TOKEN=super-secret-token-value");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].type, "env_value");
  assert.equal(findings[0].message, "Sensitive-looking value omitted.");
  assert.equal(JSON.stringify(findings).includes("super-secret-token-value"), false);
});

test("renders needs_review wiki document templates", () => {
  const rendered = renderWikiDocumentTemplate({
    title: "Rendered Doc",
    docType: "test_doc",
    project: "fixture",
    sourceFiles: ["package.json"],
    related: ["docs/llm-wiki/log.md"],
    body: "# Rendered Doc\n"
  });
  const parsed = parseFrontmatter(rendered);

  assert.equal(parsed.frontmatter.status, "needs_review");
  assert.equal(parsed.frontmatter.doc_type, "test_doc");
  assert.deepEqual(validateFrontmatter(parsed.frontmatter), []);
});
