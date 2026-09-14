import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { seeded } from "./sky";

/* ───────────────────────────────────────────────────────────────────────────
   GRID FIELD — the hero's ground.

   A drawing board rather than a pattern: a fine 24px rule with a heavier one
   every fourth line, both in ink at a few per cent, and then the four things
   that stop it reading as graph paper —

     · glow    one wide pool of the region's light under the mark, so the
               sheet has a centre and the corners fall away;
     · cells   a handful of squares light up in that colour and fade, each on
               its own clock, so the grid is never the same twice;
     · ticks   register marks — a drafting cross — on the major intersections,
               breathing;
     · sweep   one slow band of light crossing the whole field.

   Everything is CSS on positions computed once from a fixed seed, so the
   server and every browser draw the same grid, there is no canvas and no
   per-frame work, and `prefers-reduced-motion` simply stops it — the layout
   is identical either way. Where the grid may show is decided by the mask in
   opening.css: it dissolves behind the copy so nothing is ruled through.
   ─────────────────────────────────────────────────────────────────────────── */

/** Fine rule, in px. The heavy rule — and the cells — land every fourth line. */
const STEP = 24;
const MAJOR = STEP * 4;

/** How far out to place things: past a 2560×1440 display, cheap off-screen. */
const COLS = 28;
const ROWS = 13;
const CELL_COUNT = 14;
const TICK_COUNT = 26;

interface Cell {
  x: number;
  y: number;
  span: number;
  delay: number;
}

interface Tick {
  x: number;
  y: number;
  big: boolean;
  delay: number;
}

/**
 * Seeded once, at module load, so hydration always agrees.
 *
 * Positions are stratified by column: item i of n lands in the i-th slice of
 * the width. Drawn freely, a seed can put every cell past the right edge of a
 * phone; stratified, a 390px screen gets the first slices and a 2560px screen
 * gets all of them, in proportion.
 */
const { cells, ticks } = (() => {
  const rnd = seeded(1607);

  const scatter = <T,>(n: number, make: (col: number, row: number, i: number) => T): T[] => {
    const taken = new Set<string>();
    const out: T[] = [];
    for (let i = 0; i < n; i++) {
      for (let tries = 0; tries < 12; tries++) {
        const col = Math.min(COLS - 1, Math.floor(((i + rnd()) * COLS) / n));
        const row = Math.floor(rnd() * ROWS);
        const key = `${col}:${row}`;
        if (taken.has(key)) continue;
        taken.add(key);
        out.push(make(col, row, i));
        break;
      }
    }
    return out;
  };

  const cells = scatter<Cell>(CELL_COUNT, (col, row, i) => ({
    x: col * MAJOR,
    y: row * MAJOR,
    // Every fourth cell is a 2×2 block, so the lit shapes are not all alike.
    // Fixed by position in the list rather than drawn, so no seed can lose it.
    span: i % 4 === 2 ? 2 : 1,
    delay: Number((rnd() * 12).toFixed(2)),
  }));

  const ticks = scatter<Tick>(TICK_COUNT, (col, row) => ({
    x: col * MAJOR,
    y: row * MAJOR,
    big: rnd() > 0.7,
    delay: Number((rnd() * 7).toFixed(2)),
  }));

  return { cells, ticks };
})();

export function GridField({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)} aria-hidden="true">
      <div className="zan-hero-grid-glow" />
      <div className="zan-hero-grid-lines absolute inset-0" />

      <div className="absolute inset-0">
        {cells.map((cell, i) => (
          <span
            key={`c${i}`}
            className="zan-hero-grid-cell"
            style={
              {
                left: cell.x,
                top: cell.y,
                width: cell.span * MAJOR,
                height: cell.span * MAJOR,
                "--zan-cell-delay": `${cell.delay}s`,
              } as CSSProperties
            }
          />
        ))}
        {ticks.map((tick, i) => (
          <span
            key={`t${i}`}
            className="zan-hero-grid-tick"
            style={
              {
                left: tick.x,
                top: tick.y,
                "--zan-tick-size": `${tick.big ? 13 : 9}px`,
                "--zan-tick-delay": `${tick.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="zan-hero-grid-sweep absolute inset-y-0 -left-1/2 w-[200%]" />
    </div>
  );
}

/** The rule the mask and the cells share, so CSS and TS cannot drift apart. */
export const GRID = { STEP, MAJOR } as const;
