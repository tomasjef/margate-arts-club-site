# Margate Arts Club website

Live at [margatearts.club](https://margatearts.club). A venue site for an arts club in Margate: events pulled live from OutSavvy, page copy in Sanity, a mailing list with monthly newsletters sent through Amazon SES, all running on Cloudflare Workers.

**Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, Sanity, Cloudflare Workers (OpenNext), D1, KV, Amazon SES.

_Portfolio snapshot of a client project. Account IDs are replaced with placeholders and API keys are not included, so it will not deploy as is. The original development notes follow._

---


Next.js (App Router) and TypeScript with Tailwind v4, built locally first. Design stage: the pages are
designed, events come live from the OutSavvy API, and copy is still being written. A CMS and hosting are
chosen in the next stage.

- Run: `nvm use && npm run dev` (Node 24). Copy `.env.example` to `.env.local` and add `OUTSAVVY_API_KEY`
  (git-ignored; never commit it).
- Pages: `/` (What's on), `/visit`, `/music` and `/about`
  (the weekly table on its own; not in the menu). `/our-week` and `/live-music` redirect.
- Opening hours live in one place, `src/lib/week.ts` (`hours`); the footer, the Visit page, the weekly table
  and the header status all read from it.
- Design: one type scale (30px, and a middle size of about 20px) with white event cards and hairline boxes;
  tokens and component classes are in `src/app/globals.css`. Design source: Figma file
  Njv9FopMZtrNACWfDueQdU (page "Website"), 1440px desktop frames.
- The look: a pale grey page (`--page-bg: #f6f6f5`) with white boxes, and Visit, Music and About in tan, sage and purple boxes.
- Placeholders still to fill: the two stand-in
  photos.

## Next phase: CMS and hosting (decided 16 Oct 2026)

- **CMS: Sanity** (free plan, hosted studio the client logs into online). It holds the page copy, opening
  hours, the weekly offering table, links and the photos on About, Visit and Music. Events stay on OutSavvy.
- **Images:** photos come from Sanity's image CDN (width and format set in the URL, through a small image
  loader). OutSavvy posters are served as they come. So no Cloudflare image resizing is needed.
- **Hosting: Cloudflare Workers** through the OpenNext adapter (free if the build fits the free plan,
  otherwise Workers Paid, about $5/month). First step: a test deploy to check that Next 16 with
  `cacheComponents` builds and runs on the adapter.
- **Accounts:** the client owns the Cloudflare, Sanity, GitHub and OutSavvy accounts; the developer is added
  as a member. Transfer the repo at launch.
- **Opening hours:** move `hours` in `src/lib/week.ts` into Sanity so the client edits them in one place.
  (Syncing from Google needs a Places API key and place ID; not planned.)
- Watch Sanity's free asset storage and bandwidth limits; ask for sensibly sized uploads.
- **Email:** the domain's DNS is on Cloudflare, and Email Routing (free, catch-all) forwards every
  @margatearts.club address to the existing Gmail (a private mailbox). The site's and the newsletters'
  "Email us" links go to info@margatearts.club (`emailParts` in `src/lib/site.ts`). No hosted mailboxes.
- **Newsletter (later):** the footer sign-up needs a mailing-list service (not Cloudflare). Plan: an
  automated digest of upcoming events from OutSavvy, weekly and monthly. A Cloudflare Worker cron job
  reads the events (as `getEvents()` does), builds the email and creates or sends the campaign through the
  mailing service's API; the sign-up form posts to the site, which adds the address to the service's list.
  Start with campaigns created as drafts for the client to approve before sending. The service must handle
  consent and unsubscribe links (UK GDPR/PECR). Choose the service (MailerLite, Brevo or similar) after
  checking current free limits.

## Newsletter (weekly and monthly emails)

- The email is built from the OutSavvy events by `src/lib/newsletter.ts`; the introduction and footer are edited in Sanity ("Newsletter header and footer").
  Preview it at `/newsletter/weekly` and `/newsletter/monthly` (`?format=text` for plain text, `?date=2026-11-23` for another week or month).
- The mailing list is in Cloudflare D1 (`migrations/0001_newsletter.sql`); sign-up needs a confirmation click (double opt-in), and every email has an
  unsubscribe link and the one-click header.
- A cron trigger (every ten minutes, `worker.ts`) calls `/api/newsletter/send`, which starts the newsletter on Monday 9am (weekly) and on the 1st at 9am
  (monthly) London time and sends it in batches through Amazon SES (`src/lib/email.ts`). Nothing is sent until `NEWSLETTER_SEND_ENABLED` is `true`.
- Still to set up (see the checklist in the chat): the D1 database and its binding `DB` in `wrangler.jsonc`, then `npx wrangler d1 migrations apply
  margate-arts-club-newsletter --remote`, the club's AWS account (SES: domain, production access, a send-only user), and the Worker secrets
  `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `EMAIL_FROM`.
