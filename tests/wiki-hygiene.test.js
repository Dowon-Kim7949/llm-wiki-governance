// Wiki hygiene rules (1.33.0). All four are opt-in, so the first assertion for
// each is that a project that has not asked for it sees nothing new.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { validateCommand } from "../src/commands.js";
import { RULE_PRESETS } from "../src/commands/findings.js";
import { documentAnchors, headingSlug } from "../src/commands/wiki-hygiene.js";
import * as api from "../src/index.js";

for (const [name, value] of [
  ["validateCommand", validateCommand],
  ["documentAnchors", documentAnchors],
  ["headingSlug", headingSlug]
]) {
  if (typeof value !== "function") throw new Error(`${name} is not imported; this file would have silently skipped`);
}

const NEW_RULES = ["markdown_link.anchor_missing", "content.dated_heading", "budget.log_over", "budget.doc_over"];

function doc(title, body, docType = "reference") {
  return `---\ntitle: ${title}\nstatus: needs_review\ndoc_type: ${docType}\n---\n\n${body}`;
}

async function makeWiki(files, config) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-hygiene-"));
  await mkdir(path.join(cwd, "docs", "llm-wiki"), { recursive: true });
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ name: "demo" }), "utf8");
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(cwd, "docs", "llm-wiki", ...rel.split("/"));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content, "utf8");
  }
  if (config) await writeFile(path.join(cwd, "llm-wiki.config.json"), JSON.stringify(config), "utf8");
  return cwd;
}

async function validate(cwd) {
  const { options, errors } = await api.resolveOptions({ cwd });
  assert.deepEqual(errors, []);
  return validateCommand(options);
}

const ruleFindings = (result, rule) => result.findings.filter((f) => f.rule === rule);

test("headingSlug / documentAnchors follow GitHub's slugs, including Hangul and duplicates", () => {
  assert.equal(headingSlug("Quasar·라이브러리 함정"), "quasar라이브러리-함정");
  assert.equal(headingSlug("`/customers`는 세션당 한 번 받습니다"), "customers는-세션당-한-번-받습니다");
  assert.equal(headingSlug("CSP는 `unsafe-inline` 대신 **sha256 해시**로"), "csp는-unsafe-inline-대신-sha256-해시로");
  assert.equal(headingSlug("[Link text](./x.md) and more ##"), "link-text-and-more");
  const anchors = documentAnchors("# Title\n\n## Notes\n\n## Notes\n\n```\n## Not a heading\n```\n\n<a id=\"Custom-Id\"></a>\n");
  assert.ok(anchors.has("title") && anchors.has("notes") && anchors.has("notes-1"));
  assert.ok(!anchors.has("not-a-heading"), "headings inside code fences do not create anchors");
  assert.ok(anchors.has("custom-id"), "explicit id attributes count");
});

const ANCHOR_FILES = {
  "index.md": doc("Index", [
    "# Index",
    "",
    "- [ok](./guide.md#세션-경계)",
    "- [ok dup](./guide.md#notes-1)",
    "- [ok self](#index)",
    "- [ok explicit](./guide.md#pinned)",
    "- [broken](./guide.md#renamed-heading)",
    "- [missing file is not this rule](./gone.md#x)",
    "- [source line anchors are ignored](../../src/a.js#L10)",
    "",
    "```md",
    "[inside a fence](./guide.md#nope)",
    "```",
    ""
  ].join("\n")),
  "guide.md": doc("Guide", "# Guide\n\n## 세션 경계\n\n## Notes\n\n## Notes\n\n<a id=\"pinned\"></a>\n"),
  "log.md": doc("Log", "# Log\n\n## 2026-10-01 - old link\n\n- [historic](./guide.md#long-gone)\n", "change_log")
};

test("markdown_link.anchor_missing is silent unless enabled", async () => {
  const cwd = await makeWiki(ANCHOR_FILES);
  const result = await validate(cwd);
  for (const rule of NEW_RULES) assert.deepEqual(ruleFindings(result, rule), [], `${rule} silent by default`);
});

