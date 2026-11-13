import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/lib/sanity-client";

// The studio's Presentation tool opens this address to turn on the preview (Next.js draft mode) for the editor's browser
export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: process.env.SANITY_API_READ_TOKEN }),
});
