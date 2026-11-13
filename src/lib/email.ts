import { AwsClient } from "aws4fetch";
import { getDb } from "@/lib/db";

// Sends through Amazon SES (the club's own AWS account). Needs these on the Worker, none of them in the code: AWS_ACCESS_KEY_ID and
// AWS_SECRET_ACCESS_KEY (a user that may only send email), AWS_REGION (eu-west-2) and EMAIL_FROM ("Margate Arts Club <news@margatearts.club>").
// Until they are there, nothing is sent and the callers say so.
const config = () => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, EMAIL_FROM } = process.env;
  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !EMAIL_FROM) return null;
  const region = AWS_REGION || "eu-west-2";
  // no Reply-To: replies go to news@, which Cloudflare Email Routing (catch-all for the domain) forwards to the club's Gmail
  return { from: EMAIL_FROM, base: `https://email.${region}.amazonaws.com/v2/email`, client: new AwsClient({ accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, region, service: "ses" }) };
};

export const emailConfigured = () => config() !== null;

export type Channel = "single" | "bulk";

// Every call's outcome goes into the email_health table (migration 0009), for the alert when email stops getting out
// (src/lib/email-health.ts). A failure to note it never gets in the way of the email itself.
export async function noteEmailResult(channel: Channel, error: string | null) {
  try {
    const db = getDb();
    if (!db) return;
    if (!error) {
      await db
        .prepare("INSERT INTO email_health (channel, last_try_at, last_ok_at) VALUES (?1, datetime('now'), datetime('now')) ON CONFLICT(channel) DO UPDATE SET last_try_at = datetime('now'), last_ok_at = datetime('now'), failing_since = NULL")
        .bind(channel)
        .run();
    } else {
      await db
        .prepare(
          "INSERT INTO email_health (channel, last_try_at, last_fail_at, last_error, failing_since) VALUES (?1, datetime('now'), datetime('now'), ?2, datetime('now')) ON CONFLICT(channel) DO UPDATE SET last_try_at = datetime('now'), last_fail_at = datetime('now'), last_error = ?2, failing_since = COALESCE(failing_since, datetime('now'))",
        )
        .bind(channel, error.slice(0, 500))
        .run();
    }
  } catch (e) {
    console.error("could not note the email result", e);
  }
}

async function call(path: string, body: unknown) {
  const c = config();
  if (!c) throw new Error("Email is not set up");
  const channel: Channel = path === "/outbound-emails" ? "single" : "bulk";
  let res: Response;
  try {
    res = await c.client.fetch(`${c.base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch (e) {
    await noteEmailResult(channel, `SES ${path}: no answer (${e instanceof Error ? e.message : String(e)})`);
    throw e;
  }
  // SES errors can quote the recipient (and the Worker logs are kept), so no address is ever left in the message
  if (!res.ok) {
    const error = `SES ${path} ${res.status}: ${(await res.text()).slice(0, 300).replace(/[^\s"'<>,;]+@[^\s"'<>,;]+/g, "[address]")}`;
    await noteEmailResult(channel, error);
    throw new Error(error);
  }
  await noteEmailResult(channel, null);
  return res;
}

// One email to one person (the "confirm your sign-up" message). Without `html` it goes as plain text only.
export async function sendEmail(o: { to: string; subject: string; html?: string; text: string; headers?: Record<string, string> }) {
  const c = config();
  if (!c) return false;
  await call("/outbound-emails", {
    FromEmailAddress: c.from,
    Destination: { ToAddresses: [o.to] },
    Content: {
      Simple: {
        Subject: { Data: o.subject, Charset: "UTF-8" },
        Body: { ...(o.html ? { Html: { Data: o.html, Charset: "UTF-8" } } : {}), Text: { Data: o.text, Charset: "UTF-8" } },
        Headers: Object.entries(o.headers ?? {}).map(([Name, Value]) => ({ Name, Value })),
      },
    },
  });
  return true;
}

// The newsletter is stored in SES once as a template with {{unsubscribeUrl}} in it, then sent to up to 50 people in one call
export async function createTemplate(name: string, subject: string, html: string, text: string) {
  await call("/templates", { TemplateName: name, TemplateContent: { Subject: subject, Html: html, Text: text } });
}

// SES answers 200 even when some (or all) of the people weren't sent to: each one's own result is in BulkEmailEntryResults, in the same order
// as `people`. "SUCCESS" means sent; ACCOUNT_THROTTLED (over 14 a second) and the like mean try again later.
export type BulkResult = { status: string; error?: string };
export async function sendBulk(template: string, people: { email: string; unsubscribeUrl: string; oneClickUrl: string }[]): Promise<BulkResult[]> {
  const c = config();
  if (!c) throw new Error("Email is not set up");
  const res = await call("/outbound-bulk-emails", {
    FromEmailAddress: c.from,
    DefaultContent: { Template: { TemplateName: template, TemplateData: JSON.stringify({ unsubscribeUrl: "" }) } },
    BulkEmailEntries: people.map((p) => ({
      Destination: { ToAddresses: [p.email] },
      ReplacementEmailContent: { ReplacementTemplate: { ReplacementTemplateData: JSON.stringify({ unsubscribeUrl: p.unsubscribeUrl }) } },
      // the one-click unsubscribe that Gmail and Yahoo ask for
      ReplacementHeaders: [
        { Name: "List-Unsubscribe", Value: `<${p.oneClickUrl}>` },
        { Name: "List-Unsubscribe-Post", Value: "List-Unsubscribe=One-Click" },
      ],
    })),
  });
  const body = (await res.json()) as { BulkEmailEntryResults?: { Status?: string; Error?: string }[] };
  return people.map((_, i) => {
    const r = body.BulkEmailEntryResults?.[i];
    return { status: r?.Status ?? "NO_RESULT", ...(r?.Error ? { error: r.Error } : {}) };
  });
}
