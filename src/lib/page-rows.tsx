import { OpeningHours } from "@/components/OpeningHours";
import { RichText } from "@/components/RichText";
import type { Row } from "@/components/ImageTextPage";
import { editAttr, getSections, getSiteInfo, sanityImageUrl, type CmsSection } from "@/lib/cms";
import { mapsUrlFor } from "@/lib/site";
import type { Event } from "@/lib/events";
import { regularHref } from "@/lib/week";

const nameOf = (item: string | { name?: string }) => (typeof item === "string" ? item : item.name ?? "");
const escape = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The rows of the Visit, Music or About page as the club has them in Sanity (heading, text, list, photo). When Sanity has
// nothing for the page yet, or can't be reached, it returns `fallback`, the same page written out in the code. `events` are
// the live OutSavvy events, which a list can link to (the regular nights).
export async function pageRows(page: "visit" | "music" | "about", fallback: Row[], events: Event[] = []): Promise<Row[]> {
  const sections = await getSections(page);
  if (!sections) return fallback;
  return rowsFromSections(sections, events, page === "visit", `page-${page}`, page === "music");
}

// The same, for the sections of any page (the pages the club adds come through here too)
// With `sortLists` (the Music page) every list is shown in alphabetical order, whatever order the club typed it in.
// On the Visit page the section headed "Opening hours" shows the hours and the one headed "Find us" shows the address and map link.
export async function rowsFromSections(sections: CmsSection[], events: Event[] = [], visit = false, docId?: string, sortLists = false): Promise<Row[]> {
  const info = await getSiteInfo();
  const address = `${info.address1}, ${info.address2}`;
  const mapsUrl = mapsUrlFor(info);
  return Promise.all(sections.map(async (s) => {
    const at = s._key && docId ? `sections[_key=="${s._key}"]` : null;
    const src = s.photo?.ref ? sanityImageUrl(s.photo.ref) : null;
    const hasText = !!s.body?.length;
    const showHours = visit && s.label === "Opening hours";
    const showAddress = visit && s.label === "Find us";
    const body = (
      <>
        {showHours && <OpeningHours />}
        {hasText && (showHours ? <div className="mt-[1.2em]"><RichText value={s.body!} /></div> : <RichText value={s.body!} />)}
        {showAddress && (
          <>
            <p className="mt-[1.2em]">{address}</p>
            <p>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="t-link">
                Open in Maps
              </a>
            </p>
          </>
        )}
        {!!s.listItems?.length && (
          // one name a line on phones (two columns split the longer names over two or three lines); two columns from 768px
          <ul className={`${hasText ? "mt-[1.2em] " : ""}md:columns-2 gap-x-(--pad)`}>
            {(sortLists ? [...s.listItems].sort((a, b) => nameOf(a).localeCompare(nameOf(b), "en", { sensitivity: "base" })) : s.listItems).map((item) => {
              const { name = "", url } = typeof item === "string" ? { name: item, url: undefined } : item;
              // its own address first; otherwise its next event, if the section asks for that
              const href = url || (s.listLinksToEvents ? regularHref(events, escape(name)) : undefined);
              const external = !!href && /^https?:/.test(href);
              return (
                <li key={name} className="break-inside-avoid">
                  {href ? (
                    <a href={href} className="t-link" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {name}
                    </a>
                  ) : (
                    name
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {s.afterList && <p className="mt-[0.6em] text-muted-light">{s.afterList}</p>}
      </>
    );
    return {
      label: s.label,
      paragraphs: [],
      body,
      edit: at ? await editAttr(docId!, "page", at) : undefined,
      editPhoto: at ? await editAttr(docId!, "page", `${at}.photo`) : undefined,
      ...(src ? { photo: { src, alt: s.photo?.alt ?? "" } } : {}),
    };
  }));
}
