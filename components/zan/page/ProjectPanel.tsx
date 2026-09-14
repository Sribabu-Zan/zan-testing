import Image from "next/image";
import type { Project } from "@/constants/zan";
import { ProjectArt } from "@/components/zan/work/ProjectArt";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const mono = "font-mono text-eyebrow uppercase";

/**
 * One case study in full: the brief we were given, what we built, the figures
 * the client reported and the stack it runs on. Every word and number comes
 * from constants/zan.ts; nothing here is a claim this site invents.
 *
 * Panels alternate sides on wide screens so a run of five reads as a column
 * of separate pieces rather than one long table.
 */
export function ProjectPanel({ project, flip = false }: { project: Project; flip?: boolean }) {
  return (
    <article
      id={`case-${project.id}`}
      aria-labelledby={`case-${project.id}-title`}
      className="scroll-mt-nav border-t border-line pt-10 first:border-t-0 first:pt-0 sm:pt-14"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <Reveal className={cn("lg:col-span-5", flip && "lg:order-last")}>
          <div className="overflow-hidden rounded-3xl border border-line bg-surface">
            <div className="relative aspect-[4/3]">
              {project.screenshot ? (
                <Image
                  src={project.screenshot.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 34vw, (min-width: 640px) 90vw, 92vw"
                  className="object-cover"
                />
              ) : (
                <ProjectArt project={project} className="absolute inset-0" />
              )}
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {project.results.map((r) => (
              <div key={r.metric} className="bg-bg px-4 py-4">
                <dt className="sr-only">{r.metric}</dt>
                <dd>
                  <span className="block font-sans text-[clamp(1.5rem,1.2rem+1.2vw,2rem)] leading-none font-bold tracking-[-0.03em] text-ink tabular-nums">
                    {r.value}
                  </span>
                  <span className="mt-2 block text-[0.8125rem] leading-snug text-muted">{r.metric}</span>
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.08} className="lg:col-span-7">
          <p className={cn(mono, "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted")}>
            <span className="text-brand-ink">{project.index}</span>
            <span aria-hidden="true">/</span>
            <span>{project.discipline}</span>
            <span aria-hidden="true">/</span>
            <span>{project.industry}</span>
            <span aria-hidden="true">/</span>
            <span>{project.timeline}</span>
          </p>

          <h3 id={`case-${project.id}-title`} className="mt-4 font-display text-h2 text-balance text-ink">
            {project.name}
          </h3>

          <div className="mt-7 space-y-6">
            <div>
              <h4 className={cn(mono, "text-muted")}>The brief</h4>
              <p className="mt-2.5 max-w-[62ch] text-body text-ink-2">{project.challenge}</p>
            </div>
            <div>
              <h4 className={cn(mono, "text-muted")}>What we built</h4>
              <p className="mt-2.5 max-w-[62ch] text-body text-ink-2">{project.solution}</p>
            </div>
          </div>

          <ul className="mt-7 flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8125rem] leading-none text-ink-2"
              >
                {tech}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </article>
  );
}
