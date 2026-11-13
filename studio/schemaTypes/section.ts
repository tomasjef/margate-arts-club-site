import { defineArrayMember, defineField, defineType } from "sanity";
import { EmailLinkAnnotation } from "../EmailLinkAnnotation";
import { BodyInput } from "../BodyInput";
import { limitFor, textLength } from "../textLimits";

// One section of a page: a heading, the text, and a photo beside it. The page lays its sections out as a row of
// two large squares each (text and photo), swapping sides down the page.
export const section = defineType({
  name: "section",
  title: "Section",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Heading", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "body",
      title: "Text",
      description: "Press Enter for a new paragraph. Select words and use the link button to link them. The text has to fit the square box on the page, so the number of characters is limited: the counter under the box shows how many are left.",
      type: "array",
      components: { input: BodyInput },
      validation: (r) =>
        r.custom((value, ctx) => {
          const list = (ctx.parent as { listItems?: unknown[] } | undefined)?.listItems;
          const max = limitFor(Array.isArray(list) && list.length > 0);
          const n = textLength(value);
          return n > max ? `The text is ${n} characters, ${n - max} too many: up to ${max} fit in the square box on the page.` : true;
        }),
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [{ title: "Lighter (a note)", value: "light" }],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Web address",
                    description: 'A full address starting https://, or / for the What\'s On page',
                    type: "url",
                    validation: (r) => r.uri({ scheme: ["https", "http"], allowRelative: true }),
                  }),
                ],
              },
              {
                name: "emailLink",
                components: { annotation: EmailLinkAnnotation as never },
                title: "Email us link",
                description: "Opens the visitor's email to the club. Nothing to fill in: the address is kept off the page on purpose.",
                type: "object",
                fields: [defineField({ name: "unused", title: "Nothing to fill in", type: "boolean", hidden: true })],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: "listItems",
      title: "List (optional)",
      description: "Names shown in two columns under the text, like the regular nights or the guests. Each can have its own web address.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "listItem",
          fields: [
            defineField({ name: "name", title: "Name", type: "string", validation: (r) => r.required() }),
            defineField({
              name: "url",
              title: "Web address (optional)",
              description: "A full address starting https://, or / for a page on this site. Leave empty for no link (or to use the next event, if that is ticked below).",
              type: "url",
              validation: (r) => r.uri({ scheme: ["https", "http"], allowRelative: true }),
            }),
          ],
          preview: { select: { title: "name", subtitle: "url" } },
        }),
      ],
    }),
    defineField({
      name: "listLinksToEvents",
      title: "Names without their own address link to their next event",
      type: "boolean",
      initialValue: false,
    }),
    defineField({ name: "afterList", title: "Line under the list (optional)", type: "string" }),
    defineField({
      name: "photo",
      title: "Photo",
      description: "A photo about 2000 pixels wide is plenty. Please keep files under 2 MB.",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Describe the photo",
          description: "For people who can't see it, in a short sentence.",
          type: "string",
          validation: (r) => r.required().error("Describe the photo for screen readers"),
        }),
      ],
    }),
  ],
  preview: { select: { title: "label", media: "photo" } },
});
