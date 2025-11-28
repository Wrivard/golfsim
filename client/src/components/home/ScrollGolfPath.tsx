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
  
  // Simplified responsive coordinates - RIGHT SIDE
  const x = useTransform(scrollYProgress, 
    [0, 0.2, 0.5, 0.8, 1], 
    ["90%", "80%", "90%", "80%", "90%"]
  );
  
  const y = useTransform(scrollYProgress, 
    [0, 0.2, 0.5, 0.8, 1], 
    ["5%", "25%", "50%", "75%", "95%"]
  );

  const scale = useTransform(scrollYProgress, 
    [0, 0.98, 1], 
    [1, 1, 0] // Vanish at end
  );

  const opacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]); // Fade in at start
  const rotation = useTransform(scrollYProgress, [0, 1], [0, 720]);

  // Path draw animation - trails behind ball
  const drawProgress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden xl:block overflow-hidden">
       <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
              <stop offset="20%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="80%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
          
          {/* Dotted Flight Path - RIGHT SIDE ARC */}
          <motion.path
            ref={svgRef}
            d="M 90% 5% Q 70% 25%, 90% 50% T 90% 95%"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeDasharray="6 6"
            style={{ 
              pathLength: drawProgress,
              opacity: 0.6 
            }}
          />
          
          {/* The Hole - RIGHT SIDE */}
          <g transform="translate(0, -5)"> {/* Adjust for flag position */}
            <circle cx="90%" cy="95%" r="14" fill="#1a1a1a" fillOpacity="0.8" />
            <ellipse cx="90%" cy="95%" rx="14" ry="5" fill="#000" fillOpacity="0.5" />
            
            {/* Flag */}
            <line x1="90%" y1="95%" x2="90%" y2="85%" stroke="white" strokeWidth="2" />
            <path d="M 90% 85% L 93% 87% L 90% 89% Z" fill="#2B5734" />
          </g>
       </svg>
       
       {/* The Ball */}
       <motion.div 
         className="absolute w-8 h-8 z-50 flex items-center justify-center"
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
