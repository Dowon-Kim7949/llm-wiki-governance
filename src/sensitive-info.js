const SENSITIVE_PATTERNS = [
  { type: "private_key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/i },
  { type: "certificate", pattern: /-----BEGIN CERTIFICATE-----/i },
  { type: "token_assignment", pattern: /\b(?:api[_-]?key|token|secret|password|passwd|pwd)\b\s*[:=]\s*["']?[^"'\s]{8,}/i },
  { type: "bearer_token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}/i },
  { type: "session_cookie", pattern: /\b(?:session|cookie|connect\.sid)\b\s*[:=]\s*["']?[^"'\s]{8,}/i },
  { type: "env_value", pattern: /^\s*[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY)[A-Z0-9_]*\s*=\s*.+$/im }
];

export function scanSensitiveInfo(content) {
  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const { type, pattern } of SENSITIVE_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({
          type,
          line: index + 1,
          message: "Sensitive-looking value omitted."
        });
      }
    }
  });

  return findings;
}
