import { EventGrid } from "@/components/EventGrid";
import { JsonLd } from "@/components/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { toneStyle } from "@/components/PageShell";
import { SiteHeader } from "@/components/SiteHeader";
import { getSchedule, getSiteInfo } from "@/lib/cms";
import { getEventsOrKeepPage } from "@/lib/outsavvy";
import { eventsData, venueData } from "@/lib/seo";

// Live events from OutSavvy; if OutSavvy can't be reached, the last page made stays up (see getEventsOrKeepPage)
export default async function Home() {
  const [events, schedule, info] = await Promise.all([getEventsOrKeepPage(), getSchedule(), getSiteInfo()]);
  return (
    <div className="flex flex-1 flex-col" style={toneStyle("grey")}>
      <SiteHeader />
      <main className="flex-1">
        <h1 className="sr-only">What’s on at Margate Arts Club</h1>
        {/* its own wrapper, so the sticky date filters scroll away with the events and do not follow the table */}
        <div>
          <EventGrid
            events={events}
            layout="stack"
            tagline={
              // the full width between the page margins, the headline size: larger than the menu on phones, the menu size from 768px up
              <p className="t-headline">
                Listening bar, live music and arts space on Northdown Road, Margate
              </p>
            }
          />
        </div>
      </main>
      <SiteFooter />
      {/* for search engines: the venue and its hours, and each event */}
      <JsonLd data={[venueData(schedule, info), ...eventsData(events, info)]} />
    </div>
  );
}
