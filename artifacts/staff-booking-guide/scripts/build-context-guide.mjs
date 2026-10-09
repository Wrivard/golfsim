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
async function connectedPointer(doc,pageId,n,target,y,mode="right"){
  if(!target)return;
  const start=mode==="inset"?{x:1077,y:y+90}:{x:1035,y:y+43};
  const upward=mode!=="right";
  const tip=upward
    ? {x:target.x+target.width/2,y:target.y+target.height+(mode==="tight"?1:8)}
    : {x:target.x+target.width+8,y:target.y+target.height/2};
  const routeY=mode==="inset"?736:mode==="tight"?target.y+target.height+3:upward?target.y+target.height+32:tip.y;
  const points=mode==="inset"
    ? [start,{x:start.x,y:routeY},{x:tip.x,y:routeY},{x:tip.x,y:tip.y+12}]
    : [start,{x:1020,y:start.y},{x:1020,y:routeY},{x:upward?tip.x:tip.x+14,y:routeY},...(upward?[{x:tip.x,y:tip.y+(mode==="tight"?9:12)}]:[])];
  const minX=Math.min(...points.map(p=>p.x),tip.x-14)-5;
  const minY=Math.min(...points.map(p=>p.y),tip.y-14)-5;
  const maxX=Math.max(...points.map(p=>p.x),tip.x+24)+5;
  const maxY=Math.max(...points.map(p=>p.y),tip.y+24)+5;
  const width=maxX-minX,height=maxY-minY;
  const d=points.map((p,i)=>`${i?"L":"M"} ${p.x-minX} ${p.y-minY}`).join(" ");
  const tx=tip.x-minX,ty=tip.y-minY;
  const head=upward
    ? `M ${tx} ${ty} L ${tx-10} ${ty+(mode==="tight"?12:20)} L ${tx+10} ${ty+(mode==="tight"?12:20)} Z`
    : `M ${tx} ${ty} L ${tx+20} ${ty-11} L ${tx+20} ${ty+11} Z`;
  const file=`direction-${pageId}-${n}.svg`;
  await fs.writeFile(path.join(images,file),`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${d}" fill="none" stroke="#ffffff" stroke-width="${mode==="tight"?5:9}" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#2B5734" stroke-width="${mode==="tight"?3:5}" stroke-linejoin="round"/><path d="${head}" fill="#2B5734"/></svg>`);
  const id=`direction-${n}`;doc.assets[id]={src:"images/"+file};
  doc.elements.push({id,type:"image",assetId:id,fit:"contain",frame:{x:minX,y:minY,width,height},altText:`Flèche reliant directement l’étape ${n} au contrôle ou au calendrier.`});
  return {n,points,tip};
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
   ["Enregistrer et vérifier","Cliquer « Enregistrer ». Attendre « Réservation modifiée » et vérifier le bloc au nouveau jour. Puis « Déconnexion »."]]},
 {id:"staff-gaps",title:"Admin — repérer les trous libres",role:"ADMIN",steps:[
   ["Lire la bonne journée","Vérifier la date et la baie. Blocs colorés = réservés ; espaces blancs = libres."],
   ["Trouver un trou assez long","Exemple : 12 h à 14 h, baie 2 = 2 h libres. Un trou de 1 h ne suffit pas pour 2 h."],
   ["Comparer les meilleurs choix","Côté client, les trous sont généralement mis dans « Meilleur choix ». Utiliser ces suggestions ou comparer ici."]]}
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
   const popup=await shot(doc,"date","calendar-popup",{x:1544,y:500,width:280,height:204},cropControl("date","calendar"));
   mark(doc,popup,"day");
   targets[1]=popup.box;
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
 if(p===6){
   const v=await shot(doc,"calendar-gaps","calendar-gaps",{x:96,y:274,width:900,height:716});
   targets.push(mark(doc,v,"date"),mark(doc,v,"gapTwo"),null);
   const other=mark(doc,v,"gapOther");
   const short=captures[v.name].controls.gapShort;
   const shortBox={x:v.box.x+short.x*v.scale,y:v.box.y+short.y*v.scale,width:short.width*v.scale,height:short.height*v.scale};
   doc.elements.push(rect("gap-short",shortBox,null,true));
   for(const [i,b,label] of [[1,targets[1],"2 h"],[2,other,"2 h"],[3,shortBox,"1 h"]]){
     doc.elements.push(txt(`gap-duration-${i}`,{x:b.x+8,y:b.y+(b.height-40)/2,width:b.width-16,height:40},label,14,{weight:700,color:i===3?"muted":"accent",align:"center"}));
   }
 }
 const rows=p===4?[{y:258,h:350},{y:610,h:216},{y:842,h:166}]:[{y:258,h:230},{y:504,h:230},{y:750,h:252}];
 if(p===4){page.steps[1][1]="« Vue calendrier » : choisir le jour avec les flèches.";page.steps[2][1]="Cliquer le bloc, puis « Modifier ».";}
 const routes=[];
 for(let n=0;n<3;n++){
   const mode=p===1&&n===1?"inset":p===1&&n===2?"below":p===5&&n===1?"tight":"right";
   const route=await connectedPointer(doc,page.id,n+1,targets[n],rows[n].y,mode);
   if(route)routes.push(route);
   step(doc,n+1,rows[n].y,rows[n].h,...page.steps[n],p===1&&n===1);
 }
 // Connector paths must not intersect: staff should follow a single unambiguous line.
 function intersects(a,b,c,d){
   const cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
   const within=(p,q,r)=>Math.min(p.x,q.x)<=r.x&&r.x<=Math.max(p.x,q.x)&&Math.min(p.y,q.y)<=r.y&&r.y<=Math.max(p.y,q.y);
   const x=cross(a,b,c),y=cross(a,b,d),u=cross(c,d,a),v=cross(c,d,b);
   return x*y<0&&u*v<0||x===0&&within(a,b,c)||y===0&&within(a,b,d)||u===0&&within(c,d,a)||v===0&&within(c,d,b);
 }
 for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++){
   const a=routes[i].points,b=routes[j].points;
   for(let x=1;x<a.length;x++)for(let z=1;z<b.length;z++)
     if(intersects(a[x-1],a[x],b[z-1],b[z]))throw new Error(`Crossing arrows on ${page.id}: ${routes[i].n}/${routes[j].n}`);
 }
 const foot=p===6?"Exemple fictif · Le trou doit être continu dans une seule baie.":p===5?"Après sauvegarde, vérifier le jour. Erreur ? Prévenir le responsable.":"Captures du site réel · Exemples fictifs : utiliser les informations du client.";
 doc.elements.push(txt("footer",{x:96,y:1015,width:1430,height:52},foot,14,{color:"muted"}));
 doc.elements.push(txt("pagination",{x:1600,y:1015,width:224,height:52},`PAGE ${p+1} / ${pages.length}`,15,{color:"muted",align:"right"}));
 await fs.writeFile(path.join(root,`src/data/slides/${page.id}.sdm.yaml`),YAML.stringify(doc,{lineWidth:0}));
 manifest.push({id:page.id,position:p+1,kind:"sdm",filepath:`src/data/slides/${page.id}.sdm.yaml`,title:page.title,description:"Guide imprimable avec contexte de page, flèches et trois repères uniques.",speakerNotes:""});
}
await fs.writeFile(path.join(root,"src/data/slides-manifest.json"),JSON.stringify(manifest,null,2)+"\n");
await fs.writeFile(path.join(root,"docs/approved-outline.json"),JSON.stringify(pages,null,2)+"\n");
console.log(`Built ${pages.length} pages: four client bookings, two login/edit, and a calendar-gap example.`);
