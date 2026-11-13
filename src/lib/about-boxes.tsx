import type { Row } from "@/components/ImageTextPage";
import { EmailLink } from "@/components/EmailLink";
import { radioUrl, salonUrl } from "@/lib/site";

// The About page as boxes: each section (its heading and paragraphs) is a row of two large squares. The
// links on Our branches are still to come (#); each ends in an up-right arrow. The music sections are on
// their own page (music-boxes.tsx).
export const aboutBoxes: Row[] = [
  {
    label: "Our story",
    paragraphs: [
      "Established in 2015, Margate Arts Club is a welcoming, DIY, inclusive and intersectional arts and culture space, centred on music, that challenges convention and nurtures both our local and artistic communities.",
      "We welcome over 700 people every week and host more than 400 events a year. That’s over 4,500 events since 2015.",
    ],
  },
  {
    label: "Our mission",
    paragraphs: [
      "To be a springboard for artists, curators, producers, musicians, selectors and DJs, including those unable to access commercial spaces. We offer genuine opportunity to test ideas, develop practice and grow careers, through events that shape a more equitable cultural future.",
      "Rooted in our community-centred heritage, we strive to be an accessible cultural hub where fun and creativity coexist.",
    ],
  },
  {
    label: "Our vision",
    paragraphs: [
      "A cultural space that prioritises creativity, community and care over profit, and highlights the importance of art and music in society.",
      "We seek to break away from the soulless, hierarchical business model of the traditional commercial music venue by embracing a spirit of anarchic creativity. We want to be a place where decisions are shaped by the people who use it, where risk-taking is encouraged, and where artists and audiences meet as equals.",
    ],
  },
  {
    label: "Our branches",
    paragraphs: [],
    body: (
      <>
        <p>We support practitioners at every level, from those just starting out to the world renowned.</p>
        <p className="mt-[1.2em]">
          We have an in-house radio station,{" "}
          <a href={radioUrl} target="_blank" rel="noopener noreferrer" className="t-link whitespace-nowrap">
            Arts Club Radio
          </a>
          , and an exhibition space curated and managed by{" "}
          <a href={salonUrl} target="_blank" rel="noopener noreferrer" className="t-link">
            Salon Gallery
          </a>
          . We&nbsp;also have studios to rent above the club.
        </p>
        <p className="mt-[1.2em]">
          If you’d like to contribute or be part of our programme, please{" "}
          <EmailLink className="t-link">get in touch</EmailLink>
          .
        </p>
      </>
    ),
  },
];
