/* ───────────────────────────────────────────────────────────────────────────
   ZAN SERVICES — the single content source for the company page.

   Sources, in order of preference:
     1. the old zanservices.com (vite-react-shift/src) — the hero, the regional
        details and the section headings come from there, as the client asked;
     2. the production Next site (zan_webdevelopment/src/data) — services, case
        studies, process, industries, offices, FAQs.
   Nothing is invented. Where old copy read as filler it is shortened, never
   embellished. Visible copy uses no em dashes and never frames the company as
   a "small team".

   Links: a path starting with "/" is a page on the main site and must be
   resolved with useSiteHref() from @/lib/links (it adds the region prefix and
   the host). "#…" is an anchor on this page.

   The photography in /images/professional is stock, not Zan's team, office or
   builds. Use it only as sector imagery paired with a case study (the
   `screenshot` fields) or decoratively.
   ─────────────────────────────────────────────────────────────────────────── */

import type { IconKey } from "@/components/zan/ui/icons";

export type RegionId = "in" | "ae" | "us";

export const site = {
  name: "Zan Services",
  usEntity: "Zan Services LLC",
  url: "https://zanservices.com",
  email: "support@zanservices.com",
  founded: "2023",
  /** US federal tax ID (EIN), issued to Zan Services LLC. */
  taxId: "35-2955914",
  tagline: "Web, mobile, AI and blockchain development, and digital marketing.",
  description:
    "Zan Services builds web platforms, mobile apps, AI systems and blockchain products, and runs digital marketing for growing companies. Headquartered in Kolkata, with offices in Dubai and Sacramento.",
  wordmark: { lead: "ZAN", trail: "SERVICES" },
} as const;

/* ── Offices ──────────────────────────────────────────────────────────────── */

export interface Office {
  id: RegionId;
  city: string;
  country: string;
  /** IANA zone — drives any local-time readout. */
  timeZone: string;
  addressLines: readonly string[];
  postalCode?: string;
  region?: string;
  phoneTel: string;
  phoneDisplay: string;
  altPhoneTel?: string;
  altPhoneDisplay?: string;
  isHq: boolean;
}

export const offices: readonly Office[] = [
  {
    id: "in",
    city: "Kolkata",
    country: "India",
    timeZone: "Asia/Kolkata",
    addressLines: ["6th Floor, Room 605, Merlin Matrix", "DN Block, Sector V, Bidhannagar"],
    postalCode: "700091",
    region: "West Bengal",
    phoneTel: "+918282948444",
    phoneDisplay: "+91 82829 48444",
    altPhoneTel: "+913369072851",
    altPhoneDisplay: "+91 33 6907 2851",
    isHq: true,
  },
  {
    id: "ae",
    city: "Dubai",
    country: "United Arab Emirates",
    timeZone: "Asia/Dubai",
    addressLines: ["AG Tower, 22nd Floor, Suite 2202A", "30/1 Marasi Drive"],
    phoneTel: "+971559855875",
    phoneDisplay: "+971 55 985 5875",
    isHq: false,
  },
  {
    id: "us",
    city: "Sacramento",
    country: "United States",
    timeZone: "America/Los_Angeles",
    addressLines: ["Zan Services LLC", "2108 N St Ste N"],
    postalCode: "95816",
    region: "CA",
    phoneTel: "+18336287507",
    phoneDisplay: "+1 (833) 628-7507",
    isHq: false,
  },
];

/* ── Regions ───────────────────────────────────────────────────────────────
   Exactly the old site's rules (vite-react-shift: usePhone, useWhatsApp,
   useBrand, useRegionContent):
     phone     the region's own office number
     WhatsApp  the UAE desk in the UAE; everyone else, including the US, the
               India desk — the US toll-free line is not on WhatsApp
     brand     the UAE entity trades as Zan Verse Technology
     hero      "Your trusted IT partner" in the US, "Kolkata's …" elsewhere
   The colour of each region lives in globals.css (html[data-region]). */

export interface RegionConfig {
  id: RegionId;
  label: string;
  short: string;
  brandName: string;
  logo: { src: string; width: number; height: number };
  office: Office;
  /** Digits only, for wa.me links. */
  whatsapp: string;
  /** Opens the hero subtitle: "Kolkata's" or "Your". */
  heroOwner: string;
  /** Country dialling code for the phone field. */
  dialCode: string;
  /** ISO code of the currency every price on this site is quoted in. */
  currency: "INR" | "USD" | "AED";
  /** The same currency in words, for prose that names it. */
  currencyName: string;
}

const zanMark = { src: "/images/brand/zan-mark.png", width: 828, height: 301 };

export const regions: Record<RegionId, RegionConfig> = {
  in: {
    id: "in",
    label: "India",
    short: "IN",
    brandName: "Zan Services",
    logo: zanMark,
    office: offices[0],
    whatsapp: "918282948444",
    heroOwner: "Kolkata's",
    dialCode: "+91",
    currency: "INR",
    currencyName: "Indian rupees",
  },
  ae: {
    id: "ae",
    label: "UAE",
    short: "AE",
    brandName: "Zan Verse Technology",
    // Same aspect as the mark (2.75:1), so swapping it never shifts the nav.
    logo: { src: "/images/brand/zan-logo-ae.png", width: 1980, height: 720 },
    office: offices[1],
    whatsapp: "971559855875",
    heroOwner: "Kolkata's",
    dialCode: "+971",
    currency: "AED",
    currencyName: "Dirhams",
  },
  us: {
    id: "us",
    label: "United States",
    short: "US",
    brandName: "Zan Services",
    logo: zanMark,
    office: offices[2],
    whatsapp: "918282948444",
    heroOwner: "Your",
    dialCode: "+1",
    currency: "USD",
    currencyName: "US dollars",
  },
};

export const regionOrder: readonly RegionId[] = ["in", "ae", "us"];

/* ── Hero — the old zanservices.com hero, word for word ───────────────────── */

export const hero = {
  badge: "Comprehensive Technology & Digital Marketing Solutions",
  /** The old site's badge on small screens. */
  badgeShort: "Tech & Marketing Solutions",
  /** "Transform Your" + one of the typed words. */
  headlineLead: "Transform Your",
  typingWords: ["Digital Future", "Web Experiences", "Mobile Apps", "AI Solutions", "Blockchain dApps"],
  /** Follows region.heroOwner ("Kolkata's" / "Your"). `accent` parts are highlighted. */
  subtitle: [
    { text: " trusted IT partner for " },
    { text: "Web & Mobile Development", accent: true },
    { text: ", " },
    { text: "Blockchain & AI", accent: true },
    { text: ", and expert " },
    { text: "Digital Marketing Solutions", accent: true },
  ],
  primary: { label: "Get Free Consultation", short: "Free Quote", href: "/contact-us" },
  whatsapp: { label: "WhatsApp Now", short: "WhatsApp" },
} as const;

/* ── Calls to action ─────────────────────────────────────────────────────────
   contact / consultation open the main site's contact page. project scrolls
   to the enquiry section on this page; work to the work section. */

export const ctas = {
  contact: { label: "Contact Us", href: "/contact-us" },
  consultation: { label: "Get Free Consultation", href: "/contact-us" },
  project: { label: "Start a Project", href: "#contact" },
  work: { label: "See Our Work", href: "#work" },
  portfolio: { label: "View Portfolio", href: "/portfolio" },
} as const;

/* ── Chapter cards (the reference's pinned transitions) ──────────────────── */

export const chapters = {
  whatWeDo: { index: "01", eyebrow: "Chapter 01", label: ["What", "we do"] },
  work: { index: "02", eyebrow: "Chapter 02", label: ["Selected", "work"] },
  process: { index: "03", eyebrow: "Chapter 03", label: ["How we", "work"] },
} as const;

/* ── Services: the three practices of the services deck ──────────────────── */

export interface ServiceItem {
  id: string;
  title: string;
  short: string;
  tagline: string;
  description: string;
  capabilities?: readonly string[];
  icon: IconKey;
  /** Its page on the main site. */
  href: string;
}

export interface Practice {
  id: "development" | "marketing" | "blockchain" | "designing";
  index: string;
  title: string;
  tagline: string;
  /** Deck headline — the practice's own tagline, one phrase per line. */
  headline: readonly string[];
  lead: string;
  href: string;
  items: readonly ServiceItem[];
}

/** From the old site's capabilities section. */
export const servicesIntro = {
  eyebrow: "Services",
  title: ["Powerful solutions", "we can create"],
  lead: "From MVPs to enterprise platforms, here is what we are equipped to build. Each project is customized to your exact requirements.",
} as const;

