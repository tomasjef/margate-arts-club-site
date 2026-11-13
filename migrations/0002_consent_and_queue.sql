-- When someone asked to join (their consent), and when their confirmation email went out. The sign-up is saved even before email is set up;
-- the scheduled job sends the confirmation to anyone still waiting (confirmation_sent_at empty) as soon as it is.
ALTER TABLE subscribers ADD COLUMN consent_at TEXT;
ALTER TABLE subscribers ADD COLUMN confirmation_sent_at TEXT;
UPDATE subscribers SET consent_at = created_at, confirmation_sent_at = created_at;
