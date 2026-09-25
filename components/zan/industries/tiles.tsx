import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Industry, Project } from "@/constants/zan";
import { getIndustryArt } from "@/constants/serviceArt";
import { CardPhoto } from "@/components/zan/page/cards";
import { ZanIcon } from "@/components/zan/ui/icons";
import { cn } from "@/lib/utils";

/* The carousel's two kinds of card. An industry card leads with a photograph
   of the sector bled to the card's top edge, then the sector and what we build
   for it. A case card pairs a case study with its own screenshot. Both fill
   the card frame the carousel gives them (3:4, ~300px wide). */

export type Tone = "soft" | "paper" | "surface" | "brand";

/* The picture band is the card's full width (industries.css sets that width:
   min(20rem, 78vw) on a phone, clamp(16rem, 21vw, 21rem) above 768px), and a
   1.6:1 file in a 3:2 band covers by height, so the picture painted is about
   1.07x the card. Rounded up at each step so the browser is never handed less
   than it paints. */
const tileBandSizes = "(min-width: 768px) 22.5rem, (min-width: 26rem) 21.5rem, 84vw";

const TONES: Record<Tone, string> = {
  soft: "bg-brand-soft text-ink",
  paper: "bg-paper text-ink",
  surface: "bg-surface text-ink ring-1 ring-inset ring-line",
  brand: "bg-brand-gradient text-on-brand",
};

export function IndustryTile({ industry, index, tone }: { industry: Industry; index: string; tone: Tone }) {
  const onBrand = tone === "brand";
  const art = getIndustryArt(industry.id);
  return (
    <article className={cn("relative flex h-full flex-col justify-between overflow-hidden p-6", TONES[tone])}>
      {/* The glyph is the watermark only where there is no photograph: behind
          one it would read as a smudge over the picture. */}
      {!art && (
        <ZanIcon
          name={industry.icon}
          strokeWidth={1}
          className={cn(
            "pointer-events-none absolute -right-10 -bottom-10 size-48",
            onBrand ? "text-on-brand opacity-[0.14]" : "text-brand-ink opacity-[0.07]",
          )}
        />
      )}
      {art ? (
        <span className="relative -mx-6 -mt-6 block overflow-hidden">
          <CardPhoto art={art} sizes={tileBandSizes} className="aspect-[3/2]" />
          <span className="absolute top-3 right-3 rounded-full bg-bg/90 px-2.5 py-1 font-mono text-eyebrow text-ink">
            {index}
          </span>
        </span>
      ) : (
        <div className="relative flex items-start justify-between gap-3">
          <span className="grid size-13 place-items-center rounded-2xl bg-bg shadow-lift">
            <ZanIcon name={industry.icon} className="size-7 text-brand-ink" />
          </span>
          <span className={cn("font-mono text-eyebrow uppercase", onBrand ? "text-on-brand" : "text-muted")}>
            {index}
          </span>
        </div>
      )}
      <div className="relative">
        <h3 className="font-display text-[clamp(1.375rem,1.2rem+0.5vw,1.625rem)] leading-[1.12] font-semibold text-balance">
          {industry.label}
        </h3>
        <p className={cn("mt-2.5 text-small", onBrand ? "text-on-brand" : "text-ink-2")}>{industry.description}</p>
      </div>
    </article>
  );
}

/* The case card's picture fills the whole 3:4 frame, and the file is 1.6:1,
   so a cover crop scales it to the frame's height and the rendered picture
   ends up about 2.1x the card's width. Asking for the card's width instead
   would fetch a variant less than half of what is painted, which is a soft
   picture on a card whose whole job is the picture. */
const caseMediaSizes = "(min-width: 768px) 45rem, (min-width: 26rem) 43rem, 167vw";

export function CaseMedia({ project }: { project: Project }) {
  if (!project.screenshot) return null;
  return <Image src={project.screenshot.src} alt="" fill sizes={caseMediaSizes} className="object-cover" />;
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
