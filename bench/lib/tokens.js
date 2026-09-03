// Zero-dependency token estimator for the impact-measurement harness (Gate 22).
//
// We deliberately do NOT bundle a real BPE tokenizer: that would add a runtime
// dependency and break the package's zero-dep invariant, and this harness is a
// repo-internal validation tool (never shipped). Instead we use the standard
// rough proxy `tokens ~= chars / 4`.
//
// Why this is defensible for a COMPARISON: every arm is measured with the same
// estimator, so the constant divisor cancels in the ratio between arms. The
// absolute token counts are approximate (a real tokenizer varies by roughly
// +/- 20-30% on source code), but the relative cost of "code-only" vs
// "wiki-grounded" — the number this gate cares about — is robust to the divisor.
//
// `estimateTokensWords` is a second, independent estimate reported alongside so a
// reader can sanity-check that the headline ratio is not an artifact of one
// heuristic.

const CHARS_PER_TOKEN = 4;

export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// Whitespace-word count * 1.3 — a coarse alternative proxy (English/code prose
// averages ~1.3 tokens per whitespace word under BPE).
export function estimateTokensWords(text) {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * 1.3);
}

export { CHARS_PER_TOKEN };
