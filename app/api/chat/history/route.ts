import { connectDatabase } from "@/server/config/db";
import { findConversation, serialiseMessage } from "@/server/services/conversation.service";
import { Message } from "@/server/models/Message";
import { bearerFrom, verifyChatToken } from "@/server/lib/tokens";
import { fail, ok, route, unauthorized } from "@/server/lib/http";

export const runtime = "nodejs";

/**
 * GET /api/chat/history/?after=<sequence>
 *
 * Reconciliation after a dropped connection. The client records the highest
 * sequence it has rendered and asks for everything past it, so a realtime
 * message missed while offline is recovered rather than lost. This is why
 * ordering lives on `sequence` and not on timestamps.
 */
export const GET = route(async (request: Request) => {
  const token = bearerFrom(request);
  if (!token) return unauthorized();
  const claims = verifyChatToken(token);
  if (!claims) return unauthorized();

  await connectDatabase();
  const conversation = await findConversation(claims.conversationId);
  if (!conversation) return fail(404, "Conversation not found");

  const after = Number(new URL(request.url).searchParams.get("after") ?? "0");
  const messages = await Message.find({
    conversationId: claims.conversationId,
    sequence: { $gt: Number.isFinite(after) ? after : 0 },
  })
    .sort({ sequence: 1 })
    .limit(200);

  return ok({
    status: conversation.status,
    agentAssigned: Boolean(conversation.assignedAgent),
    messages: messages.map(serialiseMessage),
  });
});
