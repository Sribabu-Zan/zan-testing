"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, PenLine, X } from "lucide-react";
import { ctas } from "@/constants/zan";
import { AssistantMark } from "@/components/zan/chat/AssistantMark";
import { ChatPanelLazy } from "@/components/zan/chat/ChatPanelLazy";
import { trackPopupView, trackWhatsAppClick } from "@/lib/analytics";
import { waLink } from "@/lib/links";
import { useSiteHref } from "@/lib/useSiteHref";
import { useRegion } from "@/lib/region";
import { cn } from "@/lib/utils";
import { SocialIcon } from "./SocialIcon";
import { usePreloaded } from "./shellStore";

/** Phones: back this long after scrolling stops, as on the old site. */
const REVEAL_DELAY = 100;
/** Scroll this far with the menu open and it folds away. */
const COLLAPSE_AFTER = 24;
const MOBILE = "(max-width: 767.98px)";
const EASE = [0.16, 1, 0.3, 1] as const;

const SHADOW = "shadow-[0_12px_28px_-12px_rgb(0_0_0/0.45)]";

const menu = {
  open: { transition: { staggerChildren: 0.045, staggerDirection: -1 } },
  closed: { transition: { staggerChildren: 0.03 } },
};
const row = {
  open: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
  closed: { opacity: 0, y: 10, transition: { duration: 0.16 } },
};

/** One row of the menu, so the three read as one set whatever they do. */
function Row({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  /** Colour for the glyph only. The pill itself is always a hairline on white. */
  tone: string;
}) {
  return (
    <span className="flex items-center gap-2.5 rounded-full border border-line-strong bg-bg py-2.5 pr-4 pl-3.5 text-small font-medium whitespace-nowrap text-ink shadow-lift transition-colors duration-300 group-hover/row:border-ink">
      <span aria-hidden="true" className={cn("grid size-5 shrink-0 place-items-center", tone)}>
        {icon}
      </span>
      {label}
    </span>
  );
}

/**
 * Contact Us, bottom-right.
 *
 * One button, and three ways to reach the company behind it: the assistant
 * (which hands off to a person), WhatsApp, and the enquiry form on the main
 * site. Tap-to-call is not repeated here — the navbar and the footer both
 * carry the regional number.
 *
 * Above the sections (z-40) and under the navbar, the mobile menu and the
 * preloader. On phones the whole dock steps out of the way while the page is
 * being scrolled and comes back 100ms after it stops; that toggles a data
 * attribute directly, so scrolling never re-renders anything.
 *
 * The chat panel is a sibling, not a child: the dock's scroll-away uses
 * `translate`, and a translated ancestor becomes the containing block for a
 * fixed descendant, which would drag the panel around with it.
 */
