/* ═══════════════════════════════════════════════════════════════════════════
   SHARED DOMAIN TYPES
   Mirrored on the frontend in src/lib/chat/types.ts. Keep the two in step.
   ═══════════════════════════════════════════════════════════════════════════ */

export const CONVERSATION_STATES = [
  "AI_ACTIVE",
  "WAITING_FOR_AGENT",
  "HUMAN_ACTIVE",
  "CLOSED",
] as const;
export type ConversationState = (typeof CONVERSATION_STATES)[number];

export const SENDER_TYPES = ["client", "ai", "agent", "system"] as const;
export type SenderType = (typeof SENDER_TYPES)[number];

export const CHANNELS = ["website", "whatsapp"] as const;
export type Channel = (typeof CHANNELS)[number];

export const MESSAGE_STATUSES = ["pending", "sent", "delivered", "read", "failed"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const LEAD_SCORES = ["LOW", "MEDIUM", "HIGH"] as const;
export type LeadScore = (typeof LEAD_SCORES)[number];

export const SERVICE_CATEGORIES = [
  "web_development",
  "mobile_app",
  "ai_ml",
  "blockchain_web3",
  "ui_ux_design",
  "cloud_devops",
  "software_development",
  "other",
] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

/** Human-readable labels, used in WhatsApp notifications and the dashboard. */
export const SERVICE_LABELS: Record<ServiceCategory, string> = {
  web_development: "Web Development",
  mobile_app: "Mobile App Development",
  ai_ml: "AI / Machine Learning",
  blockchain_web3: "Blockchain / Web3",
  ui_ux_design: "UI/UX Design",
  cloud_devops: "Cloud / DevOps",
  software_development: "Software Development",
  other: "Custom / Other",
};

/** The structured brief the AI maintains across the conversation. */
export interface LeadData {
  service: ServiceCategory | null;
  projectType: string | null;
  requirements: string[];
  budget: string | null;
  timeline: string | null;
  technology: string[];
  name: string | null;
  email: string | null;
  phone: string | null;
}

export const EMPTY_LEAD_DATA: LeadData = {
  service: null,
  projectType: null,
  requirements: [],
  budget: null,
  timeline: null,
  technology: [],
  name: null,
  email: null,
  phone: null,
};
