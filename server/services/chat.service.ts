import { logger } from "../config/logger";
import type { ConversationDoc } from "../models/Conversation";
import { EVENTS, emitStatus, emitToAgents, emitToConversation } from "../lib/realtime";
import {
  aiMayRespond,
  appendMessage,
  getAiHistory,
  serialiseConversation,
  serialiseMessage,
  transition,
  updateLeadData,
} from "./conversation.service";
import { GeminiUnavailableError, generateTurn } from "./gemini.service";
import { performHandoff, relayToAgent } from "./handoff.service";
import type { LeadData } from "../types/domain";

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT ORCHESTRATION

   The single decision this file makes: when a client message arrives, does the
   AI answer it, or does it get relayed to a human on WhatsApp?

   That is determined by conversation state and nothing else — never by the
   model. An AI that could decide "I'll take this one" after a human has taken
   over is an AI that talks over your sales team.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Offered once the AI believes it has enough to hand over. */
const HANDOFF_ACTIONS = [
  { label: "Talk to our team", value: "__handoff__" },
  { label: "Continue with AI", value: "__continue__" },
];

/**
 * What we say when the model is unavailable — rate-limited, out of quota, or
 * down.
 *
 * Written to sound like a person who cannot answer *this particular thing*,
 * rather than a system reporting an outage: a visitor does not care that our
 * AI provider returned 429, and telling them so reads as an excuse. Every
 * variant hands them the same real next step.
 *
 * Rotated rather than fixed, because the same sentence three times in a row is
 * what makes a chat feel broken even when the fallback is working correctly.
 */
const FALLBACK_REPLIES = [
  "That's a good question, and I'd rather not guess at it. Shall I put you through to someone on the team who can answer it properly?",
  "I'm not able to answer that one myself. Our team can — would you like me to connect you?",
  "Sorry, that's outside what I can help with. Someone on the team would be better placed — shall I pass you over?",
];

const fallbackReply = (attempt: number) =>
  FALLBACK_REPLIES[attempt % FALLBACK_REPLIES.length]!;

/** Broadcast a stored message to the browser and to any watching dashboard. */
async function publish(conversationId: string, message: unknown) {
  await emitToConversation(conversationId, EVENTS.message, message);
  await emitToAgents(EVENTS.message, { conversationId, message });
}

/**
 * Handle one inbound message from the website client.
 *
 * Returns immediately after persisting; the AI reply or relay is awaited too,
 * because a serverless invocation that returns early gets frozen and the work
 * would never finish.
 */
export async function handleClientMessage(
  conversation: ConversationDoc,
  text: string,
): Promise<void> {
  const stored = await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "client",
    senderId: conversation.clientId,
    channel: "website",
    message: text,
    status: "sent",
  });
  if (stored) await publish(conversation.conversationId, serialiseMessage(stored));

  // A human has the thread: relay, do not answer.
  if (conversation.status === "HUMAN_ACTIVE" || conversation.status === "WAITING_FOR_AGENT") {
    const result = await relayToAgent(conversation, text);
    if (!result.ok) {
      // Tell the client honestly rather than leaving the message in limbo.
      const notice = await appendMessage({
        conversationId: conversation.conversationId,
        senderType: "system",
        channel: "website",
        message:
          "We're having trouble reaching the team right now. Your message is saved and someone will pick it up shortly.",
      });
      if (notice) await publish(conversation.conversationId, serialiseMessage(notice));
      logger.error(
        { conversationId: conversation.conversationId, error: result.error },
        "chat: relay failed",
      );
    }
    return;
  }

  if (!aiMayRespond(conversation)) return;

  await runAiTurn(conversation);
}

