"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { Star } from "lucide-react";
import { gsap, MQ } from "@/lib/gsap";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";
import { TechMarquee } from "@/components/zan/work/TechMarquee";
import { metrics, metricsIntro, site, type Metric } from "@/constants/zan";
import { cn } from "@/lib/utils";

/* ───────────────────────────────────────────────────────────────────────────
   METRICS (#metrics) — Apple's "highlights" masonry: two columns that start
   slightly raised and transparent and settle into place, one after the other,
   as the section arrives. Each figure counts up from zero keeping its suffix
   ("+", "%", " hrs") and decimals ("4.9"); the final value is always in the
   DOM for screen readers, and is what shows with reduced motion or no JS.
   Under the masonry: the stack caption over a text marquee.
   ─────────────────────────────────────────────────────────────────────────── */

type Parsed = { prefix: string; target: number; suffix: string; decimals: number; grouped: boolean };

function parseValue(value: string): Parsed | null {
  const m = value.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const [, prefix, num, suffix] = m;
  return {
    prefix,
    target: Number.parseFloat(num.replace(/,/g, "")),
    suffix,
    decimals: num.includes(".") ? num.split(".")[1].length : 0,
    grouped: num.includes(","),
  };
}

function formatValue(p: Parsed, n: number) {
  const body = n.toLocaleString("en-US", {
    minimumFractionDigits: p.decimals,
    maximumFractionDigits: p.decimals,
    useGrouping: p.grouped,
  });
  return `${p.prefix}${body}${p.suffix}`;
}

type Tone = "paper" | "surface" | "brand" | "soft" | "plain";

const TONE: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  surface: "bg-surface text-ink",
  brand: "bg-brand-gradient text-on-brand border-transparent",
  soft: "bg-brand-soft text-ink border-transparent",
  plain: "bg-bg text-ink border-line-strong",
};

/** How each figure is set: its column, ground and any extra visual. */
const LAYOUT: Record<string, { col: 0 | 1; tone: Tone; tall?: boolean }> = {
  projects: { col: 0, tone: "paper", tall: true },
  rating: { col: 0, tone: "surface" },
  clients: { col: 1, tone: "brand" },
  "on-time": { col: 1, tone: "soft" },
  response: { col: 1, tone: "plain" },
};

