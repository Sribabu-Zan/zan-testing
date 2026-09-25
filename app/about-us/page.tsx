import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/zan/page/PageHero";
import { Reveal } from "@/components/zan/page/Reveal";
import { Section } from "@/components/zan/page/Section";
import { FactCard, FactList, MetricRow } from "@/components/zan/page/cards";
import { HeroFacts, HeroPanel } from "@/components/zan/page/HeroPanel";
import { OfficeCards } from "@/components/zan/contact/OfficeCard";
import { SiteButtonLink } from "@/components/zan/services/SiteLinks";
import { aboutPage, labels, pageTrail } from "@/constants/pages";
import { getIndustryArt } from "@/constants/serviceArt";
import {
  about,
  credentials,
  credentialsIntro,
  ctas,
  industries,
  industriesIntro,
  metrics,
  metricsIntro,
  site,
} from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export function generateMetadata(): Promise<Metadata> {
  /* NOT `localPlace`. "IT Company in Kolkata" is where the company is, which
     is as true on /ae as it is here — the About page's job is to say so. */
  return pageMetadata({
    title: aboutPage.seoTitle,
    description: aboutPage.seoDescription,
  });
}

/* The Organization node this page used to carry — six fields, no address, no
   phone, no tax ID — is gone. app/layout.tsx now attaches the full one
   (lib/schema.ts `organizationSchema`) to EVERY page, so this page gets more
   than it had and the other 27 stop getting nothing. */

export default function AboutPage() {
  return (
    <main id="main">
      <PageHero
        eyebrow={about.eyebrow}
        title={about.heading}
        lead={about.body[0]}
        size="h1"
        trail={pageTrail("About Us", "/about-us")}
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

      {/* ── Credentials ───────────────────────────────────────────────────
          The registers a buyer in Dubai or Sacramento checks a supplier
          against. Plain light cards, the numbers as selectable text, and the
          brand colour only on the reference line. */}
      <Section
        id="credentials"
        tone="surface"
        eyebrow={credentialsIntro.eyebrow}
        title={credentialsIntro.title}
        lead={credentialsIntro.lead}
      >
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {credentials.map((c, i) => (
            <li key={c.id} className="min-w-0">
              <Reveal delay={Math.min(i, 3) * 0.05} className="h-full">
                <article className="flex h-full flex-col rounded-3xl border border-line bg-bg p-6 sm:p-7">
                  <div
                    className={cn(
                      "grid h-20 place-items-center rounded-2xl px-5",
                      c.onDark ? "bg-ink" : "bg-surface",
                    )}
                  >
                    <Image
                      src={c.logo.src}
                      alt={c.logo.alt}
                      width={c.logo.width}
                      height={c.logo.height}
                      sizes="160px"
                      /* The IRS mark is an SVG, which the optimizer refuses
                         without dangerouslyAllowSVG. Vectors gain nothing
                         from it anyway. */
                      unoptimized={c.logo.src.endsWith(".svg")}
                      className="max-h-12 w-auto object-contain"
                    />
                  </div>
                  <h3 className="mt-5 font-display text-h3 font-semibold text-ink">{c.name}</h3>
                  <p className="mt-2 text-small text-ink-2">{c.body}</p>
                  <dl className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-line pt-5 md:pt-6">
                    <dt className="font-mono text-eyebrow text-muted uppercase">{c.refLabel}</dt>
                    <dd className="font-mono text-small font-medium text-brand-ink tabular-nums">{c.ref}</dd>
                  </dl>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>

        <FactList
          className="mt-5 lg:grid-cols-4"
          items={[
            { label: "Founded", value: site.founded },
            { label: "US entity", value: site.usEntity },
            { label: "US tax ID", value: site.taxId },
            { label: "Email", value: site.email },
          ]}
        />
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
                art={getIndustryArt(industry.id)}
                delay={Math.min(i, 3) * 0.05}
              />
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
