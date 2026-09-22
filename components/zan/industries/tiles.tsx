import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Industry, Project } from "@/constants/zan";
import { ZanIcon } from "@/components/zan/ui/icons";
import { cn } from "@/lib/utils";

/* The carousel's two kinds of card. Industry cards are designed, not
   photographed: a large icon, the sector and what we build for it. Case
   cards pair a case study with its sector imagery (stock, decorative).
   Both fill the card frame the carousel gives them (3:4, ~300px wide). */

export type Tone = "soft" | "paper" | "surface" | "brand";

const TONES: Record<Tone, string> = {
  soft: "bg-brand-soft text-ink",
  paper: "bg-paper text-ink",
  surface: "bg-surface text-ink ring-1 ring-inset ring-line",
  brand: "bg-brand-gradient text-on-brand",
};

export function IndustryTile({ industry, index, tone }: { industry: Industry; index: string; tone: Tone }) {
  const onBrand = tone === "brand";
  return (
    <article className={cn("relative flex h-full flex-col justify-between overflow-hidden p-6", TONES[tone])}>
      <ZanIcon
        name={industry.icon}
        strokeWidth={1}
        className={cn(
          "pointer-events-none absolute -bottom-10 -right-10 size-48",
          onBrand ? "text-on-brand opacity-[0.14]" : "text-brand-ink opacity-[0.07]",
        )}
      />
      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            "grid size-13 place-items-center rounded-2xl",
            onBrand ? "bg-on-brand/15" : "bg-bg shadow-lift",
          )}
        >
          <ZanIcon name={industry.icon} className={cn("size-7", onBrand ? "text-on-brand" : "text-brand-ink")} />
        </span>
        <span className={cn("font-mono text-eyebrow uppercase", onBrand ? "text-on-brand" : "text-muted")}>{index}</span>
      </div>
      <div className="relative">
        <h3 className="font-display text-[clamp(1.375rem,1.2rem+0.5vw,1.625rem)] leading-[1.12] font-semibold text-balance">
          {industry.label}
        </h3>
        <p className={cn("mt-2.5 text-small", onBrand ? "text-on-brand" : "text-ink-2")}>{industry.description}</p>
      </div>
    </article>
  );
}

export function CaseMedia({ project }: { project: Project }) {
  if (!project.screenshot) return null;
  return (
    <Image
      src={project.screenshot.src}
      alt=""
      fill
      sizes="(max-width: 767px) 80vw, 340px"
      className="object-cover"
    />
  );
}

export function CaseCaption({ project }: { project: Project }) {
  return (
    <a
      href="#case-studies"
      className="group absolute inset-0 z-[2] flex flex-col justify-end p-3 outline-offset-[-4px] sm:p-4"
    >
      <span className="block rounded-2xl bg-bg p-4 shadow-lift sm:p-5">
        <span className="flex items-center justify-between gap-3">
          <span className="font-mono text-eyebrow uppercase text-brand-ink">{project.industry}</span>
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 shrink-0 text-ink transition-transform duration-300 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
        <span className="mt-2 block text-h3 text-ink">{project.name}</span>
        <span className="mt-1 block text-small text-muted">{project.discipline}</span>
      </span>
    </a>
  );
}
