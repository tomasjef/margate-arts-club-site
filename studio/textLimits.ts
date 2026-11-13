// How much text a section's square box on the website holds. Measured on 7 Nov 2026 with the real page: at desktop widths (1024px up to
// 1440px, where the text size grows with the box) a square box holds about 540 characters in two or three paragraphs under its heading;
// 500 leaves room for how the lines happen to wrap. Wider screens hold more, tablets (768 to 1023px) fewer, so this is the desktop size
// (the box grows taller instead of clipping, it never cuts text off). With a list under the text (Music's regular nights) the box is
// mostly list, and 250 fits (Our nights: 243 characters and 14 names).
export const MAX_TEXT = 500;
export const MAX_TEXT_WITH_LIST = 250;

export const limitFor = (hasList: boolean) => (hasList ? MAX_TEXT_WITH_LIST : MAX_TEXT);

type Block = { _type?: string; children?: { text?: string }[] };

// The characters the visitor reads (spaces included, the paragraph breaks not)
export const textLength = (blocks: unknown): number =>
  Array.isArray(blocks) ? (blocks as Block[]).reduce((sum, b) => sum + (b?._type === "block" ? (b.children ?? []).reduce((n, c) => n + (c.text?.length ?? 0), 0) : 0), 0) : 0;
