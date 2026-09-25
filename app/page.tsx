import { Hero } from "@/components/zan/sections/Hero";
import { Board } from "@/components/zan/sections/Board";
import { ChapterWhatWeDo } from "@/components/zan/sections/ChapterWhatWeDo";
import { ServicesDeck } from "@/components/zan/sections/ServicesDeck";
import { ServiceDial } from "@/components/zan/sections/ServiceDial";
import { ChapterWork } from "@/components/zan/sections/ChapterWork";
import { WorkParallax } from "@/components/zan/sections/WorkParallax";
import { CaseStudies } from "@/components/zan/sections/CaseStudies";
import { Showreel } from "@/components/zan/sections/Showreel";
import { Metrics } from "@/components/zan/sections/Metrics";
import { Partners } from "@/components/zan/sections/Partners";
import { TechStack } from "@/components/zan/sections/TechStack";
import { ChapterProcess } from "@/components/zan/sections/ChapterProcess";
import { Process } from "@/components/zan/sections/Process";
import { Industries } from "@/components/zan/sections/Industries";
import { About } from "@/components/zan/sections/About";
import { FAQ } from "@/components/zan/sections/FAQ";
import { Contact } from "@/components/zan/sections/Contact";

/**
 * The Zan Services company page.
 *
 * The reference's grammar — a pinned chapter card, then the scenes it
 * introduces — carrying Zan's content in the light theme:
 *
 *   Hero               the old site's hero, in parallax       #hero
 *   Board              frame flattens to full screen          #board
 *   Chapter 01         curtain rises: What we do
 *   Services deck      practices dealt like cards             #services #development #marketing #designing #why-us
 *   Service dial       ruler carousel of every discipline
 *   Chapter 02         warp portal: Selected work
 *   Work wall          tilted parallax wall of work           #work
 *   Case studies       expanding panel, hover list            #case-studies
 *   Showreel           video playing inside the wordmark       #showreel
 *   Metrics            masonry that rises (Apple highlights)  #metrics
 *   Partners           client marquee on the brand veil       #partners
 *   Technology         logo ring that morphs to an arc        #technology
 *   Chapter 03         fold: How we work
 *   Process            laptop turns through the four stages   #process
 *   Industries         tilted grid                            #industries
 *   About              zoom collage, scrubbed statement       #about
 *   FAQ                                                       #faq
 *   Contact            light rays, enquiry, offices           #contact
 */
export default function Home() {
  return (
    <main id="main" className="relative">
      <Hero />
      <Board />
      <ChapterWhatWeDo />
      <ServicesDeck />
      <ServiceDial />
      <ChapterWork />
      <WorkParallax />
      <CaseStudies />
      <Showreel />
      <Metrics />
      <Partners />
      <TechStack />
      <ChapterProcess />
      <Process />
      {/* <Industries /> */}
      <About />
      <FAQ />
      <Contact />
    </main>
  );
}
