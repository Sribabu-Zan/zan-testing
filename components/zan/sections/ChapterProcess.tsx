import { chapters } from "@/constants/zan";
import { ScrollFoldTransition } from "@/components/animations/ScrollFoldTransition";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";

/**
 * Chapter 03 — the reference's page fold, on paper: the page hinges open
 * around the chapter label, then the Process section swings up behind it.
 */
export function ChapterProcess() {
  const c = chapters.process;
  return (
    <ScrollFoldTransition
      label={
        <div className="flex flex-col items-center">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <p className="mt-6 font-sans text-giant font-bold uppercase text-ink">
            {c.label.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </p>
        </div>
      }
    />
  );
}
