"use client";

import { about, offices, type Office } from "@/constants/zan";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { useLocalTime } from "./useLocalTime";

/** "Kolkata · Dubai · Sacramento". The no-break space before each dot keeps it
 *  on the city it follows when the line wraps. */
const CITY_LINE = offices.map((o) => o.city).join(" · ");

function PortalOffice({ office, index }: { office: Office; index: number }) {
  const { time, offset, iso } = useLocalTime(office.timeZone);
  return (
    <li className="flex items-center justify-between gap-4 border-b border-line py-[2.4svh] last:border-b-0 @3xl:flex-col @3xl:items-start @3xl:justify-start @3xl:border-b-0 @3xl:border-l @3xl:px-[2.6cqw] @3xl:py-[3.2svh] @3xl:first:border-l-0 @3xl:first:pl-0">
      <div className="min-w-0">
        <p className="flex items-center gap-2.5">
          <span className="font-mono text-eyebrow text-muted">{String(index + 1).padStart(2, "0")}</span>
          {office.isHq && (
            <span className="rounded-full bg-brand px-2.5 py-1 font-mono text-[0.625rem] font-medium tracking-[0.14em] text-on-brand uppercase">
              HQ
            </span>
          )}
        </p>
        <p className="mt-2 font-display text-h2 text-ink">{office.city}</p>
        <p className="text-small text-ink-2">{office.country}</p>
      </div>
      <p className="shrink-0 text-right @3xl:mt-[4.5svh] @3xl:text-left">
        <time
          dateTime={iso}
          className="block font-mono text-[clamp(1.75rem,4.6cqw,4.5rem)] leading-none font-medium tracking-[-0.04em] text-ink tabular-nums"
        >
          {time}
        </time>
        <span className="mt-2 block font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
          Local time{offset ? ` · ${offset}` : ""}
        </span>
      </p>
    </li>
  );
}

/**
 * The zoom collage's centre frame: a light page listing the three offices
 * with their local time. It is laid out at full-screen size; ZoomParallax
 * shrinks it into the frame and the zoom brings it back to 1:1.
 */
export function OfficesPortal() {
  return (
    <div className="@container h-full">
      <div className="flex h-full flex-col justify-between gap-[4svh] bg-brand-wash px-[5.5cqw] pt-[var(--zan-portal-top,2.25rem)] pb-[5svh]">
        <div>
          <Eyebrow>{about.principles[1].label}</Eyebrow>
          <p className="mt-[2.4svh] font-display text-[clamp(2rem,4.2cqw,4.75rem)] leading-[1.04] font-semibold tracking-[-0.01em] text-balance text-ink">
            {CITY_LINE}
          </p>
        </div>
        <ul className="grid border-t border-line @3xl:grid-cols-3">
          {offices.map((o, i) => (
            <PortalOffice key={o.id} office={o} index={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}
