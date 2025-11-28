import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import ctaImage from "@assets/stock_images/close_up_golf_ball_o_cb060028.jpg";

export default function SimulatorCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={ctaImage} 
          alt="Golf simulator close up" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      </div>

      <div className="container mx-auto px-6 md:px-12 relative z-10 text-center">
        <span className="inline-block py-1 px-3 bg-white/10 border border-white/20 text-white rounded-full text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
          Expérience Immersive
        </span>
        
        <h2 className="text-4xl md:text-7xl font-heading font-bold text-white uppercase leading-none mb-8 max-w-4xl mx-auto">
          Prêt à perfectionner <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-white">votre élan ?</span>
        </h2>
        
        <p className="text-lg text-white/80 font-sans max-w-2xl mx-auto mb-10 leading-relaxed">
          Nos simulateurs de pointe vous offrent une analyse précise et une expérience de jeu inégalée, peu importe la météo extérieure.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/contact">
            <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-10 h-14 text-sm font-bold uppercase tracking-wider transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(43,87,52,0.5)]">
              Réserver une plage
            </Button>
          </Link>
          
          <Link href="/rates">
            <Button variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white hover:text-black rounded-full px-10 h-14 text-sm font-bold uppercase tracking-wider transition-all hover:scale-105">
              Voir nos tarifs
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
