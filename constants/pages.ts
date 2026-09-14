/* ───────────────────────────────────────────────────────────────────────────
   PAGES — the content for every route other than the homepage.

   The homepage's copy lives in constants/zan.ts and is not touched here. This
   file only adds what a standing page needs and the homepage never did: the
   per-service page model (so one template can render all sixteen service
   pages), the page titles and descriptions, and the small amount of framing
   copy the new sections need.

   Sources, in the same order of preference the rest of the site follows:
     1. constants/zan.ts — services, practices, process, industries, projects,
        metrics, clients, offices, about, FAQs. Imported, never re-typed.
     2. the production main app (zan_webdevelopment/src/data) — the search
        titles and descriptions each service page publishes today, the parent
        pages' own descriptions, and the package decks and prices, which are
        copied into constants/pricing.ts and constants/legal.ts verbatim.

   Nothing is invented. No figure, client or claim appears here that is not
   already published by Zan.
   ─────────────────────────────────────────────────────────────────────────── */

import type { IconKey } from "@/components/zan/ui/icons";
import {
  practices,
  site,
  type Practice,
  type ServiceItem,
} from "@/constants/zan";

/* ── Service pages ────────────────────────────────────────────────────────── */

export type PracticeId = "development" | "marketing" | "designing";

export interface ServicePage {
  /** Path under /services, e.g. "digital-marketing/seo-aeo-geo". */
  slug: string;
  /** The same, as route segments. */
  segments: readonly string[];
  /** Full path, e.g. "/services/digital-marketing/seo-aeo-geo". */
  href: string;
  /** Set on a sub-service: the slug of the page above it. */
  parent?: string;
  /** Last segment — the key into the package and price tables. */
  priceKey: string;
  index: string;
  title: string;
  tagline: string;
  description: string;
  capabilities?: readonly string[];
  icon: IconKey;
  practice: PracticeId;
  /** Which practice column this page belongs to, for the eyebrow. */
  practiceTitle: string;
  seoTitle: string;
  seoDescription: string;
}

/**
 * Search title and description for each page, exactly as the production site
 * publishes them today (src/data/services.ts, `seo`). Carried across so the
 * pages here describe themselves the same way the live ones do.
 */
const SEO: Record<string, { title: string; description: string }> = {
  "web-development": {
    title: "Web Development Company in Kolkata",
    description:
      "Custom website development in Kolkata - e-commerce, business websites & web applications. Responsive, SEO-ready & scalable. Free consultation.",
  },
  "mobile-apps": {
    title: "App Development Company in Kolkata",
    description:
      "Mobile app development in Kolkata - iOS, Android, React Native & Flutter apps. From MVP to enterprise. Free quote.",
  },
  "ai-machine-learning": {
    title: "AI & ML Development Company in Kolkata",
    description:
      "AI & machine learning solutions in Kolkata - custom ML models, chatbots, generative AI & AI consulting. Automate and scale your business.",
  },
  "blockchain-web3": {
    title: "Blockchain Development Company in Kolkata",
    description:
      "Blockchain & Web3 development in Kolkata - smart contracts, dApps, NFT platforms & trading bots. Secure, audited solutions. Free consultation.",
  },
  "cloud-devops": {
    title: "Cloud & DevOps Services in Kolkata",
    description:
      "Cloud infrastructure & DevOps services in Kolkata - AWS, Azure, GCP, CI/CD pipelines & process automation. Scale your operations efficiently.",
  },
  cybersecurity: {
    title: "Cybersecurity Services in Kolkata",
    description:
      "Cybersecurity services in Kolkata - security audits, penetration testing, smart contract security & monitoring. Protect your digital assets.",
  },
  "digital-marketing": {
    title: "Digital Marketing Agency in Kolkata",
    description:
      "Result-driven digital marketing agency in Kolkata. SEO, Google Ads, social media marketing & marketing automation. Grow your business online.",
  },
  "branding-and-designing": {
    title: "Branding & Design Agency in Kolkata",
    description:
      "Branding and design services in Kolkata - UI/UX design, logo and brand identity, graphic design and website design. Packages from ₹30,000.",
  },
  "seo-aeo-geo": {
    title: "SEO, AEO & GEO Services in Kolkata",
    description:
      "SEO, AEO & GEO services in Kolkata - technical SEO, on-page optimisation, link building and AI-search visibility in ChatGPT, Perplexity & Google AI Overviews.",
  },
  "performance-marketing": {
    title: "Performance Marketing Agency in Kolkata",
    description:
      "Performance marketing in Kolkata - Google Ads, Meta Ads & LinkedIn Ads managed for ROI. Campaign strategy, A/B testing and conversion tracking.",
  },
  "social-media-management": {
    title: "Social Media Management Agency in Kolkata",
    description:
      "Social media management in Kolkata - content strategy, reels & carousels, community management and analytics across Instagram, Facebook & LinkedIn.",
  },
  "influencer-marketing": {
    title: "Influencer Marketing Agency in Kolkata",
    description:
      "Influencer marketing in Kolkata - creator discovery, vetting, negotiation, campaign management and performance tracking across Instagram & YouTube.",
  },
  "ui-ux-design": {
    title: "UI/UX Design Services in Kolkata",
    description:
      "UI/UX design in Kolkata - user research, wireframing, interactive prototypes, usability testing and production-ready interface design for web and mobile.",
  },
  "brand-identity-design": {
    title: "Logo & Brand Identity Design in Kolkata",
    description:
      "Logo design and brand identity in Kolkata - logo concepts with revisions, colour palette, typography, brand guidelines and full stationery kit.",
  },
  "graphic-design": {
    title: "Graphic Design Services in Kolkata",
    description:
      "Graphic design in Kolkata - social media creatives, brochures, company profiles, pitch decks, flyers, banners and packaging design.",
  },
  "website-design": {
    title: "Website Design Services in Kolkata",
    description:
      "Website design in Kolkata - page layouts, responsive design, design systems and Figma component libraries ready for development handoff.",
  },
};

