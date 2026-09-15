import { processSteps } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   The phone and tablet Process scene as pure functions of scroll, shared by
   the WebGL laptop, the CSS laptop and the cards so all three stay in step.

   Pinned progress 0→1 is split into a hold per stage and a transition between
   each pair. A transition is one full turn of the laptop: the outgoing card
   leaves over the first half, the screen changes while the laptop shows its
   back, and the incoming card arrives over the second half.
   ─────────────────────────────────────────────────────────────────────────── */

export const STEPS = processSteps.length;
export const TAU = Math.PI * 2;

/** How long a transition lasts, relative to a hold. */
const TRANSITION = 1.5;

/** The laptop at rest: a three-quarter view, looking down onto the keyboard. */
export const REST_YAW = -0.42;
export const REST_PITCH = 0.22;

export const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Completed turns (0 → STEPS - 1) at a pinned progress. */
export function turnsAt(pin: number): number {
  const hold = 1 / (STEPS + TRANSITION * (STEPS - 1));
  const span = hold * TRANSITION;
  let turns = 0;
  for (let j = 0; j < STEPS - 1; j++) {
    const start = hold * (j + 1) + span * j;
    turns += inOut(clamp01((pin - start) / span));
  }
  return turns;
}

/** The stage on show: it changes halfway through a turn, when the screen faces away. */
export const stageAt = (turns: number) => Math.min(STEPS - 1, Math.max(0, Math.round(turns)));

/**
 * Yaw in radians. The laptop makes one turn as the stage rises into view
 * (for the first card), then one per further card. Always increasing with
 * scroll, so scrolling back unwinds it.
 */
export const spinYaw = (entry: number, turns: number) => REST_YAW - TAU * (1 - smooth(clamp01(entry))) + TAU * turns;

export const spinPitch = (entry: number) => 0.46 + (REST_PITCH - 0.46) * smooth(clamp01(entry));
