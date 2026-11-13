import { sendUnsubscribed } from "@/lib/confirmation";
import { getDb } from "@/lib/db";

// Unsubscribing: from the page the email's link opens (a form), or the one-click POST that Gmail and others send themselves (the token is in
// the address). Either way the person is never emailed again (apart from one short note saying they are off the list).
export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("t") ?? "";
  const oneClick = !!token;
  if (!token) token = String((await req.formData()).get("token") ?? "");
  const db = getDb();
  const valid = !!db && /^[a-f0-9]{64}$/.test(token);
  if (valid) {
    const row = await db!.prepare("SELECT email FROM subscribers WHERE token = ? AND status != 'unsubscribed'").bind(token).first<{ email: string }>();
    await db!.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now') WHERE token = ? AND status != 'unsubscribed'").bind(token).run();
    // a short goodbye, sent once; a failed send never stops the unsubscribe
    if (row) await sendUnsubscribed(row.email).catch((e) => console.error("unsubscribe note failed", e));
  }
  if (oneClick) return new Response(null, { status: valid ? 200 : 400 });
  return Response.redirect(new URL(`/mailing-list/done?state=${valid ? "unsubscribed" : "error"}`, req.url), 303);
}
