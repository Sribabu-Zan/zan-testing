import { chapters, processIntro } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { ProcessStage } from "@/components/zan/process/ProcessStage";

/**
 * Process, headed by Chapter 03 ("How we work"). Desktop: Apple's pinned
 * laptop, turning through Zan's four stages while each stage's box rises in
 * beside it. Below 1024px: the laptop pinned at the top, one full turn per
 * card. Reduced motion (or desktop without WebGL): a static timeline.
 */
export function Process() {
  const c = chapters.process;
  return (
    <section id="process" aria-labelledby="process-heading" className="relative bg-surface pb-section">
      <div className="container-zan pb-10 pt-section lg:pb-6">
        <SectionHeading id="process-heading" eyebrow={c.eyebrow} title={[c.label.join(" ")]} />
        <p className="mt-5 max-w-[40ch] text-balance text-h3 text-ink">{processIntro.title.join(" ")}</p>
        <p className="mt-3 max-w-[54ch] text-lead text-ink-2">{processIntro.lead}</p>
      </div>
      <ProcessStage />
    </section>
  );
}
