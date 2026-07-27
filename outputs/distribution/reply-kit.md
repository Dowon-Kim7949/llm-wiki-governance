# Reply kit — anticipated questions, honest answers

For the first hours of any thread. **Nothing here has been posted.** The rule for every answer:
concede the real limit first, then say what is actually true. A defensive answer to a fair
criticism costs more credibility than the criticism did.

---

### "48% is meaningless — that's one repo."

Agreed, and that's why there's no number in the README or the title. It's one external repo, one
model, six tasks, N=3, and the grader was an agent. What the run does establish is narrower and
more useful: a control arm with the same tools over an emptied wiki cost *more* than no wiki, so
whatever effect exists comes from the content rather than from having a search tool. That's the
part I'd defend. The magnitude, I wouldn't.

### "You graded your own benchmark with the same model family."

Yes, and it's the biggest hole left. Mitigations: answers were stripped of their arm label and
shuffled before grading, arms were re-attached only at aggregation, and grades were written down
before the label map was opened. As a check, re-grading the no-wiki arm blind reproduced the
earlier pass exactly — same score, and the same two individual defects re-attributed to the same
arms. That makes the procedure stable, not independent. A human blind grade is still owed.

### "How is this different from just putting docs in the repo / a CLAUDE.md?"

Those have no failure signal. The difference is what happens when the code moves: a document here
names the files, symbols, and line ranges it depends on, so `drift` and `impact` can tell you it
is now suspect, and CI can fail on it. Plus the trust states — an agent's output is `needs_review`
until a human stamps it. A CLAUDE.md is just text that is silently wrong after the next refactor.

### "Isn't this just RAG?"

No, and it's deliberately less than RAG. Search is zero-dependency keyword matching, not
embeddings — no index, no vector store, no network. Retrieval is a side effect; the primary job is
governance: verification state, evidence links, drift detection, CI enforcement. If you already
have a good RAG pipeline, this is complementary — it's the layer that tells you the documents
being retrieved are still true.

### "Does it check that the docs are actually correct?"

It checks grounding, not prose. It verifies that cited files exist, that line ranges are in range,
and — conservatively — that a named symbol or heading is at least mentioned in the file. It does
not parse an AST and it cannot tell you a paragraph's argument is wrong. That's what human review
is for, and why `verified` requires a person. I'd rather state that boundary than imply the tool
reads for meaning.

### "Zero dependencies — really? What about tests and linting?"

Both zero: no runtime dependencies and no devDependencies. Tests use Node's built-in test runner,
coverage uses `node --test --experimental-test-coverage`, and linting is a `node --check` syntax
gate plus an `.editorconfig` and a written style position. There is no built-in JS linter, so that
last one is a genuine trade-off made explicitly rather than by adding ESLint. Documented in
CONTRIBUTING.

### "Node only — what about Python/Go/Rust teams?"

The CLI needs Node, which is a real adoption barrier and I won't pretend otherwise. What it
*analyses* is language-agnostic: project detection covers Python, Go, Rust, JVM, PHP, Ruby, .NET,
mobile, and infra, and the docs are plain Markdown. So a Python team can use it if they'll run
`npx`; if they won't, this isn't for them yet.

### "What's the overhead? Someone has to write all these docs."

Real, and it's the honest cost side. The agent does the writing; the human cost is review, which
is why the newest release is a `review` command that risk-ranks the backlog so you read the
dangerous documents first instead of all of them. The benchmark measures the benefit of a
maintained wiki, not the labour of maintaining it — I haven't modelled that, and I say so in the
methodology.

### "What if the docs are stale — doesn't that make the agent confidently wrong?"

Yes, measurably. In an earlier run against a stale version of the same wiki, the agent gave a
*security-relevant wrong answer* — claimed a login sent plaintext passwords when the real code did
client-side RSA encryption. Both drift conditions were things the tool flags. That result is in
the record on purpose: it's the argument for the governance layer, not against it. A stale wiki is
a liability, which is also why the control arm's "unenriched wiki is worse than no wiki" finding
didn't surprise me.

### "Why should I trust the MCP server?"

Read-only by construction: 17 tools, no write command exposed, and promotion to `verified` isn't
reachable over MCP at all — it's a human CLI action. It assumes a local stdio subprocess and uses
stdout as the protocol channel, with no authentication, so don't expose it over a network without
your own proxy. Trust model is written up in SECURITY.md.

### "Is this abandoned / a weekend project?"

26 minor releases, CI across an OS matrix and Node 18–24, provenance-signed npm publishing via
Trusted Publishing, and it dogfoods itself — this repo's own wiki is validated by the tool in its
own CI. Single maintainer, so judge accordingly.

---

## Tone rules

- Concede first. Every strong criticism above is at least partly right.
- Never argue the magnitude of the benchmark. Argue the control arm.
- If asked something not measured, say it isn't measured. Do not estimate.
- No comparisons to other tools by name unless asked directly, and then only on facts.
