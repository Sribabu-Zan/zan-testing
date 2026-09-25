import Image from "next/image";
import type { ReactNode } from "react";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import type { ServiceHero } from "@/constants/serviceHero";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * A heading line only takes the brand accent if it is short enough to stay on
 * one line in the hero's seven-column well. A phrase that wraps puts two full
 * display lines of saturated colour on the page, which is the large coloured
 * area this site does not use.
 */
const ACCENTABLE = 15;

/**
 * The top of every standing page: the trail back up, the same eyebrow,
 * display heading and lead the homepage's sections use, then whatever the page
 * puts under it (its calls to action, a price) and beside it.
 *
 * Two rules hold across every page type:
 *
 *   1. The heading is ink. A whole headline filled with the brand colour is a
 *      large area of saturated colour, which this site reserves for buttons and
 *      small accents — and in the UAE palette gold on white is about 1.7:1, so
 *      a filled headline is not even legible. Only a heading of more than one
 *      line takes the accent, and only on its last line.
 *   2. The band is a two-column grid at lg and up. The right column carries
 *      something real (what a service includes, the offices, the figures), so
 *      the hero is a filled band rather than copy in the top-left corner of an
 *      empty screen.
 *
 * `media` adds a third part under both columns, for the pages that have a
 * photograph. It sits below the copy rather than behind or beside it, so the
 * heading, the lead and the buttons are all above it at every width and none
 * of them is ever read off a picture.
 *
 * `pt-nav` clears the fixed navbar. The ground is the warm brand wash, and the
 * section that follows draws the hairline between them.
 */
export function PageHero({
  eyebrow,
  title,
  lead,
  trail,
  children,
  aside,
  media,
  size = "display",
  className,
}: {
  eyebrow: string;
  title: readonly string[];
  lead?: string;
  trail?: readonly Crumb[];
  /** A heading of several long lines sets at h1 so the band stays readable. */
  size?: "display" | "h1";
  /** Under the lead: calls to action, a price. */
  children?: ReactNode;
  /** The right-hand column. */
  aside?: ReactNode;
  /** Full width under both columns: the page's photograph. */
  media?: ReactNode;
  className?: string;
}) {
  const split = Boolean(aside || media);
  return (
    <section className={cn("relative isolate bg-brand-wash pt-nav", className)}>
      <div className="container-zan pt-10 pb-12 sm:pt-14 sm:pb-14 lg:pt-16 lg:pb-18">
        {trail && <Breadcrumbs trail={trail} className="mb-6" />}
        {/* The rows are placed rather than flowed: the copy and the panel share
            row 1 at lg, the photograph takes the whole of row 2. Stacked on a
            phone the source order holds, so the photograph follows the buttons
            and the panel follows the photograph. */}
        <div className={cn(split && "grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-x-14 lg:gap-y-12")}>
          <div className={cn(split && "lg:row-start-1 lg:col-span-7")}>
            <SectionHeading
              eyebrow={eyebrow}
              title={title}
              lead={lead}
              as="h1"
              size={size}
              accentLine={
                title.length > 1 && title[title.length - 1].length <= ACCENTABLE ? title.length - 1 : undefined
              }
              leadClassName="max-w-[56ch]"
            />
            {children}
          </div>
          {media && <div className="lg:row-start-2 lg:col-span-12">{media}</div>}
          {aside && <div className="lg:row-start-1 lg:col-span-5 lg:col-start-8">{aside}</div>}
        </div>
      </div>
    </section>
  );
}

/**
 * The hero's photograph. One 16:9 file per service, cropped by the band it
 * sits in: squarer on a phone, where a wide strip would be a letterbox, and a
 * wide slice on a desktop, where a 16:9 block 1200px across would push the
 * rest of the page off the screen. `object-cover` does the cropping and every
 * subject is centred in its file, so no crop loses it. 3:2 rather than 4:3 at
 * the small end, because 4:3 takes a quarter off the width and the pictures
 * that fill the frame edge to edge lost the ends of themselves.
 *
 * `preload` because this is the largest thing above the fold and therefore the
 * page's LCP element — `priority` is the Next 15 spelling and is deprecated in
 * 16 (node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md).
 * Nothing here animates in: a reveal on the LCP element would hold the paint
 * back for the sake of a fade.
 */
export function PageHeroPhoto({ photo }: { photo: ServiceHero }) {
  return (
    <figure className="relative aspect-[3/2] overflow-hidden rounded-3xl border border-line bg-surface shadow-lift sm:aspect-[16/9] lg:aspect-[12/5]">
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        preload
        sizes="(min-width: 82.5rem) 1224px, (min-width: 64rem) calc(100vw - 6rem), calc(100vw - 2.5rem)"
        className="absolute inset-0 size-full object-cover"
      />
    </figure>
  );
}
