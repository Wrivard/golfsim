import Layout from "@/components/layout/Layout";

// Images
import img1 from "@assets/81a69ff2-4a89-478a-b758-a37bcbab0737_1764338501085.jfif";
import img2 from "@assets/901b5a8f-19af-4ef0-b0a6-e8d5ccac41d4_1764338501086.jfif";
import img3 from "@assets/f114406a-3bc2-4494-871f-50634e13f809_1764338501086.jfif";

const images = [
  {
    src: img1,
    alt: "Simulateur de golf",
    category: "Installations"
  },
  {
    src: img2,
    alt: "Espace Lounge",
    category: "Ambiance"
  },
  {
    src: img3,
    alt: "Jeu en action",
    category: "Action"
  },
  // Duplicating for grid effect since we only have 3 images
  {
    src: img1,
    alt: "Simulateur vue large",
    category: "Installations"
  },
  {
    src: img2,
    alt: "Détail lounge",
    category: "Détails"
  },
  {
    src: img3,
    alt: "Swing analyse",
    category: "Tech"
  }
];

export default function Gallery() {
  return (
    <Layout>
       <div className="bg-secondary py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6 text-foreground">Galerie</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Plongez dans l'univers de Golf SIM Sorel-Tracy.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-md hover:shadow-2xl transition-all duration-500"
            >
              <img 
                src={img.src} 
                alt={img.alt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-white font-serif text-2xl tracking-wide block mb-2">
                    {img.category}
                  </span>
                  <span className="text-white/80 text-sm uppercase tracking-widest border-t border-white/30 pt-2 inline-block">
                    Golf SIM Sorel-Tracy
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
