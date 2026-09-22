import { z } from "zod";
import { connectDatabase } from "@/server/config/db";
import { findConversation } from "@/server/services/conversation.service";
import { declineHandoff, requestHandoff } from "@/server/services/chat.service";
import { bearerFrom, verifyChatToken } from "@/server/lib/tokens";
import { rateLimit } from "@/server/lib/rateLimit";
import { fail, ok, parseBody, route, tooMany, unauthorized } from "@/server/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({ action: z.enum(["request", "decline"]) });

/**
 * POST /api/chat/handoff/
 *
 * Backs the "Talk to our team" / "Continue with AI" buttons.
 */
export const POST = route(async (request: Request) => {
  const token = bearerFrom(request);
  if (!token) return unauthorized();
  const claims = verifyChatToken(token);
  if (!claims) return unauthorized();

  // Tight limit: each request fires a WhatsApp notification.
  const limit = await rateLimit(claims.conversationId, "handoff", 5, 300);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  await connectDatabase();
  const conversation = await findConversation(claims.conversationId);
  if (!conversation) return fail(404, "Conversation not found");
  if (conversation.status === "CLOSED") return fail(409, "This conversation has been closed.");

  if (parsed.data.action === "request") {
    await requestHandoff(conversation);
  } else {
    await declineHandoff(conversation);
  }

  return ok({ status: conversation.status });
});
