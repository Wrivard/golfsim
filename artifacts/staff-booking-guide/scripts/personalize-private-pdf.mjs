/**
 * Private print export only. No credential enters public slides or public assets.
 * The source must already be the seven-page Letter landscape PDF.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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
  const scale = (792-2*25.2)/1920;
  const offsetX = 25.2, offsetY = (612-1080*scale)/2;
  const box = (x,y,width,height)=>({x:offsetX+x*scale,y:offsetY+(1080-y-height)*scale,width:width*scale,height:height*scale});
  const cream = rgb(247/255,243/255,232/255);
  const ink = rgb(27/255,26/255,24/255);
  const field = box(1140,324,684,278);
  page.drawRectangle({...field,color:cream});
  const top = field.y+field.height-15;
  function accessLine(label,value,y) {
    const labelWidth = font.widthOfTextAtSize(label,13.5);
    const valueWidth = mono.widthOfTextAtSize(value,14);
    if (labelWidth+valueWidth+6 > field.width) throw new Error("The access field needs a wider printable layout.");
    page.drawText(label,{x:field.x,y,size:13.5,font,color:ink});
    page.drawText(value,{x:field.x+labelWidth+6,y,size:14,font:mono,color:ink});
  }
  accessLine("Identifiant : ",username,top);
  accessLine("Mot de passe : ",password,top-20);
  page.drawText("Puis « Se connecter ».",{x:field.x,y:top-40,size:13.5,font,color:ink});
  const footer = box(96,1015,1430,52);
  page.drawRectangle({...footer,color:cream});
  page.drawText("ACCÈS RÉELS - Document réservé au personnel. Ne pas diffuser.",{
    x:footer.x,y:footer.y+footer.height-12,size:11.5,font,color:ink,
  });
  pdf.setTitle("Golf SIM - Guide confidentiel du personnel");
  pdf.setSubject("Sept pages pour le personnel. Contient les accès administrateur : ne pas diffuser.");
  await fs.writeFile(file,await pdf.save(),{mode:0o600});
  await fs.chmod(file,0o600);
  const text = spawnSync("pdftotext",["-raw",file,"-"],{encoding:"utf8"});
  if (text.status !== 0 || !text.stdout.includes(username) || !text.stdout.includes(password)) {
    throw new Error("Private PDF access-field verification failed.");
  }
  console.log(JSON.stringify({privatePdfReady:true,pages:7,letterLandscape:true,identifierVerified:true,passwordFieldVerified:true}));
} catch {
  console.error("Private PDF preparation failed; no credentials were logged.");
  process.exitCode = 1;
}
