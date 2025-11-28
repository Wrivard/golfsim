import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";
import FAQ from "@/components/rates/FAQ";
import headerBg from "@assets/stock_images/golfer_hitting_ball__a2cb5d6d.jpg";

export default function Rates() {
  return (
    <Layout>
       {/* Header */}
       <div className="relative py-32 pt-40">
        <div className="absolute inset-0 z-0">
            <img src={headerBg} alt="Golf Landscape" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 z-10" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-6xl md:text-8xl font-heading font-bold mb-6 uppercase tracking-tighter leading-none text-white">Nos <span className="text-white">Tarifs</span></h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto font-sans">
            Une structure simple et transparente. Payez par joueur pour des blocs de 4 heures.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
          
          {/* Standard Rate Card */}
          <div className="bg-transparent border-2 border-foreground/10 p-8 flex flex-col relative hover:border-foreground transition-all duration-300 group">
            <h3 className="font-heading font-bold text-3xl mb-2 uppercase">Tarif Standard</h3>
            <p className="text-muted-foreground mb-8 font-sans">Expérience complète de 4 heures.</p>
            <div className="mb-8 pb-8 border-b border-foreground/10">
              <span className="text-6xl font-heading font-bold">40$</span>
              <span className="text-muted-foreground font-sans font-bold text-sm uppercase tracking-wider"> / personne</span>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Bloc de 4 heures de jeu</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Jusqu'à 4 joueurs par simulateur</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Technologie Trackman 4</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Accès au lounge</span>
              </li>
            </ul>
            <Link href="/booking">
              <Button className="w-full rounded-full h-14 text-sm font-bold uppercase tracking-wider bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background">
                Réserver une plage
              </Button>
            </Link>
          </div>

          {/* Events Card (Highlighted) */}
          <div className="bg-foreground text-background p-10 flex flex-col relative shadow-2xl transform md:-translate-y-4 z-10">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-2">Groupes</div>
            <h3 className="font-heading font-bold text-3xl mb-2 uppercase text-white">Événements</h3>
            <p className="text-white/60 mb-8 font-sans">Privatisation pour groupes et fêtes.</p>
            <div className="mb-8 pb-8 border-b border-white/10">
              <span className="text-4xl font-heading font-bold text-white">Sur Mesure</span>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>Privatisation complète ou partielle</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>Service de bar et traiteur</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>Tournois organisés</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>Capacité jusqu'à 20+ personnes</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button className="w-full rounded-full h-14 text-sm font-bold uppercase tracking-wider bg-primary text-white hover:bg-white hover:text-foreground border-none">
                Demander un devis
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <FAQ />
      </div>
    </Layout>
  );
}
