import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import ScrollGolfPath from "@/components/home/ScrollGolfPath";

export default function MembershipPreview() {
  return (
    <section className="py-32 bg-foreground text-background relative overflow-hidden">
      {/* Localized Golf Ball Path */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
         <ScrollGolfPath />
      </div>

      {/* Background textural elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full border-[100px] border-primary/20 blur-3xl" />
         <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 bg-primary/20 border border-primary text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
             Le Cercle Privé
          </span>
          <h2 className="text-5xl md:text-8xl font-heading font-bold uppercase leading-none mb-6">
            Rejoignez <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">L'Élite</span>
          </h2>
          <p className="text-lg text-white/60 font-sans max-w-2xl mx-auto leading-relaxed">
             Plus qu'un simple abonnement, c'est votre clé vers une amélioration constante.
             Profitez d'un accès illimité 24/7 à nos installations de classe mondiale.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
           {/* Premium Card Design */}
           <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden grid md:grid-cols-2">
              
              {/* Left: Features */}
              <div className="p-10 md:p-12 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10">
                 <h3 className="text-3xl font-heading font-bold uppercase mb-8 flex items-center gap-3">
                    <Crown className="w-8 h-8 text-primary" />
                    Avantages Membre
                 </h3>
                 <ul className="space-y-6">
                    {[
                      { title: "Accès 24/7", desc: "Jouez quand vous voulez, jour et nuit." },
                      { title: "Tarifs Préférentiels", desc: "Jusqu'à 50% de rabais sur les heures de jeu." },
                      { title: "Réservation Prioritaire", desc: "Réservez vos départs 14 jours à l'avance." },
                      { title: "Casier Privé", desc: "Laissez votre équipement en sécurité au club." }
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-4">
                         <div className="w-6 h-6 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-white mt-1">
                            <Check className="w-3 h-3" />
                         </div>
                         <div>
                            <h4 className="font-bold text-white text-sm uppercase tracking-wide">{item.title}</h4>
                            <p className="text-white/50 text-sm font-sans">{item.desc}</p>
                         </div>
                      </li>
                    ))}
                 </ul>
              </div>

              {/* Right: Pricing & CTA */}
              <div className="p-10 md:p-12 bg-gradient-to-br from-white/5 to-transparent flex flex-col justify-center items-center text-center relative">
                 <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Crown className="w-32 h-32 text-white rotate-12" />
                 </div>
                 
                 <p className="text-sm font-bold uppercase tracking-widest text-white/50 mb-4">Abonnement Mensuel</p>
                 <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-7xl md:text-8xl font-heading font-bold text-white">120$</span>
                    <span className="text-xl text-white/50 font-sans">/mois</span>
                 </div>
                 <p className="text-white/40 text-sm mb-8 font-sans">Aucun contrat à long terme requis.</p>
                 
                 <Link href="/rates">
                   <Button className="w-full max-w-xs bg-white text-foreground hover:bg-primary hover:text-white rounded-full h-14 text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(43,87,52,0.4)]">
                     Devenir Membre
                   </Button>
                 </Link>
                 
                 <p className="mt-6 text-xs text-white/30 font-sans">
                    Places limitées pour garantir la disponibilité.
                 </p>
              </div>

           </div>
        </div>

      </div>
    </section>
  );
}
