import { connectDatabase } from "@/server/config/db";
import { findConversation, getTranscript, serialiseMessage } from "@/server/services/conversation.service";
import { requireAgent } from "@/server/lib/agentAuth";
import { notFound, ok, route, unauthorized } from "@/server/lib/http";
import type { LeadData } from "@/server/types/domain";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/agent/conversations/{id}/ — full transcript and extracted brief. */
export const GET = route<Ctx>(async (request, context) => {
  const agent = await requireAgent(request);
  if (!agent) return unauthorized();

  await connectDatabase();
  const { id } = await context.params;
  const conversation = await findConversation(id);
  if (!conversation) return notFound("Conversation not found");

  const transcript = await getTranscript(id, 500);

  return ok({
    conversation: {
      conversationId: conversation.conversationId,
      status: conversation.status,
      service: conversation.service,
      leadScore: conversation.leadScore,
      leadData: conversation.leadData as unknown as LeadData,
      aiSummary: conversation.aiSummary,
      whatsappPhoneNumber: conversation.whatsappPhoneNumber,
      region: conversation.meta?.region ?? null,
      createdAt: conversation.createdAt,
      handoffRequestedAt: conversation.handoffRequestedAt,
    },
    messages: transcript.map(serialiseMessage),
  });
});
