export const siteName = "Margate Arts Club";
// The legal entity (Companies House 10143485): shown in the footer and used in the privacy policy
export const companyName = "Margate Arts Club CIC";
export const companyNumber = "10143485";
export const registeredOffice = "276 Northdown Road, Margate, Kent, CT9 2PT";
export const address = "276 Northdown Road, Margate CT9 2PT";
// The club's email address, kept in two parts and joined only when someone presses an email link (see EmailLink), so it is
// never written out in the pages. info@ (the user's choice, 6 Nov 2026) reaches the club's Gmail through
// Cloudflare Email Routing (catch-all for the domain)
export const emailParts = ["info", "margatearts.club"] as const;
export const instagramUrl = "https://www.instagram.com/margateartsclub/";
// A link the club typed in full to one of the site's own pages ("https://new.margatearts.club/privacy") as a path on this site ("/privacy"),
// so it keeps working when the site moves from new.margatearts.club to margatearts.club. Any other link comes back as it was.
export const ownPath = (href: string) => {
  const m = href.match(/^https?:\/\/(?:www\.|new\.)?margatearts\.club(\/[^?#]*)?([?#].*)?$/i);
  return m ? `${m[1] || "/"}${m[2] ?? ""}` : href;
};
// The club's other branches, linked from the About page
export const radioUrl = "https://www.mixcloud.com/artsclubradio/";
export const salonUrl = "https://salonmargate.com/";
// The year the site launched: what the copyright line shows until the browser works out the current year
export const launchYear = 2026;

// The web credit in the footer (Public Identity)
export const creditUrl = "https://publicidentity.studio";

export const nav = [
  { label: "What’s On", href: "/" },
  { label: "Visit", href: "/visit" },
  { label: "Music", href: "/music" },
  { label: "About", href: "/about" },
];

// The menu behind the burger lists the same pages (then Contact and Instagram)
export const menu = nav;

// Every page's name, for the title in the middle of the header (Newsletter has one but is not in the menu)
export const pageTitles = [...nav, { label: "Newsletter", href: "/newsletter" }];

// Where the address links, on every device, in the site and the newsletter: the link the club put on the address in the studio (Find us), or
// without one Google Maps (a search by name and address, so the listing comes up)
export const mapsUrlFor = (info: { address1: string; address2: string; mapsUrl?: string }) =>
  info.mapsUrl || "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(`Margate Arts Club, ${info.address1}, ${info.address2}`);

// the same, for the fixed address (before the site settings are read)
export const mapsUrl =
  "https://www.google.com/maps/search/?api=1&query=" +
  encodeURIComponent("Margate Arts Club, 276 Northdown Road, Margate CT9 2PT");
