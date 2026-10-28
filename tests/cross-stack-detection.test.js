// Detection fixes found by running the stack walkthroughs (2026-10-28):
//   1. A React + Node npm-workspace repository is detected as `unknown`, because its
//      root manifest names no framework. init now says which --type the member
//      manifests point at; the detected type itself is unchanged, since a repository
//      initialized without a type re-detects on every validate.
//   2. Following that advice made every `validate --strict` fail: an explicit type
//      "differed" from a detected `unknown`. That is no longer a review item; a real
//      disagreement still is.
//   3. A Python or Rust project was named after its directory in generated
//      documents; the name now comes from pyproject.toml / Cargo.toml.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { initCommand, validateCommand } from "../src/commands.js";
import { detectProject, workspaceTypeHint } from "../src/detector.js";
import { normalizeOptions } from "../src/index.js";

async function project(files) {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "llm-wiki-cross-stack-"));
  for (const [rel, text] of Object.entries(files)) {
    const file = path.join(cwd, ...rel.split("/"));
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, typeof text === "string" ? text : `${JSON.stringify(text, null, 2)}\n`, { encoding: "utf8" });
  }
  return cwd;
}

const fullstackWorkspace = () => project({
  "package.json": { name: "shop", private: true, workspaces: ["client", "server"] },
  "client/package.json": { name: "client", dependencies: { react: "^18.3.1" }, devDependencies: { vite: "^5.4.0" } },
  "server/package.json": { name: "server", dependencies: { express: "^4.21.1" } }
});

test("workspaceTypeHint reads member manifests and suggests a type", async () => {
  assert.deepEqual(await workspaceTypeHint(await fullstackWorkspace()), {
    suggestedType: "fullstack",
    members: [
      { path: "client", frontend: ["react", "vite"], backend: [] },
      { path: "server", frontend: [], backend: ["express"] }
    ]
  });
  const frontendOnly = await project({
    "package.json": { name: "ui", workspaces: ["packages/*"] },
    "packages/app/package.json": { name: "app", dependencies: { vue: "^3.5.0" } },
    "packages/utils/package.json": { name: "utils" }
  });
  assert.equal((await workspaceTypeHint(frontendOnly)).suggestedType, "frontend");
  assert.equal(await workspaceTypeHint(await project({ "package.json": { name: "solo" } })), null, "no workspaces, no hint");
  assert.equal(await workspaceTypeHint(await project({
    "package.json": { name: "libs", workspaces: ["a"] },
    "a/package.json": { name: "a" }
  })), null, "members that name no framework give no hint");
});

test("init on a workspace repository: the hint is shown, the detected type is not changed", async () => {
  const cwd = await fullstackWorkspace();
  assert.equal((await detectProject(cwd)).projectType, "unknown", "detection is unchanged on purpose");
  const dryRun = await initCommand(normalizeOptions({ cwd, dryRun: true, agents: [], profiles: [] }));
  assert.equal(dryRun.detection.projectType, "unknown");
  assert.equal(dryRun.typeHint.suggestedType, "fullstack");
  assert.match(dryRun.text, /hint: package\.json declares workspaces whose manifests name client \(react, vite\); server \(express\)\. If this is one fullstack project, run init again with --type fullstack/);

  const explicit = await initCommand(normalizeOptions({ cwd, dryRun: true, type: "fullstack", agents: [], profiles: [] }));
  assert.equal(explicit.typeHint, undefined, "no hint once a type is given");
  assert.doesNotMatch(explicit.text, /hint:/);

  const solo = await initCommand(normalizeOptions({ cwd: await project({ "package.json": { name: "solo" } }), dryRun: true, agents: [], profiles: [] }));
  assert.equal(solo.typeHint, undefined, "the key is absent when there is nothing to suggest");
});

test("an explicit type is not a review item when detection found nothing, and still is on a real disagreement", async () => {
  const cwd = await fullstackWorkspace();
  const filled = await validateCommand(normalizeOptions({ cwd, type: "fullstack", strict: true }));
  assert.ok(!filled.findings.some((finding) => finding.rule === "project.review_item"), "type: fullstack over detected unknown");

  const react = await project({ "package.json": { name: "app", dependencies: { react: "^18.3.1" } } });
  assert.equal((await detectProject(react)).projectType, "frontend", "guard: this one is detected");
  const conflict = await validateCommand(normalizeOptions({ cwd: react, type: "library" }));
  assert.ok(conflict.findings.some((finding) => finding.rule === "project.review_item" && /differs from detected 'frontend'/.test(finding.message)));
});

test("the project name comes from pyproject.toml or Cargo.toml when there is no package.json", async () => {
  const pep621 = await project({ "pyproject.toml": '[build-system]\nrequires = ["setuptools"]\n\n[project]\nname = "order-service"\nversion = "0.4.0"\n' });
  assert.equal((await detectProject(pep621)).projectName, "order-service");

  const poetry = await project({ "pyproject.toml": "[tool.poetry]\nname = 'billing-api'  # comment\n" });
  assert.equal((await detectProject(poetry)).projectName, "billing-api");

  const cargo = await project({ "Cargo.toml": '[package]\nname = "ledger"\nversion = "0.1.0"\n\n[dependencies]\naxum = "0.7"\n' });
  assert.equal((await detectProject(cargo)).projectName, "ledger");

  const both = await project({ "package.json": { name: "web-shell" }, "pyproject.toml": '[project]\nname = "api"\n' });
  assert.equal((await detectProject(both)).projectName, "web-shell", "package.json keeps precedence");

  const unnamed = await project({ "pyproject.toml": "[tool.ruff]\nline-length = 100\n" });
  assert.equal((await detectProject(unnamed)).projectName, path.basename(unnamed), "no name: the directory, as before");
});
