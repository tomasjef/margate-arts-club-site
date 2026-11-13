import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { AnimatedFavicon } from "@/components/AnimatedFavicon";
import { HoursProvider } from "@/components/HoursProvider";
import { VisualEditing } from "next-sanity/visual-editing";
import { getMenu, getSchedule, getSiteInfo, isDraft } from "@/lib/cms";
import { liveUrl, openGraphBase, siteDescription } from "@/lib/seo";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// What search engines and link previews show (see src/lib/seo.ts). A page's own title goes before the site's name: "Visit · Margate Arts Club".
export const metadata: Metadata = {
  metadataBase: new URL(liveUrl),
  title: { default: "Margate Arts Club · Listening bar, live music and arts space", template: "%s · Margate Arts Club" },
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: { ...openGraphBase, url: "/" },
  twitter: { card: "summary_large_image" },
};

// Light only: phones that darken pages themselves (Samsung Internet, Chrome's dark theme for sites) leave the site as it was designed
export const viewport: Viewport = { colorScheme: "only light" };

// data-buttons on <html> picks the boxed date filters and Jump to buttons (see globals.css).
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [{ hours }, menu, info, draft] = await Promise.all([getSchedule(), getMenu(), getSiteInfo(), isDraft()]);
  return (
    <html lang="en-GB" data-buttons="boxed" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <AnimatedFavicon />
        <HoursProvider value={{ hours, menu, instagramUrl: info.instagramUrl }}>{children}</HoursProvider>
        {/* only while the studio's Presentation preview is open: the click-to-edit boxes */}
        {draft && <VisualEditing />}
      </body>
    </html>
  );
}
