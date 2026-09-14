/* ── Service artwork ────────────────────────────────────────────────────────
   One small editorial plate per discipline, keyed by the service's id in
   `constants/zan.ts`. The deck's practice grids draw these instead of a line
   icon.

   The files in /public/images/services are hand-drawn SVG: ink linework and
   neutral greys on a transparent ground, nothing coloured. The region's accent
   is applied by the card (see .zan-deck-plate in components/zan/services/
   deck.css), which sits the drawing on a brand-tinted plate and multiplies it
   in — an <img> cannot read a CSS variable, so a violet baked into the file
   would be wrong in the UAE and the US.

   To put a real photograph behind a service later, drop the file into
   /public/images/services and change that one line here. Anything raster wants
   a written `alt`; the drawings do not, because the service's name sits beside
   them and repeating it would only make a screen reader say it twice.
   ────────────────────────────────────────────────────────────────────────── */

export interface ServiceArt {
  /** Path under /public. */
  readonly src: string;
  /** "" when the label beside the plate already says the same thing. */
  readonly alt: string;
}

/** Intrinsic size of the drawings, for next/image's aspect ratio. */
export const SERVICE_PLATE = { width: 160, height: 100 } as const;

const plate = (slug: string, alt = ""): ServiceArt => ({ src: `/images/services/${slug}.svg`, alt });

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

/** The plate for a service id, or undefined if none has been drawn yet. */
export function getServiceArt(id: string): ServiceArt | undefined {
  return serviceArt[id];
}
