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
            Questions Fréquentes
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              Dois-je apporter mes propres clubs ?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              Nous recommandons d'apporter vos propres clubs pour une meilleure expérience. Cependant, nous offrons des ensembles de location premium (TaylorMade & Titleist) pour un petit supplément si vous n'avez pas les vôtres.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              Quelle est la précision des simulateurs ?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              Extrêmement précis. Nous utilisons la technologie Trackman 4, qui est le standard de l'industrie utilisé par les professionnels de la PGA. Il suit la vitesse de la balle, le taux de rotation, l'angle de lancement et plus encore avec une précision radar Doppler.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              Puis-je apporter ma nourriture et mes boissons ?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              Nous avons un lounge complet avec des collations et des breuvages disponibles à l'achat. La nourriture extérieure est permise uniquement pour les réservations d'événements privés.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              Comment fonctionne l'accès 24/7 ?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              Les membres reçoivent une clé numérique sur leur téléphone intelligent qui donne accès à l'installation à tout moment. Vous pouvez réserver votre baie en ligne et entrer par vous-même, même en dehors des heures avec personnel.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border-2 border-foreground/10 px-6">
            <AccordionTrigger className="text-xl font-heading font-bold uppercase hover:no-underline py-6">
              Combien de temps pour jouer 18 trous ?
            </AccordionTrigger>
            <AccordionContent className="text-base font-sans text-muted-foreground pb-6 leading-relaxed">
              Il faut généralement environ 1 heure pour qu'un seul joueur complète 18 trous. Pour un groupe de 4, nous recommandons de réserver 3-4 heures pour jouer une ronde complète confortablement.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  );
}