export const practices: readonly Practice[] = [
  {
    id: "development",
    index: "01",
    title: "Development",
    tagline: "Build. Scale. Dominate.",
    headline: ["Build.", "Scale.", "Dominate."],
    lead: "Websites, mobile apps, AI, blockchain, cloud and security, designed and built to hold up as your business grows.",
    href: "/services",
    items: [
      {
        id: "web-development",
        title: "Web Development",
        short: "Web",
        tagline: "Build. Scale. Dominate.",
        description:
          "From starter websites to enterprise-grade web applications, we deliver scalable, responsive solutions tailored to your business needs.",
        capabilities: ["Starter & Business Websites", "E-commerce Platforms", "Custom Web Applications", "Landing Pages"],
        icon: "code",
        href: "/services/web-development",
      },
      {
        id: "mobile-apps",
        title: "Mobile App Development",
        short: "Mobile",
        tagline: "Apps That Users Love.",
        description:
          "Native and cross-platform mobile solutions designed to engage users and drive business growth. From concept to deployment.",
        capabilities: ["MVP Apps", "Cross-Platform", "iOS & Android", "App Store Release"],
        icon: "mobile",
        href: "/services/mobile-apps",
      },
      {
        id: "ai-machine-learning",
        title: "AI & Machine Learning",
        short: "AI & ML",
        tagline: "Intelligence, Automated.",
        description:
          "Harness the power of artificial intelligence to automate processes, generate insights, and create intelligent applications.",
        capabilities: ["Custom ML Models", "Chatbots", "Generative AI", "AI Consulting"],
        icon: "ai",
        href: "/services/ai-machine-learning",
      },
      {
        id: "blockchain-web3",
        title: "Blockchain & Web3",
        short: "Blockchain",
        tagline: "The Future Is Decentralized.",
        description:
          "Blockchain development services that power decentralized applications, smart contracts, and digital asset platforms.",
        capabilities: ["Smart Contracts", "dApps", "NFT Platforms", "Security Audits"],
        icon: "blockchain",
        href: "/services/blockchain-web3",
      },
      {
        id: "cloud-devops",
        title: "Cloud & DevOps",
        short: "Cloud & DevOps",
        tagline: "Deploy Faster. Scale Smarter.",
        description:
          "Streamline operations with cloud infrastructure, automated workflows, and DevOps best practices that accelerate deployment.",
        capabilities: ["AWS, Azure & GCP", "CI/CD Pipelines", "Containers", "Automation"],
        icon: "cloud",
        href: "/services/cloud-devops",
      },
      {
        id: "cybersecurity",
        title: "Cybersecurity",
        short: "Cybersecurity",
        tagline: "Secure. Optimized. Protected.",
        description:
          "Protect your digital assets and optimize performance with comprehensive security audits, monitoring, and optimization.",
        capabilities: ["Security Audits", "Penetration Testing", "Contract Security", "Monitoring"],
        icon: "security",
        href: "/services/cybersecurity",
      },
    ],
  },
  {
    id: "marketing",
    index: "02",
    title: "Digital Marketing",
    tagline: "Grow. Engage. Convert.",
    headline: ["Grow.", "Engage.", "Convert."],
    lead: "Data-driven marketing that drives traffic, generates leads and accelerates growth across every digital channel, including SEO, AEO and GEO, so you can be found on Google and cited in ChatGPT, Perplexity and AI Overviews.",
    href: "/services/digital-marketing",
    items: [
      {
        id: "seo-aeo-geo",
        title: "SEO, AEO & GEO",
        short: "SEO · AEO · GEO",
        tagline: "Be Found. Be Cited. Be Chosen.",
        description:
          "Search optimisation for classic search engines and for the AI answer engines your customers now ask first. We make your brand findable on Google and citable in ChatGPT, Perplexity and AI Overviews.",
        icon: "search",
        href: "/services/digital-marketing/seo-aeo-geo",
      },
      {
        id: "performance-marketing",
        title: "Performance Marketing",
        short: "Performance",
        tagline: "Spend Less. Convert More.",
        description:
          "Paid advertising judged on one thing: what it returns. Full-funnel campaigns across Google, Meta and LinkedIn, with the tracking to prove what worked.",
        icon: "growth",
        href: "/services/digital-marketing/performance-marketing",
      },
      {
        id: "social-media-management",
        title: "Social Media Management",
        short: "Social",
        tagline: "Show Up. Sound Human. Stay Consistent.",
        description:
          "Strategy, content and community management that builds an audience worth advertising to: reels, carousels and conversations, published on a calendar you can see.",
        icon: "social",
        href: "/services/digital-marketing/social-media-management",
      },
      {
        id: "influencer-marketing",
        title: "Influencer Marketing",
        short: "Influencer",
        tagline: "Borrow Trust. Build Demand.",
        description:
          "Creator partnerships that read as endorsement rather than advertising. We handle discovery, vetting, negotiation, briefing and measurement end to end.",
        icon: "megaphone",
        href: "/services/digital-marketing/influencer-marketing",
      },
    ],
  },
  {
    id: "designing",
    index: "03",
    title: "Designing",
    tagline: "Design That Gets Remembered.",
    headline: ["Design that", "gets", "remembered."],
    lead: "From the logo up: brand identity, interface design and the everyday collateral a growing business runs on.",
    href: "/services/branding-and-designing",
    items: [
      {
        id: "ui-ux-design",
        title: "UI/UX Design",
        short: "UI/UX",
        tagline: "Interfaces People Get First Time.",
        description:
          "Research, wireframes, prototypes and the finished interface for web apps, mobile apps and dashboards. We design against real tasks and test the flows before any of it is built.",
        icon: "layout",
        href: "/services/branding-and-designing/ui-ux-design",
      },
      {
        id: "brand-identity-design",
        title: "Brand Identity & Logo Design",
        short: "Brand Identity",
        tagline: "A Mark You Actually Own.",
        description:
          "The logo, the colours, the type and the rules that hold them together, delivered as files you own outright with a guideline document your team can hand to anyone.",
        icon: "gem",
        href: "/services/branding-and-designing/brand-identity-design",
      },
      {
        id: "graphic-design",
        title: "Graphic Design",
        short: "Graphic Design",
        tagline: "On Brand, Every Week.",
        description:
          "The recurring work an active brand needs, from social creatives and brochures to pitch decks, banners and packaging, built as templates so it stays consistent.",
        icon: "palette",
        href: "/services/branding-and-designing/graphic-design",
      },
      {
        id: "website-design",
        title: "Website Design",
        short: "Website Design",
        tagline: "Designed Before It Is Built.",
        description:
          "The visual design of the site itself: page layouts, responsive behaviour and a component set handed over in Figma, ready for our developers or yours.",
        icon: "monitor",
        href: "/services/branding-and-designing/website-design",
      },
    ],
  },
];

/** Anchor for each practice's panel in the services deck. */
export const practiceAnchor = (id: Practice["id"]) => `#${id}`;

/* ── The services deck: four panels ──────────────────────────────────────────
   The client's four major areas. Blockchain & Web3 gets its own panel here,
   as asked, so Development's list drops it. The navigation keeps its three
   columns (`practices` above, which the mega menu, footer, enquiry form and
   preloader read). Blockchain copy is the production service description and
   the technology section's blockchain blurb; the item lines restate the old
   site's "DApps & Smart Contracts" capability. Nothing new is claimed. */

const [developmentPractice, marketingPractice, designingPractice] = practices;

export const deckPractices: readonly Practice[] = [
  {
    ...developmentPractice,
    lead: "Websites, mobile apps, AI, cloud and security, designed and built to hold up as your business grows.",
    items: developmentPractice.items.filter((s) => s.id !== "blockchain-web3"),
  },
  { ...marketingPractice, index: "02" },
  {
    id: "blockchain",
    index: "03",
    title: "Blockchain & Web3",
    tagline: "The Future Is Decentralized.",
    headline: ["The future is", "decentralized."],
    lead: "Blockchain development that powers decentralized applications, smart contracts and digital asset platforms. Contracts written to be audited, with the tooling that makes them safe to operate afterwards.",
    href: "/services/blockchain-web3",
    items: [
      {
        id: "smart-contracts",
        title: "Smart Contracts",
        short: "Smart Contracts",
        tagline: "Written to be audited.",
        description: "Custom smart contracts on Ethereum and Polygon, written to be audited before they go live.",
        icon: "code",
        href: "/services/blockchain-web3",
      },
      {
        id: "dapps",
        title: "dApps",
        short: "dApps",
        tagline: "Decentralized applications.",
        description: "Decentralized applications and DeFi platforms, from the contracts to the interface people use.",
        icon: "web",
        href: "/services/blockchain-web3",
      },
      {
        id: "nft-platforms",
        title: "NFT Platforms",
        short: "NFT Platforms",
        tagline: "Digital asset platforms.",
        description: "NFT marketplaces and digital asset platforms, built on audited contracts.",
        icon: "gem",
        href: "/services/blockchain-web3",
      },
      {
        id: "security-audits",
        title: "Security Audits",
        short: "Security Audits",
        tagline: "Checked before launch.",
        description: "Contract security reviews and audits, so the code is safe to operate after it ships.",
        icon: "security",
        href: "/services/blockchain-web3",
      },
    ],
  },
  { ...designingPractice, index: "04" },
];

/** The blockchain stack, for chips on its deck panel. */
export const blockchainStack: readonly string[] = ["Solidity", "Hardhat", "Ethereum", "Polygon", "IPFS"];

/* ── The four major areas (the sideways-scrolling dial) ──────────────────────
   The client's own grouping for this band: Blockchain & Web3 stands on its
   own here, beside the three practices. */

export interface Pillar {
  id: "development" | "marketing" | "blockchain" | "designing";
  index: string;
  title: string;
  tagline: string;
  description: string;
  items: readonly string[];
  icon: IconKey;
  href: string;
}

