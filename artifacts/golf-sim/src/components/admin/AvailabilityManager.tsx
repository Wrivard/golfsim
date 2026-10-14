import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetAdminClosures,
  useCreateClosure,
  useUpdateClosure,
  useDeleteClosure,
  getGetAdminClosuresQueryKey,
  getGetPublicClosuresQueryKey,
  ClosureInputKind,
  type AvailabilityClosure,
  type ClosureInput,
  type ClosureConflict,
} from "@workspace/api-client-react";
import { AlertTriangle, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

type BayId = "1" | "2" | "3" | "4";
const BAYS: BayId[] = ["1", "2", "3", "4"];
const EPOCH = "1900-01-01";

const toTime = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
};
const describeClosure = (c: AvailabilityClosure) => {
  if (c.kind === "online_until") return `Réservations en ligne bloquées jusqu'au ${fmtDate(c.endDate)} inclus`;
  const dates = c.startDate === c.endDate ? fmtDate(c.startDate) : `${fmtDate(c.startDate)} au ${fmtDate(c.endDate)}`;
  const hours = c.startMinute === 0 && c.endMinute === 1440 ? "journée complète" : `${toTime(c.startMinute)} - ${c.endMinute === 1440 ? "24:00" : toTime(c.endMinute)}`;
  return `${dates}, ${hours}`;
};

function errorInfo(e: unknown): { message: string; conflicts: ClosureConflict["conflicts"] } {
  const err = e as { data?: Partial<ClosureConflict> | null; message?: string };
  return {
    message: err?.data?.message || err?.message || "Une erreur est survenue. Réessayez.",
    conflicts: Array.isArray(err?.data?.conflicts) ? err!.data!.conflicts! : [],
  };
}

type Form = { title: string; startDate: string; endDate: string; fullDay: boolean; start: string; end: string; bays: BayId[] };
const emptyForm: Form = { title: "", startDate: "", endDate: "", fullDay: true, start: "08:00", end: "12:00", bays: [...BAYS] };

