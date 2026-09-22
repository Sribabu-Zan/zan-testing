import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1440, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 768],
    // Every image is served from /public. No remote hosts are allowed, so a
    // stray third-party URL fails loudly instead of quietly loading someone
    // else's asset.
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap", "lucide-react", "@react-three/drei", "lenis"],
  },
  turbopack: {
    // This project sits inside the zan_webdevelopment repo, whose own
    // package-lock.json made Next infer THAT folder as the root. Turbopack then
    // watched the parent tree and kept serving a stale app/globals.css — the
    // old dark theme — long after the file had been rewritten. Pin it here.
    root: path.join(__dirname),
  },
  /* The chat API used to be proxied to the main app by two rewrites here.
     It is no longer borrowed: /api/chat/*, /api/pusher/auth, /api/agent/* and
     the WhatsApp webhook are all implemented in app/api of this project, over
     its own Mongo, Gemini, Pusher and Meta credentials. The rewrites had to go
     rather than simply stop matching — this site becomes zanservices.com, and
     a rule pointing at that host would have proxied the API back into itself.

     Keeping them local also fixes the rate limiter. A server-side rewrite
     presents every visitor to the upstream as one IP, so a per-IP limit
     ("20 chat sessions per 5 minutes") applied to the whole site at once.
     Requests now arrive directly and x-forwarded-for is the real caller. */

  /* ── URLs the old site has indexed that this one does not have ──────────
     Eleven live, indexed addresses from zanservices.com have no route here.
     Left alone they hard-404, which throws away whatever authority each one
     has accumulated; a 308 passes it to the page that replaced it.

     Every rule is emitted three times, once per region prefix, because the
     region is a path segment on this site: /ae/thank-you has to land on
     /ae/contact-us, not on India's.

     These run BEFORE proxy.ts, so a redirect lands on the prefixed URL and the
     proxy then resolves the region from it exactly as it would for a typed
     address. Nothing here touches the two API rewrites above. */
  async redirects() {
    /* [from, to] — both region-free, both leading-slashed. */
    const moved: [string, string][] = [
      /* The main app already carries these six (src/next.config.ts): the
         product-design page was split into the branding practice, and the
         three landing pages were folded into the service pages they duplicated. */
      ["/services/product-design", "/services/branding-and-designing/ui-ux-design"],
      ["/landing-pages/web-development", "/services/web-development"],
      ["/landing-pages/app-development", "/services/mobile-apps"],
      ["/landing-pages/digital-marketing", "/services/digital-marketing"],

      /* The three branding packages were four URLs selling one thing. They are
         now three decks on one page, because a client searches for "logo
         design", not for "Growth Branding Package". */
      ["/services/branding-and-designing/starter-branding-package", "/services/branding-and-designing#packages"],
      ["/services/branding-and-designing/growth-branding-package", "/services/branding-and-designing#packages"],
      ["/services/branding-and-designing/premium-brand-identity", "/services/branding-and-designing#packages"],

      /* The old enquiry form's confirmation page. It has no content of its
         own, and the form on /contact-us now confirms in place. */
      ["/thank-you", "/contact-us"],

      /* Ghost URLs Google crawled on the old site, fixed there in netlify's
         _redirects and re-stated here. /Home is listed separately from /home
         because path matching is case-sensitive. */
      ["/contact", "/contact-us"],
      ["/home", "/"],
      ["/Home", "/"],
    ];

    return moved.flatMap(([from, to]) =>
      ["", "/ae", "/us"].map((prefix) => ({
        source: `${prefix}${from}`,
        // The homepage is "" under a prefix: /ae/home -> /ae, not /ae/.
        destination: prefix && to === "/" ? prefix : `${prefix}${to}`,
        permanent: true,
      })),
    );
  },

  async headers() {
    const longCache = "public, max-age=31536000, immutable";
    return [
      {
        source: "/:all*(woff2|woff|ttf|otf)",
        headers: [{ key: "Cache-Control", value: longCache }],
      },
      {
        source: "/:all*(png|jpg|jpeg|webp|avif|svg|gif|ico|glb|wasm)",
        headers: [{ key: "Cache-Control", value: longCache }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
