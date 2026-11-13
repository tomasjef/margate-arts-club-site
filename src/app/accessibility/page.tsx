import { LegalPage } from "@/components/LegalPage";
import { legalSections } from "@/components/legal-sections";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () =>
  pageMetadata({
    title: "Accessibility",
    description: "The accessibility statement for the Margate Arts Club website, and how to tell us about a problem.",
    path: "/accessibility",
    // the same page as Privacy (opened at this part), so search engines list that one address
    canonical: "/privacy",
  });

// The text is in legal-sections.tsx, with the other two legal pages' (all three show on every page, one under another)
export default async function Page() {
  return <LegalPage current="accessibility" sections={await legalSections()} />;
}
