import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export default function ScrollGolfPath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const maskPathRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const path = pathRef.current;
    const maskPath = maskPathRef.current;
    const ball = ballRef.current;
    const container = containerRef.current;

    if (!path || !maskPath || !ball || !container) return;

    // Initial states
    gsap.set(ball, { 
      opacity: 0, 
      scale: 0,
      xPercent: -50, 
      yPercent: -50 
    });
    
    // Prepare the mask path for "drawing" animation
    const length = maskPath.getTotalLength();
    gsap.set(maskPath, { 
      strokeDasharray: length,
      strokeDashoffset: length
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top bottom", // Start when container hits bottom of viewport
        end: "bottom bottom", // End when container hits bottom of viewport
        scrub: 1, // Smooth scrubbing
      }
    });

    // 1. Fade in ball at start
    tl.to(ball, { opacity: 1, scale: 1, duration: 0.05 }, 0);

    // 2. Animate Ball along path
    tl.to(ball, {
      motionPath: {
        path: path, // Use the actual path for alignment
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: false, 
      },
      rotation: 720, // Spin the ball
      ease: "none",
      duration: 1
    }, 0);

    // 3. Draw the mask line (revealing the dotted line underneath)
    tl.to(maskPath, {
      strokeDashoffset: 0,
      ease: "none",
      duration: 1
    }, 0);

    // 4. Drop into hole at end (last 5%)
    // Scale down and move slightly "into" the hole visually if needed
    tl.to(ball, {
      scale: 0.2, // Don't disappear completely, just get small like it's deep
      opacity: 0,
      duration: 0.05,
      ease: "power1.in"
    }, 0.95);

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden xl:block overflow-hidden">
       <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <mask id="pathMask">
              {/* This path overlays the dotted line and reveals it as it draws */}
              <path
                ref={maskPathRef}
                d="M 90% 5% Q 70% 25%, 90% 50% T 90% 95%"
                fill="none"
                stroke="white"
                strokeWidth="5" // Slightly wider than the dotted line to ensure full coverage
                strokeLinecap="round"
              />
            </mask>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
              <stop offset="20%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="80%" stopColor="rgba(255, 255, 255, 0.5)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
          
          {/* The Hole - Layered behind */}
          <g>
            <ellipse cx="90%" cy="95%" rx="18" ry="6" fill="#000" fillOpacity="0.6" />
            <circle cx="90%" cy="95%" r="12" fill="#1a1a1a" />
          </g>

          {/* Dotted Flight Path (Visible, masked) */}
          <path
            ref={pathRef} // Used for MotionPath alignment
            d="M 90% 5% Q 70% 25%, 90% 50% T 90% 95%"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeDasharray="6 10" // Dotted pattern
            strokeLinecap="round"
            mask="url(#pathMask)" // Apply the mask
          />
       </svg>

       {/* Flag - Absolutely Positioned HTML Element for easier styling/geometry */}
       <div 
          className="absolute"
          style={{ 
            left: "90%", 
            top: "95%", 
            transform: "translate(-2px, -100%)" // Anchor at bottom
          }}
       >
          {/* Pole */}
          <div className="w-1 h-24 bg-white mx-auto shadow-sm origin-bottom"></div>
          
          {/* Flag Triangle */}
          <div 
            className="absolute top-0 left-1/2 w-12 h-8 bg-[#2B5734] shadow-lg origin-left"
            style={{ 
              clipPath: "polygon(0 0, 100% 50%, 0 100%)"
            }}
          >
            {/* Inner detail */}
            <div className="absolute inset-0 bg-black/10" style={{ clipPath: "polygon(0 0, 30% 50%, 0 100%)" }}></div>
          </div>
       </div>
       
       {/* The Ball */}
       <div 
         ref={ballRef}
         className="absolute w-8 h-8 z-50 flex items-center justify-center opacity-0"
       >
         <div 
           className="w-full h-full bg-white rounded-full shadow-xl border border-gray-200 relative overflow-hidden"
         >
            <div className="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:3px_3px] opacity-30" />
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-300 opacity-80" />
         </div>
       </div>
    </div>
  );
}
