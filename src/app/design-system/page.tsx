import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import { openStatus } from "@/lib/week";
import { hidden } from "@/lib/seo";

export const metadata = { title: "Design system", ...hidden };

// The site's type, colour, spacing and box styles, set with the real classes and variables from
// globals.css so this page cannot drift from the site. Not linked from the menu.
// Three sizes, given at the 1440px design, with the size they take on phones (below 768px):
// Large (--fs-large), Text (--fs-text) and Small (--fs-small) in globals.css.
const type = [
  { cls: "t-headline", name: "Large: headline", size: "30px", min: "19px", phone: "22px below 768px", weight: "600", note: "Uppercase. The home page tagline and the site name in the header", sample: "Margate Arts Club" },
  { cls: "t-nav", name: "Large: nav", size: "30px", min: "19px", phone: "22px below 768px", weight: "600", note: "Uppercase. The menu and the page name in the header", sample: "What’s on" },
  { cls: "t-title", name: "Text: title", size: "30px", min: "19px", phone: "18px below 768px", weight: "600", note: "Event titles on the cards", sample: "Floor is yours with special guests" },
  { cls: "t-body", name: "Text: body", size: "30px", min: "19px", phone: "18px below 768px", weight: "600", note: "Copy in the boxes on Visit, Music and About, and the messages", sample: "Listening bar, live music and arts space" },
  { cls: "t-date", name: "Small: date", size: "20px", min: "16px", weight: "500", note: "Uppercase. Dates on the event cards", sample: "Fri 16 Oct 2026" },
  { cls: "t-filter", name: "Small: filter", size: "20px", min: "16px", weight: "500", note: "Uppercase. The date filters and the Jump to links", sample: "This week" },
  { cls: "t-button", name: "Small: button", size: "20px", min: "16px", weight: "500", note: "Price boxes, buttons, opening hours, the footer, form fields", sample: "£5 to £12" },
  { cls: "t-tag", name: "Small: tag", size: "20px", min: "16px", weight: "500", note: "Grey tags under an event title", sample: "Live music, DJs" },
];

// Fixed moments (London time, October 2026) that show each state of the status line
const statuses = [
  { when: "Open: Wednesday 3pm", at: new Date("2026-10-21T14:00:00Z") },
  { when: "Open past midnight: Saturday night, 12.30am Sunday", at: new Date("2026-10-24T23:30:00Z") },
  { when: "Closed before opening: Wednesday 10am", at: new Date("2026-10-21T09:00:00Z") },
  { when: "Closed after closing: Wednesday 11.30pm", at: new Date("2026-10-21T22:30:00Z") },
];

const colours = [
  { token: "--page-bg", value: "#ffffff", note: "The page (it was the grey #f6f6f5). Tickets take it behind the poster" },
  { token: "--card", value: "#ecebe8", note: "Price boxes (and the event text squares in the plain option)" },
  { token: "white", value: "#ffffff", note: "Boxes, buttons, form fields, and the ticket text boxes" },
  { token: "--color-ink", value: "#000000", note: "Type and every line" },
  { token: "--muted", value: "rgb(0 0 0 / 0.65)", note: "Secondary type and hover on links: black at 65%, so on a coloured block the colour shows through. About 7:1 on the page and white" },
  { token: "--muted-light", value: "rgb(0 0 0 / 0.5)", note: "Notes and small print nobody needs to act on: tickets' other dates, opening-hours notes, Last updated, the footer's consent and copyright lines, the After 8pm line on Visit and the closing line on Music. About 3.7:1 on the tan block, so only for extras" },
  { token: "--open", value: "#00a35c", note: "Open today, Open until, the logo square and the sign-up confirmation. One green only; about 3:1 on the page, under the 4.5:1 text floor" },
  { token: "--sold", value: "#ff0000", note: "The sold-out box, the Closed status (red type) and the sign-up warning (red boxes and message)" },
];

// The first design's panel colours, lightened (the first design's colour mixed 60% toward white, grey 35%): all well clear of 4.5:1 with black type
const panels = [
  { token: "--panel-grey", value: "#dededd", note: "15.6:1 with black. Not used yet" },
  { token: "--panel-tan", value: "#e8e2db", note: "16.3:1 with black. Visit" },
  { token: "--panel-sage", value: "#dde3df", note: "16.1:1 with black. Music" },
  { token: "--panel-purple", value: "#ebddea", note: "16.1:1 with black. About (coloured-blocks preview)" },
  { token: "--panel-olive", value: "#d9d5bd", note: "14.2:1 with black. Not used yet" },
];

