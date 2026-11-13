// Structured data for search engines (schema.org, as JSON-LD): what lets Google show the venue's hours and the events in its results.
// "<" is escaped so no text from the CMS or OutSavvy can close the script tag.
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
