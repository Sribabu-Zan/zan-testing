import type { ChatMessage } from "./types";

/**
 * Consecutive messages from the same sender read as one utterance, so only the
 * first gets a tail and only the last gets the spacing below it. Without this
 * every line carries its own pointer and the column looks like confetti.
 *
 * A gap of more than five minutes starts a new group even from the same
 * sender: it is a new thought, and dating it separately helps.
 */
const GROUP_GAP_MS = 5 * 60 * 1000;

export interface Grouped {
  message: ChatMessage;
  firstOfGroup: boolean;
  lastOfGroup: boolean;
}

export function groupMessages(messages: ChatMessage[]): Grouped[] {
  return messages.map((message, i) => {
    const previous = messages[i - 1];
    const next = messages[i + 1];

    const sameAs = (other?: ChatMessage) =>
      Boolean(
        other &&
          other.senderType === message.senderType &&
          other.senderType !== "system" &&
          Math.abs(new Date(other.timestamp).getTime() - new Date(message.timestamp).getTime()) <
            GROUP_GAP_MS,
      );

    return {
      message,
      firstOfGroup: !sameAs(previous),
      lastOfGroup: !sameAs(next),
    };
  });
}
