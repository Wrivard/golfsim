import { brandedEmail } from "./email-brand";
export { escapeHtml } from "./email-brand";

export interface ContactSummary {
  name: string; email: string; phone?: string; date?: string;
  players: number; message: string; requestId: string;
}
export function contactTemplate(data: ContactSummary, audience: "owner" | "customer") {
  const owner = audience === "owner";
  return {
    ...brandedEmail({
      title: owner ? "Une nouvelle demande à traiter" : "Nous avons bien reçu votre demande",
      label: owner ? "DEMANDE DE GROUPE / ÉVÉNEMENT" : "ACCUSÉ DE RÉCEPTION",
      intro: owner
        ? "Une demande de groupe ou d’événement vient d’être transmise. Répondez à ce courriel pour joindre la personne."
        : `Bonjour ${data.name.trim()}, merci d’avoir choisi Golf SIM Sorel-Tracy. Votre demande a été transmise à notre équipe. Nous vous recontacterons pour discuter des disponibilités et des détails.`,
      fields: [
        ["Nom", data.name.trim()], ["Courriel", data.email],
        ["Téléphone", data.phone?.trim() || "Non fourni"],
        ["Date souhaitée", data.date || "À discuter"], ["Joueurs", String(data.players)],
        ["Demande", data.message.trim()],
      ],
      notice: "Cette demande n’est PAS une réservation confirmée. La date et l’heure restent à convenir avec notre équipe.",
      reference: data.requestId,
    }),
    subject: owner ? "Nouvelle demande de groupe — Golf SIM" : "Votre demande a bien été reçue — Golf SIM",
  };
}
