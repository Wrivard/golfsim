import Layout from "@/components/layout/Layout";
import { Separator } from "@/components/ui/separator";

// Images
const LOUNGE_IMAGE = "attached_assets/901b5a8f-19af-4ef0-b0a6-e8d5ccac41d4_1764338501086.jfif";

export default function About() {
  return (
    <Layout>
      {/* Header */}
      <div className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6">Le Club</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plus qu'un simple centre de simulation, Golf SIM Sorel-Tracy est un lieu de rencontre pour les passionnés.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        {/* Story Section */}
        <div className="grid md:grid-cols-12 gap-12 mb-24">
          <div className="md:col-span-6">
            <img 
              src={LOUNGE_IMAGE} 
              alt="Ambiance Lounge" 
              className="w-full h-[600px] object-cover rounded-lg shadow-lg"
            />
          </div>
          <div className="md:col-span-5 md:col-start-8 flex flex-col justify-center space-y-6">
            <h2 className="text-3xl font-serif text-primary">Notre Vision</h2>
            <p className="text-muted-foreground leading-relaxed">
              Situé au cœur de Sorel-Tracy, notre établissement a été conçu pour offrir aux golfeurs une expérience sans compromis, quelle que soit la météo.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Nous voulions créer un espace où la technologie de pointe rencontre le confort d'un club privé. Un endroit où l'on vient pour s'entraîner sérieusement, mais aussi pour se détendre entre amis autour d'un verre.
            </p>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="font-serif text-4xl mb-2">3</h4>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Simulateurs</p>
              </div>
              <div>
                <h4 className="font-serif text-4xl mb-2">100+</h4>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">Parcours Mondiaux</p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-card border border-border rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary font-serif text-xl">01</div>
            <h3 className="text-xl font-serif mb-4">Excellence</h3>
            <p className="text-muted-foreground">
              Équipements de dernière génération garantissant une précision inégalée pour l'analyse de votre jeu.
            </p>
          </div>
          <div className="p-8 bg-card border border-border rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary font-serif text-xl">02</div>
            <h3 className="text-xl font-serif mb-4">Convivialité</h3>
            <p className="text-muted-foreground">
              Une atmosphère chaleureuse et détendue, propice aux échanges et au plaisir du jeu.
            </p>
          </div>
          <div className="p-8 bg-card border border-border rounded-xl hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary font-serif text-xl">03</div>
            <h3 className="text-xl font-serif mb-4">Accessibilité</h3>
            <p className="text-muted-foreground">
              Un système de réservation simple et des horaires étendus pour s'adapter à votre rythme de vie.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
