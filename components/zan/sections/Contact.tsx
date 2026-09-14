import { about, contactIntro } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { ContactRays } from "@/components/zan/contact/ContactRays";
import { ContactDirect } from "@/components/zan/contact/ContactDirect";
import { EnquiryForm } from "@/components/zan/contact/EnquiryForm";
import { OfficeCards } from "@/components/zan/contact/OfficeCard";

/**
 * The page's last word: brand light over the heading, the enquiry form, and
 * the three offices — the visitor's own region first.
 */
export function Contact() {
  return (
    // overflow-clip, not hidden: `hidden` makes the section a scroll container
    // and the sticky form beside the office cards would stop sticking.
    <section id="contact" className="relative isolate scroll-mt-nav overflow-clip border-t border-line bg-surface py-section">
      <ContactRays />

      <div className="container-zan relative">
        <SectionHeading
          eyebrow={contactIntro.eyebrow}
          title={contactIntro.title}
          lead={contactIntro.lead}
          align="center"
          size="display"
        />
        <ContactDirect className="mt-9" />

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            {/* Stays in view while the office cards scroll past beside it. */}
            <div className="lg:sticky lg:top-[calc(var(--spacing-nav)+1.5rem)]">
              <EnquiryForm />
            </div>
          </div>
          <div className="lg:col-span-5">
            <Eyebrow>{about.principles[1].label}</Eyebrow>
            <OfficeCards className="mt-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
