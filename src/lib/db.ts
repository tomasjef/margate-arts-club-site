import { getCloudflareContext } from "@opennextjs/cloudflare";

// The mailing list lives in Cloudflare D1 (binding DB in wrangler.jsonc). A small slice of D1's API is all that is used.
export type Db = {
  prepare(sql: string): Stmt;
  batch(statements: Stmt[]): Promise<unknown[]>;
};
type Stmt = {
  bind(...values: unknown[]): Stmt;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
};

// null when there is no database yet (before it is created, or in the local preview)
export function getDb(): Db | null {
  try {
    return ((getCloudflareContext().env as unknown as { DB?: Db }).DB) ?? null;
  } catch {
    return null;
  }
}

export type Subscriber = { id: number; email: string; weekly: number; monthly: number; status: string; token: string };

// 32 random bytes as hex: the secret part of a confirm or unsubscribe link
export const newToken = () => [...crypto.getRandomValues(new Uint8Array(32))].map((b) => b.toString(16).padStart(2, "0")).join("");

// the site's address in links inside emails (SITE_URL in wrangler.jsonc)
export const siteUrl = () => (process.env.SITE_URL || "https://margatearts.club").replace(/\/$/, "");
