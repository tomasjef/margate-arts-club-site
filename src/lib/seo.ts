import type { Metadata } from "next";
import { getPageDescription, type SiteInfo } from "@/lib/cms";
import type { Event } from "@/lib/events";
import { siteName } from "@/lib/site";
import type { Schedule } from "@/lib/week";

// What search engines and link previews are told. The site's one real address is margatearts.club: every page names its address there
// (canonical), whichever address it was opened on. The test addresses are kept out of search by worker.ts.
export const liveUrl = "https://margatearts.club";

// The link preview's picture and the site's name, on every page (a page's own openGraph replaces the layout's whole, so each carries these)
export const openGraphBase = {
  type: "website" as const,
  siteName,
  locale: "en_GB",
  images: [{ url: "/share.png", width: 1200, height: 630, alt: siteName }],
};

export const siteDescription =
  "Listening bar, live music and arts space at 276 Northdown Road, Margate. See what’s on, from live bands and DJs to art shows, and book tickets.";

// A page's title, description and address. `path` is its address on the site ("/visit"). With `page` (the id of its Sanity document) the
// club's own search description is used when it has written one. `canonical` is the address search engines are to list instead, for a
// page that is the same as another (Accessibility and Company are the Privacy page, opened at their part of it).
export async function pageMetadata(o: { title: string; description: string; path: string; page?: string; canonical?: string }): Promise<Metadata> {
  const description = (o.page && (await getPageDescription(o.page))) || o.description;
  const canonical = o.canonical ?? o.path;
  return {
    title: o.title,
    description,
    alternates: { canonical },
    openGraph: { ...openGraphBase, title: `${o.title} · ${siteName}`, description, url: canonical },
  };
}

// Pages that are not for search: the mailing list's pages, the design system
export const hidden: Metadata = { robots: { index: false, follow: false } };

// The first words of a text, cut at a word, for a description (about 155 characters, what Google shows)
export function excerpt(text: string, max = 155) {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.\s]+$/, "")}…`;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// minutes after midnight -> "23:00" (26 * 60, after midnight, -> "02:00")
const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// The venue: a bar and music venue at its address, with the opening hours the club has in the studio
export function venueData(schedule: Schedule, info: Pick<SiteInfo, "address1" | "address2" | "instagramUrl">) {
  const place = venuePlace(info);
  return {
    "@context": "https://schema.org",
    "@type": ["BarOrPub", "MusicVenue"],
    "@id": `${liveUrl}/#venue`,
    ...place,
    url: liveUrl,
    description: siteDescription,
    image: `${liveUrl}/share.png`,
    sameAs: [info.instagramUrl],
    openingHoursSpecification: [1, 2, 3, 4, 5, 6, 0].map((d) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${dayNames[d]}`,
      opens: hhmm(schedule.hours[d].open),
      closes: hhmm(schedule.hours[d].close),
    })),
  };
}

// "276 Northdown Road" / "Margate CT9 2PT" -> the parts of a postal address
function venuePlace(info: Pick<SiteInfo, "address1" | "address2">) {
  const postcode = /[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i.exec(info.address2)?.[0];
  return {
    name: siteName,
    address: {
      "@type": "PostalAddress",
      streetAddress: info.address1,
      addressLocality: (postcode ? info.address2.slice(0, -postcode.length) : info.address2).replace(/[,\s]+$/, "").replace(/[,\s]*Kent$/i, "") || "Margate",
      addressRegion: "Kent",
      ...(postcode ? { postalCode: postcode } : {}),
      addressCountry: "GB",
    },
  };
}

// The events on What's On, each with its date, poster and ticket link (only real OutSavvy events: the stand-ins have no link and no start time).
// The club is each one's organiser (one of the fields Google asks for); a run over several days has its last day as the end date. OutSavvy
// gives no end times, descriptions or performers to add.
export function eventsData(events: (Event & { start?: string })[], info: Pick<SiteInfo, "address1" | "address2">) {
  const location = { "@type": "Place", ...venuePlace(info) };
  const organizer = { "@type": "Organization", name: siteName, url: liveUrl };
  return events
    .filter((e) => e.start && e.url.startsWith("http"))
    .map((e) => {
      // "£7 to £15" -> 7, "Free entry" -> 0; no price when the text has none (sold out, say)
      const price = /free/i.test(e.price) ? "0" : /£\s?(\d+(?:\.\d{1,2})?)/.exec(e.price)?.[1];
      return {
        "@context": "https://schema.org",
        "@type": "Event",
        name: e.title,
        startDate: e.start,
        ...(e.endDate && e.endDate !== e.date ? { endDate: e.endDate } : {}),
        url: e.url,
        image: [e.image],
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location,
        organizer,
        offers: {
          "@type": "Offer",
          url: e.url,
          availability: e.availability === "sold-out" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          ...(price ? { price, priceCurrency: "GBP" } : {}),
        },
      };
    });
}
