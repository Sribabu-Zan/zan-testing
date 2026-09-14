# Zan Services company page: section builder brief

## ⚠ Direction update from the user (overrides anything below)

1. **The content source is now the old zanservices.com** (`/Users/sribabu/Documents/work/vite-react-shift/src`) wherever it has copy, with the production site's data as the second source. `constants/zan.ts` has been rewritten to match, so re-read it.
2. **Every page is a route of this site.** Services, the sixteen service pages, portfolio, how we work, about, pricing, contact and the five policies all live under `app/`. Nothing links to the main app (only the chat API is proxied to it, in `next.config.ts`). The rule for hrefs from constants:
   - One that starts with `/` is a page of this site, used as written. Render it with `SiteLink` / `SiteButtonLink` (`@/components/zan/services/SiteLinks`) or `ButtonLink`, which navigate with `next/link`.
   - `#…` is an anchor on the homepage. `useSiteHref()` from `@/lib/useSiteHref` turns it into `/#…` on any other page; `SiteLink` does that for you. A page's own anchor is written directly with `ButtonLink`.
   - `@/lib/links` must stay free of React: server components import it.
   - `waLink(number, brandName)` builds WhatsApp links, and `useRegion().whatsapp` is the number.
3. **Never use "small team"**, and no "small on purpose" or similar framing.
4. **Nothing may look AI-generated.**
   - Visuals:
     - no sparkle/✨/magic icons
     - no decorative glow blobs, radial haze or aurora gradients
     - no gradient text scattered around (at most one accent per view)
     - no glassmorphism by default
     - no emoji
   - Copy:
     - no em dashes (—) in visible copy
     - no clever aphorisms or filler adjectives ("seamless", "cutting-edge", "curated", "empower", "elevate")
   - Aim for restrained, editorial, human, specific.
5. **Four major items.** Development, Digital Marketing, Blockchain & Web3 and Designing are the client's grouping for the services dial. See `pillars` / `pillarsIntro`.
6. **The hero is now the old site's hero, in parallax.** A dedicated builder owns `Hero.tsx`. The frame-to-fullscreen board has moved to `Board.tsx`.

This project was Rohith Pranov's personal cinematic portfolio. It is being turned into the Zan Services company page. The work runs on the local branch `zan-company-page`; the original is untouched on `main`.

**What stays:** the reference's scroll animations. That means pinned GSAP chapter cards, the story-scroll deck, the warp portal, the parallax wall, the scroll-morph ring, the fold, the tilted grid, the zoom parallax and light rays. Techniques from `../../Apple_Website` are added too: the pinned 3D laptop spin, scrubbed text, the rising masonry and the logo mask zoom.

**What changes:**
- All content is Zan's.
- The theme is light only.
- The page gains a company navbar and calls to action.

The page should feel just as animated as the reference, while reading as a credible B2B company site.

## The page, top to bottom

`app/page.tsx` fixes the order. Each section is one component in `components/zan/sections/*.tsx`, and each currently exists as a stub. The navbar, footer, preloader and scroll progress bar are in `components/zan/shell/*`.

## Non-negotiables

1. **Zan content only**, from `@/constants/zan`. Read it before designing.
   - Never invent a number, testimonial, client, team member or quote.
   - Never reuse the reference's copy. That rules out "Chapter 01 — Who I Am", "Think. Build. Ship.", "Built Different", "Come Alive" and every other personal line.
   - If you need a label that is not in constants, keep it short and factual, for example "Case studies" or "Scroll".
   - Photos in `/images/professional/*` are stock stand-ins. Use them only as sector imagery paired with a case study (the `screenshot` field) or decoratively (`alt=""`). Never caption them "our team", "our office" or a real screenshot.
   - Client logos (`/images/clients/*`) always sit on a white plate, as supplied. Never tint them, grey them out or filter them.
2. **Nothing personal or third-party ships.**
   - Do not import from, or copy assets out of, anything that was deleted, and do not use remote images.
   - Do not use Spline, `unsplash`, `aceternity.com` assets or CDNs. Every asset lives in `/public`.
   - If a file you own still contains personal data (Rohith, KodaiRateIQ, ProofStack, Design_img paths and so on), remove it.