export const pillarsIntro = {
  eyebrow: "What we do",
  title: ["Four areas of", "expertise"],
  lead: "Have a different idea? We can build anything you imagine.",
} as const;

export const pillars: readonly Pillar[] = [
  {
    id: "development",
    index: "01",
    title: "Development",
    tagline: "Build. Scale. Dominate.",
    description: "Websites, web applications and mobile apps, built to scale with your business.",
    items: ["Web Development", "Mobile App Development", "AI & Machine Learning", "Cloud & DevOps", "Cybersecurity"],
    icon: "code",
    href: "/services",
  },
  {
    id: "marketing",
    index: "02",
    title: "Digital Marketing",
    tagline: "Grow. Engage. Convert.",
    description: "Search, paid, social and creator marketing, measured on what it returns.",
    items: ["SEO, AEO & GEO", "Performance Marketing", "Social Media Management", "Influencer Marketing"],
    icon: "growth",
    href: "/services/digital-marketing",
  },
  {
    id: "blockchain",
    index: "03",
    title: "Blockchain & Web3",
    tagline: "The Future Is Decentralized.",
    description: "Decentralized applications, smart contracts and digital asset platforms, audited.",
    items: ["Smart Contracts", "dApps", "NFT Platforms", "Security Audits"],
    icon: "blockchain",
    href: "/services/blockchain-web3",
  },
  {
    id: "designing",
    index: "04",
    title: "Designing",
    tagline: "Design That Gets Remembered.",
    description: "Brand identity, interface design and the collateral a growing business runs on.",
    items: ["UI/UX Design", "Brand Identity & Logo Design", "Graphic Design", "Website Design"],
    icon: "palette",
    href: "/services/branding-and-designing",
  },
];

/* ── Why choose us (the old site's reasons) ───────────────────────────────── */

export const whyUs = {
  eyebrow: "Why choose us",
  title: ["Why businesses", "choose Zan"],
  items: [
    {
      id: "modern-tech",
      index: "01",
      title: "Modern Tech Expertise",
      tagline: "Built with what ships",
      description:
        "Latest frameworks, clean code and battle-tested architecture. React, Next.js, Node, Python and blockchain are what we work in every day.",
      icon: "code",
    },
    {
      id: "pricing",
      index: "02",
      title: "Competitive Pricing",
      tagline: "Premium quality, fair price",
      description: "Transparent pricing, no hidden costs and flexible packages, quoted against the scope of the work.",
      icon: "growth",
    },
    {
      id: "delivery",
      index: "03",
      title: "Fast Delivery",
      tagline: "Agile sprints, weekly progress",
      description:
        "Your project is our priority. Agile sprints and weekly updates keep the work moving without compromising quality.",
      icon: "rocket",
    },
    {
      id: "support",
      index: "04",
      title: "Dedicated Support",
      tagline: "Direct access, no middlemen",
      description: "Talk to the developers building your project. We respond fast because your success is our growth.",
      icon: "support",
    },
  ] satisfies { id: string; index: string; title: string; tagline: string; description: string; icon: IconKey }[],
} as const;

/* ── Navigation: pages of the main site (resolve with useSiteHref) ────────── */

export interface NavLeaf {
  label: string;
  href: string;
  description?: string;
}
export interface NavSection {
  title: string;
  href: string;
  items: readonly NavLeaf[];
}
export interface NavItem {
  label: string;
  href: string;
  sections?: readonly NavSection[];
}

export const serviceNav: readonly NavSection[] = practices.map((p) => ({
  title: p.title,
  href: p.href,
  items: p.items.map((s) => ({ label: s.title, href: s.href, description: s.tagline })),
}));

export const mainNav: readonly NavItem[] = [
  { label: "Services", href: "/services", sections: serviceNav },
  { label: "Work", href: "/portfolio" },
  { label: "How We Work", href: "/how-we-work" },
  { label: "About", href: "/about-us" },
];

/* ── Work ───────────────────────────────────────────────────────────────────
   Case studies, verbatim. The figures under `results` are the client outcomes
   the previous build published. */

export interface ProjectResult {
  metric: string;
  value: string;
}

export interface Project {
  id: string;
  index: string;
  name: string;
  discipline: string;
  industry: string;
  timeline: string;
  category: string;
  challenge: string;
  solution: string;
  results: readonly ProjectResult[];
  techStack: readonly string[];
  /** For generated artwork when there is no image. */
  hue: number;
  pattern: "grid" | "arc" | "mesh" | "orbit";
  /** Sector imagery (stock), as the production site pairs it. */
  screenshot?: { src: string; width: number; height: number };
}

/* The five pictures under `screenshot`, and why each one is a place rather
   than a screen. A product-looking screenshot on a card headed "Enterprise
   Logistics Dashboard" reads as the thing we delivered, and it is not: these
   are stock photographs of the sector the engagement was in, paired with a
   case study exactly as the note at the top of this file allows. What the
   engagement produced is written out underneath in `solution` and `results`.

   Each file is 1600 x 1000 JPEG, cropped so the subject sits in the middle of
   the frame: the work wall crops a ~2.8:1 band out of the middle, the case
   panel a 4:3 and the industries carousel a 3:4, and none of those may cut
   through the subject. `source` is the Pexels URL the file came from, a record
   of provenance, not a credit the page owes (Pexels allows commercial use with
   no attribution).

     fashion-retail     pexels.com/photo/3965545   a boutique's rail of clothes
     support-desk       pexels.com/photo/7709277   a headset over a closed laptop
     warehouse          pexels.com/photo/5156696   a racking aisle being worked
     fitness-studio     pexels.com/photo/37573625  mats laid out on a studio floor
     campaign-planning  pexels.com/photo/7710055   a flip chart of campaign notes */

export const workIntro = {
  eyebrow: "Selected work",
  title: ["Projects we have", "delivered"],
  lead: "Recent engagements: the problem we were given, what we built, and what changed afterwards.",
} as const;

export const projects: readonly Project[] = [
  {
    id: "ecommerce-platform-fashion",
    index: "01",
    name: "E-commerce Platform for Fashion Retail",
    discipline: "Web Development",
    industry: "Fashion Retail",
    timeline: "8 weeks",
    category: "web-development",
    challenge:
      "Client needed a high-converting online store to replace their outdated WordPress site that was suffering from slow load times, poor mobile experience, and declining sales.",
    solution:
      "Custom React + Node.js e-commerce platform with Stripe payment integration, real-time inventory management, advanced product filtering, and a built-in analytics dashboard for tracking conversions and revenue.",
    results: [
      { metric: "Increase in online sales", value: "340%" },
      { metric: "Page load time, from 6.2s", value: "1.8s" },
      { metric: "Higher conversion rate", value: "45%" },
      { metric: "Lower bounce rate", value: "60%" },
    ],
    techStack: ["React", "Node.js", "Express", "MongoDB", "Stripe", "Redis", "AWS S3"],
    hue: 265,
    pattern: "grid",
    screenshot: { src: "/images/professional/fashion-retail.jpg", width: 1600, height: 1000 },
  },
  {
    id: "ai-customer-support-bot",
    index: "02",
    name: "AI Customer Support Bot",
    discipline: "AI & Machine Learning",
    industry: "E-commerce",
    timeline: "4 weeks",
    category: "ai-machine-learning",
    challenge:
      "Growing e-commerce brand receiving 2,000+ support tickets daily with an average response time of 48 hours. Customer satisfaction was dropping and support costs were escalating rapidly.",
    solution:
      "Custom AI chatbot powered by NLP with intent recognition, integrated with the existing CRM and order management system. The bot handles FAQs, order tracking, return initiation, and seamlessly escalates complex queries to human agents.",
    results: [
      { metric: "Reduction in support tickets", value: "70%" },
      { metric: "Response time, from 48hrs", value: "30 sec" },
      { metric: "Customer satisfaction score", value: "92%" },
      { metric: "Monthly support cost saved", value: "$15K" },
    ],
    techStack: ["Python", "OpenAI API", "LangChain", "FastAPI", "PostgreSQL", "Redis"],
    hue: 250,
    pattern: "orbit",
    screenshot: { src: "/images/professional/support-desk.jpg", width: 1600, height: 1000 },
  },
  {
    id: "enterprise-logistics-dashboard",
    index: "03",
    name: "Enterprise Logistics Dashboard",
    discipline: "Web Development",
    industry: "Logistics & Supply Chain",
    timeline: "10 weeks",
    category: "web-development",
    challenge:
      "Operations team managing 500+ daily shipments using spreadsheets and manual processes, causing frequent delays, data entry errors, and lack of real-time visibility across the supply chain.",
    solution:
      "Custom Next.js dashboard with real-time shipment tracking, PostgreSQL database with optimized queries, automated daily and weekly reporting, role-based access control, and integrations with carrier APIs for live tracking updates.",
    results: [
      { metric: "Reduction in manual processes", value: "60%" },
      { metric: "System uptime", value: "99.9%" },
      { metric: "Faster order processing", value: "45%" },
      { metric: "ROI achieved in", value: "3 months" },
    ],
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma", "Docker", "AWS ECS"],
    hue: 282,
    pattern: "mesh",
    screenshot: { src: "/images/professional/warehouse.jpg", width: 1600, height: 1000 },
  },
  {
    id: "health-fitness-app",
    index: "04",
    name: "Health & Fitness Tracking App",
    discipline: "Mobile App Development",
    industry: "Health & Wellness",
    timeline: "6 weeks",
    category: "mobile-apps",
    challenge:
      "Startup needed an MVP to validate their fitness tracking concept before approaching investors for seed funding. They required a polished, cross-platform app delivered within a tight timeline and budget.",
    solution:
      "React Native cross-platform app with real-time workout tracking, personalized training plans, social features, Firebase backend for real-time sync, and push notifications for workout reminders and progress milestones.",
    results: [
      { metric: "Downloads in first month", value: "15,000+" },
      { metric: "App Store rating", value: "4.7" },
      { metric: "Seed funding secured", value: "$500K" },
      { metric: "Daily active users", value: "68%" },
    ],
    techStack: ["React Native", "Firebase", "Node.js", "HealthKit", "Google Fit API"],
    hue: 236,
    pattern: "arc",
    screenshot: { src: "/images/professional/fitness-studio.jpg", width: 1600, height: 1000 },
  },
  {
    id: "b2b-lead-generation",
    index: "05",
    name: "B2B Lead Generation Campaign",
    discipline: "Digital Marketing",
    industry: "B2B SaaS",
    timeline: "6 months",
    category: "digital-marketing",
    challenge:
      "SaaS company struggling with high cost-per-acquisition and low-quality leads from their paid campaigns. Their organic search presence was minimal and their marketing funnel had no automation in place.",
    solution:
      "Multi-channel digital marketing strategy including a full technical SEO overhaul, Google Ads optimization with refined audience targeting, LinkedIn thought-leadership campaigns, and HubSpot marketing automation for lead nurturing.",
    results: [
      { metric: "Organic traffic growth", value: "3x" },
      { metric: "More qualified leads", value: "180%" },
      { metric: "Lower cost per acquisition", value: "42%" },
      { metric: "Lead-to-customer lift", value: "28%" },
    ],
    techStack: ["Google Ads", "LinkedIn Ads", "HubSpot", "GA4", "SEMrush", "Ahrefs"],
    hue: 300,
    pattern: "grid",
    screenshot: { src: "/images/professional/campaign-planning.jpg", width: 1600, height: 1000 },
  },
];

