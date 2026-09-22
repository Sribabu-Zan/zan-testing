import { z } from "zod";
import { connectDatabase } from "@/server/config/db";
import { acceptsMessages, findConversation } from "@/server/services/conversation.service";
import { deliverAgentMessage } from "@/server/services/chat.service";
import { requireAgent } from "@/server/lib/agentAuth";
import { fail, notFound, ok, parseBody, route, sanitiseMessage, unauthorized } from "@/server/lib/http";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const bodySchema = z.object({ message: z.string().min(1).max(4000) });

/**
 * POST /api/agent/conversations/{id}/message/
 *
 * Reply from the dashboard rather than WhatsApp. Same code path as an inbound
 * WhatsApp reply, so the transcript, the state transition and the client's view
 * are identical either way — the channel is recorded, not special-cased.
 */
export const POST = route<Ctx>(async (request, context) => {
  const agent = await requireAgent(request);
  if (!agent) return unauthorized();

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  const text = sanitiseMessage(parsed.data.message);
  if (!text) return fail(400, "Message is empty");

  await connectDatabase();
  const { id } = await context.params;
  const conversation = await findConversation(id);
  if (!conversation) return notFound("Conversation not found");
  if (!acceptsMessages(conversation)) return fail(409, "Conversation is closed");

  await deliverAgentMessage(conversation, text, {
    channel: "website",
    agentId: String(agent._id),
  });

  return ok({ sent: true });
});
