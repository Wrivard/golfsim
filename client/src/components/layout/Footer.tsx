import { Link } from "wouter";
import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";
import logo from "@assets/713ff390-44c3-4643-aade-0154b9a25262.jfif_1764347062569.png";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background pt-24 pb-12 border-t border-white/10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div className="space-y-6">
            <div className="w-40 filter invert brightness-0 saturate-100 opacity-90">
              <img 
                src={logo} 
                alt="Golf SIM Sorel-Tracy" 
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="text-white/60 leading-relaxed font-sans max-w-xs">
              L'expérience de golf intérieur ultime. Simulateurs haut de gamme, ambiance lounge et accès 24/7 pour les membres.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-xl uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-3">
              <li><Link href="/"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">Accueil</a></Link></li>
              <li><Link href="/about"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">Le Club</a></Link></li>
              <li><Link href="/rates"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">Tarifs & Forfaits</a></Link></li>
              <li><Link href="/gallery"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">Galerie</a></Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-xl uppercase tracking-wider text-white">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 text-white/60 group">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <MapPin className="w-4 h-4 shrink-0" />
                </div>
                <span className="font-sans text-sm leading-relaxed mt-1">123 Rue du Golf,<br />Sorel-Tracy, QC J3P 1A1</span>
              </li>
              <li className="flex items-center gap-4 text-white/60 group">
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Phone className="w-4 h-4 shrink-0" />
                </div>
                <a href="tel:+14501234567" className="hover:text-white transition-colors font-sans text-sm font-bold tracking-wide">(450) 123-4567</a>
              </li>
              <li className="flex items-center gap-4 text-white/60 group">
                 <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Mail className="w-4 h-4 shrink-0" />
                </div>
                <a href="mailto:info@golfsimst.com" className="hover:text-white transition-colors font-sans text-sm font-bold tracking-wide">info@golfsimst.com</a>
              </li>
            </ul>
          </div>

          {/* Social & Hours */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-xl uppercase tracking-wider text-white">Suivez-nous</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all text-white/60">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all text-white/60">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div className="pt-6 border-t border-white/10">
              <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Membres 24/7</p>
              <p className="text-sm text-white/60 font-sans">Visiteurs : 10h - 22h</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/40 font-sans uppercase tracking-wider">
          <p>&copy; {new Date().getFullYear()} Golf SIM Sorel-Tracy. Tous droits réservés.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
