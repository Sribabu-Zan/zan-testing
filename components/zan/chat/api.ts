import type { ChatMessage, ConversationState, SessionResponse } from "./types";

/* ───────────────────────────────────────────────────────────────────────────
   THE CHAT ENDPOINTS

   They are not implemented here. They belong to the main Zan app, and in
   development that app runs on a different port, so next.config.ts rewrites
   /api/chat/* and /api/pusher/* to it on the server. Every call below is
   therefore same-origin: no CORS, no preflight, no second host in the client,
   and nothing to change the day this page is served by the main app itself.

   No trailing slashes. The main app sets `trailingSlash: true` and its own
   copy of this file ends every path in "/"; this app does not, so a slash
   here would be 308-redirected BEFORE the rewrite ran and a redirected POST
   can arrive with no body. The rewrite's destination adds it back.
   ─────────────────────────────────────────────────────────────────────────── */

const BASE = "/api";

export class ChatApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...rest } = init;
  const response = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new ChatApiError(response.status, body.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export const startSession = (input: { token?: string; region?: string; referrer?: string }) =>
  request<SessionResponse>("/chat/session", { method: "POST", body: JSON.stringify(input) });

export const sendMessage = (token: string, message: string) =>
  request<{ accepted: boolean }>("/chat/message", {
    method: "POST",
    token,
    body: JSON.stringify({ message }),
  });

export const setHandoff = (token: string, action: "request" | "decline") =>
  request<{ status: ConversationState }>("/chat/handoff", {
    method: "POST",
    token,
    body: JSON.stringify({ action }),
  });

/**
 * Capture contact details and hand off in one call. Deliberately not two
 * requests: a visitor who submits and then hits a failed handoff has given us
 * their number for nothing.
 */
export const submitLead = (
  token: string,
  details: { name: string; phone: string; email?: string },
) =>
  request<{ status: ConversationState }>("/chat/lead", {
    method: "POST",
    token,
    body: JSON.stringify(details),
  });

/** Everything past `afterSequence` — used to reconcile after a dropped socket. */
export const fetchHistory = (token: string, afterSequence: number) =>
  request<{ status: ConversationState; agentAssigned: boolean; messages: ChatMessage[] }>(
    `/chat/history?after=${afterSequence}`,
    { method: "GET", token },
  );
