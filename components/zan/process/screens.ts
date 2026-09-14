import type { ProcessStep } from "@/constants/zan";
import type { BrandPalette } from "@/lib/region";

/* ───────────────────────────────────────────────────────────────────────────
   The laptop's screen, one per process stage, drawn on a 2D canvas in the
   region's palette. Illustrative UI only: the stage list, index and title are
   Zan's copy; everything else is shapes — no invented figures.

   01 roadmap + requirements checklist   02 wireframe + design system
   03 code editor + passing checks       04 pipeline + live graph
   ─────────────────────────────────────────────────────────────────────────── */

/** The screen mesh's aspect (≈1.547, a 16" panel). */
export const SCREEN_W = 1280;
export const SCREEN_H = 828;

export interface ScreenFonts {
  sans: string;
  mono: string;
  display: string;
}

export const FALLBACK_FONTS: ScreenFonts = {
  sans: "ui-sans-serif, system-ui, sans-serif",
  mono: "ui-monospace, Menlo, monospace",
  display: "Georgia, serif",
};

/** The page's own font stacks, read from the live CSS once fonts have loaded. */
export function resolveFonts(): ScreenFonts {
  const cs = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    sans: read("--font-sans", FALLBACK_FONTS.sans),
    mono: read("--font-mono", FALLBACK_FONTS.mono),
    display: read("--font-display", FALLBACK_FONTS.display),
  };
}

type Ctx = CanvasRenderingContext2D;

/** A palette colour at an alpha. Palette values are hex; anything else is used opaque. */
function rgba(color: string, a: number): string {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function fillRR(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}
function strokeRR(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, stroke: string, lw = 2, dash?: number[]) {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.setLineDash(dash ?? []);
  ctx.stroke();
  ctx.setLineDash([]);
}
function card(ctx: Ctx, p: BrandPalette, x: number, y: number, w: number, h: number, fill: string = p.bg) {
  fillRR(ctx, x, y, w, h, 20, fill);
  strokeRR(ctx, x, y, w, h, 20, p.line, 2);
}
function bar(ctx: Ctx, x: number, y: number, w: number, h: number, color: string | CanvasGradient) {
  fillRR(ctx, x, y, w, h, h / 2, color);
}
function circle(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
function ring(ctx: Ctx, x: number, y: number, r: number, stroke: string, lw: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}
function check(ctx: Ctx, x: number, y: number, r: number, p: BrandPalette) {
  circle(ctx, x, y, r, p.brand);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.42, y + r * 0.02);
  ctx.lineTo(x - r * 0.1, y + r * 0.34);
  ctx.lineTo(x + r * 0.45, y - r * 0.3);
  ctx.strokeStyle = p.onBrand;
  ctx.lineWidth = r * 0.26;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();
}
function spacing(ctx: Ctx, px: number) {
  (ctx as Ctx & { letterSpacing?: string }).letterSpacing = `${px}px`;
}
function label(ctx: Ctx, f: ScreenFonts, p: BrandPalette, text: string, x: number, y: number) {
  ctx.font = `500 13px ${f.mono}`;
  ctx.fillStyle = rgba(p.ink, 0.5);
  ctx.textAlign = "left";
  spacing(ctx, 2.5);
  ctx.fillText(text.toUpperCase(), x, y);
  spacing(ctx, 0);
}
function gradient(ctx: Ctx, p: BrandPalette, x0: number, y0: number, x1: number, y1: number) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, p.from);
  g.addColorStop(1, p.to);
  return g;
}

/* ── Stage diagrams (x 348…1232, y 216…788) ─────────────────────────────── */

