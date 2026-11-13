import { MailingListBox, buttonClass } from "@/components/MailingListBox";
import { hidden } from "@/lib/seo";

export const metadata = { title: "Confirm", ...hidden };

// The page the confirmation email links to. Pressing the button is what confirms, so a mail program that opens links to check them can't do it.
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <MailingListBox title="Confirm">
      <p>Press the button to join the Margate Arts Club mailing list.</p>
      <form method="post" action="/api/confirm">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className={buttonClass}>
          Confirm
        </button>
      </form>
    </MailingListBox>
  );
}
