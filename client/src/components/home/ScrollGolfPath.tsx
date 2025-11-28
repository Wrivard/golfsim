import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export default function ScrollGolfPath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<SVGGElement>(null); // Changed to SVG element
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
      autoAlpha: 0, // Use autoAlpha instead of opacity for better performance
      scale: 0,
      // No need for xPercent/yPercent if we use alignOrigin in motionPath
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
        start: "top center", // Start earlier so user sees it
        end: "bottom bottom", // End when container hits bottom
        scrub: 1, // Smooth scrubbing
      }
    });

    // 1. Fade in ball at start
    tl.to(ball, { autoAlpha: 1, scale: 1, duration: 0.05 }, 0);

    // 2. Animate Ball along path
    tl.to(ball, {
      motionPath: {
        path: path, // Use the actual path for alignment
        align: path,
        alignOrigin: [0.5, 0.5], // Center ball on path
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
      scale: 0.5, 
      autoAlpha: 0,
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
                strokeWidth="6" // Wider than the dotted line
                strokeLinecap="round"
              />
            </mask>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.8)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.2)" />
            </linearGradient>
            
            {/* Ball Gradient */}
            <radialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
               <stop offset="0%" stopColor="#ffffff" />
               <stop offset="100%" stopColor="#d1d5db" />
            </radialGradient>
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
            strokeDasharray="8 8" // Dotted pattern
            strokeLinecap="round"
            mask="url(#pathMask)" // Apply the mask
          />
          
          {/* Flag - SVG Implementation for perfect positioning */}
          <g transform="translate(-2, -2)"> {/* Small tweak to align with hole visually */}
             <line x1="90%" y1="95%" x2="90%" y2="85%" stroke="white" strokeWidth="3" />
             <path d="M 90% 85% L 93% 87% L 90% 89% Z" fill="#2B5734" stroke="#1B1A18" strokeWidth="0.5" />
          </g>

          {/* The Ball - Now purely SVG for perfect coordinate sync */}
          <g ref={ballRef} style={{ opacity: 0 }}> {/* Initial opacity 0 handled by CSS/JS */}
             <circle r="12" fill="url(#ballGradient)" stroke="#e5e7eb" strokeWidth="1" />
             {/* Simple dimples simulation */}
             <circle r="1" cx="-4" cy="-4" fill="#9ca3af" opacity="0.3" />
             <circle r="1" cx="4" cy="-4" fill="#9ca3af" opacity="0.3" />
             <circle r="1" cx="-4" cy="4" fill="#9ca3af" opacity="0.3" />
             <circle r="1" cx="4" cy="4" fill="#9ca3af" opacity="0.3" />
             <circle r="1" cx="0" cy="0" fill="#9ca3af" opacity="0.3" />
          </g>

       </svg>
    </div>
  );
}
