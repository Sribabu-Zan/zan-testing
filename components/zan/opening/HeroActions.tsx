"use client";

import { MessageCircle } from "lucide-react";
import { ButtonLink } from "@/components/zan/ui/Button";
import { hero } from "@/constants/zan";
import { waLink } from "@/lib/links";
import { useSiteHref } from "@/lib/useSiteHref";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";

/** md on phones, so both pills fit side by side at 360px; lg from 640px. */
const SIZE = "h-12 px-5 text-[0.9375rem] sm:h-13 sm:px-7 sm:text-base";

/**
 * The hero's two calls to action, as on the old site: the main site's
 * contact page in the visitor's region, and WhatsApp with the regional desk
 * and the regional trading name in the greeting. Short labels below 640px.
 */
export function HeroActions() {
  const region = useRegion();
  const href = useSiteHref();

  return (
    <>
      <ButtonLink href={href(hero.primary.href)} size="lg" className={SIZE}>
        <span className="hidden sm:inline">{hero.primary.label}</span>
        <span className="sm:hidden">{hero.primary.short}</span>
      </ButtonLink>

      <ButtonLink
        href={waLink(region.whatsapp, region.brandName)}
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
        size="lg"
        icon={<MessageCircle aria-hidden="true" className="size-[1.125rem] shrink-0 text-whatsapp" strokeWidth={2} />}
        className={cn(SIZE, "bg-bg")}
      >
        <span className="hidden sm:inline">{hero.whatsapp.label}</span>
        <span className="sm:hidden">{hero.whatsapp.short}</span>
        <span className="sr-only"> (opens in a new tab)</span>
      </ButtonLink>
    </>
  );
}
