/* ── Card artwork ───────────────────────────────────────────────────────────
   Two sets of pictures for the same subjects, and a section picks whichever
   it wants:

     · DRAWN PLATES, at the bottom of this file. Hand-drawn 160 x 100 SVG in
       ink and neutral greys on a transparent ground, nothing coloured, so the
       card can multiply them into a plate tinted with the region's accent
       (.zan-deck-plate in components/zan/services/deck.css). A colour baked
       into the file would be wrong in two of the three regions, which is why
       none of them carries one.
     · PHOTOGRAPHS, below. One per subject, 1200 x 750 JPEG under 120 KB,
       cropped with the subject in the middle so a cover crop never loses it.
       A photograph cannot take the region tint; a card showing one drops the
       tint and keeps the accent as a hairline instead.

   ── The photographs ────────────────────────────────────────────────────────
   One per card subject: a service, a step of the process, an industry, a
   reason to hire us.

   The services reuse the hero photograph their own page already carries
   (constants/serviceHero.ts) rather than shipping a second file, so a service
   looks like itself in the deck, in the catalogue, in the "other services"
   list and at the top of its page. The four Blockchain & Web3 lines on the
   homepage deck have no page of their own, so their pictures live here.

   The files are 1200 x 750 JPEG, each under 120 KB (the heroes are the larger
   2000 x 1125). next/image serves the responsive sizes from there and the
   card crops with object-cover, so the subject sits in the middle of every
   frame and no crop loses it.

   `alt` is empty on purpose. The subject's name is the card's own heading, an
   inch from the picture, and a screen reader given both would say it twice.
   The hero band on /services/[...slug] is where a written alt belongs, and
   serviceHero.ts carries one for each of those.

   Licences. Every file came from Pexels or Unsplash, both of which allow
   commercial use with no attribution and no permission. `source` is the URL
   the file was taken from: a record of where it came from, kept so the
   provenance of each one can be checked later, not a credit the page owes.
   ────────────────────────────────────────────────────────────────────────── */

import { serviceHero } from "@/constants/serviceHero";

export interface CardArt {
  /** Path under /public. */
  readonly src: string;
  /** Intrinsic size of the file, for next/image's aspect ratio. */
  readonly width: number;
  readonly height: number;
  /** "" — the card's own heading already names the subject. */
  readonly alt: string;
  /** Where the file came from. A record, not an attribution. */
  readonly source?: string;
}

/**
 * What a card asks next/image for. Widest case is the three-column catalogue
 * on /services; the four-column grids are served a little larger than they
 * need, which costs nothing at these file sizes.
 */
export const CARD_ART_SIZES = "(max-width: 767px) 92vw, (max-width: 1279px) 46vw, 33vw";

/** Every file written for this file's own tables. */
const WIDTH = 1200;
const HEIGHT = 750;

const pexels = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;

const photo =
  (dir: string) =>
  (slug: string, source: string): CardArt => ({
    src: `/images/${dir}/${slug}.jpg`,
    width: WIDTH,
    height: HEIGHT,
    alt: "",
    source,
  });

/* ── Services ─────────────────────────────────────────────────────────────
   Fourteen service pages and the two practice parents take the photograph
   from their own page's hero. The four Blockchain & Web3 lines below are the
   deck's alone: they all link to /services/blockchain-web3, so there is no
   hero to borrow. */

const web3 = photo("services/web3");

export const deckServiceArt: Readonly<Record<string, CardArt>> = {
  "smart-contracts": web3("smart-contracts", pexels("7841410")),
  dapps: web3("dapps", pexels("9577238")),
  "nft-platforms": web3("nft-platforms", pexels("4412789")),
  "security-audits": web3("security-audits", pexels("7319085")),
};

/** The photograph for a service id, or undefined if none has been shot yet. */
export function getServiceArt(id: string): CardArt | undefined {
  const hero = serviceHero[id];
  if (hero) return { src: hero.src, width: hero.width, height: hero.height, alt: "" };
  return deckServiceArt[id];
}

/* ── The four process steps ───────────────────────────────────────────────
   Keyed by the step's index rather than its id: the index is the one thing
   every StepCard is given (`processSteps` is the only content that feeds it,
   and the four steps are always drawn in order), so the card can resolve its
   own picture without a page having to pass one. */

const step = photo("process");

export const processArt: Readonly<Record<string, CardArt>> = {
  "01": step("discovery", pexels("7948058")),
  "02": step("design", pexels("196646")),
  "03": step("build", pexels("34804001")),
  "04": step("launch", pexels("7327336")),
};

/** The photograph for a process step, by its index. */
export function getProcessArt(index: string): CardArt | undefined {
  return processArt[index];
}

/* ── Industries ───────────────────────────────────────────────────────────── */

const sector = photo("industries");

