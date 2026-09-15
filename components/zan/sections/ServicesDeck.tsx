import FlowArt, { FlowSection } from "@/components/ui/story-scroll";
import { blockchainStack, deckPractices, whyUs, type Practice } from "@/constants/zan";
import {
  DECK_TONES,
  DeckPanelBody,
  PracticeGrid,
  StackChips,
  WhyUsGrid,
  type DeckTone,
} from "@/components/zan/services/DeckPanel";
import "@/components/zan/services/deck.css";

/* ───────────────────────────────────────────────────────────────────────────
   SERVICES DECK: the reference's story scroll, carrying the four practices
   and the reasons to choose Zan. Every ground is light, and each panel
   differs from the one it is dealt onto.

   #services      the deck
   #development   brand-soft, the flat colour the Chapter 01 curtain ends on
   #marketing     page ground, with one brand-ink word
   #blockchain    surface-2, with the blockchain stack as chips
   #designing     paper
   #why-us        surface, then the page's two calls to action

   Each panel pins by its bottom edge while the next one's slab swings up over
   it (components/ui/story-scroll.tsx). With reduced motion it is a plain
   stack of the same five panels.
   ─────────────────────────────────────────────────────────────────────────── */

const PRACTICE_TONE: Record<Practice["id"], DeckTone> = {
  development: "soft",
  marketing: "plain",
  blockchain: "surface2",
  designing: "paper",
};

const pad = (n: number) => String(n).padStart(2, "0");

export function ServicesDeck() {
  const whyIndex = pad(deckPractices.length + 1);
  return (
    <FlowArt id="services">
      {deckPractices.map((practice) => {
        const tone = PRACTICE_TONE[practice.id];
        const headingId = `deck-${practice.id}-title`;
        return (
          <FlowSection
            key={practice.id}
            id={practice.id}
            aria-labelledby={headingId}
            className={DECK_TONES[tone].slab}
          >
            <DeckPanelBody
              tone={tone}
              eyebrow={`${practice.index} / ${practice.title}`}
              meta={`${pad(practice.items.length)} disciplines`}
              headingId={headingId}
              srPrefix={practice.title}
              headline={practice.headline}
              lead={practice.lead}
              accentLast={practice.id === "marketing"}
              extra={
                practice.id === "blockchain" ? (
                  <StackChips labelId="deck-blockchain-stack" label="Stack" items={blockchainStack} />
                ) : undefined
              }
            >
              <PracticeGrid practice={practice} tone={tone} />
            </DeckPanelBody>
          </FlowSection>
        );
      })}

      <FlowSection id="why-us" aria-labelledby="deck-why-us-title" className={DECK_TONES.surface.slab}>
        <DeckPanelBody
          tone="surface"
          center
          eyebrow={`${whyIndex} / ${whyUs.eyebrow}`}
          headingId="deck-why-us-title"
          headline={whyUs.title}
        >
          <WhyUsGrid tone="surface" />
        </DeckPanelBody>
      </FlowSection>
    </FlowArt>
  );
}
