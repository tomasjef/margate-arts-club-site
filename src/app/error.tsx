"use client";

import Link from "next/link";

// When a page fails to load (Sanity or OutSavvy down, say): the text-page box on its own (full width inside the margin) (the header and footer read from Sanity too, so
// they are left out), buttons to try again and to go to the home page
export default function Error({ reset }: { error: Error; reset: () => void }) {
  // the site's button, on phones the size of Book Tickets (as MailingListBox's buttonClass)
  const button =
    "t-button inline-block cursor-pointer border border-ink bg-white px-(--btn-px) py-(--btn-py) max-md:py-[13px] max-md:text-(length:--fs-text) text-ink hover:bg-ink hover:text-white";
  return (
    <main className="flex-1 px-(--pad) pt-(--pad) text-ink">
      <div className="t-body border border-ink bg-surface p-(--pad)">
        <h1 className="uppercase">Something went wrong</h1>
        <div className="mt-(--pad) space-y-[1.2em]">
          <p>Sorry, this page didn’t load. Please try again in a moment.</p>
          <p className="flex flex-wrap gap-(--pad)">
            <button type="button" onClick={reset} className={button}>
              Try again
            </button>
            <Link href="/" className={button}>
              Go to homepage
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
