import Link from "next/link";
import type { ReactNode } from "react";
import { MailingListBox, buttonClass } from "@/components/MailingListBox";
import { hidden } from "@/lib/seo";

export const metadata = { title: "Mailing list", ...hidden };

// these pages have no footer, so joining again is on the Newsletter page (until 6 Nov 2026 the text said "from the foot of any page")
const joinAgain = (
  <>
    You can join again on our{" "}
    <Link href="/newsletter" className="t-link">
      Newsletter
    </Link>{" "}
    page.
  </>
);

// only a link that didn't work has a button (to the home page); signed up and unsubscribed are just the message
const messages: Record<string, { title: string; text: ReactNode; button?: string }> = {
  confirmed: { title: "You’re signed up", text: "Thank you. You’ll get the next email with what’s on at the club." },
  changed: { title: "Changed", text: "Thank you. From now on you’ll get the emails you chose." },
  unsubscribed: { title: "Unsubscribed", text: <>You won’t get any more emails from us. {joinAgain}</> },
  error: { title: "That link didn’t work", text: <>It may be old or already used. {joinAgain}</>, button: "Go to homepage" },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams;
  const m = messages[state ?? ""] ?? messages.error;
  return (
    <MailingListBox title={m.title}>
      <p>{m.text}</p>
      {m.button && (
        <p>
          <Link href="/" className={buttonClass}>
            {m.button}
          </Link>
        </p>
      )}
    </MailingListBox>
  );
}
