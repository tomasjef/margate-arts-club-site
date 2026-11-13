import { NewsletterSignup } from "@/components/NewsletterSignup";
import { PageShell } from "@/components/PageShell";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () =>
  pageMetadata({
    title: "Newsletter",
    description: "Join Margate Arts Club’s mailing list: what’s on at the club by email, weekly, monthly or both.",
    path: "/newsletter",
  });

// The mailing list sign-up on a page of its own (a link to share, or for a QR code): the header, then the footer's form in the middle of the
// window, with no footer. The form is the footer's, in its type, and as wide as it is there: six of the twelve columns from 768px (here
// columns four to nine, so it sits on the page's centre line), the full width inside the margins on phones. The space under it is the
// header's height, so the form's middle is the window's middle (on phones the page name's line under the header moves it a little lower).
// On phones the form is a step larger than the footer's (standalone): 18px, with Subscribe as tall as Book Tickets, on its own line under Weekly
// and Monthly at the left.
export default function Page() {
  return (
    <PageShell title="Newsletter" rule={false} footer={false}>
      <div className="flex flex-1 items-center px-(--pad) pb-(--header-h)">
        <div className="t-button leading-(--foot-lh) grid w-full grid-cols-1 gap-x-(--pad) md:grid-cols-12">
          <NewsletterSignup className="md:col-span-6 md:col-start-4" standalone />
        </div>
      </div>
    </PageShell>
  );
}
