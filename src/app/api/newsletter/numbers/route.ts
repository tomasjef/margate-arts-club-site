import { updateSubscriberNumbers } from "@/lib/subscriber-numbers-update";

// Called by the scheduled job in worker.ts, with the shared secret (NEWSLETTER_CRON_SECRET), like the newsletter send.
export async function POST(req: Request) {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Not allowed", { status: 401 });
  try {
    return Response.json(await updateSubscriberNumbers());
  } catch (e) {
    console.error("subscriber numbers failed", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
