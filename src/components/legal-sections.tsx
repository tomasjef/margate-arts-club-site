import Link from "next/link";
import type { LegalSection } from "@/components/LegalPage";
import { RichText } from "@/components/RichText";
import { EmailLink } from "@/components/EmailLink";
import { editAttr, getCompany, getLegal, longDate, type Company as CompanyDetails } from "@/lib/cms";

// The three legal pages' text, in their order: each page shows its own on desktop, and all three on phones (see LegalPage).
// Privacy and Accessibility are as the club has them in Sanity ("Privacy page", "Accessibility page" in the studio); when Sanity has
// no text for one yet, or can't be reached, the text written below is shown.
export async function legalSections(): Promise<LegalSection[]> {
  const [privacy, accessibility, company] = await Promise.all([getLegal("privacy"), getLegal("accessibility"), getCompany()]);
  return [
    privacy?.body?.length
      ? {
          key: "privacy",
          title: "Privacy",
          updated: longDate(privacy.updated),
          body: (
            <div data-sanity={await editAttr("legal-privacy", "legalPage", "body")}>
              <RichText value={privacy.body} />
            </div>
          ),
        }
      : { key: "privacy", title: "Privacy", updated: "3 November 2026", body: <WrittenPrivacy company={company} /> },
    accessibility?.body?.length
      ? {
          key: "accessibility",
          title: "Accessibility",
          updated: longDate(accessibility.updated),
          body: (
            <div data-sanity={await editAttr("legal-accessibility", "legalPage", "body")}>
              <RichText value={accessibility.body} />
            </div>
          ),
        }
      : { key: "accessibility", title: "Accessibility", updated: "21 October 2026", body: <WrittenAccessibility company={company} /> },
    // the company's registration details (Companies House), which a limited company shows on its website; the club edits them in the studio
    // (Legal > Company)
    { key: "company", title: "Company", body: <Company company={company} /> },
  ];
}

// The Privacy text shown when Sanity has none
function WrittenPrivacy({ company: { name: companyName } }: { company: CompanyDetails }) {
  return (
    <>
      <p>
        This explains what personal information {companyName} (“we”, “us”) collects through this website, why, and
        your choices. We are the data controller.
      </p>
      <h3>Who we are</h3>
      <p>
        {companyName}, a community interest company registered in England and Wales. Our registration details are on
        the{" "}
        <Link href="/company" className="t-link">
          Company page
        </Link>
        . You can{" "}
        <EmailLink className="t-link">email us</EmailLink>
        .
      </p>
      <h3>The mailing list</h3>
      <p>
        If you join our mailing list we collect your email address and whether you want our weekly email, our
        monthly email, or both. We then email you a link to confirm, and only add you once you press it. If you
        agreed to hear from us when buying a ticket on OutSavvy, or were on our earlier mailing list, your email
        address came to us from there. We use it only to send you our emails, which list what is coming up at the
        club, and we do this with your consent.
      </p>
      <p>
        Your details are kept in our own database, hosted by Cloudflare. Our emails are sent through Amazon Web
        Services (Amazon SES) in London, which handles your email address only to deliver them. We don’t track
        whether you open our emails or click their links. Every email has an unsubscribe link, and you can also ask
        us to remove you at any time. When you unsubscribe, or our emails to you can’t be delivered, we keep your
        email address marked as unsubscribed, only so that we never email you again. Ask us and we will delete it
        completely.
      </p>
      <h3>When you email us</h3>
      <p>
        If you write to us we keep your message and our reply for as long as we need to deal with it, and we use
        them only for that.
      </p>

      <h3>Cookies and tracking</h3>
      <p>
        This website does not set advertising or tracking cookies, and we do not use analytics that follow you
        around. If that changes we will update this page first.
      </p>

      <h3>Other services</h3>
      <p>
        Tickets are sold by OutSavvy, and event listings and posters on this site come from them. When a page
        shows a poster, your browser fetches it from OutSavvy’s servers. This website is hosted by Cloudflare,
        which sees your IP address when you visit, in order to deliver pages and keep the site secure. Buying a ticket is done on OutSavvy’s site, under their
        own privacy policy. Links to Google Maps and Instagram take you to those services, which
        have their own policies.
      </p>

      <h3>Your rights</h3>
      <p>
        You can ask to see the information we hold about you, have it corrected or deleted, object to how we use
        it, or withdraw your consent at any time. Email us and we will help. If you are unhappy with how we have
        handled your information you can complain to the Information Commissioner’s Office at{" "}
        <a href="https://ico.org.uk" className="t-link" target="_blank" rel="noopener noreferrer">
          ico.org.uk
        </a>
        .
      </p>
    </>
  );
}

// The Accessibility text shown when Sanity has none
function WrittenAccessibility({ company: { name: companyName } }: { company: CompanyDetails }) {
  return (
    <>
      <p>
        {companyName} wants everyone to be able to use this website. We aim to meet the Web Content Accessibility
        Guidelines (WCAG) 2.2, level AA.
      </p>

      <h3>What we have done</h3>
      <ul>
        <li>Black type on pale backgrounds, with the main text and controls meeting the AA contrast ratio.</li>
        <li>The whole site can be used with a keyboard, with a visible outline on whatever has focus.</li>
        <li>Pages are built to work with screen readers, and photos have descriptions.</li>
        <li>Text resizes with your browser’s settings, and the layout adapts to phones and tablets.</li>
      </ul>

      <h3>Visiting the club</h3>
      <p>
        Our Visit page has an Access section about the building. If you have access needs or questions before you
        come, email us and we will help you plan your night.
      </p>

      <h3>Tell us about a problem</h3>
      <p>
        Something hard to use?{" "}
        <EmailLink className="t-link">Email us</EmailLink> and we’ll try to fix it.
      </p>
    </>
  );
}

function Company({ company: { name: companyName, number: companyNumber, office: registeredOffice } }: { company: CompanyDetails }) {
  return (
    <>
      <p>
        {companyName} is a community interest company, a private company limited by guarantee, registered in
        England and Wales.
      </p>
      <ul>
        <li>Company number: {companyNumber}</li>
        <li>Registered office: {registeredOffice}</li>
        <li>
          <EmailLink className="t-link">Email us</EmailLink>
        </li>
      </ul>
    </>
  );
}