/**
 * The two parent pages that are practices rather than single services. Their
 * description and capability list are the production site's own (src/data/
 * services.ts, `digital-marketing` and `branding-and-designing`).
 */
const PARENTS: Record<
  string,
  { title: string; tagline: string; description: string; capabilities: readonly string[]; icon: IconKey }
> = {
  "digital-marketing": {
    title: "Digital Marketing",
    tagline: "Grow. Engage. Convert.",
    description:
      "Data-driven marketing strategies that drive traffic, generate leads and accelerate growth across all digital channels. Including SEO, AEO and GEO, so you are findable on Google and citable in ChatGPT, Perplexity and AI Overviews.",
    capabilities: [
      "SEO, AEO & GEO",
      "Performance Marketing",
      "Social Media Management",
      "Influencer Marketing",
    ],
    icon: "growth",
  },
  "branding-and-designing": {
    title: "Branding & Designing",
    tagline: "Design That Gets Remembered.",
    description:
      "From the logo up: brand identity, interface design and the day-to-day collateral a growing business runs on. Sold as individual disciplines or as one of three packages.",
    capabilities: [
      "UI/UX Design",
      "Brand Identity & Logo Design",
      "Graphic Design",
      "Website Design",
    ],
    icon: "palette",
  },
};

const [developmentPractice, marketingPractice, designingPractice] = practices;

const seoFor = (slug: string, fallbackTitle: string, fallbackDescription: string) =>
  SEO[slug] ?? { title: fallbackTitle, description: fallbackDescription };

function areaFromItem(item: ServiceItem, index: number, practice: PracticeId, practiceTitle: string): ServicePage {
  const seo = seoFor(item.id, item.title, item.description);
  return {
    slug: item.id,
    segments: [item.id],
    href: `/services/${item.id}`,
    priceKey: item.id,
    index: String(index + 1).padStart(2, "0"),
    title: item.title,
    tagline: item.tagline,
    description: item.description,
    capabilities: item.capabilities,
    icon: item.icon,
    practice,
    practiceTitle,
    seoTitle: seo.title,
    seoDescription: seo.description,
  };
}

function parentPage(slug: string, index: string, practice: PracticeId, practiceTitle: string): ServicePage {
  const p = PARENTS[slug];
  const seo = seoFor(slug, p.title, p.description);
  return {
    slug,
    segments: [slug],
    href: `/services/${slug}`,
    priceKey: slug,
    index,
    title: p.title,
    tagline: p.tagline,
    description: p.description,
    capabilities: p.capabilities,
    icon: p.icon,
    practice,
    practiceTitle,
    seoTitle: seo.title,
    seoDescription: seo.description,
  };
}

