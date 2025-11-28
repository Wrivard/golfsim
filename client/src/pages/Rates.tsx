import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Link } from "wouter";
import FAQ from "@/components/rates/FAQ";

export default function Rates() {
  return (
    <Layout>
       {/* Header */}
       <div className="bg-foreground text-background py-32 pt-40">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-heading font-bold mb-6 uppercase tracking-tighter leading-none">Rates & <span className="text-primary">Memberships</span></h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto font-sans">
            Flexible options for casual players and dedicated enthusiasts alike.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-24">
          
          {/* Visitor Card */}
          <div className="bg-transparent border-2 border-foreground/10 p-8 flex flex-col relative hover:border-foreground transition-all duration-300 group">
            <h3 className="font-heading font-bold text-3xl mb-2 uppercase">Visitor</h3>
            <p className="text-muted-foreground mb-8 font-sans">For the occasional round.</p>
            <div className="mb-8 pb-8 border-b border-foreground/10">
              <span className="text-6xl font-heading font-bold">45$</span>
              <span className="text-muted-foreground font-sans font-bold text-sm uppercase tracking-wider"> / hour</span>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Standard Simulator Access</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Up to 4 players per bay</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Rental clubs available</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button className="w-full rounded-full h-14 text-sm font-bold uppercase tracking-wider bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background">
                Book Now
              </Button>
            </Link>
          </div>

          {/* Member Card (Highlighted) */}
          <div className="bg-foreground text-background p-10 flex flex-col relative shadow-2xl transform md:-translate-y-8 z-10">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-2">Most Popular</div>
            <h3 className="font-heading font-bold text-3xl mb-2 uppercase text-white">Member</h3>
            <p className="text-white/60 mb-8 font-sans">The complete experience.</p>
            <div className="mb-8 pb-8 border-b border-white/10">
              <span className="text-6xl font-heading font-bold text-white">120$</span>
              <span className="text-white/60 font-sans font-bold text-sm uppercase tracking-wider"> / month</span>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>Reduced hourly rate (25$/h)</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>24/7 Center Access</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>Priority Booking (14 days)</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium text-white/90">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="w-3 h-3" />
                </div>
                <span>Storage locker included</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button className="w-full rounded-full h-14 text-sm font-bold uppercase tracking-wider bg-primary text-white hover:bg-white hover:text-foreground border-none">
                Become a Member
              </Button>
            </Link>
          </div>

          {/* Event Card */}
          <div className="bg-transparent border-2 border-foreground/10 p-8 flex flex-col relative hover:border-foreground transition-all duration-300 group">
            <h3 className="font-heading font-bold text-3xl mb-2 uppercase">Events</h3>
            <p className="text-muted-foreground mb-8 font-sans">Private groups & parties.</p>
            <div className="mb-8 pb-8 border-b border-foreground/10">
              <span className="text-4xl font-heading font-bold">Custom</span>
            </div>
            <ul className="space-y-4 mb-12 flex-grow">
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Full or partial venue buyout</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Catering services available</span>
              </li>
              <li className="flex items-center gap-4 text-sm font-sans font-medium">
                <div className="w-6 h-6 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                  <Check className="w-3 h-3" />
                </div>
                <span>Organized tournaments</span>
              </li>
            </ul>
            <Link href="/contact">
              <Button className="w-full rounded-full h-14 text-sm font-bold uppercase tracking-wider bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background">
                Inquire Now
              </Button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <FAQ />
      </div>
    </Layout>
  );
}
