import type { Metadata } from "next";
import { PageHero } from "@/components/zan/page/PageHero";
import { HeroLinks, HeroPanel } from "@/components/zan/page/HeroPanel";
import { SiteButtonLink } from "@/components/zan/services/SiteLinks";
import { notFoundPage } from "@/constants/pages";
import { ctas, footerColumns } from "@/constants/zan";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = pageMetadata({
  title: notFoundPage.seoTitle,
  description: "The page you asked for is not on this site.",
});

/** The footer's Company column, which is where a lost visitor usually meant to go. */
const company = footerColumns.find((c) => c.title === "Company")?.links ?? [];

export default function NotFound() {
  return (
    <main id="main">
      <PageHero
        eyebrow={notFoundPage.eyebrow}
        title={notFoundPage.title}
        lead={notFoundPage.lead}
        aside={
          <HeroPanel title="Pages people usually want">
            <HeroLinks items={[{ label: "Services", href: "/services" }, ...company]} />
          </HeroPanel>
        }
      >
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <SiteButtonLink href="/" size="lg">
            Back to the homepage
          </SiteButtonLink>
          <SiteButtonLink href={ctas.contact.href} variant="secondary" size="lg">
            {ctas.contact.label}
          </SiteButtonLink>
        </div>
      </PageHero>
    </main>
  );
}
