import { connectDatabase } from "@/server/config/db";
import { appendMessage, findConversation, serialiseMessage, transition } from "@/server/services/conversation.service";
import { requireAgent } from "@/server/lib/agentAuth";
import { EVENTS, emitStatus, emitToConversation } from "@/server/lib/realtime";
import { notFound, ok, route, unauthorized } from "@/server/lib/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/agent/conversations/{id}/close/
 *
 * Close a thread. The transcript and the Lead both survive — only new messages
 * are refused, and the state machine allows reopening back to AI_ACTIVE.
 */
export const POST = route<Ctx>(async (request, context) => {
  const agent = await requireAgent(request);
  if (!agent) return unauthorized();

  await connectDatabase();
  const { id } = await context.params;
  const conversation = await findConversation(id);
  if (!conversation) return notFound("Conversation not found");

  const notice = await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "system",
    channel: "website",
    message: "This conversation has been closed. Start a new chat any time.",
  });

  await transition(conversation, "CLOSED");
  await emitStatus(conversation.conversationId, "CLOSED");
  if (notice) {
    await emitToConversation(conversation.conversationId, EVENTS.message, serialiseMessage(notice));
  }

  return ok({ status: "CLOSED" });
});
