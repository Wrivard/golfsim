// Printable file-only staff guide. All API data below is isolated browser-fixture
// data; screenshots use the current application, with no real booking writes.
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "../../node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/index.mjs";

const out = resolve("generated-artifacts/guide-reservation-admin");
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/repl/tools/bin/chromium", headless: true, args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 920, height: 820 }, deviceScaleFactor: 2,
  timezoneId: "America/Toronto", locale: "fr-CA",
});
const date = "2026-10-15";
let bookings = [
  { id: "example-a", date, time: "09:00", duration: "2h", bayType: "1", players: 4, name: "Exemple — groupe A", email: "" },
  { id: "example-b", date, time: "10:00", duration: "2h", bayType: "3", players: 2, name: "Exemple — groupe B", email: "" },
];
let saved = null;
await context.route("**/api/**", async route => {
  const request = route.request(), url = new URL(request.url()), path = url.pathname;
  let data = { ok: true };
  if (path === "/api/auth/session") data = { ok: true, authenticated: true, admin: { id: "guide", username: "Démonstration", role: "admin" } };
  else if (path === "/api/admin/calendar-settings") data = { ok: true, settings: { calendarId: "primary" } };
  else if (path === "/api/admin/calendar-connection") data = { configured: true, connected: false };
  else if (path === "/api/admin/closures") data = { ok: true, closures: [] };
  else if (path === "/api/admin/email-contacts") data = { ok: true, contacts: [] };
  else if (path === "/api/schedule") data = { ok: true, schedule: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, openHour: 8, openMinute: 0, closeHour: 22, closeMinute: 0, lastBookingHour: 21, lastBookingMinute: 0 })) };
  else if (path === "/api/admin/availability/optimized") {
    data = { ok: true, slots: Array.from({ length: 25 }, (_, i) => {
      const minutes = 480 + i * 30;
      const bookingTime = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      return { time: `${url.searchParams.get("date")}T${bookingTime}:00`, bookingTime, allBays: ["1", "2", "3", "4"].map(bayId => ({ bayId, isValid: true })) };
    }) };
  } else if (path === "/api/admin/bookings") {
    if (request.method() === "POST") {
      saved = request.postDataJSON();
      assert.deepEqual(saved, { date, time: "12:30", duration: "2h", bayType: "2", players: 4, name: "Client Démo", email: "", phone: "", notes: "" });
      const booking = { ...saved, id: "guide-confirmed", createdAt: "2026-10-14T14:00:00Z" };
      bookings = [...bookings, booking];
      data = { ok: true, booking };
    } else data = { ok: true, bookings };
  } else if (request.method() !== "GET") throw new Error(`Unexpected mutation ${path}`);
  await route.fulfill({ status: request.method() === "POST" ? 201 : 200, contentType: "application/json", body: JSON.stringify(data) });
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", error => errors.push(error.message));
await page.clock.setFixedTime(new Date("2026-10-14T10:00:00-04:00"));
const box = async locator => {
  const b = await locator.boundingBox();
  assert.ok(b, "Screenshot target must be visible");
  return b;
};
const union = (...boxes) => ({
  x: Math.min(...boxes.map(b => b.x)), y: Math.min(...boxes.map(b => b.y)),
  width: Math.max(...boxes.map(b => b.x + b.width)) - Math.min(...boxes.map(b => b.x)),
  height: Math.max(...boxes.map(b => b.y + b.height)) - Math.min(...boxes.map(b => b.y)),
});
const capture = async name => {
  await page.screenshot({ path: `${out}/${name}.png`, animations: "disabled" });
  return `data:image/png;base64,${(await readFile(`${out}/${name}.png`)).toString("base64")}`;
};
try {
  await page.goto("http://localhost:80/admin");
  await page.getByTestId("button-admin-date-picker").click();
  await page.getByRole("dialog").locator("button[data-day]").filter({ hasText: /^15$/ }).click();
  const dateBox = await box(page.getByTestId("button-admin-date-picker"));
  const addButton = page.getByRole("button", { name: "Ajouter une réservation", exact: true });
  const addBox = await box(addButton);
  const calendarImage = await capture("01-calendrier");

  await addButton.click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Durée", exact: true }).click();
  await page.getByRole("option", { name: "2h", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Baie", exact: true }).click();
  await page.getByRole("option", { name: "Baie 2", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Heure", exact: true }).click();
  await page.getByRole("option", { name: "12:30", exact: true }).click();
  await dialog.getByRole("combobox", { name: "Joueurs", exact: true }).click();
  await page.getByRole("option", { name: "4", exact: true }).click();
  await dialog.getByLabel("Nom *", { exact: true }).fill("Client Démo");
  const schedulingBox = union(...await Promise.all(["#staff-date", "#staff-time", "#staff-duration", "#staff-bay"].map(selector => box(dialog.locator(selector)))));
  const clientBox = union(await box(dialog.locator("#staff-players")), await box(dialog.locator("#staff-name")));
  const saveButton = dialog.getByRole("button", { name: "Ajouter la réservation", exact: true });
  const saveBox = await box(saveButton);
  assert.ok(await saveButton.isEnabled());
  const formImage = await capture("02-formulaire");
  await saveButton.click();
  await dialog.waitFor({ state: "hidden" });
  await page.getByText("Réservation ajoutée", { exact: true }).waitFor();
  const card = page.locator("[draggable=true]").filter({ hasText: "Client Démo" });
  await card.waitFor();
  assert.match(await card.innerText(), /12:30–14:30\s+2h\s+4 joueurs/);
  const resultDateBox = await box(page.getByTestId("button-admin-date-picker"));
  const resultCardBox = await box(card);
  const resultImage = await capture("03-verification");
  assert.equal(saved.name, "Client Démo");
  assert.deepEqual(errors, []);

  const green = "#285438", imageX = 24, imageY = 117, imageWidth = 674, scale = imageWidth / 920;
  const mapBox = b => ({ x: imageX + b.x * scale, y: imageY + b.y * scale, width: b.width * scale, height: b.height * scale });
  const annotation = (source, y, bottom = false, lane = 707) => {
    const b = mapBox(source), sx = 716;
    const tx = bottom ? b.x + b.width / 2 : b.x + b.width + 5;
    const ty = bottom ? b.y + b.height + 5 : b.y + b.height / 2;
    const path = bottom
      ? `M ${sx} ${y} H ${lane} V ${ty + 14} H ${tx} V ${ty}`
      : `M ${sx} ${y} H ${lane} V ${ty} H ${tx}`;
    return `<rect x="${b.x - 3}" y="${b.y - 3}" width="${b.width + 6}" height="${b.height + 6}" rx="5" fill="none" stroke="white" stroke-width="6"/>
      <rect x="${b.x - 3}" y="${b.y - 3}" width="${b.width + 6}" height="${b.height + 6}" rx="5" fill="none" stroke="${green}" stroke-width="3"/>
      <path d="${path}" fill="none" stroke="white" stroke-width="6" stroke-linejoin="round"/>
      <path d="${path}" fill="none" stroke="${green}" stroke-width="3" stroke-linejoin="round" marker-end="url(#arrow)"/>`;
  };
  const step = (number, y, title, text) => `<div class="step" style="top:${y - 16}px"><span class="number">${number}</span><div><h2>${title}</h2><p>${text}</p></div></div>`;
  const sheet = (number, title, subtitle, image, steps, arrows, note) => `<section class="sheet">
    <header><div class="eyebrow">GOLF SIM · GUIDE DU PERSONNEL</div><h1>${title}</h1><p>${subtitle}</p></header>
    <img class="screen" src="${image}" alt="Capture de la page administration de Golf SIM"/>
    <svg class="annotations" viewBox="0 0 1056 816"><defs><marker id="arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M 0 0 L 12 6 L 0 12 z" fill="${green}"/></marker></defs>${arrows}</svg>
    ${steps}<aside class="note">${note}</aside>
    <footer><span>Captures de l’interface actuelle · Exemples fictifs · Aucune réservation réelle créée</span><b>${number} / 3</b></footer>
    </section>`;
  const html = `<!doctype html><html lang="fr"><meta charset="utf-8"><title>Golf SIM — Réserver depuis le calendrier admin</title><style>
    @page{size:Letter landscape;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#1b1b1b;background:white}
    .sheet{width:1056px;height:816px;position:relative;overflow:hidden;break-after:page;background:white}.sheet:last-child{break-after:auto}
    header{position:absolute;left:24px;right:24px;top:21px;border-bottom:2px solid ${green};padding-bottom:10px}.eyebrow{font-size:14px;font-weight:700;color:${green};letter-spacing:.6px}h1{font-size:32px;line-height:1.05;margin:7px 0}header p{font-size:17px;margin:0}
    .screen{position:absolute;left:24px;top:117px;width:674px;height:auto;border:1px solid #c7c7c7}.annotations{position:absolute;inset:0;width:1056px;height:816px;pointer-events:none}
    .step{position:absolute;left:716px;right:24px;display:flex;gap:12px;align-items:flex-start}.number{flex:none;width:32px;height:32px;border-radius:50%;background:${green};color:white;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:bold}
    h2{font-size:22px;line-height:1.13;margin:0 0 9px} .step p{font-size:20px;line-height:1.3;margin:0}
    .note{position:absolute;left:716px;right:24px;bottom:77px;border-top:2px solid ${green};padding-top:12px;font-size:17px;line-height:1.3}
    footer{position:absolute;left:24px;right:24px;bottom:19px;display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:10px;font-size:12px;color:#555}
    </style><body>
    ${sheet(1, "Ouvrir une nouvelle réservation", "Dans l’administration, utiliser la « Vue calendrier ».", calendarImage,
      step(1, 184, "Choisir le bon jour", "Cliquer sur la date du calendrier et choisir le jour demandé par le client.") +
      step(2, 340, "Ouvrir le formulaire", "Cliquer sur <b>« Ajouter une réservation »</b> dans la barre du calendrier."),
      annotation(dateBox, 184) + annotation(addBox, 340, true),
      "<b>Accès :</b> www.golfsimsorel.ca/login<br>Se connecter avec les accès fournis par le responsable. Ne pas utiliser la page de réservation publique.")}
    ${sheet(2, "Remplir et enregistrer", "Exemple : 15 octobre · 12:30–14:30 · 2 h · Baie 2 · 4 joueurs.", formImage,
      step(1, 244, "Choisir le créneau", "Choisir la <b>date</b>, la <b>durée</b> et la <b>baie</b>, puis une <b>heure disponible</b>.") +
      step(2, 400, "Inscrire le client", "Choisir <b>1 à 4 joueurs</b> et remplir <b>« Nom * »</b>. Les autres champs sont facultatifs.") +
      step(3, 558, "Enregistrer une fois", "Cliquer une fois sur <b>« Ajouter la réservation »</b>. Attendre la fermeture."),
      annotation(schedulingBox, 244) + annotation(clientBox, 400) + annotation(saveBox, 558),
      "Aucune heure ? Changer de date, de durée ou de baie.")}
    ${sheet(3, "Vérifier que la réservation est ajoutée", "Le message « Réservation ajoutée » et le nouveau bloc confirment l’enregistrement.", resultImage,
      step(1, 184, "Vérifier la date", "Le calendrier doit afficher le <b>jour demandé</b>.") +
      step(2, 371, "Retrouver le bloc", "Dans la bonne <b>baie</b>, vérifier le <b>nom</b>, les <b>heures</b>, la <b>durée</b> et les <b>joueurs</b>.") +
      step(3, 548, "En cas de problème", "Erreur ou bloc absent ? <b>Ne pas annoncer que c’est confirmé.</b> Prévenir le responsable."),
      annotation(resultDateBox, 184) + annotation(resultCardBox, 371, false, imageX + imageWidth - 14),
      "Cliquer sur le bloc pour relire les détails.")}
    </body></html>`;
  await writeFile(`${out}/guide-reservation-admin.html`, html);
  const print = await browser.newPage({ viewport: { width: 1056, height: 816 } });
  await print.setContent(html, { waitUntil: "load" });
  await print.evaluate(() => document.fonts.ready);
  await print.pdf({ path: `${out}/Golf-SIM-guide-personnel-reservation-admin.pdf`, format: "Letter", landscape: true, printBackground: true, preferCSSPageSize: true });
  for (let i = 0; i < 3; i++) await print.locator(".sheet").nth(i).screenshot({ path: `${out}/page-${i + 1}.png` });
  const overflow = await print.locator(".sheet").evaluateAll(sheets => sheets.map(sheet => [...sheet.querySelectorAll(".step, .note")].some(el => el.getBoundingClientRect().right > sheet.getBoundingClientRect().right)));
  assert.equal(overflow.some(Boolean), false);
  const overlapping = await print.locator(".sheet").evaluateAll(sheets => sheets.map(sheet => {
    const boxes = [...sheet.querySelectorAll(".step, .note")].map(el => el.getBoundingClientRect()).sort((a, b) => a.top - b.top);
    return boxes.some((b, i) => i && boxes[i - 1].bottom + 6 > b.top);
  }));
  assert.equal(overlapping.some(Boolean), false, "Guide instructions must not overlap");
  console.log(JSON.stringify({ pdf: "generated-artifacts/guide-reservation-admin/Golf-SIM-guide-personnel-reservation-admin.pdf", pages: 3, fixtureBookingOnly: true, realWrites: 0, browserErrors: errors.length }));
  await print.close();
} finally {
  await context.close();
  await browser.close();
}
