"use client";

import { forwardRef, type KeyboardEvent, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Phone } from "lucide-react";
import { ctas, mainNav, practices, serviceNav } from "@/constants/zan";
import { ButtonLink } from "@/components/zan/ui/Button";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { useSiteHref } from "@/lib/useSiteHref";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const panel = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE, staggerChildren: 0.05, delayChildren: 0.04 },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: EASE } },
};

const column = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0 },
};

/** The Services tab's own page, for the "All services" link. */
const SERVICES_HREF = mainNav.find((item) => item.sections?.length)?.href ?? "/services";

/**
 * The Services mega menu: the three practices side by side, each heading
 * linking to its page on the main site, then its disciplines. A footer row
 * carries the region office's phone, "All services" and the main CTA.
 *
 * Positioned against the fixed header (its nearest positioned ancestor), so
 * it spans the full bar while living next to its trigger in the DOM — Tab
 * from "Services" walks straight into it.
 */
export const MegaMenu = forwardRef<
  HTMLDivElement,
  {
    id: string;
    open: boolean;
    onChoose: () => void;
    onPointerEnter: (e: PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: (e: PointerEvent<HTMLDivElement>) => void;
  }
>(function MegaMenu({ id, open, onChoose, onPointerEnter, onPointerLeave }, ref) {
  const { office } = useRegion();
  const href = useSiteHref();

  // Up/Down walk the links, so the keyboard can move without Tab-ing through
  // every column header.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const links = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("a[href]"));
    const at = links.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    e.preventDefault();
    const next = links[(at + (e.key === "ArrowDown" ? 1 : -1) + links.length) % links.length];
    next?.focus();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          id={id}
          key="mega"
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
          className="absolute inset-x-0 top-full hidden border-b border-line bg-bg shadow-nav xl:block"
        >
          <div className="container-zan">
            <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-x-10 border-t border-line pt-8 pb-6">
              {serviceNav.map((section, i) => {
                const practice = practices[i];
                const twoCol = section.items.length > 4;
                return (
                  <motion.div key={section.title} variants={column} className="min-w-0">
                    <SiteLink
                      href={section.href}
                      onClick={onChoose}
                      className="group/head mb-3 flex items-baseline gap-3 rounded-lg px-3 py-1.5 transition-colors duration-300 hover:bg-surface"
                    >
                      <span className="font-mono text-eyebrow text-brand-ink">{practice?.index}</span>
                      <span className="font-display text-h3 font-semibold text-ink">{section.title}</span>
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4 shrink-0 self-center text-brand-ink opacity-0 transition-[opacity,transform] duration-300 ease-out-expo group-hover/head:translate-x-0.5 group-hover/head:-translate-y-0.5 group-hover/head:opacity-100"
                      />
                    </SiteLink>
                    <ul className={cn("grid gap-x-4 gap-y-0.5", twoCol ? "grid-cols-2" : "grid-cols-1")}>
                      {section.items.map((leaf) => (
                        <li key={leaf.label} className="min-w-0">
                          <SiteLink
                            href={leaf.href}
                            onClick={onChoose}
                            className="group/leaf block rounded-xl px-3 py-2.5 transition-colors duration-300 hover:bg-surface focus-visible:bg-surface"
                          >
                            <span className="flex items-center gap-1.5 text-small font-medium text-ink">
                              <span className="truncate">{leaf.label}</span>
                              <ArrowUpRight
                                aria-hidden="true"
                                className="size-3.5 shrink-0 text-brand-ink opacity-0 transition-[opacity,transform] duration-300 ease-out-expo group-hover/leaf:translate-x-0.5 group-hover/leaf:-translate-y-0.5 group-hover/leaf:opacity-100"
                              />
                            </span>
                            {leaf.description && (
                              <span className="mt-0.5 block truncate text-[0.8125rem] leading-snug text-muted">
                                {leaf.description}
                              </span>
                            )}
                          </SiteLink>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              variants={column}
              className="flex items-center justify-between gap-6 border-t border-line py-4"
            >
              <div className="flex items-center gap-2">
                <a
                  href={`tel:${office.phoneTel}`}
                  className="inline-flex items-center gap-2.5 rounded-full px-3 py-2 text-small text-ink-2 transition-colors duration-300 hover:text-brand-ink"
                >
                  <Phone aria-hidden="true" className="size-4 shrink-0 text-brand-ink" />
                  <span>
                    {office.city}
                    {office.isHq ? " HQ" : ""}
                  </span>
                  <span aria-hidden="true" className="text-line-strong">
                    /
                  </span>
                  <span className="font-medium text-ink tabular-nums">{office.phoneDisplay}</span>
                </a>
                <span aria-hidden="true" className="h-4 w-px bg-line" />
                <SiteLink
                  href={SERVICES_HREF}
                  onClick={onChoose}
                  className="group/all inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-small font-medium text-ink transition-colors duration-300 hover:text-brand-ink"
                >
                  All services
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-3.5 transition-transform duration-300 ease-out-expo group-hover/all:translate-x-0.5 group-hover/all:-translate-y-0.5"
                  />
                </SiteLink>
              </div>
              <ButtonLink href={href(ctas.project.href)} onClick={onChoose} size="md">
                {ctas.project.label}
              </ButtonLink>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
