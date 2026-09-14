import type { RegionId } from "@/constants/zan";

/* Copied verbatim from the main Zan app (zan_webdevelopment/src/data/pricing.ts)
   so this site's service and pricing pages publish exactly the figures the
   company sells. The only change is the region type: there it comes from
   lib/seo, here from constants/zan, and the two are the same three ids. */

/* ═══════════════════════════════════════════════════════════════════════════
   PACKAGES & PRICES
   Migrated from the previous site's serviceCategories.ts and servicePricing.ts.
   Prices are per region because the three markets are sold different decks —
   the old `default` key is India, and is renamed here to match the Region type.

   A page uses ONE pricing model, never both:
     servicePrices  → each package on the page is bought separately (a badge
                      per card). Order matters: the first entry is that page's
                      entry-level package and drives the headline "from" price.
     pagePrices     → the page IS the package (the branding decks), so one
                      price sits in the header.

   Every package carries a price in every region. Where the old India deck had
   no line for a service, the figure is derived rather than invented: the AED
   column tracks the dirham's dollar peg (every pair in this file sits between
   3.61 and 3.75), and each INR figure is anchored to the nearest-priced
   sibling in its own category, since India is sold at a discount that varies
   by service rather than at one flat rate. The per-row comments record which
   sibling each derived figure was anchored to.

   "Custom quote" survives only as the lookup fallback in priceFor() for a slug
   or package title that is not in this table at all.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface ServicePackage {
  title: string;
  description: string;
  features: string[];
  /** Flagged in the deck as the most-chosen option. */
  popular: boolean;
}

/** A price string per region. Every region is priced. */
export type RegionPrice = Record<RegionId, string>;

