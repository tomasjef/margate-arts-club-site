// OutSavvy titles are typed by hand: they carry dates ("Dance Dance Dance - Saturday 7th November"),
// the venue name ("NYE 2026 - MARGATE ARTS CLUB") and odd casing. The site shows the date and venue
// elsewhere, so this strips them and fixes the casing. Titles that are already clean pass through.

const MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const DAYS = "mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?";
const ORD = "\\d{1,2}(?:st|nd|rd|th)?";
const YEAR = "(?:\\s+(?:19|20)\\d{2})?";

// Order matters: the longest shapes first, so "Saturday 7th November" goes in one piece
const DATE_PATTERNS = [
  new RegExp(`\\b(?:${DAYS})\\b\\.?,?\\s+${ORD}\\s+(?:${MONTHS})\\b${YEAR}`, "gi"), // Saturday 7th November
  new RegExp(`\\b(?:${DAYS})\\b\\.?,?\\s+(?:${MONTHS})\\b\\.?\\s+${ORD}\\b${YEAR}`, "gi"), // Sat Nov 7th
  new RegExp(`\\b${ORD}\\s+(?:${MONTHS})\\b${YEAR}`, "gi"), // 7th November (2026)
  new RegExp(`\\b(?:${MONTHS})\\b\\.?\\s+${ORD}\\b${YEAR}`, "gi"), // Oct 31st
];

const SEPARATORS = "[-–—|:,@/]";
// Words kept lower case inside a title, unless first or last
const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "with", "x"]);

function titleCase(text: string, wasAllCaps: boolean) {
  const words = text.split(/(\s+)/);
  const last = words.map((w) => w.trim()).lastIndexOf(words.filter((w) => w.trim()).at(-1) ?? "");
  return words
    .map((word, i) => {
      if (!word.trim()) return word;
      const lower = word.toLowerCase();
      const letters = word.replace(/[^A-Za-z]/g, "");
      // Short all-caps words (NYE, DJ) stay as acronyms
      if (wasAllCaps && letters.length > 1 && letters.length <= 3 && !SMALL.has(lower)) return word;
      if (i !== 0 && i !== last && SMALL.has(lower)) return lower;
      return lower.replace(/^[^a-z]*[a-z]/, (m) => m.toUpperCase());
    })
    .join("");
}

export function cleanTitle(raw: string, venue = "Margate Arts Club") {
  let title = raw.replace(/\s+/g, " ").trim();

  for (const pattern of DATE_PATTERNS) title = title.replace(pattern, " ");

  // A trailing venue name, with whatever joins it ("- Margate Arts Club", "at Margate Arts Club")
  const venuePattern = new RegExp(`(?:\\s*${SEPARATORS}\\s*|\\s+at\\s+)${venue}[\\s!.]*$`, "i");
  const withoutVenue = title.replace(venuePattern, "");
  if (withoutVenue.trim()) title = withoutVenue;

  title = title
    .replace(/\(\s*\)|\[\s*\]/g, " ") // brackets left empty
    .replace(new RegExp(`\\s*${SEPARATORS}\\s*${SEPARATORS}+\\s*`, "g"), " - ") // doubled separators
    .replace(new RegExp(`^\\s*${SEPARATORS}\\s*|\\s*${SEPARATORS}\\s*$`, "g"), "") // dangling at either end
    .replace(/\s+/g, " ")
    .trim();

  if (!title) return raw.trim(); // never return nothing

  const letters = title.replace(/[^A-Za-z]/g, "");
  const allLower = letters === letters.toLowerCase();
  const allCaps = letters === letters.toUpperCase();
  return letters && (allLower || allCaps) ? titleCase(title, allCaps) : title;
}
