import { Link } from "wouter";
import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background pt-24 pb-12 border-t border-white/10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          {/* Brand */}
          <div className="space-y-6">
            <h3 className="font-heading text-4xl font-bold uppercase leading-none tracking-tighter">
              Golf SIM <span className="text-primary block text-sm tracking-[0.2em] mt-1">Sorel-Tracy</span>
            </h3>
            <p className="text-white/60 leading-relaxed font-sans max-w-xs">
              The ultimate indoor golf experience. High-end simulators, lounge atmosphere, and 24/7 access for members.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="font-heading font-bold text-xl uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-3">
              <li><Link href="/"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">Home</a></Link></li>
              <li><Link href="/about"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">The Club</a></Link></li>
              <li><Link href="/rates"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">Rates & Memberships</a></Link></li>
              <li><Link href="/gallery"><a className="text-white/60 hover:text-primary transition-colors font-sans font-medium uppercase text-sm tracking-wide">Gallery</a></Link></li>
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
            <h4 className="font-heading font-bold text-xl uppercase tracking-wider text-white">Follow Us</h4>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all text-white/60">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-white transition-all text-white/60">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
            <div className="pt-6 border-t border-white/10">
              <p className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Members 24/7</p>
              <p className="text-sm text-white/60 font-sans">Visitors: 10am - 10pm</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/40 font-sans uppercase tracking-wider">
          <p>&copy; {new Date().getFullYear()} Golf SIM Sorel-Tracy. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
