import Script from "next/script";
import { ContactClicks } from "./ContactClicks";

/* ───────────────────────────────────────────────────────────────────────────
   THE THREE TAGS

   Google Tag Manager, the Meta Pixel and the LinkedIn Insight tag, on the
   same containers the live site uses, so the history in each account carries
   over rather than starting again. The cookie policy this site already
   publishes (constants/legal.ts) names Google Analytics and the Meta Pixel;
   this is what brings the site into line with it.

   NOTHING IS FETCHED AT FIRST PAINT. Three tag scripts on the critical path
   is the usual way a fast page becomes a slow one, so the arrangement is the
   live site's, in two parts:

     1. the queues, inline, before anything else — dataLayer, lintrk and fbq
        are stubs that record calls into an array. No network. So an event
        pushed in the first second is not lost, it is waiting.
     2. the loader, after hydration, which does nothing until the browser is
        idle or the visitor first touches the page, whichever comes first,
        with a timeout so a busy main thread cannot starve it forever.

   Headless browsers are skipped. Lighthouse, a prerender and the screenshot
   runs are not visits, and GTM's own container would otherwise record them.
   ─────────────────────────────────────────────────────────────────────────── */

const GTM_ID = "GTM-WKT2N6FF";
const META_PIXEL_ID = "1425758958953911";
const LINKEDIN_PARTNER_ID = "9756265";

/* Deliberately dns-prefetch and not preconnect: a preconnect opens the socket
   during the load the deferral exists to protect. The lookup is the part worth
   doing early. */
const ORIGINS = [
  "https://www.googletagmanager.com",
  "https://connect.facebook.net",
  "https://snap.licdn.com",
];

const queues = `
window.dataLayer = window.dataLayer || [];
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push("${LINKEDIN_PARTNER_ID}");
window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
window.lintrk.q = [];
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document,'script');
`;

const loader = `
(function(){
  if (/HeadlessChrome|Puppeteer/i.test(navigator.userAgent)) return;

  function loadScripts() {
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${GTM_ID}');

    var li = document.createElement('script');
    li.type = 'text/javascript'; li.async = true;
    li.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
    document.head.appendChild(li);

    var fb = document.createElement('script');
    fb.async = true;
    fb.src = 'https://connect.facebook.net/en_US/fbevents.js';
    fb.onload = function() {
      if (window.fbq) {
        window.fbq('init', '${META_PIXEL_ID}');
        window.fbq('track', 'PageView');
      }
    };
    document.head.appendChild(fb);
  }

  var loaded = false;
  function tryLoad() { if (!loaded) { loaded = true; loadScripts(); } }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(tryLoad, { timeout: 3000 });
  } else {
    setTimeout(tryLoad, 2000);
  }
  ['scroll','click','keydown','touchstart'].forEach(function(ev) {
    window.addEventListener(ev, tryLoad, { once: true, passive: true });
  });
})();
`;

export function Analytics() {
  return (
    <>
      {/* React hoists these into <head>. */}
      {ORIGINS.map((origin) => (
        <link key={origin} rel="dns-prefetch" href={origin} />
      ))}

      {/* The queues, inline and synchronous, ahead of the loader. A plain
          script rather than next/script: `beforeInteractive` is what this
          wants, but it is only honoured in the root layout's own tree and the
          linter still reads the rule as pages-router only. Inline, at the end
          of the body, it runs as the document is parsed either way, which is
          long before anything can push an event. */}
      <script dangerouslySetInnerHTML={{ __html: queues }} />
      <Script id="zan-tag-loader" strategy="afterInteractive">
        {loader}
      </Script>

      {/* Without JavaScript the loader never runs, so each tag gets the plain
          request its container accepts instead. */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_PARTNER_ID}&fmt=gif`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>

      <ContactClicks />
    </>
  );
}
