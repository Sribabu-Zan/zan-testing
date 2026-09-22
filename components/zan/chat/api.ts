import type { ChatMessage, ConversationState, SessionResponse } from "./types";

/* ───────────────────────────────────────────────────────────────────────────
   THE CHAT ENDPOINTS

   Local. Every path below is a Route Handler in this project's app/api — the
   endpoints were proxied to the main Zan app until this site grew its own
   backend, and the rewrites that did that are gone from next.config.ts. Same
   origin, no CORS, no second host, and no risk of the site proxying its own
   API back into itself once it is serving zanservices.com.

   No trailing slashes: this app does not set `trailingSlash`, so the routes
   answer on the bare path. Adding a slash would earn a 308, and a redirected
   POST can arrive with no body.
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
