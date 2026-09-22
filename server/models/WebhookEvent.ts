import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

/**
 * Webhook idempotency ledger.
 *
 * Meta retries a webhook until it gets a 200, and a retry can arrive while the
 * first delivery is still being processed. Message-level dedupe on `wamid`
 * covers text, but status callbacks (sent/delivered/read) carry the same id
 * repeatedly, so we record every event we have already handled.
 *
 * TTL of 3 days: long enough to outlast Meta's retry schedule, short enough
 * that the collection never becomes a liability.
 */
const webhookEventSchema = new Schema({
  /** `${wamid}:${eventType}` — unique per meaningful event, not per delivery. */
  eventKey: { type: String, required: true, unique: true },
  receivedAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 3 },
});

export const WebhookEvent =
  (models.WebhookEvent as Model<InferSchemaType<typeof webhookEventSchema>>) ??
  model("WebhookEvent", webhookEventSchema);

/**
 * Claim an event. Returns false when it has already been processed, in which
 * case the caller should acknowledge and do nothing else.
 */
export async function claimWebhookEvent(eventKey: string): Promise<boolean> {
  try {
    await WebhookEvent.create({ eventKey });
    return true;
  } catch (error) {
    // Duplicate key means another delivery already claimed it.
    if ((error as { code?: number }).code === 11000) return false;
    throw error;
  }
}
