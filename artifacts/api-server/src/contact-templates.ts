export interface ContactSummary {
  name: string; email: string; phone?: string; date?: string;
  players: number; message: string; requestId: string;
}
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}
export function contactTemplate(data: ContactSummary, audience: "owner" | "customer") {
  const owner = audience === "owner";
  const title = owner ? "Une nouvelle demande à traiter" : "Nous avons bien reçu votre demande";
  const intro = owner
    ? "Une demande de groupe ou d’événement vient d’être transmise. Répondez à ce courriel pour joindre la personne."
    : `Bonjour ${data.name.trim()}, merci d’avoir choisi Golf SIM Sorel-Tracy. Votre demande a été transmise à notre équipe. Nous vous recontacterons pour discuter des disponibilités et des détails.`;
  const fields = [
    ["Nom", data.name.trim()], ["Courriel", data.email],
    ["Téléphone", data.phone?.trim() || "Non fourni"],
    ["Date souhaitée", data.date || "À discuter"], ["Joueurs", String(data.players)],
    ["Demande", data.message.trim()],
  ];
  const notice = "Cette demande n’est PAS une réservation confirmée. La date et l’heure restent à convenir avec notre équipe.";
  const text = ["GOLF SIM · SOREL-TRACY", title, intro, "", ...fields.map(([key, value]) => `${key} : ${value}`), "", notice, "", "Golf SIM Sorel-Tracy · (450) 561-3815", `Référence : ${data.requestId}`].join("\n");
  const rows = fields.map(([key, value]) => `<tr><td style="padding:14px 18px;border-bottom:1px solid #e5e7e5;vertical-align:top;width:115px;color:#576159;font-size:13px">${key}</td><td style="padding:14px 18px;border-bottom:1px solid #e5e7e5;color:#1b1b1b;word-break:break-word">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`).join("");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f4f3ed;font-family:Arial,Helvetica,sans-serif;color:#1b1b1b"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(title)} — Golf SIM Sorel-Tracy</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:auto;background:#fff;border:1px solid #e5e7e5"><tr><td style="background:#244c31;color:#fff;padding:30px 28px"><div style="font-size:32px;font-weight:900;letter-spacing:2px">GOLF SIM</div><div style="font-size:11px;letter-spacing:3px;margin-top:5px">SOREL-TRACY</div></td></tr><tr><td style="padding:30px 28px 22px"><div style="font-size:11px;letter-spacing:2px;color:#386342;font-weight:bold">${owner ? "DEMANDE DE GROUPE / ÉVÉNEMENT" : "ACCUSÉ DE RÉCEPTION"}</div><h1 style="font-size:27px;line-height:1.2;margin:12px 0 18px">${title}</h1><p style="font-size:16px;line-height:1.6;margin:0">${escapeHtml(intro)}</p><h2 style="font-size:17px;margin:28px 0 12px">Récapitulatif de la demande</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f8f4;border:1px solid #e5e7e5;font-size:15px">${rows}</table><p style="padding:16px;background:#edf3ec;border-left:4px solid #2b5734;font-size:14px;line-height:1.6;margin:24px 0 0">${notice}</p><p style="font-size:15px;line-height:1.6;margin:24px 0 0">${owner ? "Pour répondre, utilisez simplement la fonction Répondre de votre messagerie." : "Une précision à ajouter ? Répondez simplement à ce courriel ou téléphonez-nous au <a href=\"tel:+14505613815\" style=\"color:#244c31\">(450) 561-3815</a>."}</p></td></tr><tr><td style="padding:22px 28px;background:#1b1b1b;color:#fff;font-size:12px;line-height:1.7"><strong>GOLF SIM SOREL-TRACY</strong><br>Votre prochaine partie commence ici.<br><span style="color:#c4cdc5">Référence : ${escapeHtml(data.requestId)}</span></td></tr></table></td></tr></table></body></html>`;
  return { html, text, subject: owner ? "Nouvelle demande de groupe — Golf SIM" : "Votre demande a bien été reçue — Golf SIM" };
}
