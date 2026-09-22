import { Schema, model, models, type Model, type InferSchemaType, type HydratedDocument } from "mongoose";
import { CHANNELS, MESSAGE_STATUSES, SENDER_TYPES } from "../types/domain";

const messageSchema = new Schema(
  {
    conversationId: { type: String, required: true, index: true },

    /** Who wrote it: the visitor, the model, a human agent, or the system. */
    senderType: { type: String, enum: SENDER_TYPES, required: true },
    /** Agent ObjectId, or the client's anonymous id. Null for ai/system. */
    senderId: { type: String, default: null },
    /** Where it physically travelled. */
    channel: { type: String, enum: CHANNELS, required: true },

    message: { type: String, required: true, maxlength: 4096 },

    /**
     * WhatsApp's own message id (wamid...).
     *
     * Sparse-unique, and it is what makes the webhook idempotent: Meta retries
     * deliveries, and a retry must not duplicate a message in the transcript.
     */
    externalMessageId: { type: String, default: null },

    status: { type: String, enum: MESSAGE_STATUSES, default: "sent", index: true },
    failureReason: { type: String, default: null },

    /** Position in the conversation. The client sorts on this. */
    sequence: { type: Number, required: true },

    /** Quick-reply chips or a handoff prompt attached to an AI message. */
    actions: {
      type: [
        new Schema(
          { label: { type: String, required: true }, value: { type: String, required: true } },
          { _id: false },
        ),
      ],
      default: [],
    },

    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

// Idempotency for WhatsApp webhook retries. Partial so the many website
// messages (which have no wamid) do not collide on null.
messageSchema.index(
  { externalMessageId: 1 },
  { unique: true, partialFilterExpression: { externalMessageId: { $type: "string" } } },
);

/** Transcript reads and ordering. */
messageSchema.index({ conversationId: 1, sequence: 1 }, { unique: true });

export type MessageDoc = HydratedDocument<InferSchemaType<typeof messageSchema>>;
export const Message =
  (models.Message as Model<InferSchemaType<typeof messageSchema>>) ??
  model("Message", messageSchema);
