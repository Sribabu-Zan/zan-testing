import mongoose from "mongoose";
import { getEnv } from "./env";
import { logger } from "./logger";

/* ═══════════════════════════════════════════════════════════════════════════
   MONGO CONNECTION — serverless-shaped.

   Two problems this solves that a plain `mongoose.connect()` does not:

   1. Hot reload in dev re-executes modules, and each execution would open a
      fresh pool until Mongo refuses connections. The global cache survives
      module reloads.

   2. Serverless invocations reuse a warm container. Caching the *promise*, not
      just the connection, means concurrent cold requests await one handshake
      instead of racing to open several.
   ═══════════════════════════════════════════════════════════════════════════ */

interface Cache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as { __zanMongoose?: Cache };
const cache: Cache = (globalForMongoose.__zanMongoose ??= { conn: null, promise: null });

export async function connectDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);

    cache.promise = mongoose
      .connect(getEnv().MONGODB_URI, {
        // Small pool: each serverless container needs only a handful, and Atlas
        // caps total connections across all of them.
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
        // Buffering on would let a query issued while disconnected hang for
        // minutes; failing fast and letting the caller retry is better.
        bufferCommands: false,
      })
      .then((m) => {
        logger.info({}, "mongo: connected");
        return m;
      })
      .catch((err) => {
        // Clear the promise so the next request retries rather than awaiting a
        // permanently rejected one.
        cache.promise = null;
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