export const industryArt: Readonly<Record<string, CardArt>> = {
  healthcare: sector("healthcare", pexels("48603")),
  finance: sector("finance", pexels("11009960")),
  ecommerce: sector("ecommerce", pexels("7319110")),
  education: sector("education", pexels("6177682")),
  "real-estate": sector("real-estate", pexels("37224965")),
  // A loading bay rather than a racking aisle: the logistics case study on the
  // homepage is already a warehouse interior, and two aisles receding to the
  // same vanishing point on one page read as the same picture twice.
  logistics: sector("logistics", pexels("6169177")),
  entertainment: sector("entertainment", pexels("918281")),
  travel: sector("travel", pexels("11004123")),
};

/** The photograph for an industry id. */
export function getIndustryArt(id: string): CardArt | undefined {
  return industryArt[id];
}

/* ── Why businesses choose Zan ────────────────────────────────────────────── */

const reason = photo("reasons");

export const reasonArt: Readonly<Record<string, CardArt>> = {
  "modern-tech": reason("modern-tech", pexels("5618615")),
  pricing: reason("pricing", pexels("7688524")),
  delivery: reason("delivery", pexels("7580842")),
  support: reason("support", pexels("8866719")),
};

/** The photograph for one of the four differentiators. */
export function getReasonArt(id: string): CardArt | undefined {
  return reasonArt[id];
}

/* ── The drawn plates ───────────────────────────────────────────────────────
   The other set. Same subjects, same keys, hand-drawn instead of shot: ink
   linework and neutral greys on a transparent ground, deliberately uncoloured
   so the card can tint them with the region's accent. Keep that rule for
   anything added here — India is violet, the UAE gold and the US orange, and
   one file serves all three only because it carries no colour of its own.
   ────────────────────────────────────────────────────────────────────────── */

export interface ServiceArt {
  /** Path under /public. */
  readonly src: string;
  /** "" when the label beside the plate already says the same thing. */
  readonly alt: string;
}

/** Intrinsic size of the drawings, for next/image's aspect ratio. */
export const SERVICE_PLATE = { width: 160, height: 100 } as const;

const drawing =
  (dir: string) =>
  (slug: string, alt = ""): ServiceArt => ({ src: `/images/${dir}/${slug}.svg`, alt });

const plate = drawing("services");

export const serviceArt: Readonly<Record<string, ServiceArt>> = {
  /* Development */
  "web-development": plate("web-development"),
  "mobile-apps": plate("mobile-apps"),
  "ai-machine-learning": plate("ai-machine-learning"),
  "cloud-devops": plate("cloud-devops"),
  cybersecurity: plate("cybersecurity"),
  "blockchain-web3": plate("blockchain-web3"),

  /* Digital marketing */
  "seo-aeo-geo": plate("seo-aeo-geo"),
  "performance-marketing": plate("performance-marketing"),
  "social-media-management": plate("social-media-management"),
  "influencer-marketing": plate("influencer-marketing"),

  /* Blockchain & Web3 */
  "smart-contracts": plate("smart-contracts"),
  dapps: plate("dapps"),
  "nft-platforms": plate("nft-platforms"),
  "security-audits": plate("security-audits"),

  /* Designing */
  "ui-ux-design": plate("ui-ux-design"),
  "brand-identity-design": plate("brand-identity-design"),
  "graphic-design": plate("graphic-design"),
  "website-design": plate("website-design"),
};

/** The drawn plate for a service id, or undefined if none has been drawn. */
export function getServicePlate(id: string): ServiceArt | undefined {
  return serviceArt[id];
}

/** The four process steps, keyed by index the way `processArt` is. */
export const processPlates: Readonly<Record<string, ServiceArt>> = {
  "01": drawing("process")("discovery"),
  "02": drawing("process")("design"),
  "03": drawing("process")("build"),
  "04": drawing("process")("launch"),
};

/** The drawn plate for a process step, by its index. */
export function getProcessPlate(index: string): ServiceArt | undefined {
  return processPlates[index];
}

const sectorPlate = drawing("industries");

export const industryPlates: Readonly<Record<string, ServiceArt>> = {
  healthcare: sectorPlate("healthcare"),
  finance: sectorPlate("finance"),
  ecommerce: sectorPlate("ecommerce"),
  education: sectorPlate("education"),
  "real-estate": sectorPlate("real-estate"),
  logistics: sectorPlate("logistics"),
  entertainment: sectorPlate("entertainment"),
  travel: sectorPlate("travel"),
};

/** The drawn plate for an industry id. */
export function getIndustryPlate(id: string): ServiceArt | undefined {
  return industryPlates[id];
}

const reasonPlate = drawing("reasons");

export const reasonPlates: Readonly<Record<string, ServiceArt>> = {
  "modern-tech": reasonPlate("modern-tech"),
  pricing: reasonPlate("pricing"),
  delivery: reasonPlate("delivery"),
  support: reasonPlate("support"),
};

/** The drawn plate for one of the four differentiators. */
export function getReasonPlate(id: string): ServiceArt | undefined {
  return reasonPlates[id];
}
