import { defineArrayMember, defineField, defineType, type ValidationContext } from "sanity";
import { addressOf } from "../addresses";

// Visit, Music and About cannot be removed, but can be renamed, and their address follows the name (Music → Sound gives /sound): the site then
// answers at the new address and sends the old one (/music) to it for good (src/lib/cms.ts works the address out from the name, with the
// same addressOf). Pages the club adds have their own address (slug), set once with Generate and kept, so links to them don't break.
export const fixedPageIds = ["page-visit", "page-music", "page-about"];
const plainId = (id?: string) => String(id ?? "").replace(/^drafts\./, "");
const isFixed = (id?: string) => fixedPageIds.includes(plainId(id));
// the address each fixed page started with ("page-music" -> "music")
const ownAddress = (id?: string) => (isFixed(id) ? plainId(id).replace(/^page-/, "") : undefined);

// The addresses the other pages have now: a fixed page's from its name, an added page's from its address
async function addressesOfOthers(ctx: ValidationContext) {
  const self = plainId(ctx.document?._id);
  const pages = await ctx.getClient({ apiVersion: "2025-10-01" }).fetch<{ _id: string; title?: string; slug?: string }[]>(
    `*[_type == "page" && !(_id in path("drafts.**"))]{_id, title, "slug": slug.current}`,
  );
  return pages.filter((p) => p._id !== self).map((p) => (isFixed(p._id) ? addressOf(p.title ?? "") || ownAddress(p._id) : p.slug));
}

// Addresses a new page can't take, because the site already uses them
const reserved = ["visit", "music", "about", "privacy", "accessibility", "newsletter", "mailing-list", "company", "studio", "design-system", "our-week", "live-music", "api", "icon.svg", "favicon.ico", "robots.txt", "sitemap.xml", "admin", "share.png", "apple-icon.png", "wp-admin", "wp-login.php"];

// Visit, Music, About and the pages the club adds: each is a list of sections (heading, text, list, photo)
export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Page name",
      description: "Shown in the menu and in Google and the browser tab. On Visit, Music and About the page's web address follows its name: Music renamed Sound moves to margatearts.club/sound (the old address keeps working and sends people to it).",
      type: "string",
      validation: (r) =>
        r.required().custom(async (value, ctx) => {
          // only Visit, Music and About: their address is made from their name, so the name has to make a good one
          if (!isFixed(ctx.document?._id) || typeof value !== "string") return true;
          const address = addressOf(value);
          if (!address) return "Please use letters or numbers in the name: the page's web address is made from it";
          if (reserved.includes(address) && address !== ownAddress(ctx.document?._id)) return `The address /${address} is already used by the site. Please choose another name`;
          if ((await addressesOfOthers(ctx)).includes(address)) return `Another page already has the address /${address}. Please choose another name`;
          return true;
        }),
    }),
    defineField({
      name: "slug",
      title: "Web address",
      description: "The end of the page's address, for example hire-the-space gives margatearts.club/hire-the-space. Press Generate to make it from the name. It stays as it is when the name is changed later, so links to the page keep working.",
      type: "slug",
      options: { source: "title", maxLength: 60 },
      // Visit, Music and About have no address of their own to fill in: it follows their name
      hidden: ({ document }) => isFixed(document?._id),
      validation: (r) =>
        r.custom(async (value, ctx) => {
          if (isFixed(ctx.document?._id)) return true;
          const current = (value as { current?: string } | undefined)?.current;
          if (!current) return "Press Generate to make the web address";
          if (reserved.includes(current)) return "The site already uses that address. Please choose another";
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(current)) return "Use only lower-case letters, numbers and single dashes";
          // Visit, Music and About can be moved to an address of their own (Music → Sound)
          if ((await addressesOfOthers(ctx)).includes(current)) return "Another page already has that address. Please choose another";
          return true;
        }),
    }),
    defineField({
      name: "showInMenu",
      title: "Show in the menu",
      description: "Adds the page to the menu, after About (newest last).",
      type: "boolean",
      initialValue: false,
      // the order and contents of the menu are now set in Menu; this only counts until Menu has been filled in
      hidden: true,
    }),
    defineField({
      name: "description",
      title: "Search description (optional)",
      description:
        "One or two sentences that Google and link previews show under the page's name. On a page you add, leave it empty to use the start of the first section.",
      type: "text",
      rows: 3,
      validation: (r) => r.max(200).warning("Google shows about the first 155 characters"),
    }),
    defineField({
      name: "sections",
      title: "Sections",
      description: "Each section is a heading, text and a photo. Drag to reorder.",
      type: "array",
      of: [defineArrayMember({ type: "section" })],
    }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
