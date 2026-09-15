import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ZanIcon } from "@/components/zan/ui/icons";
import type { Client, Practice, Project, ServiceItem } from "@/constants/zan";
import { cn } from "@/lib/utils";
import { ProjectArt } from "./ProjectArt";
import { SiteLink } from "./SiteLink";

/* ───────────────────────────────────────────────────────────────────────────
   The three kinds of card on the work wall — a case study, a client and a
   service — all real content. Each lifts on hover (and on keyboard focus for
   the linked ones) and reveals one more detail.

   Hover uses the `translate` property, so it composes with the row's drift
   transform rather than fighting it.
   ─────────────────────────────────────────────────────────────────────────── */

const cardBase =
  "group/card relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line shadow-lift " +
  "transition-[translate,box-shadow] duration-500 ease-out-expo hover:-translate-y-2.5 hover:shadow-float";

const linkFocus = "focus-visible:-translate-y-2.5 focus-visible:shadow-float";

const mono = "font-mono text-[0.6875rem] uppercase tracking-[0.14em]";

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
            sizes="(min-width: 1024px) 26vw, (min-width: 768px) 19.5rem, 76vw"
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

/* ── Client ───────────────────────────────────────────────────────────────── */

export function ClientCard({ client }: { client: Client }) {
  return (
    <div className={cn(cardBase, "bg-bg text-ink")}>
      {/* The logo exactly as supplied, on its white plate. */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-bg">
        <Image
          src={client.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 22vw, (min-width: 768px) 17rem, 66vw"
          className="scale-[1.2] object-contain transition-[scale] duration-700 ease-out-expo group-hover/card:scale-[1.28]"
        />
      </div>
      <div className="border-t border-line px-4 py-3 lg:px-5 lg:py-4">
        <p className="text-[0.9375rem] font-semibold leading-snug lg:text-body">{client.name}</p>
        <p className="line-clamp-1 text-[0.8125rem] text-muted">{client.sector}</p>
      </div>

      {/* Detail reveal */}
      <span
        className={cn(
          mono,
          "absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-brand-ink",
          "translate-y-1 opacity-0 transition-[opacity,translate] duration-500 ease-out-expo group-hover/card:translate-y-0 group-hover/card:opacity-100",
        )}
      >
        <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
        Client
      </span>
    </div>
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
  return (
    <SiteLink href={service.href} className={cn(cardBase, linkFocus, TONES[tone], "justify-between p-5 lg:p-6")}>
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

      <div>
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
