import { draftMode } from "next/headers";
import { createDataAttribute } from "next-sanity";
import { cache } from "react";
import { companyName, companyNumber, registeredOffice, instagramUrl as defaultInstagram, nav } from "@/lib/site";
const defaultCompany = { name: companyName, number: companyNumber, office: registeredOffice };
import { defaultSchedule, type Hours, type Schedule } from "@/lib/week";

// Reads what the club edits in Sanity (the studio is in /studio): the opening hours, the address and Instagram link, the Privacy and
// Accessibility text, and the sections of the Visit, Music and About pages and of any page the club adds. Server only. The dataset is public to read, so no key is needed. Anything
// Sanity can't give (not reachable, not filled in yet) falls back to what is written in the code, so the site never breaks.
const projectId = "ok5py3p6";
const dataset = "production";
// the live API, not the cached one (apicdn): the cached copy can hold an old answer for minutes after an edit. The site asks at most once a minute
// (see query), so this stays far inside the free plan's request limit.
const api = `https://${projectId}.api.sanity.io/v2025-10-01/data/query/${dataset}`;

// Presentation (the studio's live preview): the studio turns on Next.js draft mode, and then the site reads the unpublished edits too,
// with a read-only token (SANITY_API_READ_TOKEN, a Viewer token that stays on the server) and without the wait
// read when needed, not when the file loads: on Cloudflare Workers the secrets are only there once a request is running
const readToken = () => process.env.SANITY_API_READ_TOKEN;
export async function isDraft() {
  try {
    return !!readToken() && (await draftMode()).isEnabled;
  } catch {
    return false;
  }
}

// What the studio needs on an element to open its field when it is clicked in Presentation (nothing outside draft mode)
export async function editAttr(id: string, type: string, path: string) {
  return (await isDraft()) ? createDataAttribute({ id, type, path }).toString() : undefined;
}

