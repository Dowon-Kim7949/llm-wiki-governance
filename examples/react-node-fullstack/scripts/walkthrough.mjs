#!/usr/bin/env node
// Full-stack walkthrough on a React client and an Express server in npm
// workspaces, joined by a shared API contract. Every llm-wiki command is the real
// CLI. The wiki content an agent would write is a prebuilt fixture (enrichment/).
// Nothing is installed or started: the CLI reads the files, it does not run them.
//
//   node examples/react-node-fullstack/scripts/walkthrough.mjs [--cli <path>] [--keep] [--quiet]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyTree, createSession, editFile, json, read } from "../../_shared/walkthrough-kit.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const WIKI = "docs/llm-wiki";
const API = `${WIKI}/API_CONTRACTS.md`;
const CLIENT = `${WIKI}/domains/01_orders-client.md`;
const SERVER = `${WIKI}/domains/02_orders-server.md`;
const CONTRACT = "shared/orders-contract.json";
const ROUTE = "server/src/routes/orders.js";
const CLIENT_API = "client/src/api/orders.ts";
const REVIEWER = "Walkthrough Reviewer";

const s = createSession(process.argv.slice(2), scriptPath, "llm-wiki-fullstack-");
const flagged = (out) => new Set(out.split("\n")
  .map((line) => line.match(/impact\.source_changed (\S+):/))
  .filter(Boolean)
  .map((match) => match[1]));
const sameSet = (set, expected) => set.size === expected.length && expected.every((item) => set.has(item));
const reapprove = (docs) => {
  for (const doc of docs) {
    editFile(s.cwd, doc, "status: verified", "status: needs_review");
    editFile(s.cwd, doc, "  - verified\n", "  - needs-review\n");
  }
  return s.step(`review --approve ${docs.length} updated document(s)`, ["review", ...docs.flatMap((doc) => ["--approve", doc]), "--reviewer", REVIEWER], 0, (out) => new RegExp(`approved: ${docs.length}\\b`).test(out));
};

s.section("Step 1 - An existing full-stack repository");
copyTree(path.join(root, "app-src"), s.cwd);
s.say("npm workspaces: client/ (React, Vite) and server/ (Express), with the API contract in shared/. The root package.json names no framework.");
s.commit("feat: orders list, client and server (existing code)");

s.section("Step 2 - What detection sees, and what init suggests");
s.step("init --dry-run: type unknown, with a workspace hint", ["init", "--dry-run"], 0, (out) =>
  out.includes("type: unknown") && out.includes("client (react, vite); server (express)") && out.includes("--type fullstack"));
s.step("init --dry-run JSON carries the hint", ["init", "--dry-run", "--format", "json"], 0, (out) =>
  json(out).typeHint?.suggestedType === "fullstack" && json(out).detection.projectType === "unknown");
s.step("init --write --type fullstack", ["init", "--write", "--type", "fullstack"], 0, (out) => out.includes("type: fullstack"));
s.expect("config records type fullstack, so validate does not re-detect it", json(read(s.cwd, "llm-wiki.config.json")).type === "fullstack");
const configFile = path.join(s.cwd, "llm-wiki.config.json");
const config = json(fs.readFileSync(configFile, "utf8"));
config.rules = { ...config.rules, "impact.source_changed": "error" };
fs.writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
s.say("Turned impact.source_changed on as an error (a new project starts in lite, where it is off).");
s.commit("chore: llm-wiki scaffold");

s.section("Step 3 - Documents for each side and for the contract between them");
s.say("Prebuilt in examples/react-node-fullstack/enrichment/: the client domain, the server domain, and API_CONTRACTS.md.");
copyTree(path.join(root, "enrichment"), path.join(s.cwd, WIKI));
s.step("validate --strict", ["validate", "--strict"], 0);
s.step("review --approve the three documents", ["review", "--approve", API, "--approve", CLIENT, "--approve", SERVER, "--reviewer", REVIEWER], 0, (out) => /approved: 3\b/.test(out));
s.commit("docs: orders client, server and contract");
s.step("search-docs finds the contract document", ["search-docs", "contract endpoint orders"], 0, (out) =>
  (out.split("\n").find((line) => line.startsWith(`- ${WIKI}/`)) ?? "").startsWith(`- ${API}`));

s.section("Step 4 - Change the shared contract");
editFile(s.cwd, CONTRACT, '        "totalCents": "integer",\n', '        "totalCents": "integer",\n        "currency": "ISO 4217 code",\n');
s.say(`edited ${CONTRACT}: orders now carry a currency`);
s.step("impact flags all three documents that cite the contract", ["impact", "--since", "HEAD"], 1, (out) =>
  sameSet(flagged(out), [API, CLIENT, SERVER]));

s.section("Step 5 - Move both sides and their documents with it");
editFile(s.cwd, ROUTE, '{ id: "o-1001", totalCents: 4200, status: "paid" }', '{ id: "o-1001", totalCents: 4200, currency: "USD", status: "paid" }');
editFile(s.cwd, ROUTE, '{ id: "o-1002", totalCents: 1599, status: "pending" }', '{ id: "o-1002", totalCents: 1599, currency: "USD", status: "pending" }');
editFile(s.cwd, CLIENT_API, "  totalCents: number;\n", "  totalCents: number;\n  currency: string;\n");
editFile(s.cwd, CLIENT_API, "return `$${(order.totalCents / 100).toFixed(2)}`;", "return `${(order.totalCents / 100).toFixed(2)} ${order.currency}`;");
editFile(s.cwd, API, "`totalCents` (integer, cents) and", "`totalCents` (integer, cents), `currency` (ISO 4217 code) and");
editFile(s.cwd, CLIENT, "shown in dollars with two decimals", "shown with two decimals and the order's currency code");
editFile(s.cwd, SERVER, "There is no database.", "There is no database. Every stored order is in USD.");
reapprove([API, CLIENT, SERVER]);
s.step("impact passes once code and documents moved together", ["impact", "--since", "HEAD"], 0);
s.commit("feat: currency on orders (contract, server, client, docs)");

s.section("Step 6 - A change on one side only");
editFile(s.cwd, ROUTE, "  response.json(ORDERS);\n", "  response.json([...ORDERS].sort((a, b) => a.id.localeCompare(b.id)));\n");
s.say(`edited ${ROUTE}: the server now sorts orders by id`);
s.step("impact flags the server and contract documents, not the client one", ["impact", "--since", "HEAD"], 1, (out) =>
  sameSet(flagged(out), [API, SERVER]));
editFile(s.cwd, SERVER, "Orders are returned in the order they are stored, with no filtering and no paging.", "Orders are returned sorted by id, with no filtering and no paging.");
editFile(s.cwd, API, "returns an array of orders.", "returns an array of orders, sorted by id.");
reapprove([API, SERVER]);
s.step("impact passes", ["impact", "--since", "HEAD"], 0);
s.commit("feat: orders sorted by id");

s.section("Step 7 - Final state");
s.step("validate --strict is clean", ["validate", "--strict"], 0);
s.step("impact over the whole history since the docs were approved", ["impact", "--since", "HEAD~2"], 0);

s.finish();
