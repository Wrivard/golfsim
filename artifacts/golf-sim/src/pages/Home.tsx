import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import Testimonials from "@/components/home/Testimonials";
import SimulatorCTA from "@/components/home/SimulatorCTA";
import MembershipPreview from "@/components/home/MembershipPreview";
import HowItWorks from "@/components/home/HowItWorks";
import Events from "@/components/home/Events";
import ScrollGolfPath from "@/components/home/ScrollGolfPath";
import BarLounge from "@/components/home/BarLounge";

// Images
// Fix imports to use local assets instead of generated_images alias directly if inconsistent
import heroImage from "@assets/20260105-1-01_1790696495855.webp";
import techImage from "@assets/20260105-2-02_1790696495856.webp";

export default function Home() {
  return (
    <Layout>
      {/* Hero Section - "Urban Swing" Style Replicas */}
      <section className="relative min-h-screen flex flex-col justify-center pt-20 pb-16 md:pb-0 overflow-hidden bg-background z-10">
        
        {/* Faint Background Text "GOLF" */}
        <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden z-0">
           <span className="text-[25vw] font-heading font-bold text-[#EAE6D9] leading-none opacity-60 transform -translate-y-1/4">
             GOLF
           </span>
        </div>

        <div className="container mx-auto px-6 md:px-12 grid md:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          
          {/* Left Content */}
          <div className="md:col-span-7 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-4xl lg:text-5xl xl:text-7xl font-heading font-bold text-foreground uppercase leading-[1.15] tracking-tighter mb-6">
                Le meilleur <br />
                simulateur de golf <br />
                intérieur à <br />
                Sorel-Tracy
              </h1>
              
              <p className="text-lg md:text-xl text-foreground font-sans max-w-md leading-relaxed mb-8">
                Simulateurs de golf haut de gamme, données réelles et expérience lounge exclusive.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/booking">
                  <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 h-14 text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105">
                    Réserver une session
                  </Button>
                </Link>
                <Link href="/rates">
                  <Button variant="outline" className="bg-transparent text-foreground border-foreground hover:bg-foreground hover:text-background rounded-full px-8 h-14 text-sm font-bold uppercase tracking-wider transition-transform hover:scale-105">
                    Voir nos tarifs
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Image Composition */}
          <div className="md:col-span-5 relative h-[450px] md:h-[600px] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-md md:max-w-full aspect-[3/4] md:aspect-auto md:h-full"
            >
              {/* Main Image Card */}
              <div className="w-full h-full rounded-lg overflow-hidden relative z-10">
                <img 
                  src={heroImage} 
                  alt="Baie de golf et écran de simulation"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Black Card - Overlapping Right */}
              <div className="absolute top-[10%] md:top-[20%] right-0 md:-right-12 bg-foreground text-background p-6 md:p-10 z-20 shadow-2xl max-w-[180px] md:max-w-[280px]">
                <h2 className="text-4xl md:text-7xl font-heading font-bold leading-none mb-2">
                  4
                </h2>
                <h3 className="text-xl md:text-2xl font-heading font-bold uppercase tracking-wider mb-2 md:mb-4">
                  Simulateurs
                </h3>
                <p className="text-xs md:text-sm font-sans text-background/80 leading-relaxed hidden md:block">
                  Jouez sur des parcours de renommée mondiale avec GSPro.
                </p>
              </div>

              {/* Arrow Circle - Overlapping Bottom Left Corner */}
              <div className="absolute -bottom-8 md:-bottom-16 -left-4 md:-left-16 z-30">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-20 h-20 md:w-32 md:h-32 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors border-[8px] md:border-[12px] border-background"
                >
                  <ArrowDown className="text-background w-8 h-8 md:w-12 md:h-12" strokeWidth={1.5} />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <div className="relative z-10">
         <HowItWorks />
      </div>

      {/* Tour Level Tech Section */}
      <section className="py-24 bg-background text-foreground relative overflow-hidden z-10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "30px 30px" }}></div>
        
        <div className="container mx-auto px-6 md:px-12 relative z-10">
           <div className="grid md:grid-cols-2 gap-16 items-center">
             <div className="relative h-[500px] rounded-lg overflow-hidden order-2 md:order-1 shadow-2xl group">
                <div className="absolute inset-0 bg-primary/10 z-10 group-hover:opacity-0 transition-opacity duration-500" />
                <img 
                  src={techImage} 
                  alt="Gros plan balle de golf" 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-105"
                />
                {/* Tech Overlay Tag */}
                <div className="absolute bottom-6 left-6 bg-background/90 backdrop-blur px-4 py-2 rounded text-xs font-bold uppercase tracking-widest z-20">
                   GSPro
                </div>
             </div>
             <div className="space-y-8 order-1 md:order-2">
                <div className="inline-block py-1 px-3 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                  Performance
                </div>
                <h2 className="text-5xl md:text-7xl font-heading uppercase font-bold leading-none">
                  Technologie <br/> <span className="text-primary">Pro</span>
                </h2>
                <p className="text-lg font-sans leading-relaxed max-w-md text-muted-foreground">
                  Découvrez GSPro, le logiciel de simulation qui vous permet de jouer sur des parcours virtuels et de consulter les données de vos coups.
                </p>
             </div>
           </div>
        </div>
      </section>

      {/* Bar & Lounge Section */}
      <div className="relative z-10">
        <BarLounge />
      </div>

      {/* Membership Preview - Overlaps next section */}
      <div className="relative z-20">
        <MembershipPreview />
      </div>
      
      {/* Events Section - Negative margin to pull up */}
      <div className="relative z-10 -mt-12 pt-12">
        <Events />
      </div>

      {/* Testimonials */}
      <Testimonials />

      {/* Simulator CTA */}
      <SimulatorCTA />
    </Layout>
  );
}
