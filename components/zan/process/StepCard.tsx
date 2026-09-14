import type { ProcessStep } from "@/constants/zan";
import { cn } from "@/lib/utils";
import { StepIllustration } from "./StepIllustration";

/**
 * One stage of the process: index, title, description, deliverables. Used
 * both around the laptop (as a floating box) and in the timeline.
 */
export function StepCard({
  step,
  illustration = false,
  active = false,
  dim = false,
  className,
}: {
  step: ProcessStep;
  illustration?: boolean;
  /** The stage the laptop is showing. */
  active?: boolean;
  /** A stage already passed. */
  dim?: boolean;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-3xl border bg-bg p-6 transition-[box-shadow,border-color] duration-500 ease-out-expo",
        active ? "border-brand/40 shadow-float" : "border-line shadow-lift",
        className,
      )}
    >
      {/* A passed stage fades its content, not its card, so nothing behind shows through. */}
      <div className={cn("transition-opacity duration-500 ease-out-expo", dim && "opacity-55")}>
      {illustration && (
        <div className="mb-5 rounded-2xl border border-line bg-surface p-4">
          <div className="mx-auto max-w-[20rem]">
            <StepIllustration id={step.id} />
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="font-mono text-eyebrow text-brand-ink">{step.index}</span>
        <span aria-hidden="true" className={cn("h-px flex-1", active ? "bg-brand/40" : "bg-line")} />
      </div>
      <h3 className="mt-3 text-h3 text-ink">{step.title}</h3>
      <p className="mt-2 text-small text-ink-2">{step.description}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`${step.title}: deliverables`}>
        {step.deliverables.map((d) => (
          <li key={d} className="rounded-full bg-brand-soft px-2.5 py-1 text-[0.75rem] leading-snug text-brand-ink">
            {d}
          </li>
        ))}
      </ul>
      </div>
    </article>
  );
}