/* ── Credibility figures (production site) ──────────────────────────────────
   Its "30 days post-launch support" figure is left out: the process and about
   copy both say three months, and the page should not contradict itself. */

export interface Metric {
  id: string;
  value: string;
  label: string;
  detail: string;
}

export const metricsIntro = {
  eyebrow: "At a glance",
  stackCaption: "The stack behind every project we ship",
} as const;

export const metrics: readonly Metric[] = [
  { id: "projects", value: "80+", label: "Projects delivered", detail: "Across web, mobile & AI" },
  { id: "clients", value: "50+", label: "Clients worldwide", detail: "India, UAE & United States" },
  { id: "rating", value: "4.9", label: "Average client rating", detail: "Out of 5" },
  { id: "on-time", value: "99%", label: "On-time delivery", detail: "Against agreed timelines" },
  { id: "response", value: "24 hrs", label: "Response time", detail: "To every new enquiry" },
];

/* ── Clients ────────────────────────────────────────────────────────────────
   Real marks belonging to real customers: shown as supplied, never tinted or
   greyscaled, each on a white plate (two are too pale for anything else). */

export interface Client {
  name: string;
  sector: string;
  src: string;
}

/** The old site's heading for this band. */
export const partnersIntro = {
  eyebrow: "Partners",
  title: ["Trusted by partners", "worldwide"],
  lead: "Brands and businesses that have grown with us.",
} as const;

export const clients: readonly Client[] = [
  { name: "Linen & Stories", sector: "Home textiles and lifestyle retail", src: "/images/clients/client-1.png" },
  { name: "Angel Care", sector: "Healthcare and elder care", src: "/images/clients/client-2.png" },
  { name: "VSK", sector: "Construction and infrastructure", src: "/images/clients/client-3.png" },
  { name: "Legacy Events", sector: "Event management", src: "/images/clients/client-4.png" },
];

/* ── Technology ───────────────────────────────────────────────────────────── */

export interface TechDomain {
  id: string;
  label: string;
  icon: IconKey;
  blurb: string;
  stack: readonly string[];
}

/** The old site's heading for this section. */
export const techIntro = {
  eyebrow: "Technology",
  title: ["Built with the tools", "that ship"],
  lead: "The frameworks and platforms behind every product we deliver.",
  core: { line1: "ZAN", line2: "DEVELOPMENT" },
} as const;

/** Real vendor logos, by tool name. Anything without a file gets a wordmark chip. */
export const techLogos: Record<string, string> = {
  React: "/images/tech/react.png",
  "Next.js": "/images/tech/next.png",
  TypeScript: "/images/tech/ts.png",
  "Tailwind CSS": "/images/tech/tailwind.png",
  "Vue.js": "/images/tech/vue.png",
  "Node.js": "/images/tech/node.png",
  Python: "/images/tech/python.png",
  Django: "/images/tech/django.png",
  Flask: "/images/tech/flask.png",
  FastAPI: "/images/tech/fastApi.png",
  GraphQL: "/images/tech/graphQL.png",
  "REST APIs": "/images/tech/rest.png",
  "React Native": "/images/tech/react_native.png",
  Flutter: "/images/tech/flutter.png",
  Swift: "/images/tech/swift.png",
  Kotlin: "/images/tech/android.png",
  Firebase: "/images/tech/firebase.png",
  AWS: "/images/tech/aws.png",
  "Google Cloud": "/images/tech/google_cloud.png",
  Azure: "/images/tech/microsoft_azure.png",
  Vercel: "/images/tech/vercel.png",
  Netlify: "/images/tech/netlify.png",
  Docker: "/images/tech/docker.png",
  Kubernetes: "/images/tech/kubernates.png",
  Solidity: "/images/tech/solidity.png",
  Hardhat: "/images/tech/hardhat.png",
  Ethereum: "/images/tech/ether.png",
  Polygon: "/images/tech/polygon.png",
  Figma: "/images/tech/figma.png",
  "Adobe XD": "/images/tech/adobe_xd.png",
};

export const techDomains: readonly TechDomain[] = [
  {
    id: "frontend",
    label: "Frontend",
    icon: "web",
    blurb: "Typed, component-driven interfaces on the frameworks that ship, easy for other teams to pick up.",
    stack: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Vue.js", "Redux"],
  },
  {
    id: "backend",
    label: "Backend",
    icon: "server",
    blurb: "APIs and services designed around the data model, not around the first screen that needed them.",
    stack: ["Node.js", "Python", "Django", "FastAPI", "GraphQL", "REST APIs"],
  },
  {
    id: "ai",
    label: "AI & ML",
    icon: "ai",
    blurb: "Applied AI in production: retrieval, agents and classic models wired into real products.",
    stack: ["OpenAI API", "LangChain", "PyTorch", "TensorFlow", "Hugging Face", "Pinecone"],
  },
  {
    id: "cloud",
    label: "Cloud",
    icon: "cloud",
    blurb: "Infrastructure that scales quietly, deploys predictably, and costs what it should.",
    stack: ["AWS", "Google Cloud", "Azure", "Vercel", "Netlify"],
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: "mobile",
    blurb: "One codebase where that is the right call, native where it is not, shipped to both stores.",
    stack: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase"],
  },
  {
    id: "blockchain",
    label: "Blockchain",
    icon: "blockchain",
    blurb: "Contracts written to be audited, and the tooling that makes them safe to operate afterwards.",
    stack: ["Solidity", "Hardhat", "Ethereum", "Polygon", "IPFS"],
  },
  {
    id: "data",
    label: "Data",
    icon: "data",
    blurb: "Schemas, queries and caches designed for the reads the product actually makes.",
    stack: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Supabase", "Prisma"],
  },
  {
    id: "devops",
    label: "DevOps",
    icon: "devops",
    blurb: "Pipelines, containers and monitoring, so a release is routine rather than an event.",
    stack: ["Docker", "Kubernetes", "GitHub Actions", "Terraform", "Sentry"],
  },
];

/** Flattened, de-duplicated list for text marquees. */
export const marqueeTech: readonly string[] = Array.from(new Set(techDomains.flatMap((d) => d.stack)));

/* ── Process ──────────────────────────────────────────────────────────────── */

export interface ProcessStep {
  id: string;
  index: string;
  title: string;
  description: string;
  deliverables: readonly string[];
}

/** The old site's heading for this section. */
export const processIntro = {
  eyebrow: "Process",
  title: ["How we turn ideas", "into reality"],
  lead: "Four steps, weekly progress updates and a live staging environment. You are involved at every stage.",
} as const;

