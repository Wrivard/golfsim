import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import BrandMarquee from "@/components/home/BrandMarquee";
import Testimonials from "@/components/home/Testimonials";
import MembershipPreview from "@/components/home/MembershipPreview";
import HowItWorks from "@/components/home/HowItWorks";
import Events from "@/components/home/Events";

// Images
import heroImage from "@assets/generated_images/golf_balls_on_turf_in_simulator.png";
import techImage from "@assets/generated_images/golf_ball_on_turf_close_up.png";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - "Urban Swing" Style Replicas */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 overflow-hidden bg-background">
        
        {/* Faint Background Text "GOLF" */}
        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden z-0">
           <span className="text-[25vw] font-heading font-bold text-[#EAE6D9] leading-none opacity-60 transform -translate-y-1/4">
             GOLF
           </span>
        </div>

        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-12 items-center relative z-10">
          
          {/* Left Content */}
          <div className="md:col-span-6 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-6xl md:text-8xl font-heading font-bold text-foreground leading-[0.9] tracking-tighter mb-6">
                AMENEZ LE <br />
                PARCOURS <br />
                À L'INTÉRIEUR <br />
                À CHAQUE ÉLAN
              </h1>
              
              <p className="text-lg md:text-xl text-foreground font-sans max-w-md leading-relaxed mb-8">
                Simulateurs de golf haut de gamme, données réelles et expérience lounge exclusive.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/contact">
                  <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 h-14 text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105">
                    Réserver une session
                  </Button>
                </Link>
                <Link href="/rates">
                  <Button variant="outline" className="bg-transparent text-foreground border-foreground hover:bg-foreground hover:text-background rounded-full px-8 h-14 text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105">
                    Voir les abonnements
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Image Composition */}
          <div className="md:col-span-6 relative h-[600px] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-md md:max-w-full aspect-[3/4] md:aspect-auto md:h-full"
            >
              {/* Main Image Card */}
              <div className="w-full h-full rounded-lg overflow-hidden relative z-10 shadow-2xl">
                <img 
                  src={heroImage} 
                  alt="Balles de golf sur gazon synthétique" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Black Card - Overlapping Right */}
              <div className="absolute top-[20%] -right-4 md:-right-12 bg-foreground text-background p-8 md:p-10 z-20 shadow-2xl max-w-[240px] md:max-w-[280px]">
                <h2 className="text-6xl md:text-7xl font-heading font-bold leading-none mb-2">
                  24/7
                </h2>
                <h3 className="text-2xl font-heading font-bold uppercase tracking-wider mb-4">
                  Accès
                </h3>
                <p className="text-sm font-sans text-background/80 leading-relaxed">
                  Jouez sur des parcours de renommée mondiale à tout moment.
                </p>
              </div>

              {/* Arrow Circle - Overlapping Bottom Left Corner */}
              <div className="absolute -bottom-8 left-8 md:left-12 z-30">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg border-4 border-background"
                >
                  <ArrowDown className="text-white w-8 h-8" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brand Marquee */}
      <BrandMarquee />

      {/* How It Works */}
      <HowItWorks />

      {/* Tour Level Tech Section */}
      <section className="py-24 bg-background text-foreground">
        <div className="container mx-auto px-6 md:px-12">
           <div className="grid md:grid-cols-2 gap-16 items-center">
             <div className="relative h-[500px] rounded-lg overflow-hidden">
                <img 
                  src={techImage} 
                  alt="Gros plan balle de golf" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
             </div>
             <div className="space-y-8">
                <h2 className="text-5xl md:text-7xl font-heading uppercase font-bold leading-none">
                  Technologie Pro
                </h2>
                <p className="text-lg font-sans leading-relaxed max-w-md">
                  Découvrez la précision de la technologie Trackman 4. Chaque drive, approche et putt est capturé avec une précision hyper-réaliste, vous permettant d'analyser votre jeu comme un pro.
                </p>
                <Button variant="link" className="text-primary p-0 h-auto font-bold uppercase tracking-wider text-sm hover:no-underline hover:opacity-70">
                  En savoir plus sur notre tech
                </Button>
             </div>
           </div>
        </div>
      </section>

      {/* Membership Preview */}
      <MembershipPreview />
      
      {/* Events Section */}
      <Events />

      {/* Testimonials */}
      <Testimonials />
    </Layout>
  );
}
