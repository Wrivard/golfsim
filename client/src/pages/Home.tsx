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
      {/* Hero Section - Editorial/Magazine Style */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Gradient Element */}
        <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-background to-transparent z-10 hidden md:block" />
        
        <div className="container mx-auto px-4 grid md:grid-cols-12 gap-8 items-center relative z-20">
          
          {/* Text Content (Left) */}
          <div className="md:col-span-5 space-y-8 pt-12 md:pt-0 order-2 md:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-secondary text-primary text-sm font-medium tracking-wide mb-4">
                NOUVEAU À SOREL-TRACY
              </span>
              <h1 className="text-5xl md:text-7xl font-serif font-medium leading-[1.1] text-foreground mb-6">
                Vivez le golf <br />
                <span className="italic text-primary">autrement.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md border-l-2 border-primary/30 pl-6">
                Simulateurs haut de gamme, ambiance lounge et accès exclusif. La destination golfique ultime, été comme hiver.
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Link href="/contact">
                <Button size="lg" className="rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
                  Réserver maintenant
                </Button>
              </Link>
              <Link href="/rates">
                <Button variant="outline" size="lg" className="rounded-full px-8 h-14 text-lg border-foreground/10 hover:bg-secondary hover:text-primary">
                  Voir les forfaits
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Image Composition (Right) */}
          <div className="md:col-span-7 relative h-[50vh] md:h-[80vh] order-1 md:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative w-full h-full"
            >
              <div className="absolute inset-0 bg-foreground/5 rounded-[2rem] transform rotate-2 translate-x-4 translate-y-4" />
              <img 
                src={HERO_IMAGE} 
                alt="Simulateur de golf intérieur" 
                className="w-full h-full object-cover rounded-[2rem] shadow-2xl relative z-10"
              />
              
              {/* Floating Stat Card */}
              <div className="absolute -bottom-6 -left-6 md:bottom-12 md:-left-12 bg-background p-6 rounded-xl shadow-xl border border-border z-20 max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">En Direct</span>
                </div>
                <p className="text-2xl font-serif font-bold text-foreground">24/7</p>
                <p className="text-sm text-muted-foreground">Accès membres</p>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-primary font-medium">Bays disponibles aujourd'hui</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features / Concept Section */}
      <section className="py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src={FEATURE_IMAGE} 
                alt="Joueur au simulateur" 
                className="rounded-lg shadow-lg grayscale hover:grayscale-0 transition-all duration-700"
              />
              <div className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-8 rounded-lg max-w-xs hidden md:block">
                <p className="font-serif text-xl italic">"Plus qu'un sport, un véritable lieu de vie."</p>
              </div>
            </div>
            
            <div className="space-y-8">
              <h2 className="text-4xl font-serif">Technologie de pointe &<br />Confort absolu</h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nous avons réuni le meilleur de la technologie de simulation avec le confort d'un club privé. Que vous soyez débutant ou pro, analysez votre swing avec précision ou profitez simplement d'une soirée entre amis.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Trophy className="w-8 h-8 text-accent" />
                  <h3 className="font-serif font-bold">Simulateurs Pro</h3>
                  <p className="text-sm text-muted-foreground">Trackman & technologie haute fidélité.</p>
                </div>
                <div className="space-y-2">
                  <Clock className="w-8 h-8 text-accent" />
                  <h3 className="font-serif font-bold">Accès 24/7</h3>
                  <p className="text-sm text-muted-foreground">Jouez quand vous voulez avec nos forfaits membres.</p>
                </div>
                <div className="space-y-2">
                  <Users className="w-8 h-8 text-accent" />
                  <h3 className="font-serif font-bold">Ambiance Lounge</h3>
                  <p className="text-sm text-muted-foreground">Espace détente, bar et écrans géants.</p>
                </div>
                <div className="space-y-2">
                  <Wifi className="w-8 h-8 text-accent" />
                  <h3 className="font-serif font-bold">Connecté</h3>
                  <p className="text-sm text-muted-foreground">Wi-Fi haut débit et réservation en ligne.</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Link href="/about">
                  <Button variant="link" className="text-primary p-0 h-auto font-serif text-lg hover:no-underline hover:opacity-70 gap-2">
                    En savoir plus sur le club <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Prêt à jouer ?</h2>
          <p className="text-xl text-white/70 mb-10">
            Réservez votre départ dès maintenant ou découvrez nos abonnements exclusifs.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 rounded-full px-10 h-14 text-lg border-none">
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
