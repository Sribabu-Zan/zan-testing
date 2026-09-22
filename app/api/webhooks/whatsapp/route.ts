import { NextResponse } from "next/server";
import { connectDatabase } from "@/server/config/db";
import { logger } from "@/server/config/logger";
import { Message } from "@/server/models/Message";
import { claimWebhookEvent } from "@/server/models/WebhookEvent";
import { deliverAgentMessage } from "@/server/services/chat.service";
import { routeInbound } from "@/server/services/whatsappInbound.service";
import { markRead, sendText, verifyChallenge, verifySignature } from "@/server/services/whatsapp.service";
import { EVENTS, emitToConversation } from "@/server/lib/realtime";
import { sanitiseMessage } from "@/server/lib/http";
import type { MessageStatus } from "@/server/types/domain";

export const runtime = "nodejs";

/* ═══════════════════════════════════════════════════════════════════════════
   WHATSAPP WEBHOOK

   Two rules govern everything here:

   1. NEVER TRUST THE PAYLOAD. Every request is HMAC-verified against the raw
      bytes before a single field is read. An unverified body is discarded.

   2. ALWAYS RETURN 200 once verified. Meta retries anything else, and a retry
      storm on a handler that is failing for an unrelated reason (Mongo blip)
      turns one bad minute into thousands of duplicate deliveries. We
      acknowledge, then process — with idempotency so retries are harmless.
   ═══════════════════════════════════════════════════════════════════════════ */

/** GET — Meta's one-time subscription handshake. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const challenge = verifyChallenge(params);

  if (!challenge) {
    logger.warn({}, "whatsapp: webhook verification failed");
    return new NextResponse("Forbidden", { status: 403 });
  }
  // Meta requires the raw challenge as plain text, not JSON.
  return new NextResponse(challenge, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

interface WaValue {
  metadata?: { phone_number_id?: string };
  contacts?: { profile?: { name?: string }; wa_id?: string }[];
  messages?: {
    id: string;
    from: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    context?: { id?: string };
    button?: { text?: string };
    interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  }[];
  statuses?: {
    id: string;
    status: string;
    recipient_id?: string;
    errors?: { code?: number; title?: string; message?: string }[];
  }[];
}

/** POST — inbound messages and delivery/read receipts. */
export async function POST(request: Request) {
  // Raw body FIRST. Re-serialising a parsed object produces different bytes and
  // the signature would never match.
  const raw = await request.text();

  if (!verifySignature(Buffer.from(raw, "utf8"), request.headers.get("x-hub-signature-256") ?? undefined)) {
    logger.warn({}, "whatsapp: invalid webhook signature");
    return new NextResponse("Forbidden", { status: 403 });
  }

  let payload: { entry?: { changes?: { value?: WaValue }[] }[] };
  try {
    payload = JSON.parse(raw);
  } catch {
    // Signed but unparseable: acknowledge, do not invite a retry.
    return NextResponse.json({ received: true });
  }

  try {
    await connectDatabase();
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value) continue;
        for (const message of value.messages ?? []) await handleMessage(value, message);
        for (const status of value.statuses ?? []) await handleStatus(status);
      }
    }
  } catch (error) {
    // Log loudly, still acknowledge. See rule 2 above.
    logger.error({ err: String(error) }, "whatsapp: webhook processing failed");
  }

  return NextResponse.json({ received: true });
}

async function handleMessage(value: WaValue, message: NonNullable<WaValue["messages"]>[number]) {
  // Idempotency. Meta retries until it sees a 200, and a retry can arrive while
  // the first delivery is still in flight.
  if (!(await claimWebhookEvent(`${message.id}:message`))) {
    logger.debug({ id: message.id }, "whatsapp: duplicate message, skipped");
    return;
  }

  // Text, tapped button, and list selections all arrive differently.
  const text =
    message.text?.body ??
    message.interactive?.button_reply?.title ??
    message.interactive?.list_reply?.title ??
    message.button?.text ??
    null;

  if (!text) {
    logger.info({ type: message.type, from: message.from }, "whatsapp: unsupported message type");
    await sendText(
      message.from,
      "Only text replies are relayed to the website chat at the moment. Please type your reply.",
    );
    return;
  }

  const routed = await routeInbound({
    from: message.from,
    text: sanitiseMessage(text),
    contextMessageId: message.context?.id ?? null,
  });

  if (!routed.agentId) {
    // An unknown number reaching the business line. Do not reply — replying to
    // arbitrary inbound numbers is how a business account gets reported.
    return;
  }

  if (!routed.conversation) {
    await sendText(
      message.from,
      "I couldn't tell which conversation that was for. Reply directly to a lead notification, " +
        "or start your message with the conversation ID, e.g. #conv_abc123 your reply.",
    );
    return;
  }

  // Ticks in the agent's app should reflect that we actually took it.
  void markRead(message.id);

  await deliverAgentMessage(routed.conversation, routed.text, {
    channel: "whatsapp",
    agentId: routed.agentId,
    externalMessageId: message.id,
  });

  logger.info(
    { conversationId: routed.conversation.conversationId, reason: routed.reason },
    "whatsapp: agent message relayed to website",
  );
}

/** Delivery and read receipts for messages WE sent. */
async function handleStatus(status: NonNullable<WaValue["statuses"]>[number]) {
  if (!(await claimWebhookEvent(`${status.id}:${status.status}`))) return;

  const mapped: Record<string, MessageStatus> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };
  const next = mapped[status.status];
  if (!next) return;

  const failure = status.errors?.[0];
  const updated = await Message.findOneAndUpdate(
    { externalMessageId: status.id },
    {
      $set: {
        status: next,
        ...(failure ? { failureReason: failure.message ?? failure.title ?? "Delivery failed" } : {}),
      },
    },
    { returnDocument: "after" },
  );

  if (!updated) return;

  // Surface ticks in the website UI too.
  await emitToConversation(updated.conversationId, EVENTS.status, {
    messageId: String(updated._id),
    messageStatus: next,
  });

  if (next === "failed") {
    logger.error(
      { conversationId: updated.conversationId, reason: failure?.message },
      "whatsapp: message delivery failed",
    );
  }
}
