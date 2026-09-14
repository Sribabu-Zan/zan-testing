"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import type { Project } from "@/constants/zan";
import { ScrollTrigger } from "@/lib/gsap";
import { ProjectArt } from "@/components/zan/work/ProjectArt";
import { cn } from "@/lib/utils";
import "@/components/zan/work/work.css";

/* ───────────────────────────────────────────────────────────────────────────
   CASE-STUDY LIST — the reference's hover list, carrying the five projects as
   editorial rows.

   · Each row is an accordion button (one open at a time, aria-expanded) that
     reveals challenge, solution, the four results and the stack. The detail
     is in the server HTML either way; closed rows are `inert`.
   · Desktop with a mouse (and motion allowed): a preview of the project's
     image — or its generated art — follows the cursor over the row titles.
     The position is eased in a rAF loop that writes the transform straight
     to the element, so the cursor never re-renders React (the reference set
     state every frame and read refs during render).
   · Anywhere else the image sits inline at the top of the opened row.
   · Links anywhere on the page to #case-<id> open that row; so does the URL
     hash on arrival.
   ─────────────────────────────────────────────────────────────────────────── */

const noopSubscribe = () => () => {};

function ProjectMedia({ project, sizes }: { project: Project; sizes: string }) {
  return project.screenshot ? (
    <Image src={project.screenshot.src} alt="" fill sizes={sizes} className="object-cover" />
  ) : (
    <ProjectArt project={project} className="absolute inset-0" />
  );
}

const PREVIEW_W = 320;
const PREVIEW_H = 208;

