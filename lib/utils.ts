import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock sizes. Any other `text-*` class
 * it takes for a text COLOUR, so `text-eyebrow text-brand-ink` looked like two
 * colours and the size was silently dropped — eyebrows and leads lost their
 * type size wherever a colour followed. The same applied to the custom
 * shadows. Registering the design tokens puts each in its real group.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["giant", "display", "h1", "h2", "h3", "lead", "body", "small", "eyebrow"] }],
      shadow: [{ shadow: ["lift", "nav", "float"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

export function splitTextToWords(text: string): string[] {
  return text.split(" ");
}

export function splitTextToChars(text: string): string[] {
  return text.split("");
}