function drawDiscovery(ctx: Ctx, step: ProcessStep, p: BrandPalette, f: ScreenFonts) {
  // Roadmap
  card(ctx, p, 348, 216, 884, 196);
  label(ctx, f, p, "Roadmap", 376, 252);
  const xs = [420, 680, 940, 1190];
  bar(ctx, xs[0], 300, xs[3] - xs[0], 6, p.line);
  bar(ctx, xs[0], 300, xs[1] - xs[0], 6, p.brand);
  xs.forEach((x, k) => {
    if (k === 0) {
      circle(ctx, x, 303, 24, rgba(p.brand, 0.16));
      circle(ctx, x, 303, 13, p.brand);
    } else {
      circle(ctx, x, 303, 13, p.bg);
      ring(ctx, x, 303, 13, k === 1 ? p.brand : p.line, 4);
    }
    ctx.font = `500 16px ${f.sans}`;
    ctx.fillStyle = rgba(p.ink, k < 2 ? 0.85 : 0.5);
    ctx.textAlign = k === 0 ? "left" : k === xs.length - 1 ? "right" : "center";
    const tx = k === 0 ? x - 13 : k === xs.length - 1 ? x + 13 : x;
    ctx.fillText(step.deliverables[k] ?? "", tx, 358);
  });
  ctx.textAlign = "left";

  // Requirements checklist
  card(ctx, p, 348, 436, 540, 352);
  label(ctx, f, p, "Requirements", 376, 472);
  const widths = [330, 270, 350, 240, 300];
  widths.forEach((w, k) => {
    const y = 522 + k * 54;
    if (k < 2) check(ctx, 390, y, 14, p);
    else strokeRR(ctx, 376, y - 14, 28, 28, 8, p.line, 3);
    bar(ctx, 422, y - 7, w, 14, rgba(p.ink, k < 2 ? 0.2 : 0.1));
  });

  // Scope
  card(ctx, p, 912, 436, 320, 352, rgba(p.soft, 1));
  label(ctx, f, p, "Scope", 940, 472);
  ring(ctx, 1072, 596, 70, rgba(p.bg, 1), 26);
  ctx.beginPath();
  ctx.arc(1072, 596, 70, -Math.PI / 2, Math.PI * 0.85);
  ctx.strokeStyle = p.brand;
  ctx.lineWidth = 26;
  ctx.lineCap = "round";
  ctx.stroke();
  bar(ctx, 952, 712, 240, 12, rgba(p.brandInk, 0.25));
  bar(ctx, 952, 740, 160, 12, rgba(p.brandInk, 0.15));
}

function drawDesign(ctx: Ctx, p: BrandPalette, f: ScreenFonts) {
  // Wireframe
  card(ctx, p, 348, 216, 600, 572);
  fillRR(ctx, 372, 240, 552, 38, 10, rgba(p.line, 0.7));
  bar(ctx, 388, 252, 64, 14, p.brand);
  [0, 1, 2].forEach((k) => bar(ctx, 720 + k * 64, 254, 48, 10, rgba(p.ink, 0.2)));
  fillRR(ctx, 372, 294, 552, 204, 14, p.soft);
  bar(ctx, 400, 332, 300, 26, rgba(p.ink, 0.75));
  bar(ctx, 400, 374, 250, 14, rgba(p.ink, 0.25));
  bar(ctx, 400, 398, 210, 14, rgba(p.ink, 0.25));
  fillRR(ctx, 400, 436, 136, 40, 20, gradient(ctx, p, 400, 436, 536, 476));
  strokeRR(ctx, 732, 318, 168, 156, 12, rgba(p.brandInk, 0.55), 2, [9, 7]);
  ctx.beginPath();
  ctx.moveTo(732, 318);
  ctx.lineTo(900, 474);
  ctx.moveTo(900, 318);
  ctx.lineTo(732, 474);
  ctx.strokeStyle = rgba(p.brandInk, 0.25);
  ctx.lineWidth = 2;
  ctx.stroke();
  [0, 1, 2].forEach((k) => {
    const x = 372 + k * 188;
    fillRR(ctx, x, 518, 176, 246, 14, p.bg);
    strokeRR(ctx, x, 518, 176, 246, 14, k === 1 ? p.brand : p.line, k === 1 ? 3 : 2);
    fillRR(ctx, x + 14, 532, 148, 98, 10, rgba(p.line, 0.7));
    bar(ctx, x + 14, 648, 120, 14, rgba(p.ink, 0.5));
    bar(ctx, x + 14, 672, 140, 10, rgba(p.ink, 0.18));
    bar(ctx, x + 14, 690, 100, 10, rgba(p.ink, 0.18));
    if (k === 1) {
      // Selection handles: the component being designed.
      [
        [x, 518],
        [x + 176, 518],
        [x, 764],
        [x + 176, 764],
      ].forEach(([hx, hy]) => {
        fillRR(ctx, hx - 6, hy - 6, 12, 12, 2, p.bg);
        strokeRR(ctx, hx - 6, hy - 6, 12, 12, 2, p.brand, 2.5);
      });
    }
  });

  // Design system
  card(ctx, p, 972, 216, 260, 572);
  label(ctx, f, p, "Design system", 996, 252);
  fillRR(ctx, 996, 274, 100, 72, 12, p.brand);
  fillRR(ctx, 1112, 274, 100, 72, 12, p.brandInk);
  fillRR(ctx, 996, 358, 100, 72, 12, p.soft);
  strokeRR(ctx, 996, 358, 100, 72, 12, p.line, 2);
  fillRR(ctx, 1112, 358, 100, 72, 12, p.ink);
  ctx.font = `600 72px ${f.display}`;
  ctx.fillStyle = p.ink;
  ctx.textAlign = "left";
  ctx.fillText("Aa", 996, 528);
  bar(ctx, 996, 552, 200, 12, rgba(p.ink, 0.3));
  bar(ctx, 996, 574, 150, 12, rgba(p.ink, 0.18));
  fillRR(ctx, 996, 620, 72, 38, 19, p.brand);
  circle(ctx, 1049, 639, 14, p.onBrand);
  strokeRR(ctx, 1082, 620, 130, 38, 19, p.brand, 2.5);
  bar(ctx, 1106, 634, 82, 10, rgba(p.brandInk, 0.5));
  fillRR(ctx, 996, 682, 216, 76, 14, rgba(p.soft, 1));
  bar(ctx, 1014, 704, 120, 12, rgba(p.brandInk, 0.45));
  bar(ctx, 1014, 728, 170, 10, rgba(p.brandInk, 0.22));
}

