import { useMemo, useState } from "react";
import { useGetEmailContacts, getGetEmailContactsQueryKey, exportEmailContacts,
  useRecordStaffWithdrawal, previewHistoricalContacts, importHistoricalContacts,
  type HistoricalContactPreview, type EmailContact } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-CA") : "-");

export default function EmailContactBank() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const withdrawal = useRecordStaffWithdrawal();
  const [withdrawTarget, setWithdrawTarget] = useState<EmailContact | null>(null);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<HistoricalContactPreview | null>(null);
  const q = useGetEmailContacts({ query: { queryKey: getGetEmailContactsQueryKey(), refetchInterval: 30000 } });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<null | "all" | "marketing" | "preview" | "import">(null);
  const contacts = q.data?.contacts ?? [];
  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? contacts.filter((c) => `${c.email} ${c.name} ${c.source}`.toLowerCase().includes(s)) : contacts;
  }, [contacts, search]);
  const optedIn = contacts.filter((c) => c.marketingConsent && !c.withdrawnAt).length;
  const refresh = () => qc.invalidateQueries({ queryKey: getGetEmailContactsQueryKey() });

  const recordWithdrawal = async () => {
    if (!withdrawTarget) return;
    try {
      await withdrawal.mutateAsync({ data: { email: withdrawTarget.email, reason: reason.trim() } });
      await refresh();
      setWithdrawTarget(null);
      toast({ title: "Retrait du consentement enregistré" });
    } catch {
      toast({ title: "Retrait non enregistré", description: "Réessayez. Le contact n'a pas été modifié dans l'affichage.", variant: "destructive" });
    }
  };
  const analyzeHistory = async () => {
    setBusy("preview");
    try { setPreview(await previewHistoricalContacts()); }
    catch { toast({ title: "Analyse indisponible", description: "Vérifiez la connexion du calendrier. Aucun import effectué.", variant: "destructive" }); }
    finally { setBusy(null); }
  };
  const approveHistory = async () => {
    if (!preview) return;
    setBusy("import");
    try {
      const result = await importHistoricalContacts({ fingerprint: preview.fingerprint, confirmed: true });
      await refresh(); setPreview(null);
      toast({ title: `${result.imported} contact(s) importé(s) sans consentement marketing` });
    } catch {
      toast({ title: "Import non confirmé", description: "Relancez l'analyse avant de réessayer.", variant: "destructive" });
      setPreview(null);
    } finally { setBusy(null); }
  };

  const download = async (marketingOnly: boolean) => {
    setBusy(marketingOnly ? "marketing" : "all");
    try {
      let text = await exportEmailContacts({ marketingOnly });
      if (!text.startsWith("\uFEFF")) text = "\uFEFF" + text;
      const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = marketingOnly ? "contacts-marketing.csv" : "contacts-tous.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Échec de l'exportation", description: "Réessayez dans un instant.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6" data-testid="email-contact-bank">
      <div className="border-2 border-foreground bg-accent/20 p-4 text-sm leading-relaxed">
        Les adresses d'origine historique non vérifiée ne sont pas importées automatiquement et aucun consentement n'est présumé :
        seuls les contacts ayant coché la case marketing facultative sont exportés dans le fichier marketing. Aucune campagne n'est envoyée depuis cet outil.
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Button disabled={busy !== null} onClick={() => download(false)} data-testid="button-export-all"><Download className="h-4 w-4 mr-2" />{busy === "all" ? "Préparation..." : "Exporter en CSV"}</Button>
        <Button variant="outline" disabled={busy !== null} onClick={() => download(true)} data-testid="button-export-marketing"><Download className="h-4 w-4 mr-2" />{busy === "marketing" ? "Préparation..." : "CSV marketing seulement"}</Button>
        <Button variant="outline" disabled={busy !== null} onClick={analyzeHistory} data-testid="button-preview-historical-contacts">{busy === "preview" ? "Vérification Google..." : "Analyser les réservations historiques"}</Button>
        <span className="text-sm text-muted-foreground">Les exports sont toujours complets, indépendamment de la recherche.</span>
      </div>

      <div className="relative max-w-sm">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Filtrer l'affichage" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-contact-search" />
      </div>

      {q.isLoading ? (
        <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : q.isError ? (
        <div className="border-2 border-destructive p-4 flex items-center justify-between gap-4" role="alert">
          <span className="text-sm font-bold">Impossible de charger les contacts.</span>
          <Button size="sm" variant="outline" onClick={() => q.refetch()} data-testid="button-retry-contacts">Réessayer</Button>
        </div>
      ) : (
        <>
          <p className="text-sm" data-testid="text-contact-count">{contacts.length} contact(s) - {optedIn} avec consentement marketing actif{search && ` - ${shown.length} affiché(s)`}</p>
          {shown.length === 0 ? (
            <p className="border-2 border-dashed border-foreground/30 p-6 text-center text-sm text-muted-foreground" data-testid="contacts-empty">Aucun contact à afficher.</p>
          ) : (
            <div className="overflow-x-auto border-2 border-foreground">
              <table className="w-full text-sm">
                <thead className="bg-foreground text-background text-left">
                  <tr>{["Courriel", "Nom", "Source", "Statut", "Consentement", "Retrait", "Action"].map((h) => <th key={h} className="p-2 font-bold whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {shown.map((c) => {
                    const status = c.withdrawnAt ? "Retiré" : c.marketingConsent ? "Consenti" : "Sans consentement";
                    return (
                      <tr key={c.email} className="border-t border-foreground/20" data-testid={`row-contact-${c.email}`}>
                        <td className="p-2 break-all">{c.email}</td>
                        <td className="p-2">{c.name}</td>
                        <td className="p-2">{c.source}</td>
                        <td className="p-2 font-bold whitespace-nowrap">{status}</td>
                        <td className="p-2 whitespace-nowrap">{fmt(c.consentAt)}</td>
                        <td className="p-2 whitespace-nowrap">{fmt(c.withdrawnAt)}</td>
                        <td className="p-2">{c.marketingConsent && !c.withdrawnAt && (
                          <Button size="sm" variant="outline" onClick={() => { setWithdrawTarget(c); setReason(""); }}
                            data-testid="button-record-contact-withdrawal">Retirer le consentement</Button>
                        )}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <Dialog open={withdrawTarget !== null} onOpenChange={open => { if (!open && !withdrawal.isPending) setWithdrawTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer une demande de retrait</DialogTitle>
            <DialogDescription>Uniquement si le client vous a demandé de ne plus recevoir de promotions. Ses réservations et courriels de confirmation ne seront pas annulés.</DialogDescription>
          </DialogHeader>
          <p className="text-sm break-all">{withdrawTarget?.email}</p>
          <Label htmlFor="withdrawal-reason">Comment la demande a-t-elle été reçue ?</Label>
          <Input id="withdrawal-reason" value={reason} onChange={e => setReason(e.target.value)}
            maxLength={500} placeholder="Ex. : demande du client par téléphone" />
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" disabled={withdrawal.isPending} onClick={() => setWithdrawTarget(null)}>Annuler</Button>
            <Button disabled={withdrawal.isPending || reason.trim().length < 5} onClick={recordWithdrawal}
              data-testid="button-confirm-contact-withdrawal">{withdrawal.isPending ? "Enregistrement..." : "Confirmer le retrait"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={preview !== null} onOpenChange={open => { if (!open && busy !== "import") setPreview(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import historique — prévisualisation</DialogTitle>
            <DialogDescription>Seul le calendrier actuellement connecté est analysé. La preuve doit être l'identifiant Golf SIM enregistré dans l'événement Google ; les participants et descriptions libres ne suffisent pas.</DialogDescription>
          </DialogHeader>
          {preview && <div className="space-y-2 text-sm">
            <p>{preview.scannedBookings} réservation(s) analysée(s), {preview.eligibleBookings} avec provenance vérifiée.</p>
            <p>{preview.excludedBookings} exclue(s), {preview.eligibleContacts} courriel(s) unique(s) admissible(s).</p>
            <p className="font-bold">{preview.newContacts} nouveau(x) contact(s) seront ajoutés.</p>
            <p>Aucun consentement marketing ne sera accordé. Les consentements et retraits existants sont conservés. Aucun courriel ne sera envoyé.</p>
          </div>}
          <DialogFooter className="flex-wrap gap-2">
            <Button variant="outline" disabled={busy === "import"} onClick={() => setPreview(null)}>Annuler</Button>
            <Button disabled={busy === "import" || !preview?.newContacts} onClick={approveHistory}
              data-testid="button-confirm-historical-import">{busy === "import" ? "Importation..." : "Confirmer l'import sans consentement"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
