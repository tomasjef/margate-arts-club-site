import { getDb } from "@/lib/db";

// Pressing "Confirm" on the page the email links to
export async function POST(req: Request) {
  const token = String((await req.formData()).get("token") ?? "");
  const db = getDb();
  const done = (state: string) => Response.redirect(new URL(`/mailing-list/done?state=${state}`, req.url), 303);
  if (!db || !/^[a-f0-9]{64}$/.test(token)) return done("error");
  const res = await db.prepare("UPDATE subscribers SET status = 'confirmed', confirmed_at = datetime('now') WHERE token = ? AND status = 'pending'").bind(token).run();
  if (res.meta.changes) return done("confirmed");
  const row = await db.prepare("SELECT status FROM subscribers WHERE token = ?").bind(token).first<{ status: string }>();
  return done(row?.status === "confirmed" ? "confirmed" : "error");
}
