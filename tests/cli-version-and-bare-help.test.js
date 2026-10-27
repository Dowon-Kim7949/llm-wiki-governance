// `llm-wiki --version` and a bare `llm-wiki help` (2026-10-27). Before this, the
// only way to read the installed version was the first line of the general help,
// `--version` exited 3 as an unknown command, and a bare `help` printed
// "Missing help topic." to stderr even though it then showed the general help and
// exited 0. Scripts that check the served npx version need a one-line answer.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { main, parseArgs } from "../src/cli.js";

const PACKAGE_VERSION = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

async function capture(argv) {
  const out = [];
  const err = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalExitCode = process.exitCode;
  console.log = (...args) => out.push(args.join(" "));
  console.error = (...args) => err.push(args.join(" "));
  try {
    const code = await main(argv);
    return { code, out: out.join("\n"), err: err.join("\n") };
  } finally {
    console.log = originalLog;
    console.error = originalError;
    process.exitCode = originalExitCode;
  }
}

for (const flag of ["--version", "-v"]) {
  test(`${flag} prints only the package version and exits 0`, async () => {
    const { code, out, err } = await capture([flag]);
    assert.equal(code, 0);
    assert.equal(out, PACKAGE_VERSION);
    assert.equal(err, "");
  });
}

test("release-notes keeps its own --version <x.y.z> option", () => {
  const { command, options, errors } = parseArgs(["release-notes", "--version", "9.9.9"]);
  assert.deepEqual(errors, []);
  assert.equal(command, "release-notes");
  assert.equal(options.version, "9.9.9");
});

test("bare help shows the general help without an error line", async () => {
  const { code, out, err } = await capture(["help"]);
  assert.equal(code, 0);
  assert.equal(err, "");
  assert.match(out, new RegExp(`^llm-wiki v${PACKAGE_VERSION.replace(/\./g, "\\.")}`));
  assert.match(out, /--version/);
});

test("an unknown help topic is still a usage error", async () => {
  const { code, err } = await capture(["help", "no-such-topic"]);
  assert.equal(code, 3);
  assert.match(err, /Unknown help topic: no-such-topic/);
});
