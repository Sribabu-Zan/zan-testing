/* ── Service photography ────────────────────────────────────────────────────
   One photograph per service page, keyed the way the rest of the per-service
   tables are: by the last segment of the page's slug, which is its `priceKey`
   in constants/pages.ts.

   Two surfaces draw these. The hero band of /services/[...slug] is the first,
   at full width. The second is constants/serviceArt.ts, whose `getServiceArt`
   reuses the same entries for the service cards — the catalogue on /services,
   the discipline grids, the "other services" lists — so a service looks like
   itself wherever it is named rather than shipping a second file for a
   thumbnail. The homepage deck is the one place that does not: it keeps the
   hand-drawn SVG plates that live in that same file, because a drawing can be
   multiplied into a plate tinted with the region's accent and a photograph
   cannot.

   Every picture has to be OF the service, not near it. The SEO page shows a
   search performance report, the influencer page a phone on a tripod, the
   cloud page a real data hall. A smiling person at a laptop would have done
   for all sixteen, which is the reason none of them is that.

   The files are 2000 x 1125 JPEG, each under 240 KB, and next/image serves
   the responsive sizes from there. They are cropped to 16:9 so the band can
   take a wider slice on a desktop and a squarer one on a phone through
   object-cover; the subject sits in the middle of every frame so no crop
   loses it.

   The `alt` is written out because the hero band is the one place the picture
   stands on its own, above the fold and away from any list. `getServiceArt`
   blanks it when it borrows the entry for a card, where the card's own heading
   names the subject an inch away and a screen reader given both would say it
   twice.

   Licences. Every file came from Unsplash or Pexels, both of which allow
   commercial use with no attribution and no permission. `source` is the URL
   the file was taken from — a record of where it came from, kept so the
   provenance of each one can be checked later, not a credit the page owes.
   ────────────────────────────────────────────────────────────────────────── */

export interface ServiceHero {
  /** Path under /public. */
  readonly src: string;
  /** Intrinsic size of the file, for next/image's aspect ratio. */
  readonly width: number;
  readonly height: number;
  /** What the photograph shows, for a screen reader. Never empty. */
  readonly alt: string;
  /** Where the file came from. A record, not an attribution. */
  readonly source: string;
}

/** Every file is cropped and encoded to the same frame. */
const WIDTH = 2000;
const HEIGHT = 1125;

const photo = (slug: string, alt: string, source: string): ServiceHero => ({
  src: `/images/services/hero/${slug}.jpg`,
  width: WIDTH,
  height: HEIGHT,
  alt,
  source,
});

const unsplash = (id: string) => `https://images.unsplash.com/${id}`;
const pexels = (id: string) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;

export const serviceHero: Readonly<Record<string, ServiceHero>> = {
  /* Development */
  /* Every string on this screen was read before it was kept, which is how the
     one it replaces should have been checked: that was a WordPress theme being
     edited, on the page that sells custom development, with a docs URL legible
     in a comment and a product wordmark on the laptop. This is plain CSS for a
     page header and names nothing. */
  "web-development": photo(
    "web-development",
    "A hand at a laptop keyboard on a wooden desk, the screen beside it showing CSS being written for a page's header.",
    pexels("574077"),
  ),
  "mobile-apps": photo(
    "mobile-apps",
    "A hand holding a phone running a dashboard app, the same app's screens laid out on a laptop behind it.",
    unsplash("photo-1551650975-87deedd944c3"),
  ),
  "ai-machine-learning": photo(
    "ai-machine-learning",
    "A sheet of paper in a typewriter with the words MACHINE LEARNING typed across it.",
    unsplash("photo-1591453089816-0fbb971b454c"),
  ),
  "cloud-devops": photo(
    "cloud-devops",
    "Rows of white server cabinets in a brightly lit data hall, seen from above.",
    unsplash("photo-1784652852605-6945598f2af3"),
  ),
  cybersecurity: photo(
    "cybersecurity",
    "A phone on a pale desk showing a padlock and the word Secured, beside a plant, a pencil and reading glasses.",
    unsplash("photo-1584433144859-1fc3ab64a957"),
  ),
  "blockchain-web3": photo(
    "blockchain-web3",
    "Translucent blue cubes linked corner to corner into a chain, laid out across a pale blue ground.",
    unsplash("photo-1666816943035-15c29931e975"),
  ),

  /* Digital marketing */
  /* The work rather than the word. This page is the parent of the SEO one,
     which is a set of sculptural SEO letters, and two pages in a row showing
     their own subject spelled out is one idea used twice. */
  "digital-marketing": photo(
    "digital-marketing",
    "Printed campaign plans across a desk: results broken down by country, a staged cycle diagram and a rollout timeline across markets, with a hand resting on one of the sheets.",
    pexels("9034244"),
  ),
  /* No figures on screen, on purpose. The report this replaced was a real one
     and a weak one: average position 25.2, which is page three. Anyone who
     reads a page selling search can read that, and it argued against the copy
     standing next to it. */
  "seo-aeo-geo": photo(
    "seo-aeo-geo",
    "The letters SEO standing a metre tall against a pale wall, with a laptop, a mug and a plant on the desk in front of them.",
    unsplash("photo-1709281847802-9aef10b6d4bf"),
  ),
  "performance-marketing": photo(
    "performance-marketing",
    "A bright studio desk, the monitor on it showing an ad spend breakdown and a pie chart of where the budget went.",
    pexels("6476580"),
  ),
  "social-media-management": photo(
    "social-media-management",
    "A whiteboard content calendar, one social channel per row, coloured sticky notes placed across the week.",
    unsplash("photo-1676276375742-9e3d10e39d45"),
  ),
  "influencer-marketing": photo(
    "influencer-marketing",
    "A phone clamped to a tripod filming a creator, the screen reading LIVE NOW, daylight and plants behind it.",
    unsplash("photo-1764162051353-0d3aef372c56"),
  ),

  /* Designing */
  "branding-and-designing": photo(
    "branding-and-designing",
    "A brand identity laid out in print: business cards, letterheads and an orange logo card on a pale surface.",
    unsplash("photo-1763705857736-2b4f16a33758"),
  ),
  "ui-ux-design": photo(
    "ui-ux-design",
    "Hand-drawn interface wireframes in ink and watercolour, three screen layouts side by side on white paper.",
    unsplash("photo-1522542550221-31fd19575a2d"),
  ),
  "brand-identity-design": photo(
    "brand-identity-design",
    "A designer's desk with colour swatch cards fanned across a sketchbook of logo marks, pencils beside them.",
    unsplash("photo-1716471330463-f475b00f0506"),
  ),
  "graphic-design": photo(
    "graphic-design",
    "Printed posters hung in a row on a warm painted wall, each one a different typographic layout.",
    unsplash("photo-1790090919617-8a3a79621332"),
  ),
  /* The layouts on paper rather than a site on a screen. Web development
     already has a laptop on a desk, and a photograph of a real site on this
     page of all pages would be showing a stranger's work where a visitor
     reads the picture as an example of ours. */
  "website-design": photo(
    "website-design",
    "Printed page layouts pinned in a row along a white studio wall beside a window, each sheet a different screen of the same design, several marked up by hand.",
    unsplash("photo-1532101780307-8f873ece858f"),
  ),
};

/** The photograph for a service page, or undefined if none has been shot yet. */
export function getServiceHero(slug: string): ServiceHero | undefined {
  return serviceHero[slug];
}
