import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

export default function ScrollGolfPath() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ballRef = useRef<SVGCircleElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);

  useGSAP(() => {
    const container = containerRef.current;
    const ball = ballRef.current;
    const path = pathRef.current;
    const line = lineRef.current;

    if (!container || !ball || !path || !line) return;

    // Reset initial state
    const totalLength = line.getTotalLength();
    
    // Initial setup
    gsap.set(line, {
      strokeDasharray: totalLength,
      strokeDashoffset: totalLength,
      opacity: 0.6
    });
    
    gsap.set(ball, {
      transformOrigin: "center center",
      scale: 0,
      opacity: 0
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top bottom", // Start when top of section hits bottom of viewport
        end: "bottom bottom", // End when bottom of section hits bottom of viewport
        scrub: 1,
      }
    });

    // 1. Appear
    tl.to(ball, { scale: 1, opacity: 1, duration: 0.05 }, 0);

    // 2. Move along path
    tl.to(ball, {
      motionPath: {
        path: path,
        align: path,
        alignOrigin: [0.5, 0.5],
        autoRotate: false
      },
      duration: 1,
      ease: "none"
    }, 0);

    // 3. Draw line
    tl.to(line, {
      strokeDashoffset: 0,
      duration: 1,
      ease: "none"
    }, 0);

    // 4. Spin ball
    tl.to(ball, {
      rotation: 720,
      duration: 1,
      ease: "none"
    }, 0);

    // 5. Drop in hole
    tl.to(ball, {
      scale: 0.5,
      opacity: 0,
      duration: 0.05,
      ease: "power1.in"
    }, 0.95);

  }, { scope: containerRef });

  // Coordinate system: 0-1000 for both X and Y
  // This ensures consistent scaling regardless of screen size
  const pathData = "M 900 50 Q 700 250, 900 500 T 900 950";

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 hidden xl:block overflow-hidden"
    >
      <svg 
        viewBox="0 0 1000 1000" 
        className="w-full h-full" 
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="flightTrail" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="20%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="80%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Invisible Path for MotionPath to follow */}
        <path
          ref={pathRef}
          d={pathData}
          fill="none"
          stroke="none"
        />

        {/* Visible Dotted Line */}
        <path
          ref={lineRef}
          d={pathData}
          fill="none"
          stroke="url(#flightTrail)"
          strokeWidth="4"
          strokeDasharray="10 15"
          strokeLinecap="round"
        />

        {/* The Hole */}
        <g transform="translate(900, 950)">
          <ellipse rx="20" ry="8" fill="rgba(0,0,0,0.5)" />
          <circle r="15" fill="#1a1a1a" />
          
          {/* Flag */}
          <line x1="0" y1="0" x2="0" y2="-100" stroke="white" strokeWidth="2" />
          <path d="M 0 -100 L 30 -85 L 0 -70 Z" fill="#2B5734" />
        </g>

        {/* The Ball */}
        <circle
          ref={ballRef}
          r="12"
          fill="white"
          stroke="#e5e5e5"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}
