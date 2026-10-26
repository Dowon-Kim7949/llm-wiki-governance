const SENSITIVE_PATTERNS = [
  { type: "private_key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/i },
  { type: "certificate", pattern: /-----BEGIN CERTIFICATE-----/i },
  { type: "token_assignment", pattern: /\b(?:api[_-]?key|token|secret|password|passwd|pwd)\b\s*[:=]\s*["']?[^"'\s]{8,}/i },
  { type: "bearer_token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i },
  { type: "session_cookie", pattern: /\b(?:session|cookie|connect\.sid)\b\s*[:=]\s*["']?[^"'\s]{8,}/i },
  { type: "env_value", pattern: /^\s*[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)[A-Z0-9_]*\s*=\s*.+$/im }
];

// `\btoken\b` above cannot see `access_token: …` or `client_secret: …`: `_` is a word
// character, so there is no boundary before the credential word. These two patterns
// cover keys whose LAST segment names a credential (snake/kebab/dotted, and camelCase),
// but only when the value is shaped like a credential — so code (`response.data.token`),
// references (`${CLIENT_SECRET}`, `process.env.X`) and placeholders (`<your-token>`,
// `xxxx…`) stay quiet. Measured on 2026-10-26 before shipping: on 11 local wikis
// (394 files) and their source trees (1,219 files, 255k lines) the unshaped version
// added 45 hits, all code references; the shaped version added 0, while catching every
// fake credential in a synthetic corpus.
//
// Every pattern here runs on document text, so none may backtrack super-linearly: a
// pathological line must not stall `validate` or retrieval. Candidates are therefore
// located with one bounded run per key (the lookbehind forbids starting inside a run)
// and the key is judged afterwards as a plain string; quantifiers are bounded.
const KEY_VALUE = /(?<![A-Za-z0-9_.-])([A-Za-z0-9_.-]{1,128})["']?[ \t]*[:=][ \t]*["']?([^"'\s]{8,256})/g;
const SUFFIXED_KEY = /[_.-](?:api[_-]?key|access[_-]?key|secret[_-]?key|private[_-]?key|token|secret|password|passwd|pwd)$/i;
const CAMEL_KEY = /^[a-z][A-Za-z0-9]{0,120}(?:Token|Secret|Password|ApiKey|AccessKey|SecretKey|PrivateKey)$/;
const CREDENTIAL_SHAPE = /^[A-Za-z0-9+/=_-]{12,256}$/;
const PLACEHOLDER = /^(?:x{4}|\*{4}|your|example|placeholder|changeme|redacted|dummy|sample|test|todo|none|null|undefined|true|false)/i;

// Vendor-prefixed credentials are recognizable without a key name.
const VENDOR_TOKEN = /\b(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,255}|(?:AKIA|ASIA)[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,255}|sk-(?:ant-|proj-)?(?=[A-Za-z0-9_-]{0,255}[0-9])[A-Za-z0-9_-]{20,255}|AIza[0-9A-Za-z_-]{35}|(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{16,255}|npm_[A-Za-z0-9]{36})\b/;

function credentialShaped(value) {
  // Trailing separators are trimmed by hand: `/[,;]+$/` backtracks quadratically.
  let end = value.length;
  while (end > 0 && (value[end - 1] === "," || value[end - 1] === ";")) end -= 1;
  const trimmed = value.slice(0, end);
  return CREDENTIAL_SHAPE.test(trimmed) && /[0-9]/.test(trimmed) && /[A-Za-z]/.test(trimmed) && !PLACEHOLDER.test(trimmed);
}

function credentialAssignment(line) {
  for (const match of line.matchAll(KEY_VALUE)) {
    const [, key, value] = match;
    if ((SUFFIXED_KEY.test(key) || CAMEL_KEY.test(key)) && credentialShaped(value)) return true;
  }
  return false;
}

export function scanSensitiveInfo(content) {
  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const types = SENSITIVE_PATTERNS.filter(({ pattern }) => pattern.test(line)).map(({ type }) => type);
    if (!types.includes("token_assignment") && credentialAssignment(line)) types.push("token_assignment");
    if (VENDOR_TOKEN.test(line)) types.push("vendor_token");
    for (const type of types) {
      findings.push({
        type,
        line: index + 1,
        message: "Sensitive-looking value omitted."
      });
    }
  });

  return findings;
}
