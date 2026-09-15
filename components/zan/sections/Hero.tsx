import type { CSSProperties } from "react";
import { Phone } from "lucide-react";
import { HeroActions } from "@/components/zan/opening/HeroActions";
import { HeroScene } from "@/components/zan/opening/HeroScene";
import { Typewriter } from "@/components/zan/opening/Typewriter";
import { hero, metrics, regionOrder, regions, type Metric, type RegionId } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   HERO — the old zanservices.com hero, word for word, as a parallax scene.

   A server component: the badge, the h1, the subtitle, the phone number and
   the figures are all in the server HTML. The h1 is the page's only h1 and
   its LCP element. Its entrance moves and focuses the words (transform and
   blur only, never opacity), so the text is painted from the first frame and
   counts as the LCP at once; the typewriter takes over after hydration.

   Type: Bricolage Grotesque (font-hero), heavy and slightly condensed, so the
   headline has a voice of its own rather than the default system sans.

   Regional details: the subtitle's owner word and the phone number are
   rendered once per distinct value and html[data-region] shows the right one
   (opening.css), so they are correct from the first paint in every region.
   The two calls to action resolve their hrefs from the region hooks.
   ─────────────────────────────────────────────────────────────────────────── */

/** Regions grouped by a shared value — India and the UAE share "Kolkata's". */
function groupRegions<T>(pick: (id: RegionId) => T, key: (value: T) => string) {
  const groups = new Map<string, { value: T; ids: RegionId[] }>();
  for (const id of regionOrder) {
    const value = pick(id);
    const k = key(value);
    const group = groups.get(k);
    if (group) group.ids.push(id);
    else groups.set(k, { value, ids: [id] });
  }
  return [...groups.values()];
}

const OWNERS = groupRegions(
  (id) => regions[id].heroOwner,
  (owner) => owner,
);
const PHONES = groupRegions(
  (id) => regions[id].office,
  (office) => office.phoneTel,
);

/** The h1's stable accessible name: every typed word, said once. */
const words = hero.typingWords;
const TYPED_NAME = `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;

/** The three figures under the calls to action (constants: metrics). */
const STATS = (["projects", "clients", "rating"] as const)
  .map((id) => metrics.find((m) => m.id === id))
  .filter((m): m is Metric => Boolean(m));

/**
 * The subtitle's emphasis, resolved once. Only the FIRST accent phrase gets
 * the brand colour: three violet phrases in two lines is scattered emphasis
 * and fights the headline.
 */
let accents = 0;
const SUBTITLE = hero.subtitle.map((part) => {
  const accent = "accent" in part && part.accent;
  if (accent) accents += 1;
  return {
    text: part.text,
    className: accent && accents === 1 ? "font-semibold text-brand-ink" : undefined,
  };
});

/** Shorter labels than the metrics carry, so the row stays one line each. */
const STAT_LABEL: Record<string, string> = {
  projects: "Projects delivered",
  clients: "Clients worldwide",
  rating: "Client rating",
};

const delay = (d: number) => ({ "--zan-d": d }) as CSSProperties;

export function Hero() {
  const lead = hero.headlineLead.split(" ");

  return (
    <HeroScene>
      <p
        data-reveal
        className="zan-hero-in inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-bg/80 px-3.5 py-1.5 text-[0.8125rem] leading-snug font-medium text-ink-2 shadow-lift sm:px-4 sm:text-small"
        style={delay(0)}
      >
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand" />
        <span className="hidden sm:inline">{hero.badge}</span>
        <span className="sm:hidden">{hero.badgeShort}</span>
      </p>

      <h1
        id="hero-title"
        className="mt-6  text-[clamp(2.25rem,0.8rem+5.4vw,5.25rem)] leading-[0.95] font-extrabold tracking-[-0.042em] text-ink [font-stretch:92%] sm:mt-7"
      >
        <span className="block">
          {lead.map((word, i) => (
            <span key={word}>
              <span className="zan-hero-word" style={{ "--zan-w": i } as CSSProperties}>
                {word}
              </span>
              {i < lead.length - 1 && " "}
            </span>
          ))}
        </span>{" "}
        <span className="sr-only">{TYPED_NAME}</span>
        <span className="zan-hero-word block" style={{ "--zan-w": lead.length } as CSSProperties}>
          <Typewriter words={words} />
        </span>
      </h1>

      <p
        data-reveal
        className="zan-hero-in mx-auto mt-6 max-w-[36rem] text-[1.0625rem] leading-relaxed text-pretty text-ink-2 sm:mt-7 sm:text-[1.1875rem] lg:mx-0"
        style={delay(1)}
      >
        {OWNERS.map(({ value, ids }) => (
          <span key={value} data-hero-only={ids.join(" ")}>
            {value}
          </span>
        ))}
        {SUBTITLE.map((part, i) => (
          <span key={i} className={part.className}>
            {part.text}
          </span>
        ))}
      </p>

      <div data-reveal className="zan-hero-in mt-7 flex justify-center sm:mt-8 lg:justify-start" style={delay(2)}>
        {PHONES.map(({ value: office, ids }) => (
          <a
            key={office.phoneTel}
            data-hero-only={ids.join(" ")}
            href={`tel:${office.phoneTel}`}
            className="group inline-flex h-11 items-center gap-2.5 rounded-full border border-line pr-4 pl-1.5 text-[0.9375rem] font-semibold text-ink tabular-nums transition-colors duration-300 ease-out-expo hover:border-line-strong sm:h-12 sm:pr-5 sm:text-base"
          >
            <span className="grid size-8 place-items-center rounded-full bg-brand-soft text-brand-ink sm:size-9">
              <Phone aria-hidden="true" className="size-3.5 sm:size-4" strokeWidth={2.25} />
            </span>
            <span className="sr-only">Call </span>
            {office.phoneDisplay}
          </a>
        ))}
      </div>

      <div
        data-reveal
        className="zan-hero-in mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 lg:justify-start"
        style={delay(3)}
      >
        <HeroActions />
      </div>

      {/* The company in three figures, under a hairline. */}
      <dl
        data-reveal
        className="zan-hero-in mx-auto mt-9 grid max-w-[27rem] grid-cols-3 border-t border-line pt-5 sm:mt-10 lg:mx-0 lg:max-w-full"
        style={delay(4)}
      >
        {STATS.map((m, i) => (
          <div
            key={m.id}
            className={
              "flex flex-col-reverse items-center justify-end gap-1 px-2 lg:items-start " +
              (i > 0 ? "border-l border-line lg:pl-5" : "lg:pl-0")
            }
          >
            <dt className="text-center text-[0.75rem] leading-snug text-muted lg:text-left">
              {STAT_LABEL[m.id] ?? m.label}
            </dt>
            <dd className="font-hero text-[1.625rem] leading-none font-bold tracking-[-0.03em] text-ink tabular-nums [font-stretch:92%] sm:text-[1.875rem]">
              {m.value}
            </dd>
          </div>
        ))}
      </dl>
    </HeroScene>
  );
}
