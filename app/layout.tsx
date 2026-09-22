import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Cinzel, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/animations/SmoothScrollProvider";
import { Analytics } from "@/components/zan/analytics/Analytics";
import { Providers } from "@/components/zan/Providers";
import { ScrollRefresh } from "@/components/zan/ScrollRefresh";
import { Preloader } from "@/components/zan/shell/Preloader";
import { Navbar } from "@/components/zan/shell/Navbar";
import { Footer } from "@/components/zan/shell/Footer";
import { ScrollProgress } from "@/components/zan/shell/ScrollProgress";
import { RouteChange } from "@/components/zan/shell/RouteChange";
import { homeSeo } from "@/constants/pages";
import { regions, site } from "@/constants/zan";
import { OG_IMAGE, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, OG_LOCALE } from "@/lib/metadata";
import { RegionProvider } from "@/lib/region";
import { jsonLd, organizationSchema, websiteSchema } from "@/lib/schema";
import { regionAlternates, requestRegion } from "@/lib/server-region";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

/** Display face for headings — the production site's. */
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * The hero's display face. A variable grotesque with optical-size and width
 * axes, so the headline can be set large, tight and heavy without looking
 * like the default system sans every template ships with.
 */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

/** en-IN / en-AE / en-US, matching the hreflang alternates. */
const HTML_LANG = { in: "en-IN", ae: "en-AE", us: "en-US" } as const;

/** The homepage's <title>. The regional build swaps in that region's trading name. */
const titleFor = (brandName: string) => `${brandName} — Development, Digital Marketing & Designing`;

/**
 * Built per request because the canonical depends on which region's URL was
 * asked for. Every page inherits the alternates from here rather than
 * repeating them: the path is the same in all three regions, so one rule
 * covers the homepage, the sixteen service pages and the policies alike.
 * A page that sets its own `alternates` would override this; none do.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { region, path } = await requestRegion();
  const { brandName } = regions[region];
  const title = titleFor(brandName);
  const alternates = regionAlternates(path, region);

  return {
    metadataBase: new URL(site.url),
    title,
    // Shorter than `site.description`, which is body copy and ran to 197
    // characters — past the point Google truncates.
    description: homeSeo.description,
    applicationName: site.name,
    alternates,
    verification: {
      // The property this site will be verified against in Google Search
      // Console. Same token both previous builds use, so ownership carries
      // over rather than needing re-verifying at cutover.
      google: "TJOK4WNf7fvLnfx5Iq4r-OWbpcUjk9o-gme3yAt84g0",
    },
    openGraph: {
      title,
      description: homeSeo.description,
      type: "website",
      siteName: brandName,
      url: alternates.canonical,
      locale: OG_LOCALE[region],
      // Inherited by the homepage only: a page that sets its own `openGraph`
      // replaces this block wholesale, which is why lib/metadata.ts re-emits
      // the image, the url and the locale for every other route.
      images: [
        {
          url: OG_IMAGE,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: brandName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@zanservices",
      title,
      description: homeSeo.description,
      images: [OG_IMAGE],
    },
    robots: {
      /* ── THE ONE LINE TO DELETE AT CUTOVER ────────────────────────────────
         `index: false, follow: false` — here and, for the same reason, in the
         googleBot block below.

         This is a second build of the company site on a second host. Letting
         it be indexed would put a duplicate of zanservices.com's content into
         search and split its rankings. Delete these two noindex pairs the day
         this build becomes the production site; everything else in this block
         is what the live site should be serving and stays.

         The googleBot block has to repeat them because a googlebot-specific
         meta tag OVERRIDES the generic robots tag for Google. Leaving index
         and follow out of it would hand Google max-image-preview:large and
         permission to index the staging build. */
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        // Full-size image thumbnails and untruncated snippets in results.
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  /* The region of the URL that was asked for: /ae/pricing renders gold, with
     the UAE trading name and the Dubai number, in the HTML itself. */
  const { region } = await requestRegion();

  return (
    <html
      lang={HTML_LANG[region]}
      data-region={region}
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${bricolage.variable}`}
      // setRegion() writes data-region straight to this element when the
      // switcher is used, so React must not police it.
      suppressHydrationWarning
    >
      <head>
        {/* The region is in the URL now, so nothing has to be restored before
            paint. This only carries a choice made before the cookie existed
            over to the cookie, so the server can honour it on the next request
            instead of falling back to the country default. It changes nothing
            on screen. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=localStorage.getItem('zan.region');if((r==='in'||r==='ae'||r==='us')&&!/(^|;\\s*)zan\\.region=/.test(document.cookie))document.cookie='zan.region='+r+';path=/;max-age=31536000;samesite=lax'}catch(e){}`,
          }}
        />
        {/* WHO THIS IS, on every page. The Organization node is the company —
            address, phone, tax ID, offices, opening hours, what it knows about
            — and the WebSite node is this site; both carry a stable @id that
            the per-page Service, HowTo and BreadcrumbList nodes point back to.
            Attached in the layout rather than on the homepage alone so that a
            crawler landing on any one of the 84 URLs gets the company with it. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema(), websiteSchema()) }}
        />
        {/* Without JavaScript nothing would ever reveal: show everything at rest. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important;clip-path:none!important}#zan-preloader{display:none!important}`}</style>
        </noscript>
      </head>
      <body className="bg-bg text-ink antialiased" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-small focus:text-bg"
        >
          Skip to content
        </a>
        <div className="noise-overlay" aria-hidden="true" />
        <RegionProvider value={region}>
          <Providers>
            <Preloader />
            <ScrollProgress />
            <ScrollRefresh />
            <SmoothScrollProvider>
              <RouteChange />
              <Navbar />
              {children}
              <Footer />
            </SmoothScrollProvider>
          </Providers>
        </RegionProvider>
        {/* Last in the body, and deferred from there: the three tags load on
            idle or first interaction, never during the first paint. */}
        <Analytics />
      </body>
    </html>
  );
}
