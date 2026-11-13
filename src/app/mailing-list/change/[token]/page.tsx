import Link from "next/link";
import { MailingListBox, buttonClass } from "@/components/MailingListBox";
import { whichEmails } from "@/lib/confirmation";
import { hidden } from "@/lib/seo";

export const metadata = { title: "Change emails", ...hidden };

// The page the "you're already on our mailing list" email links to when someone on the list asked for different emails (weekly, monthly or
// both) in a new sign-up. As with Confirm, the button is what makes the change, so a mail program that opens links to check them can't.
export default async function Page({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ weekly?: string; monthly?: string }> }) {
  const { token } = await params;
  const q = await searchParams;
  const weekly = q.weekly === "1" ? 1 : 0;
  const monthly = q.monthly === "1" ? 1 : 0;
  if (!weekly && !monthly) {
    return (
      <MailingListBox title="Change emails">
        <p>
          That link didn’t work. You can sign up again on our{" "}
          <Link href="/newsletter" className="t-link">
            Newsletter
          </Link>{" "}
          page.
        </p>
      </MailingListBox>
    );
  }
  return (
    <MailingListBox title="Change emails">
      <p>Press the button to get our {whichEmails(weekly, monthly)} from now on.</p>
      <form method="post" action="/api/change">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="weekly" value={weekly} />
        <input type="hidden" name="monthly" value={monthly} />
        <button type="submit" className={buttonClass}>
          Confirm
        </button>
      </form>
    </MailingListBox>
  );
}
