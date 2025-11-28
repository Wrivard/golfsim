import Layout from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";

// Images
import loungeImage from "@assets/901b5a8f-19af-4ef0-b0a6-e8d5ccac41d4_1764338501086.jfif";

export default function About() {
  return (
    <Layout>
      {/* Header */}
      <div className="bg-secondary py-24">
        <div className="container mx-auto px-4 text-center">
          <span className="text-primary text-sm font-bold tracking-widest uppercase mb-4 block">Golf SIM Sorel-Tracy</span>
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6 text-foreground">Le Club</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Plus qu'un simple centre de simulation, un véritable lieu de vie pour les passionnés de golf.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        {/* Story Section */}
        <div className="grid md:grid-cols-12 gap-12 mb-24">
          <div className="md:col-span-6 relative">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full z-0" />
            <img 
              src={loungeImage} 
              alt="Ambiance Lounge" 
              className="w-full h-[600px] object-cover rounded-lg shadow-xl relative z-10"
            />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/10 rounded-full z-0" />
          </div>
          <div className="md:col-span-5 md:col-start-8 flex flex-col justify-center space-y-8">
            <div>
              <h2 className="text-3xl font-serif text-primary mb-4">Notre Vision</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Situé au cœur de Sorel-Tracy, notre établissement a été conçu pour offrir aux golfeurs une expérience sans compromis, quelle que soit la météo.
              </p>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Nous voulions créer un espace où la technologie de pointe rencontre le confort d'un club privé. Un endroit où l'on vient pour s'entraîner sérieusement sur des simulateurs de classe mondiale, mais aussi pour se détendre entre amis autour d'un verre.
            </p>
            
            <Separator className="bg-primary/20" />
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-serif text-5xl mb-2 text-primary">3</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Simulateurs Pro</p>
              </div>
              <div>
                <h4 className="font-serif text-5xl mb-2 text-primary">100+</h4>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Parcours Mondiaux</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-10 bg-white border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-6 text-primary font-serif text-2xl group-hover:bg-primary group-hover:text-white transition-colors">1</div>
            <h3 className="text-2xl font-serif mb-4 text-foreground">Excellence</h3>
            <p className="text-muted-foreground leading-relaxed">
              Équipements de dernière génération garantissant une précision inégalée pour l'analyse de votre jeu et une immersion totale.
            </p>
          </div>
          <div className="p-10 bg-white border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-6 text-primary font-serif text-2xl group-hover:bg-primary group-hover:text-white transition-colors">2</div>
            <h3 className="text-2xl font-serif mb-4 text-foreground">Convivialité</h3>
            <p className="text-muted-foreground leading-relaxed">
              Une atmosphère chaleureuse, un design soigné et un service attentionné pour que chaque visite soit un moment de plaisir.
            </p>
          </div>
          <div className="p-10 bg-white border border-border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mb-6 text-primary font-serif text-2xl group-hover:bg-primary group-hover:text-white transition-colors">3</div>
            <h3 className="text-2xl font-serif mb-4 text-foreground">Accessibilité</h3>
            <p className="text-muted-foreground leading-relaxed">
              Un système de réservation simple, des forfaits flexibles et des horaires étendus pour s'adapter à votre rythme de vie.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
