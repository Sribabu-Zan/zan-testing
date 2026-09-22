import crypto from "node:crypto";
import { getEnv } from "../config/env";
import { logger } from "../config/logger";

/* ═══════════════════════════════════════════════════════════════════════════
   WHATSAPP CLOUD API

   Direction matters here, and it is the single most misunderstood part of this
   integration:

     Our WhatsApp Business number  ──sends to──▶  the front caller's phone

   From Meta's point of view the FRONT CALLER is the "customer". That means the
   24-hour customer-service window applies to US messaging THEM. The window
   opens when they message our number and closes 24 hours later.

   Consequences we have to design around:
     • A new-lead alert almost always lands outside the window (the agent has
       not messaged us recently), so it MUST go out as an approved template.
     • Once the agent replies to that template, the window opens and we can
       relay the client's free-form messages to them normally.
     • If the window closes mid-thread, relays start failing with error 131047.
       We surface that rather than silently dropping the client's message.

   Only the official Cloud API is used. No unofficial automation libraries.
   ═══════════════════════════════════════════════════════════════════════════ */

const GRAPH = "https://graph.facebook.com";

/** Meta's error code for "outside the 24-hour customer service window". */
export const OUTSIDE_WINDOW_CODE = 131047;

export interface SendResult {
  ok: boolean;
  /** wamid... — store it; status callbacks reference it. */
  messageId: string | null;
  errorCode?: number;
  errorMessage?: string;
}

/** E.164 digits, no "+", no spaces — the only form the Cloud API accepts. */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, "");
  // Shortest plausible international number is ~8 digits, longest is 15 (E.164).
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/**
 * `appsecret_proof` — an HMAC of the access token, keyed by the app secret.
 *
 * Required whenever "Require app secret proof for server API calls" is enabled
 * in App settings → Advanced → Security (it is on by default for new apps, and
 * is on for this one). Without it every Graph call fails with code 100,
 * "API calls from the server require an appsecret_proof argument".
 *
 * It is safe — and correct — to send it even when the setting is off, so this
 * is unconditional rather than configurable.
 */
function appSecretProof(): string {
  const env = getEnv();
  return crypto
    .createHmac("sha256", env.WHATSAPP_APP_SECRET)
    .update(env.WHATSAPP_ACCESS_TOKEN)
    .digest("hex");
}

async function callGraph(path: string, body: unknown): Promise<SendResult> {
  if (getEnv().WHATSAPP_DRY_RUN) {
    logger.info({ path, body }, "whatsapp: DRY RUN, not sending");
    return { ok: true, messageId: `dryrun_${crypto.randomUUID()}` };
  }

  try {
    const url = new URL(`${GRAPH}/${getEnv().WHATSAPP_API_VERSION}/${path}`);
    url.searchParams.set("appsecret_proof", appSecretProof());

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getEnv().WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      // Meta is usually fast; a hung request must not hold a socket handler.
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response.json()) as {
      messages?: { id: string }[];
      error?: { code?: number; message?: string };
    };

    if (!response.ok || payload.error) {
      logger.error({ status: response.status, error: payload.error }, "whatsapp: send failed");
      return {
        ok: false,
        messageId: null,
        errorCode: payload.error?.code,
        errorMessage: payload.error?.message ?? `HTTP ${response.status}`,
      };
    }

    return { ok: true, messageId: payload.messages?.[0]?.id ?? null };
  } catch (error) {
    logger.error({ err: error }, "whatsapp: network error");
    return { ok: false, messageId: null, errorMessage: (error as Error).message };
  }
}

/** Free-form text. Only delivers inside the 24-hour window. */
export function sendText(to: string, text: string): Promise<SendResult> {
  return callGraph(`${getEnv().WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    // Link previews off: relayed client text should not render someone's URL.
    text: { preview_url: false, body: text.slice(0, 4096) },
  });
}

/**
 * An approved template. This is the only thing that reliably delivers outside
 * the window, which is why new-lead alerts go out this way.
 *
 * `bodyParams` fill the template's {{1}}, {{2}} … placeholders in order. The
 * template itself is created and approved in WhatsApp Manager — see the
 * WhatsApp setup section of server/README.md.
 */
export function sendTemplate(
  to: string,
  templateName: string,
  bodyParams: string[],
): Promise<SendResult> {
  return callGraph(`${getEnv().WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: getEnv().WHATSAPP_TEMPLATE_LOCALE },
      components: [
        {
          type: "body",
          // Newlines are illegal in template parameters — Meta rejects them.
          parameters: bodyParams.map((text) => ({
            type: "text",
            text: text.replace(/\s+/g, " ").slice(0, 1024) || "-",
          })),
        },
      ],
    },
  });
}

/** Mark an inbound message read, so the agent sees accurate ticks. */
export function markRead(messageId: string): Promise<SendResult> {
  return callGraph(`${getEnv().WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
  });
}

/**
 * Verify X-Hub-Signature-256 against the raw request body.
 *
 * MUST run on the raw bytes, before any JSON parsing — re-serialising the
 * parsed object produces different bytes and the signature will never match.
 * See middleware/rawBody.ts.
 *
 * Compared with `timingSafeEqual` because a plain `===` on an HMAC leaks the
 * digest one byte at a time to anyone willing to measure.
 */
export function verifySignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = crypto
    .createHmac("sha256", getEnv().WHATSAPP_APP_SECRET)
    .update(rawBody)
    .digest("hex");

  const received = signatureHeader.slice("sha256=".length);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Meta's GET handshake when you first register the webhook URL. */
export function verifyChallenge(query: Record<string, unknown>): string | null {
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];
  if (mode === "subscribe" && token === getEnv().WHATSAPP_VERIFY_TOKEN && typeof challenge === "string") {
    return challenge;
  }
  return null;
}

/** True while we may send free-form text to someone who last messaged us at `at`. */
export function withinServiceWindow(at: Date | null | undefined): boolean {
  if (!at) return false;
  return Date.now() - at.getTime() < 24 * 60 * 60 * 1000;
}
