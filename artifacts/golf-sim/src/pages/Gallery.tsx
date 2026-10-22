import { useEffect, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Images
import img1 from "@/assets/site/20260105-1-01_1790696495855.webp";
import img2 from "@/assets/site/20260105-2-02_1790696495856.webp";
import img3 from "@/assets/site/20260105-3-03_1790696495856.webp";
import img4 from "@/assets/site/20260105-4-04_1790696495856.webp";
import img5 from "@/assets/site/20260105-5-05_1790696495856.webp";
import img6 from "@/assets/site/20260105-6-06_1790696495857.webp";
import img7 from "@/assets/site/20260105-7-07_1790696495857.webp";
import img8 from "@/assets/site/20260105-8-08_1790696495857.webp";
import img9 from "@/assets/site/20260105-9-09_1790696495857.webp";
import img10 from "@/assets/site/20260105-10-10_1790696495858.webp";
import img11 from "@/assets/site/20260105-11-11_1790696495858.webp";
import img12 from "@/assets/site/20260105-12-12_1790696495858.webp";
import img13 from "@/assets/site/20260105-13-13_1790696495858.webp";
import img14 from "@/assets/site/20260105-14-14_1790696495858.webp";
import headerBg from "@/assets/site/20260105-9-09_1790696495857.webp";

const images = [
  { src: img1, alt: "Baie de golf avec écran de simulation", category: "La Baie" },
  { src: img2, alt: "Bâton et balle sur le tapis de golf", category: "Équipement" },
  { src: img3, alt: "Balle devant le parcours virtuel", category: "Expérience" },
  { src: img4, alt: "Golfeur préparant son coup", category: "Action" },
  { src: img5, alt: "Golfeur terminant son élan", category: "Action" },
  { src: img6, alt: "Comptoir du bar et ses tabourets", category: "Le Bar" },
  { src: img7, alt: "Élan de golf devant le simulateur", category: "Action" },
  { src: img8, alt: "Groupe de golfeurs réuni dans une baie", category: "En Groupe" },
  { src: img9, alt: "Sac de golf devant le bar et les baies", category: "Équipement" },
  { src: img10, alt: "Deux golfeurs pratiquant un mouvement dans une baie", category: "Pratique" },
  { src: img11, alt: "Sélection de boissons au bar", category: "Le Bar" },
  { src: img12, alt: "Espace détente entre les simulateurs", category: "Lounge" },
  { src: img13, alt: "Accueil au comptoir du bar", category: "Le Bar" },
  { src: img14, alt: "Boissons sur une table devant un simulateur", category: "Détente" },
];

export default function Gallery() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedImage = selectedIndex === null ? null : images[selectedIndex];

  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSelectedIndex((index) => index === null ? null : (index - 1 + images.length) % images.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setSelectedIndex((index) => index === null ? null : (index + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex]);

  return (
    <Layout>
       <div className="relative pt-32 pb-12 border-b border-foreground/5">
        <div className="absolute inset-0 z-0">
            <img src={headerBg} alt="Équipement et espace golf" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 z-10" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold mb-6 text-white uppercase">Galerie</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto font-sans">
            Plongez dans l'expérience Golf SIM Sorel-Tracy.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img, idx) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Voir en grand : ${img.alt}`}
              onClick={() => setSelectedIndex(idx)}
              className="group relative block w-full aspect-[4/3] overflow-hidden rounded-lg bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
            >
              <img 
                src={img.src} 
                alt={img.alt} 
                loading="lazy"
                decoding="async"
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
            </button>
          ))}
        </div>
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => { if (!open) setSelectedIndex(null); }}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-6xl max-h-[90vh] overflow-hidden border-0 bg-black p-3 text-white sm:w-[calc(100vw-3rem)] sm:p-5">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedImage ? `${selectedImage.category} — Photo ${selectedIndex! + 1} sur ${images.length}` : "Photo de la galerie"}</DialogTitle>
            <DialogDescription>{selectedImage?.alt ?? "Image de la galerie Golf SIM Sorel-Tracy."}</DialogDescription>
          </DialogHeader>
          {selectedImage && selectedIndex !== null && (
            <>
              <div className="relative flex min-h-0 items-center justify-center">
                <img
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  className="max-h-[72vh] max-w-full object-contain"
                />
                <button
                  type="button"
                  aria-label="Photo précédente"
                  onClick={() => setSelectedIndex((selectedIndex - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Photo suivante"
                  onClick={() => setSelectedIndex((selectedIndex + 1) % images.length)}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 pr-10 text-sm">
                <p className="truncate text-white/80">{selectedImage.alt}</p>
                <p aria-live="polite" className="shrink-0 text-white/60">{selectedIndex + 1} / {images.length}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
