import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Marc-André L.",
    role: "Membre depuis 2023",
    text: "La précision des simulateurs Trackman est inégalée. Ça a complètement changé ma routine d'entraînement durant l'hiver.",
    rating: 5,
    theme: "light"
  },
  {
    name: "Équipe Tech Sorel",
    role: "Soirée Corporative",
    text: "L'endroit idéal pour notre party de bureau. L'ambiance était parfaite et même les débutants ont adoré l'expérience.",
    rating: 5,
    theme: "dark"
  },
  {
    name: "Jean-Pierre G.",
    role: "Membre",
    text: "Pouvoir accéder au centre 24/7 change la donne pour mon horaire. L'application de réservation est super simple à utiliser.",
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
              className="border-none rounded-none shadow-lg hover:shadow-xl transition-all duration-300 bg-[#1B1A18] text-[#F7F3E8]"
            >
              <CardContent className="p-10 flex flex-col h-full">
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star 
                      key={i} 
                      className="w-5 h-5 fill-[#2B5734] text-[#2B5734]" 
                    />
                  ))}
                </div>
                <p className="text-lg font-sans leading-relaxed italic mb-8 flex-grow text-[#F7F3E8]/90">
                  "{review.text}"
                </p>
                <div className="mt-auto">
                  <p className="font-heading font-bold text-xl uppercase text-[#F7F3E8]">
                    {review.name}
                  </p>
                  <p className="text-sm font-bold uppercase tracking-wider text-[#2B5734]">
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
