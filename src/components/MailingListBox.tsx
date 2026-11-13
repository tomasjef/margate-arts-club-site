import type { ReactNode } from "react";
import { PageShell } from "@/components/PageShell";
import { titleWordStyle } from "@/lib/title-width";
import { inkStyle } from "@/lib/ink";

// The white box the mailing list pages (confirm, unsubscribe, done) and the Page not found page share, in the site’s text-page style: the
// page's full width inside the margin, the text across the box's full width, as the Privacy page's.
// On phones the name is above the box, set as a page's name where the other pages have theirs (as the Privacy page); on desktop it is the
// box's first line. The mailing list's pages have no footer, as the Newsletter page (the user's choice, 6 Nov 2026: they are a step in
// signing up or leaving, not somewhere to go on from); Page not found keeps it (`footer`).
export function MailingListBox({ title, footer = false, children }: { title: string; footer?: boolean; children: ReactNode }) {
  return (
    <PageShell title={title} tone="grey" rule={false} footer={footer}>
      <h2 className="t-nav page-title ink px-(--pad) md:hidden" style={{ ...titleWordStyle(title), ...inkStyle(title, 600, true) }}>
        {title}
      </h2>
      <div className="px-(--pad) md:pt-(--pad)">
        <div className="t-body border border-ink bg-surface p-(--pad)">
          <h2 className="uppercase max-md:hidden">{title}</h2>
          <div className="space-y-[1.2em] md:mt-(--pad)">{children}</div>
        </div>
      </div>
    </PageShell>
  );
}

// the site's button (Small type, as Subscribe), not the box's text size; on phones the size of Book Tickets and Subscribe (the Text
// size, 18px, 13px above and below: 50px tall; 6 Nov 2026)
export const buttonClass =
  "t-button inline-block cursor-pointer border border-ink bg-white px-(--btn-px) py-(--btn-py) max-md:py-[13px] max-md:text-(length:--fs-text) text-ink hover:bg-ink hover:text-white";
