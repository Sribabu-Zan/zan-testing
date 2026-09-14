"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Phone } from "lucide-react";
import { ctas, mainNav, offices, practices } from "@/constants/zan";
import { ButtonLink } from "@/components/zan/ui/Button";
import { ZanLogo } from "@/components/zan/ui/ZanLogo";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { getLenis } from "@/hooks/useLenis";
import { useSiteHref } from "@/lib/useSiteHref";
import { cn } from "@/lib/utils";
import { MenuToggle } from "./MenuToggle";
import { RegionSwitcher } from "./RegionSwitcher";
import { focusables, scrollToHash } from "./shellStore";

const EASE = [0.16, 1, 0.3, 1] as const;

const sheet = {
  hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
  visible: {
    opacity: 1,
    clipPath: "inset(0 0 0% 0)",
    transition: { duration: 0.6, ease: EASE, staggerChildren: 0.055, delayChildren: 0.12 },
  },
  exit: {
    opacity: 0,
    clipPath: "inset(0 0 100% 0)",
    transition: { duration: 0.4, ease: [0.76, 0, 0.24, 1] as const },
  },
};

const row = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

/**
 * Full-screen menu below 1280px: its own bar (logo + the close toggle, in the
 * same spot as the header's), the tabs with a Services accordion, the region
 * switcher, the main CTA and a tap-to-call for every office.
 *
 * Tabs and disciplines are pages of the main site and navigate normally. An
 * in-page anchor (the CTA) closes the menu first and then glides there —
 * Lenis ignores scrollTo while stopped, so the unlock comes first.
 *
 * While open: page scroll is locked (Lenis stopped, overflow hidden), focus
 * is trapped inside and Escape closes.
 */
