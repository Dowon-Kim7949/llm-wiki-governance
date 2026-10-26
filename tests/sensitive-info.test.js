import test from "node:test";
import assert from "node:assert/strict";
import { scanSensitiveInfo } from "../src/sensitive-info.js";

// Every value below is fake. Vendor-shaped strings are assembled at runtime so that
// secret scanners (GitHub push protection and the like) do not flag this file itself.
const SHAPED = "q8Zr4LmN2vX7pT1kQ9w3";
const types = (line) => scanSensitiveInfo(line).map((finding) => finding.type);

test("sensitive-info: credential keys whose last segment names the secret are caught", () => {
  for (const line of [
    `api_token: ${SHAPED}`,
    `access_token: "${SHAPED}"`,
    `client_secret: ${SHAPED}`,
    `db_password: ${SHAPED}`,
    `aws.secret_key = ${SHAPED}`,
    `accessToken: "${SHAPED}",`,
    `  clientSecret = '${SHAPED}'`
  ]) {
    assert.ok(types(line).includes("token_assignment"), `should be caught: ${line.split(/[:=]/)[0].trim()}`);
  }
});

test("sensitive-info: code, references, and placeholders after a credential key stay quiet", () => {
  for (const line of [
    "const accessToken = response.data.token;",
    "client_secret: ${CLIENT_SECRET}",
    "api_token: <your-api-token-here>",
    "db_password: process.env.DB_PASSWORD",
    "refresh_token: xxxxxxxxxxxxxxxx",
    "accessToken: getAccessToken(),",
    "nextPageToken: response.nextPageToken",
    "max_tokens: 4096",
    "mfa_challenge_token: payload.challenge"
  ]) {
    assert.deepEqual(types(line), [], `should stay quiet: ${line}`);
  }
});

test("sensitive-info: vendor-prefixed credentials are caught without a key name", () => {
  const github = ["gh", "p_", "q8Zr4LmN2vX7pT1kQ9w3q8Zr4LmN2vX7pT1k"].join("");
  const aws = ["AK", "IA", "Q8ZR4LMN2VX7PT1K"].join("");
  const slack = ["xo", "xb-", "1234567890-q8Zr4LmN2vX7"].join("");
  for (const line of [`see ${github} in the log`, `key id ${aws}`, slack]) {
    assert.ok(types(line).includes("vendor_token"), "vendor token should be caught");
  }
  // A short or digit-free sk- word is prose, not a key.
  assert.deepEqual(types("the sk-learn-compatible-estimator-wrapper module"), []);
});

test("sensitive-info: a pathological line is scanned in linear time", () => {
  // CodeQL js/polynomial-redos caught the first version of these patterns: a trailing-
  // separator trim, a nested key quantifier, and unbounded vendor runs each went
  // quadratic (0.15–1.5 s on a 20k-character line, growing with the square). Every
  // input below took seconds on that version; the bound here is loose for slow runners.
  const n = 50000;
  const lines = [
    `api_token: ${",".repeat(n)}y`,
    "a_".repeat(n),
    `${"a_".repeat(n)}token: short`,
    ["s", "k-"].join("").repeat(n),
    ["xo", "xb-"].join("").repeat(n)
  ];
  for (const line of lines) {
    const started = performance.now();
    scanSensitiveInfo(line);
    const elapsed = performance.now() - started;
    assert.ok(elapsed < 1500, `${line.slice(0, 12)}… took ${elapsed.toFixed(0)} ms`);
  }
});

test("sensitive-info: the original patterns and the finding shape are unchanged", () => {
  assert.deepEqual(types(`token: ${SHAPED}`), ["token_assignment"]);
  assert.deepEqual(types("API_TOKEN=super-secret-token-value"), ["env_value"]);
  assert.deepEqual(types(`Authorization: Bearer ${SHAPED}`), ["bearer_token"]);
  // One credential line yields one token_assignment, not one per pattern that agrees.
  assert.equal(types(`secret: ${SHAPED}`).filter((type) => type === "token_assignment").length, 1);
  const findings = scanSensitiveInfo(`intro\nclient_secret: ${SHAPED}\noutro`);
  assert.deepEqual(findings, [{ type: "token_assignment", line: 2, message: "Sensitive-looking value omitted." }]);
  assert.equal(JSON.stringify(findings).includes(SHAPED), false, "a finding never carries the value");
});