export const processSteps: readonly ProcessStep[] = [
  {
    id: "discovery",
    index: "01",
    title: "Discovery & Strategy",
    description:
      "We dive deep into your business goals, target audience, and project requirements. Through detailed discussions, we craft a clear roadmap.",
    deliverables: ["Requirements gathering", "Market research", "Project scope definition", "Timeline & budget planning"],
  },
  {
    id: "design",
    index: "02",
    title: "Design & Prototype",
    description:
      "Our designers create wireframes and interactive prototypes. You see exactly what you are getting before a single line of code is written.",
    deliverables: ["UI/UX design", "Interactive mockups", "Design system creation", "Feedback & iterations"],
  },
  {
    id: "build",
    index: "03",
    title: "Development & Testing",
    description:
      "Our developers bring designs to life using modern tech stacks. With agile sprints, regular updates, and rigorous testing at every step.",
    deliverables: ["Clean, typed code", "Regular sprint updates", "Automated testing", "Quality assurance"],
  },
  {
    id: "launch",
    index: "04",
    title: "Launch & Support",
    description:
      "Smooth deployment to production with zero downtime. Post-launch, we provide dedicated support and continuous improvements.",
    deliverables: ["Deployment setup", "Performance optimisation", "Training & documentation", "3 months free support"],
  },
];

/* ── Industries ───────────────────────────────────────────────────────────── */

export interface Industry {
  id: string;
  label: string;
  icon: IconKey;
  description: string;
}

/** Adapted from the old site's "Industries We Empower". */
export const industriesIntro = {
  eyebrow: "Industries",
  title: ["Industries", "we work with"],
  lead: "From healthcare to e-commerce, we build solutions around the requirements of each sector.",
} as const;

export const industries: readonly Industry[] = [
  { id: "healthcare", label: "Healthcare", icon: "health", description: "HIPAA-compliant telemedicine platforms, patient portals and health tracking apps" },
  { id: "finance", label: "Finance & Fintech", icon: "finance", description: "Banking apps, payment gateways, crypto wallets and financial dashboards" },
  { id: "ecommerce", label: "E-commerce", icon: "ecommerce", description: "Online stores, inventory management and multi-vendor platforms" },
  { id: "education", label: "Education", icon: "education", description: "LMS platforms, virtual classrooms and student portals" },
  { id: "real-estate", label: "Real Estate", icon: "building", description: "Property listings, virtual tours and CRM systems" },
  { id: "logistics", label: "Logistics", icon: "logistics", description: "Fleet tracking, warehouse management and delivery optimisation" },
  { id: "entertainment", label: "Entertainment", icon: "entertainment", description: "Streaming platforms, content management and ticketing systems" },
  { id: "travel", label: "Travel", icon: "travel", description: "Booking systems, hotel management and travel planning" },
];

/* ── About ────────────────────────────────────────────────────────────────── */

export const about = {
  eyebrow: "About Zan Services",
  heading: ["Kolkata headquarters.", "Clients in India,", "the UAE and the US."],
  body: [
    "Zan Services is a digital engineering company headquartered in Kolkata, with an office in Dubai and a registered US entity, Zan Services LLC, in Sacramento, California. We build web platforms, mobile apps, AI systems and blockchain products, and run digital marketing for the businesses we build for.",
    "The people who scope your project are the people who build it. You talk to them directly, and you get weekly progress and a live staging environment rather than a status report.",
  ],
  principles: [
    { label: "Headquarters", value: "Kolkata, India" },
    { label: "Offices", value: "Kolkata · Dubai · Sacramento" },
    { label: "Engagements", value: "Fixed scope & retainer" },
    { label: "Support", value: "3 months post-launch" },
  ],
} as const;

/* ── Credentials ───────────────────────────────────────────────────────────
   The registrations and certificates the company holds, with the numbers the
   old site printed in its footer (vite-react-shift: src/components/Footer.tsx,
   "Certifications & Registrations"). Nothing here is a claim we make about
   ourselves: each line is a register a buyer can check us against, which is
   why the numbers are shown as text rather than only as a badge.

   The IRS mark is a white lockup, so it is the one that sits on a dark plate.
   The rest are full-colour and sit on the card's own ground. */

export interface Credential {
  id: string;
  /** Shown as the card's title. */
  name: string;
  /** What the registration covers. */
  body: string;
  /** The number itself, labelled the way the issuer labels it. */
  refLabel: string;
  ref: string;
  logo: { src: string; width: number; height: number; alt: string };
  /** True when the mark is white and needs a dark plate behind it. */
  onDark?: boolean;
}

export const credentialsIntro = {
  eyebrow: "Credentials",
  title: "Registered and certified",
  lead: "Zan Services is registered in India and in the United States, and holds two current ISO certificates. The reference number for each one is printed below.",
} as const;

export const credentials: readonly Credential[] = [
  {
    id: "udyam",
    name: "Udyam Registration",
    body: "MSME registered with the Government of India.",
    refLabel: "Registration no.",
    ref: "UDYAM-WB-10-0193560",
    logo: {
      src: "/images/brand/msme_udyam.png",
      width: 900,
      height: 495,
      alt: "Udyam MSME registered, Government of India",
    },
  },
  {
    id: "iso-9001",
    name: "ISO 9001:2015",
    body: "Certified quality management system.",
    refLabel: "Cert. no.",
    ref: "KDACQ202602020",
    logo: {
      src: "/images/brand/iso_cef.png",
      width: 500,
      height: 500,
      alt: "ISO 9001:2015 certified",
    },
  },
  {
    id: "iso-27001",
    name: "ISO/IEC 27001:2022",
    body: "Certified information security management system.",
    refLabel: "Cert. no.",
    ref: "KDACI202602004",
    logo: {
      src: "/images/brand/iso_cef.png",
      width: 500,
      height: 500,
      alt: "ISO/IEC 27001:2022 certified",
    },
  },
  {
    id: "irs",
    name: "IRS registered",
    body: "US federal tax ID issued to Zan Services LLC.",
    refLabel: "EIN",
    ref: site.taxId,
    logo: {
      src: "/images/brand/IRS-Logo.svg",
      width: 421,
      height: 147,
      alt: "Registered with the United States Internal Revenue Service",
    },
    onDark: true,
  },
];

/* ── FAQ ─────────────────────────────────────────────────────────────────────
   The 48 answered questions the production site publishes (src/data/faq.ts),
   carried over whole. They are the largest SEO asset on the old build: every
   one is eligible for a rich result and quotable by an answer engine, so the
   sets below are rendered on the home page, /services, /pricing and the three
   service pages that have a set of their own.

   Two house rules are applied to the migrated text, and nothing else is
   touched. Visitor-facing copy on this site carries no em dashes, so five
   questions and one answer use a colon or a comma instead. And where an answer
   quoted a figure this site contradicts elsewhere it follows this site: "over
   150 clients" (the metrics say 50+), "12 distinct verticals" (the industries
   list has 8), "over 80% of our prospects" are dropped from the three home
   answers that carried them, and the post-launch window reads three months,
   which is what /how-we-work and the about panel promise. */

export interface FAQ {
  question: string;
  answer: string;
}

export const faqIntro = {
  eyebrow: "FAQ",
  title: ["Frequently asked", "questions"],
} as const;

