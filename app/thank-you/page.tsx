import type { Metadata } from "next";
import { PageHero } from "@/components/zan/page/PageHero";
import { HeroPanel } from "@/components/zan/page/HeroPanel";
import { Section } from "@/components/zan/page/Section";
import { ContactDirect } from "@/components/zan/contact/ContactDirect";
import { SiteButtonLink } from "@/components/zan/services/SiteLinks";
import { ThankYouConversion, ThankYouWhatsApp } from "@/components/zan/thankyou/ThankYouTracking";
import { pageMetadata } from "@/lib/metadata";

/* ───────────────────────────────────────────────────────────────────────────
   /thank-you

   Where the enquiry form goes on a send that resolved. It is not decoration:
   reaching this URL is the event Google Ads counts as a conversion, and the
   only place the site fires `generate_lead`. Sending the form's success state
   here rather than swapping a panel in place is what makes the conversion
   countable at all.

   NOINDEX, PERMANENTLY. A thank-you page has nothing to offer a search
   result, and one that is indexed gets landed on cold, which reports a
   conversion for a visitor who never enquired. The layout's pre-launch
   noindex is a separate thing with its own deletion note; this one stays
   after cutover.
   ─────────────────────────────────────────────────────────────────────────── */

export async function generateMetadata(): Promise<Metadata> {
  return {
    ...(await pageMetadata({
      title: "Thank you",
      description: "Your enquiry has reached us. We reply within 24 hours.",
    })),
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
    /* No canonical and no hreflang: this page is not a destination, and the
       three regional copies of it are not alternates worth declaring. */
    alternates: null,
  };
}

/** Written down rather than promised loosely, so the wait is a known thing. */
const NEXT_STEPS = [
  "We read what you sent and check it against what we have built before.",
  "Someone replies within 24 hours, by email or on the number you gave.",
  "If it is a fit, we scope the work together and put a written quote in front of you.",
] as const;

export default function ThankYouPage() {
  return (
    <main id="main">
      <ThankYouConversion />

      <PageHero
        eyebrow="Enquiry received"
        title={["Thank you.", "We have it."]}
        lead="Your enquiry is with the team. Someone will come back to you within 24 hours, on a working day usually sooner. Nothing else is needed from you now."
        aside={
          <HeroPanel title="What happens next">
            <ol className="space-y-5">
              {NEXT_STEPS.map((step, i) => (
                <li key={step} className="flex items-start gap-4 text-body text-ink">
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong font-mono text-[0.75rem] text-brand-ink"
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </HeroPanel>
        }
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <SiteButtonLink href="/portfolio" size="lg">
            See what we have built
          </SiteButtonLink>
          <SiteButtonLink href="/" variant="secondary" size="lg">
            Back to the homepage
          </SiteButtonLink>
        </div>
      </PageHero>

      <Section
        id="reach-us"
        tone="surface"
        eyebrow="In the meantime"
        title="If it cannot wait"
        lead="The number follows the region set in the navbar, so it is the office closest to you."
      >
        <ContactDirect className="justify-start" />
        <div className="mt-6">
          <ThankYouWhatsApp />
        </div>
      </Section>
    </main>
  );
}
