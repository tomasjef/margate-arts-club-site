import { getDb } from "@/lib/db";

// New OutSavvy buyers who said yes to the club's marketing join the mailing list by themselves, as the October 2026 import did by hand
// (scripts/import-contacts.py): confirmed, monthly only (imported groups never get the weekly), source 'outsavvy', consent date = the date
// OutSavvy has for them. Anyone already in the subscribers table, whatever their status, is left as they are: someone who unsubscribed,
// bounced or reported spam is never added back, and a website sign-up keeps its own choices.
//
// OutSavvy's GET /customers/ lists every customer the club has had (3,809 in Nov 2026), oldest first, each with can_email. Called every
// 20 minutes (worker.ts rings every 10, every other one is skipped) it reads one page of 200: by turns the last page, where new buyers
// land, and the next page of a round through the whole list, which finds the odd older customer who said yes on a later booking. So a
// new buyer is on the list within about 40 minutes and the whole list is looked through about every 13 hours (20 pages). Each run makes
// two OutSavvy calls (a one-row call for the count, then the page): about 144 a day of the 5,000 OutSavvy allows, the rest being left
// for the events. One database query a run.
const API = "https://api.outsavvy.com/v1";
const PAGE = 200;
const SLOT_MS = 10 * 60 * 1000;

type Customer = { id: number; organiser_id: number; customer_email: string | null; can_email: boolean; date_created: string };
type Page = { list: Customer[]; total_items: number; total_pages: number; page_number: number };

async function customers(key: string, page: number, size: number): Promise<Page> {
  const res = await fetch(`${API}/customers/?page_number=${page}&page_size=${size}`, { headers: { Authorization: `Partner ${key}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`OutSavvy customers ${res.status}`);
  return (await res.json()) as Page;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// `page` picks one page by hand (the route's ?page=, for a full check); `dryRun` counts who would be added without adding them
export async function syncOutSavvyCustomers(o: { now?: Date; page?: number; dryRun?: boolean } = {}) {
  const key = process.env.OUTSAVVY_API_KEY;
  const db = getDb();
  if (!key || !db) return { ok: false, reason: !key ? "no OutSavvy key" : "no database" };
  const slot = Math.floor((o.now ?? new Date()).getTime() / SLOT_MS);
  if (!o.page && slot % 2 === 1) return { ok: true, skipped: "runs every 20 minutes" };

  const pages = Math.max(1, Math.ceil((await customers(key, 1, 1)).total_items / PAGE));
  const turn = Math.floor(slot / 2);
  const page = o.page ?? (turn % 2 === 0 ? pages : (Math.floor(turn / 2) % pages) + 1);
  const { list } = await customers(key, page, PAGE);

  // one row per address, the earliest date it has (OutSavvy can hold the same address twice)
  const yes = new Map<string, string>();
  for (const c of list) {
    const email = (c.customer_email ?? "").trim().toLowerCase();
    if (!c.can_email || !EMAIL.test(email)) continue;
    const at = c.date_created.slice(0, 19).replace("T", " ");
    if (!yes.has(email) || at < yes.get(email)!) yes.set(email, at);
  }
  const people = JSON.stringify([...yes].map(([email, at]) => ({ email, at })));
  const from = "FROM json_each(?1) WHERE json_extract(value, '$.email') NOT IN (SELECT email FROM subscribers)";

  if (o.dryRun) {
    const n = await db.prepare(`SELECT COUNT(*) AS n ${from}`).bind(people).first<{ n: number }>();
    return { ok: true, page, pages, customers: list.length, saidYes: yes.size, wouldAdd: n?.n ?? 0 };
  }
  // INSERT OR IGNORE as well, in case the same address joins on the website at the same moment
  const res = await db
    .prepare(
      `INSERT OR IGNORE INTO subscribers (email, weekly, monthly, status, token, consent_at, confirmed_at, confirmation_sent_at, source)
       SELECT json_extract(value, '$.email'), 0, 1, 'confirmed', lower(hex(randomblob(32))), json_extract(value, '$.at'), json_extract(value, '$.at'), json_extract(value, '$.at'), 'outsavvy' ${from}`,
    )
    .bind(people)
    .run();
  const added = res.meta.changes ?? 0;
  if (added) console.log(`OutSavvy: ${added} new ${added === 1 ? "person" : "people"} added to the mailing list (page ${page} of ${pages})`);
  return { ok: true, page, pages, customers: list.length, saidYes: yes.size, added };
}
