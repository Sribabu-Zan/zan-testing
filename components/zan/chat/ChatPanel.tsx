"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Headset, RotateCcw, WifiOff, X } from "lucide-react";
import { getLenis } from "@/hooks/useLenis";
import { useRegion, useRegionId } from "@/lib/region";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/components/zan/shell/shellStore";
import { AssistantMark } from "./AssistantMark";
import { chatWallpaperStyle } from "./ChatWallpaper";
import { groupMessages } from "./grouping";
import { LeadCaptureCard } from "./LeadCaptureCard";
import { MessageBubble } from "./MessageBubble";
import { TypingDots } from "./TypingDots";
import { useChat } from "./useChat";
import type { ChatAction } from "./types";

/* ───────────────────────────────────────────────────────────────────────────
   THE ASSISTANT PANEL

   Ported from the main app's components/chatbot/Chatbot.tsx, minus its
   launcher (the Contact Us dock owns that now) and minus every Lottie: the
   robot animation is gone and the header's sparkle icon with it, replaced by
   the drawn AssistantMark. Nothing here loads a JSON animation or a player.

   Everything conversational is decided server-side. This renders a transcript,
   sends text, and reflects connection and conversation state — it holds no
   scripted answers, so it cannot drift from what the backend believes.
   ─────────────────────────────────────────────────────────────────────────── */

/** Action values the server sends that mean something to the UI, not the model. */
const HANDOFF = "__handoff__";
const CONTINUE = "__continue__";

const EASE = [0.16, 1, 0.3, 1] as const;
const PHONE = "(max-width: 767.98px)";

