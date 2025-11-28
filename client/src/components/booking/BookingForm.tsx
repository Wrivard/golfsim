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
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Clock, Users, CheckCircle2, ChevronRight, ChevronLeft, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";

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

type AvailabilitySlot = { time: string; remainingBays: number };
type DayAvailability = { slots: AvailabilitySlot[]; fullyBooked: boolean };
type AvailabilityData = Record<string, DayAvailability>;

async function fetchAvailability(start: Date, end: Date, duration: number): Promise<AvailabilityData> {
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const response = await fetch(`/api/availability?start=${startStr}&end=${endStr}&duration=${duration}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.message);
  return data.availability;
}

async function createBooking(data: z.infer<typeof formSchema>) {
  const response = await fetch("/api/book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data,
      date: data.date.toISOString(),
      players: parseInt(data.players, 10),
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Erreur lors de la réservation");
  }

  return result;
}

export default function BookingForm() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState(1);
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const watchDate = form.watch("date");
  const watchTime = form.watch("time");
  const watchBayType = form.watch("bayType");
  const watchDuration = form.watch("duration");
  const watchPlayers = form.watch("players");

  const durationHours = parseInt(watchDuration?.replace('h', '') || '4', 10);

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth]);
  const monthEnd = useMemo(() => endOfMonth(addMonths(currentMonth, 1)), [currentMonth]);

  const { data: availability, isLoading: isLoadingAvailability, refetch } = useQuery({
    queryKey: ['availability', monthStart.toISOString(), monthEnd.toISOString(), durationHours],
    queryFn: () => fetchAvailability(monthStart, monthEnd, durationHours),
    staleTime: 30000,
  });

  useEffect(() => {
    refetch();
  }, [durationHours, refetch]);

  useEffect(() => {
    if (watchDate && availability) {
      const dateStr = watchDate.toISOString().split('T')[0];
      const dayAvail = availability[dateStr];
      if (dayAvail) {
        const availableTimes = dayAvail.slots.map(s => s.time);
        if (watchTime && !availableTimes.includes(watchTime)) {
          form.setValue("time", "");
        }
      }
    }
  }, [watchDate, watchDuration, availability, watchTime, form]);

  const selectedDateSlots = useMemo(() => {
    if (!watchDate || !availability) return [];
    const dateStr = watchDate.toISOString().split('T')[0];
    return availability[dateStr]?.slots || [];
  }, [watchDate, availability]);

  const isDateDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    if (!availability) return false;
    const dateStr = date.toISOString().split('T')[0];
    const dayAvail = availability[dateStr];
    return dayAvail?.fullyBooked === true;
  };

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Réservation confirmée",
        description: "Votre réservation a été enregistrée et ajoutée au calendrier.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    bookingMutation.mutate(values);
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
        <h3 className="text-3xl font-heading font-bold uppercase mb-4 text-foreground">Réservation Confirmée !</h3>
        <p className="text-foreground/70 font-sans mb-8 text-lg max-w-md mx-auto">
          Votre réservation a été enregistrée avec succès. Vous recevrez une confirmation par courriel sous peu.
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
      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white/50 backdrop-blur-sm p-6 md:p-8 rounded-xl border border-foreground/5 shadow-xl">
            
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

                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Durée</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12" data-testid="select-duration">
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
                                <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12" data-testid="select-baytype">
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
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2">Sélectionner une date</FormLabel>
                        <div className="border rounded-md p-4 bg-background/50 w-full relative">
                            {isLoadingAvailability && (
                              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-md">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                              </div>
                            )}
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            onMonthChange={setCurrentMonth}
                            disabled={isDateDisabled}
                            initialFocus
                            className="pointer-events-auto w-full"
                            classNames={{
                                head_cell: "text-muted-foreground font-normal text-[0.8rem] uppercase tracking-wider w-full",
                                cell: "h-9 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 mx-auto flex items-center justify-center rounded-md",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                today: "bg-[#1B1A18] text-[#F7F3E8] rounded-md",
                                day_disabled: "text-muted-foreground/40 opacity-50",
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
                                <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2">
                                  Disponibilités pour le {format(watchDate, "d MMMM", { locale: fr })}
                                  {selectedDateSlots.length === 0 && !isLoadingAvailability && (
                                    <span className="text-red-500 ml-2">(Aucun créneau disponible)</span>
                                  )}
                                </FormLabel>
                                <FormControl>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {isLoadingAvailability ? (
                                          <div className="col-span-full flex items-center justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                                            <span className="text-sm text-muted-foreground">Chargement...</span>
                                          </div>
                                        ) : selectedDateSlots.length > 0 ? (
                                          selectedDateSlots.map((slot) => (
                                            <Button
                                                key={slot.time}
                                                type="button"
                                                variant={field.value === slot.time ? "default" : "outline"}
                                                className={cn(
                                                    "h-12 text-sm font-sans transition-all flex flex-col items-center justify-center gap-0.5", 
                                                    field.value === slot.time ? "bg-primary text-white border-primary" : "hover:border-primary hover:text-primary"
                                                )}
                                                onClick={() => field.onChange(slot.time)}
                                                data-testid={`timeslot-${slot.time}`}
                                            >
                                                <span>{slot.time}</span>
                                                <span className={cn(
                                                  "text-[10px]",
                                                  field.value === slot.time ? "text-white/80" : "text-muted-foreground"
                                                )}>
                                                  {slot.remainingBays} baie{slot.remainingBays > 1 ? 's' : ''} dispo
                                                </span>
                                            </Button>
                                          ))
                                        ) : (
                                          <div className="col-span-full text-center py-4 text-muted-foreground">
                                            Aucun créneau disponible pour cette date et durée.
                                          </div>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                )}

                <Button 
                  type="button" 
                  onClick={nextStep} 
                  className="w-full h-14 rounded-full font-bold uppercase tracking-wider text-sm mt-4" 
                  disabled={!watchDate || !watchTime}
                  data-testid="button-next"
                >
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
                          <Input placeholder="Jean Dupont" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" data-testid="input-name" />
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
                          <Input placeholder="jean@exemple.com" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" data-testid="input-email" />
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
                          <Input placeholder="(450) 123-4567" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" data-testid="input-phone" />
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
                            <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-12" data-testid="select-players">
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
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-14 rounded-full font-bold uppercase tracking-wider text-sm border-foreground/20" data-testid="button-back">
                        <ChevronLeft className="mr-2 w-4 h-4" /> Retour
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-[2] h-14 bg-primary text-white hover:bg-primary/90 rounded-full font-bold uppercase tracking-wider text-sm shadow-lg transition-all hover:scale-[1.01]"
                      disabled={bookingMutation.isPending}
                      data-testid="button-submit"
                    >
                        {bookingMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Réservation en cours...
                          </>
                        ) : (
                          "Confirmer la réservation"
                        )}
                    </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>

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
                <p className="mb-2"><span className="font-bold text-foreground">Heures d'ouverture:</span> 8h à 22h</p>
                <p className="mb-2"><span className="font-bold text-foreground">Capacité:</span> 5 baies disponibles</p>
                <p className="mb-2"><span className="font-bold text-foreground">Politique :</span> Annulation gratuite jusqu'à 24h avant.</p>
                <p>Paiement requis sur place avant le début de la session.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
