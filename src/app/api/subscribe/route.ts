import { sendAlreadySignedUp, sendConfirmation } from "@/lib/confirmation";
import { getDb, newToken } from "@/lib/db";
import { emailConfigured } from "@/lib/email";

// Joining the mailing list: the address and how often (weekly, monthly or both). Nobody is added to the newsletter until they press the link
// in the confirmation email (which is sent as soon as email is set up, if it is not yet). The answer is the same whether or not the address is already on the list, so nobody can use this to find out who is.
export async function POST(req: Request) {
  let body: { email?: unknown; frequencies?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const freq = Array.isArray(body.frequencies) ? body.frequencies : [];
  const weekly = freq.includes("weekly") ? 1 : 0;
  const monthly = freq.includes("monthly") ? 1 : 0;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !(weekly || monthly)) return Response.json({ ok: false }, { status: 400 });

  const db = getDb();
  if (!db) return Response.json({ ok: false, reason: "not-ready" }, { status: 503 });

  const existing = await db
    .prepare("SELECT id, status, token, weekly, monthly FROM subscribers WHERE email = ?")
    .bind(email)
    .first<{ id: number; status: string; token: string; weekly: number; monthly: number }>();
  let token = existing?.token ?? newToken();
  let id = existing?.id ?? 0;
  if (!existing) {
    const res = await db.prepare("INSERT INTO subscribers (email, weekly, monthly, token, consent_at) VALUES (?, ?, ?, ?, datetime('now')) RETURNING id").bind(email, weekly, monthly, token).first<{ id: number }>();
    id = res?.id ?? 0;
  } else if (existing.status === "pending") {
    await db.prepare("UPDATE subscribers SET weekly = ?, monthly = ? WHERE id = ?").bind(weekly, monthly, existing.id).run();
  } else if (existing.status === "unsubscribed") {
    // joining again: a fresh link, and they have to confirm again
    token = newToken();
    await db.prepare("UPDATE subscribers SET weekly = ?, monthly = ?, status = 'pending', token = ?, unsubscribed_at = NULL, consent_at = datetime('now'), confirmation_sent_at = NULL WHERE id = ?").bind(weekly, monthly, token, existing.id).run();
  } else {
    // already confirmed: nothing changes here (changing someone's choices needs their own email's link), but their address gets a note
    // saying they are on the list, with that link if they asked for different emails this time
    let sent = false;
    try {
      sent = await sendAlreadySignedUp({ ...existing, email }, { weekly, monthly });
    } catch (e) {
      console.error("already-signed-up note failed", e);
    }
    return Response.json({ ok: true, queued: !sent });
  }

  // Saved either way. If email is not set up yet (or sending fails) the scheduled job sends the confirmation later: `queued` tells the page.
  let sent = false;
  if (emailConfigured()) {
    try {
      sent = await sendConfirmation(db, { id, email, token, weekly, monthly });
    } catch (e) {
      console.error("confirmation failed", e);
    }
  }
  return Response.json({ ok: true, queued: !sent });
}
