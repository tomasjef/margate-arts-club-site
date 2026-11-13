import { defineArrayMember, defineField, defineType } from "sanity";
import { EmailLinkAnnotation } from "../EmailLinkAnnotation";

export const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Opening hours, the address and Instagram link: one document, edited in one place. The footer, the Visit
// page, the header's Open/Closed line and the Open/Closed line read from it.
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Opening hours and footer",
  type: "document",
  fields: [
    defineField({
      name: "hours",
      title: "Opening hours",
      description:
        "One line for each group of days, as in the footer: for example Monday to Thursday, Friday to Saturday, Sunday. Together the lines must cover all seven days, each once. Times are 24-hour, like 12:00 or 23:00. If the club closes after midnight, give the early-morning time (02:00).",
      type: "array",
      validation: (rule) =>
        rule.required().custom((groups) => {
          const covered: number[] = [];
          for (const g of (groups ?? []) as { first?: string; last?: string }[]) {
            const i = days.indexOf(g.first ?? "");
            const j = days.indexOf(g.last ?? g.first ?? "");
            if (i < 0 || j < 0) return "Choose the first and last day of each line";
            for (let d = i; ; d = (d + 1) % 7) {
              covered.push(d);
              if (d === j) break;
            }
          }
          return covered.length === 7 && new Set(covered).size === 7 ? true : "The lines must cover all seven days, each day once";
        }),
      of: [
        defineArrayMember({
          type: "object",
          name: "hoursGroup",
          fields: [
            defineField({ name: "first", title: "From day", type: "string", options: { list: days }, validation: (r) => r.required() }),
            defineField({ name: "last", title: "To day (leave the same for a single day)", type: "string", options: { list: days }, validation: (r) => r.required() }),
            defineField({
              name: "opens",
              title: "Opens",
              type: "string",
              validation: (r) => r.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "24-hour time" }).error("Use 24-hour time, like 12:00"),
            }),
            defineField({
              name: "closes",
              title: "Closes",
              type: "string",
              validation: (r) => r.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { name: "24-hour time" }).error("Use 24-hour time, like 23:00"),
            }),
            defineField({ name: "note", title: "Note under the hours (optional)", description: 'For example "Free entry before 8pm"', type: "string" }),
          ],
          initialValue: { first: "Monday", last: "Monday" },
          preview: {
            select: { first: "first", last: "last", opens: "opens", closes: "closes" },
            prepare: ({ first, last, opens, closes }) => ({ title: first === last ? first : `${first} to ${last}`, subtitle: `${opens}–${closes}` }),
          },
        }),
      ],
    }),
    defineField({
      name: "findUs",
      title: "Find us (the footer's address and links)",
      description:
        "The first two lines are the address, shown in the footer and on the Visit page. Select them and press the link button to choose where they link (for example a Google Maps address); with no link on them the website links them to Google Maps by itself. After them, one line for each link, like Email us and Instagram: select the words and press the link button.",
      type: "array",
      validation: (r) => r.required().min(2).error("Please give the two lines of the address"),
      of: [
        defineArrayMember({
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
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
                    description: "A full address starting https://, or / for a page on this site",
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
      name: "footerText",
      title: "Small print under the mailing list",
      description:
        'Plain text at the foot of every page: press Enter for a new line. Select words to link them, or to make them lighter. Shift+Enter starts a new line on phones only (on a computer it is a space). Type {year} where the current year should go, for example "© {year} Margate Arts Club CIC".',
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
                    description: "A full address starting https://, or / for a page on this site, like /privacy",
                    type: "url",
                    validation: (r) => r.uri({ scheme: ["https", "http"], allowRelative: true }),
                  }),
                ],
              },
            ],
          },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Opening hours and footer" }) },
});
