import { motion } from "framer-motion";

const BRANDS = [
  "GSPRO",
  "TITLEIST",
  "TAYLORMADE",
  "CALLAWAY",
  "PING",
  "COBRA",
  "PXG",
  "MIZUNO"
];

export default function BrandMarquee() {
  return (
    <div className="w-full bg-foreground text-background py-12 overflow-hidden border-y border-white/10">
      <div className="relative flex overflow-hidden group no-scrollbar">
        <motion.div
          className="flex items-center gap-16 md:gap-32 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            repeat: Infinity, 
            ease: "linear", 
            duration: 20 
          }}
        >
          {[...BRANDS, ...BRANDS].map((brand, index) => (
            <span 
              key={index} 
              className="text-4xl md:text-6xl font-heading font-bold text-white/20 uppercase tracking-tighter hover:text-white transition-colors cursor-default"
            >
              {brand}
            </span>
          ))}
        </motion.div>
        
        {/* Gradient Fade */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-foreground to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-foreground to-transparent z-10 pointer-events-none" />
      </div>
    </div>
  );
}
