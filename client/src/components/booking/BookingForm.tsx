import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Clock, Users, CheckCircle2, ChevronRight, ChevronLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse courriel valide.",
  }),
  phone: z.string().optional(),
  date: z.date({
    required_error: "Une date est requise.",
  }),
  time: z.string({
    required_error: "Une heure est requise.",
  }),
  duration: z.string({
    required_error: "La durée est requise.",
  }),
  bayType: z.enum(["standard", "premium"], {
    required_error: "Le type de baie est requis.",
  }),
  players: z.string({
    required_error: "Le nombre de joueurs est requis.",
  }),
  notes: z.string().optional(),
});

const TIME_SLOTS = [
  "10:00", "11:00", "12:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

export default function BookingForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      duration: "4h",
      bayType: "standard",
      players: "1"
    },
  });

  // Watch values for summary
  const watchDate = form.watch("date");
  const watchTime = form.watch("time");
  const watchBayType = form.watch("bayType");
  const watchDuration = form.watch("duration");
  const watchPlayers = form.watch("players");

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Booking Data:", values);
    
    setTimeout(() => {
      setIsSubmitted(true);
      toast({
        title: "Réservation reçue",
        description: "Nous avons bien reçu votre demande. Un courriel de confirmation suivra sous peu.",
      });
    }, 1000);
  }

  const nextStep = async () => {
    let valid = false;
    if (step === 1) {
      valid = await form.trigger(["date", "time", "duration", "bayType"]);
    } else {
      valid = true;
    }
    
    if (valid) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  if (isSubmitted) {
    return (
      <div className="bg-[#EAE6D9] p-8 md:p-12 rounded-lg text-center border border-foreground/10 shadow-lg animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-heading font-bold uppercase mb-4 text-foreground">Demande Envoyée !</h3>
        <p className="text-foreground/70 font-sans mb-8 text-lg max-w-md mx-auto">
          Merci de votre intérêt pour Golf SIM Sorel-Tracy. Notre équipe validera votre réservation et vous contactera très bientôt.
        </p>
        <div className="bg-background/50 p-6 rounded-lg mb-8 text-left max-w-sm mx-auto border border-foreground/5">
             <h4 className="font-bold uppercase text-xs tracking-wider text-foreground/60 mb-4 border-b border-foreground/10 pb-2">Récapitulatif</h4>
             <div className="space-y-2 text-sm font-sans">
                <div className="flex justify-between"><span className="text-foreground/60">Date:</span> <span className="font-medium">{watchDate ? format(watchDate, "d MMMM yyyy", { locale: fr }) : "-"}</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Heure:</span> <span className="font-medium">{watchTime || "-"}</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Durée:</span> <span className="font-medium">{watchDuration}</span></div>
                <div className="flex justify-between"><span className="text-foreground/60">Baie:</span> <span className="font-medium capitalize">{watchBayType}</span></div>
             </div>
        </div>
        <Button 
          onClick={() => {
            setIsSubmitted(false);
            setStep(1);
            form.reset();
          }} 
          variant="outline" 
          className="border-foreground text-foreground hover:bg-foreground hover:text-background rounded-full px-8 font-bold uppercase tracking-wider"
        >
          Nouvelle réservation
        </Button>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Main Form Column */}
      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white/50 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-foreground/5 shadow-xl">
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-2 mb-6">
                <div className={cn("h-2 flex-1 rounded-full transition-colors", step >= 1 ? "bg-primary" : "bg-foreground/10")} />
                <div className={cn("h-2 flex-1 rounded-full transition-colors", step >= 2 ? "bg-primary" : "bg-foreground/10")} />
            </div>

            {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-left-5 duration-300">
                <div className="space-y-4">
                  <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" /> 
                    1. Date & Heure
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2">Sélectionner une date</FormLabel>
                        <div className="border rounded-md p-4 bg-background/50">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                            initialFocus
                            className="mx-auto pointer-events-auto"
                            classNames={{
                                head_cell: "text-muted-foreground font-normal text-[0.8rem] uppercase tracking-wider",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent text-accent-foreground",
                            }}
                            />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watchDate && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2">Disponibilités pour le {format(watchDate, "d MMMM", { locale: fr })}</FormLabel>
                                <FormControl>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {TIME_SLOTS.map((time) => (
                                            <Button
                                                key={time}
                                                type="button"
                                                variant={field.value === time ? "default" : "outline"}
                                                className={cn(
                                                    "h-10 text-sm font-sans transition-all", 
                                                    field.value === time ? "bg-primary text-white border-primary" : "hover:border-primary hover:text-primary"
                                                )}
                                                onClick={() => field.onChange(time)}
                                            >
                                                {time}
                                            </Button>
                                        ))}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Durée</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12">
                                    <SelectValue placeholder="Bloc de jeu" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="4h">4 Heures (Standard)</SelectItem>
                                <SelectItem value="8h">8 Heures (Double)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="bayType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Type de baie</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12">
                                    <SelectValue placeholder="Choisir" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="premium">Premium (+20$)</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button type="button" onClick={nextStep} className="w-full h-14 rounded-full font-bold uppercase tracking-wider text-sm mt-4">
                    Suivant <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-5 duration-300">
                <h3 className="text-xl font-heading font-bold uppercase flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" /> 
                    2. Vos Coordonnées
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Nom complet <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Jean Dupont" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Courriel <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="jean@exemple.com" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="(450) 123-4567" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="players"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Joueurs <span className="text-red-500">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Joueur</SelectItem>
                            <SelectItem value="2">2 Joueurs</SelectItem>
                            <SelectItem value="3">3 Joueurs</SelectItem>
                            <SelectItem value="4">4 Joueurs</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Remarques</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Demandes spéciales, gaucher/droitier, etc." 
                          className="bg-background/80 border-foreground/20 focus:border-primary min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-full font-bold uppercase tracking-wider text-sm border-foreground/20">
                        <ChevronLeft className="mr-2 w-4 h-4" /> Retour
                    </Button>
                    <Button type="submit" className="flex-[2] h-14 bg-primary text-white hover:bg-primary/90 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg transition-all hover:scale-[1.01]">
                        Confirmer la réservation
                    </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>

      {/* Summary Sidebar */}
      <div className="md:col-span-1">
         <div className="sticky top-32 space-y-6">
            <Card className="bg-[#EAE6D9] border-none shadow-lg overflow-hidden">
                <div className="bg-foreground p-4 text-background text-center">
                    <h4 className="font-heading font-bold uppercase tracking-widest text-sm">Votre Réservation</h4>
                </div>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <CalendarIcon className="w-4 h-4 text-primary mt-1" />
                        <div>
                            <span className="text-xs uppercase text-foreground/60 font-bold tracking-wider block">Date</span>
                            <span className="font-bold text-foreground">{watchDate ? format(watchDate, "EEEE d MMMM", { locale: fr }) : "Sélectionner..."}</span>
                        </div>
                    </div>
                    <Separator className="bg-foreground/10" />
                    
                    <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-primary mt-1" />
                        <div>
                            <span className="text-xs uppercase text-foreground/60 font-bold tracking-wider block">Heure & Durée</span>
                            <span className="font-bold text-foreground">{watchTime || "--:--"} ({watchDuration})</span>
                        </div>
                    </div>
                    <Separator className="bg-foreground/10" />

                    <div className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-primary mt-1" />
                        <div>
                            <span className="text-xs uppercase text-foreground/60 font-bold tracking-wider block">Détails</span>
                            <span className="font-bold text-foreground block">Baie {watchBayType === "premium" ? "Premium" : "Standard"}</span>
                            <span className="text-sm text-foreground/70 block">{watchPlayers} Joueur(s)</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-white/50 backdrop-blur p-4 rounded-lg border border-foreground/5 text-xs text-foreground/60 font-sans leading-relaxed">
                <p className="mb-2"><span className="font-bold text-foreground">Politique :</span> Annulation gratuite jusqu'à 24h avant.</p>
                <p>Paiement requis sur place avant le début de la session.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
