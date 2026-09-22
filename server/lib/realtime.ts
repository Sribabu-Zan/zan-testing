import Pusher from "pusher";
import { getEnv } from "../config/env";
import { logger } from "../config/logger";
import type { ConversationState } from "../types/domain";

/* ═══════════════════════════════════════════════════════════════════════════
   REALTIME

   Managed WebSockets rather than a Socket.IO server, because Route Handlers are
   request/response — they cannot hold a socket open. The push semantics the
   design needs are identical: a WhatsApp webhook lands, writes the message, and
   fans it out to the browser before the response is even returned.

   Channels are PRIVATE. A conversation id is unguessable, but obscurity is not
   authorisation — subscribing requires a signed token proving you own the
   thread. See app/api/pusher/auth/route.ts.
   ═══════════════════════════════════════════════════════════════════════════ */

let client: Pusher | null = null;

function pusher(): Pusher {
  if (!client) {
    const env = getEnv();
    client = new Pusher({
      appId: env.PUSHER_APP_ID,
      key: env.NEXT_PUBLIC_PUSHER_KEY,
      secret: env.PUSHER_SECRET,
      cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
      useTLS: true,
    });
  }
  return client;
}

export const conversationChannel = (conversationId: string) =>
  `private-conversation-${conversationId}`;

/** Every agent dashboard subscribes here for the waiting-leads queue. */
export const AGENTS_CHANNEL = "private-agents";

export const EVENTS = {
  message: "message",
  status: "status",
  typing: "typing",
  agentJoined: "agent-joined",
  conversationUpdated: "conversation-updated",
} as const;

/**
 * Fire and forget, but never throw.
 *
 * A realtime failure must not fail the request that triggered it: the message
 * is already durable in Mongo, and the client reconciles on reconnect by
 * re-fetching from its last known sequence. Losing the push costs latency, not
 * data.
 */
export async function emitToConversation(
  conversationId: string,
  event: string,
  payload: unknown,
): Promise<void> {
  try {
    await pusher().trigger(conversationChannel(conversationId), event, payload);
  } catch (error) {
    logger.error({ err: String(error), conversationId, event }, "realtime: emit failed");
  }
}

export async function emitToAgents(event: string, payload: unknown): Promise<void> {
  try {
    await pusher().trigger(AGENTS_CHANNEL, event, payload);
  } catch (error) {
    logger.error({ err: String(error), event }, "realtime: agent emit failed");
  }
}

export async function emitStatus(
  conversationId: string,
  status: ConversationState,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await emitToConversation(conversationId, EVENTS.status, { status, ...extra });
}

/** Signs a subscription request. Called only after the caller is authorised. */
export function authoriseChannel(socketId: string, channel: string, userData?: object) {
  return userData
    ? pusher().authorizeChannel(socketId, channel, {
        user_id: (userData as { id: string }).id,
        user_info: userData,
      })
    : pusher().authorizeChannel(socketId, channel);
}
