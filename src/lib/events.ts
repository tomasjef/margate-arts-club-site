// The shape each event needs, plus a small set of sample events (Figma home frame) that only the dev server shows when the
// OutSavvy API cannot be reached (no key, or offline). The live site never shows them: see getEventsOrKeepPage in outsavvy.ts.
export type Availability = "sold-out" | "waiting-list" | "resale";

export const availabilityLabels: Record<Availability, string> = {
  "sold-out": "Sold out",
  "waiting-list": "Waiting list",
  resale: "Resale tickets",
};

// OutSavvy puts a status in the price field when tickets are not on sale as normal
// ("sold out", "waiting list", "resell"), so the price text tells us.
export function availabilityFrom(price: string | null | undefined): Availability | undefined {
  if (!price) return undefined;
  if (/sold\s*out/i.test(price)) return "sold-out";
  if (/waiting/i.test(price)) return "waiting-list";
  if (/resell|resale/i.test(price)) return "resale";
  return undefined;
}

export type EventDate = { date: string; endDate?: string; time?: string; startUtc?: string; endUtc?: string }; // time: when it starts, "6pm" or "7.30pm" (not for a run over several days)

export type Event = {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  endDate?: string; // set for an exhibition or festival that runs over several days
  dates?: EventDate[]; // every upcoming date of an event that repeats, soonest first (date is the first)
  tags: string[];
  price: string; // "£7 to £15" or "Free entry"
  availability?: Availability; // set when OutSavvy reports the event as sold out, and so on
  image: string;
  squareImage?: boolean; // the image is OutSavvy's 1080 x 1080 poster (otherwise the 16:9 banner, which the website and the newsletter crop to a square)
  imageAlt: string;
  url: string;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// One format everywhere: THU 5 NOV (no ordinals, no year). The weekday comes from the date. The year only shows when a range runs over New Year.
export function formatDate(iso: string, withYear = false) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day} ${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

// "Fri 23 – Sun 25 Oct": the date alone, or a range when the event spans days
export function formatDateRange(start: string, end?: string) {
  if (!end || end === start) return formatDate(start);
  const [y1, m1] = start.split("-").map(Number);
  const [y2, m2] = end.split("-").map(Number);
  // A range over New Year needs both years: "Wed 30 Dec 2026 – Fri 1 Jan 2027"
  if (y1 !== y2) return `${formatDate(start, true)} – ${formatDate(end, true)}`;
  const first = formatDate(start);
  const last = formatDate(end);
  // Drop the part the two dates share: "Fri 23 – Sun 25 Oct"
  if (m1 === m2) return `${first.split(" ").slice(0, 2).join(" ")} – ${last}`;
  return `${first} – ${last}`;
}

export const events: Event[] = [
  {
    slug: "on-becoming",
    title: "On Becoming - Robert Stillman and Adem ilhabln + thingsmove",
    date: "2026-11-05",
    tags: ["Music", "Experience"],
    price: "£7 to £15",
    image: "/events/on-becoming.jpg",
    imageAlt: "Man in a white t-shirt standing beside a small monitor showing his own face",
    url: "#",
  },
  {
    slug: "dance-dance-dance",
    title: "Dance Dance Dance",
    date: "2026-11-07",
    tags: ["Music", "Experience"],
    price: "£7 to £15",
    image: "/events/dance-dance-dance.jpg",
    imageAlt: "Poster: Dance Dance Dance, Katie and Joe and friends, 7 November",
    url: "#",
  },
  {
    slug: "smxtfest-x-lesbeaux",
    title: "SMXTFEST X LESBEAUX",
    date: "2026-11-13",
    tags: ["Music", "Experience"],
    price: "£7 to £15",
    image: "/events/smxtfest-x-lesbeaux.jpg",
    imageAlt: "Yellow and black poster: Smxtfest x Lesbeaux, DJs, performances, lube wrestling, 13 November",
    url: "#",
  },
  {
    slug: "rosanna-in-waves",
    title: "Rosanna in Waves: Album Release Party",
    date: "2026-11-19",
    tags: ["Music", "Experience"],
    price: "£7 to £15",
    image: "/events/rosanna-in-waves.png",
    imageAlt: "Poster: Rosanna in Waves, Balancing Act album release party",
    url: "#",
  },
  {
    // Figma says "SAT 21 OCT 2026", which is a Wednesday; the poster says Sat 31 Oct
    slug: "cockles-and-muscles-halloween",
    title: "Cockles and Muscles Halloween",
    date: "2026-10-31",
    tags: ["Music", "Experience"],
    price: "£7 to £15",
    image: "/events/cockles-and-muscles.png",
    imageAlt: "Poster: Cockles and Muscles Halloween trap, Margate Arts Club, Saturday 31 October",
    url: "#",
  },
  {
    slug: "good-good-film-club-12",
    title: "Good Good Film Club #12",
    date: "2026-10-28",
    tags: ["Music", "Experience"],
    price: "£7 to £15",
    image: "/events/good-good-film-club.jpg",
    imageAlt: "Poster: Good Good Film Club",
    url: "#",
  },
];
