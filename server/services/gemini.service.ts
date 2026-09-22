import { GoogleGenAI, Type } from "@google/genai";
import { getEnv } from "../config/env";
import { logger } from "../config/logger";
import {
  EMPTY_LEAD_DATA,
  SERVICE_CATEGORIES,
  SERVICE_LABELS,
  type LeadData,
  type LeadScore,
  type ServiceCategory,
} from "../types/domain";

/* ═══════════════════════════════════════════════════════════════════════════
   GEMINI
   The model does four things: hold the conversation, classify the service,
   extract a structured brief, and write the handoff summary.

   What it deliberately does NOT do is act. It has no tools, no database
   handle and no WhatsApp access — it returns data, and this service's callers
   decide what to do with it. A model that can trigger a WhatsApp blast is a
   model that can be talked into triggering one.
   ═══════════════════════════════════════════════════════════════════════════ */

let client: GoogleGenAI | null = null;

/** True when a key is configured at all. */
export const isConfigured = (): boolean => Boolean(getEnv().GEMINI_API_KEY);

/** Lazily constructed: the API key is not read until a request needs it. */
function ai(): GoogleGenAI {
  const apiKey = getEnv().GEMINI_API_KEY;
  if (!apiKey) throw new GeminiUnavailableError("GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export interface TurnHistory {
  role: "user" | "model";
  text: string;
}

/** What one AI turn produces. */
export interface AiTurn {
  reply: string;
  leadData: LeadData;
  leadScore: LeadScore;
  readyForHandoff: boolean;
  /** Quick-reply chips to render under the reply. Empty for open questions. */
  suggestions: string[];
}

const SYSTEM_PROMPT = `
You are the lead qualification assistant for Zan Services, a digital engineering
company with offices in Kolkata (India), Dubai (UAE) and Sacramento (USA). Zan
builds web platforms, mobile apps, AI systems, blockchain products, cloud
infrastructure and runs digital marketing.

YOUR JOB
Have a natural conversation with a prospective client and work out what they
need, so a human colleague can pick it up with full context.

You need, eventually: the service category, what they are building, their key
requirements, budget range, timeline, and their name, email and WhatsApp number.

HOW TO ASK
- One question at a time. Never a list, never a form.
- Ask what follows naturally from what they just said. If they say "an app like
  Rapido", the next question is whether they need the rider app, the driver app,
  or both — not "what is your budget?".
- Acknowledge what they told you before asking the next thing.
- Skip anything you can already infer. If they said "launch before Diwali", you
  have the timeline; do not ask again.
- Keep replies to two or three short sentences. This is a chat window.
- Contact details come LAST, once they are engaged. Asking for a phone number in
  the first two turns loses the lead.

TONE
Direct, warm, competent. British-neutral English. No exclamation marks stacked
up, no "Absolutely!", no emoji unless they use them first.

HONESTY
- Never invent prices, timelines or delivery promises. Ranges are fine as
  ballparks; specific quotes are for the human team.
- If they ask something you cannot answer, say a colleague will confirm it, and
  offer to connect them.
- Never claim to be human. If asked, say you are Zan's AI assistant.

HANDOFF
Set ready_for_handoff to true once you know the service, roughly what they are
building, and at least two of {requirements, budget, timeline} — or at any point
if they ask to speak to a person, ask for a quote, or seem ready to buy.

OUTPUT
Return JSON matching the schema. "reply" is what the client sees. Carry forward
every field you already knew; null means genuinely unknown, never "unchanged".
"suggestions" are up to four short tappable answers (2-4 words) when the
question has natural options; an empty array when it is open-ended.
`.trim();

/** Response schema. Forcing a shape here is what keeps parsing deterministic. */
const turnSchema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    service: { type: Type.STRING, enum: [...SERVICE_CATEGORIES], nullable: true },
    project_type: { type: Type.STRING, nullable: true },
    requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
    budget: { type: Type.STRING, nullable: true },
    timeline: { type: Type.STRING, nullable: true },
    technology: { type: Type.ARRAY, items: { type: Type.STRING } },
    name: { type: Type.STRING, nullable: true },
    email: { type: Type.STRING, nullable: true },
    phone: { type: Type.STRING, nullable: true },
    lead_score: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
    ready_for_handoff: { type: Type.BOOLEAN },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["reply", "requirements", "technology", "lead_score", "ready_for_handoff", "suggestions"],
} as const;

/** Never let the model widen a field back to null once we have a value. */
function mergeLeadData(previous: LeadData, incoming: Partial<LeadData>): LeadData {
  const keep = <T>(next: T | null | undefined, prev: T | null): T | null =>
    next === null || next === undefined || next === "" ? prev : next;

  return {
    service: keep(incoming.service, previous.service),
    projectType: keep(incoming.projectType, previous.projectType),
    // Union, not replace: the model tends to restate only the newest items.
    requirements: dedupe([...previous.requirements, ...(incoming.requirements ?? [])]),
    budget: keep(incoming.budget, previous.budget),
    timeline: keep(incoming.timeline, previous.timeline),
    technology: dedupe([...previous.technology, ...(incoming.technology ?? [])]),
    name: keep(incoming.name, previous.name),
    email: keep(incoming.email, previous.email),
    phone: keep(incoming.phone, previous.phone),
  };
}

const dedupe = (items: string[]): string[] => {
  const seen = new Map<string, string>();
  for (const item of items) {
    const value = item.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (!seen.has(key)) seen.set(key, value);
  }
  return [...seen.values()].slice(0, 25);
};

