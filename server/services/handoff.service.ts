import { getEnv } from "../config/env";
import { logger } from "../config/logger";
import { Agent } from "../models/Agent";
import { Lead } from "../models/Lead";
import { Message } from "../models/Message";
import type { ConversationDoc } from "../models/Conversation";
import { SERVICE_LABELS, type LeadData, type LeadScore } from "../types/domain";
import { generateSummary, buildFallbackSummary } from "./gemini.service";
import {
  OUTSIDE_WINDOW_CODE,
  sendTemplate,
  sendText,
  withinServiceWindow,
} from "./whatsapp.service";
import { appendMessage, getAiHistory, transition } from "./conversation.service";

/* ═══════════════════════════════════════════════════════════════════════════
   HUMAN HANDOFF
   Summarise → persist the Lead → notify a front caller on WhatsApp → park the
   conversation in WAITING_FOR_AGENT.

   The order matters. The Lead is written BEFORE the notification goes out, so
   a WhatsApp outage costs us a notification, never the lead itself.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Pick a front caller. Available agents first, least-recently-assigned of those
 * — a crude round-robin, but it stops every lead landing on whoever happens to
 * sort first. Falls back to any agent so a lead is never orphaned.
 */
export async function pickAgent() {
  return (
    (await Agent.findOne({ isAvailable: true }).sort({ lastAssignedAt: 1 })) ??
    (await Agent.findOne().sort({ lastAssignedAt: 1 }))
  );
}

/** "-" rather than an empty string: WhatsApp rejects blank template parameters. */
const orDash = (value: string | null | undefined) => (value && value.trim()) || "-";

const listOr = (items: string[], fallback = "-") =>
  items.length ? items.join(", ") : fallback;

/**
 * The free-form version, sent when we are inside the 24-hour window.
 *
 * No lead score: it is an internal triage signal for the dashboard, and it
 * tells the person about to dial nothing they can use. What they need is who
 * to call, on what number, and enough of the brief to open the conversation
 * without asking the client to repeat themselves.
 */
function formatLeadMessage(lead: LeadData, summary: string, conversationId: string): string {
  const service = lead.service ? SERVICE_LABELS[lead.service] : "Not yet identified";

  const lines = [
    "🔔 NEW LEAD — from the website chat",
    "",
    `👤 ${orDash(lead.name)}`,
    `📞 ${orDash(lead.phone)}`,
    `✉️ ${orDash(lead.email)}`,
    "",
    `Service:   ${service}`,
    `Project:   ${orDash(lead.projectType)}`,
    `Budget:    ${orDash(lead.budget)}`,
    `Timeline:  ${orDash(lead.timeline)}`,
  ];

  if (lead.requirements.length) {
    lines.push("", "What they need:", ...lead.requirements.map((r) => `  • ${r}`));
  }
  if (lead.technology.length) {
    lines.push("", `Tech mentioned: ${lead.technology.join(", ")}`);
  }

  lines.push("", "In summary:", summary);
  lines.push("", `Ref: ${conversationId}`, "Reply to this message to talk to them in the website chat.");

  return lines.join("\n");
}

/**
 * Parameters for the approved template, used outside the 24-hour window.
 *
 * Order is fixed by the template body — see scripts/whatsapp-template.mjs,
 * which is the source of truth for both. Values are capped because Meta limits
 * a template body to roughly 1,024 characters in total, and a long requirements
 * list would otherwise push the whole send over and fail it.
 */
function templateParams(lead: LeadData, summary: string, conversationId: string): string[] {
  return [
    orDash(lead.name),
    orDash(lead.phone),
    orDash(lead.email),
    lead.service ? SERVICE_LABELS[lead.service] : "Not yet identified",
    orDash(lead.projectType).slice(0, 90),
    listOr(lead.requirements).slice(0, 180),
    orDash(lead.budget),
    orDash(lead.timeline),
    summary.slice(0, 320),
    conversationId,
  ];
}

export interface HandoffResult {
  agentId: string | null;
  agentName: string | null;
  summary: string;
  notified: boolean;
  /** Set when the notification could not be delivered, for the dashboard. */
  notificationError?: string;
}

/**
 * Run the handoff. Safe to call more than once — a second call re-notifies but
 * does not duplicate the Lead.
 */
