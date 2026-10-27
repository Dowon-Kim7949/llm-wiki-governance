// The release workflow authenticates to npm with Trusted Publishing (OIDC) only.
// A stored token wired back in would turn a broken Trusted Publisher registration
// into a silent fallback instead of a failed release, so this pins the shape.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workflow = await readFile(path.join(root, ".github", "workflows", "publish.yml"), "utf8");

// The text of one top-level job, from its key to the next job key or the end.
function jobBlock(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notEqual(start, -1, `job ${name} not found`);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

test("publish workflow: npm authentication comes from OIDC, not a stored secret", () => {
  assert.doesNotMatch(workflow, /secrets\./, "publish.yml must not read repository or environment secrets");
  assert.doesNotMatch(workflow, /^\s*NODE_AUTH_TOKEN\s*:/m, "no step may set the npm auth token");
  assert.match(workflow, /^permissions:\n {2}contents: read\n {2}id-token: write\n/m);
  const publish = jobBlock("publish");
  assert.match(publish, /environment: npm-release/);
  assert.match(publish, /name: Verify Trusted Publishing prerequisites/);
  assert.match(publish, /run: npm publish --access public --provenance\n/);
  assert.doesNotMatch(publish, /\n {4}permissions:/, "the publish job inherits contents:read + id-token:write");
});

test("publish workflow: the release job cannot mint an OIDC token and keeps no git credential", () => {
  const release = jobBlock("release");
  assert.match(release, /\n {4}permissions:\n {6}contents: write\n/);
  assert.doesNotMatch(release, /id-token/);
  for (const job of [jobBlock("publish"), release]) {
    assert.match(job, /persist-credentials: false/);
  }
});