/** Code lines: [indent, [width, kind]...] — kind 0 plain, 1 keyword, 2 string. */
const CODE: [number, [number, number][]][] = [
  [0, [[70, 1], [120, 0], [60, 1], [150, 2]]],
  [0, [[70, 1], [96, 0], [60, 1], [120, 2]]],
  [0, []],
  [0, [[90, 1], [110, 1], [140, 0]]],
  [1, [[60, 1], [120, 0], [80, 0]]],
  [1, [[60, 1], [70, 0], [160, 2]]],
  [1, [[110, 0], [50, 1], [90, 0]]],
  [2, [[80, 1], [140, 0]]],
  [2, [[130, 0], [100, 2]]],
  [1, [[30, 0]]],
  [1, [[70, 1], [180, 0]]],
  [0, [[20, 0]]],
  [0, []],
  [0, [[90, 1], [70, 1], [120, 0]]],
];

function drawBuild(ctx: Ctx, p: BrandPalette, f: ScreenFonts) {
  // Editor (dark)
  fillRR(ctx, 348, 216, 560, 572, 20, p.ink);
  fillRR(ctx, 348, 216, 560, 50, 20, rgba(p.bg, 0.06));
  fillRR(ctx, 368, 226, 150, 30, 8, rgba(p.bg, 0.1));
  bar(ctx, 384, 237, 100, 8, rgba(p.bg, 0.55));
  CODE.forEach(([indent, tokens], k) => {
    const y = 300 + k * 33;
    ctx.font = `400 15px ${f.mono}`;
    ctx.fillStyle = rgba(p.bg, 0.28);
    ctx.textAlign = "right";
    ctx.fillText(String(k + 1), 396, y + 5);
    let x = 420 + indent * 28;
    tokens.forEach(([w, kind]) => {
      const color = kind === 1 ? p.glow : kind === 2 ? rgba(p.soft, 0.85) : rgba(p.bg, 0.4);
      bar(ctx, x, y - 5, Math.min(w, 880 - x), 11, color);
      x += w + 12;
    });
  });
  ctx.textAlign = "left";
  fillRR(ctx, 416, 300 + 6 * 33 - 12, 3, 24, 1.5, p.glow);

  // Checks
  card(ctx, p, 932, 216, 300, 572);
  label(ctx, f, p, "Tests", 958, 252);
  [170, 130, 186, 150, 118, 162].forEach((w, k) => {
    const y = 298 + k * 58;
    check(ctx, 972, y, 14, p);
    bar(ctx, 1000, y - 6, w, 12, rgba(p.ink, 0.16));
  });
  fillRR(ctx, 956, 680, 252, 84, 16, p.soft);
  bar(ctx, 978, 704, 208, 12, rgba(p.brandInk, 0.2));
  bar(ctx, 978, 704, 208, 12, gradient(ctx, p, 978, 0, 1186, 0));
  bar(ctx, 978, 732, 130, 10, rgba(p.brandInk, 0.35));
}

const GRAPH = [0.1, 0.16, 0.13, 0.22, 0.2, 0.3, 0.27, 0.36, 0.42, 0.39, 0.5, 0.48, 0.58, 0.55, 0.64, 0.7, 0.67, 0.76, 0.8, 0.78, 0.86, 0.9];

