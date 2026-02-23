import { useMemo, useEffect, useState } from "react";
import { useBookingStore } from "@/lib/booking-store";
import { getOptimizedStartTimes } from "@/lib/booking-logic";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, Loader2, Bug, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeSlot, BayEvaluation } from "@/lib/booking-types";
import { Booking } from "@/lib/booking-types";
import { useQuery } from "@tanstack/react-query";

async function fetchBookingsForDate(dateStr: string): Promise<Booking[]> {
  const response = await fetch(`/api/availability/bookings?date=${dateStr}`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.message);
  return data.bookings;
}

function ScoreBar({ value, max = 10, color = "bg-primary" }: { value: number; max?: number; color?: string }) {
  const pct = Math.max(0, Math.min(100, ((value + max) / (2 * max)) * 100));
  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DebugSlotPanel({ slot, onClose }: { slot: TimeSlot; onClose: () => void }) {
  const timeLabel = format(new Date(slot.time), "HH:mm");
  
  return (
    <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs space-y-3 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between">
        <span className="text-green-300 font-bold text-sm">
          DEBUG — Créneau {timeLabel} → Baie {slot.assignedBayId}
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {slot.breakdown && (
        <div className="border border-green-800 rounded p-3 space-y-1">
          <div className="text-green-300 font-bold mb-2">Score Total: {slot.score}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span className="text-gray-400">base:</span>
            <span>{slot.breakdown.base}</span>
            <span className="text-gray-400">gapAfter:</span>
            <span className={slot.breakdown.gapAfter > 0 ? "text-green-300" : ""}>{slot.breakdown.gapAfter > 0 ? "+" : ""}{slot.breakdown.gapAfter}</span>
            <span className="text-gray-400">gapBefore:</span>
            <span className={slot.breakdown.gapBefore > 0 ? "text-green-300" : ""}>{slot.breakdown.gapBefore > 0 ? "+" : ""}{slot.breakdown.gapBefore}</span>
            <span className="text-gray-400">bayClustering:</span>
            <span className={slot.breakdown.bayClustering > 0 ? "text-blue-400" : ""}>{slot.breakdown.bayClustering > 0 ? "+" : ""}{slot.breakdown.bayClustering}</span>
            <span className="text-gray-400">peakHour:</span>
            <span className={slot.breakdown.peakHour > 0 ? "text-yellow-400" : ""}>{slot.breakdown.peakHour > 0 ? "+" : ""}{slot.breakdown.peakHour}</span>
            <span className="text-gray-400">inefficientGap:</span>
            <span className={slot.breakdown.inefficientGap < 0 ? "text-red-400" : ""}>{slot.breakdown.inefficientGap}</span>
          </div>
        </div>
      )}

      {slot.allBays && slot.allBays.length > 0 && (
        <div className="border border-green-800 rounded p-3">
          <div className="text-green-300 font-bold mb-2">Évaluation par baie:</div>
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="pr-2">Baie</th>
                <th className="pr-2">Valide</th>
                <th className="pr-2">Score</th>
                <th className="pr-2">Gap↑</th>
                <th className="pr-2">Gap↓</th>
                <th>Raison</th>
              </tr>
            </thead>
            <tbody>
              {slot.allBays.map((bay: BayEvaluation) => (
                <tr key={bay.bayId} className={cn(
                  bay.bayId === slot.assignedBayId && "text-green-300 font-bold",
                  !bay.isValid && "text-red-400/70"
                )}>
                  <td className="pr-2">{bay.bayName}</td>
                  <td className="pr-2">{bay.isValid ? "✓" : "✗"}</td>
                  <td className="pr-2">{bay.isValid ? bay.score : "—"}</td>
                  <td className="pr-2">{bay.debug?.gapBefore ?? "—"}{bay.debug?.gapBefore !== undefined && bay.debug.gapBefore !== Infinity ? "m" : ""}</td>
                  <td className="pr-2">{bay.debug?.gapAfter ?? "—"}{bay.debug?.gapAfter !== undefined && bay.debug.gapAfter !== Infinity ? "m" : ""}</td>
                  <td className="text-gray-500 truncate max-w-[120px]">{bay.rejectionReason || (bay.bayId === slot.assignedBayId ? "← sélectionné" : "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DebugOverview({ slots, bookings }: { slots: TimeSlot[]; bookings: Booking[] }) {
  const sortedByTime = useMemo(() => 
    [...slots].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()),
    [slots]
  );
  
  return (
    <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs space-y-4 animate-in fade-in duration-300">
      <div className="text-green-300 font-bold text-sm border-b border-green-800 pb-2">
        DEBUG PANEL — Algorithme d'optimisation
      </div>

      <div className="border border-green-800 rounded p-3">
        <div className="text-green-300 font-bold mb-2">
          Réservations existantes ({bookings.length}):
        </div>
        {bookings.length === 0 ? (
          <span className="text-gray-500">Aucune réservation pour cette journée</span>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="pr-3">Baie</th>
                <th className="pr-3">Début</th>
                <th className="pr-3">Fin</th>
                <th>Client</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td className="pr-3 text-blue-400">Baie {b.simulatorId}</td>
                  <td className="pr-3">{b.startTime.includes('T') ? b.startTime.split('T')[1].substring(0, 5) : b.startTime}</td>
                  <td className="pr-3">{b.endTime.includes('T') ? b.endTime.split('T')[1].substring(0, 5) : b.endTime}</td>
                  <td className="text-gray-500">{b.customerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="border border-green-800 rounded p-3">
        <div className="text-green-300 font-bold mb-2">
          Créneaux générés ({slots.length}) — triés par heure:
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-gray-500 text-left">
                <th className="pr-2">Heure</th>
                <th className="pr-2">Baie</th>
                <th className="pr-2">Score</th>
                <th className="pr-2">Gap↑</th>
                <th className="pr-2">Gap↓</th>
                <th className="pr-2">Cluster</th>
                <th className="pr-2">Peak</th>
                <th>Ineff.</th>
              </tr>
            </thead>
            <tbody>
              {sortedByTime.map((slot, i) => (
                <tr key={i} className={cn(
                  slot.score >= 5 && "text-green-300",
                  slot.score >= 3 && slot.score < 5 && "text-yellow-400",
                  slot.score < 3 && "text-gray-400"
                )}>
                  <td className="pr-2 font-bold">{format(new Date(slot.time), "HH:mm")}</td>
                  <td className="pr-2">B{slot.assignedBayId}</td>
                  <td className="pr-2 font-bold">{slot.score}</td>
                  <td className="pr-2">{slot.breakdown?.gapBefore ?? "—"}</td>
                  <td className="pr-2">{slot.breakdown?.gapAfter ?? "—"}</td>
                  <td className="pr-2">{slot.breakdown?.bayClustering ?? "—"}</td>
                  <td className="pr-2">{slot.breakdown?.peakHour ?? "—"}</td>
                  <td>{slot.breakdown?.inefficientGap ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-gray-600 text-[10px]">
        Scoring: gapAfter=0 → +5 | gapBefore=0 → +3 | cluster → +2 | peak(17-21h) → +1 | gap 30-60m → -3
      </div>
    </div>
  );
}

export function StepTime() {
  const { 
    selectedDate, 
    selectedDuration, 
    simulators,
    setStep,
    setDate,
    setTimeSlot,
    setBookings,
    bookings,
    isLoadingBookings,
    setIsLoadingBookings
  } = useBookingStore();

  const [debugMode, setDebugMode] = useState(false);
  const [debugSlot, setDebugSlot] = useState<TimeSlot | null>(null);

  const dateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  const { data: fetchedBookings, isLoading } = useQuery({
    queryKey: ['day-bookings', dateStr],
    queryFn: () => fetchBookingsForDate(dateStr),
    staleTime: 15000,
  });

  useEffect(() => {
    if (fetchedBookings) {
      setBookings(fetchedBookings);
    }
    setIsLoadingBookings(isLoading);
  }, [fetchedBookings, isLoading, setBookings, setIsLoadingBookings]);

  const optimizedSlots = useMemo(() => {
    if (!selectedDuration) return [];
    return getOptimizedStartTimes(selectedDate, selectedDuration, bookings, simulators);
  }, [selectedDate, selectedDuration, bookings, simulators]);

  const handleTimeSelect = (slot: TimeSlot) => {
    if (debugMode) {
      setDebugSlot(debugSlot?.time === slot.time ? null : slot);
      return;
    }
    setTimeSlot(slot.time, slot.assignedBayId);
    setStep(3);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => setStep(1)}
          className="text-muted-foreground hover:text-foreground -ml-4"
          data-testid="button-back-duration"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant={debugMode ? "default" : "ghost"}
            size="sm"
            onClick={() => { setDebugMode(!debugMode); setDebugSlot(null); }}
            className={cn(
              "text-xs gap-1.5",
              debugMode 
                ? "bg-gray-900 text-green-400 hover:bg-gray-800 border border-green-700" 
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="button-toggle-debug"
          >
            <Bug className="w-3.5 h-3.5" />
            Debug
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal border-foreground/20 bg-background/80",
                  !selectedDate && "text-muted-foreground"
                )}
                data-testid="button-date-picker"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setDate(date)}
                initialFocus
                locale={fr}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="text-center mb-2">
        <p className="text-sm text-muted-foreground">
          Session de <strong>{selectedDuration ? selectedDuration / 60 : 0}h</strong> — {format(selectedDate, "EEEE d MMMM", { locale: fr })}
        </p>
        {debugMode && (
          <p className="text-[10px] text-green-600 font-mono mt-1">
            MODE DEBUG ACTIF — Cliquez un créneau pour voir le détail du scoring
          </p>
        )}
      </div>

      <div className="min-h-[250px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Chargement des disponibilités...</p>
          </div>
        ) : optimizedSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed border-foreground/10 rounded-xl bg-background/50">
            <p className="text-lg font-medium text-muted-foreground mb-2">Aucun créneau disponible</p>
            <p className="text-sm text-muted-foreground/60">Essayez une autre date ou durée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {optimizedSlots.map((slot) => (
              <button
                key={`${slot.time}-${slot.assignedBayId}`} 
                onClick={() => handleTimeSelect(slot)}
                className={cn(
                  "relative group flex flex-col items-center justify-center py-4 px-2 rounded-lg border transition-all duration-200",
                  debugMode && debugSlot?.time === slot.time
                    ? "bg-gray-900 border-green-500 text-green-400 ring-2 ring-green-500/30"
                    : debugMode
                      ? "bg-background border-foreground/10 hover:border-green-500/50 hover:bg-gray-900/5 text-foreground"
                      : "bg-background border-foreground/10 hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5 text-foreground"
                )}
                data-testid={`timeslot-${format(new Date(slot.time), "HH:mm")}`}
              >
                {slot.label && !debugMode && (
                  <span className="absolute -top-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wide bg-primary text-white">
                    {slot.label}
                  </span>
                )}
                {debugMode && (
                  <span className={cn(
                    "absolute -top-2.5 text-[10px] font-bold font-mono px-2 py-0.5 rounded-full shadow-sm",
                    slot.score >= 5 ? "bg-green-600 text-white" :
                    slot.score >= 3 ? "bg-yellow-600 text-white" :
                    "bg-gray-600 text-white"
                  )}>
                    S:{slot.score}
                  </span>
                )}
                <span className={cn(
                  "text-lg font-semibold transition-colors",
                  debugMode ? "group-hover:text-green-500" : "group-hover:text-primary"
                )}>
                  {format(new Date(slot.time), "HH:mm")}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Baie {slot.assignedBayId}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {debugMode && debugSlot && (
        <DebugSlotPanel slot={debugSlot} onClose={() => setDebugSlot(null)} />
      )}

      {debugMode && !isLoading && (
        <DebugOverview slots={optimizedSlots} bookings={bookings} />
      )}
      
      {!debugMode && (
        <div className="text-center text-xs text-muted-foreground mt-4">
          La baie la plus optimale est attribuée automatiquement pour chaque créneau.
        </div>
      )}
    </div>
  );
}
