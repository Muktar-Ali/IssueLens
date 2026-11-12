const TRUNCATION_MARKER = "\n[TRUNCATED]";

const PROMPT_INJECTION_PATTERNS = [
  {
    name: "instruction_override",
    pattern: /\b(?:ignore|disregard|override)\b.{0,40}\b(?:instructions?|prompt|rules?|policy)\b/i,
  },
  {
    name: "privileged_prompt_reference",
    pattern: /\b(?:system|developer)\s+(?:message|prompt|instructions?)\b/i,
  },
  {
    name: "external_action_request",
    pattern: /\b(?:curl|wget|download|clone|fetch|open|visit)\b.{0,120}\b(?:https?:\/\/|git@)/i,
  },
  {
    name: "secret_exfiltration_request",
    pattern: /\b(?:reveal|print|return|expose|send)\b.{0,80}\b(?:secret|credential|api[_ -]?key|token|private key)\b/i,
  },
] as const;

export function sanitizeModelText(value: string, maxLength: number) {
  const sanitized = value
    .normalize("NFKC")
    .replace(/\0/g, "")
    .replace(
      /-----BEGIN [^-\r\n]{0,80}PRIVATE KEY-----[\s\S]*?-----END [^-\r\n]{0,80}PRIVATE KEY-----/gi,
      "[REDACTED PRIVATE KEY]",
    )
    .replace(
      /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,})\b/g,
      "[REDACTED TOKEN]",
    )
    .replace(
      /(authorization\s*:\s*bearer\s+)[^\s,;]+/gi,
      "$1[REDACTED]",
    )
    .replace(
      /\b(api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)(\s*[:=]\s*)[^\s,;]{8,}/gi,
      "$1$2[REDACTED]",
    );

  if (sanitized.length <= maxLength) return sanitized;
  const contentLength = Math.max(0, maxLength - TRUNCATION_MARKER.length);
  return `${sanitized.slice(0, contentLength)}${TRUNCATION_MARKER}`;
}

export function detectPromptInjectionSignals(values: Array<string | null | undefined>) {
  const content = values.filter((value): value is string => Boolean(value)).join("\n");
  return PROMPT_INJECTION_PATTERNS.filter(({ pattern }) => pattern.test(content)).map(
    ({ name }) => name,
  );
}
