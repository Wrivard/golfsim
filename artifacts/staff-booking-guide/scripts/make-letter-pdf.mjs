import fs from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { letter, pdfCrop, printScale } from "./letter-print-layout.mjs";
const source=process.argv[2];
const destination=process.argv[3]||source;
if(!source)throw new Error("Usage: node make-letter-pdf.mjs source.pdf [destination.pdf]");
const original=await PDFDocument.load(await fs.readFile(source));
if(original.getPageCount()!==7)throw new Error("Expected the complete 7-page staff guide.");
const output=await PDFDocument.create();
const embedded=await output.embedPages(original.getPages(),original.getPages().map(pdfCrop));
const {width,height,margin}=letter;
for(const slide of embedded){
  const page=output.addPage([width,height]);
  const scale=Math.min((width-2*margin)/slide.width,(height-2*margin)/slide.height);
  const w=slide.width*scale,h=slide.height*scale;
  page.drawPage(slide,{x:(width-w)/2,y:(height-h)/2,width:w,height:h});
}
output.setTitle("Golf SIM Sorel-Tracy — Guide de réservation du personnel");
output.setAuthor("Golf SIM Sorel-Tracy");
output.setSubject("7 pages, captures réelles et instructions simples. Impression Lettre US paysage, une page par feuille.");
output.setLanguage("fr-CA");
await fs.writeFile(destination,await output.save());
console.log(JSON.stringify({filePath:destination,pages:7,paper:"Letter US",orientation:"landscape",widthPt:width,heightPt:height,marginInch:margin/72,contentEnlargementPercent:Math.round((printScale/((792-2*25.2)/1920)-1)*100)}));