export async function performHandoff(conversation: ConversationDoc): Promise<HandoffResult> {
  const leadData = conversation.leadData as unknown as LeadData;
  const leadScore = (conversation.leadScore ?? "MEDIUM") as LeadScore;

  // 1 ── Summary. Never allowed to block the handoff, so it falls back.
  let summary: string;
  try {
    const history = await getAiHistory(conversation.conversationId, 60);
    summary = await generateSummary(history, leadData);
  } catch (error) {
    logger.warn({ err: error }, "handoff: summary failed, using fallback");
    summary = buildFallbackSummary(leadData);
  }
  conversation.aiSummary = summary;

  // 2 ── Persist the Lead before anything can fail downstream.
  await Lead.findOneAndUpdate(
    { conversationId: conversation.conversationId },
    {
      $set: {
        conversationId: conversation.conversationId,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        service: leadData.service,
        projectType: leadData.projectType,
        requirements: leadData.requirements,
        budget: leadData.budget,
        timeline: leadData.timeline,
        technology: leadData.technology,
        leadScore,
        aiSummary: summary,
        region: conversation.meta?.region ?? null,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  // 3 ── Assign, and park the conversation.
  const agent = await pickAgent();
  if (agent) {
    conversation.assignedAgent = agent._id;
    conversation.whatsappPhoneNumber = agent.whatsappPhone;
    agent.lastAssignedAt = new Date();
    // Bind this thread so the agent's un-quoted replies route here.
    agent.activeConversationId = conversation.conversationId;
    await agent.save();
  } else {
    logger.error({ conversationId: conversation.conversationId }, "handoff: no agent configured");
  }
  await conversation.save();
  await transition(conversation, "WAITING_FOR_AGENT");

  if (!agent) {
    return {
      agentId: null,
      agentName: null,
      summary,
      notified: false,
      notificationError: "No agent configured",
    };
  }

  // 4 ── Notify. Template first when we are outside the 24-hour window,
  //      because free-form simply will not deliver there.
  const params = templateParams(leadData, summary, conversation.conversationId);
  const inWindow = withinServiceWindow(agent.lastInboundAt);

  let result = inWindow
    ? await sendText(
        agent.whatsappPhone,
        formatLeadMessage(leadData, summary, conversation.conversationId),
      )
    : await sendTemplate(agent.whatsappPhone, getEnv().WHATSAPP_LEAD_TEMPLATE, params);

  // If we believed we were in the window and Meta disagreed, retry as template.
  if (!result.ok && result.errorCode === OUTSIDE_WINDOW_CODE) {
    logger.info({ agent: agent.whatsappPhone }, "handoff: window closed, retrying as template");
    result = await sendTemplate(agent.whatsappPhone, getEnv().WHATSAPP_LEAD_TEMPLATE, params);
  }

  // 5 ── Record the notification in the transcript so the thread is complete.
  await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "system",
    channel: "whatsapp",
    message: `Lead handed to ${agent.name}.`,
    externalMessageId: result.messageId,
    status: result.ok ? "sent" : "failed",
    // Persisted, not just logged: a failed handoff is exactly when someone
    // goes looking in the database, and "status: failed" alone does not say
    // whether it was an unverified recipient, an expired token or a closed
    // 24-hour window.
    failureReason: result.ok
      ? null
      : `${result.errorCode ?? "?"}: ${result.errorMessage ?? "Send failed"}`,
  });

  if (!result.ok) {
    logger.error(
      { conversationId: conversation.conversationId, error: result.errorMessage },
      "handoff: notification failed",
    );
  }

  return {
    agentId: String(agent._id),
    agentName: agent.name,
    summary,
    notified: result.ok,
    ...(result.ok ? {} : { notificationError: result.errorMessage ?? "Send failed" }),
  };
}

/**
 * Relay a client's website message to the front caller on WhatsApp.
 *
 * Prefixed with the client's name so an agent handling several threads on one
 * phone can tell them apart at a glance.
 */
export async function relayToAgent(
  conversation: ConversationDoc,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!conversation.whatsappPhoneNumber) return { ok: false, error: "No agent bound" };

  const leadData = conversation.leadData as unknown as LeadData;
  const who = leadData.name ?? "Client";
  const result = await sendText(conversation.whatsappPhoneNumber, `${who}: ${text}`);

  if (result.messageId) {
    // Attach the wamid to the stored client message so its delivery callbacks
    // can be matched back to it.
    await Message.findOneAndUpdate(
      { conversationId: conversation.conversationId, message: text, senderType: "client" },
      { $set: { externalMessageId: result.messageId } },
      { sort: { sequence: -1 } },
    );
  }

  if (!result.ok) {
    const outside = result.errorCode === OUTSIDE_WINDOW_CODE;
    logger.error(
      { conversationId: conversation.conversationId, outside, error: result.errorMessage },
      "relay: failed",
    );
    return {
      ok: false,
      error: outside
        ? "The agent's WhatsApp session has expired. They need to message us to reopen it."
        : result.errorMessage,
    };
  }
  return { ok: true };
}