/** Packages offered under each service page, in deck order. */
export const servicePackages: Record<string, ServicePackage[]> = {
  "web-development": [
    {
      title: "Landing Page Development",
      description:
        "A single page built to convert one campaign. Fast-loading and mobile-first, with the lead form, WhatsApp handoff and conversion tracking wired in.",
      features: ["Single Conversion-focused Page", "Lead Form + WhatsApp", "Mobile-first Build", "Conversion Tracking", "Basic SEO", "Live in 3-5 Days"],
      popular: false,
    },
    {
      title: "Starter Websites",
      description:
        "Perfect for new businesses and personal brands. Includes 5-7 responsive pages, CMS integration, and essential features to establish your online presence.",
      features: ["5-7 Responsive Pages", "CMS Integration", "Mobile Optimized", "SEO Ready", "Contact Forms", "Social Media Links"],
      popular: false,
    },
    {
      title: "Business Websites",
      description:
        "Custom UI design, advanced analytics integration, and enhanced functionality for growing companies seeking professional digital storefronts.",
      features: ["Custom UI Design", "Advanced Analytics", "Blog Integration", "Custom Features", "Performance Optimized", "Security Hardened"],
      popular: true,
    },
    {
      title: "E-commerce Platforms",
      description:
        "Full-featured online stores with secure payment gateways, inventory management, and seamless checkout experiences that drive conversions.",
      features: ["Payment Gateway", "Inventory Management", "Product Catalog", "Shopping Cart", "Order Tracking", "Customer Accounts"],
      popular: false,
    },
    {
      title: "Custom Web Applications",
      description:
        "Enterprise solutions including dashboards, APIs, and complex business logic tailored to your specific operational requirements.",
      features: ["Custom Dashboards", "API Development", "Database Design", "Real-time Features", "Third-party Integration", "Scalable Architecture"],
      popular: false,
    },
  ],
  "mobile-apps": [
    {
      title: "MVP Apps",
      description:
        "Android or iOS applications perfect for testing your concept and gaining early traction in the market.",
      features: ["Native Development", "Core Features", "App Store Submission", "Basic Analytics", "Push Notifications", "Cloud Backend"],
      popular: true,
    },
    {
      title: "Cross-Platform Apps",
      description:
        "Flutter or React Native apps that work seamlessly across both iOS and Android devices with a single codebase.",
      features: ["Single Codebase", "Native Performance", "iOS & Android", "Shared Logic", "Platform-specific UI", "Cost Effective"],
      popular: false,
    },
    {
      title: "Enterprise Native Apps",
      description:
        "Full-featured native applications with advanced functionality and optimal performance for demanding business needs.",
      features: ["Native Swift/Kotlin", "Advanced Features", "Offline Support", "Enterprise Security", "Custom Integrations", "High Performance"],
      popular: false,
    },
    {
      title: "App Maintenance",
      description:
        "Ongoing updates, bug fixes, and feature enhancements to keep your app running smoothly and up-to-date.",
      features: ["Bug Fixes", "OS Updates", "Feature Updates", "Performance Monitoring", "Security Patches", "Analytics Reports"],
      popular: false,
    },
  ],
  "product-design": [
    {
      title: "UX Research & Prototypes",
      description:
        "Deep user research, interactive prototypes, and usability testing to validate designs before development.",
      features: ["User Research", "Wireframing", "Interactive Prototypes", "Usability Testing", "User Flows", "Information Architecture"],
      popular: true,
    },
    {
      title: "Product & Brand Design",
      description:
        "Complete design systems including UI components, brand guidelines, and visual language for consistent experiences.",
      features: ["UI Design", "Design Systems", "Brand Guidelines", "Component Library", "Style Guide", "Icon Design"],
      popular: false,
    },
  ],
  "blockchain-web3": [
    {
      title: "Smart Contract Development",
      description:
        "Secure, audited smart contracts deployed on leading blockchain networks. Full testing and optimization included.",
      features: ["Solidity Development", "Security Audits", "Gas Optimization", "Multi-chain Support", "Unit Testing", "Deployment"],
      popular: true,
    },
    {
      title: "Decentralized Applications",
      description:
        "Full-stack dApps with intuitive interfaces and robust blockchain integration for seamless Web3 experiences.",
      features: ["Web3 Integration", "Wallet Connect", "Smart Contract Interface", "IPFS Storage", "DeFi Features", "Token Integration"],
      popular: false,
    },
    {
      title: "NFT Platforms",
      description:
        "Complete NFT ecosystems with minting, trading, and wallet integration for digital collectibles and assets.",
      features: ["NFT Minting", "Marketplace", "Auction System", "Royalty System", "Metadata Storage", "Wallet Integration"],
      popular: false,
    },
    {
      title: "Trading Bots",
      description:
        "Algorithmic trading systems with custom strategies and automated execution across multiple exchanges.",
      features: ["Trading Algorithms", "Exchange APIs", "Risk Management", "Backtesting", "Real-time Monitoring", "Strategy Optimization"],
      popular: false,
    },
  ],
  "ai-machine-learning": [
    {
      title: "AI Consulting & Strategy",
      description:
        "Strategic planning to identify AI opportunities and create actionable implementation roadmaps for your business.",
      features: ["AI Assessment", "Strategy Planning", "Use Case Analysis", "ROI Projections", "Technology Selection", "Roadmap Creation"],
      popular: false,
    },
    {
      title: "Custom ML Models",
      description:
        "Tailored machine learning models trained on your data for prediction, classification, and optimization tasks.",
      features: ["Model Training", "Data Processing", "Feature Engineering", "Model Optimization", "Deployment", "Monitoring"],
      popular: true,
    },
    {
      title: "Chatbots & Generative AI",
      description:
        "Intelligent conversational agents and generative AI integrations that enhance customer experiences and automate support.",
      features: ["NLP Integration", "Custom Training", "Multi-channel Support", "Context Awareness", "API Integration", "Analytics Dashboard"],
      popular: false,
    },
    {
      title: "Ongoing AI Support",
      description:
        "Continuous model optimization, retraining, and performance monitoring to maintain peak AI performance.",
      features: ["Model Monitoring", "Performance Tuning", "Retraining", "Data Pipeline", "A/B Testing", "Incident Response"],
      popular: false,
    },
  ],
  "cloud-devops": [
    {
      title: "Cloud Infrastructure",
      description:
        "Scalable cloud setup on AWS, Azure, or GCP with optimal architecture for your specific workload requirements.",
      features: ["Cloud Architecture", "Auto-scaling", "Load Balancing", "Disaster Recovery", "Cost Optimization", "Multi-region Setup"],
      popular: true,
    },
    {
      title: "CI/CD & DevOps",
      description:
        "Automated deployment pipelines and infrastructure as code to enable rapid, reliable software delivery.",
      features: ["CI/CD Pipelines", "Infrastructure as Code", "Container Orchestration", "Automated Testing", "Deployment Automation", "Version Control"],
      popular: false,
    },
    {
      title: "Process Automation",
      description:
        "Workflow automation to eliminate manual tasks, reduce errors, and boost operational efficiency.",
      features: ["Workflow Automation", "Script Development", "Task Scheduling", "Integration", "Monitoring", "Error Handling"],
      popular: false,
    },
    {
      title: "Managed Services",
      description:
        "24/7 monitoring, maintenance, and cloud infrastructure management to keep your systems running optimally.",
      features: ["24/7 Monitoring", "Incident Response", "Performance Tuning", "Security Updates", "Backup Management", "Cost Reporting"],
      popular: false,
    },
  ],
  "cybersecurity": [
    {
      title: "Application Security Audits",
      description:
        "Comprehensive vulnerability assessments and penetration testing for web and mobile applications.",
      features: ["Vulnerability Scanning", "Penetration Testing", "Code Review", "Security Report", "Remediation Guide", "Compliance Check"],
      popular: true,
    },
    {
      title: "Smart Contract Security",
      description:
        "Specialized blockchain security audits to identify vulnerabilities before deployment and protect digital assets.",
      features: ["Contract Audit", "Vulnerability Analysis", "Gas Optimization", "Security Report", "Fix Verification", "Best Practices"],
      popular: false,
    },
    {
      title: "Performance Optimization",
      description:
        "Load testing, database optimization, and code refactoring for maximum speed and efficiency.",
      features: ["Load Testing", "Database Tuning", "Code Profiling", "Caching Strategy", "CDN Setup", "Performance Monitoring"],
      popular: false,
    },
    {
      title: "Security Monitoring",
      description:
        "Continuous threat detection and incident response to keep your systems secure around the clock.",
      features: ["Threat Detection", "Incident Response", "Log Analysis", "Alert System", "Security Updates", "Compliance Monitoring"],
      popular: false,
    },
  ],
  "digital-marketing": [
    {
      title: "Performance Marketing",
      description:
        "Multi-platform advertising campaigns optimized for conversions, ROI, and sustainable growth across all channels.",
      features: ["Google Ads", "Meta Ads", "LinkedIn Ads", "Campaign Strategy", "A/B Testing", "Conversion Tracking"],
      popular: true,
    },
    {
      title: "SEO, AEO, GEO & ASO",
      description:
        "Comprehensive search optimization including SEO, AI Engine Optimization, Generative Engine Optimization, and App Store Optimization.",
      features: ["Keyword Research", "On-page SEO", "Technical SEO", "Link Building", "AI Optimization", "App Store SEO"],
      popular: false,
    },
    {
      title: "AI Engine Optimization",
      description:
        "Next-generation optimization for AI-powered search engines and chatbots, ensuring brand visibility in AI responses.",
      features: ["AI Visibility", "Content Optimization", "Schema Markup", "Entity Building", "Chatbot Optimization", "Performance Tracking"],
      popular: false,
    },
    {
      title: "Social Media Marketing",
      description:
        "Strategic content creation, community engagement, and creator partnerships that build authentic brand presence.",
      features: ["Content Strategy", "Community Management", "Influencer Marketing", "Social Ads", "Analytics", "Brand Building"],
      popular: false,
    },
    {
      title: "Funnels & CRO",
      description:
        "Conversion-optimized funnels with advanced tracking, A/B testing, and analytics to maximize visitor value.",
      features: ["Funnel Design", "Landing Pages", "A/B Testing", "Heat Mapping", "Conversion Tracking", "Analytics Setup"],
      popular: false,
    },
    {
      title: "Marketing Automation",
      description:
        "Intelligent automation workflows that nurture leads, personalize experiences, and scale marketing efficiently.",
      features: ["Email Automation", "Lead Nurturing", "Workflow Design", "Segmentation", "Personalization", "CRM Integration"],
      popular: false,
    },
  ],
  "seo-aeo-geo": [
    {
      title: "SEO",
      description:
        "Technical, on-page and content-led SEO that compounds. We fix what blocks crawlers, build the pages that rank, and earn the links that hold those rankings.",
      features: ["Technical Audit", "On-page Optimisation", "Keyword & Content Strategy", "Link Building", "Core Web Vitals", "Monthly Reporting"],
      popular: true,
    },
    {
      title: "AEO + GEO (AI Search)",
      description:
        "Answer Engine and Generative Engine Optimisation — structuring your content so AI assistants quote you by name instead of your competitor.",
      features: ["Schema Markup", "Entity Building", "Citation-worthy Content", "Structuring for AI Engines", "AI Visibility Tracking", "Answer Optimisation"],
      popular: false,
    },
    {
      title: "Search Growth Bundle",
      description:
        "SEO, AEO and GEO managed as one strategy rather than three workstreams. Best value, and the only way the three actually reinforce each other.",
      features: ["Full Search Stack", "Integrated Strategy", "Shared Content Calendar", "Unified Reporting", "Quarterly Roadmap", "Priority Support"],
      popular: false,
    },
    {
      title: "ASO (App Store Optimization)",
      description:
        "Store-listing optimisation for the App Store and Play Store — the search channel most app teams leave entirely untouched.",
      features: ["Keyword Research", "Listing Copy", "Creative Assets", "Rating Strategy", "Competitor Tracking", "Install Analytics"],
      popular: false,
    },
  ],
  "performance-marketing": [
    {
      title: "Google Ads",
      description:
        "Search, Display, Shopping and Performance Max campaigns built around intent — and kept clean with disciplined negative-keyword hygiene.",
      features: ["Keyword Strategy", "Negative-keyword Hygiene", "Bid Management", "PMax Setup", "Shopping Feeds", "Conversion Tracking"],
      popular: false,
    },
    {
      title: "Meta Ads",
      description:
        "Facebook and Instagram campaigns driven by creative testing and tight audience work, including click-to-WhatsApp for markets that convert in chat.",
      features: ["Audience Building", "Creative Testing", "Retargeting", "Click-to-WhatsApp", "Catalogue Ads", "Pixel & CAPI Setup"],
      popular: false,
    },
    {
      title: "LinkedIn Ads",
      description:
        "B2B lead generation and account-based marketing aimed at the specific seniority tiers that sign off on your deal.",
      features: ["ABM Setup", "Seniority-tier Targeting", "Sponsored Content", "Lead-gen Forms", "Pipeline Reporting", "CRM Sync"],
      popular: false,
    },
    {
      title: "Full-Funnel Performance Marketing",
      description:
        "Every paid channel run as one system — shared creative testing, shared audiences, and one dashboard that reconciles spend against revenue.",
      features: ["Cross-platform Campaign Build", "A/B Testing", "Conversion Tracking", "Funnel & CRO Support", "Budget Optimisation", "Unified Reporting"],
      popular: true,
    },
  ],
  "social-media-management": [
    {
      title: "Social — Starter",
      description:
        "Organic social for local businesses and new brands that need a consistent, credible presence before they spend on ads.",
      features: ["1-2 Platforms", "12-14 Posts / Month", "Static + Basic Graphics", "Scheduling", "Caption & Hashtag Strategy", "Monthly Report"],
      popular: false,
    },
    {
      title: "Social — Growth",
      description:
        "Reels, carousels and active community management for brands ready to turn followers into a pipeline.",
      features: ["2-3 Platforms", "16-20 Posts / Month", "Reels & Carousels", "Community Management", "Content Strategy", "Analytics Review"],
      popular: true,
    },
    {
      title: "Social — Scale",
      description:
        "Multi-platform publishing with premium video production and influencer coordination for brands competing on share of attention.",
      features: ["3-4 Platforms", "24+ Posts / Month", "Premium Video / Reels", "Influencer Coordination", "Deep Analytics", "Quarterly Strategy"],
      popular: false,
    },
    {
      title: "Content Production",
      description:
        "The studio layer behind the calendar — shoots, edits, motion graphics and copy, produced in batches so publishing never stalls.",
      features: ["Photo & Video Shoots", "Motion Graphics", "Copywriting", "Brand Templates", "Batch Production", "Asset Library"],
      popular: false,
    },
  ],
  "influencer-marketing": [
    {
      title: "Creator Discovery & Vetting",
      description:
        "Shortlists built on audience quality, not follower count — engagement authenticity, audience overlap and brand-safety checks before a single rupee moves.",
      features: ["Audience Quality Analysis", "Engagement Authenticity", "Brand-safety Screening", "Audience Overlap Checks", "Rate Benchmarking", "Shortlist & Rationale"],
      popular: true,
    },
    {
      title: "Campaign Management",
      description:
        "Briefing, contracting, content approvals and scheduling handled for you, so creators ship on time and on message.",
      features: ["Creative Briefs", "Contracting & Negotiation", "Content Approvals", "Publishing Schedule", "Usage Rights", "Payment Handling"],
      popular: false,
    },
    {
      title: "UGC & Whitelisting",
      description:
        "Turn the best-performing creator content into paid assets — licensed, whitelisted and pushed through your own ad accounts.",
      features: ["UGC Licensing", "Spark / Whitelisted Ads", "Creative Repurposing", "Ad Account Setup", "Creative Testing", "Asset Library"],
      popular: false,
    },
    {
      title: "Performance & Attribution",
      description:
        "Every collaboration tracked to a number — reach, engagement, referral traffic and assisted conversions, reported against spend.",
      features: ["Tracking Links & Codes", "Reach & Engagement", "Referral Traffic", "Assisted Conversions", "Cost per Result", "Campaign Wrap Report"],
      popular: false,
    },
  ],
  "starter-branding-package": [
    {
      title: "Logo Design",
      description:
        "Three original logo concepts, then revision rounds on the direction you pick until the mark is right.",
      features: ["3 Logo Concepts", "Revision Rounds"],
      popular: false,
    },
    {
      title: "Brand Basics",
      description:
        "The rules that keep everything you publish looking like the same company — colour, type and a guideline document you can hand to anyone.",
      features: ["Brand Colour Palette", "Typography Selection", "Basic Brand Guidelines (PDF)"],
      popular: false,
    },
    {
      title: "Business Stationery",
      description:
        "The pieces you need the week you launch, set in your new identity and supplied print-ready.",
      features: ["Business Card", "Letterhead", "Email Signature"],
      popular: false,
    },
    {
      title: "Social Media Kit",
      description:
        "Every profile and cover image sized correctly for each platform, so your pages match the day you switch them over.",
      features: ["Facebook Profile Picture & Cover Photo", "Instagram Profile Picture", "LinkedIn Company Logo & Cover Banner"],
      popular: false,
    },
  ],
  "growth-branding-package": [
    {
      title: "Everything in Starter",
      description:
        "The full Starter Branding Package is included as the foundation — logo, colour, type, stationery and social profiles.",
      features: ["Logo Design (3 Concepts + Revisions)", "Brand Colour Palette", "Typography Selection", "Business Card, Letterhead & Email Signature", "Social Media Profile & Cover Images"],
      popular: false,
    },
    {
      title: "Brand Identity & Strategy",
      description:
        "The thinking layer — who the brand is for, how it sounds, and a guideline document long enough to settle arguments.",
      features: ["Complete Brand Identity", "Brand Strategy", "Brand Voice & Messaging", "Brand Guideline Document (20-40 Pages)"],
      popular: true,
    },
    {
      title: "Collateral & Templates",
      description:
        "The assets your team reuses every week, built as templates so they stay on-brand without a designer in the loop.",
      features: ["Social Media Post Templates (10-15)", "Company Profile / Brochure", "Presentation (Pitch Deck)", "Marketing Collateral (Flyers, Banners, Posters)", "Packaging Design (If Required)"],
      popular: false,
    },
    {
      title: "Digital Design",
      description:
        "Your identity applied to the screen, with a website design and an icon set drawn to match the rest of the system.",
      features: ["Website UI Design (5-10 Pages)", "Icon Set"],
      popular: false,
    },
  ],
  "premium-brand-identity": [
    {
      title: "Discovery & Strategy",
      description:
        "We start before the design does — a workshop with your team, a hard look at the competitive set, and naming help if the brand needs it.",
      features: ["Brand Discovery Workshop", "Competitor Analysis", "Naming Consultation (If Required)"],
      popular: true,
    },
    {
      title: "Full Design System",
      description:
        "Not a logo and a colour chart — a documented system with a component library your developers and designers actually build from.",
      features: ["Full Design System", "Figma Component Library", "Custom Illustrations & Icons"],
      popular: false,
    },
    {
      title: "Motion & Digital",
      description:
        "How the brand behaves once it moves, applied across your website and app so the identity holds on every screen.",
      features: ["Logo Animation", "Motion Graphics", "UI Design for Website", "UI Design for Mobile App"],
      popular: false,
    },
    {
      title: "Launch & Physical Brand",
      description:
        "Taking the identity off the screen — the assets to announce it, the signage to wear it, and design support while it beds in.",
      features: ["Brand Launch Assets", "Signage & Office Branding", "Merchandise Design", "Packaging System", "Ongoing Design Support (1-3 Months)"],
      popular: false,
    },
  ],
};

