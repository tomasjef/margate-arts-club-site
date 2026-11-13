import type { NextConfig } from "next";

// The content editor (the Sanity studio, hosted by Sanity), opened at its list of things to edit
const studio = "https://margate-arts-club.sanity.studio/structure";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  // Lets a phone on the same Wi-Fi preview the dev server (otherwise its scripts are blocked and nothing animates or opens)
  allowedDevOrigins: ["10.0.0.*", "192.168.*.*"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.outsavvy.com" }],
    // see src/lib/image-loader.ts
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
  // Search engines are kept off every address but margatearts.club by worker.ts (on each request), not here: anything set here is built into
  // the site and would have to change at launch.
  async redirects() {
    return [
      // the content editor: margatearts.club/admin opens the studio, where the club edits the pages
      { source: "/admin", destination: studio, permanent: false },
      { source: "/studio", destination: studio, permanent: false },
      // the test page for the new What's On, which became the home page on 3 Nov 2026
      { source: "/whats-on-test", destination: "/", permanent: false },
      // the old WordPress site's addresses: its login goes to the new editor, its shop and author pages to What's On
      { source: "/wp-admin/:path*", destination: studio, permanent: false },
      { source: "/wp-login.php", destination: studio, permanent: false },
      { source: "/mac-shop/:path*", destination: "/", permanent: true },
      { source: "/basket/:path*", destination: "/", permanent: true },
      { source: "/checkout/:path*", destination: "/", permanent: true },
      { source: "/my-account/:path*", destination: "/", permanent: true },
      { source: "/author/:path*", destination: "/", permanent: true },
      { source: "/feed/:path*", destination: "/", permanent: true },
      { source: "/wp-sitemap:rest(.*)", destination: "/sitemap.xml", permanent: true },
      // Our Week is now on What’s On; Live Music became Music
      { source: "/our-week", destination: "/", permanent: true },
      { source: "/live-music", destination: "/music", permanent: true },
    ];
  },
  // cacheComponents and partialPrefetching are off: OpenNext on Cloudflare Workers can not run them yet (every page hangs)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
