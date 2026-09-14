"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type PusherClient from "pusher-js";
import type { Channel } from "pusher-js";
import {
  ChatApiError,
  fetchHistory,
  sendMessage,
  setHandoff,
  startSession,
  submitLead,
} from "./api";
import { clearToken, readToken, writeToken } from "./storage";
import type { ChatMessage, ConnectionState, ConversationState, KnownContact } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   CHAT CLIENT

   Owns the whole client side of one conversation: session, transcript,
   realtime subscription and reconnection.

   The rule that shapes everything: the SERVER's message log is the truth and
   `sequence` is its order. The socket is an optimisation — every message it
   delivers is already durable, so a dropped connection costs latency, never
   data. On reconnect we ask for everything past the highest sequence we hold.

   Ported from the main app's src/lib/chat/useChat.ts. One change: pusher-js is
   imported dynamically, and only when a key and cluster are configured. Most
   of the time (and always in local development) they are not, so the realtime
   library is never fetched at all and the panel runs over HTTP.
   ═══════════════════════════════════════════════════════════════════════════ */

interface UseChatOptions {
  /** Nothing happens until the panel is first opened. */
  enabled: boolean;
  region?: string;
}

export interface ChatController {
  messages: ChatMessage[];
  status: ConversationState;
  connection: ConnectionState;
  agentTyping: boolean;
  aiTyping: boolean;
  agentName: string | null;
  error: string | null;
  ready: boolean;
  /** Anything we already hold, for prefilling the contact card. */
  contact: KnownContact;
  send: (text: string) => Promise<void>;
  submitContact: (details: { name: string; phone: string; email?: string }) => Promise<void>;
  requestHandoff: () => Promise<void>;
  declineHandoff: () => Promise<void>;
  reset: () => Promise<void>;
}

/**
 * What to put in front of the visitor when a call fails.
 *
 * The server's own errors are written for a person, so they pass through. A
 * network failure is not: `fetch` rejects with "Failed to fetch", which is a
 * developer's sentence, and printing it in the transcript makes the panel look
 * broken rather than unreachable. It also happens to be the case where the two
 * other ways of getting in touch still work, so it says so.
 */
const reason = (err: unknown, fallback: string) =>
  err instanceof ChatApiError && err.message ? err.message : fallback;

/** Local echo, shown before the server has acknowledged the message. */
const isOptimistic = (message: ChatMessage) => message.id.startsWith("pending-");

/**
 * Insert keeping `sequence` order, ignoring anything already present.
 *
 * Optimistic echoes need explicit retirement. They are keyed on a fractional
 * sequence so they sort after the last real message, which means the server's
 * copy — arriving on an integer sequence — does not overwrite them and the
 * visitor sees their own message twice. So once a real client message with the
 * same text lands, the echo it was standing in for is dropped.
 */
function merge(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const bySequence = new Map(existing.map((m) => [m.sequence, m]));
  for (const message of incoming) bySequence.set(message.sequence, message);

  const all = [...bySequence.values()];
  const confirmed = new Set(
    all.filter((m) => !isOptimistic(m) && m.senderType === "client").map((m) => m.message),
  );

  return all
    .filter((m) => !(isOptimistic(m) && confirmed.has(m.message)))
    .sort((a, b) => a.sequence - b.sequence);
}

