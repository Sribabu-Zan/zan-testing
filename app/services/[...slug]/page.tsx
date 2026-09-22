import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FaqAccordion } from "@/components/zan/contact/FaqAccordion";
import { PageHero } from "@/components/zan/page/PageHero";
import { PackageDeck } from "@/components/zan/page/PackageDeck";
import { StartingPrice } from "@/components/zan/page/Price";
import { ProjectPanel } from "@/components/zan/page/ProjectPanel";
import { Reveal } from "@/components/zan/page/Reveal";
import { Section } from "@/components/zan/page/Section";
import { ServiceCard, StepCard } from "@/components/zan/page/cards";
import { HeroLinks, HeroList, HeroPanel } from "@/components/zan/page/HeroPanel";
import { SiteButtonLink } from "@/components/zan/services/SiteLinks";
import { ButtonLink } from "@/components/zan/ui/Button";
import {
  brandingPackages,
  childrenOf,
  findServicePage,
  homeCrumb,
  labels,
  practiceOf,
  serviceTechDomains,
  servicePages,
  type ServicePage,
} from "@/constants/pages";
import { servicePackages } from "@/constants/pricing";
import { ctas, faqIntro, faqsForService, processSteps, projects, techDomains } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";
import { faqSchema, jsonLd, serviceSchema } from "@/lib/schema";
import { requestRegion } from "@/lib/server-region";

type RouteParams = { params: Promise<{ slug?: string[] }> };

