import { getSiteInfo } from "@/lib/cms";
import { siteName } from "@/lib/site";
import { getEvents } from "@/lib/outsavvy";

// "Add to Calendar" in the newsletter: /api/calendar/<event id>/<2026-11-06>.ics. A calendar file for that night, made from what OutSavvy says
// about the event (nothing in the address is written into the file), so it only ever holds our own events. The address ends in .ics so phones
// recognise it as a calendar event. An Android phone is sent to Google Calendar, which opens its app with the event filled in.
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const text = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export async function GET(req: Request, { params }: { params: Promise<{ e: string; d: string }> }) {
  const { e, d } = await params;
  const events = await getEvents();
  const event = events?.find((x) => x.slug === e);
  const night = event?.dates?.find((x) => x.date === d.replace(/\.ics$/, ""));
  if (!event || !night?.startUtc || !night.endUtc) return new Response("Not found", { status: 404 });
  const info = await getSiteInfo();
  const where = `${siteName}, ${info.address1}, ${info.address2}`;

  if (/android/i.test(req.headers.get("user-agent") ?? "")) {
    const google = new URL("https://calendar.google.com/calendar/render");
    google.searchParams.set("action", "TEMPLATE");
    google.searchParams.set("text", event.title);
    google.searchParams.set("dates", `${stamp(night.startUtc)}/${stamp(night.endUtc)}`);
    google.searchParams.set("location", where);
    google.searchParams.set("details", event.url);
    return Response.redirect(google.toString(), 302);
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${siteName}//Newsletter//EN`,
    "BEGIN:VEVENT",
    `UID:${event.slug}-${night.date}@margatearts.club`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(night.startUtc)}`,
    `DTEND:${stamp(night.endUtc)}`,
    `SUMMARY:${text(event.title)}`,
    `LOCATION:${text(where)}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(ics, { headers: { "Content-Type": "text/calendar; charset=utf-8" } });
}
