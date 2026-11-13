import { syncOutSavvyCustomers } from "@/lib/outsavvy-customers";

// Called by the scheduled job in worker.ts, with the shared secret (NEWSLETTER_CRON_SECRET), like the newsletter send. By hand, with the
// same secret: ?page=N looks at that page of OutSavvy's customers (200 a page), ?dry=1 only counts who would be added.
export async function POST(req: Request) {
  const secret = process.env.NEWSLETTER_CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Not allowed", { status: 401 });
  const q = new URL(req.url).searchParams;
  const page = Number(q.get("page")) || undefined;
  try {
    return Response.json(await syncOutSavvyCustomers({ page: page && page > 0 ? Math.floor(page) : undefined, dryRun: q.get("dry") === "1" }));
  } catch (e) {
    console.error("OutSavvy customer sync failed", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
