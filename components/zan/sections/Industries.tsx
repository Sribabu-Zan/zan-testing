import "@/components/zan/industries/industries.css";
import { industries, projects } from "@/constants/zan";
import { IndustriesIntro } from "@/components/zan/industries/IndustriesIntro";
import { Starfield } from "@/components/zan/industries/Starfield";
import { IndustryCarousel, type CarouselItem } from "@/components/zan/industries/IndustryCarousel";
import { CaseCaption, CaseMedia, IndustryTile, type Tone } from "@/components/zan/industries/tiles";

/** Tones for the eight industry cards, so neighbours never match. */
const TONES: readonly Tone[] = ["soft", "paper", "brand", "surface", "paper", "soft", "surface", "brand"];

/** The case studies that carry sector imagery. */
const CASES = projects.filter((p) => p.screenshot);

/** Two industries, then a case study — so the imagery is spread through the deck. */
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

const ITEMS: CarouselItem[] = SLOTS.flatMap((slot): CarouselItem[] => {
  if (slot.kind === "case") {
    const p = CASES[slot.i];
    return p
      ? [{ key: p.id, label: `${p.name}, case study`, media: <CaseMedia project={p} />, node: <CaseCaption project={p} /> }]
      : [];
  }
  const ind = industries[slot.i];
  return ind
    ? [
        {
          key: ind.id,
          label: ind.label,
          node: (
            <IndustryTile industry={ind} index={String(slot.i + 1).padStart(2, "0")} tone={TONES[slot.i % TONES.length]} />
          ),
        },
      ]
    : [];
});

/**
 * Industries — the eight sectors interleaved with the four case studies that
 * have imagery, as a deck you turn: a 3D rotator on the desktop, a snapping
 * swipe track on a phone, and a plain grid of all twelve for anyone who
 * prefers reduced motion.
 */
export function Industries() {
  return (
    <section id="industries" className="relative overflow-x-clip bg-bg pb-[clamp(5rem,4rem+5vw,9rem)]">
      <Starfield />
      <IndustriesIntro />
      <div className="relative z-[1] px-5">
        <IndustryCarousel items={ITEMS} label="Industries we work with, and case studies" />
      </div>
    </section>
  );
}
