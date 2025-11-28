import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";

export default function Rates() {
  return (
    <Layout>
       {/* Header */}
       <div className="bg-foreground text-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6">Tarifs & Forfaits</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Des options flexibles pour les joueurs occasionnels et les passionnés.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          
          {/* Visitor Card */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col relative overflow-hidden hover:border-primary/50 transition-colors">
            <h3 className="font-serif text-2xl mb-2">Visiteur</h3>
            <p className="text-muted-foreground mb-6">Pour une partie occasionnelle.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold font-serif">45$</span>
              <span className="text-muted-foreground"> / heure</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Accès aux simulateurs standards</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Jusqu'à 4 joueurs par baie</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Prêt de matériel disponible</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button className="w-full rounded-full" variant="outline">Réserver</Button>
            </Link>
          </div>

          {/* Member Card (Highlighted) */}
          <div className="bg-primary text-primary-foreground rounded-2xl p-8 flex flex-col relative shadow-xl transform md:-translate-y-4">
            <div className="absolute top-4 right-4 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">POPULAIRE</div>
            <h3 className="font-serif text-2xl mb-2">Membre</h3>
            <p className="text-primary-foreground/80 mb-6">L'expérience complète.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold font-serif">120$</span>
              <span className="text-primary-foreground/80"> / mois</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check className="w-3 h-3" /></div>
                <span>Tarif horaire réduit (25$/h)</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check className="w-3 h-3" /></div>
                <span>Accès 24/7 au centre</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check className="w-3 h-3" /></div>
                <span>Réservation prioritaire (14 jours)</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <div className="bg-white/20 p-1 rounded-full"><Check className="w-3 h-3" /></div>
                <span>Casier de rangement inclus</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button className="w-full rounded-full bg-white text-primary hover:bg-white/90 border-none">Devenir Membre</Button>
            </Link>
          </div>

          {/* Event Card */}
          <div className="bg-card border border-border rounded-2xl p-8 flex flex-col hover:border-primary/50 transition-colors">
            <h3 className="font-serif text-2xl mb-2">Événement</h3>
            <p className="text-muted-foreground mb-6">Privatisation pour groupes.</p>
            <div className="mb-8">
              <span className="text-4xl font-bold font-serif">Sur devis</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Privatisation complète ou partielle</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Service traiteur disponible</span>
              </li>
              <li className="flex items-start gap-3 text-sm">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>Tournois organisés</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button className="w-full rounded-full" variant="outline">Nous contacter</Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
            * Les tarifs sont sujets à changement sans préavis. Les taxes ne sont pas incluses. L'annulation doit être faite 24h à l'avance.
          </p>
        </div>
      </div>
    </Layout>
  );
}
