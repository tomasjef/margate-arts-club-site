import type { Event } from "@/lib/events";

// The weekly schedule: the one place opening hours live. The footer, the Visit page and
// the header status all read from `hours` below, so changing a time there updates all of them.

// Machine-readable hours for each weekday, in minutes after midnight. A close past 1440 runs into
// the next morning (Friday and Saturday close at 2am).
export const hours: Record<number, { open: number; close: number }> = {
  0: { open: 12 * 60, close: 20 * 60 },
  1: { open: 12 * 60, close: 23 * 60 },
  2: { open: 12 * 60, close: 23 * 60 },
  3: { open: 12 * 60, close: 23 * 60 },
  4: { open: 12 * 60, close: 23 * 60 },
  5: { open: 12 * 60, close: 26 * 60 },
  6: { open: 12 * 60, close: 26 * 60 },
};

export type Hours = Record<number, { open: number; close: number }>;

// Everything the schedule needs: the hours and the note under a day's hours (Mon–Thu have none).
// `defaultSchedule` is what is written here; the site uses what the club has put in Sanity when it can reach it (lib/cms.ts).
export type Schedule = { hours: Hours; notes: Record<number, string | undefined> };

const freeEntry: Record<number, string | undefined> = {
  5: "Free entry before 8pm",
  6: "Free entry before 8pm",
};

export const defaultSchedule: Schedule = { hours, notes: freeEntry };

function hoursText(h: Hours, day: number) {
  return `${clock(h[day].open)}–${clock(h[day].close)}`;
}

// Opening hours for the footer and the Visit page, grouped: consecutive days (Monday first) with the same
// hours and note share a line ("Mon–Thu", "Fri–Sat", "Sun"). Change `hours` and every place follows.
export function hoursGroups(schedule: Schedule = defaultSchedule) {
  const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const groups: { label: string; open: string; note?: string; days: number[] }[] = [];
  for (const day of [1, 2, 3, 4, 5, 6, 0]) {
    const open = hoursText(schedule.hours, day);
    const note = schedule.notes[day];
    const last = groups[groups.length - 1];
    if (last && last.open === open && last.note === note) last.days.push(day);
    else groups.push({ label: "", open, note, days: [day] });
  }
  return groups.map((g) => ({
    open: g.open,
    note: g.note,
    label: g.days.length > 1 ? `${dayShort[g.days[0]]}–${dayShort[g.days[g.days.length - 1]]}` : dayShort[g.days[0]],
  }));
}

// 12 * 60 -> "12pm", 26 * 60 -> "2am"
function clock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `.${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

const weekdayIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// The header status for a moment in time, worked out in London time: the line to show and whether the club is
// open. From midnight to the 2am close the night before is still running, so it says "Open until 2am" then.
// Before the doors open it says "Closed until 12pm"; after closing, "Closed until 12pm tomorrow".
export function openStatus(now: Date, hours: Hours = defaultSchedule.hours): { text: string; open: boolean } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = weekdayIndex[get("weekday")];
  const minutes = Number(get("hour")) * 60 + Number(get("minute"));

  const yesterday = hours[(day + 6) % 7];
  if (yesterday.close > 24 * 60 && minutes < yesterday.close - 24 * 60) {
    return { text: `Open until ${clock(yesterday.close)}`, open: true };
  }
  const today = hours[day];
  if (minutes < today.open) return { text: `Closed until ${clock(today.open)}`, open: false };
  if (minutes >= today.close) {
    return { text: `Closed until ${clock(hours[(day + 1) % 7].open)} tomorrow`, open: false };
  }
  return { text: `Open today ${clock(today.open)}–${clock(today.close)}`, open: true };
}

// Where a regular links to: its OutSavvy listing when an event with a matching title is on sale,
// otherwise What's On, which lists them all
export function regularHref(events: Event[], find: string) {
  return events.find((e) => new RegExp(find, "i").test(e.title))?.url ?? "/";
}
