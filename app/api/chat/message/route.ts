import { z } from "zod";
import { connectDatabase } from "@/server/config/db";
import { acceptsMessages, findConversation } from "@/server/services/conversation.service";
import { handleClientMessage } from "@/server/services/chat.service";
import { verifyChatToken, bearerFrom } from "@/server/lib/tokens";
import { rateLimit } from "@/server/lib/rateLimit";
import { fail, ok, parseBody, route, sanitiseMessage, tooMany, unauthorized } from "@/server/lib/http";

export const runtime = "nodejs";
/** Gemini can take a few seconds; the default 10s would cut a reply in half. */
export const maxDuration = 60;

const bodySchema = z.object({ message: z.string().min(1).max(4000) });

/**
 * POST /api/chat/message/
 *
 * One inbound message from the website. Depending on state this either produces
 * an AI reply or is relayed to the agent's WhatsApp — the caller does not choose.
 */
export const POST = route(async (request: Request) => {
  const token = bearerFrom(request);
  if (!token) return unauthorized();

  const claims = verifyChatToken(token);
  if (!claims) return unauthorized();

  // Keyed on the conversation, not the IP: an office behind one NAT must not
  // rate-limit its own colleagues out of the chat.
  const limit = await rateLimit(claims.conversationId, "message", 30, 60);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const text = sanitiseMessage(parsed.data.message);
  if (!text) return fail(400, "Message is empty");

  await connectDatabase();
  const conversation = await findConversation(claims.conversationId);
  if (!conversation) return fail(404, "Conversation not found");
  if (!acceptsMessages(conversation)) {
    return fail(409, "This conversation has been closed.");
  }

  // Awaited deliberately: returning early would let the platform freeze the
  // container before the AI reply or the WhatsApp relay finished.
  await handleClientMessage(conversation, text);

  return ok({ accepted: true });
});
