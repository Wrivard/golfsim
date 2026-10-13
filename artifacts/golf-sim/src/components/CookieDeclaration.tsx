import { useEffect, useRef } from "react";

export default function CookieDeclaration() {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!["golfsimsorel.ca", "www.golfsimsorel.ca"].includes(window.location.hostname)) return;
    const element = container.current;
    if (!element) return;
    const script = document.createElement("script");
    script.id = "CookieDeclaration";
    script.src = "https://consent.cookiebot.com/ce5cea44-601a-436a-92f6-f64f522e2fdf/cd.js";
    script.type = "text/javascript";
    script.async = true;
    script.setAttribute("data-cookieconsent", "ignore");
    element.appendChild(script);
    return () => { element.replaceChildren(); };
  }, []);
  return <section aria-label="Déclaration des cookies Cookiebot" ref={container} />;
}