/** All sixteen service pages: the eight areas and the eight disciplines. */
export function generateStaticParams() {
  return servicePages.map((page) => ({ slug: [...page.segments] }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug = [] } = await params;
  const page = findServicePage(slug);
  if (!page) return {};
  /* Every service title is written as a local pitch — "Web Development Company
     in Kolkata". On /ae and /us that names the wrong market, so lib/metadata.ts
     swaps the place out. See its `localPlace` note. */
  return pageMetadata({
    title: page.seoTitle,
    description: page.seoDescription,
    localPlace: true,
  });
}

/** Home / Services / [practice] / this page. */
function trailFor(page: ServicePage) {
  const parent = page.parent ? findServicePage([page.parent]) : undefined;
  return [
    homeCrumb,
    { label: "Services", href: "/services" },
    ...(parent ? [{ label: parent.title, href: parent.href }] : []),
    { label: page.title, href: page.href },
  ];
}

export default async function ServiceDetailPage({ params }: RouteParams) {
  const { slug = [] } = await params;
  const page = findServicePage(slug);
  if (!page) notFound();

  const { region } = await requestRegion();
  const children = childrenOf(page.slug);
  const packages = servicePackages[page.priceKey];
  const isBranding = page.slug === "branding-and-designing";
  const domains = (serviceTechDomains[page.priceKey] ?? [])
    .map((id) => techDomains.find((d) => d.id === id))
    .filter((d) => d !== undefined);
  const relatedWork = projects.filter((p) => p.category === page.priceKey);
  /* Three of the sixteen pages have a question set of their own. The rest show
     no section rather than a borrowed one. */
  const faqs = faqsForService[page.priceKey] ?? [];

  /* The closing bands alternate ground, so each one has to know what the band
     above it landed on. */
  const processTone = domains.length > 0 || children.length > 0 ? "bg" : "surface";
  const faqTone = processTone === "bg" ? "surface" : "bg";
  const otherTone = faqs.length === 0 ? "surface" : faqTone === "bg" ? "surface" : "bg";
  const siblings = (practiceOf(page)?.items ?? [])
    .filter((item) => item.href !== page.href)
    .slice(0, 3);

  /* The hero's right column, in order of what this page actually has: the
     disciplines under it, what it includes, the packages on it, or its
     siblings. Never a decorative panel. */
  const aside =
    children.length > 0 ? (
      <HeroPanel title={labels.disciplines}>
        <HeroLinks items={children.map((c) => ({ label: c.title, href: c.href, note: c.tagline }))} />
      </HeroPanel>
    ) : page.capabilities?.length ? (
      <HeroPanel title={labels.included}>
        <HeroList items={page.capabilities} />
      </HeroPanel>
    ) : packages?.length ? (
      <HeroPanel title={labels.packages}>
        <HeroList items={packages.map((pkg) => pkg.title)} />
      </HeroPanel>
    ) : siblings.length > 0 ? (
      <HeroPanel title={labels.otherServices}>
        <HeroLinks items={siblings.map((item) => ({ label: item.title, href: item.href, note: item.tagline }))} />
      </HeroPanel>
    ) : undefined;

  return (
    <main id="main">
      {/* What this page sells, with its capabilities as an OfferCatalog and a
          pointer back to the Organization node the layout attaches. Without it
          these sixteen pages carried a BreadcrumbList and nothing else.

          The FAQPage rides along on the three pages that render a question set
          of their own; `faqSchema` returns null for the other thirteen and
          `jsonLd` drops it. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(serviceSchema(page, region), faqSchema(faqs)) }}
      />
      <PageHero
        eyebrow={page.tagline}
        title={[page.title]}
        lead={page.description}
        trail={trailFor(page)}
        aside={aside}
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          {/* `from` carries this page over to the enquiry form, which lives on
              /contact-us rather than here and would otherwise ask the visitor
              to name the service they have just spent a page reading about. */}
          <SiteButtonLink href={`${ctas.consultation.href}?from=${page.href}`} size="lg">
            {ctas.consultation.label}
          </SiteButtonLink>
          {packages || isBranding ? (
            <ButtonLink href="#packages" variant="secondary" size="lg" arrow={false}>
              See the packages
            </ButtonLink>
          ) : (
            <SiteButtonLink href="/pricing" variant="secondary" size="lg">
              See what it costs
            </SiteButtonLink>
          )}
          <StartingPrice slug={page.priceKey} />
        </div>
      </PageHero>

      {children.length > 0 && (
        <Section
          id="disciplines"
          tone="surface"
          eyebrow={labels.disciplines}
          title="Sold as separate disciplines"
          lead="Each has its own page, its own packages and its own starting price."
        >
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {children.map((child, i) => (
              <li key={child.slug} className="min-w-0">
                <ServiceCard
                  href={child.href}
                  title={child.title}
                  tagline={child.tagline}
                  description={child.description}
                  icon={child.icon}
                  delay={Math.min(i, 3) * 0.05}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {packages && (
        <Section
          id="packages"
          eyebrow={labels.packages}
          title="What you can buy"
          lead="Prices are shown for the region set in the navbar, and every engagement is quoted in full before any work starts."
        >
          <PackageDeck slug={page.priceKey} />
        </Section>
      )}

      {isBranding && (
        <Section
          id="packages"
          eyebrow={labels.packages}
          title="Three branding decks"
          lead="Buy a discipline on its own, or take one of these. Prices are shown for the region set in the navbar."
        >
          <div className="space-y-14">
            {brandingPackages.map((pkg) => (
              <div key={pkg.key}>
                <Reveal className="border-b border-line pb-5">
                  <h3 className="font-display text-h2 text-ink">{pkg.title}</h3>
                  <p className="mt-1.5 font-mono text-eyebrow text-brand-ink uppercase">{pkg.tagline}</p>
                  <p className="mt-4 max-w-[62ch] text-body text-ink-2">{pkg.description}</p>
                  <StartingPrice slug={pkg.key} className="mt-5" />
                </Reveal>
                <PackageDeck slug={pkg.key} className="mt-7" />
              </div>
            ))}
          </div>
        </Section>
      )}

      {domains.length > 0 && (
        <Section id="technology" tone="surface" eyebrow={labels.technology} title="What we build it with">
          <div className="grid gap-5 md:grid-cols-2">
            {domains.map((domain, i) => (
              <Reveal key={domain.id} delay={Math.min(i, 3) * 0.05} className="h-full">
                <div className="h-full rounded-3xl border border-line bg-bg p-6 sm:p-7">
                  <h3 className="font-display text-h3 font-semibold text-ink">{domain.label}</h3>
                  <p className="mt-3 text-body text-ink-2">{domain.blurb}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {domain.stack.map((tool) => (
                      <li
                        key={tool}
                        className="rounded-full border border-line bg-surface px-3 py-1.5 text-[0.8125rem] leading-none text-ink-2"
                      >
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      {relatedWork.length > 0 && (
        <Section
          id="work"
          eyebrow={labels.relatedWork}
          title={relatedWork.length > 1 ? "Projects in this discipline" : "A project in this discipline"}
          aside={
            <SiteButtonLink href={ctas.portfolio.href} variant="secondary">
              {ctas.portfolio.label}
            </SiteButtonLink>
          }
        >
          <div className="space-y-14 sm:space-y-16">
            {relatedWork.map((project, i) => (
              <ProjectPanel key={project.id} project={project} flip={i % 2 === 1} />
            ))}
          </div>
        </Section>
      )}

      <Section
        id="process"
        tone={processTone}
        eyebrow={labels.process}
        title="Four steps, start to launch"
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
                deliverables={[]}
                delay={Math.min(i, 3) * 0.05}
              />
            </li>
          ))}
        </ol>
      </Section>

      {faqs.length > 0 && (
        <Section
          id="faq"
          tone={faqTone}
          eyebrow={faqIntro.eyebrow}
          title={`${page.title} questions`}
          lead="Common questions about this work, answered in full."
        >
          <div className="lg:mx-auto lg:max-w-4xl">
            <FaqAccordion items={faqs} />
          </div>
        </Section>
      )}

      {siblings.length > 0 && (
        <Section id="other-services" tone={otherTone} eyebrow={labels.otherServices} title="Also in this practice">
          <ul className="grid gap-5 md:grid-cols-3">
            {siblings.map((item, i) => (
              <li key={item.id} className="min-w-0">
                <ServiceCard
                  href={item.href}
                  title={item.title}
                  tagline={item.tagline}
                  description={item.description}
                  icon={item.icon}
                  delay={Math.min(i, 2) * 0.05}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </main>
  );
}
