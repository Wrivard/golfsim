import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import logo from "@assets/713ff390-44c3-4643-aade-0154b9a25262.jfif_1764347062569.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Accueil", href: "/" },
    { name: "Le Club", href: "/about" },
    { name: "Forfaits", href: "/rates" },
    { name: "Galerie", href: "/gallery" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled || location !== "/" ? "bg-[#F7F3E8] py-4 border-b border-black/5 shadow-sm" : "bg-transparent py-8"
      )}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo - Image */}
        <Link href="/">
          <a className="block w-32 md:w-40 relative z-50">
            <img 
              src={logo} 
              alt="Golf SIM Sorel-Tracy" 
              className="w-full h-auto object-contain"
            />
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <a
                className={cn(
                  "text-sm font-bold uppercase tracking-wider transition-colors hover:text-primary",
                  location === link.href ? "text-primary" : "text-foreground"
                )}
              >
                {link.name}
              </a>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link href="/contact">
            <Button className="bg-foreground text-background hover:bg-primary hover:text-white rounded-full px-6 h-10 text-xs font-bold uppercase tracking-wider transition-all">
              Réserver
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-foreground z-50"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#F7F3E8] z-40 flex flex-col items-center justify-center gap-8 animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <a
                className={cn(
                  "text-3xl font-heading font-bold uppercase tracking-tight",
                  location === link.href ? "text-primary" : "text-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            </Link>
          ))}
          <Link href="/contact">
            <Button className="mt-4 rounded-full h-14 px-12 text-sm font-bold uppercase tracking-wider bg-primary text-white" onClick={() => setIsOpen(false)}>
              Réserver une session
            </Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
