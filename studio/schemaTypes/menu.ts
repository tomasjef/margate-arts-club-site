import { defineArrayMember, defineField, defineType } from "sanity";

// The site's menu (behind the bars in the header): which pages are in it and in what order. Contact and Instagram always come after them.
export const menu = defineType({
  name: "menu",
  title: "Menu",
  type: "document",
  fields: [
    defineField({
      name: "items",
      title: "Pages in the menu",
      description:
        "Drag the handles to change the order. Add item puts another page in the menu; a page's ⋯ button and Remove takes it out of the menu (the page itself stays on the site). Contact and Instagram always come last.",
      type: "array",
      of: [
        defineArrayMember({ type: "reference", title: "Page", to: [{ type: "page" }] }),
        defineArrayMember({
          type: "object",
          name: "whatsOn",
          title: "What’s On (the home page)",
          fields: [defineField({ name: "unused", title: "Nothing to fill in", type: "boolean", hidden: true })],
          preview: { prepare: () => ({ title: "What’s On", subtitle: "The home page" }) },
        }),
      ],
      validation: (r) => r.required().min(1).unique().error("Each page can be in the menu once"),
    }),
  ],
  preview: { prepare: () => ({ title: "Menu" }) },
});
