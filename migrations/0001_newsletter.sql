-- The mailing list and a record of each newsletter sent (Cloudflare D1)
CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  weekly INTEGER NOT NULL DEFAULT 0,
  monthly INTEGER NOT NULL DEFAULT 0,
  -- pending: asked to join, not yet confirmed from the email. confirmed: gets the newsletter. unsubscribed: never emailed again.
  status TEXT NOT NULL DEFAULT 'pending',
  -- in the links of that person's emails (confirm, unsubscribe)
  token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  confirmed_at TEXT,
  unsubscribed_at TEXT
);

-- One row for each newsletter sent, so a week or month is never sent twice. A big list is sent over several runs: cursor is the
-- last subscriber handled.
CREATE TABLE sends (
  key TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  subject TEXT NOT NULL,
  template TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  sent INTEGER NOT NULL DEFAULT 0,
  cursor INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'sending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
