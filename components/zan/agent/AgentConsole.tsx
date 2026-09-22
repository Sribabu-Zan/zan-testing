"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, Hand, LogOut, MessageSquare, RefreshCw, Send } from "lucide-react";
import Pusher from "pusher-js";
import {
  agentTokenServerSnapshot,
  agentTokenSnapshot,
  closeConversation,
  getConversation,
  listConversations,
  readAgentToken,
  replyTo,
  signOut,
  subscribeAgentToken,
  takeOver,
  type ConversationDetail,
  type QueueRow,
} from "./api";
import { cn } from "@/lib/utils";
import { LoginForm } from "./LoginForm";
import { MessageBubble } from "../chat/MessageBubble";
import { groupMessages } from "../chat/grouping";

const SCORE_STYLE: Record<string, string> = {
  HIGH: "bg-danger/10 text-danger",
  MEDIUM: "bg-brand-soft text-brand-ink",
  LOW: "bg-surface-2 text-ink-2",
};

const STATUS_LABEL: Record<string, string> = {
  AI_ACTIVE: "AI handling",
  WAITING_FOR_AGENT: "Waiting",
  HUMAN_ACTIVE: "You / team",
  CLOSED: "Closed",
};

/**
 * Agent console.
 *
 * The queue is live: an agent watching this screen sees a lead appear the
 * moment the handoff fires, without polling. Replies sent from here take the
 * exact same server path as a WhatsApp reply, so the client cannot tell which
 * the agent used — which is the entire point of the bridge.
 */
/**
 * One queue group. Declared at module scope, not inside AgentConsole: a
 * component created during render is a NEW type on every render, so React
 * unmounts and remounts the whole list — losing scroll position and focus.
 */