const servicePrices: Record<string, Record<string, RegionPrice>> = {
  // ══════════════════════════════════════════════════════════ DEVELOPMENT ══
  // USD / AED are the low end of the range in the US / UAE decks; the full
  // range for every package is on /pricing. INR is the starting-from figure
  // from the FY26–27 India deck.

  // ───────────────────────────────────────────────────────── Web Development
  // First entry = the headline "from" price on /landing-pages/web-development.
  'web-development': {
    'Landing Page Development': {
      in: 'From ₹9,999',
      us: 'From $299',
      ae: 'From AED 1,100',
    },
    'Starter Websites': {
      in: 'From ₹19,999',
      us: 'From $499',
      ae: 'From AED 1,800',
    },
    'Business Websites': {
      in: 'From ₹34,999',
      us: 'From $1,999',
      ae: 'From AED 7,300',
    },
    'E-commerce Platforms': {
      in: 'From ₹51,999',
      us: 'From $4,999',
      ae: 'From AED 18,400',
    },
    'Custom Web Applications': {
      in: 'From ₹1,05,000',
      us: 'From $9,999',
      ae: 'From AED 36,700',
    },
  },

  // ──────────────────────────────────────────────── Mobile App Development
  'mobile-apps': {
    'MVP Apps': {
      in: 'From ₹1,65,000',
      us: 'From $2,999',
      ae: 'From AED 11,000',
    },
    'Cross-Platform Apps': {
      in: 'From ₹2,70,000',
      us: 'From $7,999',
      ae: 'From AED 29,400',
    },
    'Enterprise Native Apps': {
      in: 'From ₹8,50,000',
      us: 'From $24,999',
      ae: 'From AED 92,000',
    },
    'App Maintenance': {
      in: 'From ₹11,999/mo',
      us: 'From $499/mo',
      ae: 'From AED 1,800/mo',
    },
  },

  // ─────────────────────────────────────────────────────── Blockchain & Web3
  'blockchain-web3': {
    'Smart Contract Development': {
      in: 'From ₹85,000',
      us: 'From $2,499',
      ae: 'From AED 9,200',
    },
    'Decentralized Applications': {
      in: 'From ₹5,30,000',
      us: 'From $9,999',
      ae: 'From AED 36,700',
    },
    'NFT Platforms': {
      in: 'From ₹2,15,000',
      us: 'From $14,999',
      ae: 'From AED 55,000',
    },
    'Trading Bots': {
      // Between Smart Contract Development (₹85,000) and NFT Platforms
      // (₹2,15,000), matching where $4,999 sits between their USD figures.
      in: 'From ₹1,85,000',
      us: 'From $4,999',
      ae: 'From AED 18,400',
    },
  },

  // ────────────────────────────────────────────────────── AI & Machine Learning
  // Project work, priced on the same tiers as the other build categories: the
  // $1,499 / $4,999 / $9,999 / $999-per-month steps all appear above.
  'ai-machine-learning': {
    // Cheapest first — this row is the page's headline "from" figure.
    'AI Consulting & Strategy': {
      in: 'From ₹42,000',
      us: 'From $1,499',
      ae: 'From AED 5,500',
    },
    'Chatbots & Generative AI': {
      in: 'From ₹1,25,000',
      us: 'From $4,999',
      ae: 'From AED 18,400',
    },
    'Custom ML Models': {
      // Above Custom Web Applications (₹1,05,000 at the same $9,999): a
      // trained model carries data work that a web build does not.
      in: 'From ₹2,50,000',
      us: 'From $9,999',
      ae: 'From AED 36,700',
    },
    'Ongoing AI Support': {
      in: 'From ₹8,999/mo',
      us: 'From $999/mo',
      ae: 'From AED 3,700/mo',
    },
  },

  // ───────────────────────────────────────────────────────────── Product Design
  'product-design': {
    'UX Research & Prototypes': {
      in: 'From ₹47,000',
      us: 'From $1,999',
      ae: 'From AED 7,300',
    },
    'Product & Brand Design': {
      in: 'From ₹1,05,000',
      us: 'From $4,999',
      ae: 'From AED 18,400',
    },
  },

  // ─────────────────────────────────────────────────────── Digital Marketing
  // The parent page for the marketing sub-services. Each row is priced at the
  // entry tier of the sub-service page it leads to, so the overview never
  // undercuts or oversells the page a visitor lands on next.
  'digital-marketing': {
    // Cheapest in every currency, so it leads and sets the headline figure.
    'AI Engine Optimization': {
      in: '₹15,000/mo',
      us: '$175/mo',
      ae: 'AED 650/mo',
    },
    'Social Media Marketing': {
      in: 'From ₹15,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
    'Performance Marketing': {
      in: '₹18,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
    'SEO, AEO, GEO & ASO': {
      // The Search Growth Bundle tier — this row covers all four channels.
      in: '₹25,000/mo',
      us: '$299/mo',
      ae: 'AED 1,100/mo',
    },
    'Funnels & CRO': {
      in: 'From ₹30,000/mo',
      us: 'From $599/mo',
      ae: 'From AED 2,200/mo',
    },
    'Marketing Automation': {
      in: 'From ₹35,000/mo',
      us: 'From $899/mo',
      ae: 'From AED 3,300/mo',
    },
  },

  // ────────────────────────────────────────────────────────── Cloud & DevOps
  'cloud-devops': {
    'Cloud Infrastructure': {
      in: 'From ₹85,000',
      us: 'From $1,999',
      ae: 'From AED 7,300',
    },
    'CI/CD & DevOps': {
      in: 'From ₹42,000',
      us: 'From $1,499',
      ae: 'From AED 5,500',
    },
    'Process Automation': {
      // Above Cloud Infrastructure (₹85,000 / $1,999) on the same curve.
      in: 'From ₹1,25,000',
      us: 'From $2,999',
      ae: 'From AED 11,000',
    },
    'Managed Services': {
      in: 'From ₹6,999/mo',
      us: 'From $999/mo',
      ae: 'From AED 3,700/mo',
    },
  },

  // ──────────────────────────────────────────────────────────── Cybersecurity
  // The India deck has no cybersecurity tab; only the security audit has an
  // INR figure (from the Cloud tab). The rest are quoted per engagement.
  'cybersecurity': {
    'Application Security Audits': {
      in: 'From ₹47,000',
      us: 'From $1,999',
      ae: 'From AED 7,300',
    },
    'Smart Contract Security': {
      // Application Security Audits is ₹47,000 at $1,999; this is $2,999.
      in: 'From ₹75,000',
      us: 'From $2,999',
      ae: 'From AED 11,000',
    },
    'Performance Optimization': {
      // Same ratio as Application Security Audits, at $1,499.
      in: 'From ₹35,000',
      us: 'From $1,499',
      ae: 'From AED 5,500',
    },
    'Security Monitoring': {
      // A retainer, priced a step above Managed Services (₹6,999/mo at the
      // same $999/mo) because it carries an on-call response commitment.
      in: 'From ₹8,999/mo',
      us: 'From $999/mo',
      ae: 'From AED 3,700/mo',
    },
  },

  // ════════════════════════════════════════════════════ DIGITAL MARKETING ══

  // ───────────────────────────────────────────────────────── SEO, AEO & GEO
  // USD / AED converted from the INR rate — see the conversion note at the top.
  'seo-aeo-geo': {
    'SEO': {
      in: '₹15,000/mo',
      us: '$175/mo',
      ae: 'AED 650/mo',
    },
    'AEO + GEO (AI Search)': {
      in: '₹15,000/mo',
      us: '$175/mo',
      ae: 'AED 650/mo',
    },
    'Search Growth Bundle': {
      in: '₹25,000/mo',
      us: '$299/mo',
      ae: 'AED 1,100/mo',
    },
    'ASO (App Store Optimization)': {
      // One search channel, like SEO and AEO+GEO above, so it is sold at the
      // same tier as those rather than at the bundle price.
      in: '₹15,000/mo',
      us: '$175/mo',
      ae: 'AED 650/mo',
    },
  },

  // ─────────────────────────────────────────────────── Performance Marketing
  'performance-marketing': {
    'Google Ads': {
      in: '₹18,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
    'Meta Ads': {
      in: '₹18,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
    'LinkedIn Ads': {
      in: '₹22,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
    'Full-Funnel Performance Marketing': {
      in: '₹30,000/mo',
      us: 'From $1,799/mo',
      ae: 'From AED 6,600/mo',
    },
  },

  // ───────────────────────────────────────────────── Social Media Management
  'social-media-management': {
    'Social — Starter': {
      in: '₹15,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
    'Social — Growth': {
      in: '₹30,000/mo',
      us: 'From $599/mo',
      ae: 'From AED 2,200/mo',
    },
    'Social — Scale': {
      in: '₹45,000/mo',
      us: 'From $1,799/mo',
      ae: 'From AED 6,600/mo',
    },
    'Content Production': {
      // Social — Starter is ₹15,000/mo at the same $400/mo.
      in: 'From ₹15,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
  },

  // ────────────────────────────────────────────────────── Influencer Marketing
  // Retainers on the same ladder as social-media-management, which is the
  // closest comparable: monthly, channel-led, and sold in three tiers with an
  // analytics add-on. Creator fees and paid media are passed through on top of
  // these and are quoted per brief.
  'influencer-marketing': {
    // Entry tier — matches Social — Starter.
    'Creator Discovery & Vetting': {
      in: 'From ₹15,000/mo',
      us: 'From $400/mo',
      ae: 'From AED 1,500/mo',
    },
    'Campaign Management': {
      in: 'From ₹35,000/mo',
      us: 'From $899/mo',
      ae: 'From AED 3,300/mo',
    },
    'UGC & Whitelisting': {
      in: 'From ₹25,000/mo',
      us: 'From $599/mo',
      ae: 'From AED 2,200/mo',
    },
    'Performance & Attribution': {
      in: 'From ₹20,000/mo',
      us: 'From $499/mo',
      ae: 'From AED 1,800/mo',
    },
  },
};

const pagePrices: Record<string, RegionPrice> = {
  /*
    The four design disciplines are priced by ANCHORING to the branding decks
    below rather than by inventing new figures — same rule the rest of this
    file follows. Each comment records which deck the number came from.

    Graphic Design and Brand Identity both sit on the Starter figure because
    Starter IS that work (logo, colour, type, stationery, social kit) split
    across the two pages a client actually searches for. UI/UX and Website
    Design sit on Growth, whose deck is where the screen work lives
    ("Website UI Design (5-10 Pages)", "Icon Set").
  */
  'ui-ux-design': {
    // anchored to growth-branding-package
    in: '₹50,000+',
    us: '$1,299+',
    ae: 'AED 4,800+',
  },
  'website-design': {
    // anchored to growth-branding-package
    in: '₹50,000+',
    us: '$1,299+',
    ae: 'AED 4,800+',
  },
  'brand-identity-design': {
    // anchored to starter-branding-package
    in: '₹30,000+',
    us: '$799+',
    ae: 'AED 2,900+',
  },
  'graphic-design': {
    // anchored to starter-branding-package
    in: '₹30,000+',
    us: '$799+',
    ae: 'AED 2,900+',
  },
  /* The parent page leads with the cheapest of its three decks. */
  'branding-and-designing': {
    in: '₹30,000+',
    us: '$799+',
    ae: 'AED 2,900+',
  },
  'starter-branding-package': {
    in: '₹30,000+',
    us: '$799+',
    ae: 'AED 2,900+',
  },
  'growth-branding-package': {
    in: '₹50,000+',
    us: '$1,299+',
    ae: 'AED 4,800+',
  },
  'premium-brand-identity': {
    in: '₹1,00,000+',
    us: '$2,499+',
    ae: 'AED 9,200+',
  },
};

const CUSTOM = "Custom quote";

/** Price for one package on one page, or "Custom quote". */
export function priceFor(slug: string, title: string, region: RegionId): string {
  return servicePrices[slug]?.[title]?.[region] ?? CUSTOM;
}

/** Whole-page price for the deck-style pages, or null if priced per card. */
export function pagePriceFor(slug: string, region: RegionId): string | null {
  return pagePrices[slug]?.[region] ?? null;
}

/**
 * The headline "from" figure for a page: the first entry in its table, which
 * is written cheapest-first for exactly this reason.
 */
export function startingPriceFor(slug: string, region: RegionId): string | null {
  const page = pagePrices[slug]?.[region];
  if (page) return page;
  const table = servicePrices[slug];
  if (!table) return null;
  const first = Object.values(table)[0]?.[region];
  return first && first !== CUSTOM ? first : null;
}

/** True when this page sells one package rather than several. */
export const isDeckPage = (slug: string) => slug in pagePrices;
