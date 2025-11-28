import { Smartphone, Key, Trophy } from "lucide-react";

const STEPS = [
  {
    icon: Smartphone,
    title: "Réservez",
    description: "Utilisez notre application pour réserver votre baie en quelques secondes. Disponibilité en temps réel au bout des doigts."
  },
  {
    icon: Key,
    title: "Déverrouillez",
    description: "Accédez au centre 24/7 avec votre clé numérique. Votre code d'entrée sécurisé est envoyé directement sur votre téléphone."
  },
  {
    icon: Trophy,
    title: "Jouez",
    description: "Lancez votre parcours préféré sur Trackman et commencez à jouer. Analysez vos données instantanément."
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-[#EAE6D9]">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-heading font-bold text-foreground uppercase leading-none mb-6">
            Comment ça marche
          </h2>
          <p className="text-lg text-foreground/70 font-sans max-w-2xl mx-auto">
            Fluide, autonome et conçu pour le golfeur moderne.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-foreground/10 z-0" />

          {STEPS.map((step, idx) => (
            <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-background border-2 border-foreground rounded-full flex items-center justify-center mb-8 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all duration-300 shadow-lg">
                <step.icon className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-heading font-bold uppercase mb-4">{step.title}</h3>
              <p className="text-foreground/70 font-sans leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
