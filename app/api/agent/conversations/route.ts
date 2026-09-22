import { connectDatabase } from "@/server/config/db";
import { Conversation } from "@/server/models/Conversation";
import { Lead } from "@/server/models/Lead";
import { requireAgent } from "@/server/lib/agentAuth";
import { ok, route, unauthorized } from "@/server/lib/http";
import type { LeadData } from "@/server/types/domain";

export const runtime = "nodejs";

/**
 * GET /api/agent/conversations/?status=WAITING_FOR_AGENT
 *
 * The dashboard queue. Ordered so the longest-waiting lead is first — the
 * dashboard's job is to stop anyone being forgotten.
 */
export const GET = route(async (request: Request) => {
  const agent = await requireAgent(request);
  if (!agent) return unauthorized();

  await connectDatabase();
  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  const mine = params.get("mine") === "true";

  const query: Record<string, unknown> = {};
  if (status) query.status = status;
  else query.status = { $ne: "CLOSED" };
  if (mine) query.assignedAgent = agent._id;

  const conversations = await Conversation.find(query)
    .sort({ status: 1, lastMessageAt: -1 })
    .limit(100)
    .populate("assignedAgent", "name");

  const leads = await Lead.find({
    conversationId: { $in: conversations.map((c) => c.conversationId) },
  });
  const leadBy = new Map(leads.map((l) => [l.conversationId, l]));

  return ok({
    conversations: conversations.map((c) => {
      const data = c.leadData as unknown as LeadData;
      return {
        conversationId: c.conversationId,
        status: c.status,
        service: c.service,
        leadScore: c.leadScore,
        name: data?.name ?? null,
        projectType: data?.projectType ?? null,
        budget: data?.budget ?? null,
        timeline: data?.timeline ?? null,
        aiSummary: c.aiSummary,
        // `populate` swaps the ObjectId for the agent document at runtime;
        // the inferred schema type still says ObjectId, hence the cast.
        assignedAgent: c.assignedAgent
          ? (() => {
              const populated = c.assignedAgent as unknown as { _id: unknown; name?: string };
              return { id: String(populated._id), name: populated.name ?? "Unassigned" };
            })()
          : null,
        leadStatus: leadBy.get(c.conversationId)?.status ?? null,
        lastMessageAt: c.lastMessageAt,
        handoffRequestedAt: c.handoffRequestedAt,
        createdAt: c.createdAt,
      };
    }),
  });
});
