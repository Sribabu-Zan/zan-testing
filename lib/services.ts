import { practices } from "@/constants/zan";
import { splitRegion } from "@/lib/links";

/* ───────────────────────────────────────────────────────────────────────────
   Which service a path is about.

   The enquiry form asks the visitor to choose a service, and a visitor who
   has just read a page about web development should not then have to tell us
   they are interested in web development. The form lives on /contact-us and
   in the homepage's contact section rather than on the service pages
   themselves, so those pages hand the answer over in the link they send:

     /contact-us?from=/services/web-development

   The values are the ones the form's `serviceOptions` offers, because both are
   built from `practices`. The two practice hubs (/services/digital-marketing,
   /services/branding-and-designing) are headings rather than services and have
   no option of their own, so they fall through to "" and the form keeps its
   "Choose a service" placeholder.

   Its own module, and not part of lib/links.ts, so that proxy.ts does not pull
   the whole content file in behind it.
   ─────────────────────────────────────────────────────────────────────────── */

const BY_PATH = new Map<string, string>(
  practices.flatMap((p) => p.items.map((s) => [s.href, s.title] as const)),
);

/** The service title for a path, or "" if the path is not a service page. */
export function serviceFromPath(pathname: string | undefined | null): string {
  if (!pathname) return "";
  const { path } = splitRegion(pathname);
  // Query and hash off, then a trailing slash off anything but the root.
  const clean = path.split(/[?#]/)[0].replace(/(.)\/$/, "$1");
  return BY_PATH.get(clean) ?? "";
}
