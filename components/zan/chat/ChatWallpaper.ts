import type { CSSProperties } from "react";

/**
 * The transcript's wallpaper.
 *
 * Some texture behind the bubbles is what makes a bubble read as a bubble:
 * white on white loses its edges entirely. This is a faint brand-tinted grid
 * in the page's own language rather than borrowed doodles, and it follows the
 * region because both stops are color-mix() over --color-brand.
 *
 * ── Why this is a style and not a component ───────────────────────────────
 * In the main app it used to be a `<div className="absolute inset-0">` inside
 * the transcript. That is wrong in a scrolling container in two ways at once:
 * `inset-0` sizes the element to the scroller's PADDING BOX (one screenful),
 * while its position resolves in the SCROLLED coordinate space — so it both
 * fell short of the full transcript and slid out of view as the conversation
 * grew, leaving bare panel behind the bubbles.
 *
 * Applying it as the scroller's own background fixes both halves: a background
 * on a scroll container is painted against its padding box and, at the default
 * `background-attachment: scroll`, does not travel with the content.
 */
export const chatWallpaperStyle: CSSProperties = {
  backgroundImage: `
    radial-gradient(circle at 12px 12px, color-mix(in oklab, var(--color-brand) 9%, transparent) 1.5px, transparent 1.6px),
    linear-gradient(45deg, color-mix(in oklab, var(--color-brand) 4%, transparent) 25%, transparent 25%, transparent 75%, color-mix(in oklab, var(--color-brand) 4%, transparent) 75%)
  `,
  backgroundSize: "24px 24px, 48px 48px",
};
