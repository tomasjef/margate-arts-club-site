import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { EmailLink } from "@/components/EmailLink";
import { ownPath } from "@/lib/site";
import { inkStyle } from "@/lib/ink";

// The text of a section as the club wrote it in Sanity: paragraphs a line apart (1.2em), with links in the site's
// link style and lighter notes. The email link is the same hidden-address link used elsewhere.
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="[&+p]:mt-[1.2em]">{children}</p>,
    // headings are for the text pages (Privacy, Accessibility); LegalPage sets their look and spacing (the text itself is in legal-sections.tsx)
    h3: ({ children }) => <h3>{children}</h3>,
  },
  list: { bullet: ({ children }) => <ul>{children}</ul> },
  listItem: { bullet: ({ children }) => <li>{children}</li> },
  marks: {
    link: ({ value, children }) => {
      const href: string = ownPath(value?.href ?? "#");
      if (href.startsWith("/")) {
        return (
          <Link href={href} className="t-link">
            {children}
          </Link>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="t-link">
          {children}
        </a>
      );
    },
    emailLink: ({ children }) => <EmailLink className="t-link">{children}</EmailLink>,
    light: ({ children }) => <span className="text-muted-light">{children}</span>,
  },
};

// softBreaks (the footer's small print): a line break typed inside a paragraph (Shift+Enter) marks where the line may break, not
// where it must. Each part between breaks moves to the next line as a whole, and only when it doesn't fit after the part before:
// "See our Privacy Policy." is never split, and joins the line above on a phone wide enough, in the desktop column it is one line.
// The parts take turns at two marks (partA, partB), so two parts side by side stay two groups.
const part = ({ children }: { children?: React.ReactNode }) => <span className="inline-block">{children}</span>;
const breakableParts: PortableTextComponents = {
  ...components,
  marks: { ...components.marks, partA: part, partB: part },
};

type Span = { _type: string; _key?: string; text?: string; marks?: string[] };
type Block = { _type: string; children?: Span[] };

function asParts(blocks: unknown[]) {
  return blocks.map((b) => {
    const block = b as Block;
    if (block._type !== "block" || !block.children?.some((c) => c.text?.includes("\n"))) return block;
    let n = 0;
    const children: Span[] = [];
    block.children.forEach((span, i) => {
      if (span._type !== "span" || typeof span.text !== "string") return void children.push(span);
      const pieces = span.text.split("\n");
      pieces.forEach((piece, j) => {
        if (j > 0) {
          // a break: the space between two parts, outside both, where the line can break
          n++;
          children.push({ _type: "span", _key: `${span._key ?? i}-gap${j}`, text: " ", marks: [] });
        }
        let text = j > 0 ? piece.trimStart() : piece;
        if (j < pieces.length - 1) text = text.trimEnd();
        if (text) children.push({ ...span, _key: `${span._key ?? i}-${j}`, text, marks: [n % 2 ? "partB" : "partA", ...(span.marks ?? [])] });
      });
    });
    return { ...block, children };
  });
}

// ink (the footer, whose lines start on the page margin, with its type's weight): on phones each paragraph's first letter starts on the
// margin, level with the logo (lib/ink.ts)
const firstText = (value: unknown) => (value as Block | undefined)?.children?.find((c) => c.text?.trim())?.text;
function withInk(base: PortableTextComponents, weight: 400 | 500 | 600): PortableTextComponents {
  return {
    ...base,
    block: {
      ...(base.block as object),
      normal: ({ children, value }) => (
        <p className="ink [&+p]:mt-[1.2em]" style={inkStyle(firstText(value), weight)}>
          {children}
        </p>
      ),
    },
  };
}

export function RichText({ value, softBreaks = false, ink }: { value: unknown[]; softBreaks?: boolean; ink?: 400 | 500 | 600 }) {
  const base = softBreaks ? breakableParts : components;
  return <PortableText value={(softBreaks ? asParts(value) : value) as never} components={ink ? withInk(base, ink) : base} />;
}
