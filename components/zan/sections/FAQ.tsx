import { faqIntro, faqs } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { FaqAccordion } from "@/components/zan/contact/FaqAccordion";
import { FaqAside } from "@/components/zan/contact/FaqAside";

/** FAQPage structured data, built from the same list the accordion renders. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export function FAQ() {
  return (
    <section id="faq" className="relative scroll-mt-nav border-t border-line bg-bg py-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="container-zan grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--spacing-nav)+3rem)]">
            <SectionHeading eyebrow={faqIntro.eyebrow} title={faqIntro.title} size="h1" />
            <FaqAside />
          </div>
        </div>
        <div className="lg:col-span-7">
          <FaqAccordion items={faqs} />
        </div>
      </div>
    </section>
  );
}
