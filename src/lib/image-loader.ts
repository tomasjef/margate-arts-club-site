// next/image loader for the whole site. Photos in Sanity are resized and re-encoded by Sanity's image CDN (width and
// format in the URL), since Cloudflare Workers has no image resizing of its own. Everything else (the local placeholder
// photos) is served as it is, and OutSavvy posters bypass the loader (unoptimized).
export default function loader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://cdn.sanity.io/")) return `${src}?w=${width}&q=${quality ?? 75}&auto=format&fit=max`;
  // a local file is served as it is; the width in the address is only there because Next expects the loader to use it
  return `${src}?w=${width}`;
}
