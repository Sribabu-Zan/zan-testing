import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/zan/page/PageHero";
import { ProjectPanel } from "@/components/zan/page/ProjectPanel";
import { Reveal } from "@/components/zan/page/Reveal";
import { Section } from "@/components/zan/page/Section";
import { MetricRow } from "@/components/zan/page/cards";
import { HeroFacts, HeroPanel } from "@/components/zan/page/HeroPanel";
import { SiteButtonLink } from "@/components/zan/services/SiteLinks";
import { labels, pageTrail, portfolioPage } from "@/constants/pages";
import { clients, ctas, metrics, metricsIntro, partnersIntro, projects } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: portfolioPage.seoTitle,
    description: portfolioPage.seoDescription,
  });
}

export default function PortfolioPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow={portfolioPage.eyebrow}
        title={portfolioPage.title}
        lead={portfolioPage.lead}
        trail={pageTrail("Portfolio", "/portfolio")}
        aside={
          <HeroPanel title={metricsIntro.eyebrow}>
            <HeroFacts items={metrics.map((m) => ({ label: m.label, value: m.value }))} />
          </HeroPanel>
        }
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <SiteButtonLink href={ctas.consultation.href} size="lg">
            {ctas.consultation.label}
          </SiteButtonLink>
          <SiteButtonLink href="/services" variant="secondary" size="lg">
            What we do
          </SiteButtonLink>
        </div>
      </PageHero>

      <Section id="work" eyebrow="Case studies" title={`${projects.length} engagements, in detail`}>
        <div className="space-y-14 sm:space-y-16">
          {projects.map((project, i) => (
            <ProjectPanel key={project.id} project={project} flip={i % 2 === 1} />
          ))}
        </div>
      </Section>

      <Section id="metrics" tone="surface" eyebrow={metricsIntro.eyebrow} title="The record so far">
        <MetricRow items={metrics} />
      </Section>

      <Section id="clients" eyebrow={partnersIntro.eyebrow} title={partnersIntro.title.join(" ")} lead={partnersIntro.lead}>
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-4">
          {clients.map((client, i) => (
            <li key={client.name}>
              <Reveal delay={Math.min(i, 3) * 0.05}>
                <figure className="overflow-hidden rounded-3xl border border-line bg-white">
                  {/* The mark exactly as supplied, on the white plate it was
                      drawn for. Never tinted, greyscaled or cropped. */}
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={client.src}
                      alt={client.name}
                      fill
                      sizes="(min-width: 640px) 20vw, 44vw"
                      className="object-contain p-6"
                    />
                  </div>
                  <figcaption className="border-t border-line bg-bg px-4 py-3 text-center">
                    <span className="block text-small font-medium text-ink">{client.name}</span>
                    <span className="mt-0.5 block text-[0.8125rem] text-muted">{client.sector}</span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="next" tone="surface" eyebrow={labels.process} title="Yours could be the next one">
        <Reveal className="flex flex-wrap items-center gap-3">
          <SiteButtonLink href={ctas.consultation.href} size="lg">
            {ctas.consultation.label}
          </SiteButtonLink>
          <SiteButtonLink href="/how-we-work" variant="secondary" size="lg">
            How we work
          </SiteButtonLink>
        </Reveal>
      </Section>
    </main>
  );
}
