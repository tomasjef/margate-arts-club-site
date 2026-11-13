import { formatDateRange, type EventDate } from "@/lib/events";

// When an event is on, written the same way in the newsletter and on the site: its date with the time ("Thu 5 Nov at 7pm"), and for an
// event that repeats, on the next line, how many other dates it has ("+ 3 more dates")

// a run over several days keeps its range and has no time ("Fri 23 – Sun 25 Oct")
export const oneDate = (d: EventDate) => formatDateRange(d.date, d.endDate) + (d.time && !d.endDate ? ` at ${d.time}` : "");

export const moreDates = (n: number) => `+ ${n} more date${n > 1 ? "s" : ""}`;