function QueueSection({
  title,
  items,
  selectedId,
  onSelect,
}: {
  title: string;
  items: QueueRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-eyebrow mb-2 flex items-center gap-2 text-muted">
        {title}
        <span className="rounded-full bg-surface-2 px-2 py-0.5 tabular-nums">{items.length}</span>
      </h2>
      <ul className="space-y-1.5">
        {items.map((row) => (
          <li key={row.conversationId}>
            <button
              type="button"
              onClick={() => onSelect(row.conversationId)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors",
                selectedId === row.conversationId
                  ? "border-brand-ink bg-brand-soft/40"
                  : "border-line bg-bg hover:border-line-strong",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-small font-medium text-ink">
                  {row.name ?? "Unnamed visitor"}
                </span>
                {row.leadScore && (
                  <span
                    className={cn(
                      "text-eyebrow shrink-0 rounded-full px-2 py-0.5",
                      SCORE_STYLE[row.leadScore],
                    )}
                  >
                    {row.leadScore}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-[0.8125rem] text-ink-2">
                {row.projectType ?? row.service ?? "Not yet classified"}
              </p>
              <p className="text-eyebrow mt-1.5 truncate text-muted">
                {[row.budget, row.timeline].filter(Boolean).join(" · ") || "No budget yet"}
              </p>
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-2 text-[0.8125rem] text-muted">Nothing here.</li>
        )}
      </ul>
    </div>
  );
}

export function AgentConsole() {
  /* useSyncExternalStore rather than an effect: sessionStorage does not exist
     during SSR, and reading it in an effect would set state on mount for every
     consumer. */
  const token = useSyncExternalStore(
    subscribeAgentToken,
    agentTokenSnapshot,
    agentTokenServerSnapshot,
  );
  const signedIn = Boolean(token);

  const [rows, setRows] = useState<QueueRow[]>([]);
  const [selected, setSelected] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * Fetch the queue. Deliberately starts with the await and touches no state
   * synchronously, so calling it from an effect does not trigger a cascading
   * render on mount. The spinner belongs to the button, below.
   */
  const refresh = useCallback(async () => {
    try {
      const data = await listConversations();
      setRows(data.conversations);
    } catch {
      // A 401 means the session expired; drop back to the login screen.
      signOut();
    }
  }, []);

  /** User-initiated refresh — this one may show a spinner. */
  const manualRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await refresh();
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const openConversation = useCallback(async (id: string) => {
    setSelected(await getConversation(id));
  }, []);

  // Initial load. Written inline rather than calling refresh() so the setState
  // is unambiguously inside an async continuation, and so an unmount mid-flight
  // cannot set state on a dead component.
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;

    void (async () => {
      const data = await listConversations().catch(() => null);
      if (cancelled) return;
      if (!data) {
        signOut();
        return;
      }
      setRows(data.conversations);
    })();

    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  // Live queue. Falls back to the manual refresh button when unconfigured.
  useEffect(() => {
    if (!signedIn) return;
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
    const token = readAgentToken();
    if (!key || !cluster || !token) return;

    const pusher = new Pusher(key, {
      cluster,
      authEndpoint: "/api/pusher/auth",
      auth: { headers: { authorization: `Bearer ${token}` } },
    });
    const channel = pusher.subscribe("private-agents");
    channel.bind("conversation-updated", () => void refresh());
    channel.bind("message", (payload: { conversationId: string }) => {
      void refresh();
      // Keep the open thread current without stealing focus from another one.
      setSelected((current) =>
        current && current.conversation.conversationId === payload.conversationId
          ? (void openConversation(payload.conversationId), current)
          : current,
      );
    });

    return () => {
      channel.unbind_all();
      pusher.disconnect();
    };
  }, [signedIn, refresh, openConversation]);

  if (!signedIn) return <LoginForm />;

  const waiting = rows.filter((r) => r.status === "WAITING_FOR_AGENT");
  const active = rows.filter((r) => r.status === "HUMAN_ACTIVE");
  const ai = rows.filter((r) => r.status === "AI_ACTIVE");

  const send = async () => {
    const text = draft.trim();
    if (!text || !selected) return;
    setDraft("");
    await replyTo(selected.conversation.conversationId, text);
    await openConversation(selected.conversation.conversationId);
  };

  return (
    <div className="mx-auto grid min-h-svh w-full max-w-[1500px] grid-cols-1 gap-0 lg:grid-cols-[340px_1fr]">
      {/* Queue */}
      <aside className="border-r border-line bg-bg p-5 lg:h-svh lg:overflow-y-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-h3 tracking-[-0.02em]">Leads</h1>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => void manualRefresh()}
              aria-label="Refresh"
              className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            </button>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        <QueueSection
          title="Waiting for agent"
          items={waiting}
          selectedId={selected?.conversation.conversationId ?? null}
          onSelect={(id) => void openConversation(id)}
        />
        <QueueSection
          title="With a human"
          items={active}
          selectedId={selected?.conversation.conversationId ?? null}
          onSelect={(id) => void openConversation(id)}
        />
        <QueueSection
          title="AI handling"
          items={ai}
          selectedId={selected?.conversation.conversationId ?? null}
          onSelect={(id) => void openConversation(id)}
        />
      </aside>

      {/* Thread */}
      <main className="flex flex-col lg:h-svh">
        {!selected ? (
          <div className="grid flex-1 place-items-center p-10 text-center">
            <div>
              <MessageSquare aria-hidden className="mx-auto size-8 text-muted" />
              <p className="mt-4 text-small text-ink-2">Select a lead to read the conversation.</p>
            </div>
          </div>
        ) : (
          <>
            <header className="border-b border-line bg-bg px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-h3 tracking-[-0.02em]">
                    {(selected.conversation.leadData.name as string) ?? "Unnamed visitor"}
                  </h2>
                  <p className="text-eyebrow mt-1 text-muted">
                    {STATUS_LABEL[selected.conversation.status]}
                    <span className="px-1.5">•</span>
                    {selected.conversation.conversationId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await takeOver(selected.conversation.conversationId);
                      await openConversation(selected.conversation.conversationId);
                      await refresh();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-small font-medium text-bg transition-colors hover:bg-brand-dark"
                  >
                    <Hand aria-hidden className="size-4" /> Take over
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await closeConversation(selected.conversation.conversationId);
                      await openConversation(selected.conversation.conversationId);
                      await refresh();
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-small font-medium text-ink transition-colors hover:border-ink"
                  >
                    <CheckCircle2 aria-hidden className="size-4" /> Close
                  </button>
                </div>
              </div>

              {selected.conversation.aiSummary && (
                <p className="mt-4 rounded-xl border border-line bg-surface p-3 text-[0.8125rem] leading-relaxed text-ink-2">
                  <span className="text-eyebrow mr-2 text-brand-ink">AI summary</span>
                  {selected.conversation.aiSummary}
                </p>
              )}
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto bg-surface px-6 py-6">
              {groupMessages(selected.messages).map(({ message, firstOfGroup, lastOfGroup }) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  agentName="Team"
                  firstOfGroup={firstOfGroup}
                  lastOfGroup={lastOfGroup}
                />
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex items-end gap-2 border-t border-line bg-bg px-6 py-4"
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder="Reply to the client…"
                aria-label="Reply"
                className="min-h-11 flex-1 resize-none rounded-2xl border border-line bg-bg px-4 py-2.5 text-small outline-none transition-colors focus:border-brand-ink"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-bg transition-colors hover:bg-brand-dark disabled:opacity-30"
              >
                <Send className="size-4" />
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
