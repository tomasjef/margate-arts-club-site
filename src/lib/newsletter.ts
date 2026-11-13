import { formatDate, formatDateRange, type Event, type EventDate } from "@/lib/events";
import { emailParts, mapsUrlFor, ownPath, siteName } from "@/lib/site";
import { moreDates, oneDate } from "@/lib/event-when";

// The weekly and monthly newsletters. Everything in the middle comes from the events (OutSavvy); the club edits the introduction and the
// small print in Sanity ("Newsletter"). Built as an HTML email in the website's look: the pale grey page, white boxes with a
// 1px black line, each event a square poster beside its date, title and price. Email programs can't be trusted with the website's font or layout
// tools, so it is plain tables with the styles written on each element, in Helvetica/Arial.
export type Period = "weekly" | "monthly";

type Block = { children?: { text?: string; marks?: string[] }[]; markDefs?: { _key: string; _type: string; href?: string }[] };
export type TopImage = { src: string; alt: string; href?: string; spacing: 30 | 60 };
export type NewsletterContent = { intro?: string; footer?: unknown[] | null; footerBottom?: unknown[] | null; topImage?: TopImage };

// "2026-11-23" for today in London, whatever the server's clock zone
export const londonDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(d);
const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// "2–8 Nov", "30 Nov–5 Dec": the dates of a week without the weekdays, for the subject
function shortRange(from: string, to: string) {
  const [d1, m1] = formatDate(from).split(" ").slice(1);
  const [d2, m2] = formatDate(to).split(" ").slice(1);
  return m1 === m2 ? `${d1}–${d2} ${m1}` : `${d1} ${m1}–${d2} ${m2}`;
}

