import crypto from "node:crypto";
import { Conversation, type ConversationDoc } from "../models/Conversation";
import { Message, type MessageDoc } from "../models/Message";
import { logger } from "../config/logger";
import type {
  Channel,
  ConversationState,
  LeadData,
  MessageStatus,
  SenderType,
} from "../types/domain";

/* ═══════════════════════════════════════════════════════════════════════════
   CONVERSATION SERVICE
   Owns the state machine and the single append-only message log that both the
   website and WhatsApp write into.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Which transitions are legal. Anything else is a bug, and is logged as one. */
const ALLOWED: Record<ConversationState, ConversationState[]> = {
  AI_ACTIVE: ["WAITING_FOR_AGENT", "CLOSED"],
  WAITING_FOR_AGENT: ["HUMAN_ACTIVE", "AI_ACTIVE", "CLOSED"],
  HUMAN_ACTIVE: ["WAITING_FOR_AGENT", "AI_ACTIVE", "CLOSED"],
  CLOSED: ["AI_ACTIVE"], // reopening
};

export const newConversationId = () => `conv_${crypto.randomBytes(9).toString("hex")}`;
export const newClientId = () => `cl_${crypto.randomBytes(12).toString("hex")}`;

export async function findConversation(conversationId: string): Promise<ConversationDoc | null> {
  return Conversation.findOne({ conversationId });
}

export async function createConversation(input: {
  clientId: string;
  region?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}): Promise<ConversationDoc> {
  return Conversation.create({
    conversationId: newConversationId(),
    clientId: input.clientId,
    status: "AI_ACTIVE",
    meta: {
      region: input.region ?? null,
      userAgent: input.userAgent?.slice(0, 300) ?? null,
      referrer: input.referrer?.slice(0, 500) ?? null,
    },
  });
}

/**
 * Append a message.
 *
 * The sequence number is allocated with `$inc` inside `findOneAndUpdate`, so
 * two concurrent writers (a client socket and a WhatsApp webhook landing in the
 * same millisecond) cannot be handed the same slot. Ordering on timestamps
 * alone would be a race.
 */
export async function appendMessage(input: {
  conversationId: string;
  senderType: SenderType;
  senderId?: string | null;
  channel: Channel;
  message: string;
  externalMessageId?: string | null;
  status?: MessageStatus;
  /** Why a send failed — Meta's error code and message. */
  failureReason?: string | null;
  actions?: { label: string; value: string }[];
}): Promise<MessageDoc | null> {
  const conversation = await Conversation.findOneAndUpdate(
    { conversationId: input.conversationId },
    { $inc: { lastSequence: 1 }, $set: { lastMessageAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!conversation) return null;

  try {
    return await Message.create({
      conversationId: input.conversationId,
      senderType: input.senderType,
      senderId: input.senderId ?? null,
      channel: input.channel,
      message: input.message,
      externalMessageId: input.externalMessageId ?? null,
      status: input.status ?? "sent",
      failureReason: input.failureReason ?? null,
      sequence: conversation.lastSequence,
      actions: input.actions ?? [],
      timestamp: new Date(),
    });
  } catch (error) {
    // Unique index on externalMessageId: a duplicate webhook delivery. The
    // sequence we burned is harmless — gaps are fine, collisions are not.
    if ((error as { code?: number }).code === 11000) {
      logger.debug({ id: input.externalMessageId }, "conversation: duplicate message ignored");
      return null;
    }
    throw error;
  }
}

export async function getTranscript(conversationId: string, limit = 200): Promise<MessageDoc[]> {
  return Message.find({ conversationId }).sort({ sequence: 1 }).limit(limit);
}

/** History in the shape Gemini wants: client turns are "user", ours are "model". */
export async function getAiHistory(conversationId: string, limit = 40) {
  const messages = await Message.find({
    conversationId,
    senderType: { $in: ["client", "ai", "agent"] },
  })
    .sort({ sequence: -1 })
    .limit(limit);

  return messages
    .reverse()
    .map((m) => ({
      role: m.senderType === "client" ? ("user" as const) : ("model" as const),
      text: m.message,
    }));
}

export async function transition(
  conversation: ConversationDoc,
  next: ConversationState,
): Promise<ConversationDoc> {
  const current = conversation.status as ConversationState;
  if (current === next) return conversation;

  if (!ALLOWED[current].includes(next)) {
    logger.warn({ conversationId: conversation.conversationId, current, next }, "state: illegal transition");
    return conversation;
  }

  conversation.status = next;
  if (next === "WAITING_FOR_AGENT" && !conversation.handoffRequestedAt) {
    conversation.handoffRequestedAt = new Date();
  }
  if (next === "CLOSED") conversation.closedAt = new Date();
  if (next === "AI_ACTIVE") conversation.closedAt = null;

  await conversation.save();
  logger.info({ conversationId: conversation.conversationId, from: current, to: next }, "state: changed");
  return conversation;
}

/** True when the AI is allowed to generate a reply right now. */
export const aiMayRespond = (conversation: ConversationDoc): boolean =>
  conversation.status === "AI_ACTIVE";

/** True when the conversation accepts any new messages at all. */
export const acceptsMessages = (conversation: ConversationDoc): boolean =>
  conversation.status !== "CLOSED";

export async function updateLeadData(
  conversation: ConversationDoc,
  leadData: LeadData,
  leadScore: string,
): Promise<void> {
  conversation.leadData = leadData as never;
  conversation.service = leadData.service as never;
  conversation.leadScore = leadScore as never;
  await conversation.save();
}

/** Shape sent to the browser. Never leaks ObjectIds or internal fields. */
export function serialiseMessage(message: MessageDoc) {
  return {
    id: String(message._id),
    conversationId: message.conversationId,
    senderType: message.senderType,
    channel: message.channel,
    message: message.message,
    status: message.status,
    sequence: message.sequence,
    actions: message.actions ?? [],
    timestamp: message.timestamp,
  };
}

export function serialiseConversation(conversation: ConversationDoc) {
  return {
    conversationId: conversation.conversationId,
    status: conversation.status,
    service: conversation.service,
    leadScore: conversation.leadScore,
    agentAssigned: Boolean(conversation.assignedAgent),
  };
}
