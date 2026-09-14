# Zan Services — company page

A light-theme, scroll-driven company page for Zan Services. It covers the three practices (Development, Digital Marketing and Designing), the work, the process and the three offices, told through pinned, cinematic scroll scenes.

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, GSAP + ScrollTrigger, Framer Motion, Lenis, three.js / React Three Fiber and ogl.

## Status

- **The Zan Services homepage**, built in this repository.
- **Hidden from search engines** (`robots: noindex` in `app/layout.tsx`), so it cannot compete with zanservices.com. Remove that setting when this page replaces the production homepage.
- **Every line of copy and every figure** comes from the production Zan site (`zan_webdevelopment/src/data`), collected in one file: `constants/zan.ts`. The deliberate deviations are documented in comments there.

## Run

```bash
npm install
npx next dev -p 5174      # http://localhost:5174
npx next build && npx next start -p 5174
```

## Structure

| Path | What it holds |
|---|---|
| `app/layout.tsx` | Fonts, the region restore script and the shell (preloader, scroll progress, navbar, footer, cursor, smooth scroll) |
| `app/page.tsx` | The section order, with a map of every scene |
| `app/globals.css` | Design tokens and the three region palettes. The light theme is the only theme. |
| `constants/zan.ts` | All content. Sections never hard-code copy. |
| `lib/region.ts` | Region hooks: `useRegion`, `useBrandPalette` (hex values for WebGL) and `setRegion` |
| `lib/gsap.ts` | GSAP, ScrollTrigger and the shared `MQ` media conditions |
| `components/zan/sections/` | One component per section |
| `components/zan/shell/` | Navbar, mega menu, mobile menu, region switcher, preloader, footer |
| `components/zan/ui/` | Shared buttons, eyebrow, section heading, icons, logo |
| `components/animations/`, `components/ui/` | The scroll scenes |
| `ZAN_BRIEF.md` | The rules anyone editing a section follows |

## Regions

`<html data-region="in" | "ae" | "us">` switches the whole palette:

| Region | Accent |
|---|---|
| India | Violet |
| UAE | Gold |
| US | Vermilion |

Changing region also swaps the brand name and logo (the UAE entity trades as Zan Verse Technology) and the tap-to-call office. The navbar switcher sets it, and it is remembered in `localStorage`.

## Motion and accessibility

- **Reduced motion.** Every GSAP scene is built inside `gsap.matchMedia()` and falls back to a static, complete layout for `prefers-reduced-motion`. Framer Motion follows `<MotionConfig reducedMotion="user">`. Lenis is not created at all.
- **Content stays in the DOM.** Headings, lists and links are server-rendered. Canvases are decorative and `aria-hidden`.

## Known follow-up: the hero's 3D mark

The interactive three.js mark is extruded from `/images/hero/zan-mark.svg`, which is a **raster trace**: 1,948 paths and 1,086 slightly different fills for what is a seven-shape logo. Shape identity is already lost in that file, which costs two small fidelity gaps:

- The two mid-blue diamonds at the mark's centre render in the plates' navy. Their outlines trace lighter than their interiors, so colouring them separately drew hollow rings across the white channel, which looked worse.
- The orange lens keeps a faint stipple where its many traced shards overlap, reduced but not removed by giving each shard its own depth.

Both disappear with a clean vector of the logo: seven paths, seven flat fills. Then each part is one shape with one colour and the colour bucketing in `ZanMark3D.tsx` can go entirely. The geometry work around it (light smoothing, a small bevel, eight curve segments) is correct and carries over unchanged. The flat SVG remains the fallback and is pixel-accurate today.

## Third-party notices

Attribution for the code and assets this page builds on is kept in [NOTICE.md](NOTICE.md). Read it before publishing.
