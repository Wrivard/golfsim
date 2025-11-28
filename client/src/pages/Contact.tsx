import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { register, handleSubmit, reset } = useForm();
  const { toast } = useToast();

  const onSubmit = (data: any) => {
    console.log(data);
    toast({
      title: "Demande envoyée",
      description: "Nous vous contacterons sous peu pour confirmer votre réservation.",
    });
    reset();
  };

  return (
    <Layout>
      <div className="bg-foreground text-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-serif font-medium mb-6">Réservation & Contact</h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Réservez votre départ ou contactez-nous pour toute question.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Form */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-serif mb-4">Faire une demande</h2>
              <p className="text-muted-foreground">Remplissez ce formulaire et nous vous rappellerons pour confirmer la disponibilité.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" placeholder="Jean Dupont" {...register("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input id="phone" placeholder="(450) 123-4567" {...register("phone")} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Courriel</Label>
                <Input id="email" type="email" placeholder="jean@exemple.com" {...register("email")} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date souhaitée</Label>
                  <Input id="date" type="date" {...register("date")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="players">Nombre de joueurs</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Joueur</SelectItem>
                      <SelectItem value="2">2 Joueurs</SelectItem>
                      <SelectItem value="3">3 Joueurs</SelectItem>
                      <SelectItem value="4">4 Joueurs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Remarques / Questions</Label>
                <Textarea id="message" placeholder="Avez-vous besoin d'équipement ?" className="min-h-[120px]" {...register("message")} />
              </div>

              <Button type="submit" className="w-full rounded-full h-12 text-lg bg-primary hover:bg-primary/90">
                Envoyer la demande
              </Button>
            </form>
          </div>

          {/* Info & Map */}
          <div className="space-y-8">
            <Card className="bg-secondary/20 border-none">
              <CardContent className="p-8 space-y-6">
                <h3 className="font-serif text-2xl mb-6">Coordonnées</h3>
                
                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Adresse</h4>
                    <p className="text-muted-foreground">123 Rue du Golf<br/>Sorel-Tracy, QC J3P 1A1</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Téléphone</h4>
                    <p className="text-muted-foreground">(450) 123-4567</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Courriel</h4>
                    <p className="text-muted-foreground">info@golfsimst.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Horaires</h4>
                    <p className="text-muted-foreground text-sm">
                      <span className="block font-medium text-foreground">Membres :</span> 24/7 Accès par carte
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      <span className="block font-medium text-foreground">Visiteurs :</span>
                      Lun - Dim : 10h00 - 22h00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <div className="w-full h-[300px] bg-muted rounded-xl overflow-hidden relative">
               <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                  <p className="text-muted-foreground font-serif italic">Carte Google Maps</p>
               </div>
               {/* In a real app, embed Google Maps iframe here */}
               <iframe 
                 width="100%" 
                 height="100%" 
                 style={{border:0}} 
                 loading="lazy"
                 className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d44567.54741301245!2d-73.15000000000001!3d46.0333333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc8600000000001%3A0x0!2sSorel-Tracy%2C%20QC!5e0!3m2!1sen!2sca!4v1620000000000!5m2!1sen!2sca"
               ></iframe>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
