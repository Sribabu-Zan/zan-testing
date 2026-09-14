"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowUp, Mail, Phone } from "lucide-react";
import {
  contactIntro,
  credits,
  ctas,
  footerColumns,
  legalLinks,
  offices,
  site,
  socialLinks,
} from "@/constants/zan";
import { ButtonLink } from "@/components/zan/ui/Button";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { ZanLogo } from "@/components/zan/ui/ZanLogo";
import { MQ } from "@/lib/gsap";
import { useSiteHref } from "@/lib/useSiteHref";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "./shellStore";
import { SocialIcon } from "./SocialIcon";

/** Module scope, so render stays pure. suppressHydrationWarning covers the
 *  one night a year the server and the browser disagree. */
const YEAR = new Date().getFullYear();

/** The contact lead's first sentence as the line, the rest beneath it. */
const [CTA_LINE, ...CTA_REST] = contactIntro.lead.split(/(?<=\.)\s+/);

/**
 * The page's close: a CTA strip, the brand column with socials, the link
 * columns (pages of the main site), all three offices, the legal bar with
 * the model credit, and a giant ghosted "ZAN SERVICES" that rises as the
 * page ends.
 */
export function Footer() {
  const region = useRegion();
  const href = useSiteHref();
  const markRef = useRef<HTMLDivElement>(null);
  // A media-query store rather than framer's useReducedMotion: that one
  // already answers during hydration, so server and client would disagree.
  const reduce = useMediaQuery(MQ.reduce);
  const progress = useMotionValue(0);
  const rise = useTransform(progress, [0, 1], ["42%", "0%"]);

  // The wordmark rises over the last stretch of the page, measured from its
  // own box on every scroll, so pins that grow the page after load cannot
  // leave the range stale.
  useEffect(() => {
    const el = markRef.current;
    if (reduce || !el) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const lead = vh * 0.35;
      progress.set(Math.min(1, Math.max(0, (vh + lead - r.top) / (lead + r.height))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduce, progress]);

  return (
    <footer className="relative isolate overflow-hidden border-t border-line bg-surface-2 text-ink">
      {/* ── CTA strip ─────────────────────────────────────────────────── */}
      <div className="container-zan pt-16 sm:pt-20">
        <div className="flex flex-col gap-8 rounded-3xl border border-line bg-bg px-6 py-8 shadow-lift sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>{contactIntro.eyebrow}</Eyebrow>
            <p className="mt-4 font-display text-h2 text-ink">{CTA_LINE}</p>
            {CTA_REST.length > 0 && <p className="mt-3 text-body text-ink-2">{CTA_REST.join(" ")}</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:shrink-0">
            <ButtonLink href={href(ctas.project.href)} size="lg">
              {ctas.project.label}
            </ButtonLink>
            <ButtonLink
              href={`mailto:${site.email}`}
              variant="secondary"
              size="lg"
              arrow={false}
              icon={<Mail aria-hidden="true" className="size-4 shrink-0 text-brand-ink" />}
            >
              {site.email}
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* ── Brand + link columns ───────────────────────────────────────── */}
      <div className="container-zan grid gap-12 pt-16 pb-12 sm:pt-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <SiteLink href="#main" aria-label={`${site.name} home`} className="inline-flex rounded-lg">
            <ZanLogo className="h-9" />
          </SiteLink>
          <p className="mt-5 max-w-sm text-lead text-ink-2">{site.tagline}</p>
          <ul className="mt-7 flex flex-wrap gap-2.5">
            {socialLinks.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  className="group/social inline-flex h-10 items-center gap-2 rounded-full border border-line bg-bg pr-4 pl-1.5 text-small font-medium text-ink-2 transition-[color,border-color,translate] duration-300 ease-out-expo hover:-translate-y-0.5 hover:border-line-strong hover:text-ink"
                >
                  <span className="grid size-7 place-items-center rounded-full bg-surface text-ink transition-colors duration-300 group-hover/social:bg-brand group-hover/social:text-on-brand">
                    <SocialIcon name={s.label} className="size-3.5" />
                  </span>
                  {s.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 lg:col-span-8 lg:grid-cols-[1.25fr_1fr_1.2fr]">
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h2 className="font-mono text-eyebrow text-muted uppercase">{col.title}</h2>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <SiteLink
                      href={link.href}
                      className="group/link inline-flex items-center gap-2 text-body text-ink-2 transition-colors duration-300 hover:text-ink"
                    >
                      <span className="h-px w-0 shrink-0 bg-brand-ink transition-[width] duration-500 ease-out-expo group-hover/link:w-3" />
                      {link.label}
                    </SiteLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="col-span-2 lg:col-span-1">
            <h2 className="font-mono text-eyebrow text-muted uppercase">Contact</h2>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="text-body break-words text-ink-2 transition-colors duration-300 hover:text-ink"
                >
                  {site.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${region.office.phoneTel}`}
                  className="text-body text-ink-2 tabular-nums transition-colors duration-300 hover:text-ink"
                >
                  {region.office.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      {/* ── Offices ────────────────────────────────────────────────────── */}
      <div className="container-zan pb-14">
        <h2 className="font-mono text-eyebrow text-muted uppercase">Offices</h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {offices.map((o) => {
            const current = o.id === region.id;
            const locality = [o.region, o.postalCode].filter(Boolean).join(" ");
            const phones = [
              { tel: o.phoneTel, display: o.phoneDisplay },
              ...(o.altPhoneTel && o.altPhoneDisplay ? [{ tel: o.altPhoneTel, display: o.altPhoneDisplay }] : []),
            ];
            return (
              <li
                key={o.id}
                className={cn(
                  "relative rounded-2xl border bg-bg p-5 transition-[border-color,box-shadow] duration-500 sm:p-6",
                  current ? "border-brand/45 shadow-lift" : "border-line",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-h3 font-semibold text-ink">{o.city}</h3>
                    <p className="mt-1 font-mono text-eyebrow text-muted uppercase">{o.country}</p>
                  </div>
                  {o.isHq && (
                    <span className="rounded-full bg-brand-soft px-2.5 py-1 font-mono text-[0.625rem] leading-none tracking-[0.16em] text-brand-ink uppercase">
                      HQ
                    </span>
                  )}
                </div>
                <address className="mt-4 text-small text-ink-2 not-italic">
                  {o.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {locality && <span className="block">{locality}</span>}
                </address>
                <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                  {phones.map((p) => (
                    <li key={p.tel}>
                      <a
                        href={`tel:${p.tel}`}
                        className="inline-flex items-center gap-2 text-small font-medium text-ink tabular-nums transition-colors duration-300 hover:text-brand-ink"
                      >
                        <Phone aria-hidden="true" className="size-3.5 shrink-0 text-brand-ink" />
                        {p.display}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────────
          Right padding on wider screens keeps the credit and "Back to top"
          clear of the floating buttons. */}
      <div className="container-zan">
        <div className="flex flex-col gap-4 border-t border-line py-6 pr-16 text-[0.8125rem] leading-relaxed text-muted sm:pr-20 lg:flex-row lg:items-start lg:justify-between lg:gap-8 min-[1400px]:pr-0">
          <p>
            © <span suppressHydrationWarning>{YEAR}</span> {region.brandName}. All rights reserved.
            <span className="block">US entity: {site.usEntity}, Sacramento, California.</span>
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 lg:max-w-md">
            {legalLinks.map((l) => (
              <li key={l.label}>
                <SiteLink href={l.href} className="transition-colors duration-300 hover:text-ink">
                  {l.label}
                </SiteLink>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 lg:items-end lg:text-right">
            {credits.map((c) => (
              <p key={c.href} className="max-w-md">
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener"
                  className="underline decoration-line-strong underline-offset-2 transition-colors duration-300 hover:text-ink"
                >
                  {c.work}
                </a>{" "}
                by {c.author},{" "}
                <a
                  href={c.licenseHref}
                  target="_blank"
                  rel="noopener"
                  className="whitespace-nowrap underline decoration-line-strong underline-offset-2 transition-colors duration-300 hover:text-ink"
                >
                  {c.license}
                </a>
              </p>
            ))}
            <SiteLink
              href="#main"
              className="inline-flex items-center gap-1.5 font-medium text-ink-2 transition-colors duration-300 hover:text-ink"
            >
              <ArrowUp aria-hidden="true" className="size-3.5" />
              Back to top
            </SiteLink>
          </div>
        </div>
      </div>

      {/* ── Wordmark ───────────────────────────────────────────────────── */}
      <div ref={markRef} aria-hidden="true" className="pointer-events-none overflow-hidden select-none">
        <motion.p
          style={{ y: reduce ? 0 : rise }}
          className="bg-linear-to-b from-ink/[0.085] to-ink/[0.025] bg-clip-text pt-[0.02em] pb-[0.1em] text-center font-sans text-[clamp(3.25rem,12.4vw,13.5rem)] leading-[0.86] font-bold tracking-[-0.045em] whitespace-nowrap text-transparent uppercase"
        >
          {site.wordmark.lead} {site.wordmark.trail}
        </motion.p>
      </div>
    </footer>
  );
}
