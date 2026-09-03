// Decision 28 (maintainer, 2026-08-03): ship the release-notes exemption, and
// make freshness watching of `needs_review` documents an opt-in that is off by
// default.
//
// The brief's cost model assumed the exemption merely capped a NEW opt-in's cost,
// because release notes were needs_review at the time it was written. They are all
// `verified` now, so the exemption removes 33 of this repository's 52 documents
// from a check they are currently inside. That is deliberate and it is the point:
// a release note is an immutable record of a release that already shipped, it
// anchors `package.json` (which changes every release), and since decision 21
// made impact.source_changed an ERROR an unexempted release note can fail a build
// because unrelated source moved. Sixteen of the twenty-three impact findings on
// this repository's own decision-21 commit were exactly that.
//
// The widening is drift-only. impact stays verified-only: its rule is an error
// now, and an advisory opt-in must not hand an unreviewed document the power to
// fail a build.
import test from "node:test";
import assert from "node:assert/strict";
import { driftTargets, verifiedSourceAnchors, FRESHNESS_EXEMPT_DOC_TYPES } from "../src/commands/scans.js";

const doc = (extra = {}) => ({
  status: "verified",
  doc_type: "public_api",
  reviewed_at: "2026-07-01",
  last_updated: "2026-07-01",
  source_files: ["src/cli.js"],
  evidence: ["src/cli.js#symbol:main"],
  ...extra
});

test("release notes are exempt from freshness and reverse-impact anchoring", () => {
  assert.ok(FRESHNESS_EXEMPT_DOC_TYPES.has("release_notes"));
  assert.equal(verifiedSourceAnchors(doc({ doc_type: "release_notes" })), null);
  assert.equal(driftTargets(doc({ doc_type: "release_notes" })), null);
  // Everything else keeps its anchors — the exemption is one doc_type, not a hole.
  assert.ok(verifiedSourceAnchors(doc()));
  assert.ok(driftTargets(doc()));
});

test("the OKF `type` spelling exempts too, so the fallback field is not a bypass", () => {
  // hasRequiredField lets a non-empty `type` satisfy the doc_type requirement.
  // If the exemption only read doc_type, an OKF-shaped release note would stay
  // watched while its sibling was exempt — same document, different answer.
  assert.equal(verifiedSourceAnchors({ ...doc(), doc_type: undefined, type: "release_notes" }), null);
});

test("needs_review documents are unwatched by default", () => {
  assert.equal(driftTargets(doc({ status: "needs_review" })), null);
  assert.equal(driftTargets(doc({ status: "needs_review" }), {}), null);
  assert.equal(driftTargets(doc({ status: "needs_review" }), { watchNeedsReview: false }), null);
});

test("--watch-needs-review widens date-anchored freshness to needs_review documents", () => {
  const targets = driftTargets(doc({ status: "needs_review" }), { watchNeedsReview: true });
  assert.ok(targets, "the opt-in must produce anchors for an unreviewed document");
  assert.equal(targets.baseline, "2026-07-01");
  assert.deepEqual(targets.files, ["src/cli.js"]);
});

test("the opt-in does not widen to release notes either", () => {
  assert.equal(
    driftTargets(doc({ status: "needs_review", doc_type: "release_notes" }), { watchNeedsReview: true }),
    null,
    "the exemption outranks the opt-in; otherwise turning the opt-in on re-creates the treadmill"
  );
});

test("the opt-in never widens reverse-impact, only drift", () => {
  // verifiedSourceAnchors is what scanReverseImpact consumes, and it takes no
  // options — so there is no way for the drift opt-in to reach impact even by
  // accident. This test pins that seam, because the two scans share the extractor
  // and a future refactor could quietly join them.
  assert.equal(verifiedSourceAnchors(doc({ status: "needs_review" })), null);
  assert.equal(verifiedSourceAnchors.length, 1, "verifiedSourceAnchors must stay options-free");
});

test("a document with no usable baseline is still skipped under the opt-in", () => {
  assert.equal(
    driftTargets({ ...doc({ status: "needs_review" }), reviewed_at: undefined, last_updated: undefined }, { watchNeedsReview: true }),
    null
  );
});
