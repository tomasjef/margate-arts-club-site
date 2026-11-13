-- The studio's "Newsletter subscribers" page. Every ten minutes src/lib/subscriber-numbers-update.ts works the numbers out from the mailing list
-- and copies them into one Sanity document (numbers.subscribers). This remembers what was copied last, so Sanity is only written when a number has
-- changed, and otherwise once an hour (so the page can show it is up to date).
CREATE TABLE numbers_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  hash TEXT NOT NULL,
  written_at TEXT NOT NULL
);
