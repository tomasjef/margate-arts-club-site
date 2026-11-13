import Link from "next/link";
import type { Row } from "@/components/ImageTextPage";
import { OpeningHours } from "@/components/OpeningHours";
import { EmailLink } from "@/components/EmailLink";
import { address, mapsUrl } from "@/lib/site";

// The Visit page as boxes, in the style of the About boxes: each section is a row of two large squares, a
// photo and the text, swapping sides. The opening hours are on the Every week page.
export const visitBoxes: Row[] = [
  {
    label: "Opening hours",
    alt: "Inside the bar (placeholder photo)",
    paragraphs: [],
    body: (
      <>
        {/* the hours as they are in the footer, both worked out from lib/week.ts */}
        <OpeningHours />
        <p className="mt-[1.2em]">
          <span className="text-muted-light">
            After 8pm, entry is usually by donation or £5, <span className="whitespace-nowrap">depending on the event.</span>
          </span>
          <Link href="/" className="t-link block w-fit">
            Check the programme to see what’s on.
          </Link>
        </p>
      </>
    ),
  },
  {
    label: "Find us",
    alt: "Northdown Road (placeholder photo)",
    paragraphs: [],
    body: (
      <>
        <p>
          We’re based in the heart of Northdown Road, a vibrant street in Cliftonville, Margate, that’s home to a
          diverse community. Our building was built in 1913 and has housed a venue and community hub since 2015.
        </p>
        <p className="mt-[1.2em]">{address}</p>
        <p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="t-link">
            Open in Maps
          </a>
        </p>
      </>
    ),
  },
  {
    label: "The space",
    alt: "The main room (placeholder photo)",
    paragraphs: [],
    body: (
      <>
        <p>
          We open our doors much like a traditional pub or listening bar, serving drinks. Our main project space has a
          magnificent soundsystem, with places to sit, listen, relax and dance.
        </p>
        <p className="mt-[1.2em]">
          Out back, our courtyard garden is open on Fridays and Saturdays, <span className="whitespace-nowrap">12pm–10pm</span>, and we
          often have live music or performance on the garden stage.
        </p>
      </>
    ),
  },
  {
    label: "Access",
    alt: "The entrance (placeholder photo)",
    paragraphs: [],
    body: (
      <>
        <p>Everyone is welcome, and our team is always there to support you.</p>
        <p className="mt-[1.2em]">
          We want everyone to feel comfortable here, whatever brings you through the door. If you have any access
          needs or questions before your visit,{" "}
          <EmailLink className="t-link">get in touch</EmailLink>{" "}
          and we’ll help you plan your night.
        </p>
        <p className="mt-[1.2em]">
          Our back rooms, and the garden when it’s open, offer quieter spaces away from the main room if you need a break
          from the sound.
        </p>
      </>
    ),
  },
];
