# Reddit reply kit — llm-wiki-governance launch

> Draft-assist snippets for replying FAST when someone comments. **Not for auto-posting.** Reddit prohibits/penalizes bot auto-replies, and canned replies to a "looking for feedback" post read badly. Rules-safe pattern: get notified → a human personalizes one of these → reply within a few hours.

**Tone:** first-person, honest, non-defensive. Concede real limits; don't oversell. Always answer the actual question, then (optionally) ask a follow-up to keep the thread alive.

---

## Q: How is this different from a link checker / markdownlint?
Link checkers verify that links resolve. This tracks whether the *code a doc describes* moved — it flags a doc when the git-tracked files/lines it cites changed after the doc was last reviewed — and it manages a human `needs_review → verified` state that the tool itself can't promote. Different problem: staleness + review state, not broken links.

## Q: Why not just a CLAUDE.md / a prompt telling the agent to update docs?
Those are instructions with no enforcement. This is the check layer on top: machine-validated references/frontmatter, git-drift flagging, a verified gate the tool can't self-promote, and CI exit codes. The prompt says what to do; this catches when it didn't happen.

## Q: Doesn't this just add more docs to maintain (and more tokens)?
Fair — it's overhead. It pays off on medium/large, long-lived repos where re-discovering architecture/decisions is expensive; for a small solo repo it's probably not worth it. I make no token-savings claim yet — measuring that (no-wiki vs governed-wiki) is on my list.

## Q: It doesn't verify the prose is actually correct, right?
Correct, and deliberate. It checks that references resolve (file/line exists), review state, and drift — not semantic truth. Tiered evidence (and actually checking symbol/route existence for supported languages) is on the roadmap; today it's "reference-checked, not truth-verified."

## Q: Node-only? I use Python/Go/etc.
The CLI needs Node to run, but it *documents* any stack (it detects Python/Go/Rust/JVM/PHP/Ruby/.NET/mobile/infra). The Node runtime requirement is a real adoption hurdle I'm weighing.

## Q: Why not just RAG / code search?
Complementary, not competing. RAG retrieves fresh code on demand; this is a durable, human-approved summary/decision layer with trust-state. It doesn't replace search — ideally you'd use both.

## Q: So the agent reads the wiki over MCP?
The MCP server exposes governance checks/reports (validate/status/drift/graph), not document search or body retrieval yet. Read-only retrieval (`search_docs`/`get_doc`) is the top item on my roadmap — that's what would make the "project memory" idea real.

## Q: Is it open source? License?
Yes — MIT, zero runtime dependencies, Node stdlib only. Everything's on GitHub.

---

## Positive comment ("nice", "I have this problem too")
Thanks! If you do try it, I'd love to know where it felt like overhead vs. where it actually saved you — that's exactly the signal I'm missing right now.

## Feature suggestion (esp. "flag docs when the code in the same PR changes" / "let the agent query docs")
That's exactly where I want to take it next — a changed-source → affected-doc gate, and a real read-only retrieval API/MCP. Would you want that to run in CI (fail the PR) or just annotate?
