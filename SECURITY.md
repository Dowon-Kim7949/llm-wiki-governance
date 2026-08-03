> Language: [English](./SECURITY.md) | [한국어](./SECURITY.ko.md)

# Security Policy

## Supported versions

`llm-wiki-governance` follows a rolling release model: security fixes
land on the **latest published version** on npm. Please upgrade to the latest
release before reporting, and pin to a recent version in your projects.

| Version | Supported |
|---|---|
| Latest published release | ✅ |
| Older releases | ❌ (please upgrade) |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Use one of the private channels below:

1. **GitHub Private Vulnerability Reporting (preferred)** — go to the
   repository's **Security** tab → **Report a vulnerability**. This keeps the
   report private and lets us coordinate a fix and advisory.
2. **Email** — ungong0328@gmail.com.

Please include, as far as you can:

- A description of the issue and its impact.
- Steps to reproduce (a minimal command sequence or repository state).
- Affected version(s) and your environment (OS, Node.js version).
- Any suggested remediation.

## What to expect

This project is maintained by a small team on a best-effort basis:

- **Acknowledgement:** within about 5 business days.
- **Assessment & fix:** we will keep you informed of progress and target a fix
  in the next release once the issue is confirmed.
- **Disclosure:** we prefer coordinated disclosure. Once a fix is released, we
  will credit reporters who wish to be named (via a GitHub Security Advisory).

## Scope & threat model

A few facts that help scope reports:

- The CLI has **no third-party runtime dependencies** (Node.js built-ins only),
  which keeps the dependency attack surface minimal.
- It operates on the **local filesystem** — reading project files and, only with
  explicit `--write`/`--apply` flags, writing wiki/adapter files. It does not
  transmit project contents anywhere.
- It includes a **sensitive-information scan** that flags suspected secrets and
  redacts suspected raw values in reports.

Reports of particular interest include: unintended writes outside the intended
scope, path traversal, code execution via crafted project files, or leakage of
sensitive information into reports/logs.

## Reporting a sensitive-info false positive

The sensitive-information scan is a **safety invariant, not a lint**. Every rule
in the `sensitive.*` category (`NON_TOGGLEABLE_CATEGORIES` in
`src/commands/findings.js`) is deliberately **not toggleable by project config**:
an `llm-wiki.config.json` `rules` entry naming one is ignored, no `rulesPreset`
may name one, and there is no flag that turns the scan off. A detector a project
can switch off stops being a guarantee — so this one cannot be.

That makes a false positive expensive, which is exactly why we want to hear about
it.

### If a finding is blocking you right now

1. **Read the location, not the value.** The finding never prints the matched
   text — it reports `path:line` and a type only (`llm-wiki explain
   sensitive.redacted` describes the rule). Open that line **locally** and decide
   what it actually is.
2. **If it is real**, remove or rotate it, and replace examples with clearly fake
   placeholders. Do not paste it anywhere, including into an issue.
3. **If it is a false positive**, unblock yourself by rewriting the line so it no
   longer has the shape of a credential — there is no suppression flag — and then
   file a report, so the detector gets fixed instead of worked around.

### What to put in the report

- The **rule id** (`sensitive.redacted` in almost every case).
- The **document path** the finding named, including the line.
- A **redacted description of the shape** that tripped it: "a 40-character hex
  commit SHA inside a prose sentence", "a base64 placeholder in a fenced
  example". Describe the pattern, never the value.
- The command you ran, the package version, and your Node.js version.

**Never include the matched value**, even when you are certain it is not a
secret. If the shape cannot be described without it, do not open a public issue —
use a private channel from [Reporting a vulnerability](#reporting-a-vulnerability)
instead.

Use the **Sensitive-info false positive** issue template
(`.github/ISSUE_TEMPLATE/sensitive_false_positive.md`).

### Why there is no per-document exception yet

There is deliberately **no** per-document or per-line exception mechanism — no
allow-list, no inline suppression marker. The safety line stays whole. The
condition for revisiting that is the **first real reported false positive**; the
measured count today is **zero**, so an escape hatch would exist only for a case
nobody has yet hit.

If an exception mechanism is ever added, **who may declare an exception has to be
decided in the same change.** An unqualified "declare an exception" inherits the
self-approval problem: in this repository governance actions are carried out by an
agent, so a rule that lets "the operator" waive a safety finding lets the agent
waive it on its own authority. An escape hatch is only as strong as the answer to
who holds it.

### What a sensitive finding costs while it stands

A sensitive false positive **blocks twice**:

- `validate` (and `audit`) exit **2**. `sensitive.*` findings are `blocked`
  severity, which is not conditional on `--strict`.
- `review --approve` / `--approve-all` **refuses the document**: promotion
  re-scans the resulting content and skips it with a `sensitive.redacted`
  finding. In this repository the self-approval step that `AGENTS.md` makes
  mandatory therefore cannot run, so the batch cannot be closed until the finding
  is gone.

## MCP server trust model

The `llm-wiki mcp` server (Gate 11) is designed for a **local, single-tenant**
deployment. Understand its boundary before exposing it:

- **Transport assumption.** It speaks newline-delimited JSON-RPC 2.0 over
  **stdio** and is meant to be spawned as a **local subprocess** by a trusted
  client — your editor/agent (Claude Code, Cursor, …) or a CI runner. `stdout`
  **is** the protocol channel; only protocol messages go there (logs go to
  `stderr`). Do not pipe anything else into its stdout.
- **No authentication or authorization.** The server has no auth layer, no
  sessions, and no per-caller access control. Anyone who can reach the process
  can call every exposed tool.
- **Read-only tools only.** No write/mutating command (`init`/`fix`/`migrate`/
  `drift`/`quickstart --write`, and the `review` **promotion** path) is exposed
  over MCP. Tools carry `readOnlyHint`. Promotion to `verified` stays a human CLI
  action; the `review` MCP tool exposes only the read-only backlog **list**.
- **Do not expose it over a network.** Because there is no auth, do **not** put
  the stdio server behind a public/remote broker or network transport as-is. If
  you must reach it remotely, front it with **your own** authenticated,
  access-controlled proxy and treat the whole wiki as readable by anyone who can
  reach that proxy.
- **Sensitive repositories.** The same content protections apply as in the CLI:
  restricted / `contains_sensitive_info` / sensitive-scan-hit documents are
  excluded from `list_docs`/`search_docs` by default (opt-in `includeSensitive`),
  and returned bodies/snippets redact sensitive-looking lines. Still, assume any
  caller that can reach the server can read every non-excluded document — keep
  real secrets out of the wiki, not merely `visibility: restricted`.

Thank you for helping keep the project and its users safe.
