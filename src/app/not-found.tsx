import Link from "next/link";
import { MailingListBox, buttonClass } from "@/components/MailingListBox";
import { hidden } from "@/lib/seo";

export const metadata = { title: "Page not found", ...hidden };

// Any address the site doesn't have (sent with a 404): the text-page box, and a button to the home page
export default function NotFound() {
  return (
    <MailingListBox title="Page not found" footer>
      <p>Sorry, there’s no page at this address. It may have moved, or the link may be wrong.</p>
      <p>
        <Link href="/" className={buttonClass}>
          Go to homepage
        </Link>
      </p>
    </MailingListBox>
  );
}
