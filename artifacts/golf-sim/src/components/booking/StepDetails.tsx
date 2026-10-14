import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useBookingStore } from "@/lib/booking-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, User, Mail, Phone, Users, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, "Le nom est requis (minimum 2 caractères)"),
  email: z.string().email("Adresse courriel invalide"),
  phone: z.string().optional(),
  players: z.coerce.number().min(1, "Minimum 1 joueur").max(4, "Maximum 4 joueurs"),
  notes: z.string().optional(),
  marketingConsent: z.boolean().default(false),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter les termes et conditions" }) }),
});

export function StepDetails() {
  const { setStep, setUserDetails, selectedTimeSlot, selectedDuration, assignedBayId } = useBookingStore();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      players: 1,
      name: "",
      email: "",
      phone: "",
      notes: "",
      marketingConsent: false,
      acceptTerms: undefined as unknown as true,
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { acceptTerms, ...userDetails } = values;
    setUserDetails(userDetails);
    setStep(4);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 p-4 bg-[#EAE6D9]/50 rounded-lg border border-foreground/10 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Votre session</p>
          <p className="font-medium text-foreground text-sm">
            {selectedTimeSlot && (() => {
              const [y, mo, d] = selectedTimeSlot.split('T')[0].split('-').map(Number);
              return format(new Date(y, mo - 1, d), "EEEE d MMMM yyyy", { locale: fr });
            })()}
          </p>
          <p className="text-sm text-muted-foreground">
            {selectedTimeSlot && selectedTimeSlot.slice(11, 16)} • {selectedDuration ? selectedDuration / 60 : 0}h • Baie {assignedBayId}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStep(2)} data-testid="button-modify-time">
          Modifier
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Nom complet <span className="text-red-500">*</span></Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="name" 
              placeholder="Jean Dupont" 
              className="pl-9 bg-background/80 border-foreground/20 h-11" 
              {...form.register("name")} 
              data-testid="input-name"
            />
          </div>
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Adresse courriel <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email" 
              placeholder="jean@exemple.com" 
              className="pl-9 bg-background/80 border-foreground/20 h-11" 
              {...form.register("email")} 
              data-testid="input-email"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Téléphone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="phone" 
              type="tel" 
              placeholder="(450) 561-3815" 
              className="pl-9 bg-background/80 border-foreground/20 h-11" 
              {...form.register("phone")} 
              data-testid="input-phone"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="players" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Nombre de joueurs <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="players" 
              type="number" 
              min={1} 
              max={4} 
              className="pl-9 bg-background/80 border-foreground/20 h-11" 
              {...form.register("players")} 
              data-testid="input-players"
            />
          </div>
          {form.formState.errors.players && (
            <p className="text-xs text-destructive">{form.formState.errors.players.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-foreground/80">Notes</Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Textarea 
              id="notes" 
              placeholder="Informations supplémentaires..." 
              className="pl-9 bg-background/80 border-foreground/20 min-h-[80px] resize-none" 
              {...form.register("notes")} 
              data-testid="input-notes"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input type="checkbox" {...form.register("marketingConsent")}
              className="mt-1 w-4 h-4 accent-[#2B5734]" data-testid="checkbox-marketing-consent" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              J'accepte de recevoir des courriels promotionnels, des offres et des nouvelles de Golf Sim. C'est facultatif et vous pouvez retirer votre consentement en tout temps.
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              {...form.register("acceptTerms")}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-[#2B5734] focus:ring-[#2B5734] accent-[#2B5734]"
              data-testid="checkbox-accept-terms"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              J'accepte les{" "}
              <Link href="/politique-de-confidentialite" className="text-primary underline hover:text-primary/80" target="_blank">
                termes et conditions
              </Link>{" "}
              et la politique de confidentialité de Golf SIM Sorel-Tracy.
            </span>
          </label>
          {form.formState.errors.acceptTerms && (
            <p className="text-xs text-destructive">{form.formState.errors.acceptTerms.message}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full sm:w-1/3 border-foreground/20"
            onClick={() => setStep(2)}
            data-testid="button-back-time"
          >
            Retour
          </Button>
          <Button 
            type="submit" 
            className="w-full sm:w-2/3 bg-primary hover:bg-primary/90 font-bold uppercase tracking-wider text-xs sm:text-sm"
            data-testid="button-review"
          >
            Vérifier la réservation
          </Button>
        </div>
      </form>
    </div>
  );
}