const spacing = [
  { token: "--pad", value: "22px (14px min); 24px in the boxed-button option", note: "The page margin and the gap between boxes, between buttons and under the buttons; everything is built from it" },
  { token: "--header-h", value: "72px (52px min); 68px on pages with a boxed button bar", note: "The header bar. Pages with the boxed buttons are 4px shorter so the gap from the site name to the buttons is one --pad. Under the footer: half of it in the boxed option" },
  { token: "--card-pad", value: "20px (14px min); --pad in the boxed option", note: "Inside an event text square" },
  { token: "Footer margin", value: "4 × --pad; 3 × --pad in the boxed option", note: "Above the footer, on desktop" },
  { token: "Open menu", value: "36px (boxed option)", note: "From the bottom of the site name's capitals to the first menu line, and from the last line to the buttons" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="px-(--pad) pt-[calc(var(--pad)*3)]">
      <h2 className="t-nav pb-(--pad)">{title}</h2>
      {children}
    </section>
  );
}

export default function Page() {
  return (
    <PageShell title="Design system" tone="grey">
      <Section title="Type">
        <p className="t-button pb-(--pad) text-muted">
          Archivo throughout, no letter spacing, three sizes: Large, Text and Small. Sizes at 1440px, shrinking in
          step with the page width to the smallest size shown. On phones (below 768px) they are fixed at 22px, 18px and 16px.
        </p>
        <ul className="border border-ink bg-white">
          {type.map((t) => (
            <li
              key={t.cls}
              className="grid gap-x-(--pad) gap-y-2 border-b border-ink p-(--pad) last:border-b-0 md:grid-cols-12"
            >
              <p className={`${t.cls} md:col-span-6`}>{t.sample}</p>
              <p className="t-button md:col-span-6">
                <span className="font-semibold">{t.name}</span> · <code>.{t.cls}</code>
                <br />
                {t.size} (min {t.min}){t.phone ? ` · phones ${t.phone}` : ""} · weight {t.weight}
                <br />
                <span className="text-muted">{t.note}</span>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Colour">
        <ul className="grid gap-(--pad) sm:grid-cols-2 lg:grid-cols-4">
          {colours.map((c) => (
            <li key={c.token} className="border border-ink bg-white">
              <div className="h-24 border-b border-ink" style={{ background: c.value }} />
              <p className="t-button p-(--card-pad)">
                <span className="font-semibold">{c.token}</span>
                <br />
                {c.value}
                <br />
                <span className="text-muted">{c.note}</span>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Secondary palette">
        <ul className="grid gap-(--pad) sm:grid-cols-2 lg:grid-cols-5">
          {panels.map((c) => (
            <li key={c.token} className="border border-ink bg-white">
              <div className="t-button h-24 border-b border-ink p-(--card-pad)" style={{ background: c.value }}>
                Black type
              </div>
              <p className="t-button p-(--card-pad)">
                <span className="font-semibold">{c.token}</span>
                <br />
                {c.value}
                <br />
                <span className="text-muted">{c.note}</span>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Spacing and lines">
        <ul className="border border-ink bg-white">
          {spacing.map((s) => (
            <li key={s.token} className="t-button grid gap-x-(--pad) border-b border-ink p-(--pad) md:grid-cols-12">
              <span className="font-semibold md:col-span-3">{s.token}</span>
              <span className="md:col-span-3">{s.value}</span>
              <span className="text-muted md:col-span-6">{s.note}</span>
            </li>
          ))}
          <li className="t-button grid gap-x-(--pad) p-(--pad) md:grid-cols-12">
            <span className="font-semibold md:col-span-3">Lines</span>
            <span className="md:col-span-3">1px black</span>
            <span className="text-muted md:col-span-6">
              Never thicker, except the 3px event-card hover box and the 3px menu hover underline. Pages with a button bar
              have no hairline under the header, scrolled or with the menu open
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Status line">
        <ul className="border border-ink bg-white">
          {statuses.map((x) => {
            const s = openStatus(x.at);
            return (
              <li key={x.when} className="t-button grid gap-x-(--pad) gap-y-1 border-b border-ink p-(--pad) last:border-b-0 md:grid-cols-12">
                <p className={`t-open md:col-span-6 ${s.open ? "text-open" : "text-(--sold)"}`}>{s.text}</p>
                <p className="text-muted md:col-span-6">{x.when}</p>
              </li>
            );
          })}
        </ul>
        <p className="t-button pt-[0.6em] text-muted">
          The line under the menu on phones and at the right of the header on wide screens, worked out in London time
          from the hours in <code>week.ts</code>. Green while the club is open (Small, weight 500), red when it is closed.
        </p>
      </Section>

      <Section title="Buttons, boxes and links">
        <div className="t-button flex flex-wrap items-start gap-(--pad) border border-ink bg-white p-(--pad)">
          <span className="border border-ink bg-white px-(--btn-px) py-(--btn-py) hover:bg-ink hover:text-white">
            Box button
          </span>
          <span className="border border-ink bg-ink px-(--btn-px) py-(--btn-py) text-white">Box button, chosen or current page</span>
          <span className="chip inline-block border border-transparent bg-card px-(--btn-px) py-(--btn-py)">£5 to £12</span>
          <span className="inline-block border border-transparent bg-(--sold) px-(--btn-px) py-(--btn-py) text-white">Sold out</span>
          <span className="t-link">Body link</span>
          <span className="text-(--open)">Open today 12pm–2am</span>
          <span className="text-(--sold)">Closed until 12pm</span>
        </div>
        <p className="t-button pt-[0.6em] text-muted">
          Every box (buttons, price and status boxes) has the same padding, 0.5em by 0.7em of its own type (--btn-py and --btn-px), inside a 1px border. Box buttons are white with a 1px black stroke and fill black on hover and when chosen. Links are underlined 1px and go
          grey on hover. Header and menu links go black with a 3px underline.
        </p>
      </Section>

      <Section title="Filters and Jump to links">
        <ul className="border border-ink bg-white">
          <li className="t-button grid gap-x-(--pad) gap-y-1 border-b border-ink p-(--pad) md:grid-cols-12">
            <span className="font-semibold md:col-span-4">Plain (the default)</span>
            <span className="text-muted md:col-span-8">
              Grey uppercase text between two 1px hairlines, a 3rem row; the chosen one is black. Sticks under the header on desktop
            </span>
          </li>
          <li className="t-button grid gap-x-(--pad) gap-y-1 border-b border-ink p-(--pad) md:grid-cols-12">
            <span className="font-semibold md:col-span-4">Boxed buttons</span>
            <span className="text-muted md:col-span-8">
              White boxes with a 1px stroke, one --pad apart, no hairlines; the chosen one, or the page you are on, is black. One --pad under the site
              name and one --pad above the first block (desktop). Used for the date filters, Jump to and the legal pages (Privacy, Accessibility, Company)
            </span>
          </li>
          <li className="t-button grid gap-x-(--pad) gap-y-1 p-(--pad) md:grid-cols-12">
            <span className="font-semibold md:col-span-4">Tickets and text boxes</span>
            <span className="text-muted md:col-span-8">
              Boxed option: a ticket is white behind its text, the page colour behind the poster, outlined in 1px black. Text boxes on Visit, Music and
              About have --pad inside them
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Mailing list sign-up">
        <ul className="border border-ink bg-white">
          <li className="t-button grid gap-x-(--pad) gap-y-1 border-b border-ink p-(--pad) md:grid-cols-12">
            <span className="font-semibold md:col-span-4">Subscribe</span>
            <span className="text-muted md:col-span-8">
              Always black type and stroke, with the pointing hand and a black fill on hover. Weekly and Monthly start unticked
            </span>
          </li>
          <li className="t-button grid gap-x-(--pad) gap-y-1 border-b border-ink p-(--pad) md:grid-cols-12">
            <span className="font-semibold md:col-span-4">Nothing ticked</span>
            <span className="md:col-span-8">
              <span className="text-(--sold)">Choose: Weekly, Monthly or both</span>
              <span className="text-muted"> · red, on the line of the boxes, which also get a red outline. Clears when one is ticked</span>
            </span>
          </li>
          <li className="t-button grid gap-x-(--pad) gap-y-1 p-(--pad) md:grid-cols-12">
            <span className="font-semibold md:col-span-4">Sent</span>
            <span className="md:col-span-8">
              <span className="text-(--open)">Thanks, you’re signed up</span>
              <span className="text-muted"> · green, in the same place. The form is not wired to a service yet</span>
            </span>
          </li>
        </ul>
      </Section>

      <Section title="Page colours">
        <p className="t-button text-muted">
          Visit, Music and About have text boxes in their own pale colour (tan, sage, purple) with black type; every other page keeps white boxes.
          Their photos carry a light wash of the same colour (the colour multiplied in from the bottom edge, fading out upwards, plus a very light wash of its hue), so photos and boxes belong together. The original photo is kept as uploaded; the strength is --tint-strength in globals.css.
        </p>
      </Section>
    </PageShell>
  );
}
