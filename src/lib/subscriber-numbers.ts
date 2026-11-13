// The numbers on the studio's "Newsletter subscribers" page, worked out from rows of the mailing list (Cloudflare D1): counts only, no address
// ever leaves the database. Nothing else from the site is imported here, so it can be tried on its own; subscriber-numbers-update.ts reads the
// rows and copies the result into Sanity.

// why someone is off the list: '' = they unsubscribed themselves, 'bounce' = their address stopped working, 'complaint' = they marked an email as spam
export type Reason = "" | "bounce" | "complaint";
export const reasons: Reason[] = ["", "bounce", "complaint"];
type Period = "weekly" | "monthly";

export type Rows = {
  // per group of people ('website' = signed up on the site, else an imported group from the lists table)
  groups: { grp: string; people: number; weekly: number; monthly: number; waiting: number; unsubscribed: number }[];
  lists: { source: string; label: string; enabled: number }[];
  // everyone off the list: when (UTC, as D1 keeps it: "YYYY-MM-DD HH:MM:SS"), why, their group and the lists they had
  left: { at: string; reason: Reason; grp: string; weekly: number; monthly: number }[];
  // website sign-ups confirmed in the last month (UTC)
  joined: { at: string }[];
  // the newsletters sent, newest first (not the ones skipped for having no events)
  sends: { key: string; period: Period; subject: string; total: number; sent: number; status: string; created_at: string }[];
};

type Counts = { unsubscribed: number; bounced: number; spam: number };
export type Numbers = {
  groups: { _key: string; label: string; on: boolean; people: number; weekly: number; monthly: number; waiting: number; unsubscribed: number }[];
  total: { people: number; weekly: number; monthly: number; waiting: number; unsubscribed: number };
  left: { _key: string; reason: Reason; last7: number; last30: number; all: number }[];
  // the last 30 days (London), today first
  days: ({ _key: string; day: string; joined: number } & Counts)[];
  // the last 12 newsletters, newest first; the counts are of the people on that newsletter's list, in the 7 days after it started; `high` says
  // which counts are more than usual (see `usual`), `from` splits them by group
  sends: ({ _key: string; subject: string; period: Period; started: string; status: string; total: number; sent: number; high: (keyof Counts)[]; from: ({ _key: string; label: string } & Counts)[] } & Counts)[];
};

// When a newsletter is marked "more than usual" on the studio page: a share of the people it went to, with a minimum number of people so that a
// small list isn't marked for one or two. Spam reports matter most: Amazon SES reviews an account when they reach 0.1% of the emails sent and may
// pause its sending at 0.5% (for bounces it is 5% and 10%).
export const usual: Record<keyof Counts, { min: number; share: number }> = {
  unsubscribed: { min: 10, share: 0.01 },
  bounced: { min: 5, share: 0.02 },
  spam: { min: 2, share: 0.001 },
};

const DAY = 864e5;
const AFTER = 7 * DAY; // how long after a newsletter its unsubscribes are counted
const utc = (s: string) => Date.parse(s.replace(" ", "T") + "Z");
const londonDay = (t: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(t); // YYYY-MM-DD
const key: Record<Reason, keyof Counts> = { "": "unsubscribed", bounce: "bounced", complaint: "spam" };

function count(rows: Rows["left"]): Counts {
  const c: Counts = { unsubscribed: 0, bounced: 0, spam: 0 };
  for (const r of rows) c[key[r.reason] ?? "unsubscribed"]++;
  return c;
}

// who left in the week after a newsletter started, of the people on its list
const leftAfter = (s: Rows["sends"][number], left: Rows["left"]) =>
  left.filter((l) => l[s.period] === 1 && utc(l.at) >= utc(s.created_at) && utc(l.at) < utc(s.created_at) + AFTER);

export function buildNumbers(rows: Rows, now = new Date()): Numbers {
  const t = now.getTime();
  const by = new Map(rows.groups.map((g) => [g.grp, g]));
  const zero = { people: 0, weekly: 0, monthly: 0, waiting: 0, unsubscribed: 0 };
  // the website's own sign-ups first, then each imported group (also when nobody is left in it)
  const order = [{ source: "website", label: "Signed up on the website", enabled: 1 }, ...rows.lists];
  for (const g of rows.groups) if (!order.some((o) => o.source === g.grp)) order.push({ source: g.grp, label: g.grp, enabled: 1 });
  const groups = order.map((o) => {
    const g = by.get(o.source);
    const n = { people: g?.people ?? 0, weekly: g?.weekly ?? 0, monthly: g?.monthly ?? 0, waiting: g?.waiting ?? 0, unsubscribed: g?.unsubscribed ?? 0 };
    return { _key: o.source, label: o.label, on: !!o.enabled, ...n };
  });
  const total = { ...zero };
  for (const g of groups) for (const k of Object.keys(zero) as (keyof typeof zero)[]) total[k] += g[k];

  const left = reasons.map((reason) => {
    const these = rows.left.filter((l) => l.reason === reason);
    return { _key: reason || "self", reason, last7: these.filter((l) => utc(l.at) >= t - 7 * DAY).length, last30: these.filter((l) => utc(l.at) >= t - 30 * DAY).length, all: these.length };
  });

  // calendar days in London counted back from today (not 24-hour steps, which skip or repeat a day when the clocks change)
  const [y, m, d] = londonDay(t).split("-").map(Number);
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10);
    return {
      _key: day,
      day,
      joined: rows.joined.filter((j) => londonDay(utc(j.at)) === day).length,
      ...count(rows.left.filter((l) => londonDay(utc(l.at)) === day)),
    };
  });

  const labelOf = (grp: string) => groups.find((g) => g._key === grp)?.label ?? grp;
  const sends = rows.sends.slice(0, 12).map((s) => {
    const these = leftAfter(s, rows.left);
    const c = count(these);
    const high = (Object.keys(usual) as (keyof Counts)[]).filter((k) => s.sent > 0 && c[k] >= Math.max(usual[k].min, Math.ceil(usual[k].share * s.sent)));
    const from = [...new Set(these.map((l) => l.grp))].map((g) => ({ _key: g, label: labelOf(g), ...count(these.filter((l) => l.grp === g)) }));
    return { _key: s.key, subject: s.subject, period: s.period, started: new Date(utc(s.created_at)).toISOString(), status: s.status, total: s.total, sent: s.sent, ...c, high, from };
  });
  return { groups, total, left, days, sends };
}
