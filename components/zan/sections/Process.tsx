import { processIntro } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { ProcessStage } from "@/components/zan/process/ProcessStage";

/**
 * Process — Apple's pinned laptop, turning through Zan's four stages: its
 * screen changes to each stage while the stage's box rises in beside it.
 * On phones, with reduced motion or without WebGL, a timeline.
 */
export function Process() {
  return (
    <section id="process" className="relative bg-surface pb-section">
      <div className="container-zan pb-12 pt-section lg:pb-6">
        <SectionHeading eyebrow={processIntro.eyebrow} title={processIntro.title} lead={processIntro.lead} />
      </div>
      <ProcessStage />
    </section>
  );
}
