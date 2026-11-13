import { LegalPage } from "@/components/LegalPage";
import { legalSections } from "@/components/legal-sections";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () =>
  pageMetadata({ title: "Privacy", description: "How Margate Arts Club CIC collects and uses personal information, including the mailing list, and your rights.", path: "/privacy" });

// The text is in legal-sections.tsx, with the other two legal pages' (all three show on phones)
export default async function Page() {
  return <LegalPage current="privacy" sections={await legalSections()} />;
}
