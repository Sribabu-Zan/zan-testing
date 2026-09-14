import { Check, CheckCheck, CircleAlert, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./types";

const TIME = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

/**
 * Delivery ticks: one tick sent, two delivered, two in the accent read. People
 * already know how to read these, which is the whole argument for the pattern.
 */
function Ticks({ status }: { status: ChatMessage["status"] }) {
  const base = "size-3.5 shrink-0";
  switch (status) {
    case "pending":
      return <Clock aria-label="Sending" className={cn(base, "opacity-50")} />;
    case "delivered":
      return <CheckCheck aria-label="Delivered" className={cn(base, "opacity-70")} />;
    case "read":
      return <CheckCheck aria-label="Read" className={cn(base, "text-brand-ink")} />;
    case "failed":
      return <CircleAlert aria-label="Not delivered" className={cn(base, "text-danger")} />;
    default:
      return <Check aria-label="Sent" className={cn(base, "opacity-70")} />;
  }
}

/** The pointer on the first bubble of a run. Drawn, not a rotated box, so it
    keeps a crisp edge against the wallpaper. */
function Tail({ side }: { side: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 8 13"
      className={cn(
        "absolute top-0 size-[13px]",
        side === "left" ? "-left-[7px] text-bg" : "-right-[7px] text-brand-soft",
      )}
    >
      <path d={side === "left" ? "M8 0 L8 13 L0 0 Z" : "M0 0 L0 13 L8 0 Z"} fill="currentColor" />
    </svg>
  );
}

export interface BubbleProps {
  message: ChatMessage;
  agentName: string | null;
  /** First of a run from the same sender — gets the name and the tail. */
  firstOfGroup: boolean;
  /** Last of a run — carries the extra spacing below. */
  lastOfGroup: boolean;
}

/**
 * One message: tailed bubbles, the visitor on the right in a tinted bubble,
 * timestamp and ticks tucked inside the bubble's bottom edge.
 *
 * A system line is centred and unattributed — it narrates what happened to the
 * conversation rather than being something a participant said, so styling it
 * as a bubble would make "Connecting you with our team" read as a claim by a
 * person.
 */
export function MessageBubble({ message, agentName, firstOfGroup, lastOfGroup }: BubbleProps) {
  const time = TIME.format(new Date(message.timestamp));

  if (message.senderType === "system") {
    return (
      <div className="my-2 flex justify-center">
        <p className="rounded-lg border border-line bg-bg/90 px-3 py-1.5 text-center text-eyebrow tracking-normal text-ink-2">
          {message.message}
        </p>
      </div>
    );
  }

  const isClient = message.senderType === "client";
  const isAgent = message.senderType === "agent";

  return (
    <div
      className={cn(
        "flex",
        isClient ? "justify-end" : "justify-start",
        lastOfGroup ? "mb-2" : "mb-0.5",
      )}
    >
      <div
        className={cn(
          "relative max-w-[85%] rounded-lg px-2.5 pt-1.5 pb-1 shadow-sm",
          isClient ? "bg-brand-soft" : "border border-line bg-bg",
          // Square off the tailed corner so the pointer reads as part of it.
          firstOfGroup && (isClient ? "rounded-tr-none" : "rounded-tl-none"),
        )}
      >
        {firstOfGroup && <Tail side={isClient ? "right" : "left"} />}

        {/* Only a human gets a name label — the assistant's identity is in the
            header, and repeating it above every bubble is noise. */}
        {isAgent && firstOfGroup && agentName && (
          <p className="mb-0.5 text-[0.75rem] font-semibold text-brand-ink">{agentName}</p>
        )}

        {/*
          The trailing pad reserves room for the timestamp, which floats over
          the bubble's bottom-right. It is why a short message sits on one line
          with the time beside it instead of pushing it onto a line of its own.
        */}
        <p className="text-small leading-[1.45] whitespace-pre-wrap text-ink">
          {message.message}
          <span className="inline-block w-[4.5rem] select-none" aria-hidden="true" />
        </p>

        <span className="absolute right-2.5 bottom-1 flex items-center gap-1 text-[0.6875rem] tabular-nums text-ink-2">
          {time}
          {isClient && <Ticks status={message.status} />}
        </span>
      </div>
    </div>
  );
}
