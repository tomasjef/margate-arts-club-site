import { getNewsletterContent, getSchedule, getSiteInfo } from "@/lib/cms";
import { hoursGroups } from "@/lib/week";
import { londonDay, renderNewsletter, type Period } from "@/lib/newsletter";
import { getEvents } from "@/lib/outsavvy";

// A look at the next email before it goes out: /newsletter/weekly or /newsletter/monthly (add ?format=text for the plain-text version, or
// ?date=2026-11-23 to see another week or month). It is the same email that is sent, with the unsubscribe link left as a dash.
export async function GET(req: Request, { params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (period !== "weekly" && period !== "monthly") return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const today = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : londonDay(new Date());
  const [events, content, info, schedule] = await Promise.all([getEvents(), getNewsletterContent(), getSiteInfo(), getSchedule()]);
  const mail = renderNewsletter({ period: period as Period, today, events: events ?? [], content, venue: { ...info, hours: hoursGroups(schedule) }, baseUrl: url.origin });
  const text = url.searchParams.get("format") === "text";
  return new Response((text ? `Subject: ${mail.subject}\n\n${mail.text}` : mail.html).replaceAll("{{unsubscribeUrl}}", "#"), {
    headers: { "content-type": `${text ? "text/plain" : "text/html"}; charset=utf-8`, "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}
