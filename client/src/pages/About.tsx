import Layout from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

// Images
import loungeImage from "@assets/generated_images/luxury_golf_lounge_area.png";

export default function About() {
  return (
    <Layout>
      {/* Header */}
      <div className="bg-background pt-32 pb-24 border-b border-foreground/5">
        <div className="container mx-auto px-4 text-center">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-4 block">Golf SIM Sorel-Tracy</span>
          <h1 className="text-6xl md:text-8xl font-heading font-bold mb-6 text-foreground uppercase tracking-tighter leading-none">The Club</h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed font-sans">
            More than just a simulator center, a true lifestyle destination for golf enthusiasts.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
        {/* Story Section */}
        <div className="grid md:grid-cols-12 gap-12 mb-24 items-center">
          <div className="md:col-span-7 relative">
            {/* Overlapping green card */}
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-primary z-0 hidden md:block" />
            <div className="relative z-10 h-[500px] rounded-lg overflow-hidden shadow-2xl">
               <img 
                src={loungeImage} 
                alt="Luxury Lounge" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            {/* Overlapping text card */}
             <div className="absolute -bottom-8 -right-8 bg-foreground text-background p-8 z-20 max-w-xs shadow-xl hidden md:block">
                <p className="font-heading font-bold text-2xl uppercase leading-none">
                  "Where precision meets comfort."
                </p>
             </div>
          </div>
          
          <div className="md:col-span-5 flex flex-col justify-center space-y-8 pl-0 md:pl-8">
            <div>
              <h2 className="text-5xl font-heading font-bold text-foreground mb-6 uppercase leading-none">Our Vision</h2>
              <p className="text-foreground/80 leading-relaxed text-lg font-sans">
                Located in the heart of Sorel-Tracy, our facility was designed to offer golfers an uncompromising experience, regardless of the weather.
              </p>
            </div>
            <p className="text-foreground/80 leading-relaxed font-sans">
              We wanted to create a space where cutting-edge technology meets the comfort of a private club. A place to train seriously on world-class simulators, but also to relax with friends over a drink.
            </p>
            
            <Separator className="bg-foreground/10" />
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-heading text-7xl mb-2 text-primary font-bold leading-none">3</h4>
                <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Pro Simulators</p>
              </div>
              <div>
                <h4 className="font-heading text-7xl mb-2 text-primary font-bold leading-none">100+</h4>
                <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider">World Courses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-10 bg-[#EAE6D9] border border-transparent hover:border-foreground transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mb-8 font-heading font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors">1</div>
            <h3 className="text-3xl font-heading font-bold mb-4 uppercase">Excellence</h3>
            <p className="text-foreground/70 leading-relaxed font-sans">
              State-of-the-art equipment ensuring unmatched precision for analyzing your game and total immersion.
            </p>
          </div>
          
          {/* Card 2 */}
          <div className="p-10 bg-[#EAE6D9] border border-transparent hover:border-foreground transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mb-8 font-heading font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors">2</div>
            <h3 className="text-3xl font-heading font-bold mb-4 uppercase">Community</h3>
            <p className="text-foreground/70 leading-relaxed font-sans">
              A warm atmosphere, curated design, and attentive service to make every visit a moment of pleasure.
            </p>
          </div>
          
          {/* Card 3 */}
          <div className="p-10 bg-[#EAE6D9] border border-transparent hover:border-foreground transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            <div className="w-12 h-12 bg-foreground text-background rounded-full flex items-center justify-center mb-8 font-heading font-bold text-xl group-hover:bg-primary group-hover:text-white transition-colors">3</div>
            <h3 className="text-3xl font-heading font-bold mb-4 uppercase">Access</h3>
            <p className="text-foreground/70 leading-relaxed font-sans">
              Simple booking system, flexible memberships, and extended hours to fit your lifestyle.
            </p>
          </div>
        </div>
        
        <div className="mt-24 text-center">
           <Link href="/contact">
              <Button className="bg-foreground text-background hover:bg-primary hover:text-white rounded-full px-12 h-16 text-sm font-bold uppercase tracking-wider transition-all">
                Join the Club
              </Button>
           </Link>
        </div>
      </div>
    </Layout>
  );
}
