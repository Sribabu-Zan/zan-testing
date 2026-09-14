"use client";

import dynamic from "next/dynamic";

/*
 * The panel, kept off the critical path.
 *
 * It pulls in the transcript, the contact card and (only where realtime is
 * configured) pusher-js, and the overwhelming majority of visitors never open
 * it. None of that has to exist before the page is interactive.
 *
 * `ssr: false` because the panel reads localStorage and starts a conversation
 * — it has nothing to contribute to the prerendered HTML — and that option is
 * only legal inside a Client Component, which is the whole reason this wrapper
 * exists rather than the option living on the dock.
 *
 * The dock renders this only after the visitor has chosen "Chat with us" for
 * the first time, so the chunk is not even requested before then.
 */
export const ChatPanelLazy = dynamic(() => import("./ChatPanel").then((m) => m.ChatPanel), {
  ssr: false,
});
