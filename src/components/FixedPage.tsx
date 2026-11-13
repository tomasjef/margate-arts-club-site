import { permanentRedirect } from "next/navigation";
import { ImageTextPage } from "@/components/ImageTextPage";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { fixedPages, getFixedPage, getSchedule, getSiteInfo, type FixedName } from "@/lib/cms";
import { aboutBoxes } from "@/lib/about-boxes";
import { musicBoxes } from "@/lib/music-boxes";
import { getEvents } from "@/lib/outsavvy";
import { pageRows } from "@/lib/page-rows";
import { pageMetadata, venueData } from "@/lib/seo";
import { visitBoxes } from "@/lib/visit-boxes";

// Visit, Music and About. The club can rename each in the studio and give it another address (Music → Sound, /sound): the page is then
// served at the new address (app/[slug]/page.tsx hands it to FixedPage) and its old address (/music, app/music/page.tsx) sends people to
// the new one for good, so old links, Google and past newsletters keep working. Their name is the studio's, wherever the site shows it.
const descriptions: Record<FixedName, string> = {
  visit: "Opening hours, how to find us and access at Margate Arts Club, 276 Northdown Road, Cliftonville, Margate.",
  music: "Live music, club nights and a magnificent soundsystem: bands, DJs, experimental, folk, afrobeat, jazz and electronic music at Margate Arts Club.",
  about: "Since 2015 Margate Arts Club has been a welcoming, DIY arts and culture space centred on music, with over 400 events a year on Northdown Road, Margate.",
};

export async function fixedMetadata(name: FixedName) {
  const page = await getFixedPage(name);
  return pageMetadata({ title: page.title, description: descriptions[name], path: `/${page.slug}`, page: fixedPages[name] });
}

// `atNewAddress`: served by the dynamic route at the address the club chose. Otherwise this is the page's own address in the code
// (/music), which sends people on when the club has moved the page.
export async function FixedPage({ name, atNewAddress = false }: { name: FixedName; atNewAddress?: boolean }) {
  const page = await getFixedPage(name);
  if (!atNewAddress && page.slug !== name) permanentRedirect(`/${page.slug}`);
  // the Jump to bar has its own hairlines, so the header's hairline is off on these pages
  if (name === "visit") {
    const [rows, schedule, info] = await Promise.all([pageRows("visit", visitBoxes), getSchedule(), getSiteInfo()]);
    return (
      <PageShell title={page.title} tone="grey" rule={false}>
        <div className="pt-(--pad) max-md:pt-0">
          <ImageTextPage rows={rows} large imageFirst fitWindow panel="tan" />
        </div>
        {/* for search engines: the venue, its address and hours */}
        <JsonLd data={venueData(schedule, info)} />
      </PageShell>
    );
  }
  if (name === "music") {
    // Music as large squares, laid out as About is; the regular nights link to their OutSavvy listings
    const events = (await getEvents()) ?? [];
    const rows = await pageRows("music", musicBoxes(events), events);
    return (
      <PageShell title={page.title} tone="grey" rule={false}>
        <div className="pt-(--pad) max-md:pt-0">
          <ImageTextPage rows={rows} large imageFirst fitWindow panel="sage" />
        </div>
      </PageShell>
    );
  }
  // About as large squares: each section a row of two big boxes, a photo and the text, swapping sides, starting with the photo
  const rows = await pageRows("about", aboutBoxes);
  return (
    <PageShell title={page.title} tone="grey" rule={false}>
      <div className="pt-(--pad) max-md:pt-0">
        <ImageTextPage rows={rows} large imageFirst fitWindow panel="purple" />
      </div>
    </PageShell>
  );
}
