import { industriesIntro } from "@/constants/zan";
import { SectionHeading } from "@/components/zan/ui/SectionHeading";

const BRACKETS = [
  { className: "left-5 top-7 sm:left-7", rotate: 0 },
  { className: "right-5 top-7 sm:right-7", rotate: 90 },
  { className: "bottom-7 right-5 sm:right-7", rotate: 180 },
  { className: "bottom-7 left-5 sm:left-7", rotate: 270 },
];

/**
 * The carousel's title block, on paper: a faint dot grid, a hairline and
 * corner brackets behind the heading.
 */
export function IndustriesIntro() {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden px-5 pb-[clamp(2.5rem,1.5rem+3vw,4.5rem)] pt-section text-center">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(color-mix(in oklab, var(--color-ink) 10%, transparent) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage: "radial-gradient(ellipse at center, black 25%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 78%)",
          }}
        />
        <span
          className="absolute inset-y-[18%] left-[clamp(1.25rem,4vw,3rem)] hidden w-px sm:block"
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
    </div>
  );
}
