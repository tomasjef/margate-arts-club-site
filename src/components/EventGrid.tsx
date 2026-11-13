"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { matchesFilter, type DateFilter } from "@/lib/event-dates";
import { moreDates, oneDate } from "@/lib/event-when";
import { inkStyle } from "@/lib/ink";
import { availabilityLabels, formatDate, formatDateRange, type Event, type EventDate } from "@/lib/events";

const emptyMessage: Record<DateFilter, string> = {
  "All dates": "Nothing on the programme yet.",
  Today: "Nothing on today.",
  Tomorrow: "Nothing on tomorrow.",
  "This week": "Nothing on this week.",
};

// A date range may only break after its dash ("Fri 23 –" then "Sun 25 Oct 2026"), never inside either date
const dateParts = (text: string) =>
  text.split(" – ").map((part, i, all) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span className="whitespace-nowrap">{i < all.length - 1 ? `${part} –` : part}</span>
    </Fragment>
  ));

// Every upcoming date of an event, whether or not it repeats
const datesOf = (e: Event): EventDate[] => e.dates ?? [{ date: e.date, endDate: e.endDate }];

// An event repeating weekly shows once, on its first date that suits the chosen filter,
// followed by how many other dates it has
function showFor(e: Event, filter: DateFilter, today: string) {
  const all = datesOf(e);
  const shown = all.find((d) => matchesFilter(d.date, filter, today, d.endDate));
  return shown ? { event: e, shown, others: all.length - 1 } : null;
}

