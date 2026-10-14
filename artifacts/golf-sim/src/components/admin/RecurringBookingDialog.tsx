import {useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import { seasonEnd } from "./seasonEnd";

type Preview={dates:string[];conflicts:string[];source:string};
const days=["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
export default function RecurringBookingDialog({date,onClose}:{date:string;onClose:()=>void}) {
 const cache=useQueryClient();
 const [form,setForm]=useState({start:date,end:seasonEnd(date),interval:1,days:new Date(date).getUTCDay()===2?[]:[new Date(date).getUTCDay()],time:"08:00",duration:"2h",bayType:"1",players:4,name:"",email:"",phone:"",notes:""});
 const [preview,setPreview]=useState<Preview|null>(null);
 const [done,setDone]=useState<string[]>([]);
 const [seriesId]=useState(()=>crypto.randomUUID());
 const [busy,setBusy]=useState(false);
 const [started,setStarted]=useState(false);
 const [error,setError]=useState("");
  const update=(key:string,value:unknown)=>{setForm(f=>({...f,[key]:value,...(key==="start"&&typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)?{end:seasonEnd(value)}:{})}));setPreview(null);setError("");};
 async function post(path:string,body:unknown){
  const response=await fetch(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const result=await response.json();
  if(!response.ok||!result.ok)throw new Error(result.message||"Impossible d’enregistrer. Réessayez.");
  return result;
 }
 async function check(){
  setBusy(true);setError("");
  try{setPreview(await post("/api/admin/bookings/recurrence-preview",form));}
  catch(e){setError((e as Error).message);}
  finally{setBusy(false);}
 }
 async function create(){
  if(!preview)return;
  setBusy(true);setStarted(true);setError("");
  let current="";
  try{
   for(const day of preview.dates.filter(d=>!done.includes(d))){
    current=day;
    await post("/api/admin/bookings",{...form,date:day,seriesId,source:preview.source});
    setDone(d=>[...d,day]);
   }
  }catch(e){setError(`Arrêt à la séance du ${current} : ${(e as Error).message} Les séances déjà confirmées sont conservées. « Continuer » réessaie uniquement les séances restantes.`);}
  finally{
   setBusy(false);
   for(const key of ["adminBookings","availability","optimized-slots","staff-availability"])cache.invalidateQueries({queryKey:[key]});
  }
 }
 const complete=!!preview&&done.length===preview.dates.length;
 return <Dialog open onOpenChange={v=>{if(!v&&!busy)onClose();}}>
  <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
   <DialogHeader><DialogTitle>Réservations récurrentes — ligue</DialogTitle><DialogDescription>Une séance par jour choisi, sur la même baie et à la même heure. Chaque séance pourra ensuite être modifiée ou annulée séparément.</DialogDescription></DialogHeader>
   <form className="space-y-4" onSubmit={e=>{e.preventDefault();check();}}>
    <fieldset disabled={busy||started} className="space-y-4 disabled:opacity-60">
     <div className="grid grid-cols-2 gap-3">
       {([["start","Date de début","date"],["end","Date de fin (30 avril)","date"],["time","Heure","time"],["name","Nom de la ligue / responsable","text"],["email","Courriel (facultatif)","email"],["phone","Téléphone (facultatif)","tel"]] as const).map(([key,label,type])=><div key={key}><Label htmlFor={`series-${key}`}>{label}</Label><Input id={`series-${key}`} type={type} readOnly={key==="end"} required={["start","end","time","name"].includes(key)} step={key==="time"?1800:undefined} value={form[key]} onChange={e=>update(key,e.target.value)}/></div>)}
      <div><Label htmlFor="series-duration">Durée</Label><select id="series-duration" className="w-full border rounded-md p-2" value={form.duration} onChange={e=>update("duration",e.target.value)}>{[1,2,3,4].map(n=><option key={n} value={`${n}h`}>{n} heure{n>1?"s":""}</option>)}</select></div>
      <div><Label htmlFor="series-bay">Baie</Label><select id="series-bay" className="w-full border rounded-md p-2" value={form.bayType} onChange={e=>update("bayType",e.target.value)}>{[1,2,3,4].map(n=><option key={n} value={n}>Baie {n}</option>)}</select></div>
      <div><Label htmlFor="series-players">Joueurs par séance</Label><Input id="series-players" type="number" min={1} max={4} required value={form.players} onChange={e=>update("players",Number(e.target.value))}/></div>
      <div><Label htmlFor="series-interval">Répéter toutes les</Label><select id="series-interval" className="w-full border rounded-md p-2" value={form.interval} onChange={e=>update("interval",Number(e.target.value))}>{[1,2,3,4].map(n=><option key={n} value={n}>{n} semaine{n>1?"s":""}</option>)}</select></div>
     </div>
     <fieldset><legend className="text-sm font-medium mb-2">Jours de la semaine</legend><div className="flex flex-wrap gap-3">{[1,2,3,4,5,6,0].map(d=><label key={d} className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.days.includes(d)} onChange={e=>update("days",e.target.checked?[...form.days,d]:form.days.filter(x=>x!==d))}/>{days[d]}</label>)}</div></fieldset>
     <div><Label htmlFor="series-notes">Notes (facultatif)</Label><Input id="series-notes" value={form.notes} onChange={e=>update("notes",e.target.value)}/></div>
     <p className="text-xs text-muted-foreground">Maximum un an et 104 séances. Heures locales du commerce. Vérification du calendrier Google avant création.</p>
     <Button type="submit" disabled={!form.days.length}>Vérifier les dates et les conflits</Button>
    </fieldset>
   </form>
   {busy&&<p role="status">Traitement en cours… Ne fermez pas cette fenêtre.</p>}
   {preview&&<div className="rounded-md border p-3 space-y-2">
    <p className="font-semibold">{preview.dates.length} séances prévues · {done.length} confirmées</p>
    <div className="max-h-36 overflow-auto text-sm">{preview.dates.map(d=><div key={d}>{d.split("-").reverse().join("/")} — {done.includes(d)?"Confirmée":preview.conflicts.includes(d)?"Indisponible (conflit ou horaire fermé)":"À créer"}</div>)}</div>
    {preview.conflicts.length>0?<p role="alert" className="text-red-700">Aucune création lancée : ajustez la période, l’heure ou la baie pour résoudre les dates indisponibles.</p>:!complete&&<Button onClick={create} disabled={busy}>{started?"Continuer les séances restantes":`Créer les ${preview.dates.length} réservations`}</Button>}
   </div>}
   {error&&<p role="alert" className="text-red-700 text-sm">{error}</p>}
   {complete&&<p role="status" className="text-green-800 font-semibold">Toutes les séances sont enregistrées dans le calendrier sélectionné.</p>}
   <Button variant="outline" disabled={busy} onClick={onClose}>{complete?"Terminer":"Fermer"}</Button>
  </DialogContent>
 </Dialog>;
}
