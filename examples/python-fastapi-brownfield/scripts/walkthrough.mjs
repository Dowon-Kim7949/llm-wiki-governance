#!/usr/bin/env node
// Brownfield walkthrough on a Python (FastAPI) service: the code exists first and
// the wiki is written from it. Every llm-wiki command is the real CLI. The wiki
// content an agent would write is a prebuilt fixture (enrichment/), and the
// walkthrough says so where it uses it. Python is not needed: the CLI reads the
// files, it does not run them.
//
//   node examples/python-fastapi-brownfield/scripts/walkthrough.mjs [--cli <path>] [--keep] [--quiet]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { copyTree, createSession, editFile, exists, json, nextDay, read } from "../../_shared/walkthrough-kit.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(scriptPath), "..");
const WIKI = "docs/llm-wiki";
const FEATURES = `${WIKI}/DOMAIN_FEATURES.md`;
const ARCH = `${WIKI}/ARCHITECTURE_CONVENTIONS.md`;
const PRICING = "app/services/pricing.py";

const s = createSession(process.argv.slice(2), scriptPath, "llm-wiki-python-brownfield-");
const findingOn = (out, rule, doc) => out.includes(`${rule} ${doc}`);

s.section("Step 1 - An existing Python service");
copyTree(path.join(root, "app-src"), s.cwd);
s.say("FastAPI app, pricing service, pytest tests, pyproject.toml. No package.json, no wiki.");
s.commit("feat: order pricing service (existing code)");

s.section("Step 2 - Initialize the wiki on the existing code, with agent adapters");
s.step("init --write detects a Python backend", ["init", "--write", "--agent", "claude", "--agent", "codex"], 0, (out) =>
  out.includes("type: backend"));
s.expect("config records type backend and the lite mode", (() => {
  const config = json(read(s.cwd, "llm-wiki.config.json"));
  return config.type === "backend" && config.governance?.mode === "lite";
})());
s.expect("generated docs cite pyproject.toml, not a package.json that does not exist", (() => {
  const profile = read(s.cwd, `${WIKI}/project-profile.md`);
  return profile.includes("pyproject.toml") && !/^\s+- package\.json$/m.test(profile);
})());
s.expect("generated docs take the project name from pyproject.toml", read(s.cwd, `${WIKI}/project-profile.md`).includes("project: order-service"));
s.expect("adapters point Claude Code and Codex at the wiki", ["CLAUDE.md", "AGENTS.md"].every((file) => exists(s.cwd, file) && read(s.cwd, file).includes("docs/llm-wiki/index.md")));
s.expect("generated skills exist for both agents", exists(s.cwd, ".claude/skills/llm-wiki-feature/SKILL.md") && exists(s.cwd, ".agents/skills/llm-wiki-feature/SKILL.md"));
s.step("handoff prints the enrichment prompt (no model runs here)", ["handoff", "--agent", "claude"], 0, (out) => out.includes("needs_review"));

s.section("Step 3 - Turn on the checks this walkthrough is about");
const configFile = path.join(s.cwd, "llm-wiki.config.json");
const config = json(fs.readFileSync(configFile, "utf8"));
config.rules = { ...config.rules, "impact.source_changed": "error", "evidence.missing": "warning" };
fs.writeFileSync(configFile, `${JSON.stringify(config, null, 2)}\n`, "utf8");
s.say("A new project starts in lite, which turns impact and missing-evidence checks off. llm-wiki.config.json now has:");
s.say(JSON.stringify(config.rules));
s.commit("chore: llm-wiki scaffold");

s.section("Step 4 - The agent cites a function that does not exist");
s.say("The enrichment an agent would write is prebuilt in examples/python-fastapi-brownfield/enrichment/. First a version with one wrong citation:");
copyTree(path.join(root, "enrichment"), path.join(s.cwd, WIKI));
editFile(s.cwd, FEATURES, "  - app/services/pricing.py#symbol:COUPONS\n", "  - app/services/pricing.py#symbol:apply_coupon\n");
editFile(s.cwd, FEATURES, "`app/services/pricing.py#symbol:COUPONS` — the two coupon codes", "`app/services/pricing.py#symbol:apply_coupon` — the two coupon codes");
s.step("validate --strict catches the invented symbol", ["validate", "--strict"], 1, (out) =>
  findingOn(out, "evidence.symbol_unverified", FEATURES));

