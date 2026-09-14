"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { projects, workIntro } from "@/constants/zan";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Every discipline the case studies cover, in order of first appearance. */
const disciplines = Array.from(new Set(projects.map((p) => p.discipline)));

/**
 * The work wall's header, on white: the shared heading (second title line in
 * the brand gradient), then a hairline, the lead and a meta row derived from
 * the case studies themselves.
 */
export function WorkHeader({ headingId }: { headingId: string }) {
  return (
    <div className="container-zan pb-[clamp(3rem,9vh,6.5rem)] pt-[calc(var(--spacing-nav)+clamp(3rem,7vw,7rem))]">
      <SectionHeading
        id={headingId}
        eyebrow={workIntro.eyebrow}
        title={workIntro.title}
        size="display"
        accentLine={1}
      />

      <motion.div
        data-reveal
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -8% 0px" }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
      >
        <div aria-hidden="true" className="mt-9 h-px w-20 bg-brand" />
        <p className="mt-8 max-w-[56ch] text-lead text-ink-2">{workIntro.lead}</p>
        <p className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-eyebrow uppercase text-muted">
          <span className="text-ink">{projects.length} case studies</span>
          <span aria-hidden="true" className="size-1 rounded-full bg-brand" />
          <span>{disciplines.join(" · ")}</span>
        </p>
      </motion.div>
    </div>
  );
}
