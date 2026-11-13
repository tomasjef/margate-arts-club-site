import { defineArrayMember, defineField, defineType } from "sanity";
import { EmailLinkAnnotation } from "../EmailLinkAnnotation";

// The weekly and monthly emails: whether each one goes out, and their top and bottom. The events in the middle are filled in by the site from OutSavvy.
export const newsletter = defineType({
  name: "newsletter",
  title: "Newsletter",
  type: "document",
  fields: [
    defineField({
      name: "sendWeekly",
      title: "Send the weekly email",
      description:
        "On: it goes out every Monday at 9am to everyone who chose the weekly email. Off: it doesn't go out, and if one is being sent when you switch it off, the rest of the list doesn't get it.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "sendMonthly",
      title: "Send the monthly email",
      description:
        "On: it goes out on the 1st of every month at 9am to everyone who chose the monthly email. Off: it doesn't go out, and if one is being sent when you switch it off, the rest of the list doesn't get it.",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "intro",
      title: "Introduction at the top (optional)",
      // hidden for now (2 Nov 2026); the email still shows it if it is ever filled in
      hidden: true,
      description:
        "Words under the club's name, above the events, in both the weekly and the monthly email, for example the weekly programme. Press Enter for a new line, and leave a blank line for a new paragraph. The events list is added by itself.",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "topImage",
      title: "Image at the top (optional, weekly and monthly emails)",
      description:
        "A picture across the top of the weekly and monthly emails, under \"Weekly Newsletter\" and the date, and above the list of events. It is shown the full width of the email (568px wide at most; use a picture about 1136px wide, as a JPG, PNG or GIF). Remove it to leave the space out.",
      type: "object",
      fields: [
        defineField({ name: "image", title: "Image", type: "image", options: { hotspot: false } }),
        defineField({
          name: "alt",
          title: "Describe the image",
          description: "For people who can't see it, and shown while pictures are off. Say what is in it, for example: Poster for the November programme.",
          type: "string",
          validation: (r) => r.custom((v, ctx) => ((ctx.parent as { image?: unknown } | undefined)?.image && !v ? "Describe the image" : true)),
        }),
        defineField({
          name: "href",
          title: "Link (optional)",
          description: "Where the picture goes when it is clicked. A full address starting https://",
          type: "url",
          validation: (r) => r.uri({ scheme: ["https", "http"] }),
        }),
        defineField({
          name: "spacing",
          title: "Space above the image",
          description: "Below the image there is always 60px.",
          type: "number",
          options: { list: [{ title: "30px", value: 30 }, { title: "60px", value: 60 }], layout: "radio", direction: "horizontal" },
          initialValue: 30,
        }),
      ],
    }),
    defineField({
      name: "footerText",
      title: "Footer: top text",
      description: "Above the address and opening times. Press Enter for a new paragraph, Shift+Enter for a new line.",
      type: "array",
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [{ title: "Lighter", value: "light" }],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Web address",
                    description: "A full address starting https://, or / for a page on this site, like /visit",
                    type: "url",
                    validation: (r) => r.uri({ scheme: ["https", "http"], allowRelative: true }),
                  }),
                ],
              },
              {
                name: "emailLink",
                components: { annotation: EmailLinkAnnotation as never },
                title: "Email us link",
                description: "Opens the reader's email to the club. Nothing to fill in.",
                type: "object",
                fields: [defineField({ name: "unused", title: "Nothing to fill in", type: "boolean", hidden: true })],
              },
            ],
          },
        }),
      ],
    }),
    defineField({
      name: "footerBottom",
      title: "Footer: bottom text",
      description:
        "Under the address and opening times (those come from Opening hours and footer). Select the word unsubscribe and choose Unsubscribe link.",
      type: "array",
      validation: (r) =>
        r.custom((blocks?: { markDefs?: { _type?: string }[] }[]) =>
          !blocks?.length || blocks.some((b) => b.markDefs?.some((d) => d._type === "unsubscribeLink"))
            ? true
            : "Every email needs an unsubscribe link: select a word and choose Unsubscribe link.",
        ),
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [{ title: "Lighter", value: "light" }],
            annotations: [
              {
                name: "link",
                title: "Link",
                type: "object",
                fields: [
                  defineField({
                    name: "href",
                    title: "Web address",
                    description: "A full address starting https://, or / for a page on this site, like /visit",
                    type: "url",
                    validation: (r) => r.uri({ scheme: ["https", "http"], allowRelative: true }),
                  }),
                ],
              },
              {
                name: "unsubscribeLink",
                title: "Unsubscribe link",
                description: "Takes the reader to their own unsubscribe page. Nothing to fill in.",
                type: "object",
                fields: [defineField({ name: "unused", title: "Nothing to fill in", type: "boolean", hidden: true })],
              },
              {
                name: "emailLink",
                components: { annotation: EmailLinkAnnotation as never },
                title: "Email us link",
                description: "Opens the reader's email to the club. Nothing to fill in.",
                type: "object",
                fields: [defineField({ name: "unused", title: "Nothing to fill in", type: "boolean", hidden: true })],
              },
            ],
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Newsletter" }) },
});