test("markdown_link.anchor_missing flags only the broken anchor when enabled", async () => {
  const cwd = await makeWiki(ANCHOR_FILES, { rules: { "markdown_link.anchor_missing": "warning" } });
  const findings = ruleFindings(await validate(cwd), "markdown_link.anchor_missing");
  assert.deepEqual(findings.map((f) => [f.path, f.params.link]), [["docs/llm-wiki/index.md", "./guide.md#renamed-heading"]]);
});

test("content.dated_heading flags knowledge documents only, and only when enabled", async () => {
  const files = {
    "index.md": doc("Index", "# Index\n\n## Session reset (2026-09-30)\n\n## Current rules\n"),
    "log.md": doc("Log", "# Log\n\n## 2026-10-01 - entry\n", "change_log"),
    "log-2026-08.md": doc("Log 2026-08", "# Log\n\n## 2026-08-01 - entry\n", "change_log"),
    "history.md": doc("History", "# History\n\n## 2026-01-01 release\n", "change_log")
  };
  const off = await makeWiki(files);
  assert.deepEqual(ruleFindings(await validate(off), "content.dated_heading"), []);

  const on = await makeWiki(files, { rules: { "content.dated_heading": "warning" } });
  const findings = ruleFindings(await validate(on), "content.dated_heading");
  assert.deepEqual(findings.map((f) => [f.path, f.params.line]), [["docs/llm-wiki/index.md", 9]]);
});

test("budget.log_over / budget.doc_over fire only when wikiBudget sets a number", async () => {
  const files = {
    "index.md": doc("Index", `# Index\n\n${"word ".repeat(400)}\n`),
    "small.md": doc("Small", "# Small\n\nshort\n"),
    "log.md": doc("Log", `# Log\n\n## 2026-10-01 - entry\n\n${"entry ".repeat(400)}\n`, "change_log")
  };
  const off = await makeWiki(files);
  const quiet = await validate(off);
  assert.deepEqual([...ruleFindings(quiet, "budget.log_over"), ...ruleFindings(quiet, "budget.doc_over")], []);

  const on = await makeWiki(files, { wikiBudget: { logTokens: 100, docTokens: 100 } });
  const result = await validate(on);
  assert.deepEqual(ruleFindings(result, "budget.log_over").map((f) => f.path), ["docs/llm-wiki/log.md"]);
  assert.deepEqual(ruleFindings(result, "budget.doc_over").map((f) => f.path), ["docs/llm-wiki/index.md"], "log.md is measured by its own rule, small docs pass");
});

test("wikiBudget fields must be positive integers", async () => {
  const cwd = await makeWiki({ "index.md": doc("Index", "# Index\n") }, { wikiBudget: { logTokens: 0, docTokens: "x" } });
  const { errors } = await api.resolveOptions({ cwd });
  assert.ok(errors.some((e) => e.includes("wikiBudget.logTokens")));
  assert.ok(errors.some((e) => e.includes("wikiBudget.docTokens")));
});

// ---------------------------------------------------------------------------
// Pre-release review fixes (1.33.0). Each test below failed against the first
// implementation.

test("documentAnchors: GitHub duplicate suffixes skip a number another heading already took (x, x-1, x -> x-2)", () => {
  assert.deepEqual([...documentAnchors("# T\n\n## x\n\n## x-1\n\n## x\n")].sort(), ["t", "x", "x-1", "x-2"]);
  assert.deepEqual([...documentAnchors("## a\n\n## a\n\n## a-1\n")].sort(), ["a", "a-1", "a-1-1"]);
});

test("documentAnchors: setext headings are headings; a list item or a blank line before the underline is not", () => {
  const anchors = documentAnchors("Title Here\n==========\n\nSub\n---\n\n- item\n---\n\nPara\n\n---\n");
  assert.ok(anchors.has("title-here"), "=== underline");
  assert.ok(anchors.has("sub"), "--- underline");
  assert.ok(!anchors.has("item"), "--- after a list item is a thematic break");
  assert.ok(!anchors.has("para"), "--- after a blank line is a thematic break");
});

test("documentAnchors: a backtick info string is not a fence, so the heading after it counts", () => {
  assert.ok(documentAnchors("```js`x\n## Real heading\n").has("real-heading"));
  assert.ok(!documentAnchors("```js\n## Fenced\n```\n").has("fenced"));
});

