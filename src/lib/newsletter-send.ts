import { getNewsletterContent, getSchedule, getSiteInfo } from "@/lib/cms";
import { hoursGroups } from "@/lib/week";
import { sendWaitingConfirmations } from "@/lib/confirmation";
import { getDb, siteUrl } from "@/lib/db";
import { createTemplate, emailConfigured, sendBulk } from "@/lib/email";
import { londonDay, renderNewsletter, type Period } from "@/lib/newsletter";
import { getEvents } from "@/lib/outsavvy";

// Runs every ten minutes (a Cloudflare cron trigger calls /api/newsletter/send, see worker.ts). It does two things:
//  1. On a Monday from 9am London time, and on the 1st of a month from 9am, it starts that day's newsletter (once: the `sends` table remembers).
//  2. Sends whatever is half-sent, in batches of 50 people (one SES call each), at most BATCHES_PER_RUN a run; the next run carries on from
//     where this one stopped. On the free Workers plan one run may make only 50 outside calls AND only 50 database queries: a batch costs 3
//     queries (the next 50 people, the email_health note, the saved place), so 8 batches (24) leave room for the rest of the run. Going over
//     would fail a query part way, possibly after SES had sent a batch but before its place was saved: those 50 would get it twice.
//     SES allows 14 emails a second, so batches are BATCH_GAP_MS apart (50 in 4 s = 12.5 a second), and each person's own result is read:
//     SES answers 200 even when it held some back. A batch held back whole (throttled, paused) is tried again on the next run.
// Two switches: NEWSLETTER_SEND_ENABLED ("true" on the Worker) is the master safety catch, and the club's own "Send the weekly email" /
// "Send the monthly email" in Sanity (Newsletter) decide each one. A newsletter starts only with both on; one being sent stops when its switch
// in Sanity is turned off (the rest of the list doesn't get it, and it isn't started again that day).
const BATCH = 50;
const BATCHES_PER_RUN = 8;
const BATCH_GAP_MS = 4000;
// SES results meaning "not now" rather than "never to this address"
const RETRY_LATER = new Set(["ACCOUNT_THROTTLED", "TRANSIENT_FAILURE", "ACCOUNT_SENDING_PAUSED", "CONFIGURATION_SET_SENDING_PAUSED", "ACCOUNT_DAILY_QUOTA_EXCEEDED", "NO_RESULT"]);
const START_HOUR = 9;

// people from an imported group (the lists table) that has been switched off are skipped
const listOn = "(source IS NULL OR source NOT IN (SELECT source FROM lists WHERE enabled = 0))";

type Sub = { id: number; email: string; token: string };