s.section("Step 5 - Correct the citation, validate, approve");
copyTree(path.join(root, "enrichment"), path.join(s.cwd, WIKI));
s.step("validate --strict passes", ["validate", "--strict"], 0);
s.step("review --approve both documents", ["review", "--approve", FEATURES, "--approve", ARCH, "--reviewer", "Walkthrough Reviewer"], 0, (out) => /approved: 2\b/.test(out));
s.commit("docs: wiki enriched from the service code");

s.section("Step 6 - Find the right document");
s.step("search-docs finds the pricing rules", ["search-docs", "coupon discount rounding"], 0, (out) =>
  (out.split("\n").find((line) => line.startsWith(`- ${WIKI}/`)) ?? "").startsWith(`- ${FEATURES}`));
s.step("get-doc --section returns only the coupon rules", ["get-doc", FEATURES, "--section", "Features", "--strict-section"], 0, (out) =>
  out.includes("WELCOME10") && !out.includes("## Open Questions"));
s.step("get-related links the two documents", ["get-related", FEATURES], 0, (out) => out.includes(ARCH));

s.section("Step 7 - Change the pricing code");
editFile(s.cwd, PRICING, '    "VIP20": 20,\n', '    "VIP20": 20,\n    "SPRING15": 15,\n');
s.say(`edited ${PRICING}: a new coupon, SPRING15`);
s.step("impact flags the document that cites the pricing code, and only it", ["impact", "--since", "HEAD"], 1, (out) =>
  findingOn(out, "impact.source_changed", FEATURES) && !findingOn(out, "impact.source_changed", ARCH));

s.section("Step 8 - The same change, as the date-anchored drift sees it");
s.commit("feat: SPRING15 coupon");
s.step("drift does not report a change made on the review day", ["drift", "--mode", "standard"], 0, (out) => !findingOn(out, "evidence.stale", FEATURES));
s.say("That is the documented same-day limit: drift compares dates, and a review dated today covers today's commits. impact, which compares the diff, is the gate that catches this in CI.");
s.step("impact on the commit, as CI on a push sees it", ["impact", "--since", "HEAD~1"], 1, (out) => findingOn(out, "impact.source_changed", FEATURES));

s.section("Step 9 - Update the document and approve it again");
editFile(s.cwd, FEATURES, "`WELCOME10` takes 10% off the subtotal and `VIP20` takes 20%.", "`WELCOME10` takes 10% off the subtotal, `SPRING15` takes 15%, and `VIP20` takes 20%.");
editFile(s.cwd, FEATURES, "the two coupon codes and their percentages", "the three coupon codes and their percentages");
editFile(s.cwd, FEATURES, "status: verified", "status: needs_review");
editFile(s.cwd, FEATURES, "  - verified\n", "  - needs-review\n");
s.step("review --approve the updated document", ["review", "--approve", FEATURES, "--reviewer", "Walkthrough Reviewer"], 0, (out) => /approved: 1\b/.test(out));
s.commit("docs: SPRING15 in the pricing rules");
s.step("impact passes for the two commits together", ["impact", "--since", "HEAD~2"], 0);
s.step("validate --strict is clean", ["validate", "--strict"], 0);

s.section("Step 10 - What the checks do not see");
editFile(s.cwd, FEATURES, "and `VIP20` takes 20%.", "and `VIP20` takes 25%.");
s.say("edited the document so it now says VIP20 takes 25%; the code still says 20. The citation still resolves.");
s.step("validate passes a false sentence whose citation resolves", ["validate", "--strict"], 0);
s.say("The CLI checks that a citation points at something real, not that the sentence is true. A reviewer reading the diff, or a test, catches this.");
editFile(s.cwd, FEATURES, "and `VIP20` takes 25%.", "and `VIP20` takes 20%.");

s.section("Step 11 - A later day");
editFile(s.cwd, PRICING, "# Coupon code -> percentage off the subtotal.", "# Coupon code -> percentage off the subtotal (one coupon per order).");
s.commit("docs(pricing): note that one coupon applies per order", nextDay());
s.say("This commit is dated a day and a half ahead, standing in for the next working day.");
s.step("drift reports the document whose cited file changed after its review", ["drift", "--mode", "standard"], 0, (out) => findingOn(out, "evidence.stale", FEATURES));
s.say("Resolve it by re-reading the change and approving the document again on that day, or with `llm-wiki drift --downgrade` until someone does.");

s.finish();
