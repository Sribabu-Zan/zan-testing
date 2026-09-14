import { processSteps } from "@/constants/zan";

/* ───────────────────────────────────────────────────────────────────────────
   The project board's kanban: four lanes (the four process stages), each
   holding that stage's deliverables as cards.

   One card at a time walks across the board, a lane per tick, to the last
   stage; as the next card sets off, the previous one returns home. The walk
   is a pure function of the tick, so a given tick always lays out the same
   board — server and client agree on tick 0, and nothing is random.
   ─────────────────────────────────────────────────────────────────────────── */

export interface BoardCard {
  id: string;
  title: string;
  /** The stage the deliverable belongs to. */
  home: number;
  /** Its place in that stage's list. */
  order: number;
}

export interface Placement {
  lane: number;
  row: number;
  walking: boolean;
}

export const LANES = processSteps.length;

export const CARDS: readonly BoardCard[] = processSteps.flatMap((step, lane) =>
  step.deliverables.map((title, order) => ({ id: `${step.id}-${order}`, title, home: lane, order })),
);

/** Cards from every lane but the last take turns, row by row. */
const WALKERS: readonly BoardCard[] = (() => {
  const rows = Math.max(...processSteps.map((s) => s.deliverables.length));
  const out: BoardCard[] = [];
  for (let order = 0; order < rows; order++) {
    for (let lane = 0; lane < LANES - 1; lane++) {
      const card = CARDS.find((c) => c.home === lane && c.order === order);
      if (card) out.push(card);
    }
  }
  return out;
})();

/** One entry per tick: which card is out, and in which lane. */
const SCHEDULE: readonly { id: string; lane: number }[] = WALKERS.flatMap((card) =>
  Array.from({ length: LANES - 1 - card.home }, (_, hop) => ({ id: card.id, lane: card.home + 1 + hop })),
);

/** Where every card sits at tick `t`. The walker goes to the top of the lane it is visiting. */
export function layoutAt(t: number): Map<string, Placement> {
  const step = SCHEDULE[((t % SCHEDULE.length) + SCHEDULE.length) % SCHEDULE.length];
  const lanes: { card: BoardCard; walking: boolean }[][] = Array.from({ length: LANES }, () => []);
  for (const card of CARDS) {
    const walking = card.id === step.id;
    lanes[walking ? step.lane : card.home].push({ card, walking });
  }
  const placement = new Map<string, Placement>();
  lanes.forEach((list, lane) => {
    list
      .sort((a, b) => Number(b.walking) - Number(a.walking) || a.card.order - b.card.order)
      .forEach(({ card, walking }, row) => placement.set(card.id, { lane, row, walking }));
  });
  return placement;
}