export function MobileMenu({
  open,
  id,
  onClose,
}: {
  open: boolean;
  id: string;
  onClose: (opts?: { restoreFocus?: boolean }) => void;
}) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const href = useSiteHref();

  // Scroll lock, focus trap and Escape — only while open.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevHtml = html.style.overflow;
    const prevBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    getLenis()?.stop();

    // Focus the dialog itself (no ring); the first Tab lands on its first link.
    const focusFirst = requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose({ restoreFocus: true });
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = focusables(panel);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const outside = active === panel || !panel.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    // The menu does not exist at 1280px and up; growing past it closes it.
    const wide = window.matchMedia("(min-width: 1280px)");
    const onWide = () => wide.matches && onClose();
    wide.addEventListener("change", onWide);

    return () => {
      cancelAnimationFrame(focusFirst);
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      html.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      getLenis()?.start();
    };
  }, [open, onClose]);

  /** A page link just closes (the browser navigates); an anchor closes, unlocks, then glides. */
  const go = (e: MouseEvent<HTMLAnchorElement>, target: string) => {
    if (!target.startsWith("#")) {
      onClose();
      return;
    }
    e.preventDefault();
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    getLenis()?.start();
    onClose();
    requestAnimationFrame(() => scrollToHash(target));
  };

  return (
    <AnimatePresence onExitComplete={() => setServicesOpen(false)}>
      {open && (
        <motion.div
          ref={panelRef}
          id={id}
          key="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          tabIndex={-1}
          variants={sheet}
          initial="hidden"
          animate="visible"
          exit="exit"
          data-lenis-prevent
          className="fixed inset-0 z-60 flex h-dvh flex-col overflow-y-auto overscroll-contain bg-bg outline-none xl:hidden"
        >
          <div className="container-zan flex h-nav shrink-0 items-center justify-between">
            <SiteLink
              href="#main"
              onClick={(e) => go(e, href("#top"))}
              aria-label="Home"
              className="rounded-lg"
            >
              <ZanLogo />
            </SiteLink>
            <MenuToggle open morphIn onClick={() => onClose({ restoreFocus: true })} controls={id} />
          </div>

          <div className="container-zan flex flex-1 flex-col pt-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <nav aria-label="Menu">
              <ul className="border-t border-line">
                {mainNav.map((item, i) => {
                  const hasSections = Boolean(item.sections?.length);
                  const itemHref = href(item.href);
                  return (
                    <motion.li key={item.label} variants={row} className="border-b border-line">
                      <div className="flex items-center gap-2">
                        <SiteLink
                          href={item.href}
                          onClick={(e) => go(e, itemHref)}
                          className="group flex min-h-16 flex-1 items-baseline gap-4 py-4 text-ink"
                        >
                          <span className="w-6 shrink-0 font-mono text-eyebrow text-muted">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="font-sans text-[clamp(1.75rem,1.3rem+2vw,2.5rem)] leading-none font-bold tracking-[-0.035em] uppercase transition-colors duration-300 group-active:text-brand-ink">
                            {item.label}
                          </span>
                        </SiteLink>
                        {hasSections && (
                          <button
                            type="button"
                            onClick={() => setServicesOpen((v) => !v)}
                            aria-expanded={servicesOpen}
                            aria-controls={`${id}-services`}
                            aria-label={`${servicesOpen ? "Hide" : "Show"} ${item.label.toLowerCase()}`}
                            className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-ink-2 transition-colors duration-300 hover:bg-surface"
                          >
                            <ChevronDown
                              aria-hidden="true"
                              className={cn(
                                "size-5 transition-transform duration-500 ease-out-expo",
                                servicesOpen && "rotate-180",
                              )}
                            />
                          </button>
                        )}
                      </div>

                      {hasSections && (
                        <AnimatePresence initial={false}>
                          {servicesOpen && (
                            <motion.div
                              id={`${id}-services`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.45, ease: EASE }}
                              className="overflow-hidden"
                            >
                              <div className="grid gap-6 pb-6 pl-10 sm:grid-cols-3 sm:gap-4">
                                {item.sections!.map((section, s) => {
                                  const sectionHref = href(section.href);
                                  return (
                                    <div key={section.title}>
                                      <SiteLink
                                        href={section.href}
                                        onClick={(e) => go(e, sectionHref)}
                                        className="flex items-baseline gap-2.5 py-1.5"
                                      >
                                        <span className="font-mono text-eyebrow text-brand-ink">
                                          {practices[s]?.index}
                                        </span>
                                        <span className="font-display text-h3 font-semibold text-ink">
                                          {section.title}
                                        </span>
                                      </SiteLink>
                                      <ul className="mt-1">
                                        {section.items.map((leaf) => {
                                          const leafHref = href(leaf.href);
                                          return (
                                            <li key={leaf.label}>
                                              <SiteLink
                                                href={leaf.href}
                                                onClick={(e) => go(e, leafHref)}
                                                className="block py-2 text-body text-ink-2 transition-colors duration-300 hover:text-ink active:text-brand-ink"
                                              >
                                                {leaf.label}
                                              </SiteLink>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <motion.div variants={row} className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono text-eyebrow text-muted uppercase">Region</p>
              <RegionSwitcher size="lg" />
            </motion.div>

            <motion.div variants={row} className="mt-6">
              <ButtonLink
                href={href(ctas.project.href)}
                size="lg"
                onClick={(e) => go(e, href(ctas.project.href))}
                className="w-full"
              >
                {ctas.project.label}
              </ButtonLink>
            </motion.div>

            <motion.ul variants={row} className="mt-8 grid gap-2 sm:grid-cols-3">
              {offices.map((o) => (
                <li key={o.id}>
                  <a
                    href={`tel:${o.phoneTel}`}
                    className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 transition-colors duration-300 hover:border-line-strong"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink">
                      <Phone aria-hidden="true" className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-small font-medium text-ink">
                        {o.city}
                        {o.isHq && (
                          <span className="rounded-full bg-brand-soft px-1.5 py-0.5 font-mono text-[0.625rem] leading-none tracking-[0.12em] text-brand-ink">
                            HQ
                          </span>
                        )}
                      </span>
                      <span className="block text-small text-ink-2 tabular-nums">{o.phoneDisplay}</span>
                    </span>
                  </a>
                </li>
              ))}
            </motion.ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
