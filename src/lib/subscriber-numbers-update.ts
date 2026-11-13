import { getDb } from "@/lib/db";
import { buildNumbers, type Rows } from "@/lib/subscriber-numbers";

// Runs every ten minutes (worker.ts → /api/newsletter/numbers) and copies the mailing list's numbers into Sanity, for the studio's "Newsletter
// subscribers" page: one document, numbers.subscribers, written only when a number changed or an hour has passed (numbers_state remembers). Its id
// has a dot in it, which keeps it private: the dataset is public to read, but documents in a path ("numbers.", like "drafts.") are only shown to
// people logged in to the studio and to tokens. Needs SANITY_NUMBERS_TOKEN on the Worker (an Editor token); without it nothing is written.
const DOC_ID = "numbers.subscribers";
const MUTATE = "https://ok5py3p6.api.sanity.io/v2025-10-01/data/mutate/production";
const HOUR = 36e5;

const group = "COALESCE(NULLIF(source, ''), 'website')";

async function readRows(): Promise<Rows | null> {
  const db = getDb();
  if (!db) return null;
  const [groups, lists, left, joined, sends] = await Promise.all([
    db
      .prepare(`SELECT ${group} AS grp, SUM(status = 'confirmed') AS people, SUM(status = 'confirmed' AND weekly = 1) AS weekly, SUM(status = 'confirmed' AND monthly = 1) AS monthly, SUM(status = 'pending') AS waiting, SUM(status = 'unsubscribed') AS unsubscribed FROM subscribers GROUP BY 1`)
      .all<Rows["groups"][number]>(),
    db.prepare("SELECT source, label, enabled FROM lists ORDER BY rowid").all<Rows["lists"][number]>(),
    db
      .prepare(`SELECT unsubscribed_at AS at, COALESCE(unsubscribed_reason, '') AS reason, ${group} AS grp, weekly, monthly FROM subscribers WHERE status = 'unsubscribed' AND unsubscribed_at IS NOT NULL`)
      .all<Rows["left"][number]>(),
    db.prepare("SELECT confirmed_at AS at FROM subscribers WHERE (source IS NULL OR source = '') AND confirmed_at >= datetime('now', '-32 days')").all<Rows["joined"][number]>(),
    db.prepare("SELECT key, period, subject, total, sent, status, created_at FROM sends WHERE template != '' ORDER BY created_at DESC LIMIT 12").all<Rows["sends"][number]>(),
  ]);
  return { groups: groups.results, lists: lists.results, left: left.results, joined: joined.results, sends: sends.results };
}

async function sha256(text: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function updateSubscriberNumbers(now = new Date()) {
  const db = getDb();
  const rows = await readRows();
  if (!db || !rows) return { ok: false, reason: "no database" };
  const token = process.env.SANITY_NUMBERS_TOKEN;
  if (!token) return { ok: false, reason: "no SANITY_NUMBERS_TOKEN" };

  const numbers = buildNumbers(rows, now);
  const hash = await sha256(JSON.stringify(numbers));
  const last = await db.prepare("SELECT hash, written_at FROM numbers_state WHERE id = 1").first<{ hash: string; written_at: string }>();
  if (last && last.hash === hash && now.getTime() - Date.parse(last.written_at) < HOUR) return { ok: true, written: false };

  const doc = { _id: DOC_ID, _type: "subscriberNumbers", updatedAt: now.toISOString(), ...numbers };
  const res = await fetch(MUTATE, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ mutations: [{ createOrReplace: doc }] }),
  });
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${(await res.text()).slice(0, 300)}`);
  await db
    .prepare("INSERT INTO numbers_state (id, hash, written_at) VALUES (1, ?1, ?2) ON CONFLICT(id) DO UPDATE SET hash = ?1, written_at = ?2")
    .bind(hash, now.toISOString())
    .run();
  return { ok: true, written: true };
}
