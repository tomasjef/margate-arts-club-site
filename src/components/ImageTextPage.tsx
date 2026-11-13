import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";

// An image is placed on the page's four columns: left (columns 1-2), centre (2-3) or right (3-4), with
// its own aspect ratio, as width:height ("3:2", "4:5", "1:1", "16:9"). A ratio wider than 2:1 runs
// across all four columns.
export type ImagePlacement = { align: "left" | "centre" | "right"; ratio: string };
// href is where the link lines go; "#" until the address exists
export type Row = { label?: string; paragraphs: string[]; image?: ImagePlacement; href?: string; body?: ReactNode; full?: boolean; alt?: string; id?: string; photo?: { src: string; alt: string }; edit?: string; editPhoto?: string };

export type Panel = "tan" | "sage" | "purple";

export const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const images = [
  { src: "/about/pearl-facade.png", alt: "The turquoise PEARL facade of Margate Arts Club" },
  { src: "/about/portrait.jpg", alt: "A man in a white t-shirt beside a monitor showing his face" },
];

// The home page's event grid: two hairline boxes per row, inset by the page margin with a page-margin
// gap. Each box is a square image and a text square (no line between them), swapping sides every
// second row. In the text square the label, where there is one, sits at the top in grey and the
// copy at the bottom, as the date and price do on the event cards. No sub-navigation. A row can carry
// its own `body` (lists, links) in place of paragraphs.
export function ImageTextPage({
  rows,
  large = false,
  imageFirst = false,
  fitWindow = false,
  panel,
}: {
  rows: Row[];
  large?: boolean;
  // large boxes: start with the photo on the left of the first row, not the text
  imageFirst?: boolean;
  // large boxes: each row is at least as tall as the window below the header and the Jump to bar, so
  // jumping to a section fills the screen with its two boxes (a row still grows if its copy needs it)
  fitWindow?: boolean;
  // large boxes: the page's own colour for its text boxes, and a light wash of it over its photos (none: white boxes, photos as they are)
  panel?: Panel;
}) {
  if (large) return <LargeBoxes rows={rows} imageFirst={imageFirst} fitWindow={fitWindow} panel={panel} />;
  return (
    <div className="grid gap-(--pad) px-(--pad) md:grid-cols-2">
      {rows.map((row, i) => {
        const img = images[i % 2];
        const textLeft = Math.floor(i / 2) % 2 === 1;
        return (
          <section
            key={i}
            id={row.label ? slug(row.label) : undefined}
            className="grid border border-ink md:min-h-[calc((100vw-var(--pad)*3)/4)] md:grid-cols-2"
          >
            <div className="relative aspect-square md:aspect-auto">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 768px) 25vw, 100vw"
                className="object-cover"
                priority={i < 2}
              />
              <span aria-hidden="true" className="photo-shield" />
            </div>
            <div className={`text-block t-button flex aspect-square md:aspect-auto bg-surface flex-col justify-between gap-y-[calc(var(--pad)*2)] p-(--card-pad) ${textLeft ? "md:order-first" : ""}`}>
              {row.label ? <p className="text-muted">{row.label}</p> : <span />}
              <div>
                {row.body ??
                  row.paragraphs.map((p) => (
                    <p key={p} className="[&+p]:mt-[1.2em]">
                      {p}
                    </p>
                  ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}

// Large: each paragraph is a row of two big hairline squares, the photo and the text, a page margin
// apart and inset by the page margin, swapping sides every row, starting with the text on the left (or the photo, with imageFirst). The text square has the label in
// capitals at the top and the copy at the bottom at the body size; it grows if the copy needs it.
function LargeBoxes({ rows, imageFirst, fitWindow, panel }: { rows: Row[]; imageFirst: boolean; fitWindow: boolean; panel?: Panel }) {
  const panelVar = panel ? ({ "--panel": `var(--panel-${panel})`, "--panel-deep": `var(--panel-${panel}-deep)` } as CSSProperties) : undefined;
  // square by default (half the page width); with fitWindow, the height of the window less the header, the
  // Jump to bar (50px) and the page margin above and below
  const rowHeight = fitWindow ? "md:min-h-[calc(100svh-var(--header-h)-50px-var(--pad)*2)]" : "md:min-h-[calc((100vw-var(--pad)*3)/2)]";
  // Photo rows count on their own, so the first one has the text on the left however many full rows come first
  const photoIndex = rows.map((row, i) => (row.full ? -1 : rows.slice(0, i).filter((r) => !r.full).length));
  return (
    <div className="flex flex-col gap-(--pad) px-(--pad)">
      {rows.map((row, i) => {
        const body = (
          <div className="text-pretty">
            {row.body ??
              row.paragraphs.map((p) => (
                <p key={p} className="[&+p]:mt-[1.2em]">
                  {p}
                </p>
              ))}
          </div>
        );
        const textBox = "text-block t-body flex flex-col justify-between gap-y-[calc(var(--pad)*2)] border border-ink bg-surface p-(--pad)";
        const id = row.id ?? (row.label ? slug(row.label) : undefined);
        // A full row is one white box across the page, with no photo (the Visit table)
        if (row.full) {
          return (
            <section key={i} id={id} className="scroll-mt-[calc(var(--header-h)+var(--pad)+50px)]">
              <div data-sanity={row.edit} data-panel={panel} style={panelVar} className={`${textBox} gap-y-(--pad)`}>
                {row.label && <h2 className="uppercase">{row.label}</h2>}
                {body}
              </div>
            </section>
          );
        }
        const k = photoIndex[i];
        const img = images[k % 2];
        return (
          <section
            key={i}
            id={id}
            className={`grid scroll-mt-[calc(var(--header-h)+var(--pad)+50px)] gap-(--pad) max-md:grid-cols-[minmax(0,1fr)] ${rowHeight} md:grid-cols-2`}
          >
            <div data-sanity={row.editPhoto} style={panelVar} className={`relative aspect-square border border-ink md:aspect-auto ${panel ? "photo-tint " : ""}${(k % 2 === 0) === imageFirst ? "" : "md:order-last"}`}>
              <Image
                src={row.photo?.src ?? img.src}
                alt={row.photo?.alt ?? row.alt ?? img.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority={i < 1}
              />
              <span aria-hidden="true" className="photo-shield" />
            </div>
            <div data-sanity={row.edit} data-panel={panel} style={panelVar} className={`${textBox} aspect-square md:aspect-auto`}>
              {row.label ? <h2 className="uppercase">{row.label}</h2> : <span />}
              {body}
            </div>
          </section>
        );
      })}
    </div>
  );
}