export function useChat({ enabled, region }: UseChatOptions): ChatController {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ConversationState>("AI_ACTIVE");
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [aiTyping, setAiTyping] = useState(false);
  const [agentTyping] = useState(false);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [contact, setContact] = useState<KnownContact>({ name: null, email: null, phone: null });

  const tokenRef = useRef<string | null>(null);
  const typingGuard = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pusherRef = useRef<PusherClient | null>(null);
  const channelRef = useRef<Channel | null>(null);
  // Read inside socket callbacks, which close over their first render.
  const highestSequence = useRef(0);

  /**
   * Show or hide the typing indicator.
   *
   * Turning it ON always arms a timeout that turns it back off. The indicator
   * previously had exactly one route to `false` on the success path — a Pusher
   * `typing` event — so any realtime hiccup left it spinning forever even
   * though the reply had already arrived over HTTP. It looked like the chat had
   * hung, and only a reload cleared it.
   */
  const showTyping = useCallback((on: boolean, ceilingMs = 45_000) => {
    if (typingGuard.current) {
      clearTimeout(typingGuard.current);
      typingGuard.current = null;
    }
    setAiTyping(on);
    if (on) {
      typingGuard.current = setTimeout(() => setAiTyping(false), ceilingMs);
    }
  }, []);

  const applyMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => {
      const next = merge(current, incoming);
      highestSequence.current = next.at(-1)?.sequence ?? highestSequence.current;
      return next;
    });
  }, []);

  /** Pull anything we missed while disconnected. */
  const reconcile = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      const data = await fetchHistory(token, highestSequence.current);
      if (data.messages.length) applyMessages(data.messages);
      setStatus(data.status);
    } catch {
      /* Next reconnect will retry; do not surface a transient gap. */
    }
  }, [applyMessages]);

  // ── Session + subscription ───────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    (async () => {
      try {
        setConnection("connecting");
        const session = await startSession({
          token: readToken() ?? undefined,
          region,
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
        });
        if (cancelled) return;

        tokenRef.current = session.token;
        writeToken(session.token);
        setStatus(session.status);
        applyMessages(session.messages);
        if (session.contact) setContact(session.contact);
        setReady(true);

        const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
        if (!key || !cluster) {
          // Realtime unconfigured — the normal case in local development. The
          // panel is fully functional over HTTP (send reconciles, and the poll
          // below covers agent replies), so this is a quieter mode, not an
          // error. pusher-js is never downloaded.
          setConnection("offline");
          return;
        }

        const { default: Pusher } = await import("pusher-js");
        if (cancelled) return;

        const pusher = new Pusher(key, {
          cluster,
          authEndpoint: "/api/pusher/auth",
          auth: { headers: { authorization: `Bearer ${session.token}` } },
        });
        pusherRef.current = pusher;

        pusher.connection.bind("connected", () => {
          setConnection("online");
          setError(null);
          // Always reconcile on (re)connect — this is the recovery path.
          void reconcile();
        });
        pusher.connection.bind("connecting", () => setConnection("connecting"));
        pusher.connection.bind("unavailable", () => setConnection("offline"));
        pusher.connection.bind("failed", () => setConnection("error"));
        pusher.connection.bind("disconnected", () => setConnection("offline"));

        const channel = pusher.subscribe(`private-conversation-${session.conversationId}`);
        channelRef.current = channel;

        channel.bind("message", (message: ChatMessage) => applyMessages([message]));
        channel.bind("typing", (payload: { typing: boolean }) => showTyping(payload.typing));
        channel.bind(
          "status",
          (payload: {
            status?: ConversationState;
            agentName?: string;
            messageId?: string;
            messageStatus?: string;
          }) => {
            if (payload.status) setStatus(payload.status);
            if (payload.agentName) setAgentName(payload.agentName);
            if (payload.messageId && payload.messageStatus) {
              setMessages((current) =>
                current.map((m) =>
                  m.id === payload.messageId
                    ? { ...m, status: payload.messageStatus as ChatMessage["status"] }
                    : m,
                ),
              );
            }
          },
        );
        channel.bind("agent-joined", (payload: { agentName?: string }) => {
          setStatus("HUMAN_ACTIVE");
          if (payload.agentName) setAgentName(payload.agentName);
        });
      } catch (err) {
        if (cancelled) return;
        setConnection("error");
        setError(
          reason(
            err,
            "We cannot reach the assistant right now. WhatsApp or the enquiry form will still get through to us.",
          ),
        );
      }
    })();

    return () => {
      cancelled = true;
      channelRef.current?.unbind_all();
      pusherRef.current?.disconnect();
      pusherRef.current = null;
      channelRef.current = null;
    };
  }, [enabled, region, applyMessages, reconcile, showTyping]);

  /*
   * Polling fallback. Only runs when realtime is NOT connected and a human is
   * on the thread — the one case where a message can arrive with nothing on the
   * client having asked for it. With Pusher up this never fires.
   */
  useEffect(() => {
    if (!enabled) return;
    if (connection === "online") return;
    if (status !== "HUMAN_ACTIVE" && status !== "WAITING_FOR_AGENT") return;

    const id = setInterval(() => void reconcile(), 5000);
    return () => clearInterval(id);
  }, [enabled, connection, status, reconcile]);

  // Release the typing ceiling if the panel goes away mid-request.
  useEffect(
    () => () => {
      if (typingGuard.current) clearTimeout(typingGuard.current);
    },
    [],
  );

  // A tab woken from background may have missed messages while throttled.
  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => document.visibilityState === "visible" && void reconcile();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, reconcile]);

  const send = useCallback(
    async (text: string) => {
      const token = tokenRef.current;
      if (!token || !text.trim()) return;

      // Optimistic echo, on a sequence above anything real, so the input feels
      // instant. The server's copy replaces it by sequence on arrival.
      const optimistic: ChatMessage = {
        id: `pending-${Date.now()}`,
        conversationId: "",
        senderType: "client",
        channel: "website",
        message: text,
        status: "pending",
        sequence: highestSequence.current + 0.5,
        actions: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((current) => [...current, optimistic]);
      if (status === "AI_ACTIVE") showTyping(true);

      try {
        await sendMessage(token, text);
        setError(null);
        // Pull the result over HTTP rather than waiting for the socket. The
        // POST resolves only after the server finished the AI turn or the
        // relay, so the reply is already durable — this makes the chat work
        // correctly with realtime unconfigured or down, and realtime becomes
        // a latency optimisation rather than a dependency.
        await reconcile();
      } catch (err) {
        setMessages((current) =>
          current.map((m) => (m.id === optimistic.id ? { ...m, status: "failed" } : m)),
        );
        setError(reason(err, "That message did not send. Please try again in a moment."));
      } finally {
        showTyping(false);
      }
    },
    [status, reconcile, showTyping],
  );

  /** Submit contact details; the server captures them and hands off. */
  const submitContact = useCallback(
    async (details: { name: string; phone: string; email?: string }) => {
      const token = tokenRef.current;
      if (!token) return;
      try {
        await submitLead(token, details);
        setContact({ name: details.name, phone: details.phone, email: details.email ?? null });
        setStatus("WAITING_FOR_AGENT");
        await reconcile();
      } finally {
        showTyping(false);
      }
    },
    [reconcile, showTyping],
  );

  const requestHandoff = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    try {
      setStatus("WAITING_FOR_AGENT");
      await setHandoff(token, "request");
      await reconcile();
    } catch (err) {
      setError(reason(err, "We could not reach the team just now. Please try again in a moment."));
    }
  }, [reconcile]);

  const declineHandoff = useCallback(async () => {
    const token = tokenRef.current;
    if (!token) return;
    await setHandoff(token, "decline").catch(() => undefined);
    await reconcile();
  }, [reconcile]);

  /** Abandon this thread and start a fresh one. */
  const reset = useCallback(async () => {
    clearToken();
    tokenRef.current = null;
    highestSequence.current = 0;
    setMessages([]);
    setStatus("AI_ACTIVE");
    setAgentName(null);
    setReady(false);
    const session = await startSession({ region });
    tokenRef.current = session.token;
    writeToken(session.token);
    applyMessages(session.messages);
    setReady(true);
  }, [region, applyMessages]);

  return useMemo(
    () => ({
      messages,
      status,
      connection,
      agentTyping,
      aiTyping,
      agentName,
      error,
      ready,
      contact,
      send,
      submitContact,
      requestHandoff,
      declineHandoff,
      reset,
    }),
    [
      messages,
      status,
      connection,
      agentTyping,
      aiTyping,
      agentName,
      error,
      ready,
      contact,
      send,
      submitContact,
      requestHandoff,
      declineHandoff,
      reset,
    ],
  );
}
