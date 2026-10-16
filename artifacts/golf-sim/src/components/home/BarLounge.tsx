import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Beer, GlassWater } from "lucide-react";
import barImage from "@assets/20260105-6-06_1790696495857.webp";

export default function BarLounge() {
  return (
    <section className="py-24 bg-[#EAE6D9] relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          
          {/* Left Content */}
          <div className="md:col-span-5 order-2 md:order-1">
            <div className="space-y-8">
              <div>
                <span className="text-primary font-bold uppercase tracking-widest text-sm mb-2 block">L'Après-Golf</span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-foreground uppercase leading-[0.9] mb-6">
                  Le <br/> <span className="text-primary">Shank</span>
                </h2>
                <p className="text-lg text-foreground/80 font-sans leading-relaxed">
                  Détendez-vous après votre partie dans notre espace lounge. Profitez d'une sélection de bières et de shooters au Shank.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-background/50 p-6 border border-foreground/5 hover:border-primary/50 transition-colors group">
                  <Beer className="w-8 h-8 text-foreground mb-4 group-hover:text-primary transition-colors" />
                  <h4 className="font-heading font-bold uppercase text-lg mb-2">Bières</h4>
                  <p className="text-sm text-foreground/60 font-sans">Sélection locale et importée en fût et bouteille.</p>
                </div>
                <div className="bg-background/50 p-6 border border-foreground/5 hover:border-primary/50 transition-colors group">
                  <GlassWater className="w-8 h-8 text-foreground mb-4 group-hover:text-primary transition-colors" />
                  <h4 className="font-heading font-bold uppercase text-lg mb-2">Shooters</h4>
                  <p className="text-sm text-foreground/60 font-sans">Disponibles au bar.</p>
                </div>
              </div>

              <div className="pt-4">
                <Link href="/booking">
                  <Button className="bg-foreground text-background hover:bg-primary hover:text-white rounded-full px-8 h-14 text-sm font-bold uppercase tracking-wider transition-all">
                    Réserver une table
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="md:col-span-7 order-1 md:order-2 relative">
            <div className="relative aspect-[4/3] md:aspect-auto md:h-[600px] rounded-lg overflow-hidden shadow-2xl group">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img 
                src={barImage} 
                alt="Bar Lounge Golf Simulator" 
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
              />
              
              {/* Floating Badge */}
              <div className="absolute bottom-8 left-8 z-20 bg-background/90 backdrop-blur p-6 max-w-xs shadow-xl border-l-4 border-primary hidden md:block">
                <p className="font-heading font-bold text-xl uppercase leading-tight text-foreground">
                  "L'endroit idéal pour refaire le match entre amis."
                </p>
              </div>
            </div>
            
            {/* Decorative Element */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-foreground/5 rounded-full blur-3xl -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
}
