import { industriesIntro } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";

const BRACKETS = [
  { className: "left-5 top-7 sm:left-7", rotate: 0 },
  { className: "right-5 top-7 sm:right-7", rotate: 90 },
  { className: "bottom-7 right-5 sm:right-7", rotate: 180 },
  { className: "bottom-7 left-5 sm:left-7", rotate: 270 },
];

/**
 * The tilted grid's title card, on paper: a faint dot grid, a hairline and
 * corner brackets, then the heading and a scroll cue.
 */
export function IndustriesIntro() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-5 py-section text-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(color-mix(in oklab, var(--color-ink) 10%, transparent) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          }}
        />
        <span
          className="absolute inset-y-[12%] left-[clamp(1.25rem,4vw,3rem)] hidden w-px sm:block"
          style={{
            backgroundImage:
              "linear-gradient(180deg, transparent 0%, var(--color-line-strong) 20%, var(--color-line-strong) 80%, transparent 100%)",
          }}
        />
        {BRACKETS.map((b) => (
          <svg
            key={b.rotate}
            width="18"
            height="18"
            viewBox="0 0 18 18"
            className={`absolute text-brand-ink opacity-50 ${b.className}`}
            style={{ transform: `rotate(${b.rotate}deg)` }}
          >
            <path d="M1 7 L1 1 L7 1" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="square" />
          </svg>
        ))}
      </div>

      <SectionHeading
        align="center"
        eyebrow={industriesIntro.eyebrow}
        title={industriesIntro.title}
        lead={industriesIntro.lead}
        className="relative"
      />

      <div aria-hidden="true" className="relative mt-12 flex flex-col items-center gap-3.5">
        <span className="font-mono text-[0.6875rem] font-medium uppercase tracking-[0.42em] text-muted">Scroll</span>
        <span className="relative h-12 w-px overflow-hidden bg-line-strong">
          <span
            className="zan-ind-line absolute inset-x-0 top-0 h-2/5"
            style={{ backgroundImage: "linear-gradient(180deg, transparent 0%, var(--color-brand) 50%, transparent 100%)" }}
          />
        </span>
        <svg viewBox="0 0 16 16" className="zan-ind-bounce size-3.5 text-brand-ink">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    </div>
  );
}
