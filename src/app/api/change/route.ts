import { getDb } from "@/lib/db";

// Pressing "Confirm" on the change page (/mailing-list/change): someone on the list switching to weekly, monthly or both, from the link in
// the "you're already on our mailing list" email. Only for confirmed subscribers; the token is the one in their own emails.
export async function POST(req: Request) {
  const form = await req.formData();
  const token = String(form.get("token") ?? "");
  const weekly = form.get("weekly") === "1" ? 1 : 0;
  const monthly = form.get("monthly") === "1" ? 1 : 0;
  const db = getDb();
  const done = (state: string) => Response.redirect(new URL(`/mailing-list/done?state=${state}`, req.url), 303);
  if (!db || !/^[a-f0-9]{64}$/.test(token) || !(weekly || monthly)) return done("error");
  const res = await db.prepare("UPDATE subscribers SET weekly = ?, monthly = ? WHERE token = ? AND status = 'confirmed'").bind(weekly, monthly, token).run();
  return done(res.meta.changes ? "changed" : "error");
}
