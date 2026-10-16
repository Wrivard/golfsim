import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ctaImage from "@assets/20260105-7-07_1790696495857.webp";

export default function SimulatorCTA() {
  return (
    <section className="relative py-40 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={ctaImage} 
          alt="Golfeur en action dans le simulateur"
          className="w-full h-full object-cover brightness-75" // Slightly darkened for text legibility without heavy overlay
        />
        {/* Subtle dark gradient for text pop */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="max-w-3xl">
          <span className="inline-block py-1 px-3 bg-[#2B5734] text-white rounded-full text-xs font-bold uppercase tracking-widest mb-6 shadow-lg">
            Expérience Immersive
          </span>
          
          <h2 className="text-3xl sm:text-5xl md:text-8xl font-heading font-bold text-white uppercase leading-[1.08] mb-8 drop-shadow-2xl">
            Prêt à <br/>
            perfectionner <br/>
            <span className="text-[#F7F3E8]">votre élan ?</span>
          </h2>
          
          <p className="text-xl text-white font-sans max-w-xl mb-10 leading-relaxed drop-shadow-md font-medium">
            Nos simulateurs de pointe vous offrent une analyse précise et une expérience de jeu inégalée, peu importe la météo.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/contact">
              <Button className="bg-[#F7F3E8] text-[#1B1A18] hover:bg-white hover:text-[#2B5734] rounded-full px-10 h-16 text-sm font-bold uppercase tracking-wider transition-all transform hover:scale-105 shadow-xl border-2 border-transparent hover:border-[#2B5734]">
                Réserver une plage
              </Button>
            </Link>
            
            <Link href="/rates">
              <Button variant="outline" className="bg-[#1B1A18]/80 backdrop-blur-sm text-white border-white/20 hover:bg-[#2B5734] hover:border-[#2B5734] rounded-full px-10 h-16 text-sm font-bold uppercase tracking-wider transition-all hover:scale-105">
                Voir nos tarifs
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
