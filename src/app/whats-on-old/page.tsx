import { EventGrid } from "@/components/EventGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { toneStyle } from "@/components/PageShell";
import { SiteHeader } from "@/components/SiteHeader";
import { getEventsOrKeepPage } from "@/lib/outsavvy";
import { hidden } from "@/lib/seo";

// What's On as it was until 3 Nov 2026 (each event a poster and a text square side by side, with its price), kept to look back at.
// Not linked, not for search engines.
export const metadata = { title: "What’s on (old)", ...hidden };

export default async function WhatsOnOld() {
  const events = await getEventsOrKeepPage();
  return (
    <div className="flex flex-1 flex-col" style={toneStyle("grey")}>
      <SiteHeader />
      <main className="flex-1">
        <h1 className="sr-only">What’s on at Margate Arts Club</h1>
        <div>
          <EventGrid
            events={events}
            tagline={
              <p className="t-headline">
                Listening bar, live music and arts space on Northdown Road, Margate
              </p>
            }
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
