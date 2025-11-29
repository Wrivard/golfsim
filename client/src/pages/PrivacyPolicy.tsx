import Layout from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="relative pt-32 pb-16 border-b border-foreground/5 bg-foreground">
        <div className="container mx-auto px-4 text-center relative z-10">
          <span className="text-white/60 text-sm font-bold tracking-widest uppercase mb-4 block">Golf SIM Sorel-Tracy</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold mb-6 text-white uppercase tracking-tighter leading-none">Politique de Confidentialité</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed font-sans">
            Dernière mise à jour : Novembre 2025
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="prose prose-lg max-w-none font-sans text-foreground/80">
          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">1. Introduction</h2>
            <p className="leading-relaxed mb-4">
              Bienvenue chez Golf SIM Sorel-Tracy. Nous nous engageons à protéger votre vie privée et vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons, stockons et protégeons vos informations lorsque vous utilisez notre site web et nos services de réservation.
            </p>
            <p className="leading-relaxed">
              En utilisant notre site web et nos services, vous acceptez les pratiques décrites dans cette politique de confidentialité.
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">2. Données Collectées</h2>
            <p className="leading-relaxed mb-4">Nous collectons les types de données suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Informations personnelles :</strong> Nom, adresse courriel, numéro de téléphone</li>
              <li><strong>Données de réservation :</strong> Date, heure, durée, numéro de baie, nombre de joueurs</li>
              <li><strong>Données techniques :</strong> Adresse IP, type de navigateur, pages visitées</li>
              <li><strong>Cookies :</strong> Pour améliorer votre expérience sur notre site</li>
            </ul>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">3. Utilisation des Données</h2>
            <p className="leading-relaxed mb-4">Vos données sont utilisées pour :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Traiter et confirmer vos réservations de simulateur de golf</li>
              <li>Vous envoyer des confirmations par courriel</li>
              <li>Synchroniser vos réservations avec notre calendrier</li>
              <li>Améliorer nos services et notre site web</li>
              <li>Vous contacter en cas de changement concernant votre réservation</li>
              <li>Répondre à vos demandes de renseignements</li>
            </ul>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">4. Protection des Données</h2>
            <p className="leading-relaxed mb-4">
              Nous prenons la sécurité de vos données très au sérieux. Nous utilisons des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos informations personnelles contre tout accès non autorisé, modification, divulgation ou destruction.
            </p>
            <p className="leading-relaxed">
              Ces mesures incluent le cryptage des données sensibles, des contrôles d'accès stricts et des audits de sécurité réguliers.
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">5. Partage des Données</h2>
            <p className="leading-relaxed mb-4">
              Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. Vos données peuvent être partagées uniquement dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Avec votre consentement explicite</li>
              <li>Pour respecter une obligation légale</li>
              <li>Avec des fournisseurs de services qui nous aident à exploiter notre site (sous contrat de confidentialité)</li>
            </ul>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">6. Conservation des Données</h2>
            <p className="leading-relaxed">
              Nous conservons vos données personnelles uniquement pendant la durée nécessaire aux fins pour lesquelles elles ont été collectées. Les données de réservation sont conservées pendant une période de 2 ans après votre dernière visite, sauf si la loi exige une conservation plus longue.
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">7. Vos Droits</h2>
            <p className="leading-relaxed mb-4">Conformément aux lois applicables, vous avez le droit de :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accéder à vos données personnelles</li>
              <li>Corriger vos données si elles sont inexactes</li>
              <li>Demander la suppression de vos données</li>
              <li>Vous opposer au traitement de vos données</li>
              <li>Demander la portabilité de vos données</li>
            </ul>
            <p className="leading-relaxed mt-4">
              Pour exercer ces droits, veuillez nous contacter à : <a href="mailto:info@golfsimst.com" className="text-primary hover:underline">info@golfsimst.com</a>
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section className="mb-12">
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">8. Modifications</h2>
            <p className="leading-relaxed">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications prendront effet dès leur publication sur cette page. Nous vous encourageons à consulter régulièrement cette page pour rester informé de nos pratiques en matière de protection des données.
            </p>
          </section>

          <Separator className="my-8 bg-foreground/10" />

          <section>
            <h2 className="text-2xl font-heading font-bold uppercase text-foreground mb-4">9. Contact</h2>
            <p className="leading-relaxed mb-4">
              Pour toute question concernant cette politique de confidentialité ou vos données personnelles, veuillez nous contacter :
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
