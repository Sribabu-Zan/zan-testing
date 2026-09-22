import { z } from "zod";
import { connectDatabase } from "@/server/config/db";
import { createConversation, findConversation, getTranscript, newClientId, serialiseMessage } from "@/server/services/conversation.service";
import { openingTurn } from "@/server/services/gemini.service";
import { appendMessage } from "@/server/services/conversation.service";
import { signChatToken, verifyChatToken } from "@/server/lib/tokens";
import { clientIp, rateLimit } from "@/server/lib/rateLimit";
import { fail, ok, parseBody, route, tooMany } from "@/server/lib/http";

/** Mongoose and node:crypto both need the Node runtime, not Edge. */
export const runtime = "nodejs";

const bodySchema = z.object({
  /** Present when resuming; the browser keeps it in localStorage. */
  token: z.string().optional(),
  region: z.enum(["in", "us", "ae"]).optional(),
  referrer: z.string().max(500).optional(),
});

/**
 * POST /api/chat/session/
 *
 * Start a conversation, or resume the one this browser already owns. Resuming
 * matters more than it sounds: without it, a page navigation would strand the
 * client mid-handoff with an agent talking into a dead thread.
 */
export const POST = route(async (request: Request) => {
  const limit = await rateLimit(clientIp(request), "session", 20, 300);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  await connectDatabase();

  // ── Resume ──────────────────────────────────────────────────────────────
  if (parsed.data.token) {
    const claims = verifyChatToken(parsed.data.token);
    if (claims) {
      const existing = await findConversation(claims.conversationId);
      if (existing && existing.status !== "CLOSED") {
        const transcript = await getTranscript(existing.conversationId);
        const known = existing.leadData as unknown as { name?: string; email?: string; phone?: string };
        return ok({
          conversationId: existing.conversationId,
          token: parsed.data.token,
          status: existing.status,
          agentAssigned: Boolean(existing.assignedAgent),
          messages: transcript.map(serialiseMessage),
          // Prefills the contact card, so a returning visitor is not asked
          // twice for something they already gave us.
          contact: {
            name: known?.name ?? null,
            email: known?.email ?? null,
            phone: known?.phone ?? null,
          },
        });
      }
    }
    // An invalid or closed token falls through to a fresh conversation rather
    // than erroring — the visitor should never see a dead chat window.
  }

  // ── New ─────────────────────────────────────────────────────────────────
  const conversation = await createConversation({
    clientId: newClientId(),
    region: parsed.data.region ?? null,
    userAgent: request.headers.get("user-agent"),
    referrer: parsed.data.referrer ?? null,
  });

  // Fixed greeting, no model call: the first paint should never wait on Gemini.
  const opening = openingTurn();
  const greeting = await appendMessage({
    conversationId: conversation.conversationId,
    senderType: "ai",
    channel: "website",
    message: opening.reply,
    actions: opening.suggestions.map((s) => ({ label: s, value: s })),
  });

  if (!greeting) return fail(500, "Could not start the conversation");

  return ok({
    conversationId: conversation.conversationId,
    token: signChatToken({
      conversationId: conversation.conversationId,
      clientId: conversation.clientId,
    }),
    status: conversation.status,
    agentAssigned: false,
    messages: [serialiseMessage(greeting)],
  });
});