/** Generate and publish one AI reply. */
export async function runAiTurn(conversation: ConversationDoc): Promise<void> {
  await emitToConversation(conversation.conversationId, EVENTS.typing, { typing: true });

  try {
    const history = await getAiHistory(conversation.conversationId, 40);
    const previous = conversation.leadData as unknown as LeadData;
    const turn = await generateTurn(history, previous);

    await updateLeadData(conversation, turn.leadData, turn.leadScore);

    // Offer the handoff as buttons, but only once — repeating it every turn
    // reads as nagging.
    const alreadyOffered = Boolean(conversation.handoffRequestedAt);
    const actions =
      turn.readyForHandoff && !alreadyOffered
        ? HANDOFF_ACTIONS
        : turn.suggestions.map((s) => ({ label: s, value: s }));

    if (turn.readyForHandoff && !alreadyOffered) {
      // Mark the offer so it is not repeated, without changing state.
      conversation.handoffRequestedAt = new Date();
      await conversation.save();
    }

    const stored = await appendMessage({
      conversationId: conversation.conversationId,
      senderType: "ai",
      channel: "website",
      message: turn.reply,
      actions,
    });
    if (stored) await publish(conversation.conversationId, serialiseMessage(stored));

    await emitToAgents(EVENTS.conversationUpdated, serialiseConversation(conversation));
  } catch (error) {
    const unavailable = error instanceof GeminiUnavailableError;
    logger.error(
      { conversationId: conversation.conversationId, err: String(error) },
      unavailable ? "chat: gemini unavailable" : "chat: ai turn failed",
    );

    // Never leave the client staring at a typing indicator. Degrade to a reply
    // that reads naturally and still hands them the human path. Which variant
    // is chosen rotates on the conversation's own length, so a visitor who
    // hits this twice does not see the identical sentence.
    const stored = await appendMessage({
      conversationId: conversation.conversationId,
      senderType: "ai",
      channel: "website",
      message: fallbackReply(conversation.lastSequence),
      actions: HANDOFF_ACTIONS,
    });
    if (stored) await publish(conversation.conversationId, serialiseMessage(stored));
  } finally {
    await emitToConversation(conversation.conversationId, EVENTS.typing, { typing: false });
  }
}

/**
 * Client asked for a human. Summarise, create the Lead, alert a front caller,
 * and park the conversation.
 */
export async function requestHandoff(conversation: ConversationDoc): Promise<void> {
  if (conversation.status === "HUMAN_ACTIVE" || conversation.status === "WAITING_FOR_AGENT") {
    return;
  }

  const notice = await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "system",
    channel: "website",
    message: "Connecting you with our team...",
  });
  if (notice) await publish(conversation.conversationId, serialiseMessage(notice));

  const result = await performHandoff(conversation);

  const confirmation = await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "ai",
    channel: "website",
    message: result.notified
      ? `I've passed your details to ${result.agentName ?? "our team"}. Someone will be with you shortly — feel free to keep typing here in the meantime.`
      : "I've saved your details and the team has been notified. Someone will be with you shortly.",
  });
  if (confirmation) await publish(conversation.conversationId, serialiseMessage(confirmation));

  await emitStatus(conversation.conversationId, "WAITING_FOR_AGENT", {
    agentName: result.agentName,
  });
  await emitToAgents(EVENTS.conversationUpdated, {
    ...serialiseConversation(conversation),
    aiSummary: result.summary,
  });
}

/** Client chose to stay with the AI. */
export async function declineHandoff(conversation: ConversationDoc): Promise<void> {
  const stored = await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "ai",
    channel: "website",
    message: "No problem — what else would you like to know?",
  });
  if (stored) await publish(conversation.conversationId, serialiseMessage(stored));
}

/**
 * An agent replied — from WhatsApp or the dashboard. Store it, push it to the
 * browser, and lock the AI out for good.
 */
export async function deliverAgentMessage(
  conversation: ConversationDoc,
  text: string,
  options: { channel: "whatsapp" | "website"; agentId?: string; externalMessageId?: string },
): Promise<void> {
  const stored = await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "agent",
    senderId: options.agentId ?? null,
    channel: options.channel,
    message: text,
    externalMessageId: options.externalMessageId ?? null,
  });

  // Null means a duplicate webhook delivery; it is already in the transcript.
  if (!stored) return;

  const first = conversation.status !== "HUMAN_ACTIVE";
  if (first) {
    await transition(conversation, "HUMAN_ACTIVE");
    await emitStatus(conversation.conversationId, "HUMAN_ACTIVE");
    await emitToConversation(conversation.conversationId, EVENTS.agentJoined, {
      conversationId: conversation.conversationId,
    });
  }

  await publish(conversation.conversationId, serialiseMessage(stored));
}
