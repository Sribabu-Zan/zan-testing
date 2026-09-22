"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/zan/ui/Button";
import { takeLead, trackGenerateLead, trackWhatsAppClick } from "@/lib/analytics";
import { waLink } from "@/lib/links";
import { useRegion } from "@/lib/region";

/**
 * The conversion.
 *
 * /thank-you is reached once per enquiry and by nobody else, which is what
 * makes it the thing Google Ads counts. The event carries the address and
 * number the visitor gave, which the tag hashes before they leave the browser;
 * that is what Enhanced Conversions matches against the click that brought
 * them here.
 *
 * The details come from sessionStorage, written by the enquiry form on a send
 * that resolved, and are cleared as they are read, so a reload of this page
 * cannot report the same lead twice. A visitor who opens /thank-you directly
 * has nothing stored: the event still fires, with the two fields empty, which
 * is what the live site does.
 */
export function ThankYouConversion() {
  const fired = useRef(false);

  useEffect(() => {
    // React runs effects twice in development; the container must not see the
    // conversion twice because of it.
    if (fired.current) return;
    fired.current = true;
    trackGenerateLead(takeLead() ?? {});
  }, []);

  return null;
}

/** WhatsApp with the regional desk, reported under its own label. */
export function ThankYouWhatsApp() {
  const region = useRegion();
  return (
    <ButtonLink
      href={waLink(region.whatsapp, region.brandName)}
      onClick={() => trackWhatsAppClick("Thank You WhatsApp")}
      target="_blank"
      rel="noopener noreferrer"
      variant="secondary"
      icon={
        <MessageCircle aria-hidden="true" className="size-4 shrink-0 text-whatsapp" strokeWidth={2} />
      }
    >
      Message us on WhatsApp
      <span className="sr-only"> (opens in a new tab)</span>
    </ButtonLink>
  );
}
