import { useBookingStore } from "@/lib/booking-store";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Calendar, Clock, User, Trophy, ArrowRight, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const PRICE_PER_HOUR = 25;

async function createBooking(data: {
  name: string;
  email: string;
  phone?: string;
  date: string;
  time: string;
  duration: string;
  bayType: string;
  players: number;
  notes?: string;
}) {
  const response = await fetch("/api/book", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "Erreur lors de la réservation");
  }
  return result;
}

export function StepConfirmation() {
  const { 
    selectedTimeSlot, 
    selectedDuration, 
    assignedBayId,
    simulators,
    userDetails, 
    reset,
    isConfirmed,
    setIsConfirmed,
    setStep,
    setIsSubmitting,
  } = useBookingStore();

  const { toast } = useToast();

  const durationHours = selectedDuration ? selectedDuration / 60 : 0;
  const durationString = durationHours % 1 === 0 ? `${durationHours}h` : `${durationHours}h`;
  const price = durationHours * PRICE_PER_HOUR;

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setIsConfirmed(true);
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (!selectedTimeSlot || !selectedDuration || !userDetails || !assignedBayId) return;
    
    setIsSubmitting(true);
    
    const dateStr = selectedTimeSlot.split('T')[0];
    const timeStr = selectedTimeSlot.slice(11, 16);

    bookingMutation.mutate({
      name: userDetails.name,
      email: userDetails.email,
      phone: userDetails.phone,
      date: dateStr,
      time: timeStr,
      duration: durationString,
      bayType: assignedBayId,
      players: userDetails.players,
      notes: userDetails.notes,
    });
  };

  const handleReset = () => {
    reset();
  };

  if (isConfirmed) {
    return (
      <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-3xl font-heading font-bold text-foreground mb-4 uppercase">Réservation Confirmée !</h2>
        <p className="text-muted-foreground max-w-sm mx-auto mb-8">
          Un courriel de confirmation a été envoyé à <strong>{userDetails?.email}</strong>. Préparez-vous à jouer !
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          Le paiement s'effectue sur place.
        </p>
        <Button onClick={handleReset} size="lg" className="min-w-[200px] rounded-full font-bold uppercase tracking-wider" data-testid="button-new-booking">
          Réserver une autre session
        </Button>
      </div>
    );
  }

  const startTimeStr = selectedTimeSlot ? selectedTimeSlot.slice(11, 16) : null;
  const endTimeStr = selectedTimeSlot && selectedDuration ? (() => {
    const [h, m] = selectedTimeSlot.slice(11, 16).split(':').map(Number);
    const totalMin = h * 60 + m + selectedDuration;
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  })() : null;
    
  const bayName = simulators.find(s => s.id === assignedBayId)?.name || `Baie ${assignedBayId}`;

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="bg-[#EAE6D9]/30 rounded-xl p-6 border border-foreground/10 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</p>
            <p className="text-base font-semibold text-foreground">
              {selectedTimeSlot && (() => {
                const [y, mo, d] = selectedTimeSlot.split('T')[0].split('-').map(Number);
                return format(new Date(y, mo - 1, d), "EEEE d MMMM yyyy", { locale: fr });
              })()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Heure</p>
            <p className="text-base font-semibold text-foreground">
              {startTimeStr} — {endTimeStr}
            </p>
            <p className="text-sm text-primary font-medium">
              Session de {durationHours}h • {price}$
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Golfeur</p>
            <p className="text-base font-semibold text-foreground">{userDetails?.name}</p>
            <p className="text-sm text-muted-foreground">{userDetails?.email}</p>
            {userDetails?.phone && <p className="text-sm text-muted-foreground">{userDetails?.phone}</p>}
            <p className="text-sm text-muted-foreground">{userDetails?.players} Joueur{(userDetails?.players || 0) > 1 ? 's' : ''}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-4 pt-4 border-t border-foreground/10">
           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
           <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Simulateur</p>
            <p className="text-base font-semibold text-foreground">{bayName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Attribué automatiquement pour la meilleure disponibilité</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          className="w-1/3 border-foreground/20"
          onClick={() => setStep(3)}
          disabled={bookingMutation.isPending}
          data-testid="button-back-details"
        >
          Retour
        </Button>
        <Button 
          size="lg" 
          className="w-2/3 bg-primary hover:bg-primary/90 text-lg font-bold uppercase tracking-wider shadow-lg shadow-primary/20 rounded-full"
          onClick={handleConfirm}
          disabled={bookingMutation.isPending}
          data-testid="button-confirm"
        >
          {bookingMutation.isPending ? (
            <>
              <Loader2 className="mr-2 w-5 h-5 animate-spin" />
              Réservation...
            </>
          ) : (
            <>
              Confirmer <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Le paiement s'effectue sur place. Annulation gratuite 24h à l'avance.
      </p>
    </div>
  );
}
