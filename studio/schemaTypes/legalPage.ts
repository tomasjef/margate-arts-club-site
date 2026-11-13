import { defineArrayMember, defineField, defineType } from "sanity";
import { EmailLinkAnnotation } from "../EmailLinkAnnotation";

// Privacy and Accessibility: a plain text page with headings, paragraphs, bullet lists and links
export const legalPage = defineType({
  name: "legalPage",
  title: "Text page",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Page name", type: "string", readOnly: true }),
    defineField({
      name: "updated",
      title: "Last updated",
      description: "Shown under the page name. Change it whenever the text changes in a way that matters.",
      type: "date",
      options: { dateFormat: "D MMMM YYYY" },
    }),
    defineField({
      name: "body",
      title: "Text",
      description: "Use Heading for section titles. Select words and use the link button to link them.",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading", value: "h3" },
          ],
          lists: [{ title: "Bullet list", value: "bullet" }],
          marks: {
            decorators: [],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Web address",
                    description: "A full address starting https://, or / followed by a page address on this site",
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
  ],
  preview: { select: { title: "title" } },
});
