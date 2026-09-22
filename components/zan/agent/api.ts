"use client";

import type { ChatMessage, ConversationState } from "../chat/types";

/* Dashboard API client. Token lives in sessionStorage, not localStorage: an
   agent session should not outlive the browser tab on a shared machine. */

const KEY = "zan.agent.token";

export const readAgentToken = (): string | null => {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const writeAgentToken = (token: string) => {
  try {
    window.sessionStorage.setItem(KEY, token);
  } catch {
    /* ignore */
  }
};

export const clearAgentToken = () => {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
};

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = readAgentToken();
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export interface QueueRow {
  conversationId: string;
  status: ConversationState;
  service: string | null;
  leadScore: "LOW" | "MEDIUM" | "HIGH" | null;
  name: string | null;
  projectType: string | null;
  budget: string | null;
  timeline: string | null;
  aiSummary: string | null;
  assignedAgent: { id: string; name: string } | null;
  lastMessageAt: string;
  handoffRequestedAt: string | null;
  createdAt: string;
}

export interface ConversationDetail {
  conversation: {
    conversationId: string;
    status: ConversationState;
    service: string | null;
    leadScore: string | null;
    leadData: Record<string, unknown>;
    aiSummary: string | null;
    whatsappPhoneNumber: string | null;
    region: string | null;
    createdAt: string;
    handoffRequestedAt: string | null;
  };
  messages: ChatMessage[];
}

export const login = (email: string, password: string) =>
  call<{ token: string; agent: { id: string; name: string; role: string } }>("/agent/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const listConversations = (status?: string) =>
  call<{ conversations: QueueRow[] }>(
    `/agent/conversations${status ? `?status=${status}` : ""}`,
  );

export const getConversation = (id: string) =>
  call<ConversationDetail>(`/agent/conversations/${id}`);

export const replyTo = (id: string, message: string) =>
  call<{ sent: boolean }>(`/agent/conversations/${id}/message`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

export const takeOver = (id: string) =>
  call<{ status: string; agentName: string }>(`/agent/conversations/${id}/takeover`, {
    method: "POST",
  });

export const closeConversation = (id: string) =>
  call<{ status: string }>(`/agent/conversations/${id}/close`, { method: "POST" });

/* ── Session as an external store ──────────────────────────────────────────
   The token lives in sessionStorage, which does not exist during SSR. Exposing
   it as a subscribable store lets components read it with
   `useSyncExternalStore` instead of a setState-in-effect, so there is no
   cascading render on mount and every consumer stays in step when one of them
   signs out. */

const listeners = new Set<() => void>();

const notify = () => listeners.forEach((fn) => fn());

export function subscribeAgentToken(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** null on the server and during hydration, then the real value. */
export const agentTokenSnapshot = (): string | null => readAgentToken();
export const agentTokenServerSnapshot = (): string | null => null;

const originalWrite = writeAgentToken;
const originalClear = clearAgentToken;

export function signIn(token: string) {
  originalWrite(token);
  notify();
}

export function signOut() {
  originalClear();
  notify();
}
