import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Clock, Trophy, Users, Wifi } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

// Images from attached_assets
import heroImage from "@assets/f114406a-3bc2-4494-871f-50634e13f809_1764338872257.jfif";
import featureImage from "@assets/f114406a-3bc2-4494-871f-50634e13f809_1764338501086.jfif";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - Light & Elegant */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        
        <div className="container mx-auto px-4 grid md:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Text Content (Left) */}
          <div className="md:col-span-5 space-y-8 pt-12 md:pt-0 order-2 md:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 bg-primary/5 text-primary text-xs font-bold tracking-[0.2em] uppercase mb-6 border border-primary/10 rounded-full">
                Golf Intérieur • Sorel-Tracy
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.1] text-foreground mb-6">
                Le Golf, <br />
                <span className="text-primary italic">Réinventé.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md border-l-2 border-accent pl-6">
                Vivez une expérience de simulation immersive dans un cadre raffiné. La destination incontournable pour les passionnés, 12 mois par an.
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/contact">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-10 h-14 text-lg transition-all hover:-translate-y-1 shadow-lg shadow-primary/20">
                  Réserver maintenant
                </Button>
              </Link>
              <Link href="/rates">
                <Button variant="outline" size="lg" className="rounded-full px-10 h-14 text-lg border-primary/20 text-primary hover:bg-primary/5 transition-all">
                  Nos Forfaits
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Image Composition (Right) */}
          <div className="md:col-span-7 relative h-[50vh] md:h-[75vh] order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <div className="relative w-full h-full overflow-hidden rounded-[2rem] shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Simulateur de golf intérieur" 
                  className="w-full h-full object-cover transform scale-105 hover:scale-100 transition-transform duration-[1.5s]"
                />
                {/* Elegant Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              
              {/* Floating Stat Card - Elegant Style */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-border z-20 min-w-[200px] hidden md:block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">En Direct</span>
                </div>
                <div className="space-y-1">
                   <p className="text-3xl font-serif font-bold text-foreground">24/7</p>
                   <p className="text-sm text-muted-foreground font-medium">Accès Membres</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features / Concept Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative order-2 md:order-1">
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                 <img 
                  src={featureImage} 
                  alt="Joueur au simulateur" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              
              <div className="absolute -bottom-8 -right-8 bg-secondary p-8 rounded-lg max-w-xs shadow-lg hidden md:block z-10">
                <p className="font-serif text-xl italic text-primary">"La précision à l'état pur, dans un confort absolu."</p>
              </div>
            </div>
            
            <div className="space-y-8 order-1 md:order-2">
              <h2 className="text-4xl md:text-5xl font-serif text-foreground">Technologie &<br />Élégance</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nos simulateurs de dernière génération offrent une précision chirurgicale. Analysez chaque nuance de votre swing dans un environnement conçu pour le confort et la performance.
              </p>
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-10 pt-4">
                <div className="space-y-3 group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                    <Trophy className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-serif font-bold text-lg">Simulateurs Pro</h3>
                  <p className="text-sm text-muted-foreground">Technologie radar double haute fidélité.</p>
                </div>
                <div className="space-y-3 group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                    <Clock className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-serif font-bold text-lg">Accès Illimité</h3>
                  <p className="text-sm text-muted-foreground">Forfaits flexibles adaptés à votre horaire.</p>
                </div>
                <div className="space-y-3 group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                    <Users className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-serif font-bold text-lg">Espace Lounge</h3>
                  <p className="text-sm text-muted-foreground">Détente et convivialité après l'effort.</p>
                </div>
                <div className="space-y-3 group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                    <Wifi className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-serif font-bold text-lg">Connecté</h3>
                  <p className="text-sm text-muted-foreground">Réservez votre baie en un clic.</p>
                </div>
              </div>
              
              <div className="pt-8">
                <Link href="/about">
                  <Button variant="link" className="text-primary p-0 h-auto font-medium text-lg hover:no-underline hover:opacity-80 gap-2 font-serif italic">
                    Découvrir le club <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
        
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Prêt à jouer ?</h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Réservez votre départ dès maintenant ou rejoignez notre communauté de membres privilégiés.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-primary hover:bg-secondary rounded-full px-10 h-14 text-lg font-bold shadow-xl">
                Réserver une plage
              </Button>
            </Link>
            <Link href="/rates">
              <Button size="lg" variant="outline" className="bg-transparent text-white border-white/30 hover:bg-white/10 rounded-full px-10 h-14 text-lg">
                Devenir membre
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
