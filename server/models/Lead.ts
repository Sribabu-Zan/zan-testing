import { Schema, model, models, type Model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { LEAD_SCORES, SERVICE_CATEGORIES } from "../types/domain";

/**
 * The qualified lead, extracted from a conversation at handoff.
 *
 * Separate from Conversation on purpose: a conversation is a transcript that
 * may go nowhere, a Lead is a commercial record that sales owns. One
 * conversation produces at most one Lead, and the Lead survives the transcript
 * being closed or archived.
 */
const leadSchema = new Schema(
  {
    conversationId: { type: String, required: true, unique: true, index: true },

    name: { type: String, default: null },
    email: { type: String, default: null, index: true },
    /** E.164 digits, no "+". Indexed because sales searches by number. */
    phone: { type: String, default: null, index: true },

    service: { type: String, enum: [...SERVICE_CATEGORIES, null], default: null, index: true },
    projectType: { type: String, default: null },
    requirements: { type: [String], default: [] },
    budget: { type: String, default: null },
    timeline: { type: String, default: null },
    technology: { type: [String], default: [] },

    leadScore: { type: String, enum: LEAD_SCORES, default: "LOW", index: true },
    aiSummary: { type: String, default: null },

    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "won", "lost"],
      default: "new",
      index: true,
    },

    assignedAgent: { type: Schema.Types.ObjectId, ref: "Agent", default: null },
    region: { type: String, default: null },
  },
  { timestamps: true },
);

leadSchema.index({ leadScore: 1, createdAt: -1 });

export type LeadDoc = HydratedDocument<InferSchemaType<typeof leadSchema>>;
export const Lead =
  (models.Lead as Model<InferSchemaType<typeof leadSchema>>) ?? model("Lead", leadSchema);
