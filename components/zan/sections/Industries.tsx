import "@/components/zan/industries/industries.css";
import { industries, projects } from "@/constants/zan";
import { ScrollTiltedGrid, type TiltedGridItem } from "@/components/ui/scroll-tilted-grid";
import { IndustriesIntro } from "@/components/zan/industries/IndustriesIntro";
import { Starfield } from "@/components/zan/industries/Starfield";
import { CaseCaption, CaseMedia, IndustryTile, type Tone } from "@/components/zan/industries/tiles";

/** Tones for the eight industry tiles, so neighbours never match. */
const TONES: readonly Tone[] = ["soft", "paper", "brand", "surface", "paper", "soft", "surface", "brand"];

/** The case studies that carry sector imagery. */
const CASES = projects.filter((p) => p.screenshot);

/** Two industries, then a case study — so the imagery alternates sides. */
const SLOTS: readonly { kind: "industry" | "case"; i: number }[] = [
  { kind: "industry", i: 0 },
  { kind: "case", i: 0 },
  { kind: "industry", i: 1 },
  { kind: "industry", i: 2 },
  { kind: "case", i: 1 },
  { kind: "industry", i: 3 },
  { kind: "industry", i: 4 },
  { kind: "case", i: 2 },
  { kind: "industry", i: 5 },
  { kind: "industry", i: 6 },
  { kind: "case", i: 3 },
  { kind: "industry", i: 7 },
];

const ITEMS: TiltedGridItem[] = SLOTS.flatMap((slot): TiltedGridItem[] => {
  if (slot.kind === "case") {
    const p = CASES[slot.i];
    return p ? [{ key: p.id, media: <CaseMedia project={p} />, node: <CaseCaption project={p} /> }] : [];
  }
  const ind = industries[slot.i];
  return ind
    ? [
        {
          key: ind.id,
          node: (
            <IndustryTile industry={ind} index={String(slot.i + 1).padStart(2, "0")} tone={TONES[slot.i % TONES.length]} />
          ),
        },
      ]
    : [];
});

/**
 * Industries — the reference's tilted grid on paper. A title card, then the
 * eight sectors interleaved with the four case studies that have imagery;
 * each tile tilts up out of the page and into focus as it crosses the middle.
 */
export function Industries() {
  return (
    <section id="industries" className="relative overflow-x-clip bg-bg">
      <IndustriesIntro />
      <div className="relative px-5 pb-[18vh] pt-[4vh]">
        <Starfield />
        <ScrollTiltedGrid items={ITEMS} ariaLabel="Sectors and case studies" />
      </div>
    </section>
  );
}
