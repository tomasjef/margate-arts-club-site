// Answers "is this the new site?" for the studio (studio/sanity.config.ts): its live preview opens margatearts.club once this site is there,
// and the test address before. Any page may ask.
export function GET() {
  return Response.json({ site: "margate-arts-club" }, { headers: { "access-control-allow-origin": "*", "cache-control": "no-store" } });
}
