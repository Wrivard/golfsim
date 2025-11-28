import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export default function ScrollGolfPath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const path = pathRef.current;
    const ball = ballRef.current;
    const container = containerRef.current;

    if (!path || !ball || !container) return;

    // Initial states
    gsap.set(ball, { 
      opacity: 0, 
      scale: 0,
      xPercent: -50, 
      yPercent: -50 
    });
    
    const pathLength = path.getTotalLength();
    gsap.set(path, { 
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      opacity: 0.6
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top bottom", // Start when container hits bottom of viewport
        end: "bottom bottom", // End when container hits bottom of viewport
        scrub: 1, // Smooth scrubbing
        // markers: true // Debug markers
      }
    });

    // 1. Fade in ball at start
    tl.to(ball, { opacity: 1, scale: 1, duration: 0.05 }, 0);

    // 2. Animate Ball along path
    tl.to(ball, {
      motionPath: {
        path: path,
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: false, // We'll rotate manually for spin effect
      },
      rotation: 720, // Spin the ball
      ease: "none",
      duration: 1
    }, 0);

    // 3. Draw the line following the ball
    tl.to(path, {
      strokeDashoffset: 0,
      ease: "none",
      duration: 1
    }, 0);

    // 4. Drop into hole at end (last 5%)
    tl.to(ball, {
      scale: 0,
      opacity: 0,
      duration: 0.05,
      ease: "power2.in"
    }, 0.95);

  }, { scope: containerRef });

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
          {/* Note: strokeDasharray is handled by GSAP for the drawing effect, 
              but we can set a base pattern if we want dashes. 
              However, simple drawSVG style is solid line. 
              If we want dashed draw, it's trickier without DrawSVG plugin.
              Let's stick to solid line for smoother GSAP drawing or try mask technique if needed.
              For now: Solid semi-transparent line tracing.
          */}
          <path
            ref={pathRef}
            d="M 90% 5% Q 70% 25%, 90% 50% T 90% 95%"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            // Remove static dasharray so GSAP can animate dashoffset for 'drawing' effect
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
       <div 
         ref={ballRef}
         className="absolute w-8 h-8 z-50 flex items-center justify-center opacity-0"
       >
         <div 
           className="w-full h-full bg-white rounded-full shadow-xl border border-gray-200 relative overflow-hidden"
         >
            {/* Dimples pattern simulation */}
            <div className="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:3px_3px] opacity-30" />
            <div className="w-full h-full rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-300 opacity-80" />
         </div>
       </div>
    </div>
  );
}
