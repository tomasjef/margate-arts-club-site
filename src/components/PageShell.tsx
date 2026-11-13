import type { CSSProperties, ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

// A content page in the site's black and white: header with its hairline, the page, footer. The
// h1 is for screen readers; the design shows no page title.
// With a `tone` the page sits on a pale wash (the boxes stay white). "grey" is the site's page colour, --page-bg (now white).
// `ink` is the deep shade of the wash's own colour that type and lines are set in instead of black
// (7:1 or better on the wash, and on the white boxes).
const washes: Record<string, { bg: string | undefined; ink: string }> = {
  // grey is the site default (--page-bg in globals.css), so it sets no background of its own: pointing
  // --page-bg at itself would make it invalid and the header would lose its background
  grey: { bg: undefined, ink: "#000000" },
};

export type PageTone = "grey";

export function toneStyle(tone: PageTone) {
  const { bg, ink } = washes[tone];
  return {
    ...(bg ? { "--page-bg": bg, background: bg } : {}),
    "--color-ink": ink,
  } as CSSProperties;
}

// `rule` is the hairline that appears under the header once the page scrolls, on phones (on by default). `footer={false}` leaves the footer off
// (the Newsletter page); the page then fills the window under the header, so its content can be centred in it.
export function PageShell({
  title,
  tone,
  rule = true,
  footer = true,
  children,
}: {
  title: string;
  tone?: PageTone;
  rule?: boolean;
  footer?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col text-ink" style={tone ? toneStyle(tone) : undefined}>
      <SiteHeader rule={rule} />
      <main className={footer ? "flex-1" : "flex flex-1 flex-col"}>
        <h1 className="sr-only">{title}</h1>
        {children}
      </main>
      {footer && <SiteFooter />}
    </div>
  );
}
