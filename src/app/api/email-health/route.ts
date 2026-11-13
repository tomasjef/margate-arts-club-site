import { checkEmailHealth } from "@/lib/email-health";

// Called by the scheduled job in worker.ts, with the shared secret (NEWSLETTER_CRON_SECRET), like the newsletter send. It answers with the
// alert that is due, if any; worker.ts sends it through Cloudflare (src/lib/email-health.ts explains why).
export async function POST(req: Request) {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Not allowed", { status: 401 });
  try {
    return Response.json(await checkEmailHealth());
  } catch (e) {
    console.error("email check failed", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
