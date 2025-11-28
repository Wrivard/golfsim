import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function ScrollGolfPath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const svgRef = useRef<SVGPathElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Get path length for drawing animation
  useEffect(() => {
    if (svgRef.current) {
      setPathLength(svgRef.current.getTotalLength());
    }
  }, []);

  // Animate the path drawing
  const drawProgress = useTransform(scrollYProgress, [0, 0.9], [0, 1]);
  
  // Ball position along the path
  // We'll use a simpler approach for the ball: calculate position based on scroll percentage
  // but mapping it to key coordinates that match our SVG path
  
  // SVG Path Definition:
  // Start: Top Center (50% 0%)
  // Curve 1: Right (80% 20%)
  // Curve 2: Left (20% 40%)
  // Curve 3: Right (70% 60%)
  // Curve 4: Center (50% 80%)
  // End: Hole at Bottom Center (50% 95%)
  
  // Simplified responsive coordinates
  const x = useTransform(scrollYProgress, 
    [0, 0.2, 0.4, 0.6, 0.8, 0.95], 
    ["50%", "80%", "20%", "70%", "50%", "50%"]
  );
  
  const y = useTransform(scrollYProgress, 
    [0, 0.2, 0.4, 0.6, 0.8, 0.95], 
    ["15%", "25%", "45%", "65%", "85%", "95%"]
  );

  const scale = useTransform(scrollYProgress, 
    [0, 0.9, 0.95, 1], 
    [1, 1, 0.5, 0] // Always visible until hole
  );

  const opacity = useTransform(scrollYProgress, [0, 0.02], [1, 1]); // Always visible
  const rotation = useTransform(scrollYProgress, [0, 1], [0, 720]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-30 hidden xl:block overflow-hidden">
       <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(43, 87, 52, 0)" />
              <stop offset="10%" stopColor="rgba(43, 87, 52, 0.4)" />
              <stop offset="90%" stopColor="rgba(43, 87, 52, 0.4)" />
              <stop offset="100%" stopColor="rgba(43, 87, 52, 0)" />
            </linearGradient>
          </defs>
          
          {/* Dotted Flight Path */}
          <motion.path
            ref={svgRef}
            d="M 50% 15% Q 80% 20%, 80% 25% T 20% 45% T 70% 65% T 50% 95%"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeDasharray="12 12"
            style={{ 
              pathLength: drawProgress,
              opacity: 0.8 
            }}
          />
          
          {/* The Hole */}
          <circle cx="50%" cy="95%" r="12" fill="#1a1a1a" fillOpacity="0.8" />
          <ellipse cx="50%" cy="95%" rx="12" ry="4" fill="#000" fillOpacity="0.5" />
       </svg>
       
       {/* The Ball */}
       <motion.div 
         className="fixed w-8 h-8 z-50 flex items-center justify-center"
         style={{ 
           left: x,
           top: y,
           scale,
           opacity,
           x: "-50%", // Center the ball on the point
           y: "-50%"
         }}
       >
         <motion.div 
           className="w-full h-full bg-white rounded-full shadow-xl border border-gray-200 relative overflow-hidden"
           style={{ rotate: rotation }}
         >
            {/* Dimples pattern simulation */}
            <div className="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:3px_3px] opacity-30" />
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-300 opacity-80" />
         </motion.div>
       </motion.div>
    </div>
  );
}
