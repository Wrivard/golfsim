/**
 * Private print export only. No credential enters public slides or public assets.
 * The source must already be the seven-page Letter landscape PDF.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { printBox as box } from "./letter-print-layout.mjs";

try {
  const file = process.argv[2];
  const password = process.env.STAFF_ADMIN_PASSWORD;
  const username = "admingolfsimsorel";
  const outputs = path.resolve(".local/outputs");
  if (!file || !password || !path.resolve(file).startsWith(outputs+path.sep)) {
    throw new Error("A private output path and secure password are required.");
  }
  const pdf = await PDFDocument.load(await fs.readFile(file));
  if (pdf.getPageCount() !== 7) throw new Error("Expected seven pages.");
  const page = pdf.getPage(4);
  if (page.getWidth() !== 792 || page.getHeight() !== 612) throw new Error("Expected Letter landscape.");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const mono = await pdf.embedFont(StandardFonts.CourierBold);
  const paper = rgb(1,1,1);
  const ink = rgb(27/255,26/255,24/255);
  const field = box(1140,324,684,278);
  page.drawRectangle({...field,color:paper});
  const top = field.y+field.height-18;
  function accessLine(label,value,y) {
    const labelWidth = font.widthOfTextAtSize(label,15.5);
    const valueWidth = mono.widthOfTextAtSize(value,15.5);
    if (labelWidth+valueWidth+6 > field.width) throw new Error("The access field needs a wider printable layout.");
    page.drawText(label,{x:field.x,y,size:15.5,font,color:ink});
    page.drawText(value,{x:field.x+labelWidth+6,y,size:15.5,font:mono,color:ink});
  }
  accessLine("Identifiant : ",username,top);
  accessLine("Mot de passe : ",password,top-23);
  page.drawText("Puis « Se connecter ».",{x:field.x,y:top-46,size:15.5,font,color:ink});
  const footer = box(96,1015,1430,52);
  page.drawRectangle({...footer,color:paper});
  page.drawText("ACCÈS RÉELS - Document réservé au personnel. Ne pas diffuser.",{
    x:footer.x,y:footer.y+footer.height-14,size:13,font,color:ink,
  });
  pdf.setTitle("Golf SIM - Guide confidentiel du personnel");
  pdf.setSubject("Sept pages pour le personnel. Contient les accès administrateur : ne pas diffuser.");
  await fs.writeFile(file,await pdf.save(),{mode:0o600});
  await fs.chmod(file,0o600);
  const text = spawnSync("pdftotext",["-f","5","-l","5","-raw",file,"-"],{encoding:"utf8"});
  if (text.status !== 0 || !text.stdout.includes(username) || !text.stdout.includes(password)) {
    throw new Error("Private PDF access-field verification failed.");
  }
  console.log(JSON.stringify({privatePdfReady:true,pages:7,letterLandscape:true,identifierVerified:true,passwordFieldVerified:true}));
} catch {
  console.error("Private PDF preparation failed; no credentials were logged.");
  process.exitCode = 1;
}