export default function AvailabilityManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useGetAdminClosures({ query: { queryKey: getGetAdminClosuresQueryKey(), refetchInterval: 30000 } });
  const closures = list.data?.closures ?? [];
  const physical = closures.filter((c) => c.kind === "physical").sort((a, b) => a.startDate.localeCompare(b.startDate));
  const cutoff = closures.find((c) => c.kind === "online_until");

  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [cutoffDate, setCutoffDate] = useState("");
  const [cutoffTitle, setCutoffTitle] = useState("");
  const [err, setErr] = useState<ReturnType<typeof errorInfo> | null>(null);
  const [toDelete, setToDelete] = useState<AvailabilityClosure | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getGetAdminClosuresQueryKey() });
    qc.invalidateQueries({ queryKey: getGetPublicClosuresQueryKey() });
    for (const k of ["adminBookings", "availability", "optimized-slots", "staff-availability"]) {
      qc.invalidateQueries({ queryKey: [k] });
    }
  };

  const create = useCreateClosure();
  const update = useUpdateClosure();
  const del = useDeleteClosure();
  const busy = create.isPending || update.isPending || del.isPending;

  const submit = (id: string | null, data: ClosureInput, done: () => void, okTitle: string) => {
    setErr(null);
    const opts = {
      onSuccess: () => { refresh(); done(); toast({ title: okTitle }); },
      onError: (e: unknown) => setErr(errorInfo(e)),
    };
    if (id) update.mutate({ id, data }, opts);
    else create.mutate({ data }, opts);
  };

  const openNew = () => { setEditing(null); setForm({ ...emptyForm }); setErr(null); };
  const openEdit = (c: AvailabilityClosure) => {
    setEditing(c.id); setErr(null);
    const full = c.startMinute === 0 && c.endMinute === 1440;
    setForm({
      title: c.title, startDate: c.startDate, endDate: c.endDate, fullDay: full,
      start: toTime(c.startMinute), end: c.endMinute === 1440 ? "23:59" : toTime(c.endMinute),
      bays: c.bayIds as BayId[],
    });
  };

  const formError = (): string | null => {
    if (!form) return null;
    if (!form.title.trim()) return "Indiquez un motif.";
    if (!form.startDate || !form.endDate) return "Indiquez les dates.";
    if (form.endDate < form.startDate) return "La date de fin précède la date de début.";
    if (!form.bays.length) return "Sélectionnez au moins une baie.";
    if (!form.fullDay) {
      if (form.startDate !== form.endDate) return "Une fermeture partielle doit tenir sur une seule journée.";
      if (!form.start || !form.end || toMin(form.end) <= toMin(form.start)) return "L'heure de fin doit suivre l'heure de début.";
    }
    return null;
  };

  const savePhysical = () => {
    if (!form) return;
    const msg = formError();
    if (msg) { setErr({ message: msg, conflicts: [] }); return; }
    submit(editing, {
      kind: ClosureInputKind.physical,
      title: form.title.trim(),
      startDate: form.startDate,
      endDate: form.fullDay ? form.endDate : form.startDate,
      startMinute: form.fullDay ? 0 : toMin(form.start),
      endMinute: form.fullDay ? 1440 : toMin(form.end),
      bayIds: form.bays,
    }, () => { setForm(null); setEditing(null); }, editing ? "Fermeture modifiée" : "Fermeture ajoutée");
  };

  const saveCutoff = () => {
    if (!cutoffDate) { setErr({ message: "Indiquez la date limite.", conflicts: [] }); return; }
    submit(cutoff?.id ?? null, {
      kind: ClosureInputKind.online_until,
      title: cutoffTitle.trim() || "Réservations en ligne suspendues",
      startDate: EPOCH, endDate: cutoffDate, startMinute: 0, endMinute: 1440, bayIds: [...BAYS],
    }, () => { setCutoffDate(""); setCutoffTitle(""); }, "Restriction en ligne enregistrée");
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    del.mutate({ id: toDelete.id }, {
      onSuccess: () => { refresh(); setToDelete(null); toast({ title: "Réouverture confirmée" }); },
      onError: (e) => { setToDelete(null); setErr(errorInfo(e)); },
    });
  };

  const toggleBay = (b: BayId) => form && setForm({ ...form, bays: form.bays.includes(b) ? form.bays.filter((x) => x !== b) : [...form.bays, b].sort() as BayId[] });

  return (
    <div className="space-y-8" data-testid="availability-manager">
      <div className="flex gap-3 border-2 border-foreground bg-accent/20 p-4" role="note">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed">
          <strong>Fermeture physique :</strong> elle bloque les baies choisies pour le public ET pour le personnel (calendrier admin).{" "}
          <strong>Restriction en ligne :</strong> elle ne bloque que les réservations du site public; le personnel peut toujours réserver.
          Si des réservations existent déjà sur la période, vous devez d'abord les déplacer ou les supprimer.
        </p>
      </div>

      {err && (
        <div className="border-2 border-destructive bg-destructive/10 p-4" role="alert" data-testid="closure-error">
          <p className="font-bold text-sm">{err.message}</p>
          {err.conflicts.length > 0 && (
            <>
              <p className="text-sm mt-2">Réservations en conflit à résoudre avant de réessayer :</p>
              <ul className="mt-1 text-sm list-disc pl-5">
                {err.conflicts.map((c) => (
                  <li key={c.id}>{c.name} - {fmtDate(c.date)} à {c.time} - Baie {c.bayType}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {list.isError && (
        <div className="border-2 border-destructive p-4 flex items-center justify-between gap-4" role="alert">
          <span className="text-sm font-bold">Impossible de charger les fermetures.</span>
          <Button size="sm" variant="outline" onClick={() => list.refetch()} data-testid="button-retry-closures">Réessayer</Button>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="text-xl">Restriction en ligne seulement</h3>
        {list.isLoading ? <Skeleton className="h-16 w-full" /> : cutoff ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-4" data-testid="cutoff-current">
            <div>
              <p className="font-bold">{describeClosure(cutoff)}</p>
              <p className="text-sm text-muted-foreground">{cutoff.title}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => { setCutoffDate(cutoff.endDate); setCutoffTitle(cutoff.title); }} data-testid="button-edit-cutoff"><Pencil className="h-4 w-4 mr-1" />Modifier</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => setToDelete(cutoff)} data-testid="button-delete-cutoff"><Trash2 className="h-4 w-4 mr-1" />Retirer</Button>
            </div>
          </div>
        ) : <p className="text-sm text-muted-foreground">Aucune restriction : les réservations en ligne suivent l'horaire normal.</p>}
        <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-3 items-end">
          <div><Label htmlFor="cutoff-date">Bloqué en ligne jusqu'au (inclus)</Label><Input id="cutoff-date" type="date" value={cutoffDate} onChange={(e) => setCutoffDate(e.target.value)} data-testid="input-cutoff-date" /></div>
          <div><Label htmlFor="cutoff-title">Motif (facultatif)</Label><Input id="cutoff-title" maxLength={200} value={cutoffTitle} onChange={(e) => setCutoffTitle(e.target.value)} data-testid="input-cutoff-title" /></div>
          <Button disabled={busy} onClick={saveCutoff} data-testid="button-save-cutoff">{cutoff ? "Mettre à jour" : "Appliquer"}</Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl">Fermetures physiques</h3>
          {!form && <Button onClick={openNew} data-testid="button-add-closure"><Plus className="h-4 w-4 mr-1" />Ajouter</Button>}
        </div>

        {form && (
          <div className="border-2 border-foreground p-4 space-y-4" data-testid="closure-form">
            <div><Label htmlFor="c-title">Motif</Label><Input id="c-title" maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} data-testid="input-closure-title" /></div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label htmlFor="c-start">Date de début</Label><Input id="c-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.fullDay ? form.endDate : e.target.value })} data-testid="input-closure-start" /></div>
              <div><Label htmlFor="c-end">Date de fin (incluse)</Label><Input id="c-end" type="date" disabled={!form.fullDay} value={form.fullDay ? form.endDate : form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} data-testid="input-closure-end" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={form.fullDay} onChange={(e) => setForm({ ...form, fullDay: e.target.checked })} data-testid="checkbox-full-day" />
              Journée complète
            </label>
            {!form.fullDay && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label htmlFor="c-from">De</Label><Input id="c-from" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} data-testid="input-closure-from" /></div>
                <div><Label htmlFor="c-to">À</Label><Input id="c-to" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} data-testid="input-closure-to" /></div>
              </div>
            )}
            <div>
              <Label>Baies fermées</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {BAYS.map((b) => (
                  <Button key={b} type="button" size="sm" variant={form.bays.includes(b) ? "default" : "outline"} aria-pressed={form.bays.includes(b)} onClick={() => toggleBay(b)} data-testid={`toggle-bay-${b}`}>Baie {b}</Button>
                ))}
                <Button type="button" size="sm" variant="ghost" onClick={() => setForm({ ...form, bays: [...BAYS] })} data-testid="button-all-bays">Toutes</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button disabled={busy} onClick={savePhysical} data-testid="button-save-closure">{busy ? "Enregistrement..." : editing ? "Enregistrer" : "Ajouter la fermeture"}</Button>
              <Button variant="outline" disabled={busy} onClick={() => { setForm(null); setEditing(null); setErr(null); }} data-testid="button-cancel-closure">Annuler</Button>
            </div>
          </div>
        )}

        {list.isLoading ? (
          <div className="space-y-2"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
        ) : physical.length === 0 ? (
          <p className="border-2 border-dashed border-foreground/30 p-6 text-center text-sm text-muted-foreground" data-testid="closures-empty">Aucune fermeture physique planifiée.</p>
        ) : (
          <ul className="space-y-2">
            {physical.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-2 border-foreground p-4" data-testid={`closure-${c.id}`}>
                <div>
                  <p className="font-bold">{c.title}</p>
                  <p className="text-sm">{describeClosure(c)}</p>
                  <p className="text-sm text-muted-foreground">Baies : {c.bayIds.join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => openEdit(c)} data-testid={`button-edit-closure-${c.id}`}><Pencil className="h-4 w-4 mr-1" />Modifier</Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setToDelete(c)} data-testid={`button-delete-closure-${c.id}`}><Trash2 className="h-4 w-4 mr-1" />Rouvrir</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && !del.isPending && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rouvrir ces plages ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete ? describeClosure(toDelete) : ""}. Les créneaux redeviendront réservables immédiatement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={del.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={del.isPending} onClick={(e) => { e.preventDefault(); confirmDelete(); }} data-testid="button-confirm-reopen">{del.isPending ? "Suppression..." : "Confirmer"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
