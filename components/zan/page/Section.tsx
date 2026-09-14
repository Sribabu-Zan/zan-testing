import type { ReactNode } from "react";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const GROUNDS = {
  bg: "bg-bg",
  surface: "bg-surface",
  surface2: "bg-surface-2",
} as const;

/**
 * One band of a standing page: a hairline, the page ground or a surface, and
 * an optional eyebrow + heading pair above the content. Deliberately plain —
 * these pages are read top to bottom, so the rhythm comes from the spacing and
 * the grounds alternating, not from a new device per section.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  aside,
  tone = "bg",
  children,
  className,
}: {
  id?: string;
  eyebrow?: string;
  /** One line. Section headings on these pages are short by design. */
  title?: string;
  lead?: string;
  /** Opposite the heading: a link, a note. */
  aside?: ReactNode;
  tone?: keyof typeof GROUNDS;
  children: ReactNode;
  className?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      /* One vertical scale for every standing page, deliberately tighter than
         the homepage's `py-section`: these bands are read in sequence rather
         than pinned one screen at a time. */
      className={cn(
        "scroll-mt-nav border-t border-line py-[clamp(3.5rem,2.6rem+3.8vw,6rem)]",
        GROUNDS[tone],
        className,
      )}
    >
      <div className="container-zan">
        {(eyebrow || title) && (
          <Reveal className="mb-10 flex flex-col gap-5 sm:mb-12 md:flex-row md:items-end md:justify-between md:gap-10">
            <div className="max-w-3xl">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              {title && (
                <h2 id={headingId} className={cn("font-display text-h1 text-balance text-ink", eyebrow && "mt-4")}>
                  {title}
                </h2>
              )}
              {lead && <p className="mt-5 max-w-[58ch] text-lead text-ink-2">{lead}</p>}
            </div>
            {aside && <div className="shrink-0">{aside}</div>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
