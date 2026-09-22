import { logger } from "../config/logger";
import { Agent } from "../models/Agent";
import { Conversation, type ConversationDoc } from "../models/Conversation";
import { Message } from "../models/Message";
import { findConversation } from "./conversation.service";

/* ═══════════════════════════════════════════════════════════════════════════
   ROUTING AN INBOUND WHATSAPP MESSAGE BACK TO ITS CONVERSATION

   This is the hard part of the bridge, and the spec does not solve it: ONE
   WhatsApp number handles MANY simultaneous conversations. When a front caller
   types a reply, which client is it for?

   Resolved in order of confidence:

     1. Quoted reply  — the agent used WhatsApp's reply gesture, so the payload
                        carries context.id, the wamid of OUR message. We stored
                        that wamid, so this is exact. Best case, always trust it.

     2. Explicit switch — the agent typed "#conv_abc123 ..." to target a thread.
                        Also binds it as their active thread.

     3. Bound thread  — the conversation they were last notified about or last
                        replied to. Covers the common case of one lead at a time.

     4. Most recent   — their newest open assignment, as a last resort.

   If none resolve, we reply to the agent telling them how to target a thread
   rather than silently dropping their message into nowhere.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Routed {
  conversation: ConversationDoc | null;
  agentId: string | null;
  agentName: string | null;
  /** Text with any "#conv_..." prefix removed. */
  text: string;
  reason: "quoted" | "explicit" | "bound" | "recent" | "unresolved";
}

const EXPLICIT = /^#(conv_[a-f0-9]{18})\s*/i;

export async function routeInbound(input: {
  from: string;
  text: string;
  contextMessageId?: string | null;
}): Promise<Routed> {
  const agent = await Agent.findOne({ whatsappPhone: input.from });

  if (!agent) {
    logger.warn({ from: input.from }, "whatsapp: message from unknown number");
    return { conversation: null, agentId: null, agentName: null, text: input.text, reason: "unresolved" };
  }

  // Their message opens the 24-hour window in which we may send them free-form
  // relays. Recording it is what lets handoff.service choose text vs template.
  agent.lastInboundAt = new Date();

  const base = {
    agentId: String(agent._id),
    agentName: agent.name,
  };

  // 1 ── Quoted reply.
  if (input.contextMessageId) {
    const quoted = await Message.findOne({ externalMessageId: input.contextMessageId });
    if (quoted) {
      const conversation = await findConversation(quoted.conversationId);
      if (conversation) {
        agent.activeConversationId = conversation.conversationId;
        await agent.save();
        return { ...base, conversation, text: input.text, reason: "quoted" };
      }
    }
  }

  // 2 ── Explicit "#conv_..." prefix.
  const explicit = EXPLICIT.exec(input.text);
  if (explicit) {
    const conversation = await findConversation(explicit[1]!);
    const text = input.text.replace(EXPLICIT, "").trim();
    if (conversation) {
      agent.activeConversationId = conversation.conversationId;
      await agent.save();
      return { ...base, conversation, text, reason: "explicit" };
    }
    await agent.save();
    return { ...base, conversation: null, text, reason: "unresolved" };
  }

  // 3 ── Their currently bound thread.
  if (agent.activeConversationId) {
    const conversation = await findConversation(agent.activeConversationId);
    if (conversation && conversation.status !== "CLOSED") {
      await agent.save();
      return { ...base, conversation, text: input.text, reason: "bound" };
    }
  }

  // 4 ── Newest open assignment.
  const recent = await Conversation.findOne({
    assignedAgent: agent._id,
    status: { $in: ["WAITING_FOR_AGENT", "HUMAN_ACTIVE"] },
  }).sort({ lastMessageAt: -1 });

  if (recent) {
    agent.activeConversationId = recent.conversationId;
    await agent.save();
    return { ...base, conversation: recent, text: input.text, reason: "recent" };
  }

  await agent.save();
  return { ...base, conversation: null, text: input.text, reason: "unresolved" };
}
