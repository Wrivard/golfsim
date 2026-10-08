import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import YAML from "yaml";

const root=path.resolve("artifacts/staff-booking-guide");
const directory=path.join(root,"public/images");
const captures=JSON.parse(await fs.readFile(path.join(directory,"capture-metadata.json"),"utf8"));
const theme={colors:{background:"#F7F3E8",foreground:"#1B1A18",accent:"#2B5734",surface:"#FFFFFF",muted:"#70695C"},fonts:{display:"Oswald",body:"DM Sans"}};
const token=token=>({kind:"token",token});
const fill=color=>({kind:"solid",color:token(color)});
function shape(id,frame,preset="rect",color="surface",stroke=false){
  return {id,type:"shape",frame,geometry:{kind:"preset",preset,...(preset==="roundRect"?{cornerRadius:8}:{})},
    fill:color?fill(color):{kind:"none"},...(stroke?{stroke:{color:token("accent"),widthPt:2.5}}:{})};
}
function text(id,frame,value,size=20,{color="foreground",weight=400,font="body",align="left",lineHeight=1.2}={}){
  return {id,type:"text",frame,body:{paragraphs:[{runs:[{text:value}],defaultRunStyle:{font:token(font),sizePt:size,weight,color:token(color)},align,lineHeight,spaceAfterPt:0}]}};
}
function near(name,key,padX=8,padY=8){
  const m=captures[name],b=m.controls[key];
  const left=Math.max(0,Math.floor(b.x-padX)),top=Math.max(0,Math.floor(b.y-padY));
  return {left,top,width:Math.min(m.width-left,Math.ceil(b.x+b.width+padX)-left),height:Math.min(m.height-top,Math.ceil(b.y+b.height+padY)-top)};
}
async function screenshot(doc,id,name,crop,frame,highlight=null){
  const file=`simple-${id}.png`;
  await sharp(path.join(directory,captures[name].file)).extract(crop).png().toFile(path.join(directory,file));
  const scale=Math.min(frame.width/crop.width,frame.height/crop.height);
  const width=crop.width*scale,height=crop.height*scale;
  const x=frame.x+(frame.width-width)/2,y=frame.y+(frame.height-height)/2;
  doc.assets[id]={src:"images/"+file};
  doc.elements.push(shape(id+"-background",{x:x-4,y:y-4,width:width+8,height:height+8}));
  doc.elements.push({id:"image-"+id,type:"image",assetId:id,fit:"contain",frame:{x,y,width,height},altText:"Capture réelle de Golf SIM ; exemple fictif."});
  if(highlight){
    const b=typeof highlight==="string"?captures[name].controls[highlight]:highlight;
    const x0=Math.max(b.x,crop.left),y0=Math.max(b.y,crop.top);
    const x1=Math.min(b.x+b.width,crop.left+crop.width),y1=Math.min(b.y+b.height,crop.top+crop.height);
    const box={x:x+(x0-crop.left)*scale-6,y:y+(y0-crop.top)*scale-6,width:(x1-x0)*scale+12,height:(y1-y0)*scale+12};
    doc.elements.push(shape(id+"-target",box,"roundRect",null,true));
    return box;
  }
  return {x,y,width,height};
}
function instruction(doc,n,y,height,title,body,target){
  // The instruction number is authored ONCE, beside its text, never inside a capture.
  const cy=y+height/2;
  doc.elements.push(shape(`step-${n}-badge`,{x:1040,y:cy-37,width:74,height:74},"ellipse","accent"));
  doc.elements.push(text(`step-${n}-number`,{x:1040,y:cy-27,width:74,height:56},String(n),24,{color:"surface",weight:700,align:"center",lineHeight:1.05}));
  doc.elements.push(text(`step-${n}-title`,{x:1140,y:y+4,width:684,height:64},title,24,{weight:700,lineHeight:1.1}));
  doc.elements.push(text(`step-${n}-body`,{x:1140,y:y+68,width:684,height:height-68},body,20));
  if(target){
    const left=target.x+target.width+14;
    const width=Math.max(18,1026-left);
    doc.elements.push(shape(`step-${n}-arrow`,{x:left,y:target.y+target.height/2-12,width,height:24},"leftArrow","accent"));
  }
}
const pages=[
  {id:"client-start",title:"Client — choisir le créneau",chapter:"CLIENT",steps:[
    ["Choisir la durée","Cliquer sur « RÉSERVER », puis choisir 1, 2, 3 ou 4 heures."],
    ["Choisir la date","Cliquer sur la date, puis choisir le jour dans le calendrier."],
    ["Choisir l’heure","Cliquer sur une heure disponible. Sinon, essayer une autre date."]]},
  {id:"client-details",title:"Client — entrer les coordonnées",chapter:"CLIENT",steps:[
    ["Nom et courriel","Entrer le nom complet et l’adresse courriel du client."],
    ["Choisir les joueurs","Choisir de 1 à 4 joueurs. Téléphone et notes : facultatifs."],
    ["Continuer","Cocher les conditions, puis cliquer sur le bouton vert."]]},
  {id:"client-confirm",title:"Client — confirmer la réservation",chapter:"CLIENT",steps:[
    ["Vérifier","Relire date, heure, durée et nom. Corriger avec « Retour »."],
    ["Confirmer","Cliquer une seule fois sur « Confirmer » et attendre."],
    ["Vérifier le succès","Attendre « Réservation Confirmée ! » et noter la baie. Paiement sur place."]]},
  {id:"staff-login",title:"Admin — ouvrir une réservation",chapter:"ADMIN",steps:[
    ["Connexion /login","Identifiant : ______________\nMot de passe : ______________\nPuis « Se connecter »."],
    ["Afficher le bon jour","Utiliser les flèches pour afficher la date demandée."],
    ["Ouvrir le formulaire","Cliquer sur « Ajouter », dans la barre du calendrier."]]},
  {id:"staff-save",title:"Admin — remplir la réservation",chapter:"ADMIN",steps:[
    ["Date et heure","Choisir la date et l’heure demandées par le client."],
    ["Durée, baie, joueurs","Choisir 1 à 4 heures, la baie et le nombre de joueurs (1 à 4)."],
    ["Nom du client","Entrer le nom. Courriel, téléphone et notes sont facultatifs."]]},
  {id:"staff-check",title:"Admin — enregistrer et vérifier",chapter:"ADMIN",steps:[
    ["Enregistrer","Cliquer une seule fois sur « Ajouter la réservation » et attendre."],
    ["Vérifier l’ajout","Attendre « Réservation ajoutée », puis ouvrir son bloc dans le calendrier."],
    ["Contrôler et sortir","Relire nom, date, heure, durée, baie et joueurs. Puis « Déconnexion »."]]}
];
const manifest=[];
for(let p=0;p<pages.length;p++){
  const page=pages[p];
  const doc={format:"replit.sdm",version:1,size:{width:1920,height:1080},background:fill("background"),theme,assets:{},elements:[]};
  doc.elements.push(text("brand",{x:96,y:64,width:1380,height:56},"GOLF SIM · GUIDE DE RÉSERVATION",16,{color:"accent",weight:700}));
  doc.elements.push(text("chapter",{x:1560,y:64,width:264,height:56},page.chapter,16,{color:"accent",weight:700,align:"right"}));
  doc.elements.push(text("title",{x:96,y:129,width:1728,height:118},page.title,38,{font:"display",weight:700,lineHeight:1.1}));
  doc.elements.push(shape("header-rule",{x:96,y:239,width:1728,height:4},"rect","accent"));
  const rows=p===4?[{y:258,h:184},{y:456,h:282},{y:752,h:238}]:[{y:258,h:238},{y:504,h:238},{y:750,h:238}];
  for(let r=0;r<3;r++){
    const {y,h}=rows[r],id=`p${p+1}-r${r+1}`;
    const frame={x:96,y:y+8,width:900,height:h-20};
    let target=null;
    if(p===0&&r===0){
      target=await screenshot(doc,id,"client-duration",near("client-duration","duration",12,12),frame,"duration");
    } else if(p===0&&r===1){
      await screenshot(doc,id+"-date","client-time",near("client-time","date"),{x:96,y:y+40,width:448,height:146},"date");
      const b=captures["client-date"].controls.day;
      target=await screenshot(doc,id+"-calendar","client-date",{left:Math.floor(b.x-89),top:Math.floor(b.y-89),width:267,height:267},{x:572,y:y+8,width:310,height:218},"day");
    } else if(p===0&&r===2){
      target=await screenshot(doc,id,"client-time",near("client-time","time"),frame,"time");
    } else if(p===1&&r===0){
      await screenshot(doc,id+"-name","client-details",{left:0,top:0,width:500,height:145},{x:96,y:y+20,width:430,height:184},"name");
      target=await screenshot(doc,id+"-email","client-details",{left:0,top:176,width:500,height:145},{x:566,y:y+20,width:430,height:184},{x:0,y:224,width:500,height:88});
    } else if(p===1&&r===1){
      target=await screenshot(doc,id,"client-details",{left:0,top:532,width:896,height:154},frame,"players");
    } else if(p===1&&r===2){
      target=await screenshot(doc,id,"client-details",{left:0,top:935,width:896,height:245},frame,{x:0,y:955,width:896,height:225});
    } else if(p===2&&r===0){
      target=await screenshot(doc,id,"client-review",{left:130,top:22,width:650,height:280},frame);
    } else if(p===2&&r===1){
      target=await screenshot(doc,id,"client-review",near("client-review","confirm",8,8),frame,"confirm");
    } else if(p===2&&r===2){
      await screenshot(doc,id+"-success","client-success",near("client-success","success",0,8),{x:96,y:y+20,width:900,height:82},"success");
      target=await screenshot(doc,id+"-bay","client-success",near("client-success","bay",0,8),{x:96,y:y+122,width:900,height:82},"bay");
    } else if(p===3&&r===0){
      // Only the sign-in button is shown: no demo identifier or password is presented as real.
      target=await screenshot(doc,id,"staff-login",near("staff-login","login"),frame,"login");
    } else if(p===3&&r===1){
      target=await screenshot(doc,id,"staff-calendar",{left:1700,top:20,width:480,height:110},frame);
    } else if(p===3&&r===2){
      target=await screenshot(doc,id,"staff-calendar",near("staff-calendar","add"),frame,"add");
    } else if(p===4&&r===0){
      target=await screenshot(doc,id,"staff-form",{left:30,top:208,width:964,height:144},frame,{x:50,y:258,width:924,height:72});
    } else if(p===4&&r===1){
      target=await screenshot(doc,id,"staff-form",{left:30,top:398,width:964,height:320},frame,{x:50,y:448,width:924,height:250});
    } else if(p===4&&r===2){
      target=await screenshot(doc,id,"staff-form",{left:30,top:735,width:964,height:150},frame,"name");
    } else if(p===5&&r===0){
      target=await screenshot(doc,id,"staff-form",near("staff-form","save"),frame,"save");
    } else if(p===5&&r===1){
      const b=captures["staff-saved"].controls.booking;
      target=await screenshot(doc,id,"staff-saved",{left:Math.floor(b.x-30),top:Math.floor(b.y-42),width:548,height:150},frame,"booking");
    } else if(p===5&&r===2){
      await screenshot(doc,id+"-details","staff-details",{left:36,top:220,width:952,height:236},{x:96,y:y+8,width:560,height:218});
      target=await screenshot(doc,id+"-logout","staff-logout",near("staff-logout","logout"),{x:696,y:y+50,width:300,height:132},"logout");
    }
    instruction(doc,r+1,y,h,page.steps[r][0],page.steps[r][1],target);
    if(r<2)doc.elements.push(shape("row-rule-"+r,{x:96,y:y+h+4,width:1728,height:1},"rect","muted"));
  }
  const foot=p===5?"Erreur à l’enregistrement ? Prévenir le responsable. Paiement sur place.":"Exemples fictifs : utiliser la date et les informations du client.";
  doc.elements.push(text("footer",{x:96,y:1015,width:1430,height:52},foot,15,{color:"muted"}));
  doc.elements.push(text("pagination",{x:1600,y:1015,width:224,height:52},`PAGE ${p+1} / 6`,15,{color:"muted",align:"right"}));
  await fs.writeFile(path.join(root,`src/data/slides/${page.id}.sdm.yaml`),YAML.stringify(doc,{lineWidth:0}));
  manifest.push({id:page.id,position:p+1,kind:"sdm",filepath:`src/data/slides/${page.id}.sdm.yaml`,title:page.title,description:"Guide simplifié : trois actions, avec chaque numéro une seule fois à côté de son texte.",speakerNotes:""});
}
await fs.writeFile(path.join(root,"src/data/slides-manifest.json"),JSON.stringify(manifest,null,2)+"\n");
await fs.writeFile(path.join(root,"docs/approved-outline.json"),JSON.stringify(pages.map(p=>[p.title,p.steps.map(([a,b])=>a+" — "+b)]),null,2)+"\n");
console.log("Built 6 pages: 3 client + 3 admin; exactly one 1, 2 and 3 per page.");
