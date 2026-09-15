"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Phone } from "lucide-react";
import { ctas, mainNav, site } from "@/constants/zan";
import { ButtonLink } from "@/components/zan/ui/Button";
import { ZanLogo } from "@/components/zan/ui/ZanLogo";
import { SiteLink } from "@/components/zan/services/SiteLinks";
import { useSiteHref } from "@/lib/useSiteHref";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";
import { FloatingActions } from "./FloatingActions";
import { MegaMenu } from "./MegaMenu";
import { MenuToggle } from "./MenuToggle";
import { MobileMenu } from "./MobileMenu";
import { RegionSwitcher } from "./RegionSwitcher";
import { usePreloaded } from "./shellStore";

/* ── Scroll state ─────────────────────────────────────────────────────────────
   One passive listener shared by every subscriber; the snapshot is a boolean:
   has the page moved past 24px (solid bar).

   The bar NEVER hides on scroll. It used to slide away while reading down,
   and on this page that mostly happened inside pinned scenes (the dial, the
   showreel, the services deck), where scrolling down does not move the page
   and the reader lost the one fixed thing to orient by: on a phone the top of
   the deck read as the page slipping behind the screen. A 72px bar is a small
   price for a header that is always there. */

const SOLID_AT = 24;

let navScrolled = false;
const navListeners = new Set<() => void>();

function readScroll() {
  const next = window.scrollY > SOLID_AT;
  if (next !== navScrolled) {
    navScrolled = next;
    navListeners.forEach((l) => l());
  }
}

function subscribeScroll(onChange: () => void) {
  if (navListeners.size === 0) {
    navScrolled = window.scrollY > SOLID_AT;
    window.addEventListener("scroll", readScroll, { passive: true });
  }
  navListeners.add(onChange);
  return () => {
    navListeners.delete(onChange);
    if (navListeners.size === 0) window.removeEventListener("scroll", readScroll);
  };
}

function useNavScrolled() {
  return useSyncExternalStore(
    subscribeScroll,
    () => navScrolled,
    () => false,
  );
}

/* ── Navbar ───────────────────────────────────────────────────────────────── */

const HOVER_OPEN_MS = 110;
const HOVER_CLOSE_MS = 220;

/** The tab for the page being read, and for every page under it. */
const onPath = (pathname: string, href: string) =>
  href !== "/" && (pathname === href || pathname.startsWith(`${href}/`));

/**
 * The company bar: logo (back to the top of this page), the four tabs —
 * pages of the main site; Services opens the mega menu — the region switcher,
 * the region office's phone and "Contact Us". Below 1280px the tabs fold into
 * the full-screen mobile menu. It also mounts the floating contact buttons.
 *
 * Transparent at the very top of the page; from the first 24px of scroll it
 * sits on a solid light ground with a hairline, and it stays on screen the
 * whole way down (see the scroll state above). It drops in once the preloader
 * has left.
 */
