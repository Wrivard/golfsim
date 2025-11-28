import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, CalendarDays } from "lucide-react";

export default function Events() {
  return (
    <section className="py-24 bg-background border-t border-foreground/5">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8 order-2 md:order-1">
            <div className="inline-block py-1 px-3 bg-foreground text-background rounded-full text-xs font-bold uppercase tracking-widest">
              Privatisation & Groupes
            </div>
            <h2 className="text-5xl md:text-7xl font-heading font-bold text-foreground uppercase leading-none">
              Créez votre <br/><span className="text-primary">Événement</span>
            </h2>
            <p className="text-lg text-foreground/70 font-sans leading-relaxed max-w-md">
              Que ce soit pour un team building, un anniversaire ou une soirée entre amis, privatisez notre espace pour une expérience inoubliable.
            </p>

            <ul className="space-y-4 pt-2">
              {[
                "Capacité jusqu'à 20 personnes",
                "Service de traiteur disponible",
                "Tournois personnalisés",
                "Accès complet au lounge",
                "Coaching sur demande"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="font-sans font-medium text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link href="/contact">
                <Button className="bg-foreground text-background hover:bg-primary hover:text-white rounded-full px-10 h-14 text-sm font-bold uppercase tracking-wider transition-all">
                  Demander un devis
                </Button>
              </Link>
            </div>
          </div>

          {/* Visual / Card */}
          <div className="order-1 md:order-2 relative">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-lg transform translate-x-4 translate-y-4 -z-10" />
             <div className="bg-[#EAE6D9] p-12 rounded-lg border border-foreground/10 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-lg mb-4">
                   <CalendarDays className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-3xl font-heading font-bold uppercase">Soirée Corporative</h3>
                <p className="text-foreground/70 font-sans leading-relaxed">
                  "L'endroit idéal pour notre party de bureau. L'ambiance était parfaite et même les débutants ont adoré l'expérience."
                </p>
                <div className="w-12 h-1 bg-primary/20 rounded-full" />
                <p className="text-sm font-bold uppercase tracking-wider text-primary">Disponible 7 jours / 7</p>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
