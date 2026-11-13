import { getDb, type Db } from "@/lib/db";
import { emailConfigured, noteEmailResult, sendEmail, type Channel } from "@/lib/email";

// Is email getting out? Run every ten minutes by the scheduled job (worker.ts → /api/email-health).
//  - Every real call to Amazon SES is noted in email_health (src/lib/email.ts): confirmations, unsubscribe notes, newsletters.
//  - On top, a test email to Amazon's mailbox simulator (success@simulator.amazonses.com: accepted and thrown away, it reaches nobody) once an
//    hour, unless the site sent a real one in that hour; and on every run while sending is failing, so a fix is seen within ten minutes.
// Email counts as stopped when a kind of email (single emails, or the newsletter) has failed for 15 minutes with no success in between and is
// still being tried. This then returns an alert for worker.ts to send through Cloudflare, not Amazon (Amazon may be what's broken): one when
// email stops, a reminder every 24 hours while it lasts, and one when it works again. worker.ts notes what it sent in email_alert.
// The alert goes to the Worker secret ALERT_EMAIL, which must be a verified destination address in the club's Cloudflare Email Routing.

const SIMULATOR = "success@simulator.amazonses.com";
const TEST_EVERY_MIN = 60;
const GRACE_MIN = 15;
// a kind of email that failed but nobody has tried for this long (a newsletter that was switched off) no longer counts as failing
const STILL_TRIED_MIN = 70;
const REMIND_MIN = 24 * 60;

type Health = { channel: Channel; last_try_at: string | null; last_ok_at: string | null; last_fail_at: string | null; last_error: string | null; failing_since: string | null };
type AlertState = { state: "down" | "ok"; down_since: string | null; alerted_at: string };
export type Alert = { kind: "down" | "still-down" | "recovered"; since: string | null; subject: string; text: string };

// D1's datetime('now') is UTC without a zone: "2026-11-06 10:30:00"
const ms = (t: string | null) => (t ? Date.parse(t.replace(" ", "T") + "Z") : NaN);
const minutesSince = (t: string | null | undefined, now: number) => (t ? (now - ms(t)) / 60000 : Infinity);
const ukTime = (t: string | null | undefined) =>
  t
    ? new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(ms(t))
    : "never";

const what: Record<Channel, string> = { single: "sign-up confirmations and unsubscribe notes", bulk: "the newsletter" };
const read = async (db: Db) => (await db.prepare("SELECT * FROM email_health").all<Health>()).results;

export async function checkEmailHealth(now = Date.now()) {
  const db = getDb();
  if (!db) return { ok: false as const, reason: "no database" };
  let rows = await read(db);
  const single = rows.find((r) => r.channel === "single");
  // the cron runs every ten minutes, give or take a few seconds: a minute's slack keeps the test hourly
  if (single?.failing_since || minutesSince(single?.last_try_at, now) >= TEST_EVERY_MIN - 1) {
    if (!emailConfigured()) await noteEmailResult("single", "The Amazon keys (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) or EMAIL_FROM are missing on the Worker");
    // email.ts notes the result; a failure is what this is looking for, so it goes no further
    else await sendEmail({ to: SIMULATOR, subject: "Test", text: "A test that the website can still send email." }).catch(() => {});
    rows = await read(db);
  }

  const stillTried = (r: Health) => minutesSince(r.last_fail_at, now) < STILL_TRIED_MIN;
  const failing = rows.filter((r) => r.failing_since && minutesSince(r.failing_since, now) >= GRACE_MIN && stillTried(r));
  const told = await db.prepare("SELECT state, down_since, alerted_at FROM email_alert WHERE id = 1").first<AlertState>();
  let alert: Alert | null = null;
  if (failing.length) {
    const since = failing.map((r) => r.failing_since as string).sort()[0];
    if (told?.state !== "down") alert = { kind: "down", since, ...stopped(failing, since, false) };
    else if (minutesSince(told.alerted_at, now) >= REMIND_MIN) alert = { kind: "still-down", since: told.down_since ?? since, ...stopped(failing, told.down_since ?? since, true) };
  } else if (told?.state === "down" && !rows.some((r) => r.failing_since && stillTried(r))) {
    alert = { kind: "recovered", since: told.down_since, ...working(told.down_since, rows) };
  }
  return { ok: true as const, failing: failing.map((r) => r.channel), alert };
}

function stopped(failing: Health[], since: string, reminder: boolean) {
  return {
    subject: reminder ? "Margate Arts Club: emails are still not sending" : "Margate Arts Club: emails have stopped sending",
    text: [
      `${reminder ? "The website still can't send email. It stopped" : "The website has not been able to send email since"} ${ukTime(since)} (UK time).`,
      `Not getting out: ${failing.map((r) => what[r.channel]).join(", and ")}.`,
      "Amazon's answer the last time it was tried:\n" + failing.map((r) => `${ukTime(r.last_fail_at)}: ${r.last_error}`).join("\n"),
      [
        "What to check, in the club's AWS account (London region, eu-west-2):",
        "- Billing: has the Free plan ended (22 April 2027), or has a card payment failed? The account may be suspended.",
        "- Amazon SES, Account dashboard: is sending paused (too many bounces or spam reports)?",
        "- IAM, Users, margate-arts-club-ses: is its access key still active?",
      ].join("\n"),
      "Nothing is lost: sign-ups are saved and get their confirmation once sending works again, and a newsletter carries on from where it stopped. If the AWS account itself is the problem, the club's Gmail can't send as its margatearts.club address either.",
      "You'll get a reminder every 24 hours while this lasts, and an email when it works again.",
    ].join("\n\n"),
  };
}

function working(downSince: string | null, rows: Health[]) {
  const lastOk = rows.map((r) => r.last_ok_at).filter(Boolean).sort().pop();
  return {
    subject: "Margate Arts Club: emails are sending again",
    text: [
      `The website can send email again: the last one went through on ${ukTime(lastOk)} (UK time)${downSince ? `, after it stopped on ${ukTime(downSince)}` : ""}.`,
      "Sign-ups made in the meantime get their confirmation within ten minutes, and a newsletter that was being sent carries on.",
    ].join("\n\n"),
  };
}
