import { getDb, siteUrl, type Db } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { liveUrl } from "@/lib/seo";
import { instagramUrl, siteName } from "@/lib/site";

// the signature shows the real address even while the test site is the one sending
const domain = liveUrl.replace("https://", "");
// shown as the handle, "@margateartsclub", and linked to the profile
const instagram = "@" + instagramUrl.replace(/\/$/, "").split("/").pop();
const gray = "color:#777777";
// the grey sign-off: club name, then the website and Instagram as links, one under another
const signatureHtml = `<span style="${gray}">${siteName}<br><a href="${liveUrl}" style="${gray}">${domain}</a><br><a href="${instagramUrl}" style="${gray}">${instagram}</a></span>`;
const signatureText = `${siteName}\n${liveUrl}\n${instagramUrl}`;
// Gmail folds away ("…") lines it has seen in earlier emails from us, the sign-off first, so every paragraph ends in a hidden code of its own
const hidden = () => `<span style="display:none;font-size:0;line-height:0;max-height:0;overflow:hidden;mso-hide:all">${crypto.randomUUID().slice(0, 8)}</span>`;
// The preview line a mail program shows under the subject in the inbox: Apple Mail reads hidden text too, so without this it showed the
// first hidden code ("Hi there,fed6dec5", found 6 Nov 2026). It is the email's own words, without the codes, in a hidden block first in the
// email, then blank characters so nothing after it is pulled into the preview.
const preview = (lines: string[]) =>
  `<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all">${lines.map((p) => p.replace(/<[^>]+>/g, "")).join(" ")}${"&zwnj;&nbsp;".repeat(80)}</div>`;
// The email's paragraphs, then the sign-off with one more line of space above it than between the paragraphs (2em instead of a
// paragraph's 1em; the user's choice, 6 Nov 2026). The text part: one blank line more.
const htmlBody = (lines: string[]) =>
  preview(lines) + lines.map((p) => `<p>${p}${hidden()}</p>`).join("") + `<p style="margin-top:2em">${signatureHtml}${hidden()}</p>`;
const textBody = (lines: string[]) => [...lines, `\n${signatureText}`].join("\n\n");
export const whichEmails = (weekly: number, monthly: number) => (weekly && monthly ? "weekly and monthly emails" : weekly ? "weekly email" : "monthly email");

// The "confirm your email address" message, written like an ordinary email from a person (no styling, no newsletter look), so it reads as a
// note from the club and is less likely to land in a Promotions tab. The HTML is what a mail program writes for a typed email: the reader's own
// font, and the link on words instead of the long address. Mail programs that only show text get the address written out.
// Returns true once it has been sent and recorded on the subscriber.
export async function sendConfirmation(db: Db, s: { id: number; email: string; token: string; weekly: number; monthly: number }) {
  const link = `${siteUrl()}/mailing-list/confirm/${s.token}`;
  const which = whichEmails(s.weekly, s.monthly);
  const after = `Once you have, we'll send you our ${which} with what's on at the club.`;
  const ignore = "If you didn't sign up, just ignore this email and you won't hear from us again.";
  const sent = await sendEmail({
    to: s.email,
    subject: "Please confirm your email",
    html: htmlBody([
      "Hi there,",
      `Thanks for signing up to the ${siteName} mailing list.`,
      `Please <a href="${link}">confirm your email address</a> to finish.`,
      after,
      ignore,
    ]),
    text: textBody([
      "Hi there,",
      `Thanks for signing up to the ${siteName} mailing list. To confirm your email address, please open this link:`,
      link,
      after,
      ignore,
    ]),
  });
  if (sent) await db.prepare("UPDATE subscribers SET confirmation_sent_at = datetime('now') WHERE id = ?").bind(s.id).run();
  return sent;
}

// When someone already on the list signs up again: a note to their address saying so (the page can't say it, or it would tell anyone who is on
// the list), with a link to change to the emails they asked for this time if those are different (the change page, /mailing-list/change).
// Before 6 Nov 2026 nothing was sent, and the page's "check your email" was left with no email.
export async function sendAlreadySignedUp(s: { email: string; token: string; weekly: number; monthly: number }, want: { weekly: number; monthly: number }) {
  const has = whichEmails(s.weekly, s.monthly);
  const wanted = whichEmails(want.weekly, want.monthly);
  const change = wanted !== has ? `${siteUrl()}/mailing-list/change/${s.token}?weekly=${want.weekly}&monthly=${want.monthly}` : null;
  const ignore = "If you didn't sign up, just ignore this email. Nothing has changed.";
  return sendEmail({
    to: s.email,
    subject: "You're already on our mailing list",
    html: htmlBody([
      "Hi there,",
      `Someone, probably you, just signed up to the ${siteName} mailing list with this email address. You're already on it, so there's nothing more to do: you get our ${has}.`,
      ...(change ? [`If you'd rather have our ${wanted}, you can <a href="${change}">change to the ${wanted}</a>.`] : []),
      ignore,
    ]),
    text: textBody([
      "Hi there,",
      `Someone, probably you, just signed up to the ${siteName} mailing list with this email address. You're already on it, so there's nothing more to do: you get our ${has}.`,
      ...(change ? [`If you'd rather have our ${wanted}, open this link to change:`, change] : []),
      ignore,
    ]),
  });
}

// The short note after someone unsubscribes, in the same plain voice as the confirmation. It is sent once, right after they are taken off the list.
export async function sendUnsubscribed(email: string) {
  const link = siteUrl();
  await sendEmail({
    to: email,
    subject: "You have unsubscribed",
    html: htmlBody([
      "Hi there,",
      `You have unsubscribed from the ${siteName} mailing list.`,
      `Changed your mind? You can <a href="${link}">join again</a> any time.`,
    ]),
    text: textBody([
      "Hi there,",
      `You have unsubscribed from the ${siteName} mailing list.`,
      `Changed your mind? You can join again any time: ${link}`,
    ]),
  });
}

// Run by the scheduled job: confirmation emails for sign-ups made while email was not yet set up (or that failed to send)
export async function sendWaitingConfirmations(limit = 10) {
  const db = getDb();
  if (!db || !emailConfigured()) return 0;
  const rows = await db.prepare("SELECT id, email, token, weekly, monthly FROM subscribers WHERE status = 'pending' AND confirmation_sent_at IS NULL ORDER BY id LIMIT ?").bind(limit).all<{ id: number; email: string; token: string; weekly: number; monthly: number }>();
  let n = 0;
  for (const r of rows.results) {
    try {
      if (await sendConfirmation(db, r)) n++;
    } catch (e) {
      console.error("confirmation failed", e);
    }
  }
  return n;
}
