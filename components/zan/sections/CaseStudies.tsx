import { ScrollExpand } from "@/components/animations/ScrollExpand";
import { ProjectShowcase } from "@/components/ui/project-showcase";
import { SiteButtonLink } from "@/components/zan/work/SiteLink";
import { ctas, projects } from "@/constants/zan";

/**
 * Case studies (#case-studies) — a light panel that opens from an inset card
 * to full width as it rises, holding the five projects as editorial rows.
 * Each row opens to the brief: challenge, solution, results and stack.
 */
export function CaseStudies() {
  return (
    <section
      id="case-studies"
      aria-labelledby="case-studies-title"
      className="relative bg-surface pt-[clamp(2.5rem,5vw,5rem)]"
    >
      <ScrollExpand>
        <div className="mx-auto w-full max-w-[72rem] px-6 pb-section pt-[clamp(3rem,6vw,5.5rem)] sm:px-10 lg:px-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 lg:mb-12">
            <h2 id="case-studies-title" className="font-display text-h1 text-ink">
              Case studies
            </h2>
            <p className="pb-2 font-mono text-eyebrow uppercase text-muted">
              Challenge · Solution · Results
            </p>
          </div>
          <ProjectShowcase projects={projects} />
          <div className="mt-10 lg:mt-14">
            <SiteButtonLink href={ctas.portfolio.href} variant="secondary" arrow>
              {ctas.portfolio.label}
            </SiteButtonLink>
          </div>
        </div>
      </ScrollExpand>
    </section>
  );
}
