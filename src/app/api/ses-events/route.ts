import { getDb } from "@/lib/db";

// Amazon SES tells us, through an SNS topic, when an email bounced for good or a reader marked it as spam. Either way the person is taken off the
// list at once and never emailed again (subscribers.unsubscribed_reason says which). Only a permanent bounce counts: a full mailbox or a short outage
// is ignored.
//
// Who may call this: the address AWS is given contains a secret (?key=..., the Worker secret SES_EVENTS_SECRET); without it the answer is 401.
// The first message SNS sends is a "SubscriptionConfirmation" with a link to open once; that link is only followed if it is on amazonaws.com.
type Sns = { Type?: string; SubscribeURL?: string; Message?: string; TopicArn?: string };
type Ses = {
  notificationType?: string;
  eventType?: string;
  bounce?: { bounceType?: string; bouncedRecipients?: { emailAddress?: string }[] };
  complaint?: { complainedRecipients?: { emailAddress?: string }[] };
};

export async function POST(req: Request) {
  const secret = process.env.SES_EVENTS_SECRET;
  if (!secret || new URL(req.url).searchParams.get("key") !== secret) return new Response("Not allowed", { status: 401 });

  let sns: Sns;
  try {
    sns = JSON.parse(await req.text());
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!sns.TopicArn?.startsWith("arn:aws:sns:")) return new Response("Bad request", { status: 400 });

  if (sns.Type === "SubscriptionConfirmation") {
    const link = sns.SubscribeURL ? new URL(sns.SubscribeURL) : null;
    if (!link || link.protocol !== "https:" || !/^sns\.[a-z0-9-]+\.amazonaws\.com$/.test(link.hostname)) return new Response("Bad request", { status: 400 });
    await fetch(link);
    return Response.json({ confirmed: true });
  }
  if (sns.Type !== "Notification" || !sns.Message) return Response.json({ ignored: true });

  let msg: Ses;
  try {
    msg = JSON.parse(sns.Message);
  } catch {
    return Response.json({ ignored: true });
  }
  const kind = msg.notificationType ?? msg.eventType;
  let reason: "bounce" | "complaint" | null = null;
  let addresses: (string | undefined)[] = [];
  if (kind === "Bounce" && msg.bounce?.bounceType === "Permanent") {
    reason = "bounce";
    addresses = (msg.bounce.bouncedRecipients ?? []).map((r) => r.emailAddress);
  } else if (kind === "Complaint") {
    reason = "complaint";
    addresses = (msg.complaint?.complainedRecipients ?? []).map((r) => r.emailAddress);
  }
  const db = getDb();
  if (!reason || !db) return Response.json({ ignored: true });

  let n = 0;
  for (const a of addresses) {
    const email = a?.trim().toLowerCase();
    if (!email) continue;
    const res = await db.prepare("UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = datetime('now'), unsubscribed_reason = ? WHERE email = ? AND status != 'unsubscribed'").bind(reason, email).run();
    n += res.meta.changes;
  }
  return Response.json({ reason, unsubscribed: n });
}
