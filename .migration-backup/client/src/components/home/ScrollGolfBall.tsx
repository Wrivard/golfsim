import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function ScrollGolfBall() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Calculate path length roughly based on typical page height
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const ballY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  
  // Opacity fades in after hero
  const opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-50 hidden xl:block overflow-hidden">
       <svg className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <motion.path
            d="M 50 0 Q 55 10, 50 20 T 50 40 T 50 60 T 50 80 T 50 100"
            fill="none"
            stroke="rgba(43, 87, 52, 0.2)"
            strokeWidth="0.2"
            strokeDasharray="1 1"
            style={{ pathLength }}
          />
       </svg>
       
       <motion.div 
         className="fixed top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-xl border-2 border-primary z-50 flex items-center justify-center"
         style={{ 
           top: ballY,
           opacity,
           left: "50%" // Simplified straight line for stability, can be complex path with SVG motion path
         }}
       >
         <div className="w-1 h-1 bg-primary rounded-full opacity-50" />
       </motion.div>
    </div>
  );
}
