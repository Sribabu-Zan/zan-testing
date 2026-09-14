import { FrameToFullscreen } from "@/components/animations/FrameToFullscreen";
import ScrollFloat from "@/components/animations/ScrollFloat";
import { BoardCtas } from "@/components/zan/board/BoardCtas";
import { ProjectBoard } from "@/components/zan/board/ProjectBoard";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { processIntro } from "@/constants/zan";

/** A short factual title. Its last word is the one that floats in. */
const TITLE = { lead: "How a Zan project", float: "moves" } as const;

/** The process lead's first sentence: four stages, weekly progress, live staging. */
function firstSentence(text: string) {
  const end = text.indexOf(". ");
  return end === -1 ? text : text.slice(0, end + 1);
}

/**
 * The project board: an app screen built from Zan's own data (practices,
 * the four process stages and their deliverables, office clocks, published
 * figures) in a device frame. On desktop with motion the stage pins, the
 * frame straightens and flattens to full screen and the figures count up.
 * On touch and for reduced motion the board sits under the title as a card.
 * See FrameToFullscreen and ProjectBoard.
 *
 * The heading's accessible name is the whole line; the visual lines and the
 * per-letter float word are aria-hidden so screen readers do not spell it out.
 */
export function Board() {
  return (
    <FrameToFullscreen id="board" title={<BoardTitle />}>
      <ProjectBoard />
    </FrameToFullscreen>
  );
}

function BoardTitle() {
  const heading = `${TITLE.lead} ${TITLE.float}`;
  return (
    <div className="container-zan flex flex-col items-center text-center">
      <Eyebrow>{processIntro.eyebrow}</Eyebrow>

      <h2 aria-label={heading} className="mt-5 text-balance">
        <span aria-hidden="true" className="block font-display text-h1 text-ink">
          {TITLE.lead}
        </span>{" "}
        <span
          aria-hidden="true"
          className="mt-1 block font-sans text-[clamp(3.5rem,1.4rem+7.2vw,7.5rem)] leading-[0.9] font-bold tracking-[-0.045em]"
        >
          <ScrollFloat gradient>{TITLE.float}</ScrollFloat>
        </span>
      </h2>

      <p className="mt-6 max-w-[52ch] text-lead text-ink-2">{firstSentence(processIntro.lead)}</p>

      <BoardCtas />
    </div>
  );
}
