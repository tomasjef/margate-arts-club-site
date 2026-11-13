import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { liveUrl } from "@/lib/seo";

// robots.txt, worked out for the address it is asked on: margatearts.club lets search engines in (all but the mailing list's pages, the
// newsletter previews and the design system); any other address of the site (the test ones) turns them all away.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  if (host !== new URL(liveUrl).host) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/mailing-list/", "/newsletter/", "/design-system"] },
    sitemap: `${liveUrl}/sitemap.xml`,
  };
}
