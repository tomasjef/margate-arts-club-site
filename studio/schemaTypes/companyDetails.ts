import { defineField, defineType } from "sanity";

// The company's registration details (Companies House): shown as the Company part of the Privacy page, at /company, and as the company's
// name in the footer and in the Privacy and Accessibility text. One document (id legal-company); where a field is left empty the website
// uses the one written in src/lib/site.ts.
export const companyDetails = defineType({
  name: "companyDetails",
  title: "Company",
  type: "document",
  fields: [
    defineField({ name: "companyName", title: "Company name", description: "As registered, for example Margate Arts Club CIC. Shown in the footer and in the Privacy and Accessibility text.", type: "string", validation: (r) => r.required() }),
    defineField({ name: "companyNumber", title: "Company number", description: "The Companies House number.", type: "string", validation: (r) => r.required() }),
    defineField({ name: "registeredOffice", title: "Registered office", description: "The registered address, on one line.", type: "string", validation: (r) => r.required() }),
  ],
  preview: { prepare: () => ({ title: "Company" }) },
});
