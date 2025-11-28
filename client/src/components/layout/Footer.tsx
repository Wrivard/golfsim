import { Link } from "wouter";
import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-serif text-2xl font-bold text-primary">
              Golf SIM <span className="text-foreground font-light">Sorel-Tracy</span>
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              L'expérience de golf intérieur ultime. Simulateurs haut de gamme, ambiance lounge et accès 24/7 pour les membres.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-lg">Navigation</h4>
            <ul className="space-y-2">
              <li><Link href="/"><a className="text-muted-foreground hover:text-primary transition-colors">Accueil</a></Link></li>
              <li><Link href="/about"><a className="text-muted-foreground hover:text-primary transition-colors">Le Club</a></Link></li>
              <li><Link href="/rates"><a className="text-muted-foreground hover:text-primary transition-colors">Tarifs & Forfaits</a></Link></li>
              <li><Link href="/gallery"><a className="text-muted-foreground hover:text-primary transition-colors">Galerie</a></Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-lg">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>123 Rue du Golf,<br />Sorel-Tracy, QC J3P 1A1</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href="tel:+14501234567" className="hover:text-primary transition-colors">(450) 123-4567</a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <a href="mailto:info@golfsimst.com" className="hover:text-primary transition-colors">info@golfsimst.com</a>
              </li>
            </ul>
          </div>

          {/* Social & Hours */}
          <div className="space-y-4">
            <h4 className="font-serif font-bold text-lg">Suivez-nous</h4>
            <div className="flex gap-4">
              <a href="#" className="bg-background p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="bg-background p-2 rounded-full border border-border hover:border-primary hover:text-primary transition-all">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div className="pt-4">
              <p className="text-sm font-medium text-primary">Ouvert 24/7 pour les membres</p>
              <p className="text-sm text-muted-foreground">Visiteurs : 10h - 22h</p>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Golf SIM Sorel-Tracy. Tous droits réservés.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground">Confidentialité</a>
            <a href="#" className="hover:text-foreground">Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
