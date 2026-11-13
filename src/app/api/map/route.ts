import { getSiteInfo } from "@/lib/cms";
import { mapsUrlFor } from "@/lib/site";

// Test newsletters sent before 3 Nov 2026 link their address here (the newsletter now links Google Maps itself): it opens Google Maps on
// every device. The address comes from the site settings, never from the link, so this only ever opens the club.
export async function GET() {
  return Response.redirect(mapsUrlFor(await getSiteInfo()), 302);
}
