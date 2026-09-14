import { ScrollWarpPortal } from "@/components/animations/ScrollWarpPortal";
import { Eyebrow } from "@/components/zan/ui/Eyebrow";
import { chapters } from "@/constants/zan";

/**
 * Chapter 02 — the warp portal. A pinned tunnel of frames rushes past, the
 * label warps in and dissolves, and the stage flashes to white so the work
 * wall below picks up seamlessly. Reduced motion: a static label band.
 */
export function ChapterWork() {
  const c = chapters.work;
  return (
    <ScrollWarpPortal
      ariaLabel={`${c.eyebrow}: ${c.label.join(" ")}`}
      label={
        <div className="flex flex-col items-center gap-6 text-center">
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <p className="font-sans text-giant font-bold uppercase text-ink">
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