function subPage(item: ServiceItem, parent: string, index: number, practice: PracticeId, practiceTitle: string): ServicePage {
  const seo = seoFor(item.id, item.title, item.description);
  return {
    slug: `${parent}/${item.id}`,
    segments: [parent, item.id],
    href: `/services/${parent}/${item.id}`,
    parent,
    priceKey: item.id,
    index: String(index + 1).padStart(2, "0"),
    title: item.title,
    tagline: item.tagline,
    description: item.description,
    capabilities: item.capabilities,
    icon: item.icon,
    practice,
    practiceTitle,
    seoTitle: seo.title,
    seoDescription: seo.description,
  };
}

/** The six development services, then the two practice parents. */
export const areaPages: readonly ServicePage[] = [
  ...developmentPractice.items.map((item, i) => areaFromItem(item, i, "development", developmentPractice.title)),
  parentPage("digital-marketing", "07", "marketing", marketingPractice.title),
  parentPage("branding-and-designing", "08", "designing", designingPractice.title),
];

/** The eight pages that sit under a practice parent. */
export const subPages: readonly ServicePage[] = [
  ...marketingPractice.items.map((item, i) => subPage(item, "digital-marketing", i, "marketing", marketingPractice.title)),
  ...designingPractice.items.map((item, i) =>
    subPage(item, "branding-and-designing", i, "designing", designingPractice.title),
  ),
];

/** Every page /services/[...slug] resolves, area pages first. */
export const servicePages: readonly ServicePage[] = [...areaPages, ...subPages];

export const findServicePage = (segments: readonly string[]): ServicePage | undefined =>
  servicePages.find((p) => p.slug === segments.join("/"));

export const childrenOf = (slug: string): readonly ServicePage[] =>
  subPages.filter((p) => p.parent === slug);

/**
 * The technology bands that genuinely apply to a service page, by `techDomains`
 * id in constants/zan.ts. A page with no honest mapping (cybersecurity, the
 * marketing and design pages) simply does not show the band.
 */
export const serviceTechDomains: Record<string, readonly string[]> = {
  "web-development": ["frontend", "backend", "data"],
  "mobile-apps": ["mobile", "backend"],
  "ai-machine-learning": ["ai", "backend"],
  "blockchain-web3": ["blockchain", "frontend"],
  "cloud-devops": ["cloud", "devops"],
};

/**
 * The three branding decks, which are sold as whole packages rather than per
 * card. Titles, taglines and descriptions are the production site's own
 * (src/data/services.ts, `subServices`); the cards and prices behind each key
 * are in constants/pricing.ts. They live on the Branding & Designing page
 * rather than on four URLs of their own, because a client searches for "logo
 * design", not for "Growth Branding Package".
 */
export const brandingPackages = [
  {
    key: "starter-branding-package",
    title: "Starter Branding Package",
    tagline: "Look Established From Day One.",
    description:
      "The essential identity kit for startups and small businesses: a logo you own, a colour and type system that holds together, and every day-one asset ready to hand out.",
  },
  {
    key: "growth-branding-package",
    title: "Growth Branding Package",
    tagline: "One Brand. Every Touchpoint.",
    description:
      "Everything in the Starter package, plus the strategy, templates and digital design a scaling business needs to look and sound the same on every surface it appears.",
  },
  {
    key: "premium-brand-identity",
    title: "Premium Brand Identity",
    tagline: "Own The Category.",
    description:
      "A complete identity system for established companies and enterprises: discovery and competitor work up front, a full design and motion language, and every asset needed to roll it out across screens, print and physical space.",
  },
] as const;

/* ── Page headers ─────────────────────────────────────────────────────────── */

export interface PageIntro {
  eyebrow: string;
  title: readonly string[];
  lead: string;
  /** <title> and description. */
  seoTitle: string;
  seoDescription: string;
}

export const servicesPage: PageIntro = {
  eyebrow: "Services",
  title: ["Powerful solutions", "we can create"],
  lead: "From MVPs to enterprise platforms, here is what we are equipped to build. Each project is customized to your exact requirements.",
  seoTitle: "Services",
  seoDescription:
    "Development, digital marketing and design services from Zan Services: web and mobile development, AI, blockchain, cloud, cybersecurity, SEO, paid media, social, branding and UI/UX.",
};