export async function runNewsletterTick(now = new Date()) {
  const db = getDb();
  if (!db) return { ok: false, reason: "no database" };
  if (!emailConfigured()) return { ok: false, reason: "email not set up" };
  const confirmations = await sendWaitingConfirmations();
  const enabled = process.env.NEWSLETTER_SEND_ENABLED === "true";
  const base = siteUrl();
  const log: string[] = [];

  // 1. start today's newsletter, if one is due and not started
  const today = londonDay(now);
  const hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "numeric", hourCycle: "h23" }).format(now));
  const weekday = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "short" }).format(now);
  const due: Period[] = [];
  if (hour >= START_HOUR && weekday === "Mon") due.push("weekly");
  if (hour >= START_HOUR && today.endsWith("-01")) due.push("monthly");

  for (const period of due) {
    const probe = renderNewsletter({ period, today, events: [], content: {}, venue: { address1: "", address2: "", instagramUrl: "", hours: [] }, baseUrl: base });
    const started = await db.prepare("SELECT key FROM sends WHERE key = ?").bind(probe.key).first();
    if (started) continue;
    if (!enabled) {
      log.push(`${probe.key}: due, not started (sending is switched off)`);
      continue;
    }
    const on = (await getNewsletterContent()).send;
    if (!on?.[period]) {
      log.push(`${probe.key}: due, not started (${on ? "switched off in Sanity" : "no switch from Sanity yet (unreachable, or Newsletter not published), will retry"})`);
      continue;
    }
    const [events, content, info, schedule] = await Promise.all([getEvents(), getNewsletterContent(), getSiteInfo(), getSchedule()]);
    // no events (or OutSavvy down): don't send an empty email; try again on the next run
    if (!events) {
      log.push(`${probe.key}: events unavailable, will retry`);
      continue;
    }
    const mail = renderNewsletter({ period, today, events, content, venue: { ...info, hours: hoursGroups(schedule) }, baseUrl: base });
    if (mail.count === 0) {
      await db.prepare("INSERT INTO sends (key, period, subject, template, status) VALUES (?, ?, ?, '', 'done')").bind(mail.key, period, mail.subject).run();
      log.push(`${mail.key}: no events in the period, skipped`);
      continue;
    }
    const template = `nl-${mail.key}`;
    await createTemplate(template, mail.subject, mail.html, mail.text);
    const column = period === "weekly" ? "weekly" : "monthly";
    const total = await db.prepare(`SELECT COUNT(*) AS n FROM subscribers WHERE status = 'confirmed' AND ${column} = 1 AND ${listOn}`).first<{ n: number }>();
    await db.prepare("INSERT INTO sends (key, period, subject, template, total) VALUES (?, ?, ?, ?, ?)").bind(mail.key, period, mail.subject, template, total?.n ?? 0).run();
    log.push(`${mail.key}: started for ${total?.n ?? 0} people`);
  }

  // 2. carry on with any newsletter still being sent
  if (enabled) {
    const jobs = await db.prepare("SELECT key, period, template, cursor, sent FROM sends WHERE status = 'sending' ORDER BY created_at").all<{ key: string; period: Period; template: string; cursor: number; sent: number }>();
    let batches = 0;
    const send = jobs.results.length ? (await getNewsletterContent()).send : null;
    for (const job of jobs.results) {
      // Sanity unavailable: carry on next run rather than stop or send on a switch we can't see
      if (!send) {
        log.push(`${job.key}: waiting, no switch from Sanity (unreachable, or Newsletter not published)`);
        break;
      }
      if (!send[job.period]) {
        await db.prepare("UPDATE sends SET status = 'stopped' WHERE key = ?").bind(job.key).run();
        log.push(`${job.key}: stopped at ${job.sent} sent (switched off in Sanity)`);
        continue;
      }
      const column = job.period === "weekly" ? "weekly" : "monthly";
      let { cursor, sent } = job;
      let heldBack = false;
      while (batches < BATCHES_PER_RUN) {
        const people = await db.prepare(`SELECT id, email, token FROM subscribers WHERE status = 'confirmed' AND ${column} = 1 AND ${listOn} AND id > ? ORDER BY id LIMIT ${BATCH}`).bind(cursor).all<Sub>();
        if (!people.results.length) {
          await db.prepare("UPDATE sends SET status = 'done', cursor = ?, sent = ? WHERE key = ?").bind(cursor, sent, job.key).run();
          log.push(`${job.key}: finished, ${sent} sent`);
          break;
        }
        if (batches > 0) await new Promise((r) => setTimeout(r, BATCH_GAP_MS));
        const results = await sendBulk(
          job.template,
          people.results.map((p) => ({ email: p.email, unsubscribeUrl: `${base}/mailing-list/unsubscribe/${p.token}`, oneClickUrl: `${base}/api/unsubscribe?t=${p.token}` })),
        );
        batches++;
        // nobody in the batch sent and all for a "not now" reason: keep the place and try the same 50 on the next run
        if (results.every((r) => RETRY_LATER.has(r.status))) {
          log.push(`${job.key}: batch held back by SES (${results[0]?.status}), trying again next run`);
          heldBack = true;
          break;
        }
        const ok = results.filter((r) => r.status === "SUCCESS").length;
        if (ok < results.length) {
          const why: Record<string, number> = {};
          for (const r of results) if (r.status !== "SUCCESS") why[r.status] = (why[r.status] ?? 0) + 1;
          log.push(`${job.key}: ${results.length - ok} of a batch not sent ${JSON.stringify(why)}`);
          console.error("newsletter batch partly not sent", job.key, why);
        }
        cursor = people.results[people.results.length - 1].id;
        sent += ok;
        await db.prepare("UPDATE sends SET cursor = ?, sent = ? WHERE key = ?").bind(cursor, sent, job.key).run();
      }
      if (heldBack) break;
      if (batches >= BATCHES_PER_RUN) {
        log.push(`${job.key}: ${sent} sent so far, carrying on next run`);
        break;
      }
    }
  }
  return { ok: true, enabled, confirmations, log };
}
