import type { MetadataRoute } from "next";
import { getFixedPages, getPageList } from "@/lib/cms";
import { liveUrl } from "@/lib/seo";

// sitemap.xml: the site's pages for search engines, the fixed ones and the pages the club has added in the studio. Accessibility and Company
// are left out: they are the Privacy page, opened at their part (their canonical address is /privacy).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Visit, Music and About at the address the club has given them (the studio can rename them)
  const named = await getFixedPages();
  const fixed = ["/", `/${named.visit.slug}`, `/${named.music.slug}`, `/${named.about.slug}`, "/newsletter", "/privacy"].map((path) => ({
    url: `${liveUrl}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? ("daily" as const) : ("monthly" as const),
    priority: path === "/" ? 1 : 0.6,
  }));
  const club = (await getPageList()).map((p) => ({ url: `${liveUrl}/${p.slug}`, lastModified: p.updated, changeFrequency: "monthly" as const, priority: 0.5 }));
  return [...fixed, ...club];
}
