import { ShowreelStage } from "@/components/zan/showreel/ShowreelStage";
import { site } from "@/constants/zan";

/**
 * SHOWREEL (#showreel) — the wordmark as a window onto the work.
 *
 * The section pins on the page ground with ZANSERVICES set across the screen
 * and the showreel playing inside the letters. Scrolling opens the letters:
 * the word grows out of the stem of its I until the ink has passed the edges
 * of the screen and the footage is full bleed. It holds there, then fades back
 * to the page ground so the metrics below arrive on continuous white.
 *
 * The word is drawn as a hole in a sheet of --color-bg rather than as type, so
 * it is invisible to a screen reader. The heading carries it as real text and
 * names the section, so the outline and the landmark list say what this is
 * rather than repeating the company name.
 *
 * No lead line: every short sentence in the content is already a heading or a
 * lead further down this page.
 *
 * The footage is Zan's own brand film (a plane towing the Zan banner past
 * Howrah Bridge, the Statue of Liberty and the Burj Khalifa, one landmark per
 * office). The master lives in assets-src/videos, outside public/, so it is
 * never deployed; public/videos holds the web encodes: VP9 WebM, H.264 MP4 and
 * a poster frame at 2.5s, all 1280x720, no audio.
 */
export function Showreel() {
  return (
    <section id="showreel" aria-labelledby="showreel-title" className="relative bg-bg">
      <h2 id="showreel-title" className="sr-only">
        {`${site.name} showreel`}
      </h2>
      <ShowreelStage eyebrow="Showreel" />
    </section>
  );
}
