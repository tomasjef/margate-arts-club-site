-- Is email getting out? Every call the site makes to Amazon SES is noted here (src/lib/email.ts): one row for single emails (confirmations,
-- unsubscribe notes, the hourly test email) and one for the newsletter (templates and bulk sends). failing_since is set at the first failed
-- call and cleared by the next one that works. src/lib/email-health.ts reads it every ten minutes and decides whether an alert is due; the
-- alert itself goes out through Cloudflare (worker.ts), not Amazon, so it still arrives when Amazon is the problem. To look:
--   SELECT * FROM email_health; SELECT * FROM email_alert;
CREATE TABLE email_health (
  channel TEXT PRIMARY KEY, -- 'single' or 'bulk'
  last_try_at TEXT,
  last_ok_at TEXT,
  last_fail_at TEXT,
  last_error TEXT,
  failing_since TEXT
);

-- what the alert address was last told: state 'down' (emails stopped, since down_since) or 'ok' (working again)
CREATE TABLE email_alert (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state TEXT NOT NULL,
  down_since TEXT,
  alerted_at TEXT NOT NULL
);