// Weekly: from today for seven days (it goes out on a Monday morning). Monthly: the whole month it goes out in (on the 1st).
export function rangeFor(period: Period, today: string) {
  if (period === "weekly") {
    const to = addDays(today, 6);
    return { from: today, to, key: `weekly-${today}`, label: formatDateRange(today, to), subject: `What’s on: ${shortRange(today, to)}` };
  }
  const [y, m] = today.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  const to = addDays(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`, -1);
  return { from, to, key: `monthly-${y}-${String(m).padStart(2, "0")}`, label: `${MONTHS[m - 1]} ${y}`, subject: `What’s on in ${MONTHS[m - 1]}` };
}

export type Item = { event: Event; dates: EventDate[] };

// Events with OutSavvy's 1080 x 1080 square poster use it; one without falls back to its 16:9 banner, cropped to a square in the email like
// the website's tiles (see the poster markup below).
// Each event once, with the dates that fall in the period (an event that repeats lists its dates in it), soonest first. Only events with a real
// poster address: the stand-in events used when OutSavvy can't be reached have none.
export function itemsFor(events: Event[], from: string, to: string): Item[] {
  const items: Item[] = [];
  for (const event of events) {
    if (!event.image.startsWith("http")) continue;
    const dates = (event.dates ?? [{ date: event.date, endDate: event.endDate }]).filter((d) => d.date <= to && (d.endDate ?? d.date) >= from);
    if (dates.length) items.push({ event, dates });
  }
  return items.sort((a, b) => a.dates[0].date.localeCompare(b.dates[0].date));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\{/g, "&#123;");
const FONT = "Helvetica Neue,Helvetica,Arial,sans-serif";
// Under a poster, as on the site: the event's first date in the period with its time, and for an event that repeats, how many other dates
// it has ("+ 3 more dates", all of them, not only those in the period: Book Tickets shows them)
const when = (item: Item) => {
  const others = (item.event.dates?.length ?? 1) - 1;
  return { first: oneDate(item.dates[0]), more: others > 0 ? moreDates(others) : "" };
};

const UNSUB = "{{unsubscribeUrl}}";
const hasUnsub = (blocks: unknown[] | null | undefined) => ((blocks ?? []) as Block[]).some((b) => b.markDefs?.some((d) => d._type === "unsubscribeLink"));

// The club's small print (Sanity text) as email HTML: paragraphs, links, and "Lighter" words. `end` goes at the end of each paragraph
function footerHtml(blocks: unknown[] | null | undefined, baseUrl: string, gap = 12, end: () => string = () => "") {
  if (!blocks?.length) return "";
  return (blocks as Block[])
    .map((b, n, all) => {
      const inner = (b.children ?? [])
        .map((c) => {
          let t = esc(c.text ?? "").replace(/\n/g, "<br>");
          for (const m of c.marks ?? []) {
            const def = b.markDefs?.find((d) => d._key === m);
            const href = def?.href ? ownPath(def.href) : "";
            if (def?._type === "link" && href) t = `<a href="${esc(href.startsWith("/") ? `${baseUrl}${href}` : href)}" style="color:#000000;text-decoration:underline">${t}</a>`;
            else if (def?._type === "emailLink") t = `<a href="mailto:${emailParts.join("@")}" style="color:#000000;text-decoration:underline">${t}</a>`;
            else if (def?._type === "unsubscribeLink") t = `<a href="${UNSUB}" style="color:#000000;text-decoration:underline">${t}</a>`;
            else if (m === "light") t = `<span style="color:#808080">${t}</span>`;
          }
          return t;
        })
        .join("");
      return `<p style="margin:0 0 ${n === all.length - 1 && gap !== 12 ? 0 : gap}px 0">${inner}${end()}</p>`;
    })
    .join("");
}
// The same as plain text, with the address after a link unless the words are the address
const footerPlain = (blocks: unknown[] | null | undefined, baseUrl = "") =>
  ((blocks ?? []) as Block[])
    .map((b) =>
      (b.children ?? [])
        .map((c) => {
          const t = c.text ?? "";
          const def = b.markDefs?.find((d) => c.marks?.includes(d._key));
          const href =
            def?._type === "unsubscribeLink" ? UNSUB
            : def?._type === "emailLink" ? emailParts.join("@")
            : def?._type === "link" && def.href ? (ownPath(def.href).startsWith("/") ? `${baseUrl}${ownPath(def.href)}` : def.href)
            : "";
          return href && href.replace(/^https?:\/\//, "").replace(/\/$/, "") !== t.trim() ? `${t}: ${href}` : t;
        })
        .join(""),
    )
    .join("\n\n");

// What the footer needs from the site settings: the address, the Instagram link and the opening hours as the site's footer shows them
// ("Mon–Thu" "12pm–11pm"; the notes under the hours, like "Free entry before 8pm", are left out)

export type Venue = { address1: string; address2: string; instagramUrl: string; hours: { label: string; open: string }[] };

// "20 Oct 2026" for the date line under the name
const longDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1].slice(0, 3)} ${y}`;
};

type Mail = { period: Period; today: string; events: Event[]; content: NewsletterContent; venue: Venue; baseUrl: string };

// The weekly and the monthly email, as in the Figma frame (the weekly one; the monthly is the same page with its own heading and the month's events) "Newsletter": white page, a 600px column, the name in capitals beside the animated shape (triangle,
// square, circle, as on the website), hairlines between the parts, each event a poster, its date, its title and a black button, then the small print.
// One leading, as on the site: 1.2 for everything, with one line between paragraphs; the footer more open (20px lines at 14px). The date and the title are set at 1.2 (36px lines at 30px, 30px at 25px on phones), with a quarter of a
// line between them (9px, 8px on phones: 0.3em), so they read as two blocks, as on What's On.
// Spaced in the page's margin (16px) as What's On is in the site's: the poster to the date's capitals one margin, the title's baseline to the
// buttons two, the buttons one apart (and one under them, should they wrap), and the buttons to the next poster four (five on a phone; one
// more each from 6 Nov 2026).
// Book Tickets is filled black, so it stands out as the email's call to action (the site's are white); Add to Calendar is white with a black
// line, and Sold out filled red. The buttons are the site's size: 20px type, 11px by 14px inside the line (48px tall, as the site's from
// 1440px wide; 10px until 6 Nov 2026), and on a phone 18px type, 13px above and below (50px tall). Hovered, they swap colours (black to white, white to black; Sold out stays as it is), where the
// email program allows it: on a computer (Apple Mail, Gmail and Outlook in a browser), not on phones or in Outlook for Windows.
// The colours are the site's: greys black at 65% (#595959: the dates, the small print) and 50% (#808080: the further dates), Sold out pure red. The frame's Archivo can't be sent (email programs ignore web fonts),
// so Archivo is named first for the few that have it, then Helvetica/Arial. The shape's first frame is a triangle, which is what Outlook for
// Windows (it stops GIFs on the first frame) shows.
export function renderNewsletter(o: Mail) {
  const v = o.venue;
  const r = rangeFor(o.period, o.today);
  const kind = o.period === "weekly" ? "Weekly" : "Monthly";
  const heading = o.period === "weekly" ? "What’s on this week" : "What’s on this month"; // the month is in the subject and the date line
  const items = itemsFor(o.events, r.from, r.to);
  const unsub = UNSUB;
  const bottom = o.content.footerBottom;
  // The town on one line and "Kent CT9 2PT" on the next, whether the site settings say "Margate CT9 2PT" or "Margate, Kent, CT9 2PT", so the address
  // is as tall as the opening times beside it
  const postcode = v.address2.match(/[A-Z]{1,2}\d[\dA-Z]?\s*\d[A-Z]{2}\s*$/i)?.[0];
  const town = postcode ? v.address2.slice(0, -postcode.length).replace(/[,\s]*Kent[,\s]*$/i, "").replace(/[,\s]+$/, "") : "";
  const addressLines = postcode && town ? [town, `Kent ${postcode.trim()}`] : [v.address2];
  const F = `Archivo,${FONT}`;
  const GREY = "#595959";
  const LINE = "#e4e4e4";
  const introParas = (o.content.intro ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const top = o.content.topImage;
  // Sanity serves the file as it was uploaded (no automatic format), so a GIF keeps moving; twice the width for sharp screens
  const topImg = top ? `<img src="${esc(top.src)}?w=1136" alt="${esc(top.alt)}" width="568" style="display:block;width:100%;height:auto;border:0">` : "";
  const rule = `<tr><td class="pad" style="padding:0 16px"><div style="height:1px;line-height:1px;font-size:1px;background:${LINE}">&nbsp;</div></td></tr>`;

  const box = (item: Item, i: number) => {
    const e = item.event;
    const soldOut = e.availability === "sold-out";
    // Add to Calendar: a calendar file for the first night, from the site (/api/calendar/<event>/<date>.ics); not for a sold-out event or a run over several days
    const first = item.dates[0];
    const cal = !soldOut && first.startUtc && !first.endDate
      ? `<table role="presentation" align="left" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0"><tr><td bgcolor="#ffffff" style="border:1px solid #000000;padding:0;mso-padding-alt:11px 14px;background:#ffffff"><a class="btn-o" href="${o.baseUrl}/api/calendar/${encodeURIComponent(e.slug)}/${first.date}.ics" style="display:block;padding:11px 14px;font-size:20px;line-height:24px;color:#000000;text-decoration:none">Add to Calendar</a></td></tr></table>`
      : "";
    const fill = soldOut ? "#ff0000" : "#000000"; // red when sold out, as on the site
    const button = soldOut ? "Sold out" : e.availability === "waiting-list" ? "Join the waiting list" : e.availability === "resale" ? "Buy resale tickets" : "Book Tickets";
    return `<tr><td class="pad${i === 0 ? "" : " ev"}" style="padding:${i === 0 ? "0" : "48px"} 16px 0 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%"><tr><td style="border:1px solid #000000;line-height:0;font-size:0"><a href="${esc(e.url)}"><img src="${esc(e.image)}" alt="${esc(e.imageAlt)}" width="566" style="display:block;width:100%;height:auto;border:0;background:#d9d9d9${e.squareImage === false ? ";aspect-ratio:1/1;object-fit:cover" : ""}"></a></td></tr></table>
<div class="t tc" style="font-size:30px;line-height:36px;font-weight:500;margin:9px 0 0 0"><span style="color:#595959">${esc(when(item).first)}</span>${when(item).more ? `<br><span style="color:#808080">${esc(when(item).more)}</span>` : ""}</div>
<div class="t tc tg" style="font-size:30px;line-height:36px;font-weight:500;margin:9px 0 0 0"><a href="${esc(e.url)}" style="color:#000000;text-decoration:none">${esc(e.title)}</a></div>
${button ? `<div class="tb" style="margin:25px 0 0 0;font-size:0;line-height:0"><table role="presentation" align="left" cellpadding="0" cellspacing="0" style="margin:0 16px 16px 0"><tr><td bgcolor="${fill}" style="background:${fill};border:1px solid ${fill};padding:0;mso-padding-alt:11px 14px"><a class="btn${soldOut ? "" : " btn-hover"}" href="${esc(e.url)}" style="display:block;padding:11px 14px;font-size:20px;line-height:24px;color:#ffffff;text-decoration:none">${button}</a></td></tr></table>${cal}<div style="clear:both;height:0;line-height:0;font-size:0">&nbsp;</div></div>` : ""}
</td></tr>`;
  };

  const small = `font-size:15px;line-height:18px;color:${GREY}`;
  // Gmail folds away ("…") the end of an email when it matches earlier emails from the same sender, and the footer is the same every week,
  // so each footer block carries a hidden code unique to this issue and this rendering
  const issue = `${r.key}-${Date.now().toString(36)}`;
  let n = 0;
  const hidden = () => `<span style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;mso-hide:all">${issue}-${++n}</span>`;
  const foot = `font-size:14px;line-height:20px;color:${GREY}`; // the footer, a size under the rest, more open (as the site's footer)
  const html = `<!doctype html><html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only"><meta name="x-apple-disable-message-reformatting"><meta name="format-detection" content="telephone=no,date=no,address=no,email=no"><!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]--><style>a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important}u+#body a{color:inherit}.btn-hover:hover{background:#ffffff !important;color:#000000 !important}.btn-o:hover{background:#000000 !important;color:#ffffff !important}@media only screen and (max-width:480px){.pad{padding-left:16px !important;padding-right:16px !important}.t{font-size:25px !important;line-height:30px !important}.tc{line-height:30px !important;margin-top:10px !important}.tg{margin-top:8px !important}.tb{margin-top:26px !important}.shape{width:20px !important;height:20px !important}.btn{font-size:18px !important;line-height:22px !important;padding:13px 13px !important}.btn-o{font-size:18px !important;line-height:22px !important;padding:13px 13px !important}.ev{padding-top:64px !important}.col{display:block !important;width:100% !important;padding:0 0 20px 0 !important}.col-last{padding-bottom:0 !important}}</style><title>${esc(r.subject)}</title></head>
<body id="body" bgcolor="#ffffff" style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(items.slice(0, 3).map((i) => i.event.title).join(" · "))}${"&zwnj;&nbsp;".repeat(60)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background:#ffffff"><tr><td align="center" bgcolor="#ffffff">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;font-family:${F};color:#000000">
<tr><td class="pad" style="padding:23px 16px 22px 16px"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="middle" style="padding:0 9px 0 0;line-height:0"><img class="shape" src="${o.baseUrl}/newsletter-shape-v2.gif" width="24" height="24" alt="" style="display:block;border:0;width:24px;height:24px"></td>
<td valign="middle" class="t" style="font-size:30px;line-height:36px;font-weight:500;text-transform:uppercase"><a href="${o.baseUrl}" style="color:#000000;text-decoration:none">${esc(siteName)}</a></td></tr></table></td></tr>
${rule}
<tr><td class="pad" style="padding:7px 16px 0 16px;${small}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="${small}">${kind} Newsletter</td><td align="right" style="${small}">${esc(longDay(o.today))}</td></tr></table></td></tr>
${top ? `<tr><td class="pad" style="padding:${top.spacing - 6}px 16px 0 16px;line-height:0">${top.href ? `<a href="${esc(top.href)}">${topImg}</a>` : topImg}</td></tr>` : ""}
<tr><td class="pad t" style="padding:${top ? 55 : 49}px 16px 22px 16px;font-size:30px;line-height:36px;font-weight:500;text-transform:uppercase"><h1 class="t" style="margin:0;font-size:30px;line-height:36px;font-weight:500">${esc(heading)}</h1></td></tr>
${introParas.length ? `<tr><td class="pad" style="padding:0 16px 30px 16px;font-size:18px;line-height:1.2">${introParas.map((p) => `<p style="margin:0 0 22px 0">${esc(p).replace(/\n/g, "<br>")}</p>`).join("")}</td></tr>` : ""}
${items.length ? items.map(box).join("") : `<tr><td class="pad" style="padding:0 16px;font-size:18px;line-height:1.2">Nothing on sale for these dates yet. New events are added all the time.</td></tr>`}
<tr><td style="height:50px;line-height:50px;font-size:1px">&nbsp;</td></tr>
${rule}
<tr><td class="pad" style="padding:25px 16px 0 16px;${foot}">
${footerHtml(o.content.footer, o.baseUrl, 20, hidden) || `<p style="margin:0">${esc(siteName)} is a joyful, DIY, inclusive, intersectional, community organisation.<br>We have been running since 2015.${hidden()}</p>`}
</td></tr>
<tr><td class="pad" style="padding:20px 16px 0 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td class="col" width="50%" valign="top" style="width:50%;${foot}"><a href="${esc(mapsUrlFor(v))}" style="color:${GREY};text-decoration:underline"><span style="color:#000000">${esc(siteName)}</span><br>${esc(v.address1)}<br>${addressLines.map(esc).join("<br>")}</a>${hidden()}</td>
<td class="col col-last" width="50%" valign="top" style="width:50%;${foot}"><span style="color:#000000">Opening times</span><br>${v.hours.map((h) => `${esc(h.label)}: ${esc(h.open)}`).join("<br>")}${hidden()}</td>
</tr></table></td></tr>
<tr><td class="pad" style="padding:20px 16px 40px 16px;${foot}">
${bottom ? footerHtml(bottom, o.baseUrl, 20, hidden) : `<p style="margin:0 0 20px 0">You are receiving this email because you subscribed to our newsletter, or purchased a ticket to one of our events and consented to marketing from us. If you no longer wish to receive these emails, simply <a href="${unsub}" style="color:#000000;text-decoration:underline">unsubscribe</a>.${hidden()}</p><p style="margin:0"><a href="https://margatearts.club" style="color:#000000;text-decoration:underline">margatearts.club</a><br><a href="${esc(v.instagramUrl)}" style="color:#000000;text-decoration:underline">@margateartsclub</a>${hidden()}</p>`}
${bottom && !hasUnsub(bottom) ? `<p style="margin:20px 0 0 0"><a href="${unsub}" style="color:#000000;text-decoration:underline">Unsubscribe</a></p>` : ""}
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    siteName.toUpperCase(),
    `${kind} Newsletter, ${longDay(o.today)}`,
    "",
    heading.toUpperCase(),
    ...introParas,
    "",
    ...(items.length
      ? items.map((i) => `${[when(i).first, when(i).more].filter(Boolean).join(", ")}\n${i.event.title}${i.event.price ? ` (${i.event.price})` : ""}\n${i.event.url}\n`)
      : ["Nothing on sale for these dates yet."]),
    footerPlain(o.content.footer, o.baseUrl),
    "",
    `${siteName}\n${v.address1}\n${addressLines.join("\n")}`,
    "",
    `Opening times\n${v.hours.map((h) => `${h.label}: ${h.open}`).join("\n")}`,
    "",
    bottom
      ? footerPlain(bottom, o.baseUrl) + (hasUnsub(bottom) ? "" : `\n\nUnsubscribe: ${unsub}`)
      : `You are receiving this email because you subscribed to our newsletter, or purchased a ticket to one of our events and consented to marketing from us. If you no longer wish to receive these emails, unsubscribe: ${unsub}\n\nmargatearts.club · ${v.instagramUrl}`,
  ].join("\n").replace(/\{\{(?!unsubscribeUrl\}\})/g, "{ {");
  return { ...r, html, text, count: items.length };
}
