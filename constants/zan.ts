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
  /** Sector imagery (stock), as the production site pairs it. Absent for the
   *  fitness app on purpose: nothing available depicts it. */
  screenshot?: { src: string; width: number; height: number };
}

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
    screenshot: { src: "/images/professional/ecommerce.jpg", width: 2400, height: 1350 },
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
    screenshot: { src: "/images/professional/dashboard2.jpg", width: 2400, height: 1709 },
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
    screenshot: { src: "/images/professional/logistics.jpg", width: 2400, height: 1599 },
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
    screenshot: { src: "/images/professional/dashboard.jpg", width: 2400, height: 1600 },
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

/* ── FAQ ─────────────────────────────────────────────────────────────────────
   Seven of the production homepage's ten. Left out, pending the client:
   "Why choose Zan Services in Kolkata?" (a 96% satisfaction figure published
   nowhere else), "Does Zan Services work with international clients?" (a 35%
   share, likewise) and "Does Zan Services offer post-launch support?" (30 days,
   against three months everywhere else). Three kept answers each lose one
   sentence for the same reason: "over 150 clients" (the metrics say 50+),
   "12 distinct verticals" (the industries list has 8), "over 80% of our
   prospects". The rest is verbatim. */

export interface FAQ {
  question: string;
  answer: string;
}

export const faqIntro = {
  eyebrow: "FAQ",
  title: ["Frequently asked", "questions"],
} as const;

export const faqs: readonly FAQ[] = [
  {
    question: "What does Zan Services do?",
    answer:
      "Zan Services is a full-service IT company that delivers web development, mobile app development, and digital marketing solutions for businesses of all sizes. Our team combines technical expertise with strategic thinking to build products that drive measurable growth. Whether you need a high-performance website, a cross-platform mobile app, or a data-driven marketing campaign, we handle the entire lifecycle from planning through launch and ongoing optimization.",
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
    question: "Where is Zan Services located?",
    answer:
      "Zan Services is headquartered in Kolkata, West Bengal, India. Kolkata is one of the country's fastest-growing IT ecosystems, home to a large pool of engineering graduates from top institutions like Jadavpur University and IIT Kharagpur nearby. Our central location in Kolkata allows us to serve clients across India as well as international markets in Europe, the Middle East, and North America. While we are happy to meet locally, the majority of our project collaboration happens through video calls, shared dashboards, and cloud-based project management tools for maximum convenience.",
  },
];

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
