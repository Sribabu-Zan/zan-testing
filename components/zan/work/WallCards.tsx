import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getServiceArt } from "@/constants/serviceArt";
import { ZanIcon } from "@/components/zan/ui/icons";
import type { Practice, Project, ServiceItem } from "@/constants/zan";
import { cn } from "@/lib/utils";
import { ProjectArt } from "./ProjectArt";
import { SiteLink } from "./SiteLink";

/* ───────────────────────────────────────────────────────────────────────────
   The two kinds of card on the work wall — a case study and a service — both
   real content. Each lifts on hover (and on keyboard focus) and reveals one
   more detail.

   Both are built the same way: a picture across the top of the card, a label
   chipped onto its corner, then the words underneath. A case study shows the
   photograph of its sector, a service the photograph from its own page
   (constants/serviceHero.ts, through getServiceArt), so the wall reads as one
   set of cards rather than two kinds side by side.

   The client marks are not here: a logo is not a project, and the wall's
   heading says "Projects we have delivered". They live in Partners.

   Hover uses the `translate` property, so it composes with the row's drift
   transform rather than fighting it.
   ─────────────────────────────────────────────────────────────────────────── */

const cardBase =
  "group/card relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line shadow-lift " +
  "transition-[translate,box-shadow] duration-500 ease-out-expo hover:-translate-y-2.5 hover:shadow-float";

const linkFocus = "focus-visible:-translate-y-2.5 focus-visible:shadow-float";

const mono = "font-mono text-[0.6875rem] uppercase tracking-[0.14em]";

/* What the picture band asks next/image for. The band is the card's full
   width, and wall.css gives a card max(19rem, 26vw) from 1024px up — so 26vw
   alone understates it until the viewport passes 1170px, which is where that
   max() changes hands. Below 379px the card is 76vw rather than 18rem. The
   band is wider than it is tall (~2.8:1) against a 1.6:1 file, so the crop
   takes the file's full width and its height is what gets cut: the width the
   browser needs is the card's own. */
const bandSizes =
  "(min-width: 1170px) 26vw, (min-width: 1024px) 19rem, (min-width: 768px) 19.5rem, (min-width: 379px) 18rem, 76vw";

/* ── Case study ───────────────────────────────────────────────────────────── */

export function CaseCard({ project }: { project: Project }) {
  const lead = project.results[0];
  return (
    <a href={`#case-${project.id}`} className={cn(cardBase, linkFocus, "bg-bg text-ink")}>
      <div className="relative h-[42%] shrink-0 overflow-hidden bg-surface">
        {project.screenshot ? (
          <Image
            src={project.screenshot.src}
            alt=""
            fill
            sizes={bandSizes}
            className="object-cover transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.05]"
          />
        ) : (
          <ProjectArt
            project={project}
            className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.05]"
          />
        )}
        <span className={cn(mono, "absolute left-3 top-3 rounded-full border border-line bg-bg px-2.5 py-1 text-ink")}>
          Case {project.index}
        </span>

        {/* Detail reveal */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-3 border-t border-line bg-bg px-4 py-2.5",
            "transition-transform duration-500 ease-out-expo group-hover/card:translate-y-0 group-focus-visible/card:translate-y-0",
          )}
        >
          <span className={cn(mono, "text-muted")}>{project.timeline}</span>
          <span className="inline-flex items-center gap-1 text-small font-medium text-brand-ink">
            Read the case
            <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={2} />
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 p-4 lg:p-5">
        <p className="flex items-end gap-3">
          <span className="font-sans text-[clamp(1.875rem,1.1rem+2.4vw,3.25rem)] font-bold leading-[0.9] tracking-[-0.04em] text-ink">
            {lead.value}
          </span>
          <span className="max-w-[15ch] pb-0.5 text-[0.8125rem] leading-tight text-ink-2 lg:text-small">{lead.metric}</span>
        </p>
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-[0.9375rem] font-semibold leading-snug lg:text-body">{project.name}</h3>
          <p className="mt-0.5 line-clamp-2 text-[0.8125rem] text-muted">
            {project.discipline} · {project.industry}
          </p>
        </div>
      </div>
    </a>
  );
}

/* ── Service ──────────────────────────────────────────────────────────────── */

export type ServiceTone = "soft" | "paper" | "surface" | "brand";

const TONES: Record<ServiceTone, string> = {
  soft: "bg-brand-soft text-ink",
  paper: "bg-paper text-ink",
  surface: "bg-surface text-ink",
  brand: "bg-brand-gradient text-on-brand border-transparent",
};

export function ServiceCard({
  service,
  practice,
  tone,
}: {
  service: ServiceItem;
  practice: Practice;
  tone: ServiceTone;
}) {
  const onBrand = tone === "brand";
  // The service's own photograph, the same file the top of its page uses. The
  // glyph below is what a service falls back to until one has been shot.
  const art = getServiceArt(service.id);
  return (
    <SiteLink
      href={service.href}
      className={cn(cardBase, linkFocus, TONES[tone], "justify-between", art ? "" : "p-5 lg:p-6")}
    >
      {art ? (
        // The same band a case study leads with: 42% of the card, the label
        // chipped onto the corner, and the picture easing in on hover.
        <div className="relative h-[42%] shrink-0 overflow-hidden bg-surface">
          <Image
            src={art.src}
            alt=""
            fill
            sizes={bandSizes}
            className="object-cover transition-transform duration-700 ease-out-expo group-hover/card:scale-[1.05]"
          />
          <span
            className={cn(mono, "absolute top-3 left-3 rounded-full border border-line bg-bg px-2.5 py-1 text-ink")}
          >
            {practice.title}
          </span>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-2xl lg:size-12",
              onBrand ? "bg-on-brand/15 text-on-brand" : "bg-bg text-brand-ink shadow-lift",
            )}
          >
            <ZanIcon name={service.icon} className="size-5 lg:size-6" />
          </span>
          <span className={cn(mono, "pt-1 text-right", onBrand ? "text-on-brand/80" : "text-muted")}>
            {practice.title}
          </span>
        </div>
      )}

      <div className={art ? "min-h-0 flex-1 p-4 lg:p-5" : ""}>
        <h3 className="text-h3 font-semibold text-balance">{service.title}</h3>
        <p className={cn("mt-1.5 text-small font-medium", onBrand ? "text-on-brand/85" : "text-brand-ink")}>
          {service.tagline}
        </p>
        <p
          className={cn(
            "mt-2 hidden text-[0.8125rem] leading-snug lg:line-clamp-2",
            onBrand ? "text-on-brand/85" : "text-ink-2",
          )}
        >
          {service.description}
        </p>
        {/* Detail reveal */}
        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-500 ease-out-expo group-hover/card:grid-rows-[1fr] group-hover/card:opacity-100 group-focus-visible/card:grid-rows-[1fr] group-focus-visible/card:opacity-100">
          <span className="overflow-hidden">
            <span
              className={cn(
                "inline-flex items-center gap-1 pt-3 text-small font-medium",
                onBrand ? "text-on-brand" : "text-brand-ink",
              )}
            >
              View service
              <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={2} />
            </span>
          </span>
        </div>
      </div>
    </SiteLink>
  );
}
