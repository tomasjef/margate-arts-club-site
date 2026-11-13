-- Cloudflare's free KV plan allows 1,000 writes a day (it resets at 00:00 UTC). worker.ts counts every write the page cache makes, per day,
-- and marks a day as needing an email when 800 writes are used (warn_due) or when a write is refused (limit_due). The scheduled job sends the
-- emails (src/lib/usage-alerts.ts) and ticks warn_sent / limit_sent. To see how often the limit was hit:
--   SELECT day, writes, failures FROM kv_usage ORDER BY day DESC LIMIT 30;
CREATE TABLE kv_usage (
  day TEXT PRIMARY KEY,
  writes INTEGER NOT NULL DEFAULT 0,
  failures INTEGER NOT NULL DEFAULT 0,
  warn_due INTEGER NOT NULL DEFAULT 0,
  warn_sent INTEGER NOT NULL DEFAULT 0,
  limit_due INTEGER NOT NULL DEFAULT 0,
  limit_sent INTEGER NOT NULL DEFAULT 0
);