/** Greeting for a brand-new conversation. Fixed text — no model call needed. */
export function openingTurn(): AiTurn {
  return {
    reply:
      "Hi — I'm Zan's AI assistant. Tell me what you're looking to build and I'll work out how we can help.",
    leadData: { ...EMPTY_LEAD_DATA },
    leadScore: "LOW",
    readyForHandoff: false,
    suggestions: ["Web app", "Mobile app", "AI / ML", "Something else"],
  };
}

/**
 * One conversational turn.
 *
 * Throws `GeminiUnavailableError` on failure so the caller can fall back to a
 * holding reply rather than dropping the client's message.
 */
export async function generateTurn(
  history: TurnHistory[],
  previous: LeadData,
): Promise<AiTurn> {
  const known = JSON.stringify(previous);

  if (!isConfigured()) {
    // Surfaced as the normal unavailable path so callers need no special case.
    logger.warn({}, "gemini: no API key configured, using fallback reply");
    throw new GeminiUnavailableError("GEMINI_API_KEY is not set");
  }

  try {
    const response = await withRetry(() =>
      ai().models.generateContent({
      model: getEnv().GEMINI_MODEL,
      contents: history.map((turn) => ({
        role: turn.role,
        parts: [{ text: turn.text }],
      })),
      config: {
        systemInstruction: `${SYSTEM_PROMPT}\n\nWhat you already know about this lead:\n${known}`,
        responseMimeType: "application/json",
        responseSchema: turnSchema,
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
      }),
    );

    const raw = response.text;
    if (!raw) throw new Error("empty response");

    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return {
      reply: String(parsed.reply ?? "").trim() || "Could you tell me a little more about that?",
      leadData: mergeLeadData(previous, {
        service: (parsed.service as ServiceCategory) ?? null,
        projectType: (parsed.project_type as string) ?? null,
        requirements: (parsed.requirements as string[]) ?? [],
        budget: (parsed.budget as string) ?? null,
        timeline: (parsed.timeline as string) ?? null,
        technology: (parsed.technology as string[]) ?? [],
        name: (parsed.name as string) ?? null,
        email: (parsed.email as string) ?? null,
        phone: (parsed.phone as string) ?? null,
      }),
      leadScore: (parsed.lead_score as LeadScore) ?? "LOW",
      readyForHandoff: Boolean(parsed.ready_for_handoff),
      suggestions: ((parsed.suggestions as string[]) ?? []).slice(0, 4),
    };
  } catch (error) {
    logger.error({ err: error }, "gemini: turn failed");
    throw new GeminiUnavailableError(error);
  }
}

/**
 * The handoff summary a front caller reads before picking up the thread.
 * Falls back to a deterministic summary built from leadData if the model is
 * down — a handoff must never be blocked on the AI being available.
 */
export async function generateSummary(
  history: TurnHistory[],
  leadData: LeadData,
): Promise<string> {
  if (!isConfigured()) return buildFallbackSummary(leadData);

  try {
    const response = await ai().models.generateContent({
      model: getEnv().GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Summarise this sales conversation for the colleague taking it over. " +
                "Two or three sentences, plain English, no bullet points, no greeting. " +
                "State what the client wants to build, the scale of it, and anything " +
                "they have said about budget or timeline. Do not invent detail.\n\n" +
                `Structured brief: ${JSON.stringify(leadData)}\n\n` +
                `Transcript:\n${history.map((t) => `${t.role === "user" ? "Client" : "AI"}: ${t.text}`).join("\n")}`,
            },
          ],
        },
      ],
      config: { temperature: 0.3, maxOutputTokens: 400 },
    });

    const text = response.text?.trim();
    if (text) return text;
    throw new Error("empty summary");
  } catch (error) {
    logger.warn({ err: error }, "gemini: summary failed, using deterministic fallback");
    return buildFallbackSummary(leadData);
  }
}

/** Summary with no model involved. Plain, and always available. */
export function buildFallbackSummary(lead: LeadData): string {
  const parts: string[] = [];
  const service = lead.service ? SERVICE_LABELS[lead.service] : "a digital project";
  parts.push(`Client is enquiring about ${service}`);
  if (lead.projectType) parts.push(`specifically ${lead.projectType}`);
  const detail: string[] = [];
  if (lead.requirements.length) detail.push(`Key requirements: ${lead.requirements.join(", ")}.`);
  if (lead.budget) detail.push(`Budget: ${lead.budget}.`);
  if (lead.timeline) detail.push(`Timeline: ${lead.timeline}.`);
  return `${parts.join(", ")}. ${detail.join(" ")}`.trim();
}

export class GeminiUnavailableError extends Error {
  constructor(readonly cause: unknown) {
    super("Gemini is unavailable");
    this.name = "GeminiUnavailableError";
  }
}

/**
 * Rate limits (429) and capacity blips (503) are usually over in a second or
 * two — surfacing them to a visitor as "I can\'t help" would be wrong. One
 * retry after a short pause absorbs the common case.
 *
 * A *daily* quota exhaustion also returns 429 and will not recover in a
 * second, so we retry once and no more: the caller then degrades gracefully
 * rather than the visitor waiting through a backoff ladder.
 */
async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status !== 429 && status !== 503) throw error;

    logger.warn({ status }, "gemini: transient failure, retrying once");
    await new Promise((resolve) => setTimeout(resolve, status === 429 ? 2000 : 800));
    return operation();
  }
}