async function query<T>(groq: string): Promise<T | null> {
  try {
    const draft = await isDraft();
    // fetched again at most every 15 minutes, so an edit shows within that time of being published (every minute used up the free plan's
    // 1,000 cache writes a day by the morning: from then on nothing refreshes until midnight UTC)
    const res = await fetch(
      `${api}?query=${encodeURIComponent(groq)}${draft ? "&perspective=drafts" : ""}`,
      draft ? { cache: "no-store", headers: { Authorization: `Bearer ${readToken()}` } } : { next: { revalidate: 900 } },
    );
    if (!res.ok) return null;
    return ((await res.json()) as { result: T }).result ?? null;
  } catch {
    return null;
  }
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Monday first, as Date.getDay() numbers
const weekOrder = [1, 2, 3, 4, 5, 6, 0];

type FindUsLine = { _key?: string; children?: { _key?: string; text?: string; marks?: string[] }[]; markDefs?: { _key?: string; _type?: string; href?: string }[] };

// "Find us" one line to a paragraph, whether the club pressed Enter (a new paragraph) or Shift+Enter (a line break inside one) between the lines
export function oneLineEach(blocks: FindUsLine[]): FindUsLine[] {
  return blocks.flatMap((b) => {
    const lines: FindUsLine[] = [{ ...b, children: [] }];
    for (const c of b.children ?? []) {
      (c.text ?? "").split("\n").forEach((text, i) => {
        if (i > 0) lines.push({ ...b, _key: `${b._key}-${lines.length}`, children: [] });
        if (text.trim()) lines[lines.length - 1].children!.push({ ...c, _key: `${c._key}-${i}`, text });
      });
    }
    return lines.filter((l) => l.children!.length);
  });
}

type SettingsDoc = {
  hours?: { day?: string; first?: string; last?: string; opens: string; closes: string; note?: string }[];
  findUs?: FindUsLine[];
  footerText?: unknown[];
};

const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

function toSchedule(doc: SettingsDoc | null): Schedule {
  if (!doc) return defaultSchedule;
  const hours: Hours = { ...defaultSchedule.hours };
  const notes: Schedule["notes"] = { ...defaultSchedule.notes };
  // each line of the club's hours is a run of days (Monday to Thursday): worked out into one entry per weekday, Monday first. Lines that
  // don't cover all seven days give the hours written in the code.
  if (doc.hours?.length) {
    const filled = new Set<number>();
    for (const g of doc.hours) {
      const i = dayNames.indexOf(g.first ?? g.day ?? "");
      const j = dayNames.indexOf(g.last ?? g.first ?? g.day ?? "");
      if (i < 0 || j < 0 || !g.opens || !g.closes) return defaultSchedule;
      const open = minutes(g.opens);
      let close = minutes(g.closes);
      // a closing time at or before opening is after midnight (02:00 is 26 * 60)
      if (close <= open) close += 24 * 60;
      for (let d = weekOrder.indexOf(i); ; d = (d + 1) % 7) {
        const day = weekOrder[d];
        hours[day] = { open, close };
        notes[day] = g.note || undefined;
        filled.add(day);
        if (day === j) break;
      }
    }
    if (filled.size !== 7) return defaultSchedule;
  }
  return { hours, notes };
}

const settingsQuery = `*[_id == "siteSettings"][0]{hours[]{day, first, last, opens, closes, note}, findUs, footerText}`;

// cache() shares one read between the layout, the footer, the pages and the table within a request
const settings = cache(() => query<SettingsDoc>(settingsQuery));

export const getSchedule = async () => toSchedule(await settings());

// The address and Instagram link (footer and header), with what is written here when the club hasn't filled them in
export type SiteInfo = {
  address1: string;
  address2: string;
  // the link the club put on the address (select it in Find us and press the link button); undefined: Google Maps, made from the address
  mapsUrl?: string;
  instagramUrl: string;
  // the lines after the address (Email us, Instagram...) as the club wrote them (null: the links written in the footer)
  links: unknown[] | null;
  // the small print as the club wrote it (null: the lines written in the footer)
  footerText: unknown[] | null;
};

const plain = (b?: { children?: { text?: string }[] }) => (b?.children ?? []).map((c) => c.text ?? "").join("").trim();

// "Find us" in Sanity: the first two lines are the address, the rest are links (the Instagram link is also the one in the menu)
export async function getSiteInfo(): Promise<SiteInfo> {
  const s = await settings();
  const lines = oneLineEach(s?.findUs ?? []);
  const rest = lines.slice(2);
  // the first link on the two address lines
  const mapsUrl = lines
    .slice(0, 2)
    .flatMap((l) => (l.children ?? []).flatMap((c) => (c.marks ?? []).map((m) => (l.markDefs ?? []).find((d) => d._key === m && d._type === "link")?.href)))
    .find((h) => !!h && /^https?:\/\//.test(h));
  const instagram = lines.flatMap((l) => l.markDefs ?? []).find((m) => m._type === "link" && /instagram\.com/.test(m.href ?? ""))?.href;
  return {
    address1: plain(lines[0]) || "276 Northdown Road",
    address2: plain(lines[1]) || "Margate CT9 2PT",
    mapsUrl: mapsUrl || undefined,
    instagramUrl: instagram || defaultInstagram,
    links: rest.length ? rest : null,
    footerText: s?.footerText?.length ? s.footerText : null,
  };
}

// The header's menu as the club has set it in "Menu" in the studio: the pages in the club's order (Contact and Instagram follow, in the
// header). Before Menu is filled in (or if Sanity can't be reached): the fixed pages, then any page with the old "Show in the menu" ticked.
export type MenuPage = { label: string; href: string };
// Visit, Music and About: their Sanity documents, by the name they have in the code (and the address they started with). The club can
// rename each in the studio, and the page's address follows its name (Music → Sound gives /sound): the page then answers at the new address,
// and the old one (/music) sends people to it for good. Only that first address is remembered, not the ones between.
export const fixedPages = { visit: "page-visit", music: "page-music", about: "page-about" } as const;
export type FixedName = keyof typeof fixedPages;
const fixedNameById = Object.fromEntries(Object.entries(fixedPages).map(([name, id]) => [id, name])) as Record<string, FixedName>;
const defaultTitle: Record<FixedName, string> = { visit: "Visit", music: "Music", about: "About" };

// A page's address from its name: lower-case letters and numbers with single dashes ("Live Sound" -> "live-sound"). The studio has the same
// function (studio/addresses.ts) to check a name before it is saved.
export const addressOf = (title: string) =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
// Addresses the site itself uses (the same list as the studio's), which a renamed page can't take
const reserved = ["visit", "music", "about", "privacy", "accessibility", "newsletter", "mailing-list", "company", "studio", "design-system", "our-week", "live-music", "api", "icon.svg", "favicon.ico", "robots.txt", "sitemap.xml", "admin", "share.png", "apple-icon.png", "wp-admin", "wp-login.php"];

export type FixedPage = { title: string; slug: string };
export const getFixedPages = cache(async (): Promise<Record<FixedName, FixedPage>> => {
  const docs = await query<{ _id: string; title?: string }[]>(`*[_id in ${JSON.stringify(Object.values(fixedPages))}]{_id, title}`);
  const names = Object.keys(fixedPages) as FixedName[];
  const title = (name: FixedName) => docs?.find((d) => d._id === fixedPages[name])?.title?.trim() || defaultTitle[name];
  const out = {} as Record<FixedName, FixedPage>;
  for (const name of names) {
    const wanted = addressOf(title(name));
    // the studio refuses a name with no address, or one the site already uses, or one another of the three has; if one got through anyway
    // (or Sanity can't be reached) the page keeps the address it started with
    const taken = (reserved.includes(wanted) && wanted !== name) || names.some((other) => other !== name && addressOf(title(other)) === wanted);
    out[name] = { title: title(name), slug: wanted && !taken ? wanted : name };
  }
  return out;
});
export const getFixedPage = async (name: FixedName) => (await getFixedPages())[name];
// Which of the three is at this address, when the club has moved it there (/sound): the dynamic route's way of knowing
export const fixedNameAt = async (slug: string) => {
  const all = await getFixedPages();
  return (Object.keys(all) as FixedName[]).find((name) => all[name].slug === slug && slug !== name);
};

export const getMenu = cache(async (): Promise<MenuPage[]> => {
  const doc = await query<{ items?: { kind: string; id?: string; title?: string; slug?: string }[] }>(
    `*[_id == "menu"][0]{items[]{"kind": _type, "id": @->_id, "title": @->title, "slug": @->slug.current}}`,
  );
  const fixedAll = await getFixedPages();
  const items = (doc?.items ?? []).flatMap((i): MenuPage[] => {
    if (i.kind === "whatsOn") return [nav[0]];
    const id = String(i.id ?? "").replace(/^drafts\./, "");
    const fixed = fixedNameById[id];
    const href = fixed ? `/${fixedAll[fixed].slug}` : i.slug ? `/${i.slug}` : null;
    // a page that has been deleted, or has no address yet, is left out
    return href && i.title ? [{ label: i.title, href }] : [];
  });
  if (items.length) return items;
  const pages = await query<{ title: string; slug: string }[]>(
    `*[_type == "page" && showInMenu == true && defined(slug.current) && !(_id in path("drafts.**"))] | order(_createdAt asc){title, "slug": slug.current}`,
  );
  return [...nav, ...(pages ?? []).map((p) => ({ label: p.title, href: `/${p.slug}` }))];
});

// "2026-10-19" -> "19 October 2026"
export const longDate = (iso?: string) =>
  iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : undefined;

// A page the club added, by its address (null when there is none, or Sanity can't be reached)
export const getPageBySlug = cache(async (slug: string) => {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  return query<{ _id: string; title: string; description?: string; sections?: CmsSection[] }>(
    `*[_type == "page" && slug.current == "${slug}" && !(_id in path("drafts.**"))][0]{_id, title, description, sections[]{_key, label, body, listItems[]{name, url}, listLinksToEvents, afterList, "photo": photo{"ref": asset._ref, alt}}}`,
  );
});

// Privacy or Accessibility as the club has them in Sanity (null: use the text written in the code)
export const getLegal = cache(async (key: "privacy" | "accessibility") =>
  query<{ title?: string; updated?: string; body?: unknown[] }>(`*[_id == "legal-${key}"][0]{title, updated, body}`),
);

// The company's registration details as the club has them in Sanity (Legal > Company in the studio), each falling back to the one written in
// src/lib/site.ts if Sanity has none or can't be reached
export type Company = { name: string; number: string; office: string };
export const getCompany = cache(async (): Promise<Company> => {
  const doc = await query<{ companyName?: string; companyNumber?: string; registeredOffice?: string }>(`*[_id == "legal-company"][0]{companyName, companyNumber, registeredOffice}`);
  return {
    name: doc?.companyName?.trim() || defaultCompany.name,
    number: doc?.companyNumber?.trim() || defaultCompany.number,
    office: doc?.registeredOffice?.trim() || defaultCompany.office,
  };
});

export type CmsSection = {
  _key?: string;
  label?: string;
  body?: unknown[];
  // a name, or (as the club now edits it) a name with its own web address
  listItems?: (string | { name?: string; url?: string })[];
  listLinksToEvents?: boolean;
  afterList?: string;
  photo?: { ref?: string; alt?: string };
};

export const getSections = cache(async (page: "visit" | "music" | "about") => {
  const doc = await query<{ sections?: CmsSection[] }>(
    `*[_id == "page-${page}"][0]{sections[]{_key, label, body, listItems[]{name, url}, listLinksToEvents, afterList, "photo": photo{"ref": asset._ref, alt}}}`,
  );
  return doc?.sections?.length ? doc.sections : null;
});

// image-<hash>-<width>x<height>-<ext>  ->  the file's address on Sanity's image CDN (resized by image-loader.ts)
export function sanityImageUrl(ref: string) {
  const m = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref);
  return m ? `https://cdn.sanity.io/images/${projectId}/${dataset}/${m[1]}-${m[2]}.${m[3]}` : null;
}

// The newsletter's introduction and small print as the club wrote them (empty: the address is used, and no introduction)
export const getNewsletterContent = cache(async () => {
  const doc = await query<{ intro?: string; footerText?: unknown[]; footerBottom?: unknown[]; topImage?: { url?: string; alt?: string; href?: string; spacing?: number }; sendWeekly?: boolean; sendMonthly?: boolean }>(
    `*[_id == "newsletter"][0]{intro, "footerText": footerText, footerBottom, "topImage": topImage{"url": image.asset->url, alt, href, spacing}, sendWeekly, sendMonthly}`,
  );
  const top = doc?.topImage;
  return {
    intro: doc?.intro,
    footer: doc?.footerText?.length ? doc.footerText : null,
    footerBottom: doc?.footerBottom?.length ? doc.footerBottom : null,
    topImage: top?.url ? { src: top.url, alt: top.alt ?? "", href: top.href, spacing: (top.spacing === 60 ? 60 : 30) as 30 | 60 } : undefined,
    // the club's on/off switches, off unless switched on; null when Sanity can't be reached (then nothing is started or stopped)
    send: doc ? { weekly: doc.sendWeekly === true, monthly: doc.sendMonthly === true } : null,
  };
});

// The search description the club wrote for one of its pages ("page-visit"), if any
export const getPageDescription = cache(async (id: string) =>
  (await query<{ description?: string }>(`*[_id == "${id}"][0]{description}`))?.description?.trim() || undefined,
);

// Every page the club added (for the sitemap), with when it last changed
export const getPageList = cache(async () =>
  (await query<{ slug: string; updated: string }[]>(`*[_type == "page" && defined(slug.current) && count(sections) > 0 && !(_id in path("drafts.**")) && !(_id in ${JSON.stringify(Object.values(fixedPages))})]{"slug": slug.current, "updated": _updatedAt}`)) ?? [],
);
