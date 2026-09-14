import type { Metadata } from "next";
import { PageHero } from "@/components/zan/page/PageHero";
import { Reveal } from "@/components/zan/page/Reveal";
import { Section } from "@/components/zan/page/Section";
import { FactCard, MetricRow } from "@/components/zan/page/cards";
import { HeroFacts, HeroPanel } from "@/components/zan/page/HeroPanel";
import { OfficeCards } from "@/components/zan/contact/OfficeCard";
import { SiteButtonLink } from "@/components/zan/services/SiteLinks";
import { aboutPage, labels } from "@/constants/pages";
import { about, ctas, industries, industriesIntro, metrics, metricsIntro, site } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: aboutPage.seoTitle,
  description: aboutPage.seoDescription,
});

/** The company, as Organization data, from the same constants the page shows. */
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  email: site.email,
  foundingDate: site.founded,
  description: site.description,
};

export default function AboutPage() {
  return (
    <main id="main">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <PageHero
        eyebrow={about.eyebrow}
        title={about.heading}
        lead={about.body[0]}
        size="h1"
        aside={
          <HeroPanel title="The company">
            <HeroFacts items={about.principles} />
          </HeroPanel>
        }
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <SiteButtonLink href={ctas.contact.href} size="lg">
            {ctas.contact.label}
          </SiteButtonLink>
          <SiteButtonLink href={ctas.portfolio.href} variant="secondary" size="lg">
            {ctas.portfolio.label}
          </SiteButtonLink>
        </div>
      </PageHero>

      <Section id="how-we-engage" eyebrow={metricsIntro.eyebrow} title="How we work with you">
        <Reveal>
          <p className="max-w-[62ch] text-lead text-ink-2">{about.body[1]}</p>
        </Reveal>
        <MetricRow items={metrics} className="mt-10" />
      </Section>

      <Section
        id="offices"
        eyebrow={labels.offices}
        title="Three offices, one team"
        lead="Kolkata is the headquarters. Dubai serves the UAE, and Zan Services LLC is the registered US entity in Sacramento, California."
      >
        <OfficeCards className="md:grid-cols-3" />
      </Section>

      <Section
        id="industries"
        tone="surface"
        eyebrow={industriesIntro.eyebrow}
        title={industriesIntro.title.join(" ")}
        lead={industriesIntro.lead}
      >
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {industries.map((industry, i) => (
            <li key={industry.id} className="min-w-0">
              <FactCard
                title={industry.label}
                description={industry.description}
                icon={industry.icon}
                delay={Math.min(i, 3) * 0.05}
              />
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
