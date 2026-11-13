import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImageTextPage } from "@/components/ImageTextPage";
import { FixedPage, fixedMetadata } from "@/components/FixedPage";
import { PageShell } from "@/components/PageShell";
import { fixedNameAt, getPageBySlug } from "@/lib/cms";
import { getEvents } from "@/lib/outsavvy";
import { rowsFromSections } from "@/lib/page-rows";
import { excerpt, pageMetadata, siteDescription } from "@/lib/seo";

// A page the club has added in Sanity ("Other pages"), laid out like Visit, Music and About. The pages that exist in the code
// (/visit, /privacy and so on) take priority over this one, so an address can only reach a page the club made.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  // Visit, Music or About at the address the club gave it
  const fixed = await fixedNameAt(slug);
  if (fixed) return fixedMetadata(fixed);
  const page = await getPageBySlug(slug);
  if (!page) return {};
  // the club's search description, or the start of the page's first text
  const first = (page.sections ?? []).flatMap((s) => (Array.isArray(s.body) ? s.body : [])).map((b) => ((b as { children?: { text?: string }[] }).children ?? []).map((c) => c.text ?? "").join("")).join(" ");
  return pageMetadata({ title: page.title, description: page.description?.trim() || excerpt(first) || siteDescription, path: `/${slug}` });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fixed = await fixedNameAt(slug);
  if (fixed) return <FixedPage name={fixed} atNewAddress />;
  const page = await getPageBySlug(slug);
  if (!page?.sections?.length) notFound();
  const events = (await getEvents()) ?? [];
  const rows = await rowsFromSections(page.sections, events, false, page._id);
  return (
    // the Jump to bar has its own hairlines, so the header's hairline is off here
    <PageShell title={page.title} tone="grey" rule={false}>
      <div className="pt-(--pad) max-md:pt-0">
        <ImageTextPage rows={rows} large imageFirst fitWindow />
      </div>
    </PageShell>
  );
}
