import { Schema, model, models, type Model, type InferSchemaType, type HydratedDocument } from "mongoose";
import {
  CHANNELS,
  CONVERSATION_STATES,
  EMPTY_LEAD_DATA,
  LEAD_SCORES,
  SERVICE_CATEGORIES,
} from "../types/domain";

/**
 * ONE conversation spans BOTH channels.
 *
 * The client is on the website and the front caller is on WhatsApp, but there
 * is a single `conversationId` and a single message log. Splitting them would
 * make the transcript, the lead record and the agent's context all diverge.
 */
const leadDataSchema = new Schema(
  {
    service: { type: String, enum: [...SERVICE_CATEGORIES, null], default: null },
    projectType: { type: String, default: null },
    requirements: { type: [String], default: [] },
    budget: { type: String, default: null },
    timeline: { type: String, default: null },
    technology: { type: [String], default: [] },
    name: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    /** Public id. Everything client-facing uses this, never the ObjectId. */
    conversationId: { type: String, required: true, unique: true, index: true },

    /** Anonymous browser identity, so a returning visitor resumes their thread. */
    clientId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: CONVERSATION_STATES,
      default: "AI_ACTIVE",
      index: true,
    },

    assignedAgent: { type: Schema.Types.ObjectId, ref: "Agent", default: null, index: true },

    service: { type: String, enum: [...SERVICE_CATEGORIES, null], default: null },
    leadScore: { type: String, enum: [...LEAD_SCORES, null], default: null, index: true },
    leadData: { type: leadDataSchema, default: () => ({ ...EMPTY_LEAD_DATA }) },
    aiSummary: { type: String, default: null },

    /** The front caller's number this thread is bridged to, in E.164 digits. */
    whatsappPhoneNumber: { type: String, default: null, index: true },

    /** Monotonic per-conversation counter; the client orders on this, not on
        timestamps, which can collide or arrive out of order. */
    lastSequence: { type: Number, default: 0 },

    /** Channel the client themselves is using. Always "website" today, but the
        column is here so a future WhatsApp-first entry point does not need a
        migration. */
    clientChannel: { type: String, enum: CHANNELS, default: "website" },

    lastMessageAt: { type: Date, default: Date.now, index: true },
    handoffRequestedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    meta: {
      userAgent: { type: String, default: null },
      referrer: { type: String, default: null },
      /** Region the visitor was browsing (in | us | ae). */
      region: { type: String, default: null },
    },
  },
  { timestamps: true },
);

/** Dashboard's primary query: what is waiting, most urgent first. */
conversationSchema.index({ status: 1, lastMessageAt: -1 });

export type ConversationDoc = HydratedDocument<InferSchemaType<typeof conversationSchema>>;
/* `models.X ??` because Next re-executes this module on every hot reload, and
   mongoose throws OverwriteModelError when a name is compiled twice. */
export const Conversation =
  (models.Conversation as Model<InferSchemaType<typeof conversationSchema>>) ??
  model("Conversation", conversationSchema);
