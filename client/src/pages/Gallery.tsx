import Layout from "@/components/layout/Layout";

// Images
import img1 from "@assets/generated_images/luxury_indoor_golf_simulator_bay.png";
import img2 from "@assets/generated_images/luxury_golf_lounge_area.png";
import img3 from "@assets/generated_images/golfer_swinging_indoors.png";
import img4 from "@assets/generated_images/golf_ball_on_turf_close_up.png";
import img5 from "@assets/generated_images/golf_simulator_screen_display.png";
import img6 from "@assets/generated_images/golf_clubs_detail_shot.png";
import headerBg from "@assets/stock_images/golf_bag_and_clubs_c_86609782.jpg";

const images = [
  {
    src: img1,
    alt: "Simulateur de luxe",
    category: "La Baie"
  },
  {
    src: img3,
    alt: "Golfeur en action",
    category: "Action"
  },
  {
    src: img2,
    alt: "Espace Lounge",
    category: "Lounge"
  },
  {
    src: img5,
    alt: "Écran Simulateur",
    category: "Expérience"
  },
  {
    src: img4,
    alt: "Détail Tech",
    category: "Tech"
  },
  {
    src: img6,
    alt: "Clubs Premium",
    category: "Équipement"
  }
];

export default function Gallery() {
  return (
    <Layout>
       <div className="relative pt-32 pb-12 border-b border-foreground/5">
        <div className="absolute inset-0 z-0">
            <img src={headerBg} alt="Golf Equipment" className="w-full h-full object-cover brightness-50" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 text-white uppercase">Galerie</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto font-sans">
            Plongez dans l'expérience Golf SIM Sorel-Tracy.
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
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 grayscale group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <span className="text-white font-heading font-bold text-3xl tracking-wide block mb-2 uppercase">
                    {img.category}
                  </span>
                  <span className="text-white/80 text-xs uppercase tracking-widest border-t border-white/30 pt-2 inline-block">
                    Voir en grand
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
