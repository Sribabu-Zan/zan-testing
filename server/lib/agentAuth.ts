import { connectDatabase } from "../config/db";
import { Agent } from "../models/Agent";
import { bearerFrom, verifyAgentToken } from "./tokens";

/**
 * Resolve the agent behind a request, or null.
 *
 * The token is verified AND the agent re-read from the database, so revoking
 * someone's access is a delete rather than a wait for their JWT to expire.
 */
export async function requireAgent(request: Request) {
  const token = bearerFrom(request);
  if (!token) return null;

  const claims = verifyAgentToken(token);
  if (!claims) return null;

  await connectDatabase();
  const agent = await Agent.findById(claims.agentId);
  return agent ?? null;
}
