import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import "./ScrollFloat.css";

/**
 * A word whose letters stretch and rise out of a mask, one after another.
 *
 * entrance="scroll" (default): the word renders at rest, and the scroll scene
 *   that owns it animates the `[data-float-glyph]` elements in (see
 *   FrameToFullscreen). Reduced motion and no-JS keep it at rest.
 * entrance="load": a time-based CSS entrance that plays from first paint,
 *   for a word that is on screen when the page opens.
 *
 * Either way the outer `[data-float-char]` elements stay free for a scroll
 * driven exit.
 *
 * `gradient` gives the word the brand text gradient, sliced per letter so it
 * reads as one gradient across the word even while the letters move.
 */
export default function ScrollFloat({
  children,
  className,
  glyphClassName,
  gradient = false,
  entrance = "scroll",
  delay = 0.3,
  stagger = 0.06,
}: {
  children: string;
  className?: string;
  glyphClassName?: string;
  gradient?: boolean;
  entrance?: "scroll" | "load";
  /** entrance="load": seconds before the first letter starts. */
  delay?: number;
  /** entrance="load": seconds between letters. */
  stagger?: number;
}) {
  const chars = Array.from(children);
  return (
    <span className={cn("scroll-float", entrance === "load" && "scroll-float-load", className)}>
      {chars.map((char, i) => (
        <span key={i} data-float-char className="scroll-float-char">
          <span
            data-float-glyph
            data-reveal
            className={cn(
              "scroll-float-glyph",
              gradient && "text-brand-gradient scroll-float-gradient",
              glyphClassName,
            )}
            style={
              {
                "--i": i,
                "--n": chars.length,
                ...(entrance === "load" ? { animationDelay: `${(delay + i * stagger).toFixed(3)}s` } : null),
              } as CSSProperties
            }
          >
            {char === " " ? " " : char}
          </span>
        </span>
      ))}
    </span>
  );
}
