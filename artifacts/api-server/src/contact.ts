import type { Express } from "express";
import { SendContactRequestBody } from "@workspace/api-zod";
import { rateLimit } from "./middleware/security";
import { previewRuntime } from "./runtime/config";

export class ContactUnavailable extends Error {}
export interface MailConfig { apiKey: string; from: string; to: string }

function mailConfig(): MailConfig {
  const to = previewRuntime() ? process.env.PREVIEW_CONTACT_EMAIL_TO : process.env.CONTACT_EMAIL_TO;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_EMAIL_FROM;
  if (process.env.CONTACT_EMAIL_ENABLED !== "true" || !apiKey || !from || !to) {
    throw new ContactUnavailable("Email service not enabled/configured.");
  }
  // Restrict sender/recipient to one valid plain address; never trust browser input.
  const address = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
  if (!address.test(from) || !address.test(to)) throw new ContactUnavailable("Invalid mail configuration.");
  return { apiKey, from, to };
}

export function parseContact(input: unknown) {
  const parsed = SendContactRequestBody.strict().safeParse(input);
  if (!parsed.success) return null;
  const data = parsed.data;
  if (!data.name.trim() || data.name.trim().length < 2 || data.message.trim().length < 2 || /[\r\n]/.test(data.email)) return null;
  if (data.date) {
    const date = new Date(`${data.date}T12:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date) return null;
  }
  return data;
}

export async function deliverContact(
  data: NonNullable<ReturnType<typeof parseContact>>,
  config: MailConfig,
  fetcher: typeof fetch = fetch,
) {
  const text = [
    "Nouvelle demande de groupe / événement — Golf SIM",
    "Cette demande n'est PAS une réservation confirmée.",
    `Nom : ${data.name.trim()}`, `Courriel : ${data.email}`,
    `Téléphone : ${data.phone?.trim() || "Non fourni"}`,
    `Date souhaitée : ${data.date || "À discuter"}`, `Joueurs : ${data.players}`,
    "", "Notes :", data.message.trim(),
  ].join("\n");
  let response: Response;
  try {
    response = await fetcher("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `gsim-contact/${data.requestId}`,
      },
      body: JSON.stringify({
        from: `Golf SIM <${config.from}>`, to: [config.to],
        reply_to: data.email, subject: "Demande de groupe — Golf SIM", text,
      }),
      signal: AbortSignal.timeout(12000),
    });
  } catch { throw new ContactUnavailable("Mail provider unavailable."); }
  if (!response.ok) {
    // Status is safe to log; never log the email body or provider response.
    console.warn("[Contact] Provider rejected request", { status: response.status });
    throw new ContactUnavailable("Mail provider rejected the request.");
  }
  const result = await response.json() as { id?: string };
  if (!result.id || typeof result.id !== "string") throw new ContactUnavailable("No provider acceptance ID.");
  return result.id;
}

export function registerContact(app: Express) {
  const limit = rateLimit({ scope: "contact-email", windowMs: 15 * 60 * 1000, maxRequests: 4 });
  app.post("/api/contact", limit, async (req, res) => {
    let data: ReturnType<typeof parseContact>;
    try { data = parseContact(req.body); } catch { data = null; }
    if (!data) return res.status(400).json({ ok: false, message: "Vérifiez les champs du formulaire." });
    try {
      const id = await deliverContact(data, mailConfig());
      return res.status(202).json({
        ok: true, id, message: "Demande transmise à notre équipe. Il ne s'agit pas d'une réservation confirmée.",
      });
    } catch {
      return res.status(503).json({
        ok: false, message: "La demande n'a pas pu être confirmée. Réessayez sans modifier le formulaire, ou téléphonez au (450) 561-3815.",
      });
    }
  });
}
