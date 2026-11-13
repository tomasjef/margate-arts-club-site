-- Where each person's consent came from, for the line at the foot of the newsletter. Empty: they joined on the website.
-- 'outsavvy': imported from OutSavvy, having said yes to the club's marketing when they booked.
ALTER TABLE subscribers ADD COLUMN source TEXT;