/** The home page and the contact page. */
export const faqs: readonly FAQ[] = [
  {
    question: "What does Zan Services do?",
    answer:
      "Zan Services is a full-service IT company that delivers web development, mobile app development, and digital marketing solutions for businesses of all sizes. Our team combines technical expertise with strategic thinking to build products that drive measurable growth. Whether you need a high-performance website, a cross-platform mobile app, or a data-driven marketing campaign, we handle the entire lifecycle from planning through launch and ongoing optimization.",
  },
  {
    question: "Why choose Zan Services in Kolkata?",
    answer:
      "Zan Services combines Kolkata's deep IT talent pool with globally competitive pricing, giving you enterprise-grade quality at a fraction of Western agency costs. Kolkata ranks among India's top 5 emerging tech hubs, and our team draws from that skilled workforce. We maintain a 96% client satisfaction rate by pairing dedicated project managers with transparent communication workflows. You also benefit from India's favorable time-zone overlap with European and Middle Eastern markets, enabling near-real-time collaboration without the premium price tag of agencies in metro cities like Bangalore or Mumbai.",
  },
  {
    question: "What industries does Zan Services serve?",
    answer:
      "Zan Services serves a wide range of industries including e-commerce, healthcare, education, real estate, hospitality, fintech, and manufacturing. Our healthcare projects follow HIPAA-aware design principles, while our e-commerce builds integrate PCI-compliant payment gateways. We invest time in understanding the specific regulations, customer expectations, and competitive dynamics of each industry before writing a single line of code.",
  },
  {
    question: "How much do IT services cost in Kolkata?",
    answer:
      "IT service costs in Kolkata are significantly more competitive than equivalent services in Western markets, without sacrificing quality. Kolkata's lower cost of living translates directly into competitive rates for skilled developers. At Zan Services, we provide detailed, line-item estimates upfront so there are no surprises, and we offer flexible payment milestones tied to deliverables. Contact us for a free custom quote tailored to your project requirements.",
  },
  {
    question: "Does Zan Services work with international clients?",
    answer:
      "Yes, approximately 35% of our active projects serve clients outside India, spanning the United States, United Kingdom, UAE, Australia, and Southeast Asia. We use tools like Slack, Jira, and Google Meet to maintain seamless communication across time zones. Our contracts support international invoicing in USD, GBP, EUR, and AED, and we are comfortable with NDA and IP-assignment agreements governed by foreign jurisdictions. Being based in Kolkata, India, allows us to offer highly competitive rates while delivering work that meets or exceeds international quality benchmarks.",
  },
  {
    question: "What is the typical project timeline at Zan Services?",
    answer:
      "The typical project timeline depends on scope and complexity. We break every project into sprints with demo checkpoints so you see real progress throughout. During the first phase we run discovery and planning to prevent costly rework later. Rush timelines are available when business deadlines demand faster delivery. Contact us to discuss your specific timeline requirements.",
  },
  {
    question: "How do I get started with Zan Services?",
    answer:
      "Getting started is simple. Visit our contact page or send us an email with a brief description of your project, and we will schedule a free 30-minute discovery call within 24 hours. During that call we discuss your goals, audience, budget range, and timeline. Within 3 to 5 business days you receive a detailed proposal including scope, milestones, cost breakdown, and tech-stack recommendation. There is no obligation until you sign the proposal.",
  },
  {
    question: "What technologies does Zan Services specialize in?",
    answer:
      "Zan Services specializes in modern, high-performance technology stacks. On the front end we work extensively with React, Next.js, and TypeScript. For back-end systems we use Node.js, Python, and PHP with frameworks like Express, Django, and Laravel. Mobile apps are built using React Native and Flutter for cross-platform reach, or Swift and Kotlin for native performance. We deploy on AWS, Google Cloud, and Vercel, and our database expertise covers PostgreSQL, MongoDB, and Firebase. Every technology choice is driven by the specific requirements of your project rather than vendor lock-in.",
  },
  {
    question: "Does Zan Services offer post-launch support?",
    answer:
      "Yes, every project includes a complimentary three-month post-launch support window covering bug fixes, minor adjustments, and performance monitoring. Beyond that we offer monthly retainer plans starting at competitive rates that include uptime monitoring, security patching, content updates, and performance optimization. Over 60% of our clients transition to a retainer because proactive maintenance prevents costly emergency fixes and keeps their digital products running at peak performance. We also provide quarterly health-check reports with actionable recommendations so you always know where your website or app stands.",
  },
  {
    question: "Where is Zan Services located?",
    answer:
      "Zan Services is headquartered in Kolkata, West Bengal, India. Kolkata is one of the country's fastest-growing IT ecosystems, home to a large pool of engineering graduates from top institutions like Jadavpur University and IIT Kharagpur nearby. Our central location in Kolkata allows us to serve clients across India as well as international markets in Europe, the Middle East, and North America. While we are happy to meet locally, the majority of our project collaboration happens through video calls, shared dashboards, and cloud-based project management tools for maximum convenience.",
  },
];

/** The service catalogue, /services. */
export const servicesFaqs: readonly FAQ[] = [
  {
    question: "What IT services does Zan Services offer?",
    answer:
      "Zan Services offers three core IT service pillars: web development, mobile app development, and digital marketing. Under web development we deliver everything from single-page landing sites to complex SaaS platforms. Our mobile team builds cross-platform and native apps for both Android and iOS. On the marketing side we cover SEO, PPC advertising, social media management, and AI Engine Optimization. Each pillar can operate independently or work together as an integrated digital strategy. Roughly 45% of our clients use two or more services, which unlocks better consistency across their entire digital ecosystem.",
  },
  {
    question: "How do I choose the right IT service for my business?",
    answer:
      "Choosing the right IT service starts with identifying your primary business goal. If your goal is online visibility and lead generation, start with a professional website paired with SEO. If you need to engage users on mobile with features like push notifications or offline access, invest in app development. If you already have a digital product but need traffic, focus on digital marketing. A useful framework is the 70-20-10 rule: allocate 70% of your budget to your highest-impact channel, 20% to a supporting channel, and 10% to experimentation. A free consultation can help clarify priorities quickly.",
  },
  {
    question: "What is the difference between web development and web design?",
    answer:
      "Web design focuses on the visual layout, color schemes, typography, and user experience of a website, while web development handles the underlying code, functionality, databases, and server infrastructure. Think of design as the blueprint and development as the construction. In practice, approximately 30% of a typical project budget goes to design and 70% to development. Modern workflows integrate both disciplines using tools like Figma for design handoff and component-based frameworks like React for development. At Zan Services, designers and developers collaborate from day one to ensure pixel-perfect results that also perform flawlessly under load.",
  },
  {
    question: "Can Zan Services handle end-to-end digital transformation?",
    answer:
      "Yes, end-to-end digital transformation is one of our core strengths. We take businesses from legacy processes or zero online presence through to fully digitized operations. This typically involves auditing existing workflows, designing a digital roadmap, building the necessary platforms, migrating data, training staff, and providing ongoing optimization. Studies show that companies investing in holistic digital transformation see up to 40% improvement in operational efficiency within the first year. Our approach is phased, so you start generating ROI from early deliverables while longer-term components are still in development.",
  },
  {
    question: "What is the advantage of hiring a full-service IT company?",
    answer:
      "A full-service IT company eliminates the coordination overhead of managing multiple vendors. When your website, mobile app, and marketing campaigns are handled by one team, design language stays consistent, data flows seamlessly between platforms, and strategic pivots happen faster. Research from Gartner indicates that businesses using a single integrated IT partner reduce project delays by up to 25% compared to multi-vendor setups. You also benefit from a unified point of accountability. If an issue spans your website and your ad campaigns, there is no finger-pointing between agencies because one team owns the outcome.",
  },
  {
    question: "How does Zan Services ensure project quality?",
    answer:
      "We ensure quality through a structured process that includes code reviews, automated testing, manual QA, and client-facing demos at every sprint. Every feature branch goes through peer review before merging, and our CI/CD pipeline runs over 200 automated checks on a typical project. We follow OWASP security guidelines and conduct cross-browser and cross-device testing across at least 15 device configurations before any release. Client satisfaction surveys at milestone completions help us catch expectation gaps early. This layered approach means fewer than 2% of our releases require a post-launch hotfix.",
  },
  {
    question: "Do you offer bundled service packages?",
    answer:
      "Yes, we offer bundled packages that combine web development, app development, and digital marketing at a reduced overall cost. Bundling typically saves clients between 10% and 20% compared to purchasing each service separately because shared discovery, design systems, and infrastructure work benefit all deliverables. Our most popular bundle pairs a responsive business website with a three-month SEO kickstart campaign. For startups, we offer a launch package that includes an MVP web app, landing page, and initial Google Ads setup. Each bundle is customizable, so you only pay for what actually serves your goals.",
  },
  {
    question: "What support options are available after project delivery?",
    answer:
      "After project delivery you can choose from three support tiers. The Basic tier includes email support with a 48-hour response time and monthly security updates. The Standard tier adds priority response within 12 hours, weekly backups, performance monitoring, and up to 5 hours of content or feature updates per month. The Premium tier provides a dedicated account manager, 4-hour response SLA, real-time uptime monitoring, and unlimited minor updates. All tiers include quarterly analytics reports. About 65% of our clients opt for Standard or above because consistent maintenance protects their investment and keeps performance metrics strong.",
  },
];

