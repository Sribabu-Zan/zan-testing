import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { isInternalHref } from "@/lib/links";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   The page's buttons. Every call to action uses these, so a CTA looks and
   moves the same wherever it appears.

   primary    brand gradient pill — the one main action per view
   secondary  hairline outline on the page ground
   onBrand    for use ON a brand fill (the deck's gradient panels): a page-
              ground pill, because a brand pill on a brand panel disappears
   ghost      text with an arrow, for tertiary links
   ─────────────────────────────────────────────────────────────────────────── */

export type ButtonVariant = "primary" | "secondary" | "onBrand" | "ghost";
export type ButtonSize = "md" | "lg";

const base =
  "group/btn relative isolate inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-[-0.01em] whitespace-nowrap select-none " +
  "transition-[transform,box-shadow,background-color,background-position,color,border-color] duration-300 ease-out-expo active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-gradient text-on-brand shadow-[0_10px_24px_-12px_color-mix(in_oklab,var(--color-brand)_45%,transparent)] " +
    "hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-12px_color-mix(in_oklab,var(--color-brand)_60%,transparent)]",
  secondary:
    "border border-line-strong bg-bg/75 text-ink backdrop-blur-sm hover:-translate-y-0.5 hover:border-ink",
  onBrand: "bg-bg text-ink shadow-lift hover:-translate-y-0.5",
  ghost: "px-0! text-ink hover:text-brand-ink",
};

const sizes: Record<ButtonSize, string> = {
  md: "h-11 px-5 text-[0.9375rem]",
  lg: "h-13 px-7 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

function Arrow() {
  return (
    <ArrowUpRight
      aria-hidden="true"
      className="size-4 shrink-0 transition-transform duration-300 ease-out-expo group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
      strokeWidth={2}
    />
  );
}

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Trailing arrow. On by default for primary and ghost. */
  arrow?: boolean;
  /** Leading icon, e.g. a phone glyph on a tap-to-call button. */
  icon?: ReactNode;
  children: ReactNode;
};

/**
 * A call to action that navigates: a page of this site, an in-page anchor,
 * tel:, mailto: or an external URL. A path ("/pricing", "/#contact") goes
 * through next/link, so it never reloads the document; everything else is a
 * plain anchor.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow,
  icon,
  className,
  children,
  href,
  ...rest
}: Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const showArrow = arrow ?? (variant === "primary" || variant === "ghost");
  const body = (
    <>
      {icon}
      <span>{children}</span>
      {showArrow && <Arrow />}
    </>
  );
  const classes = buttonClasses({ variant, size, className });
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={classes} {...rest}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} className={classes} {...rest}>
      {body}
    </a>
  );
}

/** A call to action that does something on the page: submit, open, toggle. */
export function Button({
  variant = "primary",
  size = "md",
  arrow,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  const showArrow = arrow ?? variant === "primary";
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...rest}>
      {icon}
      <span>{children}</span>
      {showArrow && <Arrow />}
    </button>
  );
}
