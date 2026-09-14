import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ctas, whyUs, type Practice } from "@/constants/zan";
import { getServiceArt, SERVICE_PLATE } from "@/constants/serviceArt";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { SiteButtonLink, SiteLink } from "@/components/zan/services/SiteLinks";

/* ───────────────────────────────────────────────────────────────────────────
   Services deck panels: the editorial page each slab carries.

   Light grounds only, with ink text. The accents are the index numbers, the
   plates and at most one word of a headline.

   HEIGHT IS THE CONTRACT HERE. A deck panel is pinned by its bottom edge, so
   a panel taller than the screen has its top scrolled away — under the fixed
   navbar — for the whole of its pin. Two structural rules keep that from
   happening, and deck.css carries the rest:

     · From 64rem up the headline and the lead sit SIDE BY SIDE with the
       service grid beside neither of them: lede on one row, grid on the next,
       and the lead never wraps under the headline to add a third block. The
       headline is capped to the width of its own column (container query) so
       that stays true for the longest phrase on the deck.
     · The grid is one row from 64rem up and at most two below it, so a panel
       never grows a row it has no height for.

   Every vertical measure is a clamp against svh, so a short laptop gets a
   shorter rhythm and smaller headline instead of an overflowing panel.

   Class strings are joined with template literals, NOT cn(). tailwind-merge
   reads the custom size tokens (text-giant, text-eyebrow, text-lead …) as
   colours and drops them when a text colour follows.
   ─────────────────────────────────────────────────────────────────────────── */

export type DeckTone = "soft" | "plain" | "surface2" | "paper" | "surface";

interface ToneClasses {
  /** Ground and text colour of the slab. */
  slab: string;
  /** Hairlines. */
  rule: string;
  /** Index numbers. */
  index: string;
  eyebrow: "brand" | "current";
}

/* The edge a swinging slab shows against the panel under it: light on light
   would otherwise read as one sheet. At rest the shadow falls outside the
   panel and is clipped, so only the swing ever shows it. */
const SLAB_EDGE = "shadow-[0_-28px_60px_-36px_rgb(17_16_22/0.3)]";

