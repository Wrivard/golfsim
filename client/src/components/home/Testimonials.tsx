import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Marc-André L.",
    role: "Member since 2023",
    text: "The accuracy of the Trackman simulators here is unmatched. It's completely changed my training routine during the winter months.",
    rating: 5
  },
  {
    name: "Sophie T.",
    role: "Casual Player",
    text: "Love the atmosphere! It feels like a high-end lounge where you happen to play golf. The staff is incredibly helpful.",
    rating: 5
  },
  {
    name: "Jean-Pierre G.",
    role: "Member",
    text: "Being able to access the facility 24/7 is a game changer for my schedule. The booking app is super easy to use.",
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-[#EAE6D9]">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-7xl font-heading font-bold text-foreground uppercase leading-none mb-4">
            Player Stories
          </h2>
          <p className="text-lg text-foreground/70 font-sans max-w-2xl mx-auto">
            Don't just take our word for it. Here is what our community has to say.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {REVIEWS.map((review, idx) => (
            <Card key={idx} className="bg-background border-none rounded-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-10 flex flex-col h-full">
                <div className="flex gap-1 mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-lg font-sans leading-relaxed italic mb-8 flex-grow text-foreground/80">
                  "{review.text}"
                </p>
                <div className="mt-auto">
                  <p className="font-heading font-bold text-xl uppercase text-foreground">{review.name}</p>
                  <p className="text-sm font-bold uppercase tracking-wider text-primary">{review.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
