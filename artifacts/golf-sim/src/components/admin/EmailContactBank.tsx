import { useMemo, useState } from "react";
import { useGetEmailContacts, getGetEmailContactsQueryKey, exportEmailContacts } from "@workspace/api-client-react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-CA") : "-");

export default function EmailContactBank() {
  const { toast } = useToast();
  const q = useGetEmailContacts({ query: { queryKey: getGetEmailContactsQueryKey(), refetchInterval: 30000 } });
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<null | "all" | "marketing">(null);
  const contacts = q.data?.contacts ?? [];
  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return s ? contacts.filter((c) => `${c.email} ${c.name} ${c.source}`.toLowerCase().includes(s)) : contacts;
  }, [contacts, search]);
  const optedIn = contacts.filter((c) => c.marketingConsent && !c.withdrawnAt).length;

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
        <Button disabled={busy !== null} onClick={() => download(false)} data-testid="button-export-all"><Download className="h-4 w-4 mr-2" />{busy === "all" ? "Préparation..." : "CSV complet"}</Button>
        <Button variant="outline" disabled={busy !== null} onClick={() => download(true)} data-testid="button-export-marketing"><Download className="h-4 w-4 mr-2" />{busy === "marketing" ? "Préparation..." : "CSV marketing seulement"}</Button>
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
                  <tr>{["Courriel", "Nom", "Source", "Statut", "Consentement", "Retrait"].map((h) => <th key={h} className="p-2 font-bold whitespace-nowrap">{h}</th>)}</tr>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
