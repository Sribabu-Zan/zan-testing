import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/zan/page/PageHero";
import { Section } from "@/components/zan/page/Section";
import { Reveal } from "@/components/zan/page/Reveal";
import { FactCard, ServiceCard, StepCard } from "@/components/zan/page/cards";
import { HeroLinks, HeroPanel } from "@/components/zan/page/HeroPanel";
import { SiteButtonLink, SiteLink } from "@/components/zan/services/SiteLinks";
import { areaPages, childrenOf, servicesPage } from "@/constants/pages";
import { ctas, processIntro, processSteps, whyUs } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: servicesPage.seoTitle,
  description: servicesPage.seoDescription,
});

/* The catalogue, in the three columns the mega menu uses: everything that
   ships code, everything that brings traffic, everything that is designed.
   The two practice parents link to their own page; their disciplines sit
   under them. */
const development = areaPages.filter((p) => p.practice === "development");
const marketing = areaPages.find((p) => p.slug === "digital-marketing")!;
const designing = areaPages.find((p) => p.slug === "branding-and-designing")!;

const groups = [
  { key: "development", title: "Development", parent: null, pages: development },
  { key: "marketing", title: marketing.title, parent: marketing, pages: childrenOf(marketing.slug) },
  { key: "designing", title: designing.title, parent: designing, pages: childrenOf(designing.slug) },
];

export default function ServicesPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow={servicesPage.eyebrow}
        title={servicesPage.title}
        lead={servicesPage.lead}
        aside={
          <HeroPanel title="Three practices">
            <HeroLinks
              items={groups.map((g) => ({
                label: g.title,
                href: g.parent ? g.parent.href : "#catalogue",
                note: `${g.pages.length} ${g.pages.length === 1 ? "page" : "pages"}`,
              }))}
            />
          </HeroPanel>
        }
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <SiteButtonLink href={ctas.consultation.href} size="lg">
            {ctas.consultation.label}
          </SiteButtonLink>
          <SiteButtonLink href="/pricing" variant="secondary" size="lg">
            See what it costs
          </SiteButtonLink>
        </div>
      </PageHero>

      <Section
        id="catalogue"
        eyebrow="Catalogue"
        title="Every service we sell"
        lead="Sixteen pages: what the work is, what is in each package, and what it starts at in your region."
      >
        <div className="space-y-14 sm:space-y-16">
          {groups.map((group) => (
            <div key={group.key} id={group.key} className="scroll-mt-nav">
              <Reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line pb-5">
                <h3 className="font-display text-h2 text-ink">{group.title}</h3>
                {group.parent && (
                  <SiteLink
                    href={group.parent.href}
                    className="group/all inline-flex min-h-11 items-center gap-1.5 text-small font-medium text-ink transition-colors duration-300 hover:text-brand-ink"
                  >
                    {group.parent.title} overview
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4 text-brand-ink transition-transform duration-300 ease-out-expo group-hover/all:translate-x-0.5 group-hover/all:-translate-y-0.5"
                    />
                  </SiteLink>
                )}
              </Reveal>

              <ul className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.pages.map((page, i) => (
                  <li key={page.slug} className="min-w-0">
                    <ServiceCard
                      href={page.href}
                      title={page.title}
                      tagline={page.tagline}
                      description={page.description}
                      icon={page.icon}
                      index={page.index}
                      delay={Math.min(i, 3) * 0.05}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section id="why-us" tone="surface" eyebrow={whyUs.eyebrow} title={whyUs.title.join(" ")}>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {whyUs.items.map((item, i) => (
            <li key={item.id} className="min-w-0">
              <FactCard
                index={item.index}
                title={item.title}
                tagline={item.tagline}
                description={item.description}
                icon={item.icon}
                delay={Math.min(i, 3) * 0.05}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="process"
        eyebrow={processIntro.eyebrow}
        title={processIntro.title.join(" ")}
        lead={processIntro.lead}
        aside={
          <SiteButtonLink href="/how-we-work" variant="secondary">
            How we work
          </SiteButtonLink>
        }
      >
        <ol className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {processSteps.map((step, i) => (
            <li key={step.id} className="min-w-0">
              <StepCard
                index={step.index}
                title={step.title}
                description={step.description}
                deliverables={step.deliverables}
                delay={Math.min(i, 3) * 0.05}
              />
            </li>
          ))}
        </ol>
      </Section>
    </main>
  );
}
