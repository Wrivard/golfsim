import { createHash } from "node:crypto";
import type { Booking } from "@workspace/db/schema";
import { brandedEmail } from "./email-brand";
import { mailConfig, type MailConfig } from "./contact";
import { previewRuntime } from "./runtime/config";
import { formatOperatingTime } from "@workspace/booking-domain";

type ConfirmedBooking = Pick<Booking, "id" | "name" | "email" | "phone" | "date" | "time" | "duration" | "bayType" | "players" | "notes">;
export function bookingTemplate(bookings: ConfirmedBooking[], audience: "owner" | "customer", unsubscribeUrl?: string | null) {
  if (!bookings.length) throw new Error("A confirmed reservation is required.");
  const first = bookings[0], owner = audience === "owner";
  const fields = [["Nom", first.name], ["Courriel", first.email], ["Téléphone", first.phone || "Non fourni"]];
  for (const booking of bookings) {
    fields.push(
      ["Réservation", booking.id],
      ["Date", new Intl.DateTimeFormat("fr-CA", { dateStyle: "long", timeZone: "UTC" }).format(booking.date)],
      ["Heure (Québec)", formatOperatingTime(booking.time)], ["Durée", booking.duration],
      ["Simulateur confirmé", `Baie ${booking.bayType}`], ["Joueurs", String(booking.players)],
    );
    if (booking.notes) fields.push(["Notes du client", booking.notes]);
  }
  const template = brandedEmail({
      title: owner ? "Une nouvelle réservation confirmée" : "Votre réservation est confirmée",
      label: owner ? "RÉSERVATION SUR LE SITE" : "CONFIRMATION DE RÉSERVATION",
      intro: owner
        ? "Une réservation a été enregistrée depuis le site et ajoutée au calendrier sélectionné. Répondez à ce courriel pour joindre le client."
        : `Bonjour ${first.name}, votre réservation chez Golf SIM Sorel-Tracy est enregistrée. Voici les détails de votre prochaine visite.`,
      fields, reference: bookings.map(b => b.id).join(", "),
      notice: "Le paiement s’effectue sur place. Apportez vos propres bâtons : Golf SIM n’en fournit pas. Pour modifier ou annuler, contactez-nous ; ne créez pas une deuxième réservation.",
    });
  const linkText = !owner && unsubscribeUrl ? `\n\nPour retirer votre consentement aux courriels promotionnels : ${unsubscribeUrl}` : "";
  const linkHtml = !owner && unsubscribeUrl
    ? `<p style="font-size:13px;margin:0 28px 24px">Pour retirer votre consentement aux courriels promotionnels : <a href="${unsubscribeUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}" style="color:#295634">Me désinscrire</a>.</p>`
    : "";
  return {
    ...template,
    html: linkHtml ? template.html.replace("</body>", `${linkHtml}</body>`) : template.html,
    text: template.text + linkText,
    subject: owner ? "Nouvelle réservation confirmée — Golf SIM" : "Votre réservation est confirmée — Golf SIM",
  };
}

// Only called after public bookings AND their Calendar events are saved.
// Delivery failure is reported separately and must never roll back a reservation.
export async function sendBookingEmails(bookings: ConfirmedBooking[], configProvider: () => MailConfig = mailConfig, fetcher: typeof fetch = fetch, unsubscribeUrl?: string | null) {
  try {
    const config = configProvider();
    const key = createHash("sha256").update(bookings.map(b => b.id).sort().join(",")).digest("hex");
    const results = await Promise.all((["owner", "customer"] as const).map(async audience => {
      try {
        const response = await fetcher("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `gsim-booking/${key}/${audience}` },
          body: JSON.stringify({
            from: `Golf SIM <${config.from}>`,
            to: [audience === "owner" || previewRuntime() ? config.to : bookings[0].email],
            reply_to: audience === "owner" ? bookings[0].email : config.to,
            ...bookingTemplate(bookings, audience, unsubscribeUrl),
          }),
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) return false;
        const result = await response.json() as { id?: unknown };
        return typeof result.id === "string" && result.id.length > 0;
      } catch { return false; }
    }));
    if (results.every(Boolean)) return "accepted" as const;
  } catch { /* Configuration or delivery errors never invalidate the booking. */ }
  console.warn("[Booking email] Confirmation saved, but email delivery was not fully accepted.");
  return "unavailable" as const;
}
