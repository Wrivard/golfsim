import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRef } from "react";
import { sendContactRequest, type ContactInput } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import headerBg from "@/assets/site/20260105-6-06_1790696495857.webp";

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Omit<ContactInput, "requestId">>({
    defaultValues: { name: "", email: "", phone: "", date: "", message: "", website: "" },
  });
  const { toast } = useToast();
  const submission = useRef<{ fingerprint: string; id: string } | null>(null);

  const onSubmit = async (data: Omit<ContactInput, "requestId">) => {
    const cleaned = {
      ...data, name: data.name.trim(), email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || undefined, date: data.date || undefined, message: data.message.trim(),
    };
    const fingerprint = JSON.stringify(cleaned);
    if (submission.current?.fingerprint !== fingerprint) {
      submission.current = { fingerprint, id: crypto.randomUUID() };
    }
    try {
      const result = await sendContactRequest({ ...cleaned, requestId: submission.current!.id });
      if (!result.ok || !result.id) throw new Error("La transmission n'a pas pu être confirmée.");
      toast({ title: "Demande envoyée", description: result.message });
      reset();
      submission.current = null;
    } catch (error) {
      toast({
        title: "Demande non confirmée", variant: "destructive",
        description: error instanceof Error ? error.message : "Réessayez ou téléphonez au (450) 561-3815.",
      });
    }
  };

  return (
    <Layout>
      <div className="relative py-24 pt-32">
        <div className="absolute inset-0 z-0">
            <img src={headerBg} alt="Bar de Golf SIM Sorel-Tracy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 z-10" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-heading font-bold mb-6 uppercase text-white">Groupes & Événements</h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto font-sans">
            Pour les réservations de groupe, événements d'entreprise et fêtes privées.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Form */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-heading font-bold mb-4 uppercase">Organiser un événement</h2>
              <p className="text-muted-foreground font-sans">Remplissez ce formulaire pour nous faire part de votre projet. Notre équipe événementielle vous contactera rapidement.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="absolute -left-[9999px]" aria-hidden="true">
                <label htmlFor="contact-website">Site web</label>
                <input id="contact-website" autoComplete="off" tabIndex={-1} {...register("website")} />
              </div>
              {Object.keys(errors).length > 0 && <p role="alert" className="text-red-700">Vérifiez votre nom, votre courriel, les joueurs et les notes.</p>}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="uppercase font-bold text-xs tracking-wider">Nom complet</Label>
                  <Input id="name" placeholder="Jean Dupont" required minLength={2} maxLength={150} autoComplete="name" {...register("name", { required: true, validate: value => value.trim().length >= 2 })} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="uppercase font-bold text-xs tracking-wider">Téléphone</Label>
                  <Input id="phone" type="tel" maxLength={30} autoComplete="tel" placeholder="(450) 561-3815" {...register("phone")} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="uppercase font-bold text-xs tracking-wider">Courriel</Label>
                <Input id="email" type="email" required maxLength={254} autoComplete="email" placeholder="jean@exemple.com" {...register("email", { required: true })} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="uppercase font-bold text-xs tracking-wider">Date</Label>
                  <Input id="date" type="date" {...register("date")} className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="players" className="uppercase font-bold text-xs tracking-wider">Joueurs</Label>
                  <Input id="players" type="number" inputMode="numeric" min={1} step={1} required
                    placeholder="Ex. : 24" aria-invalid={!!errors.players} aria-describedby="players-help"
                    {...register("players", {
                      valueAsNumber: true,
                      validate: value => Number.isSafeInteger(value) && value >= 1 || "Inscrivez un nombre entier de joueurs, au moins 1, représentable sans perte de précision.",
                    })}
                    className="rounded-none border-foreground/20 focus:border-primary h-12 bg-transparent" />
                  <p id="players-help" className="text-sm text-muted-foreground">
                    {errors.players?.message || "Inscrivez le nombre total de joueurs de votre groupe."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="uppercase font-bold text-xs tracking-wider">Notes</Label>
                <Textarea id="message" required minLength={2} maxLength={2000} placeholder="Demandes spéciales ?" className="min-h-[120px] rounded-none border-foreground/20 focus:border-primary bg-transparent" {...register("message", { required: true, validate: value => value.trim().length >= 2 })} />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full rounded-full h-14 text-sm font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-white">
                {isSubmitting ? "Envoi en cours…" : "Envoyer la demande"}
              </Button>
              <p className="text-sm text-muted-foreground">Une demande de groupe n’est pas une réservation confirmée.</p>
            </form>
          </div>

          {/* Info & Map */}
          <div className="space-y-8">
            <Card className="bg-[#EAE6D9] border-none rounded-none">
              <CardContent className="p-8 space-y-6">
                <h3 className="font-heading font-bold text-2xl mb-6 uppercase">Informations</h3>
                
                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Adresse</h4>
                    <p className="text-muted-foreground font-sans text-sm">215 Bd Fiset<br/>Sorel-Tracy, QC J3P 3P3</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Téléphone</h4>
                    <p className="text-muted-foreground font-sans text-sm">(450) 561-3815</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Courriel</h4>
                    <p className="text-muted-foreground font-sans text-sm">golfsim.soreltracy@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-background p-3 rounded-full shadow-sm">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold uppercase text-xs tracking-wider mb-1">Horaires</h4>
                    <p className="text-muted-foreground text-sm mt-1 font-sans">
                      Lun - Dim : 10h00 - 22h00
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <div className="w-full h-[300px] bg-muted overflow-hidden relative">
               <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
                  <p className="text-muted-foreground font-heading uppercase font-bold tracking-wider">Google Maps</p>
               </div>
               <iframe 
                 width="100%" 
                 height="100%" 
                 style={{border:0}} 
                 loading="lazy"
                 className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                 src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2784.5!2d-73.1212!3d46.0471!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc8139a36e6d9ed%3A0x0!2s215+Bd+Fiset%2C+Sorel-Tracy%2C+QC+J3P+3P3!5e0!3m2!1sfr!2sca!4v1620000000000!5m2!1sfr!2sca"
               ></iframe>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
