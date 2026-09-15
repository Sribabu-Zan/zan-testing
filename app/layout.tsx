import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Cinzel, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrollProvider } from "@/components/animations/SmoothScrollProvider";
import { Providers } from "@/components/zan/Providers";
import { ScrollRefresh } from "@/components/zan/ScrollRefresh";
import { Preloader } from "@/components/zan/shell/Preloader";
import { Navbar } from "@/components/zan/shell/Navbar";
import { Footer } from "@/components/zan/shell/Footer";
import { ScrollProgress } from "@/components/zan/shell/ScrollProgress";
import { RouteChange } from "@/components/zan/shell/RouteChange";
import { site } from "@/constants/zan";

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

const title = `${site.name} — Development, Digital Marketing & Designing`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  applicationName: site.name,
  openGraph: { title, description: site.description, type: "website", siteName: site.name },
  // A second build of the company page on a second host. Letting it be
  // indexed would put a duplicate of zanservices.com's content into search
  // and split its rankings. Remove this when the page becomes the production
  // homepage.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-region="in"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${bricolage.variable}`}
      // The script below may change data-region before React hydrates.
      suppressHydrationWarning
    >
      <head>
        {/* A returning visitor's region, restored before first paint so the
            page never flashes violet and then turns gold. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=localStorage.getItem('zan.region');if(r==='in'||r==='ae'||r==='us')document.documentElement.setAttribute('data-region',r)}catch(e){}`,
          }}
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
      </body>
    </html>
  );
}