export function FloatingActions() {
  const region = useRegion();
  const href = useSiteHref();
  const entered = usePreloaded();
  const menuId = useId();

  const rootRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  /** Scroll position when the menu opened; null while it is closed. */
  const openedAtY = useRef<number | null>(null);
  /** Set when the chat was opened from here, so closing it hands focus back. */
  const returnFocus = useRef(false);

  const [open, setOpen] = useState(false);
  /** Mounted on the first "Chat with us" and kept, so a thread survives a close. */
  const [chatMounted, setChatMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const close = useCallback(() => {
    openedAtY.current = null;
    setOpen(false);
  }, []);

  const toggle = () => {
    if (open) {
      close();
    } else {
      openedAtY.current = window.scrollY;
      setOpen(true);
    }
  };

  const openChat = () => {
    close();
    returnFocus.current = true;
    setChatMounted(true);
    setChatOpen(true);
    // The site's only overlay, and the nearest thing it has to the live
    // site's popup. Named so the two can be told apart in the reports.
    trackPopupView("assistant_panel");
  };

  const closeChat = useCallback(() => setChatOpen(false), []);

  // Escape or the panel's own close button put focus back on Contact Us. It
  // has to wait for the commit that clears `inert` below, so it runs here
  // rather than inside the click handler.
  useEffect(() => {
    if (chatOpen || !returnFocus.current) return;
    returnFocus.current = false;
    toggleRef.current?.focus();
  }, [chatOpen]);

  // Phones: fold the menu once the page really moves, and step out of the way
  // while it scrolls. A nudge with the menu open is ignored.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const mobile = window.matchMedia(MOBILE);
    let timer = 0;

    // A pinned scene (a GSAP pin is position: fixed while active, a sticky
    // stage is position: sticky) holds its content still, so a visitor cannot
    // scroll its last row out from under the dock. While one fills the screen
    // behind the dock, the dock stays tucked away; the navbar still carries
    // the phone number and the menu.
    const coveredByPinnedStage = () => {
      const r = el.getBoundingClientRect();
      const x = Math.min(window.innerWidth - 1, Math.max(0, r.left + r.width / 2));
      const y = Math.min(window.innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const h = window.innerHeight;
      for (const hit of document.elementsFromPoint(x, y)) {
        if (el.contains(hit)) continue;
        for (let node: Element | null = hit; node && node !== document.body; node = node.parentElement) {
          const pos = getComputedStyle(node).position;
          if (pos !== "fixed" && pos !== "sticky") continue;
          const b = node.getBoundingClientRect();
          if (b.top <= 1 && b.bottom >= h - 1 && b.height >= h * 0.9) return true;
        }
        return false;
      }
      return false;
    };
    const checkPinned = () => {
      if (mobile.matches && coveredByPinnedStage()) el.dataset.pinned = "1";
      else delete el.dataset.pinned;
    };

    const onScroll = () => {
      if (!mobile.matches) return;
      if (openedAtY.current !== null) {
        if (Math.abs(window.scrollY - openedAtY.current) <= COLLAPSE_AFTER) return;
        close();
      }
      el.dataset.scrolling = "1";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        checkPinned();
        delete el.dataset.scrolling;
      }, REVEAL_DELAY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    checkPinned();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      delete el.dataset.scrolling;
      delete el.dataset.pinned;
    };
  }, [close]);

  // While the menu is open: an outside pointer or Escape folds it.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!dialRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      toggleRef.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  /** Drop-in after the preloader. */
  const reveal: CSSProperties = {
    opacity: entered ? 1 : 0,
    transform: entered ? "none" : "translateY(14px)",
    transitionDelay: entered ? "0.35s" : "0s",
  };

  return (
    <>
      <div
        ref={rootRef}
        // While the chat is up the dock would only get in its way, and its
        // menu sits a layer below the panel. It goes away and comes back with
        // the panel, inert so it cannot be tabbed into meanwhile.
        inert={chatOpen}
        className={cn(
          "fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 sm:right-6 sm:bottom-6",
          "transition-[opacity,translate] duration-300 ease-out-expo",
          "max-md:data-scrolling:pointer-events-none max-md:data-scrolling:translate-y-4 max-md:data-scrolling:opacity-0",
          "max-md:data-pinned:pointer-events-none max-md:data-pinned:translate-y-4 max-md:data-pinned:opacity-0",
          chatOpen && "pointer-events-none translate-y-3 opacity-0",
        )}
      >
        <div
          ref={dialRef}
          data-reveal
          className="flex flex-col items-end gap-3 transition-[opacity,transform] duration-500 ease-out-expo"
          style={reveal}
        >
          <AnimatePresence>
            {open && (
              <motion.ul
                id={menuId}
                key="menu"
                aria-label="Ways to contact us"
                variants={menu}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex flex-col items-end gap-2.5"
              >
                <motion.li variants={row}>
                  <button
                    type="button"
                    onClick={openChat}
                    data-contact="chat"
                    className="group/row block rounded-full"
                  >
                    <Row
                      icon={<AssistantMark className="size-[1.125rem]" />}
                      label="Chat with us"
                      tone="text-brand-ink"
                    />
                  </button>
                </motion.li>

                <motion.li variants={row}>
                  <a
                    href={waLink(region.whatsapp, region.brandName)}
                    target="_blank"
                    rel="noopener"
                    onClick={() => {
                      trackWhatsAppClick("Floating WhatsApp Button");
                      close();
                    }}
                    data-contact="whatsapp"
                    aria-label="WhatsApp (opens in a new tab)"
                    className="group/row block rounded-full"
                  >
                    <Row
                      icon={<SocialIcon name="WhatsApp" className="size-[1.125rem]" />}
                      label="WhatsApp"
                      tone="text-whatsapp"
                    />
                  </a>
                </motion.li>

                <motion.li variants={row}>
                  <a
                    href={href(ctas.contact.href)}
                    onClick={close}
                    data-contact="enquiry"
                    className="group/row block rounded-full"
                  >
                    <Row
                      icon={<PenLine aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.9} />}
                      label="Enquiry"
                      tone="text-brand-ink"
                    />
                  </a>
                </motion.li>
              </motion.ul>
            )}
          </AnimatePresence>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={toggle}
            data-contact="toggle"
            className={cn(
              "flex h-12 items-center gap-2.5 rounded-full bg-brand-gradient px-4 text-on-brand sm:h-13 sm:px-5",
              SHADOW,
              "transition-transform duration-300 ease-out-expo active:scale-95",
            )}
          >
            <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center">
              {open ? (
                <X className="size-[1.375rem]" strokeWidth={2.1} />
              ) : (
                <MessageSquare className="size-[1.375rem]" strokeWidth={2} />
              )}
            </span>
            {/* The label never changes — a pill that grows to "Close contact
                options" shifts the whole dock sideways, and `aria-expanded`
                already tells a screen reader which way the button goes.
                Below 380px it crowds the edge of the screen, so there it steps
                back to the accessible name only. */}
            <span className="sr-only text-small font-semibold min-[380px]:not-sr-only">
              {ctas.contact.label}
            </span>
          </button>
        </div>
      </div>

      {/* Nothing of the panel — its code included — exists until the first
          time someone chooses Chat with us. */}
      {chatMounted && <ChatPanelLazy open={chatOpen} onClose={closeChat} />}
    </>
  );
}
