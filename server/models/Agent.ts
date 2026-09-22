import { Schema, model, models, type Model, type InferSchemaType, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * A front caller.
 *
 * `whatsappPhone` is the identity that matters operationally — it is how an
 * inbound WhatsApp message is attributed to a person. `email`/`passwordHash`
 * exist only for the dashboard.
 *
 * `activeConversationId` is the routing fallback described in
 * services/whatsapp.service.ts: one WhatsApp number handles many conversations,
 * so when an agent replies without quoting a message we need to know which
 * thread they meant.
 */
const agentSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },

    /** E.164 digits, no "+" — the format the Cloud API returns and expects. */
    whatsappPhone: { type: String, required: true, unique: true, index: true },

    role: { type: String, enum: ["agent", "admin"], default: "agent" },
    isAvailable: { type: Boolean, default: true, index: true },

    /** Which thread this agent's un-quoted WhatsApp replies belong to. */
    activeConversationId: { type: String, default: null },

    /**
     * Last time this agent messaged US on WhatsApp. Opens the 24-hour
     * customer-service window during which we may send them free-form text;
     * outside it, only an approved template will deliver.
     */
    lastInboundAt: { type: Date, default: null },

    lastAssignedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

agentSchema.methods.verifyPassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export type AgentDoc = HydratedDocument<InferSchemaType<typeof agentSchema>> & {
  verifyPassword(plain: string): Promise<boolean>;
};
export const Agent =
  (models.Agent as Model<InferSchemaType<typeof agentSchema>>) ??
  model<InferSchemaType<typeof agentSchema>>("Agent", agentSchema);
