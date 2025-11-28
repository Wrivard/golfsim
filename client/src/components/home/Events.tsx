import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, CalendarDays } from "lucide-react";

export default function Events() {
  return (
    <section className="relative py-32 bg-background overflow-hidden">
      {/* Connector from Membership Section */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-foreground to-transparent opacity-10 pointer-events-none" />

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Visual / Card - Swapped Order */}
          <div className="order-2 md:order-1 relative">
             <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl transform -translate-x-12 -translate-y-12" />
             <div className="relative bg-[#1B1A18] p-12 md:p-16 rounded-none border-l-4 border-[#2B5734] flex flex-col items-start text-left space-y-6 shadow-2xl transform md:-rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="w-16 h-16 bg-[#F7F3E8]/10 rounded-full flex items-center justify-center shadow-sm mb-2 border border-[#F7F3E8]/20">
                   <CalendarDays className="w-6 h-6 text-[#2B5734]" />
                </div>
                <h3 className="text-4xl font-heading font-bold uppercase leading-none text-[#F7F3E8]">Soirée <br/>Corporative</h3>
                <p className="text-[#F7F3E8] font-sans leading-relaxed">
                  "L'endroit idéal pour notre party de bureau. L'ambiance était parfaite et même les débutants ont adoré l'expérience."
                </p>
                <div className="w-full h-px bg-[#F7F3E8]/20" />
                <div className="flex justify-between w-full items-center">
                   <p className="text-xs font-bold uppercase tracking-wider text-[#2B5734] bg-white/10 px-2 py-1 rounded">Disponible 7 jours / 7</p>
                   <p className="text-xs font-bold uppercase tracking-wider text-[#F7F3E8]/70">Capacité 20+</p>
                </div>
             </div>
          </div>

          {/* Content */}
          <div className="space-y-8 order-1 md:order-2 pl-0 md:pl-12">
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
        </div>
      </div>
    </section>
  );
}
