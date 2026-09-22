/* ═══════════════════════════════════════════════════════════════════════════
   LOGGING

   Deliberately console-based rather than pino: Next bundles route handlers, and
   pino's worker-thread transports do not survive that reliably. Vercel and most
   hosts already capture stdout as structured logs, so the value pino adds here
   is redaction — which is implemented directly below.
   ═══════════════════════════════════════════════════════════════════════════ */

type Level = "error" | "warn" | "info" | "debug";

const ORDER: Record<Level, number> = { error: 0, warn: 1, info: 2, debug: 3 };

const SENSITIVE = /token|secret|password|authorization|signature|apikey|api_key/i;

/**
 * Access tokens and phone numbers pass through this process constantly, and a
 * log line is the easiest place to leak one.
 */
function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SENSITIVE.test(key) ? "[redacted]" : redact(val, depth + 1);
  }
  return out;
}

function emit(level: Level, context: unknown, message: string) {
  const threshold = (process.env.LOG_LEVEL as Level) ?? "info";
  if (ORDER[level] > (ORDER[threshold] ?? 2)) return;

  const line = {
    level,
    time: new Date().toISOString(),
    msg: message,
    ...(context && typeof context === "object" ? (redact(context) as object) : { context }),
  };
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(JSON.stringify(line));
}

export const logger = {
  error: (context: unknown, message: string) => emit("error", context, message),
  warn: (context: unknown, message: string) => emit("warn", context, message),
  info: (context: unknown, message: string) => emit("info", context, message),
  debug: (context: unknown, message: string) => emit("debug", context, message),
};
