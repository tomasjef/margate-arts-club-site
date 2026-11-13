import type { CSSProperties } from "react";

// Every letter in a font has a little space before its ink (its left side bearing): at the page titles' 45px an N starts 3.4px to the
// right of where its line starts, a V or an A hardly at all. So a line of text that starts on the page margin looks set in from the
// logo, the posters, the boxes and the lines, which start exactly on it. inkStyle gives such a line its first letter's space as
// --ink (in em), and on phones the class `ink` (globals.css) pulls the line left by that much, so its ink starts on the margin.
//
// Archivo's left side bearings in thousandths of an em, measured in Chrome from the font's own outlines (canvas measureText,
// actualBoundingBoxLeft) on 5 Nov 2026, for the three weights the site uses. A negative value is ink that reaches left of the line's
// start (the tail of a j), which the pull then moves right.
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const bearings: Record<400 | 500 | 600, number[]> = {
  400: [7, 86, 51, 86, 86, 86, 56, 86, 86, 35, 86, 86, 86, 86, 51, 86, 51, 86, 52, 19, 84, 10, 12, 11, 10, 32, 34, 69, 37, 39, 39, 12, 18, 69, 69, -23, 69, 69, 69, 69, 39, 69, 39, 69, 35, 17, 64, 13, 11, 14, 13, 31, 49, 66, 50, 42, 28, 50, 49, 39, 47, 43],
  500: [6, 81, 48, 81, 81, 81, 54, 81, 81, 35, 81, 81, 81, 81, 48, 81, 48, 81, 49, 22, 78, 10, 11, 11, 10, 31, 34, 67, 38, 39, 39, 13, 18, 67, 67, -26, 67, 67, 67, 67, 39, 67, 39, 67, 37, 15, 62, 9, 7, 12, 9, 28, 49, 81, 50, 43, 30, 48, 50, 42, 46, 43],
  600: [5, 76, 45, 76, 76, 76, 53, 76, 76, 36, 76, 76, 76, 76, 45, 76, 45, 76, 45, 25, 72, 10, 10, 11, 10, 29, 34, 65, 39, 39, 39, 14, 17, 65, 65, -29, 65, 65, 65, 65, 39, 65, 39, 65, 40, 13, 61, 5, 3, 10, 5, 24, 50, 97, 51, 44, 31, 46, 51, 46, 44, 42],
};
// a few marks a line can start with (500 and 600; 400 uses 500's): ‘ “ ' " ( © £ & - — + (the "+ 2 more dates" line)
const marks: Record<string, [number, number]> = {
  "‘": [71, 73], "“": [71, 73], "'": [59, 62], '"': [59, 62], "(": [68, 64], "©": [24, 27], "£": [26, 24], "&": [51, 53], "-": [40, 40], "—": [0, 0], "+": [79, 82],
};

// `upper`: the line is set in capitals by CSS (text-transform), so its first letter is looked up as a capital
export function inkStyle(text: string | null | undefined, weight: 400 | 500 | 600 = 600, upper = false): CSSProperties {
  let first = text?.trimStart()[0];
  if (!first) return {};
  if (upper) first = first.toUpperCase();
  const i = letters.indexOf(first);
  const thousandths = i >= 0 ? bearings[weight][i] : marks[first]?.[weight === 600 ? 1 : 0];
  return thousandths ? ({ "--ink": thousandths / 1000 } as CSSProperties) : {};
}
