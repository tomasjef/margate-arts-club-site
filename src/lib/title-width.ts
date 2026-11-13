import type { CSSProperties } from "react";

// How wide a name is in the menu's type (Archivo 600, in capitals), as a share of the type size: each character's width as Chrome
// measured it. Kerning is left out, so a name comes out a touch wider than it is, never narrower. A character not in the list
// counts as 0.8.
const advance: Record<string, number> = {
  A: 0.709, B: 0.706, C: 0.721, D: 0.728, E: 0.672, F: 0.609, G: 0.794, H: 0.732, I: 0.282, J: 0.585, K: 0.695, L: 0.57, M: 0.844,
  N: 0.732, O: 0.782, P: 0.67, Q: 0.782, R: 0.717, S: 0.667, T: 0.619, U: 0.724, V: 0.671, W: 0.954, X: 0.686, Y: 0.677, Z: 0.634,
  "0": 0.576, "1": 0.576, "2": 0.576, "3": 0.576, "4": 0.577, "5": 0.576, "6": 0.576, "7": 0.576, "8": 0.576, "9": 0.576,
  " ": 0.2, "&": 0.729, "'": 0.246, "’": 0.28, "-": 0.333, "–": 0.5, ",": 0.3, ".": 0.3, ":": 0.336, "!": 0.292, "?": 0.613,
  "/": 0.298, "(": 0.357, ")": 0.357, "+": 0.636, "@": 0.998, "#": 0.583, À: 0.709, Á: 0.709, Â: 0.709, Ä: 0.709, Ã: 0.709,
  Å: 0.709, Æ: 0.999, Ç: 0.721, È: 0.672, É: 0.672, Ê: 0.672, Ë: 0.672, Ì: 0.282, Í: 0.282, Î: 0.282, Ï: 0.282, Ñ: 0.732,
  Ò: 0.782, Ó: 0.782, Ô: 0.782, Ö: 0.782, Õ: 0.782, Ø: 0.782, Œ: 1.2, Ù: 0.724, Ú: 0.724, Û: 0.724, Ü: 0.724, Ý: 0.677,
};
export const nameEm = (s: string) => [...s.toUpperCase()].reduce((sum, ch) => sum + (advance[ch] ?? 0.8), 0);

// Phones: the width of the longest word in a page's name (or in several names that share a size, as the legal pages' three), for
// .page-title, which keeps that word on one line across the page
export function titleWordStyle(titles: string | string[]) {
  const words = [titles].flat().flatMap((t) => t.split(/\s+/));
  const widest = Math.max(1, ...words.map(nameEm));
  return { "--title-word": widest.toFixed(3) } as CSSProperties;
}
