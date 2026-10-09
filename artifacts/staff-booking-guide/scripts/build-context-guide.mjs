import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import YAML from "yaml";
const root=path.resolve("artifacts/staff-booking-guide"),images=path.join(root,"public/images");
const captures=JSON.parse(await fs.readFile(path.join(images,"context-metadata.json"),"utf8"));
const theme={colors:{background:"#F7F3E8",foreground:"#1B1A18",accent:"#2B5734",surface:"#FFFFFF",muted:"#70695C"},fonts:{display:"Oswald",body:"DM Sans"}};
const token=token=>({kind:"token",token}),fill=color=>({kind:"solid",color:token(color)});
const rect=(id,frame,color="surface",stroke=false,preset="rect")=>({id,type:"shape",frame,geometry:{kind:"preset",preset},fill:color?fill(color):{kind:"none"},...(stroke?{stroke:{color:token("accent"),widthPt:2.5}}:{})});
const txt=(id,frame,value,size=20,opts={})=>({id,type:"text",frame,body:{paragraphs:[{runs:[{text:value}],defaultRunStyle:{font:token(opts.font||"body"),sizePt:size,weight:opts.weight||400,color:token(opts.color||"foreground")},align:opts.align||"left",lineHeight:1.12,spaceAfterPt:0}]}});
async function shot(doc,name,id,frame,crop){
  const meta=captures[name];
  const area=crop||{left:0,top:0,width:meta.width,height:meta.height};
  let file=meta.file;
  if(crop){file=`overview-${id}.png`;await sharp(path.join(images,meta.file)).extract(area).png().toFile(path.join(images,file));}
  const scale=Math.min(frame.width/area.width,frame.height/area.height);
  const box={x:frame.x+(frame.width-area.width*scale)/2,y:frame.y+(frame.height-area.height*scale)/2,width:area.width*scale,height:area.height*scale};
  doc.assets[id]={src:"images/"+file};
  doc.elements.push(rect(id+"-frame",{x:box.x-4,y:box.y-4,width:box.width+8,height:box.height+8}));
  doc.elements.push({id:"image-"+id,type:"image",assetId:id,fit:"contain",frame:box,altText:"Page réelle de Golf SIM, données fictives, contexte de navigation conservé."});
  return {name,id,box,scale,area};
}
function mark(doc,view,key){
  const b=captures[view.name].controls[key];
  const box={x:view.box.x+(b.x-view.area.left)*view.scale-5,y:view.box.y+(b.y-view.area.top)*view.scale-5,width:b.width*view.scale+10,height:b.height*view.scale+10};
  doc.elements.push(rect(`${view.id}-${key}-target`,box,null,true));
  return box;
}
function cropControl(name,key,pad=14){
  const m=captures[name],b=m.controls[key];
  const left=Math.max(0,Math.floor(b.x-pad)),top=Math.max(0,Math.floor(b.y-pad));
  return {left,top,width:Math.min(m.width-left,Math.ceil(b.width+2*pad)),height:Math.min(m.height-top,Math.ceil(b.height+2*pad))};
}
async function localPointer(doc,pageId,n,target,label,side="left"){
  if(!target)return;
  const mid=target.y+target.height/2;
  const gap=8,length=34;
  const x=side==="left"?target.x-gap-length:target.x+target.width+gap;
  const file=`direction-${pageId}-${n}.svg`;
  const flip=side==="left";
  const d=flip?"M 0 14 H 20":"M 34 14 H 14";
  const head=flip?"M 34 14 L 15 3 L 15 25 Z":"M 0 14 L 19 3 L 19 25 Z";
  await fs.writeFile(path.join(images,file),`<svg xmlns="http://www.w3.org/2000/svg" width="34" height="28" viewBox="0 0 34 28"><path d="${d}" fill="none" stroke="#ffffff" stroke-width="9"/><path d="${d}" fill="none" stroke="#2B5734" stroke-width="5"/><path d="${head}" fill="#2B5734"/></svg>`);
  const id=`direction-${n}`;doc.assets[id]={src:"images/"+file};
  doc.elements.push({id,type:"image",assetId:id,fit:"contain",frame:{x,y:mid-14,width:34,height:28},altText:`Flèche courte vers ${label||"le champ encadré"}.`});
  if(label){
    const width=Math.max(140,label.length*18.5+40);
    const frame={x:side==="left"?x-width-6:x+length+6,y:mid-24,width,height:48};
    doc.elements.push(rect(`${id}-label-bg`,frame,"background"));
    doc.elements.push(txt(`${id}-label`,{x:frame.x+8,y:frame.y+7,width:frame.width-16,height:38},label,14.4,{weight:700,color:"accent",align:side==="left"?"right":"left"}));
  }
}
function step(doc,n,y,height,title,body,compact=false){
  doc.elements.push(rect(`step-${n}-badge`,{x:1040,y:y+6,width:74,height:74},"accent",false,"ellipse"));
  doc.elements.push(txt(`step-${n}-number`,{x:1040,y:y+15,width:74,height:58},String(n),24,{weight:700,color:"surface",align:"center"}));
  doc.elements.push(txt(`step-${n}-title`,{x:1140,y,width:compact?380:684,height:60},title,23,{weight:700}));
  doc.elements.push(txt(`step-${n}-body`,{x:1140,y:y+66,width:compact?380:684,height:height-66},body,20));
}
const pages=[
 {id:"client-start",title:"Client — choisir la durée",role:"CLIENT",steps:[
   ["Cliquer « RÉSERVER »","Le bouton se trouve dans le menu du site."],
   ["Choisir la durée","Cliquer sur 1, 2, 3 ou 4 heures. Exemple : 2 heures."],
   ["Passer aux créneaux","La sélection ouvre les dates et les heures. Suivre la page 2."]]},
 {id:"client-time",title:"Client — choisir la date et l’heure",role:"CLIENT",steps:[
   ["Ouvrir le calendrier","Cliquer sur la date, en haut du panneau de réservation."],
   ["Choisir le jour","Cliquer le jour demandé."],
   ["Choisir l’heure","Cliquer sur une heure disponible. Aucun choix ? Essayer un autre jour."]]},
 {id:"client-details",title:"Client — remplir les coordonnées",role:"CLIENT",steps:[
   ["Nom et courriel","Entrer le nom complet et le courriel du client."],
   ["Nombre de joueurs","Choisir de 1 à 4 joueurs. Téléphone et notes : facultatifs."],
   ["Continuer","Cocher les conditions, puis cliquer sur le bouton vert pour vérifier."]]},
 {id:"client-confirm",title:"Client — vérifier et confirmer",role:"CLIENT",steps:[
   ["Relire les informations","Vérifier date, heure, durée et nom. Corriger avec « Retour » si nécessaire."],
   ["Confirmer une seule fois","Cliquer sur « Confirmer », puis attendre sans fermer la page."],
   ["Vérifier la confirmation","Attendre « Réservation Confirmée ! » et noter la baie confirmée. Paiement sur place."]]},
 {id:"staff-login",title:"Admin — retrouver la réservation",role:"ADMIN",steps:[
   ["Se connecter : /login","Identifiant : ______________\nMot de passe : ______________\nCliquer « Se connecter »."],
   ["Afficher le bon jour","Cliquer « Vue calendrier ». Utiliser les flèches pour afficher le jour de la réservation."],
   ["Ouvrir la réservation","Cliquer sur le bloc au nom du client, puis sur « Modifier » dans les détails."]]},
 {id:"staff-check",title:"Admin — changer la date ou l’heure",role:"ADMIN",steps:[
   ["Modifier la date","Dans « Date », choisir le nouveau jour demandé."],
   ["Modifier l’horaire","Changer « Heure » et, si nécessaire, « Durée ». Vérifier aussi la baie et les joueurs."],
   ["Enregistrer et vérifier","Cliquer « Enregistrer ». Attendre « Réservation modifiée » et vérifier le bloc au nouveau jour. Puis « Déconnexion »."]]}
];
const manifest=[];
for(let p=0;p<pages.length;p++){
 const page=pages[p],doc={format:"replit.sdm",version:1,size:{width:1920,height:1080},theme,background:fill("background"),assets:{},elements:[]};
 doc.elements.push(txt("brand",{x:96,y:64,width:1380,height:56},"GOLF SIM · GUIDE DU PERSONNEL",16,{weight:700,color:"accent"}));
 doc.elements.push(txt("role",{x:1560,y:64,width:264,height:56},page.role,16,{weight:700,color:"accent",align:"right"}));
 doc.elements.push(txt("title",{x:96,y:129,width:1728,height:118},page.title,38,{font:"display",weight:700}));
 doc.elements.push(rect("header-rule",{x:96,y:239,width:1728,height:4},"accent"));
 const targets=[];
 if(p===0){const v=await shot(doc,"duration","duration",{x:96,y:274,width:900,height:716});targets.push(mark(doc,v,"reserve"),mark(doc,v,"duration"),null);}
 if(p===1){
   const v=await shot(doc,"time","time",{x:96,y:274,width:900,height:716});targets[0]=mark(doc,v,"date");targets[2]=mark(doc,v,"time");
   // The calendar belongs beside instruction 2, not over the page or below instruction 3.
   const popup=await shot(doc,"date","calendar-popup",{x:1544,y:500,width:280,height:230},cropControl("date","calendar"));
   targets[1]=mark(doc,popup,"day");
 }
 if(p===2){const v=await shot(doc,"details","details",{x:96,y:274,width:900,height:716});targets.push(mark(doc,v,"name"),mark(doc,v,"players"),mark(doc,v,"continue"));mark(doc,v,"email");mark(doc,v,"terms");}
 if(p===3){
   const v=await shot(doc,"review","review",{x:96,y:274,width:900,height:716});targets[1]=mark(doc,v,"confirm");
   const success=await shot(doc,"success","success-panel",{x:100,y:788,width:500,height:200},cropControl("success","panel"));
   targets[2]=mark(doc,success,"success");mark(doc,success,"bay");
   doc.elements.push(rect("success-caption-bg",{x:100,y:733,width:510,height:54},"background"));
   doc.elements.push(txt("success-caption",{x:105,y:737,width:490,height:48},"Après confirmation",15,{weight:700,color:"accent"}));
 }
 if(p===4){
   const login=await shot(doc,"login","login",{x:96,y:267,width:900,height:350});
   targets[0]=mark(doc,login,"login");mark(doc,login,"username");mark(doc,login,"password");
   const calendar=await shot(doc,"calendar","calendar",{x:96,y:641,width:900,height:350});
   targets[1]=mark(doc,calendar,"date");mark(doc,calendar,"view");targets[2]=mark(doc,calendar,"booking");
 }
 if(p===5){
   const edit=await shot(doc,"edit","edit",{x:96,y:267,width:900,height:724});
   targets.push(mark(doc,edit,"date"),mark(doc,edit,"time"),mark(doc,edit,"save"));mark(doc,edit,"duration");
 }
 const rows=p===4?[{y:258,h:350},{y:610,h:216},{y:842,h:166}]:[{y:258,h:230},{y:504,h:230},{y:750,h:252}];
 if(p===4){page.steps[1][1]="« Vue calendrier » : choisir le jour avec les flèches.";page.steps[2][1]="Cliquer le bloc, puis « Modifier ».";}
 const labels=[
   [null,"2 heures",null],
   ["Date",null,"Heure"],
   ["Nom","Joueurs","Continuer"],
   [null,"Confirmer",null],
   ["Connexion","Jour","Client"],
   ["Date","Heure","Enregistrer"],
 ][p];
 for(let n=0;n<3;n++){
   const right=p===0||p===1&&n===1||p===4&&n===2||p===5&&n===2;
   await localPointer(doc,page.id,n+1,targets[n],labels[n],right?"right":"left");
   step(doc,n+1,rows[n].y,rows[n].h,...page.steps[n],p===1&&n===1);
 }
 const foot=p===5?"Après sauvegarde, vérifier le jour. Erreur ? Prévenir le responsable.":"Captures du site réel · Exemples fictifs : utiliser les informations du client.";
 doc.elements.push(txt("footer",{x:96,y:1015,width:1430,height:52},foot,14,{color:"muted"}));
 doc.elements.push(txt("pagination",{x:1600,y:1015,width:224,height:52},`PAGE ${p+1} / 6`,15,{color:"muted",align:"right"}));
 await fs.writeFile(path.join(root,`src/data/slides/${page.id}.sdm.yaml`),YAML.stringify(doc,{lineWidth:0}));
 manifest.push({id:page.id,position:p+1,kind:"sdm",filepath:`src/data/slides/${page.id}.sdm.yaml`,title:page.title,description:"Guide imprimable avec contexte de page, flèches et trois repères uniques.",speakerNotes:""});
}
await fs.writeFile(path.join(root,"src/data/slides-manifest.json"),JSON.stringify(manifest,null,2)+"\n");
await fs.writeFile(path.join(root,"docs/approved-outline.json"),JSON.stringify(pages,null,2)+"\n");
console.log("Built six pages: four client bookings, two login/edit, contextual screenshots.");
