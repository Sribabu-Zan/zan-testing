import { z } from "zod";

/* ═══════════════════════════════════════════════════════════════════════════
   ENVIRONMENT — server only.

   Next loads .env.local itself, so there is no dotenv call here. This module
   must never be imported from a client component: it would fail the build
   (good) or, worse in a misconfigured setup, ship secrets to the browser. Every
   importer of this file is under src/server/ or in a route handler.
   ═══════════════════════════════════════════════════════════════════════════ */

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  /** Signs agent sessions and the short-lived per-conversation client tokens. */
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),

  // ── Gemini ───────────────────────────────────────────────────────────────
  /**
   * Optional on purpose. Absent, the AI degrades to a holding reply that still
   * offers the human handoff — which means the rest of the system (handoff,
   * the WhatsApp bridge, the dashboard) can be developed and tested without a
   * key. Requiring it would 500 every route, including ones Gemini never
   * touches.
   */
  GEMINI_API_KEY: z.string().optional(),
  /**
   * Model choice is quota-driven, not quality-driven:
   *   gemini-2.5-flash  404s for newly-created API keys ("no longer available
   *                     to new users").
   *   gemini-3.6-flash  works, but the free tier allows only 20 requests PER
   *                     DAY — a single afternoon of testing exhausts it, and
   *                     every turn afterwards degrades to the fallback.
   *   gemini-3.5-flash  works and has a far higher free allowance.
   * Override per environment once billing is enabled.
   */
  GEMINI_MODEL: z.string().default("gemini-3.5-flash"),

  // ── WhatsApp Cloud API ───────────────────────────────────────────────────
  WHATSAPP_ACCESS_TOKEN: z.string().min(1, "WHATSAPP_ACCESS_TOKEN is required"),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1, "WHATSAPP_PHONE_NUMBER_ID is required"),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  /** Echoed back during Meta's GET webhook handshake. */
  WHATSAPP_VERIFY_TOKEN: z.string().min(1, "WHATSAPP_VERIFY_TOKEN is required"),
  /** Signs X-Hub-Signature-256 on every inbound webhook. */
  WHATSAPP_APP_SECRET: z.string().min(1, "WHATSAPP_APP_SECRET is required"),
  WHATSAPP_API_VERSION: z.string().default("v21.0"),
  /**
   * Approved template used to alert a front caller. Required because a new-lead
   * alert almost always falls outside the 24-hour customer-service window —
   * see services/whatsapp.service.ts.
   */
  WHATSAPP_LEAD_TEMPLATE: z.string().default("zan_lead_details"),
  WHATSAPP_TEMPLATE_LOCALE: z.string().default("en"),
  /** Skips outbound WhatsApp calls; everything else runs. Local dev only. */
  WHATSAPP_DRY_RUN: z.string().default("false").transform((v) => v === "true"),

  // ── Pusher (managed WebSockets) ──────────────────────────────────────────
  PUSHER_APP_ID: z.string().min(1, "PUSHER_APP_ID is required"),
  PUSHER_SECRET: z.string().min(1, "PUSHER_SECRET is required"),
  /** Also exposed to the browser via NEXT_PUBLIC_PUSHER_KEY — not a secret. */
  NEXT_PUBLIC_PUSHER_KEY: z.string().min(1, "NEXT_PUBLIC_PUSHER_KEY is required"),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().default("ap2"),
});

let cached: z.infer<typeof schema> | null = null;

/**
 * Validated at first use rather than at module load: a build-time import of a
 * route handler must not crash `next build` on a machine without secrets.
 */
export function getEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}\n\nSee .env.example.`);
  }
  cached = parsed.data;
  return cached;
}

export const isProduction = () => process.env.NODE_ENV === "production";
