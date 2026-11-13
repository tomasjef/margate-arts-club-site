-- Imported groups of people (subscribers.source) that can be switched off as a whole: enabled = 0 and nobody from that group is emailed,
-- nothing is deleted. People who joined on the website (empty source) are always emailed. To switch a group off or on again:
--   UPDATE lists SET enabled = 0 WHERE source = 'outsavvy';   (run with wrangler d1 execute --remote)
CREATE TABLE lists (
  source TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
);
INSERT INTO lists (source, label) VALUES ('outsavvy', 'Contacts from OutSavvy');
