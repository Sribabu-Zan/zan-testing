"use client";

import { useEffect } from "react";
import { trackContactClick } from "@/lib/analytics";

/* ───────────────────────────────────────────────────────────────────────────
   contact_click, for every tel: and mailto: link on the site.

   One delegated listener rather than an onClick on each. The regional number
   appears in the navbar, the mega menu, the mobile menu, the hero, the footer,
   the three office cards and the contact page's panel, and the inbox address
   in almost as many; wiring each one would mean touching a dozen components
   and turning server components into client ones to do it. A listener on
   document sees them all, including the ones added later, and costs one
   handler.

   Capture phase, because a tel: link on a phone hands the page to the dialler
   the moment the default action runs and a bubbling listener can be too late.
   Pushing to the dataLayer is synchronous, so the row is recorded either way.

   The label is what a person reading the GTM report needs: the link's own
   text, which is already the number or the address, or whatever the component
   set on data-analytics-label.
   ─────────────────────────────────────────────────────────────────────────── */

export function ContactClicks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.("a[href^='tel:'],a[href^='mailto:']");
      if (!(link instanceof HTMLAnchorElement)) return;

      const href = link.getAttribute("href") ?? "";
      const label =
        link.dataset.analyticsLabel ?? link.textContent?.trim().replace(/\s+/g, " ") ?? href;

      trackContactClick(label || href);
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
