// A page's address from its name: lower-case letters and numbers with single dashes ("Live Sound" -> "live-sound"). The website has the
// same function (addressOf in src/lib/cms.ts) and uses it to work out where Visit, Music and About are, so the two must stay the same.
export const addressOf = (title: string) =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
