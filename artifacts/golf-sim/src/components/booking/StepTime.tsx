import { useMemo, useEffect, useRef, useState } from "react";
import { useBookingStore } from "@/lib/booking-store";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeSlot, DaySchedule } from "@/lib/booking-types";
import { useQuery } from "@tanstack/react-query";

interface OptimizedResponse {
  ok: boolean;
  slots: TimeSlot[];
  bookings: Array<{
    id: string;
    simulatorId: string;
    startTime: string;
    endTime: string;
    customerName: string;
  }>;
  schedule?: DaySchedule;
  meta: {
    date: string;
    durationMinutes: number;
    totalSlots: number;
    bestScore: number;
  };
}

async function fetchOptimizedSlots(dateStr: string, durationMinutes: number): Promise<OptimizedResponse> {
  const response = await fetch(`/api/availability/optimized?date=${dateStr}&duration=${durationMinutes}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.message);
  return data;
}

interface StepTimeProps {
  onHoverSlot?: (slot: TimeSlot | null) => void;
  onSlotsReady?: (slots: TimeSlot[]) => void;
  onScheduleReady?: (schedule: DaySchedule | null) => void;
}

export function StepTime({ onHoverSlot, onSlotsReady, onScheduleReady }: StepTimeProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const { 
    selectedDate, 
    selectedDuration, 
    setStep,
    setDate,
    setTimeSlot,
    setBookings,
    setIsLoadingBookings
  } = useBookingStore();

  const dateStr = useMemo(() => {
    return format(selectedDate, "yyyy-MM-dd");
  }, [selectedDate]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['optimized-slots', dateStr, selectedDuration],
    queryFn: () => fetchOptimizedSlots(dateStr, selectedDuration || 60),
    staleTime: 15000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    enabled: !!selectedDuration,
  });

  useEffect(() => {
    if (isError) {
      setBookings([]);
      onScheduleReady?.(null);
    } else if (data) {
      setBookings(data.bookings);
      onScheduleReady?.(data.schedule ?? null);
    }
    setIsLoadingBookings(isLoading);
  }, [data, isLoading, isError, setBookings, setIsLoadingBookings, onScheduleReady]);

  const slots = useMemo(() => data?.slots ?? [], [data]);

  const prevSlotsRef = useRef(slots);
  useEffect(() => {
    if (slots !== prevSlotsRef.current) {
      prevSlotsRef.current = slots;
      onSlotsReady?.(slots);
    }
  }, [slots, onSlotsReady]);

  const handleTimeSelect = (slot: TimeSlot) => {
    setTimeSlot(slot.time, slot.assignedBayId);
    setStep(3);
  };

  const sortedSlots = useMemo(() => {
    const best = slots.filter(s => s.label).sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
    const rest = slots.filter(s => !s.label).sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
    return [...best, ...rest];
  }, [slots]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <Button 
          variant="ghost" 
          onClick={() => setStep(1)}
          className="text-muted-foreground hover:text-foreground -ml-2 sm:-ml-4 shrink-0"
          data-testid="button-back-duration"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>

        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-auto sm:w-[240px] justify-start text-left font-normal border-foreground/20 bg-background/80 text-xs sm:text-sm",
                !selectedDate && "text-muted-foreground"
              )}
              data-testid="button-date-picker"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
              {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[min(350px,calc(100vw-24px))] max-h-[var(--radix-popover-content-available-height)] overflow-y-auto p-0 rounded-2xl border-border/50 shadow-lg"
            align="end" sideOffset={8} collisionPadding={12}
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                setDate(date);
                setCalendarOpen(false);
              }}
              initialFocus
              locale={fr}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="p-3 w-full [--cell-size:2.25rem] sm:[--cell-size:2.75rem] rounded-2xl"
              classNames={{
                today: "ring-2 ring-primary/30 rounded-lg",
                day: "group/day relative aspect-square h-full w-full select-none p-0 text-center",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">
          Session de <strong>{selectedDuration ? selectedDuration / 60 : 0}h</strong> — {format(selectedDate, "EEEE d MMMM", { locale: fr })}
        </p>
      </div>

      <div className="min-h-[250px]">
        {isError ? (
          <div role="alert" className="p-6 text-center border border-amber-700/30 rounded-xl">
            <p>Disponibilités temporairement indisponibles. Le calendrier doit être connecté et synchronisé avant de réserver.</p>
            <Button type="button" variant="outline" className="mt-4" onClick={() => refetch()}>Réessayer</Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Chargement des disponibilités...</p>
          </div>
        ) : sortedSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-foreground/10 rounded-xl bg-background/50">
            <p className="text-lg font-medium text-muted-foreground mb-2">Aucun créneau disponible</p>
            <p className="text-sm text-muted-foreground/60">Essayez une autre date ou durée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedSlots.map((slot) => (
              <button
                key={`${slot.time}-${slot.assignedBayId}`} 
                onClick={() => handleTimeSelect(slot)}
                onMouseEnter={() => onHoverSlot?.(slot)}
                onMouseLeave={() => onHoverSlot?.(null)}
                className={cn(
                  "relative group flex flex-col items-center justify-center py-4 px-2 rounded-lg border transition-all duration-200",
                  "bg-background border-foreground/10 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 text-foreground"
                )}
                data-testid={`timeslot-${slot.time.slice(11, 16)}`}
              >
                {slot.label && (
                  <span className="absolute -top-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide bg-primary text-white">
                    {slot.label}
                  </span>
                )}
                <span className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {slot.time.slice(11, 16)}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Baie {slot.assignedBayId}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-muted-foreground mt-4">
        La baie la plus optimale est attribuée automatiquement pour chaque créneau.
      </div>
    </div>
  );
}