export const DECK_TONES: Record<DeckTone, ToneClasses> = {
  soft: { slab: `bg-brand-soft text-ink ${SLAB_EDGE}`, rule: "border-ink/15", index: "text-brand-ink", eyebrow: "brand" },
  plain: { slab: `bg-bg text-ink ${SLAB_EDGE}`, rule: "border-line-strong", index: "text-brand-ink", eyebrow: "brand" },
  surface2: { slab: `bg-surface-2 text-ink ${SLAB_EDGE}`, rule: "border-ink/15", index: "text-brand-ink", eyebrow: "brand" },
  // Paper is warm and the same in every region. Gold brand-ink measures only
  // 4.49:1 on it, so its text accents stay ink; the plates keep the accent.
  paper: { slab: `bg-paper text-ink ${SLAB_EDGE}`, rule: "border-ink/15", index: "text-ink", eyebrow: "current" },
  surface: { slab: `bg-surface text-ink ${SLAB_EDGE}`, rule: "border-line-strong", index: "text-brand-ink", eyebrow: "brand" },
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Eyebrow row, hairline, giant headline beside its lead, an optional extra row, then the grid. */
export function DeckPanelBody({
  tone,
  eyebrow,
  meta,
  headingId,
  srPrefix,
  headline,
  lead,
  accentLast = false,
  extra,
  children,
}: {
  tone: DeckTone;
  eyebrow: string;
  meta?: string;
  headingId: string;
  /** Read before the headline by screen readers, e.g. the practice name. */
  srPrefix?: string;
  headline: readonly string[];
  lead?: string;
  /** Set the last phrase in brand-ink: the panel's one accent word. */
  accentLast?: boolean;
  /** A row between the headline and the grid, e.g. a stack of tools. */
  extra?: ReactNode;
  children: ReactNode;
}) {
  const t = DECK_TONES[tone];
  return (
    <div
      data-tone={tone}
      // --zan-deck-lines lets deck.css divide the screen's height budget by
      // the number of phrases, so a three-line headline sets smaller type
      // than a two-line one instead of overrunning the panel.
      style={{ "--zan-deck-lines": headline.length } as CSSProperties}
      className="zan-deck-panel container-zan flex flex-1 flex-col"
    >
      {/* The wrapper carries text-eyebrow so the shared Eyebrow inherits its
          size (its own text-eyebrow class is lost inside cn()). */}
      <div className="flex items-center justify-between gap-6 text-eyebrow">
        <Eyebrow tone={t.eyebrow}>{eyebrow}</Eyebrow>
        {meta && <p className="hidden font-mono text-ink-2 uppercase sm:block">{meta}</p>}
      </div>
      <hr className={`zan-deck-rule border-t ${t.rule}`} />

      <div className="zan-deck-lede">
        <div className="zan-deck-headcell">
          <h2 id={headingId} className="zan-deck-headline font-sans font-bold text-giant uppercase">
            {srPrefix && <span className="sr-only">{srPrefix}: </span>}
            {headline.map((line, i) => (
              <span key={i} className="block">
                {accentLast && i === headline.length - 1 ? <span className="text-brand-ink">{line}</span> : line}
              </span>
            ))}
          </h2>
        </div>
        {lead && <p className="zan-deck-lead text-lead text-ink-2">{lead}</p>}
      </div>

      {extra}
      {children}
    </div>
  );
}

/** A labelled row of tool chips. */
export function StackChips({ labelId, label, items }: { labelId: string; label: string; items: readonly string[] }) {
  return (
    <div className="zan-deck-chips flex flex-wrap items-center gap-x-5 gap-y-3">
      <p id={labelId} className="font-mono text-eyebrow text-ink-2 uppercase">
        {label}
      </p>
      <ul aria-labelledby={labelId} className="flex flex-wrap gap-2">
        {items.map((s) => (
          <li
            key={s}
            className="rounded-full border border-ink/15 bg-bg px-3 py-1 text-small font-medium text-ink sm:px-3.5 sm:py-1.5"
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Column counts the grid never exceeds: one row from 64rem up, two below it. */
const gridColumns = (count: number) =>
  ({ "--deck-cols-md": count > 4 ? 3 : 2, "--deck-cols-lg": count }) as CSSProperties;

/** The drawing for a service, on a plate tinted with the region's accent. */
function ServicePlate({ id }: { id: string }) {
  const art = getServiceArt(id);
  if (!art) return null;
  return (
    <span className="zan-deck-plate">
      <Image
        src={art.src}
        alt={art.alt}
        width={SERVICE_PLATE.width}
        height={SERVICE_PLATE.height}
        // SVG is a vector already; next/image leaves .svg unoptimised anyway,
        // and saying so keeps it out of the optimiser on every build.
        unoptimized
        className="zan-deck-plate-img"
      />
    </span>
  );
}

/** A practice's services: capabilities for Development, descriptions for the rest. Titles open each service's page. */
export function PracticeGrid({ practice, tone }: { practice: Practice; tone: DeckTone }) {
  const t = DECK_TONES[tone];
  return (
    <ul className="zan-deck-grid" style={gridColumns(practice.items.length)}>
      {practice.items.map((item, i) => (
        <li key={item.id} className={`zan-deck-card border-t ${t.rule}`}>
          <ServicePlate id={item.id} />
          <div className="zan-deck-body">
            <h3 className="zan-deck-title text-h3 font-semibold">
              <SiteLink
                href={item.href}
                className="group/link inline-flex items-baseline gap-1.5 decoration-1 underline-offset-4 hover:underline"
              >
                {item.title}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 shrink-0 self-center transition-transform duration-300 ease-out-expo group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
                  strokeWidth={2}
                />
              </SiteLink>
            </h3>
            <p className="zan-deck-meta text-small">
              <span aria-hidden="true" className={`zan-deck-index font-mono text-eyebrow ${t.index}`}>
                {pad(i + 1)}
              </span>
              <span className="font-medium text-ink">{item.tagline}</span>
            </p>
            {practice.id === "development" && item.capabilities ? (
              <ul
                className="zan-deck-note zan-deck-caps text-small text-ink-2"
                aria-label={`${item.title} capabilities`}
              >
                {item.capabilities.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            ) : (
              <p className="zan-deck-note text-small text-ink-2">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/** The four reasons as an editorial value grid, then the page's two CTAs. */
export function WhyUsGrid({ tone }: { tone: DeckTone }) {
  const t = DECK_TONES[tone];
  return (
    <>
      <ul className="zan-deck-grid" style={gridColumns(whyUs.items.length)}>
        {whyUs.items.map((item) => (
          <li key={item.id} className={`zan-deck-card border-t ${t.rule}`}>
            <div className="zan-deck-body">
              <h3 className="zan-deck-title text-h3 font-semibold">{item.title}</h3>
              <p className="zan-deck-meta text-small">
                <span aria-hidden="true" className={`zan-deck-index font-mono text-eyebrow ${t.index}`}>
                  {item.index}
                </span>
                <span className="font-medium text-ink">{item.tagline}</span>
              </p>
              <p className="zan-deck-note text-small text-ink-2">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="zan-deck-actions mt-auto flex flex-wrap items-center gap-3">
        <SiteButtonLink href={ctas.project.href} size="lg">
          {ctas.project.label}
        </SiteButtonLink>
        <SiteButtonLink href={ctas.work.href} variant="secondary" size="lg">
          {ctas.work.label}
        </SiteButtonLink>
      </div>
    </>
  );
}
