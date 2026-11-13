// Date filters for the event grid. Everything works on yyyy-mm-dd strings in UK time, the same
// form as Event.date, so "today" is the club's today wherever the visitor is.
export const dateFilters = ["All dates", "Today", "Tomorrow", "This week"] as const;
export type DateFilter = (typeof dateFilters)[number];

export function londonToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
}

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// "This week" runs from today to the coming Sunday, inclusive
function endOfWeek(today: string) {
  const [y, m, d] = today.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // Sunday is 0
  return addDays(today, (7 - weekday) % 7);
}

// A date or a run of dates (an exhibition) matches when any day of it falls in the filter's window
export function matchesFilter(date: string, filter: DateFilter, today: string, endDate = date) {
  const overlaps = (from: string, to: string) => date <= to && endDate >= from;
  switch (filter) {
    case "Today":
      return overlaps(today, today);
    case "Tomorrow":
      return overlaps(addDays(today, 1), addDays(today, 1));
    case "This week":
      return overlaps(today, endOfWeek(today));
    default:
      return true;
  }
}
