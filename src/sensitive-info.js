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
const CREDENTIAL_WORD = "(?:api[_-]?key|access[_-]?key|secret[_-]?key|private[_-]?key|token|secret|password|passwd|pwd)";
const SUFFIXED_KEY = new RegExp(`(?<![A-Za-z0-9])[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*[_.-]${CREDENTIAL_WORD}["']?\\s*[:=]\\s*["']?([^"'\\s]{8,})`, "i");
const CAMEL_KEY = /(?<![A-Za-z0-9])[a-z][A-Za-z0-9]*(?:Token|Secret|Password|ApiKey|AccessKey|SecretKey|PrivateKey)["']?\s*[:=]\s*["']?([^"'\s]{8,})/;
const CREDENTIAL_SHAPE = /^[A-Za-z0-9+/=_-]{12,}$/;
const PLACEHOLDER = /^(?:x{4,}|\*{4,}|your|example|placeholder|changeme|redacted|dummy|sample|test|todo|none|null|undefined|true|false)/i;

// Vendor-prefixed credentials are recognizable without a key name.
const VENDOR_TOKEN = /\b(?:gh[pousr]_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{22,}|(?:AKIA|ASIA)[0-9A-Z]{16}|xox[abprs]-[A-Za-z0-9-]{10,}|sk-(?:ant-|proj-)?(?=[A-Za-z0-9_-]*[0-9])[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{35}|(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{16,}|npm_[A-Za-z0-9]{36})\b/;

function credentialShaped(value) {
  const trimmed = value.replace(/[,;]+$/, "");
  return CREDENTIAL_SHAPE.test(trimmed) && /[0-9]/.test(trimmed) && /[A-Za-z]/.test(trimmed) && !PLACEHOLDER.test(trimmed);
}

export function scanSensitiveInfo(content) {
  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const types = SENSITIVE_PATTERNS.filter(({ pattern }) => pattern.test(line)).map(({ type }) => type);
    if (!types.includes("token_assignment")) {
      const keyed = SUFFIXED_KEY.exec(line) || CAMEL_KEY.exec(line);
      if (keyed && credentialShaped(keyed[1])) types.push("token_assignment");
    }
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
