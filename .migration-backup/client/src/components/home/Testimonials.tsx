import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Stéphane Cyr",
    role: "2 avis · il y a 4 ans",
    text: "Belle endroit propre, avec bon conseil et service, très friendly, permet de faire une bonne partie sans stress...",
    rating: 5,
    theme: "light"
  },
  {
    name: "David Brouillette",
    role: "2 avis · il y a 3 ans",
    text: "Endroit calme excellent service et du plaisir garantie",
    rating: 5,
    theme: "dark"
  },
  {
    name: "Les SMB",
    role: "Guide local · 324 avis · 64 photos · il y a 2 ans",
    text: "Bon personnel 👍",
    rating: 5,
    theme: "light"
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#EAE6D9]">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-heading font-bold text-foreground uppercase leading-none mb-4">
            Témoignages
          </h2>
          <p className="text-lg text-foreground/70 font-sans max-w-2xl mx-auto">
            Ne nous croyez pas sur parole. Voici ce que notre communauté en dit.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {REVIEWS.map((review, idx) => (
            <Card 
              key={idx} 
              className={`border-none rounded-none shadow-lg hover:shadow-xl transition-all duration-300 ${
                review.theme === 'dark' 
                  ? "bg-[#1B1A18] text-[#F7F3E8]" 
                  : "bg-background text-foreground"
              }`}
            >
              <CardContent className="p-10 flex flex-col h-full">
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${
                        review.theme === 'dark' ? "fill-[#2B5734] text-[#2B5734]" : "fill-primary text-primary"
                      }`} 
                    />
                  ))}
                </div>
                <p className={`text-lg font-sans leading-relaxed italic mb-8 flex-grow ${
                  review.theme === 'dark' ? "text-[#F7F3E8]/90" : "text-foreground/80"
                }`}>
                  "{review.text}"
                </p>
                <div className="mt-auto">
                  <p className={`font-heading font-bold text-xl uppercase ${
                    review.theme === 'dark' ? "text-[#F7F3E8]" : "text-foreground"
                  }`}>
                    {review.name}
                  </p>
                  <p className={`text-sm font-bold uppercase tracking-wider ${
                    review.theme === 'dark' ? "text-[#2B5734]" : "text-primary"
                  }`}>
                    {review.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
