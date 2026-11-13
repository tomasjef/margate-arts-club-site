import type { Row } from "@/components/ImageTextPage";
import type { Event } from "@/lib/events";
import { hosted, regularNights } from "@/lib/about";
import { regularHref } from "@/lib/week";

// The Music page as boxes: how the club sounds, what is on its stage, its nights and who has played.
// The regular nights and Margate Electronics link to their OutSavvy listing when one is on sale, otherwise
// to What's On. Both lists run A to Z (the columns read down the first, then the second).
const alphabetical = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }));

const escape = (name: string) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const musicBoxes = (events: Event[]): Row[] => [
  {
    label: "Our sound",
    paragraphs: [
      "Sound is at the heart of what we do. We believe in conscious partying: being respectful to each other and immersing ourselves in sound. Keep conversations to the back rooms, or the garden when it’s open.",
      "We draw inspiration from listening bars, audiophile parties and DIY collectives, and from the creativity and music of spaces such as Passing Clouds, Total Refreshment Centre, Plastic People and David Mancuso’s Loft. We look to the past while moving forward in an intersectional way, supporting multiple disciplines and communities.",
    ],
  },
  {
    label: "Our stage",
    paragraphs: [],
    body: (
      <>
        <p>
          We believe everyone should have access to a space where they can express their ideas and share their
          emotions. Live music is our beating heart: bands and solo artists, experimental, folk, afrobeat, electronic,
          jazz and spoken word. We also showcase performance, theatre and dance, and host gatherings, art shows,
          crafts, education and parties.
        </p>
        <p className="mt-[1.2em]">
          Our resident night,{" "}
          <a href="https://margate-electronics.org" target="_blank" rel="noopener noreferrer" className="t-link">
            Margate Electronics
          </a>
          , champions experimental electronic music, from modular and hardware sets to live audio-visual performance, and supports a passionate local community.
        </p>
      </>
    ),
  },
  {
    label: "Our nights",
    paragraphs: [],
    body: (
      <>
        <p>
          Our regular club nights put record selecting at their heart, crafting a story and a journey. They’re often
          experimental, reflecting many years of collecting, research and dedication. Come with an open mind and be
          prepared to hear something new.
        </p>
        <ul className="mt-[1.2em] md:columns-2 gap-x-(--pad)">
          {alphabetical(regularNights).map((name) => (
            <li key={name} className="break-inside-avoid">
              <a href={regularHref(events, escape(name))} className="t-link">
                {name}
              </a>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    label: "Our guests",
    paragraphs: [],
    body: (
      <>
        <ul className="md:columns-2 gap-x-(--pad)">
          {alphabetical(hosted).map((name) => (
            <li key={name} className="break-inside-avoid">
              {name}
            </li>
          ))}
        </ul>
        <p className="mt-[0.6em] text-muted-light">…to name just a few.</p>
      </>
    ),
  },
];
