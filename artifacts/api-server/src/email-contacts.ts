import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { emailContacts, emailConsentEvents, type EmailContact } from "@workspace/db/schema";
import { publicOrigin } from "./runtime/config";

const CONSENT_EVIDENCE = "Case promotionnelle facultative cochée sur la réservation publique (texte v1)";

export function recordContact(tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  booking: { id: string; name: string; email: string }, source: "site" | "personnel",
  granted: boolean) {
  const email = booking.email.trim().toLowerCase();
  if (!email) return Promise.resolve();
  const now = new Date();
  return (async () => {
    await tx.insert(emailContacts).values({
      email, name: booking.name, source, marketingConsent: granted,
      consentAt: granted ? now : null, consentEvidence: granted ? `${CONSENT_EVIDENCE} | réservation ${booking.id}` : null,
    }).onConflictDoUpdate({
      target: emailContacts.email,
      set: {
        name: booking.name, source,
        // A booking without checked consent does not revoke a previous grant.
        // A new explicit grant after withdrawal creates a new, separately evidenced grant.
        marketingConsent: granted ? true : sql`${emailContacts.marketingConsent}`,
        consentAt: granted ? now : sql`${emailContacts.consentAt}`,
        withdrawnAt: granted ? null : sql`${emailContacts.withdrawnAt}`,
        consentEvidence: granted ? `${CONSENT_EVIDENCE} | réservation ${booking.id}` : sql`${emailContacts.consentEvidence}`,
      },
    });
    if (granted) await tx.insert(emailConsentEvents).values({
      id: randomUUID(), email, action: "granted", source,
      evidence: `${CONSENT_EVIDENCE} | réservation ${booking.id}`,
    });
  })();
}

export async function listContacts(): Promise<EmailContact[]> {
  return db.select().from(emailContacts).orderBy(emailContacts.email);
}

function sign(payload: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("Signing secret not configured.");
  return createHmac("sha256", secret).update(`marketing-unsubscribe:v1:${payload}`).digest("base64url");
}

export function unsubscribeLink(contact: EmailContact): string | null {
  if (!contact.marketingConsent || !contact.consentAt || contact.withdrawnAt) return null;
  const payload = Buffer.from(JSON.stringify([contact.email, contact.consentAt.toISOString()])).toString("base64url");
  const origin = publicOrigin();
  if (!origin) throw new Error("Public origin not configured for withdrawal links.");
  return `${origin}/desinscription#token=${payload}.${sign(payload)}`;
}

export async function contactUnsubscribeLink(email: string) {
  const [contact] = await db.select().from(emailContacts).where(eq(emailContacts.email, email.trim().toLowerCase()));
  return contact ? unsubscribeLink(contact) : null;
}

export async function withdrawConsent(token: string): Promise<boolean> {
  const [payload, mac, extra] = token.split(".");
  if (!payload || !mac || extra || payload.length > 600) return false;
  const expected = Buffer.from(sign(payload)), provided = Buffer.from(mac);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return false;
  let email: string, timestamp: string;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Array.isArray(parsed) || parsed.length !== 2 ||
        typeof parsed[0] !== "string" || typeof parsed[1] !== "string" ||
        parsed[0].length > 254 || !/^\d{4}-\d{2}-\d{2}T/.test(parsed[1])) return false;
    [email, timestamp] = parsed;
  } catch { return false; }
  return withdrawContact(email, `Lien signé du consentement du ${timestamp}`, "lien de désinscription", timestamp);
}

/** The same row lock protects direct staff withdrawals and signed links. */
export async function withdrawContact(email: string, evidence: string, source = "personnel", timestamp?: string): Promise<boolean> {
  email = email.trim().toLowerCase();
  return db.transaction(async tx => {
    const [contact] = await tx.select().from(emailContacts).where(eq(emailContacts.email, email)).for("update");
    if (!contact || (timestamp && (!contact.consentAt || contact.consentAt.toISOString() !== timestamp))) return false;
    if (!contact.withdrawnAt) {
      const at = new Date();
      await tx.update(emailContacts).set({ marketingConsent: false, withdrawnAt: at })
        .where(eq(emailContacts.email, email));
      await tx.insert(emailConsentEvents).values({
        id: randomUUID(), email, action: "withdrawn", source, evidence,
      });
    }
    return true;
  });
}

export function csvContacts(contacts: EmailContact[], marketingOnly: boolean) {
  const cell = (value: string) => {
    const safe = /^[\s]*[=+\-@\t\r\n]/u.test(value) ? `'${value}` : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const rows = contacts.filter(c => !marketingOnly || (c.marketingConsent && c.consentAt && !c.withdrawnAt));
  const heading = ["Courriel", "Nom", "Source", "Consentement marketing", "Date du consentement", "Date de retrait", "Preuve", "Lien de désinscription"];
  return "\uFEFF" + [heading, ...rows.map(c => [
    c.email, c.name, c.source, c.marketingConsent && !c.withdrawnAt ? "Oui" : "Non",
    c.consentAt?.toISOString() || "", c.withdrawnAt?.toISOString() || "", c.consentEvidence || "",
    marketingOnly ? unsubscribeLink(c) || "" : "",
  ])].map(row => row.map(cell).join(",")).join("\r\n") + "\r\n";
}
