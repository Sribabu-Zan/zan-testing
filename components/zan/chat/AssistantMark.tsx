/**
 * The assistant's mark.
 *
 * The main app put a Lottie robot on the launcher and a sparkle icon in the
 * panel header. Neither ships here: the client does not want Lottie, and the
 * brief rules out sparkle glyphs. This is the replacement — a drawn speech
 * frame with a reply line inside it, in currentColor, so it takes the region's
 * accent, costs no request and animates nothing.
 */
export function AssistantMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* The frame, with a corner clipped off so it reads as spoken, not as a box. */}
      <path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4Z" />
      <path d="M8 9.25h8" />
      <path d="M8 12.25h4.5" />
    </svg>
  );
}
