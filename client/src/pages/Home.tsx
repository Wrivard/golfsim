import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Trophy, Users, Wifi } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Images from attached_assets
const HERO_IMAGE = "attached_assets/81a69ff2-4a89-478a-b758-a37bcbab0737_1764338501085.jfif";
const FEATURE_IMAGE = "attached_assets/f114406a-3bc2-4494-871f-50634e13f809_1764338501086.jfif";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - Dark & Modern */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
        {/* Background Gradient Element */}
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-primary/10 to-transparent z-0" />
        
        <div className="container mx-auto px-4 grid md:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Text Content (Left) */}
          <div className="md:col-span-6 space-y-8 pt-12 md:pt-0 order-2 md:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 border border-primary/50 text-primary text-xs font-bold tracking-[0.2em] uppercase mb-6">
                Golf Intérieur • Sorel-Tracy
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.1] text-foreground mb-6">
                L'Excellence <br />
                <span className="text-primary">Sans Compromis.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md border-l border-primary pl-6">
                Une expérience de simulation de golf immersive dans un environnement lounge haut de gamme. Ouvert 24/7 pour les membres.
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none px-10 h-14 text-lg transition-all hover:-translate-y-1 font-medium tracking-wide">
                  RÉSERVER
                </Button>
              </Link>
              <Link href="/rates">
                <Button variant="outline" size="lg" className="rounded-none px-10 h-14 text-lg border-muted-foreground/30 hover:bg-secondary hover:text-primary hover:border-primary transition-all">
                  FORFAITS
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Image Composition (Right) */}
          <div className="md:col-span-6 relative h-[50vh] md:h-[70vh] order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full overflow-hidden rounded-none border border-white/10">
                <img 
                  src={HERO_IMAGE} 
                  alt="Simulateur de golf intérieur" 
                  className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>
              
              {/* Floating Stat Card - Tech Style */}
              <div className="absolute bottom-8 left-8 bg-background/80 backdrop-blur-md p-6 border border-primary/30 z-20 min-w-[240px]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Statut</span>
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="space-y-1">
                   <p className="text-3xl font-sans font-bold text-foreground">OUVERT</p>
                   <p className="text-sm text-muted-foreground uppercase tracking-wide">Accès Membres 24/7</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features / Concept Section */}
      <section className="py-24 bg-secondary/30 border-t border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="border border-white/10 p-2">
                 <img 
                  src={FEATURE_IMAGE} 
                  alt="Joueur au simulateur" 
                  className="grayscale hover:grayscale-0 transition-all duration-700 w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-background border border-primary/30 p-8 max-w-xs hidden md:block">
                <p className="font-serif text-xl italic text-primary">"La précision à l'état pur."</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-serif">Technologie &<br />Performance</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nos simulateurs Trackman 4 offrent une précision inégalée. Analysez chaque paramètre de votre swing dans un environnement contrôlé et confortable.
              </p>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-10 pt-4">
                <div className="space-y-3 group">
                  <Trophy className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                  <h3 className="font-sans font-bold uppercase tracking-wide text-sm">Trackman 4</h3>
                  <p className="text-sm text-muted-foreground">Technologie radar double pour une précision absolue.</p>
                </div>
                <div className="space-y-3 group">
                  <Clock className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                  <h3 className="font-sans font-bold uppercase tracking-wide text-sm">Accès Illimité</h3>
                  <p className="text-sm text-muted-foreground">Jouez à votre rythme avec nos abonnements mensuels.</p>
                </div>
                <div className="space-y-3 group">
                  <Users className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                  <h3 className="font-sans font-bold uppercase tracking-wide text-sm">Espace Lounge</h3>
                  <p className="text-sm text-muted-foreground">Détendez-vous entre deux parties dans notre bar privé.</p>
                </div>
                <div className="space-y-3 group">
                  <Wifi className="w-8 h-8 text-primary group-hover:text-white transition-colors" />
                  <h3 className="font-sans font-bold uppercase tracking-wide text-sm">Connectivité</h3>
                  <p className="text-sm text-muted-foreground">Wi-Fi haute vitesse et application de réservation.</p>
                </div>
              </div>
              
              <div className="pt-8">
                <Link href="/about">
                  <Button variant="link" className="text-primary p-0 h-auto font-medium text-lg hover:no-underline hover:text-white gap-2 uppercase tracking-widest text-sm">
                    Découvrir le club <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-background/80" />
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif mb-8">Prêt à améliorer votre jeu ?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/contact">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-none px-12 h-16 text-lg tracking-widest uppercase font-bold">
                Réserver un départ
              </Button>
            </Link>
            <Link href="/rates">
              <Button size="lg" variant="outline" className="bg-transparent text-foreground border-white/20 hover:bg-white/5 rounded-none px-12 h-16 text-lg tracking-widest uppercase">
                Voir les abonnements
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
