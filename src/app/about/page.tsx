import { FixedPage, fixedMetadata } from "@/components/FixedPage";

// About: its own address in the code. See components/FixedPage.tsx: if the club has renamed the page and moved it, this sends people on.
export const generateMetadata = () => fixedMetadata("about");

export default function Page() {
  return <FixedPage name="about" />;
}
