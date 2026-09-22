import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectDatabase } from "@/server/config/db";
import { Agent } from "@/server/models/Agent";
import { signAgentToken } from "@/server/lib/tokens";
import { clientIp, rateLimit } from "@/server/lib/rateLimit";
import { fail, ok, parseBody, route, tooMany } from "@/server/lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

/** POST /api/agent/login/ */
export const POST = route(async (request: Request) => {
  // Strict: this is the one endpoint worth brute-forcing.
  const limit = await rateLimit(clientIp(request), "login", 10, 600);
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const parsed = await parseBody(request, bodySchema);
  if (!parsed.ok) return parsed.response;

  await connectDatabase();
  const agent = await Agent.findOne({ email: parsed.data.email.toLowerCase() }).select(
    "+passwordHash",
  );

  // Compare against a dummy hash when the account does not exist, so response
  // time does not reveal which emails are registered.
  const hash = agent?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const valid = await bcrypt.compare(parsed.data.password, hash);

  if (!agent || !valid) return fail(401, "Invalid email or password");

  return ok({
    token: signAgentToken({ agentId: String(agent._id), role: agent.role as "agent" | "admin" }),
    agent: {
      id: String(agent._id),
      name: agent.name,
      email: agent.email,
      role: agent.role,
      isAvailable: agent.isAvailable,
    },
  });
});
