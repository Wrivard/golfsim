import { useState } from "react";
import { Link } from "wouter";
import { useWithdrawMarketingConsent } from "@workspace/api-client-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

function readToken(): string {
  const raw = window.location.hash.replace(/^#/, "");
  const t = raw.startsWith("token=") ? raw.slice(6) : raw;
  try { return decodeURIComponent(t); } catch { return t; }
}

export default function Unsubscribe() {
  // Token kept in memory only; removed from the address bar immediately.
  const [token] = useState(() => {
    const t = readToken();
    if (t) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    return t;
  });
  const withdraw = useWithdrawMarketingConsent();
  const invalid = token.length < 20;

  return (
    <Layout>
      <div className="pt-32 pb-16 bg-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white uppercase tracking-tighter">Désinscription</h1>
        </div>
      </div>
      <div className="container mx-auto px-4 py-16 max-w-xl text-center" data-testid="unsubscribe-page">
        {withdraw.isSuccess ? (
          <div role="status" data-testid="unsubscribe-success">
            <h2 className="text-2xl mb-3">Désinscription confirmée</h2>
            <p className="text-foreground/80 mb-6">Vous ne recevrez plus de communications promotionnelles de Golf SIM Sorel-Tracy. Vos réservations ne sont pas affectées.</p>
          </div>
        ) : invalid ? (
          <div role="alert" data-testid="unsubscribe-invalid">
            <h2 className="text-2xl mb-3">Lien invalide</h2>
            <p className="text-foreground/80 mb-6">Ce lien de désinscription est incomplet ou expiré. Utilisez le lien reçu dans votre courriel, ou écrivez-nous à <a className="text-primary hover:underline" href="mailto:golfsim.soreltracy@gmail.com">golfsim.soreltracy@gmail.com</a>.</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl mb-3">Retirer mon consentement marketing</h2>
            <p className="text-foreground/80 mb-6">Cliquez sur le bouton ci-dessous pour ne plus recevoir de communications promotionnelles. Aucune action n'est effectuée tant que vous n'avez pas confirmé.</p>
            {withdraw.isError && (
              <p className="mb-4 border-2 border-destructive bg-destructive/10 p-3 text-sm font-bold" role="alert" data-testid="unsubscribe-error">
                La désinscription a échoué. Le lien est peut-être expiré; réessayez ou contactez-nous.
              </p>
            )}
            <Button size="lg" disabled={withdraw.isPending} onClick={() => withdraw.mutate({ data: { token } })} data-testid="button-unsubscribe">
              {withdraw.isPending ? "Traitement..." : "Me désinscrire"}
            </Button>
          </div>
        )}
        <div className="mt-8">
          <Link href="/" className="text-primary font-bold hover:underline" data-testid="link-home">Retour à l'accueil</Link>
        </div>
      </div>
    </Layout>
  );
}
