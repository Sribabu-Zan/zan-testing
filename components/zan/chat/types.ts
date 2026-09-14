/* ───────────────────────────────────────────────────────────────────────────
   The chat wire format.

   Ported from the main Zan app (zan_webdevelopment/src/lib/chat/types.ts),
   which mirrors its server's domain types. Keep the three in step: this page
   does not own the conversation, it renders one.
   ─────────────────────────────────────────────────────────────────────────── */

export type ConversationState = "AI_ACTIVE" | "WAITING_FOR_AGENT" | "HUMAN_ACTIVE" | "CLOSED";
export type SenderType = "client" | "ai" | "agent" | "system";
export type Channel = "website" | "whatsapp";
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface ChatAction {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  channel: Channel;
  message: string;
  status: MessageStatus;
  sequence: number;
  actions: ChatAction[];
  timestamp: string;
}

export interface KnownContact {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface SessionResponse {
  conversationId: string;
  token: string;
  status: ConversationState;
  agentAssigned: boolean;
  messages: ChatMessage[];
  /** What we already know, so the contact card can prefill. */
  contact?: KnownContact;
}

/** Connection health, surfaced in the UI so a stall is never silent. */
export type ConnectionState = "connecting" | "online" | "offline" | "error";