/** /services/web-development. */
export const webDevFaqs: readonly FAQ[] = [
  {
    question: "What is responsive web design and why does it matter?",
    answer:
      "Responsive web design is a development approach where a website automatically adjusts its layout, images, and navigation to fit any screen size, from smartphones to large desktop monitors. With mobile devices accounting for over 60% of global web traffic, a non-responsive site risks losing the majority of its visitors. Google also uses mobile-friendliness as a ranking factor, meaning a responsive design directly impacts your search engine visibility. Modern responsive techniques like CSS Grid, Flexbox, and container queries allow precise control over how content reflows, ensuring a smooth experience across hundreds of device variations.",
  },
  {
    question: "WordPress vs custom website development: which is better?",
    answer:
      "WordPress is better for budget-conscious projects that need a quick launch with standard features like blogs, portfolios, or small business sites. Custom development is better when you need unique functionality, high performance, or complete control over the codebase. WordPress powers roughly 43% of the web, making it familiar and plugin-rich, but heavy plugin use can slow page speed and introduce security vulnerabilities. Custom-built sites, using frameworks like React or Next.js, score significantly higher on Core Web Vitals and scale more gracefully. The right choice depends on your budget, timeline, and long-term technical ambitions.",
  },
  {
    question: "How much does website development cost in Kolkata?",
    answer:
      "Website development costs in Kolkata vary based on complexity, features, and design requirements. Kolkata offers some of the most competitive development rates in India due to lower operational costs compared to Bangalore or Mumbai. At Zan Services, we provide transparent, itemized quotes so you understand exactly what each component costs before development begins. Reach out for a free consultation and custom estimate.",
  },
  {
    question: "What is a headless CMS and when should I use one?",
    answer:
      "A headless CMS is a content management system that stores and delivers content through an API without dictating how that content is displayed on the front end. Unlike traditional CMS platforms like WordPress, a headless CMS decouples the content layer from the presentation layer. This approach is ideal when you need to serve the same content across a website, mobile app, and smart devices simultaneously. Popular headless CMS options include Strapi, Sanity, and Contentful. Use a headless CMS when your project demands multi-channel content delivery, high performance, or when your front end uses a modern JavaScript framework.",
  },
  {
    question: "How long does it take to build a custom website?",
    answer:
      "A custom website typically takes 4 to 12 weeks to build, depending on the number of pages, feature complexity, and integration requirements. A straightforward 5-page business site can be completed in about 4 weeks, while a feature-rich e-commerce platform or SaaS dashboard may require 10 to 12 weeks or longer. The timeline breaks down roughly into 20% planning and design, 50% development, 15% testing, and 15% revisions and launch preparation. Delays most commonly arise from content not being ready on time, so we recommend preparing your copy, images, and branding assets before development begins to keep the schedule on track.",
  },
  {
    question: "What is the difference between static and dynamic websites?",
    answer:
      "A static website serves the same pre-built HTML files to every visitor, while a dynamic website generates content in real time based on user interactions, database queries, or API calls. Static sites are faster, more secure, and cheaper to host because there is no server-side processing. Dynamic sites are necessary when content changes frequently or when users need to log in, submit forms, or interact with personalized data. Modern static-site generators like Astro and Next.js blur this line by pre-rendering pages at build time while still supporting dynamic features where needed, giving you the speed of static with the flexibility of dynamic.",
  },
  {
    question: "Do you build e-commerce websites with payment integration?",
    answer:
      "Yes, we build fully functional e-commerce websites with integrated payment gateways including Razorpay, Stripe, PayPal, and UPI-based solutions popular in India. Our e-commerce builds include product catalogs, inventory management, secure checkout flows, order tracking, and automated email notifications. We typically integrate 2 to 3 payment methods per project to give end customers their preferred option. Security is paramount, so all payment pages are PCI DSS compliant and served over HTTPS with TLS 1.3 encryption. Whether you are launching a 50-product boutique store or a 10,000-SKU marketplace, we architect the solution to scale with your business.",
  },
  {
    question: "What is server-side rendering and why does it matter for SEO?",
    answer:
      "Server-side rendering, or SSR, is a technique where web pages are generated on the server before being sent to the browser, rather than being built entirely in the browser using JavaScript. SSR matters for SEO because search engine crawlers can immediately read the fully rendered HTML without waiting for JavaScript to execute. Pages that use SSR typically achieve 30% to 50% faster First Contentful Paint, which directly improves user experience and search rankings. Frameworks like Next.js make SSR straightforward while still allowing client-side interactivity after the initial page load, combining the best of both approaches.",
  },
  {
    question: "How do you ensure website security during development?",
    answer:
      "We ensure website security by embedding best practices throughout the development lifecycle rather than treating it as an afterthought. During coding, we follow the OWASP Top 10 guidelines to prevent common vulnerabilities like SQL injection, cross-site scripting, and broken authentication. All dependencies are scanned for known vulnerabilities using tools like Snyk and npm audit. We enforce HTTPS, implement Content Security Policy headers, sanitize all user inputs, and use parameterized database queries. Before launch, we conduct a security audit that covers penetration testing and access control review. Post-launch, automated monitoring alerts us to new threats within minutes.",
  },
  {
    question: "What tech stack does Zan Services use for web development?",
    answer:
      "Zan Services primarily uses React and Next.js on the front end with TypeScript for type safety and better maintainability. On the back end, we work with Node.js and Express for JavaScript-centric projects, Python with Django or FastAPI for data-heavy applications, and PHP with Laravel when WordPress or traditional server-side rendering is preferred. Our databases of choice include PostgreSQL for relational data and MongoDB for document-oriented needs. We deploy on AWS, Google Cloud, or Vercel depending on project requirements, and we use Docker for consistent development environments. Every stack choice is justified by your project's specific performance, scalability, and budget needs.",
  },
];

/** /services/mobile-apps. */
export const appDevFaqs: readonly FAQ[] = [
  {
    question: "Native vs cross-platform app development: which should I choose?",
    answer:
      "Native app development builds separate apps for iOS and Android using platform-specific languages, while cross-platform development uses a single codebase that runs on both. Choose native if your app demands peak performance, complex animations, or deep hardware integration like AR or Bluetooth. Choose cross-platform if you need faster time-to-market and a shared codebase to reduce maintenance costs. Cross-platform frameworks now cover about 90% of use cases with near-native performance. For most business apps, cross-platform development saves 30% to 40% in development cost while reaching both audiences simultaneously, making it the practical default for startups and mid-size companies.",
  },
  {
    question: "How long does mobile app development take?",
    answer:
      "Mobile app development typically takes 10 to 20 weeks from concept to store submission, depending on feature complexity and platform scope. A simple utility app with 5 to 8 screens can be ready in 10 weeks, while a feature-rich app with real-time messaging, payment processing, and third-party integrations may take 16 to 20 weeks. The process follows four phases: discovery and design (roughly 25% of the timeline), core development (45%), testing and QA (20%), and deployment and store submission (10%). Apple App Store review alone can take 1 to 3 days, so we always factor in review time when planning launch dates.",
  },
  {
    question: "React Native vs Flutter: which is better for my project?",
    answer:
      "React Native is better if your team already works with JavaScript or React and you want seamless integration with web codebases. Flutter is better if you prioritize pixel-perfect custom UI and high-performance animations, as its rendering engine bypasses native UI components entirely. React Native has a larger ecosystem with over 2 million weekly npm downloads, while Flutter has been growing rapidly and offers a more consistent look across platforms. At Zan Services, we are proficient in both and recommend based on your project's specific requirements. For most business applications the performance difference is negligible, so team expertise and ecosystem fit often drive the decision.",
  },
  {
    question: "How much does it cost to develop a mobile app in India?",
    answer:
      "Mobile app development in India is one of the most cost-effective markets globally, with rates significantly lower than US or UK equivalents. Costs vary based on complexity, from basic MVPs to enterprise-grade apps with AI integration and complex backends. We provide detailed estimates after a thorough requirements analysis to avoid scope creep. Contact us for a free consultation.",
  },
  {
    question: "What is an MVP and why should I build one first?",
    answer:
      "An MVP, or minimum viable product, is the simplest version of your app that includes only the core features needed to validate your idea with real users. Building an MVP first saves you from investing heavily in features that users may not need. Statistics show that 42% of startups fail because there is no market need, and an MVP helps you test demand before committing your full budget. A typical MVP takes 6 to 10 weeks to build and costs a fraction of a full product. The feedback you gather from early users directly shapes the feature roadmap, leading to a stronger final product backed by real data rather than assumptions.",
  },
  {
    question: "Do you publish apps to Google Play Store and Apple App Store?",
    answer:
      "Yes, we handle the complete app store submission process for both Google Play Store and Apple App Store, including account setup, asset preparation, metadata optimization, and compliance review. Google Play reviews typically take a few hours to 3 days, while Apple App Store reviews average 1 to 2 days but can extend if issues are flagged. We prepare all required assets including screenshots in multiple device sizes, promotional graphics, privacy policy links, and app descriptions optimized for App Store Optimization. Our first-submission approval rate exceeds 95% because we rigorously test against both platforms' guidelines before uploading.",
  },
  {
    question: "What is the difference between hybrid and native apps?",
    answer:
      "Native apps are built using platform-specific languages like Swift for iOS and Kotlin for Android, giving them direct access to device hardware and the best possible performance. Hybrid apps use web technologies wrapped in a native container, essentially running a browser-based app inside a native shell. The key difference is performance and user experience. Native apps feel smoother and can leverage platform-specific design patterns, while hybrid apps are quicker and cheaper to build. However, modern cross-platform frameworks like React Native and Flutter have largely replaced the older hybrid approach by compiling to native components, offering a strong middle ground between pure native and hybrid development.",
  },
  {
    question: "How do you handle app maintenance and updates after launch?",
    answer:
      "After launch, we offer structured maintenance plans that cover OS compatibility updates, bug fixes, performance optimization, and feature enhancements. Both Apple and Google release major OS updates annually, and apps that are not updated risk breaking or being removed from stores. Our maintenance plans include monthly dependency updates, crash monitoring via tools like Firebase Crashlytics, and quarterly performance reviews. We also track user feedback from store reviews and analytics to prioritize updates that have the highest impact. At Zan Services, roughly 70% of our app clients stay on a maintenance plan because proactive upkeep is far cheaper than reactive emergency fixes.",
  },
  {
    question: "Can you integrate third-party APIs into mobile apps?",
    answer:
      "Yes, third-party API integration is a standard part of our mobile development workflow. We regularly integrate payment gateways like Razorpay and Stripe, mapping services like Google Maps, communication APIs like Twilio and SendGrid, social login via Google and Apple, and analytics platforms like Mixpanel and Firebase. A typical app integrates between 4 and 8 external APIs. We build an abstraction layer around each integration so that if a third-party provider changes its API or you want to switch vendors, the rest of your app remains unaffected. All API keys and secrets are managed through secure environment variables, never hardcoded in the codebase.",
  },
  {
    question: "What security measures do you implement in mobile apps?",
    answer:
      "We implement multi-layered security measures including encrypted data storage, SSL certificate pinning, biometric authentication support, and token-based session management using OAuth 2.0 or JWT. All sensitive data is encrypted at rest using AES-256 and in transit using TLS 1.3. We perform input validation and sanitization to prevent injection attacks, and we use code obfuscation tools like ProGuard for Android and built-in protections in iOS to deter reverse engineering. Before release, every app undergoes a security audit covering the OWASP Mobile Top 10 vulnerabilities. Post-launch, we monitor for anomalous behavior patterns that could indicate a breach or abuse attempt.",
  },
];

