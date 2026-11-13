import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import { ScrollToSection } from "@/components/ScrollToSection";
import { titleWordStyle } from "@/lib/title-width";
import { inkStyle } from "@/lib/ink";

export type LegalSection = { key: "privacy" | "accessibility" | "company"; title: string; updated?: string; body: ReactNode };

// The plain text pages (Privacy, Accessibility, Company): each of the three addresses is one long page of all three, and /accessibility
// and /company open at their own part (until 6 Nov 2026 desktop had buttons for the three, one to a page; they went when the menu took
// the buttons' place under the header). Headings in capitals at the body size, the copy set at the body size across the box's full
// width; everything is 1.2em apart, so a heading has the same space above and below it.
// Each is a white box of its own, inset by the page margin, the three one under another on the one page (the user's choice, 6 Nov 2026,
// after trying them in one continuous box). Tablets and desktop: the name is the box's first line, the boxes one margin apart. Phones:
// each box under its name set as a page's name (the first where the other pages have theirs, the others two margins under the box
// before, so the name stays nearer its own box, 1.5 margins above it; four until 6 Nov 2026, when the user asked for less).
export function LegalPage({ current, sections }: { current: LegalSection["key"]; sections: LegalSection[] }) {
  const page = sections.find((s) => s.key === current)!;
  // on phones the three names share one size, the largest at which the longest of them fits
  const wordStyle = titleWordStyle(sections.map((s) => s.title));
  return (
    <PageShell title={page.title} tone="grey" rule={false}>
      {current !== sections[0].key && <ScrollToSection id={current} />}
      {sections.map((s, i) => (
        <section key={s.key} aria-labelledby={s.key} data-legal={s.key}>
          <h2
            id={s.key}
            className={`t-nav page-title ink px-(--pad) md:hidden ${i === 0 ? "" : "[--title-above:calc(var(--pad)*2)]"}`}
            style={{ ...wordStyle, ...inkStyle(s.title, 600, true) }}
          >
            {s.title}
          </h2>
          <div className="px-(--pad) md:pt-(--pad)">
            <div className="text-block t-body border border-ink bg-surface p-(--pad)">
              {/* on phones the name is above the box */}
              <h2 className="uppercase max-md:hidden">{s.title}</h2>
              {s.updated && <p className="mt-[0.4em] text-muted-light max-md:mt-0">Last updated {s.updated}</p>}
              <div
                className={`space-y-[1.2em] text-pretty [&>div>*+*]:mt-[1.2em] [&_h3]:uppercase [&_ul]:list-disc [&_ul]:pl-[1.2em] ${s.updated ? "mt-(--pad)" : "md:mt-(--pad)"}`}
              >
                {s.body}
              </div>
            </div>
          </div>
        </section>
      ))}
    </PageShell>
  );
}