// `layout="stack"` (What's On, from 3 Nov 2026) lays the events out like the newsletter: see StackCard.
// `layout="pairs"` (the old What's On, kept at /whats-on-old): a checkerboard of squares, each event a poster square and a text square side
// by side (a two-column row of its own). The pair swaps sides every second row, so the four columns read as a chequered board.
export function EventGrid({ events, tagline, layout = "pairs" }: { events: Event[]; tagline?: ReactNode; layout?: "pairs" | "stack" }) {
  // Every date: the date filters (Today, Tomorrow, This week) were taken off on 6 Nov 2026, when the menu took their place under the
  // header (SiteHeader); the filtering is kept in lib/event-dates.ts
  const view: { filter: DateFilter; today: string } = { filter: "All dates", today: "" };
  const active = view.filter;
  const visible = events.flatMap((e) => showFor(e, view.filter, view.today) ?? []);
  const nextEvent = events.find((e) => datesOf(e).some((d) => d.date > view.today));
  const nextDate = nextEvent && datesOf(nextEvent).find((d) => d.date > view.today);

  return (
    <>
      {/* on phones the tagline comes first (no tagline in the boxed design, see globals.css) */}
      {tagline && <div className="tg-top px-(--pad) pt-[4px] pb-[18px] md:hidden">{tagline}</div>}

      {/* the page's tagline, between the menu and the events, when there is one */}
      {tagline && <div className="tg-bottom px-(--pad) pt-(--pad) max-md:hidden">{tagline}</div>}

      {/* on phones the first event starts right under the page's name, as a photo does on Visit (the name's line has the gap) */}
      {visible.length > 0 && layout === "stack" ? (
        <ul id="event-stack" className="grid grid-cols-1 gap-(--pad) px-(--pad) pt-(--pad) max-md:pt-0 pb-(--pad) max-md:pb-0 md:grid-cols-2 lg:grid-cols-3 min-[112.5rem]:grid-cols-4">
          {visible.map(({ event, shown, others }, i) => (
            <StackCard key={event.slug} event={event} night={shown} others={others} priority={i < 3} />
          ))}
        </ul>
      ) : visible.length > 0 ? (
        <ul id="event-results" className="grid grid-cols-1 lg:grid-cols-2 gap-(--pad) px-(--pad) pt-(--pad)">
          {visible.map(({ event, shown, others }, i) => {
            const flip = Math.floor(i / 2) % 2 === 1;
            return (
              <li
                key={event.slug}
                // the box line is drawn over the poster (after:), so the poster zooming on hover can never cover or thin it
                className="group relative grid grid-cols-2 bg-surface after:pointer-events-none after:absolute after:inset-0 after:z-10 after:border after:border-ink after:content-[''] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-[-2px] has-[a:focus-visible]:outline-ink"
              >
                <Poster event={event} priority={i < 4} />
                <Card event={event} shown={shown} others={others} className={flip ? "lg:order-first" : ""} />
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Spoken out when a filter has no events, and shows what is coming up instead. The text is held
          to half the page (six of twelve columns), the width of the left event box. It starts one page
          margin below the filter bar, where the first event would, and the footer follows it with the
          same gap as it does after events. */}
      <div role="status" aria-live="polite">
        {visible.length === 0 && (
          <div className="t-body px-(--pad) pt-(--pad) md:max-w-[calc(50%+var(--pad)/2)]">
            <p>{emptyMessage[active]}</p>
            {nextEvent && nextDate && (
              <p className="mt-[0.6em]">
                <span className="block text-muted">Next up:</span>
                <Link href={nextEvent.url} target="_blank" rel="noopener noreferrer" className="t-link max-md:flex max-md:flex-col">
                  {nextEvent.title}
                  <span className="max-md:hidden">, </span>
                  <span className="max-md:order-first">
                    {formatDate(nextDate.date)}
                  </span>
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

    </>
  );
}


function Poster({ event, priority }: { event: Event; priority: boolean }) {
  return (
    <div className={`poster relative overflow-hidden md:aspect-square`}>
      <Image
        src={event.image}
        alt={event.imageAlt}
        fill
        sizes="(min-width: 768px) 25vw, 50vw"
        className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
        priority={priority}
        // OutSavvy serves its images as text/plain, which the Next.js image optimiser refuses
        unoptimized={event.image.startsWith("http")}
      />
    </div>
  );
}

// The whole pair (poster and text) is one link: the title's ::after stretches over the pair's <li>.
// Hovering anywhere on the pair underlines the title and zooms the poster slightly inside its square.
// 2 sizes and Mono: each event is one hairline box with a gutter (the page margin) round it;
// inside the box the poster and text touch with no line between them.
function Card({ event, shown, others, className }: { event: Event; shown: EventDate; others: number; className: string }) {
  const status = event.availability ? availabilityLabels[event.availability] : null;
  const priceText = status ?? event.price;
  return (
    <article
      className={`flex aspect-square flex-col bg-card p-(--card-pad) ${className}`}
    >
      <p className="t-date">
        {dateParts(formatDateRange(shown.date, shown.endDate))}
        {others > 0 && (
          <>
            <br />
            <span className="text-muted-light">{`(+ ${others} other date${others > 1 ? "s" : ""})`}</span>
          </>
        )}
      </p>
      <h2 className="t-title break-words mt-[1.9vw] md:mt-[clamp(6px,1.25vw,18px)]">
        <Link
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-[0.12em] decoration-[0.07em] group-hover:underline after:absolute after:inset-0 after:content-['']"
        >
          {event.title}
        </Link>
      </h2>
      {/* 3 Sizes: tags as quiet grey text, with the price in a white box beneath them, both at
          the bottom left (the box is light grey in Mono, where the card itself is white) */}
      <div className="mt-auto">
        <p className="t-tag text-muted">{event.tags.join(", ")}</p>
        <p
          className={`chip t-button mt-3 md:mt-2 inline-block border border-transparent bg-card px-(--btn-px) py-(--btn-py) text-ink ${/^pay what you can$/i.test(priceText) ? "max-md:min-[360px]:whitespace-nowrap" : ""} ${status ? "chip--status" : ""} ${event.availability === "sold-out" ? "chip--sold" : ""}`}
        >
          {priceText}
        </p>
      </div>
    </article>
  );
}

// The newsletter's layout on the site: a card with one 1px black line round it all and one under the poster (none thicker on hover;
// 6 Nov 2026), the square poster, then, one margin in from the line, when (grey) and the title in one size, then Book Tickets
// and Add to Calendar. One column on phones, two from 768px, three from 1024px, four from 1800px (written 112.5rem: Tailwind
// sorts a px breakpoint before its own rem ones, so min-[1800px] lost to lg: and the four columns never showed, until 6 Nov 2026). An event that repeats
// is one card: its next night (the next one the filter chose) with its time, then how many other dates it has ("+ 3 more dates").
function StackCard({ event, night, others, priority }: { event: Event; night: EventDate; others: number; priority: boolean }) {
  const soldOut = event.availability === "sold-out";
  const label = soldOut ? "Sold out" : event.availability === "waiting-list" ? "Join the waiting list" : event.availability === "resale" ? "Buy resale tickets" : "Book Tickets";
  // a calendar file for that night; not for a sold-out event or a run over several days
  const cal = !soldOut && night.startUtc && !night.endDate ? `/api/calendar/${encodeURIComponent(event.slug)}/${night.date}.ics` : null;
  return (
    // the card's one outline, a 1px black line round the poster and the text under it, and a 1px black line between them at the poster's
    // foot (inside its square, so the image fills down to it and the hover zoom stays above it; the line came back 6 Nov 2026)
    <li className="group flex flex-col border border-ink bg-surface">
      <Link href={event.url} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" className="poster relative block aspect-square overflow-hidden border-b border-ink bg-card">
        <Image
          src={event.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-[1.04]"
          priority={priority}
          unoptimized={event.image.startsWith("http")}
        />
      </Link>
      {/* Under the poster, inside the card's outline: the date, the title and the buttons one margin in from its sides and the buttons
          one margin above its foot; in a row of cards the outlines end on one line. The spacing is the site's page margin (--pad: 18px on phones, 24px from 1440px wide), measured to the type the way it
          looks: the poster to the top of the date's capitals one margin, and the title's baseline to the buttons at least two (the lines'
          own space above the capitals is 0.23em, measured 6 Nov 2026 (0.19em until then left the date 1px low), below the baseline
          about 0.27em); the buttons one margin apart (side by side from 390px wide on phones, one under the other on narrower ones), and the cards one margin
          apart every way, across and down (6 Nov 2026; they were four margins apart down on phones, three from 768px). */}
      <div className="flex flex-1 flex-col px-(--pad) pb-(--pad)">
      <div className="t-stack mt-[calc(var(--pad)-0.23em)] mb-[-0.27em]">
        {/* ink: on phones the first letter of each line (the date, "+ 2 more dates", the title) starts on the poster's edge (lib/ink.ts),
            so the two date lines are a line each */}
        <p className="text-muted">
          <span className="ink block" style={inkStyle(oneDate(night))}>
            {oneDate(night)}
          </span>
          {others > 0 && (
            <span className="ink block text-muted-light" style={inkStyle(moreDates(others))}>
              {moreDates(others)}
            </span>
          )}
        </p>
        {/* the date and the title are set as the pages' text (1.2), with a quarter of a line (0.3em) between them, so they read as two blocks */}
        <h2 className="ink mt-[0.3em] break-words" style={inkStyle(event.title)}>
          <Link href={event.url} target="_blank" rel="noopener noreferrer" className="underline-offset-[0.12em] decoration-[0.07em] group-hover:underline">
            {event.title}
          </Link>
        </h2>
      </div>
      {/* pushed to the bottom, so in a row of cards the buttons line up whatever the length of the titles */}
      <div className="mt-auto flex flex-wrap gap-(--pad) pt-[calc(var(--pad)*2)]">
        <Link
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`t-stack-btn border ${soldOut ? "border-(--sold) bg-(--sold) text-white" : "border-ink bg-white text-ink hover:bg-ink hover:text-white group-hover:bg-ink group-hover:text-white group-has-[a[data-cal]:hover]:bg-white group-has-[a[data-cal]:hover]:text-ink"}`}
        >
          {label}
        </Link>
        {cal && (
          <a href={cal} data-cal className="t-stack-btn border border-ink bg-white text-ink hover:bg-ink hover:text-white">
            Add to Calendar
          </a>
        )}
      </div>
      </div>
    </li>
  );
}
