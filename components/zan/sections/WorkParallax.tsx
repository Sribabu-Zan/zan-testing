import type { ReactNode } from "react";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { CaseCard, ServiceCard, type ServiceTone } from "@/components/zan/work/WallCards";
import { WorkHeader } from "@/components/zan/work/WorkHeader";
import { practices, projects } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   WORK WALL (#work) — the reference's tilted parallax wall, carrying twelve
   real cards: the five case studies and seven services, interleaved so no row
   is all one kind.

   The four client marks used to ride this wall too. They are not projects,
   and the heading above them says "Projects we have delivered", so they now
   appear only in Partners (#partners), which is the band that introduces them
   as clients. Three services took their places, which keeps the rows even and
   the tones spread: two soft, two surface, two paper and the single brand
   card in the middle row.
   ─────────────────────────────────────────────────────────────────────────── */

// Keyed: these arrays cross the server/client boundary as props, and React
// checks keys on every array of elements it serialises.
function service(id: string, tone: ServiceTone): ReactNode {
  for (const practice of practices) {
    const item = practice.items.find((s) => s.id === id);
    if (item) return <ServiceCard key={`service-${id}`} service={item} practice={practice} tone={tone} />;
  }
  throw new Error(`Unknown service: ${id}`);
}

const kase = (i: number) => <CaseCard key={`case-${projects[i].id}`} project={projects[i]} />;

const rows: ReactNode[][] = [
  [kase(0), service("web-development", "soft"), kase(1), service("performance-marketing", "surface")],
  [service("mobile-apps", "brand"), kase(2), service("ai-machine-learning", "paper"), kase(3)],
  [service("seo-aeo-geo", "paper"), kase(4), service("ui-ux-design", "soft"), service("brand-identity-design", "surface")],
];

export function WorkParallax() {
  return (
    <HeroParallax
      id="work"
      labelledBy="work-heading"
      header={<WorkHeader headingId="work-heading" />}
      rows={rows}
    />
  );
}
