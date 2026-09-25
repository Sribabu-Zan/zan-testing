import { about } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { ZoomParallax, type ZoomBox, type ZoomImage } from "@/components/ui/zoom-parallax";
import { OfficesPortal } from "@/components/zan/about/OfficesPortal";
import { AboutStatement } from "@/components/zan/about/AboutStatement";

/* The collage. The centre frame is the offices page; the six around it are
   stock photography, used purely decoratively (alt="") — never captioned as
   Zan's team, office or work. Offsets and sizes in vw / svh from the centre;
   `scale` is how far each frame's layer grows by the end of the zoom. */

const portal: { sm: ZoomBox; lg: ZoomBox } = {
  sm: { x: 0, y: 0, w: 40, h: 40, scale: 2.5 },
  lg: { x: 0, y: 0, w: 25, h: 25, scale: 4 },
};

const images: readonly ZoomImage[] = [
  {
    src: "/images/uae/uae_landscape.webp",
    side: "b",
    sm: { x: 0, y: -31, w: 56, h: 20, scale: 3 },
    lg: { x: 5, y: -29, w: 35, h: 28, scale: 5 },
  },
  {
    src: "/images/professional/about.jpg",
    side: "a",
    sm: { x: -36, y: -8, w: 24, h: 30, scale: 3.5 },
    lg: { x: -25, y: -10, w: 20, h: 45, scale: 6 },
  },
  {
    src: "/images/professional/dashboard2.jpg",
    side: "b",
    sm: { x: 36, y: 6, w: 24, h: 26, scale: 3.5 },
    lg: { x: 27.5, y: 0, w: 25, h: 25, scale: 5 },
  },
  {
    src: "/images/professional/ecommerce.jpg",
    side: "b",
    sm: { x: 8, y: 33, w: 40, h: 20, scale: 4 },
    lg: { x: 5, y: 27.5, w: 20, h: 25, scale: 6 },
  },
  {
    src: "/images/professional/warehouse.jpg",
    side: "a",
    sm: { x: -32, y: 31, w: 30, h: 16, scale: 4.5 },
    lg: { x: -22.5, y: 27.5, w: 30, h: 25, scale: 8 },
  },
  {
    src: "/images/professional/dashboard.jpg",
    side: "a",
    sm: { x: 38, y: -24, w: 20, h: 12, scale: 5 },
    lg: { x: 25, y: 22.5, w: 15, h: 15, scale: 9 },
  },
];

export function About() {
  return (
    <section id="about" className="relative scroll-mt-nav border-t border-line bg-bg">
      <div className="container-zan pt-section pb-[clamp(2.5rem,5vw,5rem)]">
        <SectionHeading eyebrow={about.eyebrow} title={about.heading} />
      </div>
      <ZoomParallax portal={portal} portalContent={<OfficesPortal />} images={images} />
      <AboutStatement />
    </section>
  );
}
