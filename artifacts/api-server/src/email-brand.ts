import { publicOrigin } from "./runtime/config";

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function brandedEmail(data: {
  title: string; label: string; intro: string; fields: string[][];
  notice: string; reference: string;
}) {
  const site = publicOrigin() || "https://www.golfsimsorel.ca";
  const rows = data.fields.map(([label, value]) => `<tr><td style="padding:13px 16px;border-bottom:1px solid #dddcd4;vertical-align:top;width:110px;color:#555;font-size:13px">${escapeHtml(label)}</td><td style="padding:13px 16px;border-bottom:1px solid #dddcd4;word-break:break-word;font-size:15px">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`).join("");
  const text = ["GOLF SIM · SOREL-TRACY", data.title, data.intro, "",
    ...data.fields.map(([label, value]) => `${label} : ${value}`), "", data.notice,
    "", "Une question ? Répondez à ce courriel ou appelez le (450) 561-3815.",
    "215 Bd Fiset, Sorel-Tracy", site, `Référence : ${data.reference}`].join("\n");
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f3ed;font-family:Arial,Helvetica,sans-serif;color:#1b1b1b">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(data.title)} — Golf SIM Sorel-Tracy</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #dddcd4">
<tr><td align="center" style="background:#f7f4e9;padding:28px;border-top:6px solid #295634">
<a href="${escapeHtml(site)}"><img src="${escapeHtml(site)}/email-logo.png" alt="Golf SIM Sorel-Tracy" width="160" height="132" style="display:block;width:160px;height:132px;border:0"></a>
<p style="margin:12px 0 0;font-size:12px;font-weight:bold;letter-spacing:2px;color:#295634">GOLF SIM · SOREL-TRACY</p></td></tr>
<tr><td style="padding:28px"><p style="margin:0;color:#295634;font-size:11px;font-weight:bold;letter-spacing:2px">${escapeHtml(data.label)}</p>
<h1 style="font-size:27px;line-height:1.2;margin:12px 0 18px">${escapeHtml(data.title)}</h1>
<p style="font-size:16px;line-height:1.6">${escapeHtml(data.intro)}</p>
<h2 style="font-size:17px;margin:26px 0 12px">Récapitulatif</h2>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f8f4;border:1px solid #dddcd4">${rows}</table>
<p style="padding:16px;background:#edf3ec;border-left:4px solid #295634;font-size:14px;line-height:1.6;margin:24px 0">${escapeHtml(data.notice)}</p>
<p style="font-size:14px;line-height:1.6">Une question ? Répondez à ce courriel ou appelez le <a href="tel:+14505613815" style="color:#295634">(450) 561-3815</a>.</p></td></tr>
<tr><td style="padding:22px 28px;background:#1b1b1b;color:#fff;font-size:12px;line-height:1.7">
<strong>GOLF SIM SOREL-TRACY</strong><br>215 Bd Fiset, Sorel-Tracy<br>
<a href="${escapeHtml(site)}" style="color:#e7d5ac">Visiter notre site</a><br>
<span style="color:#ccc">Référence : ${escapeHtml(data.reference)}</span></td></tr>
</table></td></tr></table></body></html>`;
  return { html, text };
}
