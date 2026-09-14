import { TechMorph } from "@/components/zan/tech/TechMorph";
import { DomainGrid } from "@/components/zan/tech/DomainGrid";

/**
 * Technology — the reference's scroll-morph ring of vendor logos around the
 * heading, opening into an arc as you scroll; then the stack by domain as a
 * plain grid, which is the content the ring decorates.
 */
export function TechStack() {
  return (
    <section id="technology" className="relative bg-surface">
      <TechMorph />
      <div className="container-zan pb-section pt-12 md:pt-6">
        <p className="mb-6 font-mono text-eyebrow uppercase text-muted">By domain</p>
        <DomainGrid />
      </div>
    </section>
  );
}