export function ProjectShowcase({ projects }: { projects: readonly Project[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const baseId = useId();

  const listRef = useRef<HTMLOListElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ tx: 0, ty: 0, x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  // Open a row from any #case-<id> link on the page, or from the URL hash.
  useEffect(() => {
    const openFromHash = (hash: string) => {
      const id = hash.startsWith("#case-") ? hash.slice("#case-".length) : "";
      if (id && projects.some((p) => p.id === id)) setOpen(id);
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a[href^="#case-"]');
      if (link) openFromHash(link.getAttribute("href") ?? "");
    };
    const onHash = () => openFromHash(window.location.hash);

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHash);
    const first = requestAnimationFrame(onHash);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHash);
      cancelAnimationFrame(first);
    };
  }, [projects]);

  // An opened row moves everything below it: re-measure the page's scroll
  // scenes once the height settles.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let last = el.offsetHeight;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      const h = el.offsetHeight;
      if (h === last) return;
      last = h;
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      clearTimeout(timer);
    };
  }, []);

  /* ── Cursor preview ─────────────────────────────────────────────────────── */

  const startLoop = () => {
    if (raf.current !== null) return;
    const step = () => {
      const el = previewRef.current;
      if (!el) {
        raf.current = null;
        return;
      }
      const p = pointer.current;
      p.x += (p.tx - p.x) * 0.16;
      p.y += (p.ty - p.y) * 0.16;
      const x = Math.min(p.x + 28, window.innerWidth - PREVIEW_W - 16);
      const y = Math.min(Math.max(p.y - PREVIEW_H / 2, 16), window.innerHeight - PREVIEW_H - 16);
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  const stopLoop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const onListEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const p = pointer.current;
    p.tx = p.x = e.clientX;
    p.ty = p.y = e.clientY;
    startLoop();
  };
  const onListMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    pointer.current.tx = e.clientX;
    pointer.current.ty = e.clientY;
  };
  const onListLeave = () => {
    setHovered(null);
    stopLoop();
  };

  const preview = (
    <div
      ref={previewRef}
      aria-hidden="true"
      className="zan-case-preview pointer-events-none fixed left-0 top-0 z-30 will-change-transform"
    >
      <div
        className={cn(
          "relative h-52 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-float",
          "transition-[opacity,scale] duration-300 ease-out-expo",
          hovered === null ? "scale-90 opacity-0" : "scale-100 opacity-100",
        )}
      >
        {projects.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "absolute inset-0 transition-[opacity,scale] duration-500 ease-out-expo",
              hovered === i ? "scale-100 opacity-100" : "scale-110 opacity-0",
            )}
          >
            <ProjectMedia project={p} sizes="20rem" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <ol
        ref={listRef}
        className="border-t border-line"
        onPointerEnter={onListEnter}
        onPointerMove={onListMove}
        onPointerLeave={onListLeave}
      >
        {projects.map((p, i) => {
          const isOpen = open === p.id;
          const btnId = `${baseId}-btn-${i}`;
          const panelId = `${baseId}-panel-${i}`;
          return (
            <li key={p.id} id={`case-${p.id}`} className="scroll-mt-[calc(var(--spacing-nav)+1.5rem)] border-b border-line">
              <h3>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : p.id)}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(i)}
                  onPointerLeave={() => setHovered(null)}
                  className={cn(
                    "group/row relative isolate grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-x-3 py-6 text-left",
                    "sm:grid-cols-[3rem_1fr_auto] lg:grid-cols-[4rem_1fr_auto_auto] lg:gap-x-8 lg:py-8",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-[-1rem] inset-y-2 -z-10 rounded-2xl bg-surface opacity-0 transition-opacity duration-300 ease-out-expo group-hover/row:opacity-100 lg:inset-x-[-1.5rem]",
                      isOpen && "opacity-100",
                    )}
                  />
                  <span className="self-start pt-[0.45em] font-mono text-eyebrow text-muted">{p.index}</span>
                  <span className="min-w-0">
                    <span className="block text-balance font-sans text-[clamp(1.375rem,0.95rem+2vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-ink transition-colors duration-300 group-hover/row:text-brand-ink">
                      {p.name}
                    </span>
                    <span className="mt-2 block text-small text-ink-2">
                      {p.discipline} · {p.industry}
                      <span className="lg:hidden"> · {p.timeline}</span>
                    </span>
                  </span>
                  <span className="hidden font-mono text-eyebrow uppercase text-muted lg:block">{p.timeline}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid size-10 place-items-center rounded-full border transition-[background-color,border-color,color] duration-300 lg:size-12",
                      isOpen
                        ? "border-transparent bg-brand-gradient text-on-brand"
                        : "border-line-strong bg-bg text-ink group-hover/row:border-ink",
                    )}
                  >
                    <Plus
                      className={cn("size-4 transition-transform duration-500 ease-out-expo", isOpen && "rotate-45")}
                      strokeWidth={2}
                    />
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                inert={!isOpen}
                className={cn(
                  "grid transition-[grid-template-rows] duration-500 ease-out-expo",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="grid gap-8 pb-10 sm:pl-[calc(3rem+0.75rem)] lg:grid-cols-12 lg:gap-x-14 lg:pb-14 lg:pl-[calc(4rem+2rem)]">
                    <div className="zan-case-inline-media relative aspect-[16/9] overflow-hidden rounded-2xl border border-line bg-surface lg:col-span-12">
                      <ProjectMedia project={p} sizes="(min-width: 1024px) 60rem, 100vw" />
                    </div>

                    <div className="space-y-7 lg:col-span-6">
                      <div>
                        <p className="font-mono text-eyebrow uppercase text-brand-ink">Challenge</p>
                        <p className="mt-3 text-body text-ink-2">{p.challenge}</p>
                      </div>
                      <div>
                        <p className="font-mono text-eyebrow uppercase text-brand-ink">Solution</p>
                        <p className="mt-3 text-body text-ink-2">{p.solution}</p>
                      </div>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-6 gap-y-7 self-start lg:col-span-6">
                      {p.results.map((r) => (
                        <div key={r.metric} className="flex flex-col-reverse border-t border-line pt-4">
                          <dt className="mt-2 text-small leading-snug text-ink-2">{r.metric}</dt>
                          <dd className="font-sans text-[clamp(2rem,1.3rem+2.4vw,3.25rem)] font-bold leading-[0.95] tracking-[-0.04em] text-brand-ink">
                            {r.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="lg:col-span-12">
                      <p className="font-mono text-eyebrow uppercase text-muted">Stack</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {p.techStack.map((t) => (
                          <li key={t} className="rounded-full border border-line bg-surface px-3 py-1.5 text-small text-ink">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {isClient && createPortal(preview, document.body)}
    </>
  );
}

export default ProjectShowcase;
