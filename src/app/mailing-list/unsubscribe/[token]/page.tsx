import { MailingListBox, buttonClass } from "@/components/MailingListBox";
import { hidden } from "@/lib/seo";

export const metadata = { title: "Unsubscribe", ...hidden };

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <MailingListBox title="Unsubscribe">
      <p>Press the button and we will stop emailing you.</p>
      <form method="post" action="/api/unsubscribe">
        <input type="hidden" name="token" value={token} />
        <button type="submit" className={buttonClass}>
          Unsubscribe
        </button>
      </form>
    </MailingListBox>
  );
}
