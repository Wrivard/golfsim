import Layout from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";

export default function CookiePolicy() {
  return (
    <Layout>
      <div className="relative pt-32 pb-16 border-b border-foreground/5 bg-foreground">
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="text-white/60 text-sm font-bold tracking-widest uppercase mb-4 block">Golf SIM Sorel-Tracy</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold mb-6 text-white uppercase tracking-tighter leading-none">Politique de Cookies</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-sans">
            Dernière mise à jour : Novembre 2025
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none font-sans text-foreground/80">
          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">1. Qu'est-ce qu'un Cookie ?</h2>
            <p className="leading-relaxed mb-4">
              Un cookie est un petit fichier texte stocké sur votre ordinateur ou appareil mobile lorsque vous visitez un site web. Les cookies permettent au site de reconnaître votre appareil et de mémoriser certaines informations sur vos préférences ou actions passées.
            </p>
            <p className="leading-relaxed">
              Les cookies sont largement utilisés pour faire fonctionner les sites web de manière plus efficace et pour fournir des informations aux propriétaires du site.
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">2. Types de Cookies Utilisés</h2>
            
            <div className="space-y-6">
              <div className="bg-background/50 p-6 rounded-lg border border-foreground/10">
                <h3 className="text-lg font-bold text-foreground mb-2">Cookies Essentiels</h3>
                <p className="text-sm mb-2">Ces cookies sont nécessaires au fonctionnement de notre site. Ils permettent :</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>La gestion de votre session de réservation</li>
                  <li>La mémorisation des articles dans votre panier de réservation</li>
                  <li>La sécurité de votre navigation</li>
                  <li>L'authentification des administrateurs</li>
                </ul>
                <p className="text-xs text-foreground/60 mt-3">Durée : Session ou jusqu'à 24 heures</p>
              </div>

              <div className="bg-background/50 p-6 rounded-lg border border-foreground/10">
                <h3 className="text-lg font-bold text-foreground mb-2">Cookies de Performance</h3>
                <p className="text-sm mb-2">Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site :</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Pages les plus visitées</li>
                  <li>Messages d'erreur rencontrés</li>
                  <li>Temps passé sur le site</li>
                </ul>
                <p className="text-xs text-foreground/60 mt-3">Ces données sont anonymes et ne permettent pas de vous identifier.</p>
              </div>

              <div className="bg-background/50 p-6 rounded-lg border border-foreground/10">
                <h3 className="text-lg font-bold text-foreground mb-2">Cookies de Fonctionnalité</h3>
                <p className="text-sm mb-2">Ces cookies permettent de personnaliser votre expérience :</p>
                <ul className="list-disc pl-6 space-y-1 text-sm">
                  <li>Mémorisation de vos préférences de langue</li>
                  <li>Personnalisation de l'affichage</li>
                </ul>
              </div>
            </div>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">3. Cookies Tiers</h2>
            <p className="leading-relaxed mb-4">
              Notre site peut utiliser des services tiers qui placent leurs propres cookies sur votre appareil :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Calendar :</strong> Pour la synchronisation des réservations (si vous connectez votre calendrier)</li>
              <li><strong>Google Fonts :</strong> Pour l'affichage des polices de caractères</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Ces services tiers ont leurs propres politiques de confidentialité que nous vous encourageons à consulter.
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">4. Gestion des Cookies</h2>
            <p className="leading-relaxed mb-4">
              Vous pouvez contrôler et gérer les cookies de plusieurs façons :
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-foreground mb-2">Via votre navigateur</h3>
                <p className="text-sm leading-relaxed">
                  La plupart des navigateurs vous permettent de refuser ou d'accepter les cookies, de supprimer les cookies existants et de configurer des préférences pour certains sites. Voici comment accéder aux paramètres des cookies dans les navigateurs les plus courants :
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                  <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
                  <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies</li>
                  <li><strong>Safari :</strong> Préférences → Confidentialité</li>
                  <li><strong>Edge :</strong> Paramètres → Cookies et autorisations de site</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-6">
              <p className="text-sm text-amber-800">
                <strong>Note importante :</strong> Si vous désactivez les cookies essentiels, certaines fonctionnalités de notre site pourraient ne pas fonctionner correctement, notamment le système de réservation.
              </p>
            </div>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">5. Durée de Conservation</h2>
            <p className="leading-relaxed mb-4">
              Les cookies ont des durées de vie différentes :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies de session :</strong> Supprimés lorsque vous fermez votre navigateur</li>
              <li><strong>Cookies persistants :</strong> Restent sur votre appareil pendant une période définie (généralement de quelques jours à un an)</li>
            </ul>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">6. Mises à Jour</h2>
            <p className="leading-relaxed">
              Nous pouvons mettre à jour cette politique de cookies de temps à autre pour refléter les changements dans nos pratiques ou pour d'autres raisons opérationnelles, légales ou réglementaires. Veuillez consulter régulièrement cette page pour rester informé de notre utilisation des cookies.
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section>
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">7. Contact</h2>
            <p className="leading-relaxed mb-4">
              Si vous avez des questions concernant notre utilisation des cookies, veuillez nous contacter :
            </p>
            <div className="bg-background/50 p-6 rounded-lg border border-foreground/10">
              <p className="font-bold text-foreground">Golf SIM Sorel-Tracy</p>
              <p>123 Rue du Golf, Sorel-Tracy, QC J3P 1A1</p>
              <p>Courriel : <a href="mailto:info@golfsimst.com" className="text-primary hover:underline">info@golfsimst.com</a></p>
              <p>Téléphone : <a href="tel:+14501234567" className="text-primary hover:underline">(450) 123-4567</a></p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
