import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 md:px-12 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-foreground uppercase leading-none mb-4">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              Do I need to bring my own clubs?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              We recommend bringing your own clubs for the best experience. However, we do offer premium rental sets (TaylorMade & Titleist) for a small fee if you don't have yours with you.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              How accurate are the simulators?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              Extremely accurate. We use Trackman 4 technology, which is the industry standard used by PGA Tour professionals. It tracks ball speed, spin rate, launch angle, and more with Doppler radar precision.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              Can I bring my own food and drinks?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              We have a fully stocked lounge with snacks and beverages available for purchase. Outside food is allowed for private event bookings only.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              How does the 24/7 access work?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              Members receive a digital key card on their smartphone that grants access to the facility at any time. You can book your bay online and let yourself in, even outside of staffed hours.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              How long does it take to play 18 holes?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              It typically takes about 1 hour for a single player to complete 18 holes. For a group of 4, we recommend booking 3-4 hours to play a full round comfortably.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
