import type { Metadata } from "next";
import { PageHero } from "@/components/zan/page/PageHero";
import { Reveal } from "@/components/zan/page/Reveal";
import { Section } from "@/components/zan/page/Section";
import { FactCard, StepCard } from "@/components/zan/page/cards";
import { HeroFacts, HeroPanel } from "@/components/zan/page/HeroPanel";
import { SiteButtonLink } from "@/components/zan/services/SiteLinks";
import { howWeWorkPage, labels, pageTrail } from "@/constants/pages";
import { about, ctas, processSteps, techDomains, techIntro, whyUs } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";
import { howToSchema, jsonLd } from "@/lib/schema";
import { requestRegion } from "@/lib/server-region";

export function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: howWeWorkPage.seoTitle,
    description: howWeWorkPage.seoDescription,
  });
}

export default async function HowWeWorkPage() {
  const { region } = await requestRegion();
  return (
    <main id="main">
      {/* The four steps this page renders, as a HowTo — the one page on the
          site whose whole content is a procedure. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(howToSchema(region)) }}
      />
      <PageHero
        eyebrow={howWeWorkPage.eyebrow}
        title={howWeWorkPage.title}
        lead={howWeWorkPage.lead}
        trail={pageTrail("How We Work", "/how-we-work")}
        aside={
          <HeroPanel title="The engagement">
            <HeroFacts items={about.principles} />
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
        id="process"
        eyebrow="The four steps"
        title="What happens, in order"
        lead="Every project runs the same way, whether it is a landing page or a platform. What changes is how long each step takes."
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

      <Section id="technology" eyebrow={techIntro.eyebrow} title={techIntro.title.join(" ")} lead={techIntro.lead}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {techDomains.map((domain, i) => (
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

      <Section id="engagement" tone="surface" eyebrow={labels.atAGlance} title="Who you talk to">
        <Reveal>
          <p className="max-w-[62ch] text-lead text-ink-2">{about.body[1]}</p>
        </Reveal>
      </Section>
    </main>
  );
}
