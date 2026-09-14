import path from "node:path";
import type { NextConfig } from "next";

/* ── Where the main Zan app lives ───────────────────────────────────────────
   Only the chat API still comes from there. Navigation does not: every page
   of this site is a route under app/, and lib/links.ts resolves content hrefs
   to this origin. This constant exists for the two rewrites at the bottom of
   the file; set NEXT_PUBLIC_MAIN_SITE_URL to "" once the chat endpoints are
   local and both proxies drop out on their own. */
const MAIN_SITE_URL = (
  process.env.NEXT_PUBLIC_MAIN_SITE_URL ??
  (process.env.NODE_ENV === "production" ? "https://zanservices.com" : "http://localhost:5173")
).replace(/\/+$/, "");

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
  /* ── The chat API, borrowed from the main app ────────────────────────────
     The assistant's endpoints — /api/chat/session, /message, /history, /lead,
     /handoff and /api/pusher/auth — are implemented once, in the main Zan app.
     This page proxies them on the SERVER instead of duplicating a backend or
     calling a second origin from the browser: the fetches stay same-origin, so
     there is no CORS preflight and no third-party-cookie question, and the day
     this page becomes the main app's homepage the routes are already local and
     these rules simply stop matching.

     The destination carries the trailing slash because the main app sets
     `trailingSlash: true`. This app does not, so the client calls the paths
     WITHOUT one — a trailing slash here would be 308-redirected before the
     rewrite ever ran, and a redirected POST can arrive with no body. */
  async rewrites() {
    if (!MAIN_SITE_URL) return [];
    return [
      { source: "/api/chat/:path*", destination: `${MAIN_SITE_URL}/api/chat/:path*/` },
      { source: "/api/pusher/:path*", destination: `${MAIN_SITE_URL}/api/pusher/:path*/` },
    ];
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
