import { LegalPage } from "@/components/LegalPage";
import { legalSections } from "@/components/legal-sections";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () =>
  pageMetadata({
    title: "Company",
    description: "Company details for Margate Arts Club CIC, a community interest company registered in England and Wales.",
    path: "/company",
    // the same page as Privacy (opened at this part), so search engines list that one address
    canonical: "/privacy",
  });

// The text is in legal-sections.tsx, with the other two legal pages' (all three show on every page, one under another)
export default async function Page() {
  return <LegalPage current="company" sections={await legalSections()} />;
}