export const portfolioPage: PageIntro = {
  eyebrow: "Selected work",
  title: ["Projects we have", "delivered"],
  lead: "Recent engagements: the problem we were given, what we built, and what changed afterwards.",
  seoTitle: "Portfolio",
  seoDescription:
    "Case studies from Zan Services: e-commerce, AI support, logistics, mobile and B2B marketing engagements, with the brief, the build and the outcome for each.",
};

export const howWeWorkPage: PageIntro = {
  eyebrow: "Process",
  title: ["How we turn ideas", "into reality"],
  lead: "Four steps, weekly progress updates and a live staging environment. You are involved at every stage.",
  seoTitle: "How We Work",
  seoDescription:
    "How a project runs at Zan Services: discovery and strategy, design and prototype, development and testing, launch and support, with three months of post-launch support.",
};

export const aboutPage: PageIntro = {
  eyebrow: "About Zan Services",
  title: ["Kolkata headquarters.", "Clients in India,", "the UAE and the US."],
  lead: site.description,
  seoTitle: "About Us",
  seoDescription:
    "Zan Services is a digital engineering company headquartered in Kolkata, with an office in Dubai and a US entity in Sacramento, California.",
};

export const pricingPage: PageIntro = {
  eyebrow: "Pricing",
  title: ["What the work", "costs"],
  lead: "The starting price for every service we sell, in the currency of the region you are browsing. Each figure is the entry package on that service page. Anything larger is quoted against scope after the discovery call, with no hidden costs.",
  seoTitle: "Pricing",
  seoDescription:
    "Starting prices for every Zan Services engagement: web and mobile development, AI, blockchain, cloud, cybersecurity, digital marketing, branding and design, in INR, USD and AED.",
};

export const contactPage: PageIntro = {
  eyebrow: "Get in touch",
  title: ["Let's build", "something together"],
  lead: "Tell us about your project. Free consultation, no obligation, and a reply within 24 hours.",
  seoTitle: "Contact Us",
  seoDescription:
    "Talk to Zan Services about a project. Offices in Kolkata, Dubai and Sacramento, a reply within 24 hours, and a free consultation with the people who will build it.",
};

/* ── Section labels used by the new pages ─────────────────────────────────── */

export const labels = {
  packages: "Packages",
  included: "What is included",
  disciplines: "Disciplines",
  relatedWork: "Related work",
  otherServices: "Other services",
  process: "How we work",
  technology: "Technology",
  offices: "Offices",
  industries: "Industries",
  clients: "Clients",
  atAGlance: "At a glance",
  breadcrumb: "Breadcrumb",
  effective: "Effective",
} as const;

/** The closing call to action every standing page ends on. */
export const pageCta = {
  eyebrow: "Next step",
  title: ["Tell us what you", "are building"],
  lead: "A free consultation, a written proposal within 3 to 5 business days, and no obligation until you sign it.",
} as const;

export const notFoundPage = {
  eyebrow: "404",
  title: ["This page is", "not here"],
  lead: "The address may have changed, or the link that brought you here may be out of date. These are the pages people usually want.",
  seoTitle: "Page not found",
} as const;

/* ── Legal ────────────────────────────────────────────────────────────────── */

export const legalSlugs = [
  "privacy-policy",
  "terms-of-service",
  "refund-policy",
  "cookie-policy",
  "disclaimer",
] as const;

export type LegalSlug = (typeof legalSlugs)[number];

/** One line under each policy's title, so the page opens with its scope. */
export const legalIntro: Record<LegalSlug, string> = {
  "privacy-policy": "How Zan Services collects, uses, stores and protects personal data.",
  "terms-of-service": "The terms you agree to when you use this website or engage Zan Services.",
  "refund-policy": "When a payment can be refunded, and how a refund is requested.",
  "cookie-policy": "The cookies and tracking technologies this website uses, and how to control them.",
  disclaimer: "The limits of what our content, deliverables and advice represent.",
};

/* ── Helpers shared by the page templates ─────────────────────────────────── */

/** The practice a service page belongs to, for its "other services" list. */
export const practiceOf = (page: ServicePage): Practice | undefined =>
  practices.find((p) => p.id === page.practice);
