import 'server-only';

export type EmailLogLevel = 'debug' | 'info' | 'warn' | 'error';

export type EmailLogMeta = Record<string, unknown>;

const REDACT_KEY_PATTERNS = [
  'authorization',
  'apiKey',
  'apikey',
  'token',
  'secret',
  'password',
  'cookie',
  'set-cookie',
];

function shouldRedactKey(key: string): boolean {
  const k = key.toLowerCase();
  return REDACT_KEY_PATTERNS.some((p) => k.includes(p));
}

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();

    // Common header formats
    if (lower.startsWith('bearer ')) return 'Bearer [REDACTED]';
    if (lower.startsWith('basic ')) return 'Basic [REDACTED]';

    // Very long strings are often secrets/ids; avoid dumping them.
    if (value.length > 200) return `${value.slice(0, 12)}…[REDACTED]`;
  }

  return value;
}

function sanitize(input: unknown, seen = new WeakSet<object>()): unknown {
  if (input == null) return input;

  if (typeof input !== 'object') {
    return redactValue(input);
  }

  if (seen.has(input)) return '[Circular]';
  seen.add(input);

  if (Array.isArray(input)) {
    return input.map((v) => sanitize(v, seen));
  }

  const obj = input as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (shouldRedactKey(key)) {
      out[key] = '[REDACTED]';
      continue;
    }

    out[key] = sanitize(value, seen);
  }

  return out;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return '[Unserializable]';
  }
}

/**
 * Server-only email logging helper.
 *
 * - Redacts typical secret fields.
 * - Avoids logging huge bodies/tokens.
 */
export function logEmail(level: EmailLogLevel, message: string, meta?: EmailLogMeta): void {
  const sanitized = meta ? sanitize(meta) : undefined;
  const metaStr = sanitized ? ` ${safeJsonStringify(sanitized)}` : '';
  const line = `[email] ${message}${metaStr}`;

  switch (level) {
    case 'debug':
      console.debug(line);
      return;
    case 'info':
      console.info(line);
      return;
    case 'warn':
      console.warn(line);
      return;
    case 'error':
      console.error(line);
      return;
    default:
      console.log(line);
  }
}
