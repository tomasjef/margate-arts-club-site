import { getDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";

// The emails about Cloudflare's free KV write limit (1,000 writes a day). worker.ts counts the writes into the kv_usage table and marks a day
// "due" at 800 writes or at the first refused write; this sends one email for what is due and ticks it as sent. It runs from the ten-minute job,
// so if email cannot be sent yet (SES still in the sandbox) the alert is simply sent on a later run. ALERT_EMAIL is a Worker secret.
type Day = { day: string; writes: number; failures: number; warn_due: number; warn_sent: number; limit_due: number; limit_sent: number };

export async function sendUsageAlerts() {
  const db = getDb();
  const to = process.env.ALERT_EMAIL;
  if (!db || !to) return { sent: false, reason: "not set up" };
  const days = (await db.prepare("SELECT * FROM kv_usage WHERE day >= date('now', '-29 days') ORDER BY day DESC").all<Day>()).results;
  const limit = days.filter((d) => d.limit_due && !d.limit_sent);
  const warn = days.filter((d) => d.warn_due && !d.warn_sent);
  if (!limit.length && !warn.length) return { sent: false, reason: "nothing due" };

  const hit = (n: number) => days.filter((d) => d.failures > 0 && d.day >= new Date(Date.now() - (n - 1) * 864e5).toISOString().slice(0, 10)).length;
  const worst = limit[0] ?? warn[0];
  const subject = limit.length ? "Website: Cloudflare write limit reached" : "Website: Cloudflare writes at 80% of today's limit";
  const text = [
    limit.length
      ? `On ${worst.day} (UTC) the site used its 1,000 free Cloudflare KV writes and the next ones were refused (${worst.failures} so far).`
      : `On ${worst.day} (UTC) the site has used ${worst.writes} of its 1,000 free Cloudflare KV writes for the day.`,
    "When writes are refused, pages stop refreshing: visitors keep seeing the last saved copy, so new OutSavvy events and Sanity edits wait until the limit resets at 00:00 UTC (01:00 in the UK while the clocks are on BST).",
    `Days the limit was reached: ${hit(7)} in the last 7 days, ${hit(30)} in the last 30.`,
    "Last 7 days (writes / refused):\n" + days.slice(0, 7).map((d) => `${d.day}: ${d.writes} / ${d.failures}`).join("\n"),
    "If this keeps happening, Workers Paid ($5 a month) removes the limit.",
  ].join("\n\n");

  // sendEmail returns false when AWS is not configured; then nothing is marked as sent and the next run tries again
  if (!(await sendEmail({ to, subject, text }))) return { sent: false, reason: "email not set up" };
  if (limit.length) await db.prepare("UPDATE kv_usage SET limit_sent = 1 WHERE limit_due = 1").run();
  await db.prepare("UPDATE kv_usage SET warn_sent = 1 WHERE warn_due = 1").run();
  return { sent: true };
}
