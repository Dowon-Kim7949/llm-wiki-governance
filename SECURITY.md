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
