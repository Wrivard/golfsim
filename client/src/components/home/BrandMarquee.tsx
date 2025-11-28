import { motion } from "framer-motion";

// Import images locally to ensure they load
import trackman from "@/assets/images/trackman_logo_white_transparent.png";
import titleist from "@/assets/images/titleist_logo_white_transparent.png";
import taylormade from "@/assets/images/taylormade_logo_white_transparent.png";
import callaway from "@/assets/images/callaway_logo_white_transparent.png";
import ping from "@/assets/images/ping_logo_white_transparent.png";
import cobra from "@/assets/images/cobra_logo_white_transparent.png";
import pxg from "@/assets/images/pxg_logo_white_transparent.png";
import mizuno from "@/assets/images/mizuno_logo_white_transparent.png";

const BRANDS = [
  { name: "Trackman", logo: trackman },
  { name: "Titleist", logo: titleist },
  { name: "TaylorMade", logo: taylormade },
  { name: "Callaway", logo: callaway },
  { name: "Ping", logo: ping },
  { name: "Cobra", logo: cobra },
  { name: "PXG", logo: pxg },
  { name: "Mizuno", logo: mizuno },
];

export default function BrandMarquee() {
  return (
    <div className="w-full bg-foreground text-background py-12 overflow-hidden border-y border-white/10">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/60">Propulsé par les leaders de l'industrie</p>
      </div>
      
      <div className="relative flex overflow-x-hidden group">
        <motion.div
          className="flex items-center gap-16 md:gap-32 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 30 
          }}
        >
          {[...BRANDS, ...BRANDS].map((brand, index) => (
            <div 
              key={index} 
              className="w-32 md:w-40 h-16 relative flex items-center justify-center transition-opacity cursor-pointer hover:opacity-80"
            >
              <img 
                src={brand.logo} 
                alt={brand.name} 
                className="w-full h-full object-contain mix-blend-screen filter grayscale contrast-200" 
              />
            </div>
          ))}
        </motion.div>
        
        {/* Gradient Fade */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-foreground to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-foreground to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );
}
