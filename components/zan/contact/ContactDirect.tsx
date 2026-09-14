"use client";

import { Mail, Phone } from "lucide-react";
import { site } from "@/constants/zan";
import { useRegion } from "@/lib/region";
import { ButtonLink } from "@/components/zan/ui/Button";
import { cn } from "@/lib/utils";

/** Tap-to-call the current region's office, or write to the shared inbox. */
export function ContactDirect({ className }: { className?: string }) {
  const { office } = useRegion();
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-x-7 gap-y-3", className)}>
      <ButtonLink
        href={`tel:${office.phoneTel}`}
        variant="secondary"
        icon={<Phone aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />}
      >
        Call {office.phoneDisplay}
      </ButtonLink>
      <ButtonLink
        href={`mailto:${site.email}`}
        variant="ghost"
        icon={<Mail aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />}
      >
        {site.email}
      </ButtonLink>
    </div>
  );
}
