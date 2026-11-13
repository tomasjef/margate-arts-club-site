// @ts-nocheck
// The site's Worker (built by OpenNext) with two things added:
//  - search engines: only https://margatearts.club is to be found. Every other address the site answers on (the workers.dev test address,
//    new.margatearts.club) says noindex, worked out here on each request so that nothing built into the pages has to change at launch.
//    www.margatearts.club sends people to margatearts.club.
//  - a scheduled job: every ten minutes it asks the site's own /api/newsletter/send to look for a newsletter that is due or half-sent. All
//    the work is in src/lib/newsletter-send.ts; this only rings the bell. It also asks /api/usage-alerts to send any waiting warning emails,
//    and /api/newsletter/numbers to copy the mailing list's numbers into the studio (src/lib/subscriber-numbers-update.ts).
//    And /api/outsavvy/sync, which adds new OutSavvy buyers who said yes to the club's emails to the mailing list
//    (src/lib/outsavvy-customers.ts).
//  - a count of the page cache's KV writes (Cloudflare's free plan allows 1,000 a day), kept per day in the kv_usage table; see watchKv.
//  - the alert when email stops getting out: every ten minutes /api/email-health checks Amazon SES (src/lib/email-health.ts) and answers with
//    any alert that is due, which goes out from here through Cloudflare's own email (the ALERT_MAIL binding), so it arrives even when Amazon
//    is what's broken. It goes to the Worker secret ALERT_EMAIL, which must be a verified destination address in Email Routing.
import { EmailMessage } from "cloudflare:email";
import handler from "./.open-next/worker.js";
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";

const LIVE_HOST = "margatearts.club";
const WARN_AT = 800; // writes in a day after which a warning email is due
const ALERT_FROM = "alerts@margatearts.club";

// Counts what the page cache writes to KV, per UTC day (the day Cloudflare's limit resets on). The site's own code is not touched: it is
// handed a KV binding that counts each put/delete (and each one that is refused) before passing it on. If counting fails, nothing changes.
async function recordWrite(db, ok) {
  const day = new Date().toISOString().slice(0, 10);
  const row = await db
    .prepare("INSERT INTO kv_usage (day, writes, failures) VALUES (?1, ?2, ?3) ON CONFLICT(day) DO UPDATE SET writes = writes + ?2, failures = failures + ?3 RETURNING writes, warn_due, limit_due")
    .bind(day, ok ? 1 : 0, ok ? 0 : 1)
    .first();
  if (!ok && !row.limit_due) await db.prepare("UPDATE kv_usage SET limit_due = 1 WHERE day = ?").bind(day).run();
  if (ok && row.writes >= WARN_AT && !row.warn_due) await db.prepare("UPDATE kv_usage SET warn_due = 1 WHERE day = ?").bind(day).run();
}

function watchKv(env, ctx) {
  const kv = env.NEXT_INC_CACHE_KV;
  if (!kv || !env.DB) return env;
  const note = (ok) => ctx.waitUntil(recordWrite(env.DB, ok).catch(() => {}));
  const watched = new Proxy(kv, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value !== "function") return value;
      if (prop !== "put" && prop !== "delete") return value.bind(target);
      return async (...args) => {
        try {
          const result = await value.apply(target, args);
          note(true);
          return result;
        } catch (e) {
          note(false);
          throw e;
        }
      };
    },
  });
  return { ...env, NEXT_INC_CACHE_KV: watched };
}

// A plain-text email through Cloudflare Email Routing (it can only go to the account's verified destination addresses)
async function sendAlert(env, subject, text) {
  const raw = [
    `From: Margate Arts Club website <${ALERT_FROM}>`,
    `To: ${env.ALERT_EMAIL}`,
    `Subject: ${subject}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@margatearts.club>`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text.replace(/\r?\n/g, "\r\n"),
  ].join("\r\n");
  await env.ALERT_MAIL.send(new EmailMessage(ALERT_FROM, env.ALERT_EMAIL, raw));
}

async function watchEmail(env) {
  const res = await env.WORKER_SELF_REFERENCE.fetch("https://margate-arts-club/api/email-health", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.NEWSLETTER_CRON_SECRET}` },
  });
  if (!res.ok || !env.ALERT_MAIL || !env.ALERT_EMAIL) return;
  const { alert } = await res.json();
  if (!alert) return;
  await sendAlert(env, alert.subject, alert.text);
  const down = alert.kind !== "recovered";
  await env.DB.prepare("INSERT INTO email_alert (id, state, down_since, alerted_at) VALUES (1, ?1, ?2, datetime('now')) ON CONFLICT(id) DO UPDATE SET state = ?1, down_since = ?2, alerted_at = datetime('now')")
    .bind(down ? "down" : "ok", down ? alert.since : null)
    .run();
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // a test of the alert email, with the cron secret: curl -X POST -H "Authorization: Bearer $NEWSLETTER_CRON_SECRET" https://…/api/alert-test
    if (url.pathname === "/api/alert-test" && request.method === "POST") {
      if (!env.NEWSLETTER_CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.NEWSLETTER_CRON_SECRET}`) return new Response("Not allowed", { status: 401 });
      try {
        await sendAlert(env, "Margate Arts Club: test alert", "A test of the alert the website sends when its emails stop getting out. If you can read this, alerts reach you.");
        return new Response("sent\n");
      } catch (e) {
        return new Response(`not sent: ${e?.message ?? e}\n`, { status: 500 });
      }
    }
    if (url.hostname === `www.${LIVE_HOST}`) {
      url.hostname = LIVE_HOST;
      return Response.redirect(url.toString(), 301);
    }
    const res = await handler.fetch(request, watchKv(env, ctx), ctx);
    if (url.hostname === LIVE_HOST) return res;
    const out = new Response(res.body, res);
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    return out;
  },
  async scheduled(_controller, env, ctx) {
    for (const path of ["/api/newsletter/send", "/api/usage-alerts", "/api/newsletter/numbers", "/api/outsavvy/sync"]) {
      ctx.waitUntil(
        env.WORKER_SELF_REFERENCE.fetch(`https://margate-arts-club${path}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${env.NEWSLETTER_CRON_SECRET}` },
        }),
      );
    }
    ctx.waitUntil(watchEmail(env).catch((e) => console.error("email watch failed", e)));
  },
};
