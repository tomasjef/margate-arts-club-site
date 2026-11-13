import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useClient } from "sanity";

// The studio's "Newsletter subscribers" page, read only. The website counts its mailing list every ten minutes (src/lib/subscriber-numbers.ts in
// the site) and keeps the numbers in one private document, numbers.subscribers (a dot in the id: only people logged in here can read it). This
// shows that document and redraws whenever the website writes a new one. No addresses are in it, only counts.
const ID = "numbers.subscribers";

type Counts = { unsubscribed: number; bounced: number; spam: number };
type Numbers = {
  updatedAt: string;
  groups: { _key: string; label: string; on: boolean; people: number; weekly: number; monthly: number; waiting: number; unsubscribed: number }[];
  total: { people: number; weekly: number; monthly: number; waiting: number; unsubscribed: number };
  left: { _key: string; reason: "" | "bounce" | "complaint"; last7: number; last30: number; all: number }[];
  days: ({ _key: string; day: string; joined: number } & Counts)[];
  // `high`: counts the website marks as more than usual (1% unsubscribing, at least 10 people; 2% bouncing, at least 5; 0.1% spam, at least 2)
  sends: ({ _key: string; subject: string; period: "weekly" | "monthly"; started: string; status: string; total: number; sent: number; high?: (keyof Counts)[]; from?: ({ _key: string; label: string } & Counts)[] } & Counts)[];
};
type Send = Numbers["sends"][number];
const kinds: [keyof Counts, string, string][] = [
  ["unsubscribed", "unsubscribed", "unsubscribed"],
  ["bounced", "address bounced", "addresses bounced"],
  ["spam", "marked it as spam", "marked it as spam"],
];
// 0.25%, 0.5%, 1.2%
const pct = (v: number, of: number) => {
  const p = (v / of) * 100;
  return `${Number(p < 1 ? p.toFixed(2) : p.toFixed(1))}%`;
};

