import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export default function MembershipPreview() {
  return (
    <section className="py-24 bg-foreground text-background relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-block py-1 px-3 bg-primary/20 border border-primary text-primary rounded-full text-xs font-bold uppercase tracking-widest">
              Exclusive Access
            </div>
            <h2 className="text-5xl md:text-7xl font-heading font-bold uppercase leading-none">
              Join The <span className="text-primary">Club</span>
            </h2>
            <p className="text-lg text-white/70 font-sans leading-relaxed max-w-md">
              Become a member of Golf SIM Sorel-Tracy and unlock unlimited potential. Enjoy 24/7 access, priority booking, and exclusive events.
            </p>
            
            <ul className="space-y-4 pt-4">
              {[
                "24/7 Facility Access",
                "Reduced Hourly Rates",
                "Priority Booking (14 Days)",
                "Storage Locker Included",
                "Exclusive Member Events"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 group">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="font-sans font-medium text-white/90">{item}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4">
              <Link href="/rates">
                <Button className="bg-white text-foreground hover:bg-primary hover:text-white rounded-full px-10 h-14 text-sm font-bold uppercase tracking-wider transition-all">
                  View Membership Plans
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
             {/* Decorative Elements */}
             <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
             <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
             
             <div className="bg-white/5 border border-white/10 p-10 rounded-lg backdrop-blur-sm">
                <div className="flex justify-between items-start mb-8">
                   <div>
                      <h3 className="text-2xl font-heading font-bold uppercase mb-1">Monthly Membership</h3>
                      <p className="text-white/50 text-sm font-sans">No commitment required</p>
                   </div>
                   <div className="text-right">
                      <span className="text-5xl font-heading font-bold text-white">120$</span>
                      <span className="block text-white/50 text-xs font-bold uppercase tracking-wider">/ Month</span>
                   </div>
                </div>
                <div className="space-y-6">
                   <div className="h-px w-full bg-white/10" />
                   <p className="text-white/80 font-sans italic text-center">
                      "The best investment for my game. The 24/7 access fits my busy schedule perfectly."
                   </p>
                   <div className="flex items-center justify-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-full" />
                      <span className="text-sm font-bold uppercase tracking-wider">Verified Member</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
