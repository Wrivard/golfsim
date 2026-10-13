import {useEffect, useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import type {BookingSeriesPreview} from "@workspace/api-client-react";

export default function DeleteSeriesDialog({seriesId,onClose,onDeleted}:{seriesId:string;onClose:()=>void;onDeleted:()=>void}) {
  const queryClient=useQueryClient();
  const [preview,setPreview]=useState<BookingSeriesPreview|null>(null);
  const [removed,setRemoved]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const path=`/api/admin/booking-series/${encodeURIComponent(seriesId)}`;
  useEffect(()=>{
    let cancelled=false;
    fetch(path).then(async response=>{
      const data=await response.json();
      if(!response.ok) throw new Error(data.message||"Impossible de consulter la série.");
      if(!cancelled)setPreview(data);
    }).catch(e=>{if(!cancelled)setError(e.message);});
    return ()=>{cancelled=true;};
  },[path]);
  async function remove() {
    if(!preview)return;
    setBusy(true);setError("");
    let done=[...removed];
    const remaining=preview.reservations.filter(b=>!done.includes(b.id));
    try {
      for(let i=0;i<remaining.length;i+=8) {
        const response=await fetch(path,{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({source:preview.source,ids:remaining.slice(i,i+8).map(b=>b.id)})});
        const data=await response.json();
        if(!response.ok)throw new Error(data.message||"Suppression interrompue.");
        done=[...new Set([...done,...data.deletedIds])];setRemoved(done);
        if(!data.complete)throw new Error("Suppression interrompue par une erreur Calendar ou de sauvegarde. Les séances restantes sont conservées. Vous pouvez réessayer.");
      }
    } catch(e) {setError(e instanceof Error?e.message:"Suppression interrompue. Vous pouvez réessayer.");}
    finally {await queryClient.invalidateQueries({queryKey:["adminBookings"]});setBusy(false);}
  }
  const complete=!!preview&&removed.length===preview.reservations.length;
  return <Dialog open onOpenChange={open=>{if(!open&&!busy){if(complete)onDeleted();else onClose();}}}>
    <DialogContent className="max-w-lg" onEscapeKeyDown={e=>{if(busy)e.preventDefault();}} onPointerDownOutside={e=>{if(busy)e.preventDefault();}}>
      <DialogHeader><DialogTitle>Supprimer toute la série</DialogTitle><DialogDescription>Cette action supprime les séances listées du site et du calendrier Google sélectionné. Elle est irréversible et inclut les séances passées de cette série.</DialogDescription></DialogHeader>
      {!preview&&!error&&<p role="status">Chargement des séances…</p>}
      {preview&&<>
        <p className="font-semibold">{preview.reservations.length} séances concernées · {removed.length} supprimées · {preview.reservations.length-removed.length} restantes</p>
        <div className="max-h-52 overflow-auto border rounded p-3 text-sm space-y-2">{preview.reservations.map(b=><div key={b.id}>{b.date.split("-").reverse().join("/")} à {b.time} · Baie {b.bayType}{removed.includes(b.id)?" — supprimée":""}</div>)}</div>
      </>}
      {error&&<p role="alert" className="text-red-700">{error}</p>}
      {busy&&<p role="status">Suppression en cours… Ne fermez pas cette fenêtre.</p>}
      {complete&&<p role="status" className="text-green-800">Toutes les séances listées ont été supprimées.</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={busy} onClick={()=>complete?onDeleted():onClose()}>{complete?"Terminer":"Annuler / Fermer"}</Button>
        {!complete&&<Button variant="destructive" disabled={busy||!preview||!preview.reservations.length} onClick={remove} data-testid="confirm-delete-series">{busy?"Suppression…":removed.length?"Réessayer les séances restantes":"Confirmer la suppression de toute la série"}</Button>}
      </div>
    </DialogContent>
  </Dialog>;
}
