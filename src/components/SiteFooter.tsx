import { CopyrightYear } from "./CopyrightYear";
import { OpeningHours } from "./OpeningHours";
import { NewsletterSignup } from "./NewsletterSignup";
import Link from "next/link";
import { EmailLink } from "./EmailLink";
import { RichText } from "./RichText";
import { editAttr, getCompany, getSiteInfo } from "@/lib/cms";
import { creditUrl, mapsUrlFor } from "@/lib/site";
import { inkStyle } from "@/lib/ink";

export async function SiteFooter() {
  const [info, company, editFindUs, editFooter] = await Promise.all([
    getSiteInfo(),
    getCompany(),
    editAttr("siteSettings", "siteSettings", "findUs"),
    editAttr("siteSettings", "siteSettings", "footerText"),
  ]);
  return <FooterPlain info={info} companyName={company.name} edit={[editFindUs, editFooter]} />;
}

// From 768px: one size, in one row on the twelve-column grid (the quarter lines are still where the event squares start):
//  - row one with grey headings: Opening hours from column one; Find us (the address, linked to Maps)
//    from column four, with the email and Instagram links under it as part of the same block (one heading); the mailing list sign-up (field and
//    Subscribe on one hairline) from column seven, its hairline running to the right margin
//    Under the sign-up, level with the last two lines of the other columns, sit two grey lines: the consent line (level with
//    Email us; "See our Privacy Policy" links to the policy, which holds the company's registration details) and the copyright
//    (level with Instagram), in the legal name (Margate Arts Club CIC), followed by the web credit ("Website by Public Identity", a link) on the same line.
//    Accessibility is reached from the Privacy page, which runs on into Accessibility and Company
// On phones: one column on the left margin (chosen 4 Nov 2026 over two columns), in three steps of space: the lines of a block; a
// block's parts (a grey heading and its text, the address and the links under it: 0.65em); and the sections (Opening hours, Find us,
// the sign-up: Find us one margin under the hours, the sign-up three margins under the links, both set by the user on 5 Nov 2026). The small print sits two margins under the sign-up's boxes, which reads as part of it.
// From 768px every line of the three columns is on one grid of the footer's lines (6 Nov 2026): a heading has one empty line under it, as
// the links have above them, so Weekly, Monthly and Subscribe are on the line of Mon–Thu and 276 Northdown Road, and the small print on
// the lines of Sun/Email us/Instagram (until then the headings were 0.65em above their text there too, and the sign-up's lines fell
// between the others').
// Spacing, in page margins: four below the content and, under the last line, the height of the header bar (desktop: see the boxed-button
// rule in globals.css, half the bar and one margin). Phones: three margins from the last box or event card to the top of "Opening hours"'
// capitals (4.5px under its line's top at the footer's 16px), the largest step of the page's spacing (cards one apart, titles one and a
// half, the footer's sign-up three under the links; 6 Nov 2026, the user asked for less than the four, five under the events, before),
// and two margins under the last line. Pages push the footer to the bottom of the screen when their content is short.
function FooterPlain({ info, companyName, edit }: { info: Awaited<ReturnType<typeof getSiteInfo>>; companyName: string; edit: (string | undefined)[] }) {
  return (
    <footer className="mt-[calc(var(--pad)*4)] pb-(--header-h) max-md:mt-[calc(var(--pad)*3-4.5px)] max-md:pb-[calc(var(--pad)*2)]">
      <div className="t-button leading-(--foot-lh) grid grid-cols-1 gap-x-(--pad) px-(--pad) md:gap-y-[2.5vw] md:grid-cols-12">
        <div className="md:col-span-3">
          {/* ink: on phones each line's first letter starts on the page margin, level with the logo (lib/ink.ts) */}
          <p className="ink text-muted" style={inkStyle("Opening hours", 500)}>Opening hours</p>
          <div className="mt-[0.65em] md:mt-[1lh]">
            <OpeningHours notes={false} ink />
          </div>
        </div>
        <div className="max-md:mt-(--pad) md:col-span-3">
          <address className="not-italic">
            <p className="ink text-muted" style={inkStyle("Find us", 500)}>Find us</p>
            <a
              href={mapsUrlFor(info)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open Margate Arts Club, ${info.address1}, ${info.address2} in Maps (new tab)`}
              className="t-link mt-[0.65em] block w-fit md:mt-[1lh]"
            >
              <span className="ink block" style={inkStyle(info.address1, 500)} data-sanity={edit[0]}>{info.address1}</span>
              <span className="ink block" style={inkStyle(info.address2, 500)} data-sanity={edit[0]}>{info.address2}</span>
            </a>
          </address>
          <div data-sanity={edit[0]} className="mt-[0.65em] md:mt-[1lh]">
            {info.links ? (
              // the club's own links, one line each
              <div className="[&_p+p]:mt-0">
                <RichText value={info.links} ink={500} />
              </div>
            ) : (
              <ul>
                <li className="ink" style={inkStyle("Email us", 500)}>
                  <EmailLink className="t-link">Email us</EmailLink>
                </li>
                <li className="ink" style={inkStyle("Instagram", 500)}>
                  <a href={info.instagramUrl} target="_blank" rel="noopener noreferrer" className="t-link">
                    Instagram
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>
        <div className="col-span-full flex flex-col justify-between gap-y-[calc(var(--pad)*2)] max-md:mt-[calc(var(--pad)*3)] md:col-span-6 md:col-start-7 md:gap-y-0">
          <div>
            <NewsletterSignup />
          </div>
          {info.footerText ? (
            // the club's own small print: black text, with "Lighter" words and links as they chose them. {year} is today's year;
            // its paragraphs one under the other, with no line between them (phones too)
            <div data-sanity={edit[1]} className="md:mt-[1lh] [&_p+p]:mt-0">
              <RichText value={withYear(info.footerText)} softBreaks ink={500} />
            </div>
          ) : (
          <div className="text-muted-light md:mt-[1lh]">
            {/* each sentence moves to the next line as a whole, only when it doesn't fit (as the club's own text) */}
            <p className="ink" style={inkStyle("Subscribe", 500)}>
              <span className="inline-block">Subscribe to get our emails.</span>{" "}
              <span className="inline-block">
                See our{" "}
                <Link href="/privacy" className="t-link text-ink hover:text-muted">
                  Privacy Policy
                </Link>
                .
              </span>
            </p>
            <p className="ink" style={inkStyle("©", 500)}>
              <span className="inline-block">
                © <CopyrightYear /> {companyName}.
              </span>{" "}
              <span className="inline-block">
                Website by{" "}
                <a href={creditUrl} target="_blank" rel="noopener noreferrer" className="t-link text-ink hover:text-muted">
                  Public Identity.
                </a>
              </span>
            </p>
          </div>
          )}
        </div>
      </div>
    </footer>
  );
}

// {year} in the club's text becomes the current year
function withYear(blocks: unknown[]) {
  const year = String(new Date().getFullYear());
  return blocks.map((b) => {
    const block = b as { children?: { text?: string }[] };
    return { ...block, children: block.children?.map((c) => (typeof c.text === "string" ? { ...c, text: c.text.replaceAll("{year}", year) } : c)) };
  });
}