test("headingSlug: emphasis delimiters are dropped, underscores inside a word and inside code stay", () => {
  assert.equal(headingSlug("Hello _world_"), "hello-world");
  assert.equal(headingSlug("__init__.py layout"), "initpy-layout");
  assert.equal(headingSlug("snake_case_name rules"), "snake_case_name-rules");
  assert.equal(headingSlug("_private"), "_private");
  assert.equal(headingSlug("*bold* and **strong**"), "bold-and-strong");
  assert.equal(headingSlug("`__init__` is literal"), "__init__-is-literal");
});

test("markdown_link.anchor_missing: inline code is not checked or registered, #user-content- resolves, setext/emphasis/duplicate slugs match GitHub", async () => {
  const files = {
    "index.md": doc("Index", [
      "# Index",
      "",
      "Inline code: `[b](./guide.md#nope-inline)`",
      "- [user-content](./guide.md#user-content-notes)",
      "- [dup](./guide.md#x-2)",
      "- [setext](./guide.md#setext-title)",
      "- [emph](./guide.md#hello-world)",
      "- [code attribute is not an anchor](./guide.md#email)",
      ""
    ].join("\n")),
    "guide.md": doc("Guide", "# Guide\n\n## Notes\n\n## x\n\n## x-1\n\n## x\n\nSetext Title\n------------\n\n## Hello _world_\n\nUse `<input name=\"email\">` in the form.\n")
  };
  const cwd = await makeWiki(files, { rules: { "markdown_link.anchor_missing": "warning" } });
  const findings = ruleFindings(await validate(cwd), "markdown_link.anchor_missing");
  assert.deepEqual(findings.map((f) => f.params.link), ["./guide.md#email"]);
});

test("content.dated_heading: release notes and decision records are exempt, and an identifier like OPS-2026-10-01 is not a date", async () => {
  const files = {
    "index.md": doc("Index", "# Index\n\n## Release 1.29.2 (2026-08-19)\n\n## Ticket OPS-2026-10-01 runbook\n\n## Build v2026-10-01\n"),
    "notes.md": doc("Notes", "# Notes\n\n## 1.2.0 — 2026-09-14\n", "release_notes"),
    "decisions.md": doc("Decisions", "# Decisions\n\n## 2026-09-01 Use X\n", "decision_log"),
    "decision.md": doc("Decision", "# Decision\n\n## 2026-09-02 Use Y\n", "decision"),
    "adr-0001.md": doc("ADR", "# ADR\n\n## 2026-09-03 Use Z\n", "adr")
  };
  const cwd = await makeWiki(files, { rules: { "content.dated_heading": "warning" } });
  const findings = ruleFindings(await validate(cwd), "content.dated_heading");
  assert.deepEqual(findings.map((f) => [f.path, f.params.heading]), [["docs/llm-wiki/index.md", "Release 1.29.2 (2026-08-19)"]]);
});

test("wikiBudget: an empty object or an unknown key is a config error, not a silent no-op", async () => {
  for (const budget of [{}, { logToken: 100 }, { logTokens: 100, docToken: 50 }]) {
    const cwd = await makeWiki({ "index.md": doc("Index", "# Index\n") }, { wikiBudget: budget });
    const { errors } = await api.resolveOptions({ cwd });
    assert.ok(errors.some((e) => e.includes("wikiBudget")), JSON.stringify(budget));
  }
});

test("the 1.33 hygiene rules are individual opt-ins: neither rulesPreset strict nor governance strict switches them on", async () => {
  for (const rule of NEW_RULES) assert.ok(!(rule in RULE_PRESETS.strict), `${rule} is not in the strict preset`);
  const files = { "index.md": doc("Index", "# Index\n\n## Fix 2026-09-30\n\n[a](#nope)\n") };
  for (const config of [{ rulesPreset: "strict" }, { governance: { mode: "strict" } }]) {
    const result = await validate(await makeWiki(files, config));
    for (const rule of NEW_RULES) assert.deepEqual(ruleFindings(result, rule), [], `${JSON.stringify(config)} ${rule}`);
  }
});
