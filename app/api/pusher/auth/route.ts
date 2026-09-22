import { authoriseChannel, conversationChannel, AGENTS_CHANNEL } from "@/server/lib/realtime";
import { bearerFrom, verifyAgentToken, verifyChatToken } from "@/server/lib/tokens";
import { forbidden, ok, route, unauthorized } from "@/server/lib/http";

export const runtime = "nodejs";

/**
 * POST /api/pusher/auth/
 *
 * Private-channel authorisation. Without this, anyone who learned a
 * conversation id could subscribe and read a stranger's chat — the id being
 * unguessable is obscurity, not access control.
 *
 * Pusher's client sends this as form-encoded, not JSON.
 */
export const POST = route(async (request: Request) => {
  const form = await request.formData();
  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");
  if (!socketId || !channel) return unauthorized();

  const token = bearerFrom(request) ?? String(form.get("token") ?? "");
  if (!token) return unauthorized();

  // ── Agent dashboard channel ─────────────────────────────────────────────
  if (channel === AGENTS_CHANNEL) {
    const agent = verifyAgentToken(token);
    if (!agent) return forbidden();
    return ok(
      authoriseChannel(socketId, channel, { id: agent.agentId, role: agent.role }),
    );
  }

  // ── A single conversation ───────────────────────────────────────────────
  // Agents may watch any conversation; a visitor may watch only their own.
  const agent = verifyAgentToken(token);
  if (agent) return ok(authoriseChannel(socketId, channel));

  const chat = verifyChatToken(token);
  if (!chat) return forbidden();
  if (channel !== conversationChannel(chat.conversationId)) return forbidden();

  return ok(authoriseChannel(socketId, channel));
});