export function Navbar() {
  const { office } = useRegion();
  const href = useSiteHref();
  const pathname = usePathname();
  const entered = usePreloaded();
  const scrolled = useNavScrolled();

  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const hoverOpenedAt = useRef(0);
  const focusFirstOnOpen = useRef(false);

  const megaId = useId();
  const mobileId = useId();

  const solid = scrolled || megaOpen;

  /* Mega menu: hover intent (mouse only — a touch "hover" is followed by a
     click, which would toggle straight back shut). */
  const clearTimers = () => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  };
  const hoverOpen = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(closeTimer.current);
    if (megaOpen) return;
    openTimer.current = window.setTimeout(() => {
      hoverOpenedAt.current = performance.now();
      setMegaOpen(true);
    }, HOVER_OPEN_MS);
  };
  const hoverClose = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), HOVER_CLOSE_MS);
  };
  const closeMega = useCallback((returnFocus = false) => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
    setMegaOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const onTriggerClick = () => {
    clearTimers();
    // A click that lands just after hover opened the menu means "open", not
    // "toggle shut".
    if (megaOpen && performance.now() - hoverOpenedAt.current < 450) return;
    setMegaOpen((v) => !v);
  };

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusFirstOnOpen.current = true;
      if (megaOpen) panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
      else setMegaOpen(true);
    }
  };

  // Focus leaving the trigger + panel pair closes the menu.
  const onServicesBlur = (e: FocusEvent<HTMLLIElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && e.currentTarget.contains(next)) return;
    if (next) closeMega();
  };

  // While the mega menu is open: Escape, an outside press and scrolling close it.
  useEffect(() => {
    if (!megaOpen) return;
    if (focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    }
    const openedAtY = window.scrollY;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closeMega(true);
    };
    const onDown = (e: globalThis.PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) closeMega();
    };
    const onScroll = () => {
      if (Math.abs(window.scrollY - openedAtY) > 40) closeMega();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [megaOpen, closeMega]);

  useEffect(() => clearTimers, []);

  const closeMobile = useCallback((opts?: { restoreFocus?: boolean }) => {
    setMobileOpen(false);
    if (opts?.restoreFocus) requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);

  const tabClass = (isOpen: boolean) =>
    cn(
      "group/tab relative inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-small font-medium tracking-[-0.01em] transition-colors duration-300",
      isOpen ? "text-ink" : "text-ink-2 hover:text-ink",
    );

  // Hover wipe: in from the left, out to the right. Held while the mega
  // menu is open, so the tab it belongs to stays marked.
  const underline = (held: boolean) => (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-3.5 bottom-1 h-[1.5px] rounded-full bg-brand-ink",
        "transition-[scale] duration-500 ease-out-expo",
        held
          ? "origin-left scale-x-100"
          : "origin-right scale-x-0 group-hover/tab:origin-left group-hover/tab:scale-x-100 group-focus-visible/tab:origin-left group-focus-visible/tab:scale-x-100",
      )}
    />
  );

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 h-nav"
      >
        {/* The ground is its own layer so it can fade in without fading the
            bar's content. Solid, not frosted: over the pinned scenes a
            translucent bar let the half-scrolled content under it read
            through, as if the page had slid behind the header. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 -z-10 border-b border-line bg-bg shadow-nav",
            "transition-opacity duration-500 ease-smooth",
            solid ? "opacity-100" : "opacity-0",
          )}
        />

        <div
          data-reveal
          className="h-full transition-[opacity,transform] duration-700 ease-out-expo"
          // The short delay lands the drop-in as the preloader's panel clears
          // the top of the screen.
          style={{
            opacity: entered ? 1 : 0,
            transform: entered ? "none" : "translateY(-18px)",
            transitionDelay: entered ? "0.2s" : "0s",
          }}
        >
          <div className="container-zan flex h-full items-center justify-between gap-3 xl:grid xl:grid-cols-[1fr_auto_1fr] xl:gap-6">
            <SiteLink
              href="#main"
              aria-label={`${site.name} home`}
              className="-ml-1 inline-flex shrink-0 items-center rounded-lg p-1 transition-opacity duration-300 hover:opacity-75"
            >
              <ZanLogo eager className="h-7 sm:h-8" />
            </SiteLink>

            <nav aria-label="Primary" className="hidden xl:block">
              <ul className="flex items-center gap-0.5">
                {mainNav.map((item) => {
                  const active = onPath(pathname, item.href);
                  if (item.sections?.length) {
                    return (
                      <li
                        key={item.label}
                        onPointerEnter={hoverOpen}
                        onPointerLeave={hoverClose}
                        onBlur={onServicesBlur}
                      >
                        <button
                          ref={triggerRef}
                          type="button"
                          aria-expanded={megaOpen}
                          aria-controls={megaId}
                          aria-haspopup="true"
                          onClick={onTriggerClick}
                          onKeyDown={onTriggerKeyDown}
                          aria-current={active ? "page" : undefined}
                          className={tabClass(megaOpen || active)}
                        >
                          {item.label}
                          <ChevronDown
                            aria-hidden="true"
                            className={cn(
                              "size-3.5 shrink-0 transition-transform duration-500 ease-out-expo",
                              megaOpen && "rotate-180",
                            )}
                          />
                          {underline(megaOpen || active)}
                        </button>
                        <MegaMenu
                          ref={panelRef}
                          id={megaId}
                          open={megaOpen}
                          onChoose={() => closeMega()}
                          onPointerEnter={() => window.clearTimeout(closeTimer.current)}
                          onPointerLeave={hoverClose}
                        />
                      </li>
                    );
                  }
                  return (
                    <li key={item.label}>
                      <SiteLink
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={tabClass(active)}
                      >
                        {item.label}
                        {underline(active)}
                      </SiteLink>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <RegionSwitcher className="hidden sm:grid" />
              <a
                href={`tel:${office.phoneTel}`}
                className="hidden h-10 items-center gap-2 rounded-full px-2 text-small font-medium whitespace-nowrap text-ink-2 transition-colors duration-300 hover:text-brand-ink lg:inline-flex"
              >
                <Phone aria-hidden="true" className="size-4 shrink-0 text-brand-ink" />
                <span className="sr-only">Call {office.city}: </span>
                <span className="tabular-nums">{office.phoneDisplay}</span>
              </a>
              <ButtonLink href={href(ctas.contact.href)} className="hidden sm:inline-flex">
                {ctas.contact.label}
              </ButtonLink>
              <a
                href={`tel:${office.phoneTel}`}
                aria-label={`Call ${office.city}: ${office.phoneDisplay}`}
                className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-bg text-ink transition-colors duration-300 hover:border-line-strong hover:text-brand-ink lg:hidden"
              >
                <Phone aria-hidden="true" className="size-[1.125rem]" />
              </a>
              <MenuToggle
                ref={toggleRef}
                open={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
                controls={mobileId}
                className="xl:hidden"
              />
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} id={mobileId} onClose={closeMobile} />
      <FloatingActions />
    </>
  );
}
