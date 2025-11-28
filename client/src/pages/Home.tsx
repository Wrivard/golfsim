import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import BrandMarquee from "@/components/home/BrandMarquee";
import Testimonials from "@/components/home/Testimonials";
import MembershipPreview from "@/components/home/MembershipPreview";
import HowItWorks from "@/components/home/HowItWorks";
import Events from "@/components/home/Events";

// Images
import heroImage from "@assets/generated_images/golf_balls_on_turf_in_simulator.png";
import techImage from "@assets/generated_images/golf_ball_on_turf_close_up.png";

// Golf Ball Component
function FloatingGolfBall() {
  const { scrollYProgress } = useScroll();
  
  // Ball moves from top right to bottom left across sections
  const y = useTransform(scrollYProgress, [0, 1], [0, 2000]);
  const x = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0, -100, 50, -50, 0]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 720]);
  const scale = useTransform(scrollYProgress, [0, 0.1, 1], [0.5, 1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <motion.div 
      className="fixed top-20 right-20 z-40 pointer-events-none hidden xl:block"
      style={{ y, x, rotate, scale, opacity }}
    >
      <div className="w-12 h-12 bg-white rounded-full shadow-2xl border border-gray-200 flex items-center justify-center relative overflow-hidden">
         {/* Dimples pattern simulation */}
         <div className="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:4px_4px] opacity-30" />
         <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-300 opacity-80" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  return (
    <Layout>
      <FloatingGolfBall />
      
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
      <div className="relative z-20">
         <BrandMarquee />
      </div>

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
                   Trackman 4
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
                  Découvrez la précision de la technologie Trackman 4. Chaque drive, approche et putt est capturé avec une précision hyper-réaliste, vous permettant d'analyser votre jeu comme un pro.
                </p>
                
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-sm cursor-pointer group">
                   <span>En savoir plus sur notre tech</span>
                   <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
             </div>
           </div>
        </div>
      </section>

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
    </Layout>
  );
}
