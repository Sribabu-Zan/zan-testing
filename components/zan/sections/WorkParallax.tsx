import type { ReactNode } from "react";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { CaseCard, ClientCard, ServiceCard, type ServiceTone } from "@/components/zan/work/WallCards";
import { WorkHeader } from "@/components/zan/work/WorkHeader";
import { clients, practices, projects } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   WORK WALL (#work) — the reference's tilted parallax wall, carrying fifteen
   real cards: the five case studies, the four clients and six services (two
   from each practice), interleaved so no row is all one kind.
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
const client = (i: number) => <ClientCard key={`client-${i}`} client={clients[i]} />;

const rows: ReactNode[][] = [
  [kase(0), service("web-development", "soft"), client(0), kase(1), service("performance-marketing", "surface")],
  [client(1), service("mobile-apps", "brand"), kase(2), client(2), kase(3)],
  [service("seo-aeo-geo", "paper"), kase(4), service("ui-ux-design", "soft"), client(3), service("brand-identity-design", "surface")],
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
