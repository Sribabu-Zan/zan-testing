import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { FaqAccordion } from "@/components/zan/contact/FaqAccordion";
import { PageHero } from "@/components/zan/page/PageHero";
import { StartingPriceValue } from "@/components/zan/page/Price";
import { Reveal } from "@/components/zan/page/Reveal";
import { Section } from "@/components/zan/page/Section";
import { FactList } from "@/components/zan/page/cards";
import { HeroFacts, HeroPanel } from "@/components/zan/page/HeroPanel";
import { SiteButtonLink, SiteLink } from "@/components/zan/services/SiteLinks";
import { areaPages, brandingPackages, childrenOf, labels, pageTrail, pricingPage, subPages } from "@/constants/pages";
import { about, ctas, faqIntro, faqs, processSteps, regionOrder, regions } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";
import { requestRegion } from "@/lib/server-region";

export function generateMetadata(): Promise<Metadata> {
  // "Pricing in India" becomes "Pricing in the UAE" / "in the US"; the table
  // below is already priced in the region's own currency.
  return pageMetadata({
    title: pricingPage.seoTitle,
    description: pricingPage.seoDescription,
    localPlace: true,
  });
}

const marketing = areaPages.find((p) => p.slug === "digital-marketing")!;
const designing = areaPages.find((p) => p.slug === "branding-and-designing")!;

/* Each practice leads with its own parent page and then its disciplines. The
   two parents are pages a client can buy outright, so leaving them out of the
   table hid the only figure some visitors came for. */
const groups = [
  {
    key: "development",
    title: "Development",
    note: "Priced per package on each page, entry tier shown.",
    rows: areaPages.filter((p) => p.practice === "development"),
  },
  {
    key: "marketing",
    title: marketing.title,
    note: "Retained monthly. The figure is the entry package on each page.",
    rows: [marketing, ...childrenOf(marketing.slug)],
  },
  {
    key: "designing",
    title: designing.title,
    note: "Bought as a discipline, or as one of the three branding decks below.",
    rows: [designing, ...subPages.filter((p) => p.parent === designing.slug)],
  },
];

/** What is in every engagement, from the launch step of the process. */
const included = processSteps[3].deliverables;

export default async function PricingPage() {
  const { region } = await requestRegion();
  const active = regions[region];

  return (
    <main id="main">
      <PageHero
        eyebrow={pricingPage.eyebrow}
        title={pricingPage.title}
        lead={pricingPage.lead}
        trail={pageTrail("Pricing", "/pricing")}
        aside={
          <HeroPanel title="Priced per region">
            <HeroFacts
              items={[
                ...regionOrder.map((id) => ({
                  label: regions[id].office.country,
                  value: `${regions[id].currencyName} (${regions[id].currency})`,
                })),
                { label: "Elsewhere", value: `Quoted in ${regions.us.currency}` },
              ]}
            />
            <p className="mt-6 border-t border-line pt-5 text-small text-muted">
              Switch region in the navbar and every figure on the site follows it.
            </p>
          </HeroPanel>
        }
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <SiteButtonLink href={ctas.consultation.href} size="lg">
            {ctas.consultation.label}
          </SiteButtonLink>
          <SiteButtonLink href="/services" variant="secondary" size="lg">
            All services
          </SiteButtonLink>
        </div>
      </PageHero>

      <Section
        id="prices"
        eyebrow="Starting prices"
        title="Every page, and what it starts at"
        lead={`Every figure below is in ${active.currencyName} (${active.currency}), the currency of the region set in the navbar. Open a page for its full deck.`}
      >
        <div className="space-y-12">
          {groups.map((group) => (
            <div key={group.key}>
              <Reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5 border-b border-line pb-4">
                <h3 className="font-display text-h2 text-ink">{group.title}</h3>
                <p className="text-small text-muted">{group.note}</p>
              </Reveal>
              <Reveal delay={0.05}>
                <ul className="mt-6 overflow-hidden rounded-3xl border border-line bg-bg">
                  {group.rows.map((row) => (
                    <li key={row.slug} className="border-b border-line last:border-b-0">
                      <SiteLink
                        href={row.href}
                        className="group/row flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-5 transition-colors duration-300 hover:bg-surface sm:px-7"
                      >
                        <span className="min-w-0">
                          <span className="block text-lead font-medium text-ink">{row.title}</span>
                          <span className="mt-0.5 block text-small text-muted">{row.tagline}</span>
                        </span>
                        <span className="flex items-center gap-4">
                          <span className="text-lead font-semibold text-brand-ink">
                            <StartingPriceValue slug={row.priceKey} />
                          </span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-4 shrink-0 text-brand-ink transition-transform duration-300 ease-out-expo group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5"
                          />
                        </span>
                      </SiteLink>
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          ))}

          <div>
            <Reveal className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5 border-b border-line pb-4">
              <h3 className="font-display text-h2 text-ink">Branding decks</h3>
              <p className="text-small text-muted">Sold whole, not per card.</p>
            </Reveal>
            <Reveal delay={0.05}>
              <ul className="mt-6 overflow-hidden rounded-3xl border border-line bg-bg">
                {brandingPackages.map((pkg) => (
                  <li key={pkg.key} className="border-b border-line last:border-b-0">
                    <SiteLink
                      href={`${designing.href}#packages`}
                      className="group/row flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-5 transition-colors duration-300 hover:bg-surface sm:px-7"
                    >
                      <span className="min-w-0">
                        <span className="block text-lead font-medium text-ink">{pkg.title}</span>
                        <span className="mt-0.5 block text-small text-muted">{pkg.tagline}</span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="text-lead font-semibold text-brand-ink">
                          <StartingPriceValue slug={pkg.key} />
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="size-4 shrink-0 text-brand-ink transition-transform duration-300 ease-out-expo group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5"
                        />
                      </span>
                    </SiteLink>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1}>
          <p className="mt-14 max-w-[70ch] text-small text-muted">
            Prices exclude applicable taxes. Every figure is a starting point for the scope
            described. The final quote follows a call, and larger or more complex builds are
            priced against that scope rather than off this page.
          </p>
        </Reveal>
      </Section>

      <Section
        id="included"
        tone="surface"
        eyebrow={labels.included}
        title="What the price carries"
        lead="Whatever the scope, a project ends the same way."
      >
        <ul className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2">
          {included.map((item) => (
            <li key={item} className="flex items-center gap-3.5 bg-bg px-6 py-6">
              <Check aria-hidden="true" className="size-5 shrink-0 text-brand-ink" strokeWidth={2.2} />
              <span className="text-lead font-medium text-ink">{item}</span>
            </li>
          ))}
        </ul>
        <FactList items={about.principles} className="mt-5 lg:grid-cols-4" />
      </Section>

      {/* Budget and engagement, from the same set the home page carries. */}
      <Section
        id="faq"
        eyebrow={faqIntro.eyebrow}
        title="Budget and engagement"
        lead="What the work costs, how it is scoped, and what happens between the first call and the invoice."
      >
        <div className="lg:mx-auto lg:max-w-4xl">
          <FaqAccordion items={faqs.slice(3, 8)} />
        </div>
      </Section>
    </main>
  );
}
