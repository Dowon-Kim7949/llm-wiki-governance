import path from "node:path";
import { mkdir } from "node:fs/promises";
import { writeUtf8 } from "./encoding.js";
import { scanSensitiveInfo } from "./sensitive-info.js";

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
    console.log(JSON.stringify(result, null, 2));
  } else if (options.format === "markdown") {
    console.log(renderOutputFile(result, options).trimEnd());
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
    return `${JSON.stringify(redactRuntimeText(result), null, 2)}\n`;
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