function drawLaunch(ctx: Ctx, p: BrandPalette, f: ScreenFonts) {
  // Pipeline
  card(ctx, p, 348, 216, 884, 124);
  label(ctx, f, p, "Pipeline", 376, 250);
  const stages = ["Build", "Test", "Deploy"];
  stages.forEach((s, k) => {
    const x = 376 + k * 290;
    fillRR(ctx, x, 270, 244, 48, 24, p.soft);
    check(ctx, x + 26, 294, 13, p);
    ctx.font = `600 18px ${f.sans}`;
    ctx.fillStyle = p.ink;
    ctx.textAlign = "left";
    ctx.fillText(s, x + 52, 300);
    if (k < stages.length - 1) {
      bar(ctx, x + 252, 292, 30, 4, rgba(p.brand, 0.6));
    }
  });

  // Live graph
  card(ctx, p, 348, 364, 884, 424);
  label(ctx, f, p, "Uptime", 376, 400);
  fillRR(ctx, 1112, 380, 96, 36, 18, p.soft);
  circle(ctx, 1134, 398, 6, p.brand);
  circle(ctx, 1134, 398, 11, rgba(p.brand, 0.2));
  ctx.font = `600 16px ${f.sans}`;
  ctx.fillStyle = p.brandInk;
  ctx.fillText("Live", 1150, 404);
  [470, 540, 610, 680].forEach((y) => bar(ctx, 380, y, 820, 2, p.line));
  const x0 = 380;
  const x1 = 1200;
  const yTop = 450;
  const yBot = 756;
  const pts = GRAPH.map((v, k) => [x0 + ((x1 - x0) * k) / (GRAPH.length - 1), yBot - v * (yBot - yTop)] as const);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], yBot);
  pts.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.lineTo(x1, yBot);
  ctx.closePath();
  const area = ctx.createLinearGradient(0, yTop, 0, yBot);
  area.addColorStop(0, rgba(p.brand, 0.3));
  area.addColorStop(1, rgba(p.brand, 0));
  ctx.fillStyle = area;
  ctx.fill();
  ctx.beginPath();
  pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = p.brand;
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  const [lx, ly] = pts[pts.length - 1];
  circle(ctx, lx, ly, 16, rgba(p.brand, 0.18));
  circle(ctx, lx, ly, 8, p.brand);
}

/* ── The whole screen ───────────────────────────────────────────────────── */

export function drawScreen(
  ctx: Ctx,
  steps: readonly ProcessStep[],
  i: number,
  p: BrandPalette,
  f: ScreenFonts,
) {
  const W = SCREEN_W;
  const H = SCREEN_H;
  const step = steps[i];
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";

  // Ground
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);

  // Window chrome
  ctx.fillStyle = rgba(p.line, 0.6);
  ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = p.line;
  ctx.fillRect(0, 56, W, 2);
  [0, 1, 2].forEach((k) => circle(ctx, 32 + k * 24, 28, 7, k === 0 ? p.brand : rgba(p.ink, 0.15)));
  fillRR(ctx, W / 2 - 170, 13, 340, 30, 15, p.bg);
  ctx.font = `500 14px ${f.mono}`;
  ctx.fillStyle = rgba(p.ink, 0.55);
  ctx.textAlign = "center";
  spacing(ctx, 1.5);
  ctx.fillText(`STAGE ${step.index} / ${String(steps.length).padStart(2, "0")}`, W / 2, 33);
  spacing(ctx, 0);

  // Sidebar: the four stages, this one highlighted.
  ctx.fillStyle = rgba(p.bg, 0.9);
  ctx.fillRect(0, 58, 300, H - 58);
  ctx.fillStyle = p.line;
  ctx.fillRect(300, 58, 2, H - 58);
  label(ctx, f, p, "Process", 32, 104);
  steps.forEach((s, k) => {
    const y = 128 + k * 62;
    const on = k === i;
    if (on) {
      fillRR(ctx, 18, y, 266, 48, 12, p.soft);
      fillRR(ctx, 18, y + 10, 4, 28, 2, p.brand);
    }
    ctx.textAlign = "left";
    ctx.font = `500 15px ${f.mono}`;
    ctx.fillStyle = on ? p.brandInk : rgba(p.ink, 0.4);
    ctx.fillText(s.index, 38, y + 30);
    ctx.font = `${on ? 600 : 500} 17px ${f.sans}`;
    ctx.fillStyle = on ? p.ink : rgba(p.ink, 0.55);
    ctx.fillText(s.title, 74, y + 30);
  });
  label(ctx, f, p, "Progress", 32, H - 84);
  bar(ctx, 32, H - 64, 236, 10, p.line);
  bar(ctx, 32, H - 64, (236 * (i + 1)) / steps.length, 10, gradient(ctx, p, 32, 0, 268, 0));

  // Header
  ctx.textAlign = "left";
  ctx.font = `500 16px ${f.mono}`;
  ctx.fillStyle = p.brandInk;
  spacing(ctx, 3);
  ctx.fillText(`STAGE ${step.index}`, 348, 122);
  spacing(ctx, 0);
  ctx.font = `700 44px ${f.sans}`;
  ctx.fillStyle = p.ink;
  ctx.fillText(step.title, 348, 178);

  if (step.id === "discovery") drawDiscovery(ctx, step, p, f);
  else if (step.id === "design") drawDesign(ctx, p, f);
  else if (step.id === "build") drawBuild(ctx, p, f);
  else drawLaunch(ctx, p, f);

  ctx.restore();
}
