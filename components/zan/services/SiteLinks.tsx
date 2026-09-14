"use client";

import Link from "next/link";
import type { AnchorHTMLAttributes, ComponentProps } from "react";
import { isInternalHref } from "@/lib/links";
import { useSiteHref } from "@/lib/useSiteHref";
import { ButtonLink } from "@/components/zan/ui/Button";

/* Links whose href comes from constants. A path starting with "/" is a page
   of this site and is navigated with next/link, so moving between pages never
   reloads the document (and the preloader never replays). An in-page anchor
   ("#contact") stays an anchor on the homepage and becomes "/#contact"
   anywhere else; tel:, mailto: and external URLs are plain anchors. */

export function SiteLink({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const resolved = useSiteHref()(href);
  if (isInternalHref(resolved)) return <Link href={resolved} {...rest} />;
  return <a href={resolved} {...rest} />;
}

export function SiteButtonLink({ href, ...rest }: ComponentProps<typeof ButtonLink>) {
  const resolved = useSiteHref()(href);
  return <ButtonLink href={resolved} {...rest} />;
}