const reasonLabel = { "": "Unsubscribed themselves", bounce: "Email address stopped working (bounced)", complaint: "Marked an email as spam" };
const n = (v: number) => v.toLocaleString("en-GB");
const london = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", ...o });
const londonDay = (t: number | Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(t);

const page: CSSProperties = { padding: "1.5rem 1.25rem 3rem", maxWidth: 900, fontSize: 15, lineHeight: 1.45 };
const heading: CSSProperties = { fontSize: 17, fontWeight: 600, margin: "2.25rem 0 0.6rem" };
const muted: CSSProperties = { color: "var(--card-muted-fg-color)" };
const note: CSSProperties = { ...muted, fontSize: 13, margin: "0.6rem 0 0" };
const cell: CSSProperties = { padding: "0.45rem 0 0.45rem 1.25rem", borderBottom: "1px solid var(--card-border-color)", textAlign: "right", whiteSpace: "nowrap", verticalAlign: "top" };
const first: CSSProperties = { ...cell, paddingLeft: 0, textAlign: "left", whiteSpace: "normal" };
// a dash for nothing, so the numbers stand out
const z = (v: number) => (v ? n(v) : <span style={muted}>–</span>);

function Table({ head, rows, foot }: { head: string[]; rows: ReactNode[][]; foot?: ReactNode[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontVariantNumeric: "tabular-nums" }}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={i} style={{ ...(i ? cell : first), ...muted, fontWeight: 500, fontSize: 13 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={j ? cell : first}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {foot && (
          <tfoot>
            <tr>
              {foot.map((c, j) => (
                <td key={j} style={{ ...(j ? cell : first), fontWeight: 600, borderBottom: "none" }}>
                  {c}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function updatedLine(at: string) {
  const t = new Date(at);
  const time = london({ hour: "2-digit", minute: "2-digit" }).format(t);
  const day = londonDay(t) === londonDay(new Date()) ? "today" : london({ weekday: "short", day: "numeric", month: "short" }).format(t);
  return `Updated ${day} at ${time}.`;
}

function dayLabel(day: string) {
  const today = londonDay(new Date());
  const yesterday = new Date(Date.parse(today + "T12:00:00Z") - 864e5).toISOString().slice(0, 10);
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(Date.parse(day + "T12:00:00Z"));
}

function sentTo(s: Send) {
  if (s.status === "sending") return `${n(s.sent)} of ${n(s.total)} so far`;
  if (s.status === "stopped") return `${n(s.sent)} (stopped)`;
  return n(s.sent);
}

const sendDate = (s: Send) => london({ weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date(s.started));

// a count in the Newsletters sent table: the number, its share of the people the newsletter went to, and the mark when it's more than usual
function SendCount({ s, k }: { s: Send; k: keyof Counts }) {
  const v = s[k];
  if (!v) return z(0);
  const high = s.high?.includes(k);
  return (
    <span style={high ? { fontWeight: 600 } : undefined}>
      {n(v)} <span style={high ? undefined : muted}>({pct(v, s.sent)})</span>
      {high && <div style={{ fontSize: 12 }}>more than usual</div>}
    </span>
  );
}

// At the top of the page, for a newsletter in the last 14 days that brought more than usual
function HighNote({ s }: { s: Send }) {
  return (
    <div style={{ border: "1px solid var(--card-border-color)", borderRadius: 6, padding: "0.9rem 1rem", margin: "1.25rem 0 0" }}>
      <p style={{ fontWeight: 600, margin: 0 }}>
        More than usual after “{s.subject}” ({sendDate(s)})
      </p>
      <p style={{ margin: "0.5rem 0 0" }}>Of the {n(s.sent)} people it went to, in the week after it:</p>
      <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem" }}>
        {kinds.map(([k, one, many]) => (
          <li key={k} style={s.high?.includes(k) ? { fontWeight: 600 } : undefined}>
            {n(s[k])} {s[k] === 1 ? one : many} ({pct(s[k], s.sent)}){s.high?.includes(k) ? ", more than usual" : ""}
          </li>
        ))}
      </ul>
      {!!s.from?.length && (
        <p style={{ margin: "0.5rem 0 0" }}>
          Where they came from: {s.from.map((g) => `${g.label} ${n(g.unsubscribed + g.bounced + g.spam)}`).join(", ")}.
        </p>
      )}
      <p style={{ ...note, marginTop: "0.6rem" }}>
        Everyone counted here is already off the list. Spam reports matter most: Amazon, which sends the emails, reviews an account when they reach 0.1%
        of the emails sent and may pause its sending at 0.5% (for bounced addresses it is 5% and 10%). To hold the next newsletter, turn off its switch
        under Newsletter; an imported group of contacts can be switched off on its own by your web developer.
      </p>
    </div>
  );
}

export function SubscriberNumbers() {
  const client = useClient({ apiVersion: "2025-10-01" });
  // undefined while loading, null when the website hasn't written any numbers yet
  const [doc, setDoc] = useState<Numbers | null | undefined>(undefined);

  useEffect(() => {
    let live = true;
    client.getDocument(ID).then(
      (d) => live && setDoc((d as unknown as Numbers) ?? null),
      () => live && setDoc(null),
    );
    const sub = client.listen("*[_id == $id]", { id: ID }, { includeResult: true }).subscribe((e) => {
      if (e.type === "mutation" && e.result) setDoc(e.result as unknown as Numbers);
    });
    return () => {
      live = false;
      sub.unsubscribe();
    };
  }, [client]);

  if (doc === undefined) return <div style={page}>Loading…</div>;
  if (doc === null)
    return (
      <div style={page}>
        <p style={{ margin: 0 }}>No numbers yet. The website adds them here within ten minutes of being set up for it.</p>
      </div>
    );

  const stale = Date.now() - Date.parse(doc.updatedAt) > 2 * 36e5;
  const active = doc.days.filter((d) => d.joined || d.unsubscribed || d.bounced || d.spam);
  const total = doc.left.reduce((t, r) => ({ last7: t.last7 + r.last7, last30: t.last30 + r.last30, all: t.all + r.all }), { last7: 0, last30: 0, all: 0 });

  return (
    <div style={page}>
      <p style={{ ...muted, margin: 0 }}>
        Who gets the newsletter. The website counts its mailing list every ten minutes and this page updates by itself. {updatedLine(doc.updatedAt)}
      </p>
      {stale && (
        <p style={{ fontWeight: 600, margin: "0.75rem 0 0" }}>
          These numbers are more than two hours old, so something on the website may have stopped. Please let your web developer know.
        </p>
      )}
      {doc.sends
        .filter((s) => s.high?.length && Date.now() - Date.parse(s.started) < 14 * 864e5)
        .map((s) => (
          <HighNote key={s._key} s={s} />
        ))}

      <h2 style={heading}>Getting the newsletter</h2>
      <Table
        head={["", "Get it", "Weekly", "Monthly", "Waiting to confirm", "Unsubscribed"]}
        rows={doc.groups.map((g) => [
          g.on ? g.label : (
            <>
              {g.label} <span style={muted}>(switched off: not emailed)</span>
            </>
          ),
          n(g.people),
          z(g.weekly),
          z(g.monthly),
          z(g.waiting),
          z(g.unsubscribed),
        ])}
        foot={["Total", n(doc.total.people), n(doc.total.weekly), n(doc.total.monthly), n(doc.total.waiting), n(doc.total.unsubscribed)]}
      />
      <p style={note}>
        Some people get both, so Weekly and Monthly can add up to more than Get it. Waiting to confirm: signed up on the website but haven't yet clicked the
        link in the email we sent them. Unsubscribed includes addresses that bounced and people who reported spam.
      </p>

      <h2 style={heading}>Unsubscribes</h2>
      <Table
        head={["", "Last 7 days", "Last 30 days", "In total"]}
        rows={doc.left.map((r) => [reasonLabel[r.reason] ?? r.reason, z(r.last7), z(r.last30), z(r.all)])}
        foot={["Total", n(total.last7), n(total.last30), n(total.all)]}
      />
      <p style={note}>Addresses that bounce and people who report spam come off the list straight away, so they are never emailed again.</p>

      <h2 style={heading}>Newsletters sent</h2>
      {doc.sends.length ? (
        <>
          <Table
            head={["", "Sent to", "Unsubscribed", "Bounced", "Marked as spam"]}
            rows={doc.sends.map((s) => [
              <>
                {s.subject}
                <br />
                <span style={{ ...muted, fontSize: 13 }}>
                  {s.period === "weekly" ? "Weekly" : "Monthly"}, {sendDate(s)}
                </span>
              </>,
              sentTo(s),
              <SendCount s={s} k="unsubscribed" />,
              <SendCount s={s} k="bounced" />,
              <SendCount s={s} k="spam" />,
            ])}
          />
          <p style={note}>
            Counted in the 7 days after each newsletter, among the people it went to. Marked “more than usual” when 1% of them unsubscribe (at least 10
            people), 2% of the addresses bounce (at least 5) or 0.1% mark it as spam (at least 2).
          </p>
        </>
      ) : (
        <p style={{ margin: 0 }}>No newsletter has been sent yet.</p>
      )}

      {/* only the days when something happened, so the list stays short */}
      <h2 style={heading}>Recent activity</h2>
      {active.length ? (
        <>
          <p style={{ ...muted, margin: "0 0 0.6rem" }}>Days in the last 30 when someone joined or left the list.</p>
          <Table
            head={["", "Joined on the website", "Unsubscribed", "Bounced", "Marked as spam"]}
            rows={active.map((d) => [dayLabel(d.day), z(d.joined), z(d.unsubscribed), z(d.bounced), z(d.spam)])}
          />
        </>
      ) : (
        <p style={{ margin: 0 }}>Nobody joined or left the list in the last 30 days.</p>
      )}
    </div>
  );
}
