-- Why someone is unsubscribed: empty = they did it themselves; 'bounce' = their address was refused for good; 'complaint' = they marked an email as
-- spam. Set by /api/ses-events from Amazon SES's notices. To see how often: SELECT unsubscribed_reason, COUNT(*) FROM subscribers GROUP BY 1;
ALTER TABLE subscribers ADD COLUMN unsubscribed_reason TEXT;