function Stars({ value }: { value: string }) {
  const share = Math.min(1, Math.max(0, Number.parseFloat(value) / 5));
  const row = (cls: string) => (
    <span className="flex gap-1.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn("size-6 shrink-0 lg:size-7", cls)} strokeWidth={1.5} />
      ))}
    </span>
  );
  return (
    <span aria-hidden="true" className="relative mt-6 inline-flex">
      {row("fill-line stroke-line-strong")}
      <span data-stars className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${share * 100}%` }}>
        {row("fill-brand stroke-brand")}
      </span>
    </span>
  );
}

function Bar({ value }: { value: string }) {
  const share = Math.min(1, Math.max(0, Number.parseFloat(value) / 100));
  return (
    <span aria-hidden="true" className="mt-6 block h-2 w-full overflow-hidden rounded-full bg-bg">
      <span data-bar className="block h-full rounded-full bg-brand" style={{ width: `${share * 100}%` }} />
    </span>
  );
}

function Tile({ m, index }: { m: Metric; index: number }) {
  const layout = LAYOUT[m.id] ?? { col: 1, tone: "surface" };
  const onBrand = layout.tone === "brand";
  let extra: ReactNode = null;
  if (m.id === "rating") extra = <Stars value={m.value} />;
  if (m.id === "on-time") extra = <Bar value={m.value} />;

  return (
    <div
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-3xl border border-line p-7 sm:p-9 lg:p-10",
        TONE[layout.tone],
        layout.tall ? "min-h-[20rem] lg:min-h-[32rem] lg:flex-1" : "min-h-[13rem] lg:min-h-[15rem]",
      )}
    >
      {layout.tall && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={
            {
              backgroundImage:
                "radial-gradient(color-mix(in oklab, var(--color-brand) 30%, transparent) 1.3px, transparent 1.6px)",
              backgroundSize: "18px 18px",
              maskImage: "linear-gradient(180deg, var(--color-ink) 0%, transparent 62%)",
            } as CSSProperties
          }
        />
      )}
      <span className={cn("font-mono text-eyebrow", onBrand ? "text-on-brand/80" : "text-muted")}>
        {String(index + 1).padStart(2, "0")}
      </span>

      <p
        className={cn(
          "mt-auto pt-8 font-sans font-bold leading-[0.88] tracking-[-0.045em] tabular-nums",
          layout.tall ? "text-[clamp(4.5rem,2.4rem+7vw,9rem)]" : "text-[clamp(3.25rem,2rem+4vw,5.5rem)]",
        )}
      >
        <span className="sr-only">{m.value}</span>
        <span aria-hidden="true" data-count={m.value}>
          {m.value}
        </span>
      </p>
      <h3 className="mt-4 text-h3 font-semibold">{m.label}</h3>
      <p className={cn("mt-1 text-body", onBrand ? "text-on-brand/85" : "text-ink-2")}>{m.detail}</p>
      {extra}
    </div>
  );
}

export function Metrics() {
  const root = useRef<HTMLElement>(null);
  const masonry = useRef<HTMLDivElement>(null);

  // Numbered in reading order — down the left column, then the right — which
  // is also the order the columns stack in on a phone.
  const grouped: Metric[][] = [[], []];
  metrics.forEach((m) => grouped[LAYOUT[m.id]?.col ?? 1].push(m));
  let n = 0;
  const columns = grouped.map((col) => col.map((m) => ({ m, index: n++ })));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const cols = gsap.utils.toArray<HTMLElement>("[data-col]");
        const counters = gsap.utils
          .toArray<HTMLElement>("[data-count]")
          .map((el) => ({ el, p: parseValue(el.dataset.count ?? "") }));
        const bars = gsap.utils.toArray<HTMLElement>("[data-bar]");
        const stars = gsap.utils.toArray<HTMLElement>("[data-stars]");

        counters.forEach(({ el, p }) => {
          if (p) el.textContent = formatValue(p, 0);
        });
        gsap.set(bars, { scaleX: 0, transformOrigin: "0% 50%" });
        gsap.set(stars, { clipPath: "inset(0% 100% 0% 0%)" });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: masonry.current, start: "top 78%", once: true },
        });

        tl.fromTo(
          cols,
          { y: -24, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.5, duration: 1, ease: "power1.inOut" },
          0,
        );

        counters.forEach(({ el, p }) => {
          if (!p) return;
          const col = Math.max(0, cols.indexOf(el.closest("[data-col]") as HTMLElement));
          const o = { v: 0 };
          tl.to(
            o,
            {
              v: p.target,
              duration: 1.6,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = formatValue(p, o.v);
              },
            },
            0.2 + col * 0.5,
          );
        });

        // The star fill wipes in (a scale would squash the stars); the bar grows.
        tl.to(stars, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "power2.out" }, 0.2);
        tl.to(bars, { scaleX: 1, duration: 1.6, ease: "power2.out" }, 0.7);

        // Revert: put the final figures back.
        return () => {
          counters.forEach(({ el }) => {
            el.textContent = el.dataset.count ?? "";
          });
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="metrics" className="relative overflow-clip bg-bg py-section">
      <div className="container-zan">
        <SectionHeading eyebrow={site.name} title={[metricsIntro.eyebrow]} lead={site.tagline} align="center" />

        <div ref={masonry} className="mt-14 grid gap-5 lg:mt-20 lg:grid-cols-2">
          {columns.map((col, c) => (
            <div key={c} data-col className="flex flex-col gap-5">
              {col.map(({ m, index }) => (
                <Tile key={m.id} m={m} index={index} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <TechMarquee className="mt-20 lg:mt-28" />
    </section>
  );
}
