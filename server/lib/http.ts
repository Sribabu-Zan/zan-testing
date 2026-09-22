import { NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { logger } from "../config/logger";

/* Small helpers so every route handler answers in the same shape. */

export const ok = <T>(data: T, init?: ResponseInit) => NextResponse.json(data, init);

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status });

export const unauthorized = () => fail(401, "Unauthorised");
export const forbidden = () => fail(403, "Forbidden");
export const notFound = (what = "Not found") => fail(404, what);

export const tooMany = (retryAfterSeconds: number) =>
  NextResponse.json(
    { error: "Too many requests. Slow down." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );

/**
 * Parse and validate a JSON body.
 *
 * Returns a discriminated result rather than throwing, so handlers stay linear
 * and every validation failure produces the same 400 shape.
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: fail(400, "Body must be valid JSON") };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    return { ok: false, response: fail(400, "Validation failed", { details }) };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Wrap a handler so an unexpected throw becomes a 500 with a logged cause,
 * never a stack trace on the wire.
 */
export function route<C>(handler: (request: Request, context: C) => Promise<Response>) {
  return async (request: Request, context: C): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error.message : String(error), url: request.url },
        "route: unhandled error",
      );
      return fail(500, "Something went wrong on our side. Please try again.");
    }
  };
}

/**
 * Strip control characters and cap length before anything is stored, shown to
 * an agent, or forwarded to WhatsApp.
 */
export function sanitiseMessage(input: string, max = 4000): string {
  const CONTROL = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]", "g");
  return input.replace(CONTROL, "").trim().slice(0, max);
}
