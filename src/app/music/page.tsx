import { FixedPage, fixedMetadata } from "@/components/FixedPage";

// Music: its own address in the code. See components/FixedPage.tsx: if the club has renamed the page and moved it, this sends people on.
export const generateMetadata = () => fixedMetadata("music");

export default function Page() {
  return <FixedPage name="music" />;
}
