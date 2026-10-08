import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export default function ScrollGolfPath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<SVGCircleElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null); // New shadow ref
  const pathRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    const ball = ballRef.current;
    const shadow = shadowRef.current;
    const path = pathRef.current;
    const line = lineRef.current;

    if (!container || !ball || !path || !line || !shadow) return;

    const totalLength = line.getTotalLength();
    
    // Initial setup
    gsap.set(line, {
      strokeDasharray: totalLength,
      strokeDashoffset: totalLength,
      opacity: 0.4
    });
    
    gsap.set(ball, {
      transformOrigin: "center center",
      scale: 0,
      opacity: 0
    });

    gsap.set(shadow, {
      transformOrigin: "center center",
      scale: 0,
      opacity: 0
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top center",
        end: "bottom bottom", 
        scrub: 1.5, // Increased scrub for smoother, weightier feel
      }
    });

    // 1. Appear (Tee off)
    tl.to([ball, shadow], { scale: 1, opacity: 1, duration: 0.05 }, 0);

    // 2. Ball Physics & Movement
    // We separate X/Y path following from Scale (Z-axis) for 3D feel

    // Movement along path
    tl.to(ball, {
      motionPath: {
        path: path,
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: false
      },
      duration: 1,
      ease: "power1.inOut" // Gentle acceleration/deceleration
    }, 0);

    // Shadow follows ball exactly on X/Y (top-down view)
    tl.to(shadow, {
      motionPath: {
        path: path,
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: false
      },
      duration: 1,
      ease: "power1.inOut"
    }, 0);

    // 3. "Arc" Simulation (Z-axis / Height)
    // Ball gets larger (closer) at apex, smaller at end
    tl.to(ball, {
      keyframes: {
        "0%": { scale: 1 },
        "50%": { scale: 1.8 }, // Apex of flight - closer to camera
        "100%": { scale: 0.6 } // Landing - far away/in hole
      },
      duration: 1,
      ease: "sine.inOut"
    }, 0);

    // Shadow logic: When ball is high (big), shadow is diffuse and light
    // When ball is low (small), shadow is sharp and dark
    tl.to(shadow, {
      keyframes: {
        "0%": { scale: 1, opacity: 0.3, filter: "blur(2px)" },
        "50%": { scale: 1.5, opacity: 0.1, filter: "blur(8px)" }, // High up: shadow big & blurry
        "100%": { scale: 0.6, opacity: 0.4, filter: "blur(1px)" } // Landing: shadow sharp
      },
      duration: 1,
      ease: "sine.inOut"
    }, 0);

    // 4. Draw Trail
    tl.to(line, {
      strokeDashoffset: 0,
      duration: 1,
      ease: "power1.inOut"
    }, 0);

    // 5. Spin ball
    tl.to(ball, {
      rotation: 720,
      duration: 1,
      ease: "power1.in" // Spin accelerates
    }, 0);

    // 6. Drop in hole (The "Plunk")
    tl.to(ball, {
      scale: 0.3,
      opacity: 0,
      duration: 0.05,
      ease: "back.in(2)" // Suck into hole effect
    }, 0.98);
    
    // Shadow disappears slightly before ball
    tl.to(shadow, {
      scale: 0,
      opacity: 0,
      duration: 0.05
    }, 0.95);

  }, { scope: containerRef });

  const pathData = "M 900 50 Q 700 250, 900 500 T 900 850";

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden xl:block overflow-hidden"
    >
      <svg 
        viewBox="0 0 1000 1000" 
        className="w-full h-full" 
        preserveAspectRatio="xMaxYMid meet"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="flightTrail" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="20%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="80%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Invisible Path for MotionPath to follow */}
        <path
          ref={pathRef}
          d={pathData}
          fill="none"
          stroke="none"
        />

        {/* Visible Dotted Line - Subtle Trail */}
        <path
          ref={lineRef}
          d={pathData}
          fill="none"
          stroke="url(#flightTrail)"
          strokeWidth="2" // Thinner, more elegant
          strokeDasharray="4 8" // Finer dots
          strokeLinecap="round"
        />

        {/* The Hole */}
        <g transform="translate(900, 850)">
          <ellipse rx="22" ry="10" fill="rgba(0,0,0,0.6)" />
          <circle r="16" fill="#121212" />
          
          {/* Flag */}
          <g transform="translate(0,0)">
             <line x1="0" y1="0" x2="0" y2="-100" stroke="white" strokeWidth="2" />
             <path d="M 0 -100 L 35 -85 L 0 -70 Z" fill="#2B5734" />
          </g>
        </g>

        {/* Shadow - Rendered BEFORE ball so it's underneath */}
        <ellipse 
          ref={shadowRef}
          rx="12"
          ry="12"
          fill="black"
        />

        {/* The Ball */}
        <circle
          ref={ballRef}
          r="12"
          fill="white"
          stroke="#d4d4d4"
          strokeWidth="1"
          filter="url(#glow)" // Subtle glow for premium feel
        />
      </svg>
    </div>
  );
}
