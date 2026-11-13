import { sendUsageAlerts } from "@/lib/usage-alerts";

// Called by the scheduled job in worker.ts, with the shared secret (NEWSLETTER_CRON_SECRET), like the newsletter send.
export async function POST(req: Request) {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Not allowed", { status: 401 });
  try {
    return Response.json(await sendUsageAlerts());
  } catch (e) {
    console.error("usage alert failed", e);
    return Response.json({ sent: false }, { status: 500 });
  }
}