3. **Light theme, tokens only.** No hex colours in components, with two narrow exceptions:
   - neutral pure white or black shadows written as `rgb(… / a)`;
   - the WebGL fallback values that `@/lib/region` already handles.

   The tokens, as Tailwind classes:

   | Class | Use |
   |---|---|
   | `bg-bg`, `bg-surface`, `bg-surface-2`, `bg-paper` (#f5f0e8, warm, the same in every region) | Grounds |
   | `text-ink`, `text-ink-2`, `text-muted` | Text |
   | `border-line`, `border-line-strong` | Hairlines |
   | `bg-brand` | Brand fill |
   | `text-brand-ink` | Accent text on light grounds. **Never `text-brand` for text.** |
   | `bg-brand-soft` | Pale tint |
   | `text-on-brand` | Anything placed on a brand fill: white in India, near-black in the UAE and US. **Never hard-code white on a brand fill.** |

   Utilities: `bg-brand-gradient`, `text-brand-gradient`, `bg-brand-wash`, `bg-brand-veil` and `border-brand-gradient-t`.
   - For translucency use `bg-brand/15` or `color-mix(in oklab, var(--color-brand) 15%, transparent)`.
   - Never concatenate `${hex}55`.
4. **Three regions.** India is violet (the default), the UAE gold and the US vermilion. The palette swaps through `html[data-region]`, and the navbar has a switcher.
   - Every colour must follow the region, so test by running `document.documentElement.dataset.region='ae'` in the console.
   - WebGL, canvas and three.js cannot read `var()`. Use `const p = useBrandPalette()` from `@/lib/region`, which returns hex strings and re-renders on a switch.
   - `useRegion()` gives the region's brand name, logo and office (with phone).
5. **Reduced motion.**
   - Build every GSAP scene inside `gsap.matchMedia()` using `MQ.motion` from `@/lib/gsap`, so it reverts to a static, complete, readable layout for `prefers-reduced-motion: reduce`.
   - Nothing may stay at opacity 0.
   - Framer Motion is already covered globally by `<MotionConfig reducedMotion="user">`, but anything you animate with `style={{ opacity }}` or `useTransform` is not, so gate it.
   - Canvas and R3F loops must not run.
6. **SEO and accessibility.**
   - Real headings (`h2`/`h3`), lists and links in the server HTML.
   - Canvases and decorative layers get `aria-hidden`.
   - Interactive things are keyboard reachable with a visible focus ring.
   - The page's single `h1` belongs to the Hero.
7. **Performance.**
   - Heavy things are `next/dynamic(..., { ssr: false })` and mount only when near the viewport: three.js, R3F, ogl and the GLB.
   - They pause off-screen and are desktop-only unless cheap.
   - No new npm packages. If you think you need one, say so in your report instead.
   - Available: `gsap` (import from `@/lib/gsap`), `@gsap/react`, `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, `ogl`, `lenis`, `lucide-react`.
8. **Mobile (390×844, and down to 360px).**
   - No horizontal overflow, readable type, no clipped headings, and every call to action is tappable.
   - Pins are allowed on touch but should be shorter. Anything too heavy gets a static mobile layout.
   - Native touch scroll is kept: Lenis only smooths the wheel.
9. **Layering.**
   - The fixed navbar is `h-nav` (4.5rem) tall at `z-50`. Keep a pinned stage's key content clear of the top 72px.
   - Keep your sections below `z-40`.
   - Anything that scrolls inside itself needs `data-lenis-prevent`.
10. **React 19 + React Compiler lint** (eslint-config-next core-web-vitals).
    - Never set state synchronously inside an effect.
    - Never read or write `ref.current` during render.
    - No `Math.random()`/`Date.now()` in render; seed from the index instead.
    - Never mutate a value returned by a hook.
    - `npx eslint <your files>` must report 0 errors.
11. **Next 16.** Read `node_modules/next/dist/docs/` before using a Next API you are unsure of (`next/dynamic`, `next/image`).

## Shared pieces (owned by the lead; use them, do not edit them)

| Piece | Where | Notes |
|---|---|---|
| Content | `@/constants/zan` | Every piece of copy and data |
| Region hooks | `@/lib/region` | `useRegion`, `useRegionId`, `useBrandPalette`, `setRegion` |
| GSAP | `@/lib/gsap` | `gsap`, `ScrollTrigger`, `MQ` |
| Buttons | `@/components/zan/ui/Button` | `ButtonLink` / `Button`: variants `primary` \| `secondary` \| `onBrand` \| `ghost`, sizes `md` \| `lg`, plus `icon` and `arrow` props |
| Eyebrow | `@/components/zan/ui/Eyebrow` | Mono caps label with an accent dot; use `tone="current"` on brand fills |
| SectionHeading | `@/components/zan/ui/SectionHeading` | Eyebrow, then a Cinzel heading whose lines rise out of masks, then a lead |
| Icons | `@/components/zan/ui/icons` | `<ZanIcon name="code" />`, keyed by the `icon` fields in constants |
| Logo | `@/components/zan/ui/ZanLogo` | The region's real lockup |
| Class helper | `cn` from `@/lib/utils` | |
| Everything else | `app/globals.css`, `app/layout.tsx`, `app/page.tsx` | Owned by the lead |

If you need a change in any of these, put it in your final report; do not edit them. Other builders are working in parallel on other files, and simultaneous edits to one file clobber each other.

Put component-specific CSS (keyframes and anything else Tailwind cannot express) in a co-located `.css` file imported by your component. Prefix its class names with your section, for example `.zan-deck-…`.

## Typography language

| Style | Classes | Use |
|---|---|---|
| Section headings | `font-display` (Cinzel) at `text-h1`/`text-h2`, or use `SectionHeading` | Section headings |
| Chapter labels and deck headlines | `font-sans font-bold uppercase text-giant` (0.9 leading, tight tracking) | The reference's big grotesk statements |
| Eyebrows and indices | `font-mono text-eyebrow uppercase` | Eyebrows and indices |
| Body | `text-lead` / `text-body` in `text-ink-2` | Body copy |
| Surfaces | `rounded-2xl`/`rounded-3xl`, 1px `border-line`, `shadow-lift` / `shadow-float` | Cards and panels; no heavy black shadows |
| Motion | `ease-out-expo` or GSAP `power3.out` / `expo.out` | Confident, not bouncy |

## How to verify

The dev server is already running at http://localhost:5174 (`next dev`, HMR).
- Do not start or stop servers.
- Do not run `next build`.

Checks:
- `npx tsc --noEmit`: only your files need to be clean. Other builders' files may be mid-edit.
- `npx eslint <your files>`: 0 errors.
- Screenshots, at 1440×900 and `--mobile` (390×844), at several points through your section. Look at every one with the Read tool.
  - Also run once with `--reduced-motion`.
  - Also check with the region switched to `ae`, using `--eval "document.documentElement.dataset.region='ae'"`, or by clicking the switcher once the navbar exists.

```
S=/private/tmp/claude-501/-Users-sribabu-Documents-work-zan-webdevelopment/73ab9363-c2cd-4c32-ad1e-54f39aafa479/scratchpad
node $S/shot.mjs --list                                     # every [id]: top and height
node $S/shot.mjs --selector "#your-id" --fractions 0,0.25,0.5,0.75,1 --out $S/<you>/desk
node $S/shot.mjs --mobile --selector "#your-id" --fractions 0,0.5,1 --out $S/<you>/mob
```

The script prints console errors. Treat any error from your files as a bug.

## Your final report (your last message)

- Which files you created, changed or deleted.
- What a visitor sees, desktop and mobile.
- How it behaves with reduced motion.
- What you verified, with screenshot paths and lint/tsc results.
- Anything left unfinished, and any change you need from the lead.