export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const region = useRegion();
  const regionId = useRegionId();
  const phone = useMediaQuery(PHONE);

  // The session is created the first time the panel is opened — no
  // conversation row, no model spend and nothing in localStorage for the
  // visitors who never ask for one.
  const chat = useChat({ enabled: open, region: regionId });

  const [draft, setDraft] = useState("");
  /* Shown when the visitor asks for a person, before the handoff fires. */
  const [capturing, setCapturing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep the newest message in view. A smooth glide is motion, so a visitor
  // who asked for less gets the jump instead.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [chat.messages, chat.aiTyping, capturing]);

  // Escape closes; the dock puts focus back on the Contact Us button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const focus = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => {
      cancelAnimationFrame(focus);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  /* Scroll lock, phones only. There the panel covers nearly the whole screen,
     so the page sliding behind it is just noise; on a desktop it is a small
     card in the corner and locking the page would be an overreach. */
  useEffect(() => {
    if (!open || !phone) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    getLenis()?.stop();
    return () => {
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      getLenis()?.start();
    };
  }, [open, phone]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void chat.send(text);
    inputRef.current?.focus();
  };

  const onAction = (action: ChatAction) => {
    // "Talk to our team" opens the contact card rather than handing off blind.
    // A handoff with no number reaches someone who cannot call back.
    if (action.value === HANDOFF) return setCapturing(true);
    if (action.value === CONTINUE) return void chat.declineHandoff();
    void chat.send(action.label);
  };

  // Only the newest message keeps its quick replies — leaving old chips live
  // invites answering a question three turns stale. They are hidden while the
  // contact card is up: the card already carries the two choices, and showing
  // both makes it unclear which one is in play.
  const lastMessage = chat.messages.at(-1);
  const actions =
    lastMessage?.senderType === "ai" && chat.status !== "HUMAN_ACTIVE" && !capturing
      ? lastMessage.actions
      : [];

  const waiting = chat.status === "WAITING_FOR_AGENT";
  const human = chat.status === "HUMAN_ACTIVE";
  const closed = chat.status === "CLOSED";

  /* The component stays mounted once the visitor has opened it for the first
     time — that is what keeps the transcript, the contact card's state and the
     session alive across a close and a reopen. Only the panel itself comes and
     goes, so AnimatePresence lives in here rather than around this component. */
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="Chat with Zan"
          tabIndex={-1}
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.35, ease: EASE }}
          className={cn(
            // Above the page, below the navbar (z-50), the mobile menu (z-60) and
            // the preloader (z-200).
            "fixed z-45 flex origin-bottom-right flex-col overflow-hidden rounded-3xl",
            "border border-line bg-bg shadow-float outline-none",
            // Anchored over the Contact Us button, which itself clears the home
            // indicator. The height cap subtracts what the panel is offset by AND
            // the navbar, so it can never run under the bar or off the top: a
            // landscape phone is only ~390px tall.
            "inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))]",
            "max-h-[min(calc(100dvh-11rem-env(safe-area-inset-bottom)),620px)]",
            "sm:inset-x-auto sm:right-6 sm:bottom-[5.75rem] sm:w-[26rem]",
          )}
        >
          {/* Header. Who you are talking to is the most important fact in here, so
              the identity changes the moment a person picks the thread up. */}
          <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full",
                human ? "bg-brand text-on-brand" : "bg-brand-soft text-brand-ink",
              )}
            >
              {human ? (
                <Headset aria-hidden="true" className="size-4" />
              ) : (
                <AssistantMark className="size-[1.125rem]" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-semibold text-ink">
                {human ? (chat.agentName ?? `${region.brandName} team`) : "Zan assistant"}
              </p>
              <p className="flex items-center gap-1.5 text-[0.6875rem] text-muted">
                {chat.connection === "connecting" && !chat.ready ? (
                  <>
                    <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-muted" />
                    Connecting
                  </>
                ) : chat.connection === "error" ? (
                  <>
                    <WifiOff aria-hidden="true" className="size-3" />
                    Offline
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                    {human ? "Live" : waiting ? "Getting someone" : `${region.office.city} team`}
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void chat.reset()}
              aria-label="Start a new conversation"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors duration-300 hover:bg-surface-2 hover:text-ink"
            >
              <RotateCcw aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close chat"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors duration-300 hover:bg-surface-2 hover:text-ink"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </header>

          {/* The transcript, on the wallpaper. The wallpaper is this element's own
              background rather than a child: an absolutely-positioned child scrolls
              away with the messages and leaves bare panel behind them. */}
          <div
            ref={scrollRef}
            data-lenis-prevent
            className="relative flex-1 overflow-y-auto overscroll-contain bg-surface"
            style={chatWallpaperStyle}
          >
            <div className="relative px-3.5 py-4">
              {/* Waiting for the first message. Not while the session itself
                  failed: dots that never resolve read as a hang, and the line
                  below already says what happened. */}
              {!chat.ready && chat.connection !== "error" && (
                <div className="flex justify-center py-6">
                  <TypingDots />
                </div>
              )}

              {groupMessages(chat.messages).map(({ message, firstOfGroup, lastOfGroup }) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  agentName={chat.agentName}
                  firstOfGroup={firstOfGroup}
                  lastOfGroup={lastOfGroup}
                />
              ))}

              {(chat.aiTyping || chat.agentTyping) && (
                <div className="mb-2 flex">
                  <TypingDots />
                </div>
              )}

              {capturing && !waiting && !human && (
                <LeadCaptureCard
                  initial={{
                    name: chat.contact.name ?? "",
                    phone: chat.contact.phone ?? "",
                    email: chat.contact.email ?? "",
                  }}
                  placeholder={`Phone, including ${region.dialCode}`}
                  onSubmit={async (details) => {
                    await chat.submitContact(details);
                    setCapturing(false);
                  }}
                  onCancel={() => {
                    setCapturing(false);
                    void chat.declineHandoff();
                  }}
                />
              )}

              {chat.error && (
                <p className="mb-2 rounded-lg border border-line bg-bg/90 px-4 py-2.5 text-center text-eyebrow tracking-normal text-ink-2">
                  {chat.error}
                </p>
              )}
            </div>
          </div>

          {/* Composer */}
          {!closed ? (
            <div className="border-t border-line bg-surface px-4 py-3">
              {actions.length > 0 && !chat.aiTyping && (
                <div data-lenis-prevent className="mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                  {actions.map((action) => (
                    <button
                      key={action.value}
                      type="button"
                      onClick={() => onAction(action)}
                      className={cn(
                        "rounded-full border px-3.5 py-2 text-small transition-colors duration-300",
                        action.value === HANDOFF
                          ? "border-brand bg-brand text-on-brand hover:bg-brand-dark"
                          : "border-line bg-bg text-ink hover:border-line-strong hover:text-brand-ink",
                      )}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={1}
                  maxLength={4000}
                  placeholder={human ? "Message the team" : "Type a message"}
                  aria-label="Message"
                  disabled={!chat.ready}
                  className={cn(
                    "min-h-11 flex-1 resize-none rounded-2xl border border-line bg-bg px-4 py-2.5",
                    // 16px minimum: below it, iOS Safari zooms the page on focus.
                    "text-[1rem] text-ink outline-none placeholder:text-muted",
                    "transition-colors duration-300 focus:border-brand-ink disabled:opacity-50",
                  )}
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || !chat.ready}
                  aria-label="Send"
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-full bg-brand text-on-brand",
                    "transition-colors duration-300 hover:bg-brand-dark",
                    // A disabled control should still read as a control, so it
                    // greys rather than fading to an apparent rendering artefact.
                    "disabled:bg-line-strong disabled:text-muted",
                  )}
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="border-t border-line bg-surface px-4 py-3 text-center">
              <button
                type="button"
                onClick={() => void chat.reset()}
                className="text-small font-medium text-brand-ink hover:underline"
              >
                Start a new conversation
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
