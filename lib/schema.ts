import type { ServicePage } from "@/constants/pages";
import type { FAQ, Office, RegionId } from "@/constants/zan";
import { servicePackages } from "@/constants/pricing";
import { faqs, offices, processSteps, practices, site, socialLinks } from "@/constants/zan";
import { localiseBrand, OG_IMAGE } from "@/lib/metadata";
import { regionUrl } from "@/lib/server-region";

/* ═══════════════════════════════════════════════════════════════════════════
   STRUCTURED DATA

   Built from the same facts in constants/zan.ts that the page renders, so the
   markup can never drift from the visible content — the failure mode Google
   penalises hardest.

   Three nodes are sitewide and attached once, in app/layout.tsx:

     Organization + ProfessionalService   who the company is
     WebSite                              what this site is

   The rest is per page: Service + OfferCatalog on the sixteen service pages,
   HowTo on /how-we-work, FAQPage wherever a page renders a question set of
   its own, BreadcrumbList wherever a trail is rendered
   (components/zan/page/Breadcrumbs.tsx).

   NOT PORTED from the previous site's index.html, deliberately:

     aggregateRating 4.9 / 120 reviews — there are no 120 published reviews
       behind it. Unsubstantiated review markup is a manual-action risk, and
       Google has been removing self-serve AggregateRating from rich results
       for service pages regardless.
     WebSite SearchAction — this site has no search endpoint to point it at.
       Declaring one that 404s is worse than declaring none.
   ═══════════════════════════════════════════════════════════════════════════ */

const ORG_ID = `${site.url}/#organization`;
const SITE_ID = `${site.url}/#website`;

/**
 * US federal tax ID. Published on the previous site's Organization schema and
 * on five of this site's own policy pages (constants/legal.ts: "Zan Services
 * LLC — … (EIN: 35-2955914)"), where it is prose rather than a field, so it is
 * restated here rather than parsed back out of a paragraph.
 */
const TAX_ID = "35-2955914";

/** constants/zan.ts keys offices by region id; schema.org wants ISO codes. */
const COUNTRY_CODE: Record<RegionId, string> = { in: "IN", ae: "AE", us: "US" };

/** The Kolkata office, from the previous site's LocalBusiness markup. */
const HQ_GEO = { latitude: "22.5726", longitude: "88.4159" } as const;

const hqOffice = offices.find((o) => o.isHq) ?? offices[0];

const postalAddress = (office: Office) => ({
  "@type": "PostalAddress",
  streetAddress: office.addressLines.join(", "),
  addressLocality: office.city,
  ...(office.region ? { addressRegion: office.region } : {}),
  ...(office.postalCode ? { postalCode: office.postalCode } : {}),
  addressCountry: COUNTRY_CODE[office.id],
});

/** Every discipline the company sells, flattened out of the three practices. */
const everyService = practices.flatMap((p) => p.items);

/**
 * The company. One node, one @id, shared by all three regional URLs: /ae is a
 * localisation of this site, not a second company, so it must not claim a
 * second identity. The UAE trading name rides along as `alternateName`.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: site.name,
    alternateName: [site.usEntity, localiseBrand(site.name, "ae")],
    url: site.url,
    logo: `${site.url}/images/brand/zan-logo.webp`,
    image: `${site.url}${OG_IMAGE}`,
    description: site.description,
    email: site.email,
    telephone: hqOffice.phoneTel,
    taxID: TAX_ID,
    foundingDate: site.founded,
    address: postalAddress(hqOffice),
    geo: { "@type": "GeoCoordinates", ...HQ_GEO },
    location: offices.map((office) => ({
      "@type": "Place",
      name: `${site.name} — ${office.city} office`,
      address: postalAddress(office),
    })),
    contactPoint: offices.map((office) => ({
      "@type": "ContactPoint",
      telephone: office.phoneTel,
      contactType: "customer service",
      areaServed: COUNTRY_CODE[office.id],
      availableLanguage: ["en"],
    })),
    // Monday to Friday, 10:00–21:00 IST, as the previous site published.
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "21:00",
    },
    priceRange: "$$",
    areaServed: offices.map((o) => ({ "@type": "Country", name: o.country })),
    knowsAbout: everyService.map((s) => s.title),
    sameAs: socialLinks.map((l) => l.href),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    url: site.url,
    name: site.name,
    inLanguage: "en",
    publisher: { "@id": ORG_ID },
  };
}

/**
 * One `Service` node per service page, with its capabilities as an offer
 * catalog. This is what makes a service page eligible in its own right rather
 * than only as part of the homepage — the sixteen of them were carrying a
 * BreadcrumbList and nothing else.
 */
export function serviceSchema(page: ServicePage, region: RegionId) {
  const url = regionUrl(page.href, region);
  /* An area page lists capabilities; a discipline under a practice does not,
     and lists packages instead. Both are what the page offers, so either will
     fill the catalog — otherwise the eight discipline pages would carry a
     Service node with nothing inside it. */
  const offered: { name: string; description?: string }[] = page.capabilities?.length
    ? page.capabilities.map((name) => ({ name }))
    : (servicePackages[page.priceKey] ?? []).map((pkg) => ({
        name: pkg.title,
        description: pkg.description,
      }));
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: page.title,
    serviceType: page.title,
    description: page.description,
    url,
    provider: { "@id": ORG_ID },
    areaServed: offices.map((o) => ({ "@type": "Country", name: o.country })),
    ...(offered.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: `${page.title} capabilities`,
            itemListElement: offered.map((item) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: item.name,
                ...(item.description ? { description: item.description } : {}),
              },
            })),
          },
        }
      : {}),
  };
}

/** The four-step engagement, for /how-we-work. */
export function howToSchema(region: RegionId) {
  const url = regionUrl("/how-we-work", region);
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${url}#howto`,
    name: "How a project runs at Zan Services",
    description:
      "Four steps from first call to launch: discovery and strategy, design and prototype, development and testing, then launch and support.",
    url,
    step: processSteps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.description,
      url: `${url}#${s.id}`,
      ...(s.deliverables.length
        ? {
            itemListElement: s.deliverables.map((d) => ({
              "@type": "HowToDirection",
              text: d,
            })),
          }
        : {}),
    })),
  };
}

/**
 * FAQPage for a set of questions.
 *
 * Emitted wherever a page renders a question set OF ITS OWN: the homepage
 * (`faqs`), /services (`servicesFaqs`), and the three service pages that carry
 * their own set (`faqsForService` — web development, mobile apps, digital
 * marketing).
 *
 * WITHHELD on /contact-us and /pricing, which both render questions the
 * homepage already marks up: /contact-us the same list outright, /pricing five
 * of its ten. Two URLs carrying byte-identical Q&A pairs give Google one node
 * to keep and one to discard, and the homepage — the URL with the ranking
 * history — is not reliably the one it keeps. Both accordions still render;
 * only the markup is withheld.
 */
export function faqSchema(items: readonly FAQ[] = faqs) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** One or more nodes, serialised for a single <script type="application/ld+json">. */
export function jsonLd(...nodes: (object | null | undefined)[]): string {
  const graph = nodes.filter(Boolean);
  const payload = graph.length === 1 ? graph[0] : graph;
  // `</script>` inside a string literal would close the tag early.
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
