import { editAttr, getSchedule } from "@/lib/cms";
import { hoursGroups } from "@/lib/week";
import { inkStyle } from "@/lib/ink";

// The opening hours as lines of text, worked out from the one schedule in lib/week.ts. The notes under a line ("Free entry before 8pm")
// are the lighter grey (black at 50%); the footer leaves them out (notes={false}). With `ink` (the footer, where the lines start on the page
// margin) each line's first letter starts on the margin on phones (lib/ink.ts; the footer's type is the 500 weight).
export async function OpeningHours({ notes = true, ink = false }: { notes?: boolean; ink?: boolean }) {
  const groups = hoursGroups(await getSchedule());
  return (
    <div data-sanity={await editAttr("siteSettings", "siteSettings", "hours")}>
      {groups.map((g) => (
        <div key={g.label}>
          <p className={ink ? "ink" : undefined} style={ink ? inkStyle(g.label, 500) : undefined}>
            {g.label}: {g.open}
          </p>
          {notes && g.note && <p className="text-muted-light">{g.note}</p>}
        </div>
      ))}
    </div>
  );
}
