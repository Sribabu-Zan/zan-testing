import { Schema, model, models, type Model } from "mongoose";
import { connectDatabase } from "../config/db";
import { logger } from "../config/logger";

/* ═══════════════════════════════════════════════════════════════════════════
   RATE LIMITING — Mongo-backed on purpose.

   The usual in-memory limiter counts per process. Under serverless that means
   per container, so a caller gets the limit multiplied by however many
   containers the platform happens to spin up — i.e. no limit at all.

   A fixed window in Mongo costs one atomic upsert per request and is correct
   across every instance. The TTL index does the cleanup.
   ═══════════════════════════════════════════════════════════════════════════ */

const schema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
});

const RateLimit =
  (models.RateLimit as Model<{ key: string; count: number; expiresAt: Date }>) ??
  model("RateLimit", schema);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * @param identity  Caller identity — conversation id, agent id or IP.
 * @param scope     Endpoint name, so limits do not bleed across routes.
 */
export async function rateLimit(
  identity: string,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    await connectDatabase();

    // Bucket the window so every request inside it shares one key.
    const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
    const key = `${scope}:${identity}:${bucket}`;
    const expiresAt = new Date((bucket + 1) * windowSeconds * 1000);

    const doc = await RateLimit.findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    const count = doc?.count ?? 1;
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000)),
    };
  } catch (error) {
    // Fail OPEN. A limiter outage must not take the chatbot down with it — the
    // downstream endpoints all validate and size-cap their input anyway.
    logger.error({ err: String(error), scope }, "ratelimit: check failed, allowing");
    return { allowed: true, remaining: 0, retryAfterSeconds: 0 };
  }
}

/** Best-effort caller IP, for endpoints with no authenticated identity. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
