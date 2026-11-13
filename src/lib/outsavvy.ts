import { cleanTitle } from "./clean-title";
import { availabilityFrom, events as sampleEvents, type Event, type EventDate } from "./events";

// Reads the live events at the club's venue from OutSavvy, the club's own and other promoters'. Server only: the key is in .env.local
// (OUTSAVVY_API_KEY) and never reaches the browser. OutSavvy allows 5,000 calls a day, so the
// result is cached for a minute (about 3,000 calls a day at the most, against the 5,000 allowed).
const API = "https://api.outsavvy.com/v1";
const MAX_PAGES = 10;
// A date that runs longer than this is shown as a range (an exhibition), not a late night
const MULTI_DAY_HOURS = 20;
const MAX_TAGS = 3;

type OutSavvyDate = {
  startutc: string;
  endutc: string;
  timezone?: string;
  active?: boolean;
};

type OutSavvyEvent = {
  id: number;
  name: string;
  url: string;
  status: string;
  price: string | null;
  image_url: string | null;
  image_url_large: string | null;
  dates: OutSavvyDate[] | null;
  taxonomy: { taxonomy_name: string }[] | null;
};

// "2026-11-05" in the event's own time zone, so a late show doesn't slip onto the next day
function localDay(iso: string, timeZone = "Europe/London") {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
}

// "6pm", "7.30pm": the start in the event's own time zone, as the site writes opening times
function localTime(iso: string, timeZone = "Europe/London") {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date(iso));
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  return `${h % 12 === 0 ? 12 : h % 12}${m ? `.${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

function spansDays(d: OutSavvyDate) {
  const hours = (new Date(d.endutc).getTime() - new Date(d.startutc).getTime()) / 36e5;
  return hours > MULTI_DAY_HOURS;
}

// One card per event. An event that repeats carries every upcoming date, and the card shows the
// next one with "(+ 9 other dates)", the way OutSavvy does.
function toCard(event: OutSavvyEvent, now: number): (Event & { start: string }) | null {
  const title = cleanTitle(event.name);
  // image_url is a 16:9 banner; image_url_large is the 1080 x 1080 square poster the grid wants
  const image = event.image_url_large || event.image_url;
  if (!image) return null;

  const upcoming = (event.dates ?? [])
    .filter((d) => d.active !== false && new Date(d.endutc).getTime() > now)
    .sort((a, b) => a.startutc.localeCompare(b.startutc));
  if (upcoming.length === 0) return null;

  // One entry per calendar day, in case an event has two sessions on the same day
  const days = new Map<string, EventDate>();
  for (const d of upcoming) {
    const date = localDay(d.startutc, d.timezone);
    if (!days.has(date)) {
      const spans = spansDays(d);
      days.set(date, { date, endDate: spans ? localDay(d.endutc, d.timezone) : undefined, time: spans ? undefined : localTime(d.startutc, d.timezone), startUtc: d.startutc, endUtc: d.endutc });
    }
  }
  const dates = [...days.values()];

  return {
    slug: String(event.id),
    title,
    date: dates[0].date,
    endDate: dates[0].endDate,
    dates,
    start: upcoming[0].startutc,
    tags: (event.taxonomy ?? []).map((t) => t.taxonomy_name).slice(0, MAX_TAGS),
    price: event.price ?? "",
    availability: availabilityFrom(event.price),
    image,
    squareImage: !!event.image_url_large,
    imageAlt: `Poster for ${title}`,
    url: event.url,
  };
}

// Returns null when there is no key or OutSavvy can't be reached, so the page can fall back
export async function getEvents(): Promise<Event[] | null> {
  const key = process.env.OUTSAVVY_API_KEY;
  if (!key) return null;

  try {
    const events: OutSavvyEvent[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(`${API}/venue/events?page_number=${page}`, {
        headers: { Authorization: `Partner ${key}` },
        // the events are fetched again at most every 15 minutes (see cms.ts: each refresh is a cache write)
        next: { revalidate: 900 },
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { events: OutSavvyEvent[]; paging: { total_pages: number } };
      events.push(...body.events);
      if (page >= body.paging.total_pages) break;
    }

    const now = Date.now();
    // The same event can come back on more than one page
    const unique = [...new Map(events.map((e) => [e.id, e])).values()];
    return unique
      .filter((e) => e.status === "live")
      .map((e) => toCard(e, now))
      .filter((c): c is Event & { start: string } => c !== null)
      .sort((a, b) => a.start.localeCompare(b.start));
  } catch {
    return null;
  }
}

// For What's On: the live events, or an error when OutSavvy can't be reached. The error is on purpose. When a page refresh fails,
// Next keeps showing the last page it made (with real events) and tries again a few seconds later; without it, one failed call
// would save a page of made-up events. A deploy whose build can't reach OutSavvy stops, and the live site stays as it was.
// Only the dev server shows the sample events from the Figma design instead, for design work offline.
export async function getEventsOrKeepPage(): Promise<Event[]> {
  const events = await getEvents();
  if (events) return events;
  if (process.env.NODE_ENV === "development") return sampleEvents;
  throw new Error("OutSavvy could not be reached: keeping the last What's On page");
}
