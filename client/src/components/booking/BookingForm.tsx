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
import { CalendarIcon, Clock, Users, CheckCircle2, ChevronRight, ChevronLeft, Info, Loader2, Plus, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";

type CartItem = {
  id: string;
  date: Date;
  time: string;
  duration: string;
  bays: string[];
};

const contactFormSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse courriel valide.",
  }),
  phone: z.string().optional(),
  players: z.string({
    required_error: "Le nombre de joueurs est requis.",
  }),
  notes: z.string().optional(),
});

type AvailabilitySlot = { time: string; availableBays: string[] };
type DayAvailability = { slots: AvailabilitySlot[]; fullyBooked: boolean };
type AvailabilityData = Record<string, DayAvailability>;

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function parseDurationToMinutes(duration: string): number {
  const hours = parseFloat(duration.replace('h', ''));
  return hours * 60;
}

function doTimeSlotsOverlap(
  time1: string, duration1: string,
  time2: string, duration2: string
): boolean {
  const start1 = parseTimeToMinutes(time1);
  const end1 = start1 + parseDurationToMinutes(duration1);
  const start2 = parseTimeToMinutes(time2);
  const end2 = start2 + parseDurationToMinutes(duration2);
  
  return start1 < end2 && end1 > start2;
}

async function fetchAvailability(start: Date, end: Date, duration: number): Promise<AvailabilityData> {
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const response = await fetch(`/api/availability?start=${startStr}&end=${endStr}&duration=${duration}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.message);
  return data.availability;
}

async function createBatchBooking(data: {
  items: { date: string; time: string; duration: string; bayType: string }[];
  name: string;
  email: string;
  phone?: string;
  players: number;
  notes?: string;
}) {
  const response = await fetch("/api/book/batch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
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
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("1h");
  const [selectedBays, setSelectedBays] = useState<string[]>([]);

  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      notes: "",
      players: "1"
    },
  });

  const durationHours = parseFloat(selectedDuration?.replace('h', '') || '1');

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
    if (selectedDate && availability) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const dayAvail = availability[dateStr];
      if (dayAvail) {
        const availableTimes = dayAvail.slots.map(s => s.time);
        if (selectedTime && !availableTimes.includes(selectedTime)) {
          setSelectedTime("");
          setSelectedBays([]);
        }
      }
    }
  }, [selectedDate, selectedDuration, availability, selectedTime]);

  useEffect(() => {
    setSelectedBays([]);
  }, [selectedTime, selectedDate]);

  const selectedDateSlots = useMemo(() => {
    if (!selectedDate || !availability) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return availability[dateStr]?.slots || [];
  }, [selectedDate, availability]);

  const availableBaysForSelectedTime = useMemo(() => {
    if (!selectedTime || !selectedDateSlots.length || !selectedDate) return [];
    const slot = selectedDateSlots.find(s => s.time === selectedTime);
    const baseBays = slot?.availableBays || [];
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    
    const cartItemsForSameDate = cart.filter(item => 
      item.date.toISOString().split('T')[0] === selectedDateStr
    );
    
    const baysOccupiedByCart = new Set<string>();
    for (const item of cartItemsForSameDate) {
      if (doTimeSlotsOverlap(selectedTime, selectedDuration, item.time, item.duration)) {
        item.bays.forEach(bay => baysOccupiedByCart.add(bay));
      }
    }
    
    return baseBays.filter(bay => !baysOccupiedByCart.has(bay));
  }, [selectedTime, selectedDateSlots, cart, selectedDate, selectedDuration]);

  const isDateDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    if (!availability) return false;
    const dateStr = date.toISOString().split('T')[0];
    const dayAvail = availability[dateStr];
    return dayAvail?.fullyBooked === true;
  };

  const toggleBaySelection = (bay: string) => {
    setSelectedBays(prev => 
      prev.includes(bay) 
        ? prev.filter(b => b !== bay)
        : [...prev, bay]
    );
  };

  const addToCart = () => {
    if (!selectedDate || !selectedTime || selectedBays.length === 0) return;
    
    const newItem: CartItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: selectedDate,
      time: selectedTime,
      duration: selectedDuration,
      bays: [...selectedBays],
    };
    
    setCart(prev => [...prev, newItem]);
    setSelectedBays([]);
    
    toast({
      title: "Ajouté au panier",
      description: `${selectedBays.length} baie(s) ajoutée(s) pour le ${format(selectedDate, "d MMMM", { locale: fr })} à ${selectedTime}`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const bookingMutation = useMutation({
    mutationFn: createBatchBooking,
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Réservations confirmées",
        description: `${cart.reduce((acc, item) => acc + item.bays.length, 0)} réservation(s) enregistrée(s) avec succès.`,
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

  function onSubmit(values: z.infer<typeof contactFormSchema>) {
    const items = cart.flatMap(cartItem => 
      cartItem.bays.map(bay => ({
        date: cartItem.date.toISOString(),
        time: cartItem.time,
        duration: cartItem.duration,
        bayType: bay,
      }))
    );

    bookingMutation.mutate({
      items,
      name: values.name,
      email: values.email,
      phone: values.phone,
      players: parseInt(values.players, 10),
      notes: values.notes,
    });
  }

  const nextStep = () => {
    if (cart.length === 0) {
      toast({
        title: "Panier vide",
        description: "Veuillez ajouter au moins une réservation au panier.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const prevStep = () => setStep(1);

  const totalReservations = cart.reduce((acc, item) => acc + item.bays.length, 0);

  if (isSubmitted) {
    return (
      <div className="bg-[#EAE6D9] p-8 md:p-12 rounded-lg text-center border border-foreground/10 shadow-lg animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-heading font-bold uppercase mb-4 text-foreground">Réservations Confirmées !</h3>
        <p className="text-foreground/70 font-sans mb-8 text-lg max-w-md mx-auto">
          Vos {totalReservations} réservation(s) ont été enregistrées avec succès. Vous recevrez une confirmation par courriel sous peu.
        </p>
        <div className="bg-background/50 p-6 rounded-lg mb-8 text-left max-w-md mx-auto border border-foreground/5">
          <h4 className="font-bold uppercase text-xs tracking-wider text-foreground/60 mb-4 border-b border-foreground/10 pb-2">Récapitulatif</h4>
          <div className="space-y-3 text-sm font-sans max-h-[300px] overflow-y-auto">
            {cart.map((item, idx) => (
              <div key={item.id} className="pb-3 border-b border-foreground/10 last:border-0">
                <div className="font-medium text-foreground">
                  {format(item.date, "EEEE d MMMM", { locale: fr })}
                </div>
                <div className="text-foreground/60">
                  {item.time} - {item.duration} • Baie(s): {item.bays.join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Button 
          onClick={() => {
            setIsSubmitted(false);
            setStep(1);
            setCart([]);
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
                    1. Sélectionnez vos créneaux
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez réserver plusieurs baies et/ou plusieurs créneaux en les ajoutant au panier.
                  </p>

                  <div className="space-y-2">
                    <label className="uppercase font-bold text-xs tracking-wider text-foreground/80">Durée</label>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="bg-background/80 border-foreground/20 focus:border-primary h-11" data-testid="select-duration">
                        <SelectValue placeholder="Choisir la durée" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1h">1h</SelectItem>
                        <SelectItem value="1.5h">1h30</SelectItem>
                        <SelectItem value="2h">2h</SelectItem>
                        <SelectItem value="2.5h">2h30</SelectItem>
                        <SelectItem value="3h">3h</SelectItem>
                        <SelectItem value="3.5h">3h30</SelectItem>
                        <SelectItem value="4h">4h</SelectItem>
                        <SelectItem value="4.5h">4h30</SelectItem>
                        <SelectItem value="5h">5h</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2 block">Sélectionner une date</label>
                    <div className="border rounded-md p-4 bg-background/50 w-full relative">
                      {isLoadingAvailability && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-md">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
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
                  </div>
                </div>

                {selectedDate && (
                  <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="space-y-2">
                      <label className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2 block">
                        Créneaux disponibles pour le {format(selectedDate, "d MMMM", { locale: fr })}
                        {selectedDateSlots.length === 0 && !isLoadingAvailability && (
                          <span className="text-red-500 ml-2">(Aucun créneau disponible)</span>
                        )}
                      </label>
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
                              variant={selectedTime === slot.time ? "default" : "outline"}
                              className={cn(
                                "h-12 text-sm font-sans transition-all", 
                                selectedTime === slot.time ? "bg-primary text-white border-primary" : "hover:border-primary hover:text-primary"
                              )}
                              onClick={() => setSelectedTime(slot.time)}
                              data-testid={`timeslot-${slot.time}`}
                            >
                              <span className="font-bold">{slot.time}</span>
                            </Button>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-4 text-muted-foreground">
                            Aucun créneau disponible pour cette date et durée.
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTime && availableBaysForSelectedTime.length > 0 && (
                      <div className="space-y-3 animate-in fade-in duration-300">
                        <label className="uppercase font-bold text-xs tracking-wider text-foreground/80 mb-2 block">
                          Choisir une ou plusieurs baies
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {["1", "2", "3", "4"].map((bay) => {
                            const isAvailable = availableBaysForSelectedTime.includes(bay);
                            const isSelected = selectedBays.includes(bay);
                            return (
                              <Button
                                key={bay}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "h-16 text-lg font-bold transition-all flex flex-col items-center justify-center gap-1", 
                                  isSelected ? "bg-primary text-white border-primary" : "",
                                  !isAvailable ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:text-primary"
                                )}
                                onClick={() => isAvailable && toggleBaySelection(bay)}
                                disabled={!isAvailable}
                                data-testid={`bay-${bay}`}
                              >
                                <span className="flex items-center gap-2">
                                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                  Baie {bay}
                                </span>
                                <span className={cn(
                                  "text-[10px] font-normal",
                                  isSelected ? "text-white/80" : "text-muted-foreground"
                                )}>
                                  {isAvailable ? "Disponible" : "Réservée"}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                        
                        {selectedBays.length > 0 && (
                          <Button 
                            type="button"
                            onClick={addToCart}
                            className="w-full h-12 mt-4 bg-foreground text-background hover:bg-primary rounded-full font-bold uppercase tracking-wider text-sm"
                            data-testid="button-add-to-cart"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter {selectedBays.length} baie(s) au panier
                          </Button>
                        )}
                      </div>
                    )}

                    {selectedTime && availableBaysForSelectedTime.length === 0 && (
                      <div className="text-center py-4 text-amber-600 bg-amber-50 rounded-lg">
                        Toutes les baies sont déjà dans votre panier pour ce créneau.
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="button" 
                  onClick={nextStep} 
                  className="w-full h-14 rounded-full font-bold uppercase tracking-wider text-sm mt-4" 
                  disabled={cart.length === 0}
                  data-testid="button-next"
                >
                  Suivant ({totalReservations} réservation{totalReservations > 1 ? 's' : ''}) <ChevronRight className="ml-2 w-4 h-4" />
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
                          <Input placeholder="(450) 561-3815" {...field} className="bg-background/80 border-foreground/20 focus:border-primary h-12" data-testid="input-phone" />
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
                        <FormLabel className="uppercase font-bold text-xs tracking-wider text-foreground/80">Joueurs par baie <span className="text-red-500">*</span></FormLabel>
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

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
                      `Confirmer ${totalReservations} réservation${totalReservations > 1 ? 's' : ''}`
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
            <div className="bg-foreground p-4 text-background flex items-center justify-between">
              <h4 className="font-heading font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Votre Panier
              </h4>
              {cart.length > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded-full">
                  {totalReservations}
                </span>
              )}
            </div>
            <CardContent className="p-4 space-y-3 max-h-[300px] overflow-y-auto">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-foreground/50">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Votre panier est vide</p>
                  <p className="text-xs mt-1">Sélectionnez des créneaux et baies</p>
                </div>
              ) : (
                cart.map((item) => {
                  const itemDuration = parseFloat(item.duration.replace('h', ''));
                  const itemPrice = Math.round(itemDuration * 25 * item.bays.length);
                  return (
                    <div key={item.id} className="bg-background/50 rounded-lg p-3 relative group">
                      <button 
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`remove-cart-${item.id}`}
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </button>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-4 h-4 text-primary mt-1 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-foreground text-sm block truncate">
                              {format(item.date, "EEE d MMM", { locale: fr })}
                            </span>
                            <span className="font-bold text-primary text-sm">{itemPrice}$</span>
                          </div>
                          <span className="text-xs text-foreground/60 block">
                            {item.time} • {item.duration}
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.bays.map(bay => (
                              <span key={bay} className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded">
                                Baie {bay}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
            {cart.length > 0 && (
              <div className="px-4 pb-4">
                <div className="border-t border-foreground/10 pt-3 flex justify-between items-center">
                  <span className="text-sm font-bold uppercase tracking-wider text-foreground/70">Total</span>
                  <span className="text-xl font-bold text-primary">
                    {cart.reduce((total, item) => {
                      const duration = parseFloat(item.duration.replace('h', ''));
                      return total + Math.round(duration * 30 * item.bays.length);
                    }, 0)}$
                  </span>
                </div>
              </div>
            )}
          </Card>

          <div className="bg-white/50 backdrop-blur p-4 rounded-lg border border-foreground/5 text-xs text-foreground/60 font-sans leading-relaxed space-y-2">
            <p><span className="font-bold text-primary text-sm">25$/h (1h) • 28$/h (2-4h)</span> <span className="text-foreground/50">par baie</span></p>
            <div className="border-t border-foreground/10 pt-2 mt-2">
              <p><span className="font-bold text-foreground">Ouvert:</span> 8h - 22h</p>
              <p><span className="font-bold text-foreground">Baies:</span> 4 simulateurs</p>
            </div>
            <p className="text-foreground/50 pt-1">Paiement sur place</p>
          </div>
        </div>
      </div>
    </div>
  );
}