/** /services/digital-marketing. */
export const digitalMarketingFaqs: readonly FAQ[] = [
  {
    question: "What is SEO and how does it help my business?",
    answer:
      "SEO, or search engine optimization, is the practice of improving your website's visibility in organic search results so that potential customers find you when they search for relevant terms. Businesses that invest in SEO see an average of 53% of their total website traffic come from organic search, making it the single largest digital traffic channel. SEO works by optimizing your site structure, content, page speed, and backlink profile to align with search engine algorithms. Unlike paid ads that stop delivering the moment you stop spending, SEO builds compounding returns over time, often delivering a 5x to 10x return on investment within 12 months of consistent effort.",
  },
  {
    question: "How does PPC advertising work?",
    answer:
      "PPC, or pay-per-click advertising, is a model where you pay a fee each time someone clicks your ad. Platforms like Google Ads and Meta Ads display your advertisements to users based on keywords, demographics, interests, or behaviors you define. You set a daily or monthly budget, bid on target keywords, and only pay when a user actually engages with your ad. Cost per click varies depending on industry competitiveness. PPC delivers immediate visibility, making it ideal for product launches, seasonal promotions, or testing new markets before committing to long-term organic strategies.",
  },
  {
    question: "Social media marketing vs Google Ads: which is more effective?",
    answer:
      "Social media marketing is more effective for brand awareness, community building, and visual storytelling, while Google Ads is more effective for capturing high-intent search traffic from users actively looking for your product or service. Google Ads typically delivers higher conversion rates, averaging 3% to 5% for search campaigns, because the user has already expressed intent. Social media excels at reaching new audiences who may not yet know they need your solution. The most effective strategy uses both channels together: Google Ads captures demand that already exists, while social media creates new demand. Budget allocation should reflect your business stage and goals.",
  },
  {
    question: "What is AI Engine Optimization (AEO)?",
    answer:
      "AI Engine Optimization, or AEO, is the practice of structuring your content so that AI-powered search engines, chatbots, and voice assistants can accurately find, understand, and cite your information. As AI tools like ChatGPT, Google AI Overviews, and Perplexity handle an increasing share of search queries, traditional SEO alone is no longer sufficient. AEO involves writing clear, direct answers in your content, using structured data markup, building topical authority, and ensuring factual accuracy. Zan Services is one of the early adopters of AEO strategies in Kolkata, helping businesses position their content to be surfaced by AI systems that over 100 million users now rely on monthly.",
  },
  {
    question: "How long does SEO take to show results?",
    answer:
      "SEO typically takes 3 to 6 months to show measurable results, with significant traffic growth usually visible between months 6 and 12. The timeline depends on your website's current authority, competition level in your industry, and the quality and consistency of your optimization efforts. New websites generally take longer because they lack domain authority, while established sites with existing content can see improvements within 8 to 12 weeks. Quick wins like technical SEO fixes and title tag optimization can deliver early improvements, while content marketing and link building produce compounding returns over time. Patience is critical because SEO rewards consistent effort rather than short bursts of activity.",
  },
  {
    question: "What is conversion rate optimization (CRO)?",
    answer:
      "Conversion rate optimization is the systematic process of increasing the percentage of website visitors who complete a desired action, such as making a purchase, filling out a form, or signing up for a newsletter. The average website conversion rate across industries is about 2.5%, meaning there is substantial room for improvement on most sites. CRO uses data from analytics, heatmaps, session recordings, and A/B testing to identify friction points in the user journey and test solutions. Even a 1% improvement in conversion rate can dramatically increase revenue without any additional ad spend. It is one of the highest-ROI marketing activities because it maximizes the value of traffic you already have.",
  },
  {
    question: "How much should I budget for digital marketing in India?",
    answer:
      "Digital marketing budgets vary based on business size, goals, and channels. A reasonable starting point is allocating 7% to 10% of your gross revenue to marketing, with 50% to 60% of that going to digital channels. New businesses can start with focused campaigns covering SEO and Google Ads, while established businesses benefit from multi-channel campaigns across search, social, and content marketing. We help clients in Kolkata and across India build phased budgets aligned with revenue targets. Contact us for a customized budget plan.",
  },
  {
    question: "What is the difference between organic and paid marketing?",
    answer:
      "Organic marketing earns attention through non-paid channels like SEO, content marketing, social media posts, and email newsletters, while paid marketing purchases attention through advertising platforms like Google Ads, Meta Ads, and sponsored content. Organic marketing builds long-term brand equity and typically has a lower cost per acquisition over time, but it requires patience and consistent effort. Paid marketing delivers immediate visibility and precise audience targeting but stops generating results when the budget runs out. Data shows that organic search drives approximately 53% of website traffic on average, while paid search accounts for about 27%. The strongest marketing strategies blend both for sustainable, scalable growth.",
  },
  {
    question: "How do you measure digital marketing ROI?",
    answer:
      "We measure digital marketing ROI by tracking the revenue generated relative to the total marketing spend, using a combination of attribution models, analytics platforms, and conversion tracking. Key metrics include customer acquisition cost, lifetime customer value, return on ad spend, and cost per lead. We set up proper conversion tracking through Google Analytics 4, Meta Pixel, and server-side tracking before any campaign launches to ensure data accuracy. Monthly reports break down performance by channel, campaign, and audience segment. At Zan Services, we also calculate blended ROI across all channels to give you a true picture of marketing efficiency rather than siloed metrics that can be misleading.",
  },
  {
    question: "What is marketing automation and how can it help my business?",
    answer:
      "Marketing automation uses software to execute repetitive marketing tasks like email sequences, lead scoring, social media posting, and customer segmentation without manual intervention. Businesses that implement marketing automation see an average 14.5% increase in sales productivity and a 12.2% reduction in marketing overhead. Tools like HubSpot, Mailchimp, and ActiveCampaign allow you to build automated workflows that nurture leads from first contact through to purchase. For example, when a visitor downloads a guide from your website, automation can trigger a personalized email sequence over the following two weeks. This ensures no lead falls through the cracks while freeing your team to focus on strategy and creative work.",
  },
];

/**
 * Which set belongs to which service page, keyed by the page's `priceKey`.
 * A page with no set of its own simply does not show the section.
 */
export const faqsForService: Record<string, readonly FAQ[]> = {
  "web-development": webDevFaqs,
  "mobile-apps": appDevFaqs,
  "digital-marketing": digitalMarketingFaqs,
};

/* ── Contact — the old site's enquiry block ───────────────────────────────── */

export const contactIntro = {
  eyebrow: "Get in touch",
  title: ["Let's build", "something together"],
  lead: "Tell us about your project. Free consultation, no obligation, and a reply within 24 hours.",
} as const;

/** The enquiry form's service picker, grouped by practice. */
export const serviceOptions = practices.map((p) => ({
  group: p.title,
  options: p.items.map((s) => s.title),
}));

/* ── Footer: pages of the main site (resolve with useSiteHref) ────────────── */

export const footerColumns = [
  {
    title: "Services",
    links: [
      { label: "Web Development", href: "/services/web-development" },
      { label: "Mobile App Development", href: "/services/mobile-apps" },
      { label: "AI & Machine Learning", href: "/services/ai-machine-learning" },
      { label: "Blockchain & Web3", href: "/services/blockchain-web3" },
      { label: "Cloud & DevOps", href: "/services/cloud-devops" },
      { label: "Cybersecurity", href: "/services/cybersecurity" },
      { label: "Digital Marketing", href: "/services/digital-marketing" },
      { label: "Branding & Designing", href: "/services/branding-and-designing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about-us" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "How We Work", href: "/how-we-work" },
      { label: "Pricing", href: "/pricing" },
      { label: "Contact", href: "/contact-us" },
    ],
  },
  {
    /* The only sitewide deep link to the four marketing disciplines. Without
       it they are reachable from the mega menu alone. */
    title: "Marketing",
    links: [
      { label: "SEO, AEO & GEO", href: "/services/digital-marketing/seo-aeo-geo" },
      { label: "Performance Marketing", href: "/services/digital-marketing/performance-marketing" },
      { label: "Social Media Management", href: "/services/digital-marketing/social-media-management" },
      { label: "Influencer Marketing", href: "/services/digital-marketing/influencer-marketing" },
    ],
  },
] as const;

export const legalLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Disclaimer", href: "/disclaimer" },
] as const;

export const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/zanservices" },
  { label: "Instagram", href: "https://www.instagram.com/zanservices" },
  { label: "X", href: "https://x.com/zanservices" },
] as const;

/** Third-party assets that require attribution. */
export const credits = [
  {
    work: "“macbook pro M3 16 inch 2024” 3D model",
    author: "jackbaeten",
    href: "https://sketchfab.com/3d-models/macbook-pro-m3-16-inch-2024-8e34fc2b303144f78490007d91ff57c4",
    license: "CC BY 4.0",
    licenseHref: "https://creativecommons.org/licenses/by/4.0/",
  },
] as const;

/** The three words the preloader cycles — the three practices. */
export const preloaderWords = practices.map((p) => p.title);
