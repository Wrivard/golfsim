import Layout from "@/components/layout/Layout";

const images = [
  {
    src: "attached_assets/81a69ff2-4a89-478a-b758-a37bcbab0737_1764338501085.jfif",
    alt: "Simulateur de golf",
    category: "Installations"
  },
  {
    src: "attached_assets/901b5a8f-19af-4ef0-b0a6-e8d5ccac41d4_1764338501086.jfif",
    alt: "Espace Lounge",
    category: "Ambiance"
  },
  {
    src: "attached_assets/f114406a-3bc2-4494-871f-50634e13f809_1764338501086.jfif",
    alt: "Jeu en action",
    category: "Action"
  },
  // Duplicating for grid effect since we only have 3 images
  {
    src: "attached_assets/81a69ff2-4a89-478a-b758-a37bcbab0737_1764338501085.jfif",
    alt: "Simulateur vue large",
    category: "Installations"
  },
  {
    src: "attached_assets/901b5a8f-19af-4ef0-b0a6-e8d5ccac41d4_1764338501086.jfif",
    alt: "Détail lounge",
    category: "Détails"
  },
  {
    src: "attached_assets/f114406a-3bc2-4494-871f-50634e13f809_1764338501086.jfif",
    alt: "Swing analyse",
    category: "Tech"
  }
];

export default function Gallery() {
  return (
    <Layout>
       <div className="bg-secondary/30 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6">Galerie</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez l'ambiance unique de notre espace à Sorel-Tracy.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-muted cursor-pointer"
            >
              <img 
                src={img.src} 
                alt={img.alt} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-serif text-xl tracking-wide border-b border-primary pb-1">
                  {img.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
